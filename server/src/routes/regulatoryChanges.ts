/**
 * Regulatory Change Detection Routes
 *
 * Endpoints for tracking regulatory changes, impact assessments,
 * and maintaining compliance with evolving regulations.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
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

// ============================================================================
// STATS (registered before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      // Fetch all impacts scoped to this org to derive stats
      const impacts = await prisma.regulatoryChangeImpact.findMany({
        where: { organizationId: orgId },
        include: { regulatoryChange: { select: { changeType: true, status: true, regulationName: true } } },
      });

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byRegulation: Record<string, number> = {};
      const changeIdsSeen = new Set<string>();

      for (const impact of impacts) {
        const rc = impact.regulatoryChange;
        if (!changeIdsSeen.has(impact.regulatoryChangeId)) {
          changeIdsSeen.add(impact.regulatoryChangeId);
          byType[rc.changeType] = (byType[rc.changeType] || 0) + 1;
          byStatus[rc.status] = (byStatus[rc.status] || 0) + 1;
          byRegulation[rc.regulationName] = (byRegulation[rc.regulationName] || 0) + 1;
        }
      }

      res.json({
        status: 'success',
        data: {
          totalChanges: changeIdsSeen.size,
          totalImpacts: impacts.length,
          byType,
          byStatus,
          byRegulation,
        },
      });
    } catch (error) {
      logger.error('Error fetching regulatory change stats:', error);
      res.status(500).json({ error: 'Failed to fetch regulatory change stats' });
    }
  })
);

// ============================================================================
// LIST REGULATORY CHANGES
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const regulation = req.query.regulation as string | undefined;
    const changeType = req.query.changeType as string | undefined;
    const status = req.query.status as string | undefined;

    try {
      // Build filter: only show changes that have impacts for this org, or all if user wants global view
      const impactWhere: any = { organizationId: orgId };
      const changeWhere: any = {};

      if (regulation) {
        changeWhere.regulationName = { contains: regulation, mode: 'insensitive' };
      }
      if (changeType) {
        changeWhere.changeType = changeType;
      }
      if (status) {
        changeWhere.status = status;
      }

      // Filter to changes that have at least one impact for this org
      changeWhere.impacts = { some: { organizationId: orgId } };

      const [changes, total] = await Promise.all([
        prisma.regulatoryChangeDetection.findMany({
          where: changeWhere,
          orderBy: { detectedAt: 'desc' },
          skip,
          take,
          include: {
            _count: { select: { impacts: true } },
            impacts: {
              where: impactWhere,
              take: 5,
            },
          },
        }),
        prisma.regulatoryChangeDetection.count({ where: changeWhere }),
      ]);

      res.json({
        status: 'success',
        data: {
          changes,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing regulatory changes:', error);
      res.status(500).json({ error: 'Failed to list regulatory changes' });
    }
  })
);

// ============================================================================
// GET REGULATORY CHANGE BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const change = await prisma.regulatoryChangeDetection.findUnique({
        where: { id: req.params.id },
        include: {
          impacts: {
            where: { organizationId: orgId },
            orderBy: { impactLevel: 'asc' },
          },
        },
      });

      if (!change) {
        res.status(404).json({ error: 'Regulatory change not found' });
        return;
      }

      // Verify org has access (has at least one impact record)
      if (change.impacts.length === 0) {
        res.status(404).json({ error: 'Regulatory change not found' });
        return;
      }

      res.json({ status: 'success', data: change });
    } catch (error) {
      logger.error('Error fetching regulatory change:', error);
      res.status(500).json({ error: 'Failed to fetch regulatory change' });
    }
  })
);

// ============================================================================
// CREATE REGULATORY CHANGE
// ============================================================================

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const {
        regulationName,
        changeType,
        title,
        summary,
        sourceUrl,
        effectiveDate,
        impactAnalysis,
      } = req.body;

      if (!regulationName || !changeType || !title || !summary) {
        res.status(400).json({
          error: 'regulationName, changeType, title, and summary are required',
        });
        return;
      }

      const validChangeTypes = ['NEW_REGULATION', 'AMENDMENT', 'GUIDANCE', 'ENFORCEMENT', 'REPEAL'];
      if (!validChangeTypes.includes(changeType)) {
        res.status(400).json({
          error: `changeType must be one of: ${validChangeTypes.join(', ')}`,
        });
        return;
      }

      const change = await prisma.regulatoryChangeDetection.create({
        data: {
          regulationName,
          changeType,
          title,
          summary,
          sourceUrl: sourceUrl || null,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
          impactAnalysis: impactAnalysis || null,
          status: 'NEW',
        },
      });

      // Create impact record using controlId from request or a placeholder
      const controlId = req.body.controlId || 'pending-review';
      await prisma.regulatoryChangeImpact.create({
        data: {
          regulatoryChangeId: change.id,
          controlId,
          organizationId: orgId,
          impactLevel: req.body.impactLevel || 'Medium',
          requiredAction: req.body.requiredAction || 'Review and assess impact on existing controls',
          status: 'NEW',
        },
      });

      const result = await prisma.regulatoryChangeDetection.findUnique({
        where: { id: change.id },
        include: { impacts: { where: { organizationId: orgId } } },
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      logger.error('Error creating regulatory change:', error);
      res.status(500).json({ error: 'Failed to create regulatory change' });
    }
  })
);

// ============================================================================
// UPDATE REGULATORY CHANGE
// ============================================================================

router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      // Verify org has access
      const existing = await prisma.regulatoryChangeImpact.findFirst({
        where: { regulatoryChangeId: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Regulatory change not found' });
        return;
      }

      const { status, impactAnalysis, title, summary, sourceUrl, effectiveDate } = req.body;

      const updateData: any = {};
      if (status) {
        const validStatuses = ['NEW', 'REVIEWING', 'IN_PROGRESS', 'REG_RESOLVED', 'DISMISSED'];
        if (!validStatuses.includes(status)) {
          res.status(400).json({
            error: `status must be one of: ${validStatuses.join(', ')}`,
          });
          return;
        }
        updateData.status = status;
      }
      if (impactAnalysis !== undefined) updateData.impactAnalysis = impactAnalysis;
      if (title) updateData.title = title;
      if (summary) updateData.summary = summary;
      if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl;
      if (effectiveDate !== undefined) {
        updateData.effectiveDate = effectiveDate ? new Date(effectiveDate) : null;
      }

      const change = await prisma.regulatoryChangeDetection.update({
        where: { id: req.params.id },
        data: updateData,
        include: { impacts: { where: { organizationId: orgId } } },
      });

      res.json({ status: 'success', data: change });
    } catch (error) {
      logger.error('Error updating regulatory change:', error);
      res.status(500).json({ error: 'Failed to update regulatory change' });
    }
  })
);

// ============================================================================
// DISMISS REGULATORY CHANGE
// ============================================================================

router.patch(
  '/:id/dismiss',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.regulatoryChangeImpact.findFirst({
        where: { regulatoryChangeId: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Regulatory change not found' });
        return;
      }

      // Update all org-scoped impacts to DISMISSED
      await prisma.regulatoryChangeImpact.updateMany({
        where: { regulatoryChangeId: req.params.id, organizationId: orgId },
        data: { status: 'DISMISSED' },
      });

      // If no other orgs have non-dismissed impacts, mark the change itself as dismissed
      const activeImpacts = await prisma.regulatoryChangeImpact.count({
        where: {
          regulatoryChangeId: req.params.id,
          status: { not: 'DISMISSED' },
        },
      });

      if (activeImpacts === 0) {
        await prisma.regulatoryChangeDetection.update({
          where: { id: req.params.id },
          data: { status: 'DISMISSED' },
        });
      }

      res.json({
        status: 'success',
        data: { message: 'Regulatory change dismissed for your organization' },
      });
    } catch (error) {
      logger.error('Error dismissing regulatory change:', error);
      res.status(500).json({ error: 'Failed to dismiss regulatory change' });
    }
  })
);

// ============================================================================
// LIST IMPACTS FOR A CHANGE
// ============================================================================

router.get(
  '/:id/impacts',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const where = {
        regulatoryChangeId: req.params.id,
        organizationId: orgId,
      };

      const [impacts, total] = await Promise.all([
        prisma.regulatoryChangeImpact.findMany({
          where,
          skip,
          take,
          include: {
            regulatoryChange: {
              select: { title: true, regulationName: true, changeType: true },
            },
          },
        }),
        prisma.regulatoryChangeImpact.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          impacts,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing impacts:', error);
      res.status(500).json({ error: 'Failed to list impacts' });
    }
  })
);

// ============================================================================
// ADD IMPACT ASSESSMENT FOR A CONTROL
// ============================================================================

router.post(
  '/:id/impacts',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      // Verify the change exists and org has access
      const existing = await prisma.regulatoryChangeImpact.findFirst({
        where: { regulatoryChangeId: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        // Also check if the change exists at all
        const change = await prisma.regulatoryChangeDetection.findUnique({
          where: { id: req.params.id },
        });
        if (!change) {
          res.status(404).json({ error: 'Regulatory change not found' });
          return;
        }
      }

      const { controlId, impactLevel, requiredAction } = req.body;

      if (!controlId || !impactLevel || !requiredAction) {
        res.status(400).json({
          error: 'controlId, impactLevel, and requiredAction are required',
        });
        return;
      }

      const validLevels = ['Low', 'Medium', 'High', 'Critical'];
      if (!validLevels.includes(impactLevel)) {
        res.status(400).json({
          error: `impactLevel must be one of: ${validLevels.join(', ')}`,
        });
        return;
      }

      const impact = await prisma.regulatoryChangeImpact.create({
        data: {
          regulatoryChangeId: req.params.id,
          controlId,
          organizationId: orgId,
          impactLevel,
          requiredAction,
          status: 'NEW',
        },
      });

      res.status(201).json({ status: 'success', data: impact });
    } catch (error) {
      logger.error('Error adding impact assessment:', error);
      res.status(500).json({ error: 'Failed to add impact assessment' });
    }
  })
);

// ============================================================================
// UPDATE IMPACT STATUS
// ============================================================================

router.patch(
  '/:id/impacts/:impactId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const impact = await prisma.regulatoryChangeImpact.findFirst({
        where: {
          id: req.params.impactId,
          regulatoryChangeId: req.params.id,
          organizationId: orgId,
        },
      });

      if (!impact) {
        res.status(404).json({ error: 'Impact not found' });
        return;
      }

      const { status, impactLevel, requiredAction } = req.body;
      const updateData: any = {};

      if (status) {
        const validStatuses = ['NEW', 'REVIEWING', 'IN_PROGRESS', 'REG_RESOLVED', 'DISMISSED'];
        if (!validStatuses.includes(status)) {
          res.status(400).json({
            error: `status must be one of: ${validStatuses.join(', ')}`,
          });
          return;
        }
        updateData.status = status;
      }

      if (impactLevel) {
        const validLevels = ['Low', 'Medium', 'High', 'Critical'];
        if (!validLevels.includes(impactLevel)) {
          res.status(400).json({
            error: `impactLevel must be one of: ${validLevels.join(', ')}`,
          });
          return;
        }
        updateData.impactLevel = impactLevel;
      }

      if (requiredAction) {
        updateData.requiredAction = requiredAction;
      }

      const updated = await prisma.regulatoryChangeImpact.update({
        where: { id: req.params.impactId },
        data: updateData,
      });

      res.json({ status: 'success', data: updated });
    } catch (error) {
      logger.error('Error updating impact:', error);
      res.status(500).json({ error: 'Failed to update impact' });
    }
  })
);

export default router;
