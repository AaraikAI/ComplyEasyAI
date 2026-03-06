/**
 * Security Event Logger
 *
 * Provides a structured, centralized logging facility for security-relevant
 * events. All events are emitted through the existing Winston logger with a
 * dedicated `security` category, making them easy to filter, alert on, and
 * forward to any SIEM (Elasticsearch, Datadog, Splunk, Wazuh, etc.) without
 * additional transport code.
 *
 * Design principles:
 *   1. Zero new dependencies - built entirely on top of existing Winston logger.
 *   2. Non-blocking - never throws; a logging failure must never break a
 *      request.  All public methods are fire-and-forget.
 *   3. Production-safe - no PII in event payloads beyond what is already
 *      logged elsewhere (userId, IP, path).  Sensitive headers / bodies are
 *      never included.
 *   4. Typed API - callers get compile-time safety via SecurityEventType and
 *      SecuritySeverity.
 *
 * Usage:
 *   import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';
 *
 *   logSecurityEvent({
 *     type: SecurityEventType.AUTHENTICATION_FAILURE,
 *     severity: 'high',
 *     message: 'Invalid token provided',
 *     ip: req.ip,
 *     path: req.originalUrl,
 *     method: req.method,
 *     userId: decoded?.userId,
 *   });
 */

import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Well-known security event categories. */
export enum SecurityEventType {
  // Authentication
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHENTICATION_SUCCESS = 'authentication_success',
  TOKEN_REVOKED = 'token_revoked',
  TOKEN_EXPIRED = 'token_expired',
  TWO_FACTOR_FAILURE = 'two_factor_failure',
  TWO_FACTOR_SUCCESS = 'two_factor_success',

  // Authorisation
  AUTHORIZATION_FAILURE = 'authorization_failure',

  // CSRF
  CSRF_VALIDATION_FAILURE = 'csrf_validation_failure',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  // SSRF / URL Validation
  SSRF_ATTEMPT = 'ssrf_attempt',

  // Input / Request
  SUSPICIOUS_INPUT = 'suspicious_input',

  // Account
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',

  // Session
  SESSION_TERMINATED = 'session_terminated',

  // General
  SECURITY_EXCEPTION = 'security_exception',
}

/** Severity levels aligned with common SIEM severity scales. */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

/** Payload for a single security event. */
export interface SecurityEvent {
  /** The category of security event. */
  type: SecurityEventType;
  /** How severe this event is considered. */
  severity: SecuritySeverity;
  /** Human-readable description of what happened. */
  message: string;
  /** Source IP address of the request (if available). */
  ip?: string;
  /** HTTP method of the triggering request. */
  method?: string;
  /** Request path / URL. */
  path?: string;
  /** Authenticated user ID (if known). */
  userId?: string;
  /** User email (if known - use sparingly). */
  userEmail?: string;
  /** Organization ID (if known). */
  organizationId?: string;
  /** Correlation ID from the request (if available). */
  correlationId?: string;
  /** Additional structured metadata specific to the event. */
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Map severity to a Winston log level.  We intentionally map everything that
 * is `high` or `critical` to `warn` rather than `error` because these are
 * *security* events, not application errors.  True errors (500s, thrown
 * exceptions) already go through the error-handler pipeline.  Using `warn`
 * keeps the error channel clean while still being prominent in dashboards.
 */
function severityToLogLevel(severity: SecuritySeverity): string {
  switch (severity) {
    case 'critical':
      return 'warn';
    case 'high':
      return 'warn';
    case 'medium':
      return 'info';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Log a structured security event.
 *
 * This function is intentionally synchronous and fire-and-forget.  It will
 * never throw - if the underlying logger fails, the error is silently
 * swallowed so as not to impact the request lifecycle.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  try {
    const {
      type,
      severity,
      message,
      ip,
      method,
      path,
      userId,
      userEmail,
      organizationId,
      correlationId,
      details,
    } = event;

    const level = severityToLogLevel(severity);

    const payload: Record<string, unknown> = {
      category: 'security',
      eventType: type,
      severity,
      ...(ip !== undefined && { ip }),
      ...(method !== undefined && { method }),
      ...(path !== undefined && { path }),
      ...(userId !== undefined && { userId }),
      ...(userEmail !== undefined && { userEmail }),
      ...(organizationId !== undefined && { organizationId }),
      ...(correlationId !== undefined && { correlationId }),
      ...(details !== undefined && { details }),
    };

    logger.log(level, `[SECURITY] ${message}`, payload);
  } catch (_err) {
    // Intentionally swallowed - logging must never break the request.
  }
}

/**
 * Convenience helper to extract common request metadata for a security event.
 * Accepts a plain object so callers don't need to import Express Request type.
 */
export function extractRequestMeta(req: {
  ip?: string;
  method?: string;
  originalUrl?: string;
  path?: string;
  user?: { id?: string; email?: string; organizationId?: string };
  correlationId?: string;
}): Pick<SecurityEvent, 'ip' | 'method' | 'path' | 'userId' | 'userEmail' | 'organizationId' | 'correlationId'> {
  const user = req.user;
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl || req.path,
    userId: user?.id,
    userEmail: user?.email,
    organizationId: user?.organizationId,
    correlationId: req.correlationId,
  };
}

export default {
  logSecurityEvent,
  extractRequestMeta,
  SecurityEventType,
};
