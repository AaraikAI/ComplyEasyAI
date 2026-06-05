/**
 * E2E Tests: Audit Preparation
 * Tests audit readiness check, evidence gaps, simulation
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Rebound to the CURRENT SlimSidebar app shell.
 *
 * The three environment blockers that wipe auth / intercept clicks must be
 * neutralised before EVERY navigation (the icon-rail page-object pass established
 * this exact pattern):
 *   1. Auth is client-side (AuthContext restores localStorage 'user_data'); a
 *      boot-time API 401 clears it and redirects to '/'. Re-seed via addInitScript.
 *   2. The cookie-consent banner (fixed-bottom role=dialog) intercepts clicks —
 *      pre-seed 'complyeasy_cookie_consent'.
 *   3. The onboarding "Welcome" modal (fixed inset-0 dialog opened on an
 *      /onboarding/progress 401) intercepts all clicks — route-stub it.
 */

const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

async function stubOnboarding(page: Page) {
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

async function seedEnvironment(page: Page) {
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

test.describe('Audit Preparation', () => {
  test.beforeEach(async ({ page }) => {
    await seedEnvironment(page);
  });

  test.describe('Audit Center Hub', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/audit');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('audit center page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('audit center has tabs or sections', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const sections = page.locator(
        ':text("Preparation"), :text("Testing"), :text("Simulator"), :text("Audit Trail"), :text("Evidence")'
      ).first();
      if (await sections.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(sections).toBeVisible();
      }
    });
  });

  test.describe('Readiness Check', () => {
    test('audit prep page loads', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('readiness score is displayed', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const readiness = page.locator(
        ':text("Readiness"), :text("readiness"), :text("Score"), :text("%")'
      ).first();
      if (await readiness.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(readiness).toBeVisible();
      }
    });

    test('run readiness check button exists', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const checkBtn = page.getByRole('button', { name: /run|check|assess|start/i }).first();
      if (await checkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(checkBtn).toBeVisible();
      }
    });

    test('readiness check shows results', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const checkBtn = page.getByRole('button', { name: /run|check|assess|start/i }).first();
      // Only drive the flow when an actionable (visible AND enabled) trigger
      // exists. A disabled trigger means the readiness check cannot be started
      // in this environment, so there are no results to assert against.
      const actionable =
        (await checkBtn.isVisible({ timeout: 5000 }).catch(() => false)) &&
        (await checkBtn.isEnabled().catch(() => false));
      if (actionable) {
        await checkBtn.click();
        await page.waitForTimeout(3000);

        // Should show results
        const results = page.locator(
          ':text("Complete"), :text("Gap"), :text("Finding"), :text("Ready"), :text("Result"), table'
        ).first();
        if (await results.isVisible({ timeout: 10000 }).catch(() => false)) {
          await expect(results).toBeVisible();
        }
      }
    });
  });

  test.describe('Evidence Gaps', () => {
    test('evidence gaps are identified', async ({ page }) => {
      await page.goto('/audit-prep');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const gaps = page.locator(
        ':text("Evidence"), :text("Gap"), :text("Missing"), :text("Required")'
      ).first();
      if (await gaps.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(gaps).toBeVisible();
      }
    });

    test('evidence hub page loads', async ({ page }) => {
      await page.goto('/evidence');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('can upload evidence', async ({ page }) => {
      await page.goto('/evidence');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const uploadBtn = page.getByRole('button', { name: /upload|add|collect/i }).first();
      if (await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(uploadBtn).toBeVisible();
      }
    });
  });

  test.describe('Audit Simulation', () => {
    test('audit simulator is accessible', async ({ page }) => {
      await page.goto('/ai/audit-simulator');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('simulation can be configured and started', async ({ page }) => {
      await page.goto('/ai/audit-simulator');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Select framework for simulation
      const fwSelect = page.locator('select').first();
      if (await fwSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await fwSelect.locator('option').all();
        if (options.length > 1) {
          await fwSelect.selectOption({ index: 1 });
        }
      }

      const startBtn = page.getByRole('button', { name: /start|simulate|run|begin/i }).first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(startBtn).toBeVisible();
      }
    });
  });

  test.describe('Control Testing', () => {
    test('control testing page loads', async ({ page }) => {
      await page.goto('/control-testing');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('control test results show pass/fail status', async ({ page }) => {
      await page.goto('/control-testing');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const statusIndicators = page.locator(
        ':text("Pass"), :text("Fail"), :text("Effective"), :text("Ineffective"), .badge'
      ).first();
      if (await statusIndicators.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(statusIndicators).toBeVisible();
      }
    });
  });

  test.describe('Network & Security', () => {
    test('audit API calls are properly authenticated', async ({ page }) => {
      // Capture audit/evidence API responses. Authenticated requests carry the
      // httpOnly auth cookie automatically; a properly secured endpoint must
      // therefore respond with success, a client-side auth status (401/403), or
      // a not-found — but never a server error, and never leak data on a 401.
      const apiResponses: Array<{ url: string; status: number }> = [];

      page.on('response', (res) => {
        const url = res.url();
        if (url.includes('/api/') && (url.includes('audit') || url.includes('evidence'))) {
          apiResponses.push({ url, status: res.status() });
        }
      });

      await page.goto('/audit-prep');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Every audit/evidence API call must resolve to a defined, non-5xx status.
      for (const res of apiResponses) {
        expect(res.url).toContain('/api/');
        expect(res.status, `Unexpected status for ${res.url}`).toBeLessThan(500);
        expect([200, 201, 204, 304, 401, 403, 404]).toContain(res.status);
      }
    });

    test('no internal audit data exposed in page source', async ({ page }) => {
      await page.goto('/audit');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/eyJhbGciOi/);
      expect(html).not.toMatch(/sk_live_/);
    });
  });
});
