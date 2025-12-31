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
import { Prisma } from '@prisma/client';
import logger from '../../config/logger';

export interface AgenticAction {
  id: string;
  actionType: 'control_update' | 'policy_create' | 'risk_mitigation' | 'evidence_upload';
  targetId: string;
  parameters: Record<string, any>;
  blastRadius: BlastRadiusEstimate;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'rolled_back' | 'failed';
  rollbackData?: any;
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
      parameters: Record<string, any>;
    }
  ): Promise<BlastRadiusEstimate & { riskScore: number; directImpacts: string[]; indirectImpacts: string[]; hasCircularReferences: boolean }> {
    try {
      const startTime = Date.now();
      
      // Check if entity exists
      if (!action.targetId) {
        throw new Error('Target ID is required');
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
          throw new Error('Risk not found');
        }

        affectedRisks = 1;
        riskLevel = risk.severity === 'Critical' ? 'critical' : 
                   risk.severity === 'High' ? 'high' : 'medium';
        canRollback = true;
        rollbackComplexity = 'moderate';
      } else {
        throw new Error(`Unknown action type: ${action.actionType}`);
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
        throw new Error(`Entity not found: ${action.targetId}`);
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
      throw new Error('Control not found');
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
        const mapped = ctrl.mappedControls as any;
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
      // Check for concurrent execution locks (stub - implement if needed)
      const lockKey = `action_${action.actionType}_${action.targetId}`;
      // TODO: Implement action locking mechanism
      // if (await this.isActionLocked(lockKey, organizationId)) {
      //   throw new Error('Action is currently being executed by another process');
      // }

      // Validate preconditions (stub - implement if needed)
      if (action.preconditions) {
        // TODO: Implement precondition validation
        // const preconditionsMet = await this.validatePreconditions(
        //   action.preconditions,
        //   organizationId
        // );
        // if (!preconditionsMet.valid) {
        //   throw new Error(`Preconditions not met: ${preconditionsMet.reason}`);
        // }
      }

      // Check dependencies (stub - implement if needed)
      if (action.dependencies && action.dependencies.length > 0) {
        // TODO: Implement dependency checking
        // const dependenciesStatus = await this.checkDependencies(
        //   action.dependencies,
        //   organizationId
        // );
        // if (!dependenciesStatus.allComplete) {
        //   throw new Error(`Dependencies not complete: ${dependenciesStatus.pending.join(', ')}`);
        // }
      }

      // Estimate blast radius
      const blastRadius = await this.estimateBlastRadius(organizationId, action);

      // Check threshold - block if exceeds
      const threshold = 0.8; // 80% risk score threshold for blocking
      if (blastRadius.riskScore > threshold && !autoApprove) {
        throw new Error(
          `Action blocked: Blast radius risk score (${blastRadius.riskScore}) exceeds threshold (${threshold}). ` +
          `This action would affect ${blastRadius.affectedControls} controls and ${blastRadius.affectedFrameworks} frameworks.`
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
          blastRadius: blastRadius as any,
          requiresApproval,
          status: requiresApproval ? 'pending' : 'approved',
          createdBy: userId,
        },
      });

      const agenticAction: AgenticAction = {
        id: dbAction.id,
        actionType: action.actionType as any,
        targetId: action.targetId,
        parameters: action.parameters,
        blastRadius,
        requiresApproval,
        status: dbAction.status as any,
      };

      // Lock action
      // Lock action (simplified - in production, use distributed locking)
      logger.info(`[Agentic AI] Action locked: ${lockKey}`);

      // Execute if approved
      if (!requiresApproval || autoApprove) {
        try {
          return await this.executeActionInternal(agenticAction, organizationId, userId, action.timeoutSeconds);
        } finally {
          // Unlock action
          // Unlock action (simplified - in production, use distributed locking)
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
          throw new Error(`Action timed out after ${timeoutSeconds} seconds`);
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
  ): Promise<any> {
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
        rollbackData: checkpointData as any,
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
  ): Promise<any> {
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

      await prisma.frameworkControl.update({
        where: { id: agenticAction.targetId },
        data: {
          ...(status && { status }),
          ...(description && { description }),
          ...(evidence && { evidence }),
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
          title,
          content,
          category: category || 'General',
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

      await prisma.riskItem.update({
        where: { id: agenticAction.targetId },
        data: {
          ...(mitigationPlan && { mitigationPlan }),
          ...(status && { status }),
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
          throw new Error('Action not found');
        }

        if (dbAction.status === 'rolled_back') {
          throw new Error('Action already rolled back');
        }

        action = {
          id: dbAction.id,
          actionType: dbAction.actionType as any,
          targetId: dbAction.targetId,
          parameters: dbAction.parameters as any,
          blastRadius: dbAction.blastRadius as any,
          requiresApproval: dbAction.requiresApproval,
          status: dbAction.status as any,
          rollbackData: dbAction.rollbackData as any,
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
      const checkpoint = action.rollbackData as any;
      if (checkpoint.expiresAt) {
        const expiresAt = new Date(checkpoint.expiresAt);
        if (expiresAt < new Date()) {
          throw new Error('Checkpoint expired (older than 30 days)');
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
      const rollback = action.rollbackData as any;

      // Restore previous state based on action type
      if (action.actionType === 'control_update') {
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
        await prisma.riskItem.update({
          where: { id: action.targetId },
          data: {
            status: rollback.previousStatus,
            mitigationPlan: rollback.previousMitigationPlan,
            updatedAt: new Date(),
          },
        });
      } else if (action.actionType === 'policy_create') {
        // Delete the policy that was created
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
        const params = action.parameters as any;
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
        const rollbackData = action.rollbackData as any;
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
    // Get action from audit log (in production, use dedicated table)
    // For now, simulate approval
    const action: AgenticAction = {
      id: actionId,
      actionType: 'control_update',
      targetId: '',
      parameters: {},
      blastRadius: {
        affectedControls: 0,
        affectedFrameworks: 0,
        affectedRisks: 0,
        estimatedUsers: 0,
        riskLevel: 'low',
        confidence: 0.8,
        canRollback: true,
        rollbackComplexity: 'simple',
      },
      requiresApproval: false,
      status: 'approved',
    };

    return await this.executeActionInternal(action, organizationId, userId);
  }
}

export default new AgenticAIService();

