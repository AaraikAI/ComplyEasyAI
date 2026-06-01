/**
 * Webhook Service
 *
 * Production-level webhook service for Zapier/automation integration.
 * Handles:
 * - Webhook registration and management
 * - Event dispatching with retry logic
 * - HMAC signature generation
 * - Delivery tracking and failure handling
 */

import crypto from 'crypto';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { WebhookEventStatus } from '../generated/prisma/client';
import { encryptField, decryptField } from '../utils/credentialEncryption';

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookPayload {
  event: string;
  timestamp: string;
  organizationId: string;
  data: Record<string, any>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  duration?: number;
}

export interface CreateWebhookOptions {
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  createdBy: string;
}

export interface UpdateWebhookOptions {
  name?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  enabled?: boolean;
}

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export const WEBHOOK_EVENT_TYPES = {
  // User Events
  'user.created': 'New user added to organization',
  'user.updated': 'User profile or role updated',
  'user.deleted': 'User removed from organization',
  'user.invited': 'User invitation sent',

  // Subscription Events
  'subscription.created': 'New subscription started',
  'subscription.updated': 'Subscription details changed',
  'subscription.canceled': 'Subscription canceled',
  'subscription.reactivated': 'Subscription reactivated',

  // Tier Events
  'tier.changed': 'Subscription tier upgraded or downgraded',

  // Payment Events
  'payment.succeeded': 'Payment processed successfully',
  'payment.failed': 'Payment failed',

  // Add-on Events
  'addon.added': 'Add-on added to subscription',
  'addon.removed': 'Add-on removed from subscription',

  // Compliance Events
  'framework.added': 'Compliance framework added',
  'framework.updated': 'Compliance framework status changed',
  'control.updated': 'Framework control status changed',

  // Risk Events
  'risk.created': 'New risk identified',
  'risk.updated': 'Risk status or severity changed',
  'risk.resolved': 'Risk marked as resolved',

  // Issue Events
  'issue.created': 'New issue created',
  'issue.updated': 'Issue status changed',
  'issue.resolved': 'Issue marked as resolved',

  // Vendor Events
  'vendor.added': 'New vendor added',
  'vendor.updated': 'Vendor details updated',
  'vendor.risk_changed': 'Vendor risk level changed',

  // Policy Events
  'policy.created': 'New policy created',
  'policy.updated': 'Policy content updated',
  'policy.approved': 'Policy approved',

  // Questionnaire Events
  'questionnaire.created': 'New questionnaire created',
  'questionnaire.completed': 'Questionnaire completed',

  // Monitor Events
  'monitor.alert': 'Continuous monitor triggered alert',
  'monitor.passed': 'Monitor check passed',
  'monitor.failed': 'Monitor check failed',

  // aCOS Events
  'acos.goal_created': 'Compliance goal created',
  'acos.action_executed': 'Agentic action executed',
  'acos.debt_detected': 'Compliance debt detected',
  'acos.regulatory_change': 'Regulatory change detected',

  // Demo Request Events (for lead capture automation)
  'demo.request.new': 'New demo request submitted',
  'demo.request.welcome': 'Send welcome email to demo requester',
  'demo.request.scheduled': 'Demo scheduled confirmation',
  'demo.request.status_changed': 'Demo request status changed',
  'demo.request.converted': 'Demo lead converted to customer',
  'demo.request.followup': 'Follow-up reminder for demo request',
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENT_TYPES;

// ============================================================================
// WEBHOOK SERVICE CLASS
// ============================================================================

class WebhookService {
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // 1m, 5m, 15m, 1h, 2h

  // Durable retry poller: drains DB-backed pending/failed events whose nextAttemptAt has passed.
  // This is the single source of truth for retries (restart-safe — it re-reads the table each tick).
  private retryPoller: NodeJS.Timeout | null = null;
  private readonly RETRY_POLL_INTERVAL_MS = parseInt(
    process.env.WEBHOOK_RETRY_POLL_INTERVAL_MS || '30000',
    10
  );

  /**
   * Start the durable retry poller (idempotent). Reads due events from the database on each
   * tick, so pending retries survive process restarts without relying on in-memory timers.
   */
  startRetryPoller(): void {
    if (this.retryPoller) return;
    this.retryPoller = setInterval(() => {
      this.processPendingEvents().catch((error) => {
        logger.error('Webhook retry poller failed to process pending events', error);
      });
    }, this.RETRY_POLL_INTERVAL_MS);
    // Do not keep the event loop alive solely for this timer.
    if (typeof this.retryPoller.unref === 'function') {
      this.retryPoller.unref();
    }
    logger.info(`Webhook retry poller started (interval ${this.RETRY_POLL_INTERVAL_MS}ms)`);
  }

  /**
   * Stop the durable retry poller.
   */
  stopRetryPoller(): void {
    if (this.retryPoller) {
      clearInterval(this.retryPoller);
      this.retryPoller = null;
    }
  }

  /**
   * Create a new webhook
   */
  async createWebhook(options: CreateWebhookOptions): Promise<any> {
    try {
      // Validate URL
      new URL(options.url);

      // Generate signing secret
      const secret = crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhook.create({
        data: {
          organizationId: options.organizationId,
          name: options.name,
          url: options.url,
          // Encrypt webhook signing secret at rest (AES-256-GCM)
          secret: encryptField(secret),
          events: options.events,
          headers: options.headers || {},
          createdBy: options.createdBy,
        },
      });

      logger.info(`Webhook created: ${webhook.id} for org ${options.organizationId}`);

      return {
        ...webhook,
        secret, // Return plaintext secret only on creation (caller needs it once for setup)
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError(`Webhook with name "${options.name}" already exists`, 409);
      }
      logger.error('Failed to create webhook', error);
      throw new AppError('Failed to create webhook', 400);
    }
  }

  /**
   * Update a webhook
   */
  async updateWebhook(
    webhookId: string,
    organizationId: string,
    options: UpdateWebhookOptions
  ): Promise<any> {
    try {
      if (options.url) {
        new URL(options.url);
      }

      const webhook = await prisma.webhook.update({
        where: {
          id: webhookId,
          organizationId,
        },
        data: {
          ...options,
          updatedAt: new Date(),
        },
      });

      logger.info(`Webhook updated: ${webhookId}`);
      return webhook;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Webhook not found', 404);
      }
      logger.error('Failed to update webhook', error);
      throw new AppError('Failed to update webhook', 400);
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string, organizationId: string): Promise<boolean> {
    try {
      await prisma.webhook.delete({
        where: {
          id: webhookId,
          organizationId,
        },
      });

      logger.info(`Webhook deleted: ${webhookId}`);
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Webhook not found', 404);
      }
      logger.error('Failed to delete webhook', error);
      throw new AppError('Failed to delete webhook', 400);
    }
  }

  /**
   * Get webhooks for an organization
   */
  async getWebhooks(organizationId: string): Promise<any[]> {
    return prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        headers: true,
        enabled: true,
        lastTriggeredAt: true,
        failureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get a single webhook with full details
   */
  async getWebhook(webhookId: string, organizationId: string): Promise<any> {
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
        organizationId,
      },
      include: {
        webhookEvents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    // Don't expose the secret
    const { secret, ...safeWebhook } = webhook;
    return safeWebhook;
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(webhookId: string, organizationId: string): Promise<string> {
    const newSecret = crypto.randomBytes(32).toString('hex');

    await prisma.webhook.update({
      where: {
        id: webhookId,
        organizationId,
      },
      // Encrypt the new secret at rest
      data: { secret: encryptField(newSecret) },
    });

    logger.info(`Webhook secret regenerated: ${webhookId}`);
    return newSecret; // Return plaintext to caller (one-time display)
  }

  /**
   * Test a webhook
   */
  async testWebhook(webhookId: string, organizationId: string): Promise<WebhookDeliveryResult> {
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
        organizationId,
      },
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    const payload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      organizationId,
      data: {
        message: 'This is a test webhook delivery',
        webhookId,
      },
    };

    return this.deliverWebhook(webhook, payload);
  }

  /**
   * Dispatch an event to all subscribed webhooks
   */
  async dispatchEvent(
    organizationId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Find all webhooks subscribed to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          organizationId,
          enabled: true,
          events: { has: eventType },
        },
      });

      if (webhooks.length === 0) {
        logger.debug(`No webhooks subscribed to ${eventType} for org ${organizationId}`);
        return;
      }

      const payload: WebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        organizationId,
        data,
      };

      // Create all webhook events in a single transaction
      const createdEvents = await prisma.$transaction(async (tx) => {
        const events = [];
        for (const webhook of webhooks) {
          const webhookEvent = await tx.webhookEvent.create({
            data: {
              webhookId: webhook.id,
              organizationId,
              eventType,
              payload: payload as any,
              status: 'pending',
            },
          });
          events.push(webhookEvent);
        }
        return events;
      });

      // Ensure the durable retry poller is running so failed deliveries are retried from the DB
      // even across process restarts (idempotent — only spins up once).
      this.startRetryPoller();

      // Attempt immediate delivery for each event (outside transaction)
      for (const webhookEvent of createdEvents) {
        this.processWebhookEvent(webhookEvent.id).catch(err => {
          logger.error(`Failed to process webhook event ${webhookEvent.id}`, err);
        });
      }

      logger.info(`Dispatched ${eventType} to ${webhooks.length} webhooks`);
    } catch (error) {
      logger.error('Failed to dispatch webhook event', error);
    }
  }

  /**
   * Process a webhook event (attempt delivery with retries)
   */
  async processWebhookEvent(eventId: string): Promise<void> {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: { webhook: true },
    });

    if (!event || !event.webhook) {
      logger.warn(`Webhook event not found: ${eventId}`);
      return;
    }

    if (event.status === 'delivered' || event.status === 'exhausted') {
      return;
    }

    // Mark as processing
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'processing' },
    });

    const result = await this.deliverWebhook(
      event.webhook,
      event.payload as unknown as WebhookPayload
    );

    if (result.success) {
      // Mark as delivered
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'delivered',
          responseCode: result.statusCode,
          responseBody: result.responseBody?.slice(0, 1000),
          processedAt: new Date(),
          attempts: event.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });

      // Update webhook success stats
      await prisma.webhook.update({
        where: { id: event.webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      });
    } else {
      const newAttempts = event.attempts + 1;

      if (newAttempts >= event.maxAttempts) {
        // Exhausted retries
        await prisma.webhookEvent.update({
          where: { id: eventId },
          data: {
            status: 'exhausted',
            errorMessage: result.error,
            attempts: newAttempts,
            lastAttemptAt: new Date(),
          },
        });

        // Increment failure count
        await prisma.webhook.update({
          where: { id: event.webhook.id },
          data: {
            failureCount: { increment: 1 },
          },
        });
      } else {
        // Schedule retry
        const delaySeconds = this.RETRY_DELAYS[newAttempts - 1] || 7200;
        const nextAttempt = new Date(Date.now() + delaySeconds * 1000);

        await prisma.webhookEvent.update({
          where: { id: eventId },
          data: {
            status: 'failed',
            errorMessage: result.error,
            responseCode: result.statusCode,
            attempts: newAttempts,
            lastAttemptAt: new Date(),
            nextAttemptAt: nextAttempt,
          },
        });

        // Retry scheduling is durable: the persisted nextAttemptAt is the single source of truth.
        // processPendingEvents() (the DB-backed poller/cron) picks the event up once
        // nextAttemptAt <= now, so retries survive process restarts without in-memory timers.
      }
    }
  }

  /**
   * Deliver a webhook payload to the target URL
   */
  private async deliverWebhook(
    webhook: { url: string; secret: string; headers: any },
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    const payloadString = JSON.stringify(payload);

    // SECURITY: SSRF Protection - Validate webhook URL before making request
    const { isWebhookUrlSafe } = await import('../utils/urlValidator');
    if (!isWebhookUrlSafe(webhook.url)) {
      throw new AppError('Webhook URL is not allowed for security reasons (SSRF protection)', 400);
    }

    // Generate HMAC signature (decrypt webhook.secret which is encrypted at rest)
    const plaintextSecret = decryptField(webhook.secret);
    const signature = this.generateSignature(payloadString, plaintextSecret);

    try {
      // Use safeFetch for additional SSRF protection
      const { safeFetch } = await import('../utils/urlValidator');
      const response = await safeFetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ComplyEasyAI-Webhook/1.0',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Webhook-Event': payload.event,
          ...((webhook.headers as Record<string, string>) || {}),
        },
        body: payloadString,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const duration = Date.now() - startTime;
      const responseBody = await response.text();

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          responseBody,
          duration,
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          responseBody,
          error: `HTTP ${response.status}: ${response.statusText}`,
          duration,
        };
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message || 'Network error',
        duration,
      };
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    const timestamp = Date.now().toString();
    const signaturePayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signaturePayload);
    const signature = hmac.digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Verify webhook signature (for receiving webhooks)
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string,
    maxAge: number = 300000 // 5 minutes
  ): boolean {
    try {
      const parts = signature.split(',');
      const timestampPart = parts.find(p => p.startsWith('t='));
      const signaturePart = parts.find(p => p.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return false;
      }

      const timestamp = parseInt(timestampPart.slice(2), 10);
      const receivedSignature = signaturePart.slice(3);

      // Check timestamp age
      if (Date.now() - timestamp > maxAge) {
        return false;
      }

      // Verify signature
      const signaturePayload = `${timestamp}.${payload}`;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(signaturePayload);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Get webhook event history
   */
  async getEventHistory(
    organizationId: string,
    options: {
      webhookId?: string;
      eventType?: string;
      status?: WebhookEventStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ events: any[]; total: number }> {
    const where: any = { organizationId };

    if (options.webhookId) where.webhookId = options.webhookId;
    if (options.eventType) where.eventType = options.eventType;
    if (options.status) where.status = options.status;

    const [events, total] = await Promise.all([
      prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          webhook: {
            select: { name: true, url: true },
          },
        },
      }),
      prisma.webhookEvent.count({ where }),
    ]);

    return { events, total };
  }

  /**
   * Retry a failed webhook event
   */
  async retryEvent(eventId: string, organizationId: string): Promise<boolean> {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId, organizationId },
    });

    if (!event) {
      throw new AppError('Webhook event not found', 404);
    }

    if (event.status === 'delivered') {
      throw new AppError('Event already delivered', 409);
    }

    // Reset for retry
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'pending',
        attempts: 0,
        errorMessage: null,
        nextAttemptAt: null,
      },
    });

    // Process immediately
    this.processWebhookEvent(eventId).catch(err => {
      logger.error(`Manual retry failed for webhook event ${eventId}`, err);
    });

    return true;
  }

  /**
   * Process pending webhook events (for cron job)
   */
  async processPendingEvents(): Promise<number> {
    const pendingEvents = await prisma.webhookEvent.findMany({
      where: {
        status: { in: ['pending', 'failed'] },
        nextAttemptAt: { lte: new Date() },
      },
      take: 100,
    });

    let processed = 0;

    for (const event of pendingEvents) {
      try {
        await this.processWebhookEvent(event.id);
        processed++;
      } catch (error) {
        logger.error(`Failed to process pending event ${event.id}`, error);
      }
    }

    return processed;
  }

  /**
   * Clean up old webhook events (for maintenance)
   */
  async cleanupOldEvents(olderThanDays: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await prisma.webhookEvent.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ['delivered', 'exhausted'] },
      },
    });

    logger.info(`Cleaned up ${result.count} old webhook events`);
    return result.count;
  }
}

export default new WebhookService();
