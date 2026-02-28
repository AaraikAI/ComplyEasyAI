/**
 * E2E Tests - Vendor Management Flow
 * Tests complete vendor risk management workflows including onboarding,
 * assessment, monitoring, and offboarding.
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

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    analyzeVendorRisk: jest.fn().mockResolvedValue({ riskScore: 65, factors: [] }),
  },
}));

import vendorsRoutes from '../../routes/vendors';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'test@example.com',
  };
  next();
});
app.use('/api/vendors', vendorsRoutes);
app.use(errorHandler);

describe('E2E: Vendor Management Flow', () => {
  const mockVendor = {
    id: 'vendor-123',
    name: 'Cloud Provider Inc',
    category: 'Cloud Services',
    riskLevel: 'High',
    status: 'Active',
    organizationId: 'org-123',
    contactEmail: 'contact@cloudprovider.com',
    contractStartDate: new Date(),
    contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAssessment = {
    id: 'assess-123',
    vendorId: 'vendor-123',
    type: 'Annual',
    status: 'Completed',
    score: 78,
    findings: [],
    completedAt: new Date(),
  };

  const mockQuestionnaire = {
    id: 'quest-123',
    vendorId: 'vendor-123',
    templateId: 'template-123',
    status: 'Sent',
    responses: {},
    sentAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Vendor Onboarding Workflow', () => {
    it('should complete full vendor onboarding lifecycle', async () => {
      // Step 1: Create vendor
      prismaMock.vendor.create.mockResolvedValue(mockVendor as any);

      const createResponse = await request(app)
        .post('/api/vendors')
        .send({
          name: 'Cloud Provider Inc',
          category: 'Cloud Services',
          contactEmail: 'contact@cloudprovider.com',
          services: ['Infrastructure', 'Storage'],
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const vendorId = createResponse.body.id;

      // Step 2: Send assessment questionnaire
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendorQuestionnaire.create.mockResolvedValue(mockQuestionnaire as any);

      const questionnaireResponse = await request(app)
        .post(`/api/vendors/${vendorId}/questionnaires`)
        .send({
          templateId: 'template-123',
          type: 'Security',
        })
        .expect(201);

      expect(questionnaireResponse.body).toHaveProperty('id');

      // Step 3: Record questionnaire responses
      prismaMock.vendorQuestionnaire.findFirst.mockResolvedValue(mockQuestionnaire as any);
      prismaMock.vendorQuestionnaire.update.mockResolvedValue({
        ...mockQuestionnaire,
        status: 'Completed',
        responses: { q1: 'Yes', q2: 'Implemented' },
      } as any);

      const responseUpdate = await request(app)
        .patch(`/api/vendors/${vendorId}/questionnaires/quest-123`)
        .send({
          responses: { q1: 'Yes', q2: 'Implemented' },
          status: 'Completed',
        })
        .expect(200);

      expect(responseUpdate.body.status).toBe('Completed');

      // Step 4: Create assessment from responses
      prismaMock.vendorAssessment.create.mockResolvedValue(mockAssessment as any);

      const assessResponse = await request(app)
        .post(`/api/vendors/${vendorId}/assessments`)
        .send({
          type: 'Initial',
          questionnaireId: 'quest-123',
        })
        .expect(201);

      expect(assessResponse.body).toHaveProperty('score');

      // Step 5: Approve vendor
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendor.update.mockResolvedValue({
        ...mockVendor,
        status: 'Approved',
        approvedAt: new Date(),
        approvedBy: 'user-123',
      } as any);

      const approveResponse = await request(app)
        .post(`/api/vendors/${vendorId}/approve`)
        .send({ notes: 'Passed security review' })
        .expect(200);

      expect(approveResponse.body.status).toBe('Approved');
    });
  });

  describe('Vendor Risk Assessment Workflow', () => {
    it('should perform comprehensive risk assessment', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        ...mockAssessment,
        riskFactors: {
          dataAccess: 'High',
          businessCriticality: 'High',
          regulatoryImpact: 'Medium',
        },
      } as any);

      const response = await request(app)
        .post('/api/vendors/vendor-123/assessments')
        .send({
          type: 'Risk',
          assessmentDate: new Date(),
          assessor: 'user-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('riskFactors');
    });

    it('should calculate inherent risk score', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({
        ...mockVendor,
        dataTypes: ['PII', 'PHI'],
        accessLevel: 'Critical',
      } as any);

      const response = await request(app)
        .get('/api/vendors/vendor-123/risk-score')
        .expect(200);

      expect(response.body).toHaveProperty('inherentRisk');
      expect(response.body).toHaveProperty('residualRisk');
    });
  });

  describe('Continuous Vendor Monitoring', () => {
    it('should track vendor compliance over time', async () => {
      const complianceHistory = [
        { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), score: 85 },
        { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), score: 82 },
        { date: new Date(), score: 78 },
      ];

      prismaMock.vendorAssessment.findMany.mockResolvedValue(complianceHistory as any);

      const response = await request(app)
        .get('/api/vendors/vendor-123/compliance-history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should detect contract renewal needs', async () => {
      const expiringVendors = [
        { ...mockVendor, contractEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      ];

      prismaMock.vendor.findMany.mockResolvedValue(expiringVendors as any);

      const response = await request(app)
        .get('/api/vendors/expiring')
        .query({ days: 60 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should alert on compliance degradation', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({
        ...mockVendor,
        complianceScore: 65,
        previousScore: 85,
      } as any);

      const response = await request(app)
        .get('/api/vendors/vendor-123/alerts')
        .expect(200);

      expect(response.body).toHaveProperty('alerts');
    });
  });

  describe('Vendor Offboarding Workflow', () => {
    it('should complete vendor offboarding', async () => {
      // Step 1: Initiate offboarding
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendor.update.mockResolvedValue({
        ...mockVendor,
        status: 'Offboarding',
        offboardingStartedAt: new Date(),
      } as any);

      const initiateResponse = await request(app)
        .post('/api/vendors/vendor-123/offboard')
        .send({
          reason: 'Contract ended',
          effectiveDate: new Date(),
        })
        .expect(200);

      expect(initiateResponse.body.status).toBe('Offboarding');

      // Step 2: Complete data return/deletion tasks
      prismaMock.vendorTask.findMany.mockResolvedValue([
        { id: 't1', type: 'DataReturn', status: 'Completed' },
        { id: 't2', type: 'AccessRevocation', status: 'Completed' },
      ] as any);

      const tasksResponse = await request(app)
        .get('/api/vendors/vendor-123/offboarding-tasks')
        .expect(200);

      expect(Array.isArray(tasksResponse.body)).toBe(true);

      // Step 3: Finalize offboarding
      prismaMock.vendor.update.mockResolvedValue({
        ...mockVendor,
        status: 'Inactive',
        offboardingCompletedAt: new Date(),
      } as any);

      const finalizeResponse = await request(app)
        .post('/api/vendors/vendor-123/offboard/complete')
        .send({ confirmDataDeletion: true })
        .expect(200);

      expect(finalizeResponse.body.status).toBe('Inactive');
    });
  });

  describe('Vendor Dashboard', () => {
    it('should get vendor risk dashboard', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([
        { ...mockVendor, riskLevel: 'High' },
        { ...mockVendor, id: 'v2', riskLevel: 'Medium' },
        { ...mockVendor, id: 'v3', riskLevel: 'Low' },
      ] as any);

      const response = await request(app)
        .get('/api/vendors/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalVendors');
      expect(response.body).toHaveProperty('byRiskLevel');
    });

    it('should get vendor scorecard', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({
        ...mockVendor,
        assessments: [mockAssessment],
        questionnaires: [mockQuestionnaire],
      } as any);

      const response = await request(app)
        .get('/api/vendors/vendor-123/scorecard')
        .expect(200);

      expect(response.body).toHaveProperty('overallScore');
      expect(response.body).toHaveProperty('categories');
    });
  });
});
