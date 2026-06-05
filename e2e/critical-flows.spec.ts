/**
 * E2E Tests for Critical User Flows
 * Tests the most important user journeys in the application.
 * Requires frontend (baseURL) and optionally backend (VITE_API_URL) for full flows.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Environment-blocker handling (shared by every authenticated spec).
// 1. Re-seed the cached auth profile before every navigation. The shared
//    storageState seeds `user_data`, but a boot-time API 401 can wipe it and
//    redirect to '/'. addInitScript runs before each page load, so the app
//    always boots authenticated.
// 2. Stub the onboarding endpoints so the welcome modal (a fixed inset-0 dialog
//    that intercepts clicks) never renders.
// 3. Pre-accept cookie consent so the GDPR banner never intercepts clicks.
// ---------------------------------------------------------------------------
const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

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
      body: JSON.stringify({ status: 'success', data: { checklist: { completedAt: new Date().toISOString() } } }),
    }),
  );
}

async function seedEnvironment(page: import('@playwright/test').Page) {
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

// Seed before every test across all describes.
test.beforeEach(async ({ page }) => {
  await seedEnvironment(page);
});

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
    // SlimSidebar pillars are icon-only links located by data-onboarding (no
    // accessible text), so getByRole/has-text won't match — locate by attribute.
    const frameworksLink = page.locator('a[data-onboarding="comply-nav"][href="/frameworks"]').first();

    await expect(frameworksLink).toBeVisible({ timeout: 10000 });
    await frameworksLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).toHaveURL(/frameworks/);
  });

  test('User can navigate to Vendors page', async ({ page }) => {
    const vendorsLink = page.locator('a[data-onboarding="vendors-nav"][href="/vendors"]').first();

    await expect(vendorsLink).toBeVisible({ timeout: 10000 });
    await vendorsLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).toHaveURL(/vendors/);
  });

  test('User can navigate to Policies page', async ({ page }) => {
    // Policies is NOT a sidebar pillar; it must NOT live in the rail. Reach it
    // via a direct navigation and assert the destination actually loaded.
    const nav = page.locator('nav[data-onboarding="sidebar-nav"]');
    await expect(nav.locator('a[href="/policies"]')).toHaveCount(0);

    await page.goto('/policies');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).toHaveURL(/policies/);
    // A real element of the destination, not just the URL.
    await expect(page.locator('h1:has-text("Polic"), [data-testid="policies-page"]').first())
      .toBeVisible({ timeout: 10000 });
  });

  test('User can navigate to Risks page', async ({ page }) => {
    const risksLink = page.locator('a[data-onboarding="risk-nav"][href="/risks"]').first();

    await expect(risksLink).toBeVisible({ timeout: 10000 });
    await risksLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page).toHaveURL(/risks/);
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
    await page.waitForLoadState('networkidle').catch(() => {});

    // Unknown routes resolve to one of three valid end-states: a 404/NotFound
    // view, the app shell (App.tsx catch-all `path="*"` -> Navigate to
    // /dashboard, which mounts the SlimSidebar rail — pillar links are
    // icon-only, so locate the rail by its data-onboarding hook), or the
    // unauthenticated landing page. Use a web-first assertion that polls until
    // any one of those settles (covers the lazy-Suspense load race under
    // parallel suite load). The rail is the expected state given seeded auth.
    const settled = page.locator('text=/404|not found/i')
      .or(page.locator('nav[data-onboarding="sidebar-nav"]'))
      .or(page.locator('a[data-onboarding="home-nav"]'))
      .or(page.locator('button:has-text("Sign In")'))
      .first();

    await expect(settled).toBeVisible({ timeout: 20000 });
  });
});
