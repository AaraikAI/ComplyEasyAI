/**
 * Certification Lifecycle Routes
 *
 * CRUD and lifecycle management for compliance certifications including
 * surveillance audit scheduling, expiry tracking, and status management.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createCertificationSchema, updateCertificationSchema,
  createCertAuditSchema, updateCertAuditSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import { AppError } from '../middleware/errorHandler';
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
      if (error instanceof AppError) throw error;
      logger.error('Error fetching expiring certifications:', error);
      throw new AppError('Failed to fetch expiring certifications', 500);
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
      if (error instanceof AppError) throw error;
      logger.error('Error fetching certifications:', error);
      throw new AppError('Failed to fetch certifications', 500);
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
        throw new AppError('Certification not found', 404);
      }

      res.json({ status: 'success', data: certification });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching certification:', error);
      throw new AppError('Failed to fetch certification', 500);
    }
  })
);

// ============================================================================
// POST / — Create certification
// ============================================================================

router.post(
  '/',
  authorize('admin', 'editor'),
  validateBody(createCertificationSchema),
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
        throw new AppError('name, certBody, issueDate, and expiryDate are required', 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error creating certification:', error);
      throw new AppError('Failed to create certification', 500);
    }
  })
);

// ============================================================================
// PATCH /:id — Update certification
// ============================================================================

router.patch(
  '/:id',
  authorize('admin', 'editor'),
  validateBody(updateCertificationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Certification not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'frameworkId', 'name', 'certBody', 'certNumber', 'issueDate',
        'expiryDate', 'status', 'scope', 'documents',
      ]);

      if (updateData.issueDate) updateData.issueDate = new Date(updateData.issueDate);
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

      const certification = await prisma.certification.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: certification });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating certification:', error);
      throw new AppError('Failed to update certification', 500);
    }
  })
);

// ============================================================================
// DELETE /:id — Delete certification
// ============================================================================

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Certification not found', 404);
      }

      // Cascade deletes associated CertAudit records via Prisma schema onDelete: Cascade
      await prisma.certification.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Certification deleted', id: req.params.id } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting certification:', error);
      throw new AppError('Failed to delete certification', 500);
    }
  })
);

// ============================================================================
// POST /:id/audits — Schedule surveillance audit
// ============================================================================

router.post(
  '/:id/audits',
  authorize('admin', 'editor'),
  validateBody(createCertAuditSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const certification = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!certification) {
        throw new AppError('Certification not found', 404);
      }

      const { type, scheduledDate, auditorName } = req.body;

      if (!type || !scheduledDate) {
        throw new AppError('type and scheduledDate are required', 400);
      }

      const validTypes = ['INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION'];
      if (!validTypes.includes(type)) {
        throw new AppError(`type must be one of: ${validTypes.join(', ')}`, 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error scheduling surveillance audit:', error);
      throw new AppError('Failed to schedule surveillance audit', 500);
    }
  })
);

// ============================================================================
// PATCH /:id/audits/:auditId — Update audit results
// ============================================================================

router.patch(
  '/:id/audits/:auditId',
  authorize('admin', 'editor'),
  validateBody(updateCertAuditSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      // Verify the certification belongs to this organization
      const certification = await prisma.certification.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!certification) {
        throw new AppError('Certification not found', 404);
      }

      const existingAudit = await prisma.certAudit.findFirst({
        where: { id: req.params.auditId, certificationId: req.params.id },
      });

      if (!existingAudit) {
        throw new AppError('Audit not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'type', 'scheduledDate', 'completedDate', 'auditorName', 'findings', 'result',
      ]);

      if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate);
      if (updateData.completedDate) updateData.completedDate = new Date(updateData.completedDate);

      const audit = await prisma.certAudit.update({
        where: { id: req.params.auditId },
        data: updateData,
      });

      res.json({ status: 'success', data: audit });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating audit results:', error);
      throw new AppError('Failed to update audit results', 500);
    }
  })
);

export default router;
