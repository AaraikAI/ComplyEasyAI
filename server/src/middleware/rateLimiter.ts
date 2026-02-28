import rateLimit from 'express-rate-limit';
import config from '../config';

const isDev = config.server.env === 'development';

export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: isDev ? 0 : config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const frameworkLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: isDev ? 0 : 100,
  message: 'Too many framework requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  skip: () => isDev,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 0 : 10,
  message: 'Too many AI requests, please slow down.',
  skip: () => isDev,
});
