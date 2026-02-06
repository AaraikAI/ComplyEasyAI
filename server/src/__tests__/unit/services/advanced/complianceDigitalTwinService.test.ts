/**
 * Compliance Digital Twin & Simulation Engine Service Unit Tests - Comprehensive Coverage
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

import complianceDigitalTwinService from '../../../../services/advanced/complianceDigitalTwinService';

describe('ComplianceDigitalTwinService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  const mockFramework = {
    id: 'fw-1',
    name: 'SOC 2',
    organizationId: orgId,
    status: 'In_Progress',
    controls: [
      { id: 'c-1', name: 'CC1.1', description: 'Control Environment', status: 'Implemented', category: 'Security' },
      { id: 'c-2', name: 'CC2.1', description: 'Information and Communication', status: 'Pending', category: 'Security' },
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

  const mockScenario = {
    id: 'scenario-1',
    organizationId: orgId,
    name: 'Test Scenario',
    type: 'control_change',
    parameters: JSON.stringify({ controlId: 'c-1', newStatus: 'Failed' }),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSimResult = {
    id: 'sim-1',
    scenarioId: 'scenario-1',
    organizationId: orgId,
    baselineScore: 75,
    simulatedScore: 60,
    impact: -15,
    details: JSON.stringify({}),
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework]);
    (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockFramework.controls);
    (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework.controls[0]);
    (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue(mockFramework.controls[0]);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([mockRisk]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.simulationScenario.create as jest.Mock<any>).mockResolvedValue(mockScenario);
    (prismaMock.simulationScenario.findFirst as jest.Mock<any>).mockResolvedValue(mockScenario);
    (prismaMock.simulationScenario.findMany as jest.Mock<any>).mockResolvedValue([mockScenario]);
    (prismaMock.simulationScenario.update as jest.Mock<any>).mockResolvedValue(mockScenario);
    (prismaMock.simulationResult.create as jest.Mock<any>).mockResolvedValue(mockSimResult);
    (prismaMock.simulationResult.findMany as jest.Mock<any>).mockResolvedValue([mockSimResult]);
    (prismaMock.simulationResult.findFirst as jest.Mock<any>).mockResolvedValue(mockSimResult);
    (prismaMock.simulationResult.deleteMany as jest.Mock<any>).mockResolvedValue({});
  });

  // ===================== runSimulation =====================
  describe('runSimulation', () => {
    it('should run control_change simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'control_change',
        parameters: { controlId: 'c-1', newStatus: 'Failed' },
        name: 'Test Control Change',
      });

      expect(result).toBeDefined();
      expect(typeof result.baselineScore).toBe('number');
      expect(typeof result.simulatedScore).toBe('number');
    });

    it('should run policy_update simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'policy_update',
        parameters: { policyId: 'policy-1', changes: { status: 'Draft' } },
        name: 'Test Policy Update',
      });

      expect(result).toBeDefined();
    });

    it('should run risk_event simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'risk_event',
        parameters: { riskCategory: 'Security', severity: 'Critical' },
        name: 'Test Risk Event',
      });

      expect(result).toBeDefined();
    });

    it('should run framework_addition simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'framework_addition',
        parameters: { frameworkName: 'ISO 27001' },
        name: 'Test Framework Addition',
      });

      expect(result).toBeDefined();
    });

    it('should run data_breach simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'data_breach',
        parameters: { breachType: 'external', dataTypes: ['PII'] },
        name: 'Test Data Breach',
      });

      expect(result).toBeDefined();
    });

    it('should run audit_scenario simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'audit_scenario',
        parameters: { auditType: 'SOC2', strictness: 'high' },
        name: 'Test Audit Scenario',
      });

      expect(result).toBeDefined();
    });

    it('should run control_removal simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'control_removal',
        parameters: { controlId: 'c-1' },
        name: 'Test Control Removal',
      });

      expect(result).toBeDefined();
    });

    it('should run control_modification simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'control_modification',
        parameters: { controlId: 'c-1', modifications: { description: 'Updated' } },
        name: 'Test Control Modification',
      });

      expect(result).toBeDefined();
    });

    it('should run evidence_update simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'evidence_update',
        parameters: { controlId: 'c-1', evidenceStatus: 'missing' },
        name: 'Test Evidence Update',
      });

      expect(result).toBeDefined();
    });

    it('should run audit_schedule simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'audit_schedule',
        parameters: { frameworkId: 'fw-1', auditDate: new Date().toISOString() },
        name: 'Test Audit Schedule',
      });

      expect(result).toBeDefined();
    });

    it('should run compliance_debt simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'compliance_debt',
        parameters: { debtLevel: 'high' },
        name: 'Test Compliance Debt',
      });

      expect(result).toBeDefined();
    });

    it('should run integration_change simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'integration_change',
        parameters: { integrationType: 'siem', action: 'disconnect' },
        name: 'Test Integration Change',
      });

      expect(result).toBeDefined();
    });

    it('should run user_role_change simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'user_role_change',
        parameters: { userId: 'user-1', newRole: 'viewer' },
        name: 'Test User Role Change',
      });

      expect(result).toBeDefined();
    });

    it('should run framework_status_change simulation', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'framework_status_change',
        parameters: { frameworkId: 'fw-1', newStatus: 'Inactive' },
        name: 'Test Framework Status Change',
      });

      expect(result).toBeDefined();
    });

    it('should handle unknown simulation type with default behavior', async () => {
      const result = await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'unknown_type' as any,
        parameters: {},
        name: 'Unknown Simulation',
      });

      expect(result).toBeDefined();
    });

    it('should store simulation results', async () => {
      await complianceDigitalTwinService.runSimulation(orgId, {
        type: 'control_change',
        parameters: { controlId: 'c-1', newStatus: 'Failed' },
        name: 'Store Test',
      });

      expect(prismaMock.simulationScenario.create).toHaveBeenCalled();
    });

    it('should handle database error during simulation', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        complianceDigitalTwinService.runSimulation(orgId, {
          type: 'control_change',
          parameters: { controlId: 'c-1', newStatus: 'Failed' },
          name: 'Error Test',
        })
      ).rejects.toThrow();
    });
  });

  // ===================== runSimulationWithConstraints =====================
  describe('runSimulationWithConstraints', () => {
    it('should run simulation with budget constraint', async () => {
      const result = await complianceDigitalTwinService.runSimulationWithConstraints(orgId, {
        type: 'control_change',
        parameters: { controlId: 'c-1', newStatus: 'Failed' },
        name: 'Constrained Sim',
      }, {
        budget: 10000,
      });

      expect(result).toBeDefined();
    });

    it('should run simulation with timeline constraint', async () => {
      const result = await complianceDigitalTwinService.runSimulationWithConstraints(orgId, {
        type: 'risk_event',
        parameters: { riskCategory: 'Security', severity: 'High' },
        name: 'Timeline Sim',
      }, {
        timeline: 30,
      });

      expect(result).toBeDefined();
    });

    it('should run simulation with all constraints', async () => {
      const result = await complianceDigitalTwinService.runSimulationWithConstraints(orgId, {
        type: 'control_change',
        parameters: { controlId: 'c-1', newStatus: 'Failed' },
        name: 'All Constraints',
      }, {
        budget: 50000,
        timeline: 60,
        resources: 5,
      });

      expect(result).toBeDefined();
    });
  });

  // ===================== compareScenarios =====================
  describe('compareScenarios', () => {
    it('should compare multiple simulation scenarios', async () => {
      (prismaMock.simulationResult.findFirst as jest.Mock<any>).mockResolvedValue(mockSimResult);

      const result = await complianceDigitalTwinService.compareScenarios(
        orgId, ['scenario-1', 'scenario-1']
      );

      expect(result).toBeDefined();
    });

    it('should handle empty scenario list', async () => {
      const result = await complianceDigitalTwinService.compareScenarios(orgId, []);
      expect(result).toBeDefined();
    });
  });

  // ===================== saveSimulationState =====================
  describe('saveSimulationState', () => {
    it('should save current simulation state', async () => {
      const result = await complianceDigitalTwinService.saveSimulationState(orgId, 'scenario-1');

      expect(result).toBeDefined();
      expect(prismaMock.simulationScenario.update).toHaveBeenCalled();
    });
  });

  // ===================== loadSimulationState =====================
  describe('loadSimulationState', () => {
    it('should load simulation state', async () => {
      const result = await complianceDigitalTwinService.loadSimulationState('scenario-1', orgId);
      expect(result).toBeDefined();
    });

    it('should throw when scenario not found', async () => {
      (prismaMock.simulationScenario.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        complianceDigitalTwinService.loadSimulationState('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== rollbackSimulation =====================
  describe('rollbackSimulation', () => {
    it('should rollback simulation results', async () => {
      const result = await complianceDigitalTwinService.rollbackSimulation('scenario-1', orgId);

      expect(result).toBeDefined();
    });

    it('should return false when scenario not found', async () => {
      (prismaMock.simulationScenario.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceDigitalTwinService.rollbackSimulation('nonexistent', orgId);
      expect(result).toBe(false);
    });
  });

  // ===================== runMonteCarloSimulation =====================
  describe('runMonteCarloSimulation', () => {
    it('should run Monte Carlo simulation', async () => {
      const result = await complianceDigitalTwinService.runMonteCarloSimulation(
        orgId, 'risk_event', { riskCategory: 'Security', severity: 'High' }, 100, userId
      );

      expect(result).toBeDefined();
      expect(typeof result.averageScoreChange).toBe('number');
    });

    it('should handle small iteration count', async () => {
      const result = await complianceDigitalTwinService.runMonteCarloSimulation(
        orgId, 'risk_event', { riskCategory: 'Security', severity: 'High' }, 50, userId
      );

      expect(result).toBeDefined();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle framework findMany error', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        complianceDigitalTwinService.runSimulation(orgId, {
          type: 'control_change',
          parameters: { controlId: 'c-1', newStatus: 'Failed' },
          name: 'Error Test',
        })
      ).rejects.toThrow();
    });
  });
});
