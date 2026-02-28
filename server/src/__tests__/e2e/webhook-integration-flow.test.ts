/**
 * E2E Tests - Webhook & Integration Flow
 * Tests complete integration workflows including webhooks, API keys,
 * third-party connections, and event handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';
import crypto from 'crypto';

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
    active: true,
    organizationId: 'org-123',
    createdAt: new Date(),
  };

  const mockApiKey = {
    id: 'key-123',
    name: 'Production API Key',
    keyHash: crypto.createHash('sha256').update('cea_test_key').digest('hex'),
    prefix: 'cea_prod_',
    scopes: ['*'],
    organizationId: 'org-123',
    createdAt: new Date(),
  };

  const mockIntegration = {
    id: 'int-123',
    type: 'slack',
    name: 'Slack Notifications',
    config: { webhookUrl: 'https://hooks.slack.com/services/xxx' },
    status: 'Active',
    organizationId: 'org-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Management Flow', () => {
    it('should create webhook endpoint', async () => {
      prismaMock.webhook.create.mockResolvedValue(mockWebhook as any);

      const response = await request(app)
        .post('/api/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['risk.created', 'risk.updated'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('secret');
    });

    it('should list webhooks', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([mockWebhook] as any);

      const response = await request(app)
        .get('/api/webhooks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update webhook events', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook as any);
      prismaMock.webhook.update.mockResolvedValue({
        ...mockWebhook,
        events: ['risk.created', 'risk.updated', 'control.created'],
      } as any);

      const response = await request(app)
        .patch('/api/webhooks/webhook-123')
        .send({
          events: ['risk.created', 'risk.updated', 'control.created'],
        })
        .expect(200);

      expect(response.body.events).toContain('control.created');
    });

    it('should test webhook delivery', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook as any);

      const response = await request(app)
        .post('/api/webhooks/webhook-123/test')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('should regenerate webhook secret', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook as any);
      prismaMock.webhook.update.mockResolvedValue({
        ...mockWebhook,
        secret: 'whsec_new_secret',
      } as any);

      const response = await request(app)
        .post('/api/webhooks/webhook-123/regenerate-secret')
        .expect(200);

      expect(response.body).toHaveProperty('newSecret');
    });

    it('should delete webhook', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook as any);
      prismaMock.webhook.delete.mockResolvedValue(mockWebhook as any);

      const response = await request(app)
        .delete('/api/webhooks/webhook-123')
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });
  });

  describe('Webhook Event History', () => {
    it('should get event delivery history', async () => {
      prismaMock.webhookEvent.findMany.mockResolvedValue([
        {
          id: 'ev-1',
          webhookId: 'webhook-123',
          eventType: 'risk.created',
          status: 'delivered',
          deliveredAt: new Date(),
        },
        {
          id: 'ev-2',
          webhookId: 'webhook-123',
          eventType: 'risk.updated',
          status: 'failed',
          attempts: 3,
        },
      ] as any);

      const response = await request(app)
        .get('/api/webhooks/events/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should retry failed event', async () => {
      prismaMock.webhookEvent.findFirst.mockResolvedValue({
        id: 'ev-2',
        status: 'failed',
        payload: { riskId: 'r-123' },
      } as any);
      prismaMock.webhookEvent.update.mockResolvedValue({
        id: 'ev-2',
        status: 'pending',
      } as any);

      const response = await request(app)
        .post('/api/webhooks/events/ev-2/retry')
        .expect(200);

      expect(response.body).toHaveProperty('retried', true);
    });
  });

  describe('API Key Management', () => {
    it('should create API key', async () => {
      prismaMock.apiKey.create.mockResolvedValue(mockApiKey as any);

      const response = await request(app)
        .post('/api/webhooks/keys')
        .send({
          name: 'Production API Key',
          scopes: ['read:all', 'write:risks'],
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('key');
    });

    it('should list API keys', async () => {
      prismaMock.apiKey.findMany.mockResolvedValue([mockApiKey] as any);

      const response = await request(app)
        .get('/api/webhooks/keys/list')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).not.toHaveProperty('keyHash'); // Secret not exposed
    });

    it('should revoke API key', async () => {
      prismaMock.apiKey.findFirst.mockResolvedValue(mockApiKey as any);
      prismaMock.apiKey.update.mockResolvedValue({
        ...mockApiKey,
        revokedAt: new Date(),
      } as any);

      const response = await request(app)
        .delete('/api/webhooks/keys/key-123')
        .expect(200);

      expect(response.body).toHaveProperty('revoked', true);
    });
  });

  describe('Third-Party Integrations', () => {
    it('should list available integrations', async () => {
      const response = await request(app)
        .get('/api/integrations/available')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should connect Slack integration', async () => {
      prismaMock.integration.create.mockResolvedValue(mockIntegration as any);

      const response = await request(app)
        .post('/api/integrations/slack')
        .send({
          webhookUrl: 'https://hooks.slack.com/services/xxx',
          channel: '#compliance-alerts',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('slack');
    });

    it('should connect Jira integration', async () => {
      prismaMock.integration.create.mockResolvedValue({
        ...mockIntegration,
        id: 'int-124',
        type: 'jira',
        config: { domain: 'company.atlassian.net', projectKey: 'COMP' },
      } as any);

      const response = await request(app)
        .post('/api/integrations/jira')
        .send({
          domain: 'company.atlassian.net',
          email: 'admin@example.com',
          apiToken: 'jira-token',
          projectKey: 'COMP',
        })
        .expect(201);

      expect(response.body.type).toBe('jira');
    });

    it('should test integration connection', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(mockIntegration as any);

      const response = await request(app)
        .post('/api/integrations/int-123/test')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should sync integration data', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        ...mockIntegration,
        type: 'jira',
      } as any);

      const response = await request(app)
        .post('/api/integrations/int-123/sync')
        .expect(200);

      expect(response.body).toHaveProperty('syncedCount');
    });

    it('should disconnect integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(mockIntegration as any);
      prismaMock.integration.delete.mockResolvedValue(mockIntegration as any);

      const response = await request(app)
        .delete('/api/integrations/int-123')
        .expect(200);

      expect(response.body).toHaveProperty('disconnected', true);
    });
  });

  describe('Zapier Integration', () => {
    it('should verify Zapier authentication', async () => {
      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey as any);
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        name: 'Test Org',
      } as any);

      const response = await request(app)
        .get('/api/webhooks/zapier/auth')
        .set('x-api-key', 'cea_test_key')
        .expect(200);

      expect(response.body).toHaveProperty('authenticated', true);
    });

    it('should create Zapier subscription', async () => {
      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey as any);
      prismaMock.zapierSubscription.create.mockResolvedValue({
        id: 'sub-123',
        hookUrl: 'https://hooks.zapier.com/1234567',
        event: 'risk.created',
      } as any);

      const response = await request(app)
        .post('/api/webhooks/zapier/subscribe')
        .set('x-api-key', 'cea_test_key')
        .send({
          hookUrl: 'https://hooks.zapier.com/1234567',
          event: 'risk.created',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should get sample data for Zapier', async () => {
      prismaMock.apiKey.findUnique.mockResolvedValue(mockApiKey as any);

      const response = await request(app)
        .get('/api/webhooks/zapier/sample/risk.created')
        .set('x-api-key', 'cea_test_key')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Incoming Webhooks', () => {
    it('should receive incoming webhook', async () => {
      prismaMock.incomingWebhook.findFirst.mockResolvedValue({
        id: 'inc-123',
        organizationId: 'org-123',
        action: 'sync-data',
        active: true,
      } as any);

      const response = await request(app)
        .post('/api/webhooks/incoming/org-123/sync-data')
        .send({ data: 'payload' })
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });

    it('should validate incoming webhook signature', async () => {
      const payload = JSON.stringify({ event: 'test' });
      const secret = 'webhook-secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      prismaMock.incomingWebhook.findFirst.mockResolvedValue({
        id: 'inc-123',
        secret,
        active: true,
      } as any);

      const response = await request(app)
        .post('/api/webhooks/incoming/org-123/verify-event')
        .set('x-webhook-signature', `sha256=${signature}`)
        .send(JSON.parse(payload))
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });
  });

  describe('Integration Dashboard', () => {
    it('should get integration status overview', async () => {
      prismaMock.integration.findMany.mockResolvedValue([mockIntegration] as any);
      prismaMock.webhook.findMany.mockResolvedValue([mockWebhook] as any);

      const response = await request(app)
        .get('/api/integrations/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('integrations');
      expect(response.body).toHaveProperty('webhooks');
    });
  });
});
