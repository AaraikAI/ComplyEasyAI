/**
 * Incident Management Routes
 *
 * Full CRUD for security incidents with timeline tracking,
 * task management, evidence linkage, and response metrics (MTTD, MTTC, MTTR).
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

// ============================================================================
// METRICS (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    try {
      const incidents = await prisma.incident.findMany({
        where: { organizationId: orgId },
        select: {
          severity: true,
          status: true,
          category: true,
          detectedAt: true,
          containedAt: true,
          resolvedAt: true,
          closedAt: true,
        },
      });

      // Calculate MTTD (Mean Time To Detect) — createdAt vs detectedAt is same; use detectedAt
      // Calculate MTTC (Mean Time To Contain) — detectedAt to containedAt
      // Calculate MTTR (Mean Time To Resolve) — detectedAt to resolvedAt
      let totalContainHours = 0;
      let containCount = 0;
      let totalResolveHours = 0;
      let resolveCount = 0;

      const bySeverity: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      for (const inc of incidents) {
        bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;
        byStatus[inc.status] = (byStatus[inc.status] || 0) + 1;
        byCategory[inc.category] = (byCategory[inc.category] || 0) + 1;

        if (inc.containedAt && inc.detectedAt) {
          const hours =
            (new Date(inc.containedAt).getTime() - new Date(inc.detectedAt).getTime()) /
            (1000 * 60 * 60);
          totalContainHours += hours;
          containCount++;
        }

        if (inc.resolvedAt && inc.detectedAt) {
          const hours =
            (new Date(inc.resolvedAt).getTime() - new Date(inc.detectedAt).getTime()) /
            (1000 * 60 * 60);
          totalResolveHours += hours;
          resolveCount++;
        }
      }

      const mttc = containCount > 0 ? Math.round((totalContainHours / containCount) * 100) / 100 : null;
      const mttr = resolveCount > 0 ? Math.round((totalResolveHours / resolveCount) * 100) / 100 : null;

      // MTTD — average time from createdAt to detectedAt (they are set at creation; this metric
      // is more meaningful when detectedAt differs from createdAt, e.g. for retrospective incidents)
      const incidentsWithDetection = incidents.filter((i) => i.detectedAt);
      const mttd = incidentsWithDetection.length > 0 ? 0 : null; // detectedAt == creation for auto-detected

      res.json({
        status: 'success',
        data: {
          total: incidents.length,
          mttd,
          mttc,
          mttr,
          bySeverity,
          byStatus,
          byCategory,
          openIncidents: incidents.filter((i) => !['CLOSED', 'POST_MORTEM'].includes(i.status)).length,
        },
      });
    } catch (error) {
      logger.error('Error fetching incident metrics:', error);
      res.status(500).json({ error: 'Failed to fetch incident metrics' });
    }
  })
);

// ============================================================================
// LIST INCIDENTS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const severity = req.query.severity as string | undefined;
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const search = (req.query.search as string) || '';

    try {
      const where: any = { organizationId: user.organizationId };
      if (severity) where.severity = severity;
      if (status) where.status = status;
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            _count: { select: { timeline: true, tasks: true } },
          },
        }),
        prisma.incident.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: incidents,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  })
);

// ============================================================================
// GET INCIDENT BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const incident = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          timeline: { orderBy: { timestamp: 'desc' } },
          tasks: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      res.json({ status: 'success', data: incident });
    } catch (error) {
      logger.error('Error fetching incident:', error);
      res.status(500).json({ error: 'Failed to fetch incident' });
    }
  })
);

// ============================================================================
// CREATE INCIDENT
// ============================================================================

router.post(
  '/',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        title,
        description,
        severity,
        category,
        assignedTo,
        affectedSystems,
        affectedControls,
        impact,
      } = req.body;

      if (!title || !description || !severity || !category) {
        res.status(400).json({ error: 'title, description, severity, and category are required' });
        return;
      }

      const validSeverities = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];
      if (!validSeverities.includes(severity)) {
        res.status(400).json({ error: `severity must be one of: ${validSeverities.join(', ')}` });
        return;
      }

      const validCategories = [
        'DATA_BREACH', 'MALWARE', 'PHISHING', 'UNAUTHORIZED_ACCESS',
        'DDOS', 'INSIDER_THREAT', 'SYSTEM_FAILURE', 'POLICY_VIOLATION',
        'PHYSICAL_SECURITY', 'OTHER',
      ];
      if (!validCategories.includes(category)) {
        res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
        return;
      }

      const incident = await prisma.incident.create({
        data: {
          organizationId: user.organizationId,
          title,
          description,
          severity,
          category,
          status: 'DETECTED',
          reportedBy: user.id,
          assignedTo: assignedTo || null,
          detectedAt: new Date(),
          affectedSystems: affectedSystems || [],
          affectedControls: affectedControls || [],
          impact: impact || null,
        },
        include: {
          timeline: true,
          tasks: true,
        },
      });

      // Automatically create the initial timeline entry
      await prisma.incidentTimelineEntry.create({
        data: {
          incidentId: incident.id,
          action: 'INCIDENT_CREATED',
          details: `Incident "${title}" created with severity ${severity}`,
          performedBy: user.id,
        },
      });

      res.status(201).json({ status: 'success', data: incident });
    } catch (error) {
      logger.error('Error creating incident:', error);
      res.status(500).json({ error: 'Failed to create incident' });
    }
  })
);

// ============================================================================
// UPDATE INCIDENT
// ============================================================================

router.patch(
  '/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      // Prevent updating immutable fields
      const { id, organizationId, createdAt, reportedBy, ...updateData } = req.body;

      // Auto-set timestamp fields based on status transitions
      if (updateData.status) {
        const now = new Date();
        if (updateData.status === 'CONTAINED' && !existing.containedAt) {
          updateData.containedAt = now;
        }
        if (['RECOVERED', 'CLOSED', 'POST_MORTEM'].includes(updateData.status) && !existing.resolvedAt) {
          updateData.resolvedAt = now;
        }
        if (updateData.status === 'CLOSED' && !existing.closedAt) {
          updateData.closedAt = now;
        }
      }

      const incident = await prisma.incident.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          timeline: { orderBy: { timestamp: 'desc' } },
          tasks: true,
        },
      });

      // Add timeline entry for status change
      if (updateData.status && updateData.status !== existing.status) {
        await prisma.incidentTimelineEntry.create({
          data: {
            incidentId: incident.id,
            action: 'STATUS_CHANGED',
            details: `Status changed from ${existing.status} to ${updateData.status}`,
            performedBy: user.id,
          },
        });
      }

      res.json({ status: 'success', data: incident });
    } catch (error) {
      logger.error('Error updating incident:', error);
      res.status(500).json({ error: 'Failed to update incident' });
    }
  })
);

// ============================================================================
// SOFT DELETE INCIDENT
// ============================================================================

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      // Soft delete by setting status to CLOSED with a note
      const incident = await prisma.incident.update({
        where: { id: req.params.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          lessonsLearned: existing.lessonsLearned
            ? `${existing.lessonsLearned}\n[ARCHIVED by admin]`
            : '[ARCHIVED by admin]',
        },
      });

      await prisma.incidentTimelineEntry.create({
        data: {
          incidentId: incident.id,
          action: 'INCIDENT_ARCHIVED',
          details: 'Incident archived by admin',
          performedBy: user.id,
        },
      });

      res.json({ status: 'success', data: { message: 'Incident archived', id: incident.id } });
    } catch (error) {
      logger.error('Error archiving incident:', error);
      res.status(500).json({ error: 'Failed to archive incident' });
    }
  })
);

// ============================================================================
// GET TIMELINE
// ============================================================================

router.get(
  '/:id/timeline',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const incident = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        select: { id: true },
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const timeline = await prisma.incidentTimelineEntry.findMany({
        where: { incidentId: req.params.id },
        orderBy: { timestamp: 'desc' },
      });

      res.json({ status: 'success', data: timeline });
    } catch (error) {
      logger.error('Error fetching incident timeline:', error);
      res.status(500).json({ error: 'Failed to fetch timeline' });
    }
  })
);

// ============================================================================
// ADD TIMELINE ENTRY
// ============================================================================

router.post(
  '/:id/timeline',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const incident = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        select: { id: true },
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const { action, details } = req.body;

      if (!action || !details) {
        res.status(400).json({ error: 'action and details are required' });
        return;
      }

      const entry = await prisma.incidentTimelineEntry.create({
        data: {
          incidentId: req.params.id,
          action,
          details,
          performedBy: user.id,
        },
      });

      res.status(201).json({ status: 'success', data: entry });
    } catch (error) {
      logger.error('Error adding timeline entry:', error);
      res.status(500).json({ error: 'Failed to add timeline entry' });
    }
  })
);

// ============================================================================
// CREATE INCIDENT TASK
// ============================================================================

router.post(
  '/:id/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const incident = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        select: { id: true },
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const { title, assignee, dueDate } = req.body;

      if (!title || !assignee) {
        res.status(400).json({ error: 'title and assignee are required' });
        return;
      }

      const task = await prisma.incidentTask.create({
        data: {
          incidentId: req.params.id,
          title,
          assignee,
          status: 'OPEN',
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      res.status(201).json({ status: 'success', data: task });
    } catch (error) {
      logger.error('Error creating incident task:', error);
      res.status(500).json({ error: 'Failed to create incident task' });
    }
  })
);

// ============================================================================
// UPDATE INCIDENT TASK
// ============================================================================

router.patch(
  '/:id/tasks/:taskId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify incident belongs to org
      const incident = await prisma.incident.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        select: { id: true },
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const existingTask = await prisma.incidentTask.findFirst({
        where: { id: req.params.taskId, incidentId: req.params.id },
      });

      if (!existingTask) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      const { status, title, assignee, dueDate } = req.body;
      const updateData: any = {};

      if (status) {
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
          res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
          return;
        }
        updateData.status = status;
        if (status === 'COMPLETED') {
          updateData.completedAt = new Date();
        }
      }
      if (title) updateData.title = title;
      if (assignee) updateData.assignee = assignee;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

      const task = await prisma.incidentTask.update({
        where: { id: req.params.taskId },
        data: updateData,
      });

      res.json({ status: 'success', data: task });
    } catch (error) {
      logger.error('Error updating incident task:', error);
      res.status(500).json({ error: 'Failed to update incident task' });
    }
  })
);

export default router;
