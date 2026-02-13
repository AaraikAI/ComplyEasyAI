/**
 * Frameworks Page Object
 * Compliance framework management
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class FrameworksPage extends BasePage {
  readonly path = '/frameworks';

  // Selectors
  get pageTitle(): Locator {
    return this.page.locator('h1:has-text("Frameworks")');
  }

  get addFrameworkButton(): Locator {
    return this.page
      .getByRole('button', { name: /add framework/i })
      .or(this.page.locator('button:has-text("Add Framework")'));
  }

  get frameworkList(): Locator {
    return this.page.locator('[data-testid="framework-list"]');
  }

  get frameworkItems(): Locator {
    return this.page.locator('[data-testid="framework-item"]');
  }

  get searchInput(): Locator {
    return this.page.locator('[placeholder*="Search"], [name="search"]');
  }

  get filterDropdown(): Locator {
    return this.page.locator('[data-testid="filter-dropdown"]');
  }

  // Form selectors
  get frameworkNameInput(): Locator {
    return this.page.locator('[name="frameworkName"], [name="name"]');
  }

  get frameworkTypeSelect(): Locator {
    return this.page.locator('[name="type"], [name="frameworkType"]');
  }

  get regionSelect(): Locator {
    return this.page.locator('[name="region"]');
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create framework/i });
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /save/i });
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i });
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async createFramework(name: string, type: string, region: string = 'US'): Promise<void> {
    await this.addFrameworkButton.click();
    await this.waitForModal();

    await this.frameworkNameInput.fill(name);
    await this.frameworkTypeSelect.selectOption(type);
    await this.regionSelect.selectOption(region);

    await this.createButton.click();
    await this.waitForPageLoad();
  }

  async searchFramework(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async clickFramework(name: string): Promise<void> {
    await this.page.locator(`text=${name}`).click();
    await this.waitForPageLoad();
  }

  async deleteFramework(name: string): Promise<void> {
    await this.clickFramework(name);
    await this.deleteButton.click();
    await this.confirmDialog();
  }

  async applyTemplate(): Promise<void> {
    await this.page.getByRole('button', { name: /apply template/i }).click();
    await this.confirmDialog();
    await this.expectSuccess(/template applied|controls applied/i);
  }

  // Assertions
  async expectFrameworkVisible(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`)).toBeVisible({ timeout: 15000 });
  }

  async expectFrameworkNotVisible(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`)).not.toBeVisible();
  }

  async getFrameworkCount(): Promise<number> {
    return await this.frameworkItems.count();
  }

  async expectFrameworkCount(count: number): Promise<void> {
    await expect(this.frameworkItems).toHaveCount(count);
  }
}
