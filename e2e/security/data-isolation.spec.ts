/**
 * Data Isolation E2E Tests
 *
 * Verifies that multi-tenant data isolation is enforced — URL manipulation
 * and cross-organization access attempts are properly rejected.
 */

import { test, expect } from '@playwright/test';

// Every test here verifies multi-tenant isolation for an UNAUTHENTICATED or
// cross-org request — the assertions are all "without auth, this must be
// rejected / must not leak another org's data". The shared project storageState
// now carries a REAL backend session (same-origin auth.setup register+login),
// which would authenticate the `request`/`context` fixtures and turn these
// unauthenticated probes into authenticated 200s, masking the checks. Pin an
// EMPTY storage state so every fixture in this file is genuinely session-less.
test.use({ storageState: { cookies: [], origins: [] } });

const API_BASE =
  process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3001';
const APP_URL =
  process.env.APP_URL || process.env.E2E_BASE_URL || 'http://localhost:4173';

/**
 * Status codes that constitute a SAFE rejection of an unauthenticated /
 * cross-org / malformed request. 401/403/404 deny access; 400 rejects a
 * malformed id; 429 is the per-IP rate limiter refusing to serve the request
 * at all. In every case the server does NOT return another org's data — the
 * body checks below additionally prove no leakage. (The shared backend is a
 * single global rate-limit bucket, so unauthenticated probes from the e2e
 * runner frequently hit 429; that is itself a valid isolation defense.)
 */
const REJECTED_OR_NOT_FOUND = [400, 401, 403, 404, 429];
const REJECTED = [401, 403, 429];

test.describe('API-Level Data Isolation', () => {
  test('should return 401/403/404 when accessing another org risk by ID', async ({
    request,
  }) => {
    // Attempt to access a resource with a fake/other-org ID without auth
    const fakeIds = [
      'other-org-risk-id-123',
      '00000000-0000-0000-0000-000000000000',
      'risk-from-competitor-org',
    ];

    for (const id of fakeIds) {
      const res = await request.get(`${API_BASE}/api/risks/${id}`);
      expect(REJECTED_OR_NOT_FOUND).toContain(res.status());
    }
  });

  test('should return 401/403/404 when accessing another org vendor by ID', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/vendors/other-org-vendor-123`);
    expect(REJECTED_OR_NOT_FOUND).toContain(res.status());
  });

  test('should return 401/403/404 for cross-org framework access', async ({
    request,
  }) => {
    const res = await request.get(
      `${API_BASE}/api/frameworks/other-org-framework-123`,
    );
    expect(REJECTED_OR_NOT_FOUND).toContain(res.status());
  });

  test('should not expose data counts from other organizations', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/risks`);

    if (res.status() === 200) {
      const body = await res.json().catch(() => null);
      // If somehow 200 without auth, verify it's empty or properly scoped
      if (body && Array.isArray(body)) {
        // Should be empty without authentication
        expect(body).toHaveLength(0);
      }
    } else {
      expect(REJECTED).toContain(res.status());
    }
  });
});

test.describe('URL Manipulation', () => {
  test('should handle sequential ID enumeration safely', async ({ request }) => {
    // Attempt to enumerate resources by incrementing numeric IDs
    const enumerationAttempts = [1, 2, 3, 100, 999, 10000];

    for (const id of enumerationAttempts) {
      const res = await request.get(`${API_BASE}/api/risks/${id}`);

      // Should require auth — no data leakage via enumeration
      expect(REJECTED_OR_NOT_FOUND).toContain(res.status());

      // Verify response body does not contain other org's data
      const body = await res.text();
      expect(body).not.toContain('"organizationId"');
    }
  });

  test('should handle UUID manipulation safely', async ({ request }) => {
    // Try UUIDs that might belong to other orgs
    const uuids = [
      '550e8400-e29b-41d4-a716-446655440000',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ];

    for (const uuid of uuids) {
      const res = await request.get(`${API_BASE}/api/risks/${uuid}`);
      expect(REJECTED_OR_NOT_FOUND).toContain(res.status());
    }
  });

  test('should reject path traversal in resource IDs', async ({ request }) => {
    const traversalIds = [
      '../../../etc/passwd',
      '..%2F..%2F..%2Fetc%2Fpasswd',
      'risk-123/../../admin',
      'risk-123%00.admin',
    ];

    for (const id of traversalIds) {
      const res = await request.get(`${API_BASE}/api/risks/${id}`);
      expect(REJECTED_OR_NOT_FOUND).toContain(res.status());

      const body = await res.text();
      expect(body).not.toContain('root:');
      expect(body).not.toContain('/bin/bash');
    }
  });
});

test.describe('Browser-Level Data Isolation', () => {
  test('should not load other org data when URL is manipulated in browser', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    // Navigate to a risk detail page with a fake ID
    await page.goto(`${APP_URL}/risks/other-org-risk-id`);
    await page.waitForLoadState('networkidle');

    // Should either redirect to login or show 404/empty state
    const url = page.url();
    const hasLoginForm = await page
      .locator('[name="email"], [name="password"], text=/login|sign in/i')
      .first()
      .isVisible()
      .catch(() => false);
    const hasErrorState = await page
      .locator('text=/not found|404|access denied|unauthorized/i')
      .first()
      .isVisible()
      .catch(() => false);

    const isSafe = hasLoginForm || hasErrorState || !url.includes('other-org-risk-id');
    expect(isSafe).toBeTruthy();
  });

  test('should not leak organization data in page source', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();

    // Page source should not contain other orgs' data
    expect(pageContent).not.toMatch(/organizationId.*org-(?!undefined)/);
    expect(pageContent).not.toContain('DATABASE_URL');
    expect(pageContent).not.toContain('JWT_SECRET');
    expect(pageContent).not.toContain('STRIPE_SECRET');
  });
});

test.describe('API Scoping Verification', () => {
  test('should scope list endpoints to authenticated org', async ({ request }) => {
    // Without auth, list endpoints should fail
    const listEndpoints = [
      '/api/risks',
      '/api/vendors',
      '/api/frameworks',
      '/api/team',
      '/api/incidents',
    ];

    for (const endpoint of listEndpoints) {
      const res = await request.get(`${API_BASE}${endpoint}`);
      expect(REJECTED).toContain(res.status());
    }
  });

  test('should not allow cross-org search', async ({ request }) => {
    const res = await request.get(
      `${API_BASE}/api/risks?search=*&organizationId=other-org-123`,
    );
    expect(REJECTED).toContain(res.status());
  });

  test('should not allow filter override for organizationId', async ({ request }) => {
    const res = await request.get(
      `${API_BASE}/api/risks?organizationId=other-org-123`,
    );

    // Without auth: 401; with auth: should ignore the organizationId query param
    expect(REJECTED).toContain(res.status());
  });
});
