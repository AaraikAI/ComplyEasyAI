/**
 * Compliance History Routes
 *
 * Endpoints for retrieving historical compliance score data,
 * used by the ComplianceScoreForecasting frontend component.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// GET /compliance/history - Get historical compliance scores
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const months = Math.min(24, Math.max(1, parseInt(req.query.months as string, 10) || 12));

    try {
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

      // Group by month
      const monthlyData = new Map<string, { overall: number; technical: number; administrative: number; physical: number; count: number }>();

      for (const entry of history) {
        const date = new Date(entry.recordedAt);
        const key = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
        const existing = monthlyData.get(key) || { overall: 0, technical: 0, administrative: 0, physical: 0, count: 0 };

        if (entry.metricType === 'compliance-score') {
          existing.overall += entry.value;
        } else if (entry.metricType === 'compliance-score-technical') {
          existing.technical += entry.value;
        } else if (entry.metricType === 'compliance-score-administrative') {
          existing.administrative += entry.value;
        } else if (entry.metricType === 'compliance-score-physical') {
          existing.physical += entry.value;
        }
        existing.count++;
        monthlyData.set(key, existing);
      }

      const results = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        overall: Math.round(data.overall / Math.max(1, data.count) * 10) / 10,
        technical: Math.round(data.technical / Math.max(1, data.count) * 10) / 10,
        administrative: Math.round(data.administrative / Math.max(1, data.count) * 10) / 10,
        physical: Math.round(data.physical / Math.max(1, data.count) * 10) / 10,
      }));

      res.json({
        status: 'success',
        data: results,
      });
    } catch (error) {
      logger.error('Error fetching compliance history:', error);
      res.status(500).json({ error: 'Failed to fetch compliance history' });
    }
  })
);

export default router;
