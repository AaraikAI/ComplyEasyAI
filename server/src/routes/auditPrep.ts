/**
 * AI Audit Preparation Routes
 *
 * Endpoints for calculating audit readiness scores, identifying gaps,
 * generating mock audit Q&A, building evidence packages, and
 * estimating remediation timelines per compliance framework.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

/** Number of days after which evidence is considered stale */
const EVIDENCE_STALE_DAYS = 90;

/** Average working days to remediate a single gap */
const DAYS_PER_GAP = 5;

interface GapItem {
  controlId: string;
  controlName: string;
  category: string | null;
  gapType: 'missing_evidence' | 'stale_evidence' | 'missing_policy' | 'control_not_implemented';
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Shared function that inspects all controls for a framework and categorizes gaps.
 */
async function analyzeFrameworkGaps(
  frameworkId: string,
  orgId: string
): Promise<{ framework: any; controls: any[]; gaps: GapItem[]; scores: { total: number; withEvidence: number; withCurrentEvidence: number; implemented: number } }> {
  const framework = await prisma.complianceFramework.findFirst({
    where: { id: frameworkId, organizationId: orgId },
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

  if (!framework) {
    throw new Error('FRAMEWORK_NOT_FOUND');
  }

  const controls = framework.controls;
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - EVIDENCE_STALE_DAYS);

  // Fetch org policies to check coverage
  const policies = await prisma.policy.findMany({
    where: { organizationId: orgId, status: { not: 'Archived' } },
    select: { id: true, framework: true, category: true },
  });

  const policyFrameworkSet = new Set(
    policies.map((p) => p.framework?.toLowerCase()).filter(Boolean)
  );

  const gaps: GapItem[] = [];
  let withEvidence = 0;
  let withCurrentEvidence = 0;
  let implemented = 0;

  for (const control of controls) {
    const latestEvidence = control.evidenceVersions[0] || null;
    const hasEvidence = !!latestEvidence || !!control.evidence;
    const isImplemented = control.status === 'Implemented' || control.status === 'Compliant';

    if (isImplemented) implemented++;

    if (!isImplemented) {
      gaps.push({
        controlId: control.id,
        controlName: control.name,
        category: control.category,
        gapType: 'control_not_implemented',
        detail: `Control status is "${control.status}" and needs implementation`,
        severity: 'high',
      });
    }

    if (hasEvidence) {
      withEvidence++;
    }

    if (control.evidenceRequired && !hasEvidence) {
      gaps.push({
        controlId: control.id,
        controlName: control.name,
        category: control.category,
        gapType: 'missing_evidence',
        detail: 'Evidence is required but none has been uploaded',
        severity: 'high',
      });
    }

    if (latestEvidence && new Date(latestEvidence.uploadedAt) < staleThreshold) {
      gaps.push({
        controlId: control.id,
        controlName: control.name,
        category: control.category,
        gapType: 'stale_evidence',
        detail: `Latest evidence is older than ${EVIDENCE_STALE_DAYS} days (uploaded ${latestEvidence.uploadedAt.toISOString().split('T')[0]})`,
        severity: 'medium',
      });
    } else if (hasEvidence) {
      withCurrentEvidence++;
    }

    // Check if there is an applicable policy for this control's category
    const controlCategory = control.category?.toLowerCase();
    if (controlCategory && !policyFrameworkSet.has(framework.name.toLowerCase()) && !policyFrameworkSet.has(controlCategory)) {
      gaps.push({
        controlId: control.id,
        controlName: control.name,
        category: control.category,
        gapType: 'missing_policy',
        detail: `No published policy found covering "${control.category}" for ${framework.name}`,
        severity: 'low',
      });
    }
  }

  return {
    framework,
    controls,
    gaps,
    scores: {
      total: controls.length,
      withEvidence,
      withCurrentEvidence,
      implemented,
    },
  };
}

// ============================================================================
// AUDIT READINESS SCORE
// ============================================================================

router.get(
  '/readiness/:frameworkId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const { framework, gaps, scores } = await analyzeFrameworkGaps(
        req.params.frameworkId,
        orgId
      );

      const totalControls = scores.total;
      if (totalControls === 0) {
        res.json({
          status: 'success',
          data: {
            frameworkId: framework.id,
            frameworkName: framework.name,
            readinessScore: 0,
            breakdown: { evidenceCoverage: 0, evidenceFreshness: 0, implementationRate: 0 },
            totalControls: 0,
            totalGaps: 0,
          },
        });
        return;
      }

      // Weighted readiness score
      const evidenceCoverage = (scores.withEvidence / totalControls) * 100;
      const evidenceFreshness =
        scores.withEvidence > 0
          ? (scores.withCurrentEvidence / scores.withEvidence) * 100
          : 0;
      const implementationRate = (scores.implemented / totalControls) * 100;

      // Weights: implementation 50%, evidence coverage 30%, freshness 20%
      const readinessScore = Math.round(
        implementationRate * 0.5 +
        evidenceCoverage * 0.3 +
        evidenceFreshness * 0.2
      );

      const highGaps = gaps.filter((g) => g.severity === 'high').length;
      const mediumGaps = gaps.filter((g) => g.severity === 'medium').length;
      const lowGaps = gaps.filter((g) => g.severity === 'low').length;

      res.json({
        status: 'success',
        data: {
          frameworkId: framework.id,
          frameworkName: framework.name,
          readinessScore: Math.min(100, readinessScore),
          breakdown: {
            evidenceCoverage: Math.round(evidenceCoverage * 100) / 100,
            evidenceFreshness: Math.round(evidenceFreshness * 100) / 100,
            implementationRate: Math.round(implementationRate * 100) / 100,
          },
          totalControls,
          totalGaps: gaps.length,
          gapsBySeverity: { high: highGaps, medium: mediumGaps, low: lowGaps },
          nextAuditDate: framework.nextAuditDate,
        },
      });
    } catch (error: any) {
      if (error.message === 'FRAMEWORK_NOT_FOUND') {
        res.status(404).json({ error: 'Framework not found' });
        return;
      }
      logger.error('Error calculating audit readiness:', error);
      res.status(500).json({ error: 'Failed to calculate audit readiness' });
    }
  })
);

// ============================================================================
// LIST GAPS
// ============================================================================

router.get(
  '/gaps/:frameworkId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const gapType = req.query.gapType as string | undefined;
    const severity = req.query.severity as string | undefined;

    try {
      const { framework, gaps } = await analyzeFrameworkGaps(
        req.params.frameworkId,
        orgId
      );

      let filtered = gaps;

      if (gapType) {
        filtered = filtered.filter((g) => g.gapType === gapType);
      }
      if (severity) {
        filtered = filtered.filter((g) => g.severity === severity);
      }

      // Sort: high severity first, then medium, then low
      const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      res.json({
        status: 'success',
        data: {
          frameworkId: framework.id,
          frameworkName: framework.name,
          totalGaps: filtered.length,
          gaps: filtered,
        },
      });
    } catch (error: any) {
      if (error.message === 'FRAMEWORK_NOT_FOUND') {
        res.status(404).json({ error: 'Framework not found' });
        return;
      }
      logger.error('Error listing audit gaps:', error);
      res.status(500).json({ error: 'Failed to list audit gaps' });
    }
  })
);

// ============================================================================
// GENERATE MOCK AUDIT Q&A
// ============================================================================

router.post(
  '/mock-questions/:frameworkId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: req.params.frameworkId, organizationId: orgId },
        include: {
          controls: {
            select: { id: true, name: true, category: true, status: true },
          },
        },
      });

      if (!framework) {
        res.status(404).json({ error: 'Framework not found' });
        return;
      }

      const controlCount = req.body.count || 10;
      const focusArea = req.body.focusArea as string | undefined;

      // Filter controls by focus area if provided
      let targetControls = framework.controls;
      if (focusArea) {
        targetControls = targetControls.filter(
          (c) => c.category?.toLowerCase().includes(focusArea.toLowerCase())
        );
      }

      // Select a subset of controls for questions
      const selectedControls = targetControls.slice(0, Math.min(controlCount, targetControls.length));

      // Generate template audit questions for each selected control
      const questions = selectedControls.map((control, index) => ({
        questionNumber: index + 1,
        controlId: control.id,
        controlName: control.name,
        category: control.category,
        question: `Can you describe how your organization implements the "${control.name}" control? Please provide supporting evidence.`,
        followUp: `What monitoring or review processes are in place to ensure ongoing compliance with "${control.name}"?`,
        expectedEvidence: [
          'Written policy or procedure document',
          'Implementation evidence (screenshots, logs, configuration files)',
          'Recent review or test results',
          'Training records for relevant personnel',
        ],
        auditorTips: [
          'Request specific dates and responsible parties',
          'Ask for evidence of periodic review cycles',
          'Verify that controls are operating effectively, not just designed',
          'Check for exception handling procedures',
        ],
      }));

      res.json({
        status: 'success',
        data: {
          frameworkId: framework.id,
          frameworkName: framework.name,
          totalQuestions: questions.length,
          focusArea: focusArea || 'all',
          questions,
        },
      });
    } catch (error) {
      logger.error('Error generating mock audit questions:', error);
      res.status(500).json({ error: 'Failed to generate mock audit questions' });
    }
  })
);

// ============================================================================
// GENERATE EVIDENCE PACKAGE MANIFEST
// ============================================================================

router.post(
  '/evidence-package/:frameworkId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: req.params.frameworkId, organizationId: orgId },
        include: {
          controls: {
            include: {
              evidenceVersions: {
                orderBy: { uploadedAt: 'desc' },
              },
            },
          },
        },
      });

      if (!framework) {
        res.status(404).json({ error: 'Framework not found' });
        return;
      }

      // Organize evidence by control, grouped by category
      const categoryMap: Record<string, any[]> = {};

      for (const control of framework.controls) {
        const category = control.category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = [];
        }

        const currentEvidence = control.evidenceVersions.find((e) => e.isCurrent);
        const allVersions = control.evidenceVersions;

        categoryMap[category].push({
          controlId: control.id,
          controlName: control.name,
          controlStatus: control.status,
          evidenceRequired: control.evidenceRequired,
          currentEvidence: currentEvidence
            ? {
                fileName: currentEvidence.fileName,
                fileUrl: currentEvidence.fileUrl,
                uploadedAt: currentEvidence.uploadedAt,
                uploadedBy: currentEvidence.uploadedBy,
                versionNumber: currentEvidence.versionNumber,
              }
            : null,
          legacyEvidence: control.evidence || null,
          totalVersions: allVersions.length,
          hasEvidence: !!currentEvidence || !!control.evidence,
        });
      }

      // Build manifest summary
      const totalControls = framework.controls.length;
      const controlsWithEvidence = framework.controls.filter(
        (c) => c.evidenceVersions.length > 0 || !!c.evidence
      ).length;
      const totalEvidenceFiles = framework.controls.reduce(
        (sum, c) => sum + c.evidenceVersions.length,
        0
      );

      res.json({
        status: 'success',
        data: {
          frameworkId: framework.id,
          frameworkName: framework.name,
          generatedAt: new Date().toISOString(),
          summary: {
            totalControls,
            controlsWithEvidence,
            controlsWithoutEvidence: totalControls - controlsWithEvidence,
            totalEvidenceFiles,
            completeness: totalControls > 0
              ? Math.round((controlsWithEvidence / totalControls) * 10000) / 100
              : 0,
          },
          categories: Object.entries(categoryMap).map(([category, controls]) => ({
            category,
            controlCount: controls.length,
            controls,
          })),
        },
      });
    } catch (error) {
      logger.error('Error generating evidence package:', error);
      res.status(500).json({ error: 'Failed to generate evidence package' });
    }
  })
);

// ============================================================================
// CALCULATE REMEDIATION TIMELINE
// ============================================================================

router.get(
  '/timeline/:frameworkId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const targetDate = req.query.targetDate as string | undefined;

    try {
      const { framework, gaps } = await analyzeFrameworkGaps(
        req.params.frameworkId,
        orgId
      );

      const highGaps = gaps.filter((g) => g.severity === 'high');
      const mediumGaps = gaps.filter((g) => g.severity === 'medium');
      const lowGaps = gaps.filter((g) => g.severity === 'low');

      // Estimate working days per gap by severity
      const estimatedDays =
        highGaps.length * 7 + mediumGaps.length * 4 + lowGaps.length * 2;

      const startDate = new Date();
      const estimatedEndDate = new Date(startDate);
      // Add estimated working days (approximate by adding calendar days * 1.4 for weekends)
      estimatedEndDate.setDate(
        estimatedEndDate.getDate() + Math.ceil(estimatedDays * 1.4)
      );

      // If target date provided, check if timeline is achievable
      let targetDateParsed: Date | null = null;
      let isAchievable = true;
      let daysOverTarget = 0;

      if (targetDate) {
        targetDateParsed = new Date(targetDate);
        if (estimatedEndDate > targetDateParsed) {
          isAchievable = false;
          daysOverTarget = Math.ceil(
            (estimatedEndDate.getTime() - targetDateParsed.getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }
      }

      // Build phased plan
      const phases = [];

      if (highGaps.length > 0) {
        const phaseEnd = new Date(startDate);
        phaseEnd.setDate(phaseEnd.getDate() + Math.ceil(highGaps.length * 7 * 1.4));
        phases.push({
          phase: 1,
          name: 'Critical Remediation',
          description: 'Address high-severity gaps: missing implementations and evidence',
          gapCount: highGaps.length,
          estimatedWorkingDays: highGaps.length * 7,
          startDate: startDate.toISOString().split('T')[0],
          endDate: phaseEnd.toISOString().split('T')[0],
        });
      }

      if (mediumGaps.length > 0) {
        const phaseStart = phases.length > 0
          ? new Date(phases[phases.length - 1].endDate)
          : new Date(startDate);
        const phaseEnd = new Date(phaseStart);
        phaseEnd.setDate(phaseEnd.getDate() + Math.ceil(mediumGaps.length * 4 * 1.4));
        phases.push({
          phase: phases.length + 1,
          name: 'Evidence Refresh',
          description: 'Update stale evidence and fill medium-priority gaps',
          gapCount: mediumGaps.length,
          estimatedWorkingDays: mediumGaps.length * 4,
          startDate: phaseStart.toISOString().split('T')[0],
          endDate: phaseEnd.toISOString().split('T')[0],
        });
      }

      if (lowGaps.length > 0) {
        const phaseStart = phases.length > 0
          ? new Date(phases[phases.length - 1].endDate)
          : new Date(startDate);
        const phaseEnd = new Date(phaseStart);
        phaseEnd.setDate(phaseEnd.getDate() + Math.ceil(lowGaps.length * 2 * 1.4));
        phases.push({
          phase: phases.length + 1,
          name: 'Policy & Documentation',
          description: 'Create or update missing policies and low-priority documentation',
          gapCount: lowGaps.length,
          estimatedWorkingDays: lowGaps.length * 2,
          startDate: phaseStart.toISOString().split('T')[0],
          endDate: phaseEnd.toISOString().split('T')[0],
        });
      }

      res.json({
        status: 'success',
        data: {
          frameworkId: framework.id,
          frameworkName: framework.name,
          totalGaps: gaps.length,
          gapsBySeverity: {
            high: highGaps.length,
            medium: mediumGaps.length,
            low: lowGaps.length,
          },
          estimatedWorkingDays: estimatedDays,
          estimatedCalendarDays: Math.ceil(estimatedDays * 1.4),
          startDate: startDate.toISOString().split('T')[0],
          estimatedEndDate: estimatedEndDate.toISOString().split('T')[0],
          targetDate: targetDate || null,
          isAchievable,
          daysOverTarget: isAchievable ? 0 : daysOverTarget,
          nextAuditDate: framework.nextAuditDate,
          phases,
        },
      });
    } catch (error: any) {
      if (error.message === 'FRAMEWORK_NOT_FOUND') {
        res.status(404).json({ error: 'Framework not found' });
        return;
      }
      logger.error('Error calculating remediation timeline:', error);
      res.status(500).json({ error: 'Failed to calculate remediation timeline' });
    }
  })
);

export default router;
