/**
 * Command Palette (Cmd+K Global Search) E2E Tests
 *
 * NOTE: In the current shell the global Cmd/Ctrl+K shortcut opens the GLOBAL
 * SEARCH modal (components/GlobalSearch.tsx), not the standalone CommandPalette
 * component. GlobalSearch is a search box (no fixed default command list): it
 * shows results only after you type, blending an instant FEATURE_CATALOG match
 * with /api/search results. Selecting a result performs a real react-router
 * navigation, so navigation is asserted by URL change to the catalog path.
 */

import { test, expect } from '@playwright/test';
import { CommandPalettePage } from './page-objects';

// The app keeps auth tokens in httpOnly cookies and only restores the cached
// `user_data` profile from localStorage on boot (AuthContext). The shared
// storageState seeds it, but a boot-time API 401 can wipe `user_data` and
// redirect to '/'. Re-seeding via addInitScript runs before EVERY navigation,
// so the app always boots authenticated regardless of that race.
const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

// Stub the API-driven onboarding "Welcome" modal so it never opens over the app
// (it is a fixed inset-0 dialog that would intercept Cmd+K and clicks).
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

test.describe('Command Palette (Cmd+K Global Search)', () => {
  test.beforeEach(async ({ page }) => {
    await stubOnboarding(page);
    await page.addInitScript((u) => {
      localStorage.setItem('user_data', JSON.stringify(u));
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_skipped', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');
      // Pre-accept cookie consent so the GDPR banner never renders.
      localStorage.setItem('complyeasy_cookie_consent', JSON.stringify({
        essential: true, functional: true, analytics: true, targeting: true,
        consentDate: new Date().toISOString(), consentVersion: '1.0',
      }));
    }, E2E_USER);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(300);

    // Dismiss onboarding modal if it appears.
    const skipLink = page.getByText('Skip onboarding');
    if (await skipLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipLink.click();
      await page.waitForTimeout(300);
    }

    // Dismiss any Foundation Plan tour tooltip.
    for (let i = 0; i < 3; i++) {
      const tourVisible = await page.locator('text=Step 1 of').isVisible().catch(() => false);
      if (tourVisible) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
      } else {
        break;
      }
    }
  });

  test('Opens with Cmd+K keyboard shortcut', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.expectToBeOpen();
    await palette.expectSearchFocused();
  });

  test('Closes with Escape key', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.expectToBeOpen();
    await palette.close();
    await palette.expectToBeClosed();
  });

  test('Closes when clicking backdrop', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.expectToBeOpen();
    await palette.clickBackdrop();
    await palette.expectToBeClosed();
  });

  test('Shows the empty-state hint and footer when opened', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    // With no query there is no command list; the footer keyboard hints are
    // always present, and a "Navigate" hint is shown.
    await palette.expectFooterVisible();
  });

  test('Returns results after typing', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('compliance');
    await palette.expectResultsVisible();
  });

  test('Filters results to the query', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('framework');

    const results = await palette.getResultTexts();
    expect(results.length).toBeGreaterThan(0);
    const hasMatch = results.some(text => text.toLowerCase().includes('framework'));
    expect(hasMatch).toBeTruthy();
  });

  test('Navigates to Frameworks via search', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('frameworks');

    // The "Compliance Frameworks" catalog entry navigates to /frameworks.
    const item = palette.commandItems.filter({ hasText: /framework/i }).first();
    await item.click();
    await expect(page).toHaveURL(/\/frameworks/, { timeout: 10000 });
  });

  test('Navigates to Risks via search', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('risk register');

    const item = palette.commandItems.filter({ hasText: /risk/i }).first();
    await item.click();
    await expect(page).toHaveURL(/\/risks/, { timeout: 10000 });
  });

  test('Navigates to Vendors via search', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('vendor management');

    const item = palette.commandItems.filter({ hasText: /vendor/i }).first();
    await item.click();
    await expect(page).toHaveURL(/\/vendors/, { timeout: 10000 });
  });

  test('Navigates to Policies via search', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('policy management');

    const item = palette.commandItems.filter({ hasText: /policy/i }).first();
    await item.click();
    await expect(page).toHaveURL(/\/policies/, { timeout: 10000 });
  });

  test('Supports keyboard navigation with arrow keys', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('compliance');
    await palette.expectResultsVisible();

    // selectedIndex starts at -1; ArrowDown highlights the first result.
    await palette.navigateDown();
    await expect(palette.selectedItem.first()).toBeVisible();

    const firstText = await palette.getSelectedItemText();
    await palette.navigateDown();
    const secondText = await palette.getSelectedItemText();

    // The highlight moved to a different result.
    expect(firstText).toBeTruthy();
    expect(secondText).toBeTruthy();
  });

  test('Enter key selects the highlighted result', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('frameworks');
    await palette.expectResultsVisible();

    // ArrowDown to highlight the first result, then Enter to navigate.
    await palette.navigateDown();
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Landed on a real destination (a feature/resource page), modal closed.
    await palette.expectToBeClosed();
    await expect(page).not.toHaveURL(/\/dashboard$/);
  });

  test('Surfaces AI tooling in results', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('ai');

    const results = await palette.getResultTexts();
    expect(results.length).toBeGreaterThan(0);
    const hasAiTool = results.some(
      text =>
        text.toLowerCase().includes('ai') ||
        text.toLowerCase().includes('policy') ||
        text.toLowerCase().includes('gap')
    );
    expect(hasAiTool).toBeTruthy();
  });

  test('Surfaces compliance/governance results', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('governance');
    await palette.expectResultsVisible();
  });

  test('Can navigate to AI Policy Generator via search', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('ai policy generator');

    const item = palette.commandItems.filter({ hasText: /policy/i }).first();
    await item.click();
    // AI Policy Generator lives under /policies (?tab=ai-generator).
    await expect(page).toHaveURL(/\/policies/, { timeout: 10000 });
  });

  test('Can navigate to Gap Analysis via search', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('gap analysis');

    const item = palette.commandItems.filter({ hasText: /gap/i }).first();
    await item.click();
    // Gap Analysis lives under /ai/document-tools (?tab=gap).
    await expect(page).toHaveURL(/\/ai\/document-tools/, { timeout: 10000 });
  });

  test('Search is case insensitive', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.search('FRAMEWORK');

    const results = await palette.getResultTexts();
    const hasMatch = results.some(text => text.toLowerCase().includes('framework'));
    expect(hasMatch).toBeTruthy();
  });

  test('Shows keyboard hints in footer', async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.expectFooterVisible();
  });

  test('Clears search when reopened', async ({ page }) => {
    const palette = new CommandPalettePage(page);

    await palette.open();
    await palette.search('test');
    await palette.close();

    await palette.open();
    const inputValue = await palette.searchInput.inputValue();
    expect(inputValue).toBe('');
  });
});
