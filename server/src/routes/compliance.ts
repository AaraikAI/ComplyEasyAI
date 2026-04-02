/**
 * Compliance History Routes
 *
 * Endpoints for retrieving historical compliance score data,
 * used by the ComplianceScoreForecasting frontend component.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateQuery } from '../middleware/validate';
import { complianceHistoryQuerySchema } from '../validators/complianceSchemas';
import prisma from '../config/database';

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

export default router;
