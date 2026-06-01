import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import config from '../config';
import logger from '../config/logger';
import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';

const isDev = config.server.env === 'development';

/**
 * Resolve the shared Redis store for rate limiting (multi-replica safe).
 *
 * The Redis client is created lazily and the store is only available after the
 * cache service has connected. Because store resolution is asynchronous, each
 * limiter is built AFTER this resolves (see `buildLimiter`) so the store is
 * actually attached rather than captured as an empty object at module load.
 */
async function resolveRedisStore(): Promise<NonNullable<Options['store']> | undefined> {
  if (isDev) return undefined;
  try {
    const { default: RedisStore } = await import('rate-limit-redis');
    const cacheService = (await import('../services/cache/redisCacheService')).default;
    // Ensure the cache service has attempted its Redis connection before we
    // ask for the client — otherwise getRedisClient() returns null too early.
    if (!cacheService.isRedisConnected()) {
      await cacheService.initialize();
    }
    const redisClient = cacheService.getRedisClient();
    if (redisClient) {
      logger.info('[RateLimiter] Using Redis store for rate limiting');
      return new RedisStore({
        // @ts-expect-error - ioredis sendCommand compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
      });
    }
    logger.info('[RateLimiter] Redis client not connected, using in-memory store');
  } catch {
    logger.info('[RateLimiter] Redis store unavailable, using in-memory (install rate-limit-redis for multi-replica)');
  }
  return undefined;
}

/**
 * Shared rate-limit exhaustion handler.  Fires a security event before sending
 * the standard 429 response.  The `limiterName` parameter is captured in a
 * closure so each limiter can identify itself.
 */
function createRateLimitHandler(limiterName: string): Options['handler'] {
  return (req: Request, res: Response) => {
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'high',
      message: `Rate limit exceeded on ${limiterName} limiter`,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl || req.path,
      userId: (req as any).user?.id,
      details: { limiter: limiterName },
    });
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again later.`,
    });
  };
}

/**
 * Build a limiter as a stable pass-through middleware.
 *
 * The concrete express-rate-limit handler is constructed immediately with the
 * in-memory store so the app is protected from the first request. Once the
 * shared Redis store resolves, the underlying limiter is rebuilt WITH the store
 * attached and swapped in atomically. The exported value is a fixed function
 * reference (safe to import by name across routes at module load) that always
 * delegates to the currently-active limiter — so the Redis store is genuinely
 * applied cluster-wide instead of being lost to an async race.
 */
function buildLimiter(name: string, options: Partial<Options>): RequestHandler {
  let active: RequestHandler = rateLimit({
    ...options,
    handler: createRateLimitHandler(name),
  });

  // Upgrade to the Redis-backed store once it is available.
  storeReady
    .then((store) => {
      if (store) {
        active = rateLimit({
          ...options,
          store,
          handler: createRateLimitHandler(name),
        });
      }
    })
    .catch(() => {
      /* keep in-memory limiter on resolution failure */
    });

  return (req: Request, res: Response, next: NextFunction): void => {
    active(req, res, next);
  };
}

// Resolve the shared store once; every limiter awaits the SAME promise so the
// store is attached after it is ready rather than spread synchronously (empty).
const storeReady: Promise<NonNullable<Options['store']> | undefined> = resolveRedisStore();

// In development, use generous but non-zero limits to catch runaway requests.
// In production, use strict limits from config / hardcoded defaults.
export const apiLimiter = buildLimiter('api', {
  windowMs: config.security.rateLimitWindowMs,
  max: isDev ? 1000 : config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const frameworkLimiter = buildLimiter('framework', {
  windowMs: 10 * 1000,
  max: isDev ? 500 : 50,
  message: 'Too many framework requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = buildLimiter('auth', {
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const aiLimiter = buildLimiter('ai', {
  windowMs: 60 * 1000,
  max: isDev ? 100 : 10,
  message: 'Too many AI requests, please slow down.',
});

// SSO rate limiter — generous to allow SAML callbacks and login flows
export const ssoLimiter = buildLimiter('sso', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 500 : 100,
  message: 'Too many SSO requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// SCIM provisioning rate limiter — generous to support bulk user provisioning
export const scimLimiter = buildLimiter('scim', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 200,
  message: 'Too many SCIM provisioning requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
