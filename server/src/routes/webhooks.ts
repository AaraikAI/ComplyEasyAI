/**
 * Webhook Routes
 *
 * Production-level routes for webhook and automation integration.
 * Supports:
 * - Webhook CRUD operations
 * - API key management
 * - Zapier integration
 * - External webhook receiving
 */

import { Router, Request, Response, NextFunction } from 'express';
import webhookController from '../controllers/webhookController';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import crypto from 'crypto';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ============================================================================
// API KEY AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to authenticate via API key
 * Used for external integrations and Zapier
 */
const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new AppError('API key required', 401);
    }

    // Hash the key and look up
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const key = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!key) {
      throw new AppError('Invalid API key', 401);
    }

    if (key.revokedAt) {
      throw new AppError('API key has been revoked', 401);
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new AppError('API key has expired', 401);
    }

    // Get organization and user info
    const org = await prisma.organization.findUnique({
      where: { id: key.organizationId },
    });

    if (!org) {
      throw new AppError('Organization not found', 401);
    }

    // Create auth request with API key context (partial user for API key auth)
    (req as any).user = {
      id: key.createdBy,
      email: 'api@' + org.name.toLowerCase().replace(/\s+/g, '-'),
      organizationId: key.organizationId,
      role: 'api_key', // API keys use scoped permissions, not admin privileges
      name: 'API Key',
    };

    (req as any).apiKey = {
      id: key.id,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
    };

    // Update last used timestamp (async, don't wait)
    prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    }).catch(err => logger.error('Failed to update API key last used', err));

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if API key has required scope
 */
const requireScope = (scope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKeyInfo = (req as any).apiKey;
    if (!apiKeyInfo) {
      return next(new AppError('API key authentication required', 401));
    }

    const scopes = apiKeyInfo.scopes as string[];
    if (scopes.includes('*') || scopes.includes(scope)) {
      return next();
    }

    res.status(403).json({
      error: 'Insufficient permissions',
      message: `API key requires '${scope}' scope`,
    });
  };
};

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

// Get available event types (public for Zapier setup)
router.get('/event-types', asyncHandler(webhookController.getEventTypes.bind(webhookController)));

// ============================================================================
// INCOMING WEBHOOKS (API Key authenticated)
// ============================================================================

// HMAC signature verification middleware for incoming webhooks
async function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { organizationId } = req.params;
  const signature = req.headers['x-webhook-signature'] as string;

  if (!signature) {
    logger.warn('Incoming webhook missing signature header', { organizationId });
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }

  // Look up the webhook secret for this organization
  const webhookConfig = await prisma.webhook.findFirst({
    where: { organizationId, enabled: true },
    select: { secret: true },
  });

  if (!webhookConfig?.secret) {
    logger.warn('Incoming webhook has no configured secret', { organizationId });
    res.status(401).json({ error: 'Webhook not configured for this organization' });
    return;
  }

  // Compute HMAC-SHA256 of the raw request body
  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookConfig.secret)
    .update(rawBody)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    logger.warn('Incoming webhook signature mismatch', { organizationId });
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  next();
}

// Receive webhook from external service (HMAC-authenticated)
router.post(
  '/incoming/:organizationId/:action',
  asyncHandler(verifyWebhookSignature),
  asyncHandler(webhookController.receiveIncomingWebhook.bind(webhookController))
);

// ============================================================================
// ZAPIER INTEGRATION (API Key authenticated)
// ============================================================================

// Zapier auth test
router.get(
  '/zapier/auth',
  authenticateApiKey,
  asyncHandler(webhookController.zapierAuthTest.bind(webhookController))
);

// Zapier trigger subscription
router.post(
  '/zapier/subscribe',
  authenticateApiKey,
  requireScope('webhook:manage'),
  asyncHandler(webhookController.zapierSubscribe.bind(webhookController))
);

// Zapier trigger unsubscription
router.delete(
  '/zapier/subscribe/:id',
  authenticateApiKey,
  requireScope('webhook:manage'),
  asyncHandler(webhookController.zapierUnsubscribe.bind(webhookController))
);

// Zapier sample data
router.get(
  '/zapier/sample/:event',
  authenticateApiKey,
  asyncHandler(webhookController.zapierSampleData.bind(webhookController))
);

// ============================================================================
// AUTHENTICATED ENDPOINTS (JWT or API Key)
// ============================================================================

// Combined auth middleware - supports both JWT and API key
const authenticateAny = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  if (apiKeyHeader || (authHeader && authHeader.startsWith('Bearer cea_'))) {
    // Use API key auth
    return authenticateApiKey(req, res, next);
  } else {
    // Use JWT auth
    return authenticate(req, res, next);
  }
};

router.use(authenticateAny);

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

// Get all webhooks
router.get('/', asyncHandler(webhookController.getWebhooks.bind(webhookController)));

// Get single webhook
router.get('/:webhookId', asyncHandler(webhookController.getWebhook.bind(webhookController)));

// Create webhook (admin only)
router.post('/', authorize('admin'), asyncHandler(webhookController.createWebhook.bind(webhookController)));

// Update webhook (admin only)
router.patch('/:webhookId', authorize('admin'), asyncHandler(webhookController.updateWebhook.bind(webhookController)));

// Delete webhook (admin only)
router.delete('/:webhookId', authorize('admin'), asyncHandler(webhookController.deleteWebhook.bind(webhookController)));

// Test webhook
router.post('/:webhookId/test', authorize('admin'), asyncHandler(webhookController.testWebhook.bind(webhookController)));

// Regenerate webhook secret
router.post('/:webhookId/regenerate-secret', authorize('admin'), asyncHandler(webhookController.regenerateSecret.bind(webhookController)));

// ============================================================================
// WEBHOOK EVENTS
// ============================================================================

// Get event history
router.get('/events/history', asyncHandler(webhookController.getEventHistory.bind(webhookController)));

// Retry event
router.post('/events/:eventId/retry', authorize('admin'), asyncHandler(webhookController.retryEvent.bind(webhookController)));

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

// Get all API keys
router.get('/keys/list', asyncHandler(webhookController.getApiKeys.bind(webhookController)));

// Create API key (admin only)
router.post('/keys', authorize('admin'), asyncHandler(webhookController.createApiKey.bind(webhookController)));

// Revoke API key (admin only)
router.delete('/keys/:keyId', authorize('admin'), asyncHandler(webhookController.revokeApiKey.bind(webhookController)));

export default router;
