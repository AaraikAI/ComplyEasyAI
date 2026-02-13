/**
 * Policies Page Object
 * Policy management operations
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class PoliciesPage extends BasePage {
  readonly path = '/policies';

  // Selectors
  get pageTitle(): Locator {
    return this.page.locator('h1:has-text("Polic")');
  }

  get createPolicyButton(): Locator {
    return this.page
      .getByRole('button', { name: /create policy/i })
      .or(this.page.locator('button:has-text("Create Policy")'));
  }

  get policyList(): Locator {
    return this.page.locator('[data-testid="policy-list"]');
  }

  get policyItems(): Locator {
    return this.page.locator('[data-testid="policy-item"]');
  }

  get searchInput(): Locator {
    return this.page.locator('[placeholder*="Search"], [name="search"]');
  }

  get statusFilter(): Locator {
    return this.page.locator('[name="status"], [data-testid="status-filter"]');
  }

  // Form selectors
  get titleInput(): Locator {
    return this.page.locator('[name="title"]');
  }

  get contentInput(): Locator {
    return this.page.locator('[name="content"]');
  }

  get categorySelect(): Locator {
    return this.page.locator('[name="category"]');
  }

  get createButton(): Locator {
    return this.page
      .getByRole('button', { name: /create policy/i })
      .or(this.page.locator('button[type="submit"]:has-text("Create")'));
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: /save/i });
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i });
  }

  get submitForReviewButton(): Locator {
    return this.page.getByRole('button', { name: /submit for review/i });
  }

  get approveButton(): Locator {
    return this.page.getByRole('button', { name: /approve/i });
  }

  get generateWithAIButton(): Locator {
    return this.page.getByRole('button', { name: /generate with ai|ai generate/i });
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async createPolicy(title: string, content: string, category: string = 'Security'): Promise<void> {
    await this.createPolicyButton.click();
    await this.waitForModal();

    await this.titleInput.fill(title);
    await this.contentInput.fill(content);
    await this.categorySelect.selectOption(category);

    await this.createButton.click();
    await this.waitForPageLoad();
  }

  async searchPolicy(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.waitForPageLoad();
  }

  async clickPolicy(title: string): Promise<void> {
    await this.page.locator(`text=${title}`).click();
    await this.waitForPageLoad();
  }

  async deletePolicy(title: string): Promise<void> {
    await this.clickPolicy(title);
    await this.deleteButton.click();
    await this.confirmDialog();
  }

  async submitForReview(): Promise<void> {
    await this.submitForReviewButton.click();
    await this.expectSuccess(/submitted for review/i);
  }

  async approvePolicy(): Promise<void> {
    await this.approveButton.click();
    await this.expectSuccess(/approved/i);
  }

  async generateWithAI(prompt: string): Promise<void> {
    await this.generateWithAIButton.click();
    await this.page.locator('[name="prompt"], textarea').fill(prompt);
    await this.page.getByRole('button', { name: /generate/i }).click();
    await this.page.waitForTimeout(5000); // AI generation takes time
  }

  // Assertions
  async expectPolicyVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).toBeVisible({ timeout: 15000 });
  }

  async expectPolicyNotVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).not.toBeVisible();
  }

  async getPolicyCount(): Promise<number> {
    return await this.policyItems.count();
  }

  async expectPolicyStatus(status: string): Promise<void> {
    await expect(this.page.locator(`text=${status}`)).toBeVisible();
  }
}
