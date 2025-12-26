/**
 * Autonomous Compliance Operating System (aCOS™) Service
 * 
 * Implements closed-loop control systems for autonomous compliance management.
 * Core concept: Observe → Predict → Act → Verify → Learn
 * 
 * Features:
 * - Compliance Control Loops (CCLs)
 * - Intent-driven compliance goals
 * - Compliance debt tracking
 * - Change impact forecasting
 * - Autonomous remediation with safety boundaries
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import { ComplianceStatus } from '@prisma/client';

export interface ComplianceGoal {
  id: string;
  goalType: 'maintain' | 'achieve' | 'improve';
  frameworks: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  horizon: number; // days
  autoActionPolicy: 'conservative' | 'moderate' | 'aggressive';
  targetScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ControlLoop {
  id: string;
  controlId: string;
  observeAgent: string; // Agent ID that observes
  actAgent: string; // Agent ID that acts
  verifyAgent: string; // Agent ID that verifies
  confidence: number; // 0-1
  status: 'active' | 'paused' | 'error';
  lastObserved: Date;
  lastActed: Date;
  lastVerified: Date;
  cycleCount: number;
}

export interface ComplianceDebt {
  id: string;
  organizationId: string;
  frameworkId: string;
  controlId?: string;
  debtType: 'technical' | 'process' | 'documentation' | 'evidence';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedRemediationHours: number;
  deadline?: Date;
  accumulatedAt: Date;
  resolvedAt?: Date;
  interest?: number; // Calculated interest
  totalHours?: number; // Base hours + interest
}

export interface ChangeImpact {
  id: string;
  organizationId: string;
  changeType: 'control' | 'policy' | 'framework' | 'integration';
  changeId: string;
  affectedControls: string[];
  affectedFrameworks: string[];
  impactScore: number; // 0-100
  riskIncrease: number; // percentage
  estimatedComplianceChange: number; // percentage
  forecastedAt: Date;
}

class ACOSService {
  /**
   * Create a compliance goal
   * Example: "Maintain SOC 2 Type II with zero critical findings"
   */
  async createComplianceGoal(
    organizationId: string,
    goal: {
      goalType: 'maintain' | 'achieve' | 'improve';
      frameworks: string[];
      riskTolerance: 'low' | 'medium' | 'high';
      horizon: number;
      autoActionPolicy: 'conservative' | 'moderate' | 'aggressive';
      targetScore?: number;
    },
    userId: string
  ): Promise<ComplianceGoal> {
    try {
      // Generate UUID for the goal (database tables don't have default for id)
      const crypto = await import('crypto');
      const goalId = crypto.randomUUID();
      
      // Validate deadline if provided
      if (goal.deadline) {
        const deadlineDate = new Date(goal.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
          throw new Error('Deadline must be in the future');
        }
      }

      // Validate name
      if (!goal.name || goal.name.trim() === '') {
        throw new Error('Goal name is required');
      }
      if (goal.name.length > 500) {
        throw new Error('Goal name must be 500 characters or less');
      }

      // Validate frameworks
      if (!goal.frameworks || goal.frameworks.length === 0) {
        throw new Error('At least one framework must be selected');
      }

      // Create goal in database table
      const createdGoal = await prisma.complianceGoal.create({
        data: {
          id: goalId,
          organizationId,
          name: goal.name || null,
          goalType: goal.goalType,
          frameworks: goal.frameworks || [],
          riskTolerance: goal.riskTolerance,
          horizon: goal.horizon,
          autoActionPolicy: goal.autoActionPolicy,
          targetScore: goal.targetScore || null,
          deadline: goal.deadline ? new Date(goal.deadline) : null,
          status: 'active',
          createdBy: userId,
        },
      });

      // Also log in audit log
      await prisma.auditLog.create({
        data: {
          action: 'acos.goal_created',
          details: JSON.stringify(createdGoal),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[aCOS] Compliance goal created: ${createdGoal.id} for org ${organizationId}`);

      return {
        id: createdGoal.id,
        goalType: createdGoal.goalType as 'maintain' | 'achieve' | 'improve',
        frameworks: createdGoal.frameworks || [],
        riskTolerance: createdGoal.riskTolerance as 'low' | 'medium' | 'high',
        horizon: createdGoal.horizon,
        autoActionPolicy: createdGoal.autoActionPolicy as 'conservative' | 'moderate' | 'aggressive',
        targetScore: createdGoal.targetScore || undefined,
        status: createdGoal.status,
        name: createdGoal.name || undefined,
        deadline: createdGoal.deadline ? createdGoal.deadline.toISOString() : undefined,
        createdAt: createdGoal.createdAt,
        updatedAt: createdGoal.updatedAt,
      };
    } catch (error: any) {
      logger.error('[aCOS] Error creating compliance goal', error);
      // Log detailed error for debugging
      if (error.code) {
        logger.error(`[aCOS] Prisma error code: ${error.code}`);
      }
      if (error.meta) {
        logger.error(`[aCOS] Prisma error meta:`, error.meta);
      }
      throw error;
    }
  }

  /**
   * Create a control loop for autonomous compliance management
   */
  async createControlLoop(
    organizationId: string,
    controlId: string,
    userId: string
  ): Promise<ControlLoop> {
    try {
      // Verify control exists
      const control = await prisma.frameworkControl.findUnique({
        where: { id: controlId },
      });

      if (!control) {
        throw new Error('Control not found');
      }

      // Generate UUID for the control loop (database tables don't have default for id)
      const crypto = await import('crypto');
      const loopId = crypto.randomUUID();
      
      // Validate parent loop if specified
      if (config?.parentLoopId) {
        const parentLoop = await prisma.controlLoop.findFirst({
          where: {
            id: config.parentLoopId,
            organizationId,
          },
        });
        if (!parentLoop) {
          throw new Error('Parent loop not found');
        }
        // Check for circular dependencies
        if (await this.hasCircularDependency(config.parentLoopId, controlId, organizationId)) {
          throw new Error('Circular dependency detected in control loops');
        }
      }

      // Create control loop in database table
      const createdLoop = await prisma.controlLoop.create({
        data: {
          id: loopId,
          organizationId,
          controlId,
          observeAgent: `observe_${controlId}`,
          actAgent: `act_${controlId}`,
          verifyAgent: `verify_${controlId}`,
          confidence: 0.5, // Initial confidence
          status: 'active',
          triggerType: config?.triggerType || 'manual',
          triggerConfig: config?.triggerConfig || null,
          timeoutSeconds: config?.timeoutSeconds || 300,
          parentLoopId: config?.parentLoopId || null,
          configuration: config?.configuration || null,
          lastObserved: new Date(),
          lastActed: new Date(),
          lastVerified: new Date(),
          cycleCount: 0,
        },
      });

      // Also log in audit log
      await prisma.auditLog.create({
        data: {
          action: 'acos.control_loop_created',
          details: JSON.stringify(createdLoop),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[aCOS] Control loop created: ${createdLoop.id} for control ${controlId}`);

      return {
        id: createdLoop.id,
        controlId: createdLoop.controlId,
        observeAgent: createdLoop.observeAgent,
        actAgent: createdLoop.actAgent,
        verifyAgent: createdLoop.verifyAgent,
        confidence: createdLoop.confidence,
        status: createdLoop.status as 'active' | 'paused' | 'error',
        lastObserved: createdLoop.lastObserved,
        lastActed: createdLoop.lastActed,
        lastVerified: createdLoop.lastVerified,
        cycleCount: createdLoop.cycleCount,
      };
    } catch (error: any) {
      logger.error('[aCOS] Error creating control loop', error);
      // Log detailed error for debugging
      if (error.code) {
        logger.error(`[aCOS] Prisma error code: ${error.code}`);
      }
      if (error.meta) {
        logger.error(`[aCOS] Prisma error meta:`, error.meta);
      }
      if (error.message) {
        logger.error(`[aCOS] Error message: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Execute a control loop cycle: Observe → Predict → Act → Verify → Learn
   */
  async executeControlLoop(
    loopId: string,
    organizationId: string
  ): Promise<{
    observed: any;
    predicted: any;
    acted: boolean;
    verified: boolean;
    learned: any;
    confidence: number;
    cycleCount: number;
    scoreChange?: number;
  }> {
    try {
      // Get loop from database
      const loop = await prisma.controlLoop.findUnique({
        where: { id: loopId },
        include: {
          control: {
            include: { framework: true },
          },
        },
      });

      if (!loop) {
        throw new Error('Control loop not found');
      }

      const control = loop.control;
      if (!control) {
        throw new Error('Control not found');
      }

      // Check if loop is paused
      if (loop.status === 'paused') {
        throw new Error('Control loop is paused');
      }

      // Check for timeout
      const timeoutMs = ((loop as any).timeoutSeconds || 300) * 1000;
      const startTime = Date.now();

      // Track execution phases
      const phaseResults: any[] = [];

      try {
        // 1. SENSE/OBSERVE: Check current control status
        const senseStart = Date.now();
        const observed = {
          controlId: control.id,
          controlName: control.name,
          currentStatus: control.status,
          frameworkName: control.framework.name,
          frameworkStatus: control.framework.status,
          lastUpdated: control.updatedAt,
          evidenceCount: 0, // Could be enhanced to count actual evidence
        };
        const senseDuration = Date.now() - senseStart;
        phaseResults.push({
          phase: 'sense',
          result: observed,
          durationMs: senseDuration,
          success: true,
        });

        // Record sense phase in history
        await this.recordLoopHistory(loopId, organizationId, 'sense', observed, senseDuration, true);

        // 2. ANALYZE/PREDICT: Forecast compliance trajectory
        const analyzeStart = Date.now();
        const predicted = await this.predictComplianceTrajectory(
          control.id,
          organizationId
        );
        const analyzeDuration = Date.now() - analyzeStart;
        phaseResults.push({
          phase: 'analyze',
          result: predicted,
          durationMs: analyzeDuration,
          success: true,
        });

        // Record analyze phase in history
        await this.recordLoopHistory(loopId, organizationId, 'analyze', predicted, analyzeDuration, true);

        // 3. PLAN: Create plan for remediation if needed
        const planStart = Date.now();
        let plan: any = null;
        if (predicted.needsAction && predicted.confidence > 0.7) {
          plan = {
            actionType: 'control_update',
            targetStatus: 'Implemented',
            estimatedImpact: 'low',
            requiresApproval: false,
          };
        }
        const planDuration = Date.now() - planStart;
        if (plan) {
          phaseResults.push({
            phase: 'plan',
            result: plan,
            durationMs: planDuration,
            success: true,
          });
          await this.recordLoopHistory(loopId, organizationId, 'plan', plan, planDuration, true);
        }

        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Control loop execution timeout');
        }

        // 4. ACT: Take autonomous action if needed
        const actStart = Date.now();
        let acted = false;
        let scoreChange = 0;
        let actError: string | null = null;

        try {
          if (predicted.needsAction && predicted.confidence > 0.7) {
            acted = await this.autonomousAction(control, organizationId);
            // Estimate score change based on action
            if (acted && control.status === 'Pending') {
              scoreChange = 1; // Small improvement
            }
          }
        } catch (error: any) {
          actError = error.message;
          // Handle failing action - preserve loop state
          await prisma.controlLoop.update({
            where: { id: loopId },
            data: {
              lastError: actError,
              status: 'error',
            },
          });
        }

        const actDuration = Date.now() - actStart;
        phaseResults.push({
          phase: 'act',
          result: { acted, scoreChange },
          durationMs: actDuration,
          success: !actError,
          error: actError,
        });

        await this.recordLoopHistory(loopId, organizationId, 'act', { acted, scoreChange }, actDuration, !actError, actError);

        // Check timeout again
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Control loop execution timeout');
        }

        // 5. VERIFY: Verify the action was successful
        const verifyStart = Date.now();
        const verified = acted ? await this.verifyAction(control.id, organizationId) : true;
        const verifyDuration = Date.now() - verifyStart;
        phaseResults.push({
          phase: 'verify',
          result: { verified },
          durationMs: verifyDuration,
          success: true,
        });

        await this.recordLoopHistory(loopId, organizationId, 'verify', { verified }, verifyDuration, true);

        // 6. LEARN: Update confidence and learn from results
        const learnStart = Date.now();
        const learned = {
          actionTaken: acted,
          actionSuccessful: verified,
          confidenceAdjustment: verified ? 0.1 : -0.05,
          insights: [
            `Control status: ${control.status}`,
            `Framework: ${control.framework.name}`,
            `Risk level: ${predicted.riskLevel}`,
            acted ? 'Autonomous action taken' : 'No action required',
          ],
        };
        const learnDuration = Date.now() - learnStart;
        phaseResults.push({
          phase: 'learn',
          result: learned,
          durationMs: learnDuration,
          success: true,
        });

        await this.recordLoopHistory(loopId, organizationId, 'learn', learned, learnDuration, true);

        const newConfidence = Math.max(0, Math.min(1, loop.confidence + learned.confidenceAdjustment));
        const newCycleCount = loop.cycleCount + 1;

        // Update the loop in database
        await prisma.controlLoop.update({
          where: { id: loopId },
          data: {
            confidence: newConfidence,
            cycleCount: newCycleCount,
            lastObserved: new Date(),
            lastActed: acted ? new Date() : loop.lastActed,
            lastVerified: verified ? new Date() : loop.lastVerified,
            lastError: null, // Clear any previous errors
            status: actError ? 'error' : 'active',
            updatedAt: new Date(),
          },
        });

        logger.info(`[aCOS] Control loop executed: ${loopId}, cycles: ${newCycleCount}, confidence: ${newConfidence}`);

        return {
          observed,
          predicted,
          acted,
          verified,
          learned,
          confidence: newConfidence,
          cycleCount: newCycleCount,
          scoreChange,
          phases: phaseResults,
        };
      } catch (error: any) {
        // Handle timeout or other errors
        const errorMessage = error.message || 'Unknown error';
        await prisma.controlLoop.update({
          where: { id: loopId },
          data: {
            lastError: errorMessage,
            status: 'error',
          },
        });
        throw error;
      }
    } catch (error) {
      logger.error('[aCOS] Error executing control loop', error);
      throw error;
    }
  }

  /**
   * Predict compliance trajectory for a control
   */
  private async predictComplianceTrajectory(
    controlId: string,
    organizationId: string
  ): Promise<{
    needsAction: boolean;
    confidence: number;
    forecastedStatus: string;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const control = await prisma.frameworkControl.findUnique({
      where: { id: controlId },
      include: { framework: true },
    });

    if (!control) {
      return {
        needsAction: false,
        confidence: 0,
        forecastedStatus: 'Unknown',
        riskLevel: 'low',
      };
    }

    // Simple prediction logic (can be enhanced with ML)
    const needsAction = control.status === 'Pending' || control.status === 'Not_Implemented';
    const confidence = needsAction ? 0.8 : 0.3;
    const forecastedStatus = needsAction ? 'At Risk' : 'Stable';
    const riskLevel = needsAction ? 'high' : 'low';

    return {
      needsAction,
      confidence,
      forecastedStatus,
      riskLevel,
    };
  }

  /**
   * Take autonomous action on a control
   */
  private async autonomousAction(
    control: any,
    organizationId: string
  ): Promise<boolean> {
    try {
      // Only act on low-risk controls autonomously
      if (control.status === 'Pending') {
        // Update control status to In Progress
        await prisma.frameworkControl.update({
          where: { id: control.id },
          data: {
            status: 'In_Progress',
            updatedAt: new Date(),
          },
        });

        logger.info(`[aCOS] Autonomous action taken: Control ${control.id} set to In Progress`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[aCOS] Error in autonomous action', error);
      return false;
    }
  }

  /**
   * Verify that an action was successful
   */
  private async verifyAction(
    controlId: string,
    organizationId: string
  ): Promise<boolean> {
    const control = await prisma.frameworkControl.findUnique({
      where: { id: controlId },
    });

    return control?.status === 'In_Progress' || control?.status === 'Implemented';
  }

  /**
   * Track compliance debt
   */
  async trackComplianceDebt(
    organizationId: string,
    debt: {
      frameworkId: string;
      debtType: 'technical' | 'process' | 'documentation' | 'evidence';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      estimatedRemediationHours: number;
      controlId?: string;
      deadline?: Date;
    },
    userId: string
  ): Promise<ComplianceDebt> {
    try {
      const crypto = await import('crypto');
      const debtId = crypto.randomUUID();

      // Create debt in database
      const createdDebt = await prisma.complianceDebt.create({
        data: {
          id: debtId,
          organizationId,
          frameworkId: debt.frameworkId,
          controlId: debt.controlId || null,
          debtType: debt.debtType,
          severity: debt.severity,
          description: debt.description,
          estimatedRemediationHours: debt.estimatedRemediationHours,
          deadline: debt.deadline || null,
          accumulatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'acos.debt_tracked',
          details: JSON.stringify({
            debtId: createdDebt.id,
            ...debt,
            controlId: debt.controlId,
            deadline: debt.deadline,
          }),
          userId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[aCOS] Compliance debt tracked: ${createdDebt.id}`);

      return {
        id: createdDebt.id,
        organizationId: createdDebt.organizationId,
        frameworkId: createdDebt.frameworkId,
        debtType: createdDebt.debtType as any,
        severity: createdDebt.severity as any,
        description: createdDebt.description,
        estimatedRemediationHours: createdDebt.estimatedRemediationHours,
        accumulatedAt: createdDebt.accumulatedAt,
        resolvedAt: createdDebt.resolvedAt || undefined,
      };
    } catch (error) {
      logger.error('[aCOS] Error tracking compliance debt', error);
      throw error;
    }
  }

  /**
   * Calculate compliance debt from gap analysis
   */
  async calculateDebtFromGapAnalysis(
    organizationId: string,
    frameworkId: string,
    userId: string
  ): Promise<ComplianceDebt[]> {
    try {
      const framework = await prisma.complianceFramework.findUnique({
        where: { id: frameworkId },
        include: { controls: true },
      });

      if (!framework) {
        throw new Error('Framework not found');
      }

      const debts: ComplianceDebt[] = [];

      // Analyze gaps
      for (const control of framework.controls) {
        if (control.status === 'Pending' || control.status === 'Not_Implemented') {
          // Determine severity based on control importance
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          if (control.name.toLowerCase().includes('critical') || 
              control.name.toLowerCase().includes('security')) {
            severity = 'critical';
          } else if (control.name.toLowerCase().includes('important')) {
            severity = 'high';
          }

          // Estimate remediation hours (1-8 hours based on severity)
          const estimatedHours = severity === 'critical' ? 8 :
                                severity === 'high' ? 4 :
                                severity === 'medium' ? 2 : 1;

          const debt = await this.trackComplianceDebt(
            organizationId,
            {
              frameworkId,
              debtType: 'technical',
              severity,
              description: `Missing implementation for control: ${control.name}`,
              estimatedRemediationHours: estimatedHours,
              controlId: control.id,
            },
            userId
          );

          debts.push(debt);
        }
      }

      logger.info(`[aCOS] Calculated ${debts.length} debt items from gap analysis`);
      return debts;
    } catch (error) {
      logger.error('[aCOS] Error calculating debt from gap analysis', error);
      throw error;
    }
  }

  /**
   * Calculate debt interest (accrues over time)
   */
  private calculateDebtInterest(debt: any): number {
    const now = new Date();
    const accumulatedAt = new Date(debt.accumulatedAt);
    const daysSince = Math.floor((now.getTime() - accumulatedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Interest rate based on severity (daily)
    const interestRates: Record<string, number> = {
      critical: 0.05, // 5% per day
      high: 0.03,     // 3% per day
      medium: 0.02,  // 2% per day
      low: 0.01,     // 1% per day
    };

    const rate = interestRates[debt.severity] || 0.01;
    const baseHours = debt.estimatedRemediationHours;
    const interest = baseHours * rate * daysSince;

    return Math.round(interest * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Forecast change impact with comprehensive analysis
   */
  async forecastChangeImpact(
    organizationId: string,
    change: {
      changeType: 'control' | 'policy' | 'framework' | 'integration';
      changeId: string;
    },
    userId: string
  ): Promise<ChangeImpact & { severity: 'critical' | 'high' | 'medium' | 'low'; estimatedResolutionDays: number; downstreamDependencies: string[] }> {
    try {
      const crypto = await import('crypto');
      const impactId = crypto.randomUUID();

      let affectedControls: string[] = [];
      let affectedFrameworks: string[] = [];
      let downstreamDependencies: string[] = [];
      let impactScore = 0;
      let riskIncrease = 0;
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      let estimatedResolutionDays = 0;

      // Comprehensive analysis based on change type
      if (change.changeType === 'control') {
        const result = await this.analyzeControlChangeImpact(change.changeId, organizationId);
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
        downstreamDependencies = result.downstreamDependencies;
        impactScore = result.impactScore;
        riskIncrease = result.riskIncrease;
        severity = result.severity;
        estimatedResolutionDays = result.estimatedResolutionDays;
      } else if (change.changeType === 'policy') {
        const result = await this.analyzePolicyChangeImpact(change.changeId, organizationId);
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
        downstreamDependencies = result.downstreamDependencies;
        impactScore = result.impactScore;
        riskIncrease = result.riskIncrease;
        severity = result.severity;
        estimatedResolutionDays = result.estimatedResolutionDays;
      } else if (change.changeType === 'framework') {
        const result = await this.analyzeFrameworkUpdateImpact(change.changeId, organizationId);
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
        downstreamDependencies = result.downstreamDependencies;
        impactScore = result.impactScore;
        riskIncrease = result.riskIncrease;
        severity = result.severity;
        estimatedResolutionDays = result.estimatedResolutionDays;
      }

      // Create impact record
      const impact = await prisma.changeImpact.create({
        data: {
          id: impactId,
          organizationId,
          changeType: change.changeType,
          changeId: change.changeId,
          affectedControls,
          affectedFrameworks,
          impactScore,
          riskIncrease,
          estimatedComplianceChange: -riskIncrease,
          forecastedAt: new Date(),
          // Store additional fields in a JSON field if schema doesn't have them
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'acos.change_impact_forecasted',
          details: JSON.stringify({
            impactId,
            severity,
            estimatedResolutionDays,
            downstreamDependencies,
            ...change,
          }),
          userId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[aCOS] Change impact forecasted: ${impactId}, severity: ${severity}`);

      return {
        id: impact.id,
        organizationId: impact.organizationId,
        changeType: impact.changeType as any,
        changeId: impact.changeId,
        affectedControls: impact.affectedControls,
        affectedFrameworks: impact.affectedFrameworks,
        impactScore: impact.impactScore,
        riskIncrease: impact.riskIncrease,
        estimatedComplianceChange: impact.estimatedComplianceChange,
        forecastedAt: impact.forecastedAt,
        severity,
        estimatedResolutionDays,
        downstreamDependencies,
      };
    } catch (error) {
      logger.error('[aCOS] Error forecasting change impact', error);
      throw error;
    }
  }

  /**
   * Analyze control change impact with dependencies
   */
  private async analyzeControlChangeImpact(
    controlId: string,
    organizationId: string
  ): Promise<{
    affectedControls: string[];
    affectedFrameworks: string[];
    downstreamDependencies: string[];
    impactScore: number;
    riskIncrease: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    estimatedResolutionDays: number;
  }> {
    const control = await prisma.frameworkControl.findUnique({
      where: { id: controlId },
      include: {
        framework: {
          include: { controls: true },
        },
      },
    });

    if (!control) {
      throw new Error('Control not found');
    }

    const affectedControls = [control.id];
    const affectedFrameworks = [control.frameworkId];
    const downstreamDependencies: string[] = [];

    // Find dependent controls (controls that reference this one)
    const allControls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
      },
    });

    for (const ctrl of allControls) {
      if (ctrl.mappedControls) {
        const mapped = ctrl.mappedControls as any;
        if (Array.isArray(mapped) && mapped.includes(controlId)) {
          downstreamDependencies.push(ctrl.id);
          if (!affectedControls.includes(ctrl.id)) {
            affectedControls.push(ctrl.id);
          }
        }
      }
    }

    // Calculate impact score (0-100)
    const baseScore = 30;
    const dependencyMultiplier = 1 + (downstreamDependencies.length * 0.1);
    const impactScore = Math.min(100, Math.round(baseScore * dependencyMultiplier));

    // Calculate risk increase
    const riskIncrease = Math.min(50, 5 + (downstreamDependencies.length * 2));

    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (impactScore >= 70 || downstreamDependencies.length > 5) {
      severity = 'critical';
    } else if (impactScore >= 50 || downstreamDependencies.length > 2) {
      severity = 'high';
    } else if (impactScore >= 30) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Estimate resolution days based on severity and dependencies
    const estimatedResolutionDays = severity === 'critical' ? 14 :
                                    severity === 'high' ? 7 :
                                    severity === 'medium' ? 3 : 1;

    return {
      affectedControls,
      affectedFrameworks,
      downstreamDependencies,
      impactScore,
      riskIncrease,
      severity,
      estimatedResolutionDays,
    };
  }

  /**
   * Analyze policy change impact
   */
  private async analyzePolicyChangeImpact(
    policyId: string,
    organizationId: string
  ): Promise<{
    affectedControls: string[];
    affectedFrameworks: string[];
    downstreamDependencies: string[];
    impactScore: number;
    riskIncrease: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    estimatedResolutionDays: number;
  }> {
    // Find all controls related to this policy
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    // Find controls that reference this policy
    const allControls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
      },
    });

    const affectedControls: string[] = [];
    const affectedFrameworks: string[] = [];
    const frameworkIds = new Set<string>();

    for (const control of allControls) {
      // Check if control description or evidence mentions policy
      const controlText = `${control.description || ''} ${control.evidence || ''}`.toLowerCase();
      const policyTitle = policy.title.toLowerCase();
      
      if (controlText.includes(policyTitle) || control.name.toLowerCase().includes(policy.category?.toLowerCase() || '')) {
        affectedControls.push(control.id);
        frameworkIds.add(control.frameworkId);
      }
    }

    affectedFrameworks.push(...Array.from(frameworkIds));

    // Calculate impact
    const impactScore = Math.min(100, affectedControls.length * 5);
    const riskIncrease = Math.min(30, affectedControls.length * 1.5);
    const severity: 'critical' | 'high' | 'medium' | 'low' = 
      impactScore >= 70 ? 'critical' :
      impactScore >= 50 ? 'high' :
      impactScore >= 30 ? 'medium' : 'low';
    const estimatedResolutionDays = severity === 'critical' ? 21 :
                                    severity === 'high' ? 14 :
                                    severity === 'medium' ? 7 : 3;

    return {
      affectedControls,
      affectedFrameworks,
      downstreamDependencies: [],
      impactScore,
      riskIncrease,
      severity,
      estimatedResolutionDays,
    };
  }

  /**
   * Analyze framework update impact
   */
  private async analyzeFrameworkUpdateImpact(
    frameworkId: string,
    organizationId: string
  ): Promise<{
    affectedControls: string[];
    affectedFrameworks: string[];
    downstreamDependencies: string[];
    impactScore: number;
    riskIncrease: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    estimatedResolutionDays: number;
  }> {
    const framework = await prisma.complianceFramework.findUnique({
      where: { id: frameworkId },
      include: { controls: true },
    });

    if (!framework) {
      throw new Error('Framework not found');
    }

    // All controls in the framework are affected
    const affectedControls = framework.controls.map((c: any) => c.id);
    const affectedFrameworks = [frameworkId];

    // Find dependent frameworks (frameworks that reference this one)
    const allFrameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
    });

    const downstreamDependencies: string[] = [];
    for (const fw of allFrameworks) {
      if (fw.id !== frameworkId && fw.name.toLowerCase().includes(framework.name.toLowerCase())) {
        downstreamDependencies.push(fw.id);
      }
    }

    const impactScore = Math.min(100, 50 + (framework.controls.length * 2));
    const riskIncrease = Math.min(40, 10 + (framework.controls.length * 0.5));
    const severity: 'critical' | 'high' | 'medium' | 'low' = 
      impactScore >= 80 ? 'critical' :
      impactScore >= 60 ? 'high' :
      impactScore >= 40 ? 'medium' : 'low';
    const estimatedResolutionDays = severity === 'critical' ? 30 :
                                    severity === 'high' ? 21 :
                                    severity === 'medium' ? 14 : 7;

    return {
      affectedControls,
      affectedFrameworks,
      downstreamDependencies,
      impactScore,
      riskIncrease,
      severity,
      estimatedResolutionDays,
    };
  }

  /**
   * Resolve change impact
   */
  async resolveChangeImpact(
    impactId: string,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const impact = await prisma.changeImpact.findFirst({
        where: {
          id: impactId,
          organizationId,
        },
      });

      if (!impact) {
        throw new Error('Change impact not found');
      }

      // Mark as resolved (we'll add a resolvedAt field or use a status field)
      // For now, we'll delete it or mark in audit log
      await prisma.auditLog.create({
        data: {
          action: 'acos.change_impact_resolved',
          details: JSON.stringify({ impactId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      // Mark as resolved (soft delete - keep for audit trail)
      await prisma.changeImpact.update({
        where: { id: impactId },
        data: {
          resolvedAt: new Date(),
        },
      });

      logger.info(`[aCOS] Change impact resolved: ${impactId}`);
      return true;
    } catch (error) {
      logger.error('[aCOS] Error resolving change impact', error);
      throw error;
    }
  }

  /**
   * Get pending change impacts
   */
  async getPendingChangeImpacts(organizationId: string): Promise<ChangeImpact[]> {
    try {
      // Get all unresolved impacts
      const impacts = await prisma.changeImpact.findMany({
        where: {
          organizationId,
          resolvedAt: null,
        },
        orderBy: [
          { severity: 'desc' }, // Critical first
          { forecastedAt: 'desc' },
        ],
      });

      return impacts.map((impact: any) => ({
        id: impact.id,
        organizationId: impact.organizationId,
        changeType: impact.changeType as 'control' | 'policy' | 'framework' | 'integration',
        changeId: impact.changeId,
        affectedControls: impact.affectedControls,
        affectedFrameworks: impact.affectedFrameworks,
        downstreamDependencies: impact.downstreamDependencies || [],
        impactScore: impact.impactScore,
        riskIncrease: impact.riskIncrease,
        estimatedComplianceChange: impact.estimatedComplianceChange,
        severity: impact.severity,
        estimatedResolutionDays: impact.estimatedResolutionDays,
        resolvedAt: impact.resolvedAt || undefined,
        forecastedAt: impact.forecastedAt,
      }));
    } catch (error) {
      logger.error('[aCOS] Error getting pending change impacts', error);
      return [];
    }
  }

  /**
   * Get all active control loops for an organization
   */
  async getActiveControlLoops(organizationId: string): Promise<ControlLoop[]> {
    try {
      // Query from dedicated ControlLoop table - get all loops, not just active
      const loops = await prisma.controlLoop.findMany({
        where: {
          organizationId,
        },
        include: {
          control: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return loops.map((loop: any) => ({
        id: loop.id,
        controlId: loop.controlId,
        observeAgent: loop.observeAgent,
        actAgent: loop.actAgent,
        verifyAgent: loop.verifyAgent,
        confidence: loop.confidence || 0.5,
        status: (loop.status || 'active') as 'active' | 'paused' | 'error',
        triggerType: loop.triggerType || 'manual',
        triggerConfig: loop.triggerConfig,
        timeoutSeconds: loop.timeoutSeconds || 300,
        parentLoopId: loop.parentLoopId,
        configuration: loop.configuration,
        lastError: loop.lastError,
        lastObserved: loop.lastObserved || loop.createdAt,
        lastActed: loop.lastActed || loop.createdAt,
        lastVerified: loop.lastVerified || loop.createdAt,
        cycleCount: loop.cycleCount || 0,
      }));
    } catch (error) {
      logger.error('[aCOS] Error getting active control loops', error);
      return [];
    }
  }

  /**
   * Get control loop by ID
   */
  async getControlLoopById(loopId: string, organizationId: string): Promise<ControlLoop> {
    try {
      const loop = await prisma.controlLoop.findFirst({
        where: {
          id: loopId,
          organizationId,
        },
        include: {
          control: true,
          parentLoop: true,
          childLoops: true,
        },
      });

      if (!loop) {
        throw new Error('Control loop not found');
      }

      return {
        id: loop.id,
        controlId: loop.controlId,
        observeAgent: loop.observeAgent,
        actAgent: loop.actAgent,
        verifyAgent: loop.verifyAgent,
        confidence: loop.confidence || 0.5,
        status: (loop.status || 'active') as 'active' | 'paused' | 'error',
        triggerType: (loop as any).triggerType || 'manual',
        triggerConfig: (loop as any).triggerConfig,
        timeoutSeconds: (loop as any).timeoutSeconds || 300,
        parentLoopId: (loop as any).parentLoopId,
        configuration: (loop as any).configuration,
        lastError: (loop as any).lastError,
        lastObserved: loop.lastObserved || loop.createdAt,
        lastActed: loop.lastActed || loop.createdAt,
        lastVerified: loop.lastVerified || loop.createdAt,
        cycleCount: loop.cycleCount || 0,
      };
    } catch (error) {
      logger.error('[aCOS] Error getting control loop by ID', error);
      throw error;
    }
  }

  /**
   * Get control loop execution history
   */
  async getControlLoopHistory(loopId: string, organizationId: string): Promise<any[]> {
    try {
      const history = await prisma.controlLoopHistory.findMany({
        where: {
          loopId,
          organizationId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100, // Last 100 executions
      });

      return history.map((h: any) => ({
        id: h.id,
        executionPhase: h.executionPhase,
        phaseResult: h.phaseResult,
        durationMs: h.durationMs,
        success: h.success,
        error: h.error,
        timestamp: h.timestamp,
      }));
    } catch (error) {
      logger.error('[aCOS] Error getting control loop history', error);
      return [];
    }
  }

  /**
   * Update control loop configuration
   */
  async updateControlLoop(
    loopId: string,
    organizationId: string,
    updates: {
      triggerType?: 'schedule' | 'threshold' | 'event' | 'manual';
      triggerConfig?: any;
      timeoutSeconds?: number;
      configuration?: any;
      status?: 'active' | 'paused' | 'error';
    },
    userId: string
  ): Promise<ControlLoop> {
    try {
      // Verify loop exists
      const existingLoop = await prisma.controlLoop.findFirst({
        where: {
          id: loopId,
          organizationId,
        },
      });

      if (!existingLoop) {
        throw new Error('Control loop not found');
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.triggerType !== undefined) updateData.triggerType = updates.triggerType;
      if (updates.triggerConfig !== undefined) updateData.triggerConfig = updates.triggerConfig;
      if (updates.timeoutSeconds !== undefined) updateData.timeoutSeconds = updates.timeoutSeconds;
      if (updates.configuration !== undefined) updateData.configuration = updates.configuration;
      if (updates.status !== undefined) updateData.status = updates.status;

      // Update loop
      const updatedLoop = await prisma.controlLoop.update({
        where: { id: loopId },
        data: updateData,
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.control_loop_updated',
          details: JSON.stringify({ loopId, updates }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      return {
        id: updatedLoop.id,
        controlId: updatedLoop.controlId,
        observeAgent: updatedLoop.observeAgent,
        actAgent: updatedLoop.actAgent,
        verifyAgent: updatedLoop.verifyAgent,
        confidence: updatedLoop.confidence || 0.5,
        status: (updatedLoop.status || 'active') as 'active' | 'paused' | 'error',
        triggerType: (updatedLoop as any).triggerType || 'manual',
        triggerConfig: (updatedLoop as any).triggerConfig,
        timeoutSeconds: (updatedLoop as any).timeoutSeconds || 300,
        parentLoopId: (updatedLoop as any).parentLoopId,
        configuration: (updatedLoop as any).configuration,
        lastError: (updatedLoop as any).lastError,
        lastObserved: updatedLoop.lastObserved || updatedLoop.createdAt,
        lastActed: updatedLoop.lastActed || updatedLoop.createdAt,
        lastVerified: updatedLoop.lastVerified || updatedLoop.createdAt,
        cycleCount: updatedLoop.cycleCount || 0,
      };
    } catch (error) {
      logger.error('[aCOS] Error updating control loop', error);
      throw error;
    }
  }

  /**
   * Pause control loop
   */
  async pauseControlLoop(loopId: string, organizationId: string, userId: string): Promise<ControlLoop> {
    try {
      const loop = await prisma.controlLoop.findFirst({
        where: {
          id: loopId,
          organizationId,
        },
      });

      if (!loop) {
        throw new Error('Control loop not found');
      }

      if (loop.status === 'paused') {
        throw new Error('Control loop is already paused');
      }

      const updatedLoop = await prisma.controlLoop.update({
        where: { id: loopId },
        data: { status: 'paused' },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.control_loop_paused',
          details: JSON.stringify({ loopId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      return {
        id: updatedLoop.id,
        controlId: updatedLoop.controlId,
        observeAgent: updatedLoop.observeAgent,
        actAgent: updatedLoop.actAgent,
        verifyAgent: updatedLoop.verifyAgent,
        confidence: updatedLoop.confidence || 0.5,
        status: 'paused',
        triggerType: (updatedLoop as any).triggerType || 'manual',
        triggerConfig: (updatedLoop as any).triggerConfig,
        timeoutSeconds: (updatedLoop as any).timeoutSeconds || 300,
        parentLoopId: (updatedLoop as any).parentLoopId,
        configuration: (updatedLoop as any).configuration,
        lastError: (updatedLoop as any).lastError,
        lastObserved: updatedLoop.lastObserved || updatedLoop.createdAt,
        lastActed: updatedLoop.lastActed || updatedLoop.createdAt,
        lastVerified: updatedLoop.lastVerified || updatedLoop.createdAt,
        cycleCount: updatedLoop.cycleCount || 0,
      };
    } catch (error) {
      logger.error('[aCOS] Error pausing control loop', error);
      throw error;
    }
  }

  /**
   * Resume control loop
   */
  async resumeControlLoop(loopId: string, organizationId: string, userId: string): Promise<ControlLoop> {
    try {
      const loop = await prisma.controlLoop.findFirst({
        where: {
          id: loopId,
          organizationId,
        },
      });

      if (!loop) {
        throw new Error('Control loop not found');
      }

      if (loop.status !== 'paused') {
        throw new Error('Control loop is not paused');
      }

      const updatedLoop = await prisma.controlLoop.update({
        where: { id: loopId },
        data: { status: 'active', lastError: null },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.control_loop_resumed',
          details: JSON.stringify({ loopId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      return {
        id: updatedLoop.id,
        controlId: updatedLoop.controlId,
        observeAgent: updatedLoop.observeAgent,
        actAgent: updatedLoop.actAgent,
        verifyAgent: updatedLoop.verifyAgent,
        confidence: updatedLoop.confidence || 0.5,
        status: 'active',
        triggerType: (updatedLoop as any).triggerType || 'manual',
        triggerConfig: (updatedLoop as any).triggerConfig,
        timeoutSeconds: (updatedLoop as any).timeoutSeconds || 300,
        parentLoopId: (updatedLoop as any).parentLoopId,
        configuration: (updatedLoop as any).configuration,
        lastError: (updatedLoop as any).lastError,
        lastObserved: updatedLoop.lastObserved || updatedLoop.createdAt,
        lastActed: updatedLoop.lastActed || updatedLoop.createdAt,
        lastVerified: updatedLoop.lastVerified || updatedLoop.createdAt,
        cycleCount: updatedLoop.cycleCount || 0,
      };
    } catch (error) {
      logger.error('[aCOS] Error resuming control loop', error);
      throw error;
    }
  }

  /**
   * Delete control loop
   */
  async deleteControlLoop(loopId: string, organizationId: string, userId: string): Promise<void> {
    try {
      const loop = await prisma.controlLoop.findFirst({
        where: {
          id: loopId,
          organizationId,
        },
        include: {
          childLoops: true,
        },
      });

      if (!loop) {
        throw new Error('Control loop not found');
      }

      // Check for child loops
      if ((loop as any).childLoops && (loop as any).childLoops.length > 0) {
        throw new Error('Cannot delete control loop with child loops. Delete child loops first.');
      }

      // Delete the loop (cascade will handle history)
      await prisma.controlLoop.delete({
        where: { id: loopId },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.control_loop_deleted',
          details: JSON.stringify({ loopId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[aCOS] Control loop deleted: ${loopId}`);
    } catch (error) {
      logger.error('[aCOS] Error deleting control loop', error);
      throw error;
    }
  }

  /**
   * Get compliance goals for an organization
   */
  async getComplianceGoals(
    organizationId: string,
    filters?: { status?: string; framework?: string }
  ): Promise<ComplianceGoal[]> {
    try {
      // Build where clause
      const where: any = { organizationId };
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.framework) {
        where.frameworks = {
          has: filters.framework,
        };
      }

      // Query from dedicated ComplianceGoal table
      const goals = await prisma.complianceGoal.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return goals.map((goal: any) => ({
        id: goal.id,
        goalType: goal.goalType as 'maintain' | 'achieve' | 'improve',
        frameworks: goal.frameworks || [],
        riskTolerance: goal.riskTolerance as 'low' | 'medium' | 'high',
        horizon: goal.horizon,
        autoActionPolicy: goal.autoActionPolicy as 'conservative' | 'moderate' | 'aggressive',
        targetScore: goal.targetScore || undefined,
        status: goal.status || 'active',
        name: goal.name || undefined,
        deadline: goal.deadline ? goal.deadline.toISOString() : undefined,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      }));
    } catch (error) {
      logger.error('[aCOS] Error getting compliance goals', error);
      return [];
    }
  }

  async getComplianceGoalById(goalId: string, organizationId: string): Promise<ComplianceGoal> {
    try {
      const goal = await prisma.complianceGoal.findFirst({
        where: {
          id: goalId,
          organizationId,
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      return {
        id: goal.id,
        goalType: goal.goalType as 'maintain' | 'achieve' | 'improve',
        frameworks: goal.frameworks || [],
        riskTolerance: goal.riskTolerance as 'low' | 'medium' | 'high',
        horizon: goal.horizon,
        autoActionPolicy: goal.autoActionPolicy as 'conservative' | 'moderate' | 'aggressive',
        targetScore: goal.targetScore || undefined,
        status: goal.status || 'active',
        name: goal.name || undefined,
        deadline: goal.deadline ? goal.deadline.toISOString() : undefined,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      };
    } catch (error) {
      logger.error('[aCOS] Error getting compliance goal by ID', error);
      throw error;
    }
  }

  async updateComplianceGoal(
    goalId: string,
    organizationId: string,
    updates: {
      goalType?: 'maintain' | 'achieve' | 'improve';
      frameworks?: string[];
      riskTolerance?: 'low' | 'medium' | 'high';
      horizon?: number;
      autoActionPolicy?: 'conservative' | 'moderate' | 'aggressive';
      targetScore?: number;
      status?: string;
      name?: string;
      deadline?: string;
    },
    userId: string
  ): Promise<ComplianceGoal> {
    try {
      // Verify goal exists and belongs to organization
      const existingGoal = await prisma.complianceGoal.findFirst({
        where: {
          id: goalId,
          organizationId,
        },
      });

      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.goalType !== undefined) updateData.goalType = updates.goalType;
      if (updates.frameworks !== undefined) updateData.frameworks = updates.frameworks;
      if (updates.riskTolerance !== undefined) updateData.riskTolerance = updates.riskTolerance;
      if (updates.horizon !== undefined) updateData.horizon = updates.horizon;
      if (updates.autoActionPolicy !== undefined) updateData.autoActionPolicy = updates.autoActionPolicy;
      if (updates.targetScore !== undefined) updateData.targetScore = updates.targetScore;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.deadline !== undefined) {
        if (updates.deadline) {
          const deadlineDate = new Date(updates.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deadlineDate < today) {
            throw new Error('Deadline must be in the future');
          }
          updateData.deadline = deadlineDate;
        } else {
          updateData.deadline = null;
        }
      }

      // Update goal
      const updatedGoal = await prisma.complianceGoal.update({
        where: { id: goalId },
        data: updateData,
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.goal_updated',
          details: JSON.stringify({ goalId, updates }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      // Check if target score is met and update status
      if (updates.targetScore !== undefined && updates.targetScore >= 100) {
        await prisma.complianceGoal.update({
          where: { id: goalId },
          data: { status: 'achieved' },
        });
        updatedGoal.status = 'achieved';
      }

      return {
        id: updatedGoal.id,
        goalType: updatedGoal.goalType as 'maintain' | 'achieve' | 'improve',
        frameworks: updatedGoal.frameworks || [],
        riskTolerance: updatedGoal.riskTolerance as 'low' | 'medium' | 'high',
        horizon: updatedGoal.horizon,
        autoActionPolicy: updatedGoal.autoActionPolicy as 'conservative' | 'moderate' | 'aggressive',
        targetScore: updatedGoal.targetScore || undefined,
        status: updatedGoal.status || 'active',
        name: updatedGoal.name || undefined,
        deadline: updatedGoal.deadline ? updatedGoal.deadline.toISOString() : undefined,
        createdAt: updatedGoal.createdAt,
        updatedAt: updatedGoal.updatedAt,
      };
    } catch (error) {
      logger.error('[aCOS] Error updating compliance goal', error);
      throw error;
    }
  }

  async deleteComplianceGoal(goalId: string, organizationId: string, userId: string): Promise<void> {
    try {
      // Verify goal exists
      const goal = await prisma.complianceGoal.findFirst({
        where: {
          id: goalId,
          organizationId,
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Soft delete by updating status
      await prisma.complianceGoal.update({
        where: { id: goalId },
        data: { status: 'archived' },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.goal_deleted',
          details: JSON.stringify({ goalId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[aCOS] Goal soft-deleted: ${goalId}`);
    } catch (error) {
      logger.error('[aCOS] Error deleting compliance goal', error);
      throw error;
    }
  }

  async restoreComplianceGoal(goalId: string, organizationId: string, userId: string): Promise<ComplianceGoal> {
    try {
      // Verify goal exists
      const goal = await prisma.complianceGoal.findFirst({
        where: {
          id: goalId,
          organizationId,
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Restore by updating status
      const restoredGoal = await prisma.complianceGoal.update({
        where: { id: goalId },
        data: { status: 'active' },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.goal_restored',
          details: JSON.stringify({ goalId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      return {
        id: restoredGoal.id,
        goalType: restoredGoal.goalType as 'maintain' | 'achieve' | 'improve',
        frameworks: restoredGoal.frameworks || [],
        riskTolerance: restoredGoal.riskTolerance as 'low' | 'medium' | 'high',
        horizon: restoredGoal.horizon,
        autoActionPolicy: restoredGoal.autoActionPolicy as 'conservative' | 'moderate' | 'aggressive',
        targetScore: restoredGoal.targetScore || undefined,
        status: restoredGoal.status || 'active',
        name: (restoredGoal as any).name,
        deadline: (restoredGoal as any).deadline,
        createdAt: restoredGoal.createdAt,
        updatedAt: restoredGoal.updatedAt,
      };
    } catch (error) {
      logger.error('[aCOS] Error restoring compliance goal', error);
      throw error;
    }
  }

  /**
   * Update a control loop's status and metrics
   */
  async updateControlLoop(
    loopId: string,
    organizationId: string,
    updates: {
      status?: 'active' | 'paused' | 'error';
      confidence?: number;
      lastObserved?: Date;
      lastActed?: Date;
      lastVerified?: Date;
      cycleCount?: number;
    }
  ): Promise<ControlLoop | null> {
    try {
      const updated = await prisma.controlLoop.update({
        where: { id: loopId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      logger.info(`[aCOS] Control loop updated: ${loopId}`);

      return {
        id: updated.id,
        controlId: updated.controlId,
        observeAgent: updated.observeAgent,
        actAgent: updated.actAgent,
        verifyAgent: updated.verifyAgent,
        confidence: updated.confidence,
        status: updated.status as 'active' | 'paused' | 'error',
        lastObserved: updated.lastObserved,
        lastActed: updated.lastActed,
        lastVerified: updated.lastVerified,
        cycleCount: updated.cycleCount,
      };
    } catch (error) {
      logger.error('[aCOS] Error updating control loop', error);
      return null;
    }
  }

  /**
   * Get compliance debt for an organization with filtering and pagination
   */
  async getComplianceDebts(
    organizationId: string,
    filters?: {
      frameworkId?: string;
      severity?: string;
      debtType?: string;
      resolved?: boolean;
      minAge?: number; // days
      maxAge?: number; // days
      page?: number;
      limit?: number;
    }
  ): Promise<{ debts: ComplianceDebt[]; total: number; page: number; limit: number; interestTotal: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { organizationId };

      if (filters?.frameworkId) {
        where.frameworkId = filters.frameworkId;
      }

      if (filters?.severity) {
        where.severity = filters.severity;
      }

      if (filters?.debtType) {
        where.debtType = filters.debtType;
      }

      if (filters?.resolved !== undefined) {
        if (filters.resolved) {
          where.resolvedAt = { not: null };
        } else {
          where.resolvedAt = null;
        }
      } else {
        // Default to unresolved
        where.resolvedAt = null;
      }

      // Age filtering
      if (filters?.minAge || filters?.maxAge) {
        const now = new Date();
        if (filters.minAge) {
          const minDate = new Date(now.getTime() - filters.minAge * 24 * 60 * 60 * 1000);
          where.accumulatedAt = { ...where.accumulatedAt, gte: minDate };
        }
        if (filters.maxAge) {
          const maxDate = new Date(now.getTime() - filters.maxAge * 24 * 60 * 60 * 1000);
          where.accumulatedAt = { ...where.accumulatedAt, lte: maxDate };
        }
      }

      // Get total count
      const total = await prisma.complianceDebt.count({ where });

      // Get debts with prioritization
      const debts = await prisma.complianceDebt.findMany({
        where,
        orderBy: [
          // Prioritize by severity (critical first)
          { severity: 'desc' },
          // Then by age (older first - approaching deadlines)
          { accumulatedAt: 'asc' },
        ],
        skip,
        take: limit,
        include: {
          framework: true,
        },
      });

      // Calculate interest for each debt
      let interestTotal = 0;
      const debtsWithInterest = debts.map((debt: any) => {
        const interest = this.calculateDebtInterest(debt);
        interestTotal += interest;
        return {
          id: debt.id,
          organizationId: debt.organizationId,
          frameworkId: debt.frameworkId,
          controlId: debt.controlId || undefined,
          debtType: debt.debtType as 'technical' | 'process' | 'documentation' | 'evidence',
          severity: debt.severity as 'low' | 'medium' | 'high' | 'critical',
          description: debt.description,
          estimatedRemediationHours: debt.estimatedRemediationHours,
          deadline: debt.deadline || undefined,
          accumulatedAt: debt.accumulatedAt,
          resolvedAt: debt.resolvedAt || undefined,
          interest,
          totalHours: debt.estimatedRemediationHours + interest,
        };
      });

      return {
        debts: debtsWithInterest,
        total,
        page,
        limit,
        interestTotal: Math.round(interestTotal * 100) / 100,
      };
    } catch (error) {
      logger.error('[aCOS] Error getting compliance debts', error);
      return { debts: [], total: 0, page: 1, limit: 50, interestTotal: 0 };
    }
  }

  /**
   * Resolve compliance debt and trigger re-assessment
   */
  async resolveComplianceDebt(
    debtId: string,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; complianceScore?: number }> {
    try {
      const debt = await prisma.complianceDebt.findFirst({
        where: {
          id: debtId,
          organizationId,
        },
      });

      if (!debt) {
        throw new Error('Debt not found');
      }

      if (debt.resolvedAt) {
        throw new Error('Debt already resolved');
      }

      // Mark as resolved
      await prisma.complianceDebt.update({
        where: { id: debtId },
        data: {
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'acos.debt_resolved',
          details: JSON.stringify({ debtId, frameworkId: debt.frameworkId }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      // Trigger re-assessment of compliance score
      const complianceScore = await this.recalculateComplianceScore(debt.frameworkId, organizationId);

      logger.info(`[aCOS] Compliance debt resolved: ${debtId}, new score: ${complianceScore}%`);

      return { success: true, complianceScore };
    } catch (error) {
      logger.error('[aCOS] Error resolving compliance debt', error);
      throw error;
    }
  }

  /**
   * Recalculate compliance score after debt resolution
   */
  private async recalculateComplianceScore(
    frameworkId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const framework = await prisma.complianceFramework.findUnique({
        where: { id: frameworkId },
        include: { controls: true },
      });

      if (!framework) {
        return 0;
      }

      const totalControls = framework.controls.length;
      if (totalControls === 0) {
        return 0;
      }

      const implementedControls = framework.controls.filter(
        (c: any) => c.status === 'Implemented' || c.status === 'Compliant'
      ).length;

      const score = Math.round((implementedControls / totalControls) * 100);

      // Update framework score
      await prisma.complianceFramework.update({
        where: { id: frameworkId },
        data: { progress: score },
      });

      return score;
    } catch (error) {
      logger.error('[aCOS] Error recalculating compliance score', error);
      return 0;
    }
  }

  /**
   * Export debt report (returns data for CSV/PDF generation)
   */
  async exportDebtReport(
    organizationId: string,
    format: 'csv' | 'json' = 'json'
  ): Promise<any> {
    try {
      const { debts, total, interestTotal } = await this.getComplianceDebts(organizationId, {
        resolved: false,
        limit: 10000, // Get all unresolved debts
      });

      const report = {
        generatedAt: new Date().toISOString(),
        totalDebts: total,
        totalRemediationHours: debts.reduce((sum, d) => sum + d.estimatedRemediationHours, 0),
        totalInterestHours: interestTotal,
        totalHoursWithInterest: debts.reduce((sum, d) => sum + (d as any).totalHours || d.estimatedRemediationHours, 0),
        bySeverity: {
          critical: debts.filter(d => d.severity === 'critical').length,
          high: debts.filter(d => d.severity === 'high').length,
          medium: debts.filter(d => d.severity === 'medium').length,
          low: debts.filter(d => d.severity === 'low').length,
        },
        byType: {
          technical: debts.filter(d => d.debtType === 'technical').length,
          process: debts.filter(d => d.debtType === 'process').length,
          documentation: debts.filter(d => d.debtType === 'documentation').length,
          evidence: debts.filter(d => d.debtType === 'evidence').length,
        },
        debts: debts.map(d => ({
          id: d.id,
          frameworkId: d.frameworkId,
          debtType: d.debtType,
          severity: d.severity,
          description: d.description,
          estimatedRemediationHours: d.estimatedRemediationHours,
          interest: (d as any).interest || 0,
          totalHours: (d as any).totalHours || d.estimatedRemediationHours,
          accumulatedAt: d.accumulatedAt.toISOString(),
          ageDays: Math.floor((new Date().getTime() - d.accumulatedAt.getTime()) / (1000 * 60 * 60 * 24)),
        })),
      };

      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['ID', 'Framework ID', 'Type', 'Severity', 'Description', 'Base Hours', 'Interest', 'Total Hours', 'Age (Days)', 'Accumulated At'];
        const rows = report.debts.map((d: any) => [
          d.id,
          d.frameworkId,
          d.debtType,
          d.severity,
          d.description.replace(/,/g, ';'), // Replace commas in description
          d.estimatedRemediationHours,
          d.interest,
          d.totalHours,
          d.ageDays,
          d.accumulatedAt,
        ]);
        return {
          format: 'csv',
          content: [headers, ...rows].map(row => row.join(',')).join('\n'),
          filename: `compliance-debt-report-${new Date().toISOString().split('T')[0]}.csv`,
        };
      }

      return report;
    } catch (error) {
      logger.error('[aCOS] Error exporting debt report', error);
      throw error;
    }
  }

  /**
   * Get change impacts for an organization
   */
  async getChangeImpacts(organizationId: string): Promise<ChangeImpact[]> {
    try {
      const impacts = await prisma.changeImpact.findMany({
        where: { organizationId },
        orderBy: { forecastedAt: 'desc' },
        take: 50,
      });

      return impacts.map((impact: any) => ({
        id: impact.id,
        organizationId: impact.organizationId,
        changeType: impact.changeType as 'control' | 'policy' | 'framework' | 'integration',
        changeId: impact.changeId,
        affectedControls: impact.affectedControls,
        affectedFrameworks: impact.affectedFrameworks,
        downstreamDependencies: impact.downstreamDependencies || [],
        impactScore: impact.impactScore,
        riskIncrease: impact.riskIncrease,
        estimatedComplianceChange: impact.estimatedComplianceChange,
        severity: impact.severity,
        estimatedResolutionDays: impact.estimatedResolutionDays,
        resolvedAt: impact.resolvedAt || undefined,
        forecastedAt: impact.forecastedAt,
      }));
    } catch (error) {
      logger.error('[aCOS] Error getting change impacts', error);
      return [];
    }
  }
}

export default new ACOSService();

