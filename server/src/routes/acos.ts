import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody, validateMultipartBody, validateParams } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import {
  createGoalSchema,
  updateGoalSchema,
  createControlLoopSchema,
  updateControlLoopSchema,
  estimateBlastRadiusSchema,
  executeActionSchema,
  rollbackMultipleSchema,
  chainOfCustodySchema,
  bulkAnalyzeEvidenceSchema,
  evidenceIdParamSchema,
  analyzeAndAnchorSchema,
  verifyFileHashSchema,
  verifyEvidenceSignatureSchema,
  multiPartyAttestationSchema,
  addFeedSchema,
  resolveConflictSchema,
  runSimulationSchema,
  compareScenariosSchema,
  runMonteCarloSchema,
  runRedTeamSimulationSchema,
  runAutomatedScanSchema,
  scheduleScanSchema,
  compareScanResultsSchema,
  markFalsePositiveSchema,
  joinFederationSchema,
  contributeToFederationSchema,
  createVRSessionSchema,
  vrAnnotationSchema,
  vrChatMessageSchema,
  createVRTrainingScenarioSchema,
  requestJITAccessSchema,
  registerSwarmAgentSchema,
  updateSwarmAgentStatusSchema,
  submitSwarmTaskSchema,
  bulkSubmitSwarmTasksSchema,
  trackComplianceDebtSchema,
  calculateDebtFromGapSchema,
  forecastChangeImpactSchema,
  hybridReasoningSchema,
  generateHomomorphicKeysSchema,
  encryptDataSchema,
  decryptDataSchema,
  registerDeviceSchema,
  bulkRegisterDevicesSchema,
} from '../validators/acosSchemas';
import acosController from '../controllers/acosController';
import multer from 'multer';
import { requireAcosFeature, requireVisionaryFeature, requireFeature } from '../middleware/tierMiddleware';

const router = Router();
// Allowlist for aCOS evidence uploads — covers documents, images, audio, and
// video that the evidence/multimodal pipelines accept. Reject any other MIME
// to defend against malware/masquerade. Per audit COV-17 §5.5.17.
const ACOS_ALLOWED_MIMES = new Set<string>([
  // documents
  'application/pdf',
  'application/json',
  'application/xml',
  'text/plain',
  'text/csv',
  'text/xml',
  'text/markdown',
  // images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  // video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max for audio/video/evidence files
  fileFilter: (_req, file, cb) => {
    if (ACOS_ALLOWED_MIMES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 415));
    }
  },
});

// All routes require authentication and Growth+ tier for aCOS features
router.use(authenticate);

// aCOS Goals (Growth+)
router.post('/goals', ...requireAcosFeature('acosGoals'), authorize('admin', 'editor'), validateBody(createGoalSchema), asyncHandler(acosController.createGoal));
router.get('/goals', ...requireAcosFeature('acosGoals'), asyncHandler(acosController.getGoals));
router.get('/goals/:goalId', ...requireAcosFeature('acosGoals'), asyncHandler(acosController.getGoal));
router.patch('/goals/:goalId', ...requireAcosFeature('acosGoals'), authorize('admin', 'editor'), validateBody(updateGoalSchema), asyncHandler(acosController.updateGoal));
router.delete('/goals/:goalId', ...requireAcosFeature('acosGoals'), authorize('admin', 'editor'), asyncHandler(acosController.deleteGoal));
router.post('/goals/:goalId/restore', ...requireAcosFeature('acosGoals'), authorize('admin', 'editor'), asyncHandler(acosController.restoreGoal));

// Control Loops (Growth+)
router.post('/control-loops', ...requireAcosFeature('acosControlLoops'), authorize('admin', 'editor'), validateBody(createControlLoopSchema), asyncHandler(acosController.createControlLoop));
router.get('/control-loops/:loopId', ...requireAcosFeature('acosControlLoops'), asyncHandler(acosController.getControlLoop));
router.get('/control-loops/:loopId/history', ...requireAcosFeature('acosControlLoops'), asyncHandler(acosController.getControlLoopHistory));
router.post('/control-loops/:loopId/execute', ...requireAcosFeature('acosControlLoops'), authorize('admin', 'editor'), asyncHandler(acosController.executeControlLoop));
router.post('/control-loops/:loopId/pause', ...requireAcosFeature('acosControlLoops'), authorize('admin', 'editor'), asyncHandler(acosController.pauseControlLoop));
router.post('/control-loops/:loopId/resume', ...requireAcosFeature('acosControlLoops'), authorize('admin', 'editor'), asyncHandler(acosController.resumeControlLoop));
router.patch('/control-loops/:loopId', ...requireAcosFeature('acosControlLoops'), authorize('admin', 'editor'), validateBody(updateControlLoopSchema), asyncHandler(acosController.updateControlLoop));
router.delete('/control-loops/:loopId', ...requireAcosFeature('acosControlLoops'), authorize('admin', 'editor'), asyncHandler(acosController.deleteControlLoop));

// Agentic AI (Growth+)
router.post('/agentic/estimate-blast-radius', ...requireAcosFeature('acosAgenticActions'), authorize('admin', 'editor'), validateBody(estimateBlastRadiusSchema), asyncHandler(acosController.estimateBlastRadius));
router.post('/agentic/execute-action', ...requireAcosFeature('acosAgenticActions'), authorize('admin', 'editor'), validateBody(executeActionSchema), asyncHandler(acosController.executeAction));
router.post('/agentic/rollback/:actionId', ...requireAcosFeature('acosAgenticActions'), authorize('admin'), asyncHandler(acosController.rollbackAction));
router.post('/agentic/rollback-multiple', ...requireAcosFeature('acosAgenticActions'), authorize('admin'), validateBody(rollbackMultipleSchema), asyncHandler(acosController.rollbackMultipleActions));

// Evidence Truth Layer (Growth+ — all routes gated by acosEvidenceTruth)
// Static path: /anchor-sla must precede /:evidenceId routes so Express does not consume "anchor-sla" as an evidenceId.
router.get('/evidence/anchor-sla', ...requireAcosFeature('acosEvidenceTruth'), authorize('admin'), asyncHandler(acosController.getAnchorSLA));

router.post('/evidence/bulk-analyze', ...requireAcosFeature('acosEvidenceTruth'), authorize('admin', 'editor'), validateBody(bulkAnalyzeEvidenceSchema), asyncHandler(acosController.bulkAnalyzeEvidence));
router.post('/evidence/verify-hash', ...requireAcosFeature('acosEvidenceTruth'), upload.single('file'), validateMultipartBody(verifyFileHashSchema), asyncHandler(acosController.verifyFileHash));
router.post('/evidence/sign', ...requireAcosFeature('acosEvidenceTruth'), upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.signEvidence));
router.post('/evidence/verify-signature', ...requireAcosFeature('acosEvidenceTruth'), upload.single('file'), validateMultipartBody(verifyEvidenceSignatureSchema), asyncHandler(acosController.verifyEvidenceSignature));
router.post('/evidence/timestamp', ...requireAcosFeature('acosEvidenceTruth'), upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.timestampEvidence));
router.post('/evidence/chain-of-custody', ...requireAcosFeature('acosEvidenceTruth'), authorize('admin', 'editor'), validateBody(chainOfCustodySchema), asyncHandler(acosController.createChainOfCustody));
router.post('/evidence/multi-party-attestation', ...requireAcosFeature('acosEvidenceTruth'), upload.single('file'), authorize('admin', 'editor'), validateMultipartBody(multiPartyAttestationSchema, { jsonFields: ['parties'] }), asyncHandler(acosController.createMultiPartyAttestation));

router.post('/evidence/:evidenceId/analyze', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), upload.single('file'), asyncHandler(acosController.analyzeEvidence));
router.get('/evidence/:evidenceId/analysis', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), asyncHandler(acosController.getEvidenceAnalysis));
router.post('/evidence/:evidenceId/reanalyze', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.reanalyzeEvidence));
router.get('/evidence/:evidenceId/analysis/history', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), asyncHandler(acosController.getAnalysisHistory));
router.get('/evidence/:evidenceId/analysis/export', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), asyncHandler(acosController.exportAnalysisReport));

router.post('/evidence/:evidenceId/analyze-and-anchor', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), authorize('admin', 'editor'), upload.single('file'), validateMultipartBody(analyzeAndAnchorSchema), asyncHandler(acosController.analyzeAndAnchor));
router.post('/evidence/:evidenceId/verify-integrity', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), upload.single('file'), asyncHandler(acosController.verifyIntegrity));
router.get('/evidence/:evidenceId/provenance', ...requireAcosFeature('acosEvidenceTruth'), validateParams(evidenceIdParamSchema), asyncHandler(acosController.getProvenance));

// Regulatory Intelligence Fabric (Growth+)
router.post('/rif/ingest-regulation', ...requireAcosFeature('acosRegulatoryIntelligence'), authorize('admin'), upload.single('file'), asyncHandler(acosController.ingestRegulation));
router.post('/rif/detect-changes', authorize('admin'), asyncHandler(acosController.detectRegulatoryChanges));
router.post('/rif/:regulatoryChangeId/auto-update', authorize('admin'), asyncHandler(acosController.autoUpdateControls));
router.post('/rif/auto-update/rollback', authorize('admin'), asyncHandler(acosController.rollbackAutoUpdate));
router.post('/rif/auto-update/batch', authorize('admin'), asyncHandler(acosController.batchAutoUpdate));
router.post('/rif/conflicts/bulk-analysis', authorize('admin'), asyncHandler(acosController.bulkConflictAnalysis));
router.get('/rif/conflicts/history', asyncHandler(acosController.getConflictHistory));
router.post('/rif/conflicts/:conflictId/resolve', authorize('admin'), validateBody(resolveConflictSchema), asyncHandler(acosController.resolveConflict));
router.post('/rif/feeds', authorize('admin'), validateBody(addFeedSchema), asyncHandler(acosController.addFeed));
router.delete('/rif/feeds/:feedId', authorize('admin'), asyncHandler(acosController.removeFeed));
router.get('/rif/feeds/dashboard', asyncHandler(acosController.getFeedStatusDashboard));

// Temporal Graph Networks — trajectory + early-warnings (Growth+, gated by acosTemporalGraphs)
router.get('/tgn/frameworks/:frameworkId/trajectory', ...requireAcosFeature('acosTemporalGraphs'), asyncHandler(acosController.predictComplianceTrajectory));
router.get('/tgn/early-warnings', ...requireAcosFeature('acosTemporalGraphs'), asyncHandler(acosController.getEarlyWarnings));

// Risk Prediction routes (Visionary, gated by acosRiskPrediction)
router.get('/tgn/predict-risks', ...requireAcosFeature('acosRiskPrediction'), asyncHandler(acosController.predictFutureRisks));
router.post('/tgn/refresh-risk-predictions', ...requireAcosFeature('acosRiskPrediction'), asyncHandler(acosController.refreshRiskPredictions));

// Compliance Digital Twin (Growth+)
router.post('/digital-twin/simulate', ...requireAcosFeature('acosDigitalTwin'), authorize('admin', 'editor'), validateBody(runSimulationSchema), asyncHandler(acosController.runSimulation));
router.post('/digital-twin/simulate/with-constraints', authorize('admin', 'editor'), validateBody(runSimulationSchema), asyncHandler(acosController.runSimulationWithConstraints));
router.post('/digital-twin/compare-scenarios', authorize('admin', 'editor'), validateBody(compareScenariosSchema), asyncHandler(acosController.compareScenarios));
router.post('/digital-twin/simulations/:scenarioId/save-state', authorize('admin', 'editor'), asyncHandler(acosController.saveSimulationState));
router.get('/digital-twin/simulations/:scenarioId/load-state', asyncHandler(acosController.loadSimulationState));
router.post('/digital-twin/simulations/:scenarioId/rollback', authorize('admin', 'editor'), asyncHandler(acosController.rollbackSimulation));
router.post('/digital-twin/monte-carlo', authorize('admin', 'editor'), validateBody(runMonteCarloSchema), asyncHandler(acosController.runMonteCarlo));

// Red Teaming (Growth+)
router.post('/red-team/simulate', ...requireAcosFeature('acosRedTeam'), authorize('admin'), validateBody(runRedTeamSimulationSchema), asyncHandler(acosController.runRedTeamSimulation));
router.post('/red-team/automated-scan', authorize('admin'), validateBody(runAutomatedScanSchema), asyncHandler(acosController.runAutomatedScan));
router.get('/red-team/compliance-gaps', authorize('admin'), asyncHandler(acosController.scanForComplianceGaps));
router.get('/red-team/misconfigurations', authorize('admin'), asyncHandler(acosController.scanForMisconfigurations));
router.get('/red-team/policy-violations', authorize('admin'), asyncHandler(acosController.scanForPolicyViolations));
router.post('/red-team/schedule', authorize('admin'), validateBody(scheduleScanSchema), asyncHandler(acosController.scheduleScan));
router.post('/red-team/export-results', authorize('admin'), asyncHandler(acosController.exportScanResults));
router.post('/red-team/compare-results', authorize('admin'), validateBody(compareScanResultsSchema), asyncHandler(acosController.compareScanResults));
router.post('/red-team/mark-false-positive', authorize('admin'), validateBody(markFalsePositiveSchema), asyncHandler(acosController.markFalsePositive));

// Federated Swarm (Growth+)
router.post('/swarm/join', ...requireAcosFeature('acosFederatedLearning'), authorize('admin'), validateBody(joinFederationSchema), asyncHandler(acosController.joinFederation));
router.post('/swarm/leave', authorize('admin'), asyncHandler(acosController.leaveFederation));
router.post('/swarm/contribute', authorize('admin'), validateBody(contributeToFederationSchema), asyncHandler(acosController.contributeToFederation));
router.get('/swarm/receive-model', asyncHandler(acosController.receiveFederatedModel));
router.post('/swarm/recover', authorize('admin'), asyncHandler(acosController.recoverFederation));
router.get('/swarm/insights', asyncHandler(acosController.getSwarmInsights));
router.get('/swarm/insights/industry', asyncHandler(acosController.getIndustryInsights));
router.get('/swarm/insights/sector', asyncHandler(acosController.getSectorInsights));
router.get('/swarm/insights/frameworks/:frameworkId', asyncHandler(acosController.getFrameworkInsights));
router.get('/swarm/benchmark', asyncHandler(acosController.benchmarkAgainstPeers));
router.get('/swarm/trends', asyncHandler(acosController.identifyTrends));
router.post('/swarm/insights/export', asyncHandler(acosController.exportInsights));
router.post('/swarm/model/rollback', authorize('admin'), asyncHandler(acosController.rollbackModel));
router.post('/swarm/model/distribute', authorize('admin'), asyncHandler(acosController.distributeModel));
router.get('/swarm/model/audit-trail', asyncHandler(acosController.getModelAuditTrail));

// Multi-modal Intake (Growth+)
router.post('/multimodal/transcribe-audio', ...requireAcosFeature('acosMultiModal'), upload.single('audio'), asyncHandler(acosController.transcribeAudio));
router.post('/multimodal/analyze-video', ...requireAcosFeature('acosMultiModal'), upload.single('video'), asyncHandler(acosController.analyzeVideo));

// Physical AI (Visionary)
router.post('/physical-ai/register-device', ...requireVisionaryFeature('acosPhysicalAi'), authorize('admin'), validateBody(registerDeviceSchema), asyncHandler(acosController.registerDevice));
router.post('/physical-ai/bulk-register', authorize('admin'), validateBody(bulkRegisterDevicesSchema), asyncHandler(acosController.bulkRegisterDevices));
router.delete('/physical-ai/devices/:deviceId', authorize('admin'), asyncHandler(acosController.deregisterDevice));
router.get('/physical-ai/devices', asyncHandler(acosController.getDevices));
router.post('/physical-ai/devices/:deviceId/compliance-check', authorize('admin'), asyncHandler(acosController.performEdgeComplianceCheck));
router.get('/physical-ai/devices/:deviceId/heartbeat', asyncHandler(acosController.monitorDeviceHeartbeat));
router.get('/physical-ai/devices/offline', asyncHandler(acosController.detectOfflineDevices));
router.get('/physical-ai/devices/:deviceId/battery', asyncHandler(acosController.monitorBatteryLevel));
router.get('/physical-ai/devices/:deviceId/connectivity', asyncHandler(acosController.monitorConnectivity));
router.get('/physical-ai/devices/:deviceId/firmware', asyncHandler(acosController.trackFirmwareVersion));
router.get('/physical-ai/health/dashboard', asyncHandler(acosController.getHealthDashboard));
router.get('/physical-ai/devices/:deviceId/health/history', asyncHandler(acosController.getHealthHistory));
router.get('/physical-ai/devices/:deviceId/predictive-maintenance', asyncHandler(acosController.performPredictiveMaintenance));
router.get('/physical-ai/health/bulk-check', asyncHandler(acosController.bulkHealthCheck));

// VR Collaborative Review (Visionary)
router.post('/vr/sessions', ...requireVisionaryFeature('acosVrTraining'), authorize('admin', 'editor'), validateBody(createVRSessionSchema), asyncHandler(acosController.createVRSession));
router.get('/vr/sessions', asyncHandler(acosController.getActiveVRSessions));
router.get('/vr/sessions/:sessionId', asyncHandler(acosController.getVRSessionDetails));
router.get('/vr/sessions/:sessionId/health', asyncHandler(acosController.checkVRSessionHealth));
router.post('/vr/sessions/:sessionId/join', asyncHandler(acosController.joinVRSession));
router.post('/vr/sessions/:sessionId/leave', asyncHandler(acosController.leaveVRSession));
router.post('/vr/sessions/:sessionId/start', authorize('admin', 'editor'), asyncHandler(acosController.startVRSession));
router.post('/vr/sessions/:sessionId/end', authorize('admin', 'editor'), asyncHandler(acosController.endVRSession));
router.post('/vr/sessions/:sessionId/annotations', validateBody(vrAnnotationSchema), asyncHandler(acosController.addVRAnnotation));
router.post('/vr/sessions/:sessionId/annotations/voice', asyncHandler(acosController.addVRVoiceAnnotation));
router.put('/vr/sessions/:sessionId/annotations/:annotationId', validateBody(vrAnnotationSchema), asyncHandler(acosController.editVRAnnotation));
router.delete('/vr/sessions/:sessionId/annotations/:annotationId', asyncHandler(acosController.deleteVRAnnotation));
router.get('/vr/sessions/:sessionId/annotations/:annotationId/history', asyncHandler(acosController.getVRAnnotationHistory));
router.get('/vr/sessions/:sessionId/annotations/export', asyncHandler(acosController.exportVRAnnotations));
router.post('/vr/sessions/:sessionId/chat', validateBody(vrChatMessageSchema), asyncHandler(acosController.sendVRChatMessage));
router.get('/vr/sessions/:sessionId/chat', asyncHandler(acosController.getVRChatHistory));
router.post('/vr/sessions/:sessionId/voice-chat/toggle', asyncHandler(acosController.toggleVRVoiceChat));
router.post('/vr/sessions/:sessionId/participants/:userId/mute', asyncHandler(acosController.muteVRParticipant));
router.post('/vr/sessions/:sessionId/pointer', asyncHandler(acosController.updateVRPointer));
router.post('/vr/sessions/:sessionId/screen-sharing/enable', asyncHandler(acosController.enableVRScreenSharing));
router.post('/vr/sessions/:sessionId/screen-sharing/disable', asyncHandler(acosController.disableVRScreenSharing));
router.post('/vr/sessions/:sessionId/follow/:targetUserId', asyncHandler(acosController.enableVRFollowMode));
router.post('/vr/sessions/:sessionId/follow/disable', asyncHandler(acosController.disableVRFollowMode));
router.post('/vr/sessions/:sessionId/presenter-mode', asyncHandler(acosController.enableVRPresenterMode));
router.post('/vr/sessions/:sessionId/environment/update', asyncHandler(acosController.updateVREnvironment));
router.post('/vr/sessions/:sessionId/environment/theme', asyncHandler(acosController.setVREnvironmentTheme));
router.post('/vr/training/scenarios', authorize('admin'), validateBody(createVRTrainingScenarioSchema), asyncHandler(acosController.createVRTrainingScenario));
router.post('/vr/training/scenarios/:scenarioId/start', asyncHandler(acosController.startVRTraining));
router.post('/vr/training/sessions/:sessionId/progress', asyncHandler(acosController.trackVRTrainingProgress));
router.get('/vr/training/sessions/:sessionId/evaluate', asyncHandler(acosController.evaluateVRTraining));
router.post('/vr/training/sessions/:sessionId/complete', asyncHandler(acosController.completeVRTraining));
router.get('/vr/training/history', asyncHandler(acosController.getVRTrainingHistory));

// JIT Access (Visionary)
router.post('/jit/request', ...requireVisionaryFeature('acosJitCompliance'), authorize('admin', 'editor'), validateBody(requestJITAccessSchema), asyncHandler(acosController.requestJITAccess));
router.get('/jit/sessions', asyncHandler(acosController.getJITAccessSessions));
router.post('/jit/sessions/:sessionId/revoke', authorize('admin'), asyncHandler(acosController.revokeJITSession));
router.post('/jit/requests/:requestId/cancel', asyncHandler(acosController.cancelJITAccessRequest));

// Admin JIT Access Approval Workflow
router.get('/jit/requests/pending', authorize('admin'), asyncHandler(acosController.getPendingJITAccessRequests));
router.get('/jit/requests', authorize('admin'), asyncHandler(acosController.getAllJITAccessRequests));
router.post('/jit/requests/:requestId/approve', authorize('admin'), asyncHandler(acosController.approveJITAccessRequest));
router.post('/jit/requests/:requestId/deny', authorize('admin'), asyncHandler(acosController.denyJITAccessRequest));

// Swarm Task Allocation
router.post('/swarm-tasks/agents', authorize('admin'), validateBody(registerSwarmAgentSchema), asyncHandler(acosController.registerSwarmAgent));
router.get('/swarm-tasks/agents', asyncHandler(acosController.getSwarmAgents));
router.get('/swarm-tasks/agents/:agentId', asyncHandler(acosController.getSwarmAgentById));
router.put('/swarm-tasks/agents/:agentId/status', authorize('admin'), validateBody(updateSwarmAgentStatusSchema), asyncHandler(acosController.updateSwarmAgentStatus));
router.post('/swarm-tasks/agents/:agentId/deactivate', authorize('admin'), asyncHandler(acosController.deactivateSwarmAgent));
router.post('/swarm-tasks/agents/:agentId/reactivate', authorize('admin'), asyncHandler(acosController.reactivateSwarmAgent));
router.get('/swarm-tasks/agents/:agentId/workload', asyncHandler(acosController.getSwarmAgentWorkload));
router.post('/swarm-tasks', authorize('admin', 'editor'), validateBody(submitSwarmTaskSchema), asyncHandler(acosController.submitSwarmTask));
router.post('/swarm-tasks/bulk', authorize('admin', 'editor'), validateBody(bulkSubmitSwarmTasksSchema), asyncHandler(acosController.bulkSubmitSwarmTasks));
router.get('/swarm-tasks', asyncHandler(acosController.getAllSwarmTasks));
router.get('/swarm-tasks/active', asyncHandler(acosController.getActiveSwarmTasks));
router.get('/swarm-tasks/:taskId', asyncHandler(acosController.getSwarmTaskStatus));
router.post('/swarm-tasks/:taskId/cancel', authorize('admin'), asyncHandler(acosController.cancelSwarmTask));
router.post('/swarm-tasks/:taskId/agents/:agentId/progress', asyncHandler(acosController.reportSwarmTaskProgress));
router.post('/swarm-tasks/:taskId/agents/:agentId/complete', asyncHandler(acosController.completeSwarmTask));
router.get('/swarm-tasks/metrics', asyncHandler(acosController.getSwarmMetrics));
router.get('/swarm-tasks/metrics/history', asyncHandler(acosController.getSwarmHistoricalMetrics));
router.get('/swarm-tasks/metrics/alerts', asyncHandler(acosController.getSwarmMetricAlerts));
router.post('/swarm-tasks/metrics/alerts/:alertId/resolve', authorize('admin'), asyncHandler(acosController.resolveSwarmMetricAlert));
router.get('/swarm-tasks/metrics/export', asyncHandler(acosController.exportSwarmMetrics));
router.get('/swarm-tasks/dashboard', asyncHandler(acosController.getSwarmDashboard));

// Federated Swarm Extended
router.get('/swarm/federation-status', asyncHandler(acosController.getFederationStatus));
router.post('/swarm/participate', authorize('admin'), asyncHandler(acosController.participateInSwarm));

// Regulatory Intelligence Fabric Extended
router.get('/rif/changes', asyncHandler(acosController.getRegulatoryChanges));
router.post('/rif/monitor-feeds', authorize('admin'), asyncHandler(acosController.monitorRegulatoryFeeds));

// aCOS Extended
router.get('/control-loops', asyncHandler(acosController.getControlLoops));
router.get('/compliance-debts', asyncHandler(acosController.getComplianceDebts));
router.post('/compliance-debts', authorize('admin', 'editor'), validateBody(trackComplianceDebtSchema), asyncHandler(acosController.trackComplianceDebt));
router.post('/compliance-debts/calculate-from-gap', authorize('admin', 'editor'), validateBody(calculateDebtFromGapSchema), asyncHandler(acosController.calculateDebtFromGapAnalysis));
router.post('/compliance-debts/:debtId/resolve', authorize('admin', 'editor'), asyncHandler(acosController.resolveComplianceDebt));
router.get('/compliance-debts/export', authorize('admin', 'editor'), asyncHandler(acosController.exportDebtReport));
router.get('/change-impacts', asyncHandler(acosController.getChangeImpacts));
router.post('/change-impacts/forecast', authorize('admin', 'editor'), validateBody(forecastChangeImpactSchema), asyncHandler(acosController.forecastChangeImpact));
router.post('/change-impacts/:impactId/resolve', authorize('admin', 'editor'), asyncHandler(acosController.resolveChangeImpact));

// NeuroSymbolic AI (Visionary)
router.post('/neuro-symbolic/hybrid-reasoning', ...requireVisionaryFeature('acosNeuroSymbolic'), authorize('admin', 'editor'), validateBody(hybridReasoningSchema), asyncHandler(acosController.performHybridReasoning));
router.post('/neuro-symbolic/infer-rules', authorize('admin', 'editor'), asyncHandler(acosController.inferRulesFromPatterns));
router.post('/neuro-symbolic/causal-reasoning', authorize('admin', 'editor'), asyncHandler(acosController.performCausalReasoning));
router.post('/neuro-symbolic/explainable-decision', authorize('admin', 'editor'), asyncHandler(acosController.generateExplainableDecision));
router.get('/neuro-symbolic/reasoning-history', asyncHandler(acosController.getReasoningHistory));
router.post('/neuro-symbolic/inferences/:inferenceId/validate', authorize('admin', 'editor'), asyncHandler(acosController.validateInferredRule));

// Homomorphic AI (Visionary)
router.post('/homomorphic/keys/generate', ...requireVisionaryFeature('acosHomomorphicEncryption'), authorize('admin', 'editor'), validateBody(generateHomomorphicKeysSchema), asyncHandler(acosController.generateHomomorphicKeys));
router.post('/homomorphic/encrypt', authorize('admin', 'editor'), validateBody(encryptDataSchema), asyncHandler(acosController.encryptData));
router.post('/homomorphic/decrypt', authorize('admin', 'editor'), validateBody(decryptDataSchema), asyncHandler(acosController.decryptData));
router.post('/homomorphic/linear-regression', authorize('admin', 'editor'), asyncHandler(acosController.performEncryptedLinearRegression));
router.post('/homomorphic/statistics', authorize('admin', 'editor'), asyncHandler(acosController.computeEncryptedStatistics));
router.post('/homomorphic/neural-network', authorize('admin', 'editor'), asyncHandler(acosController.performEncryptedNeuralNetwork));

export default router;

