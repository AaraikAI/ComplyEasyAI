/**
 * Command Palette Page Object
 *
 * IMPORTANT — what Cmd+K actually opens in the current shell:
 * The global Cmd/Ctrl+K shortcut (wired in Layout.tsx) opens the GLOBAL SEARCH
 * modal (component `components/GlobalSearch.tsx`), NOT the standalone
 * `CommandPalette.tsx` component (which is mounted but has no keyboard trigger).
 * This page object therefore models GlobalSearch — the real Cmd+K experience.
 *
 * Real DOM / behavior facts (GlobalSearch.tsx):
 * - Root: div.fixed.inset-0.z-[100] (its onClick = close). Inside it: an absolute
 *   backdrop (div.absolute.inset-0.bg-black/50) and a centered white panel that
 *   stops click propagation.
 * - Search input placeholder = i18n t('common.search') -> "Search".
 * - It is a SEARCH box, not a fixed command list: there is NO default list of
 *   navigation commands. With an empty query it shows recent searches or a
 *   "Start typing to search…" hint. Results appear only after typing and are a
 *   blend of an instant FEATURE_CATALOG match plus /api/search results.
 * - Each result is a <button data-search-item>. The highlighted result uses the
 *   bg-primary-50 class. selectedIndex starts at -1 (nothing selected) — pressing
 *   Enter does nothing until you ArrowDown onto a result, so selection here
 *   either ArrowDowns first or clicks the result directly.
 * - Selecting a result calls onNavigate(result.url) -> a REAL react-router
 *   navigation, so the URL changes (e.g. "frameworks" -> /frameworks).
 * - Footer shows "Navigate" + "Select" keyboard hints.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class CommandPalettePage extends BasePage {
  // Root modal wrapper: the fixed full-screen layer containing the search input.
  get modal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-\\[100\\]').filter({
      has: this.searchInput,
    });
  }

  // Backdrop: the absolute dim layer. (Clicking the root layer closes the modal.)
  get backdrop(): Locator {
    return this.page.locator('div.fixed.inset-0.z-\\[100\\]').first();
  }

  // Search input — placeholder is the rendered i18n value ("Search"). Match the
  // input that lives inside the fixed Cmd+K overlay specifically.
  get searchInput(): Locator {
    return this.page.locator('div.fixed.inset-0 input[type="text"]').first();
  }

  // Result buttons.
  get commandItems(): Locator {
    return this.page.locator('button[data-search-item]');
  }

  // The currently highlighted result (bg-primary-50).
  get selectedItem(): Locator {
    return this.page.locator('button[data-search-item].bg-primary-50');
  }

  // Uppercase category/group headers (resource-type group labels).
  get categoryHeaders(): Locator {
    return this.page.locator('div.fixed.inset-0 p.uppercase');
  }

  // Footer with the keyboard hints ("Navigate" + "Select").
  get footer(): Locator {
    return this.page.locator('div').filter({ hasText: 'Navigate' }).filter({ hasText: 'Select' });
  }

  // ---- Actions ----
  async open(): Promise<void> {
    const isMac = process.platform === 'darwin';
    await this.page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');
    await expect(this.searchInput).toBeVisible({ timeout: 5000 });
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.searchInput).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Type a query. GlobalSearch debounces the API call (~300ms) but the instant
   * FEATURE_CATALOG results render synchronously once the debounce fires, so wait
   * for at least one result button (or a settle) before asserting.
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.commandItems
      .first()
      .waitFor({ state: 'visible', timeout: 4000 })
      .catch(() => {});
    await this.page.waitForTimeout(150);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
  }

  /**
   * Activate a result. selectedIndex starts at -1, so we either click the
   * already-highlighted result, or ArrowDown to the first result and press Enter.
   * Then wait for the resulting react-router navigation to settle.
   */
  async selectCurrentItem(): Promise<void> {
    const highlighted = this.selectedItem;
    if (await highlighted.isVisible({ timeout: 1000 }).catch(() => false)) {
      await highlighted.click();
    } else {
      const first = this.commandItems.first();
      if (await first.isVisible({ timeout: 1000 }).catch(() => false)) {
        await first.click();
      } else {
        await this.page.keyboard.press('Enter');
      }
    }
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async navigateDown(): Promise<void> {
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(60);
  }

  async navigateUp(): Promise<void> {
    await this.page.keyboard.press('ArrowUp');
    await this.page.waitForTimeout(60);
  }

  async selectByIndex(index: number): Promise<void> {
    for (let i = 0; i <= index; i++) {
      await this.navigateDown();
    }
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /** Search for a result label and activate it (clicks the matching button). */
  async selectByText(text: string): Promise<void> {
    await this.search(text);
    const item = this.commandItems.filter({ hasText: text }).first();
    if (await item.isVisible({ timeout: 2000 }).catch(() => false)) {
      await item.click();
    } else {
      await this.selectCurrentItem();
    }
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async clickBackdrop(): Promise<void> {
    // The root fixed layer closes on click; target a top-left point away from
    // the centered panel.
    await this.backdrop.click({ position: { x: 5, y: 5 } });
  }

  // ---- Assertions ----
  async expectToBeOpen(): Promise<void> {
    await expect(this.searchInput).toBeVisible();
  }

  async expectToBeClosed(): Promise<void> {
    await expect(this.searchInput).not.toBeVisible();
  }

  async expectSearchFocused(): Promise<void> {
    await expect(this.searchInput).toBeFocused();
  }

  async expectResultsVisible(): Promise<void> {
    await expect(this.commandItems.first()).toBeVisible({ timeout: 5000 });
  }

  async expectResultCount(count: number): Promise<void> {
    await expect(this.commandItems).toHaveCount(count);
  }

  async expectResultCountGreaterThan(min: number): Promise<void> {
    await expect.poll(async () => this.commandItems.count(), { timeout: 5000 }).toBeGreaterThan(min);
  }

  async expectCategoryVisible(category: string): Promise<void> {
    await expect(this.categoryHeaders.filter({ hasText: category }).first()).toBeVisible();
  }

  async expectFooterVisible(): Promise<void> {
    await expect(this.footer.first()).toBeVisible();
  }

  async getResultTexts(): Promise<string[]> {
    return await this.commandItems.allTextContents();
  }

  async getSelectedItemText(): Promise<string | null> {
    const sel = this.selectedItem.first();
    if (await sel.isVisible().catch(() => false)) {
      return await sel.textContent();
    }
    return null;
  }
}
