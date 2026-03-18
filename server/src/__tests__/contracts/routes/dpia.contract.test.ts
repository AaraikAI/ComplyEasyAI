/**
 * DPIA Routes — Contract Tests
 * 14 endpoints: statistics, list, CRUD, screening, risk-assessment CRUD,
 * dpo-consultation, approve, reject, export
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const mockPrisma: any = {
  dataProtectionImpactAssessment: {
    findMany: jest.fn<any>().mockResolvedValue([]),
    findFirst: jest.fn<any>().mockResolvedValue(null),
    count: jest.fn<any>().mockResolvedValue(0),
    create: jest.fn<any>().mockResolvedValue({ id: 'dpia-1', title: 'Test', status: 'Draft' }),
    update: jest.fn<any>().mockResolvedValue({ id: 'dpia-1', status: 'Updated' }),
  },
  dPIARiskAssessment: {
    findMany: jest.fn<any>().mockResolvedValue([]),
    findFirst: jest.fn<any>().mockResolvedValue(null),
    create: jest.fn<any>().mockResolvedValue({ id: 'risk-1' }),
    update: jest.fn<any>().mockResolvedValue({ id: 'risk-1', updated: true }),
    delete: jest.fn<any>().mockResolvedValue({ id: 'risk-1' }),
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

import dpiaRoutes from '../../../routes/dpia';
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
app.use('/api/dpia', dpiaRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'Tester' }, 'test-secret', { expiresIn: '1h' });

describe('DPIA Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // ── Statistics ───────────────────────────────────────────────────

  describe('GET /api/dpia/statistics', () => {
    it('returns 200 with stats', async () => {
      mockPrisma.dataProtectionImpactAssessment.findMany.mockResolvedValue([]);
      mockPrisma.dPIARiskAssessment.findMany.mockResolvedValue([]);
      const res = await request(app).get('/api/dpia/statistics').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/dpia/statistics');
      expect(res.status).toBe(401);
    });
  });

  // ── List DPIAs ───────────────────────────────────────────────────

  describe('GET /api/dpia/', () => {
    it('returns 200 with paginated list', async () => {
      mockPrisma.dataProtectionImpactAssessment.findMany.mockResolvedValue([]);
      mockPrisma.dataProtectionImpactAssessment.count.mockResolvedValue(0);
      const res = await request(app).get('/api/dpia/').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dpias');
    });
  });

  // ── Create DPIA ──────────────────────────────────────────────────

  describe('POST /api/dpia/', () => {
    it('returns 201 with valid payload', async () => {
      const res = await request(app)
        .post('/api/dpia/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Employee Monitoring', processingActivity: 'CCTV surveillance' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when title missing', async () => {
      const res = await request(app)
        .post('/api/dpia/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ processingActivity: 'Test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when processingActivity missing', async () => {
      const res = await request(app)
        .post('/api/dpia/')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  // ── Get DPIA by ID ───────────────────────────────────────────────

  describe('GET /api/dpia/:id', () => {
    it('returns 200 when found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({
        id: 'dpia-1',
        riskAssessments: [],
      });
      const res = await request(app).get('/api/dpia/dpia-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/dpia/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Update DPIA ──────────────────────────────────────────────────

  describe('PATCH /api/dpia/:id', () => {
    it('returns 200 when found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1', title: 'Updated' });
      const res = await request(app)
        .patch('/api/dpia/dpia-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/dpia/missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });
  });

  // ── Delete DPIA ──────────────────────────────────────────────────

  describe('DELETE /api/dpia/:id', () => {
    it('returns 200 when found (archives)', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1', status: 'Archived' });
      const res = await request(app).delete('/api/dpia/dpia-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('DPIA archived');
    });

    it('returns 404 when not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).delete('/api/dpia/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Screening ────────────────────────────────────────────────────

  describe('POST /api/dpia/:id/screening', () => {
    it('returns 200 with screening result', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .post('/api/dpia/dpia-1/screening')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ screeningAnswers: { largeScaleSpecialCategories: true, innovativeTechnology: true } });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('screeningResult');
    });

    it('returns 400 when screeningAnswers missing', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .post('/api/dpia/dpia-1/screening')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when DPIA not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/dpia/missing/screening')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ screeningAnswers: {} });
      expect(res.status).toBe(404);
    });
  });

  // ── Risk Assessment CRUD ─────────────────────────────────────────

  describe('POST /api/dpia/:id/risk-assessment', () => {
    it('returns 201 with valid data', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dPIARiskAssessment.create.mockResolvedValueOnce({ id: 'risk-1' });
      mockPrisma.dPIARiskAssessment.findMany.mockResolvedValueOnce([{ riskLevel: 'High' }]);
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .post('/api/dpia/dpia-1/risk-assessment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ riskDescription: 'Data breach risk', likelihood: 'High', impact: 'High' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when required fields missing', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .post('/api/dpia/dpia-1/risk-assessment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ riskDescription: 'Test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 with invalid likelihood value', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .post('/api/dpia/dpia-1/risk-assessment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ riskDescription: 'Test', likelihood: 'Invalid', impact: 'High' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/dpia/:id/risk-assessment/:riskId', () => {
    it('returns 200 on update', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dPIARiskAssessment.findFirst.mockResolvedValueOnce({ id: 'risk-1', likelihood: 'Medium', impact: 'Medium' });
      mockPrisma.dPIARiskAssessment.update.mockResolvedValueOnce({ id: 'risk-1' });
      const res = await request(app)
        .patch('/api/dpia/dpia-1/risk-assessment/risk-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ likelihood: 'High' });
      expect(res.status).toBe(200);
    });

    it('returns 404 when risk not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dPIARiskAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/dpia/dpia-1/risk-assessment/missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ likelihood: 'High' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/dpia/:id/risk-assessment/:riskId', () => {
    it('returns 200 when deleted', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dPIARiskAssessment.findFirst.mockResolvedValueOnce({ id: 'risk-1' });
      mockPrisma.dPIARiskAssessment.delete.mockResolvedValueOnce({});
      const res = await request(app)
        .delete('/api/dpia/dpia-1/risk-assessment/risk-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when risk not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dPIARiskAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .delete('/api/dpia/dpia-1/risk-assessment/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── DPO Consultation ─────────────────────────────────────────────

  describe('POST /api/dpia/:id/dpo-consultation', () => {
    it('returns 200 with valid data', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1', dpoConsulted: true });
      const res = await request(app)
        .post('/api/dpia/dpia-1/dpo-consultation')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ consultationNotes: 'Approved with conditions' });
      expect(res.status).toBe(200);
    });

    it('returns 400 when consultationNotes missing', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .post('/api/dpia/dpia-1/dpo-consultation')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── Approve ──────────────────────────────────────────────────────

  describe('PATCH /api/dpia/:id/approve', () => {
    it('returns 200 for admin', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1', status: 'Approved' });
      const res = await request(app)
        .patch('/api/dpia/dpia-1/approve')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .patch('/api/dpia/dpia-1/approve')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/dpia/missing/approve')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Reject ───────────────────────────────────────────────────────

  describe('PATCH /api/dpia/:id/reject', () => {
    it('returns 200 with reason', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      mockPrisma.dataProtectionImpactAssessment.update.mockResolvedValueOnce({ id: 'dpia-1', status: 'Rejected' });
      const res = await request(app)
        .patch('/api/dpia/dpia-1/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Insufficient risk mitigation' });
      expect(res.status).toBe(200);
    });

    it('returns 400 without reason', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({ id: 'dpia-1' });
      const res = await request(app)
        .patch('/api/dpia/dpia-1/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── Export ───────────────────────────────────────────────────────

  describe('GET /api/dpia/:id/export', () => {
    it('returns 200 with export data', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce({
        id: 'dpia-1',
        title: 'Test',
        riskAssessments: [],
        dataCategories: [],
        dataSubjects: [],
      });
      const res = await request(app).get('/api/dpia/dpia-1/export').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metadata');
    });

    it('returns 404 when not found', async () => {
      mockPrisma.dataProtectionImpactAssessment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/dpia/missing/export').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
