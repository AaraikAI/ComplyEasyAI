/**
 * Risk Management Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockRiskItem } from '../../mocks/prisma';

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
import riskManagementService from '../../../services/riskManagementService';
import { AuditLogger } from '../../../utils/auditLogger';

describe('RiskManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRiskAssessment()', () => {
    it('should create a new risk assessment', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        name: 'Q4 2025 Risk Assessment',
        description: 'Quarterly risk assessment',
        assessmentType: 'Annual',
        scope: 'Full organization',
        methodology: 'NIST',
        status: 'In_Progress',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.riskAssessment.create.mockResolvedValue(mockAssessment);

      const result = await riskManagementService.createRiskAssessment({
        organizationId: 'org-123',
        name: 'Q4 2025 Risk Assessment',
        description: 'Quarterly risk assessment',
        assessmentType: 'Annual',
        methodology: 'NIST',
        userId: 'user-123',
      });

      expect(result.name).toBe('Q4 2025 Risk Assessment');
      expect(prismaMock.riskAssessment.create).toHaveBeenCalledTimes(1);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'risk_assessment.created',
          resourceType: 'RiskAssessment',
        })
      );
    });
  });

  describe('addRiskToAssessment()', () => {
    it('should add a risk item to an assessment', async () => {
      const mockRisk = createMockRiskItem({
        likelihood: 4,
        impact: 5,
        severity: 'Critical',
      });

      prismaMock.riskItem.create.mockResolvedValue(mockRisk);

      const result = await riskManagementService.addRiskToAssessment(
        'assessment-123',
        {
          title: 'Data Breach Risk',
          description: 'Risk of unauthorized data access',
          category: 'Security',
          likelihood: 4,
          impact: 5,
          organizationId: 'org-123',
          userId: 'user-123',
        }
      );

      expect(result).toBeDefined();
      expect(prismaMock.riskItem.create).toHaveBeenCalled();
    });
  });

  describe('getRiskRegister()', () => {
    it('should return all risks for an organization', async () => {
      const mockRisks = [
        createMockRiskItem({ severity: 'Critical' }),
        createMockRiskItem({ id: 'risk-456', severity: 'High' }),
        createMockRiskItem({ id: 'risk-789', severity: 'Low' }),
      ];

      prismaMock.riskItem.findMany.mockResolvedValue(mockRisks);

      const result = await riskManagementService.getRiskRegister('org-123');

      expect(result).toHaveLength(3);
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });

    it('should filter risks by severity', async () => {
      const criticalRisks = [createMockRiskItem({ severity: 'Critical' })];
      prismaMock.riskItem.findMany.mockResolvedValue(criticalRisks);

      const result = await riskManagementService.getRiskRegister('org-123', {
        severity: 'Critical',
      });

      expect(result).toHaveLength(1);
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: 'Critical',
          }),
        })
      );
    });

    it('should filter risks by status', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      await riskManagementService.getRiskRegister('org-123', { status: 'Open' });

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Open',
          }),
        })
      );
    });

    it('should filter risks by category', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      await riskManagementService.getRiskRegister('org-123', { category: 'Security' });

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Security',
          }),
        })
      );
    });
  });

  describe('updateRiskRemediation()', () => {
    it('should update a risk remediation plan', async () => {
      const updatedRisk = createMockRiskItem({
        status: 'Mitigated',
        mitigationPlan: 'Implemented MFA',
      });

      prismaMock.riskItem.update.mockResolvedValue(updatedRisk);

      const result = await riskManagementService.updateRiskRemediation(
        'risk-123',
        {
          mitigationPlan: 'Implemented MFA',
          remediationOwner: 'user-456',
          targetDate: new Date(),
        },
        'user-123',
        'org-123'
      );

      expect(result).toBeDefined();
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'risk.remediation_plan_updated',
        })
      );
    });
  });

  describe('getRiskDashboard()', () => {
    it('should return comprehensive risk dashboard data', async () => {
      const mockRisks = [
        createMockRiskItem({ severity: 'Critical', status: 'Open' }),
        createMockRiskItem({ severity: 'High', status: 'Open' }),
        createMockRiskItem({ severity: 'Medium', status: 'Mitigated' }),
        createMockRiskItem({ severity: 'Low', status: 'Closed' }),
      ];

      prismaMock.riskItem.findMany.mockResolvedValue(mockRisks);
      prismaMock.riskItem.count.mockResolvedValue(4);
      prismaMock.riskAssessment.findMany.mockResolvedValue([]);

      const dashboard = await riskManagementService.getRiskDashboard('org-123');

      expect(dashboard).toHaveProperty('totalRisks');
      expect(dashboard).toHaveProperty('severityDistribution');
      expect(dashboard).toHaveProperty('assessmentMetrics');
      expect(prismaMock.riskItem.findMany).toHaveBeenCalled();
    });
  });

  describe('getRiskHeatMap()', () => {
    it('should return risk heat map data', async () => {
      const mockRisks = [
        createMockRiskItem({ likelihood: 5, impact: 5 }),
        createMockRiskItem({ likelihood: 3, impact: 4 }),
        createMockRiskItem({ likelihood: 2, impact: 2 }),
      ];

      prismaMock.riskItem.findMany.mockResolvedValue(mockRisks);

      const heatmap = await riskManagementService.getRiskHeatMap('org-123');

      expect(heatmap).toBeDefined();
      expect(heatmap).toHaveProperty('heatMap');
      expect(heatmap).toHaveProperty('risks');
      expect(Array.isArray(heatmap.heatMap)).toBe(true);
    });
  });

  describe('resolveRisk()', () => {
    it('should resolve a risk item', async () => {
      const resolvedRisk = createMockRiskItem({
        status: 'Resolved',
      });

      prismaMock.riskItem.update.mockResolvedValue(resolvedRisk);

      const result = await riskManagementService.resolveRisk(
        'risk-123',
        { resolution: 'Risk has been fully mitigated', effectiveness: 'High' },
        'user-123',
        'org-123'
      );

      expect(result).toBeDefined();
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'risk.resolved',
        })
      );
    });
  });

  describe('getRiskAnalytics()', () => {
    it('should return risk analytics over time', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        createMockRiskItem({ createdAt: new Date('2025-01-01') }),
        createMockRiskItem({ createdAt: new Date('2025-02-01') }),
        createMockRiskItem({ createdAt: new Date('2025-03-01') }),
      ]);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const analytics = await riskManagementService.getRiskAnalytics('org-123', {
        start: thirtyDaysAgo,
        end: now,
      });

      expect(analytics).toBeDefined();
    });
  });
});
