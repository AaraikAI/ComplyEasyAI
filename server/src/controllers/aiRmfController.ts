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

      const aiSystem = await aiRmfService.createAISystem(organizationId, req.body);

      res.status(201).json(aiSystem);
    } catch (error: any) {
      logger.error('Create AI system error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create AI system' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch AI systems' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch AI system' });
      }
    }
  };

  updateAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const aiSystem = await aiRmfService.updateAISystem(organizationId, id, req.body);

      res.json(aiSystem);
    } catch (error: any) {
      logger.error('Update AI system error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update AI system' });
      }
    }
  };

  deleteAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      await aiRmfService.deleteAISystem(organizationId, id);

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete AI system error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete AI system' });
      }
    }
  };

  // ============================================================================
  // Core Functions
  // ============================================================================

  updateCoreFunction: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId, functionName } = req.params;

      const coreFunction = await aiRmfService.updateCoreFunction(
        organizationId,
        aiSystemId,
        functionName,
        req.body
      );

      res.json(coreFunction);
    } catch (error: any) {
      logger.error('Update core function error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update core function' });
      }
    }
  };

  // ============================================================================
  // Categories and Subcategories
  // ============================================================================

  updateCategory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { categoryId } = req.params;

      const category = await aiRmfService.updateCategory(organizationId, categoryId, req.body);

      res.json(category);
    } catch (error: any) {
      logger.error('Update category error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update category' });
      }
    }
  };

  updateSubcategory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { subcategoryId } = req.params;

      const subcategory = await aiRmfService.updateSubcategory(organizationId, subcategoryId, req.body);

      res.json(subcategory);
    } catch (error: any) {
      logger.error('Update subcategory error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update subcategory' });
      }
    }
  };

  // ============================================================================
  // Trustworthiness Characteristics
  // ============================================================================

  updateTrustworthinessCharacteristic: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId, characteristic } = req.params;

      const trustworthiness = await aiRmfService.updateTrustworthinessCharacteristic(
        organizationId,
        aiSystemId,
        characteristic,
        req.body
      );

      res.json(trustworthiness);
    } catch (error: any) {
      logger.error('Update trustworthiness characteristic error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update trustworthiness characteristic' });
      }
    }
  };

  // ============================================================================
  // Lifecycle Stages
  // ============================================================================

  updateLifecycleStage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId, stage } = req.params;

      const lifecycleStage = await aiRmfService.updateLifecycleStage(
        organizationId,
        aiSystemId,
        stage,
        req.body
      );

      res.json(lifecycleStage);
    } catch (error: any) {
      logger.error('Update lifecycle stage error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update lifecycle stage' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add actor' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to remove actor' });
      }
    }
  };

  // ============================================================================
  // Assessments
  // ============================================================================

  createAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId } = req.params;

      const assessment = await aiRmfService.createAssessment(organizationId, aiSystemId, req.body);

      res.status(201).json(assessment);
    } catch (error: any) {
      logger.error('Create assessment error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create assessment' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch assessments' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create profile' });
      }
    }
  };

  // ============================================================================
  // Risk Activities
  // ============================================================================

  createRiskActivity: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { aiSystemId } = req.params;

      const riskActivity = await aiRmfService.createRiskActivity(organizationId, aiSystemId, req.body);

      res.status(201).json(riskActivity);
    } catch (error: any) {
      logger.error('Create risk activity error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create risk activity' });
      }
    }
  };

  updateRiskActivity: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { riskActivityId } = req.params;

      const riskActivity = await aiRmfService.updateRiskActivity(organizationId, riskActivityId, req.body);

      res.json(riskActivity);
    } catch (error: any) {
      logger.error('Update risk activity error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update risk activity' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to calculate trustworthiness score' });
      }
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
      }
    }
  };
}

export default new AIRMFController();

