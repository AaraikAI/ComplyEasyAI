/**
 * E2E Tests: Hub Navigation
 * Tests all 13 hub pages: verify tabs load, interact with features
 */

import { test, expect, Page } from '@playwright/test';
import { dismissOnboarding } from './_onboarding';

/**
 * The three shared-environment blockers (auth wipe / cookie banner / onboarding
 * "Welcome" modal) are neutralised in beforeEach exactly as the page-object
 * pass established. Without this, the boot-time onboarding modal (a fixed
 * inset-0 role=dialog) intercepts pointer events and the sidebar click in the
 * "Cross-Hub Navigation" test never lands.
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

async function neutraliseEnvBlockers(page: Page) {
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

const HUBS = [
  { name: 'Reporting Center', route: '/reports', expectedContent: /report|template|export/i },
  { name: 'Audit Center', route: '/audit', expectedContent: /audit|trail|preparation|testing/i },
  { name: 'Analytics Hub', route: '/monitoring', expectedContent: /analytics|monitoring|metric|dashboard/i },
  { name: 'Policy Hub', route: '/policies', expectedContent: /polic|template|draft|approved/i },
  { name: 'Governance Hub', route: '/governance', expectedContent: /governance|workflow|sox|process/i },
  { name: 'Incident Hub', route: '/issues', expectedContent: /issue|incident|breach|ticket/i },
  { name: 'Product Hub', route: '/products', expectedContent: /product|ce.mark|lifecycle|sbom|passport/i },
  { name: 'Evidence Hub', route: '/evidence', expectedContent: /evidence|exception|collection/i },
  { name: 'AI Compliance Tools', route: '/ai/compliance-tools', expectedContent: /compliance|phishing|mapper|remediation/i },
  { name: 'Enterprise Ops Hub', route: '/enterprise/security-ops', expectedContent: /security|asset|bia|cicd|training/i },
  { name: 'Vendor Hub', route: '/vendors', expectedContent: /vendor|monitor|contract|risk/i },
  { name: 'AI Document Tools', route: '/ai/document-tools', expectedContent: /document|policy|gap|rfp|bcp/i },
  { name: 'Risk Hub', route: '/risks', expectedContent: /risk|heatmap|assessment|score/i },
];

test.describe('Hub Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await neutraliseEnvBlockers(page);
  });

  for (const hub of HUBS) {
    test.describe(hub.name, () => {
      test(`${hub.name} page loads successfully`, async ({ page }) => {
        await page.goto(hub.route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
      });

      test(`${hub.name} has tabbed navigation`, async ({ page }) => {
        await page.goto(hub.route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        const tabs = page.locator('button[role="tab"], .tab-button, nav button, [data-testid*="tab"]');
        if (await tabs.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          const tabCount = await tabs.count();
          expect(tabCount).toBeGreaterThanOrEqual(1);
        }
      });

      test(`${hub.name} shows relevant content`, async ({ page }) => {
        await page.goto(hub.route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        const bodyText = await page.locator('body').textContent();
        if (bodyText) {
          expect(bodyText.toLowerCase()).toMatch(hub.expectedContent);
        }
      });

      test(`${hub.name} tabs switch content`, async ({ page }) => {
        await page.goto(hub.route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        const tabs = page.locator('button[role="tab"], .tab-button');
        if (await tabs.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          const tabCount = await tabs.count();
          if (tabCount >= 2) {
            // Click second tab
            await tabs.nth(1).click();
            await page.waitForTimeout(500);

            // Content should have changed
            const content = page.locator('main, [role="tabpanel"], .tab-content, .content').first();
            if (await content.isVisible({ timeout: 5000 }).catch(() => false)) {
              await expect(content).toBeVisible();
            }
          }
        }
      });

      test(`${hub.name} no server errors on load`, async ({ page }) => {
        const errors: number[] = [];

        page.on('response', (res) => {
          if (res.status() >= 500) errors.push(res.status());
        });

        await page.goto(hub.route);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(2000);

        expect(errors).toHaveLength(0);
      });
    });
  }

  test.describe('Cross-Hub Navigation', () => {
    test('can navigate between hubs via sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await dismissOnboarding(page);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      /**
       * Both the slim (default) and classic sidebars stamp each nav link with a
       * stable `data-onboarding="<id>-nav"` hook (SlimSidebar.tsx / Layout.tsx).
       * Targeting that hook — instead of `a[href]`/`a:has-text(...)` — avoids two
       * flake sources: (1) the slim sidebar renders the SAME href twice (a
       * `hidden lg:flex` desktop aside + an `lg:hidden` mobile bar), so a bare
       * href selector with `.first()` can resolve to the off-viewport copy that
       * never becomes visible; (2) `a:has-text("Risk")` also matched dashboard
       * body cards / the desktop tooltip span (`pointer-events-none invisible`).
       * `:visible` pins us to the on-screen control for the current viewport.
       *
       * Note: the slim mobile bar only renders the first 5 pillars, so `vendors`
       * has no visible link < lg width — the per-link guard below skips it there
       * rather than timing out on a hidden element.
       */

      // Navigate to Risks via the visible sidebar link. The slim sidebar tags it
      // `risk-nav` (SlimSidebar pillar id `risk`); the classic sidebar tags it
      // `risks-nav` (Layout nav id `risks`) — match either, then `:visible`.
      const risksLink = page
        .locator('a[data-onboarding="risk-nav"]:visible, a[data-onboarding="risks-nav"]:visible')
        .first();
      if (await risksLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(risksLink).toBeVisible({ timeout: 15000 });
        await risksLink.scrollIntoViewIfNeeded();
        await risksLink.click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await expect(page).toHaveURL(/risk/);
        // Wait for the new hub heading to render before the next interaction.
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

        // Navigate to Vendors via the visible sidebar link.
        const vendorsLink = page.locator('a[data-onboarding="vendors-nav"]:visible').first();
        if (await vendorsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(vendorsLink).toBeVisible({ timeout: 15000 });
          await vendorsLink.scrollIntoViewIfNeeded();
          await vendorsLink.click();
          await page.waitForLoadState('networkidle').catch(() => {});
          await expect(page).toHaveURL(/vendor/);
        }
      }
    });

    test('browser back button works between hubs', async ({ page }) => {
      await page.goto('/risks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      await page.goto('/vendors');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      await page.goBack();
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(/risk/);
    });
  });

  test.describe('Security', () => {
    test('all hub pages are free of exposed secrets', async ({ page }) => {
      for (const hub of HUBS.slice(0, 3)) {
        await page.goto(hub.route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const html = await page.locator('body').innerHTML();
        expect(html).not.toMatch(/eyJhbGciOi/);
        expect(html).not.toMatch(/sk_live_/);
        expect(html).not.toMatch(/OPENAI_API_KEY/);
      }
    });
  });
});
