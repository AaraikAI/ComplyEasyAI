/**
 * Privacy Management Platform Routes
 * Routes for DSAR, consent, retention, SCC/TIA, BCR, marketing opt-out,
 * account deletion, processing restrictions, AI transparency, and JIT notices.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createDSARSchema, updateDSARSchema,
  createConsentRecordSchema, updateConsentRecordSchema,
  upsertConsentPreferenceSchema,
  createRetentionPolicySchema, updateRetentionPolicySchema,
  verifyAgeSchema, parentalConsentSchema,
  createPrivacyNoticeSchema, updatePrivacyNoticeSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import { Prisma } from '../generated/prisma/client';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { idempotencyKey } from '../middleware/idempotencyKey';

const router = Router();
router.use(authenticate);

// Helper: extract pagination params
function paginate(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

// Helper: generate DSAR request number
function generateRequestNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DSAR-${ts}-${rand}`;
}

// Helper: calculate DSAR due date based on regulation
function calculateDueDate(regulation: string, requestDate: Date): Date {
  const due = new Date(requestDate);
  switch (regulation) {
    case 'CCPA':
      due.setDate(due.getDate() + 45);
      break;
    case 'LGPD':
      due.setDate(due.getDate() + 15);
      break;
    case 'GDPR':
    default:
      due.setDate(due.getDate() + 30);
      break;
  }
  return due;
}

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    try {
      const now = new Date();

      // Active DSARs (not Completed or Rejected)
      const activeDSARs = await prisma.dSARRequest.count({
        where: {
          organizationId: orgId,
          status: { notIn: ['Completed', 'Rejected'] },
        },
      });

      // Average response time (for completed DSARs)
      const completedDsars = await prisma.dSARRequest.findMany({
        where: {
          organizationId: orgId,
          status: 'Completed',
          completedDate: { not: null },
        },
        select: { requestDate: true, completedDate: true },
      });
      let avgResponseTime = 0;
      if (completedDsars.length > 0) {
        const totalDays = completedDsars.reduce((sum, d) => {
          const diff = (d.completedDate!.getTime() - d.requestDate.getTime()) / (1000 * 60 * 60 * 24);
          return sum + diff;
        }, 0);
        avgResponseTime = Math.round((totalDays / completedDsars.length) * 10) / 10;
      }

      // Consent rate
      const totalConsent = await prisma.consentRecord.count({
        where: { organizationId: orgId },
      });
      const grantedConsent = await prisma.consentRecord.count({
        where: { organizationId: orgId, consentGiven: true, withdrawnAt: null },
      });
      const consentRate = totalConsent > 0 ? Math.round((grantedConsent / totalConsent) * 100) : 0;

      // Retention compliance (active policies with completed review / total active)
      const totalPolicies = await prisma.retentionPolicy.count({
        where: { organizationId: orgId, status: 'Active' },
      });
      const reviewedPolicies = await prisma.retentionPolicy.count({
        where: {
          organizationId: orgId,
          status: 'Active',
          lastReviewDate: { not: null },
        },
      });
      const retentionCompliance = totalPolicies > 0 ? Math.round((reviewedPolicies / totalPolicies) * 100) : 100;

      // Recent activity: latest 10 DSARs
      const recentActivity = await prisma.dSARRequest.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          requestNumber: true,
          requestType: true,
          dataSubjectName: true,
          status: true,
          updatedAt: true,
        },
      });

      // Upcoming deadlines: DSARs with dueDate in the next 14 days that aren't completed
      const twoWeeks = new Date(now);
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      const upcomingDeadlines = await prisma.dSARRequest.findMany({
        where: {
          organizationId: orgId,
          status: { notIn: ['Completed', 'Rejected'] },
          dueDate: { gte: now, lte: twoWeeks },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
        select: {
          id: true,
          requestNumber: true,
          requestType: true,
          dataSubjectName: true,
          dueDate: true,
          status: true,
          priority: true,
        },
      });

      res.json({
        activeDSARs,
        avgResponseTime,
        consentRate,
        retentionCompliance,
        recentActivity,
        upcomingDeadlines,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching privacy dashboard:', error);
      throw new AppError('Failed to fetch dashboard data', 500);
    }
  })
);

// ============================================================================
// DSAR (Data Subject Access Requests)
// ============================================================================

router.get(
  '/dsar',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { type, status, search } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (type) where.requestType = type as string;
      if (status) where.status = status as string;
      if (search) {
        where.OR = [
          { dataSubjectName: { contains: search as string, mode: 'insensitive' } },
          { dataSubjectEmail: { contains: search as string, mode: 'insensitive' } },
          { requestNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [dsars, total] = await Promise.all([
        prisma.dSARRequest.findMany({
          where,
          orderBy: { dueDate: 'asc' },
          skip,
          take,
        }),
        prisma.dSARRequest.count({ where }),
      ]);

      res.json({ dsars, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching DSARs:', error);
      throw new AppError('Failed to fetch DSARs', 500);
    }
  })
);

router.post(
  '/dsar',
  authorize('admin', 'editor'),
  idempotencyKey(),
  validateBody(createDSARSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const requestDate = new Date();
      const regulation = req.body.regulation || 'GDPR';
      const dueDate = calculateDueDate(regulation, requestDate);
      const requestNumber = generateRequestNumber();

      const dsar = await prisma.dSARRequest.create({
        data: {
          organizationId: user.organizationId,
          requestNumber,
          requestType: req.body.requestType,
          dataSubjectName: req.body.dataSubjectName,
          dataSubjectEmail: req.body.dataSubjectEmail,
          dataSubjectPhone: req.body.dataSubjectPhone,
          regulation,
          jurisdiction: req.body.jurisdiction,
          requestDate,
          dueDate,
          status: 'Received',
          priority: req.body.priority || 'Normal',
          assignedTo: req.body.assignedTo,
          dataCategories: req.body.dataCategories,
          notes: req.body.notes,
          auditTrail: [
            {
              action: 'Created',
              timestamp: requestDate.toISOString(),
              userId: user.id,
              userName: user.name || user.email,
              details: 'DSAR request created',
            },
          ],
        },
      });

      res.status(201).json(dsar);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating DSAR:', error);
      throw new AppError('Failed to create DSAR', 500);
    }
  })
);

router.get(
  '/dsar/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dsar = await prisma.dSARRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dsar) {
        throw new AppError('DSAR not found', 404);
      }

      const timeline = Array.isArray(dsar.auditTrail) ? dsar.auditTrail : [];

      res.json({ ...dsar, timeline });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching DSAR:', error);
      throw new AppError('Failed to fetch DSAR', 500);
    }
  })
);

router.patch(
  '/dsar/:id',
  authorize('admin', 'editor'),
  idempotencyKey(),
  validateBody(updateDSARSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dSARRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('DSAR not found', 404);
      }

      // Build audit trail entry
      const auditEntry = {
        action: 'Updated',
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email,
        details: `Fields updated: ${Object.keys(req.body).join(', ')}`,
      };
      const currentTrail = Array.isArray(existing.auditTrail) ? existing.auditTrail : [];
      const updatedTrail = [...(currentTrail as Prisma.JsonArray), auditEntry];

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'requestType', 'dataSubjectName', 'dataSubjectEmail', 'dataSubjectPhone',
        'identityVerified', 'identityVerifiedAt', 'identityVerifiedBy', 'verificationMethod',
        'regulation', 'jurisdiction', 'acknowledgedDate', 'dueDate', 'completedDate',
        'status', 'assignedTo', 'priority', 'dataCategories', 'systemsSearched',
        'dataFound', 'responseMethod', 'responseDetails', 'responseAttachments',
        'extensionApplied', 'extensionReason', 'extensionDueDate', 'rejectionReason', 'notes',
      ]);

      const dsar = await prisma.dSARRequest.update({
        where: { id: existing.id },
        data: {
          ...updateData,
          auditTrail: updatedTrail,
        },
      });

      res.json(dsar);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating DSAR:', error);
      throw new AppError('Failed to update DSAR', 500);
    }
  })
);

router.post(
  '/dsar/:id/verify-identity',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dSARRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('DSAR not found', 404);
      }

      const now = new Date();
      const auditEntry = {
        action: 'IdentityVerified',
        timestamp: now.toISOString(),
        userId: user.id,
        userName: user.name || user.email,
        details: `Identity verified via ${req.body.verificationMethod || 'manual review'}`,
      };
      const currentTrail = Array.isArray(existing.auditTrail) ? existing.auditTrail : [];

      const dsar = await prisma.dSARRequest.update({
        where: { id: req.params.id },
        data: {
          identityVerified: true,
          identityVerifiedAt: now,
          identityVerifiedBy: user.id,
          verificationMethod: req.body.verificationMethod,
          status: 'Verified',
          auditTrail: [...(currentTrail as Prisma.JsonArray), auditEntry],
        },
      });

      res.json(dsar);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error verifying DSAR identity:', error);
      throw new AppError('Failed to verify identity', 500);
    }
  })
);

router.post(
  '/dsar/:id/complete',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dSARRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('DSAR not found', 404);
      }

      const now = new Date();
      const auditEntry = {
        action: 'Completed',
        timestamp: now.toISOString(),
        userId: user.id,
        userName: user.name || user.email,
        details: req.body.responseDetails || 'DSAR request completed',
      };
      const currentTrail = Array.isArray(existing.auditTrail) ? existing.auditTrail : [];

      const dsar = await prisma.dSARRequest.update({
        where: { id: req.params.id },
        data: {
          status: 'Completed',
          completedDate: now,
          responseMethod: req.body.responseMethod,
          responseDetails: req.body.responseDetails,
          responseAttachments: req.body.responseAttachments,
          auditTrail: [...(currentTrail as Prisma.JsonArray), auditEntry],
        },
      });

      res.json(dsar);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error completing DSAR:', error);
      throw new AppError('Failed to complete DSAR', 500);
    }
  })
);

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

router.get(
  '/consent',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { consentType, consentGiven, search } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (consentType) where.consentType = consentType as string;
      if (consentGiven !== undefined) where.consentGiven = consentGiven === 'true';
      if (search) {
        where.OR = [
          { dataSubjectId: { contains: search as string, mode: 'insensitive' } },
          { dataSubjectEmail: { contains: search as string, mode: 'insensitive' } },
          { purpose: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [records, total] = await Promise.all([
        prisma.consentRecord.findMany({
          where,
          orderBy: { consentDate: 'desc' },
          skip,
          take,
        }),
        prisma.consentRecord.count({ where }),
      ]);

      res.json({ records, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching consent records:', error);
      throw new AppError('Failed to fetch consent records', 500);
    }
  })
);

router.post(
  '/consent',
  authorize('admin', 'editor'),
  idempotencyKey(),
  validateBody(createConsentRecordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const record = await prisma.consentRecord.create({
        data: {
          organizationId: user.organizationId,
          dataSubjectId: req.body.dataSubjectId,
          dataSubjectEmail: req.body.dataSubjectEmail,
          consentType: req.body.consentType,
          purpose: req.body.purpose,
          legalBasis: req.body.legalBasis,
          channel: req.body.channel,
          consentGiven: req.body.consentGiven ?? true,
          consentDate: req.body.consentDate ? new Date(req.body.consentDate) : new Date(),
          consentExpiry: req.body.consentExpiry ? new Date(req.body.consentExpiry) : undefined,
          version: req.body.version || '1.0',
          policyVersion: req.body.policyVersion,
          proofOfConsent: req.body.proofOfConsent,
          granularity: req.body.granularity,
          doubleOptIn: req.body.doubleOptIn ?? false,
          doubleOptInDate: req.body.doubleOptInDate ? new Date(req.body.doubleOptInDate) : undefined,
          source: req.body.source,
          metadata: req.body.metadata,
        },
      });

      res.status(201).json(record);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating consent record:', error);
      throw new AppError('Failed to create consent record', 500);
    }
  })
);

router.patch(
  '/consent/:id',
  authorize('admin', 'editor'),
  idempotencyKey(),
  validateBody(updateConsentRecordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.consentRecord.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Consent record not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'dataSubjectId', 'dataSubjectEmail', 'consentType', 'purpose', 'legalBasis',
        'channel', 'consentGiven', 'consentDate', 'consentExpiry', 'withdrawnAt',
        'withdrawalMethod', 'version', 'policyVersion', 'proofOfConsent', 'granularity',
        'doubleOptIn', 'doubleOptInDate', 'source', 'metadata', 'dataSubjectAge',
        'isMinor', 'parentalConsentGiven', 'parentalConsentDate', 'parentalConsentEmail',
        'parentalConsentMethod', 'ageVerificationMethod',
      ]);

      // If consent is being withdrawn, set withdrawnAt
      if (req.body.consentGiven === false && existing.consentGiven === true) {
        updateData.withdrawnAt = new Date();
        updateData.withdrawalMethod = req.body.withdrawalMethod || 'Manual';
      }

      const record = await prisma.consentRecord.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(record);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating consent record:', error);
      throw new AppError('Failed to update consent record', 500);
    }
  })
);

router.get(
  '/consent/purposes',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const records = await prisma.consentRecord.groupBy({
        by: ['consentType'],
        where: { organizationId: user.organizationId },
        _count: { id: true },
      });

      // For each consentType, get total and granted counts
      const purposes = await Promise.all(
        records.map(async (r) => {
          const total = r._count.id;
          const granted = await prisma.consentRecord.count({
            where: {
              organizationId: user.organizationId,
              consentType: r.consentType,
              consentGiven: true,
              withdrawnAt: null,
            },
          });
          return {
            consentType: r.consentType,
            total,
            granted,
            rate: total > 0 ? Math.round((granted / total) * 100) : 0,
          };
        })
      );

      res.json(purposes);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      // Return 503 if table doesn't exist yet (migration pending)
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('Consent records table not yet available');
        throw new AppError('Consent management tables not yet available. Please run database migrations.', 503);
      }
      logger.error('Error fetching consent purposes:', error);
      throw new AppError('Failed to fetch consent purposes', 500);
    }
  })
);

router.get(
  '/consent/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const orgId = user.organizationId;

      const [totalRecords, grantedCount, withdrawnCount] = await Promise.all([
        prisma.consentRecord.count({ where: { organizationId: orgId } }),
        prisma.consentRecord.count({
          where: { organizationId: orgId, consentGiven: true, withdrawnAt: null },
        }),
        prisma.consentRecord.count({
          where: { organizationId: orgId, withdrawnAt: { not: null } },
        }),
      ]);

      const grantedRate = totalRecords > 0 ? Math.round((grantedCount / totalRecords) * 100) : 0;
      const withdrawalRate = totalRecords > 0 ? Math.round((withdrawnCount / totalRecords) * 100) : 0;

      // By purpose breakdown
      const byPurposeRaw = await prisma.consentRecord.groupBy({
        by: ['consentType'],
        where: { organizationId: orgId },
        _count: { id: true },
      });

      const byPurpose: Record<string, { total: number; granted: number; withdrawn: number }> = {};
      for (const row of byPurposeRaw) {
        const [granted, withdrawn] = await Promise.all([
          prisma.consentRecord.count({
            where: {
              organizationId: orgId,
              consentType: row.consentType,
              consentGiven: true,
              withdrawnAt: null,
            },
          }),
          prisma.consentRecord.count({
            where: {
              organizationId: orgId,
              consentType: row.consentType,
              withdrawnAt: { not: null },
            },
          }),
        ]);
        byPurpose[row.consentType] = { total: row._count.id, granted, withdrawn };
      }

      res.json({ totalRecords, grantedRate, withdrawalRate, byPurpose });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('Consent records table not yet available, returning empty stats');
        return res.json({ totalRecords: 0, grantedRate: 0, withdrawalRate: 0, byPurpose: {} });
      }
      logger.error('Error fetching consent stats:', error);
      throw new AppError('Failed to fetch consent stats', 500);
    }
  })
);

// ============================================================================
// CONSENT PREFERENCES
// ============================================================================

router.get(
  '/consent/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { search } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (search) {
        where.OR = [
          { dataSubjectId: { contains: search as string, mode: 'insensitive' } },
          { dataSubjectEmail: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [preferences, total] = await Promise.all([
        prisma.consentPreference.findMany({
          where,
          orderBy: { lastUpdated: 'desc' },
          skip,
          take,
        }),
        prisma.consentPreference.count({ where }),
      ]);

      res.json({ preferences, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('Consent preferences table not yet available, returning empty data');
        return res.json({ preferences: [], total: 0, page, limit, totalPages: 0 });
      }
      logger.error('Error fetching consent preferences:', error);
      throw new AppError('Failed to fetch consent preferences', 500);
    }
  })
);

router.put(
  '/consent/preferences/:dataSubjectId',
  authorize('admin', 'editor'),
  validateBody(upsertConsentPreferenceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { dataSubjectId } = req.params;
    try {
      const now = new Date();
      const preference = await prisma.consentPreference.upsert({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId,
          },
        },
        update: {
          preferences: req.body.preferences,
          dataSubjectEmail: req.body.dataSubjectEmail,
          marketingOptOut: req.body.marketingOptOut ?? false,
          marketingOptOutDate: req.body.marketingOptOut ? now : null,
          communicationChannels: req.body.communicationChannels,
          doNotSell: req.body.doNotSell ?? false,
          doNotShare: req.body.doNotShare ?? false,
          limitUse: req.body.limitUse ?? false,
          lastUpdated: now,
        },
        create: {
          organizationId: user.organizationId,
          dataSubjectId,
          dataSubjectEmail: req.body.dataSubjectEmail,
          preferences: req.body.preferences || {},
          marketingOptOut: req.body.marketingOptOut ?? false,
          marketingOptOutDate: req.body.marketingOptOut ? now : null,
          communicationChannels: req.body.communicationChannels,
          doNotSell: req.body.doNotSell ?? false,
          doNotShare: req.body.doNotShare ?? false,
          limitUse: req.body.limitUse ?? false,
          lastUpdated: now,
        },
      });

      res.json(preference);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error upserting consent preference:', error);
      throw new AppError('Failed to update consent preferences', 500);
    }
  })
);

// ============================================================================
// RETENTION ENFORCEMENT
// ============================================================================

router.get(
  '/retention',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status, dataCategory } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;
      if (dataCategory) where.dataCategory = dataCategory as string;

      const [policies, total] = await Promise.all([
        prisma.retentionPolicy.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: { _count: { select: { enforcements: true } } },
        }),
        prisma.retentionPolicy.count({ where }),
      ]);

      res.json({ policies, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      // Return empty data if table doesn't exist yet (migration pending)
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('Retention policies table not yet available, returning empty data');
        return res.json({ policies: [], total: 0, page, limit, totalPages: 0 });
      }
      logger.error('Error fetching retention policies:', error);
      throw new AppError('Failed to fetch retention policies', 500);
    }
  })
);

router.post(
  '/retention',
  authorize('admin', 'editor'),
  idempotencyKey(),
  validateBody(createRetentionPolicySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const policy = await prisma.retentionPolicy.create({
        data: {
          organizationId: user.organizationId,
          name: req.body.name,
          description: req.body.description,
          dataCategory: req.body.dataCategory,
          retentionPeriod: req.body.retentionPeriod,
          legalBasis: req.body.legalBasis,
          regulation: req.body.regulation,
          autoDelete: req.body.autoDelete ?? false,
          autoDeleteWarningDays: req.body.autoDeleteWarningDays ?? 30,
          reviewFrequency: req.body.reviewFrequency || 'Annual',
          nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined,
          status: req.body.status || 'Active',
          appliedToSystems: req.body.appliedToSystems,
          exceptions: req.body.exceptions,
          createdBy: user.id,
        },
      });

      res.status(201).json(policy);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating retention policy:', error);
      throw new AppError('Failed to create retention policy', 500);
    }
  })
);

router.patch(
  '/retention/:id',
  authorize('admin', 'editor'),
  idempotencyKey(),
  validateBody(updateRetentionPolicySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.retentionPolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Retention policy not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'name', 'description', 'dataCategory', 'retentionPeriod', 'legalBasis',
        'regulation', 'autoDelete', 'autoDeleteWarningDays', 'reviewFrequency',
        'lastReviewDate', 'nextReviewDate', 'status', 'appliedToSystems', 'exceptions',
      ]);

      // Convert date strings if present
      if (updateData.nextReviewDate) updateData.nextReviewDate = new Date(updateData.nextReviewDate);
      if (updateData.lastReviewDate) updateData.lastReviewDate = new Date(updateData.lastReviewDate);

      const policy = await prisma.retentionPolicy.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(policy);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating retention policy:', error);
      throw new AppError('Failed to update retention policy', 500);
    }
  })
);

router.delete(
  '/retention/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.retentionPolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Retention policy not found', 404);
      }

      await prisma.retentionPolicy.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting retention policy:', error);
      throw new AppError('Failed to delete retention policy', 500);
    }
  })
);

router.get(
  '/retention/jobs',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      // Get enforcement runs for policies belonging to this org
      const orgPolicies = await prisma.retentionPolicy.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true },
      });
      const policyIds = orgPolicies.map((p) => p.id);

      const where = { policyId: { in: policyIds } };
      const [jobs, total] = await Promise.all([
        prisma.retentionEnforcement.findMany({
          where,
          orderBy: { executionDate: 'desc' },
          skip,
          take,
          include: { policy: { select: { name: true, dataCategory: true } } },
        }),
        prisma.retentionEnforcement.count({ where }),
      ]);

      res.json({ jobs, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching retention jobs:', error);
      throw new AppError('Failed to fetch retention jobs', 500);
    }
  })
);

router.post(
  '/retention/jobs/:id/run',
  authorize('admin'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify the policy belongs to this org
      const policy = await prisma.retentionPolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!policy) {
        throw new AppError('Retention policy not found', 404);
      }

      const enforcement = await prisma.retentionEnforcement.create({
        data: {
          policyId: req.params.id,
          executionDate: new Date(),
          recordsEvaluated: req.body.recordsEvaluated || 0,
          recordsDeleted: req.body.recordsDeleted || 0,
          recordsArchived: req.body.recordsArchived || 0,
          recordsExempted: req.body.recordsExempted || 0,
          exemptionReasons: req.body.exemptionReasons,
          status: 'InProgress',
          executedBy: user.id,
          auditLog: [
            {
              action: 'Started',
              timestamp: new Date().toISOString(),
              executedBy: user.id,
            },
          ],
        },
        include: { policy: { select: { name: true, dataCategory: true } } },
      });

      // Update the policy lastReviewDate
      await prisma.retentionPolicy.update({
        where: { id: req.params.id },
        data: { lastReviewDate: new Date() },
      });

      res.json(enforcement);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error running retention enforcement:', error);
      throw new AppError('Failed to run retention enforcement', 500);
    }
  })
);

// ============================================================================
// SCC/TIA (Standard Contractual Clauses & Transfer Impact Assessment)
// ============================================================================

router.get(
  '/scc-tia',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status, templateType } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;
      if (templateType) where.templateType = templateType as string;

      const [templates, total] = await Promise.all([
        prisma.sCCTemplate.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            tiaAssessment: {
              select: { id: true, status: true, overallRisk: true, destinationCountry: true },
            },
          },
        }),
        prisma.sCCTemplate.count({ where }),
      ]);

      res.json({ templates, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SCC templates:', error);
      throw new AppError('Failed to fetch SCC templates', 500);
    }
  })
);

router.post(
  '/scc-tia',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const template = await prisma.sCCTemplate.create({
        data: {
          organizationId: user.organizationId,
          name: req.body.name,
          templateType: req.body.templateType,
          version: req.body.version || '2021',
          moduleSelected: req.body.moduleSelected || [],
          dataExporter: req.body.dataExporter,
          dataImporter: req.body.dataImporter,
          transferDescription: req.body.transferDescription,
          technicalMeasures: req.body.technicalMeasures,
          organizationalMeasures: req.body.organizationalMeasures,
          supervisoryAuthority: req.body.supervisoryAuthority,
          governingLaw: req.body.governingLaw,
          annexes: req.body.annexes,
          status: req.body.status || 'Draft',
          executedDate: req.body.executedDate ? new Date(req.body.executedDate) : undefined,
          expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
          signedByExporter: req.body.signedByExporter,
          signedByImporter: req.body.signedByImporter,
        },
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating SCC template:', error);
      throw new AppError('Failed to create SCC template', 500);
    }
  })
);

router.patch(
  '/scc-tia/:id',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.sCCTemplate.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('SCC template not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'name', 'templateType', 'version', 'moduleSelected', 'dataExporter', 'dataImporter',
        'transferDescription', 'technicalMeasures', 'organizationalMeasures',
        'supervisoryAuthority', 'governingLaw', 'annexes', 'status', 'executedDate',
        'expiryDate', 'signedByExporter', 'signedByImporter', 'tiaCompleted',
      ]);
      if (updateData.executedDate) updateData.executedDate = new Date(updateData.executedDate);
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

      const template = await prisma.sCCTemplate.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(template);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating SCC template:', error);
      throw new AppError('Failed to update SCC template', 500);
    }
  })
);

router.get(
  '/scc-tia/:id/tia',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify the SCC template belongs to this org
      const scc = await prisma.sCCTemplate.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!scc) {
        throw new AppError('SCC template not found', 404);
      }

      const tia = await prisma.tIAAssessment.findUnique({
        where: { sccTemplateId: req.params.id },
      });

      if (!tia) {
        throw new AppError('TIA assessment not found for this SCC template', 404);
      }

      res.json(tia);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching TIA assessment:', error);
      throw new AppError('Failed to fetch TIA assessment', 500);
    }
  })
);

router.post(
  '/scc-tia/:id/tia',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify the SCC template belongs to this org
      const scc = await prisma.sCCTemplate.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!scc) {
        throw new AppError('SCC template not found', 404);
      }

      const tia = await prisma.tIAAssessment.upsert({
        where: { sccTemplateId: req.params.id },
        update: {
          destinationCountry: req.body.destinationCountry,
          adequacyDecision: req.body.adequacyDecision ?? false,
          legalFramework: req.body.legalFramework,
          governmentAccess: req.body.governmentAccess,
          dataSurveillance: req.body.dataSurveillance,
          effectiveRemedies: req.body.effectiveRemedies,
          supplementaryMeasures: req.body.supplementaryMeasures,
          overallRisk: req.body.overallRisk || 'Medium',
          conclusion: req.body.conclusion,
          approvedBy: req.body.approvedBy,
          approvedAt: req.body.approvedAt ? new Date(req.body.approvedAt) : undefined,
          reviewDate: req.body.reviewDate ? new Date(req.body.reviewDate) : undefined,
          status: req.body.status || 'Draft',
        },
        create: {
          organizationId: user.organizationId,
          sccTemplateId: req.params.id,
          destinationCountry: req.body.destinationCountry,
          adequacyDecision: req.body.adequacyDecision ?? false,
          legalFramework: req.body.legalFramework,
          governmentAccess: req.body.governmentAccess,
          dataSurveillance: req.body.dataSurveillance,
          effectiveRemedies: req.body.effectiveRemedies,
          supplementaryMeasures: req.body.supplementaryMeasures,
          overallRisk: req.body.overallRisk || 'Medium',
          conclusion: req.body.conclusion,
          status: req.body.status || 'Draft',
        },
      });

      // Mark TIA as completed on the SCC template if appropriate
      if (req.body.status === 'Completed' || req.body.status === 'Approved') {
        await prisma.sCCTemplate.update({
          where: { id: req.params.id },
          data: { tiaCompleted: true },
        });
      }

      res.json(tia);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating/updating TIA assessment:', error);
      throw new AppError('Failed to create/update TIA assessment', 500);
    }
  })
);

// ============================================================================
// BCR (Binding Corporate Rules)
// ============================================================================

router.get(
  '/bcr',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status, bcrType } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;
      if (bcrType) where.bcrType = bcrType as string;

      const [programs, total] = await Promise.all([
        prisma.bCRProgram.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.bCRProgram.count({ where }),
      ]);

      res.json({ programs, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching BCR programs:', error);
      throw new AppError('Failed to fetch BCR programs', 500);
    }
  })
);

router.post(
  '/bcr',
  authorize('admin'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const program = await prisma.bCRProgram.create({
        data: {
          organizationId: user.organizationId,
          name: req.body.name,
          bcrType: req.body.bcrType,
          status: req.body.status || 'Draft',
          leadDPA: req.body.leadDPA,
          concernedDPAs: req.body.concernedDPAs,
          groupEntities: req.body.groupEntities,
          dataCategories: req.body.dataCategories,
          transferPurposes: req.body.transferPurposes,
          bindingCommitments: req.body.bindingCommitments,
          dataProtectionPrinciples: req.body.dataProtectionPrinciples,
          rightsOfDataSubjects: req.body.rightsOfDataSubjects,
          securityMeasures: req.body.securityMeasures,
          complianceAuditPlan: req.body.complianceAuditPlan,
          trainingProgram: req.body.trainingProgram,
          complaintMechanism: req.body.complaintMechanism,
          cooperationWithDPAs: req.body.cooperationWithDPAs,
          approvalDate: req.body.approvalDate ? new Date(req.body.approvalDate) : undefined,
          expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
          documentUrl: req.body.documentUrl,
        },
      });

      res.status(201).json(program);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating BCR program:', error);
      throw new AppError('Failed to create BCR program', 500);
    }
  })
);

router.patch(
  '/bcr/:id',
  authorize('admin'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.bCRProgram.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('BCR program not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'name', 'bcrType', 'status', 'leadDPA', 'concernedDPAs', 'groupEntities',
        'dataCategories', 'transferPurposes', 'bindingCommitments', 'dataProtectionPrinciples',
        'rightsOfDataSubjects', 'securityMeasures', 'complianceAuditPlan', 'trainingProgram',
        'complaintMechanism', 'cooperationWithDPAs', 'approvalDate', 'expiryDate',
        'lastAuditDate', 'nextAuditDate', 'documentUrl',
      ]);
      if (updateData.approvalDate) updateData.approvalDate = new Date(updateData.approvalDate);
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
      if (updateData.lastAuditDate) updateData.lastAuditDate = new Date(updateData.lastAuditDate);
      if (updateData.nextAuditDate) updateData.nextAuditDate = new Date(updateData.nextAuditDate);

      const program = await prisma.bCRProgram.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(program);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating BCR program:', error);
      throw new AppError('Failed to update BCR program', 500);
    }
  })
);

// ============================================================================
// MARKETING OPT-OUT
// ============================================================================

router.get(
  '/marketing',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where = {
        organizationId: user.organizationId,
        marketingOptOut: true,
      };

      const [preferences, total] = await Promise.all([
        prisma.consentPreference.findMany({
          where,
          orderBy: { marketingOptOutDate: 'desc' },
          skip,
          take,
        }),
        prisma.consentPreference.count({ where }),
      ]);

      res.json({ preferences, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching marketing opt-outs:', error);
      throw new AppError('Failed to fetch marketing opt-outs', 500);
    }
  })
);

router.post(
  '/marketing/opt-out',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const now = new Date();
      const preference = await prisma.consentPreference.upsert({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: req.body.dataSubjectId,
          },
        },
        update: {
          marketingOptOut: true,
          marketingOptOutDate: now,
          dataSubjectEmail: req.body.dataSubjectEmail,
          lastUpdated: now,
        },
        create: {
          organizationId: user.organizationId,
          dataSubjectId: req.body.dataSubjectId,
          dataSubjectEmail: req.body.dataSubjectEmail,
          preferences: req.body.preferences || {},
          marketingOptOut: true,
          marketingOptOutDate: now,
          lastUpdated: now,
        },
      });

      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error processing marketing opt-out:', error);
      throw new AppError('Failed to process marketing opt-out', 500);
    }
  })
);

router.get(
  '/marketing/suppression-list',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where = {
        organizationId: user.organizationId,
        marketingOptOut: true,
      };

      const [entries, total] = await Promise.all([
        prisma.consentPreference.findMany({
          where,
          orderBy: { marketingOptOutDate: 'desc' },
          skip,
          take,
          select: {
            id: true,
            dataSubjectId: true,
            dataSubjectEmail: true,
            marketingOptOut: true,
            marketingOptOutDate: true,
            doNotSell: true,
            doNotShare: true,
            communicationChannels: true,
            lastUpdated: true,
          },
        }),
        prisma.consentPreference.count({ where }),
      ]);

      res.json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching suppression list:', error);
      throw new AppError('Failed to fetch suppression list', 500);
    }
  })
);

router.post(
  '/marketing/suppression-list',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const now = new Date();
      const entry = await prisma.consentPreference.upsert({
        where: {
          organizationId_dataSubjectId: {
            organizationId: user.organizationId,
            dataSubjectId: req.body.dataSubjectId,
          },
        },
        update: {
          marketingOptOut: true,
          marketingOptOutDate: now,
          dataSubjectEmail: req.body.dataSubjectEmail,
          doNotSell: req.body.doNotSell ?? false,
          doNotShare: req.body.doNotShare ?? false,
          lastUpdated: now,
        },
        create: {
          organizationId: user.organizationId,
          dataSubjectId: req.body.dataSubjectId,
          dataSubjectEmail: req.body.dataSubjectEmail,
          preferences: req.body.preferences || {},
          marketingOptOut: true,
          marketingOptOutDate: now,
          doNotSell: req.body.doNotSell ?? false,
          doNotShare: req.body.doNotShare ?? false,
          lastUpdated: now,
        },
      });

      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding to suppression list:', error);
      throw new AppError('Failed to add to suppression list', 500);
    }
  })
);

// ============================================================================
// ACCOUNT/DATA DELETION
// ============================================================================

// NOTE: audit-log route must come before /:id to prevent "audit-log" being matched as :id
router.get(
  '/deletion/audit-log',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const requests = await prisma.dataDeletionRequest.findMany({
        where: {
          organizationId: user.organizationId,
          deletionLog: { not: Prisma.JsonNull },
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          requestType: true,
          requestedBy: true,
          requestedByEmail: true,
          status: true,
          deletionLog: true,
          completedDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Flatten deletion logs into audit entries
      const allEntries: any[] = [];
      for (const delReq of requests) {
        const log = Array.isArray(delReq.deletionLog) ? delReq.deletionLog : [];
        for (const entry of log as Prisma.JsonArray) {
          const entryObj = (typeof entry === 'object' && entry !== null && !Array.isArray(entry)) ? entry : {};
          allEntries.push({
            ...entryObj,
            deletionRequestId: delReq.id,
            requestType: delReq.requestType,
            requestedBy: delReq.requestedBy,
            requestedByEmail: delReq.requestedByEmail,
          });
        }
      }

      // Sort by timestamp descending
      allEntries.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });

      const total = allEntries.length;
      const paginatedEntries = allEntries.slice(skip, skip + take);

      res.json({ entries: paginatedEntries, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching deletion audit log:', error);
      throw new AppError('Failed to fetch deletion audit log', 500);
    }
  })
);

router.get(
  '/deletion',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status, requestType } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;
      if (requestType) where.requestType = requestType as string;

      const [requests, total] = await Promise.all([
        prisma.dataDeletionRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.dataDeletionRequest.count({ where }),
      ]);

      res.json({ requests, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching deletion requests:', error);
      throw new AppError('Failed to fetch deletion requests', 500);
    }
  })
);

router.post(
  '/deletion',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const request = await prisma.dataDeletionRequest.create({
        data: {
          organizationId: user.organizationId,
          requestType: req.body.requestType,
          requestedBy: req.body.requestedBy,
          requestedByEmail: req.body.requestedByEmail,
          status: 'Pending',
          reason: req.body.reason,
          dataCategories: req.body.dataCategories,
          systemsAffected: req.body.systemsAffected,
          scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
          retentionOverride: req.body.retentionOverride ?? false,
          legalHoldReason: req.body.legalHoldReason,
          verificationRequired: req.body.verificationRequired ?? true,
          deletionLog: [
            {
              action: 'Created',
              timestamp: new Date().toISOString(),
              userId: user.id,
              details: 'Deletion request submitted',
            },
          ],
        },
      });

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating deletion request:', error);
      throw new AppError('Failed to create deletion request', 500);
    }
  })
);

router.get(
  '/deletion/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const request = await prisma.dataDeletionRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!request) {
        throw new AppError('Deletion request not found', 404);
      }

      res.json(request);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching deletion request:', error);
      throw new AppError('Failed to fetch deletion request', 500);
    }
  })
);

router.patch(
  '/deletion/:id',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dataDeletionRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Deletion request not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'requestType', 'requestedBy', 'requestedByEmail', 'status', 'reason',
        'dataCategories', 'systemsAffected', 'approvedBy', 'approvedAt',
        'scheduledDate', 'completedDate', 'retentionOverride', 'legalHoldReason',
        'verificationRequired', 'verifiedAt',
      ]);
      if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate);
      if (updateData.approvedAt) updateData.approvedAt = new Date(updateData.approvedAt);
      if (updateData.completedDate) updateData.completedDate = new Date(updateData.completedDate);

      // Append to deletion log
      const currentLog = Array.isArray(existing.deletionLog) ? existing.deletionLog : [];
      const logEntry = {
        action: 'Updated',
        timestamp: new Date().toISOString(),
        userId: user.id,
        details: `Fields updated: ${Object.keys(req.body).join(', ')}`,
      };

      const request = await prisma.dataDeletionRequest.update({
        where: { id: req.params.id },
        data: {
          ...updateData,
          deletionLog: [...(currentLog as Prisma.JsonArray), logEntry],
        },
      });

      res.json(request);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating deletion request:', error);
      throw new AppError('Failed to update deletion request', 500);
    }
  })
);

router.post(
  '/deletion/:id/verify',
  authorize('admin'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dataDeletionRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Deletion request not found', 404);
      }

      const now = new Date();
      const currentLog = Array.isArray(existing.deletionLog) ? existing.deletionLog : [];
      const logEntry = {
        action: 'Verified',
        timestamp: now.toISOString(),
        userId: user.id,
        details: 'Identity/request verification completed',
      };

      const request = await prisma.dataDeletionRequest.update({
        where: { id: req.params.id },
        data: {
          verifiedAt: now,
          status: 'Approved',
          approvedBy: user.id,
          approvedAt: now,
          deletionLog: [...(currentLog as Prisma.JsonArray), logEntry],
        },
      });

      res.json(request);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error verifying deletion request:', error);
      throw new AppError('Failed to verify deletion request', 500);
    }
  })
);

router.post(
  '/deletion/:id/execute',
  authorize('admin'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dataDeletionRequest.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Deletion request not found', 404);
      }

      const now = new Date();
      const currentLog = Array.isArray(existing.deletionLog) ? existing.deletionLog : [];
      const logEntry = {
        action: 'ExecutionStarted',
        timestamp: now.toISOString(),
        userId: user.id,
        details: 'Deletion execution initiated',
      };

      const request = await prisma.dataDeletionRequest.update({
        where: { id: req.params.id },
        data: {
          status: 'InProgress',
          deletionLog: [...(currentLog as Prisma.JsonArray), logEntry],
        },
      });

      res.json(request);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error executing deletion request:', error);
      throw new AppError('Failed to execute deletion request', 500);
    }
  })
);

// ============================================================================
// PROCESSING RESTRICTIONS
// ============================================================================

router.get(
  '/restrictions',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status, restrictionType } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;
      if (restrictionType) where.restrictionType = restrictionType as string;

      const [restrictions, total] = await Promise.all([
        prisma.processingRestriction.findMany({
          where,
          orderBy: { startDate: 'desc' },
          skip,
          take,
        }),
        prisma.processingRestriction.count({ where }),
      ]);

      res.json({ restrictions, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching processing restrictions:', error);
      throw new AppError('Failed to fetch processing restrictions', 500);
    }
  })
);

router.post(
  '/restrictions',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const restriction = await prisma.processingRestriction.create({
        data: {
          organizationId: user.organizationId,
          dataSubjectId: req.body.dataSubjectId,
          dataSubjectEmail: req.body.dataSubjectEmail,
          restrictionType: req.body.restrictionType,
          reason: req.body.reason,
          affectedSystems: req.body.affectedSystems,
          affectedProcesses: req.body.affectedProcesses,
          startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          status: 'Active',
          notifiedParties: req.body.notifiedParties,
        },
      });

      res.status(201).json(restriction);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating processing restriction:', error);
      throw new AppError('Failed to create processing restriction', 500);
    }
  })
);

router.patch(
  '/restrictions/:id',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.processingRestriction.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Processing restriction not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'dataSubjectId', 'dataSubjectEmail', 'restrictionType', 'reason',
        'affectedSystems', 'affectedProcesses', 'startDate', 'endDate', 'status',
        'liftedBy', 'liftedAt', 'liftReason', 'notifiedParties',
      ]);
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

      const restriction = await prisma.processingRestriction.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(restriction);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating processing restriction:', error);
      throw new AppError('Failed to update processing restriction', 500);
    }
  })
);

router.post(
  '/restrictions/:id/lift',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.processingRestriction.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Processing restriction not found', 404);
      }

      const now = new Date();
      const restriction = await prisma.processingRestriction.update({
        where: { id: req.params.id },
        data: {
          status: 'Lifted',
          liftedBy: user.id,
          liftedAt: now,
          liftReason: req.body.liftReason,
          endDate: now,
        },
      });

      res.json(restriction);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error lifting processing restriction:', error);
      throw new AppError('Failed to lift processing restriction', 500);
    }
  })
);

// ============================================================================
// AI TRANSPARENCY
// ============================================================================

router.get(
  '/ai-transparency',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;

      const [notices, total] = await Promise.all([
        prisma.aITransparencyNotice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.aITransparencyNotice.count({ where }),
      ]);

      res.json({ notices, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching AI transparency notices:', error);
      throw new AppError('Failed to fetch AI transparency notices', 500);
    }
  })
);

router.post(
  '/ai-transparency',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const notice = await prisma.aITransparencyNotice.create({
        data: {
          organizationId: user.organizationId,
          name: req.body.name,
          aiSystemName: req.body.aiSystemName,
          systemDescription: req.body.systemDescription,
          purpose: req.body.purpose,
          dataUsed: req.body.dataUsed,
          decisionTypes: req.body.decisionTypes || [],
          humanOversight: req.body.humanOversight,
          logicExplanation: req.body.logicExplanation,
          significance: req.body.significance,
          rightToObjection: req.body.rightToObjection ?? true,
          rightToHumanReview: req.body.rightToHumanReview ?? true,
          contactInfo: req.body.contactInfo,
          publishedUrl: req.body.publishedUrl,
          version: req.body.version || '1.0',
          status: req.body.status || 'Draft',
          effectiveDate: req.body.effectiveDate ? new Date(req.body.effectiveDate) : undefined,
          nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined,
        },
      });

      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating AI transparency notice:', error);
      throw new AppError('Failed to create AI transparency notice', 500);
    }
  })
);

router.patch(
  '/ai-transparency/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.aITransparencyNotice.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('AI transparency notice not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'name', 'aiSystemName', 'systemDescription', 'purpose', 'dataUsed',
        'decisionTypes', 'humanOversight', 'logicExplanation', 'significance',
        'rightToObjection', 'rightToHumanReview', 'contactInfo', 'publishedUrl',
        'version', 'status', 'effectiveDate', 'lastReviewDate', 'nextReviewDate',
      ]);
      if (updateData.effectiveDate) updateData.effectiveDate = new Date(updateData.effectiveDate);
      if (updateData.lastReviewDate) updateData.lastReviewDate = new Date(updateData.lastReviewDate);
      if (updateData.nextReviewDate) updateData.nextReviewDate = new Date(updateData.nextReviewDate);

      const notice = await prisma.aITransparencyNotice.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(notice);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating AI transparency notice:', error);
      throw new AppError('Failed to update AI transparency notice', 500);
    }
  })
);

router.post(
  '/ai-transparency/:id/publish',
  idempotencyKey(),
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.aITransparencyNotice.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('AI transparency notice not found', 404);
      }

      const notice = await prisma.aITransparencyNotice.update({
        where: { id: req.params.id },
        data: {
          status: 'Published',
          effectiveDate: new Date(),
          publishedUrl: req.body.publishedUrl || existing.publishedUrl,
        },
      });

      res.json(notice);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error publishing AI transparency notice:', error);
      throw new AppError('Failed to publish AI transparency notice', 500);
    }
  })
);

// ============================================================================
// JIT PRIVACY NOTICES
// ============================================================================

router.get(
  '/jit-notices',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { status, triggerContext } = req.query;
    const { skip, take, page, limit } = paginate(req.query);
    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status as string;
      if (triggerContext) where.triggerContext = triggerContext as string;

      const [notices, total] = await Promise.all([
        prisma.jITPrivacyNotice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.jITPrivacyNotice.count({ where }),
      ]);

      res.json({ notices, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching JIT privacy notices:', error);
      throw new AppError('Failed to fetch JIT privacy notices', 500);
    }
  })
);

router.post(
  '/jit-notices',
  authorize('admin', 'editor'),
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const notice = await prisma.jITPrivacyNotice.create({
        data: {
          organizationId: user.organizationId,
          name: req.body.name,
          triggerContext: req.body.triggerContext,
          noticeContent: req.body.noticeContent,
          shortNotice: req.body.shortNotice,
          dataCollected: req.body.dataCollected,
          purposes: req.body.purposes || [],
          legalBasis: req.body.legalBasis,
          retentionPeriod: req.body.retentionPeriod,
          thirdPartyRecipients: req.body.thirdPartyRecipients,
          dataSubjectRights: req.body.dataSubjectRights,
          contactInfo: req.body.contactInfo,
          displayType: req.body.displayType || 'Banner',
          position: req.body.position || 'Bottom',
          requiresAction: req.body.requiresAction ?? true,
          version: req.body.version || '1.0',
          language: req.body.language || 'en',
          translations: req.body.translations,
          status: req.body.status || 'Draft',
          impressions: 0,
          acceptances: 0,
          dismissals: 0,
        },
      });

      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating JIT privacy notice:', error);
      throw new AppError('Failed to create JIT privacy notice', 500);
    }
  })
);

router.patch(
  '/jit-notices/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.jITPrivacyNotice.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('JIT privacy notice not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData = pick(req.body, [
        'name', 'triggerContext', 'noticeContent', 'shortNotice', 'dataCollected',
        'purposes', 'legalBasis', 'retentionPeriod', 'thirdPartyRecipients',
        'dataSubjectRights', 'contactInfo', 'displayType', 'position', 'requiresAction',
        'version', 'language', 'translations', 'status',
      ]);

      const notice = await prisma.jITPrivacyNotice.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(notice);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating JIT privacy notice:', error);
      throw new AppError('Failed to update JIT privacy notice', 500);
    }
  })
);

router.post(
  '/jit-notices/:id/impression',
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.jITPrivacyNotice.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('JIT privacy notice not found', 404);
      }

      const notice = await prisma.jITPrivacyNotice.update({
        where: { id: req.params.id },
        data: { impressions: { increment: 1 } },
      });

      res.json({ id: notice.id, impressions: notice.impressions });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error recording impression:', error);
      throw new AppError('Failed to record impression', 500);
    }
  })
);

router.post(
  '/jit-notices/:id/accept',
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.jITPrivacyNotice.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('JIT privacy notice not found', 404);
      }

      const notice = await prisma.jITPrivacyNotice.update({
        where: { id: req.params.id },
        data: { acceptances: { increment: 1 } },
      });

      res.json({ id: notice.id, acceptances: notice.acceptances });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error recording acceptance:', error);
      throw new AppError('Failed to record acceptance', 500);
    }
  })
);

router.post(
  '/jit-notices/:id/dismiss',
  idempotencyKey(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.jITPrivacyNotice.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('JIT privacy notice not found', 404);
      }

      const notice = await prisma.jITPrivacyNotice.update({
        where: { id: req.params.id },
        data: { dismissals: { increment: 1 } },
      });

      res.json({ id: notice.id, dismissals: notice.dismissals });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error recording dismissal:', error);
      throw new AppError('Failed to record dismissal', 500);
    }
  })
);

// ============================================================================
// PRIVACY NOTICES (Art. 13-14) — Serving & Tracking
// ============================================================================

// List privacy notices
router.get('/notices', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  const { skip, take, page, limit } = paginate(req.query);
  const { triggerContext, status, language } = req.query;

  const where: any = { organizationId: orgId };
  if (triggerContext) where.triggerContext = triggerContext;
  if (status) where.status = status;
  if (language) where.language = language;

  const [notices, total] = await Promise.all([
    prisma.jITPrivacyNotice.findMany({ where, skip, take, orderBy: { updatedAt: 'desc' } }),
    prisma.jITPrivacyNotice.count({ where }),
  ]);
  res.json({ notices, total, page, limit });
}));

// Create privacy notice
router.post('/notices', authorize('admin', 'editor'), idempotencyKey(), validateBody(createPrivacyNoticeSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  // Explicit field allowlist: counters are forced to 0 and organizationId is
  // server-controlled so callers cannot seed metrics or move the row.
  const notice = await prisma.jITPrivacyNotice.create({
    data: {
      organizationId: orgId,
      name: req.body.name,
      triggerContext: req.body.triggerContext,
      noticeContent: req.body.noticeContent,
      shortNotice: req.body.shortNotice,
      dataCollected: req.body.dataCollected,
      purposes: req.body.purposes || [],
      legalBasis: req.body.legalBasis,
      retentionPeriod: req.body.retentionPeriod,
      thirdPartyRecipients: req.body.thirdPartyRecipients,
      dataSubjectRights: req.body.dataSubjectRights,
      contactInfo: req.body.contactInfo,
      displayType: req.body.displayType || 'Banner',
      position: req.body.position || 'Bottom',
      requiresAction: req.body.requiresAction ?? true,
      version: req.body.version || '1.0',
      language: req.body.language || 'en',
      translations: req.body.translations,
      status: req.body.status || 'Draft',
      impressions: 0,
      acceptances: 0,
      dismissals: 0,
    },
  });
  res.status(201).json(notice);
}));

// Get single privacy notice
router.get('/notices/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const notice = await prisma.jITPrivacyNotice.findFirst({
    where: { id: req.params.id, organizationId: user.organizationId },
  });
  if (!notice) throw new AppError('Notice not found', 404);
  return res.json(notice);
}));

// Update privacy notice
router.patch('/notices/:id', authorize('admin', 'editor'), validateBody(updatePrivacyNoticeSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const existing = await prisma.jITPrivacyNotice.findFirst({
    where: { id: req.params.id, organizationId: user.organizationId },
  });
  if (!existing) throw new AppError('Notice not found', 404);
  // Allowlist updatable fields so organizationId and counters
  // (impressions/acceptances/dismissals) cannot be overwritten by the caller.
  const { pick } = await import('../utils/pick');
  const updateData = pick(req.body, [
    'name', 'triggerContext', 'noticeContent', 'shortNotice', 'dataCollected',
    'purposes', 'legalBasis', 'retentionPeriod', 'thirdPartyRecipients',
    'dataSubjectRights', 'contactInfo', 'displayType', 'position', 'requiresAction',
    'version', 'language', 'translations', 'status',
  ]);
  const notice = await prisma.jITPrivacyNotice.update({
    where: { id: req.params.id },
    data: updateData,
  });
  return res.json(notice);
}));

// Delete privacy notice
router.delete('/notices/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const existing = await prisma.jITPrivacyNotice.findFirst({
    where: { id: req.params.id, organizationId: user.organizationId },
  });
  if (!existing) throw new AppError('Notice not found', 404);
  await prisma.jITPrivacyNotice.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Notice deleted' });
}));

// Track impression
router.post('/notices/:id/impression', idempotencyKey(), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const notice = await prisma.jITPrivacyNotice.findFirst({
    where: { id: req.params.id, organizationId: user.organizationId },
  });
  if (!notice) throw new AppError('Notice not found', 404);
  await prisma.jITPrivacyNotice.update({
    where: { id: req.params.id },
    data: { impressions: { increment: 1 } },
  });
  return res.json({ message: 'Impression tracked' });
}));

// Track acceptance
router.post('/notices/:id/accept', idempotencyKey(), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const notice = await prisma.jITPrivacyNotice.findFirst({
    where: { id: req.params.id, organizationId: user.organizationId },
  });
  if (!notice) throw new AppError('Notice not found', 404);
  await prisma.jITPrivacyNotice.update({
    where: { id: req.params.id },
    data: { acceptances: { increment: 1 } },
  });
  return res.json({ message: 'Acceptance tracked' });
}));

// Track dismissal
router.post('/notices/:id/dismiss', idempotencyKey(), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const notice = await prisma.jITPrivacyNotice.findFirst({
    where: { id: req.params.id, organizationId: user.organizationId },
  });
  if (!notice) throw new AppError('Notice not found', 404);
  await prisma.jITPrivacyNotice.update({
    where: { id: req.params.id },
    data: { dismissals: { increment: 1 } },
  });
  return res.json({ message: 'Dismissal tracked' });
}));

// Get notice by trigger context (for frontend consumption)
router.get('/notices/by-context/:context', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const notices = await prisma.jITPrivacyNotice.findMany({
    where: {
      organizationId: user.organizationId,
      triggerContext: req.params.context,
      status: 'Active',
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(notices);
}));

// ============================================================================
// CHILD CONSENT / AGE VERIFICATION (Art. 8)
// ============================================================================

// Get age verification configuration
router.get('/child-consent/config', asyncHandler(async (req: Request, res: Response) => {
  // Default age thresholds by jurisdiction
  const config = {
    defaultMinimumAge: 16,
    jurisdictions: {
      EU: 16,
      UK: 13,
      IE: 13,
      NL: 16,
      FR: 15,
      DE: 16,
      BE: 13,
      DK: 13,
      ES: 14,
      SE: 13,
      AT: 14,
      IT: 14,
      PT: 13,
      US_COPPA: 13,
    },
    verificationMethods: ['SelfDeclaration', 'IDVerification', 'ParentalConfirmation'],
    parentalConsentMethods: ['Email', 'InPerson', 'Phone', 'PostalMail'],
  };
  res.json(config);
}));

// Submit age verification for a consent record
router.post('/child-consent/verify-age', authorize('admin', 'editor'), validateBody(verifyAgeSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  const {
    consentRecordId,
    dataSubjectAge,
    jurisdiction,
    ageVerificationMethod,
    parentalConsentEmail,
    parentalConsentMethod,
  } = req.body;

  if (!consentRecordId || dataSubjectAge === undefined) {
    throw new AppError('consentRecordId and dataSubjectAge are required', 400);
  }

  // Determine minimum age for jurisdiction
  const jurisdictionAges: Record<string, number> = {
    EU: 16, UK: 13, IE: 13, NL: 16, FR: 15, DE: 16, BE: 13, DK: 13, ES: 14, SE: 13, AT: 14, IT: 14, PT: 13, US_COPPA: 13,
  };
  const minimumAge = jurisdictionAges[jurisdiction] || 16;
  const isMinor = dataSubjectAge < minimumAge;

  const record = await prisma.consentRecord.findFirst({
    where: { id: consentRecordId, organizationId: orgId },
  });
  if (!record) throw new AppError('Consent record not found', 404);

  const updateData: any = {
    dataSubjectAge,
    isMinor,
    ageVerificationMethod: ageVerificationMethod || 'SelfDeclaration',
  };

  if (isMinor) {
    updateData.parentalConsentGiven = false;
    updateData.parentalConsentEmail = parentalConsentEmail || null;
    updateData.parentalConsentMethod = parentalConsentMethod || null;
  }

  const updated = await prisma.consentRecord.update({
    where: { id: consentRecordId },
    data: updateData,
  });

  return res.json({
    ...updated,
    requiresParentalConsent: isMinor,
    minimumAge,
    jurisdiction: jurisdiction || 'EU',
  });
}));

// Record parental consent
router.post('/child-consent/parental-consent', authorize('admin', 'editor'), idempotencyKey(), validateBody(parentalConsentSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  const { consentRecordId, parentalConsentEmail, parentalConsentMethod } = req.body;

  if (!consentRecordId) {
    throw new AppError('consentRecordId is required', 400);
  }

  const record = await prisma.consentRecord.findFirst({
    where: { id: consentRecordId, organizationId: orgId, isMinor: true },
  });
  if (!record) throw new AppError('Minor consent record not found', 404);

  const updated = await prisma.consentRecord.update({
    where: { id: consentRecordId },
    data: {
      parentalConsentGiven: true,
      parentalConsentDate: new Date(),
      parentalConsentEmail: parentalConsentEmail || record.parentalConsentEmail,
      parentalConsentMethod: parentalConsentMethod || 'Email',
    },
  });

  logger.info(`Parental consent recorded for consent record ${consentRecordId}`);
  return res.json(updated);
}));

// Get minor consent records requiring parental consent
router.get('/child-consent/pending', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const orgId = user.organizationId;
  const { skip, take, page, limit } = paginate(req.query);

  const where = {
    organizationId: orgId,
    isMinor: true,
    parentalConsentGiven: false,
  };

  const [records, total] = await Promise.all([
    prisma.consentRecord.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.consentRecord.count({ where }),
  ]);

  res.json({ records, total, page, limit });
}));

export default router;
