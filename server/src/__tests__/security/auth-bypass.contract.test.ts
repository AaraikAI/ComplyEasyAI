/**
 * Authentication Bypass Contract Tests
 *
 * Drives the REAL `middleware/auth.ts` (not a stub) against a mounted
 * `/api/risks` router and verifies that unauthenticated, expired, malformed,
 * tampered, revoked, and unknown-user requests are rejected with the correct
 * HTTP status code AND that the production security controls actually fire:
 *   - JWT verification is algorithm-pinned to HS256 (alg:none is rejected)
 *   - the token-revocation blacklist is consulted on every authenticated call
 *   - a security event is logged for each authentication failure
 *
 * Only `middleware/auth.ts`'s collaborators are mocked; the middleware itself
 * is exercised end-to-end so that a real auth-bypass regression fails here.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockUser } from '../mocks/prisma';

const JWT_SECRET = 'auth-bypass-test-secret';

// ---------------------------------------------------------------------------
// Mocks — everything the REAL middleware/auth.ts depends on, but NOT auth.ts.
// ---------------------------------------------------------------------------

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), log: jest.fn() },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

const mockLogSecurityEvent = jest.fn();
jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: (...args: unknown[]) => mockLogSecurityEvent(...args),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'authentication_failure',
    AUTHORIZATION_FAILURE: 'authorization_failure',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    TOKEN_REVOKED: 'token_revoked',
  },
}));

jest.mock('../../config/monitoring', () => ({
  __esModule: true,
  default: { setUserContext: jest.fn(), captureException: jest.fn() },
}));

const mockIsRevoked = jest.fn<() => Promise<boolean>>();
const mockIsRevokedByUserReset = jest.fn<() => Promise<boolean>>();
jest.mock('../../services/tokenBlacklistService', () => ({
  __esModule: true,
  default: {
    isRevoked: (...args: unknown[]) => mockIsRevoked(...(args as [])),
    isRevokedByUserReset: (...args: unknown[]) => mockIsRevokedByUserReset(...(args as [])),
  },
}));

// Keep the dynamic session-activity import in auth.ts inert and side-effect free.
jest.mock('../../services/sessionManagementService', () => ({
  __esModule: true,
  default: { updateSessionActivity: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    server: { env: 'test', port: 3001, apiUrl: '', clientUrl: '' },
    jwt: {
      secret: 'auth-bypass-test-secret',
      expiresIn: '1h',
      refreshSecret: 'refresh-secret',
      refreshExpiresIn: '7d',
    },
    security: { rateLimitWindowMs: 60000, rateLimitMaxRequests: 1000 },
  },
}));

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    generateRemediationPlan: jest.fn<() => Promise<string>>().mockResolvedValue('plan'),
  },
}));

jest.mock('../../generated/prisma/client', () => ({
  ComplianceStatus: {
    Compliant: 'Compliant',
    At_Risk: 'At_Risk',
    Non_Compliant: 'Non_Compliant',
    In_Review: 'In_Review',
  },
}));

// ---------------------------------------------------------------------------
// App — REAL routes => REAL authenticate middleware (risks router does router.use(authenticate))
// ---------------------------------------------------------------------------

import risksRoutes from '../../routes/risks';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/risks', risksRoutes);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Helpers — real middleware reads `userId` from the token and pins HS256.
// ---------------------------------------------------------------------------

const generateToken = (
  userId = 'user-123',
  organizationId = 'org-123',
  role = 'admin',
) =>
  jwt.sign(
    { userId, organizationId, role, email: 'test@example.com', name: 'Test User' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );

beforeEach(() => {
  jest.clearAllMocks();
  // resetMocks is on, so re-establish collaborator behavior every test.
  mockIsRevoked.mockResolvedValue(false);
  mockIsRevokedByUserReset.mockResolvedValue(false);
  // authenticate looks the user up by decoded.userId; default to a valid admin.
  prismaMock.user.findUnique.mockResolvedValue(
    createMockUser({ id: 'user-123', organizationId: 'org-123', role: 'admin' }),
  );
  prismaMock.riskItem.findMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth Bypass Contract Tests (real middleware)', () => {
  // -----------------------------------------------------------------------
  // No-auth requests
  // -----------------------------------------------------------------------
  describe('Unauthenticated access', () => {
    const protectedEndpoints: Array<{ method: 'get' | 'post' | 'patch' | 'delete'; path: string }> = [
      { method: 'get', path: '/api/risks' },
      { method: 'post', path: '/api/risks' },
      { method: 'get', path: '/api/risks/risk-123' },
      { method: 'patch', path: '/api/risks/risk-123' },
      { method: 'delete', path: '/api/risks/risk-123' },
    ];

    it.each(protectedEndpoints)(
      'should return 401 for $method $path without auth token',
      async ({ method, path }) => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
        // The real middleware should never reach the DB without a token.
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      },
    );

    it('should emit an AUTHENTICATION_FAILURE security event when no token is supplied', async () => {
      await request(app).get('/api/risks');
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'authentication_failure' }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Expired JWT
  // -----------------------------------------------------------------------
  describe('Expired JWT', () => {
    const expired = () =>
      jwt.sign(
        { userId: 'user-123', organizationId: 'org-123', role: 'admin' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '-10s' },
      );

    it('should return 401 for expired token on GET /api/risks', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${expired()}`);

      expect(res.status).toBe(401);
      // verification fails before any user lookup
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'authentication_failure' }),
      );
    });

    it('should return 401 for expired token on POST /api/risks', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${expired()}`)
        .send({ title: 'Risk' });

      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Malformed JWT
  // -----------------------------------------------------------------------
  describe('Malformed JWT', () => {
    const malformedTokens = [
      'not-a-jwt',
      'eyJ.eyJ.invalid',
      'null',
      'undefined',
      'eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoxfQ.tampered',
      '....',
      '<script>alert(1)</script>',
    ];

    it.each(malformedTokens)(
      'should return 401 for malformed token: "%s"',
      async (token) => {
        const res = await request(app)
          .get('/api/risks')
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      },
    );
  });

  // -----------------------------------------------------------------------
  // Tampered JWT (signed with wrong secret / altered payload)
  // -----------------------------------------------------------------------
  describe('Tampered JWT', () => {
    it('should return 401 for JWT signed with wrong secret', async () => {
      const tampered = jwt.sign(
        { userId: 'user-123', organizationId: 'org-123', role: 'admin' },
        'completely-wrong-secret',
        { algorithm: 'HS256', expiresIn: '1h' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${tampered}`);

      expect(res.status).toBe(401);
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 401 for JWT with an altered payload (broken signature)', async () => {
      const validToken = generateToken();
      const parts = validToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.role = 'SuperAdmin';
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const tampered = parts.join('.');

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${tampered}`);

      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Algorithm pinning — the real middleware passes algorithms:['HS256'].
  // -----------------------------------------------------------------------
  describe('JWT algorithm pinning', () => {
    it('should reject an unsigned (alg:none) token', async () => {
      // jsonwebtoken encodes an alg:none token when algorithm is 'none' and secret is null.
      const noneToken = jwt.sign(
        { userId: 'user-123', organizationId: 'org-123', role: 'admin' },
        '',
        { algorithm: 'none' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${noneToken}`);

      expect(res.status).toBe(401);
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Authorization header format
  // -----------------------------------------------------------------------
  describe('Authorization header format', () => {
    it('should reject a token without the Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', generateToken());

      expect(res.status).toBe(401);
    });

    it('should reject the Basic auth scheme', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Basic ${Buffer.from('user:pass').toString('base64')}`);

      expect(res.status).toBe(401);
    });

    it('should reject an empty Authorization header', async () => {
      const res = await request(app).get('/api/risks').set('Authorization', '');
      expect(res.status).toBe(401);
    });

    it('should reject Bearer with no token', async () => {
      const res = await request(app).get('/api/risks').set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Token revocation — clearing the cookie is not enough; the blacklist must win.
  // -----------------------------------------------------------------------
  describe('Token revocation', () => {
    it('should reject an individually-revoked token with 401', async () => {
      mockIsRevoked.mockResolvedValue(true);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/revoked/i);
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'token_revoked' }),
      );
    });

    it('should reject a token invalidated by a user-wide reset', async () => {
      mockIsRevokedByUserReset.mockResolvedValue(true);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/revoked/i);
    });

    it('should consult the revocation blacklist on a valid authenticated request', async () => {
      await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(mockIsRevoked).toHaveBeenCalled();
      expect(mockIsRevokedByUserReset).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Unknown / deleted user — a structurally-valid token for a missing user fails.
  // -----------------------------------------------------------------------
  describe('Unknown subject', () => {
    it('should return 401 when the token references a non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateToken('ghost-user')}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/user not found/i);
    });
  });

  // -----------------------------------------------------------------------
  // Happy path — a valid token for an existing user is admitted.
  // -----------------------------------------------------------------------
  describe('Valid authentication', () => {
    it('should allow a valid token for an existing user (200)', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(res.status).toBe(200);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-123' } }),
      );
    });
  });
});
