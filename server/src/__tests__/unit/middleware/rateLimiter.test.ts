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
    server: {
      env: 'test',
    },
    logging: {
      level: 'info',
    },
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
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
    it('should use a 10-second window with 50 max requests outside development', () => {
      const options = rateLimitConfigs['frameworkLimiter'];
      expect(options).toBeDefined();
      expect(options.windowMs).toBe(10000);
      // env is mocked as 'test', so the non-development cap (50) applies.
      expect(options.max).toBe(50);
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
  // apiLimiter handler function
  // =========================================================================

  describe('apiLimiter handler', () => {
    it('should have a handler function for rate limit exhaustion', () => {
      const options = rateLimitConfigs['apiLimiter'];
      expect(typeof options.handler).toBe('function');
    });
  });
});
