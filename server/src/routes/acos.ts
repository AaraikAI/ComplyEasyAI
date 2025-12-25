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

// Control Loops
router.post('/control-loops', authorize('admin', 'editor'), asyncHandler(acosController.createControlLoop));
router.post('/control-loops/:loopId/execute', authorize('admin', 'editor'), asyncHandler(acosController.executeControlLoop));

// Agentic AI
router.post('/agentic/estimate-blast-radius', authorize('admin', 'editor'), asyncHandler(acosController.estimateBlastRadius));
router.post('/agentic/execute-action', authorize('admin', 'editor'), asyncHandler(acosController.executeAction));
router.post('/agentic/rollback/:actionId', authorize('admin'), asyncHandler(acosController.rollbackAction));

// Evidence Truth Layer
router.post('/evidence/:evidenceId/analyze', upload.single('file'), asyncHandler(acosController.analyzeEvidence));

// Regulatory Intelligence Fabric
router.post('/rif/ingest-regulation', authorize('admin'), asyncHandler(acosController.ingestRegulation));
router.post('/rif/:regulatoryChangeId/auto-update', authorize('admin'), asyncHandler(acosController.autoUpdateControls));

// Temporal Graph Networks
router.get('/tgn/predict-risks', asyncHandler(acosController.predictFutureRisks));
router.get('/tgn/frameworks/:frameworkId/trajectory', asyncHandler(acosController.predictComplianceTrajectory));
router.get('/tgn/early-warnings', asyncHandler(acosController.getEarlyWarnings));

// Compliance Digital Twin
router.post('/digital-twin/simulate', authorize('admin', 'editor'), asyncHandler(acosController.runSimulation));
router.post('/digital-twin/monte-carlo', authorize('admin', 'editor'), asyncHandler(acosController.runMonteCarlo));

// Red Teaming
router.post('/red-team/simulate', authorize('admin'), asyncHandler(acosController.runRedTeamSimulation));
router.post('/red-team/automated-scan', authorize('admin'), asyncHandler(acosController.runAutomatedScan));

// Federated Swarm
router.post('/swarm/contribute', authorize('admin'), asyncHandler(acosController.contributeToFederation));
router.get('/swarm/insights', asyncHandler(acosController.getSwarmInsights));

// Multi-modal Intake
router.post('/multimodal/transcribe-audio', upload.single('audio'), asyncHandler(acosController.transcribeAudio));
router.post('/multimodal/analyze-video', upload.single('video'), asyncHandler(acosController.analyzeVideo));

// Physical AI
router.post('/physical-ai/register-device', authorize('admin'), asyncHandler(acosController.registerDevice));
router.get('/physical-ai/devices', asyncHandler(acosController.getDevices));
router.post('/physical-ai/devices/:deviceId/compliance-check', authorize('admin'), asyncHandler(acosController.performEdgeComplianceCheck));

// VR Collaborative Review
router.post('/vr/sessions', authorize('admin', 'editor'), asyncHandler(acosController.createVRSession));
router.get('/vr/sessions', asyncHandler(acosController.getActiveVRSessions));
router.post('/vr/sessions/:sessionId/join', asyncHandler(acosController.joinVRSession));
router.post('/vr/sessions/:sessionId/start', authorize('admin', 'editor'), asyncHandler(acosController.startVRSession));
router.post('/vr/sessions/:sessionId/end', authorize('admin', 'editor'), asyncHandler(acosController.endVRSession));
router.post('/vr/sessions/:sessionId/annotations', asyncHandler(acosController.addVRAnnotation));
router.post('/vr/training/scenarios', authorize('admin'), asyncHandler(acosController.createVRTrainingScenario));
router.post('/vr/training/scenarios/:scenarioId/start', asyncHandler(acosController.startVRTraining));

// Swarm Task Allocation
router.post('/swarm-tasks/agents', authorize('admin'), asyncHandler(acosController.registerSwarmAgent));
router.get('/swarm-tasks/agents', asyncHandler(acosController.getSwarmAgents));
router.post('/swarm-tasks', authorize('admin', 'editor'), asyncHandler(acosController.submitSwarmTask));
router.get('/swarm-tasks', asyncHandler(acosController.getActiveSwarmTasks));
router.get('/swarm-tasks/:taskId', asyncHandler(acosController.getSwarmTaskStatus));
router.post('/swarm-tasks/:taskId/cancel', authorize('admin'), asyncHandler(acosController.cancelSwarmTask));
router.get('/swarm-tasks/metrics', asyncHandler(acosController.getSwarmMetrics));

// Federated Swarm Extended
router.get('/swarm/federation-status', asyncHandler(acosController.getFederationStatus));
router.post('/swarm/participate', authorize('admin'), asyncHandler(acosController.participateInSwarm));

// Regulatory Intelligence Fabric Extended
router.get('/rif/changes', asyncHandler(acosController.getRegulatoryChanges));
router.post('/rif/monitor-feeds', authorize('admin'), asyncHandler(acosController.monitorRegulatoryFeeds));

// aCOS Extended
router.get('/control-loops', asyncHandler(acosController.getControlLoops));
router.get('/compliance-debts', asyncHandler(acosController.getComplianceDebts));
router.get('/change-impacts', asyncHandler(acosController.getChangeImpacts));

export default router;

