import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import acosService from '../services/advanced/acosService';
import agenticAIService from '../services/advanced/agenticAIService';
import evidenceTruthLayerService from '../services/advanced/evidenceTruthLayerService';
import regulatoryIntelligenceFabricService from '../services/advanced/regulatoryIntelligenceFabricService';
import temporalGraphNetworkService from '../services/advanced/temporalGraphNetworkService';
import complianceDigitalTwinService from '../services/advanced/complianceDigitalTwinService';
import redTeamService from '../services/advanced/redTeamService';
import federatedSwarmService from '../services/advanced/federatedSwarmService';
import multimodalIntakeService from '../services/advanced/multimodalIntakeService';
import physicalAIService from '../services/advanced/physicalAIService';
import vrCollaborativeReviewService from '../services/advanced/vrCollaborativeReviewService';
import swarmTaskAllocationService from '../services/advanced/swarmTaskAllocationService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

class ACOSController {
  // aCOS Goals
  createGoal: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const goal = await acosService.createComplianceGoal(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(goal);
    } catch (error) {
      logger.error('Create goal error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create compliance goal', 500);
    }
  };

  getGoals: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const goals = await acosService.getComplianceGoals(authReq.user!.organizationId);
      res.json(goals);
    } catch (error) {
      logger.error('Get goals error', error);
      throw new AppError('Failed to get compliance goals', 500);
    }
  };

  // Control Loops
  createControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { controlId } = req.body;
      const loop = await acosService.createControlLoop(
        authReq.user!.organizationId,
        controlId,
        authReq.user!.id
      );
      res.json(loop);
    } catch (error) {
      logger.error('Create control loop error', error);
      throw new AppError('Failed to create control loop', 500);
    }
  };

  executeControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      const result = await acosService.executeControlLoop(
        loopId,
        authReq.user!.organizationId
      );
      res.json(result);
    } catch (error) {
      logger.error('Execute control loop error', error);
      throw new AppError('Failed to execute control loop', 500);
    }
  };

  // Agentic AI
  estimateBlastRadius: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const estimate = await agenticAIService.estimateBlastRadius(
        authReq.user!.organizationId,
        req.body
      );
      res.json(estimate);
    } catch (error) {
      logger.error('Estimate blast radius error', error);
      throw new AppError('Failed to estimate blast radius', 500);
    }
  };

  executeAction: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const action = await agenticAIService.executeAction(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id,
        req.body.autoApprove || false
      );
      res.json(action);
    } catch (error) {
      logger.error('Execute action error', error);
      throw new AppError('Failed to execute action', 500);
    }
  };

  rollbackAction: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { actionId } = req.params;
      const success = await agenticAIService.rollbackAction(
        req.body as any,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json({ success });
    } catch (error) {
      logger.error('Rollback action error', error);
      throw new AppError('Failed to rollback action', 500);
    }
  };

  // Evidence Truth Layer
  analyzeEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceId } = req.params;
      const file = (req as any).file;
      
      const analysis = await evidenceTruthLayerService.analyzeEvidence(
        evidenceId,
        authReq.user!.organizationId,
        file?.buffer,
        {
          filename: file?.originalname,
          mimeType: file?.mimetype,
          size: file?.size,
        }
      );
      res.json(analysis);
    } catch (error) {
      logger.error('Analyze evidence error', error);
      throw new AppError('Failed to analyze evidence', 500);
    }
  };

  // Regulatory Intelligence Fabric
  ingestRegulation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const change = await regulatoryIntelligenceFabricService.ingestRegulation(
        authReq.user!.organizationId,
        req.body.regulationText,
        req.body.metadata,
        authReq.user!.id
      );
      res.json(change);
    } catch (error) {
      logger.error('Ingest regulation error', error);
      throw new AppError('Failed to ingest regulation', 500);
    }
  };

  autoUpdateControls: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { regulatoryChangeId } = req.params;
      const result = await regulatoryIntelligenceFabricService.autoUpdateControls(
        regulatoryChangeId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Auto update controls error', error);
      throw new AppError('Failed to auto-update controls', 500);
    }
  };

  // Temporal Graph Networks
  predictFutureRisks: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const timeHorizonMonths = parseInt(req.query.months as string) || 6;
      const predictions = await temporalGraphNetworkService.predictFutureRisks(
        authReq.user!.organizationId,
        timeHorizonMonths
      );
      res.json(predictions);
    } catch (error) {
      logger.error('Predict future risks error', error);
      throw new AppError('Failed to predict future risks', 500);
    }
  };

  predictComplianceTrajectory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const timeHorizonMonths = parseInt(req.query.months as string) || 6;
      const trajectory = await temporalGraphNetworkService.predictComplianceTrajectory(
        frameworkId,
        authReq.user!.organizationId,
        timeHorizonMonths
      );
      res.json(trajectory);
    } catch (error) {
      logger.error('Predict compliance trajectory error', error);
      throw new AppError('Failed to predict compliance trajectory', 500);
    }
  };

  getEarlyWarnings: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const timeHorizonMonths = parseInt(req.query.months as string) || 3;
      const warnings = await temporalGraphNetworkService.getEarlyWarnings(
        authReq.user!.organizationId,
        timeHorizonMonths
      );
      res.json(warnings);
    } catch (error) {
      logger.error('Get early warnings error', error);
      throw new AppError('Failed to get early warnings', 500);
    }
  };

  // Compliance Digital Twin
  runSimulation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await complianceDigitalTwinService.runSimulation(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Run simulation error', error);
      throw new AppError('Failed to run simulation', 500);
    }
  };

  runMonteCarlo: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const iterations = parseInt(req.body.iterations) || 1000;
      const result = await complianceDigitalTwinService.runMonteCarloSimulation(
        authReq.user!.organizationId,
        req.body.scenarioType,
        req.body.parameters,
        iterations,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Run Monte Carlo error', error);
      throw new AppError('Failed to run Monte Carlo simulation', 500);
    }
  };

  // Red Teaming
  runRedTeamSimulation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await redTeamService.runRedTeamSimulation(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Run red team simulation error', error);
      throw new AppError('Failed to run red team simulation', 500);
    }
  };

  runAutomatedScan: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const results = await redTeamService.runAutomatedScan(
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(results);
    } catch (error) {
      logger.error('Run automated scan error', error);
      throw new AppError('Failed to run automated scan', 500);
    }
  };

  // Federated Swarm
  contributeToFederation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await federatedSwarmService.contributeToFederation(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Contribute to federation error', error);
      throw new AppError('Failed to contribute to federation', 500);
    }
  };

  getSwarmInsights: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const frameworks = req.query.frameworks 
        ? (req.query.frameworks as string).split(',')
        : [];
      const insights = await federatedSwarmService.getSwarmInsights(
        authReq.user!.organizationId,
        frameworks
      );
      res.json(insights);
    } catch (error) {
      logger.error('Get swarm insights error', error);
      throw new AppError('Failed to get swarm insights', 500);
    }
  };

  // Multi-modal Intake
  transcribeAudio: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const file = (req as any).file;
      if (!file) {
        throw new AppError('No audio file provided', 400);
      }
      const result = await multimodalIntakeService.transcribeAudio(
        file.buffer,
        req.body,
        authReq.user!.organizationId,
        req.body.evidenceId
      );
      res.json(result);
    } catch (error) {
      logger.error('Transcribe audio error', error);
      throw new AppError('Failed to transcribe audio', 500);
    }
  };

  analyzeVideo: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = (req as any).file;
      if (!file) {
        throw new AppError('No video file provided', 400);
      }
      const result = await multimodalIntakeService.analyzeVideo(
        file.buffer,
        req.body
      );
      res.json(result);
    } catch (error) {
      logger.error('Analyze video error', error);
      throw new AppError('Failed to analyze video', 500);
    }
  };

  // Physical AI
  registerDevice: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const device = await physicalAIService.registerDevice(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(device);
    } catch (error) {
      logger.error('Register device error', error);
      throw new AppError('Failed to register device', 500);
    }
  };

  performEdgeComplianceCheck: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const checks = await physicalAIService.performEdgeComplianceCheck(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(checks);
    } catch (error) {
      logger.error('Perform edge compliance check error', error);
      throw new AppError('Failed to perform edge compliance check', 500);
    }
  };

  getDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const devices = await physicalAIService.getDevices(authReq.user!.organizationId);
      res.json(devices);
    } catch (error) {
      logger.error('Get devices error', error);
      throw new AppError('Failed to get devices', 500);
    }
  };

  // VR Collaborative Review
  createVRSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const session = await vrCollaborativeReviewService.createSession(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(session);
    } catch (error) {
      logger.error('Create VR session error', error);
      throw new AppError('Failed to create VR session', 500);
    }
  };

  joinVRSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const role = req.body.role || 'reviewer';
      const result = await vrCollaborativeReviewService.joinSession(
        sessionId,
        authReq.user!.id,
        role
      );
      res.json(result);
    } catch (error) {
      logger.error('Join VR session error', error);
      throw new AppError('Failed to join VR session', 500);
    }
  };

  startVRSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const session = await vrCollaborativeReviewService.startSession(
        sessionId,
        authReq.user!.id
      );
      res.json(session);
    } catch (error) {
      logger.error('Start VR session error', error);
      throw new AppError('Failed to start VR session', 500);
    }
  };

  endVRSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const result = await vrCollaborativeReviewService.endSession(
        sessionId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('End VR session error', error);
      throw new AppError('Failed to end VR session', 500);
    }
  };

  addVRAnnotation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const annotation = await vrCollaborativeReviewService.addAnnotation(
        sessionId,
        authReq.user!.id,
        req.body
      );
      res.json(annotation);
    } catch (error) {
      logger.error('Add VR annotation error', error);
      throw new AppError('Failed to add VR annotation', 500);
    }
  };

  getActiveVRSessions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const sessions = await vrCollaborativeReviewService.getActiveSessions(
        authReq.user!.organizationId
      );
      res.json(sessions);
    } catch (error) {
      logger.error('Get active VR sessions error', error);
      throw new AppError('Failed to get active VR sessions', 500);
    }
  };

  createVRTrainingScenario: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const scenario = await vrCollaborativeReviewService.createTrainingScenario(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(scenario);
    } catch (error) {
      logger.error('Create VR training scenario error', error);
      throw new AppError('Failed to create VR training scenario', 500);
    }
  };

  startVRTraining: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenarioId } = req.params;
      const result = await vrCollaborativeReviewService.startTrainingSession(
        scenarioId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Start VR training error', error);
      throw new AppError('Failed to start VR training', 500);
    }
  };

  // Swarm Task Allocation
  registerSwarmAgent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const agent = await swarmTaskAllocationService.registerAgent(
        authReq.user!.organizationId,
        req.body
      );
      res.json(agent);
    } catch (error) {
      logger.error('Register swarm agent error', error);
      throw new AppError('Failed to register swarm agent', 500);
    }
  };

  submitSwarmTask: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const task = await swarmTaskAllocationService.submitTask(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(task);
    } catch (error) {
      logger.error('Submit swarm task error', error);
      throw new AppError('Failed to submit swarm task', 500);
    }
  };

  getSwarmTaskStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const task = swarmTaskAllocationService.getTaskStatus(taskId);
      if (!task) {
        throw new AppError('Task not found', 404);
      }
      res.json(task);
    } catch (error) {
      logger.error('Get swarm task status error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get swarm task status', 500);
    }
  };

  getActiveSwarmTasks: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tasks = swarmTaskAllocationService.getActiveTasks(authReq.user!.organizationId);
      res.json(tasks);
    } catch (error) {
      logger.error('Get active swarm tasks error', error);
      throw new AppError('Failed to get active swarm tasks', 500);
    }
  };

  cancelSwarmTask: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { taskId } = req.params;
      const task = await swarmTaskAllocationService.cancelTask(
        taskId,
        req.body.reason || 'Cancelled by user',
        authReq.user!.id
      );
      res.json(task);
    } catch (error) {
      logger.error('Cancel swarm task error', error);
      throw new AppError('Failed to cancel swarm task', 500);
    }
  };

  getSwarmMetrics: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const metrics = swarmTaskAllocationService.getSwarmMetrics(authReq.user!.organizationId);
      res.json(metrics);
    } catch (error) {
      logger.error('Get swarm metrics error', error);
      throw new AppError('Failed to get swarm metrics', 500);
    }
  };

  getSwarmAgents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const agents = swarmTaskAllocationService.getAgents();
      res.json(agents);
    } catch (error) {
      logger.error('Get swarm agents error', error);
      throw new AppError('Failed to get swarm agents', 500);
    }
  };

  // Federation Status
  getFederationStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const status = await federatedSwarmService.getFederationStatus(authReq.user!.organizationId);
      res.json(status);
    } catch (error) {
      logger.error('Get federation status error', error);
      throw new AppError('Failed to get federation status', 500);
    }
  };

  participateInSwarm: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { taskType } = req.body;
      const result = await federatedSwarmService.participateInSwarm(
        authReq.user!.organizationId,
        taskType
      );
      res.json(result);
    } catch (error) {
      logger.error('Participate in swarm error', error);
      throw new AppError('Failed to participate in swarm', 500);
    }
  };

  // Regulatory Feeds
  monitorRegulatoryFeeds: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const changes = await regulatoryIntelligenceFabricService.monitorRegulatoryFeeds(
        authReq.user!.organizationId
      );
      res.json(changes);
    } catch (error) {
      logger.error('Monitor regulatory feeds error', error);
      throw new AppError('Failed to monitor regulatory feeds', 500);
    }
  };

  getRegulatoryChanges: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const status = req.query.status as string | undefined;
      const changes = await regulatoryIntelligenceFabricService.getRegulatoryChanges(
        authReq.user!.organizationId,
        status
      );
      res.json(changes);
    } catch (error) {
      logger.error('Get regulatory changes error', error);
      throw new AppError('Failed to get regulatory changes', 500);
    }
  };

  // aCOS Extended
  getControlLoops: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const loops = await acosService.getActiveControlLoops(authReq.user!.organizationId);
      res.json(loops);
    } catch (error) {
      logger.error('Get control loops error', error);
      throw new AppError('Failed to get control loops', 500);
    }
  };

  getComplianceDebts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const debts = await acosService.getComplianceDebts(authReq.user!.organizationId);
      res.json(debts);
    } catch (error) {
      logger.error('Get compliance debts error', error);
      throw new AppError('Failed to get compliance debts', 500);
    }
  };

  getChangeImpacts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const impacts = await acosService.getChangeImpacts(authReq.user!.organizationId);
      res.json(impacts);
    } catch (error) {
      logger.error('Get change impacts error', error);
      throw new AppError('Failed to get change impacts', 500);
    }
  };
}

export default new ACOSController();

