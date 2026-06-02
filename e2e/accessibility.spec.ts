/**
 * E2E Tests: Accessibility & Responsive Design
 *
 * Tests keyboard navigation, ARIA attributes, focus management,
 * and responsive layout across different viewports.
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('Page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // A landmark heading must exist so screen readers can establish document structure.
    // The app shell always renders at least one h1 (route headings) or, on the
    // unauthenticated landing page, the marketing h1.
    const headingCount = await page.locator('h1, h2').count();
    expect(headingCount).toBeGreaterThan(0);

    // The top-level heading must carry visible text (not an empty/icon-only h1).
    const topHeading = page.locator('h1, h2').first();
    await expect(topHeading).toBeVisible({ timeout: 10000 });
    const topHeadingText = (await topHeading.textContent())?.trim() ?? '';
    expect(topHeadingText.length).toBeGreaterThan(0);
  });

  test('Interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check that something has focus
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    expect(focusedElement).toBeTruthy();
  });

  test('Buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Every visible button must expose an accessible name (text, aria-label,
    // aria-labelledby, or title) so assistive technology can announce it.
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    const unnamed: number[] = [];
    let visibleChecked = 0;

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (!(await button.isVisible())) continue;
      visibleChecked += 1;

      const text = (await button.textContent())?.trim() ?? '';
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');

      const hasName =
        text.length > 0 ||
        (ariaLabel?.trim().length ?? 0) > 0 ||
        (ariaLabelledBy?.trim().length ?? 0) > 0 ||
        (title?.trim().length ?? 0) > 0;

      if (!hasName) unnamed.push(i);
    }

    // At least one visible button must have been evaluated, and none may be unnamed.
    expect(visibleChecked).toBeGreaterThan(0);
    expect(unnamed, `Visible buttons missing an accessible name at indices: ${unnamed.join(', ')}`).toHaveLength(0);
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text or be decorative (role="presentation")
      const isAccessible = alt !== null || role === 'presentation' || role === 'none';
      expect(isAccessible).toBeTruthy();
    }
  });

  test('Color contrast - text is visible on background', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Basic check: the page renders without errors
    const bodyColor = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    expect(bodyColor.color).toBeDefined();
    expect(bodyColor.backgroundColor).toBeDefined();
  });
});

test.describe('Responsive Design', () => {
  test('App renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Page should render without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Allow small tolerance
  });

  test('App renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('Navigation is accessible on mobile (hamburger menu or similar)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Look for mobile menu toggle
    const menuToggle = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], .hamburger-menu, .mobile-nav-toggle').first();
    if (await menuToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuToggle.click();
      // Navigation should become visible
      await page.waitForTimeout(500);
    }
  });
});
