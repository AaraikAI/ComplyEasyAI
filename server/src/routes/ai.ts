import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../types/express';
import { requireFeature, enforceLimit, requireAiFeature } from '../middleware/tierMiddleware';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

// Basic AI features (Foundation+)
router.post('/report', ...requireAiFeature('aiPolicyGeneration'), asyncHandler(aiController.generateReport.bind(aiController)));
router.post('/policy', ...requireAiFeature('aiPolicyGeneration'), asyncHandler(aiController.generatePolicy.bind(aiController)));
router.post('/gap-analysis', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.performGapAnalysis.bind(aiController)));
router.post('/chat', enforceLimit('maxAiRequestsPerMonth'), asyncHandler(aiController.chat.bind(aiController)));

// Full AI features (Essentials+)
router.post('/contract', ...requireAiFeature('aiContractAnalyzer'), asyncHandler(aiController.analyzeContract.bind(aiController)));
router.post('/rfp', ...requireAiFeature('aiRfpGenerator'), asyncHandler(aiController.generateRFPResponse.bind(aiController)));
router.post('/phishing', ...requireAiFeature('aiPhishingSimulator'), asyncHandler(aiController.generatePhishing.bind(aiController)));
router.post('/vendor-score', ...requireAiFeature('aiVendorScorer'), asyncHandler(aiController.scoreVendor.bind(aiController)));
router.post('/data-map', ...requireAiFeature('aiDataMapper'), asyncHandler(aiController.generateDataMap.bind(aiController)));
router.post('/bcp', ...requireAiFeature('aiBcpGenerator'), asyncHandler(aiController.generateBCP.bind(aiController)));

export default router;
