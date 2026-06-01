/**
 * DORA Routes — Contract Tests
 * Verifies all 31 endpoints across dashboard, risk-assessments, incidents,
 * third-party-providers, resilience-tests, and information-register.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies BEFORE importing routes
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
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

const mockService = {
  getDORADashboard: jest.fn<any>().mockResolvedValue({ score: 85 }),
  calculateDORAComplianceScore: jest.fn<any>().mockResolvedValue({ score: 90 }),
  listICTRiskAssessments: jest.fn<any>().mockResolvedValue({ data: [], total: 0 }),
  getICTRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-1' }),
  createICTRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-new' }),
  updateICTRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-1', updated: true }),
  deleteICTRiskAssessment: jest.fn<any>().mockResolvedValue({ deleted: true }),
  scoreICTRiskAssessment: jest.fn<any>().mockResolvedValue({ score: 4.5 }),
  listICTIncidents: jest.fn<any>().mockResolvedValue({ data: [], total: 0 }),
  getICTIncident: jest.fn<any>().mockResolvedValue({ id: 'inc-1' }),
  createICTIncident: jest.fn<any>().mockResolvedValue({ id: 'inc-new' }),
  updateICTIncident: jest.fn<any>().mockResolvedValue({ id: 'inc-1', updated: true }),
  escalateIncident: jest.fn<any>().mockResolvedValue({ id: 'inc-1', escalated: true }),
  deleteICTIncident: jest.fn<any>().mockResolvedValue({ deleted: true }),
  listThirdPartyProviders: jest.fn<any>().mockResolvedValue({ data: [], total: 0 }),
  assessConcentrationRisk: jest.fn<any>().mockResolvedValue({ riskLevel: 'Medium' }),
  getThirdPartyProvider: jest.fn<any>().mockResolvedValue({ id: 'tp-1' }),
  createThirdPartyProvider: jest.fn<any>().mockResolvedValue({ id: 'tp-new' }),
  updateThirdPartyProvider: jest.fn<any>().mockResolvedValue({ id: 'tp-1', updated: true }),
  deleteThirdPartyProvider: jest.fn<any>().mockResolvedValue({ deleted: true }),
  listResilienceTests: jest.fn<any>().mockResolvedValue({ data: [], total: 0 }),
  getResilienceTest: jest.fn<any>().mockResolvedValue({ id: 'rt-1' }),
  createResilienceTest: jest.fn<any>().mockResolvedValue({ id: 'rt-new' }),
  updateResilienceTest: jest.fn<any>().mockResolvedValue({ id: 'rt-1', updated: true }),
  deleteResilienceTest: jest.fn<any>().mockResolvedValue({ deleted: true }),
  executeResilienceTest: jest.fn<any>().mockResolvedValue({ id: 'rt-1', executed: true }),
  listInformationRegister: jest.fn<any>().mockResolvedValue({ data: [], total: 0 }),
  getInformationRegisterEntry: jest.fn<any>().mockResolvedValue({ id: 'ir-1' }),
  createInformationRegisterEntry: jest.fn<any>().mockResolvedValue({ id: 'ir-new' }),
  updateInformationRegisterEntry: jest.fn<any>().mockResolvedValue({ id: 'ir-1', updated: true }),
  deleteInformationRegisterEntry: jest.fn<any>().mockResolvedValue({ deleted: true }),
};

jest.mock('../../../services/doraService', () => mockService);

import doraRoutes from '../../../routes/dora';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      (req as any).user = jwt.verify(token, 'test-secret');
    } catch { /* no-op */ }
  }
  next();
});
app.use('/api/dora', doraRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign(
    { id: 'user-1', organizationId: 'org-1', role, email: 'test@test.com', name: 'Tester' },
    'test-secret',
    { expiresIn: '1h' }
  );

describe('DORA Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // ── Dashboard & Compliance ──────────────────────────────────────────

  describe('GET /api/dora/dashboard', () => {
    it('returns 200 with dashboard data', async () => {
      const res = await request(app).get('/api/dora/dashboard').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(mockService.getDORADashboard).toHaveBeenCalledWith('org-1');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/dora/dashboard');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dora/compliance-score', () => {
    it('returns 200 with score', async () => {
      const res = await request(app).get('/api/dora/compliance-score').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(mockService.calculateDORAComplianceScore).toHaveBeenCalled();
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/dora/compliance-score');
      expect(res.status).toBe(401);
    });
  });

  // ── Risk Assessments CRUD ───────────────────────────────────────────

  describe('GET /api/dora/risk-assessments', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/dora/risk-assessments').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/dora/risk-assessments');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dora/risk-assessments/:id', () => {
    it('returns 200 with assessment', async () => {
      const res = await request(app).get('/api/dora/risk-assessments/ra-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/dora/risk-assessments', () => {
    it('returns 201 on valid create', async () => {
      const res = await request(app)
        .post('/api/dora/risk-assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test RA', assessmentType: 'Periodic' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer role', async () => {
      const res = await request(app)
        .post('/api/dora/risk-assessments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Test' });
      expect(res.status).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/dora/risk-assessments').send({ title: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/dora/risk-assessments/:id', () => {
    it('returns 200 on valid update', async () => {
      const res = await request(app)
        .patch('/api/dora/risk-assessments/ra-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .patch('/api/dora/risk-assessments/ra-1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/dora/risk-assessments/:id', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/dora/risk-assessments/ra-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/dora/risk-assessments/ra-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/dora/risk-assessments/:id/score', () => {
    it('returns 200 for editor', async () => {
      const res = await request(app)
        .post('/api/dora/risk-assessments/ra-1/score')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/risk-assessments/ra-1/score')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Incidents CRUD ──────────────────────────────────────────────────

  describe('GET /api/dora/incidents', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/dora/incidents').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/dora/incidents');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dora/incidents/:id', () => {
    it('returns 200 with incident', async () => {
      const res = await request(app).get('/api/dora/incidents/inc-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/dora/incidents', () => {
    it('returns 201 on valid create', async () => {
      const res = await request(app)
        .post('/api/dora/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Incident', severity: 'Major' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/dora/incidents/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/dora/incidents/inc-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Resolved' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/dora/incidents/:id/escalate', () => {
    it('returns 200 on escalation', async () => {
      const res = await request(app)
        .post('/api/dora/incidents/inc-1/escalate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ escalationLevel: 'Critical', reason: 'Major outage' });
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/incidents/inc-1/escalate')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ escalationLevel: 'Critical' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/dora/incidents/:id', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/dora/incidents/inc-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/dora/incidents/inc-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Third-Party Providers ───────────────────────────────────────────

  describe('GET /api/dora/third-party-providers', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/dora/third-party-providers').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/dora/third-party-providers/concentration-risk', () => {
    it('returns 200 with risk assessment', async () => {
      const res = await request(app)
        .get('/api/dora/third-party-providers/concentration-risk')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/dora/third-party-providers/:id', () => {
    it('returns 200 with provider', async () => {
      const res = await request(app)
        .get('/api/dora/third-party-providers/tp-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/dora/third-party-providers', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/dora/third-party-providers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cloud Provider', providerType: 'CloudService' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/third-party-providers')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/dora/third-party-providers/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/dora/third-party-providers/tp-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Active' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/dora/third-party-providers/:id', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/dora/third-party-providers/tp-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/dora/third-party-providers/tp-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Resilience Tests ────────────────────────────────────────────────

  describe('GET /api/dora/resilience-tests', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/dora/resilience-tests').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/dora/resilience-tests/:id', () => {
    it('returns 200 with test', async () => {
      const res = await request(app).get('/api/dora/resilience-tests/rt-1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/dora/resilience-tests', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/dora/resilience-tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ testType: 'PenetrationTest', name: 'Q1 Pen Test' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/resilience-tests')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ testType: 'PenetrationTest' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/dora/resilience-tests/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/dora/resilience-tests/rt-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/dora/resilience-tests/:id', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/dora/resilience-tests/rt-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/dora/resilience-tests/rt-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/dora/resilience-tests/:id/execute', () => {
    it('returns 200 on execution', async () => {
      const res = await request(app)
        .post('/api/dora/resilience-tests/rt-1/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ testScenarios: [{ name: 'Scenario A' }] });
      expect(res.status).toBe(200);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/resilience-tests/rt-1/execute')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Information Register ────────────────────────────────────────────

  describe('GET /api/dora/information-register', () => {
    it('returns 200 with list', async () => {
      const res = await request(app).get('/api/dora/information-register').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/dora/information-register/:id', () => {
    it('returns 200 with entry', async () => {
      const res = await request(app)
        .get('/api/dora/information-register/ir-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/dora/information-register', () => {
    it('returns 201 on create', async () => {
      const res = await request(app)
        .post('/api/dora/information-register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CRM System', assetType: 'Application' });
      expect(res.status).toBe(201);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/dora/information-register')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ assetName: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/dora/information-register/:id', () => {
    it('returns 200 on update', async () => {
      const res = await request(app)
        .patch('/api/dora/information-register/ir-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Active' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/dora/information-register/:id', () => {
    it('returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/dora/information-register/ir-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/dora/information-register/ir-1')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });
});
