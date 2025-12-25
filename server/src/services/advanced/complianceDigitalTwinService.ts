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
      scenarioType: 'control_change' | 'policy_update' | 'risk_event' | 'framework_addition';
      parameters: Record<string, any>;
    },
    userId: string
  ): Promise<SimulationResult> {
    try {
      const scenarioId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get baseline compliance state
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
      }

      const scoreChange = simulatedScore - baselineScore;

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        scenario,
        scoreChange,
        baselineScore,
        simulatedScore
      );

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

      // Store simulation
      await prisma.auditLog.create({
        data: {
          action: 'digital_twin.simulation_run',
          details: JSON.stringify({ scenario, result }),
          userId,
          organizationId,
          hash: require('crypto').randomBytes(16).toString('hex'),
        },
      });

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

    const control = await prisma.frameworkControl.findUnique({
      where: { id: controlId },
      include: { framework: true },
    });

    if (!control) {
      throw new Error('Control not found');
    }

    // Calculate impact
    const baselineScore = await this.calculateBaselineScore(organizationId);
    
    // If implementing a control, score increases
    let scoreChange = 0;
    if (control.status === 'Pending' && newStatus === 'Implemented') {
      scoreChange = 1; // Approximate 1% per control
    } else if (control.status === 'Implemented' && newStatus === 'Pending') {
      scoreChange = -1;
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
    scenario: SimulationScenario['scenarioType'],
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
   * Run Monte Carlo simulation (multiple iterations)
   */
  async runMonteCarloSimulation(
    organizationId: string,
    scenario: SimulationScenario['scenarioType'],
    parameters: Record<string, any>,
    iterations: number = 1000,
    userId: string
  ): Promise<{
    averageScoreChange: number;
    minScoreChange: number;
    maxScoreChange: number;
    confidenceInterval: [number, number];
    probabilityOfImprovement: number;
  }> {
    try {
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Add random variation to parameters
        const variedParameters = this.addRandomVariation(parameters);
        
        const simulation = await this.runSimulation(
          organizationId,
          {
            name: `Monte Carlo Iteration ${i + 1}`,
            description: 'Monte Carlo simulation',
            scenarioType: scenario,
            parameters: variedParameters,
          },
          userId
        );

        results.push(simulation.scoreChange);
      }

      // Calculate statistics
      const averageScoreChange = results.reduce((a, b) => a + b, 0) / results.length;
      const sortedResults = results.sort((a, b) => a - b);
      const minScoreChange = sortedResults[0];
      const maxScoreChange = sortedResults[sortedResults.length - 1];
      
      // 95% confidence interval
      const lowerIndex = Math.floor(results.length * 0.025);
      const upperIndex = Math.ceil(results.length * 0.975);
      const confidenceInterval: [number, number] = [
        sortedResults[lowerIndex],
        sortedResults[upperIndex],
      ];

      const probabilityOfImprovement = results.filter(r => r > 0).length / results.length;

      return {
        averageScoreChange: Math.round(averageScoreChange * 100) / 100,
        minScoreChange,
        maxScoreChange,
        confidenceInterval,
        probabilityOfImprovement: Math.round(probabilityOfImprovement * 100) / 100,
      };
    } catch (error) {
      logger.error('[Digital Twin] Error running Monte Carlo simulation', error);
      throw error;
    }
  }

  /**
   * Add random variation to parameters for Monte Carlo
   */
  private addRandomVariation(parameters: Record<string, any>): Record<string, any> {
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

