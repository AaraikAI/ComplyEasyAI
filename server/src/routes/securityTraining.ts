/**
 * Security Training Management Routes — SOC 2 CC1.4
 *
 * Endpoints for managing training modules, assigning training to users,
 * tracking completion, and generating compliance reports.
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
// COMPLIANCE REPORT (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/compliance-report',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      const now = new Date();

      const [trainings, records, orgUsers] = await Promise.all([
        prisma.securityTraining.findMany({
          where: { organizationId: orgId, status: 'Active' },
          select: { id: true, title: true, category: true, isRequired: true, passingScore: true },
        }),
        prisma.securityTrainingRecord.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            trainingId: true,
            userId: true,
            status: true,
            score: true,
            expiresAt: true,
            completedAt: true,
          },
        }),
        prisma.user.count({
          where: { organizationId: orgId, active: true },
        }),
      ]);

      const totalTrainings = trainings.length;
      const assignedCount = records.length;
      const completedCount = records.filter((r) => r.status === 'Completed').length;
      const failedCount = records.filter((r) => r.status === 'Failed').length;
      const overdueCount = records.filter(
        (r) =>
          r.expiresAt &&
          new Date(r.expiresAt) < now &&
          r.status !== 'Completed' &&
          r.status !== 'Failed'
      ).length;

      const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

      // Average score for completed records
      const completedWithScores = records.filter((r) => r.status === 'Completed' && r.score !== null);
      const averageScore =
        completedWithScores.length > 0
          ? Math.round(
              (completedWithScores.reduce((sum, r) => sum + (r.score || 0), 0) /
                completedWithScores.length) *
                100
            ) / 100
          : 0;

      // Per-category breakdown
      const categoryBreakdown: Record<
        string,
        { total: number; assigned: number; completed: number; failed: number; averageScore: number }
      > = {};

      for (const training of trainings) {
        if (!categoryBreakdown[training.category]) {
          categoryBreakdown[training.category] = {
            total: 0,
            assigned: 0,
            completed: 0,
            failed: 0,
            averageScore: 0,
          };
        }
        categoryBreakdown[training.category].total++;

        const trainingRecords = records.filter((r) => r.trainingId === training.id);
        categoryBreakdown[training.category].assigned += trainingRecords.length;
        categoryBreakdown[training.category].completed += trainingRecords.filter(
          (r) => r.status === 'Completed'
        ).length;
        categoryBreakdown[training.category].failed += trainingRecords.filter(
          (r) => r.status === 'Failed'
        ).length;

        const catCompleted = trainingRecords.filter(
          (r) => r.status === 'Completed' && r.score !== null
        );
        if (catCompleted.length > 0) {
          categoryBreakdown[training.category].averageScore =
            Math.round(
              (catCompleted.reduce((sum, r) => sum + (r.score || 0), 0) / catCompleted.length) * 100
            ) / 100;
        }
      }

      res.json({
        reportDate: now.toISOString(),
        totalUsers: orgUsers,
        totalTrainings,
        assignedCount,
        completedCount,
        failedCount,
        overdueCount,
        completionRate,
        averageScore,
        categoryBreakdown,
      });
    } catch (error) {
      logger.error('Error generating training compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  })
);

// ============================================================================
// LIST TRAINING RECORDS (before /:id)
// ============================================================================

router.get(
  '/records',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const status = req.query.status as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };
      if (status) where.status = status;

      const [records, total] = await Promise.all([
        prisma.securityTrainingRecord.findMany({
          where,
          orderBy: { assignedAt: 'desc' },
          skip,
          take,
          include: {
            training: { select: { title: true, category: true, passingScore: true } },
          },
        }),
        prisma.securityTrainingRecord.count({ where }),
      ]);

      // Enrich with user details
      const userIds = [...new Set(records.map((r) => r.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, department: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const enrichedRecords = records.map((r) => ({
        ...r,
        user: userMap.get(r.userId) || { id: r.userId, name: 'Unknown', email: '' },
      }));

      res.json({
        records: enrichedRecords,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error('Error fetching training records:', error);
      res.status(500).json({ error: 'Failed to fetch training records' });
    }
  })
);

// ============================================================================
// GET USER TRAINING RECORDS
// ============================================================================

router.get(
  '/user/:userId/records',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const records = await prisma.securityTrainingRecord.findMany({
        where: {
          organizationId: user.organizationId,
          userId: req.params.userId,
        },
        orderBy: { assignedAt: 'desc' },
        include: {
          training: {
            select: { title: true, category: true, passingScore: true, duration: true },
          },
        },
      });

      res.json({ records, total: records.length });
    } catch (error) {
      logger.error('Error fetching user training records:', error);
      res.status(500).json({ error: 'Failed to fetch user training records' });
    }
  })
);

// ============================================================================
// LIST TRAINING MODULES
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };
      if (category) where.category = category;
      if (status) where.status = status;

      const [modules, total] = await Promise.all([
        prisma.securityTraining.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: { _count: { select: { records: true } } },
        }),
        prisma.securityTraining.count({ where }),
      ]);

      res.json({ modules, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('Security training table not yet available, returning empty data');
        return res.json({ modules: [], total: 0, page, limit, totalPages: 0 });
      }
      logger.error('Error fetching training modules:', error);
      res.status(500).json({ error: 'Failed to fetch training modules' });
    }
  })
);

// ============================================================================
// CREATE TRAINING MODULE (Admin only)
// ============================================================================

router.post(
  '/',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        title,
        description,
        category,
        content,
        contentType,
        duration,
        passingScore,
        maxAttempts,
        isRequired,
        recurrence,
        validityPeriod,
      } = req.body;

      if (!title || !category) {
        res.status(400).json({ error: 'title and category are required' });
        return;
      }

      const validCategories = [
        'SecurityAwareness',
        'DataPrivacy',
        'IncidentResponse',
        'PhishingPrevention',
        'ComplianceRegulatory',
        'SecureCoding',
        // Also accept user-specified names from the spec
        'GDPR',
        'DataHandling',
        'AccessControl',
      ];
      if (!validCategories.includes(category)) {
        res.status(400).json({
          error: `category must be one of: ${validCategories.join(', ')}`,
        });
        return;
      }

      const training = await prisma.securityTraining.create({
        data: {
          organizationId: user.organizationId,
          title,
          description: description || null,
          category,
          content: content || null,
          contentType: contentType || 'Document',
          duration: duration || null,
          passingScore: passingScore ?? 80,
          maxAttempts: maxAttempts ?? 3,
          isRequired: isRequired ?? true,
          recurrence: recurrence || 'Annual',
          validityPeriod: validityPeriod ?? 365,
          status: 'Active',
          createdBy: user.id,
        },
      });

      res.status(201).json(training);
    } catch (error) {
      logger.error('Error creating training module:', error);
      res.status(500).json({ error: 'Failed to create training module' });
    }
  })
);

// ============================================================================
// GET TRAINING MODULE BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const training = await prisma.securityTraining.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          _count: {
            select: { records: true },
          },
        },
      });

      if (!training) {
        res.status(404).json({ error: 'Training module not found' });
        return;
      }

      // Get status breakdown for this training
      const statusCounts = await prisma.securityTrainingRecord.groupBy({
        by: ['status'],
        where: { trainingId: training.id, organizationId: user.organizationId },
        _count: { id: true },
      });

      res.json({
        ...training,
        statusBreakdown: statusCounts.reduce(
          (acc, s) => {
            acc[s.status] = s._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      });
    } catch (error) {
      logger.error('Error fetching training module:', error);
      res.status(500).json({ error: 'Failed to fetch training module' });
    }
  })
);

// ============================================================================
// UPDATE TRAINING MODULE (Admin only)
// ============================================================================

router.patch(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.securityTraining.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Training module not found' });
        return;
      }

      const { id, organizationId, createdAt, createdBy, ...updateData } = req.body;

      const training = await prisma.securityTraining.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(training);
    } catch (error) {
      logger.error('Error updating training module:', error);
      res.status(500).json({ error: 'Failed to update training module' });
    }
  })
);

// ============================================================================
// ARCHIVE TRAINING MODULE (Admin only)
// ============================================================================

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.securityTraining.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Training module not found' });
        return;
      }

      const training = await prisma.securityTraining.update({
        where: { id: req.params.id },
        data: { status: 'Archived' },
      });

      res.json({ message: 'Training module archived', id: training.id });
    } catch (error) {
      logger.error('Error archiving training module:', error);
      res.status(500).json({ error: 'Failed to archive training module' });
    }
  })
);

// ============================================================================
// ASSIGN TRAINING TO SPECIFIC USERS
// ============================================================================

router.post(
  '/:id/assign',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const training = await prisma.securityTraining.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId, status: 'Active' },
      });

      if (!training) {
        res.status(404).json({ error: 'Training module not found or not active' });
        return;
      }

      const { userIds, dueDate } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ error: 'userIds array is required' });
        return;
      }

      // Calculate expiry date based on training validity period
      const expiresAt = dueDate
        ? new Date(dueDate)
        : new Date(Date.now() + training.validityPeriod * 24 * 60 * 60 * 1000);

      // Verify all users belong to the org
      const orgUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, organizationId: user.organizationId, active: true },
        select: { id: true },
      });
      const validUserIds = orgUsers.map((u) => u.id);

      if (validUserIds.length === 0) {
        res.status(400).json({ error: 'No valid users found in organization' });
        return;
      }

      // Create records, skipping duplicates via upsert
      const results = await Promise.allSettled(
        validUserIds.map((userId) =>
          prisma.securityTrainingRecord.upsert({
            where: {
              trainingId_userId: { trainingId: training.id, userId },
            },
            update: {
              expiresAt,
            },
            create: {
              organizationId: user.organizationId,
              trainingId: training.id,
              userId,
              status: 'Assigned',
              expiresAt,
            },
          })
        )
      );

      const created = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      res.status(201).json({
        message: `Training assigned to ${created} users`,
        created,
        failed,
        skippedInvalidUsers: userIds.length - validUserIds.length,
      });
    } catch (error) {
      logger.error('Error assigning training:', error);
      res.status(500).json({ error: 'Failed to assign training' });
    }
  })
);

// ============================================================================
// ASSIGN TRAINING TO ALL USERS IN ORG
// ============================================================================

router.post(
  '/:id/assign-all',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const training = await prisma.securityTraining.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId, status: 'Active' },
      });

      if (!training) {
        res.status(404).json({ error: 'Training module not found or not active' });
        return;
      }

      const { dueDate } = req.body;
      const expiresAt = dueDate
        ? new Date(dueDate)
        : new Date(Date.now() + training.validityPeriod * 24 * 60 * 60 * 1000);

      const orgUsers = await prisma.user.findMany({
        where: { organizationId: user.organizationId, active: true },
        select: { id: true },
      });

      const results = await Promise.allSettled(
        orgUsers.map((u) =>
          prisma.securityTrainingRecord.upsert({
            where: {
              trainingId_userId: { trainingId: training.id, userId: u.id },
            },
            update: {
              expiresAt,
            },
            create: {
              organizationId: user.organizationId,
              trainingId: training.id,
              userId: u.id,
              status: 'Assigned',
              expiresAt,
            },
          })
        )
      );

      const created = results.filter((r) => r.status === 'fulfilled').length;

      res.status(201).json({
        message: `Training assigned to all ${created} users in organization`,
        totalUsers: orgUsers.length,
        assigned: created,
      });
    } catch (error) {
      logger.error('Error assigning training to all users:', error);
      res.status(500).json({ error: 'Failed to assign training to all users' });
    }
  })
);

// ============================================================================
// UPDATE TRAINING RECORD (Start/Complete)
// ============================================================================

router.patch(
  '/records/:recordId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const record = await prisma.securityTrainingRecord.findFirst({
        where: { id: req.params.recordId, organizationId: user.organizationId },
        include: { training: { select: { passingScore: true, maxAttempts: true } } },
      });

      if (!record) {
        res.status(404).json({ error: 'Training record not found' });
        return;
      }

      const { action, score } = req.body;
      const updateData: any = {};

      if (action === 'start') {
        updateData.startedAt = new Date();
        updateData.status = 'InProgress';
        updateData.attempts = { increment: 1 };
      } else if (action === 'complete') {
        if (score === undefined || score === null) {
          res.status(400).json({ error: 'score is required when completing training' });
          return;
        }

        const passingScore = record.training.passingScore;
        const passed = score >= passingScore;

        updateData.completedAt = new Date();
        updateData.score = score;
        updateData.status = passed ? 'Completed' : 'Failed';
      } else {
        // Generic update — allow setting status, notes, etc.
        const { id, organizationId, trainingId, userId, createdAt, ...safeData } = req.body;
        Object.assign(updateData, safeData);
      }

      const updated = await prisma.securityTrainingRecord.update({
        where: { id: req.params.recordId },
        data: updateData,
      });

      res.json(updated);
    } catch (error) {
      logger.error('Error updating training record:', error);
      res.status(500).json({ error: 'Failed to update training record' });
    }
  })
);

export default router;
