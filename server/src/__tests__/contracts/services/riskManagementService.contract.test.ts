/**
 * Risk Management Service Contract Tests
 *
 * Verifies the contract between the service layer and Prisma ORM:
 * correct query shapes, data transformations, and error propagation.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockRiskItem } from '../../mocks/prisma';

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

import riskManagementService from '../../../services/riskManagementService';

describe('RiskManagementService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jest.config has resetMocks:true which wipes the $transaction implementation
    // between tests, so we restore it here so callbacks are invoked.
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      (callback: any) => callback(prismaMock)
    );
  });

  // ---------------------------------------------------------------------------
  // createRiskAssessment
  // ---------------------------------------------------------------------------
  describe('createRiskAssessment', () => {
    it('should call prisma.riskAssessment.create with correct query shape', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        name: 'Annual Risk Assessment',
        organizationId: 'org-123',
        assessmentType: 'Annual',
        status: 'In_Progress',
        scope: 'Full organization',
        methodology: 'NIST',
        startDate: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.riskAssessment.create.mockResolvedValue(mockAssessment);

      await riskManagementService.createRiskAssessment({
        organizationId: 'org-123',
        name: 'Annual Risk Assessment',
        assessmentType: 'Annual',
        scope: 'Full organization',
        methodology: 'NIST',
        userId: 'user-1',
      });

      expect(prismaMock.riskAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'Annual Risk Assessment',
          assessmentType: 'Annual',
          status: 'In_Progress',
          scope: 'Full organization',
          methodology: 'NIST',
          startDate: expect.any(Date),
        }),
      });
    });

    it('should default methodology to ISO_31000 when not provided', async () => {
      prismaMock.riskAssessment.create.mockResolvedValue({
        id: 'assessment-1',
        methodology: 'ISO_31000',
      });

      await riskManagementService.createRiskAssessment({
        organizationId: 'org-123',
        name: 'Test',
        assessmentType: 'Annual',
        userId: 'user-1',
      });

      expect(prismaMock.riskAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          methodology: 'ISO_31000',
        }),
      });
    });

    it('should return the created assessment unchanged', async () => {
      const mockAssessment = { id: 'assessment-1', name: 'Test' };
      prismaMock.riskAssessment.create.mockResolvedValue(mockAssessment);

      const result = await riskManagementService.createRiskAssessment({
        organizationId: 'org-123',
        name: 'Test',
        assessmentType: 'Annual',
        userId: 'user-1',
      });

      expect(result).toEqual(mockAssessment);
    });

    it('should propagate Prisma errors', async () => {
      prismaMock.riskAssessment.create.mockRejectedValue(
        new Error('Unique constraint violated')
      );

      await expect(
        riskManagementService.createRiskAssessment({
          organizationId: 'org-123',
          name: 'Test',
          assessmentType: 'Annual',
          userId: 'user-1',
        })
      ).rejects.toThrow('Unique constraint violated');
    });
  });

  // ---------------------------------------------------------------------------
  // addRiskToAssessment
  // ---------------------------------------------------------------------------
  describe('addRiskToAssessment', () => {
    it('should calculate riskScore as likelihood * impact', async () => {
      const mockRisk = createMockRiskItem({ likelihood: 4, impact: 5, riskScore: 20 });
      // Multi-tenant parent ownership pre-check inside the transaction.
      prismaMock.riskAssessment.findFirst.mockResolvedValue(
        { id: 'assessment-1', organizationId: 'org-123' } as never,
      );
      prismaMock.riskItem.create.mockResolvedValue(mockRisk);

      await riskManagementService.addRiskToAssessment('assessment-1', {
        title: 'Data Breach Risk',
        description: 'Risk of data breach',
        category: 'Security',
        likelihood: 4,
        impact: 5,
        organizationId: 'org-123',
        userId: 'user-1',
      });

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          riskScore: 20,
          assessmentId: 'assessment-1',
          status: 'Open',
        }),
      });
    });

    it('should assign severity based on risk score', async () => {
      // High severity: score >= 15 based on service logic
      const mockRisk = createMockRiskItem({ severity: 'Critical' });
      prismaMock.riskAssessment.findFirst.mockResolvedValue(
        { id: 'assessment-1', organizationId: 'org-123' } as never,
      );
      prismaMock.riskItem.create.mockResolvedValue(mockRisk);

      await riskManagementService.addRiskToAssessment('assessment-1', {
        title: 'Critical Risk',
        description: 'Very critical risk',
        category: 'Security',
        likelihood: 5,
        impact: 5,
        organizationId: 'org-123',
        userId: 'user-1',
      });

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          riskScore: 25,
          severity: expect.any(String),
        }),
      });
    });

    it('should propagate database errors on risk creation', async () => {
      // Parent ownership check passes so the create() rejection is what surfaces.
      prismaMock.riskAssessment.findFirst.mockResolvedValue(
        { id: 'assessment-1', organizationId: 'org-123' } as never,
      );
      prismaMock.riskItem.create.mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      await expect(
        riskManagementService.addRiskToAssessment('assessment-1', {
          title: 'Risk',
          description: 'desc',
          category: 'Security',
          likelihood: 3,
          impact: 3,
          organizationId: 'org-123',
          userId: 'user-1',
        })
      ).rejects.toThrow('Foreign key constraint failed');
    });
  });

  // ---------------------------------------------------------------------------
  // completeRiskAssessment
  // ---------------------------------------------------------------------------
  describe('completeRiskAssessment', () => {
    it('should update assessment with Completed status and include risks', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        status: 'Completed',
        risks: [createMockRiskItem()],
        overallRiskScore: 75,
        completedDate: new Date(),
      };
      // Multi-tenant pre-check inside $transaction
      prismaMock.riskAssessment.findFirst.mockResolvedValueOnce({
        id: 'assessment-1',
        organizationId: 'org-123',
      });
      prismaMock.riskAssessment.update.mockResolvedValue(mockAssessment);

      await riskManagementService.completeRiskAssessment(
        'assessment-1',
        { overallRiskScore: 75 },
        'user-1',
        'org-123'
      );

      expect(prismaMock.riskAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: expect.objectContaining({
          status: 'Completed',
          completedDate: expect.any(Date),
          overallRiskScore: 75,
        }),
        include: { risks: true },
      });
    });

    it('should return the updated assessment with risks', async () => {
      const risks = [createMockRiskItem(), createMockRiskItem({ id: 'risk-456' })];
      const mockAssessment = { id: 'assessment-1', status: 'Completed', risks };
      prismaMock.riskAssessment.findFirst.mockResolvedValueOnce({
        id: 'assessment-1',
        organizationId: 'org-123',
      });
      prismaMock.riskAssessment.update.mockResolvedValue(mockAssessment);

      const result = await riskManagementService.completeRiskAssessment(
        'assessment-1',
        { overallRiskScore: 80 },
        'user-1',
        'org-123'
      );

      expect(result.risks).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // updateRiskRemediation
  // ---------------------------------------------------------------------------
  describe('updateRiskRemediation', () => {
    it('should set status to In_Progress and include assignedTo', async () => {
      const mockRisk = createMockRiskItem({ status: 'In_Progress' });
      // Multi-tenant pre-check inside $transaction
      prismaMock.riskItem.findFirst.mockResolvedValueOnce(
        createMockRiskItem({ id: 'risk-123', organizationId: 'org-123' })
      );
      prismaMock.riskItem.update.mockResolvedValue(mockRisk);

      const targetDate = new Date('2026-06-01');
      await riskManagementService.updateRiskRemediation(
        'risk-123',
        {
          mitigationPlan: 'Implement encryption',
          remediationOwner: 'user-2',
          targetDate,
          assignedToId: 'user-2',
        },
        'user-1',
        'org-123'
      );

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith({
        where: { id: 'risk-123' },
        data: expect.objectContaining({
          mitigationPlan: 'Implement encryption',
          remediationOwner: 'user-2',
          targetDate,
          assignedToId: 'user-2',
          status: 'In_Progress',
        }),
        include: { assignedTo: true },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateRiskScore
  // ---------------------------------------------------------------------------
  describe('updateRiskScore', () => {
    it('should recalculate riskScore and severity', async () => {
      const mockRisk = createMockRiskItem({ riskScore: 12 });
      // Multi-tenant pre-check inside $transaction
      prismaMock.riskItem.findFirst.mockResolvedValueOnce(
        createMockRiskItem({ id: 'risk-123', organizationId: 'org-123' })
      );
      prismaMock.riskItem.update.mockResolvedValue(mockRisk);

      await riskManagementService.updateRiskScore(
        'risk-123',
        { likelihood: 3, impact: 4 },
        'user-1',
        'org-123'
      );

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith({
        where: { id: 'risk-123' },
        data: expect.objectContaining({
          likelihood: 3,
          impact: 4,
          riskScore: 12,
          severity: expect.any(String),
        }),
      });
    });

    it('should pass AI priority score when provided', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValueOnce(
        createMockRiskItem({ id: 'risk-123', organizationId: 'org-123' })
      );
      prismaMock.riskItem.update.mockResolvedValue(createMockRiskItem());

      await riskManagementService.updateRiskScore(
        'risk-123',
        { likelihood: 2, impact: 2, aiPriorityScore: 85, aiRationale: 'High impact' },
        'user-1',
        'org-123'
      );

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith({
        where: { id: 'risk-123' },
        data: expect.objectContaining({
          aiPriorityScore: 85,
          aiRationale: 'High impact',
        }),
      });
    });
  });
});
