/**
 * Dashboard Page Object
 * Main dashboard with compliance overview
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  readonly path = '/dashboard';

  // Selectors
  get welcomeMessage(): Locator {
    return this.page.locator('[data-testid="welcome-message"], h1:has-text("Dashboard")');
  }

  get complianceScore(): Locator {
    return this.page.locator('[data-testid="compliance-score"]');
  }

  get frameworkCards(): Locator {
    return this.page.locator('[data-testid="framework-card"]');
  }

  get riskOverview(): Locator {
    return this.page.locator('[data-testid="risk-overview"]');
  }

  get recentActivity(): Locator {
    return this.page.locator('[data-testid="recent-activity"]');
  }

  get quickActions(): Locator {
    return this.page.locator('[data-testid="quick-actions"]');
  }

  // Navigation elements
  get sidebarNav(): Locator {
    return this.page.locator('nav, [data-testid="sidebar"]');
  }

  get userMenu(): Locator {
    return this.page.locator('[data-testid="user-menu"], [aria-label="User menu"]');
  }

  get notificationsButton(): Locator {
    return this.page.locator('[data-testid="notifications"], [aria-label="Notifications"]');
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async navigateToFrameworks(): Promise<void> {
    await this.page.getByRole('link', { name: /frameworks/i }).click();
    await this.expectURL(/frameworks/);
  }

  async navigateToVendors(): Promise<void> {
    await this.page.getByRole('link', { name: /vendor/i }).click();
    await this.expectURL(/vendors/);
  }

  async navigateToRisks(): Promise<void> {
    await this.page.getByRole('link', { name: /risk/i }).click();
    await this.expectURL(/risks/);
  }

  async navigateToPolicies(): Promise<void> {
    await this.page.getByRole('link', { name: /polic/i }).click();
    await this.expectURL(/policies/);
  }

  async navigateToSettings(): Promise<void> {
    await this.page.getByRole('link', { name: /settings/i }).click();
    await this.expectURL(/settings/);
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole('menuitem', { name: /logout|sign out/i }).click();
  }

  // Assertions
  async expectDashboardLoaded(): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible({ timeout: 15000 });
  }

  async expectComplianceScoreVisible(): Promise<void> {
    await expect(this.complianceScore).toBeVisible();
  }

  async expectFrameworkCardsVisible(): Promise<void> {
    await expect(this.frameworkCards.first()).toBeVisible();
  }

  async getFrameworkCount(): Promise<number> {
    return await this.frameworkCards.count();
  }
}
