/**
 * Authorization Matrix Contract Tests
 *
 * Drives the REAL `authenticate` + `authorize` middleware (from
 * `middleware/auth.ts`) through the mounted `/api/risks` router for Admin,
 * Editor, Viewer, and unauthenticated callers, asserting the exact 200/201/
 * 403/401/404 the production RBAC actually produces.
 *
 * Important: the role enforced by `authorize` is the role on the *database*
 * user record loaded by `authenticate`, not the JWT claim. The escalation
 * tests below rely on that: a token claiming a higher role than the stored
 * user is still rejected. Expected-status sets are tightened (no "or 403"
 * wildcards) so a privilege-escalation regression fails the suite.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockRiskItem, createMockUser } from '../mocks/prisma';

const JWT_SECRET = 'authz-matrix-test-secret';

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

jest.mock('../../services/sessionManagementService', () => ({
  __esModule: true,
  default: { updateSessionActivity: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    server: { env: 'test', port: 3001, apiUrl: '', clientUrl: '' },
    jwt: {
      secret: 'authz-matrix-test-secret',
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
// App — real router => real authenticate + authorize.
// ---------------------------------------------------------------------------

import risksRoutes from '../../routes/risks';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/risks', risksRoutes);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The routes authorize on lowercase role names ('admin' | 'editor'); the DB
// user role is what `authorize` checks, so we mint matching lowercase roles.
type Role = 'admin' | 'editor' | 'viewer';

const userIdFor = (role: Role) => `${role}-user`;

const tokenFor = (role: Role, organizationId = 'org-123') =>
  jwt.sign(
    {
      userId: userIdFor(role),
      organizationId,
      role,
      email: `${role}@example.com`,
      name: `${role} user`,
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );

// Resolve the DB user (and therefore the enforced role) from the token's userId,
// so `authenticate` hydrates req.user with the authoritative role.
function wireUserLookup(orgId = 'org-123') {
  prismaMock.user.findUnique.mockImplementation((args: any) => {
    const id: string = args?.where?.id ?? '';
    const role = (id.split('-')[0] || 'viewer') as Role;
    return Promise.resolve(
      createMockUser({ id, organizationId: orgId, role }),
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsRevoked.mockResolvedValue(false);
  mockIsRevokedByUserReset.mockResolvedValue(false);
  wireUserLookup();
  // Default data-layer responses for the controller.
  prismaMock.riskItem.findMany.mockResolvedValue([createMockRiskItem()]);
  prismaMock.riskItem.findFirst.mockResolvedValue(createMockRiskItem());
  prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());
  prismaMock.riskItem.update.mockResolvedValue(createMockRiskItem());
  prismaMock.riskItem.delete.mockResolvedValue(createMockRiskItem());
  prismaMock.auditLog.create.mockResolvedValue({} as never);
});

// ---------------------------------------------------------------------------
// Authorization Matrix Definition (tightened expected statuses)
// ---------------------------------------------------------------------------

interface MatrixEntry {
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  body?: Record<string, unknown>;
  description: string;
  expected: Record<Role | 'unauthenticated', number[]>;
}

const createBody = {
  title: 'Test Risk',
  description: 'Created via authz test',
  category: 'Security',
  severity: 'High',
  likelihood: 3,
  impact: 3,
};

const authorizationMatrix: MatrixEntry[] = [
  {
    method: 'get',
    path: '/api/risks',
    description: 'List risks (read, all roles)',
    expected: { admin: [200], editor: [200], viewer: [200], unauthenticated: [401] },
  },
  {
    method: 'get',
    path: '/api/risks/risk-123',
    description: 'Get single risk (read, all roles)',
    expected: { admin: [200], editor: [200], viewer: [200], unauthenticated: [401] },
  },
  {
    method: 'post',
    path: '/api/risks',
    body: createBody,
    description: 'Create risk (admin/editor only)',
    expected: { admin: [201], editor: [201], viewer: [403], unauthenticated: [401] },
  },
  {
    method: 'patch',
    path: '/api/risks/risk-123',
    body: { title: 'Updated Risk' },
    description: 'Update risk (admin/editor only)',
    expected: { admin: [200], editor: [200], viewer: [403], unauthenticated: [401] },
  },
  {
    method: 'delete',
    path: '/api/risks/risk-123',
    description: 'Delete risk (admin only)',
    expected: { admin: [200], editor: [403], viewer: [403], unauthenticated: [401] },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Authorization Matrix Contract Tests (real RBAC)', () => {
  describe.each(authorizationMatrix)(
    '$description ($method $path)',
    ({ method, path, body, expected }) => {
      const roles: Role[] = ['admin', 'editor', 'viewer'];

      it.each(roles)('enforces the exact status for the %s role', async (role) => {
        let req = request(app)[method](path).set('Authorization', `Bearer ${tokenFor(role)}`);
        if (body && (method === 'post' || method === 'patch')) {
          req = req.send(body);
        }
        const res = await req;
        expect(expected[role]).toContain(res.status);

        // Forbidden roles must be denied by authorize() AND logged as such.
        if (expected[role][0] === 403) {
          expect(res.status).toBe(403);
          expect(mockLogSecurityEvent).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'authorization_failure' }),
          );
        }
      });

      it('returns 401 for unauthenticated access', async () => {
        let req = request(app)[method](path);
        if (body && (method === 'post' || method === 'patch')) {
          req = req.send(body);
        }
        const res = await req;
        expect(expected.unauthenticated).toContain(res.status);
      });
    },
  );

  // -----------------------------------------------------------------------
  // Cross-organization isolation — controller scopes every query by org.
  // -----------------------------------------------------------------------
  describe('Cross-organization isolation', () => {
    it('returns only the caller org rows for a list request', async () => {
      // The enforced org is the one on the DB user that `authenticate` loads,
      // not the token claim — so we hydrate an org-B admin for this subject.
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ id: 'admin-user', organizationId: 'org-B', role: 'admin' }),
      );
      // Correctly-scoped controller returns nothing from org-A.
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${tokenFor('admin', 'org-B')}`);

      expect(res.status).toBe(200);
      // The controller must pass the caller's (DB) org into the query.
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-B' }) }),
      );
      const list = Array.isArray(res.body) ? res.body : res.body.data ?? [];
      expect(list.filter((r: any) => r.organizationId === 'org-123')).toHaveLength(0);
    });

    it('returns 404 when org-B admin reads an org-A risk by id', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ id: 'admin-user', organizationId: 'org-B', role: 'admin' }),
      );
      // findFirst is org-scoped; a wrong-org id yields null => 404.
      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/risks/risk-123')
        .set('Authorization', `Bearer ${tokenFor('admin', 'org-B')}`);

      expect(res.status).toBe(404);
      expect(prismaMock.riskItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-B' }) }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Role-escalation prevention.
  // -----------------------------------------------------------------------
  describe('Role escalation prevention', () => {
    it('rejects a self-signed token regardless of its role claim', async () => {
      const selfSigned = jwt.sign(
        { userId: 'admin-user', organizationId: 'org-123', role: 'admin' },
        'attacker-key',
        { algorithm: 'HS256', expiresIn: '1h' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${selfSigned}`);

      expect(res.status).toBe(401);
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('honors the DB role, not the token claim: a viewer claiming admin cannot create', async () => {
      // The DB user for this subject is a viewer even though the token says admin.
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ id: 'sneaky', organizationId: 'org-123', role: 'viewer' }),
      );
      const forgedClaim = jwt.sign(
        { userId: 'sneaky', organizationId: 'org-123', role: 'admin' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' },
      );

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${forgedClaim}`)
        .send(createBody);

      expect(res.status).toBe(403);
      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });

    it('ignores a role field smuggled in the request body (admin authorize still applies)', async () => {
      // Unknown keys are stripped/rejected by validateBody; an editor cannot
      // delete by adding role:'admin' to the body.
      const res = await request(app)
        .delete('/api/risks/risk-123')
        .set('Authorization', `Bearer ${tokenFor('editor')}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
      expect(prismaMock.riskItem.delete).not.toHaveBeenCalled();
    });
  });
});
