import rateLimit from 'express-rate-limit';
import config from '../config';

export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks, static assets, TGN predictions, control loop operations
    const path = req.path || '';
    const method = req.method || '';
    
    // Skip for health checks and static assets
    if (path === '/health' || path.startsWith('/static')) {
      return true;
    }
    
    // Skip for TGN prediction endpoints
    if (path.includes('/tgn/predict-risks') || path.includes('/tgn/early-warnings')) {
      return true;
    }
    
    // Skip for control loop operations
    if (path.includes('/control-loops/') && (
      path.includes('/history') ||
      path.includes('/execute') ||
      path.includes('/pause') ||
      path.includes('/resume')
    )) {
      return true;
    }
    
    // Skip for GET requests to list endpoints (read-only operations)
    if (method === 'GET' && (
      path.includes('/integrations') ||
      path.includes('/frameworks') ||
      path.includes('/tasks') ||
      path.includes('/risks') ||
      path.includes('/team')
    )) {
      return true;
    }

    // In development, skip rate limit for team invite to avoid 429 during testing
    if (process.env.NODE_ENV === 'development' && method === 'POST' && path.includes('/team/invite')) {
      return true;
    }
    
    // Apply rate limiting to write operations (POST, PUT, PATCH, DELETE)
    return false;
  },
});

// Framework-specific rate limiter (100 requests in 10 seconds)
export const frameworkLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 100, // 100 requests per window
  message: 'Too many framework requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit AI requests to 10 per minute
  message: 'Too many AI requests, please slow down.',
});
