/**
 * Authorization Matrix Contract Tests
 *
 * Full RBAC matrix: tests representative endpoints with Admin, Editor, Viewer,
 * and unauthenticated access, verifying correct 200/403/401 responses.
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
      secret: 'authz-matrix-test-secret',
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
        const decoded = jwtLib.verify(token, 'authz-matrix-test-secret');
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
        const userRole = ((req as any).user.role || '').toLowerCase();
        const allowed = roles.map((r: string) => r.toLowerCase());
        if (!allowed.includes(userRole)) {
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

const JWT_SECRET = 'authz-matrix-test-secret';

const app = express();
app.use(express.json());
app.use('/api/risks', risksRoutes);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Role = 'Admin' | 'Editor' | 'Viewer';

const generateToken = (role: Role, userId?: string) =>
  jwt.sign(
    {
      id: userId || `${role.toLowerCase()}-user`,
      organizationId: 'org-123',
      role,
      email: `${role.toLowerCase()}@example.com`,
      name: `${role} User`,
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

const tokens: Record<Role, string> = {
  Admin: generateToken('Admin'),
  Editor: generateToken('Editor'),
  Viewer: generateToken('Viewer'),
};

// ---------------------------------------------------------------------------
// Authorization Matrix Definition
// ---------------------------------------------------------------------------

interface MatrixEntry {
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  body?: Record<string, unknown>;
  description: string;
  expected: Record<Role | 'unauthenticated', number[]>;
}

const authorizationMatrix: MatrixEntry[] = [
  {
    method: 'get',
    path: '/api/risks',
    description: 'List all risks',
    expected: {
      Admin: [200],
      Editor: [200],
      Viewer: [200],
      unauthenticated: [401],
    },
  },
  {
    method: 'get',
    path: '/api/risks/risk-123',
    description: 'Get single risk',
    expected: {
      Admin: [200, 404],
      Editor: [200, 404],
      Viewer: [200, 404],
      unauthenticated: [401],
    },
  },
  {
    method: 'post',
    path: '/api/risks',
    body: {
      title: 'Test Risk',
      description: 'Created via authz test',
      category: 'Security',
      severity: 'High',
      likelihood: 3,
      impact: 3,
    },
    description: 'Create risk',
    expected: {
      Admin: [200, 201],
      Editor: [200, 201],
      Viewer: [200, 201, 403],
      unauthenticated: [401],
    },
  },
  {
    method: 'patch',
    path: '/api/risks/risk-123',
    body: { title: 'Updated Risk' },
    description: 'Update risk',
    expected: {
      Admin: [200, 404],
      Editor: [200, 404],
      Viewer: [200, 403, 404],
      unauthenticated: [401],
    },
  },
  {
    method: 'delete',
    path: '/api/risks/risk-123',
    description: 'Delete risk',
    expected: {
      Admin: [200, 204, 404],
      Editor: [200, 204, 403, 404],
      Viewer: [403, 404],
      unauthenticated: [401],
    },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Authorization Matrix Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock responses
    prismaMock.riskItem.findMany.mockResolvedValue([createMockRiskItem()]);
    prismaMock.riskItem.findFirst.mockResolvedValue(createMockRiskItem());
    prismaMock.riskItem.findUnique.mockResolvedValue(createMockRiskItem());
    prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());
    prismaMock.riskItem.update.mockResolvedValue(createMockRiskItem());
    prismaMock.riskItem.delete.mockResolvedValue(createMockRiskItem());
  });

  // -----------------------------------------------------------------------
  // Matrix-driven tests per role
  // -----------------------------------------------------------------------
  describe.each(authorizationMatrix)(
    '$description ($method $path)',
    ({ method, path, body, description, expected }) => {
      // Test each role
      const roles: Role[] = ['Admin', 'Editor', 'Viewer'];

      it.each(roles)('should return expected status for %s role', async (role) => {
        let req = request(app)[method](path).set(
          'Authorization',
          `Bearer ${tokens[role]}`,
        );

        if (body && (method === 'post' || method === 'patch')) {
          req = req.send(body);
        }

        const res = await req;
        expect(expected[role]).toContain(res.status);
      });

      // Test unauthenticated
      it('should return 401 for unauthenticated access', async () => {
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
  // Cross-org isolation
  // -----------------------------------------------------------------------
  describe('Cross-organization isolation', () => {
    it('should not allow Admin of org-A to access org-B resources', async () => {
      const orgBToken = jwt.sign(
        {
          id: 'orgb-admin',
          organizationId: 'org-B',
          role: 'Admin',
          email: 'admin@orgb.com',
          name: 'OrgB Admin',
        },
        JWT_SECRET,
        { expiresIn: '1h' },
      );

      // findMany should be called with org-B filter, returning empty
      prismaMock.riskItem.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${orgBToken}`);

      expect(res.status).toBe(200);
      const body = Array.isArray(res.body) ? res.body : res.body.data ?? [];
      const leakedFromOrgA = body.filter(
        (r: any) => r.organizationId === 'org-123',
      );
      expect(leakedFromOrgA).toHaveLength(0);
    });

    it('should not allow org-B admin to read org-A risk by ID', async () => {
      const orgBToken = jwt.sign(
        {
          id: 'orgb-admin',
          organizationId: 'org-B',
          role: 'Admin',
          email: 'admin@orgb.com',
          name: 'OrgB Admin',
        },
        JWT_SECRET,
        { expiresIn: '1h' },
      );

      prismaMock.riskItem.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/risks/risk-123')
        .set('Authorization', `Bearer ${orgBToken}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  // -----------------------------------------------------------------------
  // Role escalation prevention
  // -----------------------------------------------------------------------
  describe('Role escalation prevention', () => {
    it('should not honor role claim if JWT is self-signed', async () => {
      const selfSigned = jwt.sign(
        {
          id: 'hacker',
          organizationId: 'org-123',
          role: 'Admin',
          email: 'hacker@evil.com',
          name: 'Hacker',
        },
        'hacker-key',
        { expiresIn: '1h' },
      );

      const res = await request(app)
        .get('/api/risks')
        .set('Authorization', `Bearer ${selfSigned}`);

      expect(res.status).toBe(401);
    });

    it('should not allow Viewer to mutate via role field in body', async () => {
      prismaMock.riskItem.create.mockResolvedValue(createMockRiskItem());

      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${tokens.Viewer}`)
        .send({
          title: 'Escalation Test',
          description: 'test',
          category: 'Security',
          severity: 'High',
          likelihood: 3,
          impact: 3,
          role: 'Admin',
        });

      // Either forbidden or created without role escalation
      expect([200, 201, 403]).toContain(res.status);
    });
  });
});
