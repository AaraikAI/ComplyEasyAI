/**
 * SOX Compliance Routes — Contract Tests
 * 17 endpoints: dashboard, controls CRUD, test-results CRUD, assessments CRUD, reports
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/database', () => ({ __esModule: true, default: {} }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));

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

const mockSoxService = {
  getSOXDashboard: jest.fn<any>().mockResolvedValue({ complianceScore: 85, totalControls: 50 }),
  getSOXControls: jest.fn<any>().mockResolvedValue([]),
  createSOXControl: jest.fn<any>().mockResolvedValue({ id: 'ctrl-1', name: 'Test' }),
  getSOXControlById: jest.fn<any>().mockResolvedValue({ id: 'ctrl-1' }),
  updateSOXControl: jest.fn<any>().mockResolvedValue({ id: 'ctrl-1', updated: true }),
  deleteSOXControl: jest.fn<any>().mockResolvedValue(undefined),
  getSOXTestResults: jest.fn<any>().mockResolvedValue([]),
  createSOXTestResult: jest.fn<any>().mockResolvedValue({ id: 'test-1' }),
  getSOXTestResultById: jest.fn<any>().mockResolvedValue({ id: 'test-1' }),
  updateSOXTestResult: jest.fn<any>().mockResolvedValue({ id: 'test-1', updated: true }),
  deleteSOXTestResult: jest.fn<any>().mockResolvedValue(undefined),
  getSOXAssessments: jest.fn<any>().mockResolvedValue([]),
  createSOXAssessment: jest.fn<any>().mockResolvedValue({ id: 'assess-1' }),
  getSOXAssessmentById: jest.fn<any>().mockResolvedValue({ id: 'assess-1' }),
  updateSOXAssessment: jest.fn<any>().mockResolvedValue({ id: 'assess-1', updated: true }),
  deleteSOXAssessment: jest.fn<any>().mockResolvedValue(undefined),
  generateSOXReport: jest.fn<any>().mockResolvedValue({ report: 'data' }),
};

jest.mock('../../../services/soxService', () => ({ __esModule: true, default: mockSoxService }));

import soxRoutes from '../../../routes/sox';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      (req as any).user = jwt.verify(authHeader.split(' ')[1], 'test-secret');
    } catch { /* no-op */ }
  }
  next();
});
app.use('/api/sox', soxRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('SOX Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // ── Dashboard ────────────────────────────────────────────────────

  describe('GET /api/sox/dashboard', () => {
    it('returns 200 with dashboard data', async () => {
      const res = await request(app).get('/api/sox/dashboard').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/sox/dashboard');
      expect(res.status).toBe(401);
    });
  });

  // ── Controls CRUD ────────────────────────────────────────────────

  describe('GET /api/sox/controls', () => {
    it('returns 200 with controls list', async () => {
      const res = await request(app).get('/api/sox/controls').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/sox/controls', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/sox/controls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Revenue Recognition', category: 'Financial' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/sox/controls')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/sox/controls/:id', () => {
    it('returns 200 when found', async () => {
      const res = await request(app).get('/api/sox/controls/ctrl-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockSoxService.getSOXControlById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/sox/controls/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/sox/controls/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/sox/controls/ctrl-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ effectiveness: 'Effective' });
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .patch('/api/sox/controls/ctrl-1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ effectiveness: 'Effective' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/sox/controls/:id', () => {
    it('returns 204 for admin', async () => {
      const res = await request(app).delete('/api/sox/controls/ctrl-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app).delete('/api/sox/controls/ctrl-1').set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Test Results CRUD ────────────────────────────────────────────

  describe('GET /api/sox/test-results', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/sox/test-results').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/sox/test-results', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/sox/test-results')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ controlId: 'ctrl-1', result: 'Pass' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/sox/test-results')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ controlId: 'ctrl-1' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/sox/test-results/:id', () => {
    it('returns 200 when found', async () => {
      const res = await request(app).get('/api/sox/test-results/test-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockSoxService.getSOXTestResultById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/sox/test-results/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/sox/test-results/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/sox/test-results/test-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/sox/test-results/:id', () => {
    it('returns 204 for admin', async () => {
      const res = await request(app).delete('/api/sox/test-results/test-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app).delete('/api/sox/test-results/test-1').set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Assessments CRUD ─────────────────────────────────────────────

  describe('GET /api/sox/assessments', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/sox/assessments').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/sox/assessments', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/sox/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Q1 Assessment' });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/sox/assessments/:id', () => {
    it('returns 200 when found', async () => {
      const res = await request(app).get('/api/sox/assessments/assess-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockSoxService.getSOXAssessmentById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/sox/assessments/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/sox/assessments/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/sox/assessments/assess-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/sox/assessments/:id', () => {
    it('returns 204 for admin', async () => {
      const res = await request(app).delete('/api/sox/assessments/assess-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app).delete('/api/sox/assessments/assess-1').set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Reports ──────────────────────────────────────────────────────

  describe('GET /api/sox/reports/full', () => {
    it('returns 200 with report', async () => {
      const res = await request(app).get('/api/sox/reports/full').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(mockSoxService.generateSOXReport).toHaveBeenCalledWith('org-1', '2026');
    });

    it('passes fiscalYear query param', async () => {
      const res = await request(app)
        .get('/api/sox/reports/full?fiscalYear=2025')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(mockSoxService.generateSOXReport).toHaveBeenCalledWith('org-1', '2025');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/sox/reports/full');
      expect(res.status).toBe(401);
    });
  });
});
