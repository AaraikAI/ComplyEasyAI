/**
 * RoPA (Records of Processing Activities) Routes — GDPR Art. 30
 *
 * Endpoints for maintaining the register of processing activities,
 * periodic reviews, export in Art. 30 compliant format, and statistics.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createProcessingActivitySchema, updateProcessingActivitySchema,
} from '../validators/coreModulesSchemas';
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

/** Convert an array of records to CSV string */
function recordsToCSV(records: any[]): string {
  if (records.length === 0) return '';

  const headers = [
    'activityName',
    'activityDescription',
    'controllerName',
    'controllerContact',
    'processorName',
    'processorContact',
    'dpoContact',
    'purposes',
    'lawfulBasis',
    'legitimateInterestDetails',
    'dataCategories',
    'specialCategories',
    'dataSubjectCategories',
    'recipients',
    'internationalTransfers',
    'transferCountries',
    'transferSafeguards',
    'retentionPeriod',
    'retentionJustification',
    'technicalMeasures',
    'organizationalMeasures',
    'automatedDecisionMaking',
    'automatedDecisionDetails',
    'dpiaRequired',
    'dpiaReference',
    'status',
    'lastReviewDate',
    'nextReviewDate',
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((r) => headers.map((h) => escapeCSV(r[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

// ============================================================================
// STATISTICS (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/statistics',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    try {
      const records = await prisma.processingActivityRecord.findMany({
        where: { organizationId: orgId },
        select: {
          lawfulBasis: true,
          dataCategories: true,
          status: true,
          nextReviewDate: true,
        },
      });

      const now = new Date();
      const byLegalBasis: Record<string, number> = {};
      const dataCategoryCounts: Record<string, number> = {};
      let needsReview = 0;

      for (const r of records) {
        // Count by legal basis
        const basis = r.lawfulBasis || 'Unspecified';
        byLegalBasis[basis] = (byLegalBasis[basis] || 0) + 1;

        // Count data categories
        const cats = r.dataCategories || [];
        for (const cat of cats) {
          dataCategoryCounts[cat] = (dataCategoryCounts[cat] || 0) + 1;
        }

        // Records needing review
        if (r.nextReviewDate && new Date(r.nextReviewDate) < now) {
          needsReview++;
        }
      }

      res.json({
        total: records.length,
        byLegalBasis,
        dataCategoryCounts,
        needsReview,
        byStatus: records.reduce(
          (acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      });
    } catch (error) {
      logger.error('Error fetching RoPA statistics:', error);
      res.status(500).json({ error: 'Failed to fetch RoPA statistics' });
    }
  })
);

// ============================================================================
// EXPORT ALL RECORDS (Art. 30 Compliant)
// ============================================================================

router.get(
  '/export',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const format = (req.query.format as string) || 'json';

    try {
      const records = await prisma.processingActivityRecord.findMany({
        where: { organizationId: user.organizationId, status: { not: 'Archived' } },
        orderBy: { activityName: 'asc' },
      });

      if (format === 'csv') {
        const csv = recordsToCSV(records);
        res.setHeader('Content-Disposition', 'attachment; filename="ropa-export.csv"');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send(csv);
        return;
      }

      // JSON export — EDPB-aligned structure
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          format: 'GDPR Art. 30 Records of Processing Activities',
          version: '1.0',
          organizationId: user.organizationId,
          totalRecords: records.length,
        },
        processingActivities: records.map((r) => ({
          id: r.id,
          // Art. 30(1)(a) — Name and contact details of the controller
          controller: {
            name: r.controllerName,
            contactDetails: r.controllerContact,
            dpoContact: r.dpoContact,
          },
          // Art. 30(1)(a) — Processor details if applicable
          processor: {
            name: r.processorName,
            contactDetails: r.processorContact,
          },
          // Art. 30(1)(b) — Purposes of the processing
          purposes: r.purposes,
          lawfulBasis: r.lawfulBasis,
          legitimateInterestDetails: r.legitimateInterestDetails,
          // Activity details
          activityName: r.activityName,
          activityDescription: r.activityDescription,
          // Art. 30(1)(c) — Categories of data subjects and personal data
          dataSubjectCategories: r.dataSubjectCategories,
          dataCategories: r.dataCategories,
          specialCategories: r.specialCategories,
          // Art. 30(1)(d) — Categories of recipients
          recipients: r.recipients,
          // Art. 30(1)(e) — Transfers to third countries
          internationalTransfers: r.internationalTransfers,
          transferCountries: r.transferCountries,
          transferSafeguards: r.transferSafeguards,
          // Art. 30(1)(f) — Envisaged time limits for erasure
          retentionPeriod: r.retentionPeriod,
          retentionJustification: r.retentionJustification,
          // Art. 30(1)(g) — Technical and organisational security measures
          technicalMeasures: r.technicalMeasures,
          organizationalMeasures: r.organizationalMeasures,
          // Additional fields
          automatedDecisionMaking: r.automatedDecisionMaking,
          automatedDecisionDetails: r.automatedDecisionDetails,
          dpiaRequired: r.dpiaRequired,
          dpiaReference: r.dpiaReference,
          // Review status
          status: r.status,
          lastReviewDate: r.lastReviewDate,
          nextReviewDate: r.nextReviewDate,
        })),
      };

      res.setHeader('Content-Disposition', 'attachment; filename="ropa-export.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
    } catch (error) {
      logger.error('Error exporting RoPA records:', error);
      res.status(500).json({ error: 'Failed to export RoPA records' });
    }
  })
);

// ============================================================================
// LIST PROCESSING ACTIVITY RECORDS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const status = req.query.status as string | undefined;
    const legalBasis = req.query.legalBasis as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status;
      if (legalBasis) where.lawfulBasis = legalBasis;

      const [records, total] = await Promise.all([
        prisma.processingActivityRecord.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.processingActivityRecord.count({ where }),
      ]);

      res.json({ records, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      logger.error('Error fetching RoPA records:', error);
      res.status(500).json({ error: 'Failed to fetch RoPA records' });
    }
  })
);

// ============================================================================
// CREATE PROCESSING ACTIVITY RECORD
// ============================================================================

router.post(
  '/',
  validateBody(createProcessingActivitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        activityName,
        activityDescription,
        controllerName,
        controllerContact,
        processorName,
        processorContact,
        dpoContact,
        purposes,
        lawfulBasis,
        legitimateInterestDetails,
        dataCategories,
        specialCategories,
        dataSubjectCategories,
        recipients,
        internationalTransfers,
        transferCountries,
        transferSafeguards,
        retentionPeriod,
        retentionJustification,
        technicalMeasures,
        organizationalMeasures,
        automatedDecisionMaking,
        automatedDecisionDetails,
        dpiaRequired,
        dpiaReference,
      } = req.body;

      if (!activityName || !lawfulBasis) {
        res.status(400).json({ error: 'activityName and lawfulBasis are required' });
        return;
      }

      // Calculate next review date (12 months from now)
      const nextReviewDate = new Date();
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 12);

      const record = await prisma.processingActivityRecord.create({
        data: {
          organizationId: user.organizationId,
          activityName,
          activityDescription: activityDescription || null,
          controllerName: controllerName || null,
          controllerContact: controllerContact || null,
          processorName: processorName || null,
          processorContact: processorContact || null,
          dpoContact: dpoContact || null,
          purposes: purposes || [],
          lawfulBasis,
          legitimateInterestDetails: legitimateInterestDetails || null,
          dataCategories: dataCategories || [],
          specialCategories: specialCategories || [],
          dataSubjectCategories: dataSubjectCategories || [],
          recipients: recipients || [],
          internationalTransfers: internationalTransfers || false,
          transferCountries: transferCountries || [],
          transferSafeguards: transferSafeguards || null,
          retentionPeriod: retentionPeriod || null,
          retentionJustification: retentionJustification || null,
          technicalMeasures: technicalMeasures || [],
          organizationalMeasures: organizationalMeasures || [],
          automatedDecisionMaking: automatedDecisionMaking || false,
          automatedDecisionDetails: automatedDecisionDetails || null,
          dpiaRequired: dpiaRequired || false,
          dpiaReference: dpiaReference || null,
          status: 'Active',
          lastReviewDate: new Date(),
          nextReviewDate,
          createdBy: user.id,
        },
      });

      res.status(201).json(record);
    } catch (error) {
      logger.error('Error creating RoPA record:', error);
      res.status(500).json({ error: 'Failed to create RoPA record' });
    }
  })
);

// ============================================================================
// GET RECORD BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const record = await prisma.processingActivityRecord.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!record) {
        res.status(404).json({ error: 'Processing activity record not found' });
        return;
      }

      res.json(record);
    } catch (error) {
      logger.error('Error fetching RoPA record:', error);
      res.status(500).json({ error: 'Failed to fetch RoPA record' });
    }
  })
);

// ============================================================================
// UPDATE RECORD
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateProcessingActivitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.processingActivityRecord.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Processing activity record not found' });
        return;
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'activityName', 'activityDescription', 'controllerName', 'controllerContact',
        'processorName', 'processorContact', 'dpoContact', 'purposes', 'lawfulBasis',
        'legitimateInterestDetails', 'dataCategories', 'specialCategories',
        'dataSubjectCategories', 'recipients', 'internationalTransfers',
        'transferCountries', 'transferSafeguards', 'retentionPeriod',
        'retentionJustification', 'technicalMeasures', 'organizationalMeasures',
        'automatedDecisionMaking', 'automatedDecisionDetails', 'dpiaRequired',
        'dpiaReference', 'status', 'nextReviewDate',
      ]);

      // Automatically update lastReviewDate on any edit
      updateData.lastReviewDate = new Date();

      const record = await prisma.processingActivityRecord.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(record);
    } catch (error) {
      logger.error('Error updating RoPA record:', error);
      res.status(500).json({ error: 'Failed to update RoPA record' });
    }
  })
);

// ============================================================================
// ARCHIVE RECORD (Soft Delete)
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.processingActivityRecord.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Processing activity record not found' });
        return;
      }

      const record = await prisma.processingActivityRecord.update({
        where: { id: req.params.id },
        data: { status: 'Archived' },
      });

      res.json({ message: 'Processing activity record archived', id: record.id });
    } catch (error) {
      logger.error('Error archiving RoPA record:', error);
      res.status(500).json({ error: 'Failed to archive RoPA record' });
    }
  })
);

// ============================================================================
// MARK AS REVIEWED
// ============================================================================

router.post(
  '/:id/review',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.processingActivityRecord.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Processing activity record not found' });
        return;
      }

      const now = new Date();
      const nextReviewDate = new Date(now);
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 12);

      const record = await prisma.processingActivityRecord.update({
        where: { id: req.params.id },
        data: {
          lastReviewDate: now,
          nextReviewDate,
          status: 'Active',
        },
      });

      res.json(record);
    } catch (error) {
      logger.error('Error marking RoPA record as reviewed:', error);
      res.status(500).json({ error: 'Failed to mark record as reviewed' });
    }
  })
);

export default router;
