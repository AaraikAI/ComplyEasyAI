/**
 * Dashboard Page Object
 * Updated to match new Dashboard redesign with welcome banner, quick actions, and SVG ring chart
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  readonly path = '/dashboard';

  // Welcome Banner Selectors (NEW)
  get welcomeBanner(): Locator {
    return this.page.locator('.bg-gradient-to-br, [data-testid="welcome-banner"]').first();
  }

  get greeting(): Locator {
    return this.page.locator('h1:has-text("Good morning"), h1:has-text("Good afternoon"), h1:has-text("Good evening")').first();
  }

  get dateDisplay(): Locator {
    return this.page.locator('text=/\\d{1,2}.*\\d{4}/').first();
  }

  // Quick Actions (NEW)
  get quickActionsButton(): Locator {
    return this.page.getByRole('button', { name: /quick actions/i })
      .or(this.page.locator('button:has-text("Quick Actions")'));
  }

  get quickActionsDropdown(): Locator {
    return this.page.locator('[role="menu"], .dropdown-menu').first();
  }

  get quickActionGapAnalysis(): Locator {
    return this.page.getByRole('menuitem', { name: /gap analysis/i })
      .or(this.page.locator('button:has-text("Gap Analysis"), a:has-text("Gap Analysis")'));
  }

  get quickActionReports(): Locator {
    return this.page.getByRole('menuitem', { name: /reports/i })
      .or(this.page.locator('button:has-text("Reports"), a:has-text("Reports")'));
  }

  get quickActionFrameworks(): Locator {
    return this.page.getByRole('menuitem', { name: /frameworks/i })
      .or(this.page.locator('button:has-text("Frameworks"), a:has-text("Frameworks")'));
  }

  get quickActionSecurity(): Locator {
    return this.page.getByRole('menuitem', { name: /security/i })
      .or(this.page.locator('button:has-text("Security"), a:has-text("Security")'));
  }

  // Compliance Score with SVG Ring (UPDATED)
  get complianceScoreCard(): Locator {
    return this.page.locator('[data-onboarding="compliance-score"]')
      .or(this.page.locator('div:has-text("Compliance Score")').first());
  }

  get complianceScoreRing(): Locator {
    return this.page.locator('[data-onboarding="compliance-score"] svg')
      .or(this.page.locator('svg circle'));
  }

  get complianceScoreValue(): Locator {
    return this.page.locator('[data-onboarding="compliance-score"] text, [data-testid="compliance-score-value"]')
      .or(this.page.locator('div:has-text("%")').first());
  }

  // KPI Cards (UPDATED)
  get kpiCards(): Locator {
    return this.page.locator('[data-testid="kpi-card"], .grid > div');
  }

  get riskOverview(): Locator {
    return this.page.locator('[data-testid="risk-overview"], div:has-text("Risk Overview")').first();
  }

  get frameworkCards(): Locator {
    return this.page.locator('[data-testid="framework-card"], [data-onboarding*="framework"]');
  }

  get recentActivity(): Locator {
    return this.page.locator('[data-testid="recent-activity"], div:has-text("Recent Activity")').first();
  }

  // Navigation elements (UPDATED for new sidebar)
  get sidebarNav(): Locator {
    return this.page.locator('nav, [data-testid="sidebar"], aside');
  }

  get userMenu(): Locator {
    return this.page.locator('[data-testid="user-menu"], [aria-label="User menu"], button:has(.avatar)');
  }

  get notificationsButton(): Locator {
    return this.page.locator('[data-testid="notifications"], [aria-label="Notifications"], button:has(svg[class*="bell"])');
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async openQuickActions(): Promise<void> {
    await this.quickActionsButton.click();
    await this.page.waitForTimeout(300); // Allow dropdown animation
  }

  async closeQuickActions(): Promise<void> {
    // Click outside to close
    await this.page.locator('body').click({ position: { x: 0, y: 0 } });
    await this.page.waitForTimeout(200);
  }

  async selectQuickAction(action: 'gap-analysis' | 'reports' | 'frameworks' | 'security'): Promise<void> {
    await this.openQuickActions();

    switch (action) {
      case 'gap-analysis':
        await this.quickActionGapAnalysis.click();
        break;
      case 'reports':
        await this.quickActionReports.click();
        break;
      case 'frameworks':
        await this.quickActionFrameworks.click();
        break;
      case 'security':
        await this.quickActionSecurity.click();
        break;
    }

    await this.waitForPageLoad();
  }

  async navigateToFrameworks(): Promise<void> {
    await this.page.getByRole('link', { name: /frameworks/i }).first().click();
    await this.expectURL(/frameworks/);
  }

  async navigateToVendors(): Promise<void> {
    await this.page.getByRole('link', { name: /vendor/i }).first().click();
    await this.expectURL(/vendor/);
  }

  async navigateToRisks(): Promise<void> {
    await this.page.getByRole('link', { name: /risk/i }).first().click();
    await this.expectURL(/risk/);
  }

  async navigateToPolicies(): Promise<void> {
    await this.page.getByRole('link', { name: /polic/i }).first().click();
    await this.expectURL(/polic/);
  }

  async navigateToSettings(): Promise<void> {
    await this.page.getByRole('link', { name: /settings/i }).first().click();
    await this.expectURL(/settings/);
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole('menuitem', { name: /logout|sign out/i }).click();
  }

  // Assertions (UPDATED)
  async expectDashboardLoaded(): Promise<void> {
    // Wait for any of the new dashboard elements
    await expect(
      this.greeting
        .or(this.complianceScoreCard)
        .or(this.page.locator('[data-testid="dashboard"]'))
        .or(this.page.locator('h1:has-text("Dashboard")'))
    ).toBeVisible({ timeout: 15000 });
  }

  async expectWelcomeBannerVisible(): Promise<void> {
    await expect(this.welcomeBanner).toBeVisible();
  }

  async expectGreetingVisible(): Promise<void> {
    await expect(this.greeting).toBeVisible();
  }

  async expectQuickActionsVisible(): Promise<void> {
    await expect(this.quickActionsButton).toBeVisible();
  }

  async expectComplianceScoreVisible(): Promise<void> {
    await expect(this.complianceScoreCard).toBeVisible();
  }

  async expectComplianceScoreRingVisible(): Promise<void> {
    await expect(this.complianceScoreRing).toBeVisible();
  }

  async expectFrameworkCardsVisible(): Promise<void> {
    await expect(this.frameworkCards.first()).toBeVisible();
  }

  async getFrameworkCount(): Promise<number> {
    return await this.frameworkCards.count();
  }

  async getGreetingText(): Promise<string> {
    return await this.greeting.textContent() || '';
  }

  async getComplianceScoreText(): Promise<string> {
    return await this.complianceScoreValue.textContent() || '';
  }
}
