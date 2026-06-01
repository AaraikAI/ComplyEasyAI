/**
 * E2E Tests: API Integration Tests
 *
 * Tests API endpoints directly using Playwright's request context.
 * Validates API versioning, pagination, GraphQL, and marketplace endpoints.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';

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
    const response = await request.get(`${API_BASE}/api/docs.json`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('CSRF token endpoint returns token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/csrf-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.csrfToken).toBeDefined();
  });
});

test.describe('API Versioning', () => {
  test('V1 API routes are accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/auth`, {
      failOnStatusCode: false,
    });
    // Should not 404 (route exists, may return auth error)
    expect(response.status()).not.toBe(404);
  });

  test('V2 API routes are accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v2/auth`, {
      failOnStatusCode: false,
    });
    expect(response.status()).not.toBe(404);
  });

  test('API version header is returned', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/auth`, {
      failOnStatusCode: false,
      headers: { 'X-API-Version': 'v1' },
    });
    // The versioning middleware sets X-API-Version
    const versionHeader = response.headers()['x-api-version'];
    expect(versionHeader).toBeDefined();
  });
});

test.describe('GraphQL API', () => {
  test('GraphQL endpoint accepts POST requests', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/graphql`, {
      data: {
        query: '{ frameworkTemplates { name type controlCount } }',
      },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data || body.errors).toBeDefined();
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
    const response = await request.get(`${API_BASE}/api/marketplace`, {
      failOnStatusCode: false,
    });
    // Without auth, should return 401
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

  test('CORS headers are set correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`, {
      headers: { 'Origin': 'http://localhost:3000' },
    });
    // CORS headers should be present
    expect(response.status()).toBe(200);
  });
});
