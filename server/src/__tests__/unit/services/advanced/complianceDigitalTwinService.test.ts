/**
 * Compliance Digital Twin & Simulation Engine Service Unit Tests
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

import complianceDigitalTwinService from '../../../../services/advanced/complianceDigitalTwinService';

describe('ComplianceDigitalTwinService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupBaselineMocks = () => {
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
      {
        id: 'fw-1',
        name: 'SOC2',
        status: 'In_Progress',
        organizationId: orgId,
        controls: [
          { id: 'c-1', status: 'Implemented', name: 'Control 1' },
          { id: 'c-2', status: 'Pending', name: 'Control 2' },
          { id: 'c-3', status: 'Implemented', name: 'Control 3' },
        ],
      },
    ]);
    (prismaMock.simulationScenario as any) = {
      create: jest.fn<any>().mockResolvedValue({
        id: 'sim-1',
        organizationId: orgId,
        name: 'Test Sim',
        scenarioType: 'control_change',
        createdAt: new Date(),
      }),
    };
    (prismaMock.simulationResult as any) = {
      create: jest.fn<any>().mockResolvedValue({ id: 'result-1' }),
    };
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
  };

  describe('runSimulation', () => {
    it('should run a control_change simulation', async () => {
      setupBaselineMocks();
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'c-2',
        status: 'Pending',
        frameworkId: 'fw-1',
        framework: { id: 'fw-1', organizationId: orgId, controls: [] },
      });

      const result = await complianceDigitalTwinService.runSimulation(
        orgId,
        {
          name: 'Test control change',
          description: 'Testing control update',
          scenarioType: 'control_change',
          parameters: { controlId: 'c-2', newStatus: 'Implemented' },
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.baselineScore).toBeDefined();
      expect(typeof result.simulatedScore).toBe('number');
      expect(typeof result.scoreChange).toBe('number');
      expect(result.recommendations).toBeDefined();
    });

    it('should run a risk_event simulation', async () => {
      setupBaselineMocks();
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'r-1', severity: 'High', category: 'Security' },
      ]);

      const result = await complianceDigitalTwinService.runSimulation(
        orgId,
        {
          name: 'Test risk event',
          description: 'Simulating data breach',
          scenarioType: 'risk_event',
          parameters: { riskType: 'data_breach', severity: 'High' },
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.baselineScore).toBeDefined();
    });

    it('should run a framework_addition simulation', async () => {
      setupBaselineMocks();
      (prismaMock.frameworkControl.count as jest.Mock<any>).mockResolvedValue(3);

      const result = await complianceDigitalTwinService.runSimulation(
        orgId,
        {
          name: 'Add ISO 27001',
          description: 'Simulate adding ISO 27001',
          scenarioType: 'framework_addition',
          parameters: { frameworkName: 'ISO 27001', estimatedControls: 50 },
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.affectedFrameworks).toBeDefined();
    });

    it('should handle unknown scenario type gracefully', async () => {
      setupBaselineMocks();

      const result = await complianceDigitalTwinService.runSimulation(
        orgId,
        {
          name: 'Unknown scenario',
          description: 'Testing unknown type',
          scenarioType: 'completely_unknown' as any,
          parameters: {},
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.scoreChange).toBe(0);
    });

    it('should handle database creation failure with temporary ID', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.simulationScenario as any) = {
        create: jest.fn<any>().mockRejectedValue(new Error('DB error')),
      };
      (prismaMock.simulationResult as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'result-1' }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await complianceDigitalTwinService.runSimulation(
        orgId,
        {
          name: 'Test',
          description: 'Test desc',
          scenarioType: 'control_change',
          parameters: {},
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.scenarioId).toBeDefined();
    });
  });

  describe('runMonteCarloSimulation', () => {
    it('should run Monte Carlo simulation with specified iterations', async () => {
      setupBaselineMocks();
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'c-1',
        status: 'Implemented',
        frameworkId: 'fw-1',
        framework: { id: 'fw-1', organizationId: orgId, controls: [] },
      });
      (prismaMock.frameworkControl.count as jest.Mock<any>).mockResolvedValue(3);

      const result = await complianceDigitalTwinService.runMonteCarloSimulation(
        orgId,
        'control_change',
        { controlId: 'c-1', newStatus: 'Pending' },
        10,
        userId
      );

      expect(result).toBeDefined();
      expect(result.averageScoreChange).toBeDefined();
      expect(result.minScoreChange).toBeDefined();
      expect(result.maxScoreChange).toBeDefined();
      expect(result.confidenceInterval).toBeDefined();
    });
  });

  describe('compareScenarios', () => {
    it('should compare multiple scenarios', async () => {
      setupBaselineMocks();
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'c-1',
        status: 'Implemented',
        frameworkId: 'fw-1',
        framework: { id: 'fw-1', organizationId: orgId, controls: [] },
      });

      const scenarios = [
        {
          name: 'Scenario A',
          description: 'First option',
          scenarioType: 'control_change' as const,
          parameters: { controlId: 'c-1', newStatus: 'Pending' },
        },
        {
          name: 'Scenario B',
          description: 'Second option',
          scenarioType: 'policy_update' as const,
          parameters: {},
        },
      ];

      const result = await complianceDigitalTwinService.compareScenarios(
        orgId,
        scenarios,
        userId
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('saveSimulationState', () => {
    it('should save simulation state', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await complianceDigitalTwinService.saveSimulationState(
        'sim-1',
        orgId,
        { score: 85, controls: [] },
        userId
      );

      expect(result).toBeDefined();
    });
  });

  describe('loadSimulationState', () => {
    it('should load a saved simulation state', async () => {
      (prismaMock.simulationScenario as any) = {
        findFirst: jest.fn<any>().mockResolvedValue({
          id: 'sim-1',
          organizationId: orgId,
          parameters: { savedState: { score: 85 } },
        }),
      };

      const result = await complianceDigitalTwinService.loadSimulationState('sim-1', orgId);

      expect(result).toBeDefined();
    });

    it('should throw error if simulation not found', async () => {
      (prismaMock.simulationScenario as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(null),
      };

      await expect(
        complianceDigitalTwinService.loadSimulationState('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  describe('runSimulationWithConstraints', () => {
    it('should enforce budget constraints', async () => {
      setupBaselineMocks();

      const result = await complianceDigitalTwinService.runSimulationWithConstraints(
        orgId,
        {
          name: 'Constrained sim',
          description: 'Test with budget',
          scenarioType: 'control_change',
          parameters: {},
        },
        { budget: 1000 },
        userId
      );

      expect(result).toBeDefined();
    });
  });
});
