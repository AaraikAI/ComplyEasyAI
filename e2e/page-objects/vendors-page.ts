/**
 * Vendors Page Object
 * Vendor risk management
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class VendorsPage extends BasePage {
  readonly path = '/vendors';

  // Selectors
  get pageTitle(): Locator {
    return this.page.locator('h1:has-text("Vendor")');
  }

  get addVendorButton(): Locator {
    return this.page
      .getByRole('button', { name: /add vendor/i })
      .or(this.page.locator('button:has-text("Add Vendor")'));
  }

  get vendorList(): Locator {
    return this.page.locator('[data-testid="vendor-list"]');
  }

  get vendorItems(): Locator {
    return this.page.locator('[data-testid="vendor-item"]');
  }

  get searchInput(): Locator {
    return this.page.locator('[placeholder*="Search"], [name="search"]');
  }

  // Form selectors
  get vendorNameInput(): Locator {
    return this.page.locator('[name="name"]');
  }

  get websiteInput(): Locator {
    return this.page.locator('[name="website"]');
  }

  get contactEmailInput(): Locator {
    return this.page.locator('[name="contactEmail"]');
  }

  get categorySelect(): Locator {
    return this.page.locator('[name="category"]');
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create vendor/i });
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /save/i });
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i });
  }

  get startAssessmentButton(): Locator {
    return this.page.getByRole('button', { name: /start assessment/i });
  }

  get riskScore(): Locator {
    return this.page.locator('[data-testid="risk-score"]');
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async createVendor(
    name: string,
    website: string,
    email: string,
    category: string = 'Technology'
  ): Promise<void> {
    await this.addVendorButton.click();
    await this.waitForModal();

    await this.vendorNameInput.fill(name);
    await this.websiteInput.fill(website);
    await this.contactEmailInput.fill(email);
    await this.categorySelect.selectOption(category);

    await this.createButton.click();
    await this.waitForPageLoad();
  }

  async searchVendor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clickVendor(name: string): Promise<void> {
    await this.page.locator(`text=${name}`).click();
    await this.waitForPageLoad();
  }

  async deleteVendor(name: string): Promise<void> {
    await this.clickVendor(name);
    await this.deleteButton.click();
    await this.confirmDialog();
  }

  async startAssessment(): Promise<void> {
    await this.startAssessmentButton.click();
    await this.waitForModal();
  }

  async completeAssessment(responses: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(responses)) {
      await this.page.locator(`[name="${field}"]`).fill(value);
    }
    await this.page.getByRole('button', { name: /complete assessment/i }).click();
    await this.expectSuccess(/assessment completed/i);
  }

  // Assertions
  async expectVendorVisible(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`)).toBeVisible({ timeout: 15000 });
  }

  async expectVendorNotVisible(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`)).not.toBeVisible();
  }

  async getVendorCount(): Promise<number> {
    return await this.vendorItems.count();
  }

  async expectRiskScoreVisible(): Promise<void> {
    await expect(this.riskScore).toBeVisible();
  }

  async getRiskScore(): Promise<string | null> {
    return await this.riskScore.textContent();
  }
}
