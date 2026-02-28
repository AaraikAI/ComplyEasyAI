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

// Mock vendor risk service
jest.mock('../../../services/vendorRiskService', () => ({
  __esModule: true,
  default: {
    createVendor: jest.fn().mockResolvedValue({
      id: 'vendor-123',
      name: 'Test Vendor',
      category: 'Technology',
      riskLevel: 'Medium',
      status: 'Active',
      organizationId: 'org-123',
    }),
    getVendors: jest.fn().mockResolvedValue([
      {
        id: 'vendor-123',
        name: 'Test Vendor',
        category: 'Technology',
        riskLevel: 'Medium',
        status: 'Active',
      },
    ]),
    getVendorById: jest.fn().mockResolvedValue({
      id: 'vendor-123',
      name: 'Test Vendor',
      category: 'Technology',
      riskLevel: 'Medium',
      status: 'Active',
    }),
    updateVendor: jest.fn().mockResolvedValue({
      id: 'vendor-123',
      name: 'Updated Vendor',
      category: 'Technology',
      riskLevel: 'Low',
      status: 'Active',
    }),
    deleteVendor: jest.fn().mockResolvedValue({ success: true }),
    createAssessment: jest.fn().mockResolvedValue({
      id: 'assessment-123',
      vendorId: 'vendor-123',
      status: 'In Progress',
    }),
    completeAssessment: jest.fn().mockResolvedValue({
      id: 'assessment-123',
      vendorId: 'vendor-123',
      status: 'Completed',
      completedAt: new Date(),
    }),
    getDashboard: jest.fn().mockResolvedValue({
      totalVendors: 10,
      highRisk: 2,
      mediumRisk: 5,
      lowRisk: 3,
      pendingAssessments: 4,
    }),
    getVendorScorecard: jest.fn().mockResolvedValue({
      vendorId: 'vendor-123',
      overallScore: 85,
      securityScore: 90,
      complianceScore: 80,
      financialScore: 85,
    }),
  },
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
        const vendorRiskService = (await import('../../../services/vendorRiskService')).default;
        (vendorRiskService.createVendor as jest.Mock).mockRejectedValueOnce(
          new Error('Name is required')
        );

        const response = await request(app)
          .post('/api/vendors')
          .send({ category: 'Technology' })
          .expect(500);

        expect(response.body).toHaveProperty('error');
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

      it('should return 404 for non-existent vendor', async () => {
        const vendorRiskService = (await import('../../../services/vendorRiskService')).default;
        (vendorRiskService.getVendorById as jest.Mock).mockResolvedValueOnce(null);

        const response = await request(app)
          .get('/api/vendors/nonexistent')
          .expect(404);

        expect(response.body).toHaveProperty('error');
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
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
            findings: 'No major issues found',
            recommendations: ['Continue monitoring'],
            overallScore: 85,
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
