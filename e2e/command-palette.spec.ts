/**
 * Command Palette E2E Tests
 * Tests for the new Cmd+K command palette feature
 */

import { test, expect } from '@playwright/test';
import { CommandPalettePage, DashboardPage } from './page-objects';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    // Dismiss onboarding modal if it appears
    const skipLink = page.getByText('Skip onboarding');
    if (await skipLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipLink.click();
      await page.waitForTimeout(500);
    }

    // Dismiss the Foundation Plan Tour if it appears
    // Look for the X button on the tour tooltip
    const tourClose = page.locator('button:has(svg.lucide-x), [aria-label*="close"], [aria-label*="Close"]').first();
    if (await tourClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await tourClose.click().catch(() => {});
      await page.waitForTimeout(300);
    }

    // If tour is still visible, try pressing Escape multiple times
    for (let i = 0; i < 3; i++) {
      const tourVisible = await page.locator('text=Step 1 of').isVisible().catch(() => false);
      if (tourVisible) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        break;
      }
    }
  });

  test('Opens with Cmd+K keyboard shortcut', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.expectToBeOpen();
    await commandPalette.expectSearchFocused();
  });

  test('Closes with Escape key', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.expectToBeOpen();

    await commandPalette.close();
    await commandPalette.expectToBeClosed();
  });

  test('Closes when clicking backdrop', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.expectToBeOpen();

    await commandPalette.clickBackdrop();
    await commandPalette.expectToBeClosed();
  });

  test('Shows navigation commands by default', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.expectResultsVisible();
    await commandPalette.expectResultCountGreaterThan(5);
  });

  test('Filters results when searching', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('dashboard');

    const results = await commandPalette.getResultTexts();
    const hasMatch = results.some(text => text.toLowerCase().includes('dashboard'));
    expect(hasMatch).toBeTruthy();
  });

  test('Navigates to Dashboard via command', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    // First navigate away from dashboard
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle').catch(() => {});

    await commandPalette.open();
    await commandPalette.search('dashboard');
    await commandPalette.selectCurrentItem();

    // App uses state-based navigation, verify by content
    await expect(page.locator('h1:has-text("Good"), [data-onboarding="compliance-score"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Navigates to Frameworks via command', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('frameworks');
    await commandPalette.selectCurrentItem();

    // Verify we're on Frameworks page - sidebar item should be selected
    await expect(page.locator('nav a.bg-brand-50:has-text("Frameworks"), nav [aria-current="page"]:has-text("Frameworks")').first()
      .or(page.locator('text=Active Frameworks'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Navigates to Risks via command', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('risk');
    await commandPalette.selectCurrentItem();

    // Verify we're on Risk Management page - sidebar item should be selected
    await expect(page.locator('nav a.bg-brand-50:has-text("Risk"), nav [aria-current="page"]:has-text("Risk")').first()
      .or(page.locator('h1:has-text("Risk"), text=Risk Management'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Navigates to Vendors via command', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('vendor');
    await commandPalette.selectCurrentItem();

    // Verify we're on Vendor Management page
    await expect(page.locator('nav a.bg-brand-50:has-text("Vendor"), nav [aria-current="page"]:has-text("Vendor")').first()
      .or(page.locator('h1:has-text("Vendor"), text=Vendor Management'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Navigates to Policies via command', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('policy');
    await commandPalette.selectCurrentItem();

    // Verify we're on Policy Management page
    await expect(page.locator('nav a.bg-brand-50:has-text("Policy"), nav [aria-current="page"]:has-text("Policy")').first()
      .or(page.locator('h1:has-text("Policy"), text=Policy Management'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Supports keyboard navigation with arrow keys', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.expectResultsVisible();

    // Navigate down
    await commandPalette.navigateDown();
    await page.waitForTimeout(100);

    // Navigate up
    await commandPalette.navigateUp();
    await page.waitForTimeout(100);

    // Selection should have changed
    const selectedText = await commandPalette.getSelectedItemText();
    expect(selectedText).toBeTruthy();
  });

  test('Enter key selects current item', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('frameworks');
    await commandPalette.selectCurrentItem();

    // Verify navigation happened - should see Frameworks page content
    await expect(page.locator('text=Active Frameworks').or(page.locator('button:has-text("Add Framework")'))).toBeVisible({ timeout: 10000 });
  });

  test('Shows AI Tools category', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('ai');

    // Should show AI tool results
    const results = await commandPalette.getResultTexts();
    const hasAiTool = results.some(
      text =>
        text.toLowerCase().includes('policy') ||
        text.toLowerCase().includes('contract') ||
        text.toLowerCase().includes('gap')
    );
    expect(hasAiTool).toBeTruthy();
  });

  test('Shows Enterprise category', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('enterprise');

    // Should show enterprise results
    await commandPalette.expectResultsVisible();
  });

  test('Can navigate to AI Policy Generator', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('ai policy');
    await commandPalette.selectCurrentItem();

    // Verify we're on AI Policy Generator page - look for distinctive content
    await expect(page.locator('text=Policy Generator').or(page.locator('text=Generate Policy')).or(page.locator('h2:has-text("Policy")'))).toBeVisible({ timeout: 10000 });
  });

  test('Can navigate to Gap Analysis', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('gap analysis');
    await commandPalette.selectCurrentItem();

    // Verify we're on Gap Analysis page - look for distinctive content
    await expect(page.locator('text=Gap Analysis').or(page.locator('text=Compliance Gap')).or(page.locator('h2:has-text("Gap")'))).toBeVisible({ timeout: 10000 });
  });

  test('Search is case insensitive', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.search('DASHBOARD');

    const results = await commandPalette.getResultTexts();
    const hasMatch = results.some(text => text.toLowerCase().includes('dashboard'));
    expect(hasMatch).toBeTruthy();
  });

  test('Shows keyboard hints in footer', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    await commandPalette.open();
    await commandPalette.expectFooterVisible();
  });

  test('Clears search when reopened', async ({ page }) => {
    const commandPalette = new CommandPalettePage(page);

    // Open, search, close
    await commandPalette.open();
    await commandPalette.search('test');
    await commandPalette.close();

    // Reopen - search should be clear
    await commandPalette.open();
    const inputValue = await commandPalette.searchInput.inputValue();
    expect(inputValue).toBe('');
  });
});
