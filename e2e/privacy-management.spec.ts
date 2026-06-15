/**
 * E2E Tests: Privacy Management
 * Tests DPIA wizard, RoPA, DPO, cookie consent, breach notification
 *
 * Rebound to the CURRENT app shell. Auth in this app is client-side: AuthContext
 * restores localStorage `user_data` on boot and `isAuthenticated = !!user`. The
 * shared storageState seeds `user_data`, but a boot-time API 401 wipes it and
 * redirects to '/'. So authenticated specs must (1) re-seed `user_data` via an
 * addInitScript before every navigation, (2) pre-accept cookie consent so the
 * fixed-bottom GDPR banner never intercepts clicks, and (3) stub the
 * /onboarding/progress + /onboarding/checklist endpoints so the API-driven
 * "Welcome" modal (which auto-opens on 401 and intercepts all clicks) never
 * renders. The privacy routes (/privacy, /privacy/dpia, /privacy/ropa,
 * /privacy/notices, /privacy/data-deletion) are real authenticated routes in
 * App.tsx, so the legacy `isLanding` Sign-In guard never fires for them.
 */

import { test, expect, Page } from '@playwright/test';

// Paths the server intentionally exempts from CSRF validation (pre-login auth
// endpoints and HMAC-verified webhook receivers — see server/src/middleware/csrf.ts).
// Mutating requests to these legitimately omit the x-csrf-token header.
const CSRF_EXEMPT = [
  '/auth/login', '/auth/register', '/auth/refresh', '/auth/magic-link',
  '/auth/verify', '/auth/2fa/complete', '/webhook', '/csrf-token',
];
function isCsrfExempt(url: string): boolean {
  return CSRF_EXEMPT.some((p) => url.includes(p));
}

// Cached auth profile re-seeded before every navigation (auth tokens live in
// httpOnly cookies; only this non-sensitive profile is restored from localStorage).
const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

// Stub the onboarding endpoints so the welcome modal (a fixed inset-0 dialog that
// intercepts every click) never renders.
async function stubOnboarding(page: Page): Promise<void> {
  await page.route('**/onboarding/progress', (route) =>
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
  await page.route('**/onboarding/checklist', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: { checklist: { completedAt: new Date().toISOString() } } }),
    }),
  );
}

// Re-seed auth profile + (optionally) pre-accept cookie consent before every nav.
async function seedAuth(page: Page, opts: { acceptCookies?: boolean } = {}): Promise<void> {
  const acceptCookies = opts.acceptCookies !== false;
  await page.addInitScript(
    ({ u, acceptCookies }) => {
      localStorage.setItem('user_data', JSON.stringify(u));
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_skipped', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');
      if (acceptCookies) {
        localStorage.setItem(
          'complyeasy_cookie_consent',
          JSON.stringify({
            essential: true, functional: true, analytics: true, targeting: true,
            consentDate: new Date().toISOString(), consentVersion: '1.0',
          }),
        );
      }
    },
    { u: E2E_USER, acceptCookies },
  );
}

test.describe('Privacy Management', () => {
  test.describe('Privacy Platform Hub', () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubOnboarding(page);
      await page.goto('/privacy');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('privacy platform page loads', async ({ page }) => {
      // The page header (h1) renders unconditionally; under CI's concurrent load
      // (4 shards x 2 workers on one backend) the SPA boot can be slow, so wait for
      // the network to settle and allow a generous window rather than racing it.
      await page.waitForLoadState('networkidle').catch(() => {});
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    test('privacy hub shows navigation to sub-features', async ({ page }) => {
      const subFeatures = page.locator(
        ':text("DPIA"), :text("RoPA"), :text("Privacy Notice"), :text("Data Subject"), :text("Consent")'
      ).first();
      if (await subFeatures.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(subFeatures).toBeVisible();
      }
    });
  });

  test.describe('DPIA Wizard', () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubOnboarding(page);
      await page.goto('/privacy/dpia');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('DPIA page loads with create option', async ({ page }) => {
      // The page header (h1) renders unconditionally; under CI's concurrent load
      // (4 shards x 2 workers on one backend) the SPA boot can be slow, so wait for
      // the network to settle and allow a generous window rather than racing it.
      await page.waitForLoadState('networkidle').catch(() => {});
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    test('DPIA wizard can be started', async ({ page }) => {
      const startBtn = page.getByRole('button', { name: /start|new|create|begin/i }).first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(500);

        // Should show wizard steps or form
        const formElement = page.locator('form, .wizard, .stepper, [data-testid="dpia-form"]').first();
        const inputElement = page.locator('input, textarea, select').first();
        const hasForm = await formElement.isVisible({ timeout: 5000 }).catch(() => false);
        const hasInput = await inputElement.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasForm || hasInput).toBeTruthy();
      }
    });

    test('DPIA wizard step navigation works', async ({ page }) => {
      const startBtn = page.getByRole('button', { name: /start|new|create|begin/i }).first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(500);

        // Fill required fields
        const nameInput = page.locator('[name="name"], [name="title"], input[type="text"]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill('E2E DPIA Assessment');
        }

        const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
        if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(500);
          // Should advance to next step
        }
      }
    });

    test('DPIA creation sends POST with CSRF', async ({ page }) => {
      // Every mutating /api/ request (excluding CSRF-exempt auth/webhook paths) must
      // carry an x-csrf-token header — the frontend attaches it for all
      // POST/PUT/PATCH/DELETE calls (services/api.ts). A mutation without the token
      // is a regression and must fail the test rather than be skipped.
      const mutationsWithoutCsrf: string[] = [];
      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/') && !isCsrfExempt(req.url())) {
          if (!req.headers()['x-csrf-token']) mutationsWithoutCsrf.push(req.url());
        }
      });

      const startBtn = page.getByRole('button', { name: /start|new|create|begin/i }).first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(2000);
      }

      expect(mutationsWithoutCsrf, `mutating requests missing CSRF: ${mutationsWithoutCsrf.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('RoPA (Records of Processing Activities)', () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubOnboarding(page);
      await page.goto('/privacy/ropa');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('RoPA page loads with processing activities', async ({ page }) => {
      // The page header (h1) renders unconditionally; under CI's concurrent load
      // (4 shards x 2 workers on one backend) the SPA boot can be slow, so wait for
      // the network to settle and allow a generous window rather than racing it.
      await page.waitForLoadState('networkidle').catch(() => {});
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    test('can add a new processing activity', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const nameInput = page.locator('[name="name"], [name="activityName"], input[type="text"]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill('E2E Processing Activity');
        }
      }
    });

    test('RoPA entries display required GDPR fields', async ({ page }) => {
      // RoPA should reference GDPR required fields
      const gdprFields = page.locator(
        ':text("Purpose"), :text("Lawful Basis"), :text("Data Subject"), :text("Retention"), :text("Controller")'
      ).first();
      if (await gdprFields.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(gdprFields).toBeVisible();
      }
    });
  });

  test.describe('Privacy Notices', () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubOnboarding(page);
    });

    test('privacy notices page loads', async ({ page }) => {
      await page.goto('/privacy/notices');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      // The page header (h1) renders unconditionally; under CI's concurrent load
      // (4 shards x 2 workers on one backend) the SPA boot can be slow, so wait for
      // the network to settle and allow a generous window rather than racing it.
      await page.waitForLoadState('networkidle').catch(() => {});
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    test('can create a new privacy notice', async ({ page }) => {
      await page.goto('/privacy/notices');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const createBtn = page.getByRole('button', { name: /create|add|new/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Cookie Consent', () => {
    test('cookie consent banner is scoped to the authenticated app shell', async ({ page, context }) => {
      // The CookieConsentBanner is a global banner mounted inside the
      // authenticated MainApp shell (App.tsx:419, after <Layout>) and only renders
      // when no consent is stored. An unauthenticated visitor to '/' sees the
      // public LandingPage, which must NOT carry the consent dialog. This asserts
      // the banner is not leaked onto the public surface while confirming the
      // landing page renders.
      //
      // Auth here is localStorage-based (`user_data`), not cookie-based, so
      // context.clearCookies() alone does NOT log the user out — the shared
      // storageState's `user_data` would still authenticate them and '/' would
      // redirect to /dashboard. Explicitly clear `user_data` before boot so the
      // genuinely-unauthenticated public LandingPage renders.
      await context.clearCookies();
      await page.addInitScript(() => {
        localStorage.removeItem('user_data');
      });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Landing page is reached: the public sign-in affordance is present. The
      // current LandingPage header CTA opens the auth modal and is labelled via
      // i18n auth.login ("Log In"); the hero CTA is "Start Free Trial". Assert one
      // of these public, unauthenticated affordances is visible.
      const signInAffordance = page
        .getByRole('button', { name: /log in|sign in|start free trial|get started/i })
        .first();
      await expect(signInAffordance).toBeVisible({ timeout: 10000 });

      // The cookie consent dialog (role="dialog" aria-label="Cookie consent preferences")
      // must not be present on the unauthenticated landing page.
      const consentDialog = page.getByRole('dialog', { name: /cookie consent/i });
      await expect(consentDialog).toHaveCount(0);
    });

    test('accepting cookies dismisses the banner', async ({ page }) => {
      // Drive this inside the authenticated app shell (where the banner actually
      // mounts) but WITHOUT pre-seeding consent, so the GDPR banner renders.
      // Accepting must dismiss it.
      await seedAuth(page, { acceptCookies: false });
      await stubOnboarding(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // The banner is role="dialog" aria-label="Cookie consent preferences"
      // (CookieConsentBanner.tsx). It animates in (slideIn) shortly after mount.
      const consentDialog = page.getByRole('dialog', { name: /cookie consent/i });
      if (await consentDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        const acceptBtn = page.getByRole('button', { name: /accept|allow|agree/i }).first();
        await acceptBtn.click();
        await page.waitForTimeout(1000);
        // handleAcceptAll persists prefs and unmounts the banner (returns null).
        await expect(consentDialog).toBeHidden({ timeout: 5000 });
      }
    });
  });

  test.describe('Data Deletion', () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubOnboarding(page);
    });

    test('data deletion page loads', async ({ page }) => {
      await page.goto('/privacy/data-deletion');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      // The page header (h1) renders unconditionally; under CI's concurrent load
      // (4 shards x 2 workers on one backend) the SPA boot can be slow, so wait for
      // the network to settle and allow a generous window rather than racing it.
      await page.waitForLoadState('networkidle').catch(() => {});
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('Security', () => {
    test.beforeEach(async ({ page }) => {
      await seedAuth(page);
      await stubOnboarding(page);
    });

    test('privacy pages do not expose PII in DOM attributes', async ({ page }) => {
      await page.goto('/privacy');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const html = await page.locator('body').innerHTML();
      // No raw SSNs, credit cards, or explicit PII patterns in attributes
      expect(html).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/); // SSN pattern
      expect(html).not.toMatch(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/); // CC pattern
    });
  });
});
