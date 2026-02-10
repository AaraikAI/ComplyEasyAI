/**
 * EU Regulations Compliance Controller
 *
 * Handles API requests for:
 * - EU AI Act compliance
 * - Digital Markets Act (DMA) compliance
 * - Digital Services Act (DSA) compliance
 *
 * Uses asyncHandler pattern matching the rest of the codebase.
 * Errors are caught automatically and forwarded to the Express error handler.
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import euAiActService from '../services/euRegulations/euAiActService';
import dmaService from '../services/euRegulations/dmaService';
import dsaService from '../services/euRegulations/dsaService';
import { asyncHandler } from '../types/express';

class EURegulationsController {
  // ============================================================================
  // EU AI ACT ENDPOINTS
  // ============================================================================

  registerAISystem: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const userId = authReq.user!.id;

    const system = await euAiActService.registerAISystem(organizationId, userId, req.body);
    res.status(201).json({ system });
  });

  getAISystems: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const systems = await euAiActService.getAISystems(organizationId);
    res.json({ systems });
  });

  getAISystem: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const system = await euAiActService.getAISystem(organizationId, id);
    res.json({ system });
  });

  getRiskAssessments: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const assessments = await euAiActService.getRiskAssessments(organizationId, id);
    res.json({ assessments });
  });

  getLatestRiskAssessment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const assessment = await euAiActService.getLatestRiskAssessment(organizationId, id);
    res.json({ assessment });
  });

  conductRiskAssessment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const userId = authReq.user!.id;
    const { id } = req.params;

    const assessment = await euAiActService.conductRiskAssessment(organizationId, id, userId, req.body);
    res.status(201).json({ assessment });
  });

  generateTransparencyReport: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const { start, end } = req.body.reportingPeriod;
    const reportingPeriod = {
      start: new Date(start),
      end: new Date(end),
    };

    const report = await euAiActService.generateTransparencyReport(organizationId, reportingPeriod);
    res.status(201).json({ report });
  });

  getTransparencyReports: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const reports = await euAiActService.getTransparencyReports(organizationId, startDate, endDate);
    res.json({ reports });
  });

  updateAISystem: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const system = await euAiActService.updateAISystem(organizationId, id, req.body);
    res.json({ system });
  });

  deleteAISystem: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    await euAiActService.deleteAISystem(organizationId, id);
    res.status(204).send();
  });

  // ============================================================================
  // DMA ENDPOINTS
  // ============================================================================

  registerGatekeeper: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const gatekeeper = await dmaService.registerGatekeeper(organizationId, req.body);
    res.status(201).json({ gatekeeper });
  });

  getGatekeepers: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const gatekeepers = await dmaService.getGatekeepers(organizationId);
    res.json({ gatekeepers });
  });

  getGatekeeper: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const gatekeeper = await dmaService.getGatekeeper(organizationId, id);
    res.json({ gatekeeper });
  });

  updateObligationCompliance: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id, obligationType } = req.params;

    await dmaService.updateObligationCompliance(organizationId, id, obligationType as any, req.body);
    res.json({ success: true });
  });

  getObligations: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const obligations = await dmaService.getObligations(organizationId, id);
    res.json({ obligations });
  });

  getComplianceReports: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const reports = await dmaService.getComplianceReports(organizationId, id);
    res.json({ reports });
  });

  getLatestComplianceReport: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const report = await dmaService.getLatestComplianceReport(organizationId, id);
    res.json({ report });
  });

  generateComplianceReport: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const report = await dmaService.generateComplianceReport(organizationId, id, req.body.reportingPeriod);
    res.status(201).json({ report });
  });

  updateGatekeeper: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const gatekeeper = await dmaService.updateGatekeeper(organizationId, id, req.body);
    res.json({ gatekeeper });
  });

  deleteGatekeeper: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    await dmaService.deleteGatekeeper(organizationId, id);
    res.status(204).send();
  });

  // ============================================================================
  // DSA ENDPOINTS
  // ============================================================================

  registerPlatform: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const platform = await dsaService.registerPlatform(organizationId, req.body);
    res.status(201).json({ platform });
  });

  getPlatforms: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const platforms = await dsaService.getPlatforms(organizationId);
    res.json({ platforms });
  });

  getPlatform: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const platform = await dsaService.getPlatform(organizationId, id);
    res.json({ platform });
  });

  recordContentModeration: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const moderation = await dsaService.recordContentModeration(organizationId, id, req.body);
    res.status(201).json({ moderation });
  });

  getContentModerationHistory: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const history = await dsaService.getContentModerationHistory(organizationId, id);
    res.json({ history });
  });

  reportIllegalContent: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const report = await dsaService.reportIllegalContent(organizationId, id, req.body);
    res.status(201).json({ report });
  });

  processIllegalContentReport: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const report = await dsaService.processIllegalContentReport(organizationId, id, req.body);
    res.json({ report });
  });

  addAdToRepository: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const adEntry = await dsaService.addAdToRepository(organizationId, id, req.body);
    res.status(201).json({ adEntry });
  });

  getAdsFromRepository: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const ads = await dsaService.getAdsFromRepository(organizationId, id);
    res.json({ ads });
  });

  generateDSATransparencyReport: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const report = await dsaService.generateTransparencyReport(organizationId, id, req.body.reportingPeriod);
    res.status(201).json({ report });
  });

  getDSATransparencyReports: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const reports = await dsaService.getTransparencyReports(organizationId, id);
    res.json({ reports });
  });

  conductDSARiskAssessment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const userId = authReq.user!.id;
    const { id } = req.params;

    const assessment = await dsaService.conductRiskAssessment(organizationId, id, userId, req.body);
    res.status(201).json({ assessment });
  });

  getDSARiskAssessments: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const assessments = await dsaService.getRiskAssessments(organizationId, id);
    res.json({ assessments });
  });

  getLatestDSARiskAssessment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const assessment = await dsaService.getLatestRiskAssessment(organizationId, id);
    res.json({ assessment });
  });

  updateDSARiskAssessment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const assessment = await dsaService.updateRiskAssessment(organizationId, id, req.body);
    res.json({ assessment });
  });

  configureNonPersonalizedFeed: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const feedConfig = await dsaService.configureNonPersonalizedFeed(organizationId, id, req.body);
    res.status(201).json({ feedConfig });
  });

  getNonPersonalizedFeed: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const feedConfig = await dsaService.getNonPersonalizedFeed(organizationId, id);
    res.json({ feedConfig });
  });

  updateNonPersonalizedFeedStatus: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const feedConfig = await dsaService.updateNonPersonalizedFeedStatus(organizationId, id, req.body);
    res.json({ feedConfig });
  });

  updatePlatform: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    const platform = await dsaService.updatePlatform(organizationId, id, req.body);
    res.json({ platform });
  });

  deletePlatform: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;
    const { id } = req.params;

    await dsaService.deletePlatform(organizationId, id);
    res.status(204).send();
  });
}

export default new EURegulationsController();
