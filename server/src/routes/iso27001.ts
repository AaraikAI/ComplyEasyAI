/**
 * ISO 27001 Guided Workflow Routes
 *
 * REST surface over iso27001Service. All routes are authenticated and
 * org-scoped via req.user.organizationId.
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody } from '../middleware/validate';
import iso27001Service from '../services/iso27001Service';
import {
  createAssessmentSchema,
  updateAssessmentStatusSchema,
  upsertSoASchema,
  createRiskScenarioSchema,
  updateRiskScenarioSchema,
  createCorrectiveActionSchema,
  updateCorrectiveActionSchema,
} from '../validators/iso27001Schemas';

const router = Router();
router.use(authenticate);

// ── Dashboard ───────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.getDashboard(req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── Assessments ─────────────────────────────────────────────────────────

router.post(
  '/assessments',
  authorize('admin', 'compliance_admin'),
  validateBody(createAssessmentSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.createAssessment({
      ...(req.body as Omit<Parameters<typeof iso27001Service.createAssessment>[0], 'organizationId' | 'userId'>),
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/assessments',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.listAssessments(req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

router.get(
  '/assessments/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.getAssessment(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

router.patch(
  '/assessments/:id/status',
  authorize('admin', 'compliance_admin'),
  validateBody(updateAssessmentStatusSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { status: Parameters<typeof iso27001Service.updateAssessmentStatus>[3]; [k: string]: unknown };
    const { status, ...extra } = body;
    const data = await iso27001Service.updateAssessmentStatus(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      status,
      extra as Parameters<typeof iso27001Service.updateAssessmentStatus>[4]
    );
    res.json({ status: 'success', data });
  })
);

// ── Workflow ────────────────────────────────────────────────────────────

router.get(
  '/assessments/:id/workflow',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.getWorkflow(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── Statement of Applicability ──────────────────────────────────────────

router.put(
  '/assessments/:id/soa',
  authorize('admin', 'compliance_admin', 'editor'),
  validateBody(upsertSoASchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.upsertSoAEntry({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      assessmentId: req.params.id as string,
      ...(req.body as Omit<Parameters<typeof iso27001Service.upsertSoAEntry>[0], 'organizationId' | 'userId' | 'assessmentId'>),
    });
    res.json({ status: 'success', data });
  })
);

router.get(
  '/assessments/:id/soa',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.listSoAEntries(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── Risk Register ───────────────────────────────────────────────────────

router.post(
  '/assessments/:id/risk-scenarios',
  authorize('admin', 'compliance_admin', 'editor'),
  validateBody(createRiskScenarioSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.createRiskScenario({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      assessmentId: req.params.id as string,
      ...(req.body as Omit<Parameters<typeof iso27001Service.createRiskScenario>[0], 'organizationId' | 'userId' | 'assessmentId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/assessments/:id/risk-scenarios',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.listRiskScenarios(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

router.patch(
  '/risk-scenarios/:scenarioId',
  authorize('admin', 'compliance_admin', 'editor'),
  validateBody(updateRiskScenarioSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.updateRiskScenario(
      req.params.scenarioId as string,
      req.user.organizationId,
      req.user.id,
      req.body as Parameters<typeof iso27001Service.updateRiskScenario>[3]
    );
    res.json({ status: 'success', data });
  })
);

// ── Corrective Actions ──────────────────────────────────────────────────

router.post(
  '/assessments/:id/corrective-actions',
  authorize('admin', 'compliance_admin', 'editor'),
  validateBody(createCorrectiveActionSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await iso27001Service.createCorrectiveAction({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      assessmentId: req.params.id as string,
      ...(req.body as Omit<Parameters<typeof iso27001Service.createCorrectiveAction>[0], 'organizationId' | 'userId' | 'assessmentId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.patch(
  '/corrective-actions/:actionId',
  authorize('admin', 'compliance_admin', 'editor'),
  validateBody(updateCorrectiveActionSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as {
      status: Parameters<typeof iso27001Service.updateCorrectiveActionStatus>[3];
      verifiedBy?: string;
      evidenceRefs?: string[];
    };
    const data = await iso27001Service.updateCorrectiveActionStatus(
      req.params.actionId as string,
      req.user.organizationId,
      req.user.id,
      body.status,
      body.verifiedBy,
      body.evidenceRefs
    );
    res.json({ status: 'success', data });
  })
);

export default router;
