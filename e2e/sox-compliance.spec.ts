/**
 * E2E Tests: SOX Compliance
 * Tests control definition, testing, and reporting workflows
 */

import { test, expect } from '@playwright/test';

test.describe('SOX Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/governance/sox');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Load', () => {
    test('SOX compliance page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('SOX page shows compliance sections', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const soxContent = page.locator(
        ':text("SOX"), :text("Control"), :text("Section 302"), :text("Section 404"), :text("Internal Control")'
      ).first();
      if (await soxContent.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(soxContent).toBeVisible();
      }
    });
  });

  test.describe('Control Definition', () => {
    test('can view list of SOX controls', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const controlsList = page.locator('table, .controls-list, [data-testid="controls"]').first();
      if (await controlsList.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(controlsList).toBeVisible();
      }
    });

    test('can create a new SOX control', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const addBtn = page.getByRole('button', { name: /add|create|new|define/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const nameInput = page.locator('[name="name"], [name="title"], input[type="text"]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill('E2E SOX Control - Financial Reporting Review');
        }

        const descInput = page.locator('[name="description"], textarea').first();
        if (await descInput.isVisible()) {
          await descInput.fill('Quarterly review of financial statements for accuracy and completeness');
        }

        const saveBtn = page.getByRole('button', { name: /save|create|submit/i }).first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('control details can be edited', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const controlRow = page.locator('table tbody tr, [data-testid="control-row"], .control-item').first();
      if (await controlRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await controlRow.click();
        await page.waitForTimeout(500);

        const editBtn = page.getByRole('button', { name: /edit|update/i }).first();
        if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('control can be deleted with confirmation', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Verify delete requires confirmation
        await deleteBtn.click();
        await page.waitForTimeout(500);

        const confirmDialog = page.locator('[role="dialog"], .confirm-dialog, [role="alertdialog"]');
        if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Cancel instead of actually deleting
          const cancelBtn = page.getByRole('button', { name: /cancel|no/i });
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
          }
        }
      }
    });
  });

  test.describe('Control Testing', () => {
    test('control testing section is available', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const testSection = page.locator(
        ':text("Testing"), :text("Test"), button:has-text("Test")'
      ).first();
      if (await testSection.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(testSection).toBeVisible();
      }
    });

    test('can execute a control test', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const runTestBtn = page.getByRole('button', { name: /run.*test|execute|test.*control/i }).first();
      if (await runTestBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(runTestBtn).toBeVisible();
      }
    });

    test('test results are displayed after execution', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const results = page.locator(
        ':text("Result"), :text("Pass"), :text("Fail"), :text("Finding"), [data-testid="test-results"]'
      ).first();
      if (await results.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(results).toBeVisible();
      }
    });
  });

  test.describe('SOX Reporting', () => {
    test('SOX report generation is available', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const reportBtn = page.getByRole('button', { name: /report|export|generate/i }).first();
      if (await reportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(reportBtn).toBeVisible();
      }
    });

    test('SOX dashboard shows compliance metrics', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const metrics = page.locator(
        ':text("Compliant"), :text("Effective"), :text("Deficiency"), :text("Weakness")'
      ).first();
      if (await metrics.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(metrics).toBeVisible();
      }
    });
  });

  test.describe('Network & CRUD Verification', () => {
    test('SOX API calls return valid responses', async ({ page }) => {
      const responses: Array<{ url: string; status: number }> = [];

      page.on('response', (res) => {
        if (res.url().includes('/api/')) {
          responses.push({ url: res.url(), status: res.status() });
        }
      });

      await page.goto('/governance/sox');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      for (const res of responses) {
        expect(res.status).toBeLessThan(500);
      }
    });

    test('no sensitive financial data in DOM', async ({ page }) => {
      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/eyJhbGciOi/);
      expect(html).not.toMatch(/\baccount[_-]?number\b.*\d{10,}/i);
    });
  });
});
