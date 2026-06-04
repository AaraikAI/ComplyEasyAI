/**
 * Platform Admin Authorization Middleware
 *
 * Authorizes only true platform operators (ComplyEasyAI staff) for endpoints
 * that expose cross-tenant data which is not scoped by organizationId — such as
 * the demo-request lead pipeline. A per-tenant `authorize('admin')` check is
 * insufficient here because every organization has its own admin, and any of
 * them would otherwise be able to read every other tenant's lead PII.
 *
 * The operator allowlist is sourced from the PLATFORM_ADMIN_EMAILS environment
 * variable (comma-separated). The User Prisma model has no platform-admin flag,
 * so the env allowlist is the sole source of truth. Must be mounted AFTER
 * `authenticate` so that req.user is populated.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';
import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';

/**
 * Parse the PLATFORM_ADMIN_EMAILS env var into a normalized Set of allowed
 * operator emails. Parsed on each call so configuration changes take effect
 * without a process restart and tests can override the env var.
 */
const getPlatformAdminEmails = (): Set<string> => {
  const raw = process.env.PLATFORM_ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0)
  );
};

export const requirePlatformAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const allowlist = getPlatformAdminEmails();
  const email = req.user.email?.toLowerCase();

  if (allowlist.size === 0 || !email || !allowlist.has(email)) {
    logSecurityEvent({
      type: SecurityEventType.AUTHORIZATION_FAILURE,
      severity: 'high',
      message: 'Non-platform-operator denied access to a cross-tenant endpoint',
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      userId: req.user.id,
      userEmail: req.user.email,
      organizationId: req.user.organizationId,
    });
    next(new AppError('Platform operator access required', 403));
    return;
  }

  next();
};

export default requirePlatformAdmin;
