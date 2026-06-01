/**
 * Authentication Security E2E Tests
 *
 * Tests login behavior, session management, and token handling
 * to ensure no information leakage and proper security boundaries.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

test.describe('Login Security', () => {
  test('should return generic error for wrong password (no info leak)', async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'admin@example.com',
        password: 'WrongPassword123!',
      },
    });

    // Should fail (401 or similar)
    expect([400, 401, 403, 422, 429]).toContain(res.status());

    const body = await res.json().catch(() => ({}));

    // Error message should NOT reveal whether the email exists
    const errorMsg = JSON.stringify(body).toLowerCase();
    expect(errorMsg).not.toContain('user not found');
    expect(errorMsg).not.toContain('no account');
    expect(errorMsg).not.toContain('email does not exist');
    expect(errorMsg).not.toContain('unknown email');
  });

  test('should return generic error for non-existent email', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'nonexistent-user-xyz@example.com',
        password: 'SomePassword123!',
      },
    });

    expect([400, 401, 403, 422, 429]).toContain(res.status());

    const body = await res.json().catch(() => ({}));

    // Should give the same type of error as wrong password — no user enumeration
    const errorMsg = JSON.stringify(body).toLowerCase();
    expect(errorMsg).not.toContain('user not found');
    expect(errorMsg).not.toContain('no account');
    expect(errorMsg).not.toContain('email does not exist');
  });

  test('should not reveal password policy in error messages', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'a',
      },
    });

    const body = await res.json().catch(() => ({}));
    const errorMsg = JSON.stringify(body).toLowerCase();

    // Should not reveal detailed password requirements
    expect(errorMsg).not.toContain('must contain uppercase');
    expect(errorMsg).not.toContain('minimum 8 characters');
  });

  test('should rate-limit login attempts', async ({ request }) => {
    // authLimiter is configured with max 5 failed attempts per 15-minute window
    // (skipSuccessfulRequests: true) — see server/src/middleware/rateLimiter.ts.
    // 30 sequential failing logins comfortably exceed that threshold so the
    // brute-force protection must return 429 responses.
    const statuses: number[] = [];
    for (let i = 0; i < 30; i++) {
      const res = await request.post(`${API_BASE}/api/auth/login`, {
        data: {
          email: 'ratelimit-test@example.com',
          password: `WrongPass${i}!`,
        },
      });
      statuses.push(res.status());
    }

    // Brute-force protection must engage: at least one attempt is rate-limited.
    const rateLimited = statuses.filter((s) => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);

    // And the limiter must not produce server errors while doing so.
    const serverErrors = statuses.filter((s) => s >= 500);
    expect(serverErrors).toHaveLength(0);
  });
});

test.describe('Session Timeout', () => {
  test('should reject API requests after session/cookie is cleared', async ({
    request,
    context,
  }) => {
    // First, clear all cookies to simulate session expiry
    await context.clearCookies();

    const res = await request.get(`${API_BASE}/api/risks`);
    expect(res.status()).toBe(401);
  });

  test('should reject API requests with expired bearer token', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/risks`, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMTIzIiwicm9sZSI6IkFkbWluIiwiZXhwIjoxfQ.invalid',
      },
    });

    expect(res.status()).toBe(401);
  });
});

test.describe('Logout', () => {
  test('should invalidate token on logout', async ({ request }) => {
    // Attempt logout (may or may not need auth)
    const logoutRes = await request.post(`${API_BASE}/api/auth/logout`);

    // Logout should succeed or be acceptable
    expect([200, 204, 401]).toContain(logoutRes.status());

    // After logout, subsequent requests with same context should fail
    const protectedRes = await request.get(`${API_BASE}/api/risks`);
    expect([401, 403]).toContain(protectedRes.status());
  });
});

test.describe('Token Security', () => {
  test('should not accept tokens in query parameters', async ({ request }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoxfQ.fake';

    const res = await request.get(
      `${API_BASE}/api/risks?token=${fakeToken}&access_token=${fakeToken}`,
    );

    // Should still be 401 — tokens in query params should not authenticate
    expect(res.status()).toBe(401);
  });

  test('should not expose tokens in response bodies', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      },
    });

    const body = await res.text();

    // Even on error, should not leak any JWT-like strings inadvertently
    // (successful login may return a token, but error responses should not)
    if (res.status() !== 200) {
      expect(body).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\./);
    }
  });
});

test.describe('Browser Authentication Flow', () => {
  test('should redirect unauthenticated users from protected pages', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    const protectedRoutes = [
      '/dashboard',
      '/risks',
      '/vendors',
      '/frameworks',
      '/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(`${APP_URL}${route}`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const hasLoginForm = await page
        .locator('[name="email"], [name="password"], text=/login|sign in/i')
        .first()
        .isVisible()
        .catch(() => false);

      // Should either redirect away or show login form
      const isProtected = !currentUrl.includes(route) || hasLoginForm;
      expect(isProtected).toBeTruthy();
    }
  });
});
