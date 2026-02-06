/**
 * Vendor Risk Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockVendor } from '../../mocks/prisma';

// Mock the database - MUST be before importing modules that use it
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock dependencies
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

// Import after mocking
import vendorRiskService from '../../../services/vendorRiskService';
import { AuditLogger } from '../../../utils/auditLogger';

describe('VendorRiskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVendor()', () => {
    it('should create a new vendor', async () => {
      const mockVendor = createMockVendor();
      prismaMock.vendor.create.mockResolvedValue(mockVendor);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        id: 'assessment-123',
        vendorId: mockVendor.id,
        assessmentType: 'Initial',
        status: 'In_Progress',
      } as any);

      const result = await vendorRiskService.createVendor({
        organizationId: 'org-123',
        name: 'Acme Cloud Services',
        category: 'Cloud Provider',
        website: 'https://acme.cloud',
        hasDataAccess: true,
        dataTypes: ['PII', 'Financial'],
        userId: 'user-123',
      });

      expect(result.name).toBe('Test Vendor');
      expect(prismaMock.vendor.create).toHaveBeenCalledTimes(1);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'vendor.created',
          resourceType: 'Vendor',
        })
      );
    });

    it('should calculate initial risk score based on data access', async () => {
      const vendorWithDataAccess = createMockVendor({ hasDataAccess: true, riskScore: 60 });
      prismaMock.vendor.create.mockResolvedValue(vendorWithDataAccess);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        id: 'assessment-456',
        vendorId: vendorWithDataAccess.id,
        assessmentType: 'Initial',
        status: 'In_Progress',
      } as any);

      await vendorRiskService.createVendor({
        organizationId: 'org-123',
        name: 'High Risk Vendor',
        category: 'SaaS',
        hasDataAccess: true,
        dataTypes: ['PII', 'PHI', 'Financial'],
        userId: 'user-123',
      });

      expect(prismaMock.vendor.create).toHaveBeenCalled();
    });
  });

  describe('createVendorAssessment()', () => {
    it('should create a vendor security assessment', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        vendorId: 'vendor-123',
        assessmentType: 'Security',
        status: 'In_Progress',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.vendorAssessment.create.mockResolvedValue(mockAssessment);

      const result = await vendorRiskService.createVendorAssessment({
        vendorId: 'vendor-123',
        assessmentType: 'Security',
        organizationId: 'org-123',
        userId: 'user-123',
      });

      expect(result.assessmentType).toBe('Security');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'vendor.assessment.created',
        })
      );
    });
  });

  describe('completeVendorAssessment()', () => {
    it('should complete vendor assessment and update risk score', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        vendorId: 'vendor-123',
        assessmentType: 'Security',
        status: 'Completed',
        score: 85,
        riskLevel: 'Low',
        findings: { gaps: [] },
        completedAt: new Date(),
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.vendorAssessment.update.mockResolvedValue(mockAssessment);
      prismaMock.vendor.update.mockResolvedValue(createMockVendor({ riskScore: 85, riskLevel: 'Low' }));

      const result = await vendorRiskService.completeVendorAssessment(
        'assessment-123',
        {
          score: 85,
          riskLevel: 'Low',
          findings: { gaps: [] },
        },
        'user-123',
        'org-123'
      );

      expect(result.score).toBe(85);
      expect(prismaMock.vendor.update).toHaveBeenCalled();
    });
  });

  describe('createVendorReview()', () => {
    it('should schedule a vendor review', async () => {
      const mockReview = {
        id: 'review-123',
        vendorId: 'vendor-123',
        reviewType: 'Annual',
        reviewer: 'John Doe',
        status: 'Scheduled',
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.vendorReview.create.mockResolvedValue(mockReview);

      const result = await vendorRiskService.createVendorReview({
        vendorId: 'vendor-123',
        reviewType: 'Annual',
        reviewer: 'John Doe',
        organizationId: 'org-123',
      });

      expect(result.reviewType).toBe('Annual');
      expect(AuditLogger.log).toHaveBeenCalled();
    });
  });

  describe('createVendorMonitor()', () => {
    it('should create a continuous monitor for vendor', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        vendorId: 'vendor-123',
        monitorType: 'Security',
        status: 'Unknown',
        findings: {},
        lastCheck: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        vendor: createMockVendor(),
      };

      prismaMock.vendorMonitor.create.mockResolvedValue(mockMonitor);

      const result = await vendorRiskService.createVendorMonitor({
        vendorId: 'vendor-123',
        monitorType: 'Security',
        organizationId: 'org-123',
        userId: 'user-123',
      });

      expect(result.monitorType).toBe('Security');
      expect(result.status).toBe('Unknown');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'vendor.monitor.created',
        })
      );
    });
  });

  describe('updateVendorMonitorResults()', () => {
    it('should update monitor results', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        vendorId: 'vendor-123',
        monitorType: 'Security',
        status: 'Passing',
        findings: { checks: { ssl: true, headers: true } },
        lastCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        vendor: createMockVendor(),
      };

      prismaMock.vendorMonitor.update.mockResolvedValue(mockMonitor);

      const result = await vendorRiskService.updateVendorMonitorResults(
        'monitor-123',
        {
          status: 'Passing',
          lastCheckDate: new Date(),
          findings: { checks: { ssl: true, headers: true } },
        },
        'user-123',
        'org-123'
      );

      expect(result.status).toBe('Passing');
    });

    it('should log alert for failing monitor status', async () => {
      const mockMonitor = {
        id: 'monitor-123',
        vendorId: 'vendor-123',
        monitorType: 'Security',
        status: 'Failing',
        findings: { errors: ['SSL expired'] },
        lastCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        vendor: createMockVendor(),
      };

      prismaMock.vendorMonitor.update.mockResolvedValue(mockMonitor);

      await vendorRiskService.updateVendorMonitorResults(
        'monitor-123',
        {
          status: 'Failing',
          lastCheckDate: new Date(),
          findings: { errors: ['SSL expired'] },
        },
        'user-123',
        'org-123'
      );

      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'vendor.monitor.critical_alert',
        })
      );
    });
  });

  describe('getVendorScorecard()', () => {
    it('should return comprehensive vendor scorecard', async () => {
      const mockVendor = {
        ...createMockVendor(),
        assessments: [
          { assessedDate: new Date(), assessmentType: 'Security', score: 85, riskLevel: 'Low' },
        ],
        reviews: [{ reviewDate: new Date(), reviewType: 'Annual' }],
        monitors: [{ status: 'Passing' }],
      };

      prismaMock.vendor.findUnique.mockResolvedValue(mockVendor);

      const scorecard = await vendorRiskService.getVendorScorecard('vendor-123');

      expect(scorecard).toHaveProperty('vendorId');
      expect(scorecard).toHaveProperty('vendorName');
      expect(scorecard).toHaveProperty('riskLevel');
      expect(scorecard).toHaveProperty('complianceScore');
      expect(scorecard).toHaveProperty('securityScore');
      expect(scorecard).toHaveProperty('certifications');
    });

    it('should throw error for non-existent vendor', async () => {
      prismaMock.vendor.findUnique.mockResolvedValue(null);

      await expect(
        vendorRiskService.getVendorScorecard('non-existent')
      ).rejects.toThrow('Vendor not found');
    });
  });

  describe('getVendorRiskDashboard()', () => {
    it('should return vendor risk dashboard metrics', async () => {
      const mockVendors = [
        {
          ...createMockVendor({ riskLevel: 'Critical', riskScore: 90 }),
          assessments: [],
          reviews: [],
          monitors: [{ status: 'Failing' }],
        },
        {
          ...createMockVendor({ id: 'vendor-2', riskLevel: 'Low', riskScore: 20 }),
          assessments: [],
          reviews: [],
          monitors: [{ status: 'Passing' }],
        },
      ];

      prismaMock.vendor.findMany.mockResolvedValue(mockVendors);

      const dashboard = await vendorRiskService.getVendorRiskDashboard('org-123');

      expect(dashboard).toHaveProperty('totalVendors');
      expect(dashboard).toHaveProperty('riskDistribution');
      expect(dashboard).toHaveProperty('monitoringMetrics');
      expect(dashboard).toHaveProperty('complianceCertifications');
      expect(dashboard).toHaveProperty('topRiskVendors');
    });
  });

  describe('getVendorsByOrganization()', () => {
    it('should return all vendors for organization', async () => {
      const mockVendors = [createMockVendor(), createMockVendor({ id: 'vendor-2' })];
      prismaMock.vendor.findMany.mockResolvedValue(mockVendors);

      const result = await vendorRiskService.getVendorsByOrganization('org-123');

      expect(result).toHaveLength(2);
    });

    it('should filter by risk level', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([]);

      await vendorRiskService.getVendorsByOrganization('org-123', {
        riskLevel: 'Critical',
      });

      expect(prismaMock.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            riskLevel: 'Critical',
          }),
        })
      );
    });

    it('should filter by data access', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([]);

      await vendorRiskService.getVendorsByOrganization('org-123', {
        hasDataAccess: true,
      });

      expect(prismaMock.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hasDataAccess: true,
          }),
        })
      );
    });
  });

  describe('calculateComplianceScore()', () => {
    it('should calculate compliance score based on certifications', async () => {
      const vendorAllCerts = createMockVendor({
        soc2Report: true,
        iso27001Certified: true,
        gdprCompliant: true,
        hipaaBaa: true,
      });

      // Access private method through the service
      const mockVendorWithCerts = {
        ...vendorAllCerts,
        assessments: [],
        reviews: [],
        monitors: [],
      };
      prismaMock.vendor.findUnique.mockResolvedValue(mockVendorWithCerts);

      const scorecard = await vendorRiskService.getVendorScorecard('vendor-123');

      // Should be 100% with all 4 certifications
      expect(scorecard.complianceScore).toBe(100);
    });

    it('should return partial score for some certifications', async () => {
      const vendorPartialCerts = createMockVendor({
        soc2Report: true,
        iso27001Certified: false,
        gdprCompliant: true,
        hipaaBaa: false,
      });

      const mockVendor = {
        ...vendorPartialCerts,
        assessments: [],
        reviews: [],
        monitors: [],
      };
      prismaMock.vendor.findUnique.mockResolvedValue(mockVendor);

      const scorecard = await vendorRiskService.getVendorScorecard('vendor-123');

      // Should be 50% with 2 out of 4 certifications
      expect(scorecard.complianceScore).toBe(50);
    });
  });
});
