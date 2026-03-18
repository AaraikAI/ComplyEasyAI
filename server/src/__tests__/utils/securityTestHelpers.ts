/**
 * Security Test Helpers
 * OWASP payload generators, injection vectors, auth bypass helpers
 */

import { INJECTION_PAYLOADS, TEST_USERS, createAuthToken } from './contractTestHelpers';
import request from 'supertest';
import { Express } from 'express';

/**
 * Tests all OWASP injection vectors against a string field
 */
export async function testInjectionOnField(
  app: Express,
  method: 'post' | 'patch' | 'put',
  path: string,
  fieldName: string,
  basePayload: Record<string, unknown>,
  token: string
) {
  const results: Array<{ payload: string; status: number; passed: boolean }> = [];

  for (const sqlPayload of INJECTION_PAYLOADS.sql) {
    const payload = { ...basePayload, [fieldName]: sqlPayload };
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    // Should either reject (400) or sanitize (200/201) - never 500
    results.push({ payload: sqlPayload, status: res.status, passed: res.status !== 500 });
  }

  for (const xssPayload of INJECTION_PAYLOADS.xss) {
    const payload = { ...basePayload, [fieldName]: xssPayload };
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    results.push({ payload: xssPayload, status: res.status, passed: res.status !== 500 });
    // If accepted, verify the response doesn't contain unescaped script tags
    if (res.status === 200 || res.status === 201) {
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('<script>');
    }
  }

  return results;
}

/**
 * Tests authentication requirements on an endpoint
 */
export async function testAuthRequired(
  app: Express,
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  payload?: Record<string, unknown>
) {
  // No token
  const noTokenRes = await request(app)[method](path).send(payload);
  expect(noTokenRes.status).toBe(401);

  // Malformed token
  const badTokenRes = await request(app)[method](path)
    .set('Authorization', 'Bearer invalid-token-here')
    .send(payload);
  expect([401, 403]).toContain(badTokenRes.status);

  // Expired token
  const jwt = require('jsonwebtoken');
  const expiredToken = jwt.sign(
    { id: 'user-123', role: 'Admin', organizationId: 'org-123' },
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only-min-32-chars',
    { expiresIn: '0s' }
  );
  const expiredRes = await request(app)[method](path)
    .set('Authorization', `Bearer ${expiredToken}`)
    .send(payload);
  expect([401, 403]).toContain(expiredRes.status);
}

/**
 * Tests RBAC authorization on an endpoint
 */
export async function testRoleAuthorization(
  app: Express,
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  allowedRoles: string[],
  payload?: Record<string, unknown>
) {
  const allRoles = ['Admin', 'Editor', 'Viewer'];

  for (const role of allRoles) {
    const token = createAuthToken({ role });
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    if (allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())) {
      expect(res.status).not.toBe(403);
    } else {
      expect(res.status).toBe(403);
    }
  }
}

/**
 * Tests for IDOR (Insecure Direct Object Reference) vulnerabilities
 */
export async function testIdorProtection(
  app: Express,
  method: 'get' | 'patch' | 'put' | 'delete',
  path: string,
  payload?: Record<string, unknown>
) {
  // User from different organization tries to access resource
  const otherOrgToken = createAuthToken(TEST_USERS.otherOrg);
  const res = await request(app)[method](path)
    .set('Authorization', `Bearer ${otherOrgToken}`)
    .send(payload);
  expect([403, 404]).toContain(res.status);
}

/**
 * Tests that sensitive data is not leaked in responses
 */
export function assertNoSensitiveData(responseBody: unknown) {
  const bodyStr = JSON.stringify(responseBody).toLowerCase();
  const sensitivePatterns = [
    'password',
    'passwordhash',
    'secret',
    'private_key',
    'privatekey',
    'access_token',
    'refresh_token',
    'api_key',
    'apikey',
    'stripe_secret',
    'twofactorsecret',
  ];

  for (const pattern of sensitivePatterns) {
    // Allow "password" as a field name in validation errors, but not as a value
    if (bodyStr.includes(`"${pattern}":"`) && !bodyStr.includes(`"${pattern}":"required"`)) {
      // Check if the value is an actual secret vs a field reference
      const regex = new RegExp(`"${pattern}":\\s*"[^"]{8,}"`, 'i');
      expect(bodyStr).not.toMatch(regex);
    }
  }
}

/**
 * Tests oversized payload rejection
 */
export async function testOversizedPayload(
  app: Express,
  method: 'post' | 'patch' | 'put',
  path: string,
  token: string
) {
  const oversizedPayload = { data: 'x'.repeat(11 * 1024 * 1024) }; // 11MB
  const res = await request(app)[method](path)
    .set('Authorization', `Bearer ${token}`)
    .send(oversizedPayload);
  expect([400, 413]).toContain(res.status);
}

/**
 * Tests prototype pollution prevention
 */
export async function testPrototypePollution(
  app: Express,
  method: 'post' | 'patch' | 'put',
  path: string,
  token: string
) {
  for (const payload of INJECTION_PAYLOADS.prototypePollution) {
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    // Should not cause 500 server error
    expect(res.status).not.toBe(500);
    // Verify Object.prototype was not polluted
    expect((Object.prototype as any).isAdmin).toBeUndefined();
  }
}
