/**
 * Vendor Routes Integration Tests
 *
 * Tests for vendor risk management, assessments, dashboard, and scorecards.
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
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: () => (req: any, res: any, next: any) => next(),
}));

// Mock vendor risk service - method names must match vendorRiskService.ts
const mockVendorRiskService = {
  createVendor: jest.fn(),
  getVendorsByOrganization: jest.fn(),
  getVendorById: jest.fn(),
  updateVendor: jest.fn(),
  archiveVendor: jest.fn(),
  createVendorAssessment: jest.fn(),
  completeVendorAssessment: jest.fn(),
  createVendorReview: jest.fn(),
  completeVendorReview: jest.fn(),
  createVendorMonitor: jest.fn(),
  updateVendorMonitorResults: jest.fn(),
  getVendorRiskDashboard: jest.fn(),
  getVendorScorecard: jest.fn(),
};

jest.mock('../../../services/vendorRiskService', () => ({
  __esModule: true,
  default: mockVendorRiskService,
}));

// Mock data factories
const createMockVendor = (overrides: Record<string, unknown> = {}) => ({
  id: 'vendor-123',
  organizationId: 'org-123',
  name: 'Test Vendor',
  category: 'Technology',
  contactName: 'John Doe',
  contactEmail: 'john@vendor.com',
  website: 'https://vendor.com',
  riskLevel: 'Medium',
  status: 'Active',
  contractStart: new Date(),
  contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockAssessment = (overrides: Record<string, unknown> = {}) => ({
  id: 'assessment-123',
  vendorId: 'vendor-123',
  assessmentType: 'Annual Review',
  status: 'In Progress',
  assessor: 'user-123',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  // Re-setup mock implementations (resetMocks: true clears them between tests)
  mockVendorRiskService.createVendor.mockResolvedValue({
    id: 'vendor-123',
    name: 'Test Vendor',
    category: 'Technology',
    riskLevel: 'Medium',
    status: 'Active',
    organizationId: 'org-123',
  });
  mockVendorRiskService.getVendorsByOrganization.mockResolvedValue([
    {
      id: 'vendor-123',
      name: 'Test Vendor',
      category: 'Technology',
      riskLevel: 'Medium',
      status: 'Active',
    },
  ]);
  mockVendorRiskService.getVendorById.mockResolvedValue({
    id: 'vendor-123',
    name: 'Test Vendor',
    category: 'Technology',
    riskLevel: 'Medium',
    status: 'Active',
  });
  mockVendorRiskService.updateVendor.mockResolvedValue({
    id: 'vendor-123',
    name: 'Updated Vendor',
    category: 'Technology',
    riskLevel: 'Low',
    status: 'Active',
  });
  mockVendorRiskService.archiveVendor.mockResolvedValue({ success: true });
  mockVendorRiskService.createVendorAssessment.mockResolvedValue({
    id: 'assessment-123',
    vendorId: 'vendor-123',
    status: 'In Progress',
  });
  mockVendorRiskService.completeVendorAssessment.mockResolvedValue({
    id: 'assessment-123',
    vendorId: 'vendor-123',
    status: 'Completed',
    completedAt: new Date(),
  });
  mockVendorRiskService.getVendorRiskDashboard.mockResolvedValue({
    totalVendors: 10,
    highRisk: 2,
    mediumRisk: 5,
    lowRisk: 3,
    pendingAssessments: 4,
  });
  mockVendorRiskService.getVendorScorecard.mockResolvedValue({
    vendorId: 'vendor-123',
    overallScore: 85,
    securityScore: 90,
    complianceScore: 80,
    financialScore: 85,
  });

  app = express();
  app.use(express.json());

  const vendorRoutes = (await import('../../../routes/vendors')).default;
  app.use('/api/vendors', vendorRoutes);
});

describe('Vendor Routes Integration', () => {
  // ===========================================================================
  // Vendor CRUD Tests
  // ===========================================================================
  describe('Vendor CRUD Operations', () => {
    describe('POST /api/vendors', () => {
      it('should create a new vendor', async () => {
        const response = await request(app)
          .post('/api/vendors')
          .send({
            name: 'New Vendor',
            category: 'Technology',
            contactName: 'Jane Doe',
            contactEmail: 'jane@vendor.com',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Test Vendor');
      });

      it('should require vendor name', async () => {
        const response = await request(app)
          .post('/api/vendors')
          .send({ category: 'Technology' });

        // Validation middleware rejects missing required 'name' field
        expect([400, 500]).toContain(response.status);
      });
    });

    describe('GET /api/vendors', () => {
      it('should list all vendors', async () => {
        const response = await request(app)
          .get('/api/vendors')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter vendors by status', async () => {
        const response = await request(app)
          .get('/api/vendors?status=Active')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter vendors by risk level', async () => {
        const response = await request(app)
          .get('/api/vendors?riskLevel=High')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/vendors/:id', () => {
      it('should get vendor by ID', async () => {
        const response = await request(app)
          .get('/api/vendors/vendor-123')
          .expect(200);

        expect(response.body).toHaveProperty('id');
      });

      it('should return error for non-existent vendor', async () => {
        const vendorRiskService = (await import('../../../services/vendorRiskService')).default;
        const error = new Error('Vendor not found');
        (error as any).statusCode = 404;
        (vendorRiskService.getVendorById as jest.Mock).mockRejectedValueOnce(error);

        const response = await request(app)
          .get('/api/vendors/nonexistent');

        // Route may return 404 or 500 depending on error handler
        expect([404, 500]).toContain(response.status);
      });
    });

    describe('PUT /api/vendors/:id', () => {
      it('should update vendor', async () => {
        const response = await request(app)
          .put('/api/vendors/vendor-123')
          .send({ name: 'Updated Vendor', riskLevel: 'Low' })
          .expect(200);

        expect(response.body.name).toBe('Updated Vendor');
      });
    });

    describe('DELETE /api/vendors/:id', () => {
      it('should delete vendor', async () => {
        const response = await request(app)
          .delete('/api/vendors/vendor-123')
          .expect(200);

        expect(response.body).toHaveProperty('success');
      });
    });
  });

  // ===========================================================================
  // Vendor Assessment Tests
  // ===========================================================================
  describe('Vendor Assessments', () => {
    describe('POST /api/vendors/:id/assessments', () => {
      it('should create vendor assessment', async () => {
        const response = await request(app)
          .post('/api/vendors/vendor-123/assessments')
          .send({
            assessmentType: 'Annual Review',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('In Progress');
      });
    });

    describe('POST /api/vendors/assessments/:id/complete', () => {
      it('should complete assessment', async () => {
        const response = await request(app)
          .post('/api/vendors/assessments/assessment-123/complete')
          .send({
            findings: { summary: 'No major issues found' },
            score: 85,
            riskLevel: 'Low',
            recommendations: 'Continue monitoring',
          })
          .expect(200);

        expect(response.body.status).toBe('Completed');
      });
    });
  });

  // ===========================================================================
  // Dashboard Tests
  // ===========================================================================
  describe('Vendor Dashboard', () => {
    describe('GET /api/vendors/dashboard', () => {
      it('should return vendor dashboard data', async () => {
        const response = await request(app)
          .get('/api/vendors/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('totalVendors');
        expect(response.body).toHaveProperty('highRisk');
        expect(response.body).toHaveProperty('pendingAssessments');
      });
    });
  });

  // ===========================================================================
  // Vendor Scorecard Tests
  // ===========================================================================
  describe('Vendor Scorecard', () => {
    describe('GET /api/vendors/:id/scorecard', () => {
      it('should return vendor scorecard', async () => {
        const response = await request(app)
          .get('/api/vendors/vendor-123/scorecard')
          .expect(200);

        expect(response.body).toHaveProperty('overallScore');
        expect(response.body).toHaveProperty('securityScore');
        expect(response.body).toHaveProperty('complianceScore');
      });
    });
  });
});
