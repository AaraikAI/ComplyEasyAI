/**
 * Real-Time Compliance Routes
 *
 * Thin REST surface over RealTimeComplianceService. Browsers receive live
 * updates over the WebSocket org room; these endpoints exist for:
 *   - initial snapshot on page load
 *   - history pagination
 *   - manual triggers (force a monitor run, force a score recompute)
 *   - operational health
 *
 * All routes are authenticated; every handler scopes by req.user.organizationId.
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authAsyncHandler, AuthenticatedRequest } from '../types/express';
import { validateBody, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import realTimeComplianceService from '../services/realTimeComplianceService';
import {
  monitorStreamQuerySchema,
  recomputeScoreBodySchema,
  publishComplianceEventBodySchema,
} from '../validators/realTimeComplianceSchemas';

const router = Router();
router.use(authenticate);

/** GET /api/realtime/snapshot — full org snapshot for initial dashboard load */
router.get(
  '/snapshot',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const snapshot = await realTimeComplianceService.getOrgSnapshot(req.user.organizationId);
    res.json({ status: 'success', data: snapshot });
  })
);

/** GET /api/realtime/score — latest computed score without recomputing */
router.get(
  '/score',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const snapshot = await realTimeComplianceService.getOrgSnapshot(req.user.organizationId);
    res.json({ status: 'success', data: snapshot.score });
  })
);

/** GET /api/realtime/monitor-stream?since=ISO&limit=N */
router.get(
  '/monitor-stream',
  validateQuery(monitorStreamQuerySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const since = req.query.since ? new Date(String(req.query.since)) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const items = await realTimeComplianceService.getMonitorStream(
      req.user.organizationId,
      since,
      limit
    );
    res.json({ status: 'success', data: items, count: items.length });
  })
);

/** POST /api/realtime/score/recompute — force a score recompute and broadcast */
router.post(
  '/score/recompute',
  validateBody(recomputeScoreBodySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reason = (req.body as { reason?: string }).reason || `manual:${req.user.id}`;
    const snapshot = await realTimeComplianceService.recomputeAndBroadcastScore(
      req.user.organizationId,
      reason
    );
    res.json({ status: 'success', data: snapshot });
  })
);

/** POST /api/realtime/monitors/:monitorId/execute — run a monitor now */
router.post(
  '/monitors/:monitorId/execute',
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { monitorId } = (req as unknown as AuthRequest).params as { monitorId: string };
    if (!monitorId || typeof monitorId !== 'string') {
      throw new AppError('monitorId path parameter is required', 400);
    }
    const result = await realTimeComplianceService.executeMonitorAndBroadcast(
      monitorId,
      req.user.id,
      req.user.organizationId
    );
    res.json({ status: 'success', data: result });
  })
);

/** POST /api/realtime/events — publish a custom compliance event */
router.post(
  '/events',
  validateBody(publishComplianceEventBodySchema),
  authAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { type: string; severity?: 'Low' | 'Medium' | 'High' | 'Critical'; payload?: unknown };
    realTimeComplianceService.publishComplianceEvent(req.user.organizationId, body);
    res.status(202).json({ status: 'success', data: { accepted: true } });
  })
);

/** GET /api/realtime/health — service operational status */
router.get(
  '/health',
  authAsyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const health = realTimeComplianceService.getHealth();
    res.json({ status: 'success', data: health });
  })
);

export default router;
