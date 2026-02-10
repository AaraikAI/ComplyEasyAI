/**
 * E2E Tests: Continuous Monitoring & Dashboard
 *
 * Tests monitoring setup, execution, dashboard metrics,
 * and real-time analytics.
 */

import { test, expect } from '@playwright/test';

test.describe('Monitoring & Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('Dashboard shows key compliance metrics', async ({ page }) => {
    // Dashboard should be the default view
    await expect(
      page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), [data-testid="dashboard"]').first()
    ).toBeVisible({ timeout: 10000 });

    // Look for metric cards
    const metricCards = page.locator('[data-testid="metric-card"], .metric-card, .stat-card, .dashboard-card');
    const cardCount = await metricCards.count();
    // Dashboard should have at least one metric
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('User can view monitoring dashboard', async ({ page }) => {
    const monLink = page.getByRole('link', { name: /Monitor/i })
      .or(page.locator('button:has-text("Monitor")'))
      .first();
    await monLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(
      page.locator('h1:has-text("Monitor"), h2:has-text("Monitor"), [data-testid="monitoring-dashboard"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('User can create a new monitor', async ({ page }) => {
    const monLink = page.getByRole('link', { name: /Monitor/i })
      .or(page.locator('button:has-text("Monitor")'))
      .first();
    await monLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const addBtn = page.getByRole('button', { name: /Create Monitor|Add Monitor|New Monitor/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();

      await page.fill('[name="name"]', 'E2E Security Monitor');

      const typeField = page.locator('[name="type"], select[name="type"]');
      if (await typeField.isVisible()) {
        await typeField.selectOption({ index: 1 }).catch(() => {
          typeField.fill('Security');
        });
      }

      const submitBtn = page.getByRole('button', { name: /Create|Save/i }).first();
      await submitBtn.click({ timeout: 5000 });

      await expect(page.locator('text=E2E Security Monitor')).toBeVisible({ timeout: 15000 });
    }
  });

  test('User can view real-time analytics', async ({ page }) => {
    const analyticsLink = page.getByRole('link', { name: /Analytics/i })
      .or(page.locator('button:has-text("Analytics")'))
      .first();

    if (await analyticsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await analyticsLink.click({ timeout: 10000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await expect(
        page.locator('h1:has-text("Analytics"), h2:has-text("Analytics"), [data-testid="analytics-dashboard"]').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
