/**
 * Command Palette Page Object
 * NEW component for Cmd+K navigation
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class CommandPalettePage extends BasePage {
  // Modal container - matches the fixed inset-0 z-[100] wrapper
  get modal(): Locator {
    return this.page.locator('div.fixed.inset-0').filter({
      has: this.page.locator('input[placeholder*="Search commands"]')
    });
  }

  get backdrop(): Locator {
    // The backdrop is an absolute inset-0 div inside the modal
    return this.page.locator('.absolute.inset-0.bg-surface-900\\/60');
  }

  // Search input
  get searchInput(): Locator {
    return this.page.locator('input[placeholder*="Search commands"]')
      .or(this.page.locator('input[placeholder*="Search"]'));
  }

  // Command list
  get commandList(): Locator {
    return this.page.locator('[data-testid="command-list"], .command-list')
      .or(this.page.locator('div[class*="overflow-y-auto"]').filter({ has: this.commandItems.first() }));
  }

  get commandItems(): Locator {
    return this.page.locator('[data-testid="command-item"], button[data-selected]')
      .or(this.page.locator('button').filter({ has: this.page.locator('span') }));
  }

  get selectedItem(): Locator {
    return this.page.locator('[data-selected="true"], .selected, [aria-selected="true"]');
  }

  // Category headers
  get categoryHeaders(): Locator {
    return this.page.locator('div[class*="text-xs"][class*="uppercase"]')
      .or(this.page.locator('div:has-text("Navigation"), div:has-text("AI Tools"), div:has-text("Enterprise")'));
  }

  // Footer with keyboard hints
  get footer(): Locator {
    return this.page.locator('div').filter({ hasText: 'Navigate' }).filter({ hasText: 'Select' });
  }

  // Actions
  async open(): Promise<void> {
    // Try Cmd+K on Mac or Ctrl+K on Windows/Linux
    const isMac = process.platform === 'darwin';
    await this.page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');
    await this.page.waitForTimeout(300); // Allow animation
    await expect(this.modal).toBeVisible({ timeout: 5000 });
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
    await expect(this.modal).not.toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for search results to filter
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  async selectCurrentItem(): Promise<void> {
    // Click on the selected item directly for more reliability
    const selectedItem = this.page.locator('button[data-selected="true"]');
    if (await selectedItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectedItem.click();
    } else {
      // Fallback to Enter key
      await this.page.keyboard.press('Enter');
    }
    // Wait for navigation to complete
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async navigateDown(): Promise<void> {
    await this.page.keyboard.press('ArrowDown');
  }

  async navigateUp(): Promise<void> {
    await this.page.keyboard.press('ArrowUp');
  }

  async selectByIndex(index: number): Promise<void> {
    // Navigate to the item using arrow keys
    for (let i = 0; i < index; i++) {
      await this.navigateDown();
      await this.page.waitForTimeout(50);
    }
    await this.selectCurrentItem();
  }

  async selectByText(text: string): Promise<void> {
    // Search for the command
    await this.search(text);
    await this.page.waitForTimeout(300);

    // Click on the matching item
    const item = this.page.locator(`button:has-text("${text}")`).first();
    if (await item.isVisible()) {
      await item.click();
    } else {
      // Fall back to selecting first result
      await this.selectCurrentItem();
    }
    await this.waitForPageLoad();
  }

  async clickBackdrop(): Promise<void> {
    await this.backdrop.click({ position: { x: 10, y: 10 } });
  }

  // Assertions
  async expectToBeOpen(): Promise<void> {
    await expect(this.modal).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async expectToBeClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }

  async expectSearchFocused(): Promise<void> {
    await expect(this.searchInput).toBeFocused();
  }

  async expectResultsVisible(): Promise<void> {
    await expect(this.commandItems.first()).toBeVisible();
  }

  async expectResultCount(count: number): Promise<void> {
    await expect(this.commandItems).toHaveCount(count);
  }

  async expectResultCountGreaterThan(min: number): Promise<void> {
    const count = await this.commandItems.count();
    expect(count).toBeGreaterThan(min);
  }

  async expectCategoryVisible(category: string): Promise<void> {
    await expect(this.page.locator(`text=${category}`)).toBeVisible();
  }

  async expectFooterVisible(): Promise<void> {
    await expect(this.footer.first()).toBeVisible();
  }

  async getResultTexts(): Promise<string[]> {
    return await this.commandItems.allTextContents();
  }

  async getSelectedItemText(): Promise<string | null> {
    return await this.selectedItem.textContent();
  }
}
