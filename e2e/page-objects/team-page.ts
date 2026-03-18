/**
 * Team Management Page Object
 * Covers team invite, role changes, removal, and bulk invite
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class TeamPage extends BasePage {
  readonly path = '/settings';

  get teamTab(): Locator {
    return this.page.getByRole('tab', { name: /team/i })
      .or(this.page.locator('button:has-text("Team")'));
  }

  get inviteButton(): Locator {
    return this.page.getByRole('button', { name: /invite|add member|add user/i }).first();
  }

  get bulkInviteButton(): Locator {
    return this.page.getByRole('button', { name: /bulk/i });
  }

  get memberRows(): Locator {
    return this.page.locator('table tbody tr, [data-testid="team-member"], .team-member-row');
  }

  get memberCount(): Locator {
    return this.page.locator('[data-testid="member-count"], :text("members")').first();
  }

  // Invite modal fields
  get inviteNameInput(): Locator {
    return this.page.locator('[role="dialog"] [name="name"], [role="dialog"] input[placeholder*="Name"]');
  }

  get inviteEmailInput(): Locator {
    return this.page.locator('[role="dialog"] [name="email"], [role="dialog"] input[placeholder*="email"]');
  }

  get inviteRoleSelect(): Locator {
    return this.page.locator('[role="dialog"] select[name="role"], [role="dialog"] [data-testid="role-select"]');
  }

  get sendInviteButton(): Locator {
    return this.page.locator('[role="dialog"]').getByRole('button', { name: /send|invite|add/i });
  }

  // Member actions
  get roleChangeSelect(): Locator {
    return this.page.locator('select[name="role"]');
  }

  get removeMemberButton(): Locator {
    return this.page.getByRole('button', { name: /remove|delete/i });
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
    await this.teamTab.click();
    await this.page.waitForTimeout(500);
  }

  async inviteMember(name: string, email: string, role: string = 'viewer'): Promise<void> {
    await this.inviteButton.click();
    await this.waitForModal();
    await this.inviteNameInput.fill(name);
    await this.inviteEmailInput.fill(email);
    if (await this.inviteRoleSelect.isVisible()) {
      await this.inviteRoleSelect.selectOption(role);
    }
    await this.sendInviteButton.click();
  }

  async changeRole(memberIndex: number, newRole: string): Promise<void> {
    const row = this.memberRows.nth(memberIndex);
    const roleSelect = row.locator('select[name="role"], select');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption(newRole);
    }
  }

  async removeMember(memberIndex: number): Promise<void> {
    const row = this.memberRows.nth(memberIndex);
    await row.locator('button:has-text("Remove"), button:has-text("Delete"), [data-testid="remove-member"]').click();
    await this.confirmDialog();
  }

  async getMemberCount(): Promise<number> {
    return await this.memberRows.count();
  }

  async expectMemberVisible(email: string): Promise<void> {
    await expect(this.page.locator(`text=${email}`)).toBeVisible({ timeout: 10000 });
  }
}
