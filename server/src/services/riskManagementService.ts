import { RiskSeverity, RiskItem, RiskAssessment } from '../generated/prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';


interface RiskAssessmentWithRisks extends RiskAssessment {
  risks: RiskItem[];
}

/**
 * Full Risk Management Service
 * Handles risk register, custom scoring, assessments, remediation plans, and dashboards
 */
export class RiskManagementService {
  /**
   * Create risk assessment
   */
  async createRiskAssessment(data: {
    organizationId: string;
    name: string;
    description?: string;
    assessmentType: string;
    scope?: string;
    methodology?: string;
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const assessment = await tx.riskAssessment.create({
        data: {
          organizationId: data.organizationId,
          name: data.name,
          description: data.description,
          assessmentType: data.assessmentType,
          status: 'In_Progress',
          scope: data.scope,
          methodology: data.methodology || 'ISO_31000',
          startDate: new Date(),
        },
      });

      await AuditLogger.log({
        userId: data.userId,
        organizationId: data.organizationId,
        action: 'risk_assessment.created',
        resourceType: 'RiskAssessment',
        resourceId: assessment.id,
        metadata: { assessmentType: data.assessmentType },
      });

      return assessment;
    });
  }

  /**
   * Add risk to assessment
   */
  async addRiskToAssessment(
    assessmentId: string,
    riskData: {
      title: string;
      description: string;
      category: string;
      likelihood: number;
      impact: number;
      organizationId: string;
      userId: string;
    }
  ) {
    const riskScore = riskData.likelihood * riskData.impact;

    const severity = this.calculateRiskSeverity(riskScore);

    return prisma.$transaction(async (tx) => {
      const risk = await tx.riskItem.create({
        data: {
          title: riskData.title,
          description: riskData.description,
          category: riskData.category,
          likelihood: riskData.likelihood,
          impact: riskData.impact,
          riskScore,
          severity,
          status: 'Open',
          organizationId: riskData.organizationId,
          assessmentId,
        },
      });

      await AuditLogger.log({
        userId: riskData.userId,
        organizationId: riskData.organizationId,
        action: 'risk.added_to_assessment',
        resourceType: 'RiskItem',
        resourceId: risk.id,
        metadata: {
          assessmentId,
          riskScore,
          severity,
        },
      });

      return risk;
    });
  }

  /**
   * Complete risk assessment
   */
  async completeRiskAssessment(
    assessmentId: string,
    data: {
      overallRiskScore: number;
    },
    userId: string,
    organizationId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.riskAssessment.findFirst({
        where: { id: assessmentId, organizationId },
      });
      if (!existing) {
        throw new AppError('Risk assessment not found', 404);
      }

      const assessment = await tx.riskAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'Completed',
          completedDate: new Date(),
          overallRiskScore: data.overallRiskScore,
        },
        include: {
          risks: true,
        },
      });

      await AuditLogger.log({
        userId,
        organizationId,
        action: 'risk_assessment.completed',
        resourceType: 'RiskAssessment',
        resourceId: assessmentId,
        metadata: {
          overallRiskScore: data.overallRiskScore,
          risksIdentified: assessment.risks.length,
        },
      });

      return assessment;
    });
  }

  /**
   * Update risk with remediation plan
   */
  async updateRiskRemediation(
    riskId: string,
    data: {
      mitigationPlan: string;
      remediationOwner: string;
      targetDate: Date;
      assignedToId?: string;
    },
    userId: string,
    organizationId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.riskItem.findFirst({
        where: { id: riskId, organizationId },
      });
      if (!existing) {
        throw new AppError('Risk not found', 404);
      }

      const risk = await tx.riskItem.update({
        where: { id: riskId },
        data: {
          mitigationPlan: data.mitigationPlan,
          remediationOwner: data.remediationOwner,
          targetDate: data.targetDate,
          assignedToId: data.assignedToId,
          status: 'In_Progress',
        },
        include: {
          assignedTo: true,
        },
      });

      await AuditLogger.log({
        userId,
        organizationId,
        action: 'risk.remediation_plan_updated',
        resourceType: 'RiskItem',
        resourceId: riskId,
        metadata: {
          remediationOwner: data.remediationOwner,
          targetDate: data.targetDate,
        },
      });

      return risk;
    });
  }

  /**
   * Update risk score
   */
  async updateRiskScore(
    riskId: string,
    data: {
      likelihood: number;
      impact: number;
      aiPriorityScore?: number;
      aiRationale?: string;
    },
    userId: string,
    organizationId: string
  ) {
    const riskScore = data.likelihood * data.impact;
    const severity = this.calculateRiskSeverity(riskScore);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.riskItem.findFirst({
        where: { id: riskId, organizationId },
      });
      if (!existing) {
        throw new AppError('Risk not found', 404);
      }

      const risk = await tx.riskItem.update({
        where: { id: riskId },
        data: {
          likelihood: data.likelihood,
          impact: data.impact,
          riskScore,
          severity,
          aiPriorityScore: data.aiPriorityScore,
          aiRationale: data.aiRationale,
        },
      });

      await AuditLogger.log({
        userId,
        organizationId,
        action: 'risk.score_updated',
        resourceType: 'RiskItem',
        resourceId: riskId,
        metadata: {
          oldScore: risk.riskScore,
          newScore: riskScore,
          severity,
        },
      });

      return risk;
    });
  }

  /**
   * Resolve risk
   */
  async resolveRisk(
    riskId: string,
    data: {
      resolution: string;
      effectiveness: string;
    },
    userId: string,
    organizationId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.riskItem.findFirst({
        where: { id: riskId, organizationId },
      });
      if (!existing) {
        throw new AppError('Risk not found', 404);
      }

      const risk = await tx.riskItem.update({
        where: { id: riskId },
        data: {
          status: 'Resolved',
          resolvedAt: new Date(),
        },
      });

      await AuditLogger.log({
        userId,
        organizationId,
        action: 'risk.resolved',
        resourceType: 'RiskItem',
        resourceId: riskId,
        metadata: {
          resolution: data.resolution,
          effectiveness: data.effectiveness,
          resolutionTime: risk.resolvedAt
            ? risk.resolvedAt.getTime() - risk.detectedAt.getTime()
            : 0,
        },
      });

      return risk;
    });
  }

  /**
   * Get risk register
   */
  async getRiskRegister(
    organizationId: string,
    filters?: {
      severity?: RiskSeverity;
      status?: string;
      category?: string;
    }
  ) {
    const risks = await prisma.riskItem.findMany({
      where: {
        organizationId,
        ...(filters?.severity && { severity: filters.severity }),
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.category && { category: filters.category }),
      },
      include: {
        assignedTo: true,
        assessment: true,
      },
      orderBy: [{ riskScore: 'desc' }, { detectedAt: 'desc' }],
    });

    return risks;
  }

  /**
   * Get risk dashboard
   */
  async getRiskDashboard(organizationId: string) {
    const risks = await prisma.riskItem.findMany({
      where: { organizationId },
      include: {
        assignedTo: true,
      },
    });

    const assessments = await prisma.riskAssessment.findMany({
      where: { organizationId },
      include: {
        risks: true,
      },
    }) as RiskAssessmentWithRisks[];

    const now = new Date();

    const dashboard = {
      totalRisks: risks.length,
      openRisks: risks.filter((r) => r.status === 'Open').length,
      inProgressRisks: risks.filter((r) => r.status === 'In_Progress').length,
      resolvedRisks: risks.filter((r) => r.status === 'Resolved').length,
      severityDistribution: {
        critical: risks.filter((r) => r.severity === 'Critical').length,
        high: risks.filter((r) => r.severity === 'High').length,
        medium: risks.filter((r) => r.severity === 'Medium').length,
        low: risks.filter((r) => r.severity === 'Low').length,
      },
      categoryDistribution: this.getCategoryDistribution(risks),
      riskScoreAverage:
        risks.length > 0
          ? Math.round(
              risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) /
                risks.length
            )
          : 0,
      overdueRemediations: risks.filter(
        (r) =>
          r.targetDate &&
          r.targetDate < now &&
          r.status !== 'Resolved' &&
          r.status !== 'Accepted'
      ).length,
      assessmentMetrics: {
        totalAssessments: assessments.length,
        completedAssessments: assessments.filter(
          (a) => a.status === 'Completed'
        ).length,
        inProgressAssessments: assessments.filter(
          (a) => a.status === 'In_Progress'
        ).length,
        averageRisksPerAssessment:
          assessments.length > 0
            ? Math.round(
                assessments.reduce((sum, a) => sum + a.risks.length, 0) /
                  assessments.length
              )
            : 0,
      },
      topRisks: risks
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
        .slice(0, 10)
        .map((r) => ({
          id: r.id,
          title: r.title,
          severity: r.severity,
          riskScore: r.riskScore,
          status: r.status,
          category: r.category,
        })),
      riskTrend: this.calculateRiskTrend(risks),
      remediationEffectiveness: this.calculateRemediationEffectiveness(risks),
    };

    return dashboard;
  }

  /**
   * Get risk heat map data
   */
  async getRiskHeatMap(organizationId: string) {
    const risks = await prisma.riskItem.findMany({
      where: {
        organizationId,
        status: { in: ['Open', 'In_Progress'] },
      },
    });

    // Create 5x5 heat map
    const heatMap = Array(5)
      .fill(0)
      .map(() => Array(5).fill(0));

    risks.forEach((risk) => {
      const likelihood = Math.min(risk.likelihood || 1, 5) - 1;
      const impact = Math.min(risk.impact || 1, 5) - 1;
      heatMap[impact][likelihood]++;
    });

    return {
      heatMap,
      risks: risks.map((r) => ({
        id: r.id,
        title: r.title,
        likelihood: r.likelihood,
        impact: r.impact,
        riskScore: r.riskScore,
      })),
    };
  }

  /**
   * Get risk analytics
   */
  async getRiskAnalytics(
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ) {
    const where: Record<string, unknown> = { organizationId };

    if (timeRange) {
      where.detectedAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const risks = await prisma.riskItem.findMany({
      where,
      include: {
        assignedTo: true,
      },
    });

    const analytics = {
      totalIdentified: risks.length,
      resolvedCount: risks.filter((r) => r.status === 'Resolved').length,
      resolutionRate:
        risks.length > 0
          ? Math.round(
              (risks.filter((r) => r.status === 'Resolved').length /
                risks.length) *
                100
            )
          : 0,
      averageResolutionTime: this.calculateAverageResolutionTime(risks),
      riskVelocity: this.calculateRiskVelocity(risks, timeRange),
      categoryAnalysis: this.analyzeCategoriesTrends(risks),
      ownerAnalysis: this.analyzeRemediationOwners(risks),
    };

    return analytics;
  }

  /**
   * Private helper: Calculate risk severity based on score
   */
  private calculateRiskSeverity(riskScore: number): RiskSeverity {
    if (riskScore >= 20) return 'Critical';
    if (riskScore >= 12) return 'High';
    if (riskScore >= 6) return 'Medium';
    return 'Low';
  }

  /**
   * Private helper: Get category distribution
   */
  private getCategoryDistribution(risks: RiskItem[]) {
    const distribution: Record<string, number> = {};

    risks.forEach((risk) => {
      const category = risk.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Private helper: Calculate risk trend
   */
  private calculateRiskTrend(risks: RiskItem[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = risks.filter(
      (r) => r.detectedAt >= thirtyDaysAgo && r.status !== 'Resolved'
    ).length;
    const previous = risks.filter(
      (r) =>
        r.detectedAt >= sixtyDaysAgo &&
        r.detectedAt < thirtyDaysAgo &&
        r.status !== 'Resolved'
    ).length;

    const change = previous > 0 ? ((recent - previous) / previous) * 100 : 0;

    return {
      current: recent,
      previous,
      change: Math.round(change),
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
    };
  }

  /**
   * Private helper: Calculate remediation effectiveness
   */
  private calculateRemediationEffectiveness(risks: RiskItem[]) {
    const resolvedRisks = risks.filter((r) => r.status === 'Resolved');

    if (resolvedRisks.length === 0) {
      return {
        rate: 0,
        averageDays: 0,
      };
    }

    const totalDays = resolvedRisks.reduce((sum, r) => {
      if (r.resolvedAt && r.detectedAt) {
        return (
          sum +
          (r.resolvedAt.getTime() - r.detectedAt.getTime()) /
            (24 * 60 * 60 * 1000)
        );
      }
      return sum;
    }, 0);

    return {
      rate: Math.round((resolvedRisks.length / risks.length) * 100),
      averageDays: Math.round(totalDays / resolvedRisks.length),
    };
  }

  /**
   * Private helper: Calculate average resolution time
   */
  private calculateAverageResolutionTime(risks: RiskItem[]): number {
    const resolvedRisks = risks.filter(
      (r) => r.status === 'Resolved' && r.resolvedAt
    );

    if (resolvedRisks.length === 0) return 0;

    const totalTime = resolvedRisks.reduce((sum, r) => {
      const time = r.resolvedAt!.getTime() - r.detectedAt.getTime();
      return sum + time / (24 * 60 * 60 * 1000); // Convert to days
    }, 0);

    return Math.round(totalTime / resolvedRisks.length);
  }

  /**
   * Private helper: Calculate risk velocity
   */
  private calculateRiskVelocity(risks: RiskItem[], timeRange?: { start: Date; end: Date }): number {
    if (!timeRange) return 0;

    const days =
      (timeRange.end.getTime() - timeRange.start.getTime()) /
      (24 * 60 * 60 * 1000);

    return risks.length / days;
  }

  /**
   * Private helper: Analyze category trends
   */
  private analyzeCategoriesTrends(risks: RiskItem[]) {
    const categories = this.getCategoryDistribution(risks);

    return Object.entries(categories)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / risks.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Private helper: Analyze remediation owners
   */
  private analyzeRemediationOwners(risks: RiskItem[]) {
    const owners: Record<string, {
      owner: string;
      totalRisks: number;
      resolvedRisks: number;
      overdueRisks: number;
    }> = {};

    risks.forEach((risk) => {
      const owner = risk.remediationOwner || 'Unassigned';

      if (!owners[owner]) {
        owners[owner] = {
          owner,
          totalRisks: 0,
          resolvedRisks: 0,
          overdueRisks: 0,
        };
      }

      owners[owner].totalRisks++;

      if (risk.status === 'Resolved') {
        owners[owner].resolvedRisks++;
      }

      if (
        risk.targetDate &&
        risk.targetDate < new Date() &&
        risk.status !== 'Resolved'
      ) {
        owners[owner].overdueRisks++;
      }
    });

    return Object.values(owners).map((owner) => ({
      ...owner,
      resolutionRate:
        owner.totalRisks > 0
          ? Math.round((owner.resolvedRisks / owner.totalRisks) * 100)
          : 0,
    }));
  }
}

export default new RiskManagementService();
