/**
 * RoPA Routes — Contract Tests
 * 8 endpoints: statistics, export, list, create, get, update, delete, review
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const mockPrisma: any = {
  processingActivityRecord: {
    findMany: jest.fn<any>().mockResolvedValue([]),
    findFirst: jest.fn<any>().mockResolvedValue(null),
    count: jest.fn<any>().mockResolvedValue(0),
    create: jest.fn<any>().mockResolvedValue({ id: 'rec-1', activityName: 'Test', status: 'Active' }),
    update: jest.fn<any>().mockResolvedValue({ id: 'rec-1', status: 'Active' }),
  },
};

jest.mock('../../../config/database', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
jest.mock('../../../utils/pick', () => ({
  pick: (obj: any, keys: string[]) => {
    const result: any = {};
    keys.forEach((k) => { if (obj[k] !== undefined) result[k] = obj[k]; });
    return result;
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) return next();
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) return res.status(401).json({ error: 'Authentication required' });
    next();
  },
  AuthRequest: {},
}));

import ropaRoutes from '../../../routes/ropa';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], 'test-secret'); } catch { /* no-op */ }
  }
  next();
});
app.use('/api/ropa', ropaRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('RoPA Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');

  beforeEach(() => jest.clearAllMocks());

  // ── Statistics ───────────────────────────────────────────────────

  describe('GET /api/ropa/statistics', () => {
    it('returns 200 with stats', async () => {
      mockPrisma.processingActivityRecord.findMany.mockResolvedValueOnce([]);
      const res = await request(app).get('/api/ropa/statistics').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/ropa/statistics');
      expect(res.status).toBe(401);
    });
  });

  // ── Export ───────────────────────────────────────────────────────

  describe('GET /api/ropa/export', () => {
    it('returns 200 JSON export', async () => {
      mockPrisma.processingActivityRecord.findMany.mockResolvedValueOnce([]);
      const res = await request(app).get('/api/ropa/export').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metadata');
    });

    it('returns 200 CSV export', async () => {
      mockPrisma.processingActivityRecord.findMany.mockResolvedValueOnce([]);
      const res = await request(app).get('/api/ropa/export?format=csv').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ── List Records ─────────────────────────────────────────────────

  describe('GET /api/ropa/', () => {
    it('returns 200 with paginated list', async () => {
      mockPrisma.processingActivityRecord.findMany.mockResolvedValueOnce([]);
      mockPrisma.processingActivityRecord.count.mockResolvedValueOnce(0);
      const res = await request(app).get('/api/ropa/').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('records');
      expect(res.body).toHaveProperty('totalPages');
    });
  });

  // ── Create Record ────────────────────────────────────────────────

  describe('POST /api/ropa/', () => {
    it('returns 201 with valid payload', async () => {
      const res = await request(app)
        .post('/api/ropa/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activityName: 'Employee HR Processing', lawfulBasis: 'LegitimateInterest' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when activityName missing', async () => {
      const res = await request(app)
        .post('/api/ropa/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lawfulBasis: 'Consent' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when lawfulBasis missing', async () => {
      const res = await request(app)
        .post('/api/ropa/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activityName: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  // ── Get by ID ────────────────────────────────────────────────────

  describe('GET /api/ropa/:id', () => {
    it('returns 200 when found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce({ id: 'rec-1' });
      const res = await request(app).get('/api/ropa/rec-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/ropa/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Update ───────────────────────────────────────────────────────

  describe('PATCH /api/ropa/:id', () => {
    it('returns 200 when found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce({ id: 'rec-1' });
      mockPrisma.processingActivityRecord.update.mockResolvedValueOnce({ id: 'rec-1', activityName: 'Updated' });
      const res = await request(app)
        .patch('/api/ropa/rec-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activityName: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/ropa/missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activityName: 'Updated' });
      expect(res.status).toBe(404);
    });
  });

  // ── Delete (Archive) ─────────────────────────────────────────────

  describe('DELETE /api/ropa/:id', () => {
    it('returns 200 when found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce({ id: 'rec-1' });
      mockPrisma.processingActivityRecord.update.mockResolvedValueOnce({ id: 'rec-1', status: 'Archived' });
      const res = await request(app).delete('/api/ropa/rec-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('archived');
    });

    it('returns 404 when not found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).delete('/api/ropa/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Review ───────────────────────────────────────────────────────

  describe('POST /api/ropa/:id/review', () => {
    it('returns 200 when found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce({ id: 'rec-1' });
      mockPrisma.processingActivityRecord.update.mockResolvedValueOnce({ id: 'rec-1', status: 'Active' });
      const res = await request(app)
        .post('/api/ropa/rec-1/review')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.processingActivityRecord.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/ropa/missing/review')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
