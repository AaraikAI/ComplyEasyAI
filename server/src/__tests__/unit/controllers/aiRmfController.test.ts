/**
 * AI RMF Controller Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock service functions
const mockCreateAISystem = jest.fn<any>();
const mockGetAISystems = jest.fn<any>();
const mockGetAISystemById = jest.fn<any>();
const mockUpdateAISystem = jest.fn<any>();
const mockDeleteAISystem = jest.fn<any>();
const mockUpdateCoreFunction = jest.fn<any>();
const mockUpdateCategory = jest.fn<any>();
const mockUpdateSubcategory = jest.fn<any>();
const mockUpdateTrustworthinessCharacteristic = jest.fn<any>();
const mockUpdateLifecycleStage = jest.fn<any>();
const mockAddActor = jest.fn<any>();
const mockRemoveActor = jest.fn<any>();
const mockCreateAssessment = jest.fn<any>();
const mockGetAssessments = jest.fn<any>();
const mockDeleteAssessment = jest.fn<any>();
const mockCreateProfile = jest.fn<any>();
const mockCreateRiskActivity = jest.fn<any>();
const mockUpdateRiskActivity = jest.fn<any>();
const mockCalculateTrustworthinessScore = jest.fn<any>();
const mockGetDashboardData = jest.fn<any>();

jest.mock('../../../services/aiRmfService', () => ({
  __esModule: true,
  default: {
    createAISystem: mockCreateAISystem,
    getAISystems: mockGetAISystems,
    getAISystemById: mockGetAISystemById,
    updateAISystem: mockUpdateAISystem,
    deleteAISystem: mockDeleteAISystem,
    updateCoreFunction: mockUpdateCoreFunction,
    updateCategory: mockUpdateCategory,
    updateSubcategory: mockUpdateSubcategory,
    updateTrustworthinessCharacteristic: mockUpdateTrustworthinessCharacteristic,
    updateLifecycleStage: mockUpdateLifecycleStage,
    addActor: mockAddActor,
    removeActor: mockRemoveActor,
    createAssessment: mockCreateAssessment,
    getAssessments: mockGetAssessments,
    deleteAssessment: mockDeleteAssessment,
    createProfile: mockCreateProfile,
    createRiskActivity: mockCreateRiskActivity,
    updateRiskActivity: mockUpdateRiskActivity,
    calculateTrustworthinessScore: mockCalculateTrustworthinessScore,
    getDashboardData: mockGetDashboardData,
  },
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

import aiRmfController from '../../../controllers/aiRmfController';
import { AppError } from '../../../middleware/errorHandler';

describe('AIRMFController', () => {
  let mockReq: any;
  let mockRes: any;
  const mockNext = jest.fn();

  beforeEach(() => {
    mockReq = {
      user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  // ============================================================================
  // AI System Management
  // ============================================================================

  describe('createAISystem', () => {
    it('should create an AI system and return 201', async () => {
      const body = { name: 'Test AI', description: 'A test AI system' };
      mockReq.body = body;
      const created = { id: 'ai-1', ...body };
      mockCreateAISystem.mockResolvedValue(created);

      await aiRmfController.createAISystem(mockReq, mockRes, mockNext);

      expect(mockCreateAISystem).toHaveBeenCalledWith(
        'org-1', body, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(created);
    });

    it('should return AppError status when service throws AppError', async () => {
      mockCreateAISystem.mockRejectedValue(new AppError('Validation failed', 400));

      await aiRmfController.createAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Validation failed' });
    });

    it('should return 500 on generic error', async () => {
      mockCreateAISystem.mockRejectedValue(new Error('DB down'));

      await aiRmfController.createAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to create AI system' });
    });
  });

  describe('getAISystems', () => {
    it('should return AI systems with no filters', async () => {
      const systems = [{ id: 'ai-1' }, { id: 'ai-2' }];
      mockGetAISystems.mockResolvedValue(systems);

      await aiRmfController.getAISystems(mockReq, mockRes, mockNext);

      expect(mockGetAISystems).toHaveBeenCalledWith('org-1', {});
      expect(mockRes.json).toHaveBeenCalledWith(systems);
    });

    it('should pass query filters to service', async () => {
      mockReq.query = { status: 'active', lifecycleStage: 'production', riskLevel: 'high' };
      const systems = [{ id: 'ai-1' }];
      mockGetAISystems.mockResolvedValue(systems);

      await aiRmfController.getAISystems(mockReq, mockRes, mockNext);

      expect(mockGetAISystems).toHaveBeenCalledWith('org-1', {
        status: 'active',
        lifecycleStage: 'production',
        riskLevel: 'high',
      });
      expect(mockRes.json).toHaveBeenCalledWith(systems);
    });

    it('should pass partial filters when only some are provided', async () => {
      mockReq.query = { status: 'active' };
      mockGetAISystems.mockResolvedValue([]);

      await aiRmfController.getAISystems(mockReq, mockRes, mockNext);

      expect(mockGetAISystems).toHaveBeenCalledWith('org-1', { status: 'active' });
    });

    it('should return AppError status when service throws AppError', async () => {
      mockGetAISystems.mockRejectedValue(new AppError('Forbidden', 403));

      await aiRmfController.getAISystems(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 500 on generic error', async () => {
      mockGetAISystems.mockRejectedValue(new Error('timeout'));

      await aiRmfController.getAISystems(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch AI systems' });
    });
  });

  describe('getAISystemById', () => {
    it('should return an AI system by id', async () => {
      mockReq.params = { id: 'ai-1' };
      const system = { id: 'ai-1', name: 'Test AI' };
      mockGetAISystemById.mockResolvedValue(system);

      await aiRmfController.getAISystemById(mockReq, mockRes, mockNext);

      expect(mockGetAISystemById).toHaveBeenCalledWith('org-1', 'ai-1');
      expect(mockRes.json).toHaveBeenCalledWith(system);
    });

    it('should return AppError status when system not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockGetAISystemById.mockRejectedValue(new AppError('AI system not found', 404));

      await aiRmfController.getAISystemById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'AI system not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { id: 'ai-1' };
      mockGetAISystemById.mockRejectedValue(new Error('fail'));

      await aiRmfController.getAISystemById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch AI system' });
    });
  });

  describe('updateAISystem', () => {
    it('should update an AI system', async () => {
      mockReq.params = { id: 'ai-1' };
      mockReq.body = { name: 'Updated AI' };
      const updated = { id: 'ai-1', name: 'Updated AI' };
      mockUpdateAISystem.mockResolvedValue(updated);

      await aiRmfController.updateAISystem(mockReq, mockRes, mockNext);

      expect(mockUpdateAISystem).toHaveBeenCalledWith(
        'org-1', 'ai-1', { name: 'Updated AI' }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(updated);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { id: 'ai-1' };
      mockUpdateAISystem.mockRejectedValue(new AppError('Not found', 404));

      await aiRmfController.updateAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { id: 'ai-1' };
      mockUpdateAISystem.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update AI system' });
    });
  });

  describe('deleteAISystem', () => {
    it('should delete an AI system and return success', async () => {
      mockReq.params = { id: 'ai-1' };
      mockDeleteAISystem.mockResolvedValue(undefined);

      await aiRmfController.deleteAISystem(mockReq, mockRes, mockNext);

      expect(mockDeleteAISystem).toHaveBeenCalledWith(
        'org-1', 'ai-1', 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { id: 'ai-1' };
      mockDeleteAISystem.mockRejectedValue(new AppError('Cannot delete', 409));

      await aiRmfController.deleteAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Cannot delete' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { id: 'ai-1' };
      mockDeleteAISystem.mockRejectedValue(new Error('fail'));

      await aiRmfController.deleteAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to delete AI system' });
    });
  });

  // ============================================================================
  // Core Functions
  // ============================================================================

  describe('updateCoreFunction', () => {
    it('should update a core function', async () => {
      mockReq.params = { aiSystemId: 'ai-1', functionName: 'govern' };
      mockReq.body = { status: 'complete' };
      const result = { id: 'cf-1', functionName: 'govern', status: 'complete' };
      mockUpdateCoreFunction.mockResolvedValue(result);

      await aiRmfController.updateCoreFunction(mockReq, mockRes, mockNext);

      expect(mockUpdateCoreFunction).toHaveBeenCalledWith(
        'org-1', 'ai-1', 'govern', { status: 'complete' }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1', functionName: 'govern' };
      mockUpdateCoreFunction.mockRejectedValue(new AppError('Invalid function', 400));

      await aiRmfController.updateCoreFunction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid function' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1', functionName: 'govern' };
      mockUpdateCoreFunction.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateCoreFunction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update core function' });
    });
  });

  // ============================================================================
  // Categories and Subcategories
  // ============================================================================

  describe('updateCategory', () => {
    it('should update a category', async () => {
      mockReq.params = { categoryId: 'cat-1' };
      mockReq.body = { name: 'Updated Category' };
      const result = { id: 'cat-1', name: 'Updated Category' };
      mockUpdateCategory.mockResolvedValue(result);

      await aiRmfController.updateCategory(mockReq, mockRes, mockNext);

      expect(mockUpdateCategory).toHaveBeenCalledWith(
        'org-1', 'cat-1', { name: 'Updated Category' }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { categoryId: 'cat-1' };
      mockUpdateCategory.mockRejectedValue(new AppError('Category not found', 404));

      await aiRmfController.updateCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { categoryId: 'cat-1' };
      mockUpdateCategory.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateCategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update category' });
    });
  });

  describe('updateSubcategory', () => {
    it('should update a subcategory', async () => {
      mockReq.params = { subcategoryId: 'sub-1' };
      mockReq.body = { description: 'Updated' };
      const result = { id: 'sub-1', description: 'Updated' };
      mockUpdateSubcategory.mockResolvedValue(result);

      await aiRmfController.updateSubcategory(mockReq, mockRes, mockNext);

      expect(mockUpdateSubcategory).toHaveBeenCalledWith(
        'org-1', 'sub-1', { description: 'Updated' }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { subcategoryId: 'sub-1' };
      mockUpdateSubcategory.mockRejectedValue(new AppError('Not found', 404));

      await aiRmfController.updateSubcategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { subcategoryId: 'sub-1' };
      mockUpdateSubcategory.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateSubcategory(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update subcategory' });
    });
  });

  // ============================================================================
  // Trustworthiness Characteristics
  // ============================================================================

  describe('updateTrustworthinessCharacteristic', () => {
    it('should update a trustworthiness characteristic', async () => {
      mockReq.params = { aiSystemId: 'ai-1', characteristic: 'fairness' };
      mockReq.body = { score: 85 };
      const result = { characteristic: 'fairness', score: 85 };
      mockUpdateTrustworthinessCharacteristic.mockResolvedValue(result);

      await aiRmfController.updateTrustworthinessCharacteristic(mockReq, mockRes, mockNext);

      expect(mockUpdateTrustworthinessCharacteristic).toHaveBeenCalledWith(
        'org-1', 'ai-1', 'fairness', { score: 85 }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1', characteristic: 'fairness' };
      mockUpdateTrustworthinessCharacteristic.mockRejectedValue(
        new AppError('Invalid characteristic', 400)
      );

      await aiRmfController.updateTrustworthinessCharacteristic(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid characteristic' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1', characteristic: 'fairness' };
      mockUpdateTrustworthinessCharacteristic.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateTrustworthinessCharacteristic(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to update trustworthiness characteristic',
      });
    });
  });

  // ============================================================================
  // Lifecycle Stages
  // ============================================================================

  describe('updateLifecycleStage', () => {
    it('should update a lifecycle stage', async () => {
      mockReq.params = { aiSystemId: 'ai-1', stage: 'deployment' };
      mockReq.body = { completed: true };
      const result = { stage: 'deployment', completed: true };
      mockUpdateLifecycleStage.mockResolvedValue(result);

      await aiRmfController.updateLifecycleStage(mockReq, mockRes, mockNext);

      expect(mockUpdateLifecycleStage).toHaveBeenCalledWith(
        'org-1', 'ai-1', 'deployment', { completed: true }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1', stage: 'invalid' };
      mockUpdateLifecycleStage.mockRejectedValue(new AppError('Invalid stage', 400));

      await aiRmfController.updateLifecycleStage(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid stage' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1', stage: 'deployment' };
      mockUpdateLifecycleStage.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateLifecycleStage(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update lifecycle stage' });
    });
  });

  // ============================================================================
  // AI Actors
  // ============================================================================

  describe('addActor', () => {
    it('should add an actor and return 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockReq.body = { name: 'Actor 1', role: 'developer' };
      const result = { id: 'act-1', name: 'Actor 1', role: 'developer' };
      mockAddActor.mockResolvedValue(result);

      await aiRmfController.addActor(mockReq, mockRes, mockNext);

      expect(mockAddActor).toHaveBeenCalledWith(
        'org-1', 'ai-1', { name: 'Actor 1', role: 'developer' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockAddActor.mockRejectedValue(new AppError('AI system not found', 404));

      await aiRmfController.addActor(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'AI system not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockAddActor.mockRejectedValue(new Error('fail'));

      await aiRmfController.addActor(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to add actor' });
    });
  });

  describe('removeActor', () => {
    it('should remove an actor and return success', async () => {
      mockReq.params = { actorId: 'act-1' };
      mockRemoveActor.mockResolvedValue(undefined);

      await aiRmfController.removeActor(mockReq, mockRes, mockNext);

      expect(mockRemoveActor).toHaveBeenCalledWith('org-1', 'act-1');
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { actorId: 'act-1' };
      mockRemoveActor.mockRejectedValue(new AppError('Actor not found', 404));

      await aiRmfController.removeActor(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Actor not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { actorId: 'act-1' };
      mockRemoveActor.mockRejectedValue(new Error('fail'));

      await aiRmfController.removeActor(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to remove actor' });
    });
  });

  // ============================================================================
  // Assessments
  // ============================================================================

  describe('createAssessment', () => {
    it('should create an assessment and return 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockReq.body = { type: 'initial', notes: 'Test assessment' };
      const result = { id: 'assess-1', type: 'initial' };
      mockCreateAssessment.mockResolvedValue(result);

      await aiRmfController.createAssessment(mockReq, mockRes, mockNext);

      expect(mockCreateAssessment).toHaveBeenCalledWith(
        'org-1', 'ai-1', { type: 'initial', notes: 'Test assessment' },
        'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCreateAssessment.mockRejectedValue(new AppError('System not found', 404));

      await aiRmfController.createAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'System not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCreateAssessment.mockRejectedValue(new Error('fail'));

      await aiRmfController.createAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to create assessment' });
    });
  });

  describe('getAssessments', () => {
    it('should return assessments for an AI system', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      const assessments = [{ id: 'assess-1' }, { id: 'assess-2' }];
      mockGetAssessments.mockResolvedValue(assessments);

      await aiRmfController.getAssessments(mockReq, mockRes, mockNext);

      expect(mockGetAssessments).toHaveBeenCalledWith('org-1', 'ai-1');
      expect(mockRes.json).toHaveBeenCalledWith(assessments);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockGetAssessments.mockRejectedValue(new AppError('Not found', 404));

      await aiRmfController.getAssessments(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockGetAssessments.mockRejectedValue(new Error('fail'));

      await aiRmfController.getAssessments(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch assessments' });
    });
  });

  describe('deleteAssessment', () => {
    it('should delete an assessment and return success', async () => {
      mockReq.params = { assessmentId: 'assess-1' };
      mockDeleteAssessment.mockResolvedValue(undefined);

      await aiRmfController.deleteAssessment(mockReq, mockRes, mockNext);

      expect(mockDeleteAssessment).toHaveBeenCalledWith(
        'org-1', 'assess-1', 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { assessmentId: 'assess-1' };
      mockDeleteAssessment.mockRejectedValue(new AppError('Assessment not found', 404));

      await aiRmfController.deleteAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Assessment not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { assessmentId: 'assess-1' };
      mockDeleteAssessment.mockRejectedValue(new Error('fail'));

      await aiRmfController.deleteAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to delete assessment' });
    });
  });

  // ============================================================================
  // Profiles
  // ============================================================================

  describe('createProfile', () => {
    it('should create a profile and return 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockReq.body = { type: 'current', notes: 'Initial profile' };
      const result = { id: 'prof-1', type: 'current' };
      mockCreateProfile.mockResolvedValue(result);

      await aiRmfController.createProfile(mockReq, mockRes, mockNext);

      expect(mockCreateProfile).toHaveBeenCalledWith(
        'org-1', 'ai-1', { type: 'current', notes: 'Initial profile' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCreateProfile.mockRejectedValue(new AppError('AI system not found', 404));

      await aiRmfController.createProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'AI system not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCreateProfile.mockRejectedValue(new Error('fail'));

      await aiRmfController.createProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to create profile' });
    });
  });

  // ============================================================================
  // Risk Activities
  // ============================================================================

  describe('createRiskActivity', () => {
    it('should create a risk activity and return 201', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockReq.body = { title: 'Risk Review', type: 'assessment' };
      const result = { id: 'ra-1', title: 'Risk Review' };
      mockCreateRiskActivity.mockResolvedValue(result);

      await aiRmfController.createRiskActivity(mockReq, mockRes, mockNext);

      expect(mockCreateRiskActivity).toHaveBeenCalledWith(
        'org-1', 'ai-1', { title: 'Risk Review', type: 'assessment' },
        'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCreateRiskActivity.mockRejectedValue(new AppError('Invalid data', 400));

      await aiRmfController.createRiskActivity(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid data' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCreateRiskActivity.mockRejectedValue(new Error('fail'));

      await aiRmfController.createRiskActivity(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to create risk activity' });
    });
  });

  describe('updateRiskActivity', () => {
    it('should update a risk activity', async () => {
      mockReq.params = { riskActivityId: 'ra-1' };
      mockReq.body = { status: 'completed' };
      const result = { id: 'ra-1', status: 'completed' };
      mockUpdateRiskActivity.mockResolvedValue(result);

      await aiRmfController.updateRiskActivity(mockReq, mockRes, mockNext);

      expect(mockUpdateRiskActivity).toHaveBeenCalledWith(
        'org-1', 'ra-1', { status: 'completed' }, 'user-1', '127.0.0.1', 'test-agent'
      );
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { riskActivityId: 'ra-1' };
      mockUpdateRiskActivity.mockRejectedValue(new AppError('Activity not found', 404));

      await aiRmfController.updateRiskActivity(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Activity not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { riskActivityId: 'ra-1' };
      mockUpdateRiskActivity.mockRejectedValue(new Error('fail'));

      await aiRmfController.updateRiskActivity(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update risk activity' });
    });
  });

  // ============================================================================
  // Analytics and Reporting
  // ============================================================================

  describe('calculateTrustworthinessScore', () => {
    it('should return the trustworthiness score wrapped in an object', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCalculateTrustworthinessScore.mockResolvedValue(87.5);

      await aiRmfController.calculateTrustworthinessScore(mockReq, mockRes, mockNext);

      expect(mockCalculateTrustworthinessScore).toHaveBeenCalledWith('org-1', 'ai-1');
      expect(mockRes.json).toHaveBeenCalledWith({ score: 87.5 });
    });

    it('should return AppError status on service error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCalculateTrustworthinessScore.mockRejectedValue(
        new AppError('System not found', 404)
      );

      await aiRmfController.calculateTrustworthinessScore(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'System not found' });
    });

    it('should return 500 on generic error', async () => {
      mockReq.params = { aiSystemId: 'ai-1' };
      mockCalculateTrustworthinessScore.mockRejectedValue(new Error('fail'));

      await aiRmfController.calculateTrustworthinessScore(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to calculate trustworthiness score',
      });
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      const dashboardData = { totalSystems: 5, avgScore: 82 };
      mockGetDashboardData.mockResolvedValue(dashboardData);

      await aiRmfController.getDashboardData(mockReq, mockRes, mockNext);

      expect(mockGetDashboardData).toHaveBeenCalledWith('org-1');
      expect(mockRes.json).toHaveBeenCalledWith(dashboardData);
    });

    it('should return AppError status on service error', async () => {
      mockGetDashboardData.mockRejectedValue(new AppError('Forbidden', 403));

      await aiRmfController.getDashboardData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 500 on generic error', async () => {
      mockGetDashboardData.mockRejectedValue(new Error('fail'));

      await aiRmfController.getDashboardData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch dashboard data' });
    });
  });
});
