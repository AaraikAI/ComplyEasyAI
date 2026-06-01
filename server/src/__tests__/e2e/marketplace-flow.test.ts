/**
 * E2E Tests - Marketplace Integration Flow
 * Tests the complete marketplace integration lifecycle:
 * listing, installing, configuring, testing, and uninstalling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockUser } from '../mocks/prisma';

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
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) {
      next();
      return;
    }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock credential encryption (the marketplace routes use encryptConfigSecrets /
// decryptConfigSecrets, so those must be provided or the handlers throw at runtime).
jest.mock('../../utils/credentialEncryption', () => ({
  encryptField: jest.fn((val: string) => `enc_${val}`),
  decryptField: jest.fn((val: string) => val.replace('enc_', '')),
  encryptConfigFields: jest.fn((obj: any) => obj),
  decryptConfigFields: jest.fn((obj: any) => obj),
  encryptConfigSecrets: jest.fn((obj: any) => obj),
  decryptConfigSecrets: jest.fn((obj: any) => obj),
}));

// Mock the integration registry so the connection-test endpoint returns a
// deterministic result instead of performing a live outbound HTTP call.
jest.mock('../../services/integrations/providers/integrationRegistry', () => ({
  __esModule: true,
  default: {
    initialise: jest.fn().mockResolvedValue(undefined),
    testConnection: jest.fn().mockResolvedValue({ success: true, latencyMs: 42 }),
  },
}));

import marketplaceRoutes from '../../routes/marketplace/marketplaceRoutes';
import { errorHandler } from '../../middleware/errorHandler';
import integrationRegistry from '../../services/integrations/providers/integrationRegistry';

const app = express();
app.use(express.json());

// Inject authenticated user
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@test.com',
  };
  next();
});

app.use('/api/marketplace', marketplaceRoutes);
app.use(errorHandler);

// ============================================================================
// MOCK INTEGRATIONS CATALOG
// ============================================================================

const slackIntegration = {
  id: 'int-slack',
  name: 'Slack',
  slug: 'slack',
  provider: 'slack',
  category: 'communication',
  description: 'Slack integration for notifications',
  connected: true,
  organizationId: 'org-123',
  accessToken: 'xoxb-test-token',
  refreshToken: null,
  config: { channel: '#compliance' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const jiraIntegration = {
  id: 'int-jira',
  name: 'Jira',
  slug: 'jira',
  provider: 'jira',
  category: 'project_management',
  description: 'Jira issue tracking integration',
  connected: false,
  organizationId: 'org-123',
  accessToken: null,
  refreshToken: null,
  config: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('E2E: Marketplace Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Jest is configured with resetMocks:true, which wipes mock implementations
    // before each test — re-establish the registry's deterministic test result.
    (integrationRegistry.initialise as jest.Mock).mockResolvedValue(undefined);
    (integrationRegistry.testConnection as jest.Mock).mockResolvedValue({ success: true, latencyMs: 42 });
  });

  // ============================================================================
  // LISTING INTEGRATIONS
  // ============================================================================

  describe('List Marketplace Integrations', () => {
    it('should list all available integrations', async () => {
      prismaMock.integration.findMany.mockResolvedValue([slackIntegration, jiraIntegration] as any);

      const res = await request(app)
        .get('/api/marketplace');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should filter integrations by category', async () => {
      prismaMock.integration.findMany.mockResolvedValue([slackIntegration] as any);

      const res = await request(app)
        .get('/api/marketplace')
        .query({ category: 'communication' });

      expect(res.status).toBe(200);
    });
  });

  // ============================================================================
  // INSTALLING INTEGRATIONS
  // ============================================================================

  describe('Install Integration', () => {
    it('should install a new integration', async () => {
      // No existing integration found
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.integration.create.mockResolvedValue({
        ...slackIntegration,
        id: 'new-int',
        connected: true,
      } as any);

      const res = await request(app)
        .post('/api/marketplace/slack/install')
        .send({
          config: { webhookUrl: 'https://hooks.slack.com/services/test', defaultChannel: '#alerts' },
        });

      expect(res.status).toBe(201);
      expect(res.body.integration).toBeDefined();
    });

    it('should return conflict for already-installed integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(slackIntegration as any);

      const res = await request(app)
        .post('/api/marketplace/slack/install')
        .send({
          config: { webhookUrl: 'https://hooks.slack.com/services/test' },
        });

      expect(res.status).toBe(409);
    });
  });

  // ============================================================================
  // CONFIGURING INTEGRATIONS
  // ============================================================================

  describe('Configure Integration', () => {
    it('should update integration configuration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(slackIntegration as any);
      prismaMock.integration.update.mockResolvedValue({
        ...slackIntegration,
        config: { channel: '#new-channel', notify: true },
      } as any);

      const res = await request(app)
        .put('/api/marketplace/slack/configure')
        .send({
          config: { channel: '#new-channel', notify: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.integration).toBeDefined();
    });

    it('should return 404 for non-installed integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/marketplace/nonexistent/configure')
        .send({ config: {} });

      expect(res.status).toBe(404);
    });
  });

  // ============================================================================
  // TESTING CONNECTIONS
  // ============================================================================

  describe('Test Integration Connection', () => {
    it('should test a connected integration successfully', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(slackIntegration as any);

      const res = await request(app)
        .post('/api/marketplace/slack/test');

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(true);
      expect(res.body.latencyMs).toBeDefined();
      expect(typeof res.body.latencyMs).toBe('number');
      expect(res.body.message).toBe('Connection successful');
    });

    it('should return 404 when testing non-installed integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/marketplace/nonexistent/test');

      expect(res.status).toBe(404);
    });
  });

  // ============================================================================
  // VIEWING INSTALLED INTEGRATIONS
  // ============================================================================

  describe('View Installed Integrations', () => {
    it('should list installed integrations for the organization', async () => {
      prismaMock.integration.findMany.mockResolvedValue([slackIntegration] as any);

      const res = await request(app)
        .get('/api/marketplace/org/installed');

      expect(res.status).toBe(200);
      expect(res.body.integrations).toBeDefined();
      expect(Array.isArray(res.body.integrations)).toBe(true);
    });
  });

  // ============================================================================
  // UNINSTALLING INTEGRATIONS
  // ============================================================================

  describe('Uninstall Integration', () => {
    it('should uninstall an integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(slackIntegration as any);
      prismaMock.integration.delete.mockResolvedValue(slackIntegration as any);

      const res = await request(app)
        .post('/api/marketplace/slack/uninstall');

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 when uninstalling non-installed integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/marketplace/nonexistent/uninstall');

      expect(res.status).toBe(404);
    });
  });

  // ============================================================================
  // COMPLETE LIFECYCLE
  // ============================================================================

  describe('Complete Integration Lifecycle', () => {
    it('should complete full install → configure → test → uninstall flow', async () => {
      // Reset the shared findFirst mock so persistent return values configured by
      // earlier tests do not bleed into this multi-step flow.
      prismaMock.integration.findFirst.mockReset();

      // Step 1: Install
      prismaMock.integration.findFirst.mockResolvedValueOnce(null); // not installed yet
      prismaMock.integration.create.mockResolvedValue({
        ...slackIntegration,
        id: 'lifecycle-int',
      } as any);

      const installRes = await request(app)
        .post('/api/marketplace/slack/install')
        .send({ config: { webhookUrl: 'https://hooks.slack.com/test' } });

      expect(installRes.status).toBe(201);

      // Step 2: Configure
      const installedIntegration = { ...slackIntegration, id: 'lifecycle-int' };
      prismaMock.integration.findFirst.mockResolvedValueOnce(installedIntegration as any);
      prismaMock.integration.update.mockResolvedValue({
        ...installedIntegration,
        config: { channel: '#configured' },
      } as any);

      const configRes = await request(app)
        .put('/api/marketplace/slack/configure')
        .send({ config: { channel: '#configured' } });

      expect(configRes.status).toBe(200);

      // Step 3: Test connection
      prismaMock.integration.findFirst.mockResolvedValueOnce({
        ...installedIntegration,
        connected: true,
      } as any);

      const testRes = await request(app)
        .post('/api/marketplace/slack/test');

      expect(testRes.status).toBe(200);

      // Step 4: Uninstall
      prismaMock.integration.findFirst.mockResolvedValueOnce(installedIntegration as any);
      prismaMock.integration.delete.mockResolvedValue(installedIntegration as any);

      const uninstallRes = await request(app)
        .post('/api/marketplace/slack/uninstall');

      expect(uninstallRes.status).toBe(200);
    });
  });

  // ============================================================================
  // DETAIL VIEW
  // ============================================================================

  describe('Integration Details', () => {
    it('should get integration details by slug', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(slackIntegration as any);

      const res = await request(app)
        .get('/api/marketplace/slack');

      expect(res.status).toBe(200);
      // Detail view returns catalog info spread with install status
      expect(res.body.slug).toBe('slack');
      expect(res.body.installed).toBe(true);
      expect(res.body.installStatus).toBe('connected');
    });

    it('should return 404 for non-existent integration slug', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/marketplace/nonexistent');

      expect(res.status).toBe(404);
    });
  });
});
