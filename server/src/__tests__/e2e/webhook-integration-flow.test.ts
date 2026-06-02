/**
 * E2E Tests - Webhook & Integration Flow
 * Tests complete integration workflows including webhooks, API keys,
 * third-party connections, and event handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock external HTTP requests
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ status: 200, data: { received: true } }),
  get: jest.fn().mockResolvedValue({ status: 200, data: {} }),
}));

// Integration connect routes gate with enforceLimit('maxIntegrations').
jest.mock('../../middleware/tierMiddleware', () => {
  const passthrough = (_req: any, _res: any, next: any) => next();
  return {
    enforceLimit: () => passthrough,
    requireFeature: () => passthrough,
    requireTier: () => passthrough,
    attachTierInfo: () => passthrough,
    trackUsage: () => passthrough,
    requireActiveSubscription: () => passthrough,
    requireAiFeature: () => [passthrough],
    requireResourceCreation: () => [passthrough],
    requireEnterpriseFeature: () => [passthrough],
    requireVisionaryFeature: () => [passthrough],
  };
});

// The webhook management endpoints delegate to webhookService; mock it so the
// route contracts can be exercised deterministically without a DB.
const mockWebhookService = {
  getWebhooks: jest.fn<any>(),
  getWebhook: jest.fn<any>(),
  createWebhook: jest.fn<any>(),
  updateWebhook: jest.fn<any>(),
  deleteWebhook: jest.fn<any>(),
  testWebhook: jest.fn<any>(),
  regenerateSecret: jest.fn<any>(),
  getEventHistory: jest.fn<any>(),
  retryEvent: jest.fn<any>(),
};
jest.mock('../../services/webhookService', () => ({
  __esModule: true,
  default: mockWebhookService,
  WEBHOOK_EVENT_TYPES: {
    'risk.created': 'Risk created',
    'risk.updated': 'Risk updated',
    'control.updated': 'Control updated',
    'framework.added': 'Framework added',
  },
}));

import webhooksRoutes from '../../routes/webhooks';
import integrationsRoutes from '../../routes/integrations';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use(errorHandler);

describe('E2E: Webhook & Integration Flow', () => {
  const mockWebhook = {
    id: 'webhook-123',
    url: 'https://example.com/webhook',
    events: ['risk.created', 'risk.updated'],
    secret: 'whsec_test_secret',
    enabled: true,
    organizationId: 'org-123',
    createdAt: new Date(),
  };

  const mockApiKey = {
    id: 'key-123',
    name: 'Production API Key',
    keyPrefix: 'cea_prod_xy',
    scopes: ['read:all'],
    rateLimit: 1000,
    lastUsedAt: null,
    expiresAt: null,
    organizationId: 'org-123',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.auditLog.create.mockResolvedValue({} as any);
    // apiKey.updateMany is used by revokeApiKey but is absent from the shared
    // prisma mock; augment it for this suite only (does not touch the shared file).
    (prismaMock.apiKey as any).updateMany = jest.fn();
  });

  describe('Webhook Management Flow', () => {
    it('should list webhooks', async () => {
      mockWebhookService.getWebhooks.mockResolvedValue([mockWebhook]);

      const response = await request(app)
        .get('/api/webhooks')
        .expect(200);

      expect(response.body).toHaveProperty('webhooks');
      expect(Array.isArray(response.body.webhooks)).toBe(true);
      expect(response.body).toHaveProperty('availableEvents');
    });

    it('should get a single webhook', async () => {
      mockWebhookService.getWebhook.mockResolvedValue(mockWebhook);

      const response = await request(app)
        .get('/api/webhooks/webhook-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'webhook-123');
    });

    it('should update webhook events', async () => {
      mockWebhookService.updateWebhook.mockResolvedValue({
        ...mockWebhook,
        events: ['risk.created', 'risk.updated', 'control.updated'],
      });

      const response = await request(app)
        .patch('/api/webhooks/webhook-123')
        .send({ events: ['risk.created', 'risk.updated', 'control.updated'] })
        .expect(200);

      expect(response.body.events).toContain('control.updated');
    });

    it('should reject updating a webhook with an invalid event', async () => {
      const response = await request(app)
        .patch('/api/webhooks/webhook-123')
        .send({ events: ['not.a.real.event'] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should test webhook delivery (success)', async () => {
      mockWebhookService.testWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
        duration: 42,
      });

      const response = await request(app)
        .post('/api/webhooks/webhook-123/test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should regenerate webhook secret', async () => {
      mockWebhookService.regenerateSecret.mockResolvedValue('whsec_new_secret');

      const response = await request(app)
        .post('/api/webhooks/webhook-123/regenerate-secret')
        .expect(200);

      expect(response.body).toHaveProperty('secret', 'whsec_new_secret');
    });

    it('should delete webhook', async () => {
      mockWebhookService.deleteWebhook.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/webhooks/webhook-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 for a missing webhook on test', async () => {
      mockWebhookService.testWebhook.mockRejectedValue(new Error('Webhook not found'));

      const response = await request(app)
        .post('/api/webhooks/webhook-999/test')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Webhook Event History', () => {
    it('should get event delivery history', async () => {
      mockWebhookService.getEventHistory.mockResolvedValue({
        events: [
          { id: 'ev-1', eventType: 'risk.created', status: 'delivered' },
          { id: 'ev-2', eventType: 'risk.updated', status: 'failed' },
        ],
        total: 2,
      });

      const response = await request(app)
        .get('/api/webhooks/events/history')
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should retry a failed event', async () => {
      mockWebhookService.retryEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/webhooks/events/ev-2/retry')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Event types', () => {
    it('should list webhook event types', async () => {
      const response = await request(app)
        .get('/api/webhooks/event-types')
        .expect(200);

      expect(response.body).toHaveProperty('eventTypes');
      expect(Array.isArray(response.body.eventTypes)).toBe(true);
    });
  });

  describe('API Key Management', () => {
    it('should create an API key', async () => {
      prismaMock.apiKey.create.mockResolvedValue(mockApiKey as any);

      const response = await request(app)
        .post('/api/webhooks/keys')
        .send({ name: 'Production API Key', scopes: ['read:all'] })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('key'); // raw key returned once
      expect(response.body.key).toMatch(/^cea_/);
    });

    it('should reject creating an API key without scopes', async () => {
      const response = await request(app)
        .post('/api/webhooks/keys')
        .send({ name: 'No Scopes Key' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should list API keys without exposing the hash', async () => {
      prismaMock.apiKey.findMany.mockResolvedValue([mockApiKey] as any);

      const response = await request(app)
        .get('/api/webhooks/keys/list')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).not.toHaveProperty('keyHash');
    });

    it('should revoke an API key', async () => {
      (prismaMock.apiKey as any).updateMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .delete('/api/webhooks/keys/key-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should 404 when revoking a non-existent API key', async () => {
      (prismaMock.apiKey as any).updateMany.mockResolvedValue({ count: 0 });

      const response = await request(app)
        .delete('/api/webhooks/keys/key-999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Incoming Webhooks', () => {
    it('should reject an incoming webhook without a signature header', async () => {
      const response = await request(app)
        .post('/api/webhooks/incoming/org-123/sync-data')
        .send({ data: 'payload' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Integrations Listing', () => {
    it('should list the organization integrations', async () => {
      prismaMock.integration.findMany.mockResolvedValue([
        {
          id: 'int-123',
          name: 'Slack',
          category: 'Communication',
          provider: 'slack',
          connected: true,
          lastSync: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const response = await request(app)
        .get('/api/integrations')
        .expect(200);

      expect(response.body).toHaveProperty('integrations');
      expect(Array.isArray(response.body.integrations)).toBe(true);
    });
  });
});
