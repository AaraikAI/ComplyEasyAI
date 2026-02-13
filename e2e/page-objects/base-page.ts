/**
 * Base Page Object
 * Provides common functionality for all page objects
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  }

  // Common selectors
  get loadingSpinner(): Locator {
    return this.page.locator('[data-testid="loading"], .loading, [aria-busy="true"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[role="alert"], .error, [data-testid="error-message"]');
  }

  get successMessage(): Locator {
    return this.page.locator('[data-testid="success-message"], .success, .toast-success');
  }

  get toastNotification(): Locator {
    return this.page.locator('.toast, [role="status"], [data-testid="toast"]');
  }

  // Common actions
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async clickButton(name: string | RegExp): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  async clickLink(name: string | RegExp): Promise<void> {
    await this.page.getByRole('link', { name }).click();
  }

  async fillInput(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  async selectOption(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).selectOption(value);
  }

  async expectToast(message: string | RegExp): Promise<void> {
    await expect(this.toastNotification.filter({ hasText: message })).toBeVisible({
      timeout: 10000,
    });
  }

  async expectSuccess(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.successMessage.filter({ hasText: message })).toBeVisible({
        timeout: 10000,
      });
    } else {
      await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    }
  }

  async expectError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.errorMessage.filter({ hasText: message })).toBeVisible({
        timeout: 10000,
      });
    } else {
      await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
    }
  }

  async expectURL(url: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ fullPage: true, path: `screenshots/${name}.png` });
  }

  // Table operations
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('table tbody tr').count();
  }

  async clickTableRow(index: number): Promise<void> {
    await this.page.locator('table tbody tr').nth(index).click();
  }

  // Modal operations
  async waitForModal(): Promise<void> {
    await this.page
      .locator('[role="dialog"], .modal, [data-testid="modal"]')
      .waitFor({ state: 'visible' });
  }

  async closeModal(): Promise<void> {
    await this.page.locator('[aria-label="Close"], .modal-close, button:has-text("Close")').click();
    await this.page
      .locator('[role="dialog"], .modal, [data-testid="modal"]')
      .waitFor({ state: 'hidden' });
  }

  async confirmDialog(): Promise<void> {
    await this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
  }

  async cancelDialog(): Promise<void> {
    await this.page.locator('button:has-text("Cancel"), button:has-text("No")').click();
  }
}
