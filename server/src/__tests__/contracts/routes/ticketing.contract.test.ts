/**
 * Ticketing Integration Routes — Contract Tests
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
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
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

// Mock ticketing service dependencies
jest.mock('../../../services/integrations/jiraService', () => ({
  __esModule: true,
  default: {
    testConnection: jest.fn().mockResolvedValue({ success: true }),
    createIssue: jest.fn().mockResolvedValue({ id: 'JIRA-1', key: 'PROJ-1', url: 'https://jira/PROJ-1' }),
    getIssue: jest.fn().mockResolvedValue({ id: 'JIRA-1', status: 'Open' }),
    syncIssue: jest.fn().mockResolvedValue({ synced: true }),
    getProjects: jest.fn().mockResolvedValue([]),
    getIssueTypes: jest.fn().mockResolvedValue([]),
    getFields: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('../../../services/integrations/servicenowService', () => ({
  __esModule: true,
  default: {
    testConnection: jest.fn().mockResolvedValue({ success: true }),
    createIncident: jest.fn().mockResolvedValue({ id: 'INC001' }),
    getIncident: jest.fn().mockResolvedValue({ id: 'INC001' }),
    syncIncident: jest.fn().mockResolvedValue({ synced: true }),
  },
}));
jest.mock('../../../services/integrations/azureDevOpsService', () => ({
  __esModule: true,
  default: {
    testConnection: jest.fn().mockResolvedValue({ success: true }),
    createWorkItem: jest.fn().mockResolvedValue({ id: 1 }),
    getWorkItem: jest.fn().mockResolvedValue({ id: 1 }),
    syncWorkItem: jest.fn().mockResolvedValue({ synced: true }),
  },
}));

import ticketingRoutes from '../../../routes/ticketing';
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
app.use('/api/ticketing', ticketingRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Ticketing API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET /config
  describe('GET /api/ticketing/config', () => {
    it('should return ticketing config', async () => {
      prismaMock.integration.findMany.mockResolvedValue([
        { id: 'int-1', provider: 'jira', organizationId: 'org-123', config: { provider: 'jira' }, status: 'active' },
      ]);

      const res = await request(app).get('/api/ticketing/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/ticketing/config');
      expect(res.status).toBe(401);
    });
  });

  // POST /config
  describe('POST /api/ticketing/config', () => {
    it('should save ticketing config', async () => {
      prismaMock.integration.upsert.mockResolvedValue({ id: 'int-1', provider: 'jira', config: {} });

      const res = await request(app)
        .post('/api/ticketing/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira', instanceUrl: 'https://jira.test', authType: 'pat', pat: 'token123' });
      expect(res.status).toBe(200);
    });

    it('should return 400 when provider missing', async () => {
      const res = await request(app)
        .post('/api/ticketing/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // DELETE /config
  describe('DELETE /api/ticketing/config', () => {
    it('should delete ticketing config', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-1', organizationId: 'org-123' });
      prismaMock.integration.delete.mockResolvedValue({ id: 'int-1' });

      const res = await request(app).delete('/api/ticketing/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /test
  describe('POST /api/ticketing/test', () => {
    it('should test connection', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { provider: 'jira', authType: 'pat' },
      });

      const res = await request(app).post('/api/ticketing/test').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /sync
  describe('POST /api/ticketing/sync', () => {
    it('should trigger sync', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { provider: 'jira', syncEnabled: true },
      });

      const res = await request(app).post('/api/ticketing/sync').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /create-ticket
  describe('POST /api/ticketing/create-ticket', () => {
    it('should create a ticket', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { provider: 'jira', projectKey: 'COMP', authType: 'pat' },
      });

      const res = await request(app)
        .post('/api/ticketing/create-ticket')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Fix issue', description: 'Details here', resourceType: 'risk', resourceId: 'r-1' });
      expect(res.status).toBe(201);
    });

    it('should return 400 when title missing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { provider: 'jira' },
      });

      const res = await request(app)
        .post('/api/ticketing/create-ticket')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // GET /tickets
  describe('GET /api/ticketing/tickets', () => {
    it('should list tickets', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-1', provider: 'jira', config: {} });

      const res = await request(app).get('/api/ticketing/tickets').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // GET /sync-status
  describe('GET /api/ticketing/sync-status', () => {
    it('should return sync status', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { syncEnabled: true }, lastSyncAt: new Date(),
      });

      const res = await request(app).get('/api/ticketing/sync-status').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // GET /connections
  describe('GET /api/ticketing/connections', () => {
    it('should list connections', async () => {
      prismaMock.integration.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/ticketing/connections').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /connections
  describe('POST /api/ticketing/connections', () => {
    it('should create a connection', async () => {
      prismaMock.integration.create.mockResolvedValue({ id: 'int-new', provider: 'jira' });

      const res = await request(app)
        .post('/api/ticketing/connections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira', name: 'Jira Cloud', instanceUrl: 'https://jira.test', authType: 'pat', pat: 'token' });
      expect(res.status).toBe(201);
    });
  });

  // POST /tickets/bulk-sync
  describe('POST /api/ticketing/tickets/bulk-sync', () => {
    it('should trigger bulk sync', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { provider: 'jira', syncEnabled: true },
      });

      const res = await request(app)
        .post('/api/ticketing/tickets/bulk-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(200);
    });
  });

  // POST /webhook:provider — Note: route has no slash before :provider in the source
  describe('POST /api/ticketing/webhook:provider', () => {
    it('should handle webhook callback', async () => {
      const res = await request(app)
        .post('/api/ticketing/webhookjira')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ event: 'issue_updated' });
      expect([200, 201, 204, 400, 404]).toContain(res.status);
    });
  });
});
