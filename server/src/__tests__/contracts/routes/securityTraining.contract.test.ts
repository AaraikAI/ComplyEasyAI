/**
 * Security Training Routes — Contract Tests
 * 11 endpoints: compliance-report, records list, user records, list modules,
 * create, get/:id, update/:id, delete/:id, assign, assign-all, update record
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const mockPrisma: any = {
  securityTraining: {
    findMany: jest.fn<any>().mockResolvedValue([]),
    findFirst: jest.fn<any>().mockResolvedValue(null),
    count: jest.fn<any>().mockResolvedValue(0),
    create: jest.fn<any>().mockResolvedValue({ id: 'st-1', title: 'Test', category: 'SecurityAwareness' }),
    update: jest.fn<any>().mockResolvedValue({ id: 'st-1', status: 'Active' }),
  },
  securityTrainingRecord: {
    findMany: jest.fn<any>().mockResolvedValue([]),
    findFirst: jest.fn<any>().mockResolvedValue(null),
    count: jest.fn<any>().mockResolvedValue(0),
    upsert: jest.fn<any>().mockResolvedValue({ id: 'str-1' }),
    update: jest.fn<any>().mockResolvedValue({ id: 'str-1' }),
    groupBy: jest.fn<any>().mockResolvedValue([]),
  },
  user: {
    findMany: jest.fn<any>().mockResolvedValue([]),
    count: jest.fn<any>().mockResolvedValue(10),
  },
};

jest.mock('../../../config/database', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: { setUserContext: jest.fn(), captureException: jest.fn() },
}));

jest.mock('../../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },
}));

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
    const userRole = (req as any).user.role?.toLowerCase();
    const allowed = _roles.map((r: string) => r.toLowerCase());
    if (!allowed.includes(userRole)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  },
  AuthRequest: {},
}));

import trainingRoutes from '../../../routes/securityTraining';
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
app.use('/api/security-training', trainingRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('Security Training Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup default mock implementations after clearAllMocks/resetMocks
    mockPrisma.securityTraining.findMany.mockResolvedValue([]);
    mockPrisma.securityTraining.findFirst.mockResolvedValue(null);
    mockPrisma.securityTraining.count.mockResolvedValue(0);
    mockPrisma.securityTraining.create.mockResolvedValue({ id: 'st-1', title: 'Test', category: 'SecurityAwareness' });
    mockPrisma.securityTraining.update.mockResolvedValue({ id: 'st-1', status: 'Active' });
    mockPrisma.securityTrainingRecord.findMany.mockResolvedValue([]);
    mockPrisma.securityTrainingRecord.findFirst.mockResolvedValue(null);
    mockPrisma.securityTrainingRecord.count.mockResolvedValue(0);
    mockPrisma.securityTrainingRecord.upsert.mockResolvedValue({ id: 'str-1' });
    mockPrisma.securityTrainingRecord.update.mockResolvedValue({ id: 'str-1' });
    mockPrisma.securityTrainingRecord.groupBy.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(10);
  });

  // ── Compliance Report ────────────────────────────────────────────

  describe('GET /api/security-training/compliance-report', () => {
    it('returns 200 with report', async () => {
      const res = await request(app)
        .get('/api/security-training/compliance-report')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('completionRate');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/security-training/compliance-report');
      expect(res.status).toBe(401);
    });
  });

  // ── Training Records ─────────────────────────────────────────────

  describe('GET /api/security-training/records', () => {
    it('returns 200 with records', async () => {
      mockPrisma.securityTrainingRecord.findMany.mockResolvedValueOnce([]);
      mockPrisma.securityTrainingRecord.count.mockResolvedValueOnce(0);
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      const res = await request(app)
        .get('/api/security-training/records')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('records');
    });
  });

  // ── User Training Records ────────────────────────────────────────

  describe('GET /api/security-training/user/:userId/records', () => {
    it('returns 200 with user records', async () => {
      mockPrisma.securityTrainingRecord.findMany.mockResolvedValueOnce([]);
      const res = await request(app)
        .get('/api/security-training/user/user-1/records')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('records');
    });
  });

  // ── List Training Modules ────────────────────────────────────────

  describe('GET /api/security-training/', () => {
    it('returns 200 with modules', async () => {
      mockPrisma.securityTraining.findMany.mockResolvedValueOnce([]);
      mockPrisma.securityTraining.count.mockResolvedValueOnce(0);
      const res = await request(app).get('/api/security-training/').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('modules');
    });
  });

  // ── Create Training Module ───────────────────────────────────────

  describe('POST /api/security-training/', () => {
    it('returns 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/security-training/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Phishing Awareness', category: 'PhishingPrevention' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when title missing', async () => {
      const res = await request(app)
        .post('/api/security-training/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ category: 'SecurityAwareness' });
      expect(res.status).toBe(400);
    });

    it('returns 400 with invalid category', async () => {
      const res = await request(app)
        .post('/api/security-training/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test', category: 'InvalidCategory' });
      expect(res.status).toBe(400);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/security-training/')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Test', category: 'SecurityAwareness' });
      expect(res.status).toBe(403);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .post('/api/security-training/')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Test', category: 'SecurityAwareness' });
      expect(res.status).toBe(403);
    });
  });

  // ── Get by ID ────────────────────────────────────────────────────

  describe('GET /api/security-training/:id', () => {
    it('returns 200 when found', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce({ id: 'st-1', _count: { records: 5 } });
      mockPrisma.securityTrainingRecord.groupBy.mockResolvedValueOnce([]);
      const res = await request(app)
        .get('/api/security-training/st-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .get('/api/security-training/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Update Module ────────────────────────────────────────────────

  describe('PATCH /api/security-training/:id', () => {
    it('returns 200 for admin', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce({ id: 'st-1' });
      mockPrisma.securityTraining.update.mockResolvedValueOnce({ id: 'st-1', title: 'Updated' });
      const res = await request(app)
        .patch('/api/security-training/st-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/security-training/missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .patch('/api/security-training/st-1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(403);
    });
  });

  // ── Delete (Archive) ─────────────────────────────────────────────

  describe('DELETE /api/security-training/:id', () => {
    it('returns 200 for admin', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce({ id: 'st-1' });
      mockPrisma.securityTraining.update.mockResolvedValueOnce({ id: 'st-1' });
      const res = await request(app)
        .delete('/api/security-training/st-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/security-training/st-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Assign Training ──────────────────────────────────────────────

  describe('POST /api/security-training/:id/assign', () => {
    it('returns 201 with valid assignment', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce({ id: 'st-1', validityPeriod: 365 });
      mockPrisma.user.findMany.mockResolvedValueOnce([{ id: 'user-2' }]);
      mockPrisma.securityTrainingRecord.upsert.mockResolvedValueOnce({ id: 'str-1' });
      const res = await request(app)
        .post('/api/security-training/st-1/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: ['user-2'] });
      expect(res.status).toBe(201);
    });

    it('returns 400 when userIds missing', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce({ id: 'st-1', validityPeriod: 365 });
      const res = await request(app)
        .post('/api/security-training/st-1/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when training not found', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/security-training/missing/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: ['user-2'] });
      expect(res.status).toBe(404);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/security-training/st-1/assign')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ userIds: ['user-2'] });
      expect(res.status).toBe(403);
    });
  });

  // ── Assign All ───────────────────────────────────────────────────

  describe('POST /api/security-training/:id/assign-all', () => {
    it('returns 201', async () => {
      mockPrisma.securityTraining.findFirst.mockResolvedValue({ id: 'st-1', validityPeriod: 365, status: 'Active' } as any);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }] as any);
      mockPrisma.securityTrainingRecord.upsert.mockResolvedValue({ id: 'str-1' } as any);
      const res = await request(app)
        .post('/api/security-training/st-1/assign-all')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(201);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .post('/api/security-training/st-1/assign-all')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Update Training Record ───────────────────────────────────────

  describe('PATCH /api/security-training/records/:recordId', () => {
    it('returns 200 on start', async () => {
      mockPrisma.securityTrainingRecord.findFirst.mockResolvedValueOnce({
        id: 'str-1',
        training: { passingScore: 80, maxAttempts: 3 },
      });
      mockPrisma.securityTrainingRecord.update.mockResolvedValueOnce({ id: 'str-1', status: 'InProgress' });
      const res = await request(app)
        .patch('/api/security-training/records/str-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'start' });
      expect(res.status).toBe(200);
    });

    it('returns 200 on complete with passing score', async () => {
      mockPrisma.securityTrainingRecord.findFirst.mockResolvedValueOnce({
        id: 'str-1',
        training: { passingScore: 80, maxAttempts: 3 },
      });
      mockPrisma.securityTrainingRecord.update.mockResolvedValueOnce({ id: 'str-1', status: 'Completed' });
      const res = await request(app)
        .patch('/api/security-training/records/str-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'complete', score: 90 });
      expect(res.status).toBe(200);
    });

    it('returns 400 on complete without score', async () => {
      mockPrisma.securityTrainingRecord.findFirst.mockResolvedValueOnce({
        id: 'str-1',
        training: { passingScore: 80, maxAttempts: 3 },
      });
      const res = await request(app)
        .patch('/api/security-training/records/str-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'complete' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when record not found', async () => {
      mockPrisma.securityTrainingRecord.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/security-training/records/missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'start' });
      expect(res.status).toBe(404);
    });
  });
});
