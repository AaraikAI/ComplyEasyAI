/**
 * Evidence Auto-Collection Rules Routes
 *
 * Endpoints for managing automated evidence collection rules,
 * triggering manual collections, and viewing collection status.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createEvidenceCollectionRuleSchema, updateEvidenceCollectionRuleSchema,
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

const VALID_SOURCE_TYPES = [
  'AWS_CONFIG',
  'AZURE_POLICY',
  'GITHUB_ACTIONS',
  'JIRA_TICKETS',
  'SLACK_MESSAGES',
  'GOOGLE_DRIVE',
  'CLOUDTRAIL_LOGS',
  'VULNERABILITY_SCAN',
  'PENETRATION_TEST',
  'ACCESS_REVIEW',
  'TRAINING_RECORDS',
  'MANUAL_UPLOAD',
];

// ============================================================================
// COLLECTION STATUS DASHBOARD (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const rules = await prisma.evidenceCollectionRule.findMany({
        where: { organizationId: orgId },
      });

      const statusData = rules.map((rule) => {
        const isOverdue =
          rule.schedule &&
          rule.lastCollectedAt &&
          new Date().getTime() - new Date(rule.lastCollectedAt).getTime() > 7 * 24 * 60 * 60 * 1000; // 7 days threshold

        return {
          id: rule.id,
          controlId: rule.controlId,
          sourceType: rule.sourceType,
          isActive: rule.isActive,
          schedule: rule.schedule,
          lastCollectedAt: rule.lastCollectedAt,
          isOverdue: !!isOverdue,
          status: !rule.isActive
            ? 'inactive'
            : !rule.lastCollectedAt
              ? 'never_collected'
              : isOverdue
                ? 'overdue'
                : 'healthy',
        };
      });

      const summary = {
        totalRules: rules.length,
        activeRules: rules.filter((r) => r.isActive).length,
        inactiveRules: rules.filter((r) => !r.isActive).length,
        neverCollected: statusData.filter((s) => s.status === 'never_collected').length,
        overdue: statusData.filter((s) => s.status === 'overdue').length,
        healthy: statusData.filter((s) => s.status === 'healthy').length,
      };

      res.json({
        status: 'success',
        data: { summary, rules: statusData },
      });
    } catch (error) {
      logger.error('Error fetching collection status:', error);
      res.status(500).json({ error: 'Failed to fetch collection status' });
    }
  })
);

// ============================================================================
// LIST COLLECTION RULES
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const sourceType = req.query.sourceType as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const controlId = req.query.controlId as string | undefined;

    try {
      const where: any = { organizationId: orgId };

      if (sourceType) {
        where.sourceType = sourceType;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      if (controlId) {
        where.controlId = controlId;
      }

      const [rules, total] = await Promise.all([
        prisma.evidenceCollectionRule.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.evidenceCollectionRule.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          rules,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing collection rules:', error);
      res.status(500).json({ error: 'Failed to list collection rules' });
    }
  })
);

// ============================================================================
// GET COLLECTION RULE BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const rule = await prisma.evidenceCollectionRule.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!rule) {
        res.status(404).json({ error: 'Collection rule not found' });
        return;
      }

      res.json({ status: 'success', data: rule });
    } catch (error) {
      logger.error('Error fetching collection rule:', error);
      res.status(500).json({ error: 'Failed to fetch collection rule' });
    }
  })
);

// ============================================================================
// CREATE COLLECTION RULE
// ============================================================================

router.post(
  '/',
  validateBody(createEvidenceCollectionRuleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const { controlId, sourceType, integrationId, query, schedule, isActive } = req.body;

      if (!controlId || !sourceType) {
        res.status(400).json({ error: 'controlId and sourceType are required' });
        return;
      }

      if (!VALID_SOURCE_TYPES.includes(sourceType)) {
        res.status(400).json({
          error: `sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}`,
        });
        return;
      }

      // Check for duplicate rule on same control + source
      const existing = await prisma.evidenceCollectionRule.findFirst({
        where: { organizationId: orgId, controlId, sourceType },
      });

      if (existing) {
        res.status(409).json({
          error: 'A collection rule already exists for this control and source type',
          existingRuleId: existing.id,
        });
        return;
      }

      const rule = await prisma.evidenceCollectionRule.create({
        data: {
          organizationId: orgId,
          controlId,
          sourceType,
          integrationId: integrationId || null,
          query: query || null,
          schedule: schedule || null,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      res.status(201).json({ status: 'success', data: rule });
    } catch (error) {
      logger.error('Error creating collection rule:', error);
      res.status(500).json({ error: 'Failed to create collection rule' });
    }
  })
);

// ============================================================================
// UPDATE COLLECTION RULE
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateEvidenceCollectionRuleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.evidenceCollectionRule.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Collection rule not found' });
        return;
      }

      const { sourceType, integrationId, query, schedule, isActive, controlId } = req.body;
      const updateData: any = {};

      if (sourceType !== undefined) {
        if (!VALID_SOURCE_TYPES.includes(sourceType)) {
          res.status(400).json({
            error: `sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}`,
          });
          return;
        }
        updateData.sourceType = sourceType;
      }

      if (integrationId !== undefined) updateData.integrationId = integrationId;
      if (query !== undefined) updateData.query = query;
      if (schedule !== undefined) updateData.schedule = schedule;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (controlId !== undefined) updateData.controlId = controlId;

      const rule = await prisma.evidenceCollectionRule.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: rule });
    } catch (error) {
      logger.error('Error updating collection rule:', error);
      res.status(500).json({ error: 'Failed to update collection rule' });
    }
  })
);

// ============================================================================
// DELETE COLLECTION RULE
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.evidenceCollectionRule.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Collection rule not found' });
        return;
      }

      await prisma.evidenceCollectionRule.delete({
        where: { id: req.params.id },
      });

      res.json({
        status: 'success',
        data: { message: 'Collection rule deleted', id: req.params.id },
      });
    } catch (error) {
      logger.error('Error deleting collection rule:', error);
      res.status(500).json({ error: 'Failed to delete collection rule' });
    }
  })
);

// ============================================================================
// MANUALLY TRIGGER COLLECTION
// ============================================================================

router.post(
  '/:id/trigger',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const rule = await prisma.evidenceCollectionRule.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!rule) {
        res.status(404).json({ error: 'Collection rule not found' });
        return;
      }

      if (!rule.isActive) {
        res.status(400).json({ error: 'Cannot trigger an inactive collection rule' });
        return;
      }

      // Update lastCollectedAt to mark the trigger
      const updated = await prisma.evidenceCollectionRule.update({
        where: { id: req.params.id },
        data: { lastCollectedAt: new Date() },
      });

      logger.info(
        `Manual evidence collection triggered for rule ${rule.id} (source: ${rule.sourceType}, control: ${rule.controlId}) by user ${userId}`
      );

      res.json({
        status: 'success',
        data: {
          message: 'Evidence collection triggered',
          rule: updated,
          triggeredBy: userId,
          triggeredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error triggering collection:', error);
      res.status(500).json({ error: 'Failed to trigger collection' });
    }
  })
);

export default router;
