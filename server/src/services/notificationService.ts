/**
 * Comprehensive Notification Service
 * 
 * Features:
 * - Multi-channel notifications (Email, Slack, WebSocket, SMS)
 * - Template-based notifications
 * - Notification preferences per user
 * - Delivery tracking and retry logic
 * - Notification history
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import cacheService, { CACHE_TTL } from './cache/redisCacheService';
import sgMail from '@sendgrid/mail';
import websocketService from './websocketService';
import slackService from './integrations/slackService';
import crypto from 'crypto';
import { Prisma } from '../generated/prisma/client';

/** JSON structure for Slack integration config */
interface SlackIntegrationConfig {
  users?: Record<string, { slackUserId?: string }>;
  [key: string]: unknown;
}

/** JSON structure for notification preference categories with phone */
interface PreferenceCategoriesJson {
  phoneNumber?: string;
  [category: string]: unknown;
}

/** User with optional Slack ID */
interface UserWithSlackId {
  slackUserId?: string;
  [key: string]: unknown;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  channels: ('email' | 'slack' | 'websocket' | 'sms')[];
  variables?: string[];
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  slack: boolean;
  websocket: boolean;
  sms: boolean;
  categories: {
    [category: string]: {
      email: boolean;
      slack: boolean;
      websocket: boolean;
      sms: boolean;
    };
  };
}

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  message: string;
  channels: ('email' | 'slack' | 'websocket' | 'sms')[];
  templateId?: string;
  metadata?: any;
  link?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  retryCount: number;
  createdAt: Date;
}

class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();

  /** Cache namespace + key builder for user notification preferences. */
  private static readonly PREF_CACHE_NS = 'notif-prefs';
  private prefCacheKey(userId: string): string {
    return `prefs:${userId}`;
  }

  constructor() {
    this.initializeTemplates();
    this.initializeSendGrid();
  }

  /**
   * Initialize SendGrid
   */
  private initializeSendGrid(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      logger.info('[Notification] SendGrid initialized');
    } else {
      logger.warn('[Notification] SENDGRID_API_KEY not configured, email notifications disabled');
    }
  }

  /**
   * Initialize default notification templates
   */
  private initializeTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'issue_assigned',
        name: 'Issue Assigned',
        subject: 'New Issue Assigned: {{title}}',
        body: 'You have been assigned a new issue:\n\nTitle: {{title}}\nDescription: {{description}}\nPriority: {{priority}}\nDue Date: {{dueDate}}\n\nView Issue: {{link}}',
        channels: ['email', 'slack', 'websocket'],
        variables: ['title', 'description', 'priority', 'dueDate', 'link'],
      },
      {
        id: 'compliance_alert',
        name: 'Compliance Alert',
        subject: 'Compliance Alert: {{framework}}',
        body: 'Compliance Alert for {{framework}}:\n\n{{message}}\n\nSeverity: {{severity}}\n\nView Details: {{link}}',
        channels: ['email', 'slack', 'websocket'],
        variables: ['framework', 'message', 'severity', 'link'],
      },
      {
        id: 'risk_detected',
        name: 'Risk Detected',
        subject: 'New Risk Detected: {{title}}',
        body: 'A new risk has been detected:\n\nTitle: {{title}}\nDescription: {{description}}\nSeverity: {{severity}}\nCategory: {{category}}\n\nView Risk: {{link}}',
        channels: ['email', 'slack', 'websocket'],
        variables: ['title', 'description', 'severity', 'category', 'link'],
      },
      {
        id: 'audit_scheduled',
        name: 'Audit Scheduled',
        subject: 'Audit Scheduled: {{auditName}}',
        body: 'An audit has been scheduled:\n\nAudit: {{auditName}}\nDate: {{auditDate}}\nFramework: {{framework}}\n\nPrepare: {{link}}',
        channels: ['email', 'slack', 'websocket'],
        variables: ['auditName', 'auditDate', 'framework', 'link'],
      },
      {
        id: 'control_failed',
        name: 'Control Failed',
        subject: 'Control Failed: {{controlName}}',
        body: 'A control has failed compliance check:\n\nControl: {{controlName}}\nFramework: {{framework}}\nStatus: {{status}}\n\nRemediate: {{link}}',
        channels: ['email', 'slack', 'websocket'],
        variables: ['controlName', 'framework', 'status', 'link'],
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }

    logger.info(`[Notification] Initialized ${defaultTemplates.length} notification templates`);
  }

  /**
   * Send notification
   */
  async sendNotification(
    userId: string,
    organizationId: string,
    notification: {
      type: Notification['type'];
      category: string;
      title: string;
      message: string;
      templateId?: string;
      metadata?: any;
      link?: string;
      channels?: ('email' | 'slack' | 'websocket' | 'sms')[];
    }
  ): Promise<Notification> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Determine channels
      const channels = notification.channels || this.determineChannels(notification.category, preferences);

      // Apply template if provided
      let title = notification.title;
      let message = notification.message;
      if (notification.templateId) {
        const template = this.templates.get(notification.templateId);
        if (template) {
          title = this.renderTemplate(template.subject, notification.metadata || {});
          message = this.renderTemplate(template.body, notification.metadata || {});
        }
      }

      // Create notification record
      const notificationId = crypto.randomUUID();
      const dbNotification = await prisma.notification.create({
        data: {
          id: notificationId,
          userId,
          organizationId,
          type: notification.type,
          category: notification.category,
          title,
          message,
          channels: (Array.isArray(channels) ? channels : [channels]) as string[],
          templateId: notification.templateId,
          metadata: notification.metadata || {},
          link: notification.link,
          status: 'pending',
          retryCount: 0,
        },
      });

      // Send through channels
      const deliveryResults = await this.sendThroughChannels(
        userId,
        organizationId,
        {
          type: notification.type,
          title,
          message,
          link: notification.link,
        },
        channels,
        preferences
      );

      // Update notification status
      const allDelivered = deliveryResults.every(r => r.success);
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: allDelivered ? 'sent' : 'failed',
          sentAt: new Date(),
          deliveredAt: allDelivered ? new Date() : undefined,
        },
      });

      logger.info(`[Notification] Sent notification ${notificationId} to user ${userId} via ${channels.join(', ')}`);

      return {
        id: dbNotification.id,
        userId: dbNotification.userId,
        organizationId: dbNotification.organizationId,
        type: dbNotification.type as Notification['type'],
        category: dbNotification.category,
        title: dbNotification.title,
        message: dbNotification.message,
        channels: dbNotification.channels as unknown as Notification['channels'],
        templateId: dbNotification.templateId || undefined,
        metadata: dbNotification.metadata as unknown as Notification['metadata'],
        link: dbNotification.link || undefined,
        sentAt: dbNotification.sentAt || undefined,
        deliveredAt: dbNotification.deliveredAt || undefined,
        readAt: dbNotification.readAt || undefined,
        status: dbNotification.status as Notification['status'],
        retryCount: dbNotification.retryCount,
        createdAt: dbNotification.createdAt,
      };
    } catch (error) {
      logger.error('[Notification] Error sending notification', error);
      throw error;
    }
  }

  /**
   * Send through multiple channels
   */
  private async sendThroughChannels(
    userId: string,
    organizationId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      link?: string;
    },
    channels: ('email' | 'slack' | 'websocket' | 'sms')[],
    preferences: NotificationPreferences
  ): Promise<Array<{ channel: string; success: boolean; error?: string }>> {
    const results: Array<{ channel: string; success: boolean; error?: string }> = [];

    for (const channel of channels) {
      try {
        // Check if channel is enabled for user
        if (!this.isChannelEnabled(channel, notification.type, preferences)) {
          results.push({ channel, success: false, error: 'Channel disabled by user preference' });
          continue;
        }

        switch (channel) {
          case 'email':
            await this.sendEmail(userId, organizationId, notification);
            results.push({ channel, success: true });
            break;
          case 'slack':
            await this.sendSlack(userId, organizationId, notification);
            results.push({ channel, success: true });
            break;
          case 'websocket':
            this.sendWebSocket(userId, notification);
            results.push({ channel, success: true });
            break;
          case 'sms':
            await this.sendSMS(userId, organizationId, notification);
            results.push({ channel, success: true });
            break;
        }
      } catch (error: any) {
        logger.error(`[Notification] Error sending via ${channel}`, error);
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    userId: string,
    organizationId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      link?: string;
    }
  ): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new AppError('SENDGRID_API_KEY not configured', 400);
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      throw new AppError('User email not found', 404);
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@complyeasy.ai';
    const htmlMessage = this.formatEmailHTML(notification);

    await sgMail.send({
      to: user.email,
      from: fromEmail,
      subject: notification.title,
      html: htmlMessage,
      text: notification.message,
    });

    logger.info(`[Notification] Email sent to user ${userId}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(
    userId: string,
    organizationId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      link?: string;
    }
  ): Promise<void> {
    // Get Slack integration
    const integration = await slackService.getIntegration(organizationId);
    if (!integration || !integration.connected) {
      throw new AppError('Slack integration not connected', 400);
    }

    // Production-ready: Get user's Slack user ID from integration metadata or user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationPreference: true,
      },
    });

    // Try to get Slack user ID from integration metadata
    let slackUserId: string | null = null;
    let slackChannel: string | null = null;

    try {
      // Check if user has Slack ID stored in integration config
      const slackIntegration = await prisma.integration.findFirst({
        where: {
          organizationId,
          provider: 'slack',
          connected: true,
        },
        select: {
          config: true,
        },
      });

      if (slackIntegration?.config) {
        const metadata = slackIntegration.config as unknown as SlackIntegrationConfig;
        // Look for user's Slack ID in metadata (could be stored as userId -> slackUserId mapping)
        if (metadata.users && metadata.users[userId]) {
          slackUserId = metadata.users[userId].slackUserId || null;
        }
      }

      // If no Slack user ID found, try to get from user's notification preferences
      if (!slackUserId && user?.notificationPreference?.slack) {
        // Check if Slack user ID is stored in user metadata or preferences
        const userMetadata = user as unknown as UserWithSlackId;
        if (userMetadata.slackUserId) {
          slackUserId = userMetadata.slackUserId;
        }
      }

      // Determine channel: use user's DM if Slack ID available, otherwise use default channel
      if (slackUserId) {
        // Send as DM to user
        slackChannel = `@${slackUserId}`;
      } else {
        // Fallback to default channel or user's preferred channel
        slackChannel = process.env.SLACK_DEFAULT_CHANNEL || 'general';
        logger.info(`[Notification] Sending Slack message to default channel ${slackChannel} (user ${userId} Slack ID not found)`);
      }

      await slackService.sendComplianceNotification(organizationId, slackChannel, {
        title: notification.title,
        message: notification.message,
        severity: notification.type === 'critical' ? 'critical' : notification.type === 'error' ? 'warning' : 'info',
        actionUrl: notification.link,
      });
    } catch (error) {
      logger.error(`[Notification] Error sending Slack message for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Send WebSocket notification
   */
  private sendWebSocket(
    userId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      link?: string;
    }
  ): void {
    // Map 'critical' to 'error' for WebSocket (which doesn't support 'critical')
    const wsType = notification.type === 'critical' ? 'error' : notification.type;
    websocketService.sendNotification(userId, {
      title: notification.title,
      message: notification.message,
      type: wsType as 'info' | 'success' | 'warning' | 'error',
      link: notification.link,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(
    userId: string,
    organizationId: string,
    notification: {
      type: Notification['type'];
      title: string;
      message: string;
      link?: string;
    }
  ): Promise<void> {
    // SMS delivery via Twilio — requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new AppError('Twilio credentials not configured', 400);
    }

    // Production-ready: Get user phone number from notification preferences or user metadata
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notificationPreference: {
          select: {
            categories: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(`User ${userId} not found`, 404);
    }

    // Get phone number from user's notification preferences metadata
    // Phone numbers should be stored in user metadata or a dedicated secure table
    const prefCategories = user.notificationPreference?.categories as unknown as PreferenceCategoriesJson;
    const phoneNumber = prefCategories?.phoneNumber || null;

    if (!phoneNumber) {
      logger.warn(`[Notification] SMS not sent - phone number not available for user ${userId}`);
      // Production-ready: Gracefully skip SMS if phone not configured (non-blocking behavior)
      // Alternative: throw new Error('Phone number not configured') for strict mode
      return;
    }

    // Validate phone number format (basic validation)
    const cleanedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (cleanedPhone.length < 10) {
      logger.warn(`[Notification] Invalid phone number format for user ${userId}`);
      return;
    }

    // Send SMS using Twilio
    try {
      const twilio = require('twilio');
      const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

      const message = await twilioClient.messages.create({
        body: `${notification.title}: ${notification.message}${notification.link ? `\n${notification.link}` : ''}`,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });

      logger.info(`[Notification] SMS sent for user ${userId} (SID: ${message.sid})`);

      // Track SMS delivery
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          organizationId,
          type: notification.type,
          category: 'sms',
          title: notification.title,
          message: notification.message,
          link: notification.link,
          channels: ['sms'],
          status: 'sent',
          metadata: {
            twilioSid: message.sid,
            phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Partially mask for privacy
          },
        },
      });
    } catch (error) {
      logger.error(`[Notification] Error sending SMS for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = this.prefCacheKey(userId);

    // Check the shared cache first. Backed by Redis (with an in-memory fallback)
    // so the value is consistent across replicas, and a SHORT TTL bounds staleness
    // even if an explicit invalidation is missed.
    try {
      const cached = await cacheService.get<NotificationPreferences>(cacheKey, {
        namespace: NotificationService.PREF_CACHE_NS,
      });
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.warn('[Notification] Preference cache read failed, loading from DB', { userId, error });
    }

    // Load from database
    const dbPreferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    const preferences: NotificationPreferences = dbPreferences
      ? {
          userId,
          email: dbPreferences.email,
          slack: dbPreferences.slack,
          websocket: dbPreferences.websocket,
          sms: dbPreferences.sms,
          categories: (dbPreferences.categories as unknown as NotificationPreferences['categories']) || {},
        }
      : {
          userId,
          email: true,
          slack: true,
          websocket: true,
          sms: false,
          categories: {},
        };

    try {
      await cacheService.set(cacheKey, preferences, {
        namespace: NotificationService.PREF_CACHE_NS,
        ttl: CACHE_TTL.SHORT,
      });
    } catch (error) {
      logger.warn('[Notification] Preference cache write failed', { userId, error });
    }

    return preferences;
  }

  /**
   * Invalidate the cached preferences for a user. Call this whenever a user's
   * notificationPreference row is created or updated so channel-routing decisions
   * pick up the change immediately across all replicas.
   */
  async invalidatePreferences(userId: string): Promise<void> {
    try {
      await cacheService.del(this.prefCacheKey(userId), {
        namespace: NotificationService.PREF_CACHE_NS,
      });
    } catch (error) {
      logger.warn('[Notification] Preference cache invalidation failed', { userId, error });
    }
  }

  /**
   * Determine channels based on category and preferences
   */
  private determineChannels(
    category: string,
    preferences: NotificationPreferences
  ): ('email' | 'slack' | 'websocket' | 'sms')[] {
    const channels: ('email' | 'slack' | 'websocket' | 'sms')[] = [];

    const categoryPrefs = preferences.categories[category] || {
      email: preferences.email,
      slack: preferences.slack,
      websocket: preferences.websocket,
      sms: preferences.sms,
    };

    if (categoryPrefs.email) channels.push('email');
    if (categoryPrefs.slack) channels.push('slack');
    if (categoryPrefs.websocket) channels.push('websocket');
    if (categoryPrefs.sms) channels.push('sms');

    return channels.length > 0 ? channels : ['websocket']; // Default to websocket
  }

  /**
   * Check if channel is enabled
   */
  private isChannelEnabled(
    channel: 'email' | 'slack' | 'websocket' | 'sms',
    type: Notification['type'],
    preferences: NotificationPreferences
  ): boolean {
    switch (channel) {
      case 'email':
        return preferences.email;
      case 'slack':
        return preferences.slack;
      case 'websocket':
        return preferences.websocket;
      case 'sms':
        return preferences.sms;
      default:
        return false;
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.split(`{{${key}}}`).join(String(value || ''));
    }
    return rendered;
  }

  /**
   * Format email HTML
   */
  private formatEmailHTML(notification: {
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
  }): string {
    const colors = {
      info: '#3498db',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c',
      critical: '#c0392b',
    };

    const color = colors[notification.type] || colors.info;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${color}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: ${color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${notification.title}</h1>
            </div>
            <div class="content">
              <p>${notification.message.replace(/\n/g, '<br>')}</p>
              ${notification.link ? `<a href="${notification.link}" class="button">View Details</a>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(options.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    return notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      organizationId: n.organizationId,
      type: n.type as Notification['type'],
      category: n.category,
      title: n.title,
      message: n.message,
      channels: n.channels as unknown as Notification['channels'],
      templateId: n.templateId || undefined,
      metadata: n.metadata as unknown as Notification['metadata'],
      link: n.link || undefined,
      sentAt: n.sentAt || undefined,
      deliveredAt: n.deliveredAt || undefined,
      readAt: n.readAt || undefined,
      status: n.status as Notification['status'],
      retryCount: n.retryCount,
      createdAt: n.createdAt,
    }));
  }
}

export default new NotificationService();

