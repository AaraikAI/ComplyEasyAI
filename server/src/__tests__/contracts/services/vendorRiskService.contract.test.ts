/**
 * Vendor Risk Service Contract Tests
 *
 * Verifies the contract between the service layer and Prisma ORM for
 * vendor management, risk assessments, and security reviews.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockVendor } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

import vendorRiskService from '../../../services/vendorRiskService';

describe('VendorRiskService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createVendor
  // ---------------------------------------------------------------------------
  describe('createVendor', () => {
    it('should call prisma.vendor.create with correct defaults', async () => {
      const mockVendor = createMockVendor({ id: 'vendor-new', status: 'Onboarding' });
      prismaMock.vendor.create.mockResolvedValue(mockVendor);
      // createVendor also calls createVendorAssessment internally
      prismaMock.vendorAssessment.create.mockResolvedValue({
        id: 'assessment-1',
        vendorId: 'vendor-new',
        vendor: mockVendor,
      });

      await vendorRiskService.createVendor({
        name: 'Acme Corp',
        organizationId: 'org-123',
        userId: 'user-1',
      });

      expect(prismaMock.vendor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Acme Corp',
          organizationId: 'org-123',
          status: 'Onboarding',
          riskLevel: 'Medium',
          riskScore: 0,
          hasDataAccess: false,
          soc2Report: false,
          iso27001Certified: false,
          gdprCompliant: false,
          hipaaBaa: false,
        }),
      });
    });

    it('should create an initial vendor assessment after vendor creation', async () => {
      const mockVendor = createMockVendor({ id: 'vendor-new' });
      prismaMock.vendor.create.mockResolvedValue(mockVendor);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        id: 'assessment-1',
        vendorId: 'vendor-new',
        vendor: mockVendor,
      });

      await vendorRiskService.createVendor({
        name: 'Acme Corp',
        organizationId: 'org-123',
        userId: 'user-1',
      });

      expect(prismaMock.vendorAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: 'vendor-new',
          assessmentType: 'Initial',
          status: 'In_Progress',
          assessedBy: 'user-1',
        }),
        include: { vendor: true },
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.vendor.create.mockRejectedValue(new Error('Connection refused'));

      await expect(
        vendorRiskService.createVendor({
          name: 'Test',
          organizationId: 'org-123',
          userId: 'user-1',
        })
      ).rejects.toThrow('Connection refused');
    });

    it('should pass optional fields when provided', async () => {
      const mockVendor = createMockVendor();
      prismaMock.vendor.create.mockResolvedValue(mockVendor);
      prismaMock.vendorAssessment.create.mockResolvedValue({
        id: 'a-1',
        vendorId: mockVendor.id,
        vendor: mockVendor,
      });

      await vendorRiskService.createVendor({
        name: 'Acme',
        organizationId: 'org-123',
        userId: 'user-1',
        website: 'https://acme.com',
        contactEmail: 'contact@acme.com',
        annualSpend: 50000,
        hasDataAccess: true,
        soc2Report: true,
      });

      expect(prismaMock.vendor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          website: 'https://acme.com',
          contactEmail: 'contact@acme.com',
          annualSpend: 50000,
          hasDataAccess: true,
          soc2Report: true,
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // completeVendorAssessment
  // ---------------------------------------------------------------------------
  describe('completeVendorAssessment', () => {
    it('should update assessment and vendor risk score', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        vendorId: 'vendor-123',
        status: 'Completed',
        score: 75,
        riskLevel: 'High',
        vendor: createMockVendor(),
      };
      prismaMock.vendorAssessment.update.mockResolvedValue(mockAssessment);
      prismaMock.vendor.update.mockResolvedValue(createMockVendor({ riskScore: 75 }));

      await vendorRiskService.completeVendorAssessment(
        'assessment-1',
        {
          findings: { critical: 2 },
          score: 75,
          riskLevel: 'High' as any,
        },
        'user-1',
        'org-123'
      );

      // Assessment update
      expect(prismaMock.vendorAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: expect.objectContaining({
          status: 'Completed',
          assessedDate: expect.any(Date),
          findings: { critical: 2 },
          score: 75,
          riskLevel: 'High',
        }),
        include: { vendor: true },
      });

      // Vendor risk score update
      expect(prismaMock.vendor.update).toHaveBeenCalledWith({
        where: { id: 'vendor-123' },
        data: expect.objectContaining({
          riskScore: 75,
          riskLevel: 'High',
          status: 'Active',
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createVendorReview
  // ---------------------------------------------------------------------------
  describe('createVendorReview', () => {
    it('should call prisma.vendorReview.create with correct shape', async () => {
      const mockReview = {
        id: 'review-1',
        vendorId: 'vendor-123',
        reviewType: 'Annual',
        vendor: createMockVendor(),
      };
      prismaMock.vendorReview.create.mockResolvedValue(mockReview);

      await vendorRiskService.createVendorReview({
        vendorId: 'vendor-123',
        reviewType: 'Annual',
        reviewer: 'user-1',
        organizationId: 'org-123',
      });

      expect(prismaMock.vendorReview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: 'vendor-123',
          reviewType: 'Annual',
          reviewer: 'user-1',
          reviewDate: expect.any(Date),
        }),
        include: { vendor: true },
      });
    });

    it('should propagate errors when vendor does not exist', async () => {
      prismaMock.vendorReview.create.mockRejectedValue(
        new Error('Foreign key constraint failed on the field: `vendorId`')
      );

      await expect(
        vendorRiskService.createVendorReview({
          vendorId: 'nonexistent',
          reviewType: 'Annual',
          reviewer: 'user-1',
          organizationId: 'org-123',
        })
      ).rejects.toThrow('Foreign key constraint');
    });
  });

  // ---------------------------------------------------------------------------
  // completeVendorReview
  // ---------------------------------------------------------------------------
  describe('completeVendorReview', () => {
    it('should update review with findings and action items', async () => {
      const mockReview = {
        id: 'review-1',
        findings: { items: ['finding-1'] },
        actionItems: { tasks: ['task-1'] },
        vendor: createMockVendor(),
      };
      prismaMock.vendorReview.update.mockResolvedValue(mockReview);

      await vendorRiskService.completeVendorReview(
        'review-1',
        {
          findings: { items: ['finding-1'] } as any,
          actionItems: { tasks: ['task-1'] } as any,
          passed: true,
        },
        'user-1',
        'org-123'
      );

      expect(prismaMock.vendorReview.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: expect.objectContaining({
          findings: { items: ['finding-1'] },
          actionItems: { tasks: ['task-1'] },
        }),
        include: { vendor: true },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createVendorAssessment
  // ---------------------------------------------------------------------------
  describe('createVendorAssessment', () => {
    it('should create assessment with In_Progress status', async () => {
      prismaMock.vendorAssessment.create.mockResolvedValue({
        id: 'a-1',
        vendorId: 'vendor-123',
        status: 'In_Progress',
        vendor: createMockVendor(),
      });

      await vendorRiskService.createVendorAssessment({
        vendorId: 'vendor-123',
        assessmentType: 'Annual',
        organizationId: 'org-123',
        userId: 'user-1',
      });

      expect(prismaMock.vendorAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: 'vendor-123',
          assessmentType: 'Annual',
          status: 'In_Progress',
          assessedBy: 'user-1',
        }),
        include: { vendor: true },
      });
    });
  });
});
