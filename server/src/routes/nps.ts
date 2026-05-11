/**
 * NPS Survey Routes
 *
 * Surface:
 *   GET    /active                  — current actionable invitation for the user
 *   POST   /responses               — submit a 0-10 score (+ optional comment)
 *   GET    /responses               — admin: list responses
 *   GET    /stats                   — admin: aggregate (NPS, distribution, response rate)
 *   POST   /invitations             — admin: schedule an invitation for a user
 *   POST   /invitations/:id/dismiss — user: stop showing this invitation
 *   POST   /invitations/:id/snooze  — user: suppress for N days
 *   POST   /invitations/process-due — admin: drive the email worker manually
 *
 * Authentication required on all routes; admin-only routes additionally
 * require the admin / compliance_admin role.
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody, validateQuery } from '../middleware/validate';
import npsService from '../services/npsService';
import {
  createNpsResponseSchema,
  listResponsesQuerySchema,
  scheduleInvitationSchema,
  snoozeInvitationSchema,
  statsQuerySchema,
} from '../validators/npsSchemas';

const router = Router();
router.use(authenticate);

// ── End-user surface ─────────────────────────────────────────────────────

router.get(
  '/active',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await npsService.getActiveInvitation(req.user.organizationId, req.user.id);
    res.json({ status: 'success', data });
  })
);

router.post(
  '/responses',
  validateBody(createNpsResponseSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as {
      invitationId?: string;
      score: number;
      comment?: string;
      source?: 'in_app' | 'email' | 'api';
    };
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '').trim();
    const data = await npsService.createResponse({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      invitationId: body.invitationId,
      score: body.score,
      comment: body.comment,
      source: body.source,
      userAgent: req.headers['user-agent']?.toString(),
      ipAddress: ip || undefined,
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.post(
  '/invitations/:id/dismiss',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await npsService.dismissInvitation(req.params.id, req.user.organizationId, req.user.id);
    res.json({ status: 'success', data });
  })
);

router.post(
  '/invitations/:id/snooze',
  validateBody(snoozeInvitationSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { untilDays: number };
    const data = await npsService.snoozeInvitation(
      req.params.id,
      req.user.organizationId,
      req.user.id,
      body.untilDays
    );
    res.json({ status: 'success', data });
  })
);

// ── Admin surface ────────────────────────────────────────────────────────

router.get(
  '/responses',
  authorize('admin', 'compliance_admin'),
  validateQuery(listResponsesQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as {
      category?: 'Detractor' | 'Passive' | 'Promoter';
      since?: string;
      until?: string;
      take?: string;
      skip?: string;
    };
    const data = await npsService.listResponses(req.user.organizationId, {
      category: q.category,
      since: q.since ? new Date(q.since) : undefined,
      until: q.until ? new Date(q.until) : undefined,
      take: q.take ? Number(q.take) : undefined,
      skip: q.skip ? Number(q.skip) : undefined,
    });
    res.json({ status: 'success', data });
  })
);

router.get(
  '/stats',
  authorize('admin', 'compliance_admin'),
  validateQuery(statsQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query as { periodStart?: string; periodEnd?: string };
    const data = await npsService.getStats(
      req.user.organizationId,
      q.periodStart ? new Date(q.periodStart) : undefined,
      q.periodEnd ? new Date(q.periodEnd) : undefined
    );
    res.json({ status: 'success', data });
  })
);

router.post(
  '/invitations',
  authorize('admin', 'compliance_admin'),
  validateBody(scheduleInvitationSchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as {
      userId: string;
      trigger: 'post_30d_active' | 'post_onboarding' | 'post_audit_complete' | 'manual';
      scheduledFor?: string;
      ttlDays?: number;
      cooldownDays?: number;
    };
    const data = await npsService.scheduleInvitation({
      organizationId: req.user.organizationId,
      userId: body.userId,
      trigger: body.trigger,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      ttlDays: body.ttlDays,
      cooldownDays: body.cooldownDays,
    });
    res.status(201).json({ status: 'success', data });
  })
);

router.post(
  '/invitations/process-due',
  authorize('admin'),
  authAsyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const data = await npsService.processDueInvitations();
    res.json({ status: 'success', data });
  })
);

export default router;
