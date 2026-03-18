/**
 * Compliance Routes Integration Tests
 *
 * Tests for DORA, SOD, SOX, and Auditor routes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  requireRole: () => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

// Mock DORA service
jest.mock('../../../services/doraService', () => ({
  __esModule: true,
  getDORADashboard: jest.fn().mockResolvedValue({
    riskAssessments: { total: 0, byStatus: {} },
    incidents: { total: 0, byStatus: {} },
    providers: { total: 0, byCriticality: {} },
    resilienceTests: { total: 0, byStatus: {} },
    complianceScore: 0,
  }),
  calculateDORAComplianceScore: jest.fn().mockResolvedValue({ score: 85, details: {} }),
  listICTRiskAssessments: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  getICTRiskAssessment: jest.fn().mockResolvedValue({ id: 'assessment-123' }),
  createICTRiskAssessment: jest.fn().mockResolvedValue({
    id: 'assessment-123',
    name: 'Q1 ICT Risk Assessment',
    organizationId: 'org-123',
  }),
  updateICTRiskAssessment: jest.fn().mockResolvedValue({ id: 'assessment-123' }),
  deleteICTRiskAssessment: jest.fn().mockResolvedValue({ success: true }),
  scoreICTRiskAssessment: jest.fn().mockResolvedValue({ score: 75 }),
  listICTIncidents: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  getICTIncident: jest.fn().mockResolvedValue({ id: 'incident-123' }),
  createICTIncident: jest.fn().mockResolvedValue({ id: 'incident-123' }),
  updateICTIncident: jest.fn().mockResolvedValue({ id: 'incident-123' }),
  escalateIncident: jest.fn().mockResolvedValue({ id: 'incident-123' }),
  deleteICTIncident: jest.fn().mockResolvedValue({ success: true }),
  listThirdPartyProviders: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  getThirdPartyProvider: jest.fn().mockResolvedValue({ id: 'provider-123' }),
  createThirdPartyProvider: jest.fn().mockResolvedValue({ id: 'provider-123' }),
  updateThirdPartyProvider: jest.fn().mockResolvedValue({ id: 'provider-123' }),
  deleteThirdPartyProvider: jest.fn().mockResolvedValue({ success: true }),
  assessConcentrationRisk: jest.fn().mockResolvedValue({ risk: 'low' }),
  listResilienceTests: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  getResilienceTest: jest.fn().mockResolvedValue({ id: 'test-123' }),
  createResilienceTest: jest.fn().mockResolvedValue({ id: 'test-123' }),
  updateResilienceTest: jest.fn().mockResolvedValue({ id: 'test-123' }),
  deleteResilienceTest: jest.fn().mockResolvedValue({ success: true }),
  executeResilienceTest: jest.fn().mockResolvedValue({ id: 'test-123', status: 'Running' }),
  listInformationRegister: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  getInformationRegisterEntry: jest.fn().mockResolvedValue({ id: 'entry-123' }),
  createInformationRegisterEntry: jest.fn().mockResolvedValue({ id: 'entry-123' }),
  updateInformationRegisterEntry: jest.fn().mockResolvedValue({ id: 'entry-123' }),
  deleteInformationRegisterEntry: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock SoD service
jest.mock('../../../services/sodService', () => ({
  __esModule: true,
  default: {
    getSoDDashboard: jest.fn().mockResolvedValue({ totalViolations: 0, rules: 0 }),
    getSoDRules: jest.fn().mockResolvedValue([]),
    createSoDRule: jest.fn().mockResolvedValue({ id: 'rule-123', name: 'Test Rule' }),
    getSoDRuleById: jest.fn().mockResolvedValue({ id: 'rule-123' }),
    updateSoDRule: jest.fn().mockResolvedValue({ id: 'rule-123' }),
    deleteSoDRule: jest.fn().mockResolvedValue(undefined),
    importSoDRules: jest.fn().mockResolvedValue({ imported: 0 }),
    getSoDViolations: jest.fn().mockResolvedValue([]),
    getSoDViolationById: jest.fn().mockResolvedValue({ id: 'violation-123' }),
    mitigateViolation: jest.fn().mockResolvedValue({ success: true }),
    acceptViolation: jest.fn().mockResolvedValue({ success: true }),
    remediateViolation: jest.fn().mockResolvedValue({ success: true }),
    getCompensatingControls: jest.fn().mockResolvedValue([]),
    addCompensatingControl: jest.fn().mockResolvedValue({ id: 'control-123' }),
    updateCompensatingControl: jest.fn().mockResolvedValue({ id: 'control-123' }),
    deleteCompensatingControl: jest.fn().mockResolvedValue(undefined),
    getSoDMatrix: jest.fn().mockResolvedValue({ functions: [], conflicts: [] }),
    runSoDAnalysis: jest.fn().mockResolvedValue({ violations: [], summary: {} }),
  },
}));

// Mock SOX service
jest.mock('../../../services/soxService', () => ({
  __esModule: true,
  default: {
    getSOXDashboard: jest.fn().mockResolvedValue({
      complianceScore: 85,
      totalControls: 10,
      testedControls: 8,
      deficiencies: 1,
    }),
    getSOXControls: jest.fn().mockResolvedValue([]),
    createSOXControl: jest.fn().mockResolvedValue({
      id: 'control-123',
      name: 'Revenue Recognition Control',
      controlId: 'SOX-001',
      organizationId: 'org-123',
    }),
    getSOXControlById: jest.fn().mockResolvedValue({ id: 'control-123' }),
    updateSOXControl: jest.fn().mockResolvedValue({ id: 'control-123' }),
    deleteSOXControl: jest.fn().mockResolvedValue(undefined),
    getSOXTestResults: jest.fn().mockResolvedValue([]),
    createSOXTestResult: jest.fn().mockResolvedValue({ id: 'test-123' }),
    getSOXTestResultById: jest.fn().mockResolvedValue({ id: 'test-123' }),
    updateSOXTestResult: jest.fn().mockResolvedValue({ id: 'test-123' }),
    deleteSOXTestResult: jest.fn().mockResolvedValue(undefined),
    getSOXAssessments: jest.fn().mockResolvedValue([]),
    createSOXAssessment: jest.fn().mockResolvedValue({ id: 'assessment-123' }),
    getSOXAssessmentById: jest.fn().mockResolvedValue({ id: 'assessment-123' }),
    updateSOXAssessment: jest.fn().mockResolvedValue({ id: 'assessment-123' }),
    deleteSOXAssessment: jest.fn().mockResolvedValue(undefined),
    generateSOXReport: jest.fn().mockResolvedValue({ sections: [] }),
  },
}));

// Mock Auditor service
jest.mock('../../../services/auditorService', () => ({
  __esModule: true,
  default: {
    getDashboardStats: jest.fn().mockResolvedValue({ totalAuditors: 0, activeEngagements: 0 }),
    matchAuditors: jest.fn().mockResolvedValue([]),
    listAuditorProfiles: jest.fn().mockResolvedValue([]),
    createAuditorProfile: jest.fn().mockResolvedValue({ id: 'profile-123' }),
    getAuditorProfile: jest.fn().mockResolvedValue({ id: 'profile-123' }),
    updateAuditorProfile: jest.fn().mockResolvedValue({ id: 'profile-123' }),
    deleteAuditorProfile: jest.fn().mockResolvedValue(undefined),
    listEngagements: jest.fn().mockResolvedValue([]),
    createEngagement: jest.fn().mockResolvedValue({
      id: 'engagement-123',
      name: 'SOC 2 Type II Audit',
      organizationId: 'org-123',
    }),
    getEngagement: jest.fn().mockResolvedValue({ id: 'engagement-123' }),
    updateEngagement: jest.fn().mockResolvedValue({ id: 'engagement-123' }),
    deleteEngagement: jest.fn().mockResolvedValue(undefined),
    listFindings: jest.fn().mockResolvedValue([]),
    createFinding: jest.fn().mockResolvedValue({ id: 'finding-123' }),
    getFinding: jest.fn().mockResolvedValue({ id: 'finding-123' }),
    updateFinding: jest.fn().mockResolvedValue({ id: 'finding-123' }),
    deleteFinding: jest.fn().mockResolvedValue(undefined),
    listWorkpapers: jest.fn().mockResolvedValue([]),
    createWorkpaper: jest.fn().mockResolvedValue({ id: 'workpaper-123' }),
    getWorkpaper: jest.fn().mockResolvedValue({ id: 'workpaper-123' }),
    updateWorkpaper: jest.fn().mockResolvedValue({ id: 'workpaper-123' }),
    deleteWorkpaper: jest.fn().mockResolvedValue(undefined),
    listRequests: jest.fn().mockResolvedValue([]),
    createRequest: jest.fn().mockResolvedValue({ id: 'request-123' }),
    getRequest: jest.fn().mockResolvedValue({ id: 'request-123' }),
    updateRequest: jest.fn().mockResolvedValue({ id: 'request-123' }),
    deleteRequest: jest.fn().mockResolvedValue(undefined),
  },
}));

// Setup app
let app: Express;

describe('DORA Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-setup doraService mocks (resetMocks: true clears implementations)
    const doraService = require('../../../services/doraService');
    doraService.getDORADashboard.mockResolvedValue({
      riskAssessments: { total: 0, byStatus: {} },
      incidents: { total: 0, byStatus: {} },
      providers: { total: 0, byCriticality: {} },
      resilienceTests: { total: 0, byStatus: {} },
      complianceScore: 0,
    });
    doraService.createICTRiskAssessment.mockResolvedValue({
      id: 'assessment-123',
      name: 'Q1 ICT Risk Assessment',
      organizationId: 'org-123',
    });

    app = express();
    app.use(express.json());

    const doraRoutes = (await import('../../../routes/dora')).default;
    app.use('/api/dora', doraRoutes);
  });

  describe('GET /api/dora/dashboard', () => {
    it('should return DORA compliance dashboard', async () => {
      const response = await request(app)
        .get('/api/dora/dashboard')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/dora/risk-assessments', () => {
    it('should create ICT risk assessment', async () => {
      const response = await request(app)
        .post('/api/dora/risk-assessments')
        .send({
          name: 'Q1 ICT Risk Assessment',
          assessmentDate: new Date().toISOString(),
          scope: 'All ICT systems',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});

describe('SOD Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-setup sodService mocks
    const sodService = require('../../../services/sodService').default;
    sodService.getSoDRules.mockResolvedValue([
      { id: 'rule-1', name: 'Procurement Rule', status: 'Active' },
      { id: 'rule-2', name: 'Finance Rule', status: 'Active' },
    ]);
    sodService.runSoDAnalysis.mockResolvedValue({ violations: [], summary: {} });

    app = express();
    app.use(express.json());

    const sodRoutes = (await import('../../../routes/sod')).default;
    app.use('/api/sod', sodRoutes);
  });

  describe('GET /api/sod/rules', () => {
    it('should list SoD rules', async () => {
      const response = await request(app)
        .get('/api/sod/rules')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/sod/analyze', () => {
    it('should run SoD analysis', async () => {
      const response = await request(app)
        .post('/api/sod/analyze')
        .send({
          scope: 'all',
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});

describe('SOX Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-setup soxService mocks
    const soxService = require('../../../services/soxService').default;
    soxService.getSOXControls.mockResolvedValue([]);
    soxService.createSOXControl.mockResolvedValue({
      id: 'control-123',
      name: 'Revenue Recognition Control',
      controlId: 'SOX-001',
      organizationId: 'org-123',
    });

    app = express();
    app.use(express.json());

    const soxRoutes = (await import('../../../routes/sox')).default;
    app.use('/api/sox', soxRoutes);
  });

  describe('GET /api/sox/controls', () => {
    it('should list SOX controls', async () => {
      const response = await request(app)
        .get('/api/sox/controls')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/sox/controls', () => {
    it('should create SOX control', async () => {
      const response = await request(app)
        .post('/api/sox/controls')
        .send({
          name: 'Revenue Recognition Control',
          controlId: 'SOX-001',
          category: 'Financial Reporting',
          controlType: 'Detective',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});

describe('Auditor Routes Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-setup auditorService mocks
    const auditorService = require('../../../services/auditorService').default;
    auditorService.listEngagements.mockResolvedValue([]);
    auditorService.createEngagement.mockResolvedValue({
      id: 'engagement-123',
      name: 'SOC 2 Type II Audit',
      organizationId: 'org-123',
    });

    app = express();
    app.use(express.json());

    const auditorRoutes = (await import('../../../routes/auditor')).default;
    app.use('/api/auditor', auditorRoutes);
  });

  describe('GET /api/auditor/engagements', () => {
    it('should list audit engagements', async () => {
      const response = await request(app)
        .get('/api/auditor/engagements')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/auditor/engagements', () => {
    it('should create audit engagement', async () => {
      const response = await request(app)
        .post('/api/auditor/engagements')
        .send({
          name: 'SOC 2 Type II Audit',
          auditType: 'SOC 2',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
