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
// COMPLETENESS SUMMARY: per-framework readiness (used by AI Evidence
// Completeness Checker component). Aggregates control-level evidence
// stats across all enabled frameworks for this organization.
// ============================================================================

const EVIDENCE_STALE_DAYS = 90;

router.get(
  '/completeness',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId: orgId },
        include: {
          controls: {
            include: {
              evidenceVersions: {
                orderBy: { uploadedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - EVIDENCE_STALE_DAYS);

      const readiness = frameworks.map((fw) => {
        const totalControls = fw.controls.length;
        let evidenceComplete = 0;
        let evidenceCurrent = 0;
        let evidenceVerified = 0;
        let evidenceMatched = 0;
        let evidenceMissing = 0;
        let evidenceStale = 0;
        let evidenceUnverified = 0;
        let evidenceMismatched = 0;

        for (const ctrl of fw.controls) {
          const latest = ctrl.evidenceVersions[0] || null;
          const hasEvidence = !!latest || !!ctrl.evidence;
          const isImplemented =
            ctrl.status === 'Implemented' || ctrl.status === 'Compliant';
          const isVerified = ctrl.status === 'Implemented' || ctrl.status === 'Compliant';
          const isFresh =
            latest && new Date(latest.uploadedAt) >= staleThreshold;

          if (hasEvidence) {
            evidenceComplete++;
            if (isFresh) evidenceCurrent++;
            else if (latest) evidenceStale++;
            if (isVerified) evidenceVerified++;
            else evidenceUnverified++;
            if (isImplemented) evidenceMatched++;
            else evidenceMismatched++;
          } else if (ctrl.evidenceRequired) {
            evidenceMissing++;
          }
        }

        const overallScore =
          totalControls > 0
            ? Math.round((evidenceComplete / totalControls) * 100)
            : 0;
        const status: 'ready' | 'at-risk' | 'not-ready' =
          overallScore >= 80 ? 'ready' : overallScore >= 60 ? 'at-risk' : 'not-ready';

        return {
          id: fw.id,
          name: fw.name,
          overallScore,
          totalControls,
          evidenceComplete,
          evidenceCurrent,
          evidenceVerified,
          evidenceMatched,
          evidenceMissing,
          evidenceStale,
          evidenceUnverified,
          evidenceMismatched,
          lastScanned: fw.updatedAt.toISOString(),
          status,
        };
      });

      res.json({ status: 'success', data: { readiness } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching evidence completeness:', error);
      throw new AppError('Failed to fetch evidence completeness', 500);
    }
  })
);

// ============================================================================
// EVIDENCE GAPS: per-control gaps for a framework (or all frameworks)
// ============================================================================

router.get(
  '/gaps',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const frameworkId = req.query.frameworkId as string | undefined;

    try {
      const where: any = { organizationId: orgId };
      if (frameworkId) where.id = frameworkId;

      const frameworks = await prisma.complianceFramework.findMany({
        where,
        include: {
          controls: {
            include: {
              evidenceVersions: {
                orderBy: { uploadedAt: 'desc' },
                take: 1,
              },
              owner: { select: { name: true, email: true } },
            },
          },
        },
      });

      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - EVIDENCE_STALE_DAYS);

      type GapType = 'missing' | 'stale' | 'unverified' | 'mismatched' | 'incomplete';
      type Severity = 'critical' | 'high' | 'medium' | 'low';

      const gaps: Array<{
        id: string;
        controlId: string;
        controlName: string;
        framework: string;
        gapType: GapType;
        severity: Severity;
        description: string;
        currentEvidence?: string;
        lastUpdated?: string;
        daysStale?: number;
        aiSuggestion: string;
        suggestedEvidence: string[];
        estimatedEffort: string;
        controlOwner: string;
      }> = [];

      for (const fw of frameworks) {
        for (const ctrl of fw.controls) {
          const latest = ctrl.evidenceVersions[0] || null;
          const hasEvidence = !!latest || !!ctrl.evidence;
          const isVerified = ctrl.status === 'Implemented' || ctrl.status === 'Compliant';
          const ownerName = ctrl.owner?.name || 'Unassigned';

          if (ctrl.evidenceRequired && !hasEvidence) {
            gaps.push({
              id: `${ctrl.id}-missing`,
              controlId: ctrl.id,
              controlName: ctrl.name,
              framework: fw.name,
              gapType: 'missing',
              severity: 'critical',
              description: `Evidence required for ${ctrl.name} but none uploaded.`,
              aiSuggestion: `Upload the required evidence artifact for ${ctrl.name}.`,
              suggestedEvidence: ['Required attestation', 'Configuration export', 'Recent audit log'],
              estimatedEffort: '2 hours',
              controlOwner: ownerName,
            });
            continue;
          }

          if (latest && new Date(latest.uploadedAt) < staleThreshold) {
            const days = Math.floor(
              (Date.now() - new Date(latest.uploadedAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            gaps.push({
              id: `${ctrl.id}-stale`,
              controlId: ctrl.id,
              controlName: ctrl.name,
              framework: fw.name,
              gapType: 'stale',
              severity: days > 180 ? 'critical' : 'high',
              description: `Evidence is ${days} days old; refresh required.`,
              currentEvidence: latest.fileName || `Version ${latest.versionNumber}`,
              lastUpdated: latest.uploadedAt.toISOString().split('T')[0],
              daysStale: days,
              aiSuggestion: `Re-collect a current snapshot for ${ctrl.name}.`,
              suggestedEvidence: ['Updated configuration export', 'Recent monitoring report', 'Current attestation'],
              estimatedEffort: '3 hours',
              controlOwner: ownerName,
            });
            continue;
          }

          if (hasEvidence && !isVerified) {
            gaps.push({
              id: `${ctrl.id}-unverified`,
              controlId: ctrl.id,
              controlName: ctrl.name,
              framework: fw.name,
              gapType: 'unverified',
              severity: 'medium',
              description: `Evidence present but control status is "${ctrl.status}" (not verified).`,
              currentEvidence: ctrl.evidence || latest?.fileName || undefined,
              lastUpdated: latest?.uploadedAt.toISOString().split('T')[0],
              aiSuggestion: `Verify the existing evidence against control requirements and update status.`,
              suggestedEvidence: ['Review report', 'Verification checklist'],
              estimatedEffort: '4 hours',
              controlOwner: ownerName,
            });
          }
        }
      }

      // Severity-sort
      const sevOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      gaps.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

      res.json({ status: 'success', data: { gaps } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching evidence gaps:', error);
      throw new AppError('Failed to fetch evidence gaps', 500);
    }
  })
);

// ============================================================================
// RECOMMENDATIONS: derived rule-based suggestions to close gaps
// ============================================================================

router.get(
  '/recommendations',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId: orgId },
        include: {
          controls: {
            include: {
              evidenceVersions: { orderBy: { uploadedAt: 'desc' }, take: 1 },
            },
          },
        },
      });

      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - EVIDENCE_STALE_DAYS);

      let missingCount = 0;
      let staleCount = 0;
      let unverifiedCount = 0;
      let totalControls = 0;

      for (const fw of frameworks) {
        for (const ctrl of fw.controls) {
          totalControls++;
          const latest = ctrl.evidenceVersions[0] || null;
          const hasEvidence = !!latest || !!ctrl.evidence;
          if (ctrl.evidenceRequired && !hasEvidence) missingCount++;
          else if (latest && new Date(latest.uploadedAt) < staleThreshold) staleCount++;
          else if (
            hasEvidence &&
            !(ctrl.status === 'Implemented' || ctrl.status === 'Compliant')
          )
            unverifiedCount++;
        }
      }

      const recommendations: Array<{
        id: string;
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        effort: 'high' | 'medium' | 'low';
        affectedControls: number;
        scoreImprovement: number;
        category: string;
        priority: number;
        steps: string[];
      }> = [];

      let priority = 1;

      if (missingCount > 0) {
        recommendations.push({
          id: 'REC-MISSING',
          title: 'Collect Missing Required Evidence',
          description: `${missingCount} controls require evidence but none has been uploaded. Closing these gaps will significantly improve your audit readiness.`,
          impact: 'high',
          effort: missingCount > 20 ? 'high' : 'medium',
          affectedControls: missingCount,
          scoreImprovement: Math.min(
            30,
            totalControls > 0 ? Math.round((missingCount / totalControls) * 100 * 0.5) : 0
          ),
          category: 'Critical Gap',
          priority: priority++,
          steps: [
            'Filter the gaps view to "Missing" evidence type',
            'Assign control owners to each gap',
            'Upload required evidence artifacts',
            'Verify evidence meets control requirements',
          ],
        });
      }

      if (staleCount > 0) {
        recommendations.push({
          id: 'REC-STALE',
          title: 'Refresh Stale Evidence',
          description: `${staleCount} controls have evidence older than ${EVIDENCE_STALE_DAYS} days. Auditors typically require evidence from the audit period.`,
          impact: 'high',
          effort: 'medium',
          affectedControls: staleCount,
          scoreImprovement: Math.min(
            20,
            totalControls > 0 ? Math.round((staleCount / totalControls) * 100 * 0.3) : 0
          ),
          category: 'Refresh Required',
          priority: priority++,
          steps: [
            'Identify the stale evidence items',
            'Generate fresh evidence exports from source systems',
            'Re-upload the evidence to the control',
            'Set up recurring evidence collection schedule',
          ],
        });
      }

      if (unverifiedCount > 0) {
        recommendations.push({
          id: 'REC-UNVERIFIED',
          title: 'Verify Existing Evidence',
          description: `${unverifiedCount} controls have evidence but the control status is not yet verified.`,
          impact: 'medium',
          effort: 'low',
          affectedControls: unverifiedCount,
          scoreImprovement: Math.min(
            10,
            totalControls > 0 ? Math.round((unverifiedCount / totalControls) * 100 * 0.2) : 0
          ),
          category: 'Process Improvement',
          priority: priority++,
          steps: [
            'Review evidence against control requirements',
            'Document verification outcomes',
            'Update control status to Implemented / Compliant',
          ],
        });
      }

      // Always include automation recommendation
      recommendations.push({
        id: 'REC-AUTOMATION',
        title: 'Enable Automated Evidence Collection',
        description:
          'Configure scheduled evidence collection rules to keep evidence fresh and reduce manual effort.',
        impact: 'medium',
        effort: 'medium',
        affectedControls: totalControls,
        scoreImprovement: 5,
        category: 'Automation',
        priority: priority++,
        steps: [
          'Open the Evidence Collection Rules dashboard',
          'Create rules for high-frequency evidence types',
          'Configure source integrations (AWS, GitHub, Okta)',
          'Set the rule schedule (e.g., weekly) and enable',
        ],
      });

      res.json({ status: 'success', data: { recommendations } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching recommendations:', error);
      throw new AppError('Failed to fetch recommendations', 500);
    }
  })
);

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
      if (error instanceof AppError) throw error;
      logger.error('Error fetching collection status:', error);
      throw new AppError('Failed to fetch collection status', 500);
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
      if (error instanceof AppError) throw error;
      logger.error('Error listing collection rules:', error);
      throw new AppError('Failed to list collection rules', 500);
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
        throw new AppError('Collection rule not found', 404);
      }

      res.json({ status: 'success', data: rule });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching collection rule:', error);
      throw new AppError('Failed to fetch collection rule', 500);
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
        throw new AppError('controlId and sourceType are required', 400);
      }

      if (!VALID_SOURCE_TYPES.includes(sourceType)) {
        throw new AppError(`sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}`, 400);
      }

      // Check for duplicate rule on same control + source
      const existing = await prisma.evidenceCollectionRule.findFirst({
        where: { organizationId: orgId, controlId, sourceType },
      });

      if (existing) {
        throw new AppError('A collection rule already exists for this control and source type', 409);
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
      if (error instanceof AppError) throw error;
      logger.error('Error creating collection rule:', error);
      throw new AppError('Failed to create collection rule', 500);
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
        throw new AppError('Collection rule not found', 404);
      }

      const { sourceType, integrationId, query, schedule, isActive, controlId } = req.body;
      const updateData: any = {};

      if (sourceType !== undefined) {
        if (!VALID_SOURCE_TYPES.includes(sourceType)) {
          throw new AppError(`sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}`, 400);
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
      if (error instanceof AppError) throw error;
      logger.error('Error updating collection rule:', error);
      throw new AppError('Failed to update collection rule', 500);
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
        throw new AppError('Collection rule not found', 404);
      }

      await prisma.evidenceCollectionRule.delete({
        where: { id: req.params.id },
      });

      res.json({
        status: 'success',
        data: { message: 'Collection rule deleted', id: req.params.id },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting collection rule:', error);
      throw new AppError('Failed to delete collection rule', 500);
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
        throw new AppError('Collection rule not found', 404);
      }

      if (!rule.isActive) {
        throw new AppError('Cannot trigger an inactive collection rule', 400);
      }

      // A manual trigger only requests collection; it does not itself complete
      // any collection work. lastCollectedAt must NOT advance here, otherwise the
      // /status dashboard would report the rule as healthy/non-overdue even though
      // no evidence was actually collected. lastCollectedAt is updated only by the
      // collection worker once evidence is persisted.
      const triggeredAt = new Date().toISOString();

      logger.info(
        `Manual evidence collection requested for rule ${rule.id} (source: ${rule.sourceType}, control: ${rule.controlId}) by user ${userId}`
      );

      res.status(202).json({
        status: 'accepted',
        data: {
          message: 'Evidence collection requested',
          rule,
          triggeredBy: userId,
          triggeredAt,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error triggering collection:', error);
      throw new AppError('Failed to trigger collection', 500);
    }
  })
);

export default router;
