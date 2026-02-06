/**
 * Agentic AI Service Unit Tests
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

import agenticAIService from '../../../../services/advanced/agenticAIService';

describe('AgenticAIService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish mock implementations after resetMocks
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.user.count as jest.Mock<any>).mockResolvedValue(0);
    (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.complianceFramework.count as jest.Mock<any>).mockResolvedValue(0);
    (prismaMock.riskItem.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.agenticAction.create as jest.Mock<any>).mockResolvedValue({
      id: 'action-1',
      status: 'approved',
    });
    (prismaMock.agenticAction.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.agenticAction.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.agenticAction.update as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.agenticAction.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.evidenceAnalysis.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.complianceFramework.findUnique as jest.Mock<any>).mockResolvedValue(null);
  });

  describe('estimateBlastRadius', () => {
    it('should estimate blast radius for control_update action', async () => {
      const mockControl = {
        id: 'ctrl-1',
        name: 'Access Control',
        status: 'Implemented',
        frameworkId: 'fw-1',
        mappedControls: null,
        framework: { id: 'fw-1', name: 'SOC2', organizationId: orgId },
      };

      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([mockControl]);
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'fw-1', name: 'SOC2', controls: [mockControl] },
      ]);
      (prismaMock.user.count as jest.Mock<any>).mockResolvedValue(10);

      const result = await agenticAIService.estimateBlastRadius(orgId, {
        actionType: 'control_update',
        targetId: 'ctrl-1',
        parameters: { status: 'Pending' },
      });

      expect(result).toBeDefined();
      expect(result.estimatedUsers).toBe(10);
      expect(result.canRollback).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(typeof result.riskScore).toBe('number');
    });

    it('should throw error when targetId is missing', async () => {
      await expect(
        agenticAIService.estimateBlastRadius(orgId, {
          actionType: 'control_update',
          targetId: '',
          parameters: {},
        })
      ).rejects.toThrow('Target ID is required');
    });

    it('should throw error for unknown action type', async () => {
      await expect(
        agenticAIService.estimateBlastRadius(orgId, {
          actionType: 'unknown_action',
          targetId: 'some-id',
          parameters: {},
        })
      ).rejects.toThrow('Unknown action type');
    });

    it('should estimate blast radius for risk_mitigation', async () => {
      const mockRisk = {
        id: 'risk-1',
        severity: 'High',
        status: 'Open',
        organizationId: orgId,
      };

      (prismaMock.riskItem.findUnique as jest.Mock<any>).mockResolvedValue(mockRisk);
      (prismaMock.user.count as jest.Mock<any>).mockResolvedValue(5);

      const result = await agenticAIService.estimateBlastRadius(orgId, {
        actionType: 'risk_mitigation',
        targetId: 'risk-1',
        parameters: {},
      });

      expect(result).toBeDefined();
      expect(result.affectedRisks).toBe(1);
      expect(result.riskLevel).toBe('high');
      expect(result.rollbackComplexity).toBe('moderate');
    });

    it('should throw error when risk not found for risk_mitigation', async () => {
      (prismaMock.riskItem.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        agenticAIService.estimateBlastRadius(orgId, {
          actionType: 'risk_mitigation',
          targetId: 'nonexistent',
          parameters: {},
        })
      ).rejects.toThrow();
    });

    it('should estimate blast radius for policy_create', async () => {
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'c-1' }, { id: 'c-2' },
      ]);
      (prismaMock.complianceFramework.count as jest.Mock<any>).mockResolvedValue(1);
      (prismaMock.user.count as jest.Mock<any>).mockResolvedValue(3);

      const result = await agenticAIService.estimateBlastRadius(orgId, {
        actionType: 'policy_create',
        targetId: 'policy-new',
        parameters: {},
      });

      expect(result).toBeDefined();
      expect(result.riskLevel).toBe('low');
      expect(result.canRollback).toBe(true);
      expect(result.rollbackComplexity).toBe('simple');
    });
  });

  describe('executeAction', () => {
    it('should execute an action successfully when no approval required', async () => {
      const action = {
        actionType: 'control_update',
        targetId: 'ctrl-1',
        parameters: { status: 'Implemented' },
      };

      const mockControl = {
        id: 'ctrl-1',
        name: 'Test',
        status: 'Pending',
        frameworkId: 'fw-1',
        mappedControls: null,
        framework: { id: 'fw-1', name: 'SOC2', organizationId: orgId },
      };

      // Mock for blast radius estimation
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([mockControl]);
      (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue({
        ...mockControl,
        status: 'Implemented',
      });
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'fw-1', controls: [mockControl] },
      ]);
      (prismaMock.user.count as jest.Mock<any>).mockResolvedValue(2);

      // Mock for action execution
      (prismaMock.agenticAction.create as jest.Mock<any>).mockResolvedValue({
        id: 'action-1',
        actionType: 'control_update',
        targetId: 'ctrl-1',
        parameters: action.parameters,
        status: 'approved',
        requiresApproval: false,
      });
      (prismaMock.agenticAction.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.agenticAction.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.agenticAction.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.agenticAction.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'action-1',
        parameters: {},
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await agenticAIService.executeAction(orgId, action, userId, true);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should handle action execution errors gracefully', async () => {
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );
      (prismaMock.agenticAction.create as jest.Mock<any>).mockResolvedValue({
        id: 'action-1',
        status: 'approved',
      });
      (prismaMock.agenticAction.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await expect(
        agenticAIService.executeAction(orgId, {
          actionType: 'control_update',
          targetId: 'ctrl-1',
          parameters: {},
        }, userId)
      ).rejects.toThrow();
    });
  });

  describe('rollbackAction', () => {
    it('should rollback an action using action ID', async () => {
      const mockDbAction = {
        id: 'action-1',
        organizationId: orgId,
        actionType: 'control_update',
        targetId: 'ctrl-1',
        parameters: {},
        blastRadius: {},
        requiresApproval: false,
        status: 'completed',
        rollbackData: {
          previousStatus: 'Pending',
          controlId: 'ctrl-1',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
        executedAt: new Date(),
        rolledBackAt: null,
      };

      (prismaMock.agenticAction.findFirst as jest.Mock<any>).mockResolvedValue(mockDbAction);
      (prismaMock.agenticAction.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.agenticAction.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue({
        id: 'ctrl-1',
        status: 'Pending',
      });

      const result = await agenticAIService.rollbackAction('action-1', orgId, userId);

      expect(result).toBeDefined();
    });

    it('should throw error if action not found', async () => {
      (prismaMock.agenticAction.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        agenticAIService.rollbackAction('nonexistent', orgId, userId)
      ).rejects.toThrow();
    });
  });

  describe('approveAction', () => {
    it('should approve a pending action', async () => {
      const mockActionLog = {
        id: 'log-1',
        action: 'agentic_action.created',
        organizationId: orgId,
        details: JSON.stringify({
          actionId: 'action-1',
          actionType: 'control_update',
          targetId: 'ctrl-1',
          parameters: {},
        }),
      };

      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(mockActionLog);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      // Mock for executeActionInternal
      (prismaMock.agenticAction.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.agenticAction.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.agenticAction.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'action-1',
        parameters: {},
      });
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'ctrl-1',
        status: 'Pending',
        framework: { organizationId: orgId },
      });
      (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue({
        id: 'ctrl-1',
        status: 'Implemented',
      });

      const result = await agenticAIService.approveAction('action-1', orgId, userId);

      expect(result).toBeDefined();
    });

    it('should throw error if action not found for approval', async () => {
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        agenticAIService.approveAction('nonexistent', orgId, userId)
      ).rejects.toThrow();
    });
  });

  describe('cleanupExpiredCheckpoints', () => {
    it('should cleanup expired checkpoints and return count', async () => {
      (prismaMock.agenticAction.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'action-1',
          rollbackData: { expiresAt: new Date(Date.now() - 86400000).toISOString() },
        },
      ]);
      (prismaMock.agenticAction.update as jest.Mock<any>).mockResolvedValue({});

      const result = await agenticAIService.cleanupExpiredCheckpoints(orgId);

      expect(typeof result).toBe('number');
    });
  });
});
