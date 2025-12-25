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
}

export default new ACOSController();

