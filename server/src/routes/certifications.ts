/**
 * Certification Lifecycle Routes
 *
 * CRUD and lifecycle management for compliance certifications including
 * surveillance audit scheduling, expiry tracking, and status management.
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
// GET /expiring — Certifications expiring within N days (before /:id)
// ============================================================================

router.get(
  '/expiring',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const days = Math.max(1, parseInt(req.query.days as string, 10) || 90);

    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      const certifications = await prisma.certification.findMany({
        where: {
          organizationId: orgId,
          status: { in: ['CERT_ACTIVE', 'EXPIRING_SOON'] },
          expiryDate: {
            gte: now,
            lte: cutoff,
          },
        },
        include: {
          surveillanceAudits: {
            orderBy: { scheduledDate: 'asc' },
          },
        },
        orderBy: { expiryDate: 'asc' },
      });

      res.json({
        status: 'success',
        data: {
          certifications,
          total: certifications.length,
          windowDays: days,
        },
      });
    } catch (error) {
      logger.error('Error fetching expiring certifications:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch expiring certifications' });
    }
  })
);

// ============================================================================
// GET / — List certifications (filterable by status, framework)
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const status = req.query.status as string | undefined;
    const frameworkId = req.query.frameworkId as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status;
      if (frameworkId) where.frameworkId = frameworkId;

      // Auto-update: mark active certifications past expiry as CERT_EXPIRED
      const now = new Date();
      await prisma.certification.updateMany({
        where: {
          organizationId: user.organizationId,
          status: { in: ['CERT_ACTIVE', 'EXPIRING_SOON'] },
          expiryDate: { lt: now },
        },
        data: { status: 'CERT_EXPIRED' },
      });

      // Auto-update: mark certifications expiring within 90 days as EXPIRING_SOON
      const soonCutoff = new Date();
      soonCutoff.setDate(soonCutoff.getDate() + 90);
      await prisma.certification.updateMany({
        where: {
          organizationId: user.organizationId,
          status: 'CERT_ACTIVE',
          expiryDate: {
            gte: now,
            lte: soonCutoff,
          },
        },
        data: { status: 'EXPIRING_SOON' },
      });

      const [certifications, total] = await Promise.all([
        prisma.certification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            surveillanceAudits: {
              orderBy: { scheduledDate: 'asc' },
            },
          },
        }),
        prisma.certification.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          certifications,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching certifications:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch certifications' });
    }
  })
);

// ============================================================================
// GET /:id — Get certification with surveillance audits
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const certification = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          surveillanceAudits: {
            orderBy: { scheduledDate: 'asc' },
          },
        },
      });

      if (!certification) {
        res.status(404).json({ status: 'error', message: 'Certification not found' });
        return;
      }

      res.json({ status: 'success', data: certification });
    } catch (error) {
      logger.error('Error fetching certification:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch certification' });
    }
  })
);

// ============================================================================
// POST / — Create certification
// ============================================================================

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const {
        frameworkId,
        name,
        certBody,
        certNumber,
        issueDate,
        expiryDate,
        scope,
        documents,
      } = req.body;

      if (!name || !certBody || !issueDate || !expiryDate) {
        res.status(400).json({
          status: 'error',
          message: 'name, certBody, issueDate, and expiryDate are required',
        });
        return;
      }

      const certification = await prisma.certification.create({
        data: {
          organizationId: user.organizationId,
          frameworkId: frameworkId || null,
          name,
          certBody,
          certNumber: certNumber || null,
          issueDate: new Date(issueDate),
          expiryDate: new Date(expiryDate),
          status: 'CERT_ACTIVE',
          scope: scope || null,
          documents: documents || [],
        },
      });

      res.status(201).json({ status: 'success', data: certification });
    } catch (error) {
      logger.error('Error creating certification:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create certification' });
    }
  })
);

// ============================================================================
// PATCH /:id — Update certification
// ============================================================================

router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Certification not found' });
        return;
      }

      const { id, organizationId, createdAt, surveillanceAudits, ...updateData } = req.body;

      if (updateData.issueDate) updateData.issueDate = new Date(updateData.issueDate);
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

      const certification = await prisma.certification.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: certification });
    } catch (error) {
      logger.error('Error updating certification:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update certification' });
    }
  })
);

// ============================================================================
// DELETE /:id — Delete certification
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ status: 'error', message: 'Certification not found' });
        return;
      }

      // Cascade deletes associated CertAudit records via Prisma schema onDelete: Cascade
      await prisma.certification.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Certification deleted', id: req.params.id } });
    } catch (error) {
      logger.error('Error deleting certification:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete certification' });
    }
  })
);

// ============================================================================
// POST /:id/audits — Schedule surveillance audit
// ============================================================================

router.post(
  '/:id/audits',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const certification = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!certification) {
        res.status(404).json({ status: 'error', message: 'Certification not found' });
        return;
      }

      const { type, scheduledDate, auditorName } = req.body;

      if (!type || !scheduledDate) {
        res.status(400).json({
          status: 'error',
          message: 'type and scheduledDate are required',
        });
        return;
      }

      const validTypes = ['INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          status: 'error',
          message: `type must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }

      const audit = await prisma.certAudit.create({
        data: {
          certificationId: certification.id,
          type,
          scheduledDate: new Date(scheduledDate),
          auditorName: auditorName || null,
        },
      });

      res.status(201).json({ status: 'success', data: audit });
    } catch (error) {
      logger.error('Error scheduling surveillance audit:', error);
      res.status(500).json({ status: 'error', message: 'Failed to schedule surveillance audit' });
    }
  })
);

// ============================================================================
// PATCH /:id/audits/:auditId — Update audit results
// ============================================================================

router.patch(
  '/:id/audits/:auditId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      // Verify the certification belongs to this organization
      const certification = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!certification) {
        res.status(404).json({ status: 'error', message: 'Certification not found' });
        return;
      }

      const existingAudit = await prisma.certAudit.findFirst({
        where: { id: req.params.auditId, certificationId: req.params.id },
      });

      if (!existingAudit) {
        res.status(404).json({ status: 'error', message: 'Audit not found' });
        return;
      }

      const { id, certificationId, ...updateData } = req.body;

      if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate);
      if (updateData.completedDate) updateData.completedDate = new Date(updateData.completedDate);

      const audit = await prisma.certAudit.update({
        where: { id: req.params.auditId },
        data: updateData,
      });

      res.json({ status: 'success', data: audit });
    } catch (error) {
      logger.error('Error updating audit results:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update audit results' });
    }
  })
);

export default router;
