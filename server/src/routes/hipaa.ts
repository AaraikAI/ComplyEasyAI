/**
 * HIPAA Workflow Routes
 *
 * REST surface over hipaaService:
 *   - PHI inventory + segmentation (/phi-records, /phi-records/:id, access grants)
 *   - Business Associate Agreement tracking (/baas, /baas/:id)
 *   - Breach Rule automation (/breach-assessments, /breach-assessments/:id)
 *
 * All routes authenticated, org-scoped via req.user.organizationId. Mutating
 * routes restricted to admin / compliance_admin / security_admin.
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody, validateQuery } from '../middleware/validate';
import hipaaService from '../services/hipaaService';
import {
  createPHIRecordSchema,
  phiRecordsQuerySchema,
  grantPHIAccessSchema,
  revokePHIAccessSchema,
  createBAASchema,
  updateBAAStatusSchema,
  baasQuerySchema,
  breachRiskAssessmentSchema,
  breachNotificationSentSchema,
} from '../validators/hipaaSchemas';

const router = Router();
router.use(authenticate);

// ── Dashboard ───────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.getDashboard(req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── PHI Records ─────────────────────────────────────────────────────────

router.post(
  '/phi-records',
  authorize('admin', 'compliance_admin', 'security_admin'),
  validateBody(createPHIRecordSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.createPHIRecord({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof hipaaService.createPHIRecord>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/phi-records',
  validateQuery(phiRecordsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.listPHIRecords(
      req.user.organizationId,
      req.query as Parameters<typeof hipaaService.listPHIRecords>[1]
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/phi-records/:id',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.getPHIRecord(req.params.id as string, req.user.organizationId);
    res.json({ status: 'success', data });
  })
);

// ── PHI Access Grants (segmentation) ────────────────────────────────────

router.post(
  '/access-grants',
  authorize('admin', 'compliance_admin', 'security_admin'),
  validateBody(grantPHIAccessSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.grantPHIAccess({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof hipaaService.grantPHIAccess>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.delete(
  '/access-grants/:grantId',
  authorize('admin', 'compliance_admin', 'security_admin'),
  validateBody(revokePHIAccessSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.revokePHIAccess(
      req.params.grantId as string,
      req.user.organizationId,
      req.user.id,
      (req.body as { reason: string }).reason
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/access-grants/expiring',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const days = req.query.withinDays ? Number(req.query.withinDays) : 30;
    const data = await hipaaService.listExpiringAccessGrants(req.user.organizationId, days);
    res.json({ status: 'success', data });
  })
);

// ── Business Associate Agreements ───────────────────────────────────────

router.post(
  '/baas',
  authorize('admin', 'compliance_admin'),
  validateBody(createBAASchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.createBAA({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof hipaaService.createBAA>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/baas',
  validateQuery(baasQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.listBAAs(
      req.user.organizationId,
      req.query as Parameters<typeof hipaaService.listBAAs>[1]
    );
    res.json({ status: 'success', data });
  })
);

router.patch(
  '/baas/:id/status',
  authorize('admin', 'compliance_admin'),
  validateBody(updateBAAStatusSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.updateBAAStatus(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      (req.body as { status: Parameters<typeof hipaaService.updateBAAStatus>[3] }).status
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/baas/expiring',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const days = req.query.withinDays ? Number(req.query.withinDays) : 90;
    const data = await hipaaService.listExpiringBAAs(req.user.organizationId, days);
    res.json({ status: 'success', data });
  })
);

// ── Breach Rule Automation ──────────────────────────────────────────────

router.post(
  '/breach-assessments',
  authorize('admin', 'compliance_admin', 'security_admin'),
  validateBody(breachRiskAssessmentSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.assessBreachRisk({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      ...(req.body as Omit<Parameters<typeof hipaaService.assessBreachRisk>[0], 'organizationId' | 'userId'>),
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.get(
  '/breach-assessments',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conclusion = req.query.conclusion as 'LowProbabilityOfCompromise' | 'BreachConfirmed' | undefined;
    const data = await hipaaService.listBreachRiskAssessments(req.user.organizationId, { conclusion });
    res.json({ status: 'success', data });
  })
);

router.post(
  '/breach-assessments/:id/notifications',
  authorize('admin', 'compliance_admin', 'security_admin'),
  validateBody(breachNotificationSentSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { channel: 'individual' | 'hhs' | 'media'; sentAt?: string };
    const data = await hipaaService.markBreachNotificationSent(
      req.params.id as string,
      req.user.organizationId,
      req.user.id,
      body.channel,
      body.sentAt ? new Date(body.sentAt) : undefined
    );
    res.json({ status: 'success', data });
  })
);

router.get(
  '/breach-assessments/overdue',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hipaaService.listOverdueBreachNotifications(req.user.organizationId);
    res.json({ status: 'success', data, count: data.length });
  })
);

export default router;
