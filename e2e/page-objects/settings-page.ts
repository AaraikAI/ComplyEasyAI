/**
 * Settings Page Object
 * Covers profile, security, organization, team, integrations, billing, and features tabs
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SettingsPage extends BasePage {
  readonly path = '/settings';

  // Tab selectors
  get profileTab(): Locator {
    return this.page.getByRole('tab', { name: /profile/i })
      .or(this.page.locator('button:has-text("Profile")'));
  }

  get securityTab(): Locator {
    return this.page.getByRole('tab', { name: /security/i })
      .or(this.page.locator('button:has-text("Security")'));
  }

  get organizationTab(): Locator {
    return this.page.getByRole('tab', { name: /organization/i })
      .or(this.page.locator('button:has-text("Organization")'));
  }

  get teamTab(): Locator {
    return this.page.getByRole('tab', { name: /team/i })
      .or(this.page.locator('button:has-text("Team")'));
  }

  get integrationsTab(): Locator {
    return this.page.getByRole('tab', { name: /integration/i })
      .or(this.page.locator('button:has-text("Integrations")'));
  }

  get billingTab(): Locator {
    return this.page.getByRole('tab', { name: /billing/i })
      .or(this.page.locator('button:has-text("Billing")'));
  }

  get featuresTab(): Locator {
    return this.page.getByRole('tab', { name: /features/i })
      .or(this.page.locator('button:has-text("Features")'));
  }

  // Profile fields
  get nameInput(): Locator {
    return this.page.locator('[name="name"], [data-testid="profile-name"]');
  }

  get emailInput(): Locator {
    return this.page.locator('[name="email"], [data-testid="profile-email"]');
  }

  get saveProfileButton(): Locator {
    return this.page.getByRole('button', { name: /save/i }).first();
  }

  // Security fields
  get currentPasswordInput(): Locator {
    return this.page.locator('[name="currentPassword"], [name="current_password"]');
  }

  get newPasswordInput(): Locator {
    return this.page.locator('[name="newPassword"], [name="new_password"]');
  }

  get confirmPasswordInput(): Locator {
    return this.page.locator('[name="confirmPassword"], [name="confirm_password"]');
  }

  get changePasswordButton(): Locator {
    return this.page.getByRole('button', { name: /change password|update password/i });
  }

  // Team management
  get inviteButton(): Locator {
    return this.page.getByRole('button', { name: /invite|add member/i });
  }

  get inviteEmailInput(): Locator {
    return this.page.locator('[name="email"], [data-testid="invite-email"]');
  }

  get inviteNameInput(): Locator {
    return this.page.locator('[name="name"], [data-testid="invite-name"]');
  }

  get inviteRoleSelect(): Locator {
    return this.page.locator('select[name="role"], [data-testid="invite-role"]');
  }

  get bulkInviteButton(): Locator {
    return this.page.getByRole('button', { name: /bulk invite/i });
  }

  get teamMemberRows(): Locator {
    return this.page.locator('tr, [data-testid="team-member"]');
  }

  // Billing elements
  get currentPlanBadge(): Locator {
    return this.page.locator('[data-testid="current-plan"], .current-plan, :text("Foundation"), :text("Essentials"), :text("Growth"), :text("Visionary")').first();
  }

  get upgradeButton(): Locator {
    return this.page.getByRole('button', { name: /upgrade|change plan/i });
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async switchTab(tab: 'profile' | 'security' | 'organization' | 'team' | 'integrations' | 'billing' | 'features'): Promise<void> {
    const tabMap = {
      profile: this.profileTab,
      security: this.securityTab,
      organization: this.organizationTab,
      team: this.teamTab,
      integrations: this.integrationsTab,
      billing: this.billingTab,
      features: this.featuresTab,
    };
    await tabMap[tab].click();
    await this.page.waitForTimeout(500);
  }

  async updateProfile(name: string, email?: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    if (email) {
      await this.emailInput.clear();
      await this.emailInput.fill(email);
    }
    await this.saveProfileButton.click();
  }

  async changePassword(current: string, newPass: string, confirm: string): Promise<void> {
    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(newPass);
    await this.confirmPasswordInput.fill(confirm);
    await this.changePasswordButton.click();
  }

  async inviteTeamMember(name: string, email: string, role: string): Promise<void> {
    await this.inviteButton.click();
    await this.waitForModal();
    await this.inviteNameInput.fill(name);
    await this.inviteEmailInput.fill(email);
    if (await this.inviteRoleSelect.isVisible()) {
      await this.inviteRoleSelect.selectOption(role);
    }
    await this.page.getByRole('button', { name: /send|invite|submit/i }).click();
  }
}
