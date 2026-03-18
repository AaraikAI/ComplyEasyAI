/**
 * Compliance Cost Analytics Routes
 *
 * CRUD for cost entries with summary aggregation, trend analysis,
 * and budget vs actual comparison. Uses Prisma groupBy for analytics.
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

function parseDateRange(query: any): { from?: Date; to?: Date } {
  const from = query.from ? new Date(query.from as string) : undefined;
  const to = query.to ? new Date(query.to as string) : undefined;
  return { from, to };
}

// ============================================================================
// GET /summary — Cost summary (total by category, by framework, by period)
// ============================================================================

router.get(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const { from, to } = parseDateRange(req.query);

    try {
      const dateFilter: any = {};
      if (from) dateFilter.gte = from;
      if (to) dateFilter.lte = to;

      const where: any = { organizationId: orgId };
      if (from || to) where.periodStart = dateFilter;

      // Total spend
      const totalAgg = await prisma.complianceCost.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      });

      // By category
      const byCategory = await prisma.complianceCost.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      });

      // By framework
      const byFramework = await prisma.complianceCost.groupBy({
        by: ['frameworkId'],
        where: { ...where, frameworkId: { not: null } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      });

      // By currency
      const byCurrency = await prisma.complianceCost.groupBy({
        by: ['currency'],
        where,
        _sum: { amount: true },
        _count: true,
      });

      res.json({
        status: 'success',
        data: {
          totalSpend: totalAgg._sum.amount || 0,
          totalEntries: totalAgg._count,
          byCategory: byCategory.map((g) => ({
            category: g.category,
            totalAmount: g._sum.amount || 0,
            count: g._count,
          })),
          byFramework: byFramework.map((g) => ({
            frameworkId: g.frameworkId,
            totalAmount: g._sum.amount || 0,
            count: g._count,
          })),
          byCurrency: byCurrency.map((g) => ({
            currency: g.currency,
            totalAmount: g._sum.amount || 0,
            count: g._count,
          })),
        },
      });
    } catch (error) {
      logger.error('Error fetching cost summary:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch cost summary' });
    }
  })
);

// ============================================================================
// GET /trend — Cost trend over time (monthly aggregation)
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

      const costs = await prisma.complianceCost.findMany({
        where: {
          organizationId: orgId,
          periodStart: { gte: startDate },
        },
        select: {
          amount: true,
          category: true,
          periodStart: true,
          currency: true,
        },
        orderBy: { periodStart: 'asc' },
      });

      // Aggregate by month
      const monthlyMap = new Map<string, { total: number; byCategory: Record<string, number> }>();

      for (const cost of costs) {
        const monthKey = `${cost.periodStart.getFullYear()}-${String(cost.periodStart.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { total: 0, byCategory: {} });
        }
        const entry = monthlyMap.get(monthKey)!;
        entry.total += cost.amount;
        entry.byCategory[cost.category] = (entry.byCategory[cost.category] || 0) + cost.amount;
      }

      const trend = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        total: Math.round(data.total * 100) / 100,
        byCategory: data.byCategory,
      }));

      res.json({
        status: 'success',
        data: {
          trend,
          months,
          totalDataPoints: trend.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching cost trend:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch cost trend' });
    }
  })
);

// ============================================================================
// GET /budget — Budget vs actual comparison
// ============================================================================

router.get(
  '/budget',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    try {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);

      // Actual spend by category for the year
      const actualByCategory = await prisma.complianceCost.groupBy({
        by: ['category'],
        where: {
          organizationId: orgId,
          periodStart: { gte: yearStart, lte: yearEnd },
        },
        _sum: { amount: true },
      });

      // Total actual spend
      const totalActual = await prisma.complianceCost.aggregate({
        where: {
          organizationId: orgId,
          periodStart: { gte: yearStart, lte: yearEnd },
        },
        _sum: { amount: true },
      });

      // Quarter-by-quarter breakdown
      const quarters: Array<{ quarter: number; start: Date; end: Date }> = [];
      for (let q = 0; q < 4; q++) {
        quarters.push({
          quarter: q + 1,
          start: new Date(year, q * 3, 1),
          end: new Date(year, q * 3 + 3, 0, 23, 59, 59),
        });
      }

      const quarterlySpend = await Promise.all(
        quarters.map(async (q) => {
          const agg = await prisma.complianceCost.aggregate({
            where: {
              organizationId: orgId,
              periodStart: { gte: q.start, lte: q.end },
            },
            _sum: { amount: true },
            _count: true,
          });
          return {
            quarter: `Q${q.quarter}`,
            actual: agg._sum.amount || 0,
            entries: agg._count,
          };
        })
      );

      res.json({
        status: 'success',
        data: {
          year,
          totalActual: totalActual._sum.amount || 0,
          byCategory: actualByCategory.map((g) => ({
            category: g.category,
            actual: g._sum.amount || 0,
          })),
          quarterly: quarterlySpend,
        },
      });
    } catch (error) {
      logger.error('Error fetching budget comparison:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch budget comparison' });
    }
  })
);

// ============================================================================
// GET / — List costs (filterable by category, framework, date range)
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const category = req.query.category as string | undefined;
    const frameworkId = req.query.frameworkId as string | undefined;
    const { from, to } = parseDateRange(req.query);

    try {
      const where: any = { organizationId: user.organizationId };
      if (category) where.category = category;
      if (frameworkId) where.frameworkId = frameworkId;
      if (from || to) {
        where.periodStart = {};
        if (from) where.periodStart.gte = from;
        if (to) where.periodStart.lte = to;
      }

      const [costs, total] = await Promise.all([
        prisma.complianceCost.findMany({
          where,
          orderBy: { periodStart: 'desc' },
          skip,
          take,
        }),
        prisma.complianceCost.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          costs,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching costs:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch costs' });
    }
  })
);

// ============================================================================
// POST / — Create cost entry
// ============================================================================

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const {
        category,
        description,
        amount,
        currency,
        frameworkId,
        controlId,
        vendorId,
        periodStart,
        periodEnd,
      } = req.body;

      if (!category || !description || amount === undefined || !periodStart || !periodEnd) {
        res.status(400).json({
          status: 'error',
          message: 'category, description, amount, periodStart, and periodEnd are required',
        });
        return;
      }

      const validCategories = [
        'TOOL_LICENSE', 'CONSULTANT', 'AUDIT_FEE', 'TRAINING',
        'PERSONNEL', 'REMEDIATION', 'INSURANCE', 'CERTIFICATION',
        'LEGAL', 'OTHER',
      ];
      if (!validCategories.includes(category)) {
        res.status(400).json({
          status: 'error',
          message: `category must be one of: ${validCategories.join(', ')}`,
        });
        return;
      }

      const cost = await prisma.complianceCost.create({
        data: {
          organizationId: user.organizationId,
          category,
          description,
          amount: parseFloat(amount),
          currency: currency || 'USD',
          frameworkId: frameworkId || null,
          controlId: controlId || null,
          vendorId: vendorId || null,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          createdBy: user.id,
        },
      });

      res.status(201).json({ status: 'success', data: cost });
    } catch (error) {
      logger.error('Error creating cost entry:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create cost entry' });
    }
  })
);

// ============================================================================
// PATCH /:id — Update cost entry
// ============================================================================

router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.complianceCost.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Cost entry not found' });
        return;
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'category', 'description', 'amount', 'currency', 'frameworkId',
        'controlId', 'vendorId', 'periodStart', 'periodEnd',
      ]);

      if (updateData.periodStart) updateData.periodStart = new Date(updateData.periodStart);
      if (updateData.periodEnd) updateData.periodEnd = new Date(updateData.periodEnd);
      if (updateData.amount !== undefined) updateData.amount = parseFloat(updateData.amount);

      const cost = await prisma.complianceCost.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: cost });
    } catch (error) {
      logger.error('Error updating cost entry:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update cost entry' });
    }
  })
);

// ============================================================================
// DELETE /:id — Delete cost entry
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.complianceCost.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Cost entry not found' });
        return;
      }

      await prisma.complianceCost.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Cost entry deleted', id: req.params.id } });
    } catch (error) {
      logger.error('Error deleting cost entry:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete cost entry' });
    }
  })
);

export default router;
