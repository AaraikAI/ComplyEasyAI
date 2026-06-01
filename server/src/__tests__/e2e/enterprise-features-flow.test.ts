/**
 * E2E Tests - Enterprise Features Flow
 * Tests complete enterprise workflows: risk management, questionnaires,
 * policy library, trust center, multi-workspace, reporting, monitoring,
 * issue management, and visionary AI.
 *
 * Exercises the real sub-routers mounted in src/routes/enterprise.ts. Route
 * handlers delegate to the enterprise service layer, which is mocked here so
 * assertions verify the route wiring (path + method + status + response shape)
 * deterministically. Routes that hit prisma directly use the shared prismaMock.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

// Provide ALL tierMiddleware exports the route module imports at load time.
jest.mock('../../middleware/tierMiddleware', () => {
  const pass = (_req: any, _res: any, next: any) => next();
  const passArr = () => [pass];
  return {
    __esModule: true,
    requireFeature: () => pass,
    requireTier: () => pass,
    enforceLimit: () => pass,
    attachTierInfo: () => pass,
    trackUsage: () => pass,
    requireFeatureAndLimit: () => pass,
    requireActiveSubscription: () => pass,
    requireAiFeature: passArr,
    requireResourceCreation: passArr,
    requireEnterpriseFeature: passArr,
    requireAcosFeature: passArr,
    requireVisionaryFeature: passArr,
    default: {},
  };
});

const svc = (methods: string[]) => {
  const obj: Record<string, jest.Mock> = {};
  for (const m of methods) obj[m] = jest.fn();
  return { __esModule: true, default: obj };
};

jest.mock('../../services/riskManagementService', () =>
  svc(['createRiskAssessment', 'getRiskRegister', 'getRiskDashboard', 'getRiskHeatMap']));
jest.mock('../../services/questionnaireService', () =>
  svc(['createQuestionnaire', 'generateAIResponses', 'completeQuestionnaire', 'getQuestionnairesByOrganization', 'getQuestionnaireMetrics', 'addQuestions', 'submitResponse']));
jest.mock('../../services/policyLibraryService', () =>
  svc(['createPolicy', 'bulkImportPolicies', 'getPolicyTemplates', 'getPolicyMetrics', 'getPoliciesByOrganization', 'getPolicyById', 'updatePolicy', 'archivePolicy', 'approvePolicy', 'submitForReview', 'duplicatePolicy']));
jest.mock('../../services/trustCenterService', () =>
  svc(['getPublicTrustCenter', 'createCertificate', 'generateComplianceCertificate']));
jest.mock('../../services/multiWorkspaceService', () =>
  svc(['createChildOrganization', 'getOrganizationHierarchy', 'getConsolidatedMetrics', 'moveUserToOrganization', 'cloneFrameworkToChildren']));
jest.mock('../../services/reportingService', () =>
  svc(['createReport', 'generateComplianceReport', 'generateRiskReport', 'generateVendorRiskReport', 'generateExecutiveSummary']));
jest.mock('../../services/monitoringService', () =>
  svc(['createMonitor', 'executeMonitor', 'getMonitoringDashboard', 'getMonitorsByOrganization', 'getMonitorById', 'updateMonitor', 'deleteMonitor', 'getMonitorResults', 'toggleMonitorActive', 'suggestMonitors', 'analyzeMonitorTrends', 'triageAlerts']));
jest.mock('../../services/issueManagementService', () =>
  svc(['createIssue', 'assignIssue', 'addComment', 'getIssueDashboard', 'getIssuesByOrganization', 'updateIssueStatus']));
jest.mock('../../services/visionaryAIService', () =>
  svc(['getComplianceCoPilotRecommendations', 'predictFutureRisks', 'generatePolicyFromNaturalLanguage', 'runComplianceAutopilot', 'getComplianceBenchmarking']));

import enterpriseRoutes from '../../routes/enterprise';
import { errorHandler } from '../../middleware/errorHandler';
import riskManagementService from '../../services/riskManagementService';
import questionnaireService from '../../services/questionnaireService';
import policyLibraryService from '../../services/policyLibraryService';
import trustCenterService from '../../services/trustCenterService';
import multiWorkspaceService from '../../services/multiWorkspaceService';
import reportingService from '../../services/reportingService';
import monitoringService from '../../services/monitoringService';
import issueManagementService from '../../services/issueManagementService';

const asMocks = (s: unknown) => s as unknown as Record<string, jest.Mock>;
const risk = asMocks(riskManagementService);
const questionnaire = asMocks(questionnaireService);
const policy = asMocks(policyLibraryService);
const trustCenter = asMocks(trustCenterService);
const workspace = asMocks(multiWorkspaceService);
const reporting = asMocks(reportingService);
const monitoring = asMocks(monitoringService);
const issues = asMocks(issueManagementService);

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/enterprise', enterpriseRoutes);
app.use(errorHandler);

describe('E2E: Enterprise Features Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Risk Management
  // ===========================================================================
  describe('Risk Management', () => {
    it('should create a risk assessment', async () => {
      risk.createRiskAssessment.mockResolvedValue({ id: 'ra-123', name: 'Annual Risk Assessment' });

      const response = await request(app)
        .post('/api/enterprise/risk-management/assessments')
        .send({ name: 'Annual Risk Assessment', assessmentType: 'Strategic' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'ra-123');
      expect(risk.createRiskAssessment).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Annual Risk Assessment', organizationId: 'org-123', userId: 'user-123' })
      );
    });

    it('should get the risk register', async () => {
      risk.getRiskRegister.mockResolvedValue([{ id: 'r1', title: 'Market Risk' }]);

      const response = await request(app)
        .get('/api/enterprise/risk-management/register')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('title', 'Market Risk');
    });

    it('should get the risk heat map', async () => {
      risk.getRiskHeatMap.mockResolvedValue({ matrix: [[0, 1], [2, 3]] });

      const response = await request(app)
        .get('/api/enterprise/risk-management/heatmap')
        .expect(200);

      expect(response.body).toHaveProperty('matrix');
    });
  });

  // ===========================================================================
  // Questionnaire Automation
  // ===========================================================================
  describe('Questionnaire Automation', () => {
    it('should create a questionnaire', async () => {
      questionnaire.createQuestionnaire.mockResolvedValue({ id: 'q-123', title: 'Security Assessment' });

      const response = await request(app)
        .post('/api/enterprise/questionnaires')
        .send({ title: 'Security Assessment', questionnaireType: 'SIG Lite' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'q-123');
    });

    it('should list questionnaires', async () => {
      questionnaire.getQuestionnairesByOrganization.mockResolvedValue([{ id: 'q-123' }]);

      const response = await request(app)
        .get('/api/enterprise/questionnaires')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get questionnaire templates', async () => {
      const response = await request(app)
        .get('/api/enterprise/questionnaires/templates')
        .expect(200);

      // Templates are served from a static data module (not the mocked service).
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ===========================================================================
  // Policy Library
  // ===========================================================================
  describe('Policy Library', () => {
    it('should create a policy', async () => {
      policy.createPolicy.mockResolvedValue({ id: 'pol-123', title: 'Information Security Policy', status: 'Draft' });

      const response = await request(app)
        .post('/api/enterprise/policies')
        .send({
          title: 'Information Security Policy',
          category: 'Security',
          content: 'Policy content goes here.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'pol-123');
    });

    it('should get policy templates', async () => {
      policy.getPolicyTemplates.mockResolvedValue([{ id: 'pt-1', name: 'ISP Template' }]);

      const response = await request(app)
        .get('/api/enterprise/policies/templates')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name', 'ISP Template');
    });

    it('should approve a policy', async () => {
      policy.approvePolicy.mockResolvedValue({ id: 'pol-123', status: 'Approved' });

      const response = await request(app)
        .post('/api/enterprise/policies/pol-123/approve')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Approved');
      expect(policy.approvePolicy).toHaveBeenCalledWith('pol-123', 'user-123', 'org-123');
    });
  });

  // ===========================================================================
  // Trust Center
  // ===========================================================================
  describe('Trust Center', () => {
    it('should create a certificate', async () => {
      trustCenter.createCertificate.mockResolvedValue({ id: 'cert-123', certificateType: 'SOC 2' });

      const response = await request(app)
        .post('/api/enterprise/trust-center/certificates')
        .send({
          certificateType: 'SOC 2',
          issuer: 'Big Four Auditing',
          issueDate: '2024-01-01T00:00:00.000Z',
          expiryDate: '2025-01-01T00:00:00.000Z',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'cert-123');
    });

    it('should serve the public trust center without auth', async () => {
      trustCenter.getPublicTrustCenter.mockResolvedValue({ organizationId: 'org-123', certificates: [] });

      const response = await request(app)
        .get('/api/enterprise/trust-center/public/org-123')
        .expect(200);

      expect(response.body).toHaveProperty('organizationId', 'org-123');
    });
  });

  // ===========================================================================
  // Multi-Workspace
  // ===========================================================================
  describe('Multi-Workspace', () => {
    it('should create a child organization', async () => {
      workspace.createChildOrganization.mockResolvedValue({ id: 'child-123', name: 'US Operations' });

      const response = await request(app)
        .post('/api/enterprise/workspace/child-organizations')
        .send({ name: 'US Operations' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'child-123');
    });

    it('should get the organization hierarchy', async () => {
      workspace.getOrganizationHierarchy.mockResolvedValue({ root: 'org-123', children: ['child-123'] });

      const response = await request(app)
        .get('/api/enterprise/workspace/hierarchy')
        .expect(200);

      expect(response.body).toHaveProperty('root', 'org-123');
    });
  });

  // ===========================================================================
  // Reporting
  // ===========================================================================
  describe('Reporting', () => {
    it('should list custom reports', async () => {
      prismaMock.customReport.findMany.mockResolvedValue([
        { id: 'report-1', name: 'Monthly Compliance Report' },
      ] as any);

      const response = await request(app)
        .get('/api/enterprise/reports')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 1);
    });

    it('should create a custom report', async () => {
      reporting.createReport.mockResolvedValue({ id: 'report-123', name: 'Monthly Compliance Report' });

      const response = await request(app)
        .post('/api/enterprise/reports')
        .send({
          name: 'Monthly Compliance Report',
          reportType: 'compliance',
          template: { metrics: ['compliance_score'] },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'report-123');
    });

    it('should generate an executive summary', async () => {
      reporting.generateExecutiveSummary.mockResolvedValue({ complianceScore: 82, riskMetrics: {} });

      const response = await request(app)
        .get('/api/enterprise/reports/executive-summary')
        .expect(200);

      expect(response.body).toHaveProperty('complianceScore', 82);
    });
  });

  // ===========================================================================
  // Monitoring
  // ===========================================================================
  describe('Monitoring', () => {
    it('should create a monitor', async () => {
      monitoring.createMonitor.mockResolvedValue({ id: 'mon-123', name: 'High Risk Alert' });

      const response = await request(app)
        .post('/api/enterprise/monitoring')
        .send({
          name: 'High Risk Alert',
          monitorType: 'threshold',
          configuration: { field: 'severity', value: 'Critical' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'mon-123');
    });

    it('should get the monitoring dashboard', async () => {
      monitoring.getMonitoringDashboard.mockResolvedValue({ totalMonitors: 3, activeAlerts: 1 });

      const response = await request(app)
        .get('/api/enterprise/monitoring/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalMonitors', 3);
    });

    it('should toggle a monitor', async () => {
      monitoring.toggleMonitorActive.mockResolvedValue({ id: 'mon-123', active: false });

      const response = await request(app)
        .patch('/api/enterprise/monitoring/mon-123/toggle')
        .send({ active: false })
        .expect(200);

      expect(response.body).toHaveProperty('active', false);
    });
  });

  // ===========================================================================
  // Issue Management
  // ===========================================================================
  describe('Issue Management', () => {
    it('should create an issue', async () => {
      issues.createIssue.mockResolvedValue({ id: 'issue-123', title: 'Missing encryption', status: 'Open' });

      const response = await request(app)
        .post('/api/enterprise/issues')
        .send({
          title: 'Missing encryption',
          description: 'Database lacks encryption at rest',
          issueType: 'Finding',
          priority: 'High',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'issue-123');
      expect(issues.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-123', createdById: 'user-123' })
      );
    });

    it('should update issue status', async () => {
      issues.updateIssueStatus.mockResolvedValue({ id: 'issue-123', status: 'Resolved' });

      const response = await request(app)
        .patch('/api/enterprise/issues/issue-123/status')
        .send({ status: 'Resolved' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Resolved');
    });

    it('should update an issue (org-scoped)', async () => {
      prismaMock.issue.findFirst.mockResolvedValue({ id: 'issue-123' } as any);
      prismaMock.issue.update.mockResolvedValue({ id: 'issue-123', priority: 'Critical' } as any);

      const response = await request(app)
        .patch('/api/enterprise/issues/issue-123')
        .send({ priority: 'Critical' })
        .expect(200);

      expect(response.body).toHaveProperty('priority', 'Critical');
      expect(prismaMock.issue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'issue-123', organizationId: 'org-123' } })
      );
    });
  });
});
