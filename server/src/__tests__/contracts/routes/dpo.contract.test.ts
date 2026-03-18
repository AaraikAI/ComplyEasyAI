/**
 * DPO Routes — Contract Tests
 * 11 endpoints: profile CRUD, tasks CRUD, activity-log, compliance-report
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const mockPrisma: any = {
  dPOProfile: {
    findUnique: jest.fn<any>().mockResolvedValue(null),
    create: jest.fn<any>().mockResolvedValue({ id: 'dpo-1', name: 'DPO', email: 'dpo@org.com' }),
    update: jest.fn<any>().mockResolvedValue({ id: 'dpo-1', name: 'Updated' }),
    delete: jest.fn<any>().mockResolvedValue({}),
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
    const userRole = (req as any).user.role?.toLowerCase();
    const allowed = _roles.map((r: string) => r.toLowerCase());
    if (!allowed.includes(userRole)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  },
  AuthRequest: {},
}));

import dpoRoutes from '../../../routes/dpo';
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
app.use('/api/dpo', dpoRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'Tester' }, 'test-secret', { expiresIn: '1h' });

describe('DPO Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // ── Profile ──────────────────────────────────────────────────────

  describe('GET /api/dpo/profile', () => {
    it('returns 200 when profile exists', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ id: 'dpo-1', name: 'DPO' });
      const res = await request(app).get('/api/dpo/profile').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when no profile', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/dpo/profile').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/dpo/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/dpo/profile', () => {
    it('returns 201 with valid data', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/dpo/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Jane DPO', email: 'jane@org.com' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when name missing', async () => {
      const res = await request(app)
        .post('/api/dpo/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'test@org.com' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when profile already exists', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ id: 'dpo-1' });
      const res = await request(app)
        .post('/api/dpo/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'DPO', email: 'dpo@org.com' });
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/dpo/profile', () => {
    it('returns 200 when profile exists', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ id: 'dpo-1' });
      mockPrisma.dPOProfile.update.mockResolvedValueOnce({ id: 'dpo-1', name: 'Updated' });
      const res = await request(app)
        .patch('/api/dpo/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated DPO' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when no profile', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/dpo/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/dpo/profile', () => {
    it('returns 200 for admin', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ id: 'dpo-1', name: 'DPO' });
      const res = await request(app)
        .delete('/api/dpo/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'DPO change' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app).delete('/api/dpo/profile').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 when no profile', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).delete('/api/dpo/profile').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Tasks ────────────────────────────────────────────────────────

  describe('GET /api/dpo/tasks', () => {
    it('returns 200 with tasks', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [{ id: 't1', title: 'Review' }] });
      const res = await request(app).get('/api/dpo/tasks').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tasks');
    });

    it('returns 404 when no profile', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/dpo/tasks').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/dpo/tasks', () => {
    it('returns 201 with valid task', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [] });
      mockPrisma.dPOProfile.update.mockResolvedValueOnce({});
      const res = await request(app)
        .post('/api/dpo/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Annual DPIA Review' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when title missing', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [] });
      const res = await request(app)
        .post('/api/dpo/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No title' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/dpo/tasks/:index', () => {
    it('returns 200 on valid update', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [{ id: 't1', title: 'Task' }] });
      mockPrisma.dPOProfile.update.mockResolvedValueOnce({});
      const res = await request(app)
        .patch('/api/dpo/tasks/0')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(200);
    });

    it('returns 404 for invalid index', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [] });
      const res = await request(app)
        .patch('/api/dpo/tasks/99')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/dpo/tasks/:index', () => {
    it('returns 200 on valid delete', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [{ id: 't1', title: 'Task' }] });
      mockPrisma.dPOProfile.update.mockResolvedValueOnce({});
      const res = await request(app).delete('/api/dpo/tasks/0').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('returns 404 for invalid index', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ tasks: [] });
      const res = await request(app).delete('/api/dpo/tasks/99').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Activity Log ─────────────────────────────────────────────────

  describe('GET /api/dpo/activity-log', () => {
    it('returns 200 with entries', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ activityLog: [] });
      const res = await request(app).get('/api/dpo/activity-log').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('entries');
    });
  });

  describe('POST /api/dpo/activity-log', () => {
    it('returns 201 with valid entry', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ activityLog: [] });
      mockPrisma.dPOProfile.update.mockResolvedValueOnce({});
      const res = await request(app)
        .post('/api/dpo/activity-log')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'DPIA Review Completed' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when action missing', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({ activityLog: [] });
      const res = await request(app)
        .post('/api/dpo/activity-log')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No action' });
      expect(res.status).toBe(400);
    });
  });

  // ── Compliance Report ────────────────────────────────────────────

  describe('GET /api/dpo/compliance-report', () => {
    it('returns 200 with report', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce({
        name: 'DPO',
        email: 'dpo@org.com',
        certifications: ['CIPP/E'],
        appointmentDate: new Date(),
        registeredWithDPA: true,
        dpaRegistrationRef: 'REF-123',
        tasks: [],
        activityLog: [],
      });
      const res = await request(app).get('/api/dpo/compliance-report').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body).toHaveProperty('tasks');
      expect(res.body).toHaveProperty('activity');
    });

    it('returns 404 when no profile', async () => {
      mockPrisma.dPOProfile.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/dpo/compliance-report').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
