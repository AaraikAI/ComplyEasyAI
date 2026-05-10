/**
 * SOC 2 Workflow Routes
 *
 * REST surface over soc2Service supporting both Type I (point-in-time) and
 * Type II (operating effectiveness over a period) AICPA Trust Services
 * Criteria audit lifecycles. All routes are authenticated and org-scoped via
 * req.user.organizationId. Mutating routes are restricted to admin /
 * compliance_admin / control_owner / auditor as appropriate.
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody, validateQuery } from '../middleware/validate';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import soc2Service from '../services/soc2Service';
import {
  createEngagementSchema,
  updateEngagementSchema,
  engagementsQuerySchema,
  upsertControlSchema,
  patchControlSchema,
  testControlSchema,
  controlsQuerySchema,
  createEvidenceSampleSchema,
  evidenceSamplesQuerySchema,
  createExceptionSchema,
  updateExceptionStatusSchema,
  exceptionsQuerySchema,
  createCUECSchema,
  cuecsQuerySchema,
  createManagementAssertionSchema,
} from '../validators/soc2Schemas';

const router = Router();
router.use(authenticate);

// ── Dashboard ───────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.getDashboard(req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── Engagements ─────────────────────────────────────────────────────────

router.post(
  '/engagements',
  authorize('admin', 'compliance_admin'),
  validateBody(createEngagementSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.createEngagement({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof soc2Service.createEngagement>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/engagements/:id',
  authorize('admin', 'compliance_admin'),
  validateBody(updateEngagementSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.updateEngagement(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      req.body as Parameters<typeof soc2Service.updateEngagement>[3]
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/engagements',
  validateQuery(engagementsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = req.query as Parameters<typeof soc2Service.listEngagements>[1];
    const data = await soc2Service.listEngagements(req.user.organizationId, filter);
    res.json({ status: 'success', data });
  })
);

router.get(
  '/engagements/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.getEngagement(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

router.post(
  '/engagements/:id/seed-controls',
  authorize('admin', 'compliance_admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.bulkSeedControls(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.status(201).json({ status: 'success', data });
  })
);

// ── Controls ────────────────────────────────────────────────────────────

router.post(
  '/controls',
  authorize('admin', 'compliance_admin'),
  validateBody(upsertControlSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.upsertControl({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof soc2Service.upsertControl>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/controls/:id',
  authorize('admin', 'control_owner'),
  validateBody(patchControlSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const patch = req.body as Partial<Parameters<typeof soc2Service.upsertControl>[0]>;
    const control = await prisma.sOC2Control.findFirst({
      where: { id: req.params.id as string, organizationId: req.user.organizationId },
      select: {
        id: true,
        engagementId: true,
        criteriaCategory: true,
        criteriaRef: true,
        criteriaTitle: true,
        controlActivity: true,
      },
    });
    if (!control) throw new AppError('SOC 2 control not found', 404);

    const data = await soc2Service.upsertControl({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      engagementId: control.engagementId,
      criteriaCategory: control.criteriaCategory as Parameters<typeof soc2Service.upsertControl>[0]['criteriaCategory'],
      criteriaRef: control.criteriaRef,
      criteriaTitle: control.criteriaTitle,
      controlActivity: patch.controlActivity ?? control.controlActivity,
      ...patch,
    });
    res.json({ status: 'success', data });
  })
);

router.post(
  '/controls/:id/test',
  authorize('admin', 'compliance_admin', 'auditor'),
  validateBody(testControlSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as {
      designStatus: Parameters<typeof soc2Service.testControl>[3];
      operatingStatus?: Parameters<typeof soc2Service.testControl>[4];
      evidenceRefs?: string[];
    };
    const data = await soc2Service.testControl(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      body.designStatus,
      body.operatingStatus,
      body.evidenceRefs
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/controls',
  validateQuery(controlsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as {
      engagementId: string;
      criteriaCategory?: Parameters<typeof soc2Service.listControls>[2] extends infer T
        ? T extends { criteriaCategory?: infer C } ? C : never
        : never;
      implementationStatus?: Parameters<typeof soc2Service.listControls>[2] extends infer T
        ? T extends { implementationStatus?: infer C } ? C : never
        : never;
      riskRating?: Parameters<typeof soc2Service.listControls>[2] extends infer T
        ? T extends { riskRating?: infer C } ? C : never
        : never;
    };
    const data = await soc2Service.listControls(req.user.organizationId, q.engagementId, {
      criteriaCategory: q.criteriaCategory,
      implementationStatus: q.implementationStatus,
      riskRating: q.riskRating,
    });
    res.json({ status: 'success', data });
  })
);

// ── Evidence Samples ────────────────────────────────────────────────────

router.post(
  '/evidence-samples',
  authorize('admin', 'control_owner'),
  validateBody(createEvidenceSampleSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.createEvidenceSample({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof soc2Service.createEvidenceSample>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.post(
  '/evidence-samples/:id/approve',
  authorize('admin', 'auditor'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.approveEvidenceSample(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/evidence-samples',
  validateQuery(evidenceSamplesQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.listEvidenceSamples(
      req.user.organizationId,
      req.query as Parameters<typeof soc2Service.listEvidenceSamples>[1]
    );
    res.json({ status: 'success', data });
  })
);

// ── Exceptions ──────────────────────────────────────────────────────────

router.post(
  '/exceptions',
  authorize('admin', 'auditor'),
  validateBody(createExceptionSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.createException({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof soc2Service.createException>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/exceptions/:id',
  authorize('admin', 'compliance_admin'),
  validateBody(updateExceptionStatusSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as {
      status: Parameters<typeof soc2Service.updateExceptionStatus>[3];
      remediation?: string;
      remediationOwner?: string;
      remediationDueDate?: Date;
      remediationCompletedAt?: Date;
      managementResponse?: string;
    };
    const { status, ...extra } = body;
    const data = await soc2Service.updateExceptionStatus(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      status,
      extra
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/exceptions',
  validateQuery(exceptionsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.listExceptions(
      req.user.organizationId,
      req.query as Parameters<typeof soc2Service.listExceptions>[1]
    );
    res.json({ status: 'success', data });
  })
);

// ── CUECs ───────────────────────────────────────────────────────────────

router.post(
  '/cuecs',
  authorize('admin', 'compliance_admin'),
  validateBody(createCUECSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.createCUEC({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof soc2Service.createCUEC>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/cuecs',
  validateQuery(cuecsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as { engagementId: string };
    const data = await soc2Service.listCUECs(req.user.organizationId, q.engagementId);
    res.json({ status: 'success', data });
  })
);

// ── Management Assertions ───────────────────────────────────────────────

router.post(
  '/assertions',
  authorize('admin'),
  validateBody(createManagementAssertionSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await soc2Service.createManagementAssertion({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof soc2Service.createManagementAssertion>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

export default router;
