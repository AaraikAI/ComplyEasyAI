/**
 * EU Regulations Compliance Routes
 *
 * Routes for:
 * - EU AI Act compliance
 * - Digital Markets Act (DMA) compliance
 * - Digital Services Act (DSA) compliance
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import euRegulationsController from '../controllers/euRegulationsController';
import { requireVisionaryFeature } from '../middleware/tierMiddleware';
import {
  registerAISystemSchema,
  updateAISystemSchema,
  conductAIRiskAssessmentSchema,
  generateTransparencyReportSchema,
  registerGatekeeperSchema,
  updateGatekeeperSchema,
  updateObligationComplianceSchema,
  generateDMAComplianceReportSchema,
  registerPlatformSchema,
  updatePlatformSchema,
  recordContentModerationSchema,
  reportIllegalContentSchema,
  processIllegalContentReportSchema,
  addAdToRepositorySchema,
  generateDSATransparencyReportSchema,
  conductDSARiskAssessmentSchema,
  updateDSARiskAssessmentSchema,
  configureNonPersonalizedFeedSchema,
  updateNonPersonalizedFeedStatusSchema,
} from '../validators/euRegulationsSchemas';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EU AI ACT ROUTES (Visionary tier)
// ============================================================================

router.post('/ai-act/systems', ...requireVisionaryFeature('euAiAct'), validateBody(registerAISystemSchema), euRegulationsController.registerAISystem);
router.get('/ai-act/systems', ...requireVisionaryFeature('euAiAct'), euRegulationsController.getAISystems);
router.get('/ai-act/systems/:id', ...requireVisionaryFeature('euAiAct'), euRegulationsController.getAISystem);
router.patch('/ai-act/systems/:id', ...requireVisionaryFeature('euAiAct'), validateBody(updateAISystemSchema), euRegulationsController.updateAISystem);
router.delete('/ai-act/systems/:id', ...requireVisionaryFeature('euAiAct'), euRegulationsController.deleteAISystem);
router.get('/ai-act/systems/:id/assessments', ...requireVisionaryFeature('euAiAct'), euRegulationsController.getRiskAssessments);
router.get('/ai-act/systems/:id/assessments/latest', ...requireVisionaryFeature('euAiAct'), euRegulationsController.getLatestRiskAssessment);
router.post('/ai-act/systems/:id/assessments', ...requireVisionaryFeature('euAiAct'), validateBody(conductAIRiskAssessmentSchema), euRegulationsController.conductRiskAssessment);
router.post('/ai-act/transparency-reports', ...requireVisionaryFeature('euAiAct'), validateBody(generateTransparencyReportSchema), euRegulationsController.generateTransparencyReport);
router.get('/ai-act/transparency-reports', ...requireVisionaryFeature('euAiAct'), euRegulationsController.getTransparencyReports);

// ============================================================================
// DMA ROUTES (Visionary tier)
// ============================================================================

router.post('/dma/gatekeepers', ...requireVisionaryFeature('dma'), validateBody(registerGatekeeperSchema), euRegulationsController.registerGatekeeper);
router.get('/dma/gatekeepers', ...requireVisionaryFeature('dma'), euRegulationsController.getGatekeepers);
router.get('/dma/gatekeepers/:id', ...requireVisionaryFeature('dma'), euRegulationsController.getGatekeeper);
router.patch('/dma/gatekeepers/:id', ...requireVisionaryFeature('dma'), validateBody(updateGatekeeperSchema), euRegulationsController.updateGatekeeper);
router.delete('/dma/gatekeepers/:id', ...requireVisionaryFeature('dma'), euRegulationsController.deleteGatekeeper);
router.get('/dma/gatekeepers/:id/obligations', ...requireVisionaryFeature('dma'), euRegulationsController.getObligations);
router.patch('/dma/gatekeepers/:id/obligations/:obligationType', ...requireVisionaryFeature('dma'), validateBody(updateObligationComplianceSchema), euRegulationsController.updateObligationCompliance);
router.get('/dma/gatekeepers/:id/compliance-reports', ...requireVisionaryFeature('dma'), euRegulationsController.getComplianceReports);
router.get('/dma/gatekeepers/:id/compliance-reports/latest', ...requireVisionaryFeature('dma'), euRegulationsController.getLatestComplianceReport);
router.post('/dma/gatekeepers/:id/compliance-reports', ...requireVisionaryFeature('dma'), validateBody(generateDMAComplianceReportSchema), euRegulationsController.generateComplianceReport);

// ============================================================================
// DSA ROUTES (Visionary tier)
// ============================================================================

router.post('/dsa/platforms', ...requireVisionaryFeature('dsa'), validateBody(registerPlatformSchema), euRegulationsController.registerPlatform);
router.get('/dsa/platforms', ...requireVisionaryFeature('dsa'), euRegulationsController.getPlatforms);
router.get('/dsa/platforms/:id', ...requireVisionaryFeature('dsa'), euRegulationsController.getPlatform);
router.patch('/dsa/platforms/:id', ...requireVisionaryFeature('dsa'), validateBody(updatePlatformSchema), euRegulationsController.updatePlatform);
router.delete('/dsa/platforms/:id', ...requireVisionaryFeature('dsa'), euRegulationsController.deletePlatform);
router.get('/dsa/platforms/:id/content-moderation', ...requireVisionaryFeature('dsa'), euRegulationsController.getContentModerationHistory);
router.post('/dsa/platforms/:id/content-moderation', ...requireVisionaryFeature('dsa'), validateBody(recordContentModerationSchema), euRegulationsController.recordContentModeration);
router.post('/dsa/platforms/:id/illegal-content-reports', ...requireVisionaryFeature('dsa'), validateBody(reportIllegalContentSchema), euRegulationsController.reportIllegalContent);
router.patch('/dsa/illegal-content-reports/:id', ...requireVisionaryFeature('dsa'), validateBody(processIllegalContentReportSchema), euRegulationsController.processIllegalContentReport);
router.post('/dsa/platforms/:id/ad-repository', ...requireVisionaryFeature('dsa'), validateBody(addAdToRepositorySchema), euRegulationsController.addAdToRepository);
router.get('/dsa/platforms/:id/ad-repository', ...requireVisionaryFeature('dsa'), euRegulationsController.getAdsFromRepository);
router.get('/dsa/platforms/:id/transparency-reports', ...requireVisionaryFeature('dsa'), euRegulationsController.getDSATransparencyReports);
router.post('/dsa/platforms/:id/transparency-reports', ...requireVisionaryFeature('dsa'), validateBody(generateDSATransparencyReportSchema), euRegulationsController.generateDSATransparencyReport);
router.post('/dsa/platforms/:id/risk-assessments', ...requireVisionaryFeature('dsa'), validateBody(conductDSARiskAssessmentSchema), euRegulationsController.conductDSARiskAssessment);
router.get('/dsa/platforms/:id/risk-assessments', ...requireVisionaryFeature('dsa'), euRegulationsController.getDSARiskAssessments);
router.get('/dsa/platforms/:id/risk-assessments/latest', ...requireVisionaryFeature('dsa'), euRegulationsController.getLatestDSARiskAssessment);
router.patch('/dsa/risk-assessments/:id', ...requireVisionaryFeature('dsa'), validateBody(updateDSARiskAssessmentSchema), euRegulationsController.updateDSARiskAssessment);
router.post('/dsa/platforms/:id/non-personalized-feed', ...requireVisionaryFeature('dsa'), validateBody(configureNonPersonalizedFeedSchema), euRegulationsController.configureNonPersonalizedFeed);
router.get('/dsa/platforms/:id/non-personalized-feed', ...requireVisionaryFeature('dsa'), euRegulationsController.getNonPersonalizedFeed);
router.patch('/dsa/platforms/:id/non-personalized-feed', ...requireVisionaryFeature('dsa'), validateBody(updateNonPersonalizedFeedStatusSchema), euRegulationsController.updateNonPersonalizedFeedStatus);

export default router;
