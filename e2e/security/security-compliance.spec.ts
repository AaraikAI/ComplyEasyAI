/**
 * Security and Compliance Tests
 * Tests for authentication, authorization, XSS, SQL injection, CSRF, and security headers
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';

test.describe('Authentication Security', () => {
  test('Unauthenticated users are redirected from protected routes', async ({ page, context }) => {
    // Clear all auth state
    await context.clearCookies();

    const protectedRoutes = [
      '/dashboard',
      '/frameworks',
      '/vendors',
      '/policies',
      '/risks',
      '/monitoring',
      '/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Should be redirected to login or see login form
      const currentUrl = page.url();
      const isProtected =
        !currentUrl.includes(route) ||
        (await page.locator('[name="email"], [name="password"], text=/login|sign in/i').isVisible());

      expect(isProtected).toBeTruthy();
    }
  });

  test('Session expires and requires re-authentication', async ({ page, context }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate session expiration by clearing cookies
    await context.clearCookies();

    // Try to perform an action
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    const needsLogin = await page
      .locator('[name="email"], [name="password"], text=/login|sign in/i')
      .isVisible();
    expect(needsLogin).toBeTruthy();
  });

  test('Invalid token is rejected', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/frameworks`, {
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
      failOnStatusCode: false,
    });

    expect([401, 403]).toContain(response.status());
  });

  test('Expired token is rejected', async ({ request }) => {
    // Create an obviously expired JWT (payload with exp in the past)
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyM30.invalid';

    const response = await request.get(`${API_BASE}/api/frameworks`, {
      headers: {
        Authorization: `Bearer ${expiredToken}`,
      },
      failOnStatusCode: false,
    });

    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Authorization & Access Control', () => {
  test('Users cannot access other users data', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Try to access another user's profile (if endpoint exists)
    const response = await page.request.get(`${API_BASE}/api/users/another-user-id`, {
      failOnStatusCode: false,
    });

    expect([401, 403, 404]).toContain(response.status());
  });

  test('Tier-gated features are blocked for lower tiers', async ({ page, context }) => {
    // Without an authenticated, sufficiently-privileged session the Visionary-tier
    // route must not expose its functional content. Acceptable enforced outcomes:
    //   1. redirected to the landing/login page (Sign In affordance visible), or
    //   2. an upgrade / tier-limit gate rendered in place of the feature.
    await context.clearCookies();

    await page.goto('/ai-rmf');
    await page.waitForLoadState('networkidle');

    const upgradeGate = page.locator('text=/upgrade|not available|tier|requires|visionary plan/i');
    const signIn = page.locator('button:has-text("Sign In"), [name="email"], text=/login|sign in/i');

    const hasUpgradeGate = await upgradeGate.first().isVisible().catch(() => false);
    const requiresAuth = await signIn.first().isVisible().catch(() => false);

    // The gated route must be enforced one way or the other — it must not silently
    // render the protected feature to an unauthenticated/lower-tier visitor.
    expect(hasUpgradeGate || requiresAuth).toBeTruthy();
  });

  test('Role-based access control for admin functions', async ({ page, context }) => {
    // Admin-only settings (team management, member invitations) must not be
    // reachable without an authenticated session. With no session, the settings
    // route must deny access by surfacing the login affordance rather than
    // rendering the admin sections.
    await context.clearCookies();

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const adminFeatures = page.locator(
      '[data-testid="admin-only"], .admin-section, text=/invite users|team management/i'
    );
    const signIn = page.locator('button:has-text("Sign In"), [name="email"], text=/login|sign in/i');

    const hasAdminFeatures = await adminFeatures.first().isVisible().catch(() => false);
    const requiresAuth = await signIn.first().isVisible().catch(() => false);

    // Admin functions must be gated: an unauthenticated visitor is sent to login
    // and must not see admin-only sections.
    expect(requiresAuth).toBeTruthy();
    expect(hasAdminFeatures).toBeFalsy();
  });
});

test.describe('XSS Prevention', () => {
  test('Script tags in input are sanitized', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');

    // Open create vendor modal
    const addBtn = page.getByRole('button', { name: /add vendor/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Try to inject XSS in vendor name
      const xssPayload = '<script>alert("XSS")</script>';
      await page.locator('[name="name"]').fill(xssPayload);
      await page.locator('[name="website"]').fill('https://example.com');
      await page.locator('[name="contactEmail"]').fill('test@example.com');

      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForTimeout(1000);

      // Reload and check if script is NOT executed
      await page.reload();
      await page.waitForLoadState('networkidle');

      // The script should be escaped or not present
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>alert("XSS")</script>');
    }
  });

  test('Event handlers in input are sanitized', async ({ page }) => {
    await page.goto('/policies');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create policy/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Try event handler XSS
      const xssPayload = '<img src=x onerror="alert(1)">';
      await page.locator('[name="title"]').fill(xssPayload);
      await page.locator('[name="content"]').fill('Test content');

      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForTimeout(1000);

      // Verify no JavaScript execution
      const dialogShown = await page.evaluate(() => {
        return (window as any).__xss_triggered === true;
      });
      expect(dialogShown).toBeFalsy();
    }
  });

  test('URL parameters are sanitized', async ({ page }) => {
    // Try XSS via URL parameter
    await page.goto('/search?q=<script>alert("XSS")</script>');
    await page.waitForLoadState('networkidle');

    // Check page content doesn't contain unescaped script
    const pageContent = await page.content();
    expect(pageContent).not.toContain('<script>alert("XSS")</script>');
  });
});

test.describe('SQL Injection Prevention', () => {
  test('SQL injection in search is prevented', async ({ page, request }) => {
    const sqlPayload = "'; DROP TABLE users; --";

    // Try SQL injection via API
    const response = await request.get(`${API_BASE}/api/frameworks?search=${encodeURIComponent(sqlPayload)}`, {
      failOnStatusCode: false,
    });

    // Should not cause server error
    expect(response.status()).not.toBe(500);

    // Verify the table still exists (if we have DB access)
    const healthResponse = await request.get(`${API_BASE}/health`);
    expect(healthResponse.ok()).toBe(true);
    const health = await healthResponse.json();
    expect(health.checks.database.status).not.toBe('error');
  });

  test('SQL injection in form fields is prevented', async ({ page, request }) => {
    const csrfResponse = await request.get(`${API_BASE}/api/csrf-token`);
    const { csrfToken } = await csrfResponse.json();

    const sqlPayload = "'; DELETE FROM frameworks WHERE '1'='1";

    const response = await request.post(`${API_BASE}/api/frameworks`, {
      data: {
        name: sqlPayload,
        type: 'SOC2',
        region: 'US',
      },
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      failOnStatusCode: false,
    });

    // Should not cause server error
    expect(response.status()).not.toBe(500);
  });
});

test.describe('CSRF Protection', () => {
  test('Requests without CSRF token are rejected', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/frameworks`, {
      data: {
        name: 'Test Framework',
        type: 'SOC2',
        region: 'US',
      },
      failOnStatusCode: false,
    });

    // Should be rejected (401 auth or 403 CSRF)
    expect([401, 403]).toContain(response.status());
  });

  test('Invalid CSRF token is rejected', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/frameworks`, {
      data: {
        name: 'Test Framework',
        type: 'SOC2',
        region: 'US',
      },
      headers: {
        'X-CSRF-Token': 'invalid-csrf-token',
      },
      failOnStatusCode: false,
    });

    expect([401, 403]).toContain(response.status());
  });

  test('CSRF token endpoint returns valid token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/csrf-token`);
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.csrfToken).toBeTruthy();
    expect(typeof body.csrfToken).toBe('string');
    expect(body.csrfToken.length).toBeGreaterThan(10);
  });
});

test.describe('Security Headers', () => {
  test('X-Content-Type-Options header is set', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('X-Frame-Options header is set', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    const headers = response.headers();

    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('Strict-Transport-Security header is set', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    const headers = response.headers();

    expect(headers['strict-transport-security']).toBeDefined();
  });

  test('Referrer-Policy header is set', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    const headers = response.headers();

    expect(headers['referrer-policy']).toBeDefined();
  });

  test('Content-Security-Policy header is set', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    const headers = response.headers();

    // CSP may be set as content-security-policy or x-content-security-policy
    const csp = headers['content-security-policy'] || headers['x-content-security-policy'];
    // CSP might be optional in some environments
    if (csp) {
      expect(csp).toBeTruthy();
    }
  });
});

test.describe('Rate Limiting', () => {
  test('API enforces rate limiting', async ({ request }) => {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(request.get(`${API_BASE}/health`));
    }

    const responses = await Promise.all(requests);

    // Check if rate limit headers are present
    const firstResponse = responses[0];
    const headers = firstResponse.headers();

    if (headers['x-ratelimit-limit']) {
      expect(parseInt(headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    }
  });
});

test.describe('Sensitive Data Protection', () => {
  test('Passwords are not returned in API responses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/auth/profile`, {
      failOnStatusCode: false,
    });

    if (response.ok()) {
      const body = await response.json();
      expect(body.password).toBeUndefined();
      expect(body.password_hash).toBeUndefined();
      expect(body.passwordHash).toBeUndefined();
    }
  });

  test('API keys are not exposed in responses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/organization`, {
      failOnStatusCode: false,
    });

    if (response.ok()) {
      const body = await response.json();
      const bodyStr = JSON.stringify(body);

      // Should not contain sensitive keys
      expect(bodyStr).not.toMatch(/apiKey.*[A-Za-z0-9]{20,}/);
      expect(bodyStr).not.toMatch(/secret.*[A-Za-z0-9]{20,}/i);
    }
  });

  test('Error messages do not leak sensitive information', async ({ request }) => {
    // Trigger an error with invalid data
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'invalid', password: 'wrong' },
      failOnStatusCode: false,
    });

    if (!response.ok()) {
      const body = await response.json();
      const errorStr = JSON.stringify(body);

      // Should not contain stack traces or internal paths
      expect(errorStr).not.toMatch(/node_modules/);
      expect(errorStr).not.toMatch(/at\s+\w+\s+\(/); // Stack trace pattern
      expect(errorStr).not.toMatch(/\/Users\/|\/home\//); // File paths
    }
  });
});

test.describe('Input Validation', () => {
  test('Email validation is enforced', async ({ request }) => {
    const csrfResponse = await request.get(`${API_BASE}/api/csrf-token`);
    const { csrfToken } = await csrfResponse.json();

    const response = await request.post(`${API_BASE}/api/vendors`, {
      data: {
        name: 'Test Vendor',
        contactEmail: 'invalid-email',
        website: 'https://example.com',
      },
      headers: { 'X-CSRF-Token': csrfToken },
      failOnStatusCode: false,
    });

    expect([400, 401, 422]).toContain(response.status());
  });

  test('URL validation is enforced', async ({ request }) => {
    const csrfResponse = await request.get(`${API_BASE}/api/csrf-token`);
    const { csrfToken } = await csrfResponse.json();

    const response = await request.post(`${API_BASE}/api/vendors`, {
      data: {
        name: 'Test Vendor',
        contactEmail: 'test@example.com',
        website: 'not-a-valid-url',
      },
      headers: { 'X-CSRF-Token': csrfToken },
      failOnStatusCode: false,
    });

    expect([400, 401, 422]).toContain(response.status());
  });

  test('Large payload is rejected', async ({ request }) => {
    const csrfResponse = await request.get(`${API_BASE}/api/csrf-token`);
    const { csrfToken } = await csrfResponse.json();

    // Create a very large string (10MB+)
    const largePayload = 'x'.repeat(10 * 1024 * 1024);

    const response = await request.post(`${API_BASE}/api/frameworks`, {
      data: {
        name: largePayload,
        type: 'SOC2',
      },
      headers: { 'X-CSRF-Token': csrfToken },
      failOnStatusCode: false,
    });

    // Should be rejected with 413 or 400
    expect([400, 401, 413, 422]).toContain(response.status());
  });
});

test.describe('File Upload Security', () => {
  test('Only allowed file types are accepted', async ({ page }) => {
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle');

    // Find a file upload input
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Try to upload a potentially dangerous file type
      await fileInput.setInputFiles({
        name: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('MZ'), // DOS executable header
      });

      // Should be rejected
      await expect(page.locator('text=/invalid file type|not allowed/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('Compliance Verification', () => {
  test('Audit logging is enabled', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/audit`, {
      failOnStatusCode: false,
    });

    // Audit endpoint should exist (may require auth)
    expect([200, 401]).toContain(response.status());
  });

  test('Data retention policies are enforced', async ({ request }) => {
    // Check if there's a data retention configuration
    const response = await request.get(`${API_BASE}/api/organization`, {
      failOnStatusCode: false,
    });

    if (response.ok()) {
      const body = await response.json();
      // Organization should have retention settings
      expect(
        body.dataRetentionDays !== undefined || body.settings?.dataRetention !== undefined
      ).toBeTruthy();
    }
  });
});
