/**
 * Enterprise Routes Integration Tests
 *
 * Exercises the real enterprise router (src/routes/enterprise.ts) and its
 * service collaborators. Each enterprise service is mocked at its actual module
 * path (../services/<name>) so the router wiring, validation middleware,
 * org-scoping of inputs, and status codes are genuinely exercised. The global
 * errorHandler is mounted so thrown AppErrors map to their real HTTP statuses
 * (e.g. 404) instead of surfacing as unhandled 500s.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Database used by routes that hit prisma directly (questionnaire/issue PUT/DELETE/comments).
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

// Authenticated user injected by the auth middleware mock.
const TEST_USER = {
  id: 'user-123',
  email: 'test@example.com',
  organizationId: 'org-123',
  role: 'Admin',
};

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { ...TEST_USER };
    next();
  },
  authorize: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(_req: any, _res: any, next: any) => next()],
  enforceLimit: () => (_req: any, _res: any, next: any) => next(),
}));

// ---------------------------------------------------------------------------
// Enterprise services — mocked at their REAL module paths so the routes import
// these mocks. Method names mirror exactly what routes/enterprise.ts invokes.
// ---------------------------------------------------------------------------
const riskManagementService = {
  createRiskAssessment: jest.fn(),
  getRiskRegister: jest.fn(),
  getRiskDashboard: jest.fn(),
  getRiskHeatMap: jest.fn(),
};
jest.mock('../../../services/riskManagementService', () => ({
  __esModule: true,
  default: riskManagementService,
}));

const questionnaireService = {
  createQuestionnaire: jest.fn(),
  generateAIResponses: jest.fn(),
  completeQuestionnaire: jest.fn(),
  getQuestionnairesByOrganization: jest.fn(),
  getQuestionnaireMetrics: jest.fn(),
  addQuestions: jest.fn(),
  submitResponse: jest.fn(),
};
jest.mock('../../../services/questionnaireService', () => ({
  __esModule: true,
  default: questionnaireService,
}));

const policyLibraryService = {
  createPolicy: jest.fn(),
  bulkImportPolicies: jest.fn(),
  getPolicyTemplates: jest.fn(),
  getPolicyMetrics: jest.fn(),
  getPoliciesByOrganization: jest.fn(),
  getPolicyById: jest.fn(),
  updatePolicy: jest.fn(),
  archivePolicy: jest.fn(),
  approvePolicy: jest.fn(),
  submitForReview: jest.fn(),
  duplicatePolicy: jest.fn(),
};
jest.mock('../../../services/policyLibraryService', () => ({
  __esModule: true,
  default: policyLibraryService,
}));

const trustCenterService = {
  getPublicTrustCenter: jest.fn(),
  createCertificate: jest.fn(),
  generateComplianceCertificate: jest.fn(),
};
jest.mock('../../../services/trustCenterService', () => ({
  __esModule: true,
  default: trustCenterService,
}));

const multiWorkspaceService = {
  createChildOrganization: jest.fn(),
  getOrganizationHierarchy: jest.fn(),
  getConsolidatedMetrics: jest.fn(),
  moveUserToOrganization: jest.fn(),
  cloneFrameworkToChildren: jest.fn(),
};
jest.mock('../../../services/multiWorkspaceService', () => ({
  __esModule: true,
  default: multiWorkspaceService,
}));

const reportingService = {
  createReport: jest.fn(),
  generateComplianceReport: jest.fn(),
  generateRiskReport: jest.fn(),
  generateVendorRiskReport: jest.fn(),
  generateExecutiveSummary: jest.fn(),
};
jest.mock('../../../services/reportingService', () => ({
  __esModule: true,
  default: reportingService,
}));

const monitoringService = {
  createMonitor: jest.fn(),
  executeMonitor: jest.fn(),
  getMonitoringDashboard: jest.fn(),
  getMonitorsByOrganization: jest.fn(),
  getMonitorById: jest.fn(),
  updateMonitor: jest.fn(),
  deleteMonitor: jest.fn(),
  getMonitorResults: jest.fn(),
  toggleMonitorActive: jest.fn(),
  suggestMonitors: jest.fn(),
  analyzeMonitorTrends: jest.fn(),
  triageAlerts: jest.fn(),
};
jest.mock('../../../services/monitoringService', () => ({
  __esModule: true,
  default: monitoringService,
}));

const issueManagementService = {
  createIssue: jest.fn(),
  assignIssue: jest.fn(),
  addComment: jest.fn(),
  getIssueDashboard: jest.fn(),
  getIssuesByOrganization: jest.fn(),
  updateIssueStatus: jest.fn(),
};
jest.mock('../../../services/issueManagementService', () => ({
  __esModule: true,
  default: issueManagementService,
}));

const visionaryAIService = {
  getComplianceCoPilotRecommendations: jest.fn(),
  predictFutureRisks: jest.fn(),
  generatePolicyFromNaturalLanguage: jest.fn(),
  runComplianceAutopilot: jest.fn(),
  getComplianceBenchmarking: jest.fn(),
};
jest.mock('../../../services/visionaryAIService', () => ({
  __esModule: true,
  default: visionaryAIService,
}));

// questionnaireTemplates is loaded via require() inside the route.
jest.mock('../../../data/questionnaireTemplates', () => ({
  questionnaireTemplates: [
    {
      id: 'tmpl-soc2',
      title: 'SOC 2 Vendor Assessment',
      description: 'Standard SOC 2 questionnaire',
      type: 'SecurityAssessment',
      questions: [
        { questionText: 'Do you have SOC 2?', questionType: 'yes_no' },
      ],
    },
  ],
}), { virtual: true });

let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.resetAllMocks();

  // Re-establish auditLog mock (cleared above) used by direct-prisma routes.
  prismaMock.auditLog.create.mockResolvedValue({} as never);

  app = express();
  app.use(express.json());

  const enterpriseRoutes = (await import('../../../routes/enterprise')).default;
  app.use('/api/enterprise', enterpriseRoutes);

  // Mount the real error handler so thrown AppErrors map to their status codes.
  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use(errorHandler);
});

describe('Enterprise Routes Integration', () => {
  // ===========================================================================
  // Risk Management
  // ===========================================================================
  describe('Risk Management', () => {
    it('POST /risk-management/assessments creates an org-scoped assessment', async () => {
      riskManagementService.createRiskAssessment.mockResolvedValue({
        id: 'assess-1',
        name: 'Annual Risk Assessment',
      } as never);

      const response = await request(app)
        .post('/api/enterprise/risk-management/assessments')
        .send({ name: 'Annual Risk Assessment', scope: 'Org-wide' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'assess-1', name: 'Annual Risk Assessment' });
      // Service must be called with the caller's org + user injected server-side.
      expect(riskManagementService.createRiskAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Annual Risk Assessment',
          organizationId: 'org-123',
          userId: 'user-123',
        })
      );
    });

    it('POST /risk-management/assessments rejects a body missing required name with 400', async () => {
      const response = await request(app)
        .post('/api/enterprise/risk-management/assessments')
        .send({ scope: 'Org-wide' });

      expect(response.status).toBe(400);
      expect(riskManagementService.createRiskAssessment).not.toHaveBeenCalled();
    });

    it('GET /risk-management/register returns the org risk register', async () => {
      riskManagementService.getRiskRegister.mockResolvedValue([
        { id: 'risk-1', title: 'Data Breach' },
      ] as never);

      const response = await request(app).get('/api/enterprise/risk-management/register');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 'risk-1', title: 'Data Breach' }]);
      expect(riskManagementService.getRiskRegister).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('GET /risk-management/dashboard scopes the dashboard to the org', async () => {
      riskManagementService.getRiskDashboard.mockResolvedValue({ totalRisks: 5 } as never);

      const response = await request(app).get('/api/enterprise/risk-management/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ totalRisks: 5 });
      expect(riskManagementService.getRiskDashboard).toHaveBeenCalledWith('org-123');
    });

    it('GET /risk-management/heatmap scopes the heat map to the org', async () => {
      riskManagementService.getRiskHeatMap.mockResolvedValue({ cells: [] } as never);

      const response = await request(app).get('/api/enterprise/risk-management/heatmap');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ cells: [] });
      expect(riskManagementService.getRiskHeatMap).toHaveBeenCalledWith('org-123');
    });
  });

  // ===========================================================================
  // Questionnaires
  // ===========================================================================
  describe('Questionnaires', () => {
    it('POST /questionnaires creates an org-scoped questionnaire', async () => {
      questionnaireService.createQuestionnaire.mockResolvedValue({ id: 'q-1', title: 'Vendor Q' } as never);

      const response = await request(app)
        .post('/api/enterprise/questionnaires')
        .send({ title: 'Vendor Q' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'q-1', title: 'Vendor Q' });
      expect(questionnaireService.createQuestionnaire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Vendor Q', organizationId: 'org-123', userId: 'user-123' })
      );
    });

    it('POST /questionnaires rejects an empty body with 400', async () => {
      const response = await request(app).post('/api/enterprise/questionnaires').send({});
      expect(response.status).toBe(400);
      expect(questionnaireService.createQuestionnaire).not.toHaveBeenCalled();
    });

    it('GET /questionnaires lists org questionnaires', async () => {
      questionnaireService.getQuestionnairesByOrganization.mockResolvedValue([{ id: 'q-1' }] as never);

      const response = await request(app).get('/api/enterprise/questionnaires');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 'q-1' }]);
      expect(questionnaireService.getQuestionnairesByOrganization).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('GET /questionnaires/templates returns the static template catalog', async () => {
      const response = await request(app).get('/api/enterprise/questionnaires/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id', 'tmpl-soc2');
    });

    it('POST /questionnaires/from-template returns 404 for an unknown template', async () => {
      const response = await request(app)
        .post('/api/enterprise/questionnaires/from-template')
        .send({ templateId: 'does-not-exist' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Template not found');
    });

    it('POST /questionnaires/from-template builds a questionnaire from a known template', async () => {
      questionnaireService.createQuestionnaire.mockResolvedValue({ id: 'q-tmpl', title: 'SOC 2 Vendor Assessment' } as never);
      questionnaireService.addQuestions.mockResolvedValue([] as never);
      questionnaireService.getQuestionnairesByOrganization.mockResolvedValue([
        { id: 'q-tmpl', title: 'SOC 2 Vendor Assessment' },
      ] as never);

      const response = await request(app)
        .post('/api/enterprise/questionnaires/from-template')
        .send({ templateId: 'tmpl-soc2' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'q-tmpl');
      expect(questionnaireService.createQuestionnaire).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-123', questionnaireType: 'SecurityAssessment' })
      );
      expect(questionnaireService.addQuestions).toHaveBeenCalled();
    });

    it('GET /questionnaires/:id returns 404 when the questionnaire is not in the org', async () => {
      questionnaireService.getQuestionnairesByOrganization.mockResolvedValue([] as never);

      const response = await request(app).get('/api/enterprise/questionnaires/q-unknown');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Questionnaire not found');
    });

    it('PUT /questionnaires/:id returns 404 when org ownership check fails', async () => {
      prismaMock.questionnaire.findFirst.mockResolvedValue(null as never);

      const response = await request(app)
        .put('/api/enterprise/questionnaires/q-foreign')
        .send({ title: 'Renamed' });

      expect(response.status).toBe(404);
      // Ownership lookup must be scoped to the caller's org.
      expect(prismaMock.questionnaire.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-foreign', organizationId: 'org-123' },
        })
      );
      expect(prismaMock.questionnaire.update).not.toHaveBeenCalled();
    });

    it('PUT /questionnaires/:id updates an owned questionnaire', async () => {
      prismaMock.questionnaire.findFirst.mockResolvedValue({ id: 'q-1' } as never);
      prismaMock.questionnaire.update.mockResolvedValue({ id: 'q-1', title: 'Renamed' } as never);

      const response = await request(app)
        .put('/api/enterprise/questionnaires/q-1')
        .send({ title: 'Renamed' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'q-1', title: 'Renamed' });
    });

    it('POST /questionnaires/:id/responses submits a response scoped to org', async () => {
      questionnaireService.submitResponse.mockResolvedValue({ id: 'resp-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/questionnaires/q-1/responses')
        .send({ questionId: 'qq-1', responseText: 'Yes' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'resp-1' });
      expect(questionnaireService.submitResponse).toHaveBeenCalledWith(
        'q-1',
        'qq-1',
        expect.objectContaining({ responseText: 'Yes' }),
        'user-123',
        'org-123'
      );
    });
  });

  // ===========================================================================
  // Policy Library
  // ===========================================================================
  describe('Policy Library', () => {
    it('POST /policies creates an org-scoped policy', async () => {
      policyLibraryService.createPolicy.mockResolvedValue({ id: 'p-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/policies')
        .send({ title: 'InfoSec Policy', category: 'Security', content: 'Body text' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'p-1' });
      expect(policyLibraryService.createPolicy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'InfoSec Policy', organizationId: 'org-123', userId: 'user-123' })
      );
    });

    it('POST /policies rejects a body missing required content with 400', async () => {
      const response = await request(app)
        .post('/api/enterprise/policies')
        .send({ title: 'InfoSec Policy', category: 'Security' });

      expect(response.status).toBe(400);
      expect(policyLibraryService.createPolicy).not.toHaveBeenCalled();
    });

    it('GET /policies lists org policies', async () => {
      policyLibraryService.getPoliciesByOrganization.mockResolvedValue([{ id: 'p-1' }] as never);

      const response = await request(app).get('/api/enterprise/policies');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 'p-1' }]);
      expect(policyLibraryService.getPoliciesByOrganization).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('GET /policies/templates returns templates (routed before /:id)', async () => {
      policyLibraryService.getPolicyTemplates.mockResolvedValue([{ id: 'tmpl-1' }] as never);

      const response = await request(app).get('/api/enterprise/policies/templates');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 'tmpl-1' }]);
      // /:id must NOT have matched "templates".
      expect(policyLibraryService.getPolicyById).not.toHaveBeenCalled();
    });

    it('GET /policies/:id passes org for ownership scoping', async () => {
      policyLibraryService.getPolicyById.mockResolvedValue({ id: 'p-1' } as never);

      const response = await request(app).get('/api/enterprise/policies/p-1');

      expect(response.status).toBe(200);
      expect(policyLibraryService.getPolicyById).toHaveBeenCalledWith('p-1', 'org-123');
    });

    it('POST /policies/:id/approve approves with org scoping', async () => {
      policyLibraryService.approvePolicy.mockResolvedValue({ id: 'p-1', status: 'Approved' } as never);

      const response = await request(app).post('/api/enterprise/policies/p-1/approve');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'Approved');
      expect(policyLibraryService.approvePolicy).toHaveBeenCalledWith('p-1', 'user-123', 'org-123');
    });
  });

  // ===========================================================================
  // Trust Center
  // ===========================================================================
  describe('Trust Center', () => {
    it('GET /trust-center/public/:organizationId is reachable without auth state', async () => {
      trustCenterService.getPublicTrustCenter.mockResolvedValue({ name: 'Acme' } as never);

      const response = await request(app).get('/api/enterprise/trust-center/public/org-public');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ name: 'Acme' });
      expect(trustCenterService.getPublicTrustCenter).toHaveBeenCalledWith('org-public');
    });

    it('POST /trust-center/certificates creates an org-scoped certificate', async () => {
      trustCenterService.createCertificate.mockResolvedValue({ id: 'cert-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/trust-center/certificates')
        .send({
          certificateType: 'SOC2',
          issuer: 'AuditFirm',
          issueDate: '2024-01-01',
          expiryDate: '2025-01-01',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'cert-1' });
      expect(trustCenterService.createCertificate).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-123', userId: 'user-123' })
      );
    });

    it('POST /trust-center/certificates rejects a missing issuer with 400', async () => {
      const response = await request(app)
        .post('/api/enterprise/trust-center/certificates')
        .send({ certificateType: 'SOC2', issueDate: '2024-01-01', expiryDate: '2025-01-01' });

      expect(response.status).toBe(400);
      expect(trustCenterService.createCertificate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Multi-Workspace
  // ===========================================================================
  describe('Multi-Workspace', () => {
    it('GET /workspace/hierarchy scopes to the org', async () => {
      multiWorkspaceService.getOrganizationHierarchy.mockResolvedValue({ root: 'org-123' } as never);

      const response = await request(app).get('/api/enterprise/workspace/hierarchy');

      expect(response.status).toBe(200);
      expect(multiWorkspaceService.getOrganizationHierarchy).toHaveBeenCalledWith('org-123');
    });

    it('POST /workspace/child-organizations creates a child under the caller org', async () => {
      multiWorkspaceService.createChildOrganization.mockResolvedValue({ id: 'child-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/workspace/child-organizations')
        .send({ name: 'Subsidiary' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'child-1' });
      expect(multiWorkspaceService.createChildOrganization).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ name: 'Subsidiary' }),
        'user-123'
      );
    });

    it('POST /workspace/move-user resolves caller org server-side from req.user.id', async () => {
      multiWorkspaceService.moveUserToOrganization.mockResolvedValue({ moved: true } as never);

      const response = await request(app)
        .post('/api/enterprise/workspace/move-user')
        .send({ userId: 'user-456', targetOrganizationId: 'org-child' });

      expect(response.status).toBe(200);
      expect(multiWorkspaceService.moveUserToOrganization).toHaveBeenCalledWith(
        'user-456',
        'org-child',
        'user-123'
      );
    });
  });

  // ===========================================================================
  // Reporting
  // ===========================================================================
  describe('Reports', () => {
    it('GET /reports returns org reports from prisma with a total', async () => {
      prismaMock.customReport.findMany.mockResolvedValue([{ id: 'r-1' }] as never);

      const response = await request(app).get('/api/enterprise/reports');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [{ id: 'r-1' }], total: 1 });
      expect(prismaMock.customReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-123' } })
      );
    });

    it('POST /reports creates an org-scoped report', async () => {
      reportingService.createReport.mockResolvedValue({ id: 'r-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/reports')
        .send({ name: 'Compliance Summary', reportType: 'Compliance', template: { sections: [] } });

      expect(response.status).toBe(201);
      expect(reportingService.createReport).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Compliance Summary', organizationId: 'org-123', userId: 'user-123' })
      );
    });

    it('GET /reports/compliance generates the compliance report for the org', async () => {
      reportingService.generateComplianceReport.mockResolvedValue({ score: 88 } as never);

      const response = await request(app).get('/api/enterprise/reports/compliance?frameworkId=fw-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ score: 88 });
      expect(reportingService.generateComplianceReport).toHaveBeenCalledWith('org-123', 'fw-1');
    });
  });

  // ===========================================================================
  // Monitoring
  // ===========================================================================
  describe('Monitoring', () => {
    it('POST /monitoring creates an org-scoped monitor', async () => {
      monitoringService.createMonitor.mockResolvedValue({ id: 'm-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/monitoring')
        .send({ name: 'SSL Monitor', monitorType: 'Certificate', configuration: { host: 'example.com' } });

      expect(response.status).toBe(201);
      expect(monitoringService.createMonitor).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SSL Monitor', organizationId: 'org-123', userId: 'user-123' })
      );
    });

    it('POST /monitoring rejects a missing configuration with 400', async () => {
      const response = await request(app)
        .post('/api/enterprise/monitoring')
        .send({ name: 'SSL Monitor', monitorType: 'Certificate' });

      expect(response.status).toBe(400);
      expect(monitoringService.createMonitor).not.toHaveBeenCalled();
    });

    it('GET /monitoring/dashboard scopes to the org (routed before /:id)', async () => {
      monitoringService.getMonitoringDashboard.mockResolvedValue({ activeMonitors: 3 } as never);

      const response = await request(app).get('/api/enterprise/monitoring/dashboard');

      expect(response.status).toBe(200);
      expect(monitoringService.getMonitoringDashboard).toHaveBeenCalledWith('org-123');
      expect(monitoringService.getMonitorById).not.toHaveBeenCalled();
    });

    it('GET /monitoring/:id passes org for ownership scoping', async () => {
      monitoringService.getMonitorById.mockResolvedValue({ id: 'm-1' } as never);

      const response = await request(app).get('/api/enterprise/monitoring/m-1');

      expect(response.status).toBe(200);
      expect(monitoringService.getMonitorById).toHaveBeenCalledWith('m-1', 'org-123');
    });
  });

  // ===========================================================================
  // Issue Management
  // ===========================================================================
  describe('Issue Management', () => {
    it('POST /issues creates an org-scoped issue', async () => {
      issueManagementService.createIssue.mockResolvedValue({ id: 'i-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/issues')
        .send({ title: 'Gap found', description: 'Missing control', issueType: 'ComplianceGap' });

      expect(response.status).toBe(201);
      expect(issueManagementService.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Gap found', organizationId: 'org-123', createdById: 'user-123' })
      );
    });

    it('POST /issues rejects a missing description with 400', async () => {
      const response = await request(app)
        .post('/api/enterprise/issues')
        .send({ title: 'Gap found', issueType: 'ComplianceGap' });

      expect(response.status).toBe(400);
      expect(issueManagementService.createIssue).not.toHaveBeenCalled();
    });

    it('GET /issues/:id returns 404 for an issue outside the org and scopes the lookup', async () => {
      prismaMock.issue.findFirst.mockResolvedValue(null as never);

      const response = await request(app).get('/api/enterprise/issues/i-foreign');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Issue not found');
      expect(prismaMock.issue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'i-foreign', organizationId: 'org-123' }),
        })
      );
    });

    it('GET /issues/:id returns an owned issue', async () => {
      prismaMock.issue.findFirst.mockResolvedValue({ id: 'i-1', title: 'Gap' } as never);

      const response = await request(app).get('/api/enterprise/issues/i-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'i-1');
    });

    it('GET /issues/:id/comments returns 404 when the parent issue is not in the org', async () => {
      prismaMock.issue.findFirst.mockResolvedValue(null as never);

      const response = await request(app).get('/api/enterprise/issues/i-foreign/comments');

      expect(response.status).toBe(404);
      expect(prismaMock.issueComment.findMany).not.toHaveBeenCalled();
    });

    it('POST /issues/:id/comments adds a comment scoped to the org', async () => {
      issueManagementService.addComment.mockResolvedValue({ id: 'c-1' } as never);

      const response = await request(app)
        .post('/api/enterprise/issues/i-1/comments')
        .send({ comment: 'Working on it' });

      expect(response.status).toBe(200);
      expect(issueManagementService.addComment).toHaveBeenCalledWith(
        'i-1',
        expect.objectContaining({ comment: 'Working on it', userId: 'user-123' }),
        'org-123'
      );
    });
  });

  // ===========================================================================
  // Visionary AI
  // ===========================================================================
  describe('Visionary AI', () => {
    it('GET /visionary-ai/copilot/recommendations scopes to org+user', async () => {
      visionaryAIService.getComplianceCoPilotRecommendations.mockResolvedValue({ items: [] } as never);

      const response = await request(app).get('/api/enterprise/visionary-ai/copilot/recommendations');

      expect(response.status).toBe(200);
      expect(visionaryAIService.getComplianceCoPilotRecommendations).toHaveBeenCalledWith('org-123', 'user-123');
    });

    it('POST /visionary-ai/predict-risks passes the time horizon', async () => {
      visionaryAIService.predictFutureRisks.mockResolvedValue({ predictions: [] } as never);

      const response = await request(app)
        .post('/api/enterprise/visionary-ai/predict-risks')
        .send({ timeHorizonDays: 120 });

      expect(response.status).toBe(200);
      expect(visionaryAIService.predictFutureRisks).toHaveBeenCalledWith('org-123', 120, 'user-123');
    });

    it('POST /visionary-ai/predict-risks rejects an out-of-range horizon with 400', async () => {
      const response = await request(app)
        .post('/api/enterprise/visionary-ai/predict-risks')
        .send({ timeHorizonDays: 9999 });

      expect(response.status).toBe(400);
      expect(visionaryAIService.predictFutureRisks).not.toHaveBeenCalled();
    });

    it('GET /visionary-ai/benchmarking defaults industry to Technology', async () => {
      visionaryAIService.getComplianceBenchmarking.mockResolvedValue({ percentile: 70 } as never);

      const response = await request(app).get('/api/enterprise/visionary-ai/benchmarking');

      expect(response.status).toBe(200);
      expect(visionaryAIService.getComplianceBenchmarking).toHaveBeenCalledWith('org-123', 'Technology', 'user-123');
    });
  });
});
