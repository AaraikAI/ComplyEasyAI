/**
 * Webhook Routes Integration Tests
 *
 * Tests for webhook management, API key management, Zapier integration, and event handling.
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

// Mock webhook controller
jest.mock('../../../controllers/webhookController', () => ({
  __esModule: true,
  default: {
    getEventTypes: jest.fn().mockImplementation((req, res) => {
      res.json({
        eventTypes: [
          { name: 'policy.created', description: 'Policy was created' },
          { name: 'policy.updated', description: 'Policy was updated' },
          { name: 'incident.created', description: 'Incident was created' },
          { name: 'risk.identified', description: 'Risk was identified' },
        ],
      });
    }),
    getWebhooks: jest.fn().mockImplementation((req, res) => {
      res.json([
        {
          id: 'webhook-123',
          url: 'https://example.com/webhook',
          events: ['policy.created', 'incident.created'],
          active: true,
        },
      ]);
    }),
    getWebhook: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.webhookId,
        url: 'https://example.com/webhook',
        events: ['policy.created'],
        active: true,
      });
    }),
    createWebhook: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'webhook-new',
        url: req.body.url,
        events: req.body.events,
        active: true,
        secret: 'whsec_test_secret',
      });
    }),
    updateWebhook: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.webhookId,
        ...req.body,
        updated: true,
      });
    }),
    deleteWebhook: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, id: req.params.webhookId });
    }),
    testWebhook: jest.fn().mockImplementation((req, res) => {
      res.json({
        success: true,
        webhookId: req.params.webhookId,
        response: { status: 200, body: 'OK' },
      });
    }),
    regenerateSecret: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.webhookId,
        newSecret: 'whsec_new_secret',
      });
    }),
    getEventHistory: jest.fn().mockImplementation((req, res) => {
      res.json([
        {
          id: 'event-1',
          webhookId: 'webhook-123',
          eventType: 'policy.created',
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        },
        {
          id: 'event-2',
          webhookId: 'webhook-123',
          eventType: 'incident.created',
          status: 'failed',
          attempts: 3,
        },
      ]);
    }),
    retryEvent: jest.fn().mockImplementation((req, res) => {
      res.json({
        eventId: req.params.eventId,
        retried: true,
        status: 'pending',
      });
    }),
    getApiKeys: jest.fn().mockImplementation((req, res) => {
      res.json([
        {
          id: 'key-123',
          name: 'Production API Key',
          prefix: 'cea_prod_',
          scopes: ['*'],
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
        },
      ]);
    }),
    createApiKey: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'key-new',
        name: req.body.name,
        key: 'cea_test_fullkey_abc123',
        scopes: req.body.scopes,
        expiresAt: req.body.expiresAt,
      });
    }),
    revokeApiKey: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.keyId,
        revoked: true,
        revokedAt: new Date().toISOString(),
      });
    }),
    zapierAuthTest: jest.fn().mockImplementation((req, res) => {
      res.json({
        authenticated: true,
        organizationId: req.user.organizationId,
        organizationName: 'Test Org',
      });
    }),
    zapierSubscribe: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'sub-123',
        hookUrl: req.body.hookUrl,
        event: req.body.event,
      });
    }),
    zapierUnsubscribe: jest.fn().mockImplementation((req, res) => {
      res.json({ unsubscribed: true, id: req.params.id });
    }),
    zapierSampleData: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'sample-1', type: req.params.event, data: { sample: true } },
      ]);
    }),
    receiveIncomingWebhook: jest.fn().mockImplementation((req, res) => {
      res.json({ received: true, action: req.params.action });
    }),
  },
}));

// Setup app once (controller is fully mocked, no need to re-import per test)
let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const webhookRoutes = (await import('../../../routes/webhooks')).default;
  app.use('/api/webhooks', webhookRoutes);

  // Error handler so AppError responses are returned as JSON for assertions
  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();

  // Ensure apiKey.update returns a thenable (used as fire-and-forget in authenticateApiKey)
  prismaMock.apiKey.update.mockResolvedValue({} as any);

  // Re-setup controller mocks after clearAllMocks
  const controller = require('../../../controllers/webhookController').default;
  controller.getEventTypes.mockImplementation((_req: any, res: any) => {
    res.json({ eventTypes: [{ name: 'policy.created', description: 'Policy was created' }, { name: 'policy.updated', description: 'Policy was updated' }, { name: 'incident.created', description: 'Incident was created' }, { name: 'risk.identified', description: 'Risk was identified' }] });
  });
  controller.getWebhooks.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'webhook-123', url: 'https://example.com/webhook', events: ['policy.created', 'incident.created'], active: true }]);
  });
  controller.getWebhook.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.webhookId, url: 'https://example.com/webhook', events: ['policy.created'], active: true });
  });
  controller.createWebhook.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'webhook-new', url: req.body.url, events: req.body.events, active: true, secret: 'whsec_test_secret' });
  });
  controller.updateWebhook.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.webhookId, ...req.body, updated: true });
  });
  controller.deleteWebhook.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, id: req.params.webhookId });
  });
  controller.testWebhook.mockImplementation((req: any, res: any) => {
    res.json({ success: true, webhookId: req.params.webhookId, response: { status: 200, body: 'OK' } });
  });
  controller.regenerateSecret.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.webhookId, newSecret: 'whsec_new_secret' });
  });
  controller.getEventHistory.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'event-1', webhookId: 'webhook-123', eventType: 'policy.created', status: 'delivered', deliveredAt: new Date().toISOString() }, { id: 'event-2', webhookId: 'webhook-123', eventType: 'incident.created', status: 'failed', attempts: 3 }]);
  });
  controller.retryEvent.mockImplementation((req: any, res: any) => {
    res.json({ eventId: req.params.eventId, retried: true, status: 'pending' });
  });
  controller.getApiKeys.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'key-123', name: 'Production API Key', prefix: 'cea_prod_', scopes: ['*'], createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString() }]);
  });
  controller.createApiKey.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'key-new', name: req.body.name, key: 'cea_test_fullkey_abc123', scopes: req.body.scopes, expiresAt: req.body.expiresAt });
  });
  controller.revokeApiKey.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.keyId, revoked: true, revokedAt: new Date().toISOString() });
  });
  controller.zapierAuthTest.mockImplementation((req: any, res: any) => {
    res.json({ authenticated: true, organizationId: req.user.organizationId, organizationName: 'Test Org' });
  });
  controller.zapierSubscribe.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'sub-123', hookUrl: req.body.hookUrl, event: req.body.event });
  });
  controller.zapierUnsubscribe.mockImplementation((req: any, res: any) => {
    res.json({ unsubscribed: true, id: req.params.id });
  });
  controller.zapierSampleData.mockImplementation((req: any, res: any) => {
    res.json([{ id: 'sample-1', type: req.params.event, data: { sample: true } }]);
  });
  controller.receiveIncomingWebhook.mockImplementation((req: any, res: any) => {
    res.json({ received: true, action: req.params.action });
  });
});

describe('Webhook Routes Integration', () => {
  // ===========================================================================
  // Public Endpoints Tests
  // ===========================================================================
  describe('Public Endpoints', () => {
    describe('GET /api/webhooks/event-types', () => {
      it('should return available event types', async () => {
        const response = await request(app)
          .get('/api/webhooks/event-types')
          .expect(200);

        expect(response.body).toHaveProperty('eventTypes');
        expect(Array.isArray(response.body.eventTypes)).toBe(true);
        expect(response.body.eventTypes.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // Incoming Webhook Tests
  // ===========================================================================
  describe('Incoming Webhooks', () => {
    describe('POST /api/webhooks/incoming/:organizationId/:action', () => {
      it('should receive incoming webhook', async () => {
        const webhookSecret = 'whsec_test_incoming_secret';
        prismaMock.webhook.findFirst.mockResolvedValue({
          id: 'webhook-incoming',
          secret: webhookSecret,
          organizationId: 'org-123',
          enabled: true,
        } as any);

        const payload = { event: 'sync.requested', data: { value: 'test' } };
        const rawBody = JSON.stringify(payload);
        const signature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');

        const response = await request(app)
          .post('/api/webhooks/incoming/org-123/sync-data')
          .set('x-webhook-signature', signature)
          .send(payload)
          .expect(200);

        expect(response.body).toHaveProperty('received', true);
        expect(response.body.action).toBe('sync-data');
      });
    });
  });

  // ===========================================================================
  // Webhook Management Tests (Authenticated)
  // ===========================================================================
  describe('Webhook Management', () => {
    describe('GET /api/webhooks', () => {
      it('should list all webhooks', async () => {
        const response = await request(app)
          .get('/api/webhooks')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/webhooks/:webhookId', () => {
      it('should get single webhook', async () => {
        const response = await request(app)
          .get('/api/webhooks/webhook-123')
          .expect(200);

        expect(response.body).toHaveProperty('id', 'webhook-123');
        expect(response.body).toHaveProperty('url');
        expect(response.body).toHaveProperty('events');
      });
    });

    describe('POST /api/webhooks', () => {
      it('should create new webhook', async () => {
        const response = await request(app)
          .post('/api/webhooks')
          .send({
            url: 'https://newservice.com/webhook',
            events: ['policy.created', 'risk.identified'],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('secret');
        expect(response.body.url).toBe('https://newservice.com/webhook');
      });
    });

    describe('PATCH /api/webhooks/:webhookId', () => {
      it('should update webhook', async () => {
        const response = await request(app)
          .patch('/api/webhooks/webhook-123')
          .send({
            events: ['policy.created', 'policy.updated'],
            enabled: false,
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
      });
    });

    describe('DELETE /api/webhooks/:webhookId', () => {
      it('should delete webhook', async () => {
        const response = await request(app)
          .delete('/api/webhooks/webhook-123')
          .expect(200);

        expect(response.body).toHaveProperty('deleted', true);
      });
    });

    describe('POST /api/webhooks/:webhookId/test', () => {
      it('should test webhook delivery', async () => {
        const response = await request(app)
          .post('/api/webhooks/webhook-123/test')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('response');
      });
    });

    describe('POST /api/webhooks/:webhookId/regenerate-secret', () => {
      it('should regenerate webhook secret', async () => {
        const response = await request(app)
          .post('/api/webhooks/webhook-123/regenerate-secret')
          .expect(200);

        expect(response.body).toHaveProperty('newSecret');
      });
    });
  });

  // ===========================================================================
  // Event History Tests
  // ===========================================================================
  describe('Event History', () => {
    describe('GET /api/webhooks/events/history', () => {
      it('should return event delivery history', async () => {
        const response = await request(app)
          .get('/api/webhooks/events/history')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/webhooks/events/:eventId/retry', () => {
      it('should retry failed event delivery', async () => {
        const response = await request(app)
          .post('/api/webhooks/events/event-2/retry')
          .expect(200);

        expect(response.body).toHaveProperty('retried', true);
        expect(response.body.status).toBe('pending');
      });
    });
  });

  // ===========================================================================
  // API Key Management Tests
  // ===========================================================================
  describe('API Key Management', () => {
    describe('GET /api/webhooks/keys/list', () => {
      it('should list all API keys', async () => {
        const response = await request(app)
          .get('/api/webhooks/keys/list')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/webhooks/keys', () => {
      it('should create new API key', async () => {
        const response = await request(app)
          .post('/api/webhooks/keys')
          .send({
            name: 'New API Key',
            scopes: ['webhook:manage', 'read:all'],
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('key');
        expect(response.body.name).toBe('New API Key');
      });
    });

    describe('DELETE /api/webhooks/keys/:keyId', () => {
      it('should revoke API key', async () => {
        const response = await request(app)
          .delete('/api/webhooks/keys/key-123')
          .expect(200);

        expect(response.body).toHaveProperty('revoked', true);
        expect(response.body).toHaveProperty('revokedAt');
      });
    });
  });

  // ===========================================================================
  // Zapier Integration Tests
  // ===========================================================================
  describe('Zapier Integration', () => {
    describe('GET /api/webhooks/zapier/auth', () => {
      it('should verify Zapier authentication', async () => {
        // Need to set API key header for Zapier routes
        const mockApiKey = 'cea_test_key';
        const keyHash = crypto.createHash('sha256').update(mockApiKey).digest('hex');

        prismaMock.apiKey.findUnique.mockResolvedValue({
          id: 'key-123',
          keyHash,
          organizationId: 'org-123',
          createdBy: 'user-123',
          scopes: ['*'],
          rateLimit: 1000,
          revokedAt: null,
          expiresAt: null,
        } as any);

        prismaMock.organization.findUnique.mockResolvedValue({
          id: 'org-123',
          name: 'Test Org',
        } as any);

        const response = await request(app)
          .get('/api/webhooks/zapier/auth')
          .set('x-api-key', mockApiKey)
          .expect(200);

        expect(response.body).toHaveProperty('authenticated', true);
      });
    });

    describe('POST /api/webhooks/zapier/subscribe', () => {
      it('should create Zapier subscription', async () => {
        const mockApiKey = 'cea_test_key';
        const keyHash = crypto.createHash('sha256').update(mockApiKey).digest('hex');

        prismaMock.apiKey.findUnique.mockResolvedValue({
          id: 'key-123',
          keyHash,
          organizationId: 'org-123',
          createdBy: 'user-123',
          scopes: ['*'],
          rateLimit: 1000,
          revokedAt: null,
          expiresAt: null,
        } as any);

        prismaMock.organization.findUnique.mockResolvedValue({
          id: 'org-123',
          name: 'Test Org',
        } as any);

        const response = await request(app)
          .post('/api/webhooks/zapier/subscribe')
          .set('x-api-key', mockApiKey)
          .send({
            hookUrl: 'https://hooks.zapier.com/1234567',
            event: 'policy.created',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('hookUrl');
      });
    });

    describe('DELETE /api/webhooks/zapier/subscribe/:id', () => {
      it('should remove Zapier subscription', async () => {
        const mockApiKey = 'cea_test_key';
        const keyHash = crypto.createHash('sha256').update(mockApiKey).digest('hex');

        prismaMock.apiKey.findUnique.mockResolvedValue({
          id: 'key-123',
          keyHash,
          organizationId: 'org-123',
          createdBy: 'user-123',
          scopes: ['*'],
          rateLimit: 1000,
          revokedAt: null,
          expiresAt: null,
        } as any);

        prismaMock.organization.findUnique.mockResolvedValue({
          id: 'org-123',
          name: 'Test Org',
        } as any);

        const response = await request(app)
          .delete('/api/webhooks/zapier/subscribe/sub-123')
          .set('x-api-key', mockApiKey)
          .expect(200);

        expect(response.body).toHaveProperty('unsubscribed', true);
      });
    });

    describe('GET /api/webhooks/zapier/sample/:event', () => {
      it('should return sample data for event', async () => {
        const mockApiKey = 'cea_test_key';
        const keyHash = crypto.createHash('sha256').update(mockApiKey).digest('hex');

        prismaMock.apiKey.findUnique.mockResolvedValue({
          id: 'key-123',
          keyHash,
          organizationId: 'org-123',
          createdBy: 'user-123',
          scopes: ['*'],
          rateLimit: 1000,
          revokedAt: null,
          expiresAt: null,
        } as any);

        prismaMock.organization.findUnique.mockResolvedValue({
          id: 'org-123',
          name: 'Test Org',
        } as any);

        const response = await request(app)
          .get('/api/webhooks/zapier/sample/policy.created')
          .set('x-api-key', mockApiKey)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });
});
