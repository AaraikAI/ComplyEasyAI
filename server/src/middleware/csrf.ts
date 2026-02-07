/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * Implements double-submit cookie pattern for stateless CSRF protection
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

// Store active tokens in memory (for production, use Redis or similar)
const tokenStore = new Map<string, { expires: number; userId?: string }>();

/**
 * Generates a cryptographically secure CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Cleans up expired tokens from the store
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expires < now) {
      tokenStore.delete(token);
    }
  }
}

// Cleanup expired tokens every 15 minutes
setInterval(cleanupExpiredTokens, 15 * 60 * 1000);

/**
 * CSRF Token Generation Middleware
 * Generates and sends CSRF token to client
 * GET /api/csrf-token
 */
export const generateCsrfToken = (req: Request, res: Response): void => {
  const token = generateToken();
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;

  // Store token with user association if authenticated
  const userId = (req as any).user?.id;
  tokenStore.set(token, { expires, userId });

  // Set CSRF token as HTTP-only cookie
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
  });

  // Also send token in response body for client to use in headers
  res.json({
    csrfToken: token,
    expiresIn: CSRF_TOKEN_EXPIRY,
  });
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token on state-changing requests (POST, PUT, PATCH, DELETE)
 *
 * Usage:
 * ```typescript
 * import { csrfProtection } from './middleware/csrf';
 *
 * router.post('/api/vendors', authenticate, csrfProtection, async (req, res) => {
 *   // Handler code
 * });
 * ```
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints (use signature verification instead)
  if (req.path.includes('/webhook')) {
    return next();
  }

  // Get CSRF token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Get CSRF token from cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  // Validate tokens exist
  if (!headerToken || !cookieToken) {
    logger.warn(`CSRF validation failed: Missing token - Path: ${req.path}, IP: ${req.ip}`);
    res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request. Please refresh the page and try again.',
    });
    return;
  }

  // Validate tokens match (double-submit cookie pattern)
  if (headerToken !== cookieToken) {
    logger.warn(`CSRF validation failed: Token mismatch - Path: ${req.path}, IP: ${req.ip}`);
    res.status(403).json({
      error: 'CSRF token invalid',
      message: 'CSRF token validation failed. Please refresh the page and try again.',
    });
    return;
  }

  // Check if token exists in store and hasn't expired
  const tokenData = tokenStore.get(headerToken);
  if (!tokenData) {
    logger.warn(`CSRF validation failed: Token not found in store - Path: ${req.path}, IP: ${req.ip}`);
    res.status(403).json({
      error: 'CSRF token invalid',
      message: 'CSRF token has expired or is invalid. Please refresh the page and try again.',
    });
    return;
  }

  // Check token expiry
  if (tokenData.expires < Date.now()) {
    tokenStore.delete(headerToken);
    logger.warn(`CSRF validation failed: Token expired - Path: ${req.path}, IP: ${req.ip}`);
    res.status(403).json({
      error: 'CSRF token expired',
      message: 'CSRF token has expired. Please refresh the page and try again.',
    });
    return;
  }

  // Optional: Validate token belongs to current user (if authenticated)
  const userId = (req as any).user?.id;
  if (userId && tokenData.userId && tokenData.userId !== userId) {
    logger.warn(`CSRF validation failed: User mismatch - Path: ${req.path}, IP: ${req.ip}`);
    res.status(403).json({
      error: 'CSRF token invalid',
      message: 'CSRF token validation failed. Please refresh the page and try again.',
    });
    return;
  }

  // CSRF validation passed
  logger.debug(`CSRF validation passed - Path: ${req.path}, User: ${userId || 'anonymous'}`);
  next();
};

/**
 * Optional: Rotate CSRF token after successful use
 * Call this in critical operations for extra security
 */
export const rotateCsrfToken = (req: Request, res: Response): string => {
  const oldToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (oldToken) {
    tokenStore.delete(oldToken);
  }

  const newToken = generateToken();
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  const userId = (req as any).user?.id;

  tokenStore.set(newToken, { expires, userId });

  res.cookie(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
  });

  return newToken;
};

/**
 * Get CSRF token store size (for monitoring/debugging)
 */
export function getCsrfTokenStoreSize(): number {
  return tokenStore.size;
}

export default {
  generateCsrfToken,
  csrfProtection,
  rotateCsrfToken,
  getCsrfTokenStoreSize,
};
