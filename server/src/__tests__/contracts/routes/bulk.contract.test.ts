/**
 * Bulk Operations Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

// The shared prisma mock does not define updateMany for the resource models the
// bulk routes operate on. Augment the mock with the missing delegate methods so
// the routes can exercise updateMany; tests set the resolved value per-case.
for (const model of ['riskItem', 'policy', 'vendor', 'grcIncident', 'asset'] as const) {
  const delegate = (prismaMock as any)[model];
  if (delegate && typeof delegate.updateMany !== 'function') {
    delegate.updateMany = jest.fn();
  }
}

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
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    const userRole = (req as any).user.role?.toLowerCase();
    if (roles.length > 0 && !roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

import bulkRoutes from '../../../routes/bulk';
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
app.use('/api/bulk', bulkRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');

describe('Bulk Operations API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  const validBulkBody = { resourceType: 'risks', resourceIds: ['r-1', 'r-2'] };

  // POST /update
  describe('POST /api/bulk/update', () => {
    it('should bulk update resources', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([{ id: 'r-1' }, { id: 'r-2' }]);
      prismaMock.riskItem.updateMany.mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validBulkBody, updates: { status: 'Closed' } });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('updated');
    });

    it('should return 400 for invalid resourceType', async () => {
      const res = await request(app)
        .post('/api/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resourceType: 'bad', resourceIds: ['r-1'], updates: { status: 'X' } });
      expect(res.status).toBe(400);
    });

    it('should return 400 for empty resourceIds', async () => {
      const res = await request(app)
        .post('/api/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resourceType: 'risks', resourceIds: [], updates: { status: 'X' } });
      expect(res.status).toBe(400);
    });

    it('should return 403 for viewer role', async () => {
      const res = await request(app)
        .post('/api/bulk/update')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ ...validBulkBody, updates: { status: 'X' } });
      expect(res.status).toBe(403);
    });
  });

  // POST /export
  describe('POST /api/bulk/export', () => {
    it('should bulk export resources', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([{ id: 'r-1', title: 'Risk' }]);

      const res = await request(app)
        .post('/api/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBulkBody);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('metadata');
      expect(res.body.data).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/bulk/export').send(validBulkBody);
      expect(res.status).toBe(401);
    });
  });

  // POST /delete (admin only)
  describe('POST /api/bulk/delete', () => {
    it('should soft-delete resources', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([{ id: 'r-1' }]);
      prismaMock.riskItem.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBulkBody);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('deleted');
      expect(res.body.data).toHaveProperty('softDeleteStatus');
    });

    it('should return 403 for non-admin', async () => {
      const editorToken = generateTestToken('user-789', 'org-123', 'editor');
      const res = await request(app)
        .post('/api/bulk/delete')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(validBulkBody);
      expect(res.status).toBe(403);
    });
  });

  // POST /assign
  describe('POST /api/bulk/assign', () => {
    it('should bulk assign resources', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-999', name: 'Assignee', email: 'a@b.com' });
      prismaMock.riskItem.findMany.mockResolvedValue([{ id: 'r-1' }]);
      prismaMock.riskItem.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/bulk/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validBulkBody, assigneeId: 'user-999' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('assigned');
      expect(res.body.data).toHaveProperty('assignee');
    });

    it('should return 400 when assigneeId missing', async () => {
      const res = await request(app)
        .post('/api/bulk/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBulkBody);
      expect(res.status).toBe(400);
    });
  });
});
