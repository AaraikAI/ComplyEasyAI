/**
 * NIST Cybersecurity Framework (CSF) v2.0 Workflow Routes
 *
 * REST surface over nistCsfService:
 *   - Profiles (Current vs Target) — /profiles, /profiles/:id, archive, seed
 *   - Subcategory assessments — /assessments
 *   - Gap analyses (Current vs Target) — /gap-analyses
 *   - Action items — /action-items
 *   - Function-level scoring — /profiles/:id/score
 *   - Dashboard rollup — /dashboard
 *
 * All routes authenticated, org-scoped via req.user.organizationId. Mutating
 * routes restricted to admin / compliance_admin (some allow control_owner).
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody, validateQuery } from '../middleware/validate';
import nistCsfService from '../services/nistCsfService';
import {
  createProfileSchema,
  updateProfileSchema,
  profilesQuerySchema,
  scoreFunctionSchema,
  upsertAssessmentSchema,
  assessmentsQuerySchema,
  generateGapAnalysisSchema,
  gapAnalysesQuerySchema,
  createActionItemSchema,
  updateActionItemSchema,
  actionItemsQuerySchema,
} from '../validators/nistCsfSchemas';

const router = Router();
router.use(authenticate);

// ── Dashboard ───────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.getDashboard(req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── Profiles ────────────────────────────────────────────────────────────

router.post(
  '/profiles',
  authorize('admin', 'compliance_admin'),
  validateBody(createProfileSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.createProfile({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof nistCsfService.createProfile>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/profiles/:id',
  authorize('admin', 'compliance_admin'),
  validateBody(updateProfileSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.updateProfile(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      req.body as Parameters<typeof nistCsfService.updateProfile>[3]
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/profiles',
  validateQuery(profilesQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as Parameters<typeof nistCsfService.listProfiles>[1];
    const data = await nistCsfService.listProfiles(req.user.organizationId, query);
    res.json({ status: 'success', data });
  })
);

router.get(
  '/profiles/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.getProfile(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

router.post(
  '/profiles/:id/archive',
  authorize('admin', 'compliance_admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.archiveProfile(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data });
  })
);

router.post(
  '/profiles/:id/seed',
  authorize('admin', 'compliance_admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.bulkSeedSubcategories(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.status(201).json({ status: 'success', data });
  })
);

router.post(
  '/profiles/:id/score',
  authorize('admin', 'compliance_admin'),
  validateBody(scoreFunctionSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { function: Parameters<typeof nistCsfService.scoreFunction>[2] };
    const data = await nistCsfService.scoreFunction(
      req.params.id as string,
      req.user.organizationId,
      body.function
    );
    res.json({ status: 'success', data });
  })
);

// ── Subcategory assessments ─────────────────────────────────────────────

router.post(
  '/assessments',
  authorize('admin', 'compliance_admin', 'control_owner'),
  validateBody(upsertAssessmentSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.upsertSubcategoryAssessment({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof nistCsfService.upsertSubcategoryAssessment>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/assessments',
  validateQuery(assessmentsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as {
      profileId: string;
      function?: Parameters<typeof nistCsfService.listSubcategoryAssessments>[2] extends infer F
        ? F extends { function?: infer T } ? T : never
        : never;
      category?: string;
      priority?: Parameters<typeof nistCsfService.listSubcategoryAssessments>[2] extends infer F
        ? F extends { priority?: infer T } ? T : never
        : never;
      implementationStatus?: Parameters<typeof nistCsfService.listSubcategoryAssessments>[2] extends infer F
        ? F extends { implementationStatus?: infer T } ? T : never
        : never;
    };
    const data = await nistCsfService.listSubcategoryAssessments(
      req.user.organizationId,
      query.profileId,
      {
        function: query.function,
        category: query.category,
        priority: query.priority,
        implementationStatus: query.implementationStatus,
      }
    );
    res.json({ status: 'success', data });
  })
);

// ── Gap analyses ────────────────────────────────────────────────────────

router.post(
  '/gap-analyses',
  authorize('admin', 'compliance_admin'),
  validateBody(generateGapAnalysisSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { currentProfileId: string; targetProfileId: string };
    const data = await nistCsfService.generateGapAnalysis(
      body.currentProfileId,
      body.targetProfileId,
      req.user.organizationId,
      req.user.id
    );
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/gap-analyses',
  validateQuery(gapAnalysesQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.listGapAnalyses(
      req.user.organizationId,
      req.query as Parameters<typeof nistCsfService.listGapAnalyses>[1]
    );
    res.json({ status: 'success', data });
  })
);

// ── Action items ────────────────────────────────────────────────────────

router.post(
  '/action-items',
  authorize('admin', 'compliance_admin'),
  validateBody(createActionItemSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.createActionItem({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof nistCsfService.createActionItem>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/action-items/:id',
  authorize('admin', 'compliance_admin'),
  validateBody(updateActionItemSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.updateActionItem(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      req.body as Parameters<typeof nistCsfService.updateActionItem>[3]
    );
    res.json({ status: 'success', data });
  })
);

router.post(
  '/action-items/:id/complete',
  authorize('admin', 'compliance_admin'),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await nistCsfService.completeActionItem(
      req.params.id as string,
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/action-items',
  validateQuery(actionItemsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as {
      profileId?: string;
      status?: Parameters<typeof nistCsfService.listActionItems>[2] extends infer F
        ? F extends { status?: infer T } ? T : never
        : never;
      priority?: Parameters<typeof nistCsfService.listActionItems>[2] extends infer F
        ? F extends { priority?: infer T } ? T : never
        : never;
      assignedTo?: string;
    };
    const data = await nistCsfService.listActionItems(
      req.user.organizationId,
      query.profileId,
      { status: query.status, priority: query.priority, assignedTo: query.assignedTo }
    );
    res.json({ status: 'success', data });
  })
);

export default router;
