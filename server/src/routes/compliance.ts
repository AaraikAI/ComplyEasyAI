/**
 * Compliance Routes
 *
 * Endpoints for retrieving historical compliance score data and
 * AI-derived forecasting context (projections, risk factors,
 * recommendations) used by the ComplianceScoreForecasting
 * frontend component.
 *
 * All endpoints filter strictly by req.user.organizationId.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateQuery } from '../middleware/validate';
import { complianceHistoryQuerySchema } from '../validators/complianceSchemas';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// GET /compliance/history - Get historical compliance scores
router.get(
  '/history',
  validateQuery(complianceHistoryQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const months = Math.min(24, Math.max(1, parseInt(req.query.months as string, 10) || 12));

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const history = await prisma.metricsHistory.findMany({
      where: {
        organizationId: orgId,
        metricType: { startsWith: 'compliance-score' },
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Group by month with per-metric counters for correct averaging
    const monthlyData = new Map<string, {
      overall: number; overallCount: number;
      technical: number; technicalCount: number;
      administrative: number; administrativeCount: number;
      physical: number; physicalCount: number;
    }>();

    for (const entry of history) {
      const date = new Date(entry.recordedAt);
      const key = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
      const existing = monthlyData.get(key) || {
        overall: 0, overallCount: 0,
        technical: 0, technicalCount: 0,
        administrative: 0, administrativeCount: 0,
        physical: 0, physicalCount: 0,
      };

      if (entry.metricType === 'compliance-score') {
        existing.overall += entry.value;
        existing.overallCount++;
      } else if (entry.metricType === 'compliance-score-technical') {
        existing.technical += entry.value;
        existing.technicalCount++;
      } else if (entry.metricType === 'compliance-score-administrative') {
        existing.administrative += entry.value;
        existing.administrativeCount++;
      } else if (entry.metricType === 'compliance-score-physical') {
        existing.physical += entry.value;
        existing.physicalCount++;
      }
      monthlyData.set(key, existing);
    }

    const results = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      overall: Math.round(data.overall / Math.max(1, data.overallCount) * 10) / 10,
      technical: Math.round(data.technical / Math.max(1, data.technicalCount) * 10) / 10,
      administrative: Math.round(data.administrative / Math.max(1, data.administrativeCount) * 10) / 10,
      physical: Math.round(data.physical / Math.max(1, data.physicalCount) * 10) / 10,
    }));

    res.json({
      status: 'success',
      data: results,
    });
  })
);

// ---------------------------------------------------------------------------
// GET /compliance/forecasting
// Combined endpoint that backs the ComplianceScoreForecasting UI.
// Returns projections (one per framework), risk factors (derived from
// open RiskItem rows), and recommendations (derived from controls in
// non-Implemented status). All data is scoped to the caller's organization.
// ---------------------------------------------------------------------------
router.get(
  '/forecasting',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    // 1. Projections: one row per framework for the org.
    //    currentScore = framework.progress
    //    projectedNN uses recent metricsHistory delta as a per-month rate.
    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        progress: true,
        status: true,
        nextAuditDate: true,
        region: true,
      },
    });

    // Read last 90 days of compliance-score metrics per framework to
    // estimate trend. We use the aggregate org-level score because
    // per-framework history is not stored separately; the per-framework
    // trend is therefore approximated from the org-wide slope.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentScores = await prisma.metricsHistory.findMany({
      where: {
        organizationId: orgId,
        metricType: 'compliance-score',
        recordedAt: { gte: ninetyDaysAgo },
      },
      orderBy: { recordedAt: 'asc' },
      select: { value: true, recordedAt: true },
    });

    // Estimate monthly slope (pts/month). If we have <2 points, slope = 0.
    let monthlySlope = 0;
    if (recentScores.length >= 2) {
      const first = recentScores[0];
      const last = recentScores[recentScores.length - 1];
      const months = Math.max(
        1 / 30,
        (last.recordedAt.getTime() - first.recordedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      monthlySlope = (last.value - first.value) / months;
    }

    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n * 10) / 10));

    const projections = frameworks.map((fw) => {
      const current = fw.progress ?? 0;
      const p30 = clamp(current + monthlySlope * 1);
      const p60 = clamp(current + monthlySlope * 2);
      const p90 = clamp(current + monthlySlope * 3);
      const p180 = clamp(current + monthlySlope * 6);
      const trend: 'improving' | 'stable' | 'declining' =
        monthlySlope > 0.5 ? 'improving' :
        monthlySlope < -0.5 ? 'declining' : 'stable';
      return {
        id: fw.id,
        name: fw.name,
        currentScore: Math.round(current),
        projected30: p30,
        projected60: p60,
        projected90: p90,
        projected180: p180,
        trend,
        trendDelta: Math.round(monthlySlope * 10) / 10,
        category: fw.region || 'General',
      };
    });

    // 2. Risk factors: open RiskItem rows of severity High/Critical.
    const openRisks = await prisma.riskItem.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['Open', 'In_Progress'] },
      },
      orderBy: [{ severity: 'asc' }, { detectedAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        status: true,
        riskScore: true,
        targetDate: true,
      },
    });

    const riskFactors = openRisks.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      category: (r.category?.toLowerCase() as
        'regulation' | 'certification' | 'audit' | 'personnel' | 'technology'
      ) || 'regulation',
      severity: r.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low',
      impactScore: -(r.riskScore ?? 3),
      expectedDate: r.targetDate ? r.targetDate.toISOString().substring(0, 10) : '',
      status: r.status === 'In_Progress' ? 'active' : 'upcoming',
      affectedFrameworks: [] as string[],
    }));

    // 3. Recommendations: derived from FrameworkControl rows that are
    //    not yet Implemented for this org's frameworks. We aggregate
    //    by category and surface up to 10 categories as recommendations.
    const incompleteControls = await prisma.frameworkControl.findMany({
      where: {
        framework: { organizationId: orgId },
        status: { in: ['NotImplemented', 'Not_Implemented', 'Partial', 'InProgress', 'In_Progress'] },
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        status: true,
        framework: { select: { name: true } },
      },
      take: 200,
    });

    const recsByCategory = new Map<string, {
      title: string;
      description: string;
      count: number;
      frameworks: Set<string>;
    }>();

    for (const ctrl of incompleteControls) {
      const cat = ctrl.category || 'General Controls';
      const existing = recsByCategory.get(cat) || {
        title: `Complete ${cat} controls`,
        description: '',
        count: 0,
        frameworks: new Set<string>(),
      };
      existing.count++;
      if (ctrl.framework?.name) existing.frameworks.add(ctrl.framework.name);
      recsByCategory.set(cat, existing);
    }

    const recommendations = Array.from(recsByCategory.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([category, agg], idx) => ({
        id: `rec-${idx + 1}`,
        title: agg.title,
        description: `${agg.count} ${category.toLowerCase()} control(s) remain unimplemented or in progress across ${agg.frameworks.size} framework(s).`,
        priority: (agg.count >= 10 ? 'critical' : agg.count >= 5 ? 'high' : agg.count >= 2 ? 'medium' : 'low') as
          'critical' | 'high' | 'medium' | 'low',
        estimatedImpact: Math.min(10, agg.count * 0.5),
        effort: (agg.count >= 10 ? 'high' : agg.count >= 5 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        category,
        affectedFrameworks: Array.from(agg.frameworks),
        timeToImplement: agg.count >= 10 ? '8-12 weeks' : agg.count >= 5 ? '4-6 weeks' : '1-3 weeks',
        status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'dismissed',
      }));

    logger.debug('compliance.forecasting computed', {
      orgId,
      frameworks: projections.length,
      risks: riskFactors.length,
      recommendations: recommendations.length,
    });

    res.json({
      status: 'success',
      data: {
        projections,
        riskFactors,
        recommendations,
      },
    });
  })
);

export default router;
