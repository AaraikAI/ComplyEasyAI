/**
 * Federated Swarm Intelligence Service Unit Tests - Comprehensive Coverage
 * Tests: joinFederation, leaveFederation, contributeToFederation, getSwarmInsights,
 *        participateInSwarm, getFederationStatus, benchmarkAgainstPeers, identifyTrends, etc.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import federatedSwarmService from '../../../../services/advanced/federatedSwarmService';

describe('FederatedSwarmService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  const mockFramework = {
    id: 'fw-1',
    name: 'SOC 2',
    organizationId: orgId,
    status: 'In_Progress',
    controls: [
      { id: 'c-1', name: 'CC1.1', description: 'Control Environment', status: 'Implemented', category: 'Security' },
      { id: 'c-2', name: 'CC2.1', description: 'Risk Assessment', status: 'Pending', category: 'Security' },
    ],
  };

  const mockPeer = {
    id: 'peer-1',
    organizationId: orgId,
    status: 'active',
    joinedAt: new Date(),
    contributionCount: 5,
    lastContribution: new Date(),
  };

  const mockSwarmInsight = {
    id: 'insight-1',
    type: 'compliance_trend',
    insight: 'Compliance scores improving across peers',
    confidence: 0.85,
    frameworks: ['SOC 2'],
    createdAt: new Date(),
  };

  const mockAggregation = {
    id: 'agg-1',
    modelType: 'risk_prediction',
    weights: { risk_score: 0.75 },
    version: 1,
    participantCount: 10,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework]);
    (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockFramework.controls);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'risk-1', title: 'Data Breach', severity: 'High', status: 'Open', likelihood: 4, impact: 5, category: 'Security', organizationId: orgId },
    ]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.vendor.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(5);
    (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue({ createdAt: new Date() });
    (prismaMock.federatedSwarmPeer.create as jest.Mock<any>).mockResolvedValue(mockPeer);
    (prismaMock.federatedSwarmPeer.findMany as jest.Mock<any>).mockResolvedValue([mockPeer]);
    (prismaMock.federatedSwarmPeer.updateMany as jest.Mock<any>).mockResolvedValue({ count: 1 });
    (prismaMock.swarmInsight.findMany as jest.Mock<any>).mockResolvedValue([mockSwarmInsight]);
    (prismaMock.swarmInsight.create as jest.Mock<any>).mockResolvedValue(mockSwarmInsight);
    (prismaMock.swarmInsight.count as jest.Mock<any>).mockResolvedValue(5);
    (prismaMock.federatedSwarmAggregation.findMany as jest.Mock<any>).mockResolvedValue([mockAggregation]);
    (prismaMock.federatedSwarmAggregation.findFirst as jest.Mock<any>).mockResolvedValue(mockAggregation);
    (prismaMock.federatedSwarmAggregation.create as jest.Mock<any>).mockResolvedValue(mockAggregation);
    (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
      id: orgId,
      name: 'Test Org',
      plan: 'Enterprise',
      industry: 'Technology',
      sector: 'SaaS',
      frameworks: [mockFramework],
    });
    (prismaMock.organization.findMany as jest.Mock<any>).mockResolvedValue([
      {
        id: orgId,
        name: 'Test Org',
        frameworks: [{
          ...mockFramework,
          controls: mockFramework.controls,
        }],
      },
    ]);
  });

  // ===================== joinFederation =====================
  describe('joinFederation', () => {
    it('should join the federation successfully', async () => {
      // Make sure org is not already participating
      (prismaMock.federatedSwarmPeer.findMany as jest.Mock<any>).mockResolvedValueOnce([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValueOnce(0);
      (prismaMock.swarmInsight.count as jest.Mock<any>).mockResolvedValueOnce(0);
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      const result = await federatedSwarmService.joinFederation(orgId, userId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('membershipId');
    });

    it('should throw when already joined', async () => {
      // Org is already participating (default mock has peers)
      await expect(
        federatedSwarmService.joinFederation(orgId, userId)
      ).rejects.toThrow('Organization is already a federation member');
    });
  });

  // ===================== leaveFederation =====================
  describe('leaveFederation', () => {
    it('should leave the federation', async () => {
      await expect(
        federatedSwarmService.leaveFederation(orgId, userId)
      ).resolves.not.toThrow();
    });
  });

  // ===================== contributeToFederation =====================
  describe('contributeToFederation', () => {
    it('should contribute model weights to federation', async () => {
      const result = await federatedSwarmService.contributeToFederation(orgId, {
        modelType: 'risk_prediction',
        localWeights: { risk_score: 0.8, control_coverage: 0.65 },
        metadata: { frameworkCount: 2, controlCount: 10, riskCount: 5 },
      }, userId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('contributionId');
    });

    it('should contribute control effectiveness model', async () => {
      const result = await federatedSwarmService.contributeToFederation(orgId, {
        modelType: 'control_effectiveness',
        localWeights: { effectiveness: 0.7 },
        metadata: { frameworkCount: 1, controlCount: 5, riskCount: 2 },
      }, userId);

      expect(result).toBeDefined();
    });

    it('should contribute compliance scoring model', async () => {
      const result = await federatedSwarmService.contributeToFederation(orgId, {
        modelType: 'compliance_scoring',
        localWeights: { score: 0.9 },
        metadata: { frameworkCount: 3, controlCount: 20, riskCount: 8 },
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== getSwarmInsights =====================
  describe('getSwarmInsights', () => {
    it('should return swarm insights for frameworks', async () => {
      const result = await federatedSwarmService.getSwarmInsights(orgId, ['SOC 2']);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return insights with filters', async () => {
      const result = await federatedSwarmService.getSwarmInsights(orgId, ['SOC 2'], {
        industry: 'Technology',
        minConfidence: 0.8,
      });
      expect(result).toBeDefined();
    });

    it('should handle empty insights', async () => {
      (prismaMock.swarmInsight.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await federatedSwarmService.getSwarmInsights(orgId, ['SOC 2']);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===================== receiveFederatedModel =====================
  describe('receiveFederatedModel', () => {
    it('should receive a federated model', async () => {
      const result = await federatedSwarmService.receiveFederatedModel(orgId, 'risk_prediction');
      expect(result).toBeDefined();
    });

    it('should handle no available model', async () => {
      (prismaMock.federatedSwarmAggregation.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const result = await federatedSwarmService.receiveFederatedModel(orgId, 'risk_prediction');
      // Should return null or empty when no model available
      expect(result === null || result !== undefined).toBe(true);
    });
  });

  // ===================== getFederatedModel =====================
  describe('getFederatedModel', () => {
    it('should get the latest federated model', async () => {
      const result = await federatedSwarmService.getFederatedModel('risk_prediction');
      expect(result).toBeDefined();
    });

    it('should return null when no model exists', async () => {
      (prismaMock.federatedSwarmAggregation.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const result = await federatedSwarmService.getFederatedModel('compliance_scoring');
      expect(result).toBeNull();
    });
  });

  // ===================== participateInSwarm =====================
  describe('participateInSwarm', () => {
    it('should participate in risk analysis swarm', async () => {
      const result = await federatedSwarmService.participateInSwarm(orgId, 'risk_analysis');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('assignedTasks');
      expect(result).toHaveProperty('completedTasks');
    });

    it('should participate in control review swarm', async () => {
      const result = await federatedSwarmService.participateInSwarm(orgId, 'control_review');
      expect(result).toBeDefined();
    });

    it('should participate in evidence verification swarm', async () => {
      const result = await federatedSwarmService.participateInSwarm(orgId, 'evidence_verification');
      expect(result).toBeDefined();
    });
  });

  // ===================== getFederationStatus =====================
  describe('getFederationStatus', () => {
    it('should get federation status', async () => {
      const result = await federatedSwarmService.getFederationStatus(orgId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isParticipating');
      expect(result).toHaveProperty('contributionCount');
    });

    it('should handle non-participating organization', async () => {
      (prismaMock.federatedSwarmPeer.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);
      (prismaMock.swarmInsight.count as jest.Mock<any>).mockResolvedValue(0);

      const result = await federatedSwarmService.getFederationStatus(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== benchmarkAgainstPeers =====================
  describe('benchmarkAgainstPeers', () => {
    it('should benchmark against peers', async () => {
      const result = await federatedSwarmService.benchmarkAgainstPeers(orgId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('organizationScore');
      expect(result).toHaveProperty('peerAverage');
      expect(result).toHaveProperty('percentile');
    });

    it('should benchmark with specific framework', async () => {
      const result = await federatedSwarmService.benchmarkAgainstPeers(orgId, 'fw-1');
      expect(result).toBeDefined();
    });
  });

  // ===================== identifyTrends =====================
  describe('identifyTrends', () => {
    it('should identify compliance trends', async () => {
      const result = await federatedSwarmService.identifyTrends(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should identify trends with custom time window', async () => {
      const result = await federatedSwarmService.identifyTrends(orgId, 90);
      expect(result).toBeDefined();
    });
  });

  // ===================== exportInsights =====================
  describe('exportInsights', () => {
    it('should export insights as JSON', async () => {
      const result = await federatedSwarmService.exportInsights([mockSwarmInsight as any], 'json');
      expect(result).toBeDefined();
    });

    it('should export insights as CSV', async () => {
      const fullInsight = {
        ...mockSwarmInsight,
        description: 'Test description',
        sourceCount: 5,
        applicableFrameworks: ['SOC 2'],
        category: 'compliance',
      };
      const result = await federatedSwarmService.exportInsights([fullInsight as any], 'csv');
      expect(result).toBeDefined();
    });

    it('should handle empty insights', async () => {
      const result = await federatedSwarmService.exportInsights([], 'json');
      expect(result).toBeDefined();
    });
  });

  // ===================== getIndustryInsights =====================
  describe('getIndustryInsights', () => {
    it('should get industry-specific insights', async () => {
      const result = await federatedSwarmService.getIndustryInsights(orgId, 'Technology');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===================== getSectorInsights =====================
  describe('getSectorInsights', () => {
    it('should get sector-specific insights', async () => {
      const result = await federatedSwarmService.getSectorInsights(orgId, 'SaaS');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===================== getFrameworkInsights =====================
  describe('getFrameworkInsights', () => {
    it('should get framework-specific insights', async () => {
      const result = await federatedSwarmService.getFrameworkInsights(orgId, 'fw-1');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===================== getModelAuditTrail =====================
  describe('getModelAuditTrail', () => {
    it('should get model audit trail', async () => {
      const result = await federatedSwarmService.getModelAuditTrail('risk_prediction');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get audit trail with limit', async () => {
      const result = await federatedSwarmService.getModelAuditTrail('risk_prediction', 10);
      expect(result).toBeDefined();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle database error in joinFederation', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        federatedSwarmService.joinFederation(orgId, userId)
      ).rejects.toThrow();
    });

    it('should handle database error in contributeToFederation', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        federatedSwarmService.contributeToFederation(orgId, {
          modelType: 'risk_prediction',
          localWeights: { score: 0.5 },
          metadata: { frameworkCount: 1, controlCount: 1, riskCount: 1 },
        }, userId)
      ).rejects.toThrow();
    });

    it('should handle database error in getFederationStatus gracefully', async () => {
      (prismaMock.federatedSwarmPeer.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      // Service handles errors gracefully
      const result = await federatedSwarmService.getFederationStatus(orgId);
      expect(result).toBeDefined();
    });
  });
});
