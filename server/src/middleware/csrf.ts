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

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
    logger.info('[CSRF] Using Redis token store for multi-instance scalability');
  }

  private async getRedisClient() {
    // Lazy import to avoid requiring ioredis when not using Redis
    const { default: Redis } = await import('ioredis' as string);
    return new Redis(this.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 5000,
    });
  }

  async get(token: string): Promise<TokenData | undefined> {
    let client;
    try {
      client = await this.getRedisClient();
      await client.connect();
      const data = await client.get(this.prefix + token);
      await client.quit();
      return data ? JSON.parse(data) : undefined;
    } catch (error) {
      if (client) await client.quit().catch(() => {});
      logger.warn('[CSRF] Redis get failed, token not found');
      return undefined;
    }
  }

  async set(token: string, data: TokenData): Promise<void> {
    let client;
    try {
      client = await this.getRedisClient();
      await client.connect();
      await client.setex(this.prefix + token, CSRF_TOKEN_EXPIRY_SECONDS, JSON.stringify(data));
      await client.quit();
    } catch (error) {
      if (client) await client.quit().catch(() => {});
      logger.error('[CSRF] Redis set failed', error);
    }
  }

  async delete(token: string): Promise<void> {
    let client;
    try {
      client = await this.getRedisClient();
      await client.connect();
      await client.del(this.prefix + token);
      await client.quit();
    } catch (error) {
      if (client) await client.quit().catch(() => {});
      logger.warn('[CSRF] Redis delete failed');
    }
  }

  async size(): Promise<number> {
    let client;
    try {
      client = await this.getRedisClient();
      await client.connect();
      const keys = await client.keys(this.prefix + '*');
      await client.quit();
      return keys.length;
    } catch (error) {
      if (client) await client.quit().catch(() => {});
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
  logger.info('[CSRF] Using in-memory token store (not suitable for multi-instance production)');
  return new InMemoryTokenStore();
}

const tokenStore: TokenStore = createTokenStore();

// ============================================================================
// TOKEN GENERATION
// ============================================================================

function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
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

  // Skip CSRF for webhook endpoints (use signature verification instead)
  if (req.path.includes('/webhook')) {
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
  if (authExemptPaths.some(path => req.path.includes(path))) {
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
  const tokenData = await tokenStore.get(headerToken);
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
    await tokenStore.delete(headerToken);
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
