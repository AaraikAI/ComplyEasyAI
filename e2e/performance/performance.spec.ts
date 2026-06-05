/**
 * Performance Tests
 * Tests for page load time, API response time, Core Web Vitals, and load testing
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3001';

// The app keeps auth tokens in httpOnly cookies and only restores the cached
// `user_data` profile from localStorage on boot (AuthContext). A boot-time API
// 401 can wipe `user_data` and redirect to '/'. Re-seeding via addInitScript
// runs before EVERY navigation, so the app always boots authenticated.
const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

// Stub the API-driven onboarding "Welcome" modal so it never opens over the app
// (it is a fixed inset-0 dialog that would intercept clicks/navigation).
async function stubOnboarding(page: import('@playwright/test').Page) {
  await page.route('**/onboarding/progress', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          progress: {
            welcomeCompleted: true,
            tierTourCompleted: true,
            completedAt: new Date().toISOString(),
            skippedFlows: ['welcome'],
            tooltipsShown: [],
            showHints: false,
          },
          organizationPlan: 'Visionary',
          organizationName: 'E2E Test Organization',
          onboardingCompleted: true,
        },
      }),
    }),
  );
  await page.route('**/onboarding/checklist', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { checklist: { completedAt: new Date().toISOString() } },
      }),
    }),
  );
}

// Seed auth + suppress the GDPR cookie banner and onboarding overlays so they
// never intercept page clicks. Used by the page-driven describe blocks below.
async function seedAuthAndSuppressOverlays(page: import('@playwright/test').Page) {
  await stubOnboarding(page);
  await page.addInitScript((u) => {
    localStorage.setItem('user_data', JSON.stringify(u));
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('complyeasy_cookie_consent', JSON.stringify({
      essential: true, functional: true, analytics: true, targeting: true,
      consentDate: new Date().toISOString(), consentVersion: '1.0',
    }));
  }, E2E_USER);
}

// Performance thresholds
const THRESHOLDS = {
  pageLoadTime: 3000, // 3 seconds
  apiResponseTime: 500, // 500ms
  lcp: 2500, // Largest Contentful Paint (Good threshold)
  fid: 100, // First Input Delay (Good threshold)
  cls: 0.1, // Cumulative Layout Shift (Good threshold)
  ttfb: 800, // Time to First Byte
};

test.describe('Page Load Performance', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthAndSuppressOverlays(page);
  });

  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoadTime);
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('Frameworks page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/frameworks');
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoadTime);
    console.log(`Frameworks load time: ${loadTime}ms`);
  });

  test('Vendors page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/vendors');
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoadTime);
    console.log(`Vendors load time: ${loadTime}ms`);
  });

  test('All main pages load under threshold', async ({ page }) => {
    const pages = ['/dashboard', '/frameworks', '/vendors', '/policies', '/risks', '/monitoring'];

    for (const pagePath of pages) {
      const startTime = Date.now();

      await page.goto(pagePath);
      await page.waitForLoadState('load');

      const loadTime = Date.now() - startTime;

      console.log(`${pagePath} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(THRESHOLDS.pageLoadTime);
    }
  });
});

test.describe('API Response Time', () => {
  test('Health endpoint responds quickly', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${API_BASE}/health`);

    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(responseTime).toBeLessThan(THRESHOLDS.apiResponseTime);
    console.log(`Health API response time: ${responseTime}ms`);
  });

  test('Frameworks API responds quickly', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${API_BASE}/api/frameworks`, {
      failOnStatusCode: false,
    });

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(THRESHOLDS.apiResponseTime);
    console.log(`Frameworks API response time: ${responseTime}ms`);
  });

  test('CSRF token endpoint responds quickly', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${API_BASE}/api/csrf-token`, {
      failOnStatusCode: false,
    });

    const responseTime = Date.now() - startTime;

    // The endpoint is governed by a 100-req/15-min rate limiter. Under the full
    // suite's load it legitimately returns 429 (the limiter working as designed)
    // instead of 200. Both are correct, fast responses — the point of this test
    // is latency, not which of the two valid states the limiter is in.
    expect([200, 429]).toContain(response.status());
    expect(responseTime).toBeLessThan(THRESHOLDS.apiResponseTime);
    console.log(`CSRF token API response time: ${responseTime}ms (status ${response.status()})`);
  });

  test('API response times are consistent', async ({ request }) => {
    const responseTimes: number[] = [];

    // Warm up the connection (TCP/TLS handshake + first-hit JIT) with an untimed
    // request so the consistency check measures steady-state latency rather than
    // a one-off cold-start spike on the first sample.
    await request.get(`${API_BASE}/health`);

    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      await request.get(`${API_BASE}/health`);
      responseTimes.push(Date.now() - startTime);
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log(`API response times - Avg: ${avgResponseTime}ms, Min: ${minResponseTime}ms, Max: ${maxResponseTime}ms`);

    // Average should be under threshold
    expect(avgResponseTime).toBeLessThan(THRESHOLDS.apiResponseTime);

    // Max should not be too far from average (consistency)
    expect(maxResponseTime).toBeLessThan(avgResponseTime * 3);
  });
});

test.describe('Core Web Vitals', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthAndSuppressOverlays(page);
  });

  test('Largest Contentful Paint (LCP) is acceptable', async ({ page }) => {
    await page.goto('/dashboard');

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`LCP: ${lcp}ms`);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(THRESHOLDS.lcp);
    }
  });

  test('Cumulative Layout Shift (CLS) is acceptable', async ({ page }) => {
    await page.goto('/dashboard');

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[]) {
            clsValue += entry.value;
          }
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log(`CLS: ${cls}`);
    expect(cls).toBeLessThan(THRESHOLDS.cls);
  });

  test('Time to First Byte (TTFB) is acceptable', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');

    // Playwright's Response has no timing() method; read TTFB from the browser's
    // Navigation Timing API instead (responseStart - requestStart on the
    // document navigation entry).
    const ttfb = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (!nav) return -1;
      return nav.responseStart - nav.requestStart;
    });

    console.log(`TTFB: ${ttfb}ms`);
    if (ttfb >= 0) {
      expect(ttfb).toBeLessThan(THRESHOLDS.ttfb);
    }
  });
});

test.describe('Resource Loading Performance', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthAndSuppressOverlays(page);
  });

  test('No unnecessary network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/dashboard');
    // Prefer a network-idle window to capture the full initial load, but the app
    // has continuous background polling that can keep the network busy; if idle
    // is never reached, fall back to a fixed settle so we still measure the
    // initial-load request set rather than timing out.
    await page.waitForLoadState('networkidle').catch(() => page.waitForTimeout(3000));

    // Check for duplicate requests
    const uniqueRequests = [...new Set(requests)];
    const duplicateCount = requests.length - uniqueRequests.length;

    console.log(`Total requests: ${requests.length}, Duplicates: ${duplicateCount}`);

    // Some duplicates may be expected (retries, polling), but should be minimal
    expect(duplicateCount).toBeLessThan(10);
  });

  test('JavaScript bundle size is reasonable', async ({ page }) => {
    const jsBytes: number[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.includes('.js?')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          jsBytes.push(parseInt(contentLength));
        }
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const totalJsBytes = jsBytes.reduce((a, b) => a + b, 0);
    const totalJsKB = totalJsBytes / 1024;

    console.log(`Total JS size: ${totalJsKB.toFixed(2)}KB`);

    // Total JS should be under 2MB (adjust based on app requirements)
    expect(totalJsBytes).toBeLessThan(2 * 1024 * 1024);
  });

  test('No fatal JavaScript errors on page load', async ({ page }) => {
    // Uncaught page exceptions (pageerror) are always fatal application errors.
    const pageErrors: string[] = [];
    // Console errors are filtered to fatal app errors — network/resource noise,
    // favicon 404s, and third-party warnings are not application regressions and
    // would make this assertion flaky across environments.
    const consoleErrors: string[] = [];

    const NON_FATAL = [
      /favicon/i,
      /Failed to load resource/i,
      /net::ERR_/i,
      /the server responded with a status of (401|403|404|429|5\d\d)/i,
      /\[HMR\]/i,
      /Download the React DevTools/i,
      /WebSocket connection to .* failed/i,
    ];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!NON_FATAL.some((re) => re.test(text))) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const fatal = [...pageErrors, ...consoleErrors];
    console.log(`Fatal JavaScript errors: ${fatal.length}`);
    fatal.forEach((e) => console.log(`  - ${e}`));

    // No uncaught exceptions and no fatal application console errors.
    expect(pageErrors, `uncaught page exceptions: ${pageErrors.join(' | ')}`).toHaveLength(0);
    expect(consoleErrors, `fatal console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);
  });
});

test.describe('Concurrent Request Handling', () => {
  test('API handles concurrent requests without errors', async ({ request }) => {
    const numRequests = 20;
    const requests = [];

    for (let i = 0; i < numRequests; i++) {
      requests.push(request.get(`${API_BASE}/health`));
    }

    const responses = await Promise.all(requests);

    // All requests should succeed
    const successCount = responses.filter((r) => r.ok()).length;
    console.log(`Concurrent requests: ${numRequests}, Successful: ${successCount}`);

    expect(successCount).toBe(numRequests);
  });

  test('Multiple users can load dashboard simultaneously', async ({ browser }) => {
    const numUsers = 5;
    const contexts = await Promise.all(
      Array.from({ length: numUsers }, () =>
        browser.newContext({ storageState: 'playwright/.auth/user.json' })
      )
    );
    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
    await Promise.all(pages.map((page) => seedAuthAndSuppressOverlays(page)));

    const startTime = Date.now();

    // All users load dashboard at once
    await Promise.all(pages.map((page) => page.goto('/dashboard')));
    await Promise.all(pages.map((page) => page.waitForLoadState('load')));

    const totalTime = Date.now() - startTime;

    console.log(`${numUsers} users loaded dashboard in ${totalTime}ms`);

    // Should complete in reasonable time even with concurrent users
    expect(totalTime).toBeLessThan(THRESHOLDS.pageLoadTime * 2);

    // Cleanup
    await Promise.all(contexts.map((ctx) => ctx.close()));
  });
});

test.describe('Memory and Resource Usage', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthAndSuppressOverlays(page);
  });

  test('No memory leaks during navigation', async ({ page }) => {
    // Navigate through multiple pages
    const pages = ['/dashboard', '/frameworks', '/vendors', '/policies', '/risks'];

    for (let round = 0; round < 3; round++) {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
      }
    }

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize / (1024 * 1024),
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize / (1024 * 1024),
          }
        : null;
    });

    if (metrics) {
      console.log(
        `Memory usage - Used: ${metrics.usedJSHeapSize.toFixed(2)}MB, Total: ${metrics.totalJSHeapSize.toFixed(2)}MB`
      );

      // Heap size should be reasonable (under 200MB)
      expect(metrics.usedJSHeapSize).toBeLessThan(200);
    }
  });

  test('Page remains responsive after heavy usage', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');

    // Perform many actions (use 'load' rather than 'networkidle' — the app has
    // continuous background polling that never lets the network go idle, which
    // would blow this test's overall timeout).
    for (let i = 0; i < 10; i++) {
      await page.goto('/frameworks');
      await page.waitForLoadState('load');

      await page.goto('/dashboard');
      await page.waitForLoadState('load');
    }

    // Measure interaction responsiveness by clicking a real sidebar pillar link.
    // In the SlimSidebar shell the pillar links are icon-only <a> elements
    // located by data-onboarding (not by accessible name); click the "comply"
    // pillar which navigates to /frameworks.
    const link = page.locator('a[data-onboarding="comply-nav"]').first();
    await link.waitFor({ state: 'visible' });

    const startTime = Date.now();
    await link.click();
    await page.waitForURL('**/frameworks');
    await page.waitForLoadState('load');

    const interactionTime = Date.now() - startTime;

    console.log(`Interaction time after heavy usage: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(2000);
  });
});

test.describe('Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthAndSuppressOverlays(page);
  });

  test('Full page load benchmark', async ({ page }) => {
    const results: Record<string, number> = {};

    const pagesToBenchmark = [
      '/dashboard',
      '/frameworks',
      '/vendors',
      '/policies',
      '/risks',
      '/monitoring',
      '/analytics',
    ];

    for (const pagePath of pagesToBenchmark) {
      const times: number[] = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        await page.goto(pagePath);
        // Measure time to a fully loaded document, consistent with the
        // "Page Load Performance" suite. 'networkidle' would additionally wait
        // for background polling/SSE that keeps the network busy after the page
        // is interactive, which is not the page-load metric being benchmarked.
        await page.waitForLoadState('load');
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      results[pagePath] = Math.round(avgTime);
    }

    console.log('\n=== Performance Benchmark Results ===');
    for (const [path, time] of Object.entries(results)) {
      const status = time < THRESHOLDS.pageLoadTime ? 'PASS' : 'FAIL';
      console.log(`${path}: ${time}ms [${status}]`);
    }

    // All pages should load under threshold
    for (const time of Object.values(results)) {
      expect(time).toBeLessThan(THRESHOLDS.pageLoadTime);
    }
  });

  test('API endpoint benchmark', async ({ request }) => {
    const endpoints = [
      '/health',
      '/api/csrf-token',
      '/api/frameworks',
      '/api/vendors',
      '/api/risks',
    ];

    const results: Record<string, { avg: number; min: number; max: number }> = {};

    for (const endpoint of endpoints) {
      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await request.get(`${API_BASE}${endpoint}`, { failOnStatusCode: false });
        times.push(Date.now() - startTime);
      }

      results[endpoint] = {
        avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        min: Math.min(...times),
        max: Math.max(...times),
      };
    }

    console.log('\n=== API Benchmark Results ===');
    for (const [endpoint, stats] of Object.entries(results)) {
      const status = stats.avg < THRESHOLDS.apiResponseTime ? 'PASS' : 'FAIL';
      console.log(`${endpoint}: avg=${stats.avg}ms, min=${stats.min}ms, max=${stats.max}ms [${status}]`);
    }

    // All endpoints should respond under threshold
    for (const stats of Object.values(results)) {
      expect(stats.avg).toBeLessThan(THRESHOLDS.apiResponseTime);
    }
  });
});
