/**
 * SoD (Separation of Duties) Routes — Contract Tests
 * 18 endpoints: dashboard, matrix, analyze, rules CRUD+import,
 * violations CRUD+mitigate/accept/remediate, compensation CRUD
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

const mockSodService = {
  getSoDDashboard: jest.fn<any>().mockResolvedValue({ totalViolations: 5, rules: 10 }),
  getSoDRules: jest.fn<any>().mockResolvedValue([]),
  createSoDRule: jest.fn<any>().mockResolvedValue({ id: 'rule-1' }),
  getSoDRuleById: jest.fn<any>().mockResolvedValue({ id: 'rule-1' }),
  updateSoDRule: jest.fn<any>().mockResolvedValue({ id: 'rule-1', updated: true }),
  deleteSoDRule: jest.fn<any>().mockResolvedValue(undefined),
  importSoDRules: jest.fn<any>().mockResolvedValue({ imported: 3 }),
  getSoDViolations: jest.fn<any>().mockResolvedValue([]),
  getSoDViolationById: jest.fn<any>().mockResolvedValue({ id: 'viol-1' }),
  mitigateViolation: jest.fn<any>().mockResolvedValue({ id: 'viol-1', status: 'Mitigated' }),
  acceptViolation: jest.fn<any>().mockResolvedValue({ id: 'viol-1', status: 'Accepted' }),
  remediateViolation: jest.fn<any>().mockResolvedValue({ id: 'viol-1', status: 'Remediated' }),
  getCompensatingControls: jest.fn<any>().mockResolvedValue([]),
  addCompensatingControl: jest.fn<any>().mockResolvedValue({ id: 'cc-1' }),
  updateCompensatingControl: jest.fn<any>().mockResolvedValue({ id: 'cc-1', updated: true }),
  deleteCompensatingControl: jest.fn<any>().mockResolvedValue(undefined),
  getSoDMatrix: jest.fn<any>().mockResolvedValue({ functions: [], conflicts: [] }),
  runSoDAnalysis: jest.fn<any>().mockResolvedValue({ violations: 3 }),
};

jest.mock('../../../services/sodService', () => ({ __esModule: true, default: mockSodService }));

import sodRoutes from '../../../routes/sod';
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
app.use('/api/sod', sodRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('SoD Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // ── Dashboard ────────────────────────────────────────────────────

  describe('GET /api/sod/dashboard', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/sod/dashboard').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/sod/dashboard');
      expect(res.status).toBe(401);
    });
  });

  // ── Rules CRUD ───────────────────────────────────────────────────

  describe('GET /api/sod/rules', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/sod/rules').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/sod/rules', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/sod/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'AP-AR Conflict', conflictType: 'Direct' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/sod/rules')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/sod/rules/:id', () => {
    it('returns 200 when found', async () => {
      const res = await request(app).get('/api/sod/rules/rule-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockSodService.getSoDRuleById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/sod/rules/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/sod/rules/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/sod/rules/rule-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ severity: 'High' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/sod/rules/:id', () => {
    it('returns 204 for admin', async () => {
      const res = await request(app).delete('/api/sod/rules/rule-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app).delete('/api/sod/rules/rule-1').set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/sod/rules/import', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .post('/api/sod/rules/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rules: [{ name: 'R1' }] });
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .post('/api/sod/rules/import')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ rules: [] });
      expect(res.status).toBe(403);
    });
  });

  // ── Violations ───────────────────────────────────────────────────

  describe('GET /api/sod/violations', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/sod/violations').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/sod/violations/:id', () => {
    it('returns 200 when found', async () => {
      const res = await request(app).get('/api/sod/violations/viol-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockSodService.getSoDViolationById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/sod/violations/missing').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/sod/violations/:id/mitigate', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/mitigate')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ mitigationPlan: 'Dual approval' });
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/mitigate')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/sod/violations/:id/accept', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/accept')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Accepted risk' });
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/accept')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/sod/violations/:id/remediate', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/remediate')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ plan: 'Role reassignment' });
      expect(res.status).toBe(200);
    });
  });

  // ── Compensating Controls ────────────────────────────────────────

  describe('GET /api/sod/violations/:violationId/compensation', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .get('/api/sod/violations/viol-1/compensation')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/sod/violations/:violationId/compensation', () => {
    it('returns 201', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/compensation')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ controlName: 'Dual sign-off' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/sod/violations/viol-1/compensation')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/sod/violations/:violationId/compensation/:controlId', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .patch('/api/sod/violations/viol-1/compensation/cc-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Active' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/sod/violations/:violationId/compensation/:controlId', () => {
    it('returns 204 for admin', async () => {
      const res = await request(app)
        .delete('/api/sod/violations/viol-1/compensation/cc-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/sod/violations/viol-1/compensation/cc-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Matrix & Analysis ────────────────────────────────────────────

  describe('GET /api/sod/matrix', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/api/sod/matrix').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('passes system query param', async () => {
      await request(app).get('/api/sod/matrix?system=SAP').set('Authorization', `Bearer ${adminToken}`);
      expect(mockSodService.getSoDMatrix).toHaveBeenCalledWith('org-1', 'SAP');
    });
  });

  describe('POST /api/sod/analyze', () => {
    it('returns 200', async () => {
      const res = await request(app).post('/api/sod/analyze').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app).post('/api/sod/analyze').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
