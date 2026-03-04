import rateLimit from 'express-rate-limit';
import config from '../config';

const isDev = config.server.env === 'development';

// In development, use generous but non-zero limits to catch runaway requests.
// In production, use strict limits from config / hardcoded defaults.
export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: isDev ? 1000 : config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const frameworkLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: isDev ? 500 : 100,
  message: 'Too many framework requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 100 : 10,
  message: 'Too many AI requests, please slow down.',
});
