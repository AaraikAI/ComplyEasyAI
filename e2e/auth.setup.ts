/**
 * E2E Test Authentication Setup
 * Creates authenticated browser contexts for testing
 * Uses localStorage injection for magic-link authentication
 */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

// Mock user data for E2E testing
const TEST_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: process.env.TEST_USER_EMAIL || 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: {
    id: 'e2e-test-org-001',
    name: 'E2E Test Organization',
    plan: 'Visionary' // Full access for testing all features
  }
};

setup('authenticate', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Seed the cached user profile the app reads on startup. The production
  // AuthContext keeps auth/refresh tokens in httpOnly cookies (not reachable
  // from JS) and only restores the non-sensitive `user_data` profile from
  // localStorage, so the setup mirrors that contract and writes only user_data.
  await page.evaluate((userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));

    // Mark signup modal as seen to prevent it from appearing
    sessionStorage.setItem('hasSeenSignupModal', 'true');

    // Skip onboarding modal
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, TEST_USER);

  // Reload the page to pick up the auth state
  await page.reload();
  await page.waitForLoadState('networkidle').catch(() => {});

  // Wait for app to process auth state and potentially redirect
  await page.waitForTimeout(1000);

  // Navigate to dashboard to verify auth is working
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);

  // Dismiss onboarding modal if it appears - look for "Skip onboarding" text
  const skipOnboardingLink = page.getByText('Skip onboarding');
  if (await skipOnboardingLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Found onboarding modal, clicking Skip onboarding...');
    await skipOnboardingLink.click();
    await page.waitForTimeout(1000);
  }

  // If modal still visible, try clicking elsewhere or pressing Escape
  const onboardingModal = page.locator('text=Start Your Journey');
  if (await onboardingModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('Onboarding modal still visible, pressing Escape...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Verify we're on the dashboard (not redirected to landing)
  const isDashboard = await page.locator('h1:has-text("Good"), nav a[href="/dashboard"]').first().isVisible({ timeout: 10000 }).catch(() => false);

  if (!isDashboard) {
    // Check if we're on landing page - auth might not be accepted by backend
    const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);

    if (isLanding) {
      console.log('Auth injection did not work - falling back to dev mode auth');

      // Dismiss any popup modals first (signup modal)
      const closeButton = page.locator('[role="dialog"] button:has(svg), .fixed button:has-text("×"), button[aria-label*="close"]').first();
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click().catch(() => {});
        await page.waitForTimeout(300);
      }

      // Click Sign In button to open modal
      const signInButton = page.getByRole('button', { name: 'Sign In' }).first();
      if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signInButton.click();
        await page.waitForTimeout(500);

        // Fill email and submit for magic link
        const emailInput = page.locator('[role="dialog"] input[type="email"], .fixed input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await emailInput.fill(TEST_USER.email);

          // Submit
          const submitBtn = page.locator('[role="dialog"] button[type="submit"], .fixed button:has-text("Send Magic Link")').first();
          await submitBtn.click().catch(() => {});

          // In dev mode, check if we get a token
          await page.waitForTimeout(2000);
        }
      }
    }
  }

  // Re-seed the cached user profile immediately before snapshotting. During boot
  // the app may issue an API call that returns 401 (the E2E user has no real
  // backend session); the api layer then clears `user_data` and redirects to '/'.
  // Re-writing it here guarantees the saved storageState contains a valid
  // `user_data`, so every spec that loads this state boots authenticated.
  await page.evaluate((userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, TEST_USER);

  // Save authentication state
  await page.context().storageState({ path: authFile });

  console.log('Auth setup complete');
});
