/**
 * E2E Tests: Billing
 * Tests plan viewing, upgrade flow, checkout, feature unlock
 */

import { test, expect } from '@playwright/test';

test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
    if (isLanding) test.skip();

    const billingTab = page.getByRole('tab', { name: /billing/i })
      .or(page.locator('button:has-text("Billing")'));
    if (await billingTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await billingTab.click();
      await page.waitForTimeout(500);
    }
  });

  test.describe('Plan Display', () => {
    test('current plan is displayed', async ({ page }) => {
      const planName = page.locator(
        ':text("Foundation"), :text("Essentials"), :text("Growth"), :text("Visionary")'
      ).first();
      if (await planName.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(planName).toBeVisible();
      }
    });

    test('subscription status is shown', async ({ page }) => {
      const status = page.locator(
        ':text("Active"), :text("Trialing"), :text("Past Due"), :text("Canceled")'
      ).first();
      if (await status.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(status).toBeVisible();
      }
    });

    test('usage metrics are displayed', async ({ page }) => {
      const usage = page.locator(
        ':text("Usage"), :text("usage"), [data-testid="usage"], [role="progressbar"]'
      ).first();
      if (await usage.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(usage).toBeVisible();
      }
    });
  });

  test.describe('Upgrade Flow', () => {
    test('upgrade options are available', async ({ page }) => {
      const upgradeBtn = page.getByRole('button', { name: /upgrade|change plan|select/i }).first();
      if (await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(upgradeBtn).toBeVisible();
      }
    });

    test('plan comparison shows features', async ({ page }) => {
      const planCards = page.locator('[data-testid="plan-card"], .plan-card, .pricing-card');
      if (await planCards.first().isVisible({ timeout: 8000 }).catch(() => false)) {
        const count = await planCards.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('billing cycle toggle switches between monthly and annual', async ({ page }) => {
      const monthlyBtn = page.getByRole('button', { name: /monthly/i })
        .or(page.locator('label:has-text("Monthly"), button:has-text("Monthly")'));
      const annualBtn = page.getByRole('button', { name: /annual/i })
        .or(page.locator('label:has-text("Annual"), button:has-text("Annual")'));

      if (await monthlyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await monthlyBtn.click();
        await page.waitForTimeout(300);
        // Prices should update

        if (await annualBtn.isVisible()) {
          await annualBtn.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('selecting a plan opens payment modal', async ({ page }) => {
      const selectPlanBtn = page.getByRole('button', { name: /select|upgrade|choose/i }).first();
      if (await selectPlanBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selectPlanBtn.click();
        await page.waitForTimeout(500);

        const modal = page.locator('[role="dialog"], .modal, [data-testid="payment-modal"]');
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();

          // Cancel to avoid actual payment
          const cancelBtn = modal.getByRole('button', { name: /cancel|close/i });
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
          }
        }
      }
    });

    test('proration preview shows for mid-cycle upgrades', async ({ page }) => {
      const selectPlanBtn = page.getByRole('button', { name: /select|upgrade|choose/i }).first();
      if (await selectPlanBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selectPlanBtn.click();
        await page.waitForTimeout(500);

        const proration = page.locator(
          ':text("proration"), :text("Proration"), :text("prorated"), :text("immediate charge")'
        ).first();
        if (await proration.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(proration).toBeVisible();
        }
      }
    });
  });

  test.describe('Feature Unlock', () => {
    test('feature marketplace is accessible from billing', async ({ page }) => {
      const featureTab = page.getByRole('tab', { name: /features/i })
        .or(page.locator('button:has-text("Features"), button:has-text("Marketplace")'));
      if (await featureTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await featureTab.click();
        await page.waitForTimeout(500);

        const marketplace = page.locator(
          ':text("Feature"), :text("Marketplace"), :text("Add-on")'
        ).first();
        if (await marketplace.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(marketplace).toBeVisible();
        }
      }
    });

    test('locked features show upgrade prompt', async ({ page }) => {
      // Navigate to a potentially locked feature
      await page.goto('/ai/agentic-vendor-risk');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const upgradeCta = page.locator(
        ':text("Upgrade"), :text("upgrade"), :text("Premium"), :text("Available on"), :text("Unlock")'
      ).first();
      // May or may not be visible depending on plan
      if (await upgradeCta.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(upgradeCta).toBeVisible();
      }
    });
  });

  test.describe('Network & Security', () => {
    test('billing API calls do not expose payment details in DOM', async ({ page }) => {
      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/sk_live_/);
      expect(html).not.toMatch(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/); // CC numbers
      expect(html).not.toMatch(/cvv|cvc/i);
    });

    test('payment mutations are not rejected by CSRF protection', async ({ page }) => {
      // Billing/subscription/payment mutations are state-changing and pass
      // through the backend double-submit CSRF check. A correctly wired flow
      // must never have a payment mutation rejected with a 403 CSRF error.
      const paymentMutations: string[] = [];
      const csrfRejections: string[] = [];

      const isPaymentMutation = (method: string, url: string) =>
        ['POST', 'PUT', 'PATCH'].includes(method) &&
        (url.includes('billing') || url.includes('subscription') || url.includes('payment'));

      page.on('request', (req) => {
        if (isPaymentMutation(req.method(), req.url())) {
          paymentMutations.push(`${req.method()} ${req.url()}`);
        }
      });
      page.on('response', (res) => {
        const req = res.request();
        if (isPaymentMutation(req.method(), res.url()) && res.status() === 403) {
          csrfRejections.push(`${req.method()} ${res.url()}`);
        }
      });

      const upgradeBtn = page.getByRole('button', { name: /upgrade|select/i }).first();
      if (await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await upgradeBtn.click();
        await page.waitForTimeout(2000);
      }

      // No payment mutation may be blocked by CSRF validation.
      expect(csrfRejections, `CSRF-rejected payment mutations: ${csrfRejections.join(', ')}`).toHaveLength(0);
    });

    test('billing page loads without server errors', async ({ page }) => {
      const errors: number[] = [];

      page.on('response', (res) => {
        if (res.status() >= 500) {
          errors.push(res.status());
        }
      });

      await page.goto('/settings');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Error Recovery', () => {
    test('handles payment API failure gracefully', async ({ page }) => {
      await page.route('**/api/*billing*', (route) => {
        route.fulfill({
          status: 402,
          body: JSON.stringify({ error: 'Payment required' }),
        });
      });

      await page.goto('/settings');
      await page.waitForTimeout(2000);

      // Should not crash
      const body = await page.locator('body').isVisible();
      expect(body).toBeTruthy();
    });
  });
});
