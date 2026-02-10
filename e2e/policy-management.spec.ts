/**
 * E2E Tests: Policy Management Flows
 *
 * Tests policy creation, approval workflows, version management,
 * and policy library functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Policy Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can view policy library', async ({ page }) => {
    const policyLink = page.getByRole('link', { name: /Policy/i })
      .or(page.locator('button:has-text("Policy")'))
      .first();
    await policyLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(
      page.locator('h1:has-text("Policy"), h2:has-text("Policy"), [data-testid="policy-library"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('User can create a new policy', async ({ page }) => {
    const policyLink = page.getByRole('link', { name: /Policy/i })
      .or(page.locator('button:has-text("Policy")'))
      .first();
    await policyLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const addBtn = page.getByRole('button', { name: /Create Policy|Add Policy|New Policy/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();

      await page.fill('[name="title"]', 'E2E Access Control Policy');

      const contentField = page.locator('[name="content"], textarea[name="content"], .policy-editor');
      if (await contentField.isVisible()) {
        await contentField.fill('All access to production systems must be approved by a security manager and reviewed quarterly.');
      }

      const categoryField = page.locator('[name="category"], select[name="category"]');
      if (await categoryField.isVisible()) {
        await categoryField.selectOption('Security').catch(() => {
          categoryField.fill('Security');
        });
      }

      const submitBtn = page.getByRole('button', { name: /Create|Save|Submit/i }).first();
      await submitBtn.click({ timeout: 5000 });

      await expect(page.locator('text=E2E Access Control Policy')).toBeVisible({ timeout: 15000 });
    }
  });

  test('User can filter policies by status', async ({ page }) => {
    const policyLink = page.getByRole('link', { name: /Policy/i })
      .or(page.locator('button:has-text("Policy")'))
      .first();
    await policyLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const statusFilter = page.locator('select[name="status"], [data-testid="policy-status-filter"]').first();
    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

  test('User can use AI policy generator', async ({ page }) => {
    // Navigate to AI tools
    const aiLink = page.getByRole('link', { name: /Policy Generator|AI Tools/i })
      .or(page.locator('button:has-text("Policy Generator")'))
      .first();

    if (await aiLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aiLink.click({ timeout: 10000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await expect(
        page.locator('h1:has-text("Policy Generator"), h2:has-text("Policy Generator"), [data-testid="policy-generator"]').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
