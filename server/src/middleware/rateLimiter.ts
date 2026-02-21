import rateLimit from 'express-rate-limit';
import config from '../config';

const isDev = config.server.env === 'development';

export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: isDev ? 1000 : config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development, use a higher limit but do NOT skip entirely
    // (to catch rate-limiting bugs during development)
    const path = req.path || '';

    // Only skip for health checks and static assets
    if (path === '/health' || path.startsWith('/static')) {
      return true;
    }

    // All other endpoints are rate-limited (GET included)
    return false;
  },
});

// Framework-specific rate limiter (100 requests in 10 seconds, higher in dev)
export const frameworkLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: isDev ? 1000 : 100,
  message: 'Too many framework requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 200 : 10,
  message: 'Too many AI requests, please slow down.',
});
