/**
 * Risks Page Object
 * Risk management operations
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class RisksPage extends BasePage {
  readonly path = '/risks';

  // Selectors
  get pageTitle(): Locator {
    return this.page.locator('h1:has-text("Risk")');
  }

  get createRiskButton(): Locator {
    return this.page
      .getByRole('button', { name: /create risk|add risk/i })
      .or(this.page.locator('button:has-text("Create Risk")'));
  }

  get riskList(): Locator {
    return this.page.locator('[data-testid="risk-list"]');
  }

  get riskItems(): Locator {
    return this.page.locator('[data-testid="risk-item"]');
  }

  get searchInput(): Locator {
    return this.page.locator('[placeholder*="Search"], [name="search"]');
  }

  get severityFilter(): Locator {
    return this.page.locator('[name="severity"], [data-testid="severity-filter"]');
  }

  get statusFilter(): Locator {
    return this.page.locator('[name="status"], [data-testid="status-filter"]');
  }

  // Form selectors
  get titleInput(): Locator {
    return this.page.locator('[name="title"]');
  }

  get descriptionInput(): Locator {
    return this.page.locator('[name="description"]');
  }

  get severitySelect(): Locator {
    return this.page.locator('[name="severity"]');
  }

  get categorySelect(): Locator {
    return this.page.locator('[name="category"]');
  }

  get createButton(): Locator {
    return this.page
      .getByRole('button', { name: /create risk/i })
      .or(this.page.locator('button[type="submit"]:has-text("Create")'));
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /save/i });
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i });
  }

  get generateRemediationButton(): Locator {
    return this.page.getByRole('button', { name: /generate remediation|ai remediation/i });
  }

  get runScanButton(): Locator {
    return this.page.getByRole('button', { name: /run scan|scan/i });
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async createRisk(
    title: string,
    description: string,
    severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium'
  ): Promise<void> {
    await this.createRiskButton.click();
    await this.waitForModal();

    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
    await this.severitySelect.selectOption(severity);

    await this.createButton.click();
    await this.waitForPageLoad();
  }

  async searchRisk(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async filterBySeverity(severity: string): Promise<void> {
    await this.severityFilter.selectOption(severity);
    await this.waitForPageLoad();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.waitForPageLoad();
  }

  async clickRisk(title: string): Promise<void> {
    await this.page.locator(`text=${title}`).click();
    await this.waitForPageLoad();
  }

  async deleteRisk(title: string): Promise<void> {
    await this.clickRisk(title);
    await this.deleteButton.click();
    await this.confirmDialog();
  }

  async generateRemediation(): Promise<void> {
    await this.generateRemediationButton.click();
    await this.page.waitForTimeout(5000); // AI generation
    await this.expectSuccess(/remediation.*generated/i);
  }

  async runRiskScan(): Promise<void> {
    await this.runScanButton.click();
    await this.page.waitForTimeout(10000); // Scan takes time
    await this.expectSuccess(/scan.*complete/i);
  }

  // Assertions
  async expectRiskVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).toBeVisible({ timeout: 15000 });
  }

  async expectRiskNotVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).not.toBeVisible();
  }

  async getRiskCount(): Promise<number> {
    return await this.riskItems.count();
  }

  async expectRiskSeverity(severity: string): Promise<void> {
    await expect(this.page.locator(`text=${severity}`)).toBeVisible();
  }
}
