/**
 * Control Effectiveness Tracking Routes
 *
 * CRUD and analytics for control effectiveness assessments including
 * per-control history, org-wide trend analysis, degradation detection,
 * and summary statistics.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

function paginate(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

const RATING_SCORE: Record<string, number> = {
  EFFECTIVE: 3,
  PARTIALLY_EFFECTIVE: 2,
  INEFFECTIVE: 1,
  NOT_TESTED: 0,
};

// ============================================================================
// GET /trend — Org-wide effectiveness trend over time (before /:id routes)
// ============================================================================

router.get(
  '/trend',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const months = Math.min(60, Math.max(1, parseInt(req.query.months as string, 10) || 12));

    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const records = await prisma.controlEffectivenessRecord.findMany({
        where: {
          organizationId: orgId,
          assessmentDate: { gte: startDate },
        },
        select: {
          rating: true,
          assessmentDate: true,
        },
        orderBy: { assessmentDate: 'asc' },
      });

      // Aggregate by month
      const monthlyMap = new Map<
        string,
        { total: number; effective: number; partial: number; ineffective: number; notTested: number; avgScore: number }
      >();

      for (const r of records) {
        const monthKey = `${r.assessmentDate.getFullYear()}-${String(r.assessmentDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { total: 0, effective: 0, partial: 0, ineffective: 0, notTested: 0, avgScore: 0 });
        }
        const entry = monthlyMap.get(monthKey)!;
        entry.total++;
        if (r.rating === 'EFFECTIVE') entry.effective++;
        else if (r.rating === 'PARTIALLY_EFFECTIVE') entry.partial++;
        else if (r.rating === 'INEFFECTIVE') entry.ineffective++;
        else entry.notTested++;
      }

      const trend = Array.from(monthlyMap.entries()).map(([month, data]) => {
        const scoredCount = data.effective + data.partial + data.ineffective;
        const totalScore =
          data.effective * RATING_SCORE.EFFECTIVE +
          data.partial * RATING_SCORE.PARTIALLY_EFFECTIVE +
          data.ineffective * RATING_SCORE.INEFFECTIVE;

        return {
          month,
          total: data.total,
          effective: data.effective,
          partiallyEffective: data.partial,
          ineffective: data.ineffective,
          notTested: data.notTested,
          averageScore: scoredCount > 0 ? Math.round((totalScore / scoredCount) * 100) / 100 : 0,
          effectivenessRate: data.total > 0 ? Math.round((data.effective / data.total) * 100) : 0,
        };
      });

      res.json({
        status: 'success',
        data: {
          trend,
          months,
          totalDataPoints: trend.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching effectiveness trend:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch effectiveness trend' });
    }
  })
);

// ============================================================================
// GET /degrading — Controls with degrading effectiveness
// ============================================================================

router.get(
  '/degrading',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const minAssessments = Math.max(2, parseInt(req.query.minAssessments as string, 10) || 2);

    try {
      // Get all records grouped by control, ordered by assessment date
      const records = await prisma.controlEffectivenessRecord.findMany({
        where: { organizationId: orgId },
        select: {
          controlId: true,
          rating: true,
          assessmentDate: true,
        },
        orderBy: { assessmentDate: 'desc' },
      });

      // Group by control
      const byControl = new Map<string, Array<{ rating: string; assessmentDate: Date }>>();
      for (const r of records) {
        if (!byControl.has(r.controlId)) {
          byControl.set(r.controlId, []);
        }
        byControl.get(r.controlId)!.push({ rating: r.rating, assessmentDate: r.assessmentDate });
      }

      // Detect degradation: latest rating is worse than the previous one
      const degrading: Array<{
        controlId: string;
        currentRating: string;
        previousRating: string;
        currentDate: Date;
        previousDate: Date;
        scoreDrop: number;
      }> = [];

      for (const [controlId, assessments] of byControl) {
        if (assessments.length < minAssessments) continue;

        // assessments are sorted desc, so [0] is latest, [1] is previous
        const latest = assessments[0];
        const previous = assessments[1];

        const latestScore = RATING_SCORE[latest.rating] ?? 0;
        const previousScore = RATING_SCORE[previous.rating] ?? 0;

        if (latestScore < previousScore) {
          degrading.push({
            controlId,
            currentRating: latest.rating,
            previousRating: previous.rating,
            currentDate: latest.assessmentDate,
            previousDate: previous.assessmentDate,
            scoreDrop: previousScore - latestScore,
          });
        }
      }

      // Sort by largest score drop first
      degrading.sort((a, b) => b.scoreDrop - a.scoreDrop);

      res.json({
        status: 'success',
        data: {
          degrading,
          total: degrading.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching degrading controls:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch degrading controls' });
    }
  })
);

// ============================================================================
// GET /stats — Effectiveness statistics
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      // Get the latest assessment per control
      const allRecords = await prisma.controlEffectivenessRecord.findMany({
        where: { organizationId: orgId },
        select: {
          controlId: true,
          rating: true,
          assessmentDate: true,
        },
        orderBy: { assessmentDate: 'desc' },
      });

      // Deduplicate: keep only the latest per control
      const latestByControl = new Map<string, string>();
      for (const r of allRecords) {
        if (!latestByControl.has(r.controlId)) {
          latestByControl.set(r.controlId, r.rating);
        }
      }

      const totalControls = latestByControl.size;
      const counts: Record<string, number> = {
        EFFECTIVE: 0,
        PARTIALLY_EFFECTIVE: 0,
        INEFFECTIVE: 0,
        NOT_TESTED: 0,
      };

      for (const rating of latestByControl.values()) {
        counts[rating] = (counts[rating] || 0) + 1;
      }

      const percentages: Record<string, number> = {};
      for (const [key, count] of Object.entries(counts)) {
        percentages[key] = totalControls > 0
          ? Math.round((count / totalControls) * 100 * 100) / 100
          : 0;
      }

      // Overall effectiveness score (0-100)
      const scoredControls = counts.EFFECTIVE + counts.PARTIALLY_EFFECTIVE + counts.INEFFECTIVE;
      const totalScore =
        counts.EFFECTIVE * RATING_SCORE.EFFECTIVE +
        counts.PARTIALLY_EFFECTIVE * RATING_SCORE.PARTIALLY_EFFECTIVE +
        counts.INEFFECTIVE * RATING_SCORE.INEFFECTIVE;
      const maxPossibleScore = scoredControls * RATING_SCORE.EFFECTIVE;
      const overallScore = maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 100)
        : 0;

      res.json({
        status: 'success',
        data: {
          totalControlsAssessed: totalControls,
          totalAssessments: allRecords.length,
          counts,
          percentages,
          overallEffectivenessScore: overallScore,
        },
      });
    } catch (error) {
      logger.error('Error fetching effectiveness stats:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch effectiveness statistics' });
    }
  })
);

// ============================================================================
// GET /control/:controlId — Effectiveness history for a specific control
// ============================================================================

router.get(
  '/control/:controlId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const where = {
        organizationId: user.organizationId,
        controlId: req.params.controlId,
      };

      const [records, total] = await Promise.all([
        prisma.controlEffectivenessRecord.findMany({
          where,
          orderBy: { assessmentDate: 'desc' },
          skip,
          take,
        }),
        prisma.controlEffectivenessRecord.count({ where }),
      ]);

      // Compute trend direction for this control
      let trendDirection: 'improving' | 'degrading' | 'stable' | 'insufficient_data' = 'insufficient_data';
      if (records.length >= 2) {
        const latestScore = RATING_SCORE[records[0].rating] ?? 0;
        const previousScore = RATING_SCORE[records[1].rating] ?? 0;
        if (latestScore > previousScore) trendDirection = 'improving';
        else if (latestScore < previousScore) trendDirection = 'degrading';
        else trendDirection = 'stable';
      }

      res.json({
        status: 'success',
        data: {
          controlId: req.params.controlId,
          records,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          trend: trendDirection,
        },
      });
    } catch (error) {
      logger.error('Error fetching control effectiveness history:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch control effectiveness history' });
    }
  })
);

// ============================================================================
// GET / — List effectiveness records (filterable)
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const controlId = req.query.controlId as string | undefined;
    const rating = req.query.rating as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    try {
      const where: any = { organizationId: user.organizationId };
      if (controlId) where.controlId = controlId;
      if (rating) where.rating = rating;
      if (from || to) {
        where.assessmentDate = {};
        if (from) where.assessmentDate.gte = from;
        if (to) where.assessmentDate.lte = to;
      }

      const [records, total] = await Promise.all([
        prisma.controlEffectivenessRecord.findMany({
          where,
          orderBy: { assessmentDate: 'desc' },
          skip,
          take,
        }),
        prisma.controlEffectivenessRecord.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          records,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching effectiveness records:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch effectiveness records' });
    }
  })
);

// ============================================================================
// POST / — Create effectiveness assessment
// ============================================================================

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const {
        controlId,
        rating,
        testMethod,
        findings,
        evidence,
        assessmentDate,
      } = req.body;

      if (!controlId || !rating || !testMethod) {
        res.status(400).json({
          status: 'error',
          message: 'controlId, rating, and testMethod are required',
        });
        return;
      }

      const validRatings = ['EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE', 'NOT_TESTED'];
      if (!validRatings.includes(rating)) {
        res.status(400).json({
          status: 'error',
          message: `rating must be one of: ${validRatings.join(', ')}`,
        });
        return;
      }

      const record = await prisma.controlEffectivenessRecord.create({
        data: {
          organizationId: user.organizationId,
          controlId,
          rating,
          testMethod,
          findings: findings || null,
          assessedBy: user.id,
          evidence: evidence || [],
          assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
        },
      });

      res.status(201).json({ status: 'success', data: record });
    } catch (error) {
      logger.error('Error creating effectiveness assessment:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create effectiveness assessment' });
    }
  })
);

export default router;
