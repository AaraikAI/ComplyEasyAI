/**
 * AI RMF Controller Contract Tests
 *
 * Validates the contract for NIST AI Risk Management Framework endpoints
 * including AI system management, core functions, categories, trustworthiness,
 * lifecycle stages, actors, assessments, profiles, and risk activities.
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

const mockAiRmfService = {
  createAISystem: jest.fn<any>().mockResolvedValue({ id: 'ai-1', name: 'Test AI' } as never),
  getAISystems: jest.fn<any>().mockResolvedValue([{ id: 'ai-1' }] as never),
  getAISystemById: jest.fn<any>().mockResolvedValue({ id: 'ai-1' } as never),
  updateAISystem: jest.fn<any>().mockResolvedValue({ id: 'ai-1' } as never),
  deleteAISystem: jest.fn<any>().mockResolvedValue(undefined as never),
  updateCoreFunction: jest.fn<any>().mockResolvedValue({ id: 'cf-1' } as never),
  updateCategory: jest.fn<any>().mockResolvedValue({ id: 'cat-1' } as never),
  updateSubcategory: jest.fn<any>().mockResolvedValue({ id: 'sub-1' } as never),
  updateTrustworthinessCharacteristic: jest.fn<any>().mockResolvedValue({ id: 'tw-1' } as never),
  updateLifecycleStage: jest.fn<any>().mockResolvedValue({ id: 'lc-1' } as never),
  addActor: jest.fn<any>().mockResolvedValue({ id: 'actor-1' } as never),
  removeActor: jest.fn<any>().mockResolvedValue(undefined as never),
  createAssessment: jest.fn<any>().mockResolvedValue({ id: 'assess-1' } as never),
  getAssessments: jest.fn<any>().mockResolvedValue([{ id: 'assess-1' }] as never),
  deleteAssessment: jest.fn<any>().mockResolvedValue(undefined as never),
  createProfile: jest.fn<any>().mockResolvedValue({ id: 'profile-1' } as never),
  createRiskActivity: jest.fn<any>().mockResolvedValue({ id: 'ra-1' } as never),
  updateRiskActivity: jest.fn<any>().mockResolvedValue({ id: 'ra-1' } as never),
  calculateTrustworthinessScore: jest.fn<any>().mockResolvedValue(85 as never),
  getDashboardData: jest.fn<any>().mockResolvedValue({ systems: 5, avgScore: 80 } as never),
};

jest.mock('../../../services/aiRmfService', () => ({
  __esModule: true,
  default: mockAiRmfService,
}));

import aiRmfController from '../../../controllers/aiRmfController';
import { AppError } from '../../../middleware/errorHandler';

describe('AIRMFController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations cleared by resetMocks: true in jest config
    mockAiRmfService.createAISystem.mockResolvedValue({ id: 'ai-1', name: 'Test AI' } as never);
    mockAiRmfService.getAISystems.mockResolvedValue([{ id: 'ai-1' }] as never);
    mockAiRmfService.getAISystemById.mockResolvedValue({ id: 'ai-1' } as never);
    mockAiRmfService.updateAISystem.mockResolvedValue({ id: 'ai-1' } as never);
    mockAiRmfService.deleteAISystem.mockResolvedValue(undefined as never);
    mockAiRmfService.updateCoreFunction.mockResolvedValue({ id: 'cf-1' } as never);
    mockAiRmfService.updateCategory.mockResolvedValue({ id: 'cat-1' } as never);
    mockAiRmfService.updateSubcategory.mockResolvedValue({ id: 'sub-1' } as never);
    mockAiRmfService.updateTrustworthinessCharacteristic.mockResolvedValue({ id: 'tw-1' } as never);
    mockAiRmfService.updateLifecycleStage.mockResolvedValue({ id: 'lc-1' } as never);
    mockAiRmfService.addActor.mockResolvedValue({ id: 'actor-1' } as never);
    mockAiRmfService.removeActor.mockResolvedValue(undefined as never);
    mockAiRmfService.createAssessment.mockResolvedValue({ id: 'assess-1' } as never);
    mockAiRmfService.getAssessments.mockResolvedValue([{ id: 'assess-1' }] as never);
    mockAiRmfService.deleteAssessment.mockResolvedValue(undefined as never);
    mockAiRmfService.createProfile.mockResolvedValue({ id: 'profile-1' } as never);
    mockAiRmfService.createRiskActivity.mockResolvedValue({ id: 'ra-1' } as never);
    mockAiRmfService.updateRiskActivity.mockResolvedValue({ id: 'ra-1' } as never);
    mockAiRmfService.calculateTrustworthinessScore.mockResolvedValue(85 as never);
    mockAiRmfService.getDashboardData.mockResolvedValue({ systems: 5, avgScore: 80 } as never);

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
  // AI System CRUD
  // ===========================================================================
  describe('createAISystem()', () => {
    it('should create AI system with status 201', async () => {
      mockReq.body = { name: 'Test AI', systemType: 'classification' };

      await aiRmfController.createAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'ai-1', name: 'Test AI' })
      );
      expect(mockAiRmfService.createAISystem).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ name: 'Test AI' }),
        'user-123',
        '127.0.0.1',
        'test-agent'
      );
    });

    it('should handle AppError from service', async () => {
      mockAiRmfService.createAISystem.mockRejectedValueOnce(new AppError('Duplicate name', 400) as never);

      await aiRmfController.createAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Duplicate name' })
      );
    });

    it('should return 500 for unknown errors', async () => {
      mockAiRmfService.createAISystem.mockRejectedValueOnce(new Error('DB error') as never);

      await aiRmfController.createAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to create AI system' })
      );
    });
  });

  describe('getAISystems()', () => {
    it('should return systems for organization', async () => {
      await aiRmfController.getAISystems(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Array));
      expect(mockAiRmfService.getAISystems).toHaveBeenCalledWith('org-123', {});
    });

    it('should pass query filters to service', async () => {
      mockReq.query = { status: 'active', riskLevel: 'high' };

      await aiRmfController.getAISystems(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.getAISystems).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ status: 'active', riskLevel: 'high' })
      );
    });
  });

  describe('getAISystemById()', () => {
    it('should return system by id with org filter', async () => {
      mockReq.params = { id: 'ai-1' };

      await aiRmfController.getAISystemById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.getAISystemById).toHaveBeenCalledWith('org-123', 'ai-1');
    });
  });

  describe('updateAISystem()', () => {
    it('should update and return system', async () => {
      mockReq.params = { id: 'ai-1' };
      mockReq.body = { name: 'Updated AI' };

      await aiRmfController.updateAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.updateAISystem).toHaveBeenCalledWith(
        'org-123', 'ai-1', mockReq.body, 'user-123', '127.0.0.1', 'test-agent'
      );
    });
  });

  describe('deleteAISystem()', () => {
    it('should delete and return success', async () => {
      mockReq.params = { id: 'ai-1' };

      await aiRmfController.deleteAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ===========================================================================
  // Core Functions, Categories, Subcategories
  // ===========================================================================
  describe('updateCoreFunction()', () => {
    it('should update core function', async () => {
      mockReq.params = { aiSystemId: 'ai-1', functionName: 'GOVERN' };
      mockReq.body = { implementationStatus: 'complete' };

      await aiRmfController.updateCoreFunction(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.updateCoreFunction).toHaveBeenCalledWith(
        'org-123', 'ai-1', 'GOVERN', mockReq.body, 'user-123', '127.0.0.1', 'test-agent'
      );
    });
  });

  describe('updateCategory()', () => {
    it('should update category', async () => {
      mockReq.params = { categoryId: 'cat-1' };

      await aiRmfController.updateCategory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.updateCategory).toHaveBeenCalledWith(
        'org-123', 'cat-1', mockReq.body, 'user-123', '127.0.0.1', 'test-agent'
      );
    });
  });

  describe('updateSubcategory()', () => {
    it('should update subcategory', async () => {
      mockReq.params = { subcategoryId: 'sub-1' };

      await aiRmfController.updateSubcategory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.updateSubcategory).toHaveBeenCalledWith(
        'org-123', 'sub-1', mockReq.body, 'user-123', '127.0.0.1', 'test-agent'
      );
    });
  });

  // ===========================================================================
  // Trustworthiness, Lifecycle, Actors
  // ===========================================================================
  describe('updateTrustworthinessCharacteristic()', () => {
    it('should update trustworthiness', async () => {
      mockReq.params = { aiSystemId: 'ai-1', characteristic: 'fairness' };

      await aiRmfController.updateTrustworthinessCharacteristic(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.updateTrustworthinessCharacteristic).toHaveBeenCalledWith(
        'org-123', 'ai-1', 'fairness', mockReq.body, 'user-123', '127.0.0.1', 'test-agent'
      );
    });
  });

  describe('updateLifecycleStage()', () => {
    it('should update lifecycle stage', async () => {
      mockReq.params = { aiSystemId: 'ai-1', stage: 'deployment' };

      await aiRmfController.updateLifecycleStage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAiRmfService.updateLifecycleStage).toHaveBeenCalledWith(
        'org-123', 'ai-1', 'deployment', mockReq.body, 'user-123', '127.0.0.1', 'test-agent'
      );
    });
  });

  describe('addActor()', () => {
    it('should add actor with status 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockReq.body = { name: 'Data Scientist', role: 'developer' };

      await aiRmfController.addActor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('removeActor()', () => {
    it('should remove actor and return success', async () => {
      mockReq.params = { actorId: 'actor-1' };

      await aiRmfController.removeActor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ===========================================================================
  // Assessments, Profiles, Risk Activities, Dashboard
  // ===========================================================================
  describe('createAssessment()', () => {
    it('should create assessment with status 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };

      await aiRmfController.createAssessment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getAssessments()', () => {
    it('should return assessments array', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };

      await aiRmfController.getAssessments(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('deleteAssessment()', () => {
    it('should delete and return success', async () => {
      mockReq.params = { assessmentId: 'assess-1' };

      await aiRmfController.deleteAssessment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('createProfile()', () => {
    it('should create profile with status 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };

      await aiRmfController.createProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('createRiskActivity()', () => {
    it('should create risk activity with status 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };

      await aiRmfController.createRiskActivity(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateRiskActivity()', () => {
    it('should update risk activity', async () => {
      mockReq.params = { riskActivityId: 'ra-1' };

      await aiRmfController.updateRiskActivity(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('calculateTrustworthinessScore()', () => {
    it('should return score object', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };

      await aiRmfController.calculateTrustworthinessScore(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ score: 85 });
    });
  });

  describe('getDashboardData()', () => {
    it('should return dashboard data', async () => {
      await aiRmfController.getDashboardData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ systems: 5, avgScore: 80 })
      );
    });
  });
});
