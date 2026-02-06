/**
 * Federated Swarm Intelligence Service Unit Tests - Comprehensive Coverage
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

  const mockRisk = {
    id: 'risk-1',
    title: 'Data Breach',
    severity: 'High',
    status: 'Open',
    likelihood: 4,
    impact: 5,
    category: 'Security',
    organizationId: orgId,
  };

  const mockSwarmSession = {
    id: 'session-1',
    organizationId: orgId,
    name: 'Test Swarm Session',
    type: 'compliance_assessment',
    status: 'active',
    agents: JSON.stringify([
      { id: 'agent-1', type: 'risk', status: 'active' },
      { id: 'agent-2', type: 'compliance', status: 'active' },
    ]),
    results: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework]);
    (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockFramework.controls);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([mockRisk]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.vendor.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.swarmSession.create as jest.Mock<any>).mockResolvedValue(mockSwarmSession);
    (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValue(mockSwarmSession);
    (prismaMock.swarmSession.findMany as jest.Mock<any>).mockResolvedValue([mockSwarmSession]);
    (prismaMock.swarmSession.update as jest.Mock<any>).mockResolvedValue(mockSwarmSession);
    (prismaMock.swarmSession.delete as jest.Mock<any>).mockResolvedValue(mockSwarmSession);
  });

  // ===================== createSwarmSession =====================
  describe('createSwarmSession', () => {
    it('should create a compliance assessment swarm session', async () => {
      const result = await federatedSwarmService.createSwarmSession(orgId, {
        type: 'compliance_assessment',
        name: 'SOC2 Assessment',
        agentTypes: ['risk', 'compliance', 'policy'],
      });

      expect(result).toBeDefined();
      expect(prismaMock.swarmSession.create).toHaveBeenCalled();
    });

    it('should create a risk analysis swarm session', async () => {
      const result = await federatedSwarmService.createSwarmSession(orgId, {
        type: 'risk_analysis',
        name: 'Risk Analysis',
        agentTypes: ['risk'],
      });

      expect(result).toBeDefined();
    });

    it('should create a vendor assessment swarm session', async () => {
      const result = await federatedSwarmService.createSwarmSession(orgId, {
        type: 'vendor_assessment',
        name: 'Vendor Review',
        agentTypes: ['vendor', 'risk'],
      });

      expect(result).toBeDefined();
    });

    it('should create a gap analysis swarm session', async () => {
      const result = await federatedSwarmService.createSwarmSession(orgId, {
        type: 'gap_analysis',
        name: 'Gap Analysis',
        agentTypes: ['compliance', 'gap'],
      });

      expect(result).toBeDefined();
    });
  });

  // ===================== runSwarmAnalysis =====================
  describe('runSwarmAnalysis', () => {
    it('should run swarm analysis on a session', async () => {
      const result = await federatedSwarmService.runSwarmAnalysis('session-1', orgId);

      expect(result).toBeDefined();
    });

    it('should throw when session not found', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        federatedSwarmService.runSwarmAnalysis('nonexistent', orgId)
      ).rejects.toThrow();
    });

    it('should update session with results', async () => {
      await federatedSwarmService.runSwarmAnalysis('session-1', orgId);

      expect(prismaMock.swarmSession.update).toHaveBeenCalled();
    });
  });

  // ===================== getSwarmSession =====================
  describe('getSwarmSession', () => {
    it('should get a swarm session by ID', async () => {
      const result = await federatedSwarmService.getSwarmSession('session-1', orgId);

      expect(result).toBeDefined();
    });

    it('should throw when session not found', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        federatedSwarmService.getSwarmSession('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== getSwarmSessions =====================
  describe('getSwarmSessions', () => {
    it('should list all swarm sessions for org', async () => {
      const result = await federatedSwarmService.getSwarmSessions(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no sessions exist', async () => {
      (prismaMock.swarmSession.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await federatedSwarmService.getSwarmSessions(orgId);
      expect(result).toEqual([]);
    });
  });

  // ===================== addAgentToSwarm =====================
  describe('addAgentToSwarm', () => {
    it('should add an agent to an existing swarm', async () => {
      const result = await federatedSwarmService.addAgentToSwarm('session-1', orgId, {
        type: 'evidence',
        config: { threshold: 0.8 },
      });

      expect(result).toBeDefined();
    });

    it('should throw when session not found', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        federatedSwarmService.addAgentToSwarm('nonexistent', orgId, { type: 'evidence' })
      ).rejects.toThrow();
    });
  });

  // ===================== removeAgentFromSwarm =====================
  describe('removeAgentFromSwarm', () => {
    it('should remove an agent from a swarm', async () => {
      await expect(
        federatedSwarmService.removeAgentFromSwarm('session-1', 'agent-1', orgId)
      ).resolves.not.toThrow();
    });

    it('should throw when session not found', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        federatedSwarmService.removeAgentFromSwarm('nonexistent', 'agent-1', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== mergeSwarmResults =====================
  describe('mergeSwarmResults', () => {
    it('should merge results from multiple swarm sessions', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValue({
        ...mockSwarmSession,
        results: JSON.stringify({ score: 80, recommendations: ['Rec 1'] }),
        status: 'completed',
      });

      const result = await federatedSwarmService.mergeSwarmResults(
        orgId, ['session-1', 'session-1']
      );

      expect(result).toBeDefined();
    });

    it('should handle empty session list', async () => {
      const result = await federatedSwarmService.mergeSwarmResults(orgId, []);
      expect(result).toBeDefined();
    });
  });

  // ===================== getAgentPerformanceMetrics =====================
  describe('getAgentPerformanceMetrics', () => {
    it('should return agent performance metrics', async () => {
      (prismaMock.swarmSession.findMany as jest.Mock<any>).mockResolvedValue([{
        ...mockSwarmSession,
        results: JSON.stringify({
          agentResults: [
            { agentId: 'agent-1', type: 'risk', executionTime: 100, findingsCount: 5 },
          ],
        }),
      }]);

      const result = await federatedSwarmService.getAgentPerformanceMetrics(orgId);
      expect(result).toBeDefined();
    });

    it('should handle no sessions', async () => {
      (prismaMock.swarmSession.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await federatedSwarmService.getAgentPerformanceMetrics(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== optimizeSwarmConfig =====================
  describe('optimizeSwarmConfig', () => {
    it('should optimize swarm configuration', async () => {
      const result = await federatedSwarmService.optimizeSwarmConfig(orgId, {
        targetType: 'compliance_assessment',
        budget: 100,
      });

      expect(result).toBeDefined();
    });
  });

  // ===================== deleteSwarmSession =====================
  describe('deleteSwarmSession', () => {
    it('should delete a swarm session', async () => {
      await expect(
        federatedSwarmService.deleteSwarmSession('session-1', orgId)
      ).resolves.not.toThrow();
    });

    it('should throw when session not found', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        federatedSwarmService.deleteSwarmSession('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle database error in createSwarmSession', async () => {
      (prismaMock.swarmSession.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        federatedSwarmService.createSwarmSession(orgId, {
          type: 'compliance_assessment',
          name: 'Test',
          agentTypes: ['risk'],
        })
      ).rejects.toThrow();
    });

    it('should handle database error in runSwarmAnalysis', async () => {
      (prismaMock.swarmSession.findFirst as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        federatedSwarmService.runSwarmAnalysis('session-1', orgId)
      ).rejects.toThrow();
    });
  });
});
