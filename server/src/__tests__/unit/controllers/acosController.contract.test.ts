/**
 * aCOS Controller Contract Tests
 *
 * Validates the contract for Autonomous Compliance Operating System endpoints
 * including goals, control loops, agentic AI, evidence truth layer, and more.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

const mockAcosService = {
  createComplianceGoal: jest.fn<any>().mockResolvedValue({ id: 'goal-1', title: 'Test Goal' } as never),
  getComplianceGoals: jest.fn<any>().mockResolvedValue([{ id: 'goal-1' }] as never),
  getComplianceGoalById: jest.fn<any>().mockResolvedValue({ id: 'goal-1' } as never),
  updateComplianceGoal: jest.fn<any>().mockResolvedValue({ id: 'goal-1' } as never),
  deleteComplianceGoal: jest.fn<any>().mockResolvedValue(undefined as never),
  restoreComplianceGoal: jest.fn<any>().mockResolvedValue({ id: 'goal-1' } as never),
  createControlLoop: jest.fn<any>().mockResolvedValue({ id: 'loop-1' } as never),
  executeControlLoop: jest.fn<any>().mockResolvedValue({ success: true } as never),
  getControlLoopById: jest.fn<any>().mockResolvedValue({ id: 'loop-1' } as never),
  getControlLoopHistory: jest.fn<any>().mockResolvedValue([{ id: 'exec-1' }] as never),
  pauseControlLoop: jest.fn<any>().mockResolvedValue({ id: 'loop-1', status: 'paused' } as never),
  resumeControlLoop: jest.fn<any>().mockResolvedValue({ id: 'loop-1', status: 'active' } as never),
  updateControlLoop: jest.fn<any>().mockResolvedValue({ id: 'loop-1' } as never),
  deleteControlLoop: jest.fn<any>().mockResolvedValue(undefined as never),
};

const mockAgenticAIService = {
  estimateBlastRadius: jest.fn<any>().mockResolvedValue({ affectedControls: 5 } as never),
  executeAction: jest.fn<any>().mockResolvedValue({ id: 'action-1' } as never),
  rollbackAction: jest.fn<any>().mockResolvedValue({ success: true } as never),
  rollbackMultipleActions: jest.fn<any>().mockResolvedValue({ rolled: 2 } as never),
};

const mockEvidenceTruthLayerService = {
  analyzeEvidence: jest.fn<any>().mockResolvedValue({ id: 'analysis-1', score: 95 } as never),
  getEvidenceAnalysis: jest.fn<any>().mockResolvedValue({ id: 'analysis-1' } as never),
  reanalyzeEvidence: jest.fn<any>().mockResolvedValue({ id: 'analysis-2' } as never),
  getAnalysisHistory: jest.fn<any>().mockResolvedValue([{ id: 'analysis-1' }] as never),
  bulkAnalyzeEvidence: jest.fn<any>().mockResolvedValue([{ success: true }] as never),
};

jest.mock('../../../services/advanced/acosService', () => ({
  __esModule: true,
  default: mockAcosService,
}));

jest.mock('../../../services/advanced/agenticAIService', () => ({
  __esModule: true,
  default: mockAgenticAIService,
}));

jest.mock('../../../services/advanced/evidenceTruthLayerService', () => ({
  __esModule: true,
  default: mockEvidenceTruthLayerService,
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

import acosController from '../../../controllers/acosController';
import { AppError } from '../../../middleware/errorHandler';

describe('ACOSController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // Goals
  // ===========================================================================
  describe('createGoal()', () => {
    it('should create goal and return it', async () => {
      mockReq.body = { title: 'SOC 2 Compliance', framework: 'SOC2' };
      mockAcosService.createComplianceGoal.mockResolvedValueOnce({ id: 'goal-1', title: 'Test Goal' } as never);

      await acosController.createGoal(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'goal-1', title: 'Test Goal' })
      );
      expect(mockAcosService.createComplianceGoal).toHaveBeenCalledWith(
        'org-123', mockReq.body, 'user-123'
      );
    });

    it('should throw AppError on service failure', async () => {
      mockAcosService.createComplianceGoal.mockRejectedValueOnce(
        new AppError('Invalid goal', 400) as never
      );

      await expect(
        acosController.createGoal(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getGoals()', () => {
    it('should return goals with optional filters', async () => {
      mockReq.query = { status: 'active', framework: 'SOC2' };

      await acosController.getGoals(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.getComplianceGoals).toHaveBeenCalledWith(
        'org-123', { status: 'active', framework: 'SOC2' }
      );
    });
  });

  describe('getGoal()', () => {
    it('should return single goal', async () => {
      mockReq.params = { goalId: 'goal-1' };

      await acosController.getGoal(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.getComplianceGoalById).toHaveBeenCalledWith('goal-1', 'org-123');
    });
  });

  describe('updateGoal()', () => {
    it('should update and return goal', async () => {
      mockReq.params = { goalId: 'goal-1' };
      mockReq.body = { title: 'Updated Goal' };

      await acosController.updateGoal(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.updateComplianceGoal).toHaveBeenCalledWith(
        'goal-1', 'org-123', mockReq.body, 'user-123'
      );
    });
  });

  describe('deleteGoal()', () => {
    it('should delete and return success', async () => {
      mockReq.params = { goalId: 'goal-1' };

      await acosController.deleteGoal(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('restoreGoal()', () => {
    it('should restore and return goal', async () => {
      mockReq.params = { goalId: 'goal-1' };

      await acosController.restoreGoal(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.restoreComplianceGoal).toHaveBeenCalledWith('goal-1', 'org-123', 'user-123');
    });
  });

  // ===========================================================================
  // Control Loops
  // ===========================================================================
  describe('createControlLoop()', () => {
    it('should create control loop', async () => {
      mockReq.body = { controlId: 'ctrl-1', triggerType: 'schedule' };

      await acosController.createControlLoop(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.createControlLoop).toHaveBeenCalledWith(
        'org-123', 'ctrl-1', 'user-123', expect.any(Object)
      );
    });

    it('should throw 400 when controlId is missing', async () => {
      mockReq.body = {};

      await expect(
        acosController.createControlLoop(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('executeControlLoop()', () => {
    it('should execute and return result', async () => {
      mockReq.params = { loopId: 'loop-1' };

      await acosController.executeControlLoop(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.executeControlLoop).toHaveBeenCalledWith('loop-1', 'org-123');
    });
  });

  describe('pauseControlLoop()', () => {
    it('should pause loop', async () => {
      mockReq.params = { loopId: 'loop-1' };

      await acosController.pauseControlLoop(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAcosService.pauseControlLoop).toHaveBeenCalledWith('loop-1', 'org-123', 'user-123');
    });
  });

  describe('deleteControlLoop()', () => {
    it('should delete and return success', async () => {
      mockReq.params = { loopId: 'loop-1' };

      await acosController.deleteControlLoop(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ===========================================================================
  // Agentic AI
  // ===========================================================================
  describe('estimateBlastRadius()', () => {
    it('should return blast radius estimate', async () => {
      mockAgenticAIService.estimateBlastRadius.mockResolvedValueOnce({ affectedControls: 5 } as never);

      await acosController.estimateBlastRadius(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ affectedControls: 5 })
      );
    });
  });

  describe('executeAction()', () => {
    it('should execute action', async () => {
      mockReq.body = { actionType: 'remediate', autoApprove: false };

      await acosController.executeAction(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAgenticAIService.executeAction).toHaveBeenCalledWith(
        'org-123', mockReq.body, 'user-123', false
      );
    });
  });

  describe('rollbackAction()', () => {
    it('should rollback action', async () => {
      mockReq.params = { actionId: 'action-1' };

      await acosController.rollbackAction(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAgenticAIService.rollbackAction).toHaveBeenCalledWith('action-1', 'org-123', 'user-123');
    });
  });

  describe('rollbackMultipleActions()', () => {
    it('should throw 400 for non-array actionIds', async () => {
      mockReq.body = { actionIds: 'not-an-array' };

      await expect(
        acosController.rollbackMultipleActions(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should rollback multiple actions', async () => {
      mockReq.body = { actionIds: ['a-1', 'a-2'] };

      await acosController.rollbackMultipleActions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAgenticAIService.rollbackMultipleActions).toHaveBeenCalledWith(
        ['a-1', 'a-2'], 'org-123', 'user-123'
      );
    });
  });

  // ===========================================================================
  // Evidence Truth Layer
  // ===========================================================================
  describe('analyzeEvidence()', () => {
    it('should analyze evidence', async () => {
      mockReq.params = { evidenceId: 'ev-1' };
      (mockReq as any).file = undefined;

      await acosController.analyzeEvidence(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEvidenceTruthLayerService.analyzeEvidence).toHaveBeenCalledWith(
        'ev-1', 'org-123', undefined, expect.any(Object)
      );
    });
  });

  describe('getEvidenceAnalysis()', () => {
    it('should return analysis', async () => {
      mockReq.params = { evidenceId: 'ev-1' };
      mockEvidenceTruthLayerService.getEvidenceAnalysis.mockResolvedValueOnce({ id: 'analysis-1' } as never);

      await acosController.getEvidenceAnalysis(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'analysis-1' })
      );
    });

    it('should throw 404 when not found', async () => {
      mockReq.params = { evidenceId: 'ev-missing' };
      mockEvidenceTruthLayerService.getEvidenceAnalysis.mockResolvedValueOnce(null as never);

      await expect(
        acosController.getEvidenceAnalysis(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('bulkAnalyzeEvidence()', () => {
    it('should throw 400 for non-array input', async () => {
      mockReq.body = { evidenceFiles: 'not-array' };

      await expect(
        acosController.bulkAnalyzeEvidence(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should bulk analyze', async () => {
      mockReq.body = { evidenceFiles: [{ evidenceId: 'ev-1' }] };

      await acosController.bulkAnalyzeEvidence(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEvidenceTruthLayerService.bulkAnalyzeEvidence).toHaveBeenCalledWith(
        'org-123', [{ evidenceId: 'ev-1' }]
      );
    });
  });
});
