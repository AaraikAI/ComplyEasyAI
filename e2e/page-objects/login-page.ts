/**
 * Login Page Object
 * Handles authentication-related interactions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly path = '/';

  // Selectors
  get emailInput(): Locator {
    return this.page.locator('[name="email"], [type="email"]').first();
  }

  get passwordInput(): Locator {
    return this.page.locator('[name="password"], [type="password"]').first();
  }

  get loginButton(): Locator {
    return this.page
      .getByRole('button', { name: /login|sign in/i })
      .or(this.page.locator('[type="submit"]'));
  }

  get signupLink(): Locator {
    return this.page.getByRole('link', { name: /sign up|register/i });
  }

  get forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: /forgot password/i });
  }

  get magicLinkButton(): Locator {
    return this.page.getByRole('button', { name: /magic link|send link/i });
  }

  get googleLoginButton(): Locator {
    return this.page.getByRole('button', { name: /google|continue with google/i });
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.waitForPageLoad();
  }

  async loginWithMagicLink(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.magicLinkButton.click();
    await this.expectSuccess(/magic link sent|check your email/i);
  }

  async goToSignup(): Promise<void> {
    await this.signupLink.click();
    await this.expectURL(/signup/);
  }

  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.expectURL(/forgot|reset/);
  }

  // Assertions
  async expectLoginSuccess(): Promise<void> {
    await this.expectURL(/dashboard/);
    await expect(this.page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
  }

  async expectLoginFailure(message?: string | RegExp): Promise<void> {
    await this.expectError(message || /invalid|incorrect|failed/i);
  }

  async expectToBeOnLoginPage(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}
