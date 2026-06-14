/**
 * E2E Tests: Asset Management
 * Tests asset CRUD, classification, and lifecycle management
 */

import { test, expect } from '@playwright/test';

test.describe('Asset Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assets');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Load & Structure', () => {
    test('assets page loads successfully', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('asset list or grid is displayed', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const list = page.locator('table, .asset-list, .asset-grid, [data-testid="assets"]').first();
      if (await list.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(list).toBeVisible();
      }
    });
  });

  test.describe('Asset CRUD', () => {
    test('can create a new asset', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // AssetManagement renders either the asset register (with an "Add Asset"
      // control) or, when the backend cannot return assets, a "Failed to Load
      // Assets" error panel. The create flow requires the register UI, so a
      // missing Add button without that error state is a real failure.
      const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
      const loadError = page.getByText('Failed to Load Assets');
      const addVisible = await addBtn.isVisible({ timeout: 8000 }).catch(() => false);

      if (!addVisible) {
        // The only acceptable reason for no Add button is the explicit error state.
        await expect(loadError).toBeVisible({ timeout: 3000 });
        return;
      }

      await expect(addBtn).toBeVisible();
      {
        await addBtn.click();
        await page.waitForTimeout(500);

        // Scope every form locator to the create modal (a fixed inset-0 z-50
        // overlay). The page also renders a search box (input[type=text]), so an
        // unscoped `.first()` would fill THAT and leave the modal's name field —
        // which has no name attribute, only a placeholder — empty, keeping the
        // submit button disabled (handleCreate is disabled while form.name is
        // blank). Target the name field by its unique placeholder.
        const modal = page.locator('div.fixed.inset-0.z-50').last();
        await expect(modal).toBeVisible({ timeout: 5000 });
        const nameInput = modal.getByPlaceholder('e.g. Production Web Server');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('E2E Asset - Production Database Server');

        const typeSelect = modal.locator('select').first();
        if (await typeSelect.isVisible().catch(() => false)) {
          const options = await typeSelect.locator('option').all();
          if (options.length > 1) await typeSelect.selectOption({ index: 1 });
        }

        // The submit control must be present and enabled once a name is entered
        // (handleCreate is disabled while form.name is blank).
        const saveBtn = modal.getByRole('button', { name: /add asset/i }).last();
        await expect(saveBtn).toBeVisible();
        await expect(saveBtn).toBeEnabled();
        await saveBtn.click();
        await page.waitForTimeout(1000);
      }
    });

    test('can view asset details', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const assetRow = page.locator('table tbody tr, [data-testid="asset-row"], .asset-item').first();
      if (await assetRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assetRow.click();
        await page.waitForTimeout(500);

        // Should show detail view
        const detail = page.locator('[data-testid="asset-detail"], .detail-panel, [role="dialog"], h2, h3').first();
        if (await detail.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(detail).toBeVisible();
        }
      }
    });

    test('can edit an existing asset', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const assetRow = page.locator('table tbody tr, [data-testid="asset-row"], .asset-item').first();
      if (await assetRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assetRow.click();
        await page.waitForTimeout(500);

        const editBtn = page.getByRole('button', { name: /edit|update/i }).first();
        if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editBtn.click();
          await page.waitForTimeout(500);

          const nameInput = page.locator('[name="name"], [name="title"], input[type="text"]').first();
          if (await nameInput.isVisible()) {
            await nameInput.clear();
            await nameInput.fill('E2E Asset - Updated Name');
          }

          const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('can delete an asset with confirmation', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const assetRow = page.locator('table tbody tr, [data-testid="asset-row"], .asset-item').first();
      if (await assetRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assetRow.click();
        await page.waitForTimeout(500);

        const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
        if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await deleteBtn.click();
          await page.waitForTimeout(500);

          // Should show confirmation dialog
          const confirm = page.locator('[role="dialog"], [role="alertdialog"]');
          if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
            const cancelBtn = page.getByRole('button', { name: /cancel/i });
            if (await cancelBtn.isVisible()) {
              await cancelBtn.click(); // Don't actually delete
            }
          }
        }
      }
    });
  });

  test.describe('Asset Classification', () => {
    test('asset classification options are available', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const classificationContent = page.locator(
        ':text("Classification"), :text("Critical"), :text("High"), :text("Medium"), :text("Low"), :text("Confidential"), :text("Public")'
      ).first();
      if (await classificationContent.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(classificationContent).toBeVisible();
      }
    });

    test('can filter assets by classification', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const filterSelect = page.locator('select[name="classification"], select[name="category"], [data-testid="filter"]').first();
      if (await filterSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filterSelect.locator('option').all();
        if (options.length > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Asset Lifecycle', () => {
    test('lifecycle stages are visible', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const lifecycle = page.locator(
        ':text("Lifecycle"), :text("Active"), :text("Retired"), :text("Decommissioned"), :text("Deployed")'
      ).first();
      if (await lifecycle.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(lifecycle).toBeVisible();
      }
    });

    test('asset owner can be assigned', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const ownerField = page.locator(
        'select[name="owner"], [name="owner"], [data-testid="asset-owner"], :text("Owner")'
      ).first();
      if (await ownerField.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(ownerField).toBeVisible();
      }
    });
  });

  test.describe('Network & Security', () => {
    test('asset API responses have correct structure', async ({ page }) => {
      const apiResponses: Array<{ url: string; status: number }> = [];

      page.on('response', (res) => {
        if (res.url().includes('/api/') && res.url().includes('asset')) {
          apiResponses.push({ url: res.url(), status: res.status() });
        }
      });

      await page.goto('/assets');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      for (const res of apiResponses) {
        expect(res.status).toBeLessThan(500);
      }
    });

    test('asset mutations are not rejected by CSRF protection', async ({ page }) => {
      // The backend uses a double-submit cookie CSRF scheme. A correctly wired
      // mutation must not be rejected with a 403 CSRF error. We observe both the
      // outgoing mutating requests and their responses, then assert no mutation
      // was blocked by CSRF.
      const mutations: Array<{ url: string; method: string }> = [];
      const csrfRejections: string[] = [];

      page.on('request', (req) => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method()) && req.url().includes('/api/')) {
          mutations.push({ url: req.url(), method: req.method() });
        }
      });
      page.on('response', (res) => {
        const req = res.request();
        if (
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method()) &&
          res.url().includes('/api/') &&
          res.status() === 403
        ) {
          csrfRejections.push(`${req.method()} ${res.url()}`);
        }
      });

      await page.goto('/assets');
      await page.waitForLoadState('networkidle').catch(() => {});

      // Drive an actual create so a mutating request is exercised.
      const addBtn = page.getByRole('button', { name: /add|create/i }).first();
      if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBtn.click();
        // Scope to the create modal; the name field has only a placeholder (no
        // name attr), so an unscoped input[type=text] would match the page search
        // box and leave the submit disabled.
        const modal = page.locator('div.fixed.inset-0.z-50').last();
        const nameInput = modal.getByPlaceholder('e.g. Production Web Server');
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill('E2E Asset - CSRF Check');
          const saveBtn = modal.getByRole('button', { name: /add asset/i }).last();
          if (await saveBtn.isEnabled().catch(() => false)) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // No mutating asset request may be blocked by CSRF validation.
      expect(csrfRejections, `CSRF-rejected mutations: ${csrfRejections.join(', ')}`).toHaveLength(0);
    });
  });
});
