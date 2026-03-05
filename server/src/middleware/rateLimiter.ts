import rateLimit from 'express-rate-limit';
import config from '../config';
import logger from '../config/logger';

const isDev = config.server.env === 'development';

// Attempt to use Redis store for rate limiting in production (multi-replica safe)
let storeConfig: { store?: any } = {};

async function initRedisStore(): Promise<void> {
  if (isDev) return;
  try {
    const { default: RedisStore } = await import('rate-limit-redis');
    const cacheService = (await import('../services/cache/redisCacheService')).default;
    const redisClient = cacheService.getRedisClient();
    if (redisClient) {
      storeConfig.store = new RedisStore({
        // @ts-expect-error - ioredis sendCommand compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
      });
      logger.info('[RateLimiter] Using Redis store for rate limiting');
    }
  } catch {
    logger.info('[RateLimiter] Redis store unavailable, using in-memory (install rate-limit-redis for multi-replica)');
  }
}

// Initialize Redis store (async, best-effort)
initRedisStore().catch(() => {});

// In development, use generous but non-zero limits to catch runaway requests.
// In production, use strict limits from config / hardcoded defaults.
export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: isDev ? 1000 : config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...storeConfig,
});

export const frameworkLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: isDev ? 500 : 100,
  message: 'Too many framework requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  ...storeConfig,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  ...storeConfig,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 100 : 10,
  message: 'Too many AI requests, please slow down.',
  ...storeConfig,
});
