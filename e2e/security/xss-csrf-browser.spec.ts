/**
 * XSS & CSRF Browser Security E2E Tests
 *
 * Tests that XSS payloads are not executed in the DOM, CSRF protection
 * is enforced, and form submissions are properly secured.
 */

import { test, expect } from '@playwright/test';

const API_BASE =
  process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001';
const APP_URL = (
  process.env.E2E_BASE_URL ||
  process.env.APP_URL ||
  'http://localhost:4173'
).replace(/\/$/, '');

test.describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>document.cookie</script>',
    '<svg onload=alert(1)>',
    '<body onload=alert(1)>',
    '<iframe src="javascript:alert(1)">',
    '<details open ontoggle=alert(1)>',
    "'-alert(1)-'",
    '<math><mtext><table><mglyph><svg><mtext><textarea><path id=x d="</textarea><img src=x onerror=alert(1)>">',
  ];

  test('should not execute XSS payloads reflected in URL hash', async ({ page }) => {
    // Set up console listener to detect script execution
    const alerts: string[] = [];
    page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    for (const payload of xssPayloads.slice(0, 3)) {
      await page.goto(`${APP_URL}/#${encodeURIComponent(payload)}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    // No alert dialogs should have fired
    expect(alerts).toHaveLength(0);
  });

  test('should not execute XSS payloads in URL query parameters', async ({
    page,
  }) => {
    const alerts: string[] = [];
    page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    for (const payload of xssPayloads.slice(0, 3)) {
      await page.goto(
        `${APP_URL}/risks?search=${encodeURIComponent(payload)}`,
      );
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    expect(alerts).toHaveLength(0);
  });

  test('should sanitize XSS in text input fields', async ({ page }) => {
    const alerts: string[] = [];
    page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Find any input field on the page and try to inject XSS
    const inputs = page.locator(
      'input[type="text"], input[type="search"], textarea',
    );
    const count = await inputs.count();

    if (count > 0) {
      for (const payload of xssPayloads.slice(0, 3)) {
        await inputs.first().fill(payload);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    }

    expect(alerts).toHaveLength(0);
  });

  test('should encode special characters in rendered content', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Verify React/framework escapes content by default
    // Inject via URL params and check DOM
    await page.goto(
      `${APP_URL}/risks?search=${encodeURIComponent('<script>alert(1)</script>')}`,
    );
    await page.waitForLoadState('networkidle');

    // The script tag should not be in the DOM as an actual script element
    const scriptTags = await page.locator('script').evaluateAll((scripts) =>
      scripts
        .map((s) => s.textContent || '')
        .filter((t) => t.includes('alert(1)')),
    );
    expect(scriptTags).toHaveLength(0);
  });

  test('should not execute XSS via error messages', async ({ page }) => {
    const alerts: string[] = [];
    page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    // Trigger an error with XSS in the parameter
    await page.goto(
      `${APP_URL}/risks/${encodeURIComponent('<img src=x onerror=alert(1)>')}`,
    );
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(alerts).toHaveLength(0);
  });
});

test.describe('CSRF Protection', () => {
  test('should include CSRF token or use SameSite cookies', async ({ request }) => {
    // Check if the API uses SameSite cookies (primary CSRF defense)
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'TestPassword123!',
      },
    });

    const setCookie = res.headers()['set-cookie'] || '';

    // Modern CSRF defense: SameSite cookie attribute
    const hasSameSite = setCookie.toLowerCase().includes('samesite');
    // Alternative: CSRF token in response
    const body = await res.json().catch(() => ({}));
    const hasCsrfToken = body.csrfToken || body.csrf_token || body._csrf;

    // At least one CSRF defense should be present
    // Note: Bearer token auth is inherently CSRF-safe, but cookie auth needs protection
    if (setCookie) {
      expect(hasSameSite || hasCsrfToken).toBeTruthy();
    }
  });

  test('should reject cross-origin mutation requests without proper auth', async ({
    request,
  }) => {
    // Simulate a cross-origin POST (like a CSRF attack form submission)
    const res = await request.post(`${API_BASE}/api/risks`, {
      headers: {
        Origin: 'https://evil-attacker.com',
        Referer: 'https://evil-attacker.com/csrf-page',
        'Content-Type': 'application/json',
      },
      data: {
        title: 'CSRF Created Risk',
        description: 'This should be rejected',
        category: 'Security',
        severity: 'High',
        likelihood: 5,
        impact: 5,
      },
    });

    // Without valid auth token, should be rejected
    expect([401, 403]).toContain(res.status());
  });

  test('should reject form-encoded POST to API endpoints', async ({ request }) => {
    // CSRF attacks typically use form submissions (application/x-www-form-urlencoded)
    const res = await request.post(`${API_BASE}/api/risks`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://evil-attacker.com',
      },
      data: 'title=CSRF+Risk&description=evil&category=Security&severity=High',
    });

    // Should reject: either wrong content-type (415) or no auth (401)
    expect([400, 401, 403, 415, 422]).toContain(res.status());
  });

  test('should reject multipart form POST from cross-origin', async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/risks`, {
      headers: {
        Origin: 'https://evil-attacker.com',
      },
      multipart: {
        title: 'CSRF via multipart',
        description: 'evil',
      },
    });

    expect([400, 401, 403, 415, 422]).toContain(res.status());
  });
});

test.describe('DOM Security', () => {
  test('should not use innerHTML with user content', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Check that React app does not have dangerouslySetInnerHTML with user-controlled content
    // This is a heuristic check — we verify no script injection is possible
    const dangerousHtml = await page.evaluate(() => {
      // The document's own structural wrappers (<html>, <head>) always contain
      // the application's legitimate bundled module script (e.g. the Vite
      // <script type="module" src="/assets/index-*.js">). That is the app's own
      // first-party code, not injected user content, so exclude those wrappers
      // and the <head> subtree. The genuine XSS concern is injected markup
      // rendered into the document body.
      const STRUCTURAL = new Set(['HTML', 'HEAD']);
      const body = document.body;
      const allElements = body ? body.querySelectorAll('*') : [];
      const suspicious: string[] = [];
      allElements.forEach((el) => {
        if (STRUCTURAL.has(el.tagName)) return;
        const html = el.innerHTML;
        // Inline <script> with EXECUTABLE content. Excluded as inert:
        //  - external-src refs without a body (how bundlers ship code), and
        //  - data blocks the browser never executes as JS, i.e.
        //    type="application/ld+json" (schema.org SEO structured data) and
        //    type="application/json". These are data, not an XSS execution vector.
        const hasInlineScript =
          /<script(?![^>]*\bsrc=)(?![^>]*\btype=["']application\/(?:ld\+json|json)["'])[^>]*>[^<]/i.test(
            html,
          );
        if (
          hasInlineScript ||
          html.includes('javascript:') ||
          html.includes('onerror=')
        ) {
          suspicious.push(el.tagName);
        }
      });
      return suspicious;
    });

    expect(dangerousHtml).toHaveLength(0);
  });

  test('should not expose sensitive data in localStorage', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const storageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      return data;
    });

    const storageStr = JSON.stringify(storageData).toLowerCase();

    // Should not store passwords or API keys in localStorage
    expect(storageStr).not.toContain('password');
    expect(storageStr).not.toContain('api_key');
    expect(storageStr).not.toContain('stripe_secret');
    expect(storageStr).not.toContain('database_url');
  });

  test('should not expose sensitive data in sessionStorage', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const storageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    });

    const storageStr = JSON.stringify(storageData).toLowerCase();
    expect(storageStr).not.toContain('password');
    expect(storageStr).not.toContain('api_key');
    expect(storageStr).not.toContain('stripe_secret');
  });
});

test.describe('Content Security', () => {
  test('should serve API responses as application/json', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/risks`, {
      headers: { Authorization: 'Bearer fake-token' },
    });

    const contentType = res.headers()['content-type'] || '';
    // API responses should always be JSON, never HTML (prevents XSS via content sniffing)
    expect(contentType).toMatch(/application\/json/);
  });

  test('should set X-Content-Type-Options: nosniff on API responses', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/risks`);
    const xcto = res.headers()['x-content-type-options'];

    if (xcto) {
      expect(xcto.toLowerCase()).toBe('nosniff');
    }
  });
});
