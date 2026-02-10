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
// EU AI ACT ROUTES
// ============================================================================

router.post('/ai-act/systems', validateBody(registerAISystemSchema), euRegulationsController.registerAISystem);
router.get('/ai-act/systems', euRegulationsController.getAISystems);
router.get('/ai-act/systems/:id', euRegulationsController.getAISystem);
router.patch('/ai-act/systems/:id', validateBody(updateAISystemSchema), euRegulationsController.updateAISystem);
router.delete('/ai-act/systems/:id', euRegulationsController.deleteAISystem);
router.get('/ai-act/systems/:id/assessments', euRegulationsController.getRiskAssessments);
router.get('/ai-act/systems/:id/assessments/latest', euRegulationsController.getLatestRiskAssessment);
router.post('/ai-act/systems/:id/assessments', validateBody(conductAIRiskAssessmentSchema), euRegulationsController.conductRiskAssessment);
router.post('/ai-act/transparency-reports', validateBody(generateTransparencyReportSchema), euRegulationsController.generateTransparencyReport);
router.get('/ai-act/transparency-reports', euRegulationsController.getTransparencyReports);

// ============================================================================
// DMA ROUTES
// ============================================================================

router.post('/dma/gatekeepers', validateBody(registerGatekeeperSchema), euRegulationsController.registerGatekeeper);
router.get('/dma/gatekeepers', euRegulationsController.getGatekeepers);
router.get('/dma/gatekeepers/:id', euRegulationsController.getGatekeeper);
router.patch('/dma/gatekeepers/:id', validateBody(updateGatekeeperSchema), euRegulationsController.updateGatekeeper);
router.delete('/dma/gatekeepers/:id', euRegulationsController.deleteGatekeeper);
router.get('/dma/gatekeepers/:id/obligations', euRegulationsController.getObligations);
router.patch('/dma/gatekeepers/:id/obligations/:obligationType', validateBody(updateObligationComplianceSchema), euRegulationsController.updateObligationCompliance);
router.get('/dma/gatekeepers/:id/compliance-reports', euRegulationsController.getComplianceReports);
router.get('/dma/gatekeepers/:id/compliance-reports/latest', euRegulationsController.getLatestComplianceReport);
router.post('/dma/gatekeepers/:id/compliance-reports', validateBody(generateDMAComplianceReportSchema), euRegulationsController.generateComplianceReport);

// ============================================================================
// DSA ROUTES
// ============================================================================

router.post('/dsa/platforms', validateBody(registerPlatformSchema), euRegulationsController.registerPlatform);
router.get('/dsa/platforms', euRegulationsController.getPlatforms);
router.get('/dsa/platforms/:id', euRegulationsController.getPlatform);
router.patch('/dsa/platforms/:id', validateBody(updatePlatformSchema), euRegulationsController.updatePlatform);
router.delete('/dsa/platforms/:id', euRegulationsController.deletePlatform);
router.get('/dsa/platforms/:id/content-moderation', euRegulationsController.getContentModerationHistory);
router.post('/dsa/platforms/:id/content-moderation', validateBody(recordContentModerationSchema), euRegulationsController.recordContentModeration);
router.post('/dsa/platforms/:id/illegal-content-reports', validateBody(reportIllegalContentSchema), euRegulationsController.reportIllegalContent);
router.patch('/dsa/illegal-content-reports/:id', validateBody(processIllegalContentReportSchema), euRegulationsController.processIllegalContentReport);
router.post('/dsa/platforms/:id/ad-repository', validateBody(addAdToRepositorySchema), euRegulationsController.addAdToRepository);
router.get('/dsa/platforms/:id/ad-repository', euRegulationsController.getAdsFromRepository);
router.get('/dsa/platforms/:id/transparency-reports', euRegulationsController.getDSATransparencyReports);
router.post('/dsa/platforms/:id/transparency-reports', validateBody(generateDSATransparencyReportSchema), euRegulationsController.generateDSATransparencyReport);
router.post('/dsa/platforms/:id/risk-assessments', validateBody(conductDSARiskAssessmentSchema), euRegulationsController.conductDSARiskAssessment);
router.get('/dsa/platforms/:id/risk-assessments', euRegulationsController.getDSARiskAssessments);
router.get('/dsa/platforms/:id/risk-assessments/latest', euRegulationsController.getLatestDSARiskAssessment);
router.patch('/dsa/risk-assessments/:id', validateBody(updateDSARiskAssessmentSchema), euRegulationsController.updateDSARiskAssessment);
router.post('/dsa/platforms/:id/non-personalized-feed', validateBody(configureNonPersonalizedFeedSchema), euRegulationsController.configureNonPersonalizedFeed);
router.get('/dsa/platforms/:id/non-personalized-feed', euRegulationsController.getNonPersonalizedFeed);
router.patch('/dsa/platforms/:id/non-personalized-feed', validateBody(updateNonPersonalizedFeedStatusSchema), euRegulationsController.updateNonPersonalizedFeedStatus);

export default router;
