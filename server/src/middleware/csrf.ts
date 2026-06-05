/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * Implements double-submit cookie pattern for stateless CSRF protection.
 *
 * Token storage:
 * - Redis (via REDIS_URL) for multi-instance production deployments
 * - In-memory Map fallback for development/single-instance
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';
import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds
const CSRF_TOKEN_EXPIRY_SECONDS = 3600; // 1 hour for Redis TTL

// ============================================================================
// TOKEN STORE INTERFACE
// ============================================================================

interface TokenData {
  expires: number;
  userId?: string;
}

interface TokenStore {
  get(token: string): Promise<TokenData | undefined>;
  set(token: string, data: TokenData): Promise<void>;
  delete(token: string): Promise<void>;
  size(): Promise<number>;
}

// ============================================================================
// IN-MEMORY TOKEN STORE (development fallback)
// ============================================================================

class InMemoryTokenStore implements TokenStore {
  private store = new Map<string, TokenData>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Cleanup expired tokens every 15 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 15 * 60 * 1000);
    this.cleanupTimer?.unref?.();
  }

  async get(token: string): Promise<TokenData | undefined> {
    return this.store.get(token);
  }

  async set(token: string, data: TokenData): Promise<void> {
    this.store.set(token, data);
  }

  async delete(token: string): Promise<void> {
    this.store.delete(token);
  }

  async size(): Promise<number> {
    return this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, data] of this.store.entries()) {
      if (data.expires < now) {
        this.store.delete(token);
      }
    }
  }
}

// ============================================================================
// REDIS TOKEN STORE (production - multi-instance scalable)
// ============================================================================

class RedisTokenStore implements TokenStore {
  private redisUrl: string;
  private prefix = 'csrf:';
  // Single long-lived client reused across all CSRF operations. A fresh
  // connection per validate/set/delete would exhaust connections and add
  // latency to every mutating request under load.
  private client: any = null;
  private clientPromise: Promise<any> | null = null;

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
    logger.info('[CSRF] Using Redis token store for multi-instance scalability');
  }

  /**
   * Return the shared ioredis client, creating and connecting it once.
   * Subsequent calls reuse the same connection (lazyConnect singleton).
   */
  private async getClient(): Promise<any> {
    if (this.client) return this.client;
    if (this.clientPromise) return this.clientPromise;

    this.clientPromise = (async () => {
      // Lazy import to avoid requiring ioredis when not using Redis
      const { default: Redis } = await import('ioredis' as string);
      const client = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        connectTimeout: 5000,
      });
      // Prevent unhandled 'error' events from crashing the process; reset the
      // cached client so the next operation re-establishes the connection.
      client.on('error', (err: Error) => {
        logger.warn('[CSRF] Redis connection error', err.message);
      });
      client.on('end', () => {
        this.client = null;
        this.clientPromise = null;
      });
      await client.connect();
      this.client = client;
      return client;
    })();

    try {
      return await this.clientPromise;
    } catch (error) {
      this.client = null;
      this.clientPromise = null;
      throw error;
    }
  }

  async get(token: string): Promise<TokenData | undefined> {
    try {
      const client = await this.getClient();
      const data = await client.get(this.prefix + token);
      return data ? JSON.parse(data) : undefined;
    } catch (error) {
      logger.warn('[CSRF] Redis get failed, token not found');
      return undefined;
    }
  }

  async set(token: string, data: TokenData): Promise<void> {
    try {
      const client = await this.getClient();
      await client.setex(this.prefix + token, CSRF_TOKEN_EXPIRY_SECONDS, JSON.stringify(data));
    } catch (error) {
      logger.error('[CSRF] Redis set failed', error);
    }
  }

  async delete(token: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(this.prefix + token);
    } catch (error) {
      logger.warn('[CSRF] Redis delete failed');
    }
  }

  async size(): Promise<number> {
    try {
      const client = await this.getClient();
      const keys = await client.keys(this.prefix + '*');
      return keys.length;
    } catch (error) {
      return 0;
    }
  }
}

// ============================================================================
// INITIALIZE TOKEN STORE
// ============================================================================

function createTokenStore(): TokenStore {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new RedisTokenStore(redisUrl);
  }
  logger.warn('[CSRF] Using in-memory token store (not suitable for multi-instance production — set REDIS_URL)');
  return new InMemoryTokenStore();
}

const tokenStore: TokenStore = createTokenStore();

// ============================================================================
// TOKEN GENERATION
// ============================================================================

function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Constant-time comparison of two token strings. Returns false for unequal
 * lengths (which crypto.timingSafeEqual would otherwise throw on) so the
 * double-submit check never leaks timing information about token contents.
 */
function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Path-exemption helper using exact or path-segment-boundary prefix matching.
 * Prevents a substring like `/webhook` from exempting `/foo/webhook-config`:
 * the candidate must equal the exempt path or be followed by a `/`.
 */
function pathMatchesExempt(reqPath: string, exempt: string): boolean {
  if (reqPath === exempt) {
    return true;
  }
  const idx = reqPath.indexOf(exempt);
  if (idx === -1) {
    return false;
  }
  const after = reqPath.charAt(idx + exempt.length);
  return after === '' || after === '/';
}

// ============================================================================
// CSRF MIDDLEWARE
// ============================================================================

/**
 * CSRF Token Generation Middleware
 * Generates and sends CSRF token to client
 * GET /api/csrf-token
 */
export const generateCsrfToken = async (req: Request, res: Response): Promise<void> => {
  const token = generateToken();
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;

  // Store token with user association if authenticated
  const userId = (req as any).user?.id;
  await tokenStore.set(token, { expires, userId });

  // Set CSRF token as HTTP-only cookie
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
 */
export const csrfProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF in development (cross-origin localhost ports prevent cookie delivery)
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Skip CSRF for webhook endpoints (use signature verification instead).
  // Match on a path-segment boundary so unrelated paths that merely contain
  // the substring (e.g. /foo/webhook-config) are not exempted.
  if (pathMatchesExempt(req.path, '/webhook')) {
    return next();
  }

  // Skip CSRF for authentication endpoints (pre-login, no session exists yet)
  // These endpoints use rate limiting and other protections
  const authExemptPaths = [
    '/auth/magic-link',
    '/auth/verify',
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/2fa/complete',
  ];
  if (authExemptPaths.some(path => pathMatchesExempt(req.path, path))) {
    return next();
  }

  // Get CSRF token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Get CSRF token from cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  // Validate tokens exist
  if (!headerToken || !cookieToken) {
    logSecurityEvent({
      type: SecurityEventType.CSRF_VALIDATION_FAILURE,
      severity: 'medium',
      message: `CSRF token missing (header: ${!headerToken ? 'absent' : 'present'}, cookie: ${!cookieToken ? 'absent' : 'present'})`,
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    });
    res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request. Please refresh the page and try again.',
    });
    return;
  }

  // Validate tokens match (double-submit cookie pattern) using a
  // constant-time comparison for defense-in-depth against timing oracles.
  if (!tokensMatch(headerToken, cookieToken)) {
    logSecurityEvent({
      type: SecurityEventType.CSRF_VALIDATION_FAILURE,
      severity: 'high',
      message: 'CSRF token mismatch between header and cookie',
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    });
    res.status(403).json({
      error: 'CSRF token invalid',
      message: 'CSRF token validation failed. Please refresh the page and try again.',
    });
    return;
  }

  // Check if token exists in store and hasn't expired
  const tokenData = await tokenStore.get(headerToken);
  if (!tokenData) {
    logSecurityEvent({
      type: SecurityEventType.CSRF_VALIDATION_FAILURE,
      severity: 'high',
      message: 'CSRF token not found in store (possible replay or forgery)',
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    });
    res.status(403).json({
      error: 'CSRF token invalid',
      message: 'CSRF token has expired or is invalid. Please refresh the page and try again.',
    });
    return;
  }

  // Check token expiry
  if (tokenData.expires < Date.now()) {
    await tokenStore.delete(headerToken);
    logSecurityEvent({
      type: SecurityEventType.CSRF_VALIDATION_FAILURE,
      severity: 'medium',
      message: 'CSRF token expired',
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    });
    res.status(403).json({
      error: 'CSRF token expired',
      message: 'CSRF token has expired. Please refresh the page and try again.',
    });
    return;
  }

  // Optional: Validate token belongs to current user (if authenticated)
  const userId = (req as any).user?.id;
  if (userId && tokenData.userId && tokenData.userId !== userId) {
    logSecurityEvent({
      type: SecurityEventType.CSRF_VALIDATION_FAILURE,
      severity: 'critical',
      message: 'CSRF token user mismatch (token belongs to a different user)',
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId,
      details: { tokenUserId: tokenData.userId },
    });
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
export const rotateCsrfToken = async (req: Request, res: Response): Promise<string> => {
  const oldToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (oldToken) {
    await tokenStore.delete(oldToken);
  }

  const newToken = generateToken();
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  const userId = (req as any).user?.id;

  await tokenStore.set(newToken, { expires, userId });

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
export async function getCsrfTokenStoreSize(): Promise<number> {
  return tokenStore.size();
}

export default {
  generateCsrfToken,
  csrfProtection,
  rotateCsrfToken,
  getCsrfTokenStoreSize,
};
