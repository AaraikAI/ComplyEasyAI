import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../types/express';
import { requireFeature, enforceLimit, requireAiFeature } from '../middleware/tierMiddleware';
import { validateBody } from '../middleware/validate';
import {
  aiReportSchema,
  aiPolicySchema,
  aiGapAnalysisSchema,
  aiChatSchema,
  aiContractSchema,
  aiRfpSchema,
  aiPhishingSchema,
  aiVendorScoreSchema,
  aiDataMapSchema,
  aiBcpSchema,
  aiCrossFrameworkSchema,
  aiAutoRemediationSchema,
  aiEvidenceCompletenessSchema,
  aiAgenticVendorRiskSchema,
  aiAuditSimulationSchema,
  aiNlQuerySchema,
  aiCopilotSchema,
  aiForecastSchema,
  aiAnalyzeProcessSchema,
} from '../validators/aiSchemas';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

// Basic AI features (Foundation+)
router.post('/report', ...requireAiFeature('aiPolicyGeneration'), validateBody(aiReportSchema), asyncHandler(aiController.generateReport.bind(aiController)));
router.post('/policy', ...requireAiFeature('aiPolicyGeneration'), validateBody(aiPolicySchema), asyncHandler(aiController.generatePolicy.bind(aiController)));
router.post('/gap-analysis', ...requireAiFeature('aiGapAnalysis'), validateBody(aiGapAnalysisSchema), asyncHandler(aiController.performGapAnalysis.bind(aiController)));
router.post('/chat', enforceLimit('maxAiRequestsPerMonth'), validateBody(aiChatSchema), asyncHandler(aiController.chat.bind(aiController)));

// Full AI features (Essentials+)
router.post('/contract', ...requireAiFeature('aiContractAnalyzer'), validateBody(aiContractSchema), asyncHandler(aiController.analyzeContract.bind(aiController)));
router.post('/rfp', ...requireAiFeature('aiRfpGenerator'), validateBody(aiRfpSchema), asyncHandler(aiController.generateRFPResponse.bind(aiController)));
router.post('/phishing', ...requireAiFeature('aiPhishingSimulator'), validateBody(aiPhishingSchema), asyncHandler(aiController.generatePhishing.bind(aiController)));
router.post('/vendor-score', ...requireAiFeature('aiVendorScorer'), validateBody(aiVendorScoreSchema), asyncHandler(aiController.scoreVendor.bind(aiController)));
router.post('/data-map', ...requireAiFeature('aiDataMapper'), validateBody(aiDataMapSchema), asyncHandler(aiController.generateDataMap.bind(aiController)));
router.post('/bcp', ...requireAiFeature('aiBcpGenerator'), validateBody(aiBcpSchema), asyncHandler(aiController.generateBCP.bind(aiController)));

// Tier AI Features (Growth+/Visionary)
router.post('/cross-framework-mapping', ...requireAiFeature('aiGapAnalysis'), validateBody(aiCrossFrameworkSchema), asyncHandler(aiController.crossFrameworkMapping.bind(aiController)));
router.post('/auto-remediation', ...requireAiFeature('aiGapAnalysis'), validateBody(aiAutoRemediationSchema), asyncHandler(aiController.regulatoryAutoRemediation.bind(aiController)));
router.post('/evidence-completeness', ...requireAiFeature('aiGapAnalysis'), validateBody(aiEvidenceCompletenessSchema), asyncHandler(aiController.checkEvidenceCompleteness.bind(aiController)));
router.post('/agentic-vendor-risk', ...requireAiFeature('aiVendorScorer'), validateBody(aiAgenticVendorRiskSchema), asyncHandler(aiController.agenticVendorRisk.bind(aiController)));
router.post('/audit-simulation', ...requireAiFeature('aiGapAnalysis'), validateBody(aiAuditSimulationSchema), asyncHandler(aiController.simulateAudit.bind(aiController)));
router.post('/nl-query', enforceLimit('maxAiRequestsPerMonth'), validateBody(aiNlQuerySchema), asyncHandler(aiController.naturalLanguageQuery.bind(aiController)));
router.post('/copilot', enforceLimit('maxAiRequestsPerMonth'), validateBody(aiCopilotSchema), asyncHandler(aiController.complianceCopilot.bind(aiController)));
router.post('/forecast', ...requireAiFeature('aiGapAnalysis'), validateBody(aiForecastSchema), asyncHandler(aiController.forecastComplianceScore.bind(aiController)));
router.post('/analyze-process', ...requireAiFeature('aiGapAnalysis'), validateBody(aiAnalyzeProcessSchema), asyncHandler(aiController.analyzeProcess.bind(aiController)));

export default router;
