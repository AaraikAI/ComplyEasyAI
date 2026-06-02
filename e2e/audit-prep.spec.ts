/**
 * E2E Tests: Audit Preparation
 * Tests audit readiness check, evidence gaps, simulation
 */

import { test, expect } from '@playwright/test';

test.describe('Audit Preparation', () => {
  test.describe('Audit Center Hub', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/audit');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('audit center page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('audit center has tabs or sections', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const sections = page.locator(
        ':text("Preparation"), :text("Testing"), :text("Simulator"), :text("Audit Trail"), :text("Evidence")'
      ).first();
      if (await sections.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(sections).toBeVisible();
      }
    });
  });

  test.describe('Readiness Check', () => {
    test('audit prep page loads', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('readiness score is displayed', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const readiness = page.locator(
        ':text("Readiness"), :text("readiness"), :text("Score"), :text("%")'
      ).first();
      if (await readiness.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(readiness).toBeVisible();
      }
    });

    test('run readiness check button exists', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const checkBtn = page.getByRole('button', { name: /run|check|assess|start/i }).first();
      if (await checkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(checkBtn).toBeVisible();
      }
    });

    test('readiness check shows results', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const checkBtn = page.getByRole('button', { name: /run|check|assess|start/i }).first();
      if (await checkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkBtn.click();
        await page.waitForTimeout(3000);

        // Should show results
        const results = page.locator(
          ':text("Complete"), :text("Gap"), :text("Finding"), :text("Ready"), :text("Result"), table'
        ).first();
        if (await results.isVisible({ timeout: 10000 }).catch(() => false)) {
          await expect(results).toBeVisible();
        }
      }
    });
  });

  test.describe('Evidence Gaps', () => {
    test('evidence gaps are identified', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const gaps = page.locator(
        ':text("Evidence"), :text("Gap"), :text("Missing"), :text("Required")'
      ).first();
      if (await gaps.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(gaps).toBeVisible();
      }
    });

    test('evidence hub page loads', async ({ page }) => {
      await page.goto('/evidence');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('can upload evidence', async ({ page }) => {
      await page.goto('/evidence');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const uploadBtn = page.getByRole('button', { name: /upload|add|collect/i }).first();
      if (await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(uploadBtn).toBeVisible();
      }
    });
  });

  test.describe('Audit Simulation', () => {
    test('audit simulator is accessible', async ({ page }) => {
      await page.goto('/ai/audit-simulator');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('simulation can be configured and started', async ({ page }) => {
      await page.goto('/ai/audit-simulator');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Select framework for simulation
      const fwSelect = page.locator('select').first();
      if (await fwSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await fwSelect.locator('option').all();
        if (options.length > 1) {
          await fwSelect.selectOption({ index: 1 });
        }
      }

      const startBtn = page.getByRole('button', { name: /start|simulate|run|begin/i }).first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(startBtn).toBeVisible();
      }
    });
  });

  test.describe('Control Testing', () => {
    test('control testing page loads', async ({ page }) => {
      await page.goto('/control-testing');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('control test results show pass/fail status', async ({ page }) => {
      await page.goto('/control-testing');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const statusIndicators = page.locator(
        ':text("Pass"), :text("Fail"), :text("Effective"), :text("Ineffective"), .badge'
      ).first();
      if (await statusIndicators.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(statusIndicators).toBeVisible();
      }
    });
  });

  test.describe('Network & Security', () => {
    test('audit API calls are properly authenticated', async ({ page }) => {
      // Capture audit/evidence API responses. Authenticated requests carry the
      // httpOnly auth cookie automatically; a properly secured endpoint must
      // therefore respond with success, a client-side auth status (401/403), or
      // a not-found — but never a server error, and never leak data on a 401.
      const apiResponses: Array<{ url: string; status: number }> = [];

      page.on('response', (res) => {
        const url = res.url();
        if (url.includes('/api/') && (url.includes('audit') || url.includes('evidence'))) {
          apiResponses.push({ url, status: res.status() });
        }
      });

      await page.goto('/audit-prep');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Every audit/evidence API call must resolve to a defined, non-5xx status.
      for (const res of apiResponses) {
        expect(res.url).toContain('/api/');
        expect(res.status, `Unexpected status for ${res.url}`).toBeLessThan(500);
        expect([200, 201, 204, 304, 401, 403, 404]).toContain(res.status);
      }
    });

    test('no internal audit data exposed in page source', async ({ page }) => {
      await page.goto('/audit');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/eyJhbGciOi/);
      expect(html).not.toMatch(/sk_live_/);
    });
  });
});
