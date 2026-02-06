/**
 * aCOS (Autonomous Compliance Operating System) Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock dependencies before importing the service
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

// Must import after mocks are set up
import acosService from '../../../../services/advanced/acosService';

describe('ACOSService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComplianceGoal', () => {
    const validGoal = {
      goalType: 'maintain' as const,
      frameworks: ['SOC2'],
      riskTolerance: 'low' as const,
      horizon: 365,
      autoActionPolicy: 'conservative' as const,
      targetScore: 95,
      name: 'Maintain SOC 2 Compliance',
    };

    it('should create a compliance goal successfully', async () => {
      const mockCreated = {
        id: 'goal-1',
        organizationId: orgId,
        ...validGoal,
        status: 'active',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.complianceGoal as any) = {
        create: jest.fn<any>().mockResolvedValue(mockCreated),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await acosService.createComplianceGoal(orgId, validGoal, userId);

      expect(result).toBeDefined();
      expect(result.goalType).toBe('maintain');
      expect(result.frameworks).toEqual(['SOC2']);
    });

    it('should throw error if name is missing', async () => {
      const goalWithoutName = { ...validGoal, name: '' };

      await expect(
        acosService.createComplianceGoal(orgId, goalWithoutName, userId)
      ).rejects.toThrow('Goal name is required');
    });

    it('should throw error if name exceeds 500 characters', async () => {
      const goalLongName = { ...validGoal, name: 'A'.repeat(501) };

      await expect(
        acosService.createComplianceGoal(orgId, goalLongName, userId)
      ).rejects.toThrow('Goal name must be 500 characters or less');
    });

    it('should throw error if frameworks array is empty', async () => {
      const goalNoFrameworks = { ...validGoal, frameworks: [] };

      await expect(
        acosService.createComplianceGoal(orgId, goalNoFrameworks, userId)
      ).rejects.toThrow('At least one framework must be selected');
    });

    it('should throw error if deadline is in the past', async () => {
      const goalPastDeadline = {
        ...validGoal,
        deadline: '2020-01-01',
      };

      await expect(
        acosService.createComplianceGoal(orgId, goalPastDeadline, userId)
      ).rejects.toThrow('Deadline must be in the future');
    });

    it('should handle database schema mismatch error', async () => {
      (prismaMock.complianceGoal as any) = {
        create: jest.fn<any>().mockRejectedValue(
          new Error('Unknown argument `name`')
        ),
      };

      await expect(
        acosService.createComplianceGoal(orgId, validGoal, userId)
      ).rejects.toThrow('Database schema is out of date');
    });
  });

  describe('createControlLoop', () => {
    it('should create a control loop successfully', async () => {
      const mockControl = {
        id: 'control-1',
        name: 'Test Control',
        status: 'Implemented',
        frameworkId: 'fw-1',
        framework: { id: 'fw-1', organizationId: orgId },
      };

      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.controlLoop as any) = {
        create: jest.fn<any>().mockResolvedValue({
          id: 'loop-1',
          controlId: 'control-1',
          status: 'active',
          confidence: 0.5,
          cycleCount: 0,
          lastObserved: new Date(),
          lastActed: new Date(),
          lastVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findFirst: jest.fn<any>().mockResolvedValue(null),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await acosService.createControlLoop(orgId, 'control-1', userId);

      expect(result).toBeDefined();
      expect(result.controlId).toBe('control-1');
      expect(result.status).toBe('active');
    });

    it('should throw error if control is not found', async () => {
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        acosService.createControlLoop(orgId, 'nonexistent', userId)
      ).rejects.toThrow();
    });
  });

  describe('trackComplianceDebt', () => {
    it('should track compliance debt successfully', async () => {
      const debtData = {
        frameworkId: 'fw-1',
        controlId: 'ctrl-1',
        debtType: 'technical' as const,
        severity: 'high' as const,
        description: 'Missing encryption',
        estimatedRemediationHours: 40,
      };

      (prismaMock.complianceDebt as any) = {
        create: jest.fn<any>().mockResolvedValue({
          id: 'debt-1',
          organizationId: orgId,
          ...debtData,
          accumulatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await acosService.trackComplianceDebt(orgId, debtData, userId);

      expect(result).toBeDefined();
      expect(result.debtType).toBe('technical');
      expect(result.severity).toBe('high');
    });

    it('should handle database errors during debt tracking', async () => {
      (prismaMock.complianceDebt as any) = {
        create: jest.fn<any>().mockRejectedValue(new Error('DB connection failed')),
      };

      await expect(
        acosService.trackComplianceDebt(orgId, {
          frameworkId: 'fw-1',
          debtType: 'technical' as const,
          severity: 'low' as const,
          description: 'Test',
          estimatedRemediationHours: 1,
        }, userId)
      ).rejects.toThrow();
    });
  });

  describe('forecastChangeImpact', () => {
    it('should forecast control change impact', async () => {
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
        { id: 'fw-1', name: 'SOC2', organizationId: orgId, controls: [mockControl] },
      ]);
      (prismaMock.changeImpact as any) = {
        create: jest.fn<any>().mockResolvedValue({
          id: 'impact-1',
          organizationId: orgId,
          changeType: 'control',
          changeId: 'ctrl-1',
          impactScore: 30,
        }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await acosService.forecastChangeImpact(orgId, {
        changeType: 'control',
        changeId: 'ctrl-1',
        parameters: { status: 'Pending' },
      }, userId);

      expect(result).toBeDefined();
      expect(result.changeType).toBe('control');
    });

    it('should handle errors when entity is not found', async () => {
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        acosService.forecastChangeImpact(orgId, {
          changeType: 'control',
          changeId: 'nonexistent',
          parameters: {},
        }, userId)
      ).rejects.toThrow();
    });
  });

  describe('getComplianceGoals', () => {
    it('should return compliance goals for an organization', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          organizationId: orgId,
          goalType: 'maintain',
          frameworks: ['SOC2'],
          riskTolerance: 'low',
          horizon: 365,
          autoActionPolicy: 'conservative',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prismaMock.complianceGoal as any) = {
        findMany: jest.fn<any>().mockResolvedValue(mockGoals),
      };

      const result = await acosService.getComplianceGoals(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].goalType).toBe('maintain');
    });

    it('should filter goals by status', async () => {
      (prismaMock.complianceGoal as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const result = await acosService.getComplianceGoals(orgId, { status: 'archived' });
      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveControlLoops', () => {
    it('should return active control loops', async () => {
      const mockLoops = [
        {
          id: 'loop-1',
          controlId: 'ctrl-1',
          status: 'active',
          confidence: 0.8,
          cycleCount: 5,
          lastObserved: new Date(),
          lastActed: new Date(),
          lastVerified: new Date(),
          control: { framework: { organizationId: orgId } },
        },
      ];

      (prismaMock.controlLoop as any) = {
        findMany: jest.fn<any>().mockResolvedValue(mockLoops),
      };

      const result = await acosService.getActiveControlLoops(orgId);
      expect(result).toBeDefined();
    });
  });

  describe('resolveComplianceDebt', () => {
    it('should resolve a compliance debt item', async () => {
      const mockDebt = {
        id: 'debt-1',
        organizationId: orgId,
        frameworkId: 'fw-1',
        debtType: 'technical',
        severity: 'high',
        description: 'Missing encryption',
        estimatedRemediationHours: 40,
        resolvedAt: null,
        accumulatedAt: new Date(),
      };

      (prismaMock.complianceDebt as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(mockDebt),
        update: jest.fn<any>().mockResolvedValue({
          ...mockDebt,
          resolvedAt: new Date(),
        }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await acosService.resolveComplianceDebt('debt-1', orgId, userId);
      expect(result).toBeDefined();
    });

    it('should throw error if debt not found', async () => {
      (prismaMock.complianceDebt as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(null),
      };

      await expect(
        acosService.resolveComplianceDebt('nonexistent', orgId, userId)
      ).rejects.toThrow();
    });

    it('should throw error if debt already resolved', async () => {
      (prismaMock.complianceDebt as any) = {
        findFirst: jest.fn<any>().mockResolvedValue({
          id: 'debt-1',
          resolvedAt: new Date(),
        }),
      };

      await expect(
        acosService.resolveComplianceDebt('debt-1', orgId, userId)
      ).rejects.toThrow();
    });
  });
});
