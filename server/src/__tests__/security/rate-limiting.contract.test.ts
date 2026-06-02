/**
 * Rate Limiting Contract Tests
 *
 * Mounts the REAL exported limiters (`apiLimiter`, `authLimiter`) from
 * `middleware/rateLimiter.ts` and drives them with supertest, asserting the
 * production thresholds and 429 behaviour rather than a freshly-built inline
 * `rateLimit()` instance:
 *   - apiLimiter enforces exactly `config.security.rateLimitMaxRequests` (5)
 *     requests/window and then returns the production 429 JSON body.
 *   - authLimiter enforces a 5-attempt window AND honours
 *     `skipSuccessfulRequests` (successful logins do not consume the budget).
 *   - a RATE_LIMIT_EXCEEDED security event is logged when a limiter trips.
 *
 * The in-memory store is used because the test config runs with a non-dev env
 * and no Redis client is connected, so `resolveRedisStore()` returns undefined.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Mocks — must be set up BEFORE importing the rate-limiter module
// ---------------------------------------------------------------------------

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockLogSecurityEvent = jest.fn();
jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: (...args: unknown[]) => mockLogSecurityEvent(...args),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
  },
}));

// Non-dev env => strict production limits and the in-memory store path.
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
// Import the REAL limiters after mocks
// ---------------------------------------------------------------------------
import { apiLimiter, authLimiter } from '../../middleware/rateLimiter';
import config from '../../config';

const API_MAX = config.security.rateLimitMaxRequests; // 5
const AUTH_MAX = 5; // authLimiter production max (15-min window)

// A fresh app per test so the in-memory limiter counter starts empty. Because
// the limiter keys on client IP and supertest reuses a loopback socket, we
// vary the X-Forwarded-For header per logical client where isolation matters.
function makeApiApp() {
  const app = express();
  // Trust exactly one proxy hop (safe, non-permissive) so the limiter keys on
  // the X-Forwarded-For client IP without tripping the permissive-proxy guard.
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(apiLimiter);
  app.get('/resource', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

function makeAuthApp(loginStatus: number) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.post('/auth/login', authLimiter, (_req, res) => {
    res.status(loginStatus).json(loginStatus === 200 ? { ok: true } : { error: 'Invalid credentials' });
  });
  return app;
}

let clientCounter = 0;
function nextClientIp(): string {
  clientCounter += 1;
  return `203.0.113.${clientCounter % 250 + 1}`;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate Limiting Contract Tests (real production limiters)', () => {
  describe('apiLimiter — the imported production middleware', () => {
    it('is a mounted Express middleware function', () => {
      expect(typeof apiLimiter).toBe('function');
      // arity: (req, res, next)
      expect(apiLimiter.length).toBe(3);
    });

    it(`allows exactly ${API_MAX} requests then returns 429 with the production body`, async () => {
      const app = makeApiApp();
      const ip = nextClientIp();

      for (let i = 0; i < API_MAX; i++) {
        const ok = await request(app).get('/resource').set('X-Forwarded-For', ip);
        expect(ok.status).toBe(200);
        expect(ok.body).toEqual({ ok: true });
      }

      const limited = await request(app).get('/resource').set('X-Forwarded-For', ip);
      expect(limited.status).toBe(429);
      // The production handler's exact JSON contract.
      expect(limited.body).toEqual({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    });

    it('emits a RATE_LIMIT_EXCEEDED security event when the api limiter trips', async () => {
      const app = makeApiApp();
      const ip = nextClientIp();

      for (let i = 0; i <= API_MAX; i++) {
        await request(app).get('/resource').set('X-Forwarded-For', ip);
      }

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'high',
          details: { limiter: 'api' },
        }),
      );
    });

    it('exposes the standard RateLimit-* headers (standardHeaders enabled)', async () => {
      const app = makeApiApp();
      const ip = nextClientIp();

      const res = await request(app).get('/resource').set('X-Forwarded-For', ip);
      expect(res.status).toBe(200);
      const limitHeader =
        res.headers['ratelimit-limit'] || res.headers['ratelimit-policy'];
      expect(limitHeader).toBeDefined();
      // Standard draft headers, NOT the legacy X-RateLimit-* ones.
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });

    it('isolates counters per client IP', async () => {
      const app = makeApiApp();
      const ipA = nextClientIp();
      const ipB = nextClientIp();

      // Exhaust client A.
      for (let i = 0; i <= API_MAX; i++) {
        await request(app).get('/resource').set('X-Forwarded-For', ipA);
      }
      const aLimited = await request(app).get('/resource').set('X-Forwarded-For', ipA);
      expect(aLimited.status).toBe(429);

      // Client B is unaffected.
      const bOk = await request(app).get('/resource').set('X-Forwarded-For', ipB);
      expect(bOk.status).toBe(200);
    });
  });

  describe('authLimiter — the imported production middleware', () => {
    it('is a mounted Express middleware function', () => {
      expect(typeof authLimiter).toBe('function');
      expect(authLimiter.length).toBe(3);
    });

    it(`blocks after ${AUTH_MAX} failed login attempts with a 429`, async () => {
      const app = makeAuthApp(401);
      const ip = nextClientIp();

      for (let i = 0; i < AUTH_MAX; i++) {
        const res = await request(app)
          .post('/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ email: 'a@b.com', password: 'wrong' });
        expect(res.status).toBe(401);
      }

      const blocked = await request(app)
        .post('/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'a@b.com', password: 'wrong' });

      expect(blocked.status).toBe(429);
      expect(blocked.body.error).toMatch(/too many requests/i);
    });

    it('logs a RATE_LIMIT_EXCEEDED event tagged as the auth limiter', async () => {
      const app = makeAuthApp(401);
      const ip = nextClientIp();

      for (let i = 0; i <= AUTH_MAX; i++) {
        await request(app)
          .post('/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ email: 'a@b.com', password: 'wrong' });
      }

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'RATE_LIMIT_EXCEEDED', details: { limiter: 'auth' } }),
      );
    });

    it('honours skipSuccessfulRequests: successful logins never exhaust the budget', async () => {
      const app = makeAuthApp(200);
      const ip = nextClientIp();

      // Far more than the limit, but all succeed (2xx) so none are counted.
      for (let i = 0; i < AUTH_MAX + 5; i++) {
        const res = await request(app)
          .post('/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ email: 'a@b.com', password: 'right' });
        expect(res.status).toBe(200);
      }

      // The very next successful attempt is still allowed (never 429).
      const stillOk = await request(app)
        .post('/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'a@b.com', password: 'right' });
      expect(stillOk.status).toBe(200);
    });
  });
});
