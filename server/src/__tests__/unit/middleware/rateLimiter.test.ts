import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

/**
 * We capture the configuration objects passed to `rateLimit()` so we can
 * directly exercise the `skip` callback and verify the options.
 */
const rateLimitConfigs: Record<string, any> = {};
let rateLimitCallIndex = 0;

// Track order of rateLimit calls to map them to exports
const LIMITER_ORDER = ['apiLimiter', 'frameworkLimiter', 'authLimiter', 'aiLimiter'];

jest.mock('express-rate-limit', () => {
  const fn = (options: any) => {
    const name = LIMITER_ORDER[rateLimitCallIndex] || `limiter_${rateLimitCallIndex}`;
    rateLimitConfigs[name] = options;
    rateLimitCallIndex++;
    // Return a middleware function (mock)
    const middleware = jest.fn((_req: any, _res: any, next: any) => next?.());
    (middleware as any).__rateLimitOptions = options;
    return middleware;
  };
  return {
    __esModule: true,
    default: fn,
  };
});

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    security: {
      rateLimitWindowMs: 900000,
      rateLimitMaxRequests: 100,
    },
  },
}));

// ---------------------------------------------------------------------------
// Import module under test – must happen after mocks
// ---------------------------------------------------------------------------

import { apiLimiter, frameworkLimiter, authLimiter, aiLimiter } from '../../../middleware/rateLimiter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSkipReq(overrides: Record<string, any> = {}): any {
  return {
    path: '/',
    method: 'GET',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Existence checks
  // =========================================================================

  describe('exports', () => {
    it('should export apiLimiter as a function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should export frameworkLimiter as a function', () => {
      expect(typeof frameworkLimiter).toBe('function');
    });

    it('should export authLimiter as a function', () => {
      expect(typeof authLimiter).toBe('function');
    });

    it('should export aiLimiter as a function', () => {
      expect(typeof aiLimiter).toBe('function');
    });
  });

  // =========================================================================
  // Configuration verification
  // =========================================================================

  describe('apiLimiter configuration', () => {
    it('should use config security values for windowMs and max', () => {
      const options = rateLimitConfigs['apiLimiter'];
      expect(options).toBeDefined();
      expect(options.windowMs).toBe(900000);
      expect(options.max).toBe(100);
    });

    it('should enable standardHeaders and disable legacyHeaders', () => {
      const options = rateLimitConfigs['apiLimiter'];
      expect(options.standardHeaders).toBe(true);
      expect(options.legacyHeaders).toBe(false);
    });

    it('should have a message string', () => {
      const options = rateLimitConfigs['apiLimiter'];
      expect(typeof options.message).toBe('string');
      expect(options.message).toContain('Too many requests');
    });
  });

  describe('frameworkLimiter configuration', () => {
    it('should use 10-second window with 100 max requests', () => {
      const options = rateLimitConfigs['frameworkLimiter'];
      expect(options).toBeDefined();
      expect(options.windowMs).toBe(10000);
      expect(options.max).toBe(100);
    });
  });

  describe('authLimiter configuration', () => {
    it('should use 15-minute window with 5 max requests', () => {
      const options = rateLimitConfigs['authLimiter'];
      expect(options).toBeDefined();
      expect(options.windowMs).toBe(15 * 60 * 1000);
      expect(options.max).toBe(5);
    });

    it('should skip successful requests', () => {
      const options = rateLimitConfigs['authLimiter'];
      expect(options.skipSuccessfulRequests).toBe(true);
    });
  });

  describe('aiLimiter configuration', () => {
    it('should use 1-minute window with 10 max requests', () => {
      const options = rateLimitConfigs['aiLimiter'];
      expect(options).toBeDefined();
      expect(options.windowMs).toBe(60000);
      expect(options.max).toBe(10);
    });
  });

  // =========================================================================
  // apiLimiter skip function
  // =========================================================================

  describe('apiLimiter skip function', () => {
    let skip: (req: any) => boolean;

    beforeEach(() => {
      skip = rateLimitConfigs['apiLimiter'].skip;
      expect(typeof skip).toBe('function');
    });

    // ----- Health checks and static assets -----

    it('should skip /health endpoint', () => {
      const req = buildSkipReq({ path: '/health', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip /static/* paths', () => {
      const req = buildSkipReq({ path: '/static/js/main.js', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip /static root path', () => {
      const req = buildSkipReq({ path: '/static', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    // ----- TGN prediction endpoints -----

    it('should skip TGN predict-risks endpoint', () => {
      const req = buildSkipReq({ path: '/api/tgn/predict-risks', method: 'POST' });
      expect(skip(req)).toBe(true);
    });

    it('should skip TGN early-warnings endpoint', () => {
      const req = buildSkipReq({ path: '/api/tgn/early-warnings', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    // ----- Control loop operations -----

    it('should skip control-loops history endpoint', () => {
      const req = buildSkipReq({ path: '/api/control-loops/123/history', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip control-loops execute endpoint', () => {
      const req = buildSkipReq({ path: '/api/control-loops/456/execute', method: 'POST' });
      expect(skip(req)).toBe(true);
    });

    it('should skip control-loops pause endpoint', () => {
      const req = buildSkipReq({ path: '/api/control-loops/789/pause', method: 'POST' });
      expect(skip(req)).toBe(true);
    });

    it('should skip control-loops resume endpoint', () => {
      const req = buildSkipReq({ path: '/api/control-loops/abc/resume', method: 'POST' });
      expect(skip(req)).toBe(true);
    });

    // ----- GET requests to list endpoints -----

    it('should skip GET /api/integrations', () => {
      const req = buildSkipReq({ path: '/api/integrations', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip GET /api/frameworks', () => {
      const req = buildSkipReq({ path: '/api/frameworks', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip GET /api/tasks', () => {
      const req = buildSkipReq({ path: '/api/tasks', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip GET /api/risks', () => {
      const req = buildSkipReq({ path: '/api/risks', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should skip GET /api/team', () => {
      const req = buildSkipReq({ path: '/api/team', method: 'GET' });
      expect(skip(req)).toBe(true);
    });

    it('should NOT skip POST /api/integrations (not GET)', () => {
      const req = buildSkipReq({ path: '/api/integrations', method: 'POST' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip POST /api/frameworks (not GET)', () => {
      const req = buildSkipReq({ path: '/api/frameworks', method: 'POST' });
      expect(skip(req)).toBe(false);
    });

    // ----- Development team invite -----

    it('should skip POST /team/invite in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const req = buildSkipReq({ path: '/api/team/invite', method: 'POST' });
      expect(skip(req)).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT skip POST /team/invite in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const req = buildSkipReq({ path: '/api/team/invite', method: 'POST' });
      expect(skip(req)).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    // ----- Paths that should NOT be skipped -----

    it('should NOT skip POST /api/other', () => {
      const req = buildSkipReq({ path: '/api/other', method: 'POST' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip POST /api/users', () => {
      const req = buildSkipReq({ path: '/api/users', method: 'POST' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip PUT /api/frameworks/1', () => {
      const req = buildSkipReq({ path: '/api/frameworks/1', method: 'PUT' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip DELETE /api/tasks/1', () => {
      const req = buildSkipReq({ path: '/api/tasks/1', method: 'DELETE' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip PATCH /api/risks/1', () => {
      const req = buildSkipReq({ path: '/api/risks/1', method: 'PATCH' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip an arbitrary GET endpoint not in the skip list', () => {
      const req = buildSkipReq({ path: '/api/settings', method: 'GET' });
      expect(skip(req)).toBe(false);
    });

    it('should NOT skip /healthcheck (only /health is skipped)', () => {
      const req = buildSkipReq({ path: '/healthcheck', method: 'GET' });
      expect(skip(req)).toBe(false);
    });

    it('should handle empty path gracefully', () => {
      const req = buildSkipReq({ path: '', method: 'GET' });
      expect(skip(req)).toBe(false);
    });
  });
});
