/**
 * ACOS Controller Unit Tests
 *
 * Tests for the Advanced Compliance Operating System controller methods
 * covering goal management and control loop operations.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// ---------------------------------------------------------------------------
// Mock: acosService (only service directly exercised by the methods under test)
// ---------------------------------------------------------------------------
const mockAcosService = {
  createComplianceGoal: jest.fn<any>(),
  getComplianceGoals: jest.fn<any>(),
  getComplianceGoalById: jest.fn<any>(),
  updateComplianceGoal: jest.fn<any>(),
  deleteComplianceGoal: jest.fn<any>(),
  restoreComplianceGoal: jest.fn<any>(),
  createControlLoop: jest.fn<any>(),
  executeControlLoop: jest.fn<any>(),
  getControlLoopById: jest.fn<any>(),
  getControlLoopHistory: jest.fn<any>(),
  pauseControlLoop: jest.fn<any>(),
  resumeControlLoop: jest.fn<any>(),
  updateControlLoop: jest.fn<any>(),
  deleteControlLoop: jest.fn<any>(),
};

jest.mock('../../../services/advanced/acosService', () => ({
  __esModule: true,
  default: mockAcosService,
}));

// ---------------------------------------------------------------------------
// Mock: all other services imported by acosController (prevent resolution errors)
// ---------------------------------------------------------------------------
jest.mock('../../../services/advanced/agenticAIService', () => ({
  __esModule: true,
  default: {
    estimateBlastRadius: jest.fn<any>(),
    executeAction: jest.fn<any>(),
    rollbackAction: jest.fn<any>(),
    rollbackMultipleActions: jest.fn<any>(),
  },
}));

jest.mock('../../../services/advanced/evidenceTruthLayerService', () => ({
  __esModule: true,
  default: { analyzeEvidence: jest.fn<any>() },
}));

jest.mock('../../../services/advanced/regulatoryIntelligenceFabricService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/temporalGraphNetworkService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/complianceDigitalTwinService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/redTeamService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/federatedSwarmService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/multimodalIntakeService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/physicalAIService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/vrCollaborativeReviewService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/swarmTaskAllocationService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/neuroSymbolicAIService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/jitAccessService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../services/advanced/homomorphicAIService', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// ---------------------------------------------------------------------------
// Import controller (after all mocks are declared)
// ---------------------------------------------------------------------------
import controller from '../../../controllers/acosController';
import { AppError } from '../../../middleware/errorHandler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildReq = (overrides: Record<string, any> = {}): any => ({
  user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
  params: {},
  query: {},
  body: {},
  ip: '127.0.0.1',
  headers: { 'user-agent': 'test' },
  ...overrides,
});

const buildRes = (): any => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ACOSController', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = buildReq();
    mockRes = buildRes();
  });

  // =========================================================================
  // createGoal
  // =========================================================================
  describe('createGoal', () => {
    it('should create a compliance goal and return it', async () => {
      const goalData = { title: 'Achieve SOC 2', framework: 'SOC2', targetDate: '2026-12-31' };
      const createdGoal = { id: 'goal-1', ...goalData, organizationId: 'org-1' };
      mockReq.body = goalData;

      mockAcosService.createComplianceGoal.mockResolvedValue(createdGoal as never);

      await controller.createGoal(mockReq as Request, mockRes as Response);

      expect(mockAcosService.createComplianceGoal).toHaveBeenCalledWith(
        'org-1',
        goalData,
        'user-1',
      );
      expect(mockRes.json).toHaveBeenCalledWith(createdGoal);
    });

    it('should pass the correct organizationId and userId from the authenticated user', async () => {
      mockReq.user = { id: 'user-99', organizationId: 'org-99', email: 'x@x.com', role: 'member' };
      mockReq.body = { title: 'G' };
      mockAcosService.createComplianceGoal.mockResolvedValue({ id: 'g' } as never);

      await controller.createGoal(mockReq as Request, mockRes as Response);

      expect(mockAcosService.createComplianceGoal).toHaveBeenCalledWith('org-99', { title: 'G' }, 'user-99');
    });

    it('should re-throw AppError when service throws AppError', async () => {
      mockReq.body = { title: 'G' };
      mockAcosService.createComplianceGoal.mockRejectedValue(new AppError('Validation failed', 400) as never);

      await expect(controller.createGoal(mockReq as Request, mockRes as Response)).rejects.toThrow(AppError);
      await expect(controller.createGoal(mockReq as Request, mockRes as Response)).rejects.toThrow('Validation failed');
    });

    it('should wrap generic errors in AppError with 500 status', async () => {
      mockReq.body = { title: 'G' };
      mockAcosService.createComplianceGoal.mockRejectedValue(new Error('DB connection lost') as never);

      await expect(controller.createGoal(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to create compliance goal: DB connection lost',
      );
    });
  });

  // =========================================================================
  // getGoals
  // =========================================================================
  describe('getGoals', () => {
    it('should return goals for the organisation', async () => {
      const goals = [
        { id: 'goal-1', title: 'SOC 2', status: 'active' },
        { id: 'goal-2', title: 'ISO 27001', status: 'active' },
      ];
      mockAcosService.getComplianceGoals.mockResolvedValue(goals as never);

      await controller.getGoals(mockReq as Request, mockRes as Response);

      expect(mockAcosService.getComplianceGoals).toHaveBeenCalledWith('org-1', {
        status: undefined,
        framework: undefined,
      });
      expect(mockRes.json).toHaveBeenCalledWith(goals);
    });

    it('should forward status and framework query parameters as filters', async () => {
      mockReq.query = { status: 'completed', framework: 'SOC2' };
      mockAcosService.getComplianceGoals.mockResolvedValue([] as never);

      await controller.getGoals(mockReq as Request, mockRes as Response);

      expect(mockAcosService.getComplianceGoals).toHaveBeenCalledWith('org-1', {
        status: 'completed',
        framework: 'SOC2',
      });
    });

    it('should return an empty array when no goals exist', async () => {
      mockAcosService.getComplianceGoals.mockResolvedValue([] as never);

      await controller.getGoals(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should throw AppError when the service fails', async () => {
      mockAcosService.getComplianceGoals.mockRejectedValue(new Error('timeout') as never);

      await expect(controller.getGoals(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to get compliance goals',
      );
    });
  });

  // =========================================================================
  // getGoal
  // =========================================================================
  describe('getGoal', () => {
    it('should return a single goal by id', async () => {
      const goal = { id: 'goal-1', title: 'SOC 2', organizationId: 'org-1' };
      mockReq.params = { goalId: 'goal-1' };
      mockAcosService.getComplianceGoalById.mockResolvedValue(goal as never);

      await controller.getGoal(mockReq as Request, mockRes as Response);

      expect(mockAcosService.getComplianceGoalById).toHaveBeenCalledWith('goal-1', 'org-1');
      expect(mockRes.json).toHaveBeenCalledWith(goal);
    });

    it('should throw when goal is not found', async () => {
      mockReq.params = { goalId: 'nonexistent' };
      mockAcosService.getComplianceGoalById.mockRejectedValue(new AppError('Not found', 404) as never);

      await expect(controller.getGoal(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to get compliance goal',
      );
    });
  });

  // =========================================================================
  // updateGoal
  // =========================================================================
  describe('updateGoal', () => {
    it('should update a goal and return the updated object', async () => {
      const updatedGoal = { id: 'goal-1', title: 'Updated Goal', status: 'in_progress' };
      mockReq.params = { goalId: 'goal-1' };
      mockReq.body = { title: 'Updated Goal' };
      mockAcosService.updateComplianceGoal.mockResolvedValue(updatedGoal as never);

      await controller.updateGoal(mockReq as Request, mockRes as Response);

      expect(mockAcosService.updateComplianceGoal).toHaveBeenCalledWith(
        'goal-1',
        'org-1',
        { title: 'Updated Goal' },
        'user-1',
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedGoal);
    });

    it('should throw when updating a non-existent goal', async () => {
      mockReq.params = { goalId: 'missing' };
      mockReq.body = { title: 'X' };
      mockAcosService.updateComplianceGoal.mockRejectedValue(new Error('Goal not found') as never);

      await expect(controller.updateGoal(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to update compliance goal: Goal not found',
      );
    });
  });

  // =========================================================================
  // deleteGoal
  // =========================================================================
  describe('deleteGoal', () => {
    it('should delete a goal and return success', async () => {
      mockReq.params = { goalId: 'goal-1' };
      mockAcosService.deleteComplianceGoal.mockResolvedValue(undefined as never);

      await controller.deleteGoal(mockReq as Request, mockRes as Response);

      expect(mockAcosService.deleteComplianceGoal).toHaveBeenCalledWith('goal-1', 'org-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should throw when deleting a non-existent goal', async () => {
      mockReq.params = { goalId: 'missing' };
      mockAcosService.deleteComplianceGoal.mockRejectedValue(new Error('Not found') as never);

      await expect(controller.deleteGoal(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to delete compliance goal: Not found',
      );
    });
  });

  // =========================================================================
  // restoreGoal
  // =========================================================================
  describe('restoreGoal', () => {
    it('should restore a soft-deleted goal', async () => {
      const restoredGoal = { id: 'goal-1', title: 'Restored', deletedAt: null };
      mockReq.params = { goalId: 'goal-1' };
      mockAcosService.restoreComplianceGoal.mockResolvedValue(restoredGoal as never);

      await controller.restoreGoal(mockReq as Request, mockRes as Response);

      expect(mockAcosService.restoreComplianceGoal).toHaveBeenCalledWith('goal-1', 'org-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(restoredGoal);
    });

    it('should throw when restoring a non-existent goal', async () => {
      mockReq.params = { goalId: 'nope' };
      mockAcosService.restoreComplianceGoal.mockRejectedValue(new Error('Not found') as never);

      await expect(controller.restoreGoal(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to restore compliance goal: Not found',
      );
    });
  });

  // =========================================================================
  // createControlLoop
  // =========================================================================
  describe('createControlLoop', () => {
    it('should create a control loop and return it', async () => {
      const loopInput = {
        controlId: 'ctrl-1',
        triggerType: 'schedule',
        triggerConfig: { cron: '0 * * * *' },
        timeoutSeconds: 300,
      };
      const createdLoop = { id: 'loop-1', ...loopInput, organizationId: 'org-1' };
      mockReq.body = loopInput;
      mockAcosService.createControlLoop.mockResolvedValue(createdLoop as never);

      await controller.createControlLoop(mockReq as Request, mockRes as Response);

      expect(mockAcosService.createControlLoop).toHaveBeenCalledWith(
        'org-1',
        'ctrl-1',
        'user-1',
        {
          triggerType: 'schedule',
          triggerConfig: { cron: '0 * * * *' },
          timeoutSeconds: 300,
          parentLoopId: undefined,
          configuration: undefined,
        },
      );
      expect(mockRes.json).toHaveBeenCalledWith(createdLoop);
    });

    it('should throw 400 when controlId is missing', async () => {
      mockReq.body = { triggerType: 'manual' };

      await expect(controller.createControlLoop(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Control ID is required',
      );
    });

    it('should wrap service errors in AppError', async () => {
      mockReq.body = { controlId: 'ctrl-1' };
      mockAcosService.createControlLoop.mockRejectedValue(new Error('Service down') as never);

      await expect(controller.createControlLoop(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to create control loop: Service down',
      );
    });
  });

  // =========================================================================
  // executeControlLoop
  // =========================================================================
  describe('executeControlLoop', () => {
    it('should execute a control loop and return the result', async () => {
      const executionResult = { loopId: 'loop-1', status: 'completed', findings: [] };
      mockReq.params = { loopId: 'loop-1' };
      mockAcosService.executeControlLoop.mockResolvedValue(executionResult as never);

      await controller.executeControlLoop(mockReq as Request, mockRes as Response);

      expect(mockAcosService.executeControlLoop).toHaveBeenCalledWith('loop-1', 'org-1');
      expect(mockRes.json).toHaveBeenCalledWith(executionResult);
    });

    it('should throw when execution fails', async () => {
      mockReq.params = { loopId: 'loop-bad' };
      mockAcosService.executeControlLoop.mockRejectedValue(new Error('Timeout') as never);

      await expect(controller.executeControlLoop(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to execute control loop: Timeout',
      );
    });
  });

  // =========================================================================
  // getControlLoop
  // =========================================================================
  describe('getControlLoop', () => {
    it('should return a control loop by id', async () => {
      const loop = { id: 'loop-1', controlId: 'ctrl-1', status: 'active' };
      mockReq.params = { loopId: 'loop-1' };
      mockAcosService.getControlLoopById.mockResolvedValue(loop as never);

      await controller.getControlLoop(mockReq as Request, mockRes as Response);

      expect(mockAcosService.getControlLoopById).toHaveBeenCalledWith('loop-1', 'org-1');
      expect(mockRes.json).toHaveBeenCalledWith(loop);
    });

    it('should throw when loop is not found', async () => {
      mockReq.params = { loopId: 'missing' };
      mockAcosService.getControlLoopById.mockRejectedValue(new Error('Not found') as never);

      await expect(controller.getControlLoop(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to get control loop: Not found',
      );
    });
  });

  // =========================================================================
  // getControlLoopHistory
  // =========================================================================
  describe('getControlLoopHistory', () => {
    it('should return execution history for a control loop', async () => {
      const history = [
        { id: 'exec-1', status: 'completed', createdAt: new Date() },
        { id: 'exec-2', status: 'failed', createdAt: new Date() },
      ];
      mockReq.params = { loopId: 'loop-1' };
      mockAcosService.getControlLoopHistory.mockResolvedValue(history as never);

      await controller.getControlLoopHistory(mockReq as Request, mockRes as Response);

      expect(mockAcosService.getControlLoopHistory).toHaveBeenCalledWith('loop-1', 'org-1');
      expect(mockRes.json).toHaveBeenCalledWith(history);
    });
  });

  // =========================================================================
  // pauseControlLoop
  // =========================================================================
  describe('pauseControlLoop', () => {
    it('should pause a control loop and return the updated loop', async () => {
      const pausedLoop = { id: 'loop-1', status: 'paused' };
      mockReq.params = { loopId: 'loop-1' };
      mockAcosService.pauseControlLoop.mockResolvedValue(pausedLoop as never);

      await controller.pauseControlLoop(mockReq as Request, mockRes as Response);

      expect(mockAcosService.pauseControlLoop).toHaveBeenCalledWith('loop-1', 'org-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(pausedLoop);
    });

    it('should throw when pausing a non-existent loop', async () => {
      mockReq.params = { loopId: 'bad' };
      mockAcosService.pauseControlLoop.mockRejectedValue(new Error('Loop not found') as never);

      await expect(controller.pauseControlLoop(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to pause control loop: Loop not found',
      );
    });
  });

  // =========================================================================
  // resumeControlLoop
  // =========================================================================
  describe('resumeControlLoop', () => {
    it('should resume a paused control loop and return the updated loop', async () => {
      const resumedLoop = { id: 'loop-1', status: 'active' };
      mockReq.params = { loopId: 'loop-1' };
      mockAcosService.resumeControlLoop.mockResolvedValue(resumedLoop as never);

      await controller.resumeControlLoop(mockReq as Request, mockRes as Response);

      expect(mockAcosService.resumeControlLoop).toHaveBeenCalledWith('loop-1', 'org-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(resumedLoop);
    });

    it('should throw when resuming a loop that is not paused', async () => {
      mockReq.params = { loopId: 'loop-1' };
      mockAcosService.resumeControlLoop.mockRejectedValue(new Error('Loop is not paused') as never);

      await expect(controller.resumeControlLoop(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Failed to resume control loop: Loop is not paused',
      );
    });
  });
});
