import type { Page } from '@playwright/test';

/**
 * The onboarding Welcome modal (role="dialog" aria-label="Welcome to ComplyEasy AI")
 * renders `fixed inset-0 z-50` and intercepts pointer events, which blocks sidebar /
 * hub navigation clicks. Stubbing /onboarding/progress does not reliably prevent it
 * mounting against a live backend, so dismiss it at runtime via its "Skip onboarding"
 * control. Safe to call unconditionally — it is a no-op when no modal is present.
 */
export async function dismissOnboarding(page: Page): Promise<void> {
  const dialog = page.locator('[role="dialog"][aria-label="Welcome to ComplyEasy AI"]');
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!(await dialog.isVisible({ timeout: 1500 }).catch(() => false))) break;
    const skip = page.getByText('Skip onboarding');
    if (await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await dialog.waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
  }
  // Also clear any onboarding tour tooltip overlay (Step N of M).
  const tour = page.locator('text=/Step \\d+ of/').first();
  if (await tour.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => {});
  }
}
