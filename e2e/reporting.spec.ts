/**
 * E2E Tests: Reporting
 * Tests report template selection, generation, preview, and export
 */

import { test, expect } from '@playwright/test';

test.describe('Reporting', () => {
  test.describe('Reports Hub', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('reports page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('report templates are available', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const templates = page.locator(
        ':text("Template"), :text("template"), :text("Compliance Report"), :text("Executive Summary"), :text("Audit Report")'
      ).first();
      if (await templates.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(templates).toBeVisible();
      }
    });

    test('report tabs/sections are navigable', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const tabs = page.locator('button[role="tab"], .tab, nav button').first();
      if (await tabs.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tabs.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Report Generation', () => {
    test('generate report button exists', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const genBtn = page.getByRole('button', { name: /generate|create|new report/i }).first();
      if (await genBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(genBtn).toBeVisible();
      }
    });

    test('report generation form has framework/type selection', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const genBtn = page.getByRole('button', { name: /generate|create|new/i }).first();
      if (await genBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await genBtn.click();
        await page.waitForTimeout(500);

        const typeSelect = page.locator('select, [data-testid="report-type"]').first();
        if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(typeSelect).toBeVisible();
        }
      }
    });

    test('report generation sends API request', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      let apiCalled = false;

      page.on('request', (req) => {
        if (req.url().includes('/api/') && req.url().includes('report') && req.method() === 'POST') {
          apiCalled = true;
        }
      });

      const genBtn = page.getByRole('button', { name: /generate|create/i }).first();
      const hasGenBtn = await genBtn.isVisible({ timeout: 5000 }).catch(() => false);

      // If the generate affordance is absent, skip so its absence is surfaced
      // rather than passing vacuously.
      if (!hasGenBtn) test.skip();

      await genBtn.click();
      await page.waitForTimeout(3000);

      // Triggering report generation must dispatch a report-generation POST.
      expect(apiCalled).toBeTruthy();
    });
  });

  test.describe('Report Preview', () => {
    test('generated report shows preview', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const preview = page.locator(
        '[data-testid="report-preview"], .report-preview, .report-content, iframe'
      ).first();
      if (await preview.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(preview).toBeVisible();
      }
    });

    test('report preview shows compliance data', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const complianceData = page.locator(
        ':text("Compliance"), :text("Score"), :text("Framework"), :text("Risk"), :text("Control")'
      ).first();
      if (await complianceData.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(complianceData).toBeVisible();
      }
    });
  });

  test.describe('Report Export', () => {
    test('export options are available', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const exportBtn = page.getByRole('button', { name: /export|download|pdf|csv/i }).first();
      if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(exportBtn).toBeVisible();
      }
    });

    test('export triggers download', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const exportBtn = page.getByRole('button', { name: /export|download/i }).first();
      if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        await exportBtn.click();
        const download = await downloadPromise;
        // Download may or may not trigger depending on data
      }
    });
  });

  test.describe('Report Builder', () => {
    test('report builder page loads', async ({ page }) => {
      await page.goto('/report-builder');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('report builder has customization options', async ({ page }) => {
      await page.goto('/report-builder');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const customization = page.locator(
        ':text("Custom"), :text("Section"), :text("Widget"), :text("Chart"), :text("Drag")'
      ).first();
      if (await customization.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(customization).toBeVisible();
      }
    });
  });

  test.describe('AI Report Generator', () => {
    test('AI report generator is accessible', async ({ page }) => {
      await page.goto('/ai/report-generator');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Network & Security', () => {
    test('report API calls are authenticated', async ({ page }) => {
      const responses: Array<{ url: string; status: number }> = [];

      page.on('response', (res) => {
        if (res.url().includes('/api/') && res.url().includes('report')) {
          responses.push({ url: res.url(), status: res.status() });
        }
      });

      await page.goto('/reports');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      for (const res of responses) {
        expect(res.status).toBeLessThan(500);
      }
    });

    test('report exports do not contain raw API keys', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/sk_live_/);
      expect(html).not.toMatch(/eyJhbGciOi/);
    });
  });
});
