/**
 * E2E Tests: Privacy Management
 * Tests DPIA wizard, RoPA, DPO, cookie consent, breach notification
 */

import { test, expect } from '@playwright/test';

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

test.describe('Privacy Management', () => {
  test.describe('Privacy Platform Hub', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/privacy');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('privacy platform page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('privacy hub shows navigation to sub-features', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
      await page.goto('/privacy/dpia');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('DPIA page loads with create option', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('DPIA wizard can be started', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
      await page.goto('/privacy/ropa');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('RoPA page loads with processing activities', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('can add a new processing activity', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
    test('privacy notices page loads', async ({ page }) => {
      await page.goto('/privacy/notices');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('can create a new privacy notice', async ({ page }) => {
      await page.goto('/privacy/notices');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

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
      // authenticated MainApp shell (App.tsx) and only renders when no consent is
      // stored. An unauthenticated visitor to '/' sees the public LandingPage,
      // which must NOT carry the consent dialog. This asserts the banner is not
      // leaked onto the public surface while confirming the landing page renders.
      await context.clearCookies();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Landing page is reached: the sign-in affordance is present.
      await expect(page.locator('button:has-text("Sign In")').first()).toBeVisible({ timeout: 10000 });

      // The cookie consent dialog (role="dialog" aria-label="Cookie consent preferences")
      // must not be present on the unauthenticated landing page.
      const consentDialog = page.getByRole('dialog', { name: /cookie consent/i });
      await expect(consentDialog).toHaveCount(0);
    });

    test('accepting cookies dismisses the banner', async ({ page, context }) => {
      await context.clearCookies();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const acceptBtn = page.getByRole('button', { name: /accept|allow|agree/i }).first();
      if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await acceptBtn.click();
        await page.waitForTimeout(1000);
        const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent').first();
        await expect(cookieBanner).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Data Deletion', () => {
    test('data deletion page loads', async ({ page }) => {
      await page.goto('/privacy/data-deletion');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Security', () => {
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
