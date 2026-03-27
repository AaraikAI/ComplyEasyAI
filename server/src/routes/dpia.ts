/**
 * DPIA (Data Protection Impact Assessment) Routes — GDPR Art. 35
 *
 * Endpoints for creating, managing, and approving DPIAs including
 * screening questionnaires, risk assessments, DPO consultation,
 * and regulatory export.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  createDPIASchema,
  updateDPIASchema,
  dpiaScreeningSchema,
  createDPIARiskAssessmentSchema,
  updateDPIARiskAssessmentSchema,
  dpoConsultationSchema,
  rejectDPIASchema,
} from '../validators/dpiaSchemas';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

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

/** Map likelihood x impact to a composite risk level */
function calculateRiskLevel(likelihood: string, impact: string): string {
  const scores: Record<string, number> = { VeryLow: 1, Low: 2, Medium: 3, High: 4, VeryHigh: 5 };
  const lScore = scores[likelihood] ?? 1;
  const iScore = scores[impact] ?? 1;
  const product = lScore * iScore;
  if (product <= 4) return 'Low';
  if (product <= 9) return 'Medium';
  if (product <= 16) return 'High';
  return 'VeryHigh';
}

// ============================================================================
// STATISTICS (must be registered before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/statistics',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    try {
      const allDpias = await prisma.dataProtectionImpactAssessment.findMany({
        where: { organizationId: orgId },
        select: { status: true, dpoConsulted: true, overallRiskLevel: true },
      });

      const byStatus: Record<string, number> = {};
      let requiresDpoConsultation = 0;
      for (const d of allDpias) {
        byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        if (d.dpoConsulted) requiresDpoConsultation++;
      }

      // Fetch all risk assessments for DPIAs belonging to this org
      const dpiaIds = allDpias.map(() => undefined); // We need to get risk assessments differently
      const orgDpias = await prisma.dataProtectionImpactAssessment.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });
      const dpiaIdList = orgDpias.map((d) => d.id);

      const riskAssessments = await prisma.dPIARiskAssessment.findMany({
        where: { dpiaId: { in: dpiaIdList } },
        select: { riskLevel: true },
      });

      const riskScores: Record<string, number> = { Low: 1, Medium: 2, High: 3, VeryHigh: 4 };
      let totalRiskScore = 0;
      for (const r of riskAssessments) {
        totalRiskScore += riskScores[r.riskLevel] ?? 0;
      }
      const averageRiskLevel =
        riskAssessments.length > 0
          ? Math.round((totalRiskScore / riskAssessments.length) * 100) / 100
          : 0;

      res.json({
        total: allDpias.length,
        byStatus,
        averageRiskLevel,
        totalRiskAssessments: riskAssessments.length,
        requiresDpoConsultation,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching DPIA statistics:', error);
      throw new AppError('Failed to fetch DPIA statistics', 500);
    }
  })
);

// ============================================================================
// LIST DPIAs
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const search = (req.query.search as string) || '';
    const status = req.query.status as string | undefined;

    try {
      const where: any = { organizationId: user.organizationId };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [dpias, total] = await Promise.all([
        prisma.dataProtectionImpactAssessment.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
          include: { _count: { select: { riskAssessments: true } } },
        }),
        prisma.dataProtectionImpactAssessment.count({ where }),
      ]);

      res.json({ dpias, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('DPIA table not yet available, returning empty data');
        return res.json({ dpias: [], total: 0, page, limit, totalPages: 0 });
      }
      logger.error('Error fetching DPIAs:', error);
      throw new AppError('Failed to fetch DPIAs', 500);
    }
  })
);

// ============================================================================
// CREATE DPIA
// ============================================================================

router.post(
  '/',
  validateBody(createDPIASchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        title,
        description,
        processingActivity,
        dataCategories,
        specialCategories,
        dataSubjects,
        necessity,
        proportionality,
        lawfulBasis,
      } = req.body;

      if (!title || !processingActivity) {
        throw new AppError('title and processingActivity are required', 400);
      }

      const dpia = await prisma.dataProtectionImpactAssessment.create({
        data: {
          organizationId: user.organizationId,
          title,
          description: description || null,
          processingActivity,
          dataCategories: dataCategories || [],
          specialCategories: specialCategories || false,
          dataSubjects: dataSubjects || [],
          necessity: necessity || null,
          proportionality: proportionality || null,
          lawfulBasis: lawfulBasis || null,
          screeningResult: 'Required',
          status: 'Draft',
          createdBy: user.id,
        },
      });

      res.status(201).json(dpia);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating DPIA:', error);
      throw new AppError('Failed to create DPIA', 500);
    }
  })
);

// ============================================================================
// GET DPIA BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: { riskAssessments: { orderBy: { createdAt: 'desc' } } },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      res.json(dpia);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching DPIA:', error);
      throw new AppError('Failed to fetch DPIA', 500);
    }
  })
);

// ============================================================================
// UPDATE DPIA
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateDPIASchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('DPIA not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData = pick(req.body, [
        'title', 'description', 'processingActivity', 'dataCategories', 'specialCategories',
        'dataSubjects', 'necessity', 'proportionality', 'lawfulBasis', 'screeningResult',
        'status', 'overallRiskLevel', 'riskMitigations', 'dpoConsulted', 'dpoConsultationDate',
        'dpoOpinion', 'dpoName', 'supervisoryAuthority', 'approvedBy', 'approvedAt',
        'nextReviewDate',
      ]);

      const dpia = await prisma.dataProtectionImpactAssessment.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(dpia);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating DPIA:', error);
      throw new AppError('Failed to update DPIA', 500);
    }
  })
);

// ============================================================================
// DELETE (SOFT — ARCHIVE) DPIA
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('DPIA not found', 404);
      }

      const dpia = await prisma.dataProtectionImpactAssessment.update({
        where: { id: req.params.id },
        data: { status: 'Archived' },
      });

      res.json({ message: 'DPIA archived', id: dpia.id });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error archiving DPIA:', error);
      throw new AppError('Failed to archive DPIA', 500);
    }
  })
);

// ============================================================================
// SCREENING QUESTIONNAIRE
// ============================================================================

router.post(
  '/:id/screening',
  validateBody(dpiaScreeningSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('DPIA not found', 404);
      }

      const { screeningAnswers } = req.body;
      if (!screeningAnswers || typeof screeningAnswers !== 'object') {
        throw new AppError('screeningAnswers object is required', 400);
      }

      // Evaluate whether a full DPIA is required based on Art. 35 criteria
      const criteria = [
        {
          key: 'largeScaleSpecialCategories',
          label: 'Large-scale processing of special categories of data',
          weight: 3,
        },
        {
          key: 'systematicMonitoringPublicAreas',
          label: 'Systematic monitoring of publicly accessible areas',
          weight: 3,
        },
        {
          key: 'automatedDecisionMakingLegalEffects',
          label: 'Automated decision-making with legal or significant effects',
          weight: 3,
        },
        {
          key: 'largeScaleProfiling',
          label: 'Large-scale profiling of individuals',
          weight: 2,
        },
        {
          key: 'innovativeTechnology',
          label: 'Use of innovative or emerging technology',
          weight: 2,
        },
        {
          key: 'crossBorderNonAdequate',
          label: 'Cross-border transfers to countries without adequacy decisions',
          weight: 2,
        },
        {
          key: 'vulnerableDataSubjects',
          label: 'Processing data of vulnerable data subjects (children, employees)',
          weight: 2,
        },
        {
          key: 'matchingCombiningDatasets',
          label: 'Matching or combining datasets from different sources',
          weight: 1,
        },
        {
          key: 'preventingExerciseOfRights',
          label: 'Processing that may prevent data subjects from exercising rights',
          weight: 1,
        },
      ];

      let score = 0;
      const triggeredReasons: string[] = [];

      for (const criterion of criteria) {
        if (screeningAnswers[criterion.key] === true) {
          score += criterion.weight;
          triggeredReasons.push(criterion.label);
        }
      }

      // DPIA required if score >= 3 (per EDPB guidelines: two or more criteria)
      const dpiaRequired = score >= 3;
      const newScreeningResult = dpiaRequired ? 'Required' : 'NotRequired';
      const newStatus = dpiaRequired ? 'InProgress' : 'Draft';

      // Store screening details in riskMitigations JSON for audit trail
      const screeningDetails = {
        screeningAnswers,
        score,
        reasons: triggeredReasons,
        evaluatedAt: new Date().toISOString(),
        evaluatedBy: user.id,
      };

      const dpia = await prisma.dataProtectionImpactAssessment.update({
        where: { id: req.params.id },
        data: {
          screeningResult: newScreeningResult,
          status: newStatus,
          specialCategories: screeningAnswers.largeScaleSpecialCategories || false,
          riskMitigations: screeningDetails,
        },
      });

      res.json({
        dpia,
        screeningResult: {
          required: dpiaRequired,
          result: newScreeningResult,
          score,
          reasons: triggeredReasons,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error running DPIA screening:', error);
      throw new AppError('Failed to run DPIA screening', 500);
    }
  })
);

// ============================================================================
// ADD RISK ASSESSMENT TO DPIA
// ============================================================================

router.post(
  '/:id/risk-assessment',
  validateBody(createDPIARiskAssessmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      const { riskDescription, riskCategory, likelihood, impact, existingControls, residualRisk, proposedMitigations } =
        req.body;

      if (!riskDescription || !likelihood || !impact) {
        throw new AppError('riskDescription, likelihood, and impact are required', 400);
      }

      const validLevels = ['VeryLow', 'Low', 'Medium', 'High', 'VeryHigh'];
      if (!validLevels.includes(likelihood) || !validLevels.includes(impact)) {
        throw new AppError('likelihood and impact must be VeryLow, Low, Medium, High, or VeryHigh', 400);
      }

      const riskLevel = calculateRiskLevel(likelihood, impact);

      const riskAssessment = await prisma.dPIARiskAssessment.create({
        data: {
          dpiaId: dpia.id,
          riskCategory: riskCategory || 'Other',
          riskDescription,
          likelihood,
          impact,
          riskLevel,
          existingControls: existingControls || [],
          proposedMitigations: proposedMitigations || [],
          residualRisk: residualRisk || null,
          status: 'Identified',
        },
      });

      // Update overall risk level on the DPIA
      const allRisks = await prisma.dPIARiskAssessment.findMany({
        where: { dpiaId: dpia.id },
        select: { riskLevel: true },
      });
      const riskScores: Record<string, number> = { Low: 1, Medium: 2, High: 3, VeryHigh: 4 };
      const maxRisk = allRisks.reduce((max, r) => Math.max(max, riskScores[r.riskLevel] ?? 0), 0);
      const overallLevel = Object.entries(riskScores).find(([, v]) => v === maxRisk)?.[0] || 'Low';

      await prisma.dataProtectionImpactAssessment.update({
        where: { id: dpia.id },
        data: { overallRiskLevel: overallLevel },
      });

      res.status(201).json(riskAssessment);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding DPIA risk assessment:', error);
      throw new AppError('Failed to add risk assessment', 500);
    }
  })
);

// ============================================================================
// UPDATE RISK ASSESSMENT
// ============================================================================

router.patch(
  '/:id/risk-assessment/:riskId',
  validateBody(updateDPIARiskAssessmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify the DPIA belongs to the organization
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      const riskAssessment = await prisma.dPIARiskAssessment.findFirst({
        where: { id: req.params.riskId, dpiaId: req.params.id },
      });

      if (!riskAssessment) {
        throw new AppError('Risk assessment not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData: Record<string, any> = pick(req.body, [
        'riskCategory', 'riskDescription', 'likelihood', 'impact', 'riskLevel',
        'existingControls', 'proposedMitigations', 'residualRisk', 'status',
      ]);

      // Recalculate risk level if likelihood or impact changed
      if (updateData.likelihood || updateData.impact) {
        const likelihood = updateData.likelihood || riskAssessment.likelihood;
        const impact = updateData.impact || riskAssessment.impact;
        updateData.riskLevel = calculateRiskLevel(likelihood, impact);
      }

      const updated = await prisma.dPIARiskAssessment.update({
        where: { id: req.params.riskId },
        data: updateData,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating DPIA risk assessment:', error);
      throw new AppError('Failed to update risk assessment', 500);
    }
  })
);

// ============================================================================
// DELETE RISK ASSESSMENT
// ============================================================================

router.delete(
  '/:id/risk-assessment/:riskId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      const riskAssessment = await prisma.dPIARiskAssessment.findFirst({
        where: { id: req.params.riskId, dpiaId: req.params.id },
      });

      if (!riskAssessment) {
        throw new AppError('Risk assessment not found', 404);
      }

      await prisma.dPIARiskAssessment.delete({
        where: { id: req.params.riskId },
      });

      res.json({ message: 'Risk assessment deleted', id: req.params.riskId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting DPIA risk assessment:', error);
      throw new AppError('Failed to delete risk assessment', 500);
    }
  })
);

// ============================================================================
// DPO CONSULTATION
// ============================================================================

router.post(
  '/:id/dpo-consultation',
  validateBody(dpoConsultationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      const { consultationNotes, dpoRecommendation, consultedBy, consultedAt } = req.body;

      if (!consultationNotes) {
        throw new AppError('consultationNotes is required', 400);
      }

      const updated = await prisma.dataProtectionImpactAssessment.update({
        where: { id: req.params.id },
        data: {
          dpoConsulted: true,
          dpoConsultationDate: consultedAt ? new Date(consultedAt) : new Date(),
          dpoOpinion: dpoRecommendation || consultationNotes,
          dpoName: consultedBy || user.name,
          status: 'UnderReview',
        },
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error recording DPO consultation:', error);
      throw new AppError('Failed to record DPO consultation', 500);
    }
  })
);

// ============================================================================
// DPO APPROVAL
// ============================================================================

router.patch(
  '/:id/approve',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      const updated = await prisma.dataProtectionImpactAssessment.update({
        where: { id: req.params.id },
        data: {
          status: 'Approved',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error approving DPIA:', error);
      throw new AppError('Failed to approve DPIA', 500);
    }
  })
);

// ============================================================================
// DPO REJECTION
// ============================================================================

router.patch(
  '/:id/reject',
  authorize('admin'),
  validateBody(rejectDPIASchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      const { rejectionReason } = req.body;
      if (!rejectionReason) {
        throw new AppError('rejectionReason is required', 400);
      }

      const updated = await prisma.dataProtectionImpactAssessment.update({
        where: { id: req.params.id },
        data: {
          status: 'Rejected',
          dpoOpinion: rejectionReason,
        },
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error rejecting DPIA:', error);
      throw new AppError('Failed to reject DPIA', 500);
    }
  })
);

// ============================================================================
// EXPORT DPIA (Regulatory Submission Format)
// ============================================================================

router.get(
  '/:id/export',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dpia = await prisma.dataProtectionImpactAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: { riskAssessments: { orderBy: { createdAt: 'asc' } } },
      });

      if (!dpia) {
        throw new AppError('DPIA not found', 404);
      }

      // Build Art. 35 compliant export structure
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          format: 'GDPR Art. 35 DPIA Report',
          version: '1.0',
        },
        assessment: {
          id: dpia.id,
          title: dpia.title,
          description: dpia.description,
          status: dpia.status,
          overallRiskLevel: dpia.overallRiskLevel,
          createdAt: dpia.createdAt,
          updatedAt: dpia.updatedAt,
        },
        processingDetails: {
          processingActivity: dpia.processingActivity,
          dataCategories: dpia.dataCategories,
          specialCategories: dpia.specialCategories,
          dataSubjects: dpia.dataSubjects,
          lawfulBasis: dpia.lawfulBasis,
          necessity: dpia.necessity,
          proportionality: dpia.proportionality,
        },
        screening: {
          result: dpia.screeningResult,
          details: dpia.riskMitigations,
        },
        riskAssessments: dpia.riskAssessments.map((r) => ({
          id: r.id,
          riskCategory: r.riskCategory,
          riskDescription: r.riskDescription,
          likelihood: r.likelihood,
          impact: r.impact,
          riskLevel: r.riskLevel,
          existingControls: r.existingControls,
          proposedMitigations: r.proposedMitigations,
          residualRisk: r.residualRisk,
          status: r.status,
        })),
        dpoConsultation: {
          consulted: dpia.dpoConsulted,
          consultationDate: dpia.dpoConsultationDate,
          dpoName: dpia.dpoName,
          opinion: dpia.dpoOpinion,
        },
        approval: {
          status: dpia.status,
          approvedBy: dpia.approvedBy,
          approvedAt: dpia.approvedAt,
          supervisoryAuthority: dpia.supervisoryAuthority,
        },
        nextReviewDate: dpia.nextReviewDate,
      };

      res.setHeader('Content-Disposition', `attachment; filename="dpia-${dpia.id}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error exporting DPIA:', error);
      throw new AppError('Failed to export DPIA', 500);
    }
  })
);

export default router;
