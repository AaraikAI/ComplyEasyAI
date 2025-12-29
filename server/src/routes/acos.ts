import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import acosController from '../controllers/acosController';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// aCOS Goals
router.post('/goals', authorize('admin', 'editor'), asyncHandler(acosController.createGoal));
router.get('/goals', asyncHandler(acosController.getGoals));
router.get('/goals/:goalId', asyncHandler(acosController.getGoal));
router.patch('/goals/:goalId', authorize('admin', 'editor'), asyncHandler(acosController.updateGoal));
router.delete('/goals/:goalId', authorize('admin', 'editor'), asyncHandler(acosController.deleteGoal));
router.post('/goals/:goalId/restore', authorize('admin', 'editor'), asyncHandler(acosController.restoreGoal));

// Control Loops
router.post('/control-loops', authorize('admin', 'editor'), asyncHandler(acosController.createControlLoop));
router.get('/control-loops/:loopId', asyncHandler(acosController.getControlLoop));
router.get('/control-loops/:loopId/history', asyncHandler(acosController.getControlLoopHistory));
router.post('/control-loops/:loopId/execute', authorize('admin', 'editor'), asyncHandler(acosController.executeControlLoop));
router.post('/control-loops/:loopId/pause', authorize('admin', 'editor'), asyncHandler(acosController.pauseControlLoop));
router.post('/control-loops/:loopId/resume', authorize('admin', 'editor'), asyncHandler(acosController.resumeControlLoop));
router.patch('/control-loops/:loopId', authorize('admin', 'editor'), asyncHandler(acosController.updateControlLoop));
router.delete('/control-loops/:loopId', authorize('admin', 'editor'), asyncHandler(acosController.deleteControlLoop));

// Agentic AI
router.post('/agentic/estimate-blast-radius', authorize('admin', 'editor'), asyncHandler(acosController.estimateBlastRadius));
router.post('/agentic/execute-action', authorize('admin', 'editor'), asyncHandler(acosController.executeAction));
router.post('/agentic/rollback/:actionId', authorize('admin'), asyncHandler(acosController.rollbackAction));
router.post('/agentic/rollback-multiple', authorize('admin'), asyncHandler(acosController.rollbackMultipleActions));

// Evidence Truth Layer
router.post('/evidence/:evidenceId/analyze', upload.single('file'), asyncHandler(acosController.analyzeEvidence));
router.get('/evidence/:evidenceId/analysis', asyncHandler(acosController.getEvidenceAnalysis));
router.post('/evidence/:evidenceId/reanalyze', upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.reanalyzeEvidence));
router.get('/evidence/:evidenceId/analysis/history', asyncHandler(acosController.getAnalysisHistory));
router.post('/evidence/bulk-analyze', authorize('admin', 'editor'), asyncHandler(acosController.bulkAnalyzeEvidence));
router.get('/evidence/:evidenceId/analysis/export', asyncHandler(acosController.exportAnalysisReport));
router.post('/evidence/verify-hash', upload.single('file'), asyncHandler(acosController.verifyFileHash));
router.post('/evidence/sign', upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.signEvidence));
router.post('/evidence/verify-signature', upload.single('file'), asyncHandler(acosController.verifyEvidenceSignature));
router.post('/evidence/timestamp', upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.timestampEvidence));
router.post('/evidence/chain-of-custody', authorize('admin', 'editor'), asyncHandler(acosController.createChainOfCustody));
router.post('/evidence/multi-party-attestation', upload.single('file'), authorize('admin', 'editor'), asyncHandler(acosController.createMultiPartyAttestation));

// Regulatory Intelligence Fabric
router.post('/rif/ingest-regulation', authorize('admin'), upload.single('file'), asyncHandler(acosController.ingestRegulation));
router.post('/rif/detect-changes', authorize('admin'), asyncHandler(acosController.detectRegulatoryChanges));
router.post('/rif/:regulatoryChangeId/auto-update', authorize('admin'), asyncHandler(acosController.autoUpdateControls));
router.post('/rif/auto-update/rollback', authorize('admin'), asyncHandler(acosController.rollbackAutoUpdate));
router.post('/rif/auto-update/batch', authorize('admin'), asyncHandler(acosController.batchAutoUpdate));
router.post('/rif/conflicts/bulk-analysis', authorize('admin'), asyncHandler(acosController.bulkConflictAnalysis));
router.get('/rif/conflicts/history', asyncHandler(acosController.getConflictHistory));
router.post('/rif/conflicts/:conflictId/resolve', authorize('admin'), asyncHandler(acosController.resolveConflict));
router.post('/rif/feeds', authorize('admin'), asyncHandler(acosController.addFeed));
router.delete('/rif/feeds/:feedId', authorize('admin'), asyncHandler(acosController.removeFeed));
router.get('/rif/feeds/dashboard', asyncHandler(acosController.getFeedStatusDashboard));

// Temporal Graph Networks
router.get('/tgn/predict-risks', asyncHandler(acosController.predictFutureRisks));
router.get('/tgn/frameworks/:frameworkId/trajectory', asyncHandler(acosController.predictComplianceTrajectory));
router.get('/tgn/early-warnings', asyncHandler(acosController.getEarlyWarnings));

// Compliance Digital Twin
router.post('/digital-twin/simulate', authorize('admin', 'editor'), asyncHandler(acosController.runSimulation));
router.post('/digital-twin/simulate/with-constraints', authorize('admin', 'editor'), asyncHandler(acosController.runSimulationWithConstraints));
router.post('/digital-twin/compare-scenarios', authorize('admin', 'editor'), asyncHandler(acosController.compareScenarios));
router.post('/digital-twin/simulations/:scenarioId/save-state', authorize('admin', 'editor'), asyncHandler(acosController.saveSimulationState));
router.get('/digital-twin/simulations/:scenarioId/load-state', asyncHandler(acosController.loadSimulationState));
router.post('/digital-twin/simulations/:scenarioId/rollback', authorize('admin', 'editor'), asyncHandler(acosController.rollbackSimulation));
router.post('/digital-twin/monte-carlo', authorize('admin', 'editor'), asyncHandler(acosController.runMonteCarlo));

// Red Teaming
router.post('/red-team/simulate', authorize('admin'), asyncHandler(acosController.runRedTeamSimulation));
router.post('/red-team/automated-scan', authorize('admin'), asyncHandler(acosController.runAutomatedScan));
router.get('/red-team/compliance-gaps', authorize('admin'), asyncHandler(acosController.scanForComplianceGaps));
router.get('/red-team/misconfigurations', authorize('admin'), asyncHandler(acosController.scanForMisconfigurations));
router.get('/red-team/policy-violations', authorize('admin'), asyncHandler(acosController.scanForPolicyViolations));
router.post('/red-team/schedule', authorize('admin'), asyncHandler(acosController.scheduleScan));
router.post('/red-team/export-results', authorize('admin'), asyncHandler(acosController.exportScanResults));
router.post('/red-team/compare-results', authorize('admin'), asyncHandler(acosController.compareScanResults));
router.post('/red-team/mark-false-positive', authorize('admin'), asyncHandler(acosController.markFalsePositive));

// Federated Swarm
router.post('/swarm/join', authorize('admin'), asyncHandler(acosController.joinFederation));
router.post('/swarm/leave', authorize('admin'), asyncHandler(acosController.leaveFederation));
router.post('/swarm/contribute', authorize('admin'), asyncHandler(acosController.contributeToFederation));
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

// Multi-modal Intake
router.post('/multimodal/transcribe-audio', upload.single('audio'), asyncHandler(acosController.transcribeAudio));
router.post('/multimodal/analyze-video', upload.single('video'), asyncHandler(acosController.analyzeVideo));

// Physical AI
router.post('/physical-ai/register-device', authorize('admin'), asyncHandler(acosController.registerDevice));
router.post('/physical-ai/bulk-register', authorize('admin'), asyncHandler(acosController.bulkRegisterDevices));
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

// VR Collaborative Review
router.post('/vr/sessions', authorize('admin', 'editor'), asyncHandler(acosController.createVRSession));
router.get('/vr/sessions', asyncHandler(acosController.getActiveVRSessions));
router.get('/vr/sessions/:sessionId', asyncHandler(acosController.getVRSessionDetails));
router.post('/vr/sessions/:sessionId/join', asyncHandler(acosController.joinVRSession));
router.post('/vr/sessions/:sessionId/leave', asyncHandler(acosController.leaveVRSession));
router.post('/vr/sessions/:sessionId/start', authorize('admin', 'editor'), asyncHandler(acosController.startVRSession));
router.post('/vr/sessions/:sessionId/end', authorize('admin', 'editor'), asyncHandler(acosController.endVRSession));
router.post('/vr/sessions/:sessionId/annotations', asyncHandler(acosController.addVRAnnotation));
router.post('/vr/sessions/:sessionId/annotations/voice', asyncHandler(acosController.addVRVoiceAnnotation));
router.put('/vr/sessions/:sessionId/annotations/:annotationId', asyncHandler(acosController.editVRAnnotation));
router.delete('/vr/sessions/:sessionId/annotations/:annotationId', asyncHandler(acosController.deleteVRAnnotation));
router.get('/vr/sessions/:sessionId/annotations/:annotationId/history', asyncHandler(acosController.getVRAnnotationHistory));
router.get('/vr/sessions/:sessionId/annotations/export', asyncHandler(acosController.exportVRAnnotations));
router.post('/vr/sessions/:sessionId/chat', asyncHandler(acosController.sendVRChatMessage));
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
router.post('/vr/training/scenarios', authorize('admin'), asyncHandler(acosController.createVRTrainingScenario));
router.post('/vr/training/scenarios/:scenarioId/start', asyncHandler(acosController.startVRTraining));
router.post('/vr/training/sessions/:sessionId/progress', asyncHandler(acosController.trackVRTrainingProgress));
router.get('/vr/training/sessions/:sessionId/evaluate', asyncHandler(acosController.evaluateVRTraining));
router.post('/vr/training/sessions/:sessionId/complete', asyncHandler(acosController.completeVRTraining));
router.get('/vr/training/history', asyncHandler(acosController.getVRTrainingHistory));

// JIT Access
router.post('/jit/request', authorize('admin', 'editor'), asyncHandler(acosController.requestJITAccess));
router.get('/jit/sessions', asyncHandler(acosController.getJITAccessSessions));
router.post('/jit/sessions/:sessionId/revoke', authorize('admin'), asyncHandler(acosController.revokeJITSession));

// Swarm Task Allocation
router.post('/swarm-tasks/agents', authorize('admin'), asyncHandler(acosController.registerSwarmAgent));
router.get('/swarm-tasks/agents', asyncHandler(acosController.getSwarmAgents));
router.get('/swarm-tasks/agents/:agentId', asyncHandler(acosController.getSwarmAgentById));
router.put('/swarm-tasks/agents/:agentId/status', authorize('admin'), asyncHandler(acosController.updateSwarmAgentStatus));
router.post('/swarm-tasks/agents/:agentId/deactivate', authorize('admin'), asyncHandler(acosController.deactivateSwarmAgent));
router.post('/swarm-tasks/agents/:agentId/reactivate', authorize('admin'), asyncHandler(acosController.reactivateSwarmAgent));
router.get('/swarm-tasks/agents/:agentId/workload', asyncHandler(acosController.getSwarmAgentWorkload));
router.post('/swarm-tasks', authorize('admin', 'editor'), asyncHandler(acosController.submitSwarmTask));
router.post('/swarm-tasks/bulk', authorize('admin', 'editor'), asyncHandler(acosController.bulkSubmitSwarmTasks));
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
router.post('/compliance-debts', authorize('admin', 'editor'), asyncHandler(acosController.trackComplianceDebt));
router.post('/compliance-debts/calculate-from-gap', authorize('admin', 'editor'), asyncHandler(acosController.calculateDebtFromGapAnalysis));
router.post('/compliance-debts/:debtId/resolve', authorize('admin', 'editor'), asyncHandler(acosController.resolveComplianceDebt));
router.get('/compliance-debts/export', authorize('admin', 'editor'), asyncHandler(acosController.exportDebtReport));
router.get('/change-impacts', asyncHandler(acosController.getChangeImpacts));
router.post('/change-impacts/forecast', authorize('admin', 'editor'), asyncHandler(acosController.forecastChangeImpact));
router.post('/change-impacts/:impactId/resolve', authorize('admin', 'editor'), asyncHandler(acosController.resolveChangeImpact));

// NeuroSymbolic AI
router.post('/neuro-symbolic/hybrid-reasoning', authorize('admin', 'editor'), asyncHandler(acosController.performHybridReasoning));
router.post('/neuro-symbolic/infer-rules', authorize('admin', 'editor'), asyncHandler(acosController.inferRulesFromPatterns));
router.post('/neuro-symbolic/causal-reasoning', authorize('admin', 'editor'), asyncHandler(acosController.performCausalReasoning));
router.post('/neuro-symbolic/explainable-decision', authorize('admin', 'editor'), asyncHandler(acosController.generateExplainableDecision));
router.get('/neuro-symbolic/reasoning-history', asyncHandler(acosController.getReasoningHistory));
router.post('/neuro-symbolic/inferences/:inferenceId/validate', authorize('admin', 'editor'), asyncHandler(acosController.validateInferredRule));

// Homomorphic AI
router.post('/homomorphic/keys/generate', authorize('admin', 'editor'), asyncHandler(acosController.generateHomomorphicKeys));
router.post('/homomorphic/encrypt', authorize('admin', 'editor'), asyncHandler(acosController.encryptData));
router.post('/homomorphic/decrypt', authorize('admin', 'editor'), asyncHandler(acosController.decryptData));
router.post('/homomorphic/linear-regression', authorize('admin', 'editor'), asyncHandler(acosController.performEncryptedLinearRegression));
router.post('/homomorphic/statistics', authorize('admin', 'editor'), asyncHandler(acosController.computeEncryptedStatistics));
router.post('/homomorphic/neural-network', authorize('admin', 'editor'), asyncHandler(acosController.performEncryptedNeuralNetwork));

export default router;

