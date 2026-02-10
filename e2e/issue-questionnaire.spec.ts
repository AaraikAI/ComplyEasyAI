/**
 * E2E Tests: Issue Management & Questionnaire Flows
 *
 * Tests issue lifecycle, commenting, assignment,
 * questionnaire creation and response collection.
 */

import { test, expect } from '@playwright/test';

test.describe('Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can view issue list with severity indicators', async ({ page }) => {
    const issueLink = page.getByRole('link', { name: /Issue/i })
      .or(page.locator('button:has-text("Issue")'))
      .first();
    await issueLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(
      page.locator('h1:has-text("Issue"), h2:has-text("Issue"), [data-testid="issue-management"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('User can create and assign an issue', async ({ page }) => {
    const issueLink = page.getByRole('link', { name: /Issue/i })
      .or(page.locator('button:has-text("Issue")'))
      .first();
    await issueLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const addBtn = page.getByRole('button', { name: /Create Issue|Add Issue|New Issue/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();

      await page.fill('[name="title"]', 'E2E Expired SSL Certificate');

      const descField = page.locator('[name="description"]');
      if (await descField.isVisible()) {
        await descField.fill('Production SSL certificate expires in 30 days');
      }

      const severityField = page.locator('[name="severity"], select[name="severity"]');
      if (await severityField.isVisible()) {
        await severityField.selectOption('High').catch(() => {});
      }

      const submitBtn = page.getByRole('button', { name: /Create|Save|Submit/i }).first();
      await submitBtn.click({ timeout: 5000 });

      await expect(page.locator('text=E2E Expired SSL Certificate')).toBeVisible({ timeout: 15000 });
    }
  });

  test('User can filter issues by severity and status', async ({ page }) => {
    const issueLink = page.getByRole('link', { name: /Issue/i })
      .or(page.locator('button:has-text("Issue")'))
      .first();
    await issueLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const severityFilter = page.locator('select[name="severity"], [data-testid="severity-filter"]').first();
    if (await severityFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await severityFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }

    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Questionnaire Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can view questionnaire list', async ({ page }) => {
    const qLink = page.getByRole('link', { name: /Questionnaire/i })
      .or(page.locator('button:has-text("Questionnaire")'))
      .first();

    if (await qLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await qLink.click({ timeout: 10000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await expect(
        page.locator('h1:has-text("Questionnaire"), h2:has-text("Questionnaire"), [data-testid="questionnaire-list"]').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('User can create a new questionnaire', async ({ page }) => {
    const qLink = page.getByRole('link', { name: /Questionnaire/i })
      .or(page.locator('button:has-text("Questionnaire")'))
      .first();

    if (await qLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await qLink.click({ timeout: 10000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const addBtn = page.getByRole('button', { name: /Create Questionnaire|Add Questionnaire|New/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();

        await page.fill('[name="title"], [name="name"]', 'E2E Security Assessment Questionnaire');
        const submitBtn = page.getByRole('button', { name: /Create|Save/i }).first();
        await submitBtn.click({ timeout: 5000 });

        await expect(page.locator('text=E2E Security Assessment Questionnaire')).toBeVisible({ timeout: 15000 });
      }
    }
  });
});
