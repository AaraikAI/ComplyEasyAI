/**
 * Exception Management Routes
 *
 * CRUD and lifecycle management for compliance exceptions including
 * approval workflows, expiry tracking, and statistics.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createExceptionSchema, updateExceptionSchema } from '../validators/coreModulesSchemas';
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
// GET /expiring — Exceptions expiring within N days (before /:id)
// ============================================================================

router.get(
  '/expiring',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const days = Math.max(1, parseInt(req.query.days as string, 10) || 30);

    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      const exceptions = await prisma.complianceException.findMany({
        where: {
          organizationId: orgId,
          status: 'APPROVED',
          expiryDate: {
            gte: now,
            lte: cutoff,
          },
        },
        orderBy: { expiryDate: 'asc' },
      });

      res.json({
        status: 'success',
        data: {
          exceptions,
          total: exceptions.length,
          windowDays: days,
        },
      });
    } catch (error) {
      logger.error('Error fetching expiring exceptions:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch expiring exceptions' });
    }
  })
);

// ============================================================================
// GET /stats — Exception metrics
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      const all = await prisma.complianceException.findMany({
        where: { organizationId: orgId },
        select: { status: true, controlId: true, createdAt: true },
      });

      const total = all.length;

      const byStatus: Record<string, number> = {};
      const byControl: Record<string, number> = {};
      for (const e of all) {
        byStatus[e.status] = (byStatus[e.status] || 0) + 1;
        byControl[e.controlId] = (byControl[e.controlId] || 0) + 1;
      }

      // Count currently expired (status APPROVED but past expiry)
      const now = new Date();
      const expiredCount = await prisma.complianceException.count({
        where: {
          organizationId: orgId,
          status: 'APPROVED',
          expiryDate: { lt: now },
        },
      });

      res.json({
        status: 'success',
        data: {
          total,
          byStatus,
          byControl,
          currentlyExpired: expiredCount,
        },
      });
    } catch (error) {
      logger.error('Error fetching exception stats:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch exception statistics' });
    }
  })
);

// ============================================================================
// GET / — List exceptions (filterable by status, framework)
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const status = req.query.status as string | undefined;
    const controlId = req.query.controlId as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status;
      if (controlId) where.controlId = controlId;

      // Auto-expire: mark approved exceptions past expiry date
      const now = new Date();
      await prisma.complianceException.updateMany({
        where: {
          organizationId: user.organizationId,
          status: 'APPROVED',
          expiryDate: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      const [exceptions, total] = await Promise.all([
        prisma.complianceException.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.complianceException.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          exceptions,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching exceptions:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch exceptions' });
    }
  })
);

// ============================================================================
// GET /:id — Get exception details
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const exception = await prisma.complianceException.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!exception) {
        res.status(404).json({ status: 'error', message: 'Exception not found' });
        return;
      }

      res.json({ status: 'success', data: exception });
    } catch (error) {
      logger.error('Error fetching exception:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch exception' });
    }
  })
);

// ============================================================================
// POST / — Create exception request
// ============================================================================

router.post(
  '/',
  validateBody(createExceptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const {
        controlId,
        title,
        justification,
        riskAcceptance,
        compensatingControls,
        expiryDate,
        reviewDate,
      } = req.body;

      if (!controlId || !title || !justification || !riskAcceptance || !expiryDate || !reviewDate) {
        res.status(400).json({
          status: 'error',
          message: 'controlId, title, justification, riskAcceptance, expiryDate, and reviewDate are required',
        });
        return;
      }

      const exception = await prisma.complianceException.create({
        data: {
          organizationId: user.organizationId,
          controlId,
          title,
          justification,
          riskAcceptance,
          compensatingControls: compensatingControls || null,
          requestedBy: user.id,
          expiryDate: new Date(expiryDate),
          reviewDate: new Date(reviewDate),
          status: 'REQUESTED',
        },
      });

      res.status(201).json({ status: 'success', data: exception });
    } catch (error) {
      logger.error('Error creating exception:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create exception' });
    }
  })
);

// ============================================================================
// PATCH /:id — Update exception
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateExceptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.complianceException.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Exception not found' });
        return;
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'controlId', 'title', 'justification', 'riskAcceptance', 'compensatingControls',
        'status', 'expiryDate', 'reviewDate',
      ]);

      // Convert date strings to Date objects if provided
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
      if (updateData.reviewDate) updateData.reviewDate = new Date(updateData.reviewDate);

      const exception = await prisma.complianceException.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: exception });
    } catch (error) {
      logger.error('Error updating exception:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update exception' });
    }
  })
);

// ============================================================================
// PATCH /:id/approve — Approve exception (admin only)
// ============================================================================

router.patch(
  '/:id/approve',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.complianceException.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Exception not found' });
        return;
      }

      if (existing.status !== 'REQUESTED') {
        res.status(400).json({
          status: 'error',
          message: `Cannot approve exception with status "${existing.status}". Only REQUESTED exceptions can be approved.`,
        });
        return;
      }

      const exception = await prisma.complianceException.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
          approvedBy: user.id,
        },
      });

      res.json({ status: 'success', data: exception });
    } catch (error) {
      logger.error('Error approving exception:', error);
      res.status(500).json({ status: 'error', message: 'Failed to approve exception' });
    }
  })
);

// ============================================================================
// PATCH /:id/reject — Reject exception (admin only)
// ============================================================================

router.patch(
  '/:id/reject',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.complianceException.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Exception not found' });
        return;
      }

      if (existing.status !== 'REQUESTED') {
        res.status(400).json({
          status: 'error',
          message: `Cannot reject exception with status "${existing.status}". Only REQUESTED exceptions can be rejected.`,
        });
        return;
      }

      const exception = await prisma.complianceException.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED' },
      });

      res.json({ status: 'success', data: exception });
    } catch (error) {
      logger.error('Error rejecting exception:', error);
      res.status(500).json({ status: 'error', message: 'Failed to reject exception' });
    }
  })
);

export default router;
