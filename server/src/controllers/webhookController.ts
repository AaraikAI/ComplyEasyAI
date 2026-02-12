/**
 * Webhook Controller
 *
 * Production-level controller for webhook management and Zapier integration.
 * Handles:
 * - Webhook CRUD operations
 * - Webhook testing
 * - Event history
 * - API key management for external access
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import webhookService, { WEBHOOK_EVENT_TYPES } from '../services/webhookService';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import crypto from 'crypto';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

class WebhookController {
  /**
   * Get all webhooks for the organization
   */
  getWebhooks: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const webhooks = await webhookService.getWebhooks(organizationId);

      res.json({
        webhooks,
        availableEvents: WEBHOOK_EVENT_TYPES,
      });
    } catch (error) {
      logger.error('Get webhooks error', error);
      throw new AppError('Failed to fetch webhooks', 500);
    }
  };

  /**
   * Get a single webhook with event history
   */
  getWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { webhookId } = req.params;
      const organizationId = authReq.user!.organizationId;

      const webhook = await webhookService.getWebhook(webhookId, organizationId);

      res.json(webhook);
    } catch (error: unknown) {
      logger.error('Get webhook error', error);
      if (getErrorMessage(error) === 'Webhook not found') {
        throw new AppError('Webhook not found', 404);
      }
      throw new AppError('Failed to fetch webhook', 500);
    }
  };

  /**
   * Create a new webhook
   */
  createWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { name, url, events, headers } = req.body;
      const organizationId = authReq.user!.organizationId;

      // Validate required fields
      if (!name || !url || !events || !Array.isArray(events)) {
        throw new AppError('Name, URL, and events array are required', 400);
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new AppError('Invalid webhook URL', 400);
      }

      // Validate events
      const validEvents = Object.keys(WEBHOOK_EVENT_TYPES);
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        throw new AppError(`Invalid events: ${invalidEvents.join(', ')}`, 400);
      }

      const webhook = await webhookService.createWebhook({
        organizationId,
        name,
        url,
        events,
        headers,
        createdBy: authReq.user!.id,
      });

      res.status(201).json({
        webhook,
        message: 'Webhook created successfully. Please save the secret securely.',
      });
    } catch (error: unknown) {
      logger.error('Create webhook error', error);
      if (getErrorMessage(error).includes('already exists')) {
        throw new AppError(getErrorMessage(error), 409);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create webhook', 500);
    }
  };

  /**
   * Update a webhook
   */
  updateWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { webhookId } = req.params;
      const { name, url, events, headers, enabled } = req.body;
      const organizationId = authReq.user!.organizationId;

      // Validate URL if provided
      if (url) {
        try {
          new URL(url);
        } catch {
          throw new AppError('Invalid webhook URL', 400);
        }
      }

      // Validate events if provided
      if (events) {
        const validEvents = Object.keys(WEBHOOK_EVENT_TYPES);
        const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
        if (invalidEvents.length > 0) {
          throw new AppError(`Invalid events: ${invalidEvents.join(', ')}`, 400);
        }
      }

      const webhook = await webhookService.updateWebhook(webhookId, organizationId, {
        name,
        url,
        events,
        headers,
        enabled,
      });

      res.json(webhook);
    } catch (error: unknown) {
      logger.error('Update webhook error', error);
      if (getErrorMessage(error) === 'Webhook not found') {
        throw new AppError('Webhook not found', 404);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update webhook', 500);
    }
  };

  /**
   * Delete a webhook
   */
  deleteWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { webhookId } = req.params;
      const organizationId = authReq.user!.organizationId;

      await webhookService.deleteWebhook(webhookId, organizationId);

      res.json({ success: true, message: 'Webhook deleted successfully' });
    } catch (error: unknown) {
      logger.error('Delete webhook error', error);
      if (getErrorMessage(error) === 'Webhook not found') {
        throw new AppError('Webhook not found', 404);
      }
      throw new AppError('Failed to delete webhook', 500);
    }
  };

  /**
   * Test a webhook
   */
  testWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { webhookId } = req.params;
      const organizationId = authReq.user!.organizationId;

      const result = await webhookService.testWebhook(webhookId, organizationId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Test webhook delivered successfully',
          statusCode: result.statusCode,
          duration: result.duration,
        });
      } else {
        res.status(422).json({
          success: false,
          message: 'Webhook delivery failed',
          error: result.error,
          statusCode: result.statusCode,
          duration: result.duration,
        });
      }
    } catch (error: unknown) {
      logger.error('Test webhook error', error);
      if (getErrorMessage(error) === 'Webhook not found') {
        throw new AppError('Webhook not found', 404);
      }
      throw new AppError('Failed to test webhook', 500);
    }
  };

  /**
   * Regenerate webhook secret
   */
  regenerateSecret: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { webhookId } = req.params;
      const organizationId = authReq.user!.organizationId;

      const newSecret = await webhookService.regenerateSecret(webhookId, organizationId);

      res.json({
        success: true,
        secret: newSecret,
        message: 'Secret regenerated. Please update your integration.',
      });
    } catch (error: unknown) {
      logger.error('Regenerate secret error', error);
      if (getErrorMessage(error) === 'Webhook not found') {
        throw new AppError('Webhook not found', 404);
      }
      throw new AppError('Failed to regenerate secret', 500);
    }
  };

  /**
   * Get webhook event history
   */
  getEventHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { webhookId, eventType, status, limit, offset } = req.query;

      const result = await webhookService.getEventHistory(organizationId, {
        webhookId: webhookId as string,
        eventType: eventType as string,
        status: status as 'pending' | 'delivered' | 'failed' | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      logger.error('Get event history error', error);
      throw new AppError('Failed to fetch event history', 500);
    }
  };

  /**
   * Retry a failed webhook event
   */
  retryEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { eventId } = req.params;
      const organizationId = authReq.user!.organizationId;

      await webhookService.retryEvent(eventId, organizationId);

      res.json({ success: true, message: 'Event retry initiated' });
    } catch (error: unknown) {
      logger.error('Retry event error', error);
      if (getErrorMessage(error) === 'Webhook event not found') {
        throw new AppError('Event not found', 404);
      }
      if (getErrorMessage(error) === 'Event already delivered') {
        throw new AppError('Event already delivered', 400);
      }
      throw new AppError('Failed to retry event', 500);
    }
  };

  /**
   * Get available webhook event types
   */
  getEventTypes: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      eventTypes: Object.entries(WEBHOOK_EVENT_TYPES).map(([type, description]) => ({
        type,
        description,
        category: type.split('.')[0],
      })),
    });
  };

  // ============================================================================
  // API KEY MANAGEMENT
  // ============================================================================

  /**
   * Get all API keys for the organization
   */
  getApiKeys: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const apiKeys = await prisma.apiKey.findMany({
        where: {
          organizationId,
          revokedAt: null,
        },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          rateLimit: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(apiKeys);
    } catch (error) {
      logger.error('Get API keys error', error);
      throw new AppError('Failed to fetch API keys', 500);
    }
  };

  /**
   * Create a new API key
   */
  createApiKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { name, scopes = [], rateLimit = 1000, expiresInDays } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!name) {
        throw new AppError('Name is required', 400);
      }

      // Generate API key
      const keyRaw = `cea_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(keyRaw).digest('hex');
      const keyPrefix = keyRaw.slice(0, 12);

      // Calculate expiration
      let expiresAt: Date | undefined;
      if (expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      const apiKey = await prisma.apiKey.create({
        data: {
          organizationId,
          name,
          keyHash,
          keyPrefix,
          scopes,
          rateLimit,
          expiresAt,
          createdBy: authReq.user!.id,
        },
      });

      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key: keyRaw, // Only returned once on creation
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        message: 'API key created. Please save the key securely - it will not be shown again.',
      });
    } catch (error: unknown) {
      logger.error('Create API key error', error);
      if (error instanceof Error && (error as Error & { code?: string }).code === 'P2002') {
        throw new AppError('An API key with this name already exists', 409);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create API key', 500);
    }
  };

  /**
   * Revoke an API key
   */
  revokeApiKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { keyId } = req.params;
      const organizationId = authReq.user!.organizationId;

      await prisma.apiKey.update({
        where: {
          id: keyId,
          organizationId,
        },
        data: { revokedAt: new Date() },
      });

      res.json({ success: true, message: 'API key revoked' });
    } catch (error: unknown) {
      logger.error('Revoke API key error', error);
      if (error instanceof Error && (error as Error & { code?: string }).code === 'P2025') {
        throw new AppError('API key not found', 404);
      }
      throw new AppError('Failed to revoke API key', 500);
    }
  };

  // ============================================================================
  // ZAPIER INTEGRATION ENDPOINTS
  // ============================================================================

  /**
   * Zapier authentication test endpoint
   * This is called by Zapier to verify the API key
   */
  zapierAuthTest: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      // If we got here, the API key is valid
      const org = await prisma.organization.findUnique({
        where: { id: authReq.user!.organizationId },
        select: { name: true, plan: true },
      });

      res.json({
        success: true,
        organizationName: org?.name,
        plan: org?.plan,
        userId: authReq.user!.id,
        email: authReq.user!.email,
      });
    } catch (error) {
      logger.error('Zapier auth test error', error);
      throw new AppError('Authentication failed', 401);
    }
  };

  /**
   * Zapier trigger subscription endpoint
   * Creates a webhook for Zapier triggers
   */
  zapierSubscribe: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { hookUrl, event } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!hookUrl || !event) {
        throw new AppError('hookUrl and event are required', 400);
      }

      // Create webhook for Zapier
      const webhook = await webhookService.createWebhook({
        organizationId,
        name: `Zapier: ${event}`,
        url: hookUrl,
        events: [event],
        createdBy: authReq.user!.id,
      });

      res.json({ id: webhook.id });
    } catch (error: unknown) {
      logger.error('Zapier subscribe error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create Zapier subscription', 500);
    }
  };

  /**
   * Zapier trigger unsubscription endpoint
   * Deletes a webhook created by Zapier
   */
  zapierUnsubscribe: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      await webhookService.deleteWebhook(id, organizationId);

      res.json({ success: true });
    } catch (error: unknown) {
      logger.error('Zapier unsubscribe error', error);
      if (getErrorMessage(error) === 'Webhook not found') {
        // Return success even if not found (Zapier expects this)
        res.json({ success: true });
        return;
      }
      throw new AppError('Failed to unsubscribe', 500);
    }
  };

  /**
   * Zapier sample data endpoint
   * Returns sample data for Zapier trigger configuration
   */
  zapierSampleData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { event } = req.params;

      // Return sample data based on event type
      const samples: Record<string, any> = {
        'user.created': {
          id: 'usr_sample123',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'viewer',
          createdAt: new Date().toISOString(),
        },
        'subscription.created': {
          tier: 'Essentials',
          billingCycle: 'annual',
          status: 'active',
          amount: 4500,
          createdAt: new Date().toISOString(),
        },
        'tier.changed': {
          previousTier: 'Foundation',
          newTier: 'Essentials',
          billingCycle: 'annual',
          changedAt: new Date().toISOString(),
        },
        'payment.succeeded': {
          amount: 4500,
          currency: 'usd',
          invoiceId: 'inv_sample123',
          paidAt: new Date().toISOString(),
        },
        'risk.created': {
          id: 'risk_sample123',
          title: 'Sample Risk',
          severity: 'High',
          status: 'Open',
          createdAt: new Date().toISOString(),
        },
        'issue.created': {
          id: 'issue_sample123',
          title: 'Sample Issue',
          priority: 'Medium',
          status: 'Open',
          createdAt: new Date().toISOString(),
        },
        'monitor.alert': {
          monitorId: 'mon_sample123',
          monitorName: 'Sample Monitor',
          status: 'Failing',
          findings: ['Sample finding'],
          triggeredAt: new Date().toISOString(),
        },
      };

      const sampleData = samples[event] || {
        event,
        timestamp: new Date().toISOString(),
        data: { message: 'Sample event data' },
      };

      res.json([sampleData]);
    } catch (error) {
      logger.error('Zapier sample data error', error);
      throw new AppError('Failed to get sample data', 500);
    }
  };

  // ============================================================================
  // INCOMING WEBHOOK (for receiving events from external services)
  // ============================================================================

  /**
   * Receive incoming webhook from external service
   * This allows external services to trigger events in ComplyEasyAI
   */
  receiveIncomingWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, action } = req.params;
      const signature = req.headers['x-webhook-signature'] as string;

      // Find organization's incoming webhook configuration
      // This would typically be stored in a separate model
      // For now, we'll validate using API key auth

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        throw new AppError('API key required', 401);
      }

      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const validKey = await prisma.apiKey.findUnique({
        where: { keyHash },
      });

      if (!validKey || validKey.organizationId !== organizationId) {
        throw new AppError('Invalid API key', 401);
      }

      // Check scopes
      if (!validKey.scopes.includes('webhook:receive') && !validKey.scopes.includes('*')) {
        throw new AppError('API key does not have webhook:receive scope', 403);
      }

      // Process the incoming webhook based on action
      const payload = req.body;

      // Map external actions to internal events
      const actionMappings: Record<string, (data: any) => Promise<void>> = {
        'add-user': async (data) => {
          // Add user logic
          await webhookService.dispatchEvent(organizationId, 'user.created', data);
        },
        'update-user': async (data) => {
          await webhookService.dispatchEvent(organizationId, 'user.updated', data);
        },
        'sync-compliance': async (data) => {
          // Trigger compliance sync
          await webhookService.dispatchEvent(organizationId, 'framework.updated', data);
        },
      };

      const handler = actionMappings[action];
      if (!handler) {
        throw new AppError(`Unknown action: ${action}`, 400);
      }

      await handler(payload);

      // Update API key last used
      await prisma.apiKey.update({
        where: { id: validKey.id },
        data: { lastUsedAt: new Date() },
      });

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error: unknown) {
      logger.error('Incoming webhook error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process incoming webhook', 500);
    }
  };
}

export default new WebhookController();
