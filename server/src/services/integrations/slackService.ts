/**
 * Slack OAuth 2.0 and API Integration Service
 * Handles authentication, token management, and messaging with Slack
 */

import axios from 'axios';
import config from '../../config';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { isUrlSafe } from '../../utils/urlValidator';
import { encryptField, decryptField } from '../../utils/credentialEncryption';

interface SlackTokenResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
}

interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  real_name: string;
  email?: string;
  is_admin: boolean;
  is_owner: boolean;
}

class SlackService {
  private readonly apiBaseUrl = 'https://slack.com/api';
  private readonly authBaseUrl = 'https://slack.com/oauth/v2';

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'channels:read',
      'channels:history',
      'chat:write',
      'users:read',
      'users:read.email',
      'team:read',
      'audit:read',
    ];

    const params = new URLSearchParams({
      client_id: config.oauth.slack.clientId,
      scope: scopes.join(','),
      redirect_uri: config.oauth.slack.callbackUrl,
      state,
    });

    return `${this.authBaseUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<SlackTokenResponse> {
    try {
      const url = `${this.authBaseUrl}/access`;
      if (!isUrlSafe(url)) {
        logger.error('Slack outbound URL rejected by isUrlSafe', { url });
        throw new AppError(`Unsafe Slack URL: ${url}`, 400);
      }
      const response = await axios.post(
        url,
        null,
        {
          params: {
            client_id: config.oauth.slack.clientId,
            client_secret: config.oauth.slack.clientSecret,
            code,
            redirect_uri: config.oauth.slack.callbackUrl,
          },
        }
      );

      const data: SlackTokenResponse = response.data;

      if (!data.ok || !data.access_token) {
        throw new AppError('No access token received from Slack', 500);
      }

      return data;
    } catch (error) {
      logger.error('Error exchanging Slack auth code for token', error);
      throw new AppError('Failed to exchange authorization code', 500);
    }
  }

  /**
   * Get authenticated user info
   */
  async getUserInfo(accessToken: string): Promise<SlackUser> {
    try {
      const url = `${this.apiBaseUrl}/users.identity`;
      if (!isUrlSafe(url)) {
        logger.error('Slack outbound URL rejected by isUrlSafe', { url });
        throw new AppError(`Unsafe Slack URL: ${url}`, 400);
      }
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.data.ok) {
        throw new AppError(response.data.error || 'Failed to fetch user info', 500);
      }

      return {
        id: response.data.user.id,
        team_id: response.data.team.id,
        name: response.data.user.name,
        real_name: response.data.user.real_name || response.data.user.name,
        email: response.data.user.email,
        is_admin: false,
        is_owner: false,
      };
    } catch (error) {
      logger.error('Error fetching Slack user info', error);
      throw new AppError('Failed to fetch user information', 500);
    }
  }

  /**
   * Save integration to database
   */
  async saveIntegration(
    organizationId: string,
    tokenResponse: SlackTokenResponse
  ): Promise<void> {
    try {
      await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'slack',
          },
        },
        create: {
          organizationId,
          name: 'Slack',
          category: 'communication',
          provider: 'slack',
          connected: true,
          accessToken: tokenResponse.access_token ? encryptField(tokenResponse.access_token) : null,
          config: {
            teamId: tokenResponse.team.id,
            teamName: tokenResponse.team.name,
            botUserId: tokenResponse.bot_user_id,
            appId: tokenResponse.app_id,
            scope: tokenResponse.scope,
            authedUser: tokenResponse.authed_user,
          },
          lastSync: new Date(),
        },
        update: {
          connected: true,
          accessToken: tokenResponse.access_token ? encryptField(tokenResponse.access_token) : null,
          config: {
            teamId: tokenResponse.team.id,
            teamName: tokenResponse.team.name,
            botUserId: tokenResponse.bot_user_id,
            appId: tokenResponse.app_id,
            scope: tokenResponse.scope,
            authedUser: tokenResponse.authed_user,
          },
          lastSync: new Date(),
        },
      });

      logger.info(`Slack integration saved for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error saving Slack integration', error);
      throw new AppError('Failed to save integration', 500);
    }
  }

  /**
   * Get integration from database
   */
  async getIntegration(organizationId: string) {
    return prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'slack',
        },
      },
    });
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(accessToken: string, endpoint: string, params?: any) {
    const url = `${this.apiBaseUrl}/${endpoint}`;
    if (!isUrlSafe(url)) {
      throw new AppError('Blocked unsafe outbound URL', 400);
    }
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      if (!response.data.ok) {
        throw new AppError(response.data.error || 'Slack API request failed', 500);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error === 'invalid_auth') {
        throw new AppError('Authentication failed. Please reconnect Slack integration.', 403);
      }
      throw error;
    }
  }

  /**
   * List workspace channels
   */
  async listChannels(organizationId: string): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new AppError('Slack integration not connected', 400);
      }

      const accessToken = decryptField(integration.accessToken);
      const data = await this.makeRequest(accessToken, 'conversations.list', {
        limit: 100,
        exclude_archived: true,
      });

      const channels = data.channels || [];

      logger.info(`Listed ${channels.length} Slack channels for org ${organizationId}`);

      return channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
        isMember: channel.is_member,
        memberCount: channel.num_members,
        topic: channel.topic?.value,
        purpose: channel.purpose?.value,
        createdAt: new Date(channel.created * 1000),
      }));
    } catch (error) {
      logger.error('Error listing Slack channels', error);
      throw new AppError('Failed to list channels', 500);
    }
  }

  /**
   * List workspace users
   */
  async listUsers(organizationId: string): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new AppError('Slack integration not connected', 400);
      }

      const accessToken = decryptField(integration.accessToken);
      const data = await this.makeRequest(accessToken, 'users.list', {
        limit: 100,
      });

      const members = data.members || [];

      logger.info(`Listed ${members.length} Slack users for org ${organizationId}`);

      return members
        .filter((member: any) => !member.deleted && !member.is_bot)
        .map((member: any) => ({
          id: member.id,
          name: member.name,
          realName: member.real_name,
          email: member.profile?.email,
          displayName: member.profile?.display_name,
          isAdmin: member.is_admin,
          isOwner: member.is_owner,
          isPrimaryOwner: member.is_primary_owner,
          isRestricted: member.is_restricted,
          isUltraRestricted: member.is_ultra_restricted,
          timezone: member.tz,
        }));
    } catch (error) {
      logger.error('Error listing Slack users', error);
      throw new AppError('Failed to list users', 500);
    }
  }

  /**
   * Get channel history
   */
  async getChannelHistory(
    organizationId: string,
    channelId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new AppError('Slack integration not connected', 400);
      }

      const accessToken = decryptField(integration.accessToken);
      const data = await this.makeRequest(accessToken, 'conversations.history', {
        channel: channelId,
        limit,
      });

      const messages = data.messages || [];

      logger.info(`Fetched ${messages.length} messages from Slack channel ${channelId}`);

      return messages.map((message: any) => ({
        type: message.type,
        user: message.user,
        text: message.text,
        timestamp: new Date(parseFloat(message.ts) * 1000),
        threadTs: message.thread_ts,
        replyCount: message.reply_count,
      }));
    } catch (error) {
      logger.error('Error fetching Slack channel history', error);
      throw new AppError('Failed to fetch channel history', 500);
    }
  }

  /**
   * Post message to channel
   */
  async postMessage(
    organizationId: string,
    channelId: string,
    text: string,
    blocks?: any[]
  ): Promise<any> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new AppError('Slack integration not connected', 400);
      }

      const url = `${this.apiBaseUrl}/chat.postMessage`;
      if (!isUrlSafe(url)) {
        logger.error('Slack outbound URL rejected by isUrlSafe', { url });
        throw new AppError(`Unsafe Slack URL: ${url}`, 400);
      }
      const accessToken = decryptField(integration.accessToken);
      const response = await axios.post(
        url,
        {
          channel: channelId,
          text,
          blocks,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.ok) {
        throw new AppError(response.data.error || 'Failed to post message', 500);
      }

      logger.info(`Posted message to Slack channel ${channelId} for org ${organizationId}`);

      return {
        channel: response.data.channel,
        timestamp: response.data.ts,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Error posting Slack message', error);
      throw new AppError('Failed to post message', 500);
    }
  }

  /**
   * Get audit logs (requires Enterprise Grid)
   */
  async getAuditLogs(organizationId: string, limit: number = 100): Promise<any[]> {
    try {
      const integration = await this.getIntegration(organizationId);

      if (!integration || !integration.connected || !integration.accessToken) {
        throw new AppError('Slack integration not connected', 400);
      }

      const accessToken = decryptField(integration.accessToken);
      const data = await this.makeRequest(accessToken, 'admin.audit.anomaly.allow.getList', {
        limit,
      });

      const logs = data.entries || [];

      logger.info(`Fetched ${logs.length} audit log entries from Slack for org ${organizationId}`);

      return logs.map((log: any) => ({
        id: log.id,
        dateCreate: new Date(log.date_create * 1000),
        action: log.action,
        actor: log.actor,
        entity: log.entity,
        context: log.context,
      }));
    } catch (error: any) {
      // Audit logs require Enterprise Grid plan
      if (error.message?.includes('paid_only')) {
        logger.warn('Slack audit logs require Enterprise Grid subscription');
        return [];
      }
      logger.error('Error fetching Slack audit logs', error);
      throw new AppError('Failed to fetch audit logs', 500);
    }
  }

  /**
   * Send compliance notification
   */
  async sendComplianceNotification(
    organizationId: string,
    channelId: string,
    notification: {
      title: string;
      message: string;
      severity: 'info' | 'warning' | 'critical';
      actionUrl?: string;
    }
  ): Promise<void> {
    try {
      const colors = {
        info: '#36a64f',
        warning: '#ff9900',
        critical: '#ff0000',
      };

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: notification.title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message,
          },
        },
      ];

      if (notification.actionUrl) {
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Details',
              },
              url: notification.actionUrl,
              style: notification.severity === 'critical' ? 'danger' : 'primary',
            },
          ],
        } as any);
      }

      await this.postMessage(organizationId, channelId, notification.message, blocks);

      logger.info(`Sent compliance notification to Slack channel ${channelId}`);
    } catch (error) {
      logger.error('Error sending compliance notification', error);
      throw new AppError('Failed to send notification', 500);
    }
  }

  /**
   * Disconnect integration
   */
  async disconnect(organizationId: string): Promise<void> {
    try {
      // Revoke token
      const integration = await this.getIntegration(organizationId);

      if (integration && integration.accessToken) {
        try {
          const url = `${this.apiBaseUrl}/auth.revoke`;
          if (!isUrlSafe(url)) {
            logger.error('Slack outbound URL rejected by isUrlSafe', { url });
            throw new AppError(`Unsafe Slack URL: ${url}`, 400);
          }
          const accessToken = decryptField(integration.accessToken);
          await axios.post(
            url,
            null,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
        } catch (error) {
          logger.warn('Error revoking Slack token (may already be revoked)', error);
        }
      }

      // Update database
      await prisma.integration.update({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'slack',
          },
        },
        data: {
          connected: false,
          accessToken: null,
          lastSync: null,
        },
      });

      logger.info(`Slack integration disconnected for organization ${organizationId}`);
    } catch (error) {
      logger.error('Error disconnecting Slack integration', error);
      throw new AppError('Failed to disconnect Slack integration', 500);
    }
  }

  /**
   * Send a compliance alert to a configured Slack channel
   * Supports different alert types with rich formatting
   */
  async sendComplianceAlert(
    organizationId: string,
    alert: {
      type: 'risk_detected' | 'control_failed' | 'audit_finding' | 'policy_violation' | 'evidence_expiring' | 'framework_update';
      title: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      resourceId?: string;
      resourceType?: string;
      actionUrl?: string;
      fields?: Array<{ label: string; value: string }>;
    }
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.connected || !integration.accessToken) {
        logger.warn(`[Slack] No active integration for org ${organizationId}`);
        return { success: false };
      }

      // Get configured alert channel from integration config
      const config = integration.config as any;
      const alertChannel = config?.alertChannel || config?.defaultChannel || 'general';

      const severityEmoji: Record<string, string> = {
        critical: ':rotating_light:',
        high: ':warning:',
        medium: ':large_orange_diamond:',
        low: ':large_blue_diamond:',
        info: ':information_source:',
      };

      const severityColor: Record<string, string> = {
        critical: '#FF0000',
        high: '#FF6600',
        medium: '#FFAA00',
        low: '#0066FF',
        info: '#00AA00',
      };

      const blocks: any[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${severityEmoji[alert.severity] || ''} ${alert.title}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: alert.description },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Type:*\n${alert.type.replace(/_/g, ' ')}` },
            { type: 'mrkdwn', text: `*Severity:*\n${alert.severity.toUpperCase()}` },
            ...(alert.fields || []).map(f => ({
              type: 'mrkdwn',
              text: `*${f.label}:*\n${f.value}`,
            })),
          ],
        },
      ];

      if (alert.actionUrl) {
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Details' },
              url: alert.actionUrl,
              style: alert.severity === 'critical' ? 'danger' : 'primary',
            },
          ],
        });
      }

      blocks.push({
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `ComplyEasy AI | ${new Date().toISOString()}` },
        ],
      });

      const alertUrl = `${this.apiBaseUrl}/chat.postMessage`;
      if (!isUrlSafe(alertUrl)) {
        logger.error('Slack outbound URL rejected by isUrlSafe', { url: alertUrl });
        throw new AppError(`Unsafe Slack URL: ${alertUrl}`, 400);
      }
      const accessToken = decryptField(integration.accessToken);
      const response = await axios.post(
        alertUrl,
        {
          channel: alertChannel,
          text: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          blocks,
          attachments: [{
            color: severityColor[alert.severity],
            fallback: `${alert.title}: ${alert.description}`,
          }],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.ok) {
        throw new AppError(response.data.error || 'Failed to send Slack alert', 500);
      }

      logger.info(`[Slack] Compliance alert sent to ${alertChannel}: ${alert.title}`);
      return { success: true, messageId: response.data.ts };
    } catch (error: any) {
      logger.error('[Slack] Error sending compliance alert', error);
      return { success: false };
    }
  }

  /**
   * Configure a Slack channel for compliance alerts
   */
  async configureAlertChannel(
    organizationId: string,
    channelId: string,
    alertTypes?: string[]
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.connected) {
        throw new AppError('Slack integration not connected', 400);
      }

      const currentConfig = (integration.config as any) || {};

      await prisma.integration.update({
        where: {
          organizationId_provider: { organizationId, provider: 'slack' },
        },
        data: {
          config: {
            ...currentConfig,
            alertChannel: channelId,
            alertTypes: alertTypes || ['risk_detected', 'control_failed', 'audit_finding', 'policy_violation', 'evidence_expiring', 'framework_update'],
          },
        },
      });

      logger.info(`[Slack] Alert channel configured for org ${organizationId}: ${channelId}`);
    } catch (error) {
      logger.error('[Slack] Error configuring alert channel', error);
      throw new AppError('Failed to configure alert channel', 500);
    }
  }

  /**
   * Send a weekly compliance digest to Slack
   */
  async sendComplianceDigest(
    organizationId: string,
    digest: {
      period: string;
      overallScore: number;
      scoreChange: number;
      openIssues: number;
      resolvedIssues: number;
      upcomingDeadlines: Array<{ title: string; date: string }>;
      highlights: string[];
    }
  ): Promise<{ success: boolean }> {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.connected || !integration.accessToken) {
        return { success: false };
      }

      const config = integration.config as any;
      const channel = config?.alertChannel || config?.defaultChannel || 'general';

      const scoreEmoji = digest.scoreChange >= 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:';
      const scoreColor = digest.overallScore >= 80 ? '#00AA00' : digest.overallScore >= 60 ? '#FFAA00' : '#FF0000';

      const blocks: any[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `:clipboard: Compliance Digest - ${digest.period}` },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Overall Score:*\n${digest.overallScore}% ${scoreEmoji} (${digest.scoreChange >= 0 ? '+' : ''}${digest.scoreChange}%)` },
            { type: 'mrkdwn', text: `*Open Issues:*\n${digest.openIssues}` },
            { type: 'mrkdwn', text: `*Resolved:*\n${digest.resolvedIssues}` },
            { type: 'mrkdwn', text: `*Upcoming Deadlines:*\n${digest.upcomingDeadlines.length}` },
          ],
        },
      ];

      if (digest.highlights.length > 0) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*Key Highlights:*\n${digest.highlights.map(h => `• ${h}`).join('\n')}` },
        });
      }

      if (digest.upcomingDeadlines.length > 0) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*Upcoming Deadlines:*\n${digest.upcomingDeadlines.slice(0, 5).map(d => `• ${d.title} - ${d.date}`).join('\n')}` },
        });
      }

      const digestUrl = `${this.apiBaseUrl}/chat.postMessage`;
      if (!isUrlSafe(digestUrl)) {
        logger.error('Slack outbound URL rejected by isUrlSafe', { url: digestUrl });
        throw new AppError(`Unsafe Slack URL: ${digestUrl}`, 400);
      }
      const accessToken = decryptField(integration.accessToken);
      await axios.post(
        digestUrl,
        {
          channel,
          text: `Compliance Digest - ${digest.period}: Score ${digest.overallScore}%`,
          blocks,
          attachments: [{ color: scoreColor, fallback: `Score: ${digest.overallScore}%` }],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        }
      );

      logger.info(`[Slack] Compliance digest sent for org ${organizationId}`);
      return { success: true };
    } catch (error) {
      logger.error('[Slack] Error sending compliance digest', error);
      return { success: false };
    }
  }

  /**
   * Process incoming Slack webhook events
   */
  async processWebhookEvent(
    event: {
      type: string;
      challenge?: string;
      event?: any;
      team_id?: string;
    }
  ): Promise<{ challenge?: string; processed: boolean }> {
    try {
      // Handle URL verification challenge
      if (event.type === 'url_verification') {
        return { challenge: event.challenge, processed: true };
      }

      if (event.type === 'event_callback' && event.event) {
        const slackEvent = event.event;

        // Handle different event types
        switch (slackEvent.type) {
          case 'message':
            // Handle compliance-related messages
            if (slackEvent.text?.includes('[compliance]') || slackEvent.text?.includes('[alert]')) {
              logger.info(`[Slack] Compliance message received: ${slackEvent.text?.substring(0, 100)}`);
            }
            break;

          case 'app_mention':
            // Handle bot mentions for compliance queries
            logger.info(`[Slack] Bot mentioned: ${slackEvent.text?.substring(0, 100)}`);
            break;

          default:
            logger.debug(`[Slack] Unhandled event type: ${slackEvent.type}`);
        }
      }

      return { processed: true };
    } catch (error) {
      logger.error('[Slack] Error processing webhook event', error);
      return { processed: false };
    }
  }
}

export default new SlackService();
