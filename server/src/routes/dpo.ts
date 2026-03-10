/**
 * DPO (Data Protection Officer) Designation Routes — GDPR Art. 37-39
 *
 * Endpoints for managing DPO profiles, tasks, activity logs,
 * and generating compliance reports.
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
// GET DPO PROFILE
// ============================================================================

router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      res.json(profile);
    } catch (error) {
      logger.error('Error fetching DPO profile:', error);
      res.status(500).json({ error: 'Failed to fetch DPO profile' });
    }
  })
);

// ============================================================================
// DESIGNATE DPO (CREATE PROFILE)
// ============================================================================

router.post(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const { name, email, phone, certifications, appointmentDate, registeredWithDPA, dpaRegistrationRef } =
        req.body;

      if (!name || !email) {
        res.status(400).json({ error: 'name and email are required' });
        return;
      }

      // Check if profile already exists (unique constraint on organizationId)
      const existing = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (existing) {
        res.status(409).json({ error: 'DPO profile already exists for this organization. Use PATCH to update.' });
        return;
      }

      const profile = await prisma.dPOProfile.create({
        data: {
          organizationId: user.organizationId,
          name,
          email,
          phone: phone || null,
          certifications: certifications || [],
          appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(),
          registeredWithDPA: registeredWithDPA || false,
          dpaRegistrationRef: dpaRegistrationRef || null,
          tasks: [],
          activityLog: [],
        },
      });

      res.status(201).json(profile);
    } catch (error) {
      logger.error('Error creating DPO profile:', error);
      res.status(500).json({ error: 'Failed to create DPO profile' });
    }
  })
);

// ============================================================================
// UPDATE DPO PROFILE
// ============================================================================

router.patch(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const { id, organizationId, createdAt, tasks, activityLog, ...updateData } = req.body;

      // Handle appointmentDate conversion
      if (updateData.appointmentDate) {
        updateData.appointmentDate = new Date(updateData.appointmentDate);
      }

      const profile = await prisma.dPOProfile.update({
        where: { organizationId: user.organizationId },
        data: updateData,
      });

      res.json(profile);
    } catch (error) {
      logger.error('Error updating DPO profile:', error);
      res.status(500).json({ error: 'Failed to update DPO profile' });
    }
  })
);

// ============================================================================
// REMOVE DPO DESIGNATION (Admin only)
// ============================================================================

router.delete(
  '/profile',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const { reason } = req.body;

      // Log the removal reason before deleting
      logger.info('DPO designation removed', {
        organizationId: user.organizationId,
        removedBy: user.id,
        previousDPO: existing.name,
        reason: reason || 'No reason provided',
      });

      await prisma.dPOProfile.delete({
        where: { organizationId: user.organizationId },
      });

      res.json({
        message: 'DPO designation removed',
        removedBy: user.id,
        reason: reason || 'No reason provided',
      });
    } catch (error) {
      logger.error('Error removing DPO profile:', error);
      res.status(500).json({ error: 'Failed to remove DPO profile' });
    }
  })
);

// ============================================================================
// GET DPO TASKS
// ============================================================================

router.get(
  '/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
        select: { tasks: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const tasks = (profile.tasks as any[]) || [];
      res.json({ tasks, total: tasks.length });
    } catch (error) {
      logger.error('Error fetching DPO tasks:', error);
      res.status(500).json({ error: 'Failed to fetch DPO tasks' });
    }
  })
);

// ============================================================================
// ADD TASK TO DPO TASK LIST
// ============================================================================

router.post(
  '/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
        select: { tasks: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const { title, description, dueDate, priority, status } = req.body;

      if (!title) {
        res.status(400).json({ error: 'title is required' });
        return;
      }

      const tasks = (profile.tasks as any[]) || [];
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        title,
        description: description || '',
        dueDate: dueDate || null,
        priority: priority || 'Medium',
        status: status || 'Open',
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      };

      tasks.push(newTask);

      await prisma.dPOProfile.update({
        where: { organizationId: user.organizationId },
        data: { tasks },
      });

      res.status(201).json(newTask);
    } catch (error) {
      logger.error('Error adding DPO task:', error);
      res.status(500).json({ error: 'Failed to add DPO task' });
    }
  })
);

// ============================================================================
// UPDATE TASK AT INDEX
// ============================================================================

router.patch(
  '/tasks/:index',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const index = parseInt(req.params.index, 10);

    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
        select: { tasks: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const tasks = (profile.tasks as any[]) || [];

      if (isNaN(index) || index < 0 || index >= tasks.length) {
        res.status(404).json({ error: `Task at index ${index} not found` });
        return;
      }

      const { title, description, dueDate, priority, status } = req.body;

      if (title !== undefined) tasks[index].title = title;
      if (description !== undefined) tasks[index].description = description;
      if (dueDate !== undefined) tasks[index].dueDate = dueDate;
      if (priority !== undefined) tasks[index].priority = priority;
      if (status !== undefined) {
        tasks[index].status = status;
        if (status === 'Completed') {
          tasks[index].completedAt = new Date().toISOString();
        }
      }
      tasks[index].updatedAt = new Date().toISOString();

      await prisma.dPOProfile.update({
        where: { organizationId: user.organizationId },
        data: { tasks },
      });

      res.json(tasks[index]);
    } catch (error) {
      logger.error('Error updating DPO task:', error);
      res.status(500).json({ error: 'Failed to update DPO task' });
    }
  })
);

// ============================================================================
// DELETE TASK AT INDEX
// ============================================================================

router.delete(
  '/tasks/:index',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const index = parseInt(req.params.index, 10);

    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
        select: { tasks: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const tasks = (profile.tasks as any[]) || [];

      if (isNaN(index) || index < 0 || index >= tasks.length) {
        res.status(404).json({ error: `Task at index ${index} not found` });
        return;
      }

      const removed = tasks.splice(index, 1)[0];

      await prisma.dPOProfile.update({
        where: { organizationId: user.organizationId },
        data: { tasks },
      });

      res.json({ message: 'Task removed', task: removed });
    } catch (error) {
      logger.error('Error deleting DPO task:', error);
      res.status(500).json({ error: 'Failed to delete DPO task' });
    }
  })
);

// ============================================================================
// GET DPO ACTIVITY LOG
// ============================================================================

router.get(
  '/activity-log',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { page, limit } = paginate(req.query);

    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
        select: { activityLog: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const allEntries = (profile.activityLog as any[]) || [];
      // Sort newest first
      allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const total = allEntries.length;
      const skip = (page - 1) * limit;
      const entries = allEntries.slice(skip, skip + limit);

      res.json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      logger.error('Error fetching DPO activity log:', error);
      res.status(500).json({ error: 'Failed to fetch DPO activity log' });
    }
  })
);

// ============================================================================
// RECORD DPO ACTIVITY
// ============================================================================

router.post(
  '/activity-log',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
        select: { activityLog: true },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const { action, description, relatedEntity } = req.body;

      if (!action) {
        res.status(400).json({ error: 'action is required' });
        return;
      }

      const activityLog = (profile.activityLog as any[]) || [];
      const newEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action,
        description: description || '',
        relatedEntity: relatedEntity || null,
        timestamp: new Date().toISOString(),
        recordedBy: user.id,
      };

      activityLog.push(newEntry);

      await prisma.dPOProfile.update({
        where: { organizationId: user.organizationId },
        data: { activityLog },
      });

      res.status(201).json(newEntry);
    } catch (error) {
      logger.error('Error recording DPO activity:', error);
      res.status(500).json({ error: 'Failed to record DPO activity' });
    }
  })
);

// ============================================================================
// DPO COMPLIANCE REPORT
// ============================================================================

router.get(
  '/compliance-report',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const profile = await prisma.dPOProfile.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!profile) {
        res.status(404).json({ error: 'No DPO profile found for this organization' });
        return;
      }

      const tasks = (profile.tasks as any[]) || [];
      const activityLog = (profile.activityLog as any[]) || [];
      const now = new Date();

      // Profile completeness
      const requiredFields = ['name', 'email', 'certifications', 'appointmentDate'];
      const completedFields = requiredFields.filter((f) => {
        const val = (profile as any)[f];
        if (Array.isArray(val)) return val.length > 0;
        return val !== null && val !== undefined && val !== '';
      });
      const profileCompleteness = Math.round((completedFields.length / requiredFields.length) * 100);

      // Task analysis
      const activeTasks = tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
      const overdueTasks = activeTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now
      );
      const completedTasks = tasks.filter((t) => t.status === 'Completed');

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = activityLog.filter(
        (a) => new Date(a.timestamp) >= thirtyDaysAgo
      );

      res.json({
        reportDate: now.toISOString(),
        profile: {
          name: profile.name,
          email: profile.email,
          appointmentDate: profile.appointmentDate,
          completeness: profileCompleteness,
          missingFields: requiredFields.filter((f) => !completedFields.includes(f)),
        },
        dpaRegistration: {
          registered: profile.registeredWithDPA,
          reference: profile.dpaRegistrationRef,
        },
        tasks: {
          total: tasks.length,
          active: activeTasks.length,
          overdue: overdueTasks.length,
          completed: completedTasks.length,
          overdueDetails: overdueTasks.map((t) => ({
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority,
          })),
        },
        activity: {
          totalLogged: activityLog.length,
          last30Days: recentActivity.length,
          recentEntries: recentActivity.slice(0, 10),
        },
        certifications: profile.certifications,
      });
    } catch (error) {
      logger.error('Error generating DPO compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  })
);

export default router;
