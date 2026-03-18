/**
 * Billing Page Object
 * Covers plan viewing, upgrades, checkout, and feature unlocking
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class BillingPage extends BasePage {
  readonly path = '/settings';

  get billingTab(): Locator {
    return this.page.getByRole('tab', { name: /billing/i })
      .or(this.page.locator('button:has-text("Billing")'));
  }

  // Plan display
  get currentPlanName(): Locator {
    return this.page.locator('[data-testid="current-plan"], :text("Foundation"), :text("Essentials"), :text("Growth"), :text("Visionary")').first();
  }

  get planCards(): Locator {
    return this.page.locator('[data-testid="plan-card"], .plan-card, .pricing-card');
  }

  get subscriptionStatus(): Locator {
    return this.page.locator('[data-testid="subscription-status"], :text("Active"), :text("Trialing")').first();
  }

  // Usage metrics
  get usageSection(): Locator {
    return this.page.locator('[data-testid="usage-metrics"], :text("Usage")').first();
  }

  get usageBars(): Locator {
    return this.page.locator('[data-testid="usage-bar"], .progress-bar, [role="progressbar"]');
  }

  // Upgrade flow
  get upgradeButton(): Locator {
    return this.page.getByRole('button', { name: /upgrade|change plan/i }).first();
  }

  get essentialsUpgrade(): Locator {
    return this.page.locator('[data-testid="plan-essentials"] button, .plan-card:has-text("Essentials") button').first();
  }

  get growthUpgrade(): Locator {
    return this.page.locator('[data-testid="plan-growth"] button, .plan-card:has-text("Growth") button').first();
  }

  get visionaryUpgrade(): Locator {
    return this.page.locator('[data-testid="plan-visionary"] button, .plan-card:has-text("Visionary") button').first();
  }

  // Billing cycle toggle
  get monthlyToggle(): Locator {
    return this.page.getByRole('button', { name: /monthly/i })
      .or(this.page.locator('label:has-text("Monthly")'));
  }

  get annualToggle(): Locator {
    return this.page.getByRole('button', { name: /annual/i })
      .or(this.page.locator('label:has-text("Annual")'));
  }

  // Payment modal
  get paymentModal(): Locator {
    return this.page.locator('[data-testid="payment-modal"], [role="dialog"]:has-text("Payment")');
  }

  get prorationPreview(): Locator {
    return this.page.locator('[data-testid="proration"], :text("proration"), :text("Proration")').first();
  }

  get confirmPaymentButton(): Locator {
    return this.page.getByRole('button', { name: /confirm|pay|subscribe/i });
  }

  get cancelPaymentButton(): Locator {
    return this.page.locator('[role="dialog"]').getByRole('button', { name: /cancel/i });
  }

  // Feature marketplace
  get featureMarketplace(): Locator {
    return this.page.locator('[data-testid="feature-marketplace"], :text("Feature Marketplace"), :text("Marketplace")').first();
  }

  get featureCards(): Locator {
    return this.page.locator('[data-testid="feature-card"], .feature-card');
  }

  // Invoice section
  get invoiceHistory(): Locator {
    return this.page.locator('[data-testid="invoice-history"], :text("Invoice"), table').first();
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
    await this.billingTab.click();
    await this.page.waitForTimeout(500);
  }

  async selectPlan(plan: 'essentials' | 'growth' | 'visionary'): Promise<void> {
    const planMap = {
      essentials: this.essentialsUpgrade,
      growth: this.growthUpgrade,
      visionary: this.visionaryUpgrade,
    };
    await planMap[plan].click();
    await this.page.waitForTimeout(500);
  }

  async toggleBillingCycle(cycle: 'monthly' | 'annual'): Promise<void> {
    if (cycle === 'monthly') {
      await this.monthlyToggle.click();
    } else {
      await this.annualToggle.click();
    }
    await this.page.waitForTimeout(300);
  }

  async confirmUpgrade(): Promise<void> {
    await this.confirmPaymentButton.click();
    await this.page.waitForTimeout(1000);
  }

  async cancelUpgrade(): Promise<void> {
    await this.cancelPaymentButton.click();
  }

  async expectCurrentPlan(plan: string): Promise<void> {
    await expect(this.page.locator(`text=${plan}`).first()).toBeVisible({ timeout: 10000 });
  }
}
