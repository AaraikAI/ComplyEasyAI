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

    // The redesigned app shell defaults to the classic 256px sidebar (matching
    // the product screenshots). The E2E suite (SidebarPage page-object +
    // sidebar-navigation.spec.ts) targets the SlimSidebar 7-pillar icon rail,
    // which is still a supported mode reached via the sidebar toggle. Pin the
    // E2E session to the slim rail so the icon-pillar selectors resolve.
    localStorage.setItem('complyeasy_sidebar_variant', 'slim');

    // Mark signup modal as seen to prevent it from appearing
    sessionStorage.setItem('hasSeenSignupModal', 'true');

    // Skip onboarding modal
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');

    // Pre-accept cookie consent so the fixed-bottom GDPR banner
    // (role="dialog" aria-label="Cookie consent preferences") never renders. It
    // overlays the bottom of the viewport and otherwise intercepts pointer events
    // on controls anchored there (e.g. a create modal's submit button), which the
    // shared authenticated session models as a returning, already-consented user.
    // The dedicated Cookie Consent specs clear this key to force the banner.
    localStorage.setItem(
      'complyeasy_cookie_consent',
      JSON.stringify({
        essential: true,
        functional: true,
        analytics: true,
        targeting: true,
        consentDate: new Date().toISOString(),
        consentVersion: '1.0',
      }),
    );
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

  // Establish a REAL backend session (additive). The E2E app is served
  // SAME-ORIGIN (vite preview proxies /api -> backend), so the httpOnly session
  // cookies the backend sets — sameSite 'strict', secure off under NODE_ENV=test
  // — flow with the app's same-origin XHRs exactly like production. This lets
  // specs that exercise persisted, org-scoped flows (create -> persist -> render)
  // actually persist, instead of 401'ing the way cross-origin mock auth did.
  // CSRF is exempt for /auth/register and /auth/login (bootstrap endpoints), so
  // no token is needed here. We keep the mock `user_data` above for display
  // continuity and register the real user with the SAME name/org name, so any
  // spec asserting on those strings is unaffected. Best-effort: if the backend
  // is unavailable or login fails, the suite falls back to mock-only auth.
  const REAL_EMAIL = process.env.E2E_REAL_EMAIL || 'e2e-real@complyeasyai.com';
  const REAL_PASSWORD = process.env.E2E_REAL_PASSWORD || 'E2eRealPass!2026';
  try {
    // Register creates the user (and its organization). The user row is committed
    // before the welcome-email step, so even if email delivery is unconfigured
    // and the call returns 500, the account still exists for the login below.
    await page.request.post('/api/auth/register', {
      data: {
        email: REAL_EMAIL,
        password: REAL_PASSWORD,
        name: TEST_USER.name,
        organizationName: TEST_USER.organization.name,
      },
      failOnStatusCode: false,
    });
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: REAL_EMAIL, password: REAL_PASSWORD },
      failOnStatusCode: false,
    });
    if (loginRes.ok()) {
      console.log('Real E2E backend session established for', REAL_EMAIL);
      // A freshly-registered real user legitimately has welcomeCompleted=false,
      // so the app's full-screen "Welcome to ComplyEasy AI" onboarding wizard
      // (a fixed inset-0 z-50 dialog) auto-opens on every page and intercepts all
      // clicks. The suite models a RETURNING user, so mark the onboarding flows
      // skipped in the BACKEND — now the real source of truth, since the app reads
      // a real session and no longer trusts the localStorage markers alone. These
      // are mutating POSTs, so fetch a CSRF token first (double-submit cookie).
      try {
        const csrfBody = await (await page.request.get('/api/csrf-token')).json();
        if (csrfBody?.csrfToken) {
          for (const flowName of ['welcome', 'tier_tour']) {
            await page.request.post('/api/onboarding/skip-flow', {
              headers: { 'x-csrf-token': csrfBody.csrfToken },
              data: { flowName },
              failOnStatusCode: false,
            });
          }
        }
      } catch {
        // best-effort: spec-level overlay suppressors still cover the modal
      }
    } else {
      console.log(
        `Real login returned ${loginRes.status()} — continuing with mock-only auth`,
      );
    }
  } catch (err) {
    console.log('Real auth setup skipped:', (err as Error).message);
  }

  // Re-seed the cached user profile immediately before snapshotting. During boot
  // the app may issue an API call that returns 401 (the E2E user has no real
  // backend session); the api layer then clears `user_data` and redirects to '/'.
  // Re-writing it here guarantees the saved storageState contains a valid
  // `user_data`, so every spec that loads this state boots authenticated.
  await page.evaluate((userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('complyeasy_sidebar_variant', 'slim');
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem(
      'complyeasy_cookie_consent',
      JSON.stringify({
        essential: true,
        functional: true,
        analytics: true,
        targeting: true,
        consentDate: new Date().toISOString(),
        consentVersion: '1.0',
      }),
    );
  }, TEST_USER);

  // Save authentication state
  await page.context().storageState({ path: authFile });

  console.log('Auth setup complete');
});
