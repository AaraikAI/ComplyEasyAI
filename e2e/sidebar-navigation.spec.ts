/**
 * Sidebar Navigation E2E Tests
 *
 * Targets the CURRENT app shell: the SlimSidebar icon rail
 * (components/SlimSidebar.tsx) with exactly 7 icon-only pillar links plus a
 * Settings link. Pillars (data-onboarding -> href):
 *   home->/dashboard, risk->/risks, comply->/frameworks, govern->/governance,
 *   audits->/audit, vendors->/vendors, library->/feature-library
 *   settings->/settings
 *
 * Non-pillar destinations (policies, integrations, monitoring, AI-RMF, etc.) are
 * deliberately NOT in the sidebar; they are reached via the command palette or a
 * direct page.goto(). Those cases are asserted to actually load the destination
 * (URL + a real element), not to live in the rail.
 */

import { test, expect } from '@playwright/test';
import { SidebarPage } from './page-objects';

// Re-seed the cached auth profile before every navigation. The shared
// storageState seeds `user_data`, but a boot-time API 401 can wipe it and
// redirect to '/'. addInitScript runs before each page load, so the app always
// boots authenticated. (Auth tokens live in httpOnly cookies; only the
// non-sensitive user_data profile is restored from localStorage by AuthContext.)
const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

// The onboarding "Welcome" modal is API-driven (OnboardingContext fetches
// /onboarding/progress). With no real backend session those calls 401, and the
// catch path auto-opens the welcome modal — a fixed inset-0 dialog that
// intercepts every click on the sidebar. Stub the onboarding endpoints to report
// onboarding already complete so the modal never renders.
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

// Top-level: re-seed auth + stub onboarding before every test (all describes).
test.beforeEach(async ({ page }) => {
  await stubOnboarding(page);
  await page.addInitScript((u) => {
    localStorage.setItem('user_data', JSON.stringify(u));
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
    // Pre-accept cookie consent so the GDPR banner (a fixed-bottom dialog that
    // intercepts pointer events on the sidebar/bottom-bar links) never renders.
    localStorage.setItem('complyeasy_cookie_consent', JSON.stringify({
      essential: true, functional: true, analytics: true, targeting: true,
      consentDate: new Date().toISOString(), consentVersion: '1.0',
    }));
  }, E2E_USER);
});

const PILLARS = [
  { id: 'home', href: '/dashboard', url: /\/dashboard/ },
  { id: 'risk', href: '/risks', url: /\/risks/ },
  { id: 'comply', href: '/frameworks', url: /\/frameworks/ },
  { id: 'govern', href: '/governance', url: /\/governance/ },
  { id: 'audits', href: '/audit', url: /\/audit/ },
  { id: 'vendors', href: '/vendors', url: /\/vendors/ },
  { id: 'library', href: '/feature-library', url: /\/feature-library/ },
] as const;

test.describe('Sidebar Navigation (SlimSidebar pillars)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('Sidebar is visible on dashboard', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.expectSidebarVisible();
  });

  test('Logo links to the dashboard', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.expectLogoVisible();
    await expect(sidebar.logo).toHaveAttribute('href', '/dashboard');
  });

  test('All 7 pillar links are present with correct hrefs', async ({ page }) => {
    for (const pillar of PILLARS) {
      const link = page.locator(`a[data-onboarding="${pillar.id}-nav"]`).first();
      await expect(link).toHaveAttribute('href', pillar.href);
    }
    // Settings link lives in the bottom rail, not among the 7 pillars.
    const settings = page.locator('a[data-onboarding="settings-nav"]').first();
    await expect(settings).toHaveAttribute('href', '/settings');
  });

  test('Sidebar exposes exactly the 7 pillars (no extra rail destinations)', async ({ page }) => {
    const nav = page.locator('nav[data-onboarding="sidebar-nav"]');
    await expect(nav.locator('a[data-onboarding$="-nav"]')).toHaveCount(PILLARS.length);
  });

  test('Can navigate to Dashboard', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    // Start elsewhere so the click is a real navigation.
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle').catch(() => {});
    await sidebar.navigateToDashboard();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Can navigate to Frameworks', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToFrameworks();
    await expect(page).toHaveURL(/\/frameworks/);
  });

  test('Can navigate to Risks', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToRisks();
    await expect(page).toHaveURL(/\/risks/);
  });

  test('Can navigate to Vendors', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToVendors();
    await expect(page).toHaveURL(/\/vendors/);
  });

  test('Can navigate to Governance', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToGovernance();
    await expect(page).toHaveURL(/\/governance/);
  });

  test('Can navigate to Audit', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToAudit();
    await expect(page).toHaveURL(/\/audit/);
  });

  test('Can navigate to Library', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToLibrary();
    await expect(page).toHaveURL(/\/feature-library/);
  });

  test('Can navigate to Settings', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToSettings();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('Active pillar reflects the current route', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToRisks();
    // Active pillar uses the brand-600 background class in SlimSidebar.
    const active = page.locator('a[data-onboarding="risk-nav"]');
    await expect(active).toHaveClass(/bg-brand-600/);
  });
});

test.describe('Sidebar Navigation - clicking every pillar', () => {
  test('Each pillar navigates to its route', async ({ page }) => {
    for (const pillar of PILLARS) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle').catch(() => {});

      await page.locator(`a[data-onboarding="${pillar.id}-nav"]`).first().click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(pillar.url);
    }
  });
});

test.describe('Non-pillar destinations (NOT in the sidebar)', () => {
  // These were historically asserted to live in the sidebar. In the SlimSidebar
  // shell they are NOT rail items — verify (a) they are absent from the rail and
  // (b) they are still reachable directly and actually load.
  const NON_PILLARS = [
    { path: '/policies', url: /\/policies/ },
    { path: '/integrations', url: /\/integrations/ },
    { path: '/monitoring', url: /\/monitoring/ },
    { path: '/reports', url: /\/reports/ },
    { path: '/issues', url: /\/issues/ },
  ];

  test('Non-pillar links are not present in the sidebar rail', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    const nav = page.locator('nav[data-onboarding="sidebar-nav"]');
    for (const np of NON_PILLARS) {
      await expect(nav.locator(`a[href^="${np.path}"]`)).toHaveCount(0);
    }
  });

  test('Non-pillar routes load when navigated directly', async ({ page }) => {
    for (const np of NON_PILLARS) {
      await page.goto(np.path);
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(np.url);
      // A real shell element (the sidebar rail) confirms the app rendered.
      await expect(page.locator('nav[data-onboarding="sidebar-nav"]').or(page.locator('aside')).first()).toBeVisible();
    }
  });
});

test.describe('Sidebar Responsive Behavior', () => {
  test('A navigation surface exists on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});

    // SlimSidebar hides the desktop <aside> below lg and renders a bottom tab
    // bar (the first 5 pillars). One of the two must be present.
    const desktopRail = page.locator('aside nav[data-onboarding="sidebar-nav"]');
    const bottomTabBar = page.locator('nav.fixed.bottom-0');

    const desktopVisible = await desktopRail.isVisible().catch(() => false);
    const bottomVisible = await bottomTabBar.isVisible().catch(() => false);
    expect(desktopVisible || bottomVisible).toBeTruthy();
  });

  test('Mobile bottom tab bar navigates to a pillar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});

    const bottomTabBar = page.locator('nav.fixed.bottom-0');
    if (await bottomTabBar.isVisible().catch(() => false)) {
      // The bottom bar shows the first 5 pillars; risk -> /risks.
      await bottomTabBar.locator('a[href="/risks"]').first().click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(/\/risks/);
    }
  });
});
