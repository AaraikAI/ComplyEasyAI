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

// Tier AI Features (Growth+/Visionary)
router.post('/cross-framework-mapping', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.crossFrameworkMapping.bind(aiController)));
router.post('/auto-remediation', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.regulatoryAutoRemediation.bind(aiController)));
router.post('/evidence-completeness', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.checkEvidenceCompleteness.bind(aiController)));
router.post('/agentic-vendor-risk', ...requireAiFeature('aiVendorScorer'), asyncHandler(aiController.agenticVendorRisk.bind(aiController)));
router.post('/audit-simulation', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.simulateAudit.bind(aiController)));
router.post('/nl-query', enforceLimit('maxAiRequestsPerMonth'), asyncHandler(aiController.naturalLanguageQuery.bind(aiController)));
router.post('/copilot', enforceLimit('maxAiRequestsPerMonth'), asyncHandler(aiController.complianceCopilot.bind(aiController)));
router.post('/forecast', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.forecastComplianceScore.bind(aiController)));
router.post('/analyze-process', ...requireAiFeature('aiGapAnalysis'), asyncHandler(aiController.analyzeProcess.bind(aiController)));

export default router;
