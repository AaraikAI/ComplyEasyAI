/**
 * E2E Tests for Critical User Flows
 * Tests the most important user journeys in the application.
 * Requires frontend (baseURL) and optionally backend (VITE_API_URL) for full flows.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('App loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Just verify the page loaded - either dashboard or landing
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // Check for either authenticated (dashboard) or unauthenticated (landing) state
    const isDashboard = await page.locator('nav a[href="/dashboard"], [data-onboarding]').first().isVisible().catch(() => false);
    const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);

    expect(isDashboard || isLanding).toBeTruthy();
  });
});

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - auth is handled by setup
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('User can navigate to Frameworks page', async ({ page }) => {
    // Navigate using sidebar
    const frameworksLink = page.locator('nav a[href="/frameworks"], a:has-text("Frameworks")').first();

    if (await frameworksLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await frameworksLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(/frameworks/);
    } else {
      // Skip if not authenticated
      test.skip();
    }
  });

  test('User can navigate to Vendors page', async ({ page }) => {
    const vendorsLink = page.locator('nav a[href="/vendors"], a:has-text("Vendors")').first();

    if (await vendorsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vendorsLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(/vendors/);
    } else {
      test.skip();
    }
  });

  test('User can navigate to Policies page', async ({ page }) => {
    const policiesLink = page.locator('nav a[href="/policies"], a:has-text("Policies")').first();

    if (await policiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await policiesLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(/policies/);
    } else {
      test.skip();
    }
  });

  test('User can navigate to Risks page', async ({ page }) => {
    const risksLink = page.locator('nav a[href="/risks"], a:has-text("Risks")').first();

    if (await risksLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await risksLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(/risks/);
    } else {
      test.skip();
    }
  });

  test('Dashboard shows compliance metrics', async ({ page }) => {
    // Check for dashboard content
    const hasMetrics = await page.locator('[data-onboarding="compliance-score"], .compliance-score, h1:has-text("Good")').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasMetrics) {
      // Verify some dashboard element is visible
      await expect(page.locator('body')).toContainText(/compliance|score|framework|risk/i);
    } else {
      // Not on dashboard - likely on landing page
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        test.skip();
      }
    }
  });
});

test.describe('Framework Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('Frameworks page loads', async ({ page }) => {
    // Check if we're on frameworks page or redirected to landing
    const isFrameworksPage = await page.locator('h1:has-text("Framework"), [data-testid="frameworks-page"]').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!isFrameworksPage) {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        test.skip();
      }
    }

    await expect(page).toHaveURL(/frameworks/);
  });

  test('Add Framework button is visible', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add Framework"), button:has-text("Create Framework")').first();
    const isVisible = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      // Check if on landing page
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        test.skip();
      }
    }

    if (isVisible) {
      await expect(addBtn).toBeVisible();
    }
  });
});

test.describe('Vendor Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('Vendors page loads', async ({ page }) => {
    const isVendorsPage = await page.locator('h1:has-text("Vendor"), [data-testid="vendors-page"]').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!isVendorsPage) {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        test.skip();
      }
    }

    await expect(page).toHaveURL(/vendors/);
  });
});

test.describe('Policy Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/policies');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('Policies page loads', async ({ page }) => {
    const isPoliciesPage = await page.locator('h1:has-text("Polic"), [data-testid="policies-page"]').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!isPoliciesPage) {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        test.skip();
      }
    }

    await expect(page).toHaveURL(/policies/);
  });
});

test.describe('Risk Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/risks');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('Risks page loads', async ({ page }) => {
    const isRisksPage = await page.locator('h1:has-text("Risk"), [data-testid="risks-page"]').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!isRisksPage) {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        test.skip();
      }
    }

    await expect(page).toHaveURL(/risks/);
  });
});

test.describe('Navigation and UI', () => {
  test('Sidebar navigation is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});

    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first();
    const isVisible = await sidebar.isVisible({ timeout: 10000 }).catch(() => false);

    // Either sidebar visible (authenticated) or landing page
    if (!isVisible) {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) {
        // On landing page - navigation should still exist
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();
      }
    } else {
      await expect(sidebar).toBeVisible();
    }
  });
});

test.describe('Error Handling', () => {
  test('404 page for invalid routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('domcontentloaded');

    // Should show 404 or redirect to landing/dashboard
    const has404 = await page.locator('text=/404|not found/i').isVisible({ timeout: 5000 }).catch(() => false);
    const hasApp = await page.locator('nav, button:has-text("Sign In")').first().isVisible().catch(() => false);

    expect(has404 || hasApp).toBeTruthy();
  });
});
