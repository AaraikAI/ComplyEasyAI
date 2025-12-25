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
router.post('/physical-ai/devices/:deviceId/compliance-check', authorize('admin'), asyncHandler(acosController.performEdgeComplianceCheck));

export default router;

