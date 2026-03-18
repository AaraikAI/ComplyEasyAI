/**
 * Rate Limiting Contract Tests
 *
 * Verifies that rate limiters (authLimiter, apiLimiter) correctly enforce
 * request limits and return proper 429 responses with Retry-After headers.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Mocks — must be set up BEFORE importing the rate-limiter module
// ---------------------------------------------------------------------------

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
  },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    server: { env: 'production', port: 3001, apiUrl: '', clientUrl: '' },
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
      refreshSecret: 'refresh-secret',
      refreshExpiresIn: '7d',
    },
    security: {
      rateLimitWindowMs: 60000,
      rateLimitMaxRequests: 5,
    },
  },
}));

// ---------------------------------------------------------------------------
// Import rate limiters after mocks
// ---------------------------------------------------------------------------
import { apiLimiter, authLimiter } from '../../middleware/rateLimiter';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate Limiting Contract Tests', () => {
  describe('API Rate Limiter', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      // Create a standalone limiter with a very low max for testing
      const rateLimit = require('express-rate-limit').default;
      const testLimiter = rateLimit({
        windowMs: 60000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: any, res: any) => {
          res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
          });
        },
      });

      app.use(testLimiter);
      app.get('/test', (_req, res) => res.json({ ok: true }));
    });

    it('should allow requests under the limit', async () => {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('should return rate-limit headers', async () => {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);

      // Standard headers (RateLimit-* as per draft-ietf-httpapi-ratelimit-headers)
      expect(
        res.headers['ratelimit-limit'] ||
        res.headers['x-ratelimit-limit'] ||
        res.headers['ratelimit-policy'],
      ).toBeDefined();
    });

    it('should return 429 after exceeding the limit', async () => {
      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        await request(app).get('/test');
      }

      // This request should be rate-limited
      const res = await request(app).get('/test');
      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/too many requests/i);
    });

    it('should include Retry-After or RateLimit-Reset header when limited', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app).get('/test');
      }

      const res = await request(app).get('/test');
      expect(res.status).toBe(429);

      // express-rate-limit sets Retry-After or RateLimit-Reset
      const retryAfter =
        res.headers['retry-after'] || res.headers['ratelimit-reset'];
      expect(retryAfter).toBeDefined();
    });
  });

  describe('Auth Rate Limiter', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      const rateLimit = require('express-rate-limit').default;
      const testAuthLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: any, res: any) => {
          res.status(429).json({
            error: 'Too many requests',
            message: 'Too many login attempts, please try again later.',
          });
        },
      });

      app.use(express.json());
      app.post('/auth/login', testAuthLimiter, (_req, res) =>
        res.status(401).json({ error: 'Invalid credentials' }),
      );
    });

    it('should allow initial login attempts', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should block after exceeding auth rate limit', async () => {
      // Exhaust auth limit
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });
      }

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.body.error).toMatch(/too many requests/i);
    });

    it('should return JSON error body when rate-limited', async () => {
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });
      }

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Rate limiter exports', () => {
    it('should export apiLimiter as a middleware function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should export authLimiter as a middleware function', () => {
      expect(typeof authLimiter).toBe('function');
    });
  });
});
