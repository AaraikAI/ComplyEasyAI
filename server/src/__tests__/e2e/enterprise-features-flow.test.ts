/**
 * E2E Tests - Enterprise Features Flow
 * Tests complete enterprise workflows including advanced reporting,
 * multi-workspace, custom branding, and enterprise security.
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

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

jest.mock('../../middleware/tierMiddleware', () => ({
  requireTier: () => (req: any, res: any, next: any) => next(),
}));

import enterpriseRoutes from '../../routes/enterprise';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
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
  // Enterprise Risk Management
  // ===========================================================================
  describe('Enterprise Risk Management', () => {
    const mockRiskRegister = {
      id: 'rr-123',
      name: 'Corporate Risk Register',
      organizationId: 'org-123',
      risks: [],
      lastUpdated: new Date(),
    };

    const mockEnterpriseRisk = {
      id: 'er-123',
      title: 'Strategic Market Risk',
      category: 'Strategic',
      impact: 'High',
      likelihood: 'Medium',
      riskScore: 15,
      owner: 'user-456',
      mitigations: [],
    };

    it('should create enterprise risk register', async () => {
      prismaMock.riskRegister.create.mockResolvedValue(mockRiskRegister as any);

      const response = await request(app)
        .post('/api/enterprise/risk-registers')
        .send({
          name: 'Corporate Risk Register',
          categories: ['Strategic', 'Operational', 'Financial', 'Compliance'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should add enterprise risk', async () => {
      prismaMock.riskRegister.findFirst.mockResolvedValue(mockRiskRegister as any);
      prismaMock.enterpriseRisk.create.mockResolvedValue(mockEnterpriseRisk as any);

      const response = await request(app)
        .post('/api/enterprise/risk-registers/rr-123/risks')
        .send({
          title: 'Strategic Market Risk',
          category: 'Strategic',
          description: 'Risk of market share loss',
          impact: 5,
          likelihood: 3,
        })
        .expect(201);

      expect(response.body).toHaveProperty('riskScore');
    });

    it('should generate risk heat map', async () => {
      prismaMock.enterpriseRisk.findMany.mockResolvedValue([mockEnterpriseRisk] as any);

      const response = await request(app)
        .get('/api/enterprise/risk-registers/rr-123/heat-map')
        .expect(200);

      expect(response.body).toHaveProperty('matrix');
      expect(response.body).toHaveProperty('legend');
    });

    it('should track risk treatment plans', async () => {
      prismaMock.enterpriseRisk.findFirst.mockResolvedValue(mockEnterpriseRisk as any);
      prismaMock.riskTreatment.create.mockResolvedValue({
        id: 'rt-123',
        riskId: 'er-123',
        strategy: 'Mitigate',
        actions: [],
        status: 'In Progress',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/risks/er-123/treatment')
        .send({
          strategy: 'Mitigate',
          actions: ['Implement hedging strategy', 'Diversify suppliers'],
          owner: 'user-456',
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      expect(response.body).toHaveProperty('strategy');
    });
  });

  // ===========================================================================
  // Vendor Security Questionnaires
  // ===========================================================================
  describe('Vendor Security Questionnaires', () => {
    const mockQuestionnaire = {
      id: 'quest-123',
      name: 'Security Assessment Questionnaire',
      type: 'SIG Lite',
      questions: [],
      organizationId: 'org-123',
    };

    it('should create questionnaire template', async () => {
      prismaMock.questionnaireTemplate.create.mockResolvedValue(mockQuestionnaire as any);

      const response = await request(app)
        .post('/api/enterprise/questionnaires/templates')
        .send({
          name: 'Security Assessment Questionnaire',
          type: 'Custom',
          sections: [
            { name: 'Access Control', questions: [] },
            { name: 'Data Protection', questions: [] },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should send questionnaire to vendor', async () => {
      prismaMock.questionnaireTemplate.findFirst.mockResolvedValue(mockQuestionnaire as any);
      prismaMock.vendorQuestionnaire.create.mockResolvedValue({
        id: 'vq-123',
        templateId: 'quest-123',
        vendorId: 'vendor-123',
        status: 'Sent',
        sentAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/enterprise/questionnaires/send')
        .send({
          templateId: 'quest-123',
          vendorId: 'vendor-123',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          reminder: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('status', 'Sent');
    });

    it('should score questionnaire responses', async () => {
      prismaMock.vendorQuestionnaire.findFirst.mockResolvedValue({
        id: 'vq-123',
        responses: { q1: 'Yes', q2: 'Implemented', q3: 'Partially' },
      } as any);

      const response = await request(app)
        .post('/api/enterprise/questionnaires/vq-123/score')
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('riskRating');
    });
  });

  // ===========================================================================
  // Policy Library
  // ===========================================================================
  describe('Policy Library', () => {
    const mockPolicyTemplate = {
      id: 'pt-123',
      name: 'Information Security Policy',
      category: 'Security',
      content: 'Policy template content...',
      version: '1.0',
    };

    it('should get policy templates', async () => {
      const response = await request(app)
        .get('/api/enterprise/policy-library/templates')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create policy from template', async () => {
      prismaMock.policy.create.mockResolvedValue({
        id: 'pol-123',
        title: 'Information Security Policy',
        content: 'Customized policy content...',
        status: 'Draft',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/policy-library/create-from-template')
        .send({
          templateId: 'pt-123',
          customizations: {
            companyName: 'Test Company',
            effectiveDate: new Date(),
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should track policy acknowledgments', async () => {
      prismaMock.policyAcknowledgment.create.mockResolvedValue({
        id: 'ack-123',
        policyId: 'pol-123',
        userId: 'user-456',
        acknowledgedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/enterprise/policies/pol-123/acknowledge')
        .expect(200);

      expect(response.body).toHaveProperty('acknowledgedAt');
    });
  });

  // ===========================================================================
  // Trust Center
  // ===========================================================================
  describe('Trust Center', () => {
    it('should configure trust center', async () => {
      prismaMock.trustCenter.upsert.mockResolvedValue({
        id: 'tc-123',
        organizationId: 'org-123',
        enabled: true,
        customDomain: 'trust.example.com',
        branding: { logo: 'https://example.com/logo.png' },
      } as any);

      const response = await request(app)
        .post('/api/enterprise/trust-center/configure')
        .send({
          enabled: true,
          customDomain: 'trust.example.com',
          publicDocuments: ['soc2-report', 'iso27001-cert'],
          branding: {
            logo: 'https://example.com/logo.png',
            primaryColor: '#1a73e8',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('enabled', true);
    });

    it('should manage public documents', async () => {
      prismaMock.trustCenterDocument.create.mockResolvedValue({
        id: 'doc-123',
        name: 'SOC 2 Type II Report',
        type: 'Compliance Report',
        accessLevel: 'NDA Required',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/trust-center/documents')
        .send({
          name: 'SOC 2 Type II Report',
          type: 'Compliance Report',
          fileUrl: 'https://storage.example.com/soc2-report.pdf',
          accessLevel: 'NDA Required',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should track document access requests', async () => {
      prismaMock.documentAccessRequest.findMany.mockResolvedValue([
        {
          id: 'dar-123',
          documentId: 'doc-123',
          requesterEmail: 'prospect@company.com',
          status: 'Pending',
        },
      ] as any);

      const response = await request(app)
        .get('/api/enterprise/trust-center/access-requests')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ===========================================================================
  // Multi-Workspace
  // ===========================================================================
  describe('Multi-Workspace', () => {
    const mockWorkspace = {
      id: 'ws-123',
      name: 'US Operations',
      organizationId: 'org-123',
      settings: {},
    };

    it('should create workspace', async () => {
      prismaMock.workspace.create.mockResolvedValue(mockWorkspace as any);

      const response = await request(app)
        .post('/api/enterprise/workspaces')
        .send({
          name: 'US Operations',
          description: 'Workspace for US compliance',
          admins: ['user-123'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should list workspaces', async () => {
      prismaMock.workspace.findMany.mockResolvedValue([mockWorkspace] as any);

      const response = await request(app)
        .get('/api/enterprise/workspaces')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should switch workspace context', async () => {
      prismaMock.workspace.findFirst.mockResolvedValue(mockWorkspace as any);

      const response = await request(app)
        .post('/api/enterprise/workspaces/ws-123/switch')
        .expect(200);

      expect(response.body).toHaveProperty('activeWorkspace');
    });

    it('should manage workspace permissions', async () => {
      prismaMock.workspacePermission.create.mockResolvedValue({
        id: 'wp-123',
        workspaceId: 'ws-123',
        userId: 'user-456',
        role: 'Analyst',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/workspaces/ws-123/permissions')
        .send({
          userId: 'user-456',
          role: 'Analyst',
        })
        .expect(201);

      expect(response.body).toHaveProperty('role');
    });
  });

  // ===========================================================================
  // Advanced Reporting
  // ===========================================================================
  describe('Advanced Reporting', () => {
    it('should generate executive dashboard', async () => {
      const response = await request(app)
        .get('/api/enterprise/reports/executive-dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('complianceScore');
      expect(response.body).toHaveProperty('riskMetrics');
      expect(response.body).toHaveProperty('trends');
    });

    it('should create custom report', async () => {
      prismaMock.customReport.create.mockResolvedValue({
        id: 'report-123',
        name: 'Monthly Compliance Report',
        config: {},
        schedule: 'monthly',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/reports/custom')
        .send({
          name: 'Monthly Compliance Report',
          metrics: ['compliance_score', 'open_risks', 'pending_tasks'],
          filters: { frameworks: ['SOC2', 'ISO27001'] },
          schedule: 'monthly',
          recipients: ['ciso@example.com'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should generate board report', async () => {
      const response = await request(app)
        .post('/api/enterprise/reports/board')
        .send({
          period: 'Q1-2024',
          includeRisks: true,
          includeCompliance: true,
          format: 'pptx',
        })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  // ===========================================================================
  // Monitoring & Alerts
  // ===========================================================================
  describe('Monitoring & Alerts', () => {
    it('should configure monitoring rules', async () => {
      prismaMock.monitoringRule.create.mockResolvedValue({
        id: 'rule-123',
        name: 'High Risk Alert',
        condition: { field: 'severity', operator: 'equals', value: 'Critical' },
        actions: ['email', 'slack'],
      } as any);

      const response = await request(app)
        .post('/api/enterprise/monitoring/rules')
        .send({
          name: 'High Risk Alert',
          entity: 'risk',
          condition: { field: 'severity', operator: 'equals', value: 'Critical' },
          actions: [
            { type: 'email', recipients: ['ciso@example.com'] },
            { type: 'slack', channel: '#security-alerts' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should get active alerts', async () => {
      prismaMock.alert.findMany.mockResolvedValue([
        {
          id: 'alert-123',
          ruleId: 'rule-123',
          triggeredAt: new Date(),
          status: 'Active',
        },
      ] as any);

      const response = await request(app)
        .get('/api/enterprise/monitoring/alerts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should acknowledge alert', async () => {
      prismaMock.alert.findFirst.mockResolvedValue({
        id: 'alert-123',
        status: 'Active',
      } as any);
      prismaMock.alert.update.mockResolvedValue({
        id: 'alert-123',
        status: 'Acknowledged',
        acknowledgedBy: 'user-123',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/monitoring/alerts/alert-123/acknowledge')
        .expect(200);

      expect(response.body.status).toBe('Acknowledged');
    });
  });

  // ===========================================================================
  // Issue Management
  // ===========================================================================
  describe('Issue Management', () => {
    it('should create issue', async () => {
      prismaMock.issue.create.mockResolvedValue({
        id: 'issue-123',
        title: 'Missing encryption on database',
        severity: 'High',
        status: 'Open',
        source: 'Audit Finding',
      } as any);

      const response = await request(app)
        .post('/api/enterprise/issues')
        .send({
          title: 'Missing encryption on database',
          severity: 'High',
          description: 'Database lacks encryption at rest',
          source: 'Audit Finding',
          assignee: 'user-456',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should track issue resolution', async () => {
      prismaMock.issue.findFirst.mockResolvedValue({
        id: 'issue-123',
        status: 'Open',
      } as any);
      prismaMock.issue.update.mockResolvedValue({
        id: 'issue-123',
        status: 'Resolved',
        resolvedAt: new Date(),
        resolution: 'Implemented AES-256 encryption',
      } as any);

      const response = await request(app)
        .patch('/api/enterprise/issues/issue-123')
        .send({
          status: 'Resolved',
          resolution: 'Implemented AES-256 encryption',
          evidence: ['ev-123'],
        })
        .expect(200);

      expect(response.body.status).toBe('Resolved');
    });
  });
});
