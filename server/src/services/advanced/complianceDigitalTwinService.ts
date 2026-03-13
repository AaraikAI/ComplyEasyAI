/**
 * Compliance Digital Twin & Simulation Engine Service
 * 
 * Features:
 * - "What-if" scenario modeling
 * - Monte Carlo simulations
 * - Compliance flight simulator UI
 * - Impact analysis
 */

import prisma from '../../config/database';
import logger from '../../config/logger';

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  scenarioType: 'control_change' | 'policy_update' | 'risk_event' | 'framework_addition';
  parameters: Record<string, any>;
  organizationId: string;
  createdAt: Date;
}

export interface SimulationResult {
  scenarioId: string;
  baselineScore: number;
  simulatedScore: number;
  scoreChange: number;
  affectedControls: number;
  affectedFrameworks: number;
  riskChanges: Array<{
    riskId: string;
    severityChange: number;
    probabilityChange: number;
  }>;
  confidence: number;
  recommendations: string[];
}

class ComplianceDigitalTwinService {
  /**
   * Run a "what-if" simulation
   */
  async runSimulation(
    organizationId: string,
    scenario: {
      name: string;
      description: string;
      scenarioType: 'control_change' | 'policy_update' | 'risk_event' | 'framework_addition' | 'control_removal' | 'control_modification' | 'evidence_update' | 'audit_schedule' | 'compliance_debt' | 'integration_change' | 'user_role_change' | 'framework_status_change' | 'data_breach' | 'audit_scenario';
      parameters: Record<string, any>;
    },
    userId: string
  ): Promise<SimulationResult> {
    try {
      // Get baseline compliance state first
      const baselineScore = await this.calculateBaselineScore(organizationId);

      // Run simulation based on scenario type
      let simulatedScore = baselineScore;
      let affectedControls = 0;
      let affectedFrameworks = 0;
      const riskChanges: SimulationResult['riskChanges'] = [];

      if (scenario.scenarioType === 'control_change') {
        const result = await this.simulateControlChange(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'policy_update') {
        const result = await this.simulatePolicyUpdate(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
      } else if (scenario.scenarioType === 'risk_event') {
        const result = await this.simulateRiskEvent(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        riskChanges.push(...result.riskChanges);
      } else if (scenario.scenarioType === 'framework_addition') {
        const result = await this.simulateFrameworkAddition(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'data_breach') {
        const result = await this.simulateDataBreach(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        riskChanges.push(...result.riskChanges);
        affectedControls = result.affectedControls;
      } else if (scenario.scenarioType === 'audit_scenario') {
        const result = await this.simulateAuditScenario(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'control_removal') {
        const result = await this.simulateControlRemoval(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'control_modification') {
        const result = await this.simulateControlModification(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'evidence_update') {
        const result = await this.simulateEvidenceUpdate(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
      } else if (scenario.scenarioType === 'audit_schedule') {
        const result = await this.simulateAuditSchedule(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'compliance_debt') {
        const result = await this.simulateComplianceDebt(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
        affectedFrameworks = result.affectedFrameworks;
      } else if (scenario.scenarioType === 'integration_change') {
        const result = await this.simulateIntegrationChange(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
      } else if (scenario.scenarioType === 'user_role_change') {
        const result = await this.simulateUserRoleChange(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedControls = result.affectedControls;
      } else if (scenario.scenarioType === 'framework_status_change') {
        const result = await this.simulateFrameworkStatusChange(
          organizationId,
          scenario.parameters
        );
        simulatedScore = result.newScore;
        affectedFrameworks = result.affectedFrameworks;
      } else {
        // Unknown scenario type - return baseline with warning
        logger.warn(`[Digital Twin] Unknown scenario type: ${scenario.scenarioType}, returning baseline`);
        simulatedScore = baselineScore;
      }

      const scoreChange = simulatedScore - baselineScore;

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        scenario.scenarioType,
        scoreChange,
        baselineScore,
        simulatedScore
      );

      // Store simulation in database first to get scenario ID
      const crypto = await import('crypto');
      let simulationScenario;
      try {
        simulationScenario = await prisma.simulationScenario.create({
          data: {
            organizationId,
            name: scenario.name,
            description: scenario.description,
            scenarioType: scenario.scenarioType,
            parameters: scenario.parameters,
            createdBy: userId,
          },
        });
      } catch (dbError: any) {
        logger.error('[Digital Twin] Error creating simulation scenario', dbError);
        // If database creation fails, use a temporary ID
        const tempId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        simulationScenario = { id: tempId } as any;
      }

      const scenarioId = simulationScenario.id;

      const result: SimulationResult = {
        scenarioId,
        baselineScore,
        simulatedScore,
        scoreChange,
        affectedControls,
        affectedFrameworks,
        riskChanges,
        confidence: 0.8,
        recommendations,
      };

      // Store simulation result
      try {
        await prisma.simulationResult.create({
          data: {
            scenarioId: simulationScenario.id,
            organizationId,
            baselineScore: result.baselineScore,
            simulatedScore: result.simulatedScore,
            scoreChange: result.scoreChange,
            affectedControls: result.affectedControls,
            affectedFrameworks: result.affectedFrameworks,
            riskChanges: result.riskChanges,
            confidence: result.confidence,
            recommendations: result.recommendations,
          },
        });
      } catch (dbError: any) {
        logger.warn('[Digital Twin] Error creating simulation result (non-critical)', dbError);
        // Continue even if result storage fails
      }

      // Also log in audit log
      try {
        await prisma.auditLog.create({
          data: {
            action: 'digital_twin.simulation_run',
            details: JSON.stringify({ scenario, result }),
            userId,
            organizationId,
            hash: crypto.randomBytes(16).toString('hex'),
          },
        });
      } catch (logError: any) {
        logger.warn('[Digital Twin] Error creating audit log (non-critical)', logError);
      }

      logger.info(`[Digital Twin] Simulation run: ${scenarioId}, score change: ${scoreChange}`);

      return result;
    } catch (error) {
      logger.error('[Digital Twin] Error running simulation', error);
      throw error;
    }
  }

  /**
   * Calculate baseline compliance score
   */
  private async calculateBaselineScore(organizationId: string): Promise<number> {
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      include: { controls: true },
    });

    if (frameworks.length === 0) {
      return 0;
    }

    let totalControls = 0;
    let implementedControls = 0;

    for (const framework of frameworks) {
      totalControls += framework.controls.length;
      implementedControls += framework.controls.filter(
        (c: any) => c.status === 'Implemented' || c.status === 'Compliant'
      ).length;
    }

    return totalControls > 0
      ? Math.round((implementedControls / totalControls) * 100)
      : 0;
  }

  /**
   * Simulate control change
   */
  private async simulateControlChange(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
    affectedFrameworks: number;
  }> {
    const { controlId, newStatus } = parameters;

    // If no controlId provided, simulate a generic control change
    if (!controlId) {
      const baselineScore = await this.calculateBaselineScore(organizationId);
      // Generic simulation: implementing a new control increases score
      const newScore = Math.min(100, baselineScore + 2);
      
      // Get framework count for affected frameworks
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId },
      });

      return {
        newScore,
        affectedControls: 1,
        affectedFrameworks: frameworks.length > 0 ? 1 : 0,
      };
    }

    // Try to find the control
    let control;
    try {
      control = await prisma.frameworkControl.findUnique({
        where: { id: controlId },
        include: { framework: true },
      });
    } catch (error) {
      logger.warn('[Digital Twin] Control not found, using generic simulation', error);
      // Fallback to generic simulation
      const baselineScore = await this.calculateBaselineScore(organizationId);
      const newScore = Math.min(100, baselineScore + 2);
      return {
        newScore,
        affectedControls: 1,
        affectedFrameworks: 1,
      };
    }

    if (!control) {
      // Control not found, use generic simulation
      const baselineScore = await this.calculateBaselineScore(organizationId);
      const newScore = Math.min(100, baselineScore + 2);
      return {
        newScore,
        affectedControls: 1,
        affectedFrameworks: 1,
      };
    }

    // Calculate impact
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // If implementing a control, score increases
    let scoreChange = 0;
    const currentStatus = control.status || 'Pending';
    const targetStatus = newStatus || 'Implemented';
    
    if (currentStatus === 'Pending' && targetStatus === 'Implemented') {
      scoreChange = 2; // Approximate 2% per control
    } else if (currentStatus === 'Implemented' && targetStatus === 'Pending') {
      scoreChange = -2;
    } else if (currentStatus !== targetStatus) {
      scoreChange = 1; // Small change for other status transitions
    }

    const newScore = Math.max(0, Math.min(100, baselineScore + scoreChange));

    return {
      newScore,
      affectedControls: 1,
      affectedFrameworks: 1,
    };
  }

  /**
   * Simulate policy update
   */
  private async simulatePolicyUpdate(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
  }> {
    // Policy updates typically have minimal direct impact on compliance score
    // but may affect multiple controls
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Estimate: policy update might improve 2-3 controls
    const newScore = Math.min(100, baselineScore + 2);

    return {
      newScore,
      affectedControls: 3,
    };
  }

  /**
   * Simulate risk event
   */
  private async simulateRiskEvent(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    riskChanges: SimulationResult['riskChanges'];
  }> {
    const { riskType, severity } = parameters;

    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Risk events typically decrease compliance score
    const severityImpact = {
      Critical: -10,
      High: -5,
      Medium: -2,
      Low: -1,
    };

    const scoreChange = severityImpact[severity as keyof typeof severityImpact] || 0;
    const newScore = Math.max(0, baselineScore + scoreChange);

    // Simulate risk changes
    const riskChanges: SimulationResult['riskChanges'] = [
      {
        riskId: 'simulated_risk',
        severityChange: severity === 'Critical' ? 2 : severity === 'High' ? 1 : 0,
        probabilityChange: 0.3,
      },
    ];

    return {
      newScore,
      riskChanges,
    };
  }

  /**
   * Simulate framework addition
   */
  private async simulateFrameworkAddition(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedFrameworks: number;
  }> {
    const { frameworkName, estimatedControls } = parameters;

    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Adding a new framework initially decreases score (new controls to implement)
    // But shows potential for improvement
    const newControls = estimatedControls || 50;
    const currentControls = await prisma.frameworkControl.count({
      where: {
        framework: { organizationId },
      },
    });

    // Recalculate score with new framework
    const totalControls = currentControls + newControls;
    const implementedControls = await prisma.frameworkControl.count({
      where: {
        framework: { organizationId },
        status: { in: ['Implemented', 'Compliant'] },
      },
    });

    const newScore = totalControls > 0
      ? Math.round((implementedControls / totalControls) * 100)
      : baselineScore;

    return {
      newScore,
      affectedFrameworks: 1,
    };
  }

  /**
   * Generate recommendations based on simulation results
   */
  private generateRecommendations(
    scenario: 'control_change' | 'policy_update' | 'risk_event' | 'framework_addition' | 'control_removal' | 'control_modification' | 'evidence_update' | 'audit_schedule' | 'compliance_debt' | 'integration_change' | 'user_role_change' | 'framework_status_change' | 'data_breach' | 'audit_scenario',
    scoreChange: number,
    baselineScore: number,
    simulatedScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (scoreChange > 5) {
      recommendations.push('This change would significantly improve compliance. Consider implementing.');
    } else if (scoreChange < -5) {
      recommendations.push('This change would significantly decrease compliance. Review carefully before proceeding.');
    } else if (scoreChange > 0) {
      recommendations.push('This change would have a positive impact on compliance.');
    } else if (scoreChange < 0) {
      recommendations.push('This change would have a negative impact. Consider mitigation strategies.');
    } else {
      recommendations.push('This change would have minimal impact on compliance.');
    }

    if (simulatedScore < 70) {
      recommendations.push('Compliance score would be below 70%. Consider additional improvements.');
    }

    return recommendations;
  }

  /**
   * Simulate data breach scenario
   */
  private async simulateDataBreach(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    riskChanges: SimulationResult['riskChanges'];
    affectedControls: number;
  }> {
    const { breachType, dataAffected, responseTime } = parameters;

    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Data breach significantly impacts compliance
    let scoreImpact = -15; // Base impact
    
    // Adjust based on breach type
    if (breachType === 'PII') {
      scoreImpact -= 10; // PII breaches are more severe
    } else if (breachType === 'Financial') {
      scoreImpact -= 8;
    } else if (breachType === 'Health') {
      scoreImpact -= 12; // HIPAA/health data is critical
    }

    // Response time affects impact
    if (responseTime && responseTime > 72) { // > 72 hours
      scoreImpact -= 5; // Slow response worsens impact
    }

    const newScore = Math.max(0, baselineScore + scoreImpact);

    // Simulate risk changes
    const riskChanges: SimulationResult['riskChanges'] = [
      {
        riskId: 'data_breach_risk',
        severityChange: 3, // Significant increase
        probabilityChange: 0.5, // 50% increase
      },
    ];

    // Find affected controls (security-related)
    const controls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
        name: { contains: 'security' },
      },
    });

    return {
      newScore,
      riskChanges,
      affectedControls: controls.length,
    };
  }

  /**
   * Simulate audit scenario
   */
  private async simulateAuditScenario(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
    affectedFrameworks: number;
    gaps: string[];
  }> {
    const { auditType, frameworkId, sampleSize } = parameters;

    const baselineScore = await this.calculateBaselineScore(organizationId);

    // Get framework and controls
    const framework = frameworkId 
      ? await prisma.complianceFramework.findUnique({
          where: { id: frameworkId },
          include: { controls: true },
        })
      : null;

    const frameworks = framework 
      ? [framework]
      : await prisma.complianceFramework.findMany({
          where: { organizationId },
          include: { controls: true },
        });

    // Deterministic audit gap detection based on actual control properties
    const gaps: string[] = [];
    let totalScoreImpact = 0;
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    for (const fw of frameworks) {
      const controls = fw.controls || [];
      const sampleControls = sampleSize
        ? controls.slice(0, Math.min(sampleSize, controls.length))
        : controls;

      for (const control of sampleControls) {
        let hasGap = false;
        let gapReason = '';
        let controlImpact = 0;

        // Determine control importance based on category for score impact weighting
        // Controls in security/access categories are higher impact than documentation
        const category = (control.category || '').toLowerCase();
        const isHighImportance = category.includes('security') || category.includes('access') ||
          category.includes('encryption') || category.includes('authentication') ||
          category.includes('audit') || category.includes('incident');
        const isMediumImportance = category.includes('policy') || category.includes('risk') ||
          category.includes('network') || category.includes('data') ||
          category.includes('configuration') || category.includes('monitoring');
        // Base impact per finding: high=4, medium=3, low=2
        const baseImpact = isHighImportance ? 4 : isMediumImportance ? 3 : 2;

        // Gap: control is Pending or Not_Implemented
        if (control.status === 'Pending' || control.status === 'Not_Implemented') {
          hasGap = true;
          gapReason = control.status === 'Pending'
            ? `Control "${control.name}" is still pending implementation`
            : `Control "${control.name}" is not implemented`;
          controlImpact = baseImpact;
        }

        // Gap: control is In_Progress but stale (not updated in >30 days)
        if (!hasGap && control.status === 'In_Progress') {
          const updatedAt = new Date(control.updatedAt);
          const daysSinceUpdate = now.getTime() - updatedAt.getTime();
          if (daysSinceUpdate > thirtyDaysMs) {
            hasGap = true;
            const staleDays = Math.floor(daysSinceUpdate / (24 * 60 * 60 * 1000));
            gapReason = `Control "${control.name}" is in-progress but stale (no update in ${staleDays} days)`;
            // Stale in-progress controls have slightly lower impact than unimplemented
            controlImpact = Math.max(1, baseImpact - 1);
          }
        }

        if (hasGap) {
          gaps.push(gapReason);
          totalScoreImpact += controlImpact;
        }
      }
    }

    const newScore = Math.max(0, baselineScore - totalScoreImpact);

    return {
      newScore,
      affectedControls: gaps.length,
      affectedFrameworks: frameworks.length,
      gaps,
    };
  }

  /**
   * Simulate control removal
   */
  private async simulateControlRemoval(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
    affectedFrameworks: number;
  }> {
    const { controlId, frameworkId } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Removing a control decreases compliance score
    let scoreImpact = -5; // Base impact
    
    // If specific control provided, check its importance
    if (controlId) {
      const control = await prisma.frameworkControl.findUnique({
        where: { id: controlId },
        include: { framework: true },
      });
      
      if (control) {
        // Critical controls have higher impact
        if (control.status === 'Implemented' || control.status === 'Compliant') {
          scoreImpact = -8; // Removing implemented control is worse
        }
      }
    }
    
    const newScore = Math.max(0, baselineScore + scoreImpact);
    
    // Get affected frameworks
    const frameworks = frameworkId
      ? await prisma.complianceFramework.findMany({
          where: { id: frameworkId, organizationId },
        })
      : await prisma.complianceFramework.findMany({
          where: { organizationId },
        });
    
    return {
      newScore,
      affectedControls: 1,
      affectedFrameworks: frameworks.length > 0 ? 1 : 0,
    };
  }

  /**
   * Simulate control modification
   */
  private async simulateControlModification(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
    affectedFrameworks: number;
  }> {
    const { controlId, modificationType, oldStatus, newStatus } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    let scoreImpact = 0;
    
    // Status changes have different impacts
    if (oldStatus && newStatus) {
      if (oldStatus === 'Pending' && newStatus === 'Implemented') {
        scoreImpact = 3; // Implementing improves score
      } else if (oldStatus === 'Implemented' && newStatus === 'Pending') {
        scoreImpact = -3; // Reverting hurts score
      } else if (oldStatus === 'Not_Implemented' && newStatus === 'Compliant') {
        scoreImpact = 5; // Becoming compliant is best
      } else if (oldStatus === 'Compliant' && newStatus === 'Not_Implemented') {
        scoreImpact = -5; // Losing compliance is worst
      }
    } else {
      // Generic modification - slight improvement
      scoreImpact = 1;
    }
    
    const newScore = Math.min(100, Math.max(0, baselineScore + scoreImpact));
    
    // Get affected frameworks
    const control = controlId
      ? await prisma.frameworkControl.findUnique({
          where: { id: controlId },
          include: { framework: true },
        })
      : null;
    
    return {
      newScore,
      affectedControls: 1,
      affectedFrameworks: control?.framework ? 1 : 0,
    };
  }

  /**
   * Simulate evidence update
   */
  private async simulateEvidenceUpdate(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
  }> {
    const { controlId, evidenceQuality } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Better evidence improves compliance confidence
    let scoreImpact = 0;
    
    if (evidenceQuality === 'high' || evidenceQuality === 'verified') {
      scoreImpact = 2; // High-quality evidence improves score
    } else if (evidenceQuality === 'low' || evidenceQuality === 'missing') {
      scoreImpact = -2; // Poor evidence reduces score
    } else {
      scoreImpact = 1; // Standard update
    }
    
    const newScore = Math.min(100, Math.max(0, baselineScore + scoreImpact));
    
    return {
      newScore,
      affectedControls: controlId ? 1 : 0,
    };
  }

  /**
   * Simulate audit schedule change
   */
  private async simulateAuditSchedule(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedFrameworks: number;
  }> {
    const { frameworkId, newAuditDate, daysUntilAudit } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Earlier audits may reveal gaps, later audits give more time
    let scoreImpact = 0;
    
    if (daysUntilAudit !== undefined) {
      if (daysUntilAudit < 30) {
        scoreImpact = -3; // Short notice may reveal unpreparedness
      } else if (daysUntilAudit > 180) {
        scoreImpact = 1; // More time to prepare
      }
    }
    
    const newScore = Math.min(100, Math.max(0, baselineScore + scoreImpact));
    
    // Get affected frameworks
    const frameworks = frameworkId
      ? await prisma.complianceFramework.findMany({
          where: { id: frameworkId, organizationId },
        })
      : await prisma.complianceFramework.findMany({
          where: { organizationId },
        });
    
    return {
      newScore,
      affectedFrameworks: frameworks.length,
    };
  }

  /**
   * Simulate compliance debt accumulation
   */
  private async simulateComplianceDebt(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
    affectedFrameworks: number;
  }> {
    const { debtAmount, debtType, frameworkId } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // Compliance debt reduces score
    const debtHours = debtAmount || 100; // Default 100 hours
    const scoreImpact = -Math.min(20, Math.floor(debtHours / 10)); // Max -20% impact
    
    const newScore = Math.max(0, baselineScore + scoreImpact);
    
    // Get affected controls and frameworks
    const frameworks = frameworkId
      ? await prisma.complianceFramework.findMany({
          where: { id: frameworkId, organizationId },
          include: { controls: true },
        })
      : await prisma.complianceFramework.findMany({
          where: { organizationId },
          include: { controls: true },
        });
    
    const totalControls = frameworks.reduce((sum, fw) => sum + (fw.controls?.length || 0), 0);
    const affectedControls = Math.min(totalControls, Math.floor(debtHours / 5)); // ~5 hours per control
    
    return {
      newScore,
      affectedControls,
      affectedFrameworks: frameworks.length,
    };
  }

  /**
   * Simulate integration change
   */
  private async simulateIntegrationChange(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
  }> {
    const { integrationType, action, integrationId } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    let scoreImpact = 0;
    
    // Adding integration may improve monitoring, removing may reduce visibility
    if (action === 'add' || action === 'connect') {
      scoreImpact = 2; // New integration improves visibility
    } else if (action === 'remove' || action === 'disconnect') {
      scoreImpact = -2; // Losing integration reduces visibility
    } else if (action === 'update' || action === 'reconfigure') {
      scoreImpact = 1; // Updates may improve functionality
    }
    
    const newScore = Math.min(100, Math.max(0, baselineScore + scoreImpact));
    
    // Count controls that might depend on integrations
    const controls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId },
        OR: [
          { name: { contains: 'monitoring' } },
          { name: { contains: 'integration' } },
          { description: { contains: 'integration' } },
        ],
      },
    });
    
    return {
      newScore,
      affectedControls: Math.min(controls.length, 5), // Cap at 5 for integration changes
    };
  }

  /**
   * Simulate user role change
   */
  private async simulateUserRoleChange(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedControls: number;
  }> {
    const { userId, oldRole, newRole } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    let scoreImpact = 0;
    
    // Role changes affect access and control ownership
    if (oldRole === 'viewer' && newRole === 'admin') {
      scoreImpact = 1; // More capable admin
    } else if (oldRole === 'admin' && newRole === 'viewer') {
      scoreImpact = -1; // Losing admin capability
    } else if (oldRole === 'editor' && newRole === 'admin') {
      scoreImpact = 0.5; // Slight improvement
    } else if (oldRole === 'admin' && newRole === 'editor') {
      scoreImpact = -0.5; // Slight reduction
    }
    
    const newScore = Math.min(100, Math.max(0, baselineScore + scoreImpact));
    
    // Count controls owned by the user
    const userControls = userId
      ? await prisma.frameworkControl.count({
          where: {
            ownerId: userId,
            framework: { organizationId },
          },
        })
      : 0;
    
    return {
      newScore,
      affectedControls: Math.max(1, userControls), // At least 1 if user has controls
    };
  }

  /**
   * Simulate framework status change
   */
  private async simulateFrameworkStatusChange(
    organizationId: string,
    parameters: Record<string, any>
  ): Promise<{
    newScore: number;
    affectedFrameworks: number;
  }> {
    const { frameworkId, oldStatus, newStatus } = parameters;
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    let scoreImpact = 0;
    
    // Status changes have significant impact
    if (oldStatus === 'Non_Compliant' && newStatus === 'Compliant') {
      scoreImpact = 10; // Major improvement
    } else if (oldStatus === 'Compliant' && newStatus === 'Non_Compliant') {
      scoreImpact = -10; // Major degradation
    } else if (oldStatus === 'At_Risk' && newStatus === 'Compliant') {
      scoreImpact = 5; // Good improvement
    } else if (oldStatus === 'Compliant' && newStatus === 'At_Risk') {
      scoreImpact = -5; // Concerning
    } else if (oldStatus === 'In_Review' && newStatus === 'Compliant') {
      scoreImpact = 3; // Positive
    }
    
    const newScore = Math.min(100, Math.max(0, baselineScore + scoreImpact));
    
    // Get affected frameworks
    const frameworks = frameworkId
      ? await prisma.complianceFramework.findMany({
          where: { id: frameworkId, organizationId },
        })
      : await prisma.complianceFramework.findMany({
          where: { organizationId },
        });
    
    return {
      newScore,
      affectedFrameworks: frameworks.length,
    };
  }

  /**
   * Run simulation with constraints
   */
  async runSimulationWithConstraints(
    organizationId: string,
    scenario: {
      name: string;
      description: string;
      scenarioType: SimulationScenario['scenarioType'];
      parameters: Record<string, any>;
    },
    constraints: {
      budget?: number;
      timeLimit?: number; // days
      maxScoreImpact?: number;
    },
    userId: string
  ): Promise<SimulationResult & { constraintsMet: boolean; constraintViolations: string[] }> {
    try {
      // Run simulation
      const result = await this.runSimulation(organizationId, scenario, userId);

      // Check constraints
      const violations: string[] = [];
      let constraintsMet = true;

      if (constraints.budget !== undefined) {
        // Estimate cost (simplified)
        const estimatedCost = result.affectedControls * 1000; // $1000 per control
        if (estimatedCost > constraints.budget) {
          violations.push(`Estimated cost ($${estimatedCost}) exceeds budget ($${constraints.budget})`);
          constraintsMet = false;
        }
      }

      if (constraints.timeLimit !== undefined) {
        // Estimate time (simplified)
        const estimatedDays = result.affectedControls * 2; // 2 days per control
        if (estimatedDays > constraints.timeLimit) {
          violations.push(`Estimated time (${estimatedDays} days) exceeds limit (${constraints.timeLimit} days)`);
          constraintsMet = false;
        }
      }

      if (constraints.maxScoreImpact !== undefined) {
        if (Math.abs(result.scoreChange) > constraints.maxScoreImpact) {
          violations.push(`Score impact (${result.scoreChange}%) exceeds maximum allowed (${constraints.maxScoreImpact}%)`);
          constraintsMet = false;
        }
      }

      return {
        ...result,
        constraintsMet,
        constraintViolations: violations,
      };
    } catch (error) {
      logger.error('[Digital Twin] Error running simulation with constraints', error);
      throw error;
    }
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(
    organizationId: string,
    scenarios: Array<{
      name: string;
      description: string;
      scenarioType: SimulationScenario['scenarioType'];
      parameters: Record<string, any>;
    }>,
    userId: string
  ): Promise<Array<SimulationResult & { scenarioName: string }>> {
    try {
      const results: Array<SimulationResult & { scenarioName: string }> = [];

      for (const scenario of scenarios) {
        const result = await this.runSimulation(organizationId, scenario, userId);
        results.push({
          ...result,
          scenarioName: scenario.name,
        });
      }

      // Sort by score change (best first)
      results.sort((a, b) => b.scoreChange - a.scoreChange);

      return results;
    } catch (error) {
      logger.error('[Digital Twin] Error comparing scenarios', error);
      throw error;
    }
  }

  /**
   * Save simulation state
   */
  async saveSimulationState(
    scenarioId: string,
    organizationId: string,
    state: any,
    userId: string
  ): Promise<boolean> {
    try {
      // Store state in scenario parameters
      await prisma.simulationScenario.update({
        where: { id: scenarioId },
        data: {
          parameters: {
            ...(await prisma.simulationScenario.findUnique({ where: { id: scenarioId } }))?.parameters as any || {},
            savedState: state,
            savedAt: new Date().toISOString(),
            savedBy: userId,
          },
        },
      });

      logger.info(`[Digital Twin] Simulation state saved for scenario ${scenarioId}`);
      return true;
    } catch (error) {
      logger.error('[Digital Twin] Error saving simulation state', error);
      return false;
    }
  }

  /**
   * Load simulation state
   */
  async loadSimulationState(scenarioId: string, organizationId: string): Promise<any> {
    try {
      const scenario = await prisma.simulationScenario.findFirst({
        where: {
          id: scenarioId,
          organizationId,
        },
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      const parameters = scenario.parameters as any;
      return parameters.savedState || null;
    } catch (error) {
      logger.error('[Digital Twin] Error loading simulation state', error);
      throw error;
    }
  }

  /**
   * Rollback simulation to initial state
   */
  async rollbackSimulation(
    scenarioId: string,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get baseline state
      const scenario = await prisma.simulationScenario.findFirst({
        where: {
          id: scenarioId,
          organizationId,
        },
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Delete simulation results
      await prisma.simulationResult.deleteMany({
        where: {
          scenarioId,
          organizationId,
        },
      });

      // Reset scenario parameters
      await prisma.simulationScenario.update({
        where: { id: scenarioId },
        data: {
          parameters: {
            ...(scenario.parameters as any),
            rolledBack: true,
            rolledBackAt: new Date().toISOString(),
            rolledBackBy: userId,
          },
        },
      });

      logger.info(`[Digital Twin] Simulation ${scenarioId} rolled back`);
      return true;
    } catch (error) {
      logger.error('[Digital Twin] Error rolling back simulation', error);
      return false;
    }
  }

  /**
   * Run Monte Carlo simulation (enhanced with all features)
   */
  async runMonteCarloSimulation(
    organizationId: string,
    scenario: SimulationScenario['scenarioType'],
    parameters: Record<string, any>,
    iterations: number = 1000,
    userId: string,
    options?: {
      seed?: number;
      withCorrelations?: boolean;
      exportResults?: boolean;
    }
  ): Promise<{
    averageScoreChange: number;
    minScoreChange: number;
    maxScoreChange: number;
    confidenceInterval: [number, number];
    probabilityOfImprovement: number;
    probabilityDistribution: Array<{ range: string; count: number; percentage: number }>;
    bestCase: { scoreChange: number; parameters: any };
    worstCase: { scoreChange: number; parameters: any };
    sensitivityAnalysis: Array<{ variable: string; impact: number }>;
    correlations?: Array<{ variable1: string; variable2: string; correlation: number }>;
    executionTime: number;
    seed: number;
  }> {
    const startTime = Date.now();
    const seed = options?.seed || Math.floor(Math.random() * 1000000);
    
    // Set random seed for reproducibility
    const rng = this.seededRandom(seed);

    try {
      const results: Array<{ scoreChange: number; parameters: any }> = [];
      const parameterVariations: Array<Record<string, number[]>> = [];

      // Performance optimization: batch simulations for large iterations
      const batchSize = iterations > 1000 ? 100 : 50;
      const batches = Math.ceil(iterations / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises: Promise<SimulationResult>[] = [];

        for (let i = 0; i < batchSize && (batch * batchSize + i) < iterations; i++) {
          const iteration = batch * batchSize + i;
          
          // Add random variation to parameters (with seed for reproducibility)
          const variedParameters = this.addRandomVariation(parameters, rng, options?.withCorrelations);
          
          batchPromises.push(
            this.runSimulation(
              organizationId,
              {
                name: `Monte Carlo Iteration ${iteration + 1}`,
                description: 'Monte Carlo simulation',
                scenarioType: scenario,
                parameters: variedParameters,
              },
              userId
            )
          );

          parameterVariations.push(variedParameters as any);
        }

        // Execute batch in parallel
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.map((r, idx) => ({
          scoreChange: r.scoreChange,
          parameters: parameterVariations[batch * batchSize + idx],
        })));
      }

      const scoreChanges = results.map(r => r.scoreChange);

      // Calculate statistics
      const averageScoreChange = scoreChanges.reduce((a, b) => a + b, 0) / scoreChanges.length;
      const sortedResults = [...results].sort((a, b) => a.scoreChange - b.scoreChange);
      const minScoreChange = sortedResults[0].scoreChange;
      const maxScoreChange = sortedResults[sortedResults.length - 1].scoreChange;
      
      // 95% confidence interval
      const lowerIndex = Math.floor(scoreChanges.length * 0.025);
      const upperIndex = Math.ceil(scoreChanges.length * 0.975);
      const confidenceInterval: [number, number] = [
        sortedResults[lowerIndex].scoreChange,
        sortedResults[upperIndex].scoreChange,
      ];

      const probabilityOfImprovement = scoreChanges.filter(r => r > 0).length / scoreChanges.length;

      // Calculate probability distribution (bins)
      const distribution = this.calculateProbabilityDistribution(scoreChanges);

      // Find best and worst cases
      const bestCase = sortedResults[sortedResults.length - 1];
      const worstCase = sortedResults[0];

      // Perform sensitivity analysis
      const sensitivityAnalysis = this.performSensitivityAnalysis(results, parameters);

      // Calculate correlations if requested
      let correlations: Array<{ variable1: string; variable2: string; correlation: number }> | undefined;
      if (options?.withCorrelations) {
        correlations = this.calculateCorrelations(results, parameters);
      }

      const executionTime = Date.now() - startTime;

      const result = {
        averageScoreChange: Math.round(averageScoreChange * 100) / 100,
        minScoreChange,
        maxScoreChange,
        confidenceInterval,
        probabilityOfImprovement: Math.round(probabilityOfImprovement * 100) / 100,
        probabilityDistribution: distribution,
        bestCase: {
          scoreChange: bestCase.scoreChange,
          parameters: bestCase.parameters,
        },
        worstCase: {
          scoreChange: worstCase.scoreChange,
          parameters: worstCase.parameters,
        },
        sensitivityAnalysis,
        correlations,
        executionTime,
        seed,
      };

      // Export results if requested
      if (options?.exportResults) {
        // Store export-ready data
        (result as any).exportData = {
          iterations,
          results: scoreChanges,
          parameters: results.map(r => r.parameters),
        };
      }

      logger.info(`[Digital Twin] Monte Carlo completed: ${iterations} iterations in ${executionTime}ms`);

      return result;
    } catch (error) {
      logger.error('[Digital Twin] Error running Monte Carlo simulation', error);
      throw error;
    }
  }

  /**
   * Seeded random number generator for reproducibility
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  /**
   * Calculate probability distribution
   */
  private calculateProbabilityDistribution(
    scoreChanges: number[],
    bins: number = 20
  ): Array<{ range: string; count: number; percentage: number }> {
    const min = Math.min(...scoreChanges);
    const max = Math.max(...scoreChanges);
    const binSize = (max - min) / bins;

    const distribution: Array<{ range: string; count: number; percentage: number }> = [];

    for (let i = 0; i < bins; i++) {
      const binStart = min + (i * binSize);
      const binEnd = binStart + binSize;
      const count = scoreChanges.filter(sc => sc >= binStart && sc < binEnd).length;
      const percentage = (count / scoreChanges.length) * 100;

      distribution.push({
        range: `${Math.round(binStart)} to ${Math.round(binEnd)}`,
        count,
        percentage: Math.round(percentage * 100) / 100,
      });
    }

    return distribution;
  }

  /**
   * Perform sensitivity analysis
   */
  private performSensitivityAnalysis(
    results: Array<{ scoreChange: number; parameters: any }>,
    baseParameters: Record<string, any>
  ): Array<{ variable: string; impact: number }> {
    const sensitivity: Array<{ variable: string; impact: number }> = [];

    // Get all parameter keys
    const paramKeys = Object.keys(baseParameters).filter(k => typeof baseParameters[k] === 'number');

    for (const key of paramKeys) {
      // Calculate correlation between parameter variation and score change
      const variations = results.map(r => {
        const baseValue = baseParameters[key];
        const variedValue = r.parameters[key] || baseValue;
        return { variation: variedValue - baseValue, scoreChange: r.scoreChange };
      });

      // Calculate impact (correlation coefficient)
      const impact = this.calculateCorrelation(
        variations.map(v => v.variation),
        variations.map(v => v.scoreChange)
      );

      sensitivity.push({
        variable: key,
        impact: Math.round(Math.abs(impact) * 100) / 100,
      });
    }

    return sensitivity.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Calculate correlations between variables
   */
  private calculateCorrelations(
    results: Array<{ scoreChange: number; parameters: any }>,
    baseParameters: Record<string, any>
  ): Array<{ variable1: string; variable2: string; correlation: number }> {
    const correlations: Array<{ variable1: string; variable2: string; correlation: number }> = [];
    const paramKeys = Object.keys(baseParameters).filter(k => typeof baseParameters[k] === 'number');

    for (let i = 0; i < paramKeys.length; i++) {
      for (let j = i + 1; j < paramKeys.length; j++) {
        const key1 = paramKeys[i];
        const key2 = paramKeys[j];

        const values1 = results.map(r => r.parameters[key1] || baseParameters[key1]);
        const values2 = results.map(r => r.parameters[key2] || baseParameters[key2]);

        const correlation = this.calculateCorrelation(values1, values2);

        correlations.push({
          variable1: key1,
          variable2: key2,
          correlation: Math.round(correlation * 100) / 100,
        });
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Add random variation to parameters (with seed support)
   */
  private addRandomVariation(
    parameters: Record<string, any>,
    rng: () => number = Math.random,
    withCorrelations: boolean = false
  ): Record<string, any> {
    const varied = { ...parameters };

    // Add ±10% random variation to numeric parameters
    for (const key in varied) {
      if (typeof varied[key] === 'number') {
        const variation = varied[key] * 0.1 * (rng() * 2 - 1); // ±10%
        varied[key] = varied[key] + variation;
      }
    }

    // If correlations are enabled, maintain relationships between variables
    if (withCorrelations && Object.keys(varied).length > 1) {
      // Apply correlated variation (simplified - can be enhanced with a proper correlation matrix)
      const correlationFactor = rng() * 0.5 - 0.25; // -0.25 to 0.25
      for (const key in varied) {
        if (typeof varied[key] === 'number') {
          varied[key] = varied[key] * (1 + correlationFactor);
        }
      }
    }

    return varied;
  }

  /**
   * Add random variation to parameters for Monte Carlo
   */
  private addRandomVariationSimple(parameters: Record<string, any>): Record<string, any> {
    const varied = { ...parameters };

    // Add ±10% random variation to numeric parameters
    for (const key in varied) {
      if (typeof varied[key] === 'number') {
        const variation = varied[key] * 0.1 * (Math.random() * 2 - 1); // ±10%
        varied[key] = varied[key] + variation;
      }
    }

    return varied;
  }
}

export default new ComplianceDigitalTwinService();

