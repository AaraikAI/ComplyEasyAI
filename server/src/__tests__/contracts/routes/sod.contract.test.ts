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
  getSoDDashboard: jest.fn<any>(),
  getSoDRules: jest.fn<any>(),
  createSoDRule: jest.fn<any>(),
  getSoDRuleById: jest.fn<any>(),
  updateSoDRule: jest.fn<any>(),
  deleteSoDRule: jest.fn<any>(),
  importSoDRules: jest.fn<any>(),
  getSoDViolations: jest.fn<any>(),
  getSoDViolationById: jest.fn<any>(),
  mitigateViolation: jest.fn<any>(),
  acceptViolation: jest.fn<any>(),
  remediateViolation: jest.fn<any>(),
  getCompensatingControls: jest.fn<any>(),
  addCompensatingControl: jest.fn<any>(),
  updateCompensatingControl: jest.fn<any>(),
  deleteCompensatingControl: jest.fn<any>(),
  getSoDMatrix: jest.fn<any>(),
  runSoDAnalysis: jest.fn<any>(),
};

// jest.config sets resetMocks:true, which clears these implementations before
// each test. Re-install the default resolved values in beforeEach so handlers
// receive a record (otherwise getById returns undefined → 404).
const installSodDefaults = () => {
  mockSodService.getSoDDashboard.mockResolvedValue({ totalViolations: 5, rules: 10 });
  mockSodService.getSoDRules.mockResolvedValue([]);
  mockSodService.createSoDRule.mockResolvedValue({ id: 'rule-1' });
  mockSodService.getSoDRuleById.mockResolvedValue({ id: 'rule-1' });
  mockSodService.updateSoDRule.mockResolvedValue({ id: 'rule-1', updated: true });
  mockSodService.deleteSoDRule.mockResolvedValue(undefined);
  mockSodService.importSoDRules.mockResolvedValue({ imported: 3 });
  mockSodService.getSoDViolations.mockResolvedValue([]);
  mockSodService.getSoDViolationById.mockResolvedValue({ id: 'viol-1' });
  mockSodService.mitigateViolation.mockResolvedValue({ id: 'viol-1', status: 'Mitigated' });
  mockSodService.acceptViolation.mockResolvedValue({ id: 'viol-1', status: 'Accepted' });
  mockSodService.remediateViolation.mockResolvedValue({ id: 'viol-1', status: 'Remediated' });
  mockSodService.getCompensatingControls.mockResolvedValue([]);
  mockSodService.addCompensatingControl.mockResolvedValue({ id: 'cc-1' });
  mockSodService.updateCompensatingControl.mockResolvedValue({ id: 'cc-1', updated: true });
  mockSodService.deleteCompensatingControl.mockResolvedValue(undefined);
  mockSodService.getSoDMatrix.mockResolvedValue({ functions: [], conflicts: [] });
  mockSodService.runSoDAnalysis.mockResolvedValue({ violations: 3 });
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

  beforeEach(() => {
    jest.clearAllMocks();
    installSodDefaults();
  });

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
        // schema field is ruleType (not conflictType); unknown fields rejected
        .send({ name: 'AP-AR Conflict', ruleType: 'Direct' });
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
        // acceptSoDViolationSchema requires `justification`
        .send({ justification: 'Accepted risk' });
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
        // remediateSoDViolationSchema field is remediationPlan; `plan` unknown
        .send({ remediationPlan: 'Role reassignment' });
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
        // createCompensatingControlSchema requires `name` (not controlName)
        .send({ name: 'Dual sign-off' });
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
