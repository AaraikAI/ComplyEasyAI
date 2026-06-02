/**
 * Audit Log Service
 *
 * Centralized helper for writing audit log entries from controllers. Provides a
 * single canonical shape so the COV-16 §5.5.16 surface remains consistent across
 * the codebase. Best-effort: a failure to write the audit log never aborts the
 * caller's request.
 *
 * Usage:
 *   await logControllerAction(req, 'governance.body_created', { id: body.id, name });
 *
 * Action label convention: `<entity>.<verb>` (e.g. `dpia.dpo_consulted`).
 */

import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

interface MaybeAuthedUser {
  id?: string;
  organizationId?: string;
}

interface MaybeAuthedRequest extends Request {
  user?: MaybeAuthedUser;
}

/**
 * Write a controller-level audit log entry. Pulls actor (userId + organizationId)
 * off `req.user` if available, captures request metadata (ip, user-agent), and
 * serialises `details` as JSON. Swallows write failures with a warning log so
 * the caller's response is never blocked by audit-log noise.
 */
export async function logControllerAction(
  req: Request,
  action: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    const authReq = req as MaybeAuthedRequest;
    const user = authReq.user;
    if (!user?.id || !user.organizationId) {
      // No actor context — typically pre-auth flow. Skip silently.
      return;
    }
    await prisma.auditLog.create({
      data: {
        action,
        userId: user.id,
        organizationId: user.organizationId,
        hash: uuidv4(),
        details: JSON.stringify(details),
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      },
    });
  } catch (err) {
    logger.warn(`[AuditLog] Failed to write audit log for action="${action}"`, err);
  }
}

export default { logControllerAction };
