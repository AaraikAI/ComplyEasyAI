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

// jest.config sets resetMocks:true, which wipes every mock implementation
// before each test. If left wiped, the controller mocks become bare jest.fn()s
// that never send a response, so each request hangs for the full test timeout.
// To avoid that, each fm method's implementation is captured here as a factory
// and re-installed in beforeEach (see implFor + the beforeEach loop below).
const implHandler = (data: any = { id: 'mock-1' }, status = 200) =>
  (_req: any, res: any) => res.status(status).json(data);
const implCreate = (data: any = { id: 'mock-new' }) =>
  (_req: any, res: any) => res.status(201).json(data);
const implDelete = () =>
  (_req: any, res: any) => res.json({ success: true });
const implList = (data: any[] = []) =>
  (_req: any, res: any) => res.json(data);

// Each factory below builds the jest.fn with its implementation. The same
// kind of implementation is re-installed in beforeEach (by name heuristic)
// after resetMocks clears it.
const mockHandler = (data: any = { id: 'mock-1' }, status = 200) =>
  jest.fn<any>().mockImplementation(implHandler(data, status));
const mockCreate = (data: any = { id: 'mock-new' }) =>
  jest.fn<any>().mockImplementation(implCreate(data));
const mockDelete = () =>
  jest.fn<any>().mockImplementation(implDelete());
const mockList = (data: any[] = []) =>
  jest.fn<any>().mockImplementation(implList(data));

// Returns the correct implementation for an fm method, inferred from its name.
// Create-like verbs respond 201; list verbs respond with an array; everything
// else (get/update/patch/upsert/sync/test) responds 200. Tests assert status
// codes only, so a uniform 200/201 body is sufficient.
const implFor = (name: string): ((req: any, res: any) => any) => {
  if (/^(create|bulkCreate|generate|record)/.test(name)) return implCreate();
  if (/^(delete)/.test(name)) return implDelete();
  if (/^list/.test(name)) return implList();
  return implHandler();
};

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
  getDPPMaterials: mockHandler(),
  getDPPCarbon: mockHandler(),
  getDPPSupplyChain: mockHandler(),
  getDPPSustainability: mockHandler(),
  getDPPCertifications: mockHandler(),
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
  generateESGReport: mockCreate(),
  listESGReports: mockList(),
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
  listSBOMLicenses: mockList(),
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
  listDecommissionNotifications: mockList(),
  createDecommissionNotification: mockCreate(),
  updateDecommissionNotification: mockHandler(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    // resetMocks:true wipes implementations before each test — re-install them
    // so every controller handler actually sends a response (otherwise requests
    // hang until the test timeout).
    for (const name of Object.keys(fm)) {
      (fm[name] as jest.Mock<any>).mockImplementation(implFor(name) as any);
    }
  });

  // Helper for testing standard CRUD patterns. createBody/updateBody must
  // satisfy the route's real validateBody Joi schema (the routes run the actual
  // schemas, so a generic { name } no longer passes most modules).
  const testCRUD = (
    basePath: string,
    opts: {
      listStatus?: number;
      getById?: boolean;
      createRole?: string;
      deleteRole?: string;
      createBody?: Record<string, unknown>;
      updateBody?: Record<string, unknown>;
    } = {}
  ) => {
    const {
      listStatus = 200,
      getById = false,
      createRole = 'editor',
      deleteRole = 'admin',
      createBody = { name: 'Test Item' },
      updateBody = { name: 'Updated' },
    } = opts;

    it(`GET ${basePath} returns ${listStatus}`, async () => {
      const res = await request(app).get(`/api/feature-modules${basePath}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(listStatus);
    });

    it(`POST ${basePath} returns 201`, async () => {
      const token = createRole === 'admin' ? adminToken : editorToken;
      const res = await request(app)
        .post(`/api/feature-modules${basePath}`)
        .set('Authorization', `Bearer ${token}`)
        .send(createBody);
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
        .send(updateBody);
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
    testCRUD('/governance/bodies', {
      createBody: { name: 'Audit Board', type: 'Board' },
      updateBody: { name: 'Audit Board v2', status: 'active' },
    });
  });

  describe('Governance Meetings', () => {
    it('POST /governance/meetings returns 201', async () => {
      const res = await request(app)
        .post('/api/feature-modules/governance/meetings')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          governanceBodyId: '11111111-1111-1111-1111-111111111111',
          title: 'Board Meeting',
          date: '2026-07-01T10:00:00.000Z',
        });
      expect(res.status).toBe(201);
    });

    it('PATCH /governance/meetings/m-1 returns 200', async () => {
      const res = await request(app)
        .patch('/api/feature-modules/governance/meetings/m-1')
        .set('Authorization', `Bearer ${editorToken}`)
        // meeting status enum is lowercase
        .send({ status: 'completed' });
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
        .send({ name: 'DPO Name', email: 'dpo@example.com' });
      expect(res.status).toBe(200);
    });
  });

  // ── Breach ───────────────────────────────────────────────────────

  describe('Breach Incidents', () => {
    testCRUD('/breach/incidents', {
      getById: true,
      createBody: {
        title: 'Data Leak',
        breachType: 'Confidentiality',
        severity: 'High',
        discoveryDate: '2026-06-01T00:00:00.000Z',
      },
      updateBody: { status: 'investigating' },
    });
  });

  describe('Breach Templates', () => {
    testCRUD('/breach/templates', {
      createBody: {
        name: 'GDPR DPA Notice',
        jurisdiction: 'EU',
        recipientType: 'DPA',
        body: 'Template body content.',
      },
      updateBody: { name: 'GDPR DPA Notice v2' },
    });
  });

  describe('Regulatory Contacts', () => {
    testCRUD('/breach/contacts', {
      createBody: { name: 'EU DPA', authority: 'Data Protection Authority', jurisdiction: 'EU' },
      updateBody: { name: 'EU DPA Updated' },
    });
  });

  // ── CE Marking ───────────────────────────────────────────────────

  describe('CE Products', () => {
    testCRUD('/ce-marking/products', {
      getById: true,
      createBody: { name: 'Industrial Press', category: 'Machinery' },
      updateBody: { status: 'assessment' },
    });
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
    testCRUD('/dpp/passports', {
      getById: true,
      createBody: { productName: 'EcoWidget' },
      updateBody: { productName: 'EcoWidget v2' },
    });
  });

  // ── ESG ──────────────────────────────────────────────────────────

  describe('ESG Metrics', () => {
    testCRUD('/esg/metrics', {
      getById: true,
      createBody: {
        category: 'Environmental',
        subcategory: 'Emissions',
        name: 'CO2 Output',
        value: 123.4,
        unit: 'tCO2e',
      },
      updateBody: { value: 200 },
    });
  });

  describe('ESG Materiality', () => {
    testCRUD('/esg/materiality', {
      getById: true,
      createBody: { topic: 'Climate Resilience' },
      updateBody: { description: 'Updated assessment description' },
    });
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
        .send({ componentName: 'lodash', componentVersion: '4.17.21' });
      expect(res.status).toBe(201);
    });

    it('POST /sbom/entries/bulk returns 201', async () => {
      const res = await request(app)
        .post('/api/feature-modules/sbom/entries/bulk')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ entries: [{ componentName: 'lodash', componentVersion: '4.17.21' }] });
      expect(res.status).toBe(201);
    });
  });

  describe('SBOM Repositories', () => {
    testCRUD('/sbom/repositories', {
      createBody: { name: 'main-repo' },
      updateBody: { name: 'main-repo-renamed' },
    });
  });

  // ── Surveillance ─────────────────────────────────────────────────

  describe('Surveillance Plans', () => {
    testCRUD('/surveillance/plans', {
      createBody: { productName: 'Medical Pump', planType: 'Proactive', frequency: 'Monthly' },
      updateBody: { status: 'active' },
    });
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
    testCRUD('/decommission/products', {
      createBody: { productName: 'Legacy API' },
      updateBody: { lifecycleStage: 'end_of_life' },
    });
  });

  // ── Lifecycle ────────────────────────────────────────────────────

  describe('Lifecycle Assessments', () => {
    testCRUD('/lifecycle/assessments', {
      getById: true,
      createBody: { productName: 'Solar Panel' },
      updateBody: { waterUsage: 42 },
    });
  });

  // ── Product Lifecycle ────────────────────────────────────────────

  describe('Product Lifecycle', () => {
    testCRUD('/product-lifecycle/products', {
      getById: true,
      createBody: { productName: 'Smart Sensor' },
      updateBody: { currentStage: 'Active' },
    });
  });

  // ── Process Maps ─────────────────────────────────────────────────

  describe('Process Maps', () => {
    testCRUD('/process-maps', {
      getById: true,
      createBody: { name: 'Onboarding Flow', nodes: [{ id: 'n1' }], edges: [] },
      updateBody: { name: 'Onboarding Flow v2' },
    });
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
        // upsertRegulationModuleDataSchema requires `data` to be an object
        .send({ data: { items: [] } });
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
        // recordMetricSchema requires module + metricName + value
        .send({ module: 'compliance', metricName: 'score', value: 95 });
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
