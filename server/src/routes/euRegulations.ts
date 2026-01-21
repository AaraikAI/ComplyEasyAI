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
import euRegulationsController from '../controllers/euRegulationsController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EU AI ACT ROUTES
// ============================================================================

router.post('/ai-act/systems', euRegulationsController.registerAISystem);
router.get('/ai-act/systems', euRegulationsController.getAISystems);
router.get('/ai-act/systems/:id', euRegulationsController.getAISystem);
router.patch('/ai-act/systems/:id', euRegulationsController.updateAISystem);
router.delete('/ai-act/systems/:id', euRegulationsController.deleteAISystem);
router.get('/ai-act/systems/:id/assessments', euRegulationsController.getRiskAssessments);
router.get('/ai-act/systems/:id/assessments/latest', euRegulationsController.getLatestRiskAssessment);
router.post('/ai-act/systems/:id/assessments', euRegulationsController.conductRiskAssessment);
router.post('/ai-act/transparency-reports', euRegulationsController.generateTransparencyReport);
router.get('/ai-act/transparency-reports', euRegulationsController.getTransparencyReports);

// ============================================================================
// DMA ROUTES
// ============================================================================

router.post('/dma/gatekeepers', euRegulationsController.registerGatekeeper);
router.get('/dma/gatekeepers', euRegulationsController.getGatekeepers);
router.get('/dma/gatekeepers/:id', euRegulationsController.getGatekeeper);
router.patch('/dma/gatekeepers/:id', euRegulationsController.updateGatekeeper);
router.delete('/dma/gatekeepers/:id', euRegulationsController.deleteGatekeeper);
router.get('/dma/gatekeepers/:id/obligations', euRegulationsController.getObligations);
router.patch('/dma/gatekeepers/:id/obligations/:obligationType', euRegulationsController.updateObligationCompliance);
router.get('/dma/gatekeepers/:id/compliance-reports', euRegulationsController.getComplianceReports);
router.get('/dma/gatekeepers/:id/compliance-reports/latest', euRegulationsController.getLatestComplianceReport);
router.post('/dma/gatekeepers/:id/compliance-reports', euRegulationsController.generateComplianceReport);

// ============================================================================
// DSA ROUTES
// ============================================================================

router.post('/dsa/platforms', euRegulationsController.registerPlatform);
router.get('/dsa/platforms', euRegulationsController.getPlatforms);
router.get('/dsa/platforms/:id', euRegulationsController.getPlatform);
router.patch('/dsa/platforms/:id', euRegulationsController.updatePlatform);
router.delete('/dsa/platforms/:id', euRegulationsController.deletePlatform);
router.get('/dsa/platforms/:id/content-moderation', euRegulationsController.getContentModerationHistory);
router.post('/dsa/platforms/:id/content-moderation', euRegulationsController.recordContentModeration);
router.post('/dsa/platforms/:id/illegal-content-reports', euRegulationsController.reportIllegalContent);
router.patch('/dsa/illegal-content-reports/:id', euRegulationsController.processIllegalContentReport);
router.post('/dsa/platforms/:id/ad-repository', euRegulationsController.addAdToRepository);
router.get('/dsa/platforms/:id/ad-repository', euRegulationsController.getAdsFromRepository);
router.get('/dsa/platforms/:id/transparency-reports', euRegulationsController.getTransparencyReports);
router.post('/dsa/platforms/:id/transparency-reports', euRegulationsController.generateDSATransparencyReport);
router.post('/dsa/platforms/:id/risk-assessments', euRegulationsController.conductDSARiskAssessment);
router.get('/dsa/platforms/:id/risk-assessments', euRegulationsController.getDSARiskAssessments);
router.get('/dsa/platforms/:id/risk-assessments/latest', euRegulationsController.getLatestDSARiskAssessment);
router.patch('/dsa/risk-assessments/:id', euRegulationsController.updateDSARiskAssessment);
router.post('/dsa/platforms/:id/non-personalized-feed', euRegulationsController.configureNonPersonalizedFeed);
router.get('/dsa/platforms/:id/non-personalized-feed', euRegulationsController.getNonPersonalizedFeed);
router.patch('/dsa/platforms/:id/non-personalized-feed', euRegulationsController.updateNonPersonalizedFeedStatus);

export default router;

