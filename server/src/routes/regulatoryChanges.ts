/**
 * Regulatory Change Detection Routes
 *
 * Endpoints for tracking regulatory changes, impact assessments,
 * and maintaining compliance with evolving regulations.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  createRegulatoryChangeSchema,
  updateRegulatoryChangeSchema,
  createImpactAssessmentSchema,
  updateImpactSchema,
} from '../validators/regulatoryChangeSchemas';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

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
      if (error instanceof AppError) throw error;
      logger.error('Error fetching regulatory change stats:', error);
      throw new AppError('Failed to fetch regulatory change stats', 500);
    }
  })
);

// ============================================================================
// DASHBOARD: aggregated regulatory-change view consumed by the
// RegulatoryAutoRemediation component. Returns recent changes, derived
// remediation tasks (from Issue), impact items, and audit-log events.
// ============================================================================

router.get(
  '/dashboard/changes',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const detections = await prisma.regulatoryChangeDetection.findMany({
        where: { impacts: { some: { organizationId: orgId } } },
        orderBy: { detectedAt: 'desc' },
        take: 100,
        include: {
          impacts: { where: { organizationId: orgId } },
          _count: { select: { impacts: true } },
        },
      });

      // Map detected changes to the UI shape
      const changes = detections.map((d) => {
        // Severity inferred from impact levels (Critical > High > Medium > Low)
        const sevRank: Record<string, number> = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        let topSev = 'Medium';
        for (const imp of d.impacts) {
          if ((sevRank[imp.impactLevel] || 0) > (sevRank[topSev] || 0)) {
            topSev = imp.impactLevel;
          }
        }
        const severity = topSev.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';

        // Status mapping
        const statusMap: Record<string, string> = {
          NEW: 'pending',
          REVIEWING: 'in-review',
          IN_PROGRESS: 'remediation',
          REG_RESOLVED: 'completed',
          DISMISSED: 'dismissed',
        };

        return {
          id: d.id,
          title: d.title,
          source: d.regulationName,
          publishDate: d.detectedAt.toISOString(),
          effectiveDate: d.effectiveDate ? d.effectiveDate.toISOString() : d.detectedAt.toISOString(),
          jurisdiction: 'Global',
          category: d.changeType,
          severity,
          status: statusMap[d.status] || 'pending',
          summary: d.summary,
          affectedFrameworks: [] as string[],
          affectedControls: d.impacts.length,
          affectedPolicies: 0,
          affectedProcedures: 0,
          complianceImpact: { before: 80, after: Math.max(40, 80 - d.impacts.length * 2) },
          rifScore: Math.min(99, 50 + d.impacts.length * 5),
        };
      });

      res.json({ status: 'success', data: { changes } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching regulatory changes dashboard:', error);
      throw new AppError('Failed to fetch regulatory changes', 500);
    }
  })
);

router.get(
  '/dashboard/remediation-tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      // Issues tagged as regulatory remediation
      const issues = await prisma.issue.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { issueType: 'regulatory_remediation' },
            { category: 'Regulatory' },
            { category: { contains: 'regulatory', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { assignedTo: { select: { name: true } } },
      });

      const priorityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
        Critical: 'critical',
        High: 'high',
        Medium: 'medium',
        Low: 'low',
      };
      const statusMap: Record<string, 'pending' | 'in-progress' | 'review' | 'completed'> = {
        Open: 'pending',
        In_Progress: 'in-progress',
        InProgress: 'in-progress',
        Review: 'review',
        Resolved: 'completed',
        Closed: 'completed',
      };

      const tasks = issues.map((i) => ({
        id: i.id,
        changeId: (i.tags as any)?.regulatoryChangeId || '',
        changeName: (i.tags as any)?.changeName || i.category || 'Regulatory Change',
        title: i.title,
        description: i.description,
        type: 'control-update' as const,
        priority: priorityMap[i.priority] || 'medium',
        status: statusMap[i.status] || 'pending',
        assignee: i.assignedTo?.name || 'Unassigned',
        dueDate: i.dueDate ? i.dueDate.toISOString() : '',
        estimatedEffort: ((i.tags as any)?.estimatedEffort as string) || 'TBD',
        affectedItem: ((i.tags as any)?.affectedItem as string) || i.title,
        aiGenerated: !!(i.tags as any)?.aiGenerated,
        completedDate: i.resolvedDate ? i.resolvedDate.toISOString() : undefined,
      }));

      res.json({ status: 'success', data: { tasks } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching remediation tasks:', error);
      throw new AppError('Failed to fetch remediation tasks', 500);
    }
  })
);

router.get(
  '/dashboard/impact-items',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const impacts = await prisma.regulatoryChangeImpact.findMany({
        where: { organizationId: orgId },
        take: 200,
        orderBy: { impactLevel: 'asc' },
        include: {
          regulatoryChange: { select: { regulationName: true, title: true } },
        },
      });

      const items = impacts.map((imp) => ({
        id: imp.id,
        name: imp.controlId,
        type: 'control' as const,
        framework: imp.regulatoryChange?.regulationName || 'Unknown',
        currentStatus: imp.status === 'REG_RESOLVED' ? 'Implemented' : 'Pending',
        impactLevel:
          imp.impactLevel === 'High' || imp.impactLevel === 'Critical'
            ? ('direct' as const)
            : imp.impactLevel === 'Medium'
              ? ('indirect' as const)
              : ('minimal' as const),
        requiredAction: imp.requiredAction,
      }));

      res.json({ status: 'success', data: { items } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching impact items:', error);
      throw new AppError('Failed to fetch impact items', 500);
    }
  })
);

router.get(
  '/dashboard/audit-log',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const sinceParam = req.query.since as string | undefined;
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId: orgId,
          timestamp: { gte: since },
          OR: [
            { resourceType: 'RegulatoryChange' },
            { resourceType: 'RegulatoryChangeImpact' },
            { action: { contains: 'regulatory', mode: 'insensitive' } },
          ],
        },
        orderBy: { timestamp: 'desc' },
        take: 200,
        include: { user: { select: { name: true } } },
      });

      const entries = logs.map((l) => {
        let type: 'detection' | 'analysis' | 'remediation' | 'notification' | 'completion' = 'analysis';
        const a = l.action.toLowerCase();
        if (a.includes('detect')) type = 'detection';
        else if (a.includes('remediat')) type = 'remediation';
        else if (a.includes('notif')) type = 'notification';
        else if (a.includes('complet') || a.includes('resolved')) type = 'completion';

        return {
          id: l.id,
          timestamp: l.timestamp.toISOString(),
          action: l.action,
          actor: l.user?.name || 'System',
          details: l.details || '',
          changeId: l.resourceId || '',
          type,
        };
      });

      res.json({ status: 'success', data: { entries } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching regulatory audit log:', error);
      throw new AppError('Failed to fetch audit log', 500);
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
      if (error instanceof AppError) throw error;
      logger.error('Error listing regulatory changes:', error);
      throw new AppError('Failed to list regulatory changes', 500);
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
        throw new AppError('Regulatory change not found', 404);
      }

      // Verify org has access (has at least one impact record)
      if (change.impacts.length === 0) {
        throw new AppError('Regulatory change not found', 404);
      }

      res.json({ status: 'success', data: change });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching regulatory change:', error);
      throw new AppError('Failed to fetch regulatory change', 500);
    }
  })
);

// ============================================================================
// CREATE REGULATORY CHANGE
// ============================================================================

router.post(
  '/',
  validateBody(createRegulatoryChangeSchema),
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
        throw new AppError('regulationName, changeType, title, and summary are required', 400);
      }

      const validChangeTypes = ['NEW_REGULATION', 'AMENDMENT', 'GUIDANCE', 'ENFORCEMENT', 'REPEAL'];
      if (!validChangeTypes.includes(changeType)) {
        throw new AppError(`changeType must be one of: ${validChangeTypes.join(', ')}`, 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error creating regulatory change:', error);
      throw new AppError('Failed to create regulatory change', 500);
    }
  })
);

// ============================================================================
// UPDATE REGULATORY CHANGE
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateRegulatoryChangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      // Verify org has access
      const existing = await prisma.regulatoryChangeImpact.findFirst({
        where: { regulatoryChangeId: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Regulatory change not found', 404);
      }

      const { status, impactAnalysis, title, summary, sourceUrl, effectiveDate } = req.body;

      const updateData: any = {};
      if (status) {
        const validStatuses = ['NEW', 'REVIEWING', 'IN_PROGRESS', 'REG_RESOLVED', 'DISMISSED'];
        if (!validStatuses.includes(status)) {
          throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error updating regulatory change:', error);
      throw new AppError('Failed to update regulatory change', 500);
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
        throw new AppError('Regulatory change not found', 404);
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
      if (error instanceof AppError) throw error;
      logger.error('Error dismissing regulatory change:', error);
      throw new AppError('Failed to dismiss regulatory change', 500);
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
      if (error instanceof AppError) throw error;
      logger.error('Error listing impacts:', error);
      throw new AppError('Failed to list impacts', 500);
    }
  })
);

// ============================================================================
// ADD IMPACT ASSESSMENT FOR A CONTROL
// ============================================================================

router.post(
  '/:id/impacts',
  validateBody(createImpactAssessmentSchema),
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
          throw new AppError('Regulatory change not found', 404);
        }
      }

      const { controlId, impactLevel, requiredAction } = req.body;

      if (!controlId || !impactLevel || !requiredAction) {
        throw new AppError('controlId, impactLevel, and requiredAction are required', 400);
      }

      const validLevels = ['Low', 'Medium', 'High', 'Critical'];
      if (!validLevels.includes(impactLevel)) {
        throw new AppError(`impactLevel must be one of: ${validLevels.join(', ')}`, 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error adding impact assessment:', error);
      throw new AppError('Failed to add impact assessment', 500);
    }
  })
);

// ============================================================================
// UPDATE IMPACT STATUS
// ============================================================================

router.patch(
  '/:id/impacts/:impactId',
  validateBody(updateImpactSchema),
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
        throw new AppError('Impact not found', 404);
      }

      const { status, impactLevel, requiredAction } = req.body;
      const updateData: any = {};

      if (status) {
        const validStatuses = ['NEW', 'REVIEWING', 'IN_PROGRESS', 'REG_RESOLVED', 'DISMISSED'];
        if (!validStatuses.includes(status)) {
          throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
        }
        updateData.status = status;
      }

      if (impactLevel) {
        const validLevels = ['Low', 'Medium', 'High', 'Critical'];
        if (!validLevels.includes(impactLevel)) {
          throw new AppError(`impactLevel must be one of: ${validLevels.join(', ')}`, 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error updating impact:', error);
      throw new AppError('Failed to update impact', 500);
    }
  })
);

export default router;
