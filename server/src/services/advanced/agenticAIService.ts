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
   * Estimate blast radius before taking an action
   */
  async estimateBlastRadius(
    organizationId: string,
    action: {
      actionType: string;
      targetId: string;
      parameters: Record<string, any>;
    }
  ): Promise<BlastRadiusEstimate> {
    try {
      let affectedControls = 0;
      let affectedFrameworks = 0;
      let affectedRisks = 0;
      let estimatedUsers = 0;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let canRollback = true;
      let rollbackComplexity: 'simple' | 'moderate' | 'complex' = 'simple';

      // Analyze impact based on action type
      if (action.actionType === 'control_update') {
        const control = await prisma.frameworkControl.findUnique({
          where: { id: action.targetId },
          include: { framework: true },
        });

        if (control) {
          affectedControls = 1;
          affectedFrameworks = 1;
          
          // Check if control is mapped to other controls
          if (control.mappedControls) {
            const mapped = control.mappedControls as any;
            if (Array.isArray(mapped)) {
              affectedControls += mapped.length;
            }
          }

          // Estimate risk level
          if (control.status === 'Implemented') {
            riskLevel = 'high'; // Changing implemented control is risky
          } else {
            riskLevel = 'low';
          }

          canRollback = true;
          rollbackComplexity = 'simple';
        }
      } else if (action.actionType === 'policy_create') {
        affectedFrameworks = await prisma.complianceFramework.count({
          where: { organizationId },
        });
        riskLevel = 'low';
        canRollback = true;
        rollbackComplexity = 'simple';
      } else if (action.actionType === 'risk_mitigation') {
        const risk = await prisma.riskItem.findUnique({
          where: { id: action.targetId },
        });

        if (risk) {
          affectedRisks = 1;
          riskLevel = risk.severity === 'Critical' ? 'critical' : 
                     risk.severity === 'High' ? 'high' : 'medium';
          canRollback = true;
          rollbackComplexity = 'moderate';
        }
      }

      // Estimate users affected
      estimatedUsers = await prisma.user.count({
        where: { organizationId },
      });

      const confidence = 0.8; // Can be enhanced with ML

      return {
        affectedControls,
        affectedFrameworks,
        affectedRisks,
        estimatedUsers,
        riskLevel,
        confidence,
        canRollback,
        rollbackComplexity,
      };
    } catch (error) {
      logger.error('[Agentic AI] Error estimating blast radius', error);
      throw error;
    }
  }

  /**
   * Execute an agentic action with safety checks
   */
  async executeAction(
    organizationId: string,
    action: {
      actionType: string;
      targetId: string;
      parameters: Record<string, any>;
    },
    userId: string,
    autoApprove: boolean = false
  ): Promise<AgenticAction> {
    try {
      // Estimate blast radius
      const blastRadius = await this.estimateBlastRadius(organizationId, action);

      // Determine if approval is required
      const requiresApproval = !autoApprove && (
        blastRadius.riskLevel === 'high' || 
        blastRadius.riskLevel === 'critical' ||
        !blastRadius.canRollback
      );

      const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const agenticAction: AgenticAction = {
        id: actionId,
        ...action,
        blastRadius,
        requiresApproval,
        status: requiresApproval ? 'pending' : 'approved',
      };

      // Store action
      await prisma.auditLog.create({
        data: {
          action: 'agentic_ai.action_created',
          details: JSON.stringify(agenticAction),
          userId,
          organizationId,
          hash: require('crypto').randomBytes(16).toString('hex'),
        },
      });

      // Execute if approved
      if (!requiresApproval || autoApprove) {
        return await this.executeActionInternal(agenticAction, organizationId, userId);
      }

      return agenticAction;
    } catch (error) {
      logger.error('[Agentic AI] Error executing action', error);
      throw error;
    }
  }

  /**
   * Internal method to execute an action
   */
  private async executeActionInternal(
    agenticAction: AgenticAction,
    organizationId: string,
    userId: string
  ): Promise<AgenticAction> {
    try {
      agenticAction.status = 'executing';
      agenticAction.executedAt = new Date();

      // Store rollback data before executing
      const rollbackData = await this.captureRollbackData(agenticAction, organizationId);
      agenticAction.rollbackData = rollbackData;

      // Execute the action
      let success = false;

      if (agenticAction.actionType === 'control_update') {
        success = await this.executeControlUpdate(agenticAction, organizationId);
      } else if (agenticAction.actionType === 'policy_create') {
        success = await this.executePolicyCreate(agenticAction, organizationId, userId);
      } else if (agenticAction.actionType === 'risk_mitigation') {
        success = await this.executeRiskMitigation(agenticAction, organizationId);
      }

      if (success) {
        agenticAction.status = 'completed';
      } else {
        // Auto-rollback on failure
        await this.rollbackAction(agenticAction, organizationId, userId);
        agenticAction.status = 'rolled_back';
      }

      // Log execution
      await prisma.auditLog.create({
        data: {
          action: `agentic_ai.action_${agenticAction.status}`,
          details: JSON.stringify(agenticAction),
          userId,
          organizationId,
          hash: require('crypto').randomBytes(16).toString('hex'),
        },
      });

      return agenticAction;
    } catch (error) {
      logger.error('[Agentic AI] Error in action execution', error);
      // Auto-rollback on error
      await this.rollbackAction(agenticAction, organizationId, userId).catch((rollbackError) => {
        logger.error('[Agentic AI] Rollback failed', rollbackError);
      });
      agenticAction.status = 'failed';
      throw error;
    }
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
   * Rollback an action
   */
  async rollbackAction(
    agenticAction: AgenticAction,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!agenticAction.rollbackData) {
        logger.warn('[Agentic AI] No rollback data available');
        return false;
      }

      agenticAction.status = 'rolled_back';
      agenticAction.rolledBackAt = new Date();

      // Restore previous state
      if (agenticAction.actionType === 'control_update') {
        const rollback = agenticAction.rollbackData;
        await prisma.frameworkControl.update({
          where: { id: agenticAction.targetId },
          data: {
            status: rollback.previousStatus,
            description: rollback.previousDescription,
            evidence: rollback.previousEvidence,
            updatedAt: new Date(),
          },
        });
      } else if (agenticAction.actionType === 'risk_mitigation') {
        const rollback = agenticAction.rollbackData;
        await prisma.riskItem.update({
          where: { id: agenticAction.targetId },
          data: {
            status: rollback.previousStatus,
            mitigationPlan: rollback.previousMitigationPlan,
            updatedAt: new Date(),
          },
        });
      }

      // Log rollback
      await prisma.auditLog.create({
        data: {
          action: 'agentic_ai.action_rolled_back',
          details: JSON.stringify(agenticAction),
          userId,
          organizationId,
          hash: require('crypto').randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Agentic AI] Action rolled back: ${agenticAction.id}`);

      return true;
    } catch (error) {
      logger.error('[Agentic AI] Rollback failed', error);
      return false;
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

