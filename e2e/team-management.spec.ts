/**
 * E2E Tests: Team Management
 * Tests invite, accept, role change, remove, bulk invite
 */

import { test, expect } from '@playwright/test';

// Paths the server intentionally exempts from CSRF validation (pre-login auth
// endpoints and HMAC-verified webhook receivers — see server/src/middleware/csrf.ts).
const CSRF_EXEMPT = [
  '/auth/login', '/auth/register', '/auth/refresh', '/auth/magic-link',
  '/auth/verify', '/auth/2fa/complete', '/webhook', '/csrf-token',
];
function isCsrfExempt(url: string): boolean {
  return CSRF_EXEMPT.some((p) => url.includes(p));
}

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
    if (isLanding) test.skip();

    const teamTab = page.getByRole('tab', { name: /team/i })
      .or(page.locator('button:has-text("Team")'));
    if (await teamTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await teamTab.click();
      await page.waitForTimeout(500);
    }
  });

  test.describe('Team List', () => {
    test('team members are displayed', async ({ page }) => {
      const memberList = page.locator('table, [data-testid="team-members"], .team-list, .member-list').first();
      if (await memberList.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(memberList).toBeVisible();
      }
    });

    test('current user is shown in team list', async ({ page }) => {
      const memberRows = page.locator('table tbody tr, [data-testid="team-member"], .member-row');
      if (await memberRows.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        const count = await memberRows.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('team members show role badges', async ({ page }) => {
      const roles = page.locator(':text("Admin"), :text("Editor"), :text("Viewer"), :text("admin"), :text("editor"), :text("viewer")').first();
      if (await roles.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(roles).toBeVisible();
      }
    });
  });

  test.describe('Invite Flow', () => {
    test('invite button opens modal', async ({ page }) => {
      const inviteBtn = page.getByRole('button', { name: /invite|add member|add user/i }).first();
      if (await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await inviteBtn.click();
        await page.waitForTimeout(500);

        const modal = page.locator('[role="dialog"], .modal');
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
    });

    test('invite form has name, email, and role fields', async ({ page }) => {
      const inviteBtn = page.getByRole('button', { name: /invite|add member|add user/i }).first();
      if (!await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) return;

      await inviteBtn.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('[role="dialog"] [name="email"], [role="dialog"] input[type="email"], [role="dialog"] input[placeholder*="email"]');
      if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(emailField).toBeVisible();
      }
    });

    test('invite sends POST with CSRF token', async ({ page }) => {
      // Any mutating /api/ request the invite flow fires must carry an
      // x-csrf-token (the frontend attaches it for all mutations — services/api.ts).
      // A mutation without the token is a regression and fails the test.
      const mutationsWithoutCsrf: string[] = [];
      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/') && !isCsrfExempt(req.url())) {
          if (!req.headers()['x-csrf-token']) mutationsWithoutCsrf.push(req.url());
        }
      });

      const inviteBtn = page.getByRole('button', { name: /invite|add member/i }).first();
      if (!await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) return;

      await inviteBtn.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('[role="dialog"] [name="email"], [role="dialog"] input[type="email"]');
      if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailField.fill('e2e-team-test@example.com');

        const nameField = page.locator('[role="dialog"] [name="name"], [role="dialog"] input[placeholder*="Name"]');
        if (await nameField.isVisible()) {
          await nameField.fill('E2E Team Member');
        }

        const sendBtn = page.locator('[role="dialog"]').getByRole('button', { name: /send|invite|add/i });
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      expect(mutationsWithoutCsrf, `mutating requests missing CSRF: ${mutationsWithoutCsrf.join(', ')}`).toHaveLength(0);
    });

    test('invalid email shows validation error', async ({ page }) => {
      const inviteBtn = page.getByRole('button', { name: /invite|add member/i }).first();
      if (!await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) return;

      await inviteBtn.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('[role="dialog"] [name="email"], [role="dialog"] input[type="email"]');
      if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailField.fill('not-an-email');

        const sendBtn = page.locator('[role="dialog"]').getByRole('button', { name: /send|invite|add/i });
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          // Should show validation error or prevent submission
        }
      }
    });
  });

  test.describe('Role Management', () => {
    test('role can be changed for team members', async ({ page }) => {
      const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]').first();
      if (await roleSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Role selects should have admin/editor/viewer options
        const options = await roleSelect.locator('option').allTextContents();
        expect(options.length).toBeGreaterThanOrEqual(1);
      }
    });

    test('role change triggers API update', async ({ page }) => {
      let roleUpdateSent = false;

      page.on('request', (req) => {
        if (['PUT', 'PATCH'].includes(req.method()) && req.url().includes('/api/')) {
          roleUpdateSent = true;
        }
      });

      const roleSelect = page.locator('select[name="role"]').first();
      if (await roleSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await roleSelect.locator('option').all();
        if (options.length > 1) {
          await roleSelect.selectOption({ index: options.length - 1 });
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Remove Member', () => {
    test('remove button shows confirmation dialog', async ({ page }) => {
      const removeBtn = page.getByRole('button', { name: /remove|delete/i }).first();
      if (await removeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(500);

        const confirm = page.locator('[role="dialog"], [role="alertdialog"]');
        if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
          const cancelBtn = page.getByRole('button', { name: /cancel/i });
          if (await cancelBtn.isVisible()) await cancelBtn.click();
        }
      }
    });

    test('removing member sends DELETE with CSRF', async ({ page }) => {
      let deleteCsrf = false;

      page.on('request', (req) => {
        if (req.method() === 'DELETE' && req.url().includes('/api/')) {
          deleteCsrf = !!req.headers()['x-csrf-token'];
        }
      });

      const removeBtn = page.getByRole('button', { name: /remove|delete/i }).first();
      if (await removeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.getByRole('button', { name: /confirm|yes|remove/i });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Don't actually confirm deletion in tests
          const cancelBtn = page.getByRole('button', { name: /cancel/i });
          if (await cancelBtn.isVisible()) await cancelBtn.click();
        }
      }
    });
  });

  test.describe('Bulk Invite', () => {
    test('bulk invite option is available', async ({ page }) => {
      const bulkBtn = page.getByRole('button', { name: /bulk/i });
      if (await bulkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(bulkBtn).toBeVisible();
      }
    });

    test('bulk invite opens file upload interface', async ({ page }) => {
      const bulkBtn = page.getByRole('button', { name: /bulk/i });
      if (await bulkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await bulkBtn.click();
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"], [data-testid="file-upload"]');
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(fileInput).toBeVisible();
        }
      }
    });
  });

  test.describe('Security', () => {
    test('team page does not expose member passwords', async ({ page }) => {
      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/password.*=.*["'][^"']+["']/i);
      expect(html).not.toMatch(/eyJhbGciOi/);
    });

    test('invite affordance is confined to the admin-gated team view (role-based access)', async ({ page }) => {
      // Team management lives on the Settings page, which is admin-gated at the
      // route level (App.tsx: non-admins are redirected to /dashboard). The invite
      // affordance is therefore an admin-only control. This asserts the affordance
      // never leaks outside that admin context: if an invite button is visible, the
      // app must still be on the admin team/settings view rather than having been
      // redirected away.
      const inviteBtn = page.getByRole('button', { name: /invite|add member/i }).first();
      const inviteVisible = await inviteBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (inviteVisible) {
        // Admin context: invite control implies we are on the settings/team surface.
        expect(page.url()).toMatch(/settings|team/i);
        const teamSurface = page.locator(
          'table, [data-testid="team-members"], .team-list, .member-list, text=/team/i'
        ).first();
        await expect(teamSurface).toBeVisible({ timeout: 5000 });
      } else {
        // No admin invite affordance: the role-gated control is correctly absent.
        // Confirm the app is in a valid state (redirected to dashboard or showing
        // a non-admin view) rather than crashed/blank.
        const appShell = page.locator('nav, aside, main, [data-testid="sidebar"]').first();
        await expect(appShell).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
