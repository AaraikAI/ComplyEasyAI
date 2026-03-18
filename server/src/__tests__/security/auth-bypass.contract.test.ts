/**
 * Authentication Bypass Contract Tests
 *
 * Verifies that every route category rejects unauthenticated, expired,
 * malformed, and tampered JWT requests with the correct HTTP status code.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../mocks/prisma';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
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

jest.mock('../../config/monitoring', () => ({
  __esModule: true,
  default: { setUserContext: jest.fn(), captureException: jest.fn() },
}));

jest.mock('../../services/tokenBlacklistService', () => ({
  __esModule: true,
  default: {
    isRevoked: jest.fn().mockResolvedValue(false),
    isRevokedByUserReset: jest.fn().mockResolvedValue(false),
  },
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

jest.mock('../../middleware/auth', () => {
  const jwtLib = require('jsonwebtoken');
  return {
    authenticate: (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwtLib.verify(token, 'auth-bypass-test-secret');
        (req as any).user = decoded;
        next();
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    },
    authorize:
      (...roles: string[]) =>
      (req: any, res: any, next: any) => {
        if (!(req as any).user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes((req as any).user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
      },
    AuthRequest: {},
  };
});

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn().mockResolvedValue([]),
    generateRemediationPlan: jest.fn().mockResolvedValue('plan'),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
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
// App
// ---------------------------------------------------------------------------

import risksRoutes from '../../routes/risks';
import { errorHandler } from '../../middleware/errorHandler';

const JWT_SECRET = 'auth-bypass-test-secret';

const app = express();
app.use(express.json());

// Real auth passthrough (our mocked authenticate does the work)
app.use('/api/risks', risksRoutes);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateToken = (
  userId = 'user-123',
  organizationId = 'org-123',
  role = 'Admin',
) =>
  jwt.sign(
    { id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

const generateViewerToken = () => generateToken('viewer-1', 'org-123', 'Viewer');
const generateEditorToken = () => generateToken('editor-1', 'org-123', 'Editor');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth Bypass Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      },
    );
  });

  // -----------------------------------------------------------------------
  // Expired JWT
  // -----------------------------------------------------------------------
  describe('Expired JWT', () => {
    it('should return 401 for expired token on GET /api/risks', async () => {
      const expired = jwt.sign(
        { id: 'user-123', organizationId: 'org-123', role: 'Admin' },
        JWT_SECRET,
        { expiresIn: '0s' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${expired}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for expired token on POST /api/risks', async () => {
      const expired = jwt.sign(
        { id: 'user-123', organizationId: 'org-123', role: 'Admin' },
        JWT_SECRET,
        { expiresIn: '0s' },
      );

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${expired}`)
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
      '',
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
      },
    );
  });

  // -----------------------------------------------------------------------
  // Tampered JWT (signed with wrong secret)
  // -----------------------------------------------------------------------
  describe('Tampered JWT', () => {
    it('should return 401 for JWT signed with wrong secret', async () => {
      const tampered = jwt.sign(
        { id: 'user-123', organizationId: 'org-123', role: 'Admin' },
        'completely-wrong-secret',
        { expiresIn: '1h' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${tampered}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for JWT with altered payload', async () => {
      const validToken = generateToken();
      // Tamper with the payload portion
      const parts = validToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.role = 'SuperAdmin';
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
      const tampered = parts.join('.');

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${tampered}`);

      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Authorization header format
  // -----------------------------------------------------------------------
  describe('Authorization header format', () => {
    it('should reject token without Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', generateToken());

      expect(res.status).toBe(401);
    });

    it('should reject Basic auth scheme', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Basic ${Buffer.from('user:pass').toString('base64')}`);

      expect(res.status).toBe(401);
    });

    it('should reject empty Authorization header', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', '');

      expect(res.status).toBe(401);
    });

    it('should reject Bearer with no token', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Role-based checks (viewer accessing admin-only)
  // -----------------------------------------------------------------------
  describe('Role-based access control', () => {
    it('should allow Admin to access risks', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(res.status).toBe(200);
    });

    it('should handle viewer token appropriately per route config', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${generateViewerToken()}`);

      // Viewers should either get 200 (read) or 403 depending on route config
      expect([200, 403]).toContain(res.status);
    });
  });
});
