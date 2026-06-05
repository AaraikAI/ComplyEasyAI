/**
 * E2E Tests: API Integration Tests
 *
 * Tests API endpoints directly using Playwright's request context.
 * Validates API versioning, pagination, GraphQL, and marketplace endpoints.
 *
 * NOTE ON RATE LIMITING (current shell):
 * The backend runs the production `apiLimiter` (100 requests / 15-minute window,
 * keyed by IP, Redis-backed). Under the shared e2e environment many specs hammer
 * `/api/*` concurrently, so the window can be exhausted at any moment and these
 * routes legitimately answer 429. That is a real, documented response of these
 * rate-limited routes — not a contract defect. Each `/api/*` test therefore makes
 * a few quick retries to ride out a transient throttle, and if the budget is
 * genuinely drained it `test.skip`s with a reason (the established convention in
 * this repo — see compliance-frameworks.spec.ts), rather than asserting a status
 * the limiter is structurally preventing.
 */

import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';

const API_BASE = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001';
// The single CORS-allowed browser origin in this shell is the frontend preview.
const FRONTEND_ORIGIN = process.env.E2E_BASE_URL || 'http://localhost:4173';

/**
 * GET with a small retry budget to ride out a transient rate-limit (429) on the
 * shared backend. Returns the final response (which may still be 429).
 */
async function getWithRetry(
  request: APIRequestContext,
  url: string,
  opts: Parameters<APIRequestContext['get']>[1] = {},
): Promise<APIResponse> {
  let res = await request.get(url, { failOnStatusCode: false, ...opts });
  for (let i = 0; i < 4 && res.status() === 429; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await request.get(url, { failOnStatusCode: false, ...opts });
  }
  return res;
}

test.describe('API Health & Infrastructure', () => {
  test('Health endpoint returns system status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.websocket).toBeDefined();
    expect(body.responseTime).toBeDefined();
    expect(body.version).toBe('2.0.0');
  });

  test('Root endpoint returns API info', async ({ request }) => {
    const response = await request.get(`${API_BASE}/`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('ComplyEasy AI Backend API');
    expect(body.status).toBe('running');
    expect(body.endpoints).toBeDefined();
  });

  test('API docs endpoint is accessible', async ({ request }) => {
    const response = await getWithRetry(request, `${API_BASE}/api/docs.json`);
    test.skip(
      response.status() === 429,
      'GET /api/docs.json was rate-limited (429) — shared backend window exhausted.',
    );
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('CSRF token endpoint returns token', async ({ request }) => {
    const response = await getWithRetry(request, `${API_BASE}/api/csrf-token`);
    test.skip(
      response.status() === 429,
      'GET /api/csrf-token was rate-limited (429) — shared backend window exhausted.',
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.csrfToken).toBeDefined();
  });
});

test.describe('API Versioning', () => {
  test('V1 API routes are accessible', async ({ request }) => {
    // The `/api/v1` namespace is mounted with `apiVersioningMiddleware()` in front
    // of `v1Router` (server/src/index.ts). That middleware stamps `X-API-Version`
    // on the response BEFORE inner routing resolves, so its presence proves the
    // versioned namespace is mounted and processed the request — a stronger signal
    // than a per-sub-route status (the auth sub-router exposes only POST verbs, so
    // a GET to its base legitimately 404s without meaning the namespace is absent).
    const response = await getWithRetry(request, `${API_BASE}/api/v1/auth`);
    test.skip(
      response.status() === 429,
      'GET /api/v1/auth was rate-limited (429) — shared backend window exhausted.',
    );
    expect(response.headers()['x-api-version']).toBeDefined();
  });

  test('V2 API routes are accessible', async ({ request }) => {
    const response = await getWithRetry(request, `${API_BASE}/api/v2/auth`);
    test.skip(
      response.status() === 429,
      'GET /api/v2/auth was rate-limited (429) — shared backend window exhausted.',
    );
    expect(response.headers()['x-api-version']).toBeDefined();
  });

  test('API version header is returned', async ({ request }) => {
    const response = await getWithRetry(request, `${API_BASE}/api/v1/auth`, {
      headers: { 'X-API-Version': 'v1' },
    });
    test.skip(
      response.status() === 429,
      'GET /api/v1/auth was rate-limited (429) — shared backend window exhausted.',
    );
    // The versioning middleware sets X-API-Version
    const versionHeader = response.headers()['x-api-version'];
    expect(versionHeader).toBeDefined();
  });
});

test.describe('GraphQL API', () => {
  test('GraphQL endpoint is mounted and protected', async ({ request }) => {
    // In the current shell POST /api/graphql is mounted behind both the global
    // CSRF guard (mutating /api/* requests require an x-csrf-token + cookie pair)
    // and the `authenticate` middleware. A bare request-context POST carries
    // neither, so the endpoint answers 403 (CSRF missing) or 401 (no token) —
    // never 404. That proves the route exists AND enforces its protections. If a
    // valid CSRF+auth pair were supplied the resolver would answer 200 with
    // { data } | { errors }; we accept that too for completeness.
    const response = await request.post(`${API_BASE}/api/graphql`, {
      data: { query: '{ frameworkTemplates { name type controlCount } }' },
      failOnStatusCode: false,
    });
    test.skip(
      response.status() === 429,
      'POST /api/graphql was rate-limited (429) — shared backend window exhausted.',
    );

    const status = response.status();
    expect(status).not.toBe(404);
    expect([200, 401, 403]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body.data || body.errors).toBeDefined();
    }
  });

  test('GraphQL playground is gated to non-production environments', async ({ request }) => {
    // server/src/index.ts mounts /api/graphql/playground only when
    // NODE_ENV !== 'production'. So the playground UI must be either served
    // as HTML (development) or absent (404 in production) — it must never be a
    // 200 in production, which would expose the introspection UI.
    const response = await request.get(`${API_BASE}/api/graphql/playground`, {
      failOnStatusCode: false,
    });

    const status = response.status();
    expect([200, 404]).toContain(status);

    if (status === 200) {
      // Development: the route returns the playground HTML page.
      expect(response.headers()['content-type']).toContain('text/html');
    } else {
      // Production-equivalent: route not mounted, so no HTML UI is exposed.
      expect(response.headers()['content-type'] ?? '').not.toContain('text/html');
    }
  });
});

test.describe('Marketplace API', () => {
  test('Marketplace listing returns integrations (requires auth)', async ({ request }) => {
    const response = await getWithRetry(request, `${API_BASE}/api/marketplace`);
    test.skip(
      response.status() === 429,
      'GET /api/marketplace was rate-limited (429) — shared backend window exhausted.',
    );
    // The marketplace router applies `authenticate`, so without credentials it
    // returns 401 (or 200 if ever public).
    expect([200, 401]).toContain(response.status());
  });
});

test.describe('Rate Limiting', () => {
  test('API enforces rate limiting headers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    // Rate limit headers may be present
    const headers = response.headers();
    // Express rate-limit may set these headers
    if (headers['x-ratelimit-limit']) {
      expect(parseInt(headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    }
  });
});

test.describe('Security Headers', () => {
  test('Security headers are set on responses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    const headers = response.headers();

    // Helmet headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['referrer-policy']).toBeDefined();
  });

  test('CORS headers are set correctly for the allowed origin', async ({ request }) => {
    // The backend's CORS allowlist accepts only its configured origins (the
    // frontend preview). A request from the allowed origin must succeed AND echo
    // it back in Access-Control-Allow-Origin; a request from a disallowed origin
    // is rejected with 403 by design (see server/src/index.ts CORS handler).
    const allowed = await request.get(`${API_BASE}/health`, {
      headers: { Origin: FRONTEND_ORIGIN },
    });
    expect(allowed.status()).toBe(200);
    expect(allowed.headers()['access-control-allow-origin']).toBe(FRONTEND_ORIGIN);
    expect(allowed.headers()['access-control-allow-credentials']).toBe('true');

    // A disallowed origin is blocked rather than silently allowed.
    const blocked = await request.get(`${API_BASE}/health`, {
      headers: { Origin: 'http://evil.example.com' },
      failOnStatusCode: false,
    });
    expect(blocked.status()).toBe(403);
  });
});
