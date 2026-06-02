/**
 * Marketplace Routes — Contract Tests
 *
 * Exercises the integrations marketplace router (mounted at /api/marketplace).
 * Covers catalog listing + filtering, integration detail, install lifecycle
 * (success / duplicate / missing-required-config / coming-soon), and auth.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) { next(); return; }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    next();
  },
  AuthRequest: {},
}));

import marketplaceRoutes from '../../../routes/marketplace/marketplaceRoutes';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'test-secret') as any; } catch {}
  }
  next();
});
app.use('/api/marketplace', marketplaceRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Marketplace Routes — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET / (catalog)
  describe('GET /api/marketplace', () => {
    it('should return the catalog enriched with installation state', async () => {
      // "aws" is installed+connected for this org; the rest of the catalog is not installed.
      prismaMock.integration.findMany.mockResolvedValue([
        { provider: 'aws', connected: true },
      ] as any);

      const res = await request(app).get('/api/marketplace').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.integrations)).toBe(true);
      expect(res.body.total).toBe(res.body.integrations.length);
      expect(res.body.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(Array.isArray(res.body.tags)).toBe(true);

      const aws = res.body.integrations.find((i: any) => i.slug === 'aws');
      const jira = res.body.integrations.find((i: any) => i.slug === 'jira');
      expect(aws).toMatchObject({ installed: true, installStatus: 'connected' });
      expect(jira).toMatchObject({ installed: false, installStatus: null });

      // Installation state is resolved per-organization.
      expect(prismaMock.integration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-123' }) }),
      );
    });

    it('should filter the catalog by category', async () => {
      prismaMock.integration.findMany.mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/marketplace?category=Communication')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.integrations.length).toBeGreaterThan(0);
      expect(res.body.integrations.every((i: any) => i.category === 'Communication')).toBe(true);
      // Slack + Microsoft Teams are the Communication connectors in the catalog.
      const slugs = res.body.integrations.map((i: any) => i.slug);
      expect(slugs).toContain('slack');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/marketplace');
      expect(res.status).toBe(401);
    });
  });

  // GET /:slug (detail)
  describe('GET /api/marketplace/:slug', () => {
    it('should return integration detail with install state', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/api/marketplace/github').set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ slug: 'github', name: 'GitHub', installed: false });
      expect(res.body).toHaveProperty('configSchema');
    });

    it('should return 404 for an unknown integration slug', async () => {
      const res = await request(app).get('/api/marketplace/does-not-exist').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // POST /:slug/install
  describe('POST /api/marketplace/:slug/install', () => {
    it('should install an integration when required config is supplied', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null); // not yet installed
      prismaMock.integration.create.mockResolvedValue({ id: 'int-new', provider: 'slack', connected: true } as any);

      const res = await request(app)
        .post('/api/marketplace/slack/install')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' } });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('integration');
      // Persisted under the caller's org with the marketplace slug as provider.
      expect(prismaMock.integration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ provider: 'slack', organizationId: 'org-123' }),
        }),
      );
    });

    it('should return 400 when a required config field is missing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      // Slack requires webhookUrl; omitting it must be rejected before any DB write.
      const res = await request(app)
        .post('/api/marketplace/slack/install')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ config: {} });

      expect(res.status).toBe(400);
      expect(prismaMock.integration.create).not.toHaveBeenCalled();
    });

    it('should return 409 when the integration is already installed', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-1', provider: 'slack' } as any);

      const res = await request(app)
        .post('/api/marketplace/slack/install')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' } });

      expect(res.status).toBe(409);
      expect(prismaMock.integration.create).not.toHaveBeenCalled();
    });

    it('should return 404 when installing an unknown integration', async () => {
      const res = await request(app)
        .post('/api/marketplace/does-not-exist/install')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ config: {} });

      expect(res.status).toBe(404);
    });
  });

  // POST /:slug/uninstall
  describe('POST /api/marketplace/:slug/uninstall', () => {
    it('should uninstall an installed integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-1', provider: 'slack' } as any);
      prismaMock.integration.delete.mockResolvedValue({ id: 'int-1' } as any);

      const res = await request(app)
        .post('/api/marketplace/slack/uninstall')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(prismaMock.integration.delete).toHaveBeenCalledWith({ where: { id: 'int-1' } });
    });

    it('should return 404 when the integration is not installed', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/marketplace/slack/uninstall')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(prismaMock.integration.delete).not.toHaveBeenCalled();
    });
  });
});
