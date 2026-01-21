/**
 * EU Regulations Compliance Controller
 * 
 * Handles API requests for:
 * - EU AI Act compliance
 * - Digital Markets Act (DMA) compliance
 * - Digital Services Act (DSA) compliance
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import euAiActService from '../services/euRegulations/euAiActService';
import dmaService from '../services/euRegulations/dmaService';
import dsaService from '../services/euRegulations/dsaService';
import logger from '../config/logger';

class EURegulationsController {
  // ============================================================================
  // EU AI ACT ENDPOINTS
  // ============================================================================

  /**
   * Register AI system
   * POST /api/eu-regulations/ai-act/systems
   */
  registerAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;

      const system = await euAiActService.registerAISystem(organizationId, userId, req.body);

      res.status(201).json({ system });
    } catch (error: any) {
      logger.error('Register AI system error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to register AI system' });
      }
    }
  };

  /**
   * Get all AI systems
   * GET /api/eu-regulations/ai-act/systems
   */
  getAISystems: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const systems = await euAiActService.getAISystems(organizationId);

      res.json({ systems });
    } catch (error: any) {
      logger.error('Get AI systems error', error);
      res.status(500).json({ error: 'Failed to fetch AI systems' });
    }
  };

  /**
   * Get AI system by ID
   * GET /api/eu-regulations/ai-act/systems/:id
   */
  getAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const system = await euAiActService.getAISystem(organizationId, id);

      res.json({ system });
    } catch (error: any) {
      logger.error('Get AI system error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch AI system' });
      }
    }
  };

  /**
   * Get risk assessments for a system
   * GET /api/eu-regulations/ai-act/systems/:id/assessments
   */
  getRiskAssessments: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const assessments = await euAiActService.getRiskAssessments(organizationId, id);

      res.json({ assessments });
    } catch (error: any) {
      logger.error('Get risk assessments error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch risk assessments' });
      }
    }
  };

  /**
   * Get latest risk assessment for a system
   * GET /api/eu-regulations/ai-act/systems/:id/assessments/latest
   */
  getLatestRiskAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const assessment = await euAiActService.getLatestRiskAssessment(organizationId, id);

      res.json({ assessment });
    } catch (error: any) {
      logger.error('Get latest risk assessment error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch latest risk assessment' });
      }
    }
  };

  /**
   * Conduct risk assessment
   * POST /api/eu-regulations/ai-act/systems/:id/assessments
   */
  conductRiskAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { id } = req.params;

      const assessment = await euAiActService.conductRiskAssessment(
        organizationId,
        id,
        userId,
        req.body
      );

      res.status(201).json({ assessment });
    } catch (error: any) {
      logger.error('Conduct risk assessment error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to conduct risk assessment' });
      }
    }
  };

  /**
   * Generate transparency report
   * POST /api/eu-regulations/ai-act/transparency-reports
   */
  generateTransparencyReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      // Validate request body
      if (!req.body.reportingPeriod) {
        res.status(400).json({ error: 'Reporting period is required. Please provide start and end dates.' });
        return;
      }

      const { start, end } = req.body.reportingPeriod;
      if (!start || !end) {
        res.status(400).json({ error: 'Both start and end dates are required for the reporting period.' });
        return;
      }

      const reportingPeriod = {
        start: new Date(start),
        end: new Date(end),
      };

      // Validate dates
      if (isNaN(reportingPeriod.start.getTime()) || isNaN(reportingPeriod.end.getTime())) {
        res.status(400).json({ error: 'Invalid date format. Please provide valid start and end dates.' });
        return;
      }

      if (reportingPeriod.start >= reportingPeriod.end) {
        res.status(400).json({ error: 'Start date must be before end date.' });
        return;
      }

      const report = await euAiActService.generateTransparencyReport(
        organizationId,
        reportingPeriod
      );

      res.status(201).json({ report });
    } catch (error: any) {
      logger.error('Generate transparency report error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to generate transparency report' });
      }
    }
  };

  /**
   * Get transparency reports
   * GET /api/eu-regulations/ai-act/transparency-reports
   */
  getTransparencyReports: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const reports = await euAiActService.getTransparencyReports(
        organizationId,
        startDate,
        endDate
      );

      res.json({ reports });
    } catch (error: any) {
      logger.error('Get transparency reports error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch transparency reports' });
      }
    }
  };

  /**
   * Update AI system
   * PATCH /api/eu-regulations/ai-act/systems/:id
   */
  updateAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const system = await euAiActService.updateAISystem(organizationId, id, req.body);

      res.json({ system });
    } catch (error: any) {
      logger.error('Update AI system error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update AI system' });
      }
    }
  };

  /**
   * Delete AI system
   * DELETE /api/eu-regulations/ai-act/systems/:id
   */
  deleteAISystem: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      await euAiActService.deleteAISystem(organizationId, id);

      res.status(204).send();
    } catch (error: any) {
      logger.error('Delete AI system error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete AI system' });
      }
    }
  };

  // ============================================================================
  // DMA ENDPOINTS
  // ============================================================================

  /**
   * Register gatekeeper
   * POST /api/eu-regulations/dma/gatekeepers
   */
  registerGatekeeper: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const gatekeeper = await dmaService.registerGatekeeper(organizationId, req.body);

      res.status(201).json({ gatekeeper });
    } catch (error: any) {
      logger.error('Register gatekeeper error', error);
      res.status(500).json({ error: 'Failed to register gatekeeper' });
    }
  };

  /**
   * Get all gatekeepers
   * GET /api/eu-regulations/dma/gatekeepers
   */
  getGatekeepers: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const gatekeepers = await dmaService.getGatekeepers(organizationId);

      res.json({ gatekeepers });
    } catch (error: any) {
      logger.error('Get gatekeepers error', error);
      res.status(500).json({ error: 'Failed to fetch gatekeepers' });
    }
  };

  /**
   * Get gatekeeper by ID
   * GET /api/eu-regulations/dma/gatekeepers/:id
   */
  getGatekeeper: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const gatekeeper = await dmaService.getGatekeeper(organizationId, id);

      res.json({ gatekeeper });
    } catch (error: any) {
      logger.error('Get gatekeeper error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch gatekeeper' });
      }
    }
  };

  /**
   * Update obligation compliance
   * PATCH /api/eu-regulations/dma/gatekeepers/:id/obligations/:obligationType
   */
  updateObligationCompliance: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id, obligationType } = req.params;

      await dmaService.updateObligationCompliance(
        organizationId,
        id,
        obligationType as any,
        req.body
      );

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Update obligation compliance error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update obligation compliance' });
      }
    }
  };

  /**
   * Get obligations for a gatekeeper
   * GET /api/eu-regulations/dma/gatekeepers/:id/obligations
   */
  getObligations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const obligations = await dmaService.getObligations(organizationId, id);

      res.json({ obligations });
    } catch (error: any) {
      logger.error('Get obligations error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch obligations' });
      }
    }
  };

  /**
   * Get compliance reports for a gatekeeper
   * GET /api/eu-regulations/dma/gatekeepers/:id/compliance-reports
   */
  getComplianceReports: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const reports = await dmaService.getComplianceReports(organizationId, id);

      res.json({ reports });
    } catch (error: any) {
      logger.error('Get compliance reports error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch compliance reports' });
      }
    }
  };

  /**
   * Get latest compliance report for a gatekeeper
   * GET /api/eu-regulations/dma/gatekeepers/:id/compliance-reports/latest
   */
  getLatestComplianceReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const report = await dmaService.getLatestComplianceReport(organizationId, id);

      res.json({ report });
    } catch (error: any) {
      logger.error('Get latest compliance report error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch latest compliance report' });
      }
    }
  };

  /**
   * Generate compliance report
   * POST /api/eu-regulations/dma/gatekeepers/:id/compliance-reports
   */
  generateComplianceReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const report = await dmaService.generateComplianceReport(
        organizationId,
        id,
        req.body.reportingPeriod
      );

      res.status(201).json({ report });
    } catch (error: any) {
      logger.error('Generate compliance report error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to generate compliance report' });
      }
    }
  };

  /**
   * Update gatekeeper
   * PATCH /api/eu-regulations/dma/gatekeepers/:id
   */
  updateGatekeeper: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const gatekeeper = await dmaService.updateGatekeeper(organizationId, id, req.body);

      res.json({ gatekeeper });
    } catch (error: any) {
      logger.error('Update gatekeeper error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update gatekeeper' });
      }
    }
  };

  /**
   * Delete gatekeeper
   * DELETE /api/eu-regulations/dma/gatekeepers/:id
   */
  deleteGatekeeper: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      await dmaService.deleteGatekeeper(organizationId, id);

      res.status(204).send();
    } catch (error: any) {
      logger.error('Delete gatekeeper error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete gatekeeper' });
      }
    }
  };

  // ============================================================================
  // DSA ENDPOINTS
  // ============================================================================

  /**
   * Register platform
   * POST /api/eu-regulations/dsa/platforms
   */
  registerPlatform: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const platform = await dsaService.registerPlatform(organizationId, req.body);

      res.status(201).json({ platform });
    } catch (error: any) {
      logger.error('Register platform error', error);
      res.status(500).json({ error: 'Failed to register platform' });
    }
  };

  /**
   * Get all platforms
   * GET /api/eu-regulations/dsa/platforms
   */
  getPlatforms: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const platforms = await dsaService.getPlatforms(organizationId);

      res.json({ platforms });
    } catch (error: any) {
      logger.error('Get platforms error', error);
      res.status(500).json({ error: 'Failed to fetch platforms' });
    }
  };

  /**
   * Get platform by ID
   * GET /api/eu-regulations/dsa/platforms/:id
   */
  getPlatform: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const platform = await dsaService.getPlatform(organizationId, id);

      res.json({ platform });
    } catch (error: any) {
      logger.error('Get platform error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch platform' });
      }
    }
  };

  /**
   * Record content moderation
   * POST /api/eu-regulations/dsa/platforms/:id/content-moderation
   */
  recordContentModeration: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const moderation = await dsaService.recordContentModeration(
        organizationId,
        id,
        req.body
      );

      res.status(201).json({ moderation });
    } catch (error: any) {
      logger.error('Record content moderation error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to record content moderation' });
      }
    }
  };

  /**
   * Get content moderation history
   * GET /api/eu-regulations/dsa/platforms/:id/content-moderation
   */
  getContentModerationHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const history = await dsaService.getContentModerationHistory(
        organizationId,
        id
      );

      res.json({ history });
    } catch (error: any) {
      logger.error('Get content moderation history error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch content moderation history' });
      }
    }
  };

  /**
   * Report illegal content
   * POST /api/eu-regulations/dsa/platforms/:id/illegal-content-reports
   */
  reportIllegalContent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const report = await dsaService.reportIllegalContent(
        organizationId,
        id,
        req.body
      );

      res.status(201).json({ report });
    } catch (error: any) {
      logger.error('Report illegal content error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to report illegal content' });
      }
    }
  };

  /**
   * Process illegal content report
   * PATCH /api/eu-regulations/dsa/illegal-content-reports/:id
   */
  processIllegalContentReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const report = await dsaService.processIllegalContentReport(
        organizationId,
        id,
        req.body
      );

      res.json({ report });
    } catch (error: any) {
      logger.error('Process illegal content report error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to process illegal content report' });
      }
    }
  };

  /**
   * Add ad to repository
   * POST /api/eu-regulations/dsa/platforms/:id/ad-repository
   */
  addAdToRepository: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const adEntry = await dsaService.addAdToRepository(
        organizationId,
        id,
        req.body
      );

      res.status(201).json({ adEntry });
    } catch (error: any) {
      logger.error('Add ad to repository error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add ad to repository' });
      }
    }
  };

  /**
   * Get ads from repository
   * GET /api/eu-regulations/dsa/platforms/:id/ad-repository
   */
  getAdsFromRepository: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const ads = await dsaService.getAdsFromRepository(organizationId, id);

      res.json({ ads });
    } catch (error: any) {
      logger.error('Get ads from repository error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch ads from repository' });
      }
    }
  };

  /**
   * Generate DSA transparency report
   * POST /api/eu-regulations/dsa/platforms/:id/transparency-reports
   */
  generateDSATransparencyReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const report = await dsaService.generateTransparencyReport(
        organizationId,
        id,
        req.body.reportingPeriod
      );

      res.status(201).json({ report });
    } catch (error: any) {
      logger.error('Generate transparency report error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to generate transparency report' });
      }
    }
  };

  /**
   * Get transparency reports
   * GET /api/eu-regulations/dsa/platforms/:id/transparency-reports
   */
  getTransparencyReports: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const reports = await dsaService.getTransparencyReports(
        organizationId,
        id
      );

      res.json({ reports });
    } catch (error: any) {
      logger.error('Get transparency reports error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch transparency reports' });
      }
    }
  };

  /**
   * Conduct risk assessment for VLOP/VLOSE platform
   * POST /api/eu-regulations/dsa/platforms/:id/risk-assessments
   */
  conductDSARiskAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;
      const { id } = req.params;

      const assessment = await dsaService.conductRiskAssessment(
        organizationId,
        id,
        userId,
        req.body
      );

      res.status(201).json({ assessment });
    } catch (error: any) {
      logger.error('Conduct DSA risk assessment error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to conduct risk assessment' });
      }
    }
  };

  /**
   * Get risk assessments for a platform
   * GET /api/eu-regulations/dsa/platforms/:id/risk-assessments
   */
  getDSARiskAssessments: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const assessments = await dsaService.getRiskAssessments(organizationId, id);

      res.json({ assessments });
    } catch (error: any) {
      logger.error('Get DSA risk assessments error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch risk assessments' });
      }
    }
  };

  /**
   * Get latest risk assessment for a platform
   * GET /api/eu-regulations/dsa/platforms/:id/risk-assessments/latest
   */
  getLatestDSARiskAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const assessment = await dsaService.getLatestRiskAssessment(organizationId, id);

      res.json({ assessment });
    } catch (error: any) {
      logger.error('Get latest DSA risk assessment error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch latest risk assessment' });
      }
    }
  };

  /**
   * Update risk assessment
   * PATCH /api/eu-regulations/dsa/risk-assessments/:id
   */
  updateDSARiskAssessment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const assessment = await dsaService.updateRiskAssessment(organizationId, id, req.body);

      res.json({ assessment });
    } catch (error: any) {
      logger.error('Update DSA risk assessment error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update risk assessment' });
      }
    }
  };

  /**
   * Configure non-personalized feed option for VLOP
   * POST /api/eu-regulations/dsa/platforms/:id/non-personalized-feed
   */
  configureNonPersonalizedFeed: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const feedConfig = await dsaService.configureNonPersonalizedFeed(
        organizationId,
        id,
        req.body
      );

      res.status(201).json({ feedConfig });
    } catch (error: any) {
      logger.error('Configure non-personalized feed error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to configure non-personalized feed' });
      }
    }
  };

  /**
   * Get non-personalized feed configuration
   * GET /api/eu-regulations/dsa/platforms/:id/non-personalized-feed
   */
  getNonPersonalizedFeed: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const feedConfig = await dsaService.getNonPersonalizedFeed(organizationId, id);

      res.json({ feedConfig });
    } catch (error: any) {
      logger.error('Get non-personalized feed error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch non-personalized feed configuration' });
      }
    }
  };

  /**
   * Update non-personalized feed status
   * PATCH /api/eu-regulations/dsa/platforms/:id/non-personalized-feed
   */
  updateNonPersonalizedFeedStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const feedConfig = await dsaService.updateNonPersonalizedFeedStatus(
        organizationId,
        id,
        req.body
      );

      res.json({ feedConfig });
    } catch (error: any) {
      logger.error('Update non-personalized feed status error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update non-personalized feed status' });
      }
    }
  };

  /**
   * Update platform
   * PATCH /api/eu-regulations/dsa/platforms/:id
   */
  updatePlatform: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      const platform = await dsaService.updatePlatform(organizationId, id, req.body);

      res.json({ platform });
    } catch (error: any) {
      logger.error('Update platform error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update platform' });
      }
    }
  };

  /**
   * Delete platform
   * DELETE /api/eu-regulations/dsa/platforms/:id
   */
  deletePlatform: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { id } = req.params;

      await dsaService.deletePlatform(organizationId, id);

      res.status(204).send();
    } catch (error: any) {
      logger.error('Delete platform error', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete platform' });
      }
    }
  };
}

export default new EURegulationsController();

