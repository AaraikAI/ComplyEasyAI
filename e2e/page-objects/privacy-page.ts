/**
 * Privacy Management Page Object
 * Covers DPIA wizard, RoPA, DPO dashboard, cookie consent, breach notification, privacy notices
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class PrivacyPage extends BasePage {
  readonly privacyPath = '/privacy';
  readonly dpiaPath = '/privacy/dpia';
  readonly ropaPath = '/privacy/ropa';
  readonly noticesPath = '/privacy/notices';
  readonly breachPath = '/issues?tab=breach';
  readonly deletionPath = '/privacy/data-deletion';

  // Privacy hub elements
  get pageTitle(): Locator {
    return this.page.locator('h1, h2').first();
  }

  // DPIA elements
  get dpiaWizardStart(): Locator {
    return this.page.getByRole('button', { name: /start dpia|new dpia|create dpia/i }).first();
  }

  get dpiaStepIndicator(): Locator {
    return this.page.locator('[data-testid="step-indicator"], .stepper, .wizard-step');
  }

  get dpiaNextButton(): Locator {
    return this.page.getByRole('button', { name: /next|continue/i }).first();
  }

  get dpiaPreviousButton(): Locator {
    return this.page.getByRole('button', { name: /previous|back/i }).first();
  }

  get dpiaSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /submit|complete|finish/i }).first();
  }

  // RoPA elements
  get addProcessingActivity(): Locator {
    return this.page.getByRole('button', { name: /add.*activity|new.*activity|create/i }).first();
  }

  get processingActivitiesTable(): Locator {
    return this.page.locator('table, [data-testid="ropa-table"]');
  }

  // Cookie consent elements
  get cookieBanner(): Locator {
    return this.page.locator('[data-testid="cookie-banner"], .cookie-consent, [class*="cookie"]');
  }

  get acceptCookies(): Locator {
    return this.page.getByRole('button', { name: /accept|allow/i });
  }

  get rejectCookies(): Locator {
    return this.page.getByRole('button', { name: /reject|decline/i });
  }

  get cookiePreferences(): Locator {
    return this.page.getByRole('button', { name: /preferences|customize|manage/i });
  }

  // Privacy notice elements
  get createNoticeButton(): Locator {
    return this.page.getByRole('button', { name: /create.*notice|new.*notice|add/i }).first();
  }

  get noticesList(): Locator {
    return this.page.locator('[data-testid="notices-list"], table, .notices-grid');
  }

  // Breach notification elements
  get reportBreachButton(): Locator {
    return this.page.getByRole('button', { name: /report.*breach|new.*breach|create/i }).first();
  }

  get breachSeveritySelect(): Locator {
    return this.page.locator('select[name="severity"], [data-testid="breach-severity"]');
  }

  get breachDescriptionInput(): Locator {
    return this.page.locator('textarea[name="description"], [data-testid="breach-description"]');
  }

  // Actions
  async gotoPrivacy(): Promise<void> {
    await this.page.goto(this.privacyPath);
    await this.waitForPageLoad();
  }

  async gotoDPIA(): Promise<void> {
    await this.page.goto(this.dpiaPath);
    await this.waitForPageLoad();
  }

  async gotoRoPA(): Promise<void> {
    await this.page.goto(this.ropaPath);
    await this.waitForPageLoad();
  }

  async gotoPrivacyNotices(): Promise<void> {
    await this.page.goto(this.noticesPath);
    await this.waitForPageLoad();
  }

  async startDPIAWizard(): Promise<void> {
    await this.dpiaWizardStart.click();
    await this.page.waitForTimeout(500);
  }

  async advanceDPIAStep(): Promise<void> {
    await this.dpiaNextButton.click();
    await this.page.waitForTimeout(300);
  }

  async addRoPAEntry(data: { name: string; purpose: string; lawfulBasis?: string }): Promise<void> {
    await this.addProcessingActivity.click();
    await this.waitForModal();
    const nameField = this.page.locator('[name="name"], [name="activityName"]').first();
    await nameField.fill(data.name);
    const purposeField = this.page.locator('[name="purpose"], textarea').first();
    await purposeField.fill(data.purpose);
    if (data.lawfulBasis) {
      const basisSelect = this.page.locator('select[name="lawfulBasis"]');
      if (await basisSelect.isVisible()) {
        await basisSelect.selectOption(data.lawfulBasis);
      }
    }
    await this.page.getByRole('button', { name: /save|create|submit/i }).click();
  }
}
