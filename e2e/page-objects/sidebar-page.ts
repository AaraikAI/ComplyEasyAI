/**
 * Sidebar Page Object
 * Updated to match new sidebar with collapsible sections
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SidebarPage extends BasePage {
  // Main sidebar container
  get sidebar(): Locator {
    return this.page.locator('aside, nav, [data-testid="sidebar"]').first();
  }

  // Logo/Brand
  get logo(): Locator {
    return this.page.locator('[data-testid="logo"], .logo, a:has-text("ComplyEasy")');
  }

  // Section headers (collapsible)
  get platformSection(): Locator {
    return this.page.locator('div:has-text("Platform")').first();
  }

  get regulatorySection(): Locator {
    return this.page.locator('button:has-text("Regulatory"), div:has-text("Regulatory")').first();
  }

  get reportsAuditSection(): Locator {
    return this.page.locator('button:has-text("Reports"), div:has-text("Reports & Audit")').first();
  }

  get workspacesSection(): Locator {
    return this.page.locator('button:has-text("Workspaces"), div:has-text("Workspaces")').first();
  }

  // Navigation items - Platform section
  get dashboardLink(): Locator {
    return this.page.getByRole('link', { name: /dashboard/i }).first();
  }

  get myTasksLink(): Locator {
    return this.page.getByRole('link', { name: /my tasks/i }).first();
  }

  get risksLink(): Locator {
    return this.page.getByRole('link', { name: /risks/i }).first();
  }

  get issuesLink(): Locator {
    return this.page.getByRole('link', { name: /issues/i }).first();
  }

  get vendorsLink(): Locator {
    return this.page.getByRole('link', { name: /vendors/i }).first();
  }

  get policiesLink(): Locator {
    return this.page.getByRole('link', { name: /policies/i }).first();
  }

  get integrationsLink(): Locator {
    return this.page.getByRole('link', { name: /integrations/i }).first();
  }

  get frameworksLink(): Locator {
    return this.page.getByRole('link', { name: /frameworks/i }).first();
  }

  // Navigation items - Regulatory section
  get aiRmfLink(): Locator {
    return this.page.getByRole('link', { name: /ai rmf|nist ai/i }).first();
  }

  get euAiActLink(): Locator {
    return this.page.getByRole('link', { name: /eu ai act/i }).first();
  }

  get dmaLink(): Locator {
    return this.page.getByRole('link', { name: /dma/i }).first();
  }

  get dsaLink(): Locator {
    return this.page.getByRole('link', { name: /dsa/i }).first();
  }

  // Navigation items - Reports & Audit section
  get reportsLink(): Locator {
    return this.page.getByRole('link', { name: /reports/i }).first();
  }

  get auditLink(): Locator {
    return this.page.getByRole('link', { name: /audit/i }).first();
  }

  get monitoringLink(): Locator {
    return this.page.getByRole('link', { name: /monitoring/i }).first();
  }

  get analyticsLink(): Locator {
    return this.page.getByRole('link', { name: /analytics/i }).first();
  }

  // Navigation items - Workspaces section
  get workspacesLink(): Locator {
    return this.page.getByRole('link', { name: /workspaces/i }).first();
  }

  get questionnairesLink(): Locator {
    return this.page.getByRole('link', { name: /questionnaires/i }).first();
  }

  get securityLink(): Locator {
    return this.page.getByRole('link', { name: /security/i }).first();
  }

  get acosLink(): Locator {
    return this.page.getByRole('link', { name: /acos|autonomous/i }).first();
  }

  // Settings link (usually at bottom)
  get settingsLink(): Locator {
    return this.page.getByRole('link', { name: /settings/i }).first();
  }

  // Actions
  async expandSection(section: 'regulatory' | 'reports' | 'workspaces'): Promise<void> {
    let sectionElement: Locator;

    switch (section) {
      case 'regulatory':
        sectionElement = this.regulatorySection;
        break;
      case 'reports':
        sectionElement = this.reportsAuditSection;
        break;
      case 'workspaces':
        sectionElement = this.workspacesSection;
        break;
    }

    // Click the section header to expand
    const button = sectionElement.locator('button').first();
    if (await button.isVisible()) {
      await button.click();
    } else {
      await sectionElement.click();
    }
    await this.page.waitForTimeout(300); // Animation
  }

  async collapseSection(section: 'regulatory' | 'reports' | 'workspaces'): Promise<void> {
    // Same as expand - toggle behavior
    await this.expandSection(section);
  }

  async isSectionExpanded(section: 'regulatory' | 'reports' | 'workspaces'): Promise<boolean> {
    let linkToCheck: Locator;

    switch (section) {
      case 'regulatory':
        linkToCheck = this.aiRmfLink;
        break;
      case 'reports':
        linkToCheck = this.auditLink;
        break;
      case 'workspaces':
        linkToCheck = this.questionnairesLink;
        break;
    }

    return await linkToCheck.isVisible().catch(() => false);
  }

  async navigateTo(route: string): Promise<void> {
    const link = this.page.getByRole('link', { name: new RegExp(route, 'i') }).first();

    // If not visible, try expanding sections
    if (!(await link.isVisible())) {
      // Try expanding each section
      for (const section of ['regulatory', 'reports', 'workspaces'] as const) {
        if (!(await this.isSectionExpanded(section))) {
          await this.expandSection(section);
        }
        if (await link.isVisible()) break;
      }
    }

    await link.click();
    await this.waitForPageLoad();
  }

  async navigateToDashboard(): Promise<void> {
    await this.dashboardLink.click();
    await this.expectURL(/dashboard/);
  }

  async navigateToFrameworks(): Promise<void> {
    await this.frameworksLink.click();
    await this.expectURL(/frameworks/);
  }

  async navigateToVendors(): Promise<void> {
    await this.vendorsLink.click();
    await this.expectURL(/vendors/);
  }

  async navigateToRisks(): Promise<void> {
    await this.risksLink.click();
    await this.expectURL(/risks/);
  }

  async navigateToPolicies(): Promise<void> {
    await this.policiesLink.click();
    await this.expectURL(/policies/);
  }

  async navigateToMonitoring(): Promise<void> {
    // Expand Reports section if needed
    if (!(await this.isSectionExpanded('reports'))) {
      await this.expandSection('reports');
    }
    await this.monitoringLink.click();
    await this.expectURL(/monitoring/);
  }

  async navigateToAiRmf(): Promise<void> {
    // Expand Regulatory section if needed
    if (!(await this.isSectionExpanded('regulatory'))) {
      await this.expandSection('regulatory');
    }
    await this.aiRmfLink.click();
    await this.expectURL(/ai-rmf/);
  }

  // Assertions
  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }

  async expectLogoVisible(): Promise<void> {
    await expect(this.logo).toBeVisible();
  }

  async expectPlatformSectionVisible(): Promise<void> {
    await expect(this.platformSection).toBeVisible();
  }

  async expectRegulatorySectionVisible(): Promise<void> {
    await expect(this.regulatorySection).toBeVisible();
  }

  async expectActiveLink(route: string): Promise<void> {
    const link = this.page.getByRole('link', { name: new RegExp(route, 'i') }).first();
    await expect(link).toHaveAttribute('aria-current', 'page');
  }
}
