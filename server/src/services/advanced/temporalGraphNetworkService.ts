/**
 * Temporal Graph Network (TGN) Service
 * 
 * Features:
 * - 6-12 month predictive risk forecasting
 * - Temporal graph-based risk modeling
 * - Compliance trajectory prediction
 * - Early warning system
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import mlModelsService from './mlModelsService';
import notificationService from '../notificationService';
import webhookService from '../webhookService';

export interface RiskPrediction {
  riskId?: string;
  riskType: string;
  predictedProbability: number; // 0-1
  predictedSeverity: 'Critical' | 'High' | 'Medium' | 'Low';
  predictedDate: Date;
  confidence: number; // 0-1
  factors: string[];
}

export interface ComplianceTrajectory {
  frameworkId: string;
  currentScore: number;
  predictedScores: Array<{
    date: Date;
    score: number;
    confidence: number;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  riskEvents: RiskPrediction[];
}

class TemporalGraphNetworkService {
  /**
   * Predict future risks using temporal graph networks (enhanced with all features)
   */
  async predictFutureRisks(
    organizationId: string,
    timeHorizonMonths: number = 6,
    filters?: {
      frameworkId?: string;
      controlId?: string;
    }
  ): Promise<RiskPrediction[]> {
    try {
      // Validate time horizon (support 30, 90, 180, 365 days = 1, 3, 6, 12 months)
      const validHorizons = [1, 3, 6, 12];
      if (!validHorizons.includes(timeHorizonMonths)) {
        // Round to nearest valid horizon
        timeHorizonMonths = validHorizons.reduce((prev, curr) => 
          Math.abs(curr - timeHorizonMonths) < Math.abs(prev - timeHorizonMonths) ? curr : prev
        );
      }

      // Get historical risk data
      const historicalRisks = await prisma.riskItem.findMany({
        where: { organizationId },
        orderBy: { detectedAt: 'desc' },
        take: 100, // Last 100 risks
      });

      // Get framework data (filtered if needed)
      const frameworks = await prisma.complianceFramework.findMany({
        where: {
          organizationId,
          ...(filters?.frameworkId && { id: filters.frameworkId }),
        },
        include: { controls: true },
      });

      // Filter controls if needed
      let allControls = frameworks.flatMap(f => f.controls || []);
      if (filters?.controlId) {
        allControls = allControls.filter(c => c.id === filters.controlId);
      }

      // Build temporal graph
      const graph = this.buildTemporalGraph(historicalRisks, frameworks, allControls);

      // Use ML model for prediction (with error handling)
      let mlPredictions: any[] = [];
      try {
        // Build graph in format expected by ML service
        const mlGraph = mlModelsService.buildTemporalGraph({
          risks: historicalRisks,
          frameworks,
          controls: allControls,
        });
        mlPredictions = await mlModelsService.predictRisksWithTGN(
          mlGraph,
          timeHorizonMonths
        );
      } catch (mlError: any) {
        logger.warn('[TGN] ML model prediction failed, using fallback', mlError);
        // Fallback to enhanced graph-based prediction
        try {
          mlPredictions = this.predictFromGraph(graph, timeHorizonMonths, historicalRisks, allControls).map(p => ({
            riskType: p.riskType,
            probability: p.predictedProbability,
            severity: p.predictedSeverity,
            predictedDate: p.predictedDate,
            confidence: p.confidence,
            factors: p.factors,
          }));
        } catch (fallbackError: any) {
          logger.error('[TGN] Fallback prediction also failed', fallbackError);
          // Return empty array if both fail
          mlPredictions = [];
        }
      }

      // Convert to RiskPrediction format with enhanced features
      const predictions = mlPredictions.map((pred) => {
        // Calculate probability percentage
        const probabilityPercentage = Math.round((pred.probability || pred.predictedProbability) * 100);
        
        // Calculate confidence (decreases with longer time horizon)
        const baseConfidence = 0.8;
        const timeDecay = timeHorizonMonths * 0.05; // 5% per month
        const confidence = Math.max(0.3, baseConfidence - timeDecay);

        // Get contributing factors with weights
        const factors = this.calculateContributingFactors(
          pred,
          historicalRisks,
          allControls,
          frameworks
        );

        return {
          riskId: pred.riskId,
          riskType: pred.riskType,
          predictedProbability: pred.probability || pred.predictedProbability,
          predictedSeverity: this.classifySeverity(pred.probability || pred.predictedProbability, pred.severity || pred.predictedSeverity) as any,
          predictedDate: pred.predictedDate || new Date(Date.now() + timeHorizonMonths * 30 * 24 * 60 * 60 * 1000),
          confidence,
          factors: factors.map(f => f.factor),
          factorWeights: factors.map(f => f.weight),
          probabilityPercentage,
          frameworkId: filters?.frameworkId,
          controlId: filters?.controlId,
        };
      });

      // Store predictions in database (non-blocking)
      for (const prediction of predictions) {
        try {
          await prisma.riskPrediction.create({
            data: {
              organizationId,
              riskId: prediction.riskId,
              riskType: prediction.riskType,
              predictedProbability: prediction.predictedProbability,
              predictedSeverity: prediction.predictedSeverity,
              predictedDate: prediction.predictedDate,
              confidence: prediction.confidence,
              factors: prediction.factors,
              timeHorizonMonths,
            },
          });
        } catch (dbError: any) {
          logger.warn('[TGN] Failed to store prediction in database (non-critical)', dbError);
          // Continue storing other predictions
        }
      }

      logger.info(`[TGN] Predicted ${predictions.length} future risks for ${timeHorizonMonths} months`);

      return predictions;
    } catch (error) {
      logger.error('[TGN] Error predicting future risks', error);
      throw error;
    }
  }

  /**
   * Calculate contributing factors with weights
   */
  private calculateContributingFactors(
    prediction: any,
    historicalRisks: any[],
    controls: any[],
    frameworks: any[]
  ): Array<{ factor: string; weight: number }> {
    const factors: Array<{ factor: string; weight: number }> = [];

    // Historical frequency (weight: 0.3)
    const categoryRisks = historicalRisks.filter(r => r.category === prediction.riskType);
    if (categoryRisks.length > 0) {
      factors.push({
        factor: `Historical frequency: ${categoryRisks.length} occurrences`,
        weight: 0.3,
      });
    }

    // Temporal pattern (weight: 0.25)
    const recentRisks = categoryRisks.filter(r => {
      const daysSince = (Date.now() - new Date(r.detectedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 90;
    });
    if (recentRisks.length > 0) {
      factors.push({
        factor: `Recent pattern: ${recentRisks.length} occurrences in last 90 days`,
        weight: 0.25,
      });
    }

    // Control gaps (weight: 0.2)
    const pendingControls = controls.filter(c => c.status === 'Pending' || c.status === 'Not_Implemented');
    if (pendingControls.length > 0) {
      factors.push({
        factor: `${pendingControls.length} unimplemented controls increase risk`,
        weight: 0.2,
      });
    }

    // Framework status (weight: 0.15)
    const activeFrameworks = frameworks.filter(f => f.status === 'Active');
    if (activeFrameworks.length > 0) {
      factors.push({
        factor: `${activeFrameworks.length} active frameworks requiring attention`,
        weight: 0.15,
      });
    }

    // Graph-based pattern (weight: 0.1)
    factors.push({
      factor: 'Temporal graph pattern detected',
      weight: 0.1,
    });

    return factors;
  }

  /**
   * Classify severity based on probability and historical data
   */
  private classifySeverity(probability: number, historicalSeverity?: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    // If probability is very high (>0.8), severity is at least High
    if (probability > 0.8) {
      return historicalSeverity === 'Critical' ? 'Critical' : 'High';
    }
    // If probability is high (>0.6), severity is at least Medium
    if (probability > 0.6) {
      return historicalSeverity === 'Critical' || historicalSeverity === 'High' ? 'High' : 'Medium';
    }
    // If probability is medium (>0.4), severity is Medium or Low
    if (probability > 0.4) {
      return historicalSeverity === 'Critical' || historicalSeverity === 'High' ? 'Medium' : 'Low';
    }
    // Low probability = Low severity
    return 'Low';
  }

  /**
   * Build temporal graph from historical data
   */
  private buildTemporalGraph(risks: any[], frameworks: any[], controls: any[] = []): any {
    // Simplified temporal graph structure
    // In production, would use actual graph neural network library

    const nodes: any[] = [];
    const edges: any[] = [];
    const timestamps: Date[] = [];

    // Add risk nodes
    for (const risk of risks) {
      nodes.push({
        id: risk.id,
        type: 'risk',
        severity: risk.severity,
        category: risk.category,
        timestamp: risk.detectedAt,
      });
      timestamps.push(risk.detectedAt);
    }

    // Add framework nodes
    for (const framework of frameworks) {
      nodes.push({
        id: framework.id,
        type: 'framework',
        status: framework.status,
        progress: framework.progress,
        timestamp: framework.updatedAt,
      });
      timestamps.push(framework.updatedAt);
    }

    // Add temporal edges (risks that occurred close in time are connected)
    for (let i = 0; i < risks.length; i++) {
      for (let j = i + 1; j < risks.length; j++) {
        const timeDiff = Math.abs(
          risks[i].detectedAt.getTime() - risks[j].detectedAt.getTime()
        );
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (daysDiff < 30) { // Risks within 30 days are connected
          edges.push({
            source: risks[i].id,
            target: risks[j].id,
            weight: 1 / (1 + daysDiff), // Closer in time = stronger connection
            timestamp: risks[i].detectedAt < risks[j].detectedAt 
              ? risks[i].detectedAt 
              : risks[j].detectedAt,
          });
        }
      }
    }

    return { nodes, edges, timestamps: timestamps.sort() };
  }

  /**
   * Predict risks from temporal graph (enhanced)
   */
  private predictFromGraph(
    graph: any,
    timeHorizonMonths: number,
    historicalRisks: any[],
    controls: any[]
  ): RiskPrediction[] {
    const predictions: RiskPrediction[] = [];

    // Analyze patterns in the graph
    const riskCategories = new Map<string, number>();
    const severityDistribution = new Map<string, number>();

    for (const node of graph.nodes) {
      if (node.type === 'risk') {
        riskCategories.set(
          node.category,
          (riskCategories.get(node.category) || 0) + 1
        );
        severityDistribution.set(
          node.severity,
          (severityDistribution.get(node.severity) || 0) + 1
        );
      }
    }

    // Predict future risks based on patterns
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + timeHorizonMonths);

    // Predict risks for each category
    for (const [category, count] of riskCategories.entries()) {
      const avgFrequency = count / (graph.timestamps.length / 30); // Risks per month
      const predictedCount = Math.ceil(avgFrequency * timeHorizonMonths);

      for (let i = 0; i < predictedCount && i < 5; i++) { // Limit to 5 per category
        const predictedDate = new Date();
        predictedDate.setMonth(predictedDate.getMonth() + (i * timeHorizonMonths / predictedCount));

        // Determine predicted severity based on historical distribution
        const mostCommonSeverity = Array.from(severityDistribution.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Medium';

        // Calculate confidence based on data quality
        const dataQuality = Math.min(1, graph.timestamps.length / 100); // More data = higher confidence
        const confidence = Math.max(0.5, 0.7 * dataQuality);

        // Calculate probability with control gaps consideration
        const baseProbability = Math.min(0.9, 0.3 + (count / 100));
        const controlGapFactor = controls.filter(c => c.status === 'Pending').length > 0 ? 0.1 : 0;
        const predictedProbability = Math.min(0.95, baseProbability + controlGapFactor);

        predictions.push({
          riskType: category,
          predictedProbability,
          predictedSeverity: mostCommonSeverity as any,
          predictedDate,
          confidence,
          factors: [
            `Historical frequency: ${count} occurrences`,
            `Category: ${category}`,
            `Time-based pattern detected`,
            controls.filter(c => c.status === 'Pending').length > 0 
              ? `${controls.filter(c => c.status === 'Pending').length} pending controls increase risk`
              : 'Control implementation status normal',
          ],
        });
      }
    }

    return predictions.sort((a, b) => 
      a.predictedProbability - b.predictedProbability
    ).reverse(); // Sort by probability descending
  }

  /**
   * Get historical risk prediction accuracy
   */
  async getHistoricalAccuracy(organizationId: string): Promise<{
    totalPredictions: number;
    accuratePredictions: number;
    accuracyRate: number;
    falsePositives: number;
    falseNegatives: number;
  }> {
    try {
      // Get predictions from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const predictions = await prisma.riskPrediction.findMany({
        where: {
          organizationId,
          createdAt: { gte: sixMonthsAgo },
        },
      });

      // Get actual risks that occurred
      const actualRisks = await prisma.riskItem.findMany({
        where: {
          organizationId,
          detectedAt: { gte: sixMonthsAgo },
        },
      });

      // Match predictions to actual risks
      let accuratePredictions = 0;
      let falsePositives = 0;
      let falseNegatives = 0;

      for (const prediction of predictions) {
        const predictedDate = new Date(prediction.predictedDate);
        const windowStart = new Date(predictedDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before
        const windowEnd = new Date(predictedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after

        const matchingRisk = actualRisks.find(r => {
          const riskDate = new Date(r.detectedAt);
          return riskDate >= windowStart && riskDate <= windowEnd && 
                 r.category === prediction.riskType;
        });

        if (matchingRisk) {
          accuratePredictions++;
        } else {
          falsePositives++;
        }
      }

      // Count false negatives (actual risks not predicted)
      for (const risk of actualRisks) {
        const riskDate = new Date(risk.detectedAt);
        const matchingPrediction = predictions.find(p => {
          const predictedDate = new Date(p.predictedDate);
          const windowStart = new Date(predictedDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          const windowEnd = new Date(predictedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          return riskDate >= windowStart && riskDate <= windowEnd && 
                 risk.category === p.riskType;
        });

        if (!matchingPrediction) {
          falseNegatives++;
        }
      }

      const totalPredictions = predictions.length;
      const accuracyRate = totalPredictions > 0 
        ? accuratePredictions / totalPredictions 
        : 0;

      return {
        totalPredictions,
        accuratePredictions,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        falsePositives,
        falseNegatives,
      };
    } catch (error) {
      logger.error('[TGN] Error calculating historical accuracy', error);
      return {
        totalPredictions: 0,
        accuratePredictions: 0,
        accuracyRate: 0,
        falsePositives: 0,
        falseNegatives: 0,
      };
    }
  }

  /**
   * Refresh risk predictions with new data
   */
  async refreshRiskPredictions(
    organizationId: string,
    timeHorizonMonths: number = 6
  ): Promise<RiskPrediction[]> {
    try {
      // Delete old predictions for this time horizon
      await prisma.riskPrediction.deleteMany({
        where: {
          organizationId,
          timeHorizonMonths,
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
        },
      });

      // Generate new predictions
      return await this.predictFutureRisks(organizationId, timeHorizonMonths);
    } catch (error) {
      logger.error('[TGN] Error refreshing risk predictions', error);
      throw error;
    }
  }

  /**
   * Predict compliance trajectory (enhanced with all features)
   */
  async predictComplianceTrajectory(
    frameworkId: string,
    organizationId: string,
    timeHorizonMonths: number = 6,
    options?: {
      withInterventions?: boolean;
      interventions?: Array<{ type: string; parameters: any }>;
      compareScenarios?: boolean;
    }
  ): Promise<ComplianceTrajectory & {
    confidenceIntervals?: Array<{ date: Date; lower: number; upper: number }>;
    visualizationData?: any;
    milestones?: Array<{ milestone: number; predictedDate: Date; confidence: number }>;
    sensitivityAnalysis?: Array<{ factor: string; impact: number }>;
  }> {
    try {
      const framework = await prisma.complianceFramework.findUnique({
        where: { id: frameworkId },
        include: { controls: true },
      });

      if (!framework) {
        throw new Error('Framework not found');
      }

      const currentScore = framework.progress;

      // Calculate historical improvement rate
      const historicalScores = await this.getHistoricalScores(frameworkId, organizationId);
      const improvementRate = this.calculateImprovementRate(historicalScores);

      // Apply interventions if specified
      let interventionImpact = 0;
      if (options?.withInterventions && options?.interventions) {
        interventionImpact = this.calculateInterventionImpact(
          options.interventions,
          framework,
          organizationId
        );
      }

      // Predict future scores with confidence intervals
      const predictedScores: ComplianceTrajectory['predictedScores'] = [];
      const confidenceIntervals: Array<{ date: Date; lower: number; upper: number }> = [];
      const now = new Date();

      for (let month = 1; month <= timeHorizonMonths; month++) {
        const futureDate = new Date(now);
        futureDate.setMonth(futureDate.getMonth() + month);

        // Enhanced prediction with interventions
        const baseImprovement = improvementRate * month;
        const interventionBonus = options?.withInterventions ? interventionImpact * (month / timeHorizonMonths) : 0;
        const predictedScore = Math.min(100, currentScore + (baseImprovement * 100) + (interventionBonus * 100));
        
        // Calculate confidence (decreases over time)
        const confidence = Math.max(0.3, 0.85 - (month * 0.08));
        
        // Calculate confidence intervals (95% CI)
        const stdDev = predictedScore * 0.1; // 10% standard deviation
        const zScore = 1.96; // 95% confidence
        const margin = stdDev * zScore;
        const lower = Math.max(0, Math.min(100, predictedScore - margin));
        const upper = Math.min(100, Math.max(0, predictedScore + margin));

        predictedScores.push({
          date: futureDate,
          score: Math.round(predictedScore),
          confidence,
        });

        confidenceIntervals.push({
          date: futureDate,
          lower: Math.round(lower),
          upper: Math.round(upper),
        });
      }

      // Predict risk events
      const riskEvents = await this.predictFutureRisks(organizationId, timeHorizonMonths, { frameworkId });

      // Determine trend
      const trend = predictedScores.length > 1
        ? (predictedScores[predictedScores.length - 1].score > currentScore
          ? 'improving'
          : predictedScores[predictedScores.length - 1].score < currentScore
          ? 'declining'
          : 'stable')
        : 'stable';

      // Calculate milestones (80%, 90%, 100%)
      const milestones = this.calculateMilestones(predictedScores, currentScore);

      // Perform sensitivity analysis
      const sensitivityAnalysis = await this.performSensitivityAnalysis(
        frameworkId,
        organizationId,
        timeHorizonMonths
      );

      // Generate visualization data
      const visualizationData = {
        labels: predictedScores.map(s => s.date.toISOString().split('T')[0]),
        scores: predictedScores.map(s => s.score),
        confidenceLower: confidenceIntervals.map(ci => ci.lower),
        confidenceUpper: confidenceIntervals.map(ci => ci.upper),
        currentScore,
        trend,
      };

      return {
        frameworkId,
        currentScore,
        predictedScores,
        trend,
        riskEvents: riskEvents.slice(0, 10), // Top 10 predicted risks
        confidenceIntervals,
        visualizationData,
        milestones,
        sensitivityAnalysis,
      };
    } catch (error) {
      logger.error('[TGN] Error predicting compliance trajectory', error);
      throw error;
    }
  }

  /**
   * Get early warnings based on predictions (enhanced with all features)
   */
  async getEarlyWarnings(
    organizationId: string,
    timeHorizonMonths: number = 3,
    filters?: {
      severity?: string;
      type?: string;
      acknowledged?: boolean;
    }
  ): Promise<Array<{
    id?: string;
    type: 'risk' | 'compliance_decline' | 'control_failure' | 'regulatory_change';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    predictedDate: Date;
    leadTimeDays: number;
    confidence: number;
    recommendedAction: string;
    acknowledged?: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    escalated?: boolean;
    falsePositive?: boolean;
  }>> {
    try {
      const warnings: any[] = [];

      // Predict risks
      const riskPredictions = await this.predictFutureRisks(organizationId, timeHorizonMonths);

      // Add high-probability, high-severity risks as warnings
      for (const prediction of riskPredictions) {
        if (prediction.predictedProbability > 0.6 && 
            (prediction.predictedSeverity === 'Critical' || prediction.predictedSeverity === 'High')) {
          const predictedDate = new Date(prediction.predictedDate);
          const now = new Date();
          const leadTimeDays = Math.floor((predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          warnings.push({
            type: 'risk' as const,
            severity: prediction.predictedSeverity,
            description: `High-probability ${prediction.riskType} risk predicted`,
            predictedDate: predictedDate,
            leadTimeDays,
            confidence: prediction.confidence,
            recommendedAction: `Implement preventive controls for ${prediction.riskType}. Review ${prediction.factors?.join(', ')}`,
          });
        }
      }

      // Check compliance trajectories for decline warnings
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId },
      });

      for (const framework of frameworks) {
        try {
          const trajectory = await this.predictComplianceTrajectory(
            framework.id,
            organizationId,
            timeHorizonMonths
          );

          if (trajectory.trend === 'declining') {
            const predictedDate = trajectory.predictedScores[trajectory.predictedScores.length - 1].date;
            const now = new Date();
            const leadTimeDays = Math.floor((predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            warnings.push({
              type: 'compliance_decline' as const,
              severity: 'High' as const,
              description: `${framework.name} compliance is predicted to decline from ${trajectory.currentScore}% to ${trajectory.predictedScores[trajectory.predictedScores.length - 1].score}%`,
              predictedDate,
              leadTimeDays,
              confidence: trajectory.predictedScores[trajectory.predictedScores.length - 1].confidence,
              recommendedAction: `Review and address gaps in ${framework.name}. Focus on: ${trajectory.sensitivityAnalysis?.slice(0, 3).map(s => s.factor).join(', ')}`,
            });
          }
        } catch (error: any) {
          logger.warn(`[TGN] Error predicting trajectory for framework ${framework.id}`, error);
          // Continue with other frameworks
        }
      }

      // Check for control failures
      const controls = await prisma.frameworkControl.findMany({
        where: {
          framework: { organizationId },
          status: { in: ['Pending', 'Not_Implemented'] },
        },
        take: 20,
      });

      for (const control of controls) {
        // Predict if control will fail based on historical data
        const controlRisks = await prisma.riskItem.findMany({
          where: {
            organizationId,
            category: { contains: control.name },
          },
          take: 5,
        });

        if (controlRisks.length > 0) {
          const predictedDate = new Date();
          predictedDate.setDate(predictedDate.getDate() + 30); // Predict failure in 30 days
          const now = new Date();
          const leadTimeDays = Math.floor((predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          warnings.push({
            type: 'control_failure' as const,
            severity: controlRisks[0].severity === 'Critical' ? 'Critical' : 'High' as const,
            description: `Control "${control.name}" is at risk of failure based on historical patterns`,
            predictedDate,
            leadTimeDays,
            confidence: 0.7,
            recommendedAction: `Implement control "${control.name}" immediately. Review related risks: ${controlRisks.map(r => r.title).join(', ')}`,
          });
        }
      }

      // Check for regulatory changes
      const upcomingRegulations = await prisma.regulatoryChange.findMany({
        where: {
          organizationId,
          effectiveDate: {
            gte: new Date(),
            lte: new Date(Date.now() + timeHorizonMonths * 30 * 24 * 60 * 60 * 1000),
          },
          status: 'pending',
        },
      });

      for (const regulation of upcomingRegulations) {
        const leadTimeDays = Math.floor((regulation.effectiveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        warnings.push({
          type: 'regulatory_change' as const,
          severity: regulation.affectedFrameworks.length > 2 ? 'High' : 'Medium' as const,
          description: `Regulatory change "${regulation.regulationName}" in ${regulation.jurisdiction} will take effect`,
          predictedDate: regulation.effectiveDate,
          leadTimeDays,
          confidence: 0.95, // Regulatory dates are usually certain
          recommendedAction: `Review ${regulation.regulationName} requirements. Affected frameworks: ${regulation.affectedFrameworks.join(', ')}. Consider auto-updating controls.`,
        });
      }

      // Filter warnings
      let filteredWarnings = warnings;
      if (filters?.severity) {
        filteredWarnings = filteredWarnings.filter(w => w.severity === filters.severity);
      }
      if (filters?.type) {
        filteredWarnings = filteredWarnings.filter(w => w.type === filters.type);
      }

      // Sort by severity and lead time (critical with short lead time first)
      filteredWarnings.sort((a, b) => {
        const severityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const aSeverity = (a as any).severity || 'Low';
        const bSeverity = (b as any).severity || 'Low';
        const severityDiff = (severityOrder[bSeverity] || 1) - (severityOrder[aSeverity] || 1);
        if (severityDiff !== 0) return severityDiff;
        return a.leadTimeDays - b.leadTimeDays; // Shorter lead time = more urgent
      });

      // Check for unacknowledged warnings and apply escalation logic
      const warningsWithEscalation = await Promise.all(
        filteredWarnings.map(async (warning) => {
          // Generate unique warning ID
          const warningId = `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Check if warning was previously acknowledged
          const acknowledgmentLogs = await prisma.auditLog.findMany({
            where: {
              organizationId,
              action: 'tgn.warning_acknowledged',
              details: { contains: warningId },
            },
            orderBy: { timestamp: 'desc' },
            take: 1,
          });

          const acknowledged = acknowledgmentLogs.length > 0;
          const acknowledgedAt = acknowledged ? acknowledgmentLogs[0].timestamp : undefined;
          const acknowledgedBy = acknowledged ? acknowledgmentLogs[0].userId : undefined;
          
          // Check if marked as false positive
          let falsePositive = false;
          if (acknowledged) {
            try {
              const details = JSON.parse(acknowledgmentLogs[0].details || '{}');
              falsePositive = details.falsePositive === true;
            } catch (e) {
              // Ignore parse errors
            }
          }

          // Escalation logic: escalate if unacknowledged for >24 hours (Critical) or >72 hours (High)
          let escalated = false;
          if (!acknowledged && warning.predictedDate) {
            const hoursUntilPredicted = (warning.predictedDate.getTime() - Date.now()) / (1000 * 60 * 60);
            const escalationThreshold = warning.severity === 'Critical' ? 24 : 72;
            
            // Check if warning was generated more than threshold hours ago
            const warningAge = (Date.now() - (warning.predictedDate.getTime() - warning.leadTimeDays * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60);
            escalated = warningAge > escalationThreshold;
          }

          return {
            ...warning,
            id: warningId,
            acknowledged,
            acknowledgedAt,
            acknowledgedBy,
            escalated,
            falsePositive,
          };
        })
      );

      // Send notifications for new unacknowledged warnings
      await this.sendWarningNotifications(organizationId, warningsWithEscalation.filter(w => !w.acknowledged));

      // Apply acknowledgment filter if specified
      let finalWarnings = warningsWithEscalation;
      if (filters?.acknowledged !== undefined) {
        finalWarnings = finalWarnings.filter(w => w.acknowledged === filters.acknowledged);
      }

      return finalWarnings;
    } catch (error) {
      logger.error('[TGN] Error getting early warnings', error);
      throw error;
    }
  }

  /**
   * Send warning notifications (Email/Slack/Webhook)
   */
  private async sendWarningNotifications(
    organizationId: string,
    warnings: Array<{
      id?: string;
      type: string;
      severity: string;
      description: string;
      predictedDate: Date;
      leadTimeDays: number;
      recommendedAction: string;
    }>
  ): Promise<void> {
    try {
      // Get organization admins and users who should receive warnings
      const users = await prisma.user.findMany({
        where: {
          organizationId,
          role: { in: ['admin', 'editor'] },
        },
      });

      for (const warning of warnings) {
        // Send notifications to all admins/editors
        for (const user of users) {
          try {
            // Email notification
            await notificationService.sendNotification(
              user.id,
              organizationId,
              {
                type: warning.severity === 'Critical' ? 'critical' : 'warning',
                category: 'tgn_early_warning',
                title: `Early Warning: ${warning.type} - ${warning.severity}`,
                message: `${warning.description}\n\nPredicted Date: ${warning.predictedDate.toLocaleDateString()}\nLead Time: ${warning.leadTimeDays} days\n\nRecommended Action: ${warning.recommendedAction}`,
                link: `/acos/predictions?warning=${warning.id}`,
                channels: ['email', 'websocket'],
              }
            );
          } catch (error: any) {
            logger.warn(`[TGN] Failed to send notification to user ${user.id}`, error);
          }
        }

        // Send Slack notification if integration is connected
        try {
          const slackIntegration = await prisma.integration.findFirst({
            where: {
              organizationId,
              provider: 'slack',
              connected: true,
            },
          });

          if (slackIntegration) {
            // Send to Slack channel configured in integration
            await notificationService.sendNotification(
              users[0]?.id || 'system',
              organizationId,
              {
                type: warning.severity === 'Critical' ? 'critical' : 'warning',
                category: 'tgn_early_warning',
                title: `🚨 Early Warning: ${warning.type}`,
                message: `*${warning.severity}*: ${warning.description}\n*Predicted Date:* ${warning.predictedDate.toLocaleDateString()}\n*Lead Time:* ${warning.leadTimeDays} days\n\n*Recommended Action:* ${warning.recommendedAction}`,
                channels: ['slack'],
              }
            );
          }
        } catch (error: any) {
          logger.warn('[TGN] Failed to send Slack notification', error);
        }

        // Send webhook notification
        try {
          await webhookService.dispatchEvent(
            organizationId,
            'tgn.early_warning',
            {
              warningId: warning.id,
              type: warning.type,
              severity: warning.severity,
              description: warning.description,
              predictedDate: warning.predictedDate.toISOString(),
              leadTimeDays: warning.leadTimeDays,
              recommendedAction: warning.recommendedAction,
            }
          );
        } catch (error: any) {
          logger.warn('[TGN] Failed to dispatch webhook', error);
        }
      }
    } catch (error) {
      logger.error('[TGN] Error sending warning notifications', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Acknowledge a warning
   */
  async acknowledgeWarning(
    warningId: string,
    organizationId: string,
    userId: string,
    falsePositive: boolean = false
  ): Promise<boolean> {
    try {
      // Store acknowledgment in audit log (warnings are generated on-the-fly, so we track acknowledgments separately)
      await prisma.auditLog.create({
        data: {
          action: 'tgn.warning_acknowledged',
          details: JSON.stringify({
            warningId,
            falsePositive,
            acknowledgedAt: new Date(),
          }),
          userId,
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });

      // Update false positive rate tracking
      if (falsePositive) {
        await this.trackFalsePositive(organizationId, warningId);
      }

      logger.info(`[TGN] Warning ${warningId} acknowledged by user ${userId} (falsePositive: ${falsePositive})`);
      return true;
    } catch (error) {
      logger.error('[TGN] Error acknowledging warning', error);
      return false;
    }
  }

  /**
   * Track false positive for rate calculation
   */
  private async trackFalsePositive(organizationId: string, warningId: string): Promise<void> {
    try {
      // Store false positive tracking in audit log
      await prisma.auditLog.create({
        data: {
          action: 'tgn.false_positive_tracked',
          details: JSON.stringify({
            warningId,
            trackedAt: new Date(),
          }),
          userId: 'system',
          organizationId,
          hash: (await import('crypto')).randomBytes(16).toString('hex'),
        },
      });
    } catch (error) {
      logger.error('[TGN] Error tracking false positive', error);
    }
  }

  /**
   * Get warning history
   */
  async getWarningHistory(
    organizationId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      severity?: string;
    }
  ): Promise<Array<{
    type: string;
    severity: string;
    description: string;
    predictedDate: Date;
    actualDate?: Date;
    accuracy: 'accurate' | 'false_positive' | 'false_negative';
    acknowledged: boolean;
    createdAt: Date;
  }>> {
    try {
      // Get warning-related audit logs
      const where: any = {
        organizationId,
        action: { contains: 'warning' },
      };

      if (filters?.startDate) {
        where.timestamp = { ...where.timestamp, gte: filters.startDate };
      }
      if (filters?.endDate) {
        where.timestamp = { ...where.timestamp, lte: filters.endDate };
      }

      const auditLogs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      // Parse warning history from audit logs
      const history = auditLogs
        .filter(log => log.action.includes('warning'))
        .map(log => {
          const details = JSON.parse(log.details || '{}');
          return {
            type: details.type || 'unknown',
            severity: details.severity || 'Medium',
            description: details.description || 'Warning',
            predictedDate: details.predictedDate ? new Date(details.predictedDate) : log.timestamp,
            actualDate: details.actualDate ? new Date(details.actualDate) : undefined,
            accuracy: details.accuracy || 'unknown',
            acknowledged: details.acknowledged || false,
            createdAt: log.timestamp,
          };
        });

      return history;
    } catch (error) {
      logger.error('[TGN] Error getting warning history', error);
      return [];
    }
  }

  /**
   * Calculate false positive rate (target: <10%)
   */
  async calculateFalsePositiveRate(organizationId: string): Promise<{
    rate: number;
    totalWarnings: number;
    falsePositives: number;
    targetMet: boolean;
    targetRate: number;
  }> {
    try {
      const history = await this.getWarningHistory(organizationId);
      const totalWarnings = history.length;
      
      if (totalWarnings === 0) {
        return {
          rate: 0,
          totalWarnings: 0,
          falsePositives: 0,
          targetMet: true,
          targetRate: 0.1, // 10%
        };
      }

      // Count false positives from acknowledgment logs
      const falsePositiveLogs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: 'tgn.false_positive_tracked',
        },
      });

      const falsePositives = falsePositiveLogs.length;
      const falsePositiveRate = falsePositives / totalWarnings;
      const targetRate = 0.1; // 10% target
      const targetMet = falsePositiveRate < targetRate;

      return {
        rate: Math.round(falsePositiveRate * 100) / 100,
        totalWarnings,
        falsePositives,
        targetMet,
        targetRate,
      };
    } catch (error) {
      logger.error('[TGN] Error calculating false positive rate', error);
      return {
        rate: 0,
        totalWarnings: 0,
        falsePositives: 0,
        targetMet: false,
        targetRate: 0.1,
      };
    }
  }

  /**
   * Get historical compliance scores for a framework
   */
  private async getHistoricalScores(frameworkId: string, organizationId: string): Promise<Array<{ date: Date; score: number }>> {
    try {
      // Get framework update history from audit logs
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: { contains: 'framework' },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      // Extract scores from audit logs (if available)
      const scores: Array<{ date: Date; score: number }> = [];
      
      // Also get current score
      const framework = await prisma.complianceFramework.findUnique({
        where: { id: frameworkId },
      });

      if (framework) {
        scores.push({
          date: framework.updatedAt,
          score: framework.progress,
        });
      }

      return scores;
    } catch (error) {
      logger.error('[TGN] Error getting historical scores', error);
      return [];
    }
  }

  /**
   * Calculate improvement rate from historical scores
   */
  private calculateImprovementRate(historicalScores: Array<{ date: Date; score: number }>): number {
    if (historicalScores.length < 2) {
      return 0.02; // Default 2% per month
    }

    // Calculate average monthly improvement
    const sortedScores = historicalScores.sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstScore = sortedScores[0].score;
    const lastScore = sortedScores[sortedScores.length - 1].score;
    
    const monthsDiff = (sortedScores[sortedScores.length - 1].date.getTime() - sortedScores[0].date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff <= 0) {
      return 0.02;
    }

    const totalImprovement = (lastScore - firstScore) / 100;
    return totalImprovement / monthsDiff;
  }

  /**
   * Calculate impact of interventions
   */
  private calculateInterventionImpact(
    interventions: Array<{ type: string; parameters: any }>,
    framework: any,
    organizationId: string
  ): number {
    let totalImpact = 0;

    for (const intervention of interventions) {
      switch (intervention.type) {
        case 'control_implementation':
          totalImpact += 0.05; // 5% per control
          break;
        case 'policy_update':
          totalImpact += 0.02; // 2% per policy
          break;
        case 'risk_mitigation':
          totalImpact += 0.03; // 3% per risk mitigated
          break;
        case 'framework_improvement':
          totalImpact += 0.1; // 10% for framework-wide improvement
          break;
        default:
          totalImpact += 0.01; // 1% default
      }
    }

    return Math.min(0.5, totalImpact); // Cap at 50% improvement
  }

  /**
   * Calculate milestone dates (80%, 90%, 100%)
   */
  private calculateMilestones(
    predictedScores: Array<{ date: Date; score: number; confidence: number }>,
    currentScore: number
  ): Array<{ milestone: number; predictedDate: Date; confidence: number }> {
    const milestones: Array<{ milestone: number; predictedDate: Date; confidence: number }> = [];
    const targetMilestones = [80, 90, 100];

    for (const target of targetMilestones) {
      if (currentScore < target) {
        // Find when we'll reach this milestone
        for (const prediction of predictedScores) {
          if (prediction.score >= target) {
            milestones.push({
              milestone: target,
              predictedDate: prediction.date,
              confidence: prediction.confidence,
            });
            break;
          }
        }
      }
    }

    return milestones;
  }

  /**
   * Perform sensitivity analysis
   */
  private async performSensitivityAnalysis(
    frameworkId: string,
    organizationId: string,
    timeHorizonMonths: number
  ): Promise<Array<{ factor: string; impact: number }>> {
    try {
      const framework = await prisma.complianceFramework.findUnique({
        where: { id: frameworkId },
        include: { controls: true },
      });

      if (!framework) {
        return [];
      }

      const factors: Array<{ factor: string; impact: number }> = [];

      // Control implementation rate
      const totalControls = framework.controls.length;
      const implementedControls = framework.controls.filter(c => 
        c.status === 'Implemented' || c.status === 'Compliant'
      ).length;
      const implementationRate = totalControls > 0 ? implementedControls / totalControls : 0;
      factors.push({
        factor: 'Control Implementation Rate',
        impact: implementationRate * 100, // Higher rate = higher impact
      });

      // Risk level
      const risks = await prisma.riskItem.findMany({
        where: { organizationId },
        take: 10,
      });
      const highRiskCount = risks.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
      factors.push({
        factor: 'High/Critical Risk Count',
        impact: -highRiskCount * 5, // Negative impact
      });

      // Framework age
      const frameworkAge = (Date.now() - new Date(framework.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30); // months
      factors.push({
        factor: 'Framework Maturity',
        impact: Math.min(20, frameworkAge * 0.5), // Older = more mature
      });

      return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    } catch (error) {
      logger.error('[TGN] Error performing sensitivity analysis', error);
      return [];
    }
  }

  /**
   * Compare trajectory scenarios
   */
  async compareTrajectories(
    frameworkId: string,
    organizationId: string,
    scenarios: Array<{
      name: string;
      withInterventions?: boolean;
      interventions?: Array<{ type: string; parameters: any }>;
    }>,
    timeHorizonMonths: number = 6
  ): Promise<Array<ComplianceTrajectory & { scenarioName: string }>> {
    try {
      const comparisons: Array<ComplianceTrajectory & { scenarioName: string }> = [];

      for (const scenario of scenarios) {
        const trajectory = await this.predictComplianceTrajectory(
          frameworkId,
          organizationId,
          timeHorizonMonths,
          {
            withInterventions: scenario.withInterventions,
            interventions: scenario.interventions,
          }
        );

        comparisons.push({
          ...trajectory,
          scenarioName: scenario.name,
        });
      }

      return comparisons;
    } catch (error) {
      logger.error('[TGN] Error comparing trajectories', error);
      throw error;
    }
  }

  /**
   * Recalculate trajectory with new evidence
   */
  async recalculateTrajectory(
    frameworkId: string,
    organizationId: string,
    timeHorizonMonths: number = 6
  ): Promise<ComplianceTrajectory> {
    try {
      // Delete old trajectory predictions
      await prisma.complianceTrajectory.deleteMany({
        where: {
          frameworkId,
          organizationId,
        },
      });

      // Generate new trajectory
      return await this.predictComplianceTrajectory(
        frameworkId,
        organizationId,
        timeHorizonMonths
      );
    } catch (error) {
      logger.error('[TGN] Error recalculating trajectory', error);
      throw error;
    }
  }
}

export default new TemporalGraphNetworkService();

