/**
 * Authentication Security E2E Tests
 *
 * Tests login behavior, session management, and token handling
 * to ensure no information leakage and proper security boundaries.
 */

import { test, expect } from '@playwright/test';

const API_BASE =
  process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3001';
const APP_URL =
  process.env.APP_URL ||
  process.env.E2E_BASE_URL ||
  'http://localhost:4173';

/**
 * The backend mounts an IP-keyed rate limiter on every `/api/*` route
 * (`apiLimiter`: 100 req / 15 min) and a stricter one on `/api/auth/*`
 * (`authLimiter`: 5 req / 15 min) — see server/src/middleware/rateLimiter.ts.
 *
 * Because every test in this file (and every previous run within the 15-minute
 * window) shares the same source IP, the limiter buckets bleed across tests:
 * once one test exhausts the bucket, unrelated tests receive 429 instead of the
 * 401/403 they actually assert. The server runs behind `app.set('trust proxy', 1)`,
 * so express-rate-limit keys off the left-most `X-Forwarded-For` value. Giving
 * each test its own synthetic client IP isolates its rate-limit bucket, so the
 * genuine auth behaviour (401/403) is observed rather than a noisy-neighbour 429.
 *
 * This does NOT weaken the security assertions — each request still goes through
 * the real auth pipeline unauthenticated; it only prevents cross-test rate-limit
 * contamination. The dedicated rate-limit test intentionally reuses ONE IP so it
 * still trips the limiter.
 */
let ipCounter = 0;
function freshClientIp(): string {
  ipCounter += 1;
  // 203.0.113.0/24 is TEST-NET-3 (RFC 5737) — reserved for documentation/testing.
  return `203.0.113.${(ipCounter % 250) + 1}`;
}
function ipHeaders(ip: string = freshClientIp()): Record<string, string> {
  return { 'X-Forwarded-For': ip, 'X-Real-IP': ip };
}

test.describe('Login Security', () => {
  test('should return generic error for wrong password (no info leak)', async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      headers: ipHeaders(),
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
      headers: ipHeaders(),
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
      headers: ipHeaders(),
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
    // Use ONE dedicated synthetic client IP for the whole loop so all 30 failing
    // attempts land in the SAME rate-limit bucket and reliably exceed the 5/15min
    // authLimiter threshold (otherwise per-test IP isolation would spread them out).
    const dedicatedIp = '203.0.113.222';
    const statuses: number[] = [];
    for (let i = 0; i < 30; i++) {
      const res = await request.post(`${API_BASE}/api/auth/login`, {
        headers: ipHeaders(dedicatedIp),
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

    const res = await request.get(`${API_BASE}/api/risks`, {
      headers: ipHeaders(),
    });
    expect(res.status()).toBe(401);
  });

  test('should reject API requests with expired bearer token', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/risks`, {
      headers: {
        ...ipHeaders(),
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMTIzIiwicm9sZSI6IkFkbWluIiwiZXhwIjoxfQ.invalid',
      },
    });

    expect(res.status()).toBe(401);
  });
});

test.describe('Logout', () => {
  test('should invalidate token on logout', async ({ request }) => {
    // Use one IP for both calls in this test so they share a (fresh) bucket.
    const ip = freshClientIp();

    // Attempt logout (may or may not need auth)
    const logoutRes = await request.post(`${API_BASE}/api/auth/logout`, {
      headers: ipHeaders(ip),
    });

    // Logout should succeed or be safely rejected. Logout is a mutating endpoint
    // protected by CSRF (csrfProtection), so a token-less POST is legitimately
    // rejected with 403 ("CSRF token missing"); an unauthenticated POST may also
    // yield 401. The security-relevant assertion is the one below: a protected
    // resource must remain inaccessible afterwards.
    expect([200, 204, 401, 403]).toContain(logoutRes.status());

    // After logout, subsequent requests with same context should fail
    const protectedRes = await request.get(`${API_BASE}/api/risks`, {
      headers: ipHeaders(ip),
    });
    expect([401, 403]).toContain(protectedRes.status());
  });
});

test.describe('Token Security', () => {
  test('should not accept tokens in query parameters', async ({ request }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoxfQ.fake';

    const res = await request.get(
      `${API_BASE}/api/risks?token=${fakeToken}&access_token=${fakeToken}`,
      { headers: ipHeaders() },
    );

    // Should still be 401 — tokens in query params should not authenticate
    expect(res.status()).toBe(401);
  });

  test('should not expose tokens in response bodies', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      headers: ipHeaders(),
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
    // Auth in this SPA is client-side: AuthContext restores `user_data` from
    // localStorage on boot and ProtectedRoute (routes/ProtectedRoute.tsx) redirects
    // unauthenticated users to "/". The shared storageState (playwright/.auth/user.json)
    // seeds `user_data`, so clearing cookies alone leaves the user "logged in".
    // To genuinely exercise the unauthenticated redirect we must also strip the
    // client-side auth state and keep it stripped across navigations.
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('user_data');
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('refresh_token');
        window.sessionStorage.clear();
      } catch {
        /* storage may be unavailable on about:blank */
      }
    });

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

      // Should either redirect away from the protected path or show a login form.
      // ProtectedRoute redirects unauthenticated users to "/", so the final URL
      // should no longer be on the protected route.
      const onProtectedPath = new URL(currentUrl).pathname === route;
      const isProtected = !onProtectedPath || hasLoginForm;
      expect(isProtected).toBeTruthy();
    }
  });
});
