/**
 * Compliance Calendar Routes
 *
 * Manage compliance deadlines with filtering, upcoming/overdue views,
 * completion tracking, and date-range queries.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createDeadlineSchema, updateDeadlineSchema } from '../validators/coreModulesSchemas';
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
// UPCOMING DEADLINES (before /deadlines/:id to avoid conflicts)
// ============================================================================

router.get(
  '/upcoming',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const days = Math.max(1, Math.min(365, parseInt(req.query.days as string, 10) || 30));

    try {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);

      const deadlines = await prisma.complianceDeadline.findMany({
        where: {
          organizationId: user.organizationId,
          dueDate: {
            gte: now,
            lte: futureDate,
          },
          status: { not: 'COMPLETED' },
        },
        orderBy: { dueDate: 'asc' },
      });

      res.json({
        status: 'success',
        data: deadlines,
        meta: {
          total: deadlines.length,
          withinDays: days,
        },
      });
    } catch (error) {
      logger.error('Error fetching upcoming deadlines:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
    }
  })
);

// ============================================================================
// OVERDUE DEADLINES
// ============================================================================

router.get(
  '/overdue',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const now = new Date();

      const deadlines = await prisma.complianceDeadline.findMany({
        where: {
          organizationId: user.organizationId,
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        orderBy: { dueDate: 'asc' },
      });

      res.json({
        status: 'success',
        data: deadlines,
        meta: { total: deadlines.length },
      });
    } catch (error) {
      logger.error('Error fetching overdue deadlines:', error);
      res.status(500).json({ error: 'Failed to fetch overdue deadlines' });
    }
  })
);

// ============================================================================
// LIST DEADLINES
// ============================================================================

router.get(
  '/deadlines',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const search = (req.query.search as string) || '';

    try {
      const where: any = { organizationId: user.organizationId };
      if (type) where.type = type;
      if (status) where.status = status;
      if (from || to) {
        where.dueDate = {};
        if (from) where.dueDate.gte = new Date(from);
        if (to) where.dueDate.lte = new Date(to);
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [deadlines, total] = await Promise.all([
        prisma.complianceDeadline.findMany({
          where,
          orderBy: { dueDate: 'asc' },
          skip,
          take,
        }),
        prisma.complianceDeadline.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: deadlines,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching deadlines:', error);
      res.status(500).json({ error: 'Failed to fetch deadlines' });
    }
  })
);

// ============================================================================
// GET DEADLINE BY ID
// ============================================================================

router.get(
  '/deadlines/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const deadline = await prisma.complianceDeadline.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!deadline) {
        res.status(404).json({ error: 'Deadline not found' });
        return;
      }

      res.json({ status: 'success', data: deadline });
    } catch (error) {
      logger.error('Error fetching deadline:', error);
      res.status(500).json({ error: 'Failed to fetch deadline' });
    }
  })
);

// ============================================================================
// CREATE DEADLINE
// ============================================================================

router.post(
  '/deadlines',
  authorize('admin', 'editor'),
  validateBody(createDeadlineSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        title,
        description,
        type,
        dueDate,
        frameworkId,
        controlId,
        assignedTo,
        reminderDays,
        recurrence,
      } = req.body;

      // Joi schema validates required fields, type enum, and date format
      const parsedDueDate = new Date(dueDate);

      // Determine initial status based on due date
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      let initialStatus: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED' = 'UPCOMING';
      if (parsedDueDate < now) {
        initialStatus = 'OVERDUE';
      } else if (parsedDueDate <= sevenDaysFromNow) {
        initialStatus = 'DUE_SOON';
      }

      const deadline = await prisma.complianceDeadline.create({
        data: {
          organizationId: user.organizationId,
          title,
          description: description || null,
          type,
          dueDate: parsedDueDate,
          frameworkId: frameworkId || null,
          controlId: controlId || null,
          assignedTo: assignedTo || null,
          status: initialStatus,
          reminderDays: reminderDays || [30, 14, 7, 1],
          recurrence: recurrence || null,
        },
      });

      res.status(201).json({ status: 'success', data: deadline });
    } catch (error) {
      logger.error('Error creating deadline:', error);
      res.status(500).json({ error: 'Failed to create deadline' });
    }
  })
);

// ============================================================================
// UPDATE DEADLINE
// ============================================================================

router.patch(
  '/deadlines/:id',
  authorize('admin', 'editor'),
  validateBody(updateDeadlineSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.complianceDeadline.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Deadline not found' });
        return;
      }

      // Joi schema validates type/status enums and date formats; stripUnknown removes extra fields
      const updateData: Record<string, any> = { ...req.body };

      // Convert date strings (Joi validates format but Prisma needs Date objects)
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      if (updateData.completedAt) updateData.completedAt = new Date(updateData.completedAt);

      const deadline = await prisma.complianceDeadline.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: deadline });
    } catch (error) {
      logger.error('Error updating deadline:', error);
      res.status(500).json({ error: 'Failed to update deadline' });
    }
  })
);

// ============================================================================
// MARK DEADLINE AS COMPLETED
// ============================================================================

router.patch(
  '/deadlines/:id/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.complianceDeadline.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Deadline not found' });
        return;
      }

      if (existing.status === 'COMPLETED') {
        res.status(400).json({ error: 'Deadline is already completed' });
        return;
      }

      const deadline = await prisma.complianceDeadline.update({
        where: { id: req.params.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      res.json({ status: 'success', data: deadline });
    } catch (error) {
      logger.error('Error completing deadline:', error);
      res.status(500).json({ error: 'Failed to complete deadline' });
    }
  })
);

// ============================================================================
// DELETE DEADLINE
// ============================================================================

router.delete(
  '/deadlines/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.complianceDeadline.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Deadline not found' });
        return;
      }

      const deadline = await prisma.complianceDeadline.update({
        where: { id: req.params.id },
        data: { status: 'CANCELLED' },
      });

      res.json({ status: 'success', data: { message: 'Deadline cancelled', id: deadline.id } });
    } catch (error) {
      logger.error('Error deleting deadline:', error);
      res.status(500).json({ error: 'Failed to delete deadline' });
    }
  })
);

export default router;
