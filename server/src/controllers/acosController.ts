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
import neuroSymbolicAIService from '../services/advanced/neuroSymbolicAIService';
import jitAccessService from '../services/advanced/jitAccessService';
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
    } catch (error: any) {
      logger.error('Create goal error', error);
      const errorMessage = error?.message || 'Unknown error';
      logger.error('Create goal error details:', { error: errorMessage, stack: error?.stack });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create compliance goal: ${errorMessage}`, 500);
    }
  };

  getGoals: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { status, framework } = req.query;
      const goals = await acosService.getComplianceGoals(
        authReq.user!.organizationId,
        { status: status as string, framework: framework as string }
      );
      res.json(goals);
    } catch (error) {
      logger.error('Get goals error', error);
      throw new AppError('Failed to get compliance goals', 500);
    }
  };

  getGoal: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { goalId } = req.params;
      const goal = await acosService.getComplianceGoalById(goalId, authReq.user!.organizationId);
      res.json(goal);
    } catch (error) {
      logger.error('Get goal error', error);
      throw new AppError('Failed to get compliance goal', 500);
    }
  };

  updateGoal: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { goalId } = req.params;
      const goal = await acosService.updateComplianceGoal(
        goalId,
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(goal);
    } catch (error: any) {
      logger.error('Update goal error', error);
      throw new AppError(`Failed to update compliance goal: ${error.message || 'Unknown error'}`, 500);
    }
  };

  deleteGoal: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { goalId } = req.params;
      await acosService.deleteComplianceGoal(goalId, authReq.user!.organizationId, authReq.user!.id);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete goal error', error);
      throw new AppError(`Failed to delete compliance goal: ${error.message || 'Unknown error'}`, 500);
    }
  };

  restoreGoal: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { goalId } = req.params;
      const goal = await acosService.restoreComplianceGoal(goalId, authReq.user!.organizationId, authReq.user!.id);
      res.json(goal);
    } catch (error: any) {
      logger.error('Restore goal error', error);
      throw new AppError(`Failed to restore compliance goal: ${error.message || 'Unknown error'}`, 500);
    }
  };

  // Control Loops
  createControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { controlId, triggerType, triggerConfig, timeoutSeconds, parentLoopId, configuration } = req.body;
      
      if (!controlId) {
        throw new AppError('Control ID is required', 400);
      }
      
      const loop = await acosService.createControlLoop(
        authReq.user!.organizationId,
        controlId,
        authReq.user!.id,
        {
          triggerType,
          triggerConfig,
          timeoutSeconds,
          parentLoopId,
          configuration,
        }
      );
      res.json(loop);
    } catch (error: any) {
      logger.error('Create control loop error', error);
      const errorMessage = error?.message || 'Unknown error';
      logger.error('Create control loop error details:', { error: errorMessage, stack: error?.stack });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create control loop: ${errorMessage}`, 500);
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
    } catch (error: any) {
      logger.error('Execute control loop error', error);
      const errorMessage = error?.message || 'Unknown error';
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to execute control loop: ${errorMessage}`, 500);
    }
  };

  getControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      const loop = await acosService.getControlLoopById(loopId, authReq.user!.organizationId);
      res.json(loop);
    } catch (error: any) {
      logger.error('Get control loop error', error);
      throw new AppError(`Failed to get control loop: ${error.message || 'Unknown error'}`, 500);
    }
  };

  getControlLoopHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      const history = await acosService.getControlLoopHistory(loopId, authReq.user!.organizationId);
      res.json(history);
    } catch (error: any) {
      logger.error('Get control loop history error', error);
      throw new AppError(`Failed to get control loop history: ${error.message || 'Unknown error'}`, 500);
    }
  };

  pauseControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      const loop = await acosService.pauseControlLoop(loopId, authReq.user!.organizationId, authReq.user!.id);
      res.json(loop);
    } catch (error: any) {
      logger.error('Pause control loop error', error);
      throw new AppError(`Failed to pause control loop: ${error.message || 'Unknown error'}`, 500);
    }
  };

  resumeControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      const loop = await acosService.resumeControlLoop(loopId, authReq.user!.organizationId, authReq.user!.id);
      res.json(loop);
    } catch (error: any) {
      logger.error('Resume control loop error', error);
      throw new AppError(`Failed to resume control loop: ${error.message || 'Unknown error'}`, 500);
    }
  };

  updateControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      const loop = await acosService.updateControlLoop(loopId, authReq.user!.organizationId, req.body, authReq.user!.id);
      res.json(loop);
    } catch (error: any) {
      logger.error('Update control loop error', error);
      throw new AppError(`Failed to update control loop: ${error.message || 'Unknown error'}`, 500);
    }
  };

  deleteControlLoop: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { loopId } = req.params;
      await acosService.deleteControlLoop(loopId, authReq.user!.organizationId, authReq.user!.id);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete control loop error', error);
      throw new AppError(`Failed to delete control loop: ${error.message || 'Unknown error'}`, 500);
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
      const result = await agenticAIService.rollbackAction(
        actionId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Rollback action error', error);
      throw new AppError(`Failed to rollback action: ${error.message || 'Unknown error'}`, 500);
    }
  };

  rollbackMultipleActions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { actionIds } = req.body;
      if (!Array.isArray(actionIds)) {
        throw new AppError('actionIds must be an array', 400);
      }
      const result = await agenticAIService.rollbackMultipleActions(
        actionIds,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Rollback multiple actions error', error);
      throw new AppError(`Failed to rollback actions: ${error.message || 'Unknown error'}`, 500);
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

  getEvidenceAnalysis: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceId } = req.params;
      const analysis = await evidenceTruthLayerService.getEvidenceAnalysis(
        evidenceId,
        authReq.user!.organizationId
      );
      if (!analysis) {
        throw new AppError('Analysis not found', 404);
      }
      res.json(analysis);
    } catch (error) {
      logger.error('Get evidence analysis error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get evidence analysis', 500);
    }
  };

  reanalyzeEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceId } = req.params;
      const file = (req as any).file;
      
      const analysis = await evidenceTruthLayerService.reanalyzeEvidence(
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
      logger.error('Re-analyze evidence error', error);
      throw new AppError('Failed to re-analyze evidence', 500);
    }
  };

  getAnalysisHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceId } = req.params;
      const history = await evidenceTruthLayerService.getAnalysisHistory(
        evidenceId,
        authReq.user!.organizationId
      );
      res.json(history);
    } catch (error) {
      logger.error('Get analysis history error', error);
      throw new AppError('Failed to get analysis history', 500);
    }
  };

  bulkAnalyzeEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceFiles } = req.body; // Array of { evidenceId, fileBuffer, metadata }
      
      if (!Array.isArray(evidenceFiles)) {
        throw new AppError('evidenceFiles must be an array', 400);
      }

      const results = await evidenceTruthLayerService.bulkAnalyzeEvidence(
        authReq.user!.organizationId,
        evidenceFiles
      );
      res.json(results);
    } catch (error) {
      logger.error('Bulk analyze evidence error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to bulk analyze evidence', 500);
    }
  };

  exportAnalysisReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceId } = req.params;
      const { format } = req.query;
      
      const report = await evidenceTruthLayerService.exportAnalysisReport(
        evidenceId,
        authReq.user!.organizationId,
        (format as 'json' | 'csv' | 'pdf') || 'json'
      );
      res.json(report);
    } catch (error) {
      logger.error('Export analysis report error', error);
      throw new AppError('Failed to export analysis report', 500);
    }
  };

  verifyFileHash: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { storedHash } = req.body;
      const file = (req as any).file;
      
      if (!file?.buffer || !storedHash) {
        throw new AppError('File and stored hash are required', 400);
      }

      const result = await evidenceTruthLayerService.verifyFileHash(
        file.buffer,
        storedHash
      );
      res.json(result);
    } catch (error) {
      logger.error('Verify file hash error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify file hash', 500);
    }
  };

  signEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const file = (req as any).file;
      
      if (!file?.buffer) {
        throw new AppError('File is required', 400);
      }

      const signature = await evidenceTruthLayerService.signEvidence(
        file.buffer,
        authReq.user!.organizationId
      );
      res.json(signature);
    } catch (error) {
      logger.error('Sign evidence error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to sign evidence', 500);
    }
  };

  verifyEvidenceSignature: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { signature, publicKey } = req.body;
      const file = (req as any).file;
      
      if (!file?.buffer || !signature || !publicKey) {
        throw new AppError('File, signature, and public key are required', 400);
      }

      const result = await evidenceTruthLayerService.verifyEvidenceSignature(
        file.buffer,
        signature,
        publicKey
      );
      res.json(result);
    } catch (error) {
      logger.error('Verify evidence signature error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify evidence signature', 500);
    }
  };

  timestampEvidence: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const file = (req as any).file;
      
      if (!file?.buffer) {
        throw new AppError('File is required', 400);
      }

      const timestamp = await evidenceTruthLayerService.timestampEvidence(
        file.buffer,
        authReq.user!.organizationId
      );
      res.json(timestamp);
    } catch (error) {
      logger.error('Timestamp evidence error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to timestamp evidence', 500);
    }
  };

  createChainOfCustody: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { evidenceId, previousHash, action } = req.body;
      
      if (!evidenceId || !action) {
        throw new AppError('Evidence ID and action are required', 400);
      }

      const chain = await evidenceTruthLayerService.createChainOfCustody(
        evidenceId,
        authReq.user!.organizationId,
        previousHash || null,
        action,
        authReq.user!.id
      );
      res.json(chain);
    } catch (error) {
      logger.error('Create chain of custody error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create chain of custody', 500);
    }
  };

  createMultiPartyAttestation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { parties } = req.body;
      const file = (req as any).file;
      
      if (!file?.buffer || !Array.isArray(parties)) {
        throw new AppError('File and parties array are required', 400);
      }

      const attestations = await evidenceTruthLayerService.createMultiPartyAttestation(
        file.buffer,
        authReq.user!.organizationId,
        parties
      );
      res.json(attestations);
    } catch (error) {
      logger.error('Create multi-party attestation error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create multi-party attestation', 500);
    }
  };

  // Regulatory Intelligence Fabric
  ingestRegulation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const file = (req as any).file;
      
      const input: any = {};
      if (req.body.url) {
        input.url = req.body.url;
      } else if (file && file.mimetype === 'application/pdf') {
        input.pdfBuffer = file.buffer;
      } else if (req.body.text) {
        input.text = req.body.text;
      }

      const change = await regulatoryIntelligenceFabricService.ingestRegulation(
        authReq.user!.organizationId,
        input,
        req.body.metadata,
        authReq.user!.id
      );
      res.json(change);
    } catch (error: any) {
      logger.error('Ingest regulation error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to ingest regulation: ${error.message}`, 500);
    }
  };

  detectRegulatoryChanges: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await regulatoryIntelligenceFabricService.detectRegulatoryChanges(
        authReq.user!.organizationId,
        req.body.regulationText,
        req.body.metadata
      );
      res.json(result);
    } catch (error) {
      logger.error('Detect regulatory changes error', error);
      throw new AppError('Failed to detect regulatory changes', 500);
    }
  };

  bulkConflictAnalysis: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { regulationIds } = req.body;
      const result = await regulatoryIntelligenceFabricService.bulkConflictAnalysis(
        authReq.user!.organizationId,
        regulationIds
      );
      res.json(result);
    } catch (error) {
      logger.error('Bulk conflict analysis error', error);
      throw new AppError('Failed to perform bulk conflict analysis', 500);
    }
  };

  getConflictHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await regulatoryIntelligenceFabricService.getConflictHistory(
        authReq.user!.organizationId,
        limit
      );
      res.json(history);
    } catch (error) {
      logger.error('Get conflict history error', error);
      throw new AppError('Failed to get conflict history', 500);
    }
  };

  resolveConflict: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { conflictId, resolution } = req.body;
      await regulatoryIntelligenceFabricService.resolveConflict(
        conflictId,
        authReq.user!.organizationId,
        resolution,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Resolve conflict error', error);
      throw new AppError('Failed to resolve conflict', 500);
    }
  };

  rollbackAutoUpdate: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { regulatoryChangeId, checkpointId } = req.body;
      const result = await regulatoryIntelligenceFabricService.rollbackAutoUpdate(
        regulatoryChangeId,
        checkpointId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Rollback auto-update error', error);
      throw new AppError('Failed to rollback auto-update', 500);
    }
  };

  batchAutoUpdate: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { regulatoryChangeIds, options } = req.body;
      const result = await regulatoryIntelligenceFabricService.batchAutoUpdate(
        regulatoryChangeIds,
        authReq.user!.organizationId,
        authReq.user!.id,
        options
      );
      res.json(result);
    } catch (error) {
      logger.error('Batch auto-update error', error);
      throw new AppError('Failed to batch auto-update', 500);
    }
  };

  addFeed: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const feed = await regulatoryIntelligenceFabricService.addFeed(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(feed);
    } catch (error) {
      logger.error('Add feed error', error);
      throw new AppError('Failed to add feed', 500);
    }
  };

  removeFeed: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { feedId } = req.params;
      await regulatoryIntelligenceFabricService.removeFeed(
        feedId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Remove feed error', error);
      throw new AppError('Failed to remove feed', 500);
    }
  };

  getFeedStatusDashboard: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const dashboard = await regulatoryIntelligenceFabricService.getFeedStatusDashboard(
        authReq.user!.organizationId
      );
      res.json(dashboard);
    } catch (error) {
      logger.error('Get feed status dashboard error', error);
      throw new AppError('Failed to get feed status dashboard', 500);
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
      const { frameworkId, controlId } = req.query;
      const predictions = await temporalGraphNetworkService.predictFutureRisks(
        authReq.user!.organizationId,
        timeHorizonMonths,
        {
          frameworkId: frameworkId as string,
          controlId: controlId as string,
        }
      );
      res.json(predictions);
    } catch (error) {
      logger.error('Predict future risks error', error);
      throw new AppError('Failed to predict future risks', 500);
    }
  };

  getHistoricalAccuracy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const accuracy = await temporalGraphNetworkService.getHistoricalAccuracy(
        authReq.user!.organizationId
      );
      res.json(accuracy);
    } catch (error) {
      logger.error('Get historical accuracy error', error);
      throw new AppError('Failed to get historical accuracy', 500);
    }
  };

  refreshRiskPredictions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const timeHorizonMonths = parseInt(req.query.months as string) || 6;
      const predictions = await temporalGraphNetworkService.refreshRiskPredictions(
        authReq.user!.organizationId,
        timeHorizonMonths
      );
      res.json(predictions);
    } catch (error) {
      logger.error('Refresh risk predictions error', error);
      throw new AppError('Failed to refresh risk predictions', 500);
    }
  };

  predictComplianceTrajectory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const timeHorizonMonths = parseInt(req.query.months as string) || 6;
      const { withInterventions, compareScenarios } = req.query;
      
      let trajectory;
      if (compareScenarios === 'true' && req.body.scenarios) {
        trajectory = await temporalGraphNetworkService.compareTrajectories(
          frameworkId,
          authReq.user!.organizationId,
          req.body.scenarios,
          timeHorizonMonths
        );
      } else {
        trajectory = await temporalGraphNetworkService.predictComplianceTrajectory(
          frameworkId,
          authReq.user!.organizationId,
          timeHorizonMonths,
          {
            withInterventions: withInterventions === 'true',
            interventions: req.body.interventions,
            compareScenarios: compareScenarios === 'true',
          }
        );
      }
      res.json(trajectory);
    } catch (error) {
      logger.error('Predict compliance trajectory error', error);
      throw new AppError('Failed to predict compliance trajectory', 500);
    }
  };

  recalculateTrajectory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const timeHorizonMonths = parseInt(req.query.months as string) || 6;
      const trajectory = await temporalGraphNetworkService.recalculateTrajectory(
        frameworkId,
        authReq.user!.organizationId,
        timeHorizonMonths
      );
      res.json(trajectory);
    } catch (error) {
      logger.error('Recalculate trajectory error', error);
      throw new AppError('Failed to recalculate trajectory', 500);
    }
  };

  getEarlyWarnings: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const timeHorizonMonths = parseInt(req.query.months as string) || 3;
      const { severity, type, acknowledged } = req.query;
      const warnings = await temporalGraphNetworkService.getEarlyWarnings(
        authReq.user!.organizationId,
        timeHorizonMonths,
        {
          severity: severity as string,
          type: type as string,
          acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
        }
      );
      res.json(warnings);
    } catch (error) {
      logger.error('Get early warnings error', error);
      throw new AppError('Failed to get early warnings', 500);
    }
  };

  acknowledgeWarning: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { warningId } = req.params;
      const { falsePositive } = req.body;
      const success = await temporalGraphNetworkService.acknowledgeWarning(
        warningId,
        authReq.user!.organizationId,
        authReq.user!.id,
        falsePositive || false
      );
      res.json({ success });
    } catch (error) {
      logger.error('Acknowledge warning error', error);
      throw new AppError('Failed to acknowledge warning', 500);
    }
  };

  getWarningHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { startDate, endDate, type, severity } = req.query;
      const history = await temporalGraphNetworkService.getWarningHistory(
        authReq.user!.organizationId,
        {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          type: type as string,
          severity: severity as string,
        }
      );
      res.json(history);
    } catch (error) {
      logger.error('Get warning history error', error);
      throw new AppError('Failed to get warning history', 500);
    }
  };

  getFalsePositiveRate: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const rate = await temporalGraphNetworkService.calculateFalsePositiveRate(
        authReq.user!.organizationId
      );
      res.json({ falsePositiveRate: rate });
    } catch (error) {
      logger.error('Get false positive rate error', error);
      throw new AppError('Failed to get false positive rate', 500);
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

  runSimulationWithConstraints: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenario, constraints } = req.body;
      const result = await complianceDigitalTwinService.runSimulationWithConstraints(
        authReq.user!.organizationId,
        scenario,
        constraints,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Run simulation with constraints error', error);
      throw new AppError('Failed to run simulation with constraints', 500);
    }
  };

  compareScenarios: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenarios } = req.body;
      const result = await complianceDigitalTwinService.compareScenarios(
        authReq.user!.organizationId,
        scenarios,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Compare scenarios error', error);
      throw new AppError('Failed to compare scenarios', 500);
    }
  };

  saveSimulationState: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenarioId } = req.params;
      const { state } = req.body;
      const success = await complianceDigitalTwinService.saveSimulationState(
        scenarioId,
        authReq.user!.organizationId,
        state,
        authReq.user!.id
      );
      res.json({ success });
    } catch (error) {
      logger.error('Save simulation state error', error);
      throw new AppError('Failed to save simulation state', 500);
    }
  };

  loadSimulationState: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenarioId } = req.params;
      const state = await complianceDigitalTwinService.loadSimulationState(
        scenarioId,
        authReq.user!.organizationId
      );
      res.json({ state });
    } catch (error) {
      logger.error('Load simulation state error', error);
      throw new AppError('Failed to load simulation state', 500);
    }
  };

  rollbackSimulation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenarioId } = req.params;
      const success = await complianceDigitalTwinService.rollbackSimulation(
        scenarioId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json({ success });
    } catch (error) {
      logger.error('Rollback simulation error', error);
      throw new AppError('Failed to rollback simulation', 500);
    }
  };

  runMonteCarlo: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const iterations = parseInt(req.body.iterations) || 1000;
      const { seed, withCorrelations, exportResults } = req.body;
      const result = await complianceDigitalTwinService.runMonteCarloSimulation(
        authReq.user!.organizationId,
        req.body.scenarioType,
        req.body.parameters,
        iterations,
        authReq.user!.id,
        {
          seed,
          withCorrelations,
          exportResults,
        }
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
        authReq.user!.id,
        req.body.options
      );
      res.json(results);
    } catch (error) {
      logger.error('Run automated scan error', error);
      throw new AppError('Failed to run automated scan', 500);
    }
  };

  scanForComplianceGaps: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkIds } = req.query;
      const gaps = await redTeamService.scanForComplianceGaps(
        authReq.user!.organizationId,
        frameworkIds ? (Array.isArray(frameworkIds) ? frameworkIds as string[] : [frameworkIds as string]) : undefined
      );
      res.json(gaps);
    } catch (error) {
      logger.error('Scan for compliance gaps error', error);
      throw new AppError('Failed to scan for compliance gaps', 500);
    }
  };

  scanForMisconfigurations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const misconfigs = await redTeamService.scanForMisconfigurations(
        authReq.user!.organizationId
      );
      res.json(misconfigs);
    } catch (error) {
      logger.error('Scan for misconfigurations error', error);
      throw new AppError('Failed to scan for misconfigurations', 500);
    }
  };

  scanForPolicyViolations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const violations = await redTeamService.scanForPolicyViolations(
        authReq.user!.organizationId
      );
      res.json(violations);
    } catch (error) {
      logger.error('Scan for policy violations error', error);
      throw new AppError('Failed to scan for policy violations', 500);
    }
  };

  scheduleScan: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await redTeamService.scheduleScan(
        authReq.user!.organizationId,
        req.body.schedule,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Schedule scan error', error);
      throw new AppError('Failed to schedule scan', 500);
    }
  };

  exportScanResults: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { results, format } = req.body;
      const exportData = await redTeamService.exportScanResults(
        results,
        format || 'json'
      );
      res.json(exportData);
    } catch (error) {
      logger.error('Export scan results error', error);
      throw new AppError('Failed to export scan results', 500);
    }
  };

  compareScanResults: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentResults, baselineResults } = req.body;
      const comparison = await redTeamService.compareScanResults(
        currentResults,
        baselineResults
      );
      res.json(comparison);
    } catch (error) {
      logger.error('Compare scan results error', error);
      throw new AppError('Failed to compare scan results', 500);
    }
  };

  markFalsePositive: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenarioId, vulnerabilityIndex } = req.body;
      await redTeamService.markFalsePositive(
        authReq.user!.organizationId,
        scenarioId,
        vulnerabilityIndex,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Mark false positive error', error);
      throw new AppError('Failed to mark false positive', 500);
    }
  };

  // Federated Swarm
  joinFederation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await federatedSwarmService.joinFederation(
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Join federation error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to join federation: ${error.message}`, 500);
    }
  };

  leaveFederation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      await federatedSwarmService.leaveFederation(
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Leave federation error', error);
      throw new AppError('Failed to leave federation', 500);
    }
  };

  contributeToFederation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await federatedSwarmService.contributeToFederation(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Contribute to federation error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to contribute to federation: ${error.message}`, 500);
    }
  };

  receiveFederatedModel: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { modelType } = req.query;
      const model = await federatedSwarmService.receiveFederatedModel(
        authReq.user!.organizationId,
        (modelType as any) || 'compliance_scoring'
      );
      res.json(model);
    } catch (error) {
      logger.error('Receive federated model error', error);
      throw new AppError('Failed to receive federated model', 500);
    }
  };

  recoverFederation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const result = await federatedSwarmService.recoverFederation(
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Recover federation error', error);
      throw new AppError('Failed to recover federation', 500);
    }
  };

  getSwarmInsights: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const frameworks = req.query.frameworks 
        ? (req.query.frameworks as string).split(',')
        : [];
      const { industry, sector, insightType, minConfidence, maxAge } = req.query;
      const insights = await federatedSwarmService.getSwarmInsights(
        authReq.user!.organizationId,
        frameworks,
        {
          industry: industry as string,
          sector: sector as string,
          insightType: insightType as string,
          minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined,
          maxAge: maxAge ? parseInt(maxAge as string) : undefined,
        }
      );
      res.json(insights);
    } catch (error) {
      logger.error('Get swarm insights error', error);
      throw new AppError('Failed to get swarm insights', 500);
    }
  };

  getIndustryInsights: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { industry } = req.query;
      const insights = await federatedSwarmService.getIndustryInsights(
        authReq.user!.organizationId,
        industry as string
      );
      res.json(insights);
    } catch (error) {
      logger.error('Get industry insights error', error);
      throw new AppError('Failed to get industry insights', 500);
    }
  };

  getSectorInsights: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sector } = req.query;
      const insights = await federatedSwarmService.getSectorInsights(
        authReq.user!.organizationId,
        sector as string
      );
      res.json(insights);
    } catch (error) {
      logger.error('Get sector insights error', error);
      throw new AppError('Failed to get sector insights', 500);
    }
  };

  getFrameworkInsights: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.params;
      const insights = await federatedSwarmService.getFrameworkInsights(
        authReq.user!.organizationId,
        frameworkId
      );
      res.json(insights);
    } catch (error) {
      logger.error('Get framework insights error', error);
      throw new AppError('Failed to get framework insights', 500);
    }
  };

  benchmarkAgainstPeers: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.query;
      const benchmark = await federatedSwarmService.benchmarkAgainstPeers(
        authReq.user!.organizationId,
        frameworkId as string
      );
      res.json(benchmark);
    } catch (error) {
      logger.error('Benchmark against peers error', error);
      throw new AppError('Failed to benchmark against peers', 500);
    }
  };

  identifyTrends: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const timeWindow = parseInt(req.query.timeWindow as string) || 90;
      const trends = await federatedSwarmService.identifyTrends(
        authReq.user!.organizationId,
        timeWindow
      );
      res.json(trends);
    } catch (error) {
      logger.error('Identify trends error', error);
      throw new AppError('Failed to identify trends', 500);
    }
  };

  exportInsights: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { insights, format } = req.body;
      const exportData = await federatedSwarmService.exportInsights(
        insights,
        format || 'json'
      );
      res.json(exportData);
    } catch (error) {
      logger.error('Export insights error', error);
      throw new AppError('Failed to export insights', 500);
    }
  };

  rollbackModel: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { modelType, targetVersion } = req.body;
      const result = await federatedSwarmService.rollbackModel(
        modelType,
        targetVersion,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Rollback model error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to rollback model: ${error.message}`, 500);
    }
  };

  distributeModel: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelType, organizationIds } = req.body;
      const result = await federatedSwarmService.distributeModel(
        modelType,
        organizationIds
      );
      res.json(result);
    } catch (error) {
      logger.error('Distribute model error', error);
      throw new AppError('Failed to distribute model', 500);
    }
  };

  getModelAuditTrail: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelType, limit } = req.query;
      const trail = await federatedSwarmService.getModelAuditTrail(
        modelType as any,
        limit ? parseInt(limit as string) : 50
      );
      res.json(trail);
    } catch (error) {
      logger.error('Get model audit trail error', error);
      throw new AppError('Failed to get model audit trail', 500);
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
      const authReq = req as AuthRequest;
      const file = (req as any).file;
      if (!file) {
        throw new AppError('No video file provided', 400);
      }
      const result = await multimodalIntakeService.analyzeVideo(
        file.buffer,
        req.body,
        authReq.user!.organizationId,
        req.body.evidenceId
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
      const result = await physicalAIService.performEdgeComplianceCheck(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(result);
    } catch (error) {
      logger.error('Perform edge compliance check error', error);
      throw new AppError('Failed to perform edge compliance check', 500);
    }
  };

  bulkRegisterDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { devices } = req.body;
      const result = await physicalAIService.bulkRegisterDevices(
        authReq.user!.organizationId,
        devices,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Bulk register devices error', error);
      throw new AppError('Failed to bulk register devices', 500);
    }
  };

  deregisterDevice: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      await physicalAIService.deregisterDevice(
        deviceId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Deregister device error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to deregister device: ${error.message}`, 500);
    }
  };

  monitorDeviceHeartbeat: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const heartbeat = await physicalAIService.monitorDeviceHeartbeat(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(heartbeat);
    } catch (error) {
      logger.error('Monitor device heartbeat error', error);
      throw new AppError('Failed to monitor device heartbeat', 500);
    }
  };

  detectOfflineDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const offline = await physicalAIService.detectOfflineDevices(
        authReq.user!.organizationId
      );
      res.json(offline);
    } catch (error) {
      logger.error('Detect offline devices error', error);
      throw new AppError('Failed to detect offline devices', 500);
    }
  };

  monitorBatteryLevel: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const battery = await physicalAIService.monitorBatteryLevel(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(battery);
    } catch (error) {
      logger.error('Monitor battery level error', error);
      throw new AppError('Failed to monitor battery level', 500);
    }
  };

  monitorConnectivity: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const connectivity = await physicalAIService.monitorConnectivity(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(connectivity);
    } catch (error) {
      logger.error('Monitor connectivity error', error);
      throw new AppError('Failed to monitor connectivity', 500);
    }
  };

  trackFirmwareVersion: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const firmware = await physicalAIService.trackFirmwareVersion(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(firmware);
    } catch (error) {
      logger.error('Track firmware version error', error);
      throw new AppError('Failed to track firmware version', 500);
    }
  };

  getHealthDashboard: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const dashboard = await physicalAIService.getHealthDashboard(
        authReq.user!.organizationId
      );
      res.json(dashboard);
    } catch (error) {
      logger.error('Get health dashboard error', error);
      throw new AppError('Failed to get health dashboard', 500);
    }
  };

  getHealthHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const history = await physicalAIService.getHealthHistory(
        deviceId,
        authReq.user!.organizationId,
        days
      );
      res.json(history);
    } catch (error) {
      logger.error('Get health history error', error);
      throw new AppError('Failed to get health history', 500);
    }
  };

  performPredictiveMaintenance: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const maintenance = await physicalAIService.performPredictiveMaintenance(
        deviceId,
        authReq.user!.organizationId
      );
      res.json(maintenance);
    } catch (error) {
      logger.error('Perform predictive maintenance error', error);
      throw new AppError('Failed to perform predictive maintenance', 500);
    }
  };

  bulkHealthCheck: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const health = await physicalAIService.bulkHealthCheck(
        authReq.user!.organizationId
      );
      res.json(health);
    } catch (error) {
      logger.error('Bulk health check error', error);
      throw new AppError('Failed to perform bulk health check', 500);
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

  leaveVRSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      await vrCollaborativeReviewService.leaveSession(
        sessionId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Leave VR session error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to leave VR session: ${error.message}`, 500);
    }
  };

  getVRSessionDetails: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const session = await vrCollaborativeReviewService.getSessionDetails(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }
      res.json(session);
    } catch (error) {
      logger.error('Get VR session details error', error);
      throw new AppError('Failed to get VR session details', 500);
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

  addVRVoiceAnnotation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const annotation = await vrCollaborativeReviewService.addVoiceAnnotation(
        sessionId,
        authReq.user!.id,
        req.body
      );
      res.json(annotation);
    } catch (error) {
      logger.error('Add VR voice annotation error', error);
      throw new AppError('Failed to add VR voice annotation', 500);
    }
  };

  editVRAnnotation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId, annotationId } = req.params;
      const annotation = await vrCollaborativeReviewService.editAnnotation(
        sessionId,
        annotationId,
        authReq.user!.id,
        req.body
      );
      res.json(annotation);
    } catch (error: any) {
      logger.error('Edit VR annotation error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to edit VR annotation: ${error.message}`, 500);
    }
  };

  deleteVRAnnotation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId, annotationId } = req.params;
      await vrCollaborativeReviewService.deleteAnnotation(
        sessionId,
        annotationId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete VR annotation error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete VR annotation: ${error.message}`, 500);
    }
  };

  getVRAnnotationHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, annotationId } = req.params;
      const history = await vrCollaborativeReviewService.getAnnotationHistory(
        sessionId,
        annotationId
      );
      res.json(history);
    } catch (error) {
      logger.error('Get VR annotation history error', error);
      throw new AppError('Failed to get VR annotation history', 500);
    }
  };

  exportVRAnnotations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { format, filters } = req.query;
      const exportData = await vrCollaborativeReviewService.exportAnnotations(
        sessionId,
        (format as any) || 'json',
        filters ? JSON.parse(filters as string) : undefined
      );
      res.json(exportData);
    } catch (error) {
      logger.error('Export VR annotations error', error);
      throw new AppError('Failed to export VR annotations', 500);
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

  trackVRTrainingProgress: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const { taskId, completed } = req.body;
      const progress = await vrCollaborativeReviewService.trackTrainingProgress(
        sessionId,
        authReq.user!.id,
        taskId,
        completed
      );
      res.json(progress);
    } catch (error) {
      logger.error('Track VR training progress error', error);
      throw new AppError('Failed to track VR training progress', 500);
    }
  };

  evaluateVRTraining: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const evaluation = await vrCollaborativeReviewService.evaluateTrainingPerformance(
        sessionId,
        authReq.user!.id
      );
      res.json(evaluation);
    } catch (error) {
      logger.error('Evaluate VR training error', error);
      throw new AppError('Failed to evaluate VR training', 500);
    }
  };

  completeVRTraining: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const certificate = await vrCollaborativeReviewService.completeTraining(
        sessionId,
        authReq.user!.id
      );
      res.json(certificate);
    } catch (error) {
      logger.error('Complete VR training error', error);
      throw new AppError('Failed to complete VR training', 500);
    }
  };

  getVRTrainingHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const history = await vrCollaborativeReviewService.getTrainingHistory(
        authReq.user!.id,
        authReq.user!.organizationId
      );
      res.json(history);
    } catch (error) {
      logger.error('Get VR training history error', error);
      throw new AppError('Failed to get VR training history', 500);
    }
  };

  sendVRChatMessage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const { message } = req.body;
      const chatMessage = await vrCollaborativeReviewService.sendChatMessage(
        sessionId,
        authReq.user!.id,
        message
      );
      res.json(chatMessage);
    } catch (error) {
      logger.error('Send VR chat message error', error);
      throw new AppError('Failed to send VR chat message', 500);
    }
  };

  getVRChatHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await vrCollaborativeReviewService.getChatHistory(sessionId, limit);
      res.json(history);
    } catch (error) {
      logger.error('Get VR chat history error', error);
      throw new AppError('Failed to get VR chat history', 500);
    }
  };

  toggleVRVoiceChat: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const { enabled } = req.body;
      const voiceChat = await vrCollaborativeReviewService.toggleVoiceChat(
        sessionId,
        authReq.user!.id,
        enabled
      );
      res.json(voiceChat);
    } catch (error: any) {
      logger.error('Toggle VR voice chat error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to toggle VR voice chat: ${error.message}`, 500);
    }
  };

  muteVRParticipant: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId, userId } = req.params;
      const { muted } = req.body;
      await vrCollaborativeReviewService.muteParticipant(
        sessionId,
        userId,
        muted,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Mute VR participant error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to mute VR participant: ${error.message}`, 500);
    }
  };

  updateVRPointer: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const { position } = req.body;
      await vrCollaborativeReviewService.updatePointer(
        sessionId,
        authReq.user!.id,
        position
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Update VR pointer error', error);
      throw new AppError('Failed to update VR pointer', 500);
    }
  };

  enableVRScreenSharing: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const { sharedView } = req.body;
      await vrCollaborativeReviewService.enableScreenSharing(
        sessionId,
        authReq.user!.id,
        sharedView
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Enable VR screen sharing error', error);
      throw new AppError('Failed to enable VR screen sharing', 500);
    }
  };

  disableVRScreenSharing: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      await vrCollaborativeReviewService.disableScreenSharing(
        sessionId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Disable VR screen sharing error', error);
      throw new AppError('Failed to disable VR screen sharing', 500);
    }
  };

  enableVRFollowMode: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId, targetUserId } = req.params;
      await vrCollaborativeReviewService.enableFollowMode(
        sessionId,
        authReq.user!.id,
        targetUserId
      );
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Enable VR follow mode error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to enable VR follow mode: ${error.message}`, 500);
    }
  };

  disableVRFollowMode: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      await vrCollaborativeReviewService.disableFollowMode(
        sessionId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Disable VR follow mode error', error);
      throw new AppError('Failed to disable VR follow mode', 500);
    }
  };

  enableVRPresenterMode: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      await vrCollaborativeReviewService.enablePresenterMode(
        sessionId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Enable VR presenter mode error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to enable VR presenter mode: ${error.message}`, 500);
    }
  };

  updateVREnvironment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sessionId } = req.params;
      const environment = await vrCollaborativeReviewService.updateEnvironment(
        sessionId,
        authReq.user!.organizationId
      );
      res.json(environment);
    } catch (error: any) {
      logger.error('Update VR environment error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update VR environment: ${error.message}`, 500);
    }
  };

  setVREnvironmentTheme: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { theme } = req.body;
      await vrCollaborativeReviewService.setEnvironmentTheme(sessionId, theme);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Set VR environment theme error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to set VR environment theme: ${error.message}`, 500);
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

  getAllSwarmTasks: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const tasks = swarmTaskAllocationService.getAllTasks(authReq.user!.organizationId);
      res.json(tasks);
    } catch (error) {
      logger.error('Get all swarm tasks error', error);
      throw new AppError('Failed to get all swarm tasks', 500);
    }
  };

  bulkSubmitSwarmTasks: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { tasks } = req.body;
      const result = await swarmTaskAllocationService.bulkSubmitTasks(
        authReq.user!.organizationId,
        tasks,
        authReq.user!.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Bulk submit swarm tasks error', error);
      throw new AppError('Failed to bulk submit swarm tasks', 500);
    }
  };

  reportSwarmTaskProgress: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId, agentId } = req.params;
      const { progress } = req.body;
      await swarmTaskAllocationService.reportProgress(taskId, agentId, progress);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Report swarm task progress error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to report progress: ${error.message}`, 500);
    }
  };

  completeSwarmTask: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { taskId, agentId } = req.params;
      const { result } = req.body;
      const task = await swarmTaskAllocationService.completeTask(
        taskId,
        agentId,
        result,
        authReq.user!.organizationId
      );
      res.json(task);
    } catch (error: any) {
      logger.error('Complete swarm task error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to complete task: ${error.message}`, 500);
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

  getSwarmHistoricalMetrics: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { startDate, endDate } = req.query;
      const history = swarmTaskAllocationService.getHistoricalMetrics(
        authReq.user!.organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(history);
    } catch (error) {
      logger.error('Get swarm historical metrics error', error);
      throw new AppError('Failed to get historical metrics', 500);
    }
  };

  getSwarmMetricAlerts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { resolved } = req.query;
      const alerts = swarmTaskAllocationService.getMetricAlerts(
        authReq.user!.organizationId,
        resolved !== undefined ? resolved === 'true' : undefined
      );
      res.json(alerts);
    } catch (error) {
      logger.error('Get swarm metric alerts error', error);
      throw new AppError('Failed to get metric alerts', 500);
    }
  };

  resolveSwarmMetricAlert: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { alertId } = req.params;
      await swarmTaskAllocationService.resolveMetricAlert(
        authReq.user!.organizationId,
        alertId,
        authReq.user!.id
      );
      res.json({ success: true });
    } catch (error) {
      logger.error('Resolve swarm metric alert error', error);
      throw new AppError('Failed to resolve metric alert', 500);
    }
  };

  exportSwarmMetrics: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { format, startDate, endDate } = req.query;
      const exportData = await swarmTaskAllocationService.exportMetrics(
        authReq.user!.organizationId,
        (format as any) || 'json',
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(exportData);
    } catch (error) {
      logger.error('Export swarm metrics error', error);
      throw new AppError('Failed to export metrics', 500);
    }
  };

  getSwarmDashboard: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const dashboard = swarmTaskAllocationService.getDashboard(authReq.user!.organizationId);
      res.json(dashboard);
    } catch (error) {
      logger.error('Get swarm dashboard error', error);
      throw new AppError('Failed to get swarm dashboard', 500);
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

  getSwarmAgentById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentId } = req.params;
      const agent = swarmTaskAllocationService.getAgentById(agentId);
      if (!agent) {
        throw new AppError('Agent not found', 404);
      }
      res.json(agent);
    } catch (error) {
      logger.error('Get swarm agent by ID error', error);
      throw new AppError('Failed to get swarm agent', 500);
    }
  };

  updateSwarmAgentStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { agentId } = req.params;
      const { status } = req.body;
      const agent = await swarmTaskAllocationService.updateAgentStatus(
        agentId,
        status,
        authReq.user!.organizationId
      );
      res.json(agent);
    } catch (error: any) {
      logger.error('Update swarm agent status error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update agent status: ${error.message}`, 500);
    }
  };

  deactivateSwarmAgent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { agentId } = req.params;
      const agent = await swarmTaskAllocationService.deactivateAgent(
        agentId,
        authReq.user!.organizationId
      );
      res.json(agent);
    } catch (error: any) {
      logger.error('Deactivate swarm agent error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to deactivate agent: ${error.message}`, 500);
    }
  };

  reactivateSwarmAgent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { agentId } = req.params;
      const agent = await swarmTaskAllocationService.reactivateAgent(
        agentId,
        authReq.user!.organizationId
      );
      res.json(agent);
    } catch (error: any) {
      logger.error('Reactivate swarm agent error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to reactivate agent: ${error.message}`, 500);
    }
  };

  getSwarmAgentWorkload: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentId } = req.params;
      const workload = swarmTaskAllocationService.getAgentWorkload(agentId);
      res.json(workload);
    } catch (error: any) {
      logger.error('Get swarm agent workload error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get agent workload: ${error.message}`, 500);
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
      const { frameworkId, severity, debtType, resolved, minAge, maxAge, page, limit } = req.query;
      const result = await acosService.getComplianceDebts(
        authReq.user!.organizationId,
        {
          frameworkId: frameworkId as string,
          severity: severity as string,
          debtType: debtType as string,
          resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
          minAge: minAge ? parseInt(minAge as string) : undefined,
          maxAge: maxAge ? parseInt(maxAge as string) : undefined,
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
        }
      );
      res.json(result);
    } catch (error) {
      logger.error('Get compliance debts error', error);
      throw new AppError('Failed to get compliance debts', 500);
    }
  };

  trackComplianceDebt: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const debt = await acosService.trackComplianceDebt(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(debt);
    } catch (error: any) {
      logger.error('Track compliance debt error', error);
      throw new AppError(`Failed to track compliance debt: ${error.message || 'Unknown error'}`, 500);
    }
  };

  calculateDebtFromGapAnalysis: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId } = req.body;
      const debts = await acosService.calculateDebtFromGapAnalysis(
        authReq.user!.organizationId,
        frameworkId,
        authReq.user!.id
      );
      res.json(debts);
    } catch (error: any) {
      logger.error('Calculate debt from gap analysis error', error);
      throw new AppError(`Failed to calculate debt: ${error.message || 'Unknown error'}`, 500);
    }
  };

  resolveComplianceDebt: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { debtId } = req.params;
      const result = await acosService.resolveComplianceDebt(
        debtId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Resolve compliance debt error', error);
      throw new AppError(`Failed to resolve debt: ${error.message || 'Unknown error'}`, 500);
    }
  };

  exportDebtReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { format } = req.query;
      const report = await acosService.exportDebtReport(
        authReq.user!.organizationId,
        (format as 'csv' | 'json') || 'json'
      );
      res.json(report);
    } catch (error: any) {
      logger.error('Export debt report error', error);
      throw new AppError(`Failed to export report: ${error.message || 'Unknown error'}`, 500);
    }
  };

  getChangeImpacts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { pending } = req.query;
      const impacts = pending === 'true' 
        ? await acosService.getPendingChangeImpacts(authReq.user!.organizationId)
        : await acosService.getChangeImpacts(authReq.user!.organizationId);
      res.json(impacts);
    } catch (error) {
      logger.error('Get change impacts error', error);
      throw new AppError('Failed to get change impacts', 500);
    }
  };

  forecastChangeImpact: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const impact = await acosService.forecastChangeImpact(
        authReq.user!.organizationId,
        req.body,
        authReq.user!.id
      );
      res.json(impact);
    } catch (error: any) {
      logger.error('Forecast change impact error', error);
      throw new AppError(`Failed to forecast impact: ${error.message || 'Unknown error'}`, 500);
    }
  };

  resolveChangeImpact: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { impactId } = req.params;
      const success = await acosService.resolveChangeImpact(
        impactId,
        authReq.user!.organizationId,
        authReq.user!.id
      );
      res.json({ success });
    } catch (error: any) {
      logger.error('Resolve change impact error', error);
      throw new AppError(`Failed to resolve impact: ${error.message || 'Unknown error'}`, 500);
    }
  };

  // NeuroSymbolic AI
  performHybridReasoning: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const reasoning = await neuroSymbolicAIService.performHybridReasoning(
        authReq.user!.organizationId,
        req.body.query,
        req.body.context
      );
      res.json(reasoning);
    } catch (error: any) {
      logger.error('Hybrid reasoning error', error);
      throw new AppError(`Failed to perform hybrid reasoning: ${error.message || 'Unknown error'}`, 500);
    }
  };

  inferRulesFromPatterns: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const inferences = await neuroSymbolicAIService.inferRulesFromPatterns(
        authReq.user!.organizationId,
        req.body.patterns
      );
      res.json({ inferences });
    } catch (error: any) {
      logger.error('Rule inference error', error);
      throw new AppError(`Failed to infer rules: ${error.message || 'Unknown error'}`, 500);
    }
  };

  performCausalReasoning: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const reasoning = await neuroSymbolicAIService.performCausalReasoning(
        authReq.user!.organizationId,
        req.body.violation
      );
      res.json(reasoning);
    } catch (error: any) {
      logger.error('Causal reasoning error', error);
      throw new AppError(`Failed to perform causal reasoning: ${error.message || 'Unknown error'}`, 500);
    }
  };

  generateExplainableDecision: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const decision = await neuroSymbolicAIService.generateExplainableDecision(
        authReq.user!.organizationId,
        req.body.decision
      );
      res.json(decision);
    } catch (error: any) {
      logger.error('Explainable decision error', error);
      throw new AppError(`Failed to generate explainable decision: ${error.message || 'Unknown error'}`, 500);
    }
  };

  getReasoningHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await neuroSymbolicAIService.getReasoningHistory(
        authReq.user!.organizationId,
        limit
      );
      res.json({ history });
    } catch (error: any) {
      logger.error('Get reasoning history error', error);
      throw new AppError(`Failed to get reasoning history: ${error.message || 'Unknown error'}`, 500);
    }
  };

  validateInferredRule: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { inferenceId } = req.params;
      const validated = req.body.validated === true;
      const rule = await neuroSymbolicAIService.validateInferredRule(
        inferenceId,
        authReq.user!.organizationId,
        authReq.user!.id,
        validated
      );
      res.json(rule);
    } catch (error: any) {
      logger.error('Validate inferred rule error', error);
      throw new AppError(`Failed to validate rule: ${error.message || 'Unknown error'}`, 500);
    }
  };
}

export default new ACOSController();

