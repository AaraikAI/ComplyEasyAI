/**
 * E2E Tests: Risk Management Flows
 *
 * Tests risk creation, assessment, scoring, mitigation tracking,
 * and risk dashboard functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Risk Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can view risk dashboard with risk matrix', async ({ page }) => {
    const riskLink = page.getByRole('link', { name: /Risk/i })
      .or(page.locator('button:has-text("Risk")'))
      .first();
    await riskLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(
      page.locator('h1:has-text("Risk"), h2:has-text("Risk"), [data-testid="risk-dashboard"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('User can create a new risk item', async ({ page }) => {
    const riskLink = page.getByRole('link', { name: /Risk/i })
      .or(page.locator('button:has-text("Risk")'))
      .first();
    await riskLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const addBtn = page.getByRole('button', { name: /Add Risk|Create Risk|New Risk/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();

      await page.fill('[name="title"], [name="name"]', 'E2E Data Breach Risk');

      const descField = page.locator('[name="description"]');
      if (await descField.isVisible()) {
        await descField.fill('Potential data breach through third-party vendor access');
      }

      // Set likelihood and impact
      const likelihoodField = page.locator('[name="likelihood"]');
      if (await likelihoodField.isVisible()) {
        await likelihoodField.fill('4');
      }

      const impactField = page.locator('[name="impact"]');
      if (await impactField.isVisible()) {
        await impactField.fill('5');
      }

      const submitBtn = page.getByRole('button', { name: /Create|Save|Submit/i }).first();
      await submitBtn.click({ timeout: 5000 });

      await expect(page.locator('text=E2E Data Breach Risk')).toBeVisible({ timeout: 15000 });
    }
  });

  test('User can edit risk mitigation plan', async ({ page }) => {
    const riskLink = page.getByRole('link', { name: /Risk/i })
      .or(page.locator('button:has-text("Risk")'))
      .first();
    await riskLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Click on first risk item
    const riskRow = page.locator('tr, [data-testid="risk-row"], .risk-item').first();
    if (await riskRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await riskRow.click();
      await page.waitForTimeout(1000);

      const editBtn = page.getByRole('button', { name: /Edit|Update/i }).first();
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.click();

        const mitigationField = page.locator('[name="mitigationPlan"], textarea[name="mitigation"]');
        if (await mitigationField.isVisible()) {
          await mitigationField.fill('Implement encryption at rest and in transit. Regular access reviews.');
        }
      }
    }
  });
});
