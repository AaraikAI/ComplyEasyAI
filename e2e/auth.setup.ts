/**
 * E2E Test Authentication Setup
 * Creates authenticated browser contexts for testing
 */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we're already logged in (development mode)
  const isLoggedIn = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false);

  if (!isLoggedIn) {
    // Fill in login form
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');

    // Click login button
    await page.click('[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify we're logged in
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
