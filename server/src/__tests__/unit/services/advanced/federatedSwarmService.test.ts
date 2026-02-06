/**
 * Federated Swarm Intelligence Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('joinFederation', () => {
    it('should allow an organization to join the federation', async () => {
      // Mock getFederationStatus returning not participating
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.federatedSwarmPeer as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
        create: jest.fn<any>().mockResolvedValue({
          id: 'peer-1',
          organizationId: orgId,
          peerId: 'membership-1',
          status: 'active',
        }),
      };

      const result = await federatedSwarmService.joinFederation(orgId, userId);

      expect(result).toBeDefined();
      expect(result.membershipId).toBeDefined();
      expect(result.joinedAt).toBeDefined();
    });

    it('should throw error if already a federation member', async () => {
      // Mock getFederationStatus returning participating
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        {
          action: 'federated_swarm.joined',
          details: JSON.stringify({ membershipId: 'existing' }),
          createdAt: new Date(),
        },
      ]);
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.federatedSwarmPeer as any) = {
        findMany: jest.fn<any>().mockResolvedValue([{ status: 'active' }]),
      };

      await expect(
        federatedSwarmService.joinFederation(orgId, userId)
      ).rejects.toThrow('already a federation member');
    });
  });

  describe('leaveFederation', () => {
    it('should allow an organization to leave the federation', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await expect(
        federatedSwarmService.leaveFederation(orgId, userId)
      ).resolves.not.toThrow();
    });

    it('should handle database error when leaving', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        federatedSwarmService.leaveFederation(orgId, userId)
      ).rejects.toThrow();
    });
  });

  describe('contributeToFederation', () => {
    const validContribution = {
      modelType: 'risk_prediction' as const,
      localWeights: { layer1: [0.1, 0.2, 0.3], layer2: [0.4, 0.5] },
      metadata: {
        frameworkCount: 3,
        controlCount: 50,
        riskCount: 10,
      },
    };

    it('should accept a valid contribution', async () => {
      // Mock rate limit check
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.federatedSwarmPeer as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.federatedSwarmAggregation as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(null),
        create: jest.fn<any>().mockResolvedValue({ id: 'agg-1' }),
      };

      const result = await federatedSwarmService.contributeToFederation(
        orgId,
        validContribution,
        userId
      );

      expect(result).toBeDefined();
      expect(result.contributionId).toBeDefined();
      expect(result.aggregated).toBe(true);
    });

    it('should reject contribution when rate limited', async () => {
      // Simulate many recent contributions
      const recentLogs = Array.from({ length: 20 }, (_, i) => ({
        action: 'federated_swarm.contribution_made',
        createdAt: new Date(),
        details: JSON.stringify({ contributionId: `c-${i}` }),
      }));

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue(recentLogs);

      await expect(
        federatedSwarmService.contributeToFederation(orgId, validContribution, userId)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should reject invalid contribution metadata', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);

      const invalidContribution = {
        ...validContribution,
        metadata: {
          frameworkCount: -1,
          controlCount: 0,
          riskCount: 0,
        },
      };

      await expect(
        federatedSwarmService.contributeToFederation(orgId, invalidContribution, userId)
      ).rejects.toThrow();
    });
  });

  describe('getSwarmInsights', () => {
    it('should return swarm insights for an organization', async () => {
      (prismaMock.swarmInsight as any) = {
        findMany: jest.fn<any>().mockResolvedValue([
          {
            id: 'insight-1',
            insightType: 'best_practice',
            description: 'Enable MFA for all admin users',
            confidence: 0.95,
            sourceCount: 15,
            applicableFrameworks: ['SOC2'],
            recommendations: ['Implement MFA'],
          },
        ]),
      };
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'fw-1', name: 'SOC2', controls: [{ id: 'c-1', status: 'Implemented' }] },
      ]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        id: orgId,
        industry: 'Technology',
      });

      const result = await federatedSwarmService.getSwarmInsights(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getFederationStatus', () => {
    it('should return federation status for organization', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.federatedSwarmPeer as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.federatedSwarmAggregation as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(null),
      };

      const result = await federatedSwarmService.getFederationStatus(orgId);

      expect(result).toBeDefined();
      expect(result.isParticipating).toBeDefined();
    });
  });

  describe('getFederatedModel', () => {
    it('should return a federated model', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        {
          action: 'federated_swarm.contribution_made',
          details: JSON.stringify({
            modelType: 'risk_prediction',
            organizationId: 'org-a',
          }),
          organizationId: 'org-a',
          createdAt: new Date(),
        },
        {
          action: 'federated_swarm.contribution_made',
          details: JSON.stringify({
            modelType: 'risk_prediction',
            organizationId: 'org-b',
          }),
          organizationId: 'org-b',
          createdAt: new Date(),
        },
        {
          action: 'federated_swarm.contribution_made',
          details: JSON.stringify({
            modelType: 'risk_prediction',
            organizationId: 'org-c',
          }),
          organizationId: 'org-c',
          createdAt: new Date(),
        },
      ]);

      const result = await federatedSwarmService.getFederatedModel('risk_prediction');

      expect(result).toBeDefined();
    });
  });

  describe('benchmarkAgainstPeers', () => {
    it('should benchmark organization against peers', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'fw-1',
          name: 'SOC2',
          controls: [
            { status: 'Implemented' },
            { status: 'Implemented' },
            { status: 'Pending' },
          ],
        },
      ]);
      (prismaMock.swarmInsight as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.organization.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'org-a', frameworks: [{ controls: [{ status: 'Implemented' }] }] },
      ]);

      const result = await federatedSwarmService.benchmarkAgainstPeers(orgId);

      expect(result).toBeDefined();
    });
  });

  describe('exportInsights', () => {
    it('should export insights in JSON format', async () => {
      (prismaMock.swarmInsight as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await federatedSwarmService.exportInsights(orgId, 'json');

      expect(result).toBeDefined();
    });

    it('should export insights in CSV format', async () => {
      (prismaMock.swarmInsight as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await federatedSwarmService.exportInsights(orgId, 'csv');

      expect(result).toBeDefined();
    });
  });
});
