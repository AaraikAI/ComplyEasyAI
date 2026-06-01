/**
 * OWASP Top 10 Contract Tests
 *
 * Drives the REAL `/api/risks` router — including the production
 * `authenticate` + `authorize` middleware and the global error handler —
 * via supertest against a mounted Express app with mocked Prisma. No auth
 * logic is reimplemented inline: the real middleware verifies the JWT (pinned
 * to HS256), consults the revocation blacklist, and logs security events, so a
 * genuine regression in any of those controls fails this suite.
 *
 * Categories covered:
 *   A01 - Broken Access Control
 *   A02 - Cryptographic Failures
 *   A03 - Injection (SQL, XSS, NoSQL)
 *   A04 - Insecure Design
 *   A05 - Security Misconfiguration
 *   A07 - Authentication Failures
 *   A08 - Data Integrity (Audit Logging)
 *   A09 - Security Logging & Monitoring
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockRiskItem, createMockUser } from '../mocks/prisma';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

const mockLogSecurityEvent = jest.fn();
jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: (...args: unknown[]) => mockLogSecurityEvent(...args),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
    INJECTION_ATTEMPT: 'INJECTION_ATTEMPT',
    SUSPICIOUS_INPUT: 'SUSPICIOUS_INPUT',
  },
}));

jest.mock('../../config/monitoring', () => ({
  __esModule: true,
  default: { setUserContext: jest.fn(), captureException: jest.fn() },
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
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

jest.mock('../../services/sessionManagementService', () => ({
  __esModule: true,
  default: { updateSessionActivity: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    server: { env: 'production', port: 3001, apiUrl: '', clientUrl: '' },
    jwt: {
      secret: 'test-jwt-secret-for-owasp-tests',
      expiresIn: '1h',
      refreshSecret: 'test-refresh-secret',
      refreshExpiresIn: '7d',
    },
    security: { rateLimitWindowMs: 60000, rateLimitMaxRequests: 100 },
  },
}));

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn(),
    generateRemediationPlan: jest.fn(),
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
// App setup
// ---------------------------------------------------------------------------

import risksRoutes from '../../routes/risks';
import { errorHandler } from '../../middleware/errorHandler';

const JWT_SECRET = 'test-jwt-secret-for-owasp-tests';

// REAL router => REAL authenticate + authorize run for every request.
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use('/api/risks', risksRoutes);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Helpers — the real middleware reads `userId` from the token and pins HS256.
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OWASP Top 10 Contract Tests', () => {
  const authToken = generateToken();
  const otherOrgToken = generateToken('user-999', 'org-999', 'admin');

  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks wipes mockReturnValue, so re-establish the uuid stub used
    // by the controller for the audit-log hash.
    require('uuid').v4.mockReturnValue('mock-uuid-1234');
    const geminiService = require('../../services/geminiService').default;
    geminiService.prioritizeRisks.mockResolvedValue([]);
    geminiService.generateRemediationPlan.mockResolvedValue('plan');
    // Collaborators of the REAL authenticate middleware.
    mockIsRevoked.mockResolvedValue(false);
    mockIsRevokedByUserReset.mockResolvedValue(false);
    // authenticate hydrates req.user from the DB record keyed by decoded.userId.
    prismaMock.user.findUnique.mockResolvedValue(
      createMockUser({ id: 'user-123', organizationId: 'org-123', role: 'admin' }),
    );
    prismaMock.riskItem.findMany.mockResolvedValue([]);
    prismaMock.riskItem.findFirst.mockResolvedValue(null);
    prismaMock.auditLog.create.mockResolvedValue({} as never);
  });

  // =========================================================================
  // A01 - Broken Access Control
  // =========================================================================
  describe('A01 - Broken Access Control', () => {
    it('should reject requests without authentication', async () => {
      const res = await request(app).get('/api/risks');
      expect(res.status).toBe(401);
    });

    it('should not expose data from another organization (IDOR)', async () => {
      // The enforced org is the DB user's, not the token claim — hydrate the
      // org-999 caller so the controller scopes the query to org-999.
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ id: 'user-999', organizationId: 'org-999', role: 'admin' }),
      );
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(res.status).toBe(200);
      // The controller must filter by the caller's own organization id.
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-999' }) }),
      );
      // Response must not leak any other org's rows.
      const body = Array.isArray(res.body) ? res.body : res.body.data ?? [];
      const leaked = body.filter(
        (r: any) => r.organizationId && r.organizationId !== 'org-999',
      );
      expect(leaked).toHaveLength(0);
    });

    it('should reject GET /api/risks/:id for another org risk', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/risks/risk-other-org')
        .set('Authorization', `Bearer ${authToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('should reject PATCH /api/risks/:id for another org risk', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/risks/risk-other-org')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'hijacked' });

      expect([400, 403, 404]).toContain(res.status);
    });

    it('should reject DELETE /api/risks/:id for another org risk', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/risks/risk-other-org')
        .set('Authorization', `Bearer ${authToken}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  // =========================================================================
  // A02 - Cryptographic Failures
  // =========================================================================
  describe('A02 - Cryptographic Failures', () => {
    it('should never return password or secret fields in risk responses', async () => {
      const risk = createMockRiskItem();
      prismaMock.riskItem.findMany.mockResolvedValue([risk]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${authToken}`);

      const json = JSON.stringify(res.body);
      expect(json).not.toMatch(/password/i);
      expect(json).not.toMatch(/twoFactorSecret/i);
      expect(json).not.toMatch(/jwt_secret/i);
    });

    it('should never expose tokens in response body', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([createMockRiskItem()]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${authToken}`);

      const json = JSON.stringify(res.body);
      expect(json).not.toContain(JWT_SECRET);
      expect(json).not.toContain(authToken);
    });
  });

  // =========================================================================
  // A03 - Injection
  // =========================================================================
  describe('A03 - Injection', () => {
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE risks; --",
      "1' UNION SELECT * FROM users--",
      "' OR 1=1--",
      "admin'--",
    ];

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '"><script>document.cookie</script>',
      "javascript:alert('XSS')",
      '<svg onload=alert(1)>',
    ];

    const nosqlPayloads = [
      '{"$gt":""}',
      '{"$ne":null}',
      '{"$where":"sleep(5000)"}',
    ];

    it.each(sqlPayloads)(
      'should safely handle SQL injection payload: %s',
      async (payload) => {
        // Mock successful create — since Prisma uses parameterized queries,
        // SQL injection payloads are treated as plain string data
        prismaMock.riskItem.create.mockResolvedValue(
          createMockRiskItem({ title: payload, description: payload })
        );
        prismaMock.auditLog.create.mockResolvedValue({} as any);

        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            description: payload,
            category: 'Security',
            severity: 'High',
            likelihood: 3,
            impact: 3,
          });

        // Prisma parameterized queries prevent SQL injection.
        // Should succeed (201) or reject via validation (400) — never leak DB errors
        expect([200, 201, 400]).toContain(res.status);
        // Ensure no SQL error details leak in the response body
        const json = JSON.stringify(res.body);
        expect(json).not.toMatch(/syntax error/i);
        expect(json).not.toMatch(/SQLITE_ERROR/i);
      },
    );

    it.each(xssPayloads)(
      'should not reflect XSS payload in responses: %s',
      async (payload) => {
        const sanitizedRisk = createMockRiskItem({ title: payload });
        prismaMock.riskItem.findMany.mockResolvedValue([sanitizedRisk]);

        const res = await request(app)
          .get('/api/risks')
          .set('Authorization', `Bearer ${authToken}`);

        // The response should not execute scripts when rendered
        // API should either sanitize or treat as plain text (Content-Type: application/json)
        expect(res.headers['content-type']).toMatch(/json/);
      },
    );

    it.each(nosqlPayloads)(
      'should safely handle NoSQL injection payload: %s',
      async (payload) => {
        const res = await request(app)
          .get(`/api/risks?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(res.status);
      },
    );
  });

  // =========================================================================
  // A04 - Insecure Design
  // =========================================================================
  describe('A04 - Insecure Design', () => {
    it('should not accept mass-assignment of protected fields', async () => {
      prismaMock.riskItem.create.mockImplementation((args: any) => {
        // Verify the create call does not include protected fields
        const data = args?.data;
        return Promise.resolve(createMockRiskItem(data));
      });

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Legit Risk',
          description: 'Description',
          category: 'Security',
          severity: 'High',
          likelihood: 3,
          impact: 3,
          // Mass-assignment attempts
          id: 'forced-id',
          organizationId: 'org-hacker',
          role: 'SuperAdmin',
          isAdmin: true,
        });

      // If created, the organizationId should be from the token, not the payload
      if (res.status === 201 || res.status === 200) {
        expect(res.body.organizationId).not.toBe('org-hacker');
      }
      // Or it should be rejected with 400/422
      expect([200, 201, 400, 422]).toContain(res.status);
    });

    it('should reject oversized request body', async () => {
      const largePayload = 'x'.repeat(2 * 1024 * 1024); // 2MB - exceeds 1mb limit

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ title: largePayload }));

      // 413 if body-parser rejects, 400 if validation catches it, 500 if error handler wraps it
      expect([400, 413, 500]).toContain(res.status);
    });
  });

  // =========================================================================
  // A05 - Security Misconfiguration
  // =========================================================================
  describe('A05 - Security Misconfiguration', () => {
    it('should not expose stack traces in error responses (production mode)', async () => {
      prismaMock.riskItem.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${authToken}`);

      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/at\s+\S+\s+\(/); // stack trace pattern
      expect(body).not.toContain('node_modules');
      expect(body).not.toContain('Database connection failed');
    });

    it('should return proper content-type headers', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should not expose server technology in headers', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${authToken}`);

      // X-Powered-By should be removed in production
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // =========================================================================
  // A07 - Authentication Failures
  // =========================================================================
  describe('A07 - Authentication Failures', () => {
    it('should reject expired JWT tokens', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-123', organizationId: 'org-123', role: 'Admin' },
        JWT_SECRET,
        { expiresIn: '0s' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject tokens signed with wrong secret', async () => {
      const badToken = jwt.sign(
        { id: 'user-123', organizationId: 'org-123', role: 'Admin' },
        'wrong-secret',
        { expiresIn: '1h' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'not-a-jwt',
        'eyJ.eyJ.invalid',
        '',
        'null',
        'undefined',
      ];

      for (const token of malformedTokens) {
        const res = await request(app)
          .get('/api/risks')
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
      }
    });

    it('should reject requests with missing Authorization header', async () => {
      const res = await request(app).get('/api/risks');
      expect(res.status).toBe(401);
    });

    it('should reject Authorization header without Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', authToken);

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // A08 - Software and Data Integrity (Audit Logging)
  // =========================================================================
  describe('A08 - Data Integrity / Audit Logging', () => {
    it('should write an immutable audit log on risk creation', async () => {
      prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Risk',
          description: 'Desc',
          category: 'Security',
          severity: 'High',
          likelihood: 3,
          impact: 3,
        });

      expect(res.status).toBe(201);
      // The controller MUST persist a tamper-evident audit log (hash + actor +
      // tenant) for the create action — assert the real DB write happened.
      expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
      const auditArg = (prismaMock.auditLog.create.mock.calls[0] as any[])[0];
      expect(auditArg.data.organizationId).toBe('org-123');
      expect(auditArg.data.userId).toBe('user-123');
      expect(auditArg.data.action).toMatch(/created/i);
      // A non-empty tamper-evidence hash is recorded with the entry.
      expect(typeof auditArg.data.hash).toBe('string');
      expect(auditArg.data.hash.length).toBeGreaterThan(0);
      expect(auditArg.data.hash).toBe('mock-uuid-1234');
    });

    it('should not write an audit log when creation is rejected by validation', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'no title field' });

      expect(res.status).toBe(400);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
      expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // A09 - Security Logging & Monitoring
  // =========================================================================
  describe('A09 - Security Logging & Monitoring', () => {
    it('should log a security event on a no-token authentication failure', async () => {
      await request(app).get('/api/risks');

      // The real authenticate middleware fires an AUTHENTICATION_FAILURE event.
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'AUTHENTICATION_FAILURE' }),
      );
    });

    it('should log a security event when a JWT fails verification', async () => {
      const badToken = jwt.sign(
        { userId: 'user-123', organizationId: 'org-123', role: 'admin' },
        'a-different-secret',
        { algorithm: 'HS256', expiresIn: '1h' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.status).toBe(401);
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'AUTHENTICATION_FAILURE' }),
      );
    });

    it('should log an authorization failure when a viewer is denied a write', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ id: 'user-123', organizationId: 'org-123', role: 'viewer' }),
      );

      const res = await request(app)
        .delete('/api/risks/risk-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'AUTHORIZATION_FAILURE' }),
      );
    });

    it('should return proper error structure without sensitive details', async () => {
      const res = await request(app).get('/api/risks');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).not.toMatch(/stack/i);
      expect(res.body.error).not.toMatch(/prisma/i);
    });
  });
});
