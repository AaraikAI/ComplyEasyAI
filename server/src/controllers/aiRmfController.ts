import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import aiRmfService from '../services/aiRmfService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

class AIRMFController {
  // ============================================================================
  // AI System Management
  // ============================================================================

  createAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;

      const { name, description, systemType, useCase, deploymentContext,
        lifecycleStage, autonomyLevel, metadata } = req.body;
      const aiSystem = await aiRmfService.createAISystem(
        organizationId,
        { name, description, systemType, useCase, deploymentContext,
          lifecycleStage, autonomyLevel, metadata },
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json(aiSystem);
    } catch (error: any) {
      logger.error('Create AI system error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create AI system', 500);
    }
  };

  getAISystems: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { status, lifecycleStage, riskLevel } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (lifecycleStage) filters.lifecycleStage = lifecycleStage;
      if (riskLevel) filters.riskLevel = riskLevel;

      const aiSystems = await aiRmfService.getAISystems(organizationId, filters);

      res.json(aiSystems);
    } catch (error: any) {
      logger.error('Get AI systems error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch AI systems', 500);
    }
  };

  getAISystemById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const aiSystem = await aiRmfService.getAISystemById(organizationId, id);

      res.json(aiSystem);
    } catch (error: any) {
      logger.error('Get AI system error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch AI system', 500);
    }
  };

  updateAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { id } = req.params;

      const aiSystem = await aiRmfService.updateAISystem(
        organizationId,
        id,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(aiSystem);
    } catch (error: any) {
      logger.error('Update AI system error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update AI system', 500);
    }
  };

  deleteAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { id } = req.params;

      await aiRmfService.deleteAISystem(
        organizationId,
        id,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete AI system error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete AI system', 500);
    }
  };

  // ============================================================================
  // Core Functions
  // ============================================================================

  updateCoreFunction: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { aiSystemId, functionName } = req.params;

      const coreFunction = await aiRmfService.updateCoreFunction(
        organizationId,
        aiSystemId,
        functionName,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(coreFunction);
    } catch (error: any) {
      logger.error('Update core function error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update core function', 500);
    }
  };

  // ============================================================================
  // Categories and Subcategories
  // ============================================================================

  updateCategory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { categoryId } = req.params;

      const category = await aiRmfService.updateCategory(
        organizationId,
        categoryId,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(category);
    } catch (error: any) {
      logger.error('Update category error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500);
    }
  };

  updateSubcategory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { subcategoryId } = req.params;

      const subcategory = await aiRmfService.updateSubcategory(
        organizationId,
        subcategoryId,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(subcategory);
    } catch (error: any) {
      logger.error('Update subcategory error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update subcategory', 500);
    }
  };

  // ============================================================================
  // Trustworthiness Characteristics
  // ============================================================================

  updateTrustworthinessCharacteristic: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { aiSystemId, characteristic } = req.params;

      const trustworthiness = await aiRmfService.updateTrustworthinessCharacteristic(
        organizationId,
        aiSystemId,
        characteristic,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(trustworthiness);
    } catch (error: any) {
      logger.error('Update trustworthiness characteristic error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update trustworthiness characteristic', 500);
    }
  };

  // ============================================================================
  // Lifecycle Stages
  // ============================================================================

  updateLifecycleStage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { aiSystemId, stage } = req.params;

      const lifecycleStage = await aiRmfService.updateLifecycleStage(
        organizationId,
        aiSystemId,
        stage,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(lifecycleStage);
    } catch (error: any) {
      logger.error('Update lifecycle stage error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update lifecycle stage', 500);
    }
  };

  // ============================================================================
  // AI Actors
  // ============================================================================

  addActor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId } = req.params;

      const actor = await aiRmfService.addActor(organizationId, aiSystemId, req.body);

      res.status(201).json(actor);
    } catch (error: any) {
      logger.error('Add actor error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add actor', 500);
    }
  };

  removeActor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { actorId } = req.params;

      await aiRmfService.removeActor(organizationId, actorId);

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Remove actor error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove actor', 500);
    }
  };

  // ============================================================================
  // Assessments
  // ============================================================================

  createAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { aiSystemId } = req.params;

      const assessment = await aiRmfService.createAssessment(
        organizationId,
        aiSystemId,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json(assessment);
    } catch (error: any) {
      logger.error('Create assessment error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create assessment', 500);
    }
  };

  getAssessments: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId } = req.params;

      const assessments = await aiRmfService.getAssessments(organizationId, aiSystemId);

      res.json(assessments);
    } catch (error: any) {
      logger.error('Get assessments error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch assessments', 500);
    }
  };

  deleteAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { assessmentId } = req.params;

      await aiRmfService.deleteAssessment(
        organizationId,
        assessmentId,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete assessment error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete assessment', 500);
    }
  };

  // ============================================================================
  // Profiles
  // ============================================================================

  createProfile: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId } = req.params;

      const profile = await aiRmfService.createProfile(organizationId, aiSystemId, req.body);

      res.status(201).json(profile);
    } catch (error: any) {
      logger.error('Create profile error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create profile', 500);
    }
  };

  // ============================================================================
  // Risk Activities
  // ============================================================================

  createRiskActivity: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { aiSystemId } = req.params;

      const riskActivity = await aiRmfService.createRiskActivity(
        organizationId,
        aiSystemId,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json(riskActivity);
    } catch (error: any) {
      logger.error('Create risk activity error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create risk activity', 500);
    }
  };

  updateRiskActivity: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { riskActivityId } = req.params;

      const riskActivity = await aiRmfService.updateRiskActivity(
        organizationId,
        riskActivityId,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.json(riskActivity);
    } catch (error: any) {
      logger.error('Update risk activity error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update risk activity', 500);
    }
  };

  // ============================================================================
  // Analytics and Reporting
  // ============================================================================

  calculateTrustworthinessScore: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId } = req.params;

      const score = await aiRmfService.calculateTrustworthinessScore(organizationId, aiSystemId);

      res.json({ score });
    } catch (error: any) {
      logger.error('Calculate trustworthiness score error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to calculate trustworthiness score', 500);
    }
  };

  getDashboardData: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const dashboardData = await aiRmfService.getDashboardData(organizationId);

      res.json(dashboardData);
    } catch (error: any) {
      logger.error('Get dashboard data error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch dashboard data', 500);
    }
  };
}

export default new AIRMFController();
