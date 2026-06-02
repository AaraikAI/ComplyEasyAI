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

// The vendors route gates creation with enforceLimit('maxVendors'); without a
// mock the real tier middleware queries tierService and returns 429. Provide
// pass-through implementations for every export the route layer may use.
jest.mock('../../middleware/tierMiddleware', () => {
  const passthrough = (_req: any, _res: any, next: any) => next();
  return {
    enforceLimit: () => passthrough,
    requireFeature: () => passthrough,
    requireTier: () => passthrough,
    attachTierInfo: () => passthrough,
    trackUsage: () => passthrough,
    requireFeatureAndLimit: () => passthrough,
    requireActiveSubscription: () => passthrough,
    requireAiFeature: () => [passthrough],
    requireResourceCreation: () => [passthrough],
    requireEnterpriseFeature: () => [passthrough],
    requireAcosFeature: () => [passthrough],
    requireVisionaryFeature: () => [passthrough],
  };
});

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
    riskScore: 65,
    status: 'Active',
    organizationId: 'org-123',
    contactEmail: 'contact@cloudprovider.com',
    contractStart: new Date(),
    contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    annualSpend: 50000,
    hasDataAccess: true,
    dataTypes: ['PII'],
    soc2Report: true,
    iso27001Certified: false,
    gdprCompliant: true,
    hipaaBaa: false,
    assessments: [],
    reviews: [],
    monitors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAssessment = {
    id: 'assess-123',
    vendorId: 'vendor-123',
    assessmentType: 'Annual',
    status: 'In_Progress',
    score: 78,
    findings: [],
    assessedBy: 'user-123',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // resetMocks:true wipes the shared $transaction implementation between tests;
    // re-establish it to run the supplied callback against the prisma mock.
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      (cb: any) => cb(prismaMock)
    );
    prismaMock.vendorAssessment.create.mockResolvedValue(mockAssessment as any);
  });

  describe('Complete Vendor Onboarding Workflow', () => {
    it('should create a vendor and run an assessment lifecycle', async () => {
      // Step 1: Create vendor (createVendor wraps create + initial assessment in $transaction)
      prismaMock.vendor.create.mockResolvedValue(mockVendor as any);

      const createResponse = await request(app)
        .post('/api/vendors')
        .send({
          name: 'Cloud Provider Inc',
          category: 'Cloud Services',
          contactEmail: 'contact@cloudprovider.com',
          hasDataAccess: true,
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id', 'vendor-123');
      const vendorId = createResponse.body.id;

      // Step 2: Create a follow-up assessment for the vendor
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        ...mockAssessment,
        vendor: mockVendor,
      } as any);

      const assessResponse = await request(app)
        .post(`/api/vendors/${vendorId}/assessments`)
        .send({ assessmentType: 'Security' })
        .expect(201);

      expect(assessResponse.body).toHaveProperty('id');
      expect(assessResponse.body).toHaveProperty('status', 'In_Progress');

      // Step 3: Complete the assessment (updates assessment + vendor risk score in a $transaction)
      prismaMock.vendorAssessment.findFirst.mockResolvedValue({
        id: 'assess-123',
        vendorId: 'vendor-123',
        vendor: { organizationId: 'org-123' },
      } as any);
      prismaMock.vendorAssessment.update.mockResolvedValue({
        ...mockAssessment,
        status: 'Completed',
        score: 82,
        riskLevel: 'Medium',
        vendor: mockVendor,
      } as any);
      prismaMock.vendor.update.mockResolvedValue({
        ...mockVendor,
        riskScore: 82,
        riskLevel: 'Medium',
      } as any);

      const completeResponse = await request(app)
        .post('/api/vendors/assessments/assess-123/complete')
        .send({
          findings: { summary: 'Adequate controls' },
          score: 82,
          riskLevel: 'Medium',
          recommendations: 'Quarterly review',
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('Completed');
    });
  });

  describe('Vendor Risk Assessment Workflow', () => {
    it('should create a risk assessment for an existing vendor', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        ...mockAssessment,
        assessmentType: 'Risk',
        vendor: mockVendor,
      } as any);

      const response = await request(app)
        .post('/api/vendors/vendor-123/assessments')
        .send({ assessmentType: 'Risk' })
        .expect(201);

      expect(response.body).toHaveProperty('assessmentType', 'Risk');
    });

    it('should return 404 when assessing a vendor from another organization', async () => {
      // Vendor not found in caller's org scope
      prismaMock.vendor.findFirst.mockResolvedValue(null as any);

      const response = await request(app)
        .post('/api/vendors/vendor-999/assessments')
        .send({ assessmentType: 'Risk' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Vendor Listing & Detail', () => {
    it('should list vendors for the organization', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([
        { ...mockVendor, riskLevel: 'High' },
        { ...mockVendor, id: 'v2', riskLevel: 'Medium' },
      ] as any);
      prismaMock.vendor.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/vendors')
        .expect(200);

      // The route passes req.query as the pagination arg, so the service returns
      // the paginated envelope { data, pagination } rather than a bare array.
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id', 'vendor-123');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('totalItems', 2);
    });

    it('should get a single vendor by id', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);

      const response = await request(app)
        .get('/api/vendors/vendor-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'vendor-123');
    });

    it('should return the assessment queue for the organization', async () => {
      prismaMock.vendorAssessment.findMany.mockResolvedValue([
        { id: 'a1', status: 'In_Progress', vendor: { id: 'vendor-123', name: 'Cloud Provider Inc', organizationId: 'org-123' } },
      ] as any);

      const response = await request(app)
        .get('/api/vendors/assessments/queue')
        .expect(200);

      expect(response.body).toHaveProperty('queue');
      expect(Array.isArray(response.body.queue)).toBe(true);
    });
  });

  describe('Vendor Update & Archive', () => {
    it('should update a vendor', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendor.update.mockResolvedValue({
        ...mockVendor,
        category: 'Managed Services',
      } as any);

      const response = await request(app)
        .put('/api/vendors/vendor-123')
        .send({ category: 'Managed Services' })
        .expect(200);

      expect(response.body.category).toBe('Managed Services');
    });

    it('should archive a vendor (soft-delete to Inactive)', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor as any);
      prismaMock.vendor.update.mockResolvedValue({
        ...mockVendor,
        status: 'Inactive',
      } as any);

      const response = await request(app)
        .delete('/api/vendors/vendor-123')
        .expect(200);

      expect(response.body.status).toBe('Inactive');
    });
  });

  describe('Vendor Dashboard & Scorecard', () => {
    it('should get vendor risk dashboard', async () => {
      // Dashboard runs many parallel count() queries plus a findMany for top vendors.
      prismaMock.vendor.count.mockResolvedValue(3);
      prismaMock.vendorAssessment.count.mockResolvedValue(5);
      prismaMock.vendorReview.count.mockResolvedValue(2);
      prismaMock.vendorMonitor.count.mockResolvedValue(1);
      prismaMock.vendor.findMany.mockResolvedValue([
        { id: 'vendor-123', name: 'Cloud Provider Inc', riskScore: 65, riskLevel: 'High', hasDataAccess: true },
      ] as any);

      const response = await request(app)
        .get('/api/vendors/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalVendors');
      expect(response.body).toHaveProperty('riskDistribution');
      expect(response.body.riskDistribution).toHaveProperty('high');
      expect(Array.isArray(response.body.topRiskVendors)).toBe(true);
    });

    it('should get vendor scorecard', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({
        ...mockVendor,
        assessments: [{ ...mockAssessment, assessedDate: new Date(), score: 78, riskLevel: 'High' }],
        reviews: [],
        monitors: [],
      } as any);

      const response = await request(app)
        .get('/api/vendors/vendor-123/scorecard')
        .expect(200);

      expect(response.body).toHaveProperty('complianceScore');
      expect(response.body).toHaveProperty('securityScore');
      expect(response.body).toHaveProperty('certifications');
    });
  });
});
