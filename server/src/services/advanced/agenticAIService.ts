/**
 * Agentic AI Service with Safe Autonomy, Rollback, and Blast-Radius Estimation
 * 
 * Features:
 * - Autonomous execution with safety boundaries
 * - Automatic rollback on failure
 * - Blast-radius estimation before actions
 * - Human-in-the-loop checkpoints
 * - Action history and audit trail
 */

import prisma from '../../config/database';
import { Prisma, RiskStatus } from '../../generated/prisma/client';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

/** Rollback checkpoint data stored as JSON */
interface RollbackCheckpoint {
  timestamp?: string;
  expiresAt?: string;
  controlId?: string;
  previousStatus?: string;
  previousDescription?: string | null;
  previousEvidence?: string | null;
  riskId?: string;
  previousMitigationPlan?: string | null;
  [key: string]: unknown;
}

/** Stored action parameters (extends the user-provided parameters) */
interface ActionParameters {
  lockKey?: string;
  lockedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  dependencies?: string[];
  [key: string]: unknown;
}

export interface AgenticAction {
  id: string;
  actionType: 'control_update' | 'policy_create' | 'risk_mitigation' | 'evidence_upload';
  targetId: string;
  parameters: ActionParameters;
  blastRadius: BlastRadiusEstimate;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'rolled_back' | 'failed';
  rollbackData?: RollbackCheckpoint;
  executedAt?: Date;
  rolledBackAt?: Date;
}

export interface BlastRadiusEstimate {
  affectedControls: number;
  affectedFrameworks: number;
  affectedRisks: number;
  estimatedUsers: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  canRollback: boolean;
  rollbackComplexity: 'simple' | 'moderate' | 'complex';
}

class AgenticAIService {
  /**
   * Estimate blast radius before taking an action (comprehensive with indirect impacts)
   */
  async estimateBlastRadius(
    organizationId: string,
    action: {
      actionType: string;
      targetId: string;
      parameters: ActionParameters;
    }
  ): Promise<BlastRadiusEstimate & { riskScore: number; directImpacts: string[]; indirectImpacts: string[]; hasCircularReferences: boolean }> {
    try {
      const startTime = Date.now();
      
      // Check if entity exists
      if (!action.targetId) {
        throw new AppError('Target ID is required', 400);
      }

      let affectedControls = 0;
      let affectedFrameworks = 0;
      let affectedRisks = 0;
      let estimatedUsers = 0;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let canRollback = true;
      let rollbackComplexity: 'simple' | 'moderate' | 'complex' = 'simple';
      const directImpacts: string[] = [];
      const indirectImpacts: string[] = [];
      let hasCircularReferences = false;
      const visited = new Set<string>();

      // Analyze impact based on action type
      if (action.actionType === 'control_update') {
        const result = await this.analyzeControlUpdateBlastRadius(
          action.targetId,
          organizationId,
          visited,
          directImpacts,
          indirectImpacts
        );
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
        riskLevel = result.riskLevel;
        canRollback = result.canRollback;
        rollbackComplexity = result.rollbackComplexity;
        hasCircularReferences = result.hasCircularReferences;
      } else if (action.actionType === 'policy_create') {
        const result = await this.analyzePolicyChangeBlastRadius(organizationId);
        affectedFrameworks = result.affectedFrameworks;
        affectedControls = result.affectedControls;
        riskLevel = 'low';
        canRollback = true;
        rollbackComplexity = 'simple';
      } else if (action.actionType === 'evidence_delete') {
        const result = await this.analyzeEvidenceDeletionBlastRadius(action.targetId, organizationId);
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
        riskLevel = result.riskLevel;
        canRollback = false; // Evidence deletion may not be fully rollbackable
        rollbackComplexity = 'complex';
      } else if (action.actionType === 'risk_mitigation') {
        const risk = await prisma.riskItem.findUnique({
          where: { id: action.targetId },
        });

        if (!risk) {
          throw new AppError('Risk not found', 404);
        }

        affectedRisks = 1;
        riskLevel = risk.severity === 'Critical' ? 'critical' : 
                   risk.severity === 'High' ? 'high' : 'medium';
        canRollback = true;
        rollbackComplexity = 'moderate';
      } else {
        throw new AppError(`Unknown action type: ${action.actionType}`, 400);
      }

      // Estimate users affected
      estimatedUsers = await prisma.user.count({
        where: { organizationId },
      });

      // Calculate risk score (0-1)
      const riskScore = this.calculateRiskScore(
        affectedControls,
        affectedFrameworks,
        affectedRisks,
        riskLevel,
        hasCircularReferences
      );

      const confidence = 0.8; // Can be enhanced with ML

      // Performance check
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        logger.warn(`[Agentic AI] Blast radius calculation took ${duration}ms (threshold: 5000ms)`);
      }

      const result = {
        affectedControls,
        affectedFrameworks,
        affectedRisks,
        estimatedUsers,
        riskLevel,
        confidence,
        canRollback,
        rollbackComplexity,
        riskScore,
        directImpacts,
        indirectImpacts,
        hasCircularReferences,
      };

      // Check if blast radius exceeds threshold
      const threshold = 0.7; // 70% risk score threshold
      if (result.riskScore > threshold || result.riskLevel === 'critical') {
        logger.warn(`[Agentic AI] Blast radius exceeds threshold: ${result.riskScore}, risk level: ${result.riskLevel}`);
      }

      return result;
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new AppError(`Entity not found: ${action.targetId}`, 404);
      }
      logger.error('[Agentic AI] Error estimating blast radius', error);
      throw error;
    }
  }

  /**
   * Analyze control update blast radius with indirect impacts
   */
  private async analyzeControlUpdateBlastRadius(
    controlId: string,
    organizationId: string,
    visited: Set<string>,
    directImpacts: string[],
    indirectImpacts: string[]
  ): Promise<{
    affectedControls: number;
    affectedFrameworks: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    canRollback: boolean;
    rollbackComplexity: 'simple' | 'moderate' | 'complex';
    hasCircularReferences: boolean;
  }> {
    // Check for circular reference
    if (visited.has(controlId)) {
      return {
        affectedControls: 0,
        affectedFrameworks: 0,
        riskLevel: 'critical',
        canRollback: false,
        rollbackComplexity: 'complex',
        hasCircularReferences: true,
      };
    }

    visited.add(controlId);

    const control = await prisma.frameworkControl.findUnique({
      where: { id: controlId },
      include: { framework: true },
    });

    if (!control) {
      throw new AppError('Control not found', 404);
    }

    let affectedControls = 1;
    const affectedFrameworks = new Set<string>([control.frameworkId]);
    directImpacts.push(`control:${controlId}`);

    // Find direct dependencies (controls that reference this one)
    const allControls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
      },
    });

    // Find indirect impacts (downstream dependencies)
    for (const ctrl of allControls) {
      if (ctrl.mappedControls) {
        const mapped = ctrl.mappedControls as unknown as string[];
        if (Array.isArray(mapped) && mapped.includes(controlId)) {
          if (!visited.has(ctrl.id)) {
            indirectImpacts.push(`control:${ctrl.id}`);
            affectedControls++;
            affectedFrameworks.add(ctrl.frameworkId);
            
            // Recursively check for deeper dependencies (with depth limit)
            if (visited.size < 100) { // Prevent infinite recursion
              const deeper = await this.analyzeControlUpdateBlastRadius(
                ctrl.id,
                organizationId,
                visited,
                directImpacts,
                indirectImpacts
              );
              affectedControls += deeper.affectedControls;
              // Note: deeper.affectedFrameworks is a number (count), not a Set
              // We've already added the framework above, so we just need to track the count
            }
          }
        }
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (control.status === 'Implemented' || control.status === 'Compliant') {
      riskLevel = affectedControls > 5 ? 'critical' :
                  affectedControls > 2 ? 'high' : 'medium';
    } else {
      riskLevel = affectedControls > 10 ? 'high' :
                  affectedControls > 5 ? 'medium' : 'low';
    }

    const canRollback = true;
    const rollbackComplexity: 'simple' | 'moderate' | 'complex' = 
      affectedControls > 10 ? 'complex' :
      affectedControls > 5 ? 'moderate' : 'simple';

    return {
      affectedControls,
      affectedFrameworks: affectedFrameworks.size,
      riskLevel,
      canRollback,
      rollbackComplexity,
      hasCircularReferences: false,
    };
  }

  /**
   * Analyze policy change blast radius
   */
  private async analyzePolicyChangeBlastRadius(organizationId: string): Promise<{
    affectedControls: number;
    affectedFrameworks: number;
  }> {
    // Find all controls that might be related to policies
    const allControls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
      },
    });

    // Estimate: policies typically affect multiple controls
    const affectedControls = Math.min(allControls.length, 20); // Cap at 20 for performance
    const affectedFrameworks = await prisma.complianceFramework.count({
      where: { organizationId },
    });

    return { affectedControls, affectedFrameworks };
  }

  /**
   * Analyze evidence deletion blast radius
   */
  private async analyzeEvidenceDeletionBlastRadius(
    evidenceId: string,
    organizationId: string
  ): Promise<{
    affectedControls: number;
    affectedFrameworks: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // Find controls that use this evidence
    const allControls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
      },
    });

    let affectedControls = 0;
    const affectedFrameworks = new Set<string>();

    for (const control of allControls) {
      if (control.evidence && (control.evidence as string).includes(evidenceId)) {
        affectedControls++;
        affectedFrameworks.add(control.frameworkId);
      }
    }

    const riskLevel: 'low' | 'medium' | 'high' | 'critical' = 
      affectedControls > 5 ? 'critical' :
      affectedControls > 2 ? 'high' :
      affectedControls > 0 ? 'medium' : 'low';

    return {
      affectedControls,
      affectedFrameworks: affectedFrameworks.size,
      riskLevel,
    };
  }

  /**
   * Calculate risk score (0-1) based on impact
   */
  private calculateRiskScore(
    affectedControls: number,
    affectedFrameworks: number,
    affectedRisks: number,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    hasCircularReferences: boolean
  ): number {
    // Base score from risk level
    const riskLevelScores: Record<string, number> = {
      low: 0.2,
      medium: 0.4,
      high: 0.7,
      critical: 0.9,
    };

    let score = riskLevelScores[riskLevel] || 0.2;

    // Adjust for scale
    const controlFactor = Math.min(1, affectedControls / 50); // Normalize to 0-1
    const frameworkFactor = Math.min(1, affectedFrameworks / 10);
    const riskFactor = Math.min(1, affectedRisks / 20);

    score = score * 0.5 + (controlFactor * 0.2 + frameworkFactor * 0.2 + riskFactor * 0.1);

    // Penalty for circular references
    if (hasCircularReferences) {
      score = Math.min(1, score + 0.3);
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Execute an agentic action with safety checks, checkpoints, and dependency handling
   */
  async executeAction(
    organizationId: string,
    action: {
      actionType: string;
      targetId: string;
      parameters: Record<string, any>;
      dependencies?: string[]; // Action IDs that must complete first
      preconditions?: Record<string, any>; // Conditions that must be met
      timeoutSeconds?: number;
    },
    userId: string,
    autoApprove: boolean = false
  ): Promise<AgenticAction> {
    try {
      // Check for concurrent execution locks
      const lockKey = `action_${action.actionType}_${action.targetId}`;
      if (await this.isActionLocked(lockKey, organizationId)) {
        throw new AppError('Action is currently being executed by another process', 409);
      }

      // Validate preconditions
      if (action.preconditions) {
        const preconditionsMet = await this.validatePreconditions(
          action.preconditions,
          organizationId,
          action.targetId
        );
        if (!preconditionsMet.valid) {
          throw new AppError(`Preconditions not met: ${preconditionsMet.reason}`, 400);
        }
      }

      // Check dependencies
      if (action.dependencies && action.dependencies.length > 0) {
        const dependenciesStatus = await this.checkDependencies(
          action.dependencies,
          organizationId
        );
        if (!dependenciesStatus.allComplete) {
          throw new AppError(`Dependencies not complete: ${dependenciesStatus.pending.join(', ')}`, 400);
        }
      }

      // Estimate blast radius
      const blastRadius = await this.estimateBlastRadius(organizationId, action);

      // Check threshold - block if exceeds
      const threshold = 0.8; // 80% risk score threshold for blocking
      if (blastRadius.riskScore > threshold && !autoApprove) {
        throw new AppError(
          `Action blocked: Blast radius risk score (${blastRadius.riskScore}) exceeds threshold (${threshold}). ` +
          `This action would affect ${blastRadius.affectedControls} controls and ${blastRadius.affectedFrameworks} frameworks.`,
          400
        );
      }

      // Determine if approval is required
      const requiresApproval = !autoApprove && (
        blastRadius.riskLevel === 'high' || 
        blastRadius.riskLevel === 'critical' ||
        !blastRadius.canRollback ||
        blastRadius.riskScore > 0.7
      );

      const crypto = await import('crypto');
      const actionId = crypto.randomUUID();

      // Create action record in database
      const dbAction = await prisma.agenticAction.create({
        data: {
          id: actionId,
          organizationId,
          actionType: action.actionType,
          targetId: action.targetId,
          parameters: action.parameters || {},
          blastRadius: blastRadius as unknown as Prisma.InputJsonValue,
          requiresApproval,
          status: requiresApproval ? 'pending' : 'approved',
          createdBy: userId,
        },
      });

      const agenticAction: AgenticAction = {
        id: dbAction.id,
        actionType: action.actionType as AgenticAction['actionType'],
        targetId: action.targetId,
        parameters: action.parameters,
        blastRadius,
        requiresApproval,
        status: dbAction.status as AgenticAction['status'],
      };

      // Lock action using database-based locking
      await this.lockAction(lockKey, organizationId, actionId);
      logger.info(`[Agentic AI] Action locked: ${lockKey}`);

      // Execute if approved
      if (!requiresApproval || autoApprove) {
        try {
          return await this.executeActionInternal(agenticAction, organizationId, userId, action.timeoutSeconds);
        } finally {
          // Unlock action
          await this.unlockAction(lockKey, organizationId);
          logger.info(`[Agentic AI] Action unlocked: ${lockKey}`);
        }
      }

      return agenticAction;
    } catch (error: any) {
      logger.error('[Agentic AI] Error executing action', error);
      throw error;
    }
  }

  /**
   * Internal method to execute an action with checkpoint, timeout, and partial failure handling
   */
  private async executeActionInternal(
    agenticAction: AgenticAction,
    organizationId: string,
    userId: string,
    timeoutSeconds: number = 300
  ): Promise<AgenticAction> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    try {
      // Update status to executing
      await prisma.agenticAction.update({
        where: { id: agenticAction.id },
        data: {
          status: 'executing',
          executedAt: new Date(),
        },
      });

      agenticAction.status = 'executing';
      agenticAction.executedAt = new Date();

      // Create checkpoint before executing
      const checkpoint = await this.createCheckpoint(agenticAction, organizationId);
      agenticAction.rollbackData = checkpoint;

      // Execute with timeout
      const executionPromise = this.executeActionSteps(agenticAction, organizationId, userId);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Action execution timeout')), timeoutMs);
      });

      let executionResult: { success: boolean; partialFailures?: string[] };
      try {
        executionResult = await Promise.race([executionPromise, timeoutPromise]);
      } catch (timeoutError: any) {
        if (timeoutError.message === 'Action execution timeout') {
          logger.error(`[Agentic AI] Action ${agenticAction.id} timed out after ${timeoutSeconds}s`);
          // Rollback on timeout
          await this.rollbackAction(agenticAction, organizationId, userId);
          agenticAction.status = 'rolled_back';
          throw new AppError(`Action timed out after ${timeoutSeconds} seconds`, 408);
        }
        throw timeoutError;
      }

      // Handle partial failures
      if (executionResult.partialFailures && executionResult.partialFailures.length > 0) {
        logger.warn(`[Agentic AI] Action ${agenticAction.id} had partial failures: ${executionResult.partialFailures.join(', ')}`);
        // Store partial failures in action
        await prisma.agenticAction.update({
          where: { id: agenticAction.id },
          data: {
            parameters: {
              ...(agenticAction.parameters || {}),
              _partialFailures: executionResult.partialFailures,
            },
          },
        });
      }

      if (executionResult.success) {
        await prisma.agenticAction.update({
          where: { id: agenticAction.id },
          data: { status: 'completed' },
        });
        agenticAction.status = 'completed';
      } else {
        // Auto-rollback on failure
        await this.rollbackAction(agenticAction, organizationId, userId);
        await prisma.agenticAction.update({
          where: { id: agenticAction.id },
          data: { status: 'rolled_back' },
        });
        agenticAction.status = 'rolled_back';
      }

      // Log execution
      await prisma.auditLog.create({
        data: {
          action: `agentic_ai.action_${agenticAction.status}`,
          details: JSON.stringify({
            actionId: agenticAction.id,
            status: agenticAction.status,
            duration: Date.now() - startTime,
            partialFailures: executionResult.partialFailures,
          }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      return agenticAction;
    } catch (error) {
      logger.error('[Agentic AI] Error in action execution', error);
      // Auto-rollback on error
      try {
        await this.rollbackAction(agenticAction, organizationId, userId);
        agenticAction.status = 'rolled_back';
      } catch (rollbackError) {
        logger.error('[Agentic AI] Rollback failed', rollbackError);
        agenticAction.status = 'failed';
      }
      
      await prisma.agenticAction.update({
        where: { id: agenticAction.id },
        data: { status: agenticAction.status },
      });

      throw error;
    }
  }

  /**
   * Execute action steps (can have multiple steps for partial failure handling)
   */
  private async executeActionSteps(
    agenticAction: AgenticAction,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; partialFailures?: string[] }> {
    const partialFailures: string[] = [];
    let overallSuccess = true;

    try {
      if (agenticAction.actionType === 'control_update') {
        const success = await this.executeControlUpdate(agenticAction, organizationId);
        if (!success) {
          partialFailures.push('control_update');
          overallSuccess = false;
        }
      } else if (agenticAction.actionType === 'policy_create') {
        const success = await this.executePolicyCreate(agenticAction, organizationId, userId);
        if (!success) {
          partialFailures.push('policy_create');
          overallSuccess = false;
        }
      } else if (agenticAction.actionType === 'risk_mitigation') {
        const success = await this.executeRiskMitigation(agenticAction, organizationId);
        if (!success) {
          partialFailures.push('risk_mitigation');
          overallSuccess = false;
        }
      }

      return {
        success: overallSuccess,
        partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
      };
    } catch (error) {
      logger.error('[Agentic AI] Error executing action steps', error);
      return { success: false, partialFailures: ['execution_error'] };
    }
  }

  /**
   * Create checkpoint for rollback
   */
  private async createCheckpoint(
    agenticAction: AgenticAction,
    organizationId: string
  ): Promise<RollbackCheckpoint> {
    const checkpoint = await this.captureRollbackData(agenticAction, organizationId);
    
    // Store checkpoint with timestamp (retain for 30 days)
    const checkpointData = {
      ...checkpoint,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    // Store in action rollbackData field
    await prisma.agenticAction.update({
      where: { id: agenticAction.id },
      data: {
        rollbackData: checkpointData as unknown as Prisma.InputJsonValue,
      },
    });

    return checkpointData;
  }

  /**
   * Capture rollback data before executing an action
   */
  private async captureRollbackData(
    agenticAction: AgenticAction,
    organizationId: string
  ): Promise<RollbackCheckpoint> {
    if (agenticAction.actionType === 'control_update') {
      const control = await prisma.frameworkControl.findUnique({
        where: { id: agenticAction.targetId },
      });
      return {
        controlId: control?.id,
        previousStatus: control?.status,
        previousDescription: control?.description,
        previousEvidence: control?.evidence,
      };
    } else if (agenticAction.actionType === 'risk_mitigation') {
      const risk = await prisma.riskItem.findUnique({
        where: { id: agenticAction.targetId },
      });
      return {
        riskId: risk?.id,
        previousStatus: risk?.status,
        previousMitigationPlan: risk?.mitigationPlan,
      };
    }

    return {};
  }

  /**
   * Execute control update action
   */
  private async executeControlUpdate(
    agenticAction: AgenticAction,
    organizationId: string
  ): Promise<boolean> {
    try {
      const { status, description, evidence } = agenticAction.parameters;

      // Verify ownership via parent framework (defense-in-depth)
      const control = await prisma.frameworkControl.findFirst({
        where: {
          id: agenticAction.targetId,
          framework: { organizationId },
        },
      });
      if (!control) {
        throw new AppError('Framework control not found', 404);
      }

      await prisma.frameworkControl.update({
        where: { id: agenticAction.targetId },
        data: {
          ...(status ? { status: status as string } : {}),
          ...(description ? { description: description as string } : {}),
          ...(evidence ? { evidence: evidence as string } : {}),
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      logger.error('[Agentic AI] Control update failed', error);
      return false;
    }
  }

  /**
   * Execute policy create action
   */
  private async executePolicyCreate(
    agenticAction: AgenticAction,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { title, content, category } = agenticAction.parameters;

      await prisma.policy.create({
        data: {
          organizationId,
          title: title as string,
          content: content as string,
          category: (category as string) || 'General',
          owner: userId,
          status: 'Draft',
        },
      });

      return true;
    } catch (error) {
      logger.error('[Agentic AI] Policy create failed', error);
      return false;
    }
  }

  /**
   * Execute risk mitigation action
   */
  private async executeRiskMitigation(
    agenticAction: AgenticAction,
    organizationId: string
  ): Promise<boolean> {
    try {
      const { mitigationPlan, status } = agenticAction.parameters;

      // Verify ownership before update (defense-in-depth)
      const riskRecord = await prisma.riskItem.findFirst({
        where: { id: agenticAction.targetId, organizationId },
      });
      if (!riskRecord) {
        throw new AppError('Risk item not found', 404);
      }

      await prisma.riskItem.update({
        where: { id: agenticAction.targetId },
        data: {
          ...(mitigationPlan ? { mitigationPlan: mitigationPlan as string } : {}),
          ...(status ? { status: status as RiskStatus } : {}),
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      logger.error('[Agentic AI] Risk mitigation failed', error);
      return false;
    }
  }

  /**
   * Rollback a single action
   */
  async rollbackAction(
    agenticAction: AgenticAction | string,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; conflicts?: string[] }> {
    const startTime = Date.now();
    
    try {
      // If actionId is provided, fetch the action
      let action: AgenticAction;
      if (typeof agenticAction === 'string') {
        const dbAction = await prisma.agenticAction.findFirst({
          where: {
            id: agenticAction,
            organizationId,
          },
        });

        if (!dbAction) {
          throw new AppError('Action not found', 404);
        }

        if (dbAction.status === 'rolled_back') {
          throw new AppError('Action already rolled back', 409);
        }

        action = {
          id: dbAction.id,
          actionType: dbAction.actionType as AgenticAction['actionType'],
          targetId: dbAction.targetId,
          parameters: (dbAction.parameters as unknown as ActionParameters) || {},
          blastRadius: dbAction.blastRadius as unknown as BlastRadiusEstimate,
          requiresApproval: dbAction.requiresApproval,
          status: dbAction.status as AgenticAction['status'],
          rollbackData: dbAction.rollbackData as unknown as RollbackCheckpoint,
          executedAt: dbAction.executedAt || undefined,
          rolledBackAt: dbAction.rolledBackAt || undefined,
        };
      } else {
        action = agenticAction;
      }

      if (!action.rollbackData) {
        logger.warn('[Agentic AI] No rollback data available');
        return { success: false };
      }

      // Check if checkpoint is expired (30 days)
      const checkpoint = action.rollbackData as RollbackCheckpoint;
      if (checkpoint.expiresAt) {
        const expiresAt = new Date(checkpoint.expiresAt);
        if (expiresAt < new Date()) {
          throw new AppError('Checkpoint expired (older than 30 days)', 400);
        }
      }

      // Check for conflicts (other actions that depend on this one)
      const conflicts = await this.detectRollbackConflicts(action.id, organizationId);

      // Rollback dependent actions first (if any)
      if (conflicts.dependentActions.length > 0) {
        logger.info(`[Agentic AI] Rolling back ${conflicts.dependentActions.length} dependent actions first`);
        for (const depActionId of conflicts.dependentActions) {
          await this.rollbackAction(depActionId, organizationId, userId);
        }
      }

      // Perform rollback
      const rollbackSuccess = await this.performRollback(action, organizationId);

      if (rollbackSuccess) {
        await prisma.agenticAction.update({
          where: { id: action.id },
          data: {
            status: 'rolled_back',
            rolledBackAt: new Date(),
          },
        });

        action.status = 'rolled_back';
        action.rolledBackAt = new Date();

        // Log rollback
        await prisma.auditLog.create({
          data: {
            action: 'agentic_ai.action_rolled_back',
            details: JSON.stringify({
              actionId: action.id,
              duration: Date.now() - startTime,
              conflicts: conflicts.conflicts,
            }),
            userId,
            organizationId,
            hash: (await import('crypto')).randomBytes(16).toString('hex'),
          },
        });

        logger.info(`[Agentic AI] Action rolled back: ${action.id} in ${Date.now() - startTime}ms`);

        return {
          success: true,
          conflicts: conflicts.conflicts.length > 0 ? conflicts.conflicts : undefined,
        };
      }

      return { success: false };
    } catch (error: any) {
      logger.error('[Agentic AI] Rollback failed', error);
      if (error.message?.includes('already rolled back')) {
        return { success: false };
      }
      throw error;
    }
  }

  /**
   * Rollback multiple actions in order
   */
  async rollbackMultipleActions(
    actionIds: string[],
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; rolledBack: string[]; failed: string[]; conflicts: string[] }> {
    const startTime = Date.now();
    const rolledBack: string[] = [];
    const failed: string[] = [];
    const allConflicts: string[] = [];

    try {
      // Get all actions and sort by execution time (newest first - rollback in reverse order)
      const actions = await prisma.agenticAction.findMany({
        where: {
          id: { in: actionIds },
          organizationId,
        },
        orderBy: {
          executedAt: 'desc',
        },
      });

      // Rollback each action
      for (const action of actions) {
        try {
          const result = await this.rollbackAction(action.id, organizationId, userId);
          if (result.success) {
            rolledBack.push(action.id);
            if (result.conflicts) {
              allConflicts.push(...result.conflicts);
            }
          } else {
            failed.push(action.id);
          }
        } catch (error: any) {
          logger.error(`[Agentic AI] Failed to rollback action ${action.id}`, error);
          failed.push(action.id);
        }
      }

      logger.info(`[Agentic AI] Rolled back ${rolledBack.length}/${actions.length} actions in ${Date.now() - startTime}ms`);

      return {
        success: failed.length === 0,
        rolledBack,
        failed,
        conflicts: allConflicts,
      };
    } catch (error) {
      logger.error('[Agentic AI] Error rolling back multiple actions', error);
      throw error;
    }
  }

  /**
   * Perform the actual rollback operation
   */
  private async performRollback(
    action: AgenticAction,
    organizationId: string
  ): Promise<boolean> {
    try {
      const rollback = action.rollbackData as RollbackCheckpoint;

      // Restore previous state based on action type
      if (action.actionType === 'control_update') {
        // Verify ownership before rollback (defense-in-depth)
        const controlRecord = await prisma.frameworkControl.findFirst({
          where: { id: action.targetId, framework: { organizationId } },
        });
        if (!controlRecord) {
          throw new AppError('Control not found', 404);
        }

        await prisma.frameworkControl.update({
          where: { id: action.targetId },
          data: {
            status: rollback.previousStatus,
            description: rollback.previousDescription,
            evidence: rollback.previousEvidence,
            updatedAt: new Date(),
          },
        });
      } else if (action.actionType === 'risk_mitigation') {
        // Verify ownership before rollback (defense-in-depth)
        const riskRecord = await prisma.riskItem.findFirst({
          where: { id: action.targetId, organizationId },
        });
        if (!riskRecord) {
          throw new AppError('Risk item not found', 404);
        }

        await prisma.riskItem.update({
          where: { id: action.targetId },
          data: {
            ...(rollback.previousStatus ? { status: rollback.previousStatus as any } : {}),
            mitigationPlan: rollback.previousMitigationPlan,
            updatedAt: new Date(),
          },
        });
      } else if (action.actionType === 'policy_create') {
        // Verify ownership before rollback (defense-in-depth)
        const policyRecord = await prisma.policy.findFirst({
          where: { id: action.targetId, organizationId },
        });
        if (!policyRecord) {
          throw new AppError('Policy not found', 404);
        }

        await prisma.policy.delete({
          where: { id: action.targetId },
        });
      }

      return true;
    } catch (error) {
      logger.error('[Agentic AI] Error performing rollback', error);
      return false;
    }
  }

  /**
   * Detect conflicts when rolling back an action
   */
  private async detectRollbackConflicts(
    actionId: string,
    organizationId: string
  ): Promise<{ conflicts: string[]; dependentActions: string[] }> {
    try {
      const conflicts: string[] = [];
      const dependentActions: string[] = [];

      // Find actions that depend on this one (check parameters for dependency references)
      const allActions = await prisma.agenticAction.findMany({
        where: {
          organizationId,
          status: { in: ['completed', 'executing'] },
        },
      });

      for (const action of allActions) {
        const params = action.parameters as unknown as ActionParameters;
        if (params.dependencies && Array.isArray(params.dependencies)) {
          if (params.dependencies.includes(actionId)) {
            dependentActions.push(action.id);
            conflicts.push(`Action ${action.id} depends on ${actionId}`);
          }
        }
      }

      return { conflicts, dependentActions };
    } catch (error) {
      logger.error('[Agentic AI] Error detecting rollback conflicts', error);
      return { conflicts: [], dependentActions: [] };
    }
  }

  /**
   * Clean up expired checkpoints (older than 30 days)
   */
  async cleanupExpiredCheckpoints(organizationId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const actions = await prisma.agenticAction.findMany({
        where: {
          organizationId,
          status: { in: ['completed', 'rolled_back'] },
          executedAt: { lte: thirtyDaysAgo },
        },
      });

      let cleaned = 0;
      for (const action of actions) {
        const rollbackData = action.rollbackData as unknown as RollbackCheckpoint;
        if (rollbackData?.expiresAt) {
          const expiresAt = new Date(rollbackData.expiresAt);
          if (expiresAt < new Date()) {
            // Clear rollback data but keep action record
            await prisma.agenticAction.update({
              where: { id: action.id },
              data: {
                rollbackData: Prisma.JsonNull,
              },
            });
            cleaned++;
          }
        }
      }

      logger.info(`[Agentic AI] Cleaned up ${cleaned} expired checkpoints`);
      return cleaned;
    } catch (error) {
      logger.error('[Agentic AI] Error cleaning up checkpoints', error);
      return 0;
    }
  }

  /**
   * Approve a pending action
   */
  async approveAction(
    actionId: string,
    organizationId: string,
    userId: string
  ): Promise<AgenticAction> {
    // Retrieve action from the dedicated AgenticAction table
    const dbAction = await prisma.agenticAction.findFirst({
      where: {
        id: actionId,
        organizationId,
      },
    });

    if (!dbAction) {
      throw new AppError(`Action ${actionId} not found`, 404);
    }

    if (dbAction.status !== 'pending') {
      throw new AppError(`Action ${actionId} is not pending approval (current status: ${dbAction.status})`, 400);
    }

    // Update status to approved and store approval metadata in parameters
    const existingParams = (dbAction.parameters as Record<string, any>) || {};
    await prisma.agenticAction.update({
      where: { id: actionId },
      data: {
        status: 'approved',
        parameters: {
          ...existingParams,
          approvedBy: userId,
          approvedAt: new Date().toISOString(),
        },
      },
    });

    // Reconstruct the full action from stored database record
    const storedBlastRadius = (dbAction.blastRadius as unknown as BlastRadiusEstimate) || {} as BlastRadiusEstimate;
    const action: AgenticAction = {
      id: dbAction.id,
      actionType: dbAction.actionType as AgenticAction['actionType'],
      targetId: dbAction.targetId,
      parameters: (dbAction.parameters as unknown as ActionParameters) || {},
      blastRadius: {
        affectedControls: storedBlastRadius.affectedControls ?? 0,
        affectedFrameworks: storedBlastRadius.affectedFrameworks ?? 0,
        affectedRisks: storedBlastRadius.affectedRisks ?? 0,
        estimatedUsers: storedBlastRadius.estimatedUsers ?? 0,
        riskLevel: storedBlastRadius.riskLevel ?? 'low',
        confidence: storedBlastRadius.confidence ?? 0.8,
        canRollback: storedBlastRadius.canRollback ?? true,
        rollbackComplexity: storedBlastRadius.rollbackComplexity ?? 'simple',
      },
      requiresApproval: dbAction.requiresApproval,
      status: 'approved',
    };

    // Log approval audit trail
    await prisma.auditLog.create({
      data: {
        action: 'agentic_action.approved',
        details: JSON.stringify({
          actionId,
          actionType: action.actionType,
          targetId: action.targetId,
          approvedBy: userId,
          blastRadius: action.blastRadius,
        }),
        userId,
        organizationId,
        hash: (await import('crypto')).randomBytes(16).toString('hex'),
      },
    });

    logger.info(`[Agentic AI] Action approved: ${actionId} by user ${userId}`);

    return await this.executeActionInternal(action, organizationId, userId);
  }

  /**
   * Check if an action is currently locked
   */
  private async isActionLocked(lockKey: string, organizationId: string): Promise<boolean> {
    try {
      // Use database to track action locks with expiration
      const lock = await prisma.agenticAction.findFirst({
        where: {
          organizationId,
          status: 'executing',
          parameters: {
            path: ['lockKey'],
            equals: lockKey,
          },
        },
      });

      if (lock) {
        // Check if lock is still valid (not expired)
        const lockTimeout = 5 * 60 * 1000; // 5 minutes
        const lockAge = Date.now() - (lock.executedAt?.getTime() || 0);
        if (lockAge < lockTimeout) {
          return true;
        }
        // Lock expired, clean it up
        await this.unlockAction(lockKey, organizationId);
      }

      return false;
    } catch (error) {
      logger.error('[Agentic AI] Error checking action lock', error);
      return false; // Fail open to prevent blocking
    }
  }

  /**
   * Lock an action to prevent concurrent execution
   */
  private async lockAction(lockKey: string, organizationId: string, actionId: string): Promise<void> {
    try {
      // Store lock in action parameters
      await prisma.agenticAction.update({
        where: { id: actionId },
        data: {
          parameters: {
            ...((await prisma.agenticAction.findUnique({ where: { id: actionId } }))?.parameters as unknown as ActionParameters),
            lockKey,
            lockedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('[Agentic AI] Error locking action', error);
      throw new AppError('Failed to lock action', 500);
    }
  }

  /**
   * Unlock an action
   */
  private async unlockAction(lockKey: string, organizationId: string): Promise<void> {
    try {
      // Find and clear lock
      const lockedActions = await prisma.agenticAction.findMany({
        where: {
          organizationId,
          status: 'executing',
        },
      });

      for (const action of lockedActions) {
        const params = action.parameters as unknown as ActionParameters;
        if (params?.lockKey === lockKey) {
          await prisma.agenticAction.update({
            where: { id: action.id },
            data: {
              parameters: {
                ...params,
                lockKey: undefined,
                lockedAt: undefined,
              },
            },
          });
        }
      }
    } catch (error) {
      logger.error('[Agentic AI] Error unlocking action', error);
      // Don't throw - unlocking is best effort
    }
  }

  /**
   * Validate preconditions for an action
   */
  private async validatePreconditions(
    preconditions: Record<string, any>,
    organizationId: string,
    targetId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Validate entity exists
      if (preconditions.entityExists !== false) {
        // Check if target entity exists based on action type
        // Check target entity existence across all entity types (controls, frameworks, risks, evidence)
        const entityExists = await this.checkEntityExists(targetId, organizationId);
        if (!entityExists) {
          return { valid: false, reason: `Target entity ${targetId} does not exist` };
        }
      }

      // Validate status conditions
      if (preconditions.requiredStatus) {
        const currentStatus = await this.getEntityStatus(targetId, organizationId);
        if (currentStatus !== preconditions.requiredStatus) {
          return { valid: false, reason: `Entity status is ${currentStatus}, required: ${preconditions.requiredStatus}` };
        }
      }

      // Validate permission conditions
      if (preconditions.requiredPermissions) {
        const requiredPerms = Array.isArray(preconditions.requiredPermissions)
          ? preconditions.requiredPermissions
          : [preconditions.requiredPermissions];

        // Retrieve the user's role from the organization's users
        const orgUser = await prisma.user.findFirst({
          where: {
            organizationId,
          },
        });

        if (!orgUser) {
          return { valid: false, reason: 'No user found in organization for permission validation' };
        }

        const userRole = orgUser.role?.toLowerCase() || '';
        // Map roles to permission sets
        const rolePermissions: Record<string, string[]> = {
          admin: ['read', 'write', 'delete', 'approve', 'manage', 'control_update', 'policy_create', 'evidence_delete', 'risk_mitigation'],
          owner: ['read', 'write', 'delete', 'approve', 'manage', 'control_update', 'policy_create', 'evidence_delete', 'risk_mitigation'],
          editor: ['read', 'write', 'control_update', 'policy_create', 'risk_mitigation'],
          viewer: ['read'],
          auditor: ['read', 'approve'],
        };

        const userPerms = rolePermissions[userRole] || rolePermissions['viewer'] || ['read'];
        const missingPerms = requiredPerms.filter((p: string) => !userPerms.includes(p.toLowerCase()));

        if (missingPerms.length > 0) {
          return { valid: false, reason: `Missing required permissions: ${missingPerms.join(', ')}` };
        }
      }

      // Validate data conditions
      if (preconditions.requiredData) {
        for (const [key, value] of Object.entries(preconditions.requiredData)) {
          const entityData = await this.getEntityData(targetId, organizationId);
          if (entityData[key] !== value) {
            return { valid: false, reason: `Required data condition not met: ${key} = ${value}` };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      logger.error('[Agentic AI] Error validating preconditions', error);
      return { valid: false, reason: `Precondition validation failed: ${error}` };
    }
  }

  /**
   * Check if entity exists
   */
  private async checkEntityExists(targetId: string, organizationId: string): Promise<boolean> {
    // Check multiple entity types
    const checks = [
      prisma.frameworkControl.findUnique({ where: { id: targetId } }),
      prisma.complianceFramework.findUnique({ where: { id: targetId } }),
      prisma.riskItem.findUnique({ where: { id: targetId } }),
      prisma.evidenceAnalysis.findUnique({ where: { id: targetId } }),
    ];

    const results = await Promise.all(checks);
    return results.some(result => result !== null);
  }

  /**
   * Get entity status
   */
  private async getEntityStatus(targetId: string, organizationId: string): Promise<string | null> {
    const control = await prisma.frameworkControl.findUnique({ where: { id: targetId } });
    if (control) return control.status || null;

    const risk = await prisma.riskItem.findUnique({ where: { id: targetId } });
    if (risk) return risk.status || null;

    return null;
  }

  /**
   * Get entity data
   */
  private async getEntityData(targetId: string, organizationId: string): Promise<Record<string, unknown>> {
    const control = await prisma.frameworkControl.findUnique({ where: { id: targetId } });
    if (control) return control as unknown as Record<string, unknown>;

    const risk = await prisma.riskItem.findUnique({ where: { id: targetId } });
    if (risk) return risk as unknown as Record<string, unknown>;

    return {};
  }

  /**
   * Check if dependencies are complete
   */
  private async checkDependencies(
    dependencyIds: string[],
    organizationId: string
  ): Promise<{ allComplete: boolean; pending: string[]; completed: string[] }> {
    try {
      const dependencies = await prisma.agenticAction.findMany({
        where: {
          id: { in: dependencyIds },
          organizationId,
        },
      });

      const completed: string[] = [];
      const pending: string[] = [];

      for (const depId of dependencyIds) {
        const dep = dependencies.find(d => d.id === depId);
        if (dep && dep.status === 'completed') {
          completed.push(depId);
        } else {
          pending.push(depId);
        }
      }

      return {
        allComplete: pending.length === 0,
        pending,
        completed,
      };
    } catch (error) {
      logger.error('[Agentic AI] Error checking dependencies', error);
      return { allComplete: false, pending: dependencyIds, completed: [] };
    }
  }
}

export default new AgenticAIService();

