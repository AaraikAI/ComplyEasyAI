/**
 * Feature Modules Routes — Contract Tests
 * 90+ endpoints across 12 sub-modules: governance, breach, CE, DPP, ESG, SBOM,
 * surveillance, decommission, lifecycle, product-lifecycle, process-maps, sync
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

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireFeature: () => (_req: any, _res: any, next: any) => next(),
  enforceLimit: () => (_req: any, _res: any, next: any) => next(),
  requireAiFeature: () => [(_req: any, _res: any, next: any) => next()],
}));

// Build a mock handler factory
const mockHandler = (data: any = { id: 'mock-1' }, status = 200) =>
  jest.fn<any>().mockImplementation((_req: any, res: any) => res.status(status).json(data));
const mockCreate = (data: any = { id: 'mock-new' }) =>
  jest.fn<any>().mockImplementation((_req: any, res: any) => res.status(201).json(data));
const mockDelete = () =>
  jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ success: true }));
const mockList = (data: any[] = []) =>
  jest.fn<any>().mockImplementation((_req: any, res: any) => res.json(data));

const fm: Record<string, jest.Mock<any>> = {
  // Governance
  listGovernanceBodies: mockList(),
  createGovernanceBody: mockCreate(),
  updateGovernanceBody: mockHandler(),
  deleteGovernanceBody: mockDelete(),
  createMeeting: mockCreate(),
  updateMeeting: mockHandler(),
  deleteMeeting: mockDelete(),
  createDecision: mockCreate(),
  updateDecision: mockHandler(),
  createEscalationPath: mockCreate(),
  updateEscalationPath: mockHandler(),
  deleteEscalationPath: mockDelete(),
  getDPOProfile: mockHandler({ name: 'DPO' }),
  upsertDPOProfile: mockHandler(),
  // Breach
  listBreachIncidents: mockList(),
  createBreachIncident: mockCreate(),
  getBreachIncident: mockHandler(),
  updateBreachIncident: mockHandler(),
  deleteBreachIncident: mockDelete(),
  createBreachNotification: mockCreate(),
  updateBreachNotification: mockHandler(),
  listBreachTemplates: mockList(),
  createBreachTemplate: mockCreate(),
  updateBreachTemplate: mockHandler(),
  deleteBreachTemplate: mockDelete(),
  listRegulatoryContacts: mockList(),
  createRegulatoryContact: mockCreate(),
  updateRegulatoryContact: mockHandler(),
  deleteRegulatoryContact: mockDelete(),
  // CE Marking
  listCEProducts: mockList(),
  createCEProduct: mockCreate(),
  getCEProduct: mockHandler(),
  updateCEProduct: mockHandler(),
  deleteCEProduct: mockDelete(),
  listCENotifiedBodies: mockList(),
  listCERequirements: mockList(),
  listCEDocuments: mockList(),
  listCERiskItems: mockList(),
  listCESurveillanceChecks: mockList(),
  // DPP
  listDPPs: mockList(),
  createDPP: mockCreate(),
  getDPP: mockHandler(),
  updateDPP: mockHandler(),
  deleteDPP: mockDelete(),
  // ESG
  listESGMetrics: mockList(),
  createESGMetric: mockCreate(),
  getESGMetric: mockHandler(),
  updateESGMetric: mockHandler(),
  deleteESGMetric: mockDelete(),
  listMaterialityAssessments: mockList(),
  createMaterialityAssessment: mockCreate(),
  getMaterialityAssessment: mockHandler(),
  updateMaterialityAssessment: mockHandler(),
  deleteMaterialityAssessment: mockDelete(),
  // SBOM
  listSBOMEntries: mockList(),
  createSBOMEntry: mockCreate(),
  bulkCreateSBOMEntries: mockCreate(),
  updateSBOMEntry: mockHandler(),
  deleteSBOMEntry: mockDelete(),
  listSBOMRepositories: mockList(),
  createSBOMRepository: mockCreate(),
  updateSBOMRepository: mockHandler(),
  deleteSBOMRepository: mockDelete(),
  // Surveillance
  listSurveillancePlans: mockList(),
  createSurveillancePlan: mockCreate(),
  updateSurveillancePlan: mockHandler(),
  deleteSurveillancePlan: mockDelete(),
  createSurveillanceIncident: mockCreate(),
  updateSurveillanceIncident: mockHandler(),
  listProductRecalls: mockList(),
  createProductRecall: mockCreate(),
  updateProductRecall: mockHandler(),
  // Decommission
  listProductDecommissions: mockList(),
  createProductDecommission: mockCreate(),
  updateProductDecommission: mockHandler(),
  deleteProductDecommission: mockDelete(),
  // Lifecycle
  listLifecycleAssessments: mockList(),
  createLifecycleAssessment: mockCreate(),
  getLifecycleAssessment: mockHandler(),
  updateLifecycleAssessment: mockHandler(),
  deleteLifecycleAssessment: mockDelete(),
  // Product lifecycle
  listProductLifecycles: mockList(),
  createProductLifecycle: mockCreate(),
  getProductLifecycle: mockHandler(),
  updateProductLifecycle: mockHandler(),
  deleteProductLifecycle: mockDelete(),
  // Process maps
  listProcessMaps: mockList(),
  createProcessMap: mockCreate(),
  getProcessMap: mockHandler(),
  updateProcessMap: mockHandler(),
  deleteProcessMap: mockDelete(),
  // Sync
  syncSBOMToModules: mockHandler({ synced: true }),
  syncBreachToModules: mockHandler({ synced: true }),
  // Integration testing
  testIntegrationConnection: mockHandler({ connected: true }),
  // Regulation data
  getAllRegulationModuleData: mockHandler(),
  getRegulationModuleData: mockHandler(),
  upsertRegulationModuleData: mockHandler(),
  deleteRegulationModuleData: mockDelete(),
  // Metrics
  recordMetric: mockCreate(),
  getLatestMetrics: mockHandler(),
  getMetricsHistory: mockHandler(),
};

jest.mock('../../../controllers/featureModulesController', () => fm);

import featureModulesRoutes from '../../../routes/featureModules';
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
app.use('/api/feature-modules', featureModulesRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('Feature Modules Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');
  const editorToken = generateToken('editor');
  const viewerToken = generateToken('viewer');

  beforeEach(() => jest.clearAllMocks());

  // Helper for testing standard CRUD patterns
  const testCRUD = (
    basePath: string,
    opts: { listStatus?: number; getById?: boolean; createRole?: string; deleteRole?: string } = {}
  ) => {
    const { listStatus = 200, getById = false, createRole = 'editor', deleteRole = 'admin' } = opts;

    it(`GET ${basePath} returns ${listStatus}`, async () => {
      const res = await request(app).get(`/api/feature-modules${basePath}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(listStatus);
    });

    it(`POST ${basePath} returns 201`, async () => {
      const token = createRole === 'admin' ? adminToken : editorToken;
      const res = await request(app)
        .post(`/api/feature-modules${basePath}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Item' });
      expect(res.status).toBe(201);
    });

    it(`POST ${basePath} returns 403 for viewer`, async () => {
      const res = await request(app)
        .post(`/api/feature-modules${basePath}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(403);
    });

    if (getById) {
      it(`GET ${basePath}/test-id returns 200`, async () => {
        const res = await request(app)
          .get(`/api/feature-modules${basePath}/test-id`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      });
    }

    it(`PATCH ${basePath}/test-id returns 200`, async () => {
      const res = await request(app)
        .patch(`/api/feature-modules${basePath}/test-id`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });

    it(`DELETE ${basePath}/test-id returns 200 for admin`, async () => {
      const res = await request(app)
        .delete(`/api/feature-modules${basePath}/test-id`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    if (deleteRole === 'admin') {
      it(`DELETE ${basePath}/test-id returns 403 for editor`, async () => {
        const res = await request(app)
          .delete(`/api/feature-modules${basePath}/test-id`)
          .set('Authorization', `Bearer ${editorToken}`);
        expect(res.status).toBe(403);
      });
    }
  };

  // ── Auth ─────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 without auth on any endpoint', async () => {
      const res = await request(app).get('/api/feature-modules/governance/bodies');
      expect(res.status).toBe(401);
    });
  });

  // ── Governance ───────────────────────────────────────────────────

  describe('Governance Bodies', () => {
    testCRUD('/governance/bodies');
  });

  describe('Governance Meetings', () => {
    it('POST /governance/meetings returns 201', async () => {
      const res = await request(app)
        .post('/api/feature-modules/governance/meetings')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Board Meeting' });
      expect(res.status).toBe(201);
    });

    it('PATCH /governance/meetings/m-1 returns 200', async () => {
      const res = await request(app)
        .patch('/api/feature-modules/governance/meetings/m-1')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'Completed' });
      expect(res.status).toBe(200);
    });

    it('DELETE /governance/meetings/m-1 returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/feature-modules/governance/meetings/m-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Governance DPO', () => {
    it('GET /governance/dpo returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/governance/dpo')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('PUT /governance/dpo returns 200', async () => {
      const res = await request(app)
        .put('/api/feature-modules/governance/dpo')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ name: 'DPO Name' });
      expect(res.status).toBe(200);
    });
  });

  // ── Breach ───────────────────────────────────────────────────────

  describe('Breach Incidents', () => {
    testCRUD('/breach/incidents', { getById: true });
  });

  describe('Breach Templates', () => {
    testCRUD('/breach/templates');
  });

  describe('Regulatory Contacts', () => {
    testCRUD('/breach/contacts');
  });

  // ── CE Marking ───────────────────────────────────────────────────

  describe('CE Products', () => {
    testCRUD('/ce-marking/products', { getById: true });
  });

  describe('CE Read-Only Endpoints', () => {
    const readEndpoints = [
      '/ce-marking/notified-bodies',
      '/ce-marking/requirements',
      '/ce-marking/documents',
      '/ce-marking/risk-items',
      '/ce-marking/surveillance-checks',
    ];
    readEndpoints.forEach((path) => {
      it(`GET ${path} returns 200`, async () => {
        const res = await request(app)
          .get(`/api/feature-modules${path}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      });
    });
  });

  // ── DPP ──────────────────────────────────────────────────────────

  describe('DPP Passports', () => {
    testCRUD('/dpp/passports', { getById: true });
  });

  // ── ESG ──────────────────────────────────────────────────────────

  describe('ESG Metrics', () => {
    testCRUD('/esg/metrics', { getById: true });
  });

  describe('ESG Materiality', () => {
    testCRUD('/esg/materiality', { getById: true });
  });

  // ── SBOM ─────────────────────────────────────────────────────────

  describe('SBOM Entries', () => {
    it('GET /sbom/entries returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/sbom/entries')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('POST /sbom/entries returns 201', async () => {
      const res = await request(app)
        .post('/api/feature-modules/sbom/entries')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ name: 'lodash', version: '4.17' });
      expect(res.status).toBe(201);
    });

    it('POST /sbom/entries/bulk returns 201', async () => {
      const res = await request(app)
        .post('/api/feature-modules/sbom/entries/bulk')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ entries: [{ name: 'lodash' }] });
      expect(res.status).toBe(201);
    });
  });

  describe('SBOM Repositories', () => {
    testCRUD('/sbom/repositories');
  });

  // ── Surveillance ─────────────────────────────────────────────────

  describe('Surveillance Plans', () => {
    testCRUD('/surveillance/plans');
  });

  describe('Surveillance Recalls', () => {
    it('GET /surveillance/recalls returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/surveillance/recalls')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ── Decommission ─────────────────────────────────────────────────

  describe('Product Decommissions', () => {
    testCRUD('/decommission/products');
  });

  // ── Lifecycle ────────────────────────────────────────────────────

  describe('Lifecycle Assessments', () => {
    testCRUD('/lifecycle/assessments', { getById: true });
  });

  // ── Product Lifecycle ────────────────────────────────────────────

  describe('Product Lifecycle', () => {
    testCRUD('/product-lifecycle/products', { getById: true });
  });

  // ── Process Maps ─────────────────────────────────────────────────

  describe('Process Maps', () => {
    testCRUD('/process-maps', { getById: true });
  });

  // ── Sync ─────────────────────────────────────────────────────────

  describe('Inter-Module Sync', () => {
    it('POST /sync/sbom returns 200', async () => {
      const res = await request(app)
        .post('/api/feature-modules/sync/sbom')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
    });

    it('POST /sync/breach returns 200', async () => {
      const res = await request(app)
        .post('/api/feature-modules/sync/breach')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
    });

    it('POST /sync/sbom returns 403 for viewer', async () => {
      const res = await request(app)
        .post('/api/feature-modules/sync/sbom')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Integration Testing ──────────────────────────────────────────

  describe('Integration Connection Test', () => {
    it('GET /integrations/github/test returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/integrations/github/test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ── Regulation Data ──────────────────────────────────────────────

  describe('Regulation Module Data', () => {
    it('GET /regulation-data/nis2 returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/regulation-data/nis2')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /regulation-data/nis2/policies returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/regulation-data/nis2/policies')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('PUT /regulation-data/nis2/policies returns 200', async () => {
      const res = await request(app)
        .put('/api/feature-modules/regulation-data/nis2/policies')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ data: [] });
      expect(res.status).toBe(200);
    });

    it('DELETE /regulation-data/nis2/policies returns 200 for admin', async () => {
      const res = await request(app)
        .delete('/api/feature-modules/regulation-data/nis2/policies')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('DELETE /regulation-data/nis2/policies returns 403 for editor', async () => {
      const res = await request(app)
        .delete('/api/feature-modules/regulation-data/nis2/policies')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Metrics ──────────────────────────────────────────────────────

  describe('Metrics', () => {
    it('POST /metrics returns 201', async () => {
      const res = await request(app)
        .post('/api/feature-modules/metrics')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ metricType: 'compliance', value: 95 });
      expect(res.status).toBe(201);
    });

    it('GET /metrics/latest returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/metrics/latest')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /metrics/compliance returns 200', async () => {
      const res = await request(app)
        .get('/api/feature-modules/metrics/compliance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
