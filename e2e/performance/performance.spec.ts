/**
 * Performance Tests
 * Tests for page load time, API response time, Core Web Vitals, and load testing
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';

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

    const response = await request.get(`${API_BASE}/api/csrf-token`);

    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(responseTime).toBeLessThan(THRESHOLDS.apiResponseTime);
    console.log(`CSRF token API response time: ${responseTime}ms`);
  });

  test('API response times are consistent', async ({ request }) => {
    const responseTimes: number[] = [];

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
    const response = await page.goto('/dashboard');
    const timing = response?.timing();

    if (timing) {
      const ttfb = timing.responseStart;
      console.log(`TTFB: ${ttfb}ms`);
      expect(ttfb).toBeLessThan(THRESHOLDS.ttfb);
    }
  });
});

test.describe('Resource Loading Performance', () => {
  test('No unnecessary network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

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

  test('No JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    console.log(`JavaScript errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));

    expect(errors.length).toBe(0);
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
      Array.from({ length: numUsers }, () => browser.newContext())
    );
    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

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
    await page.waitForLoadState('networkidle');

    // Perform many actions
    for (let i = 0; i < 10; i++) {
      await page.goto('/frameworks');
      await page.waitForLoadState('networkidle');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Measure interaction responsiveness
    const startTime = Date.now();

    const link = page.getByRole('link').first();
    await link.click();
    await page.waitForLoadState('networkidle');

    const interactionTime = Date.now() - startTime;

    console.log(`Interaction time after heavy usage: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(2000);
  });
});

test.describe('Performance Benchmarks', () => {
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
        await page.waitForLoadState('networkidle');
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
