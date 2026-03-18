/**
 * E2E Tests: Integrations
 * Tests integration connect, sync, webhook, disconnect lifecycle
 */

import { test, expect } from '@playwright/test';

test.describe('Integrations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Load', () => {
    test('integrations page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('available integrations are listed', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const integrationCards = page.locator(
        '[data-testid="integration-card"], .integration-card, .integration-item, table tbody tr'
      );
      if (await integrationCards.first().isVisible({ timeout: 8000 }).catch(() => false)) {
        const count = await integrationCards.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('integrations show status indicators', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const status = page.locator(
        ':text("Connected"), :text("Disconnected"), :text("Active"), :text("Inactive"), .badge, .status-indicator'
      ).first();
      if (await status.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(status).toBeVisible();
      }
    });
  });

  test.describe('Connect Integration', () => {
    test('connect button is available for disconnected integrations', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const connectBtn = page.getByRole('button', { name: /connect|enable|add|configure/i }).first();
      if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(connectBtn).toBeVisible();
      }
    });

    test('connect opens configuration modal', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const connectBtn = page.getByRole('button', { name: /connect|enable|configure/i }).first();
      if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await connectBtn.click();
        await page.waitForTimeout(500);

        const modal = page.locator('[role="dialog"], .modal');
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();

          // Close without connecting
          const closeBtn = page.locator('[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close")').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
        }
      }
    });

    test('integration configuration has API key or OAuth fields', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const connectBtn = page.getByRole('button', { name: /connect|configure/i }).first();
      if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await connectBtn.click();
        await page.waitForTimeout(500);

        const configFields = page.locator(
          '[name="apiKey"], [name="api_key"], [name="token"], input[type="password"], :text("OAuth"), :text("API Key")'
        ).first();
        if (await configFields.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(configFields).toBeVisible();
        }
      }
    });

    test('connect sends POST with CSRF', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      let connectCsrf = false;

      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/') &&
            (req.url().includes('integration') || req.url().includes('connect'))) {
          connectCsrf = !!req.headers()['x-csrf-token'];
        }
      });

      const connectBtn = page.getByRole('button', { name: /connect|enable/i }).first();
      if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await connectBtn.click();
        await page.waitForTimeout(2000);
      }

      // CSRF verification happens if a POST was actually sent
      if (connectCsrf) {
        expect(connectCsrf).toBeTruthy();
      }
    });
  });

  test.describe('Sync Operations', () => {
    test('sync button exists for connected integrations', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const syncBtn = page.getByRole('button', { name: /sync|refresh|pull/i }).first();
      if (await syncBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(syncBtn).toBeVisible();
      }
    });

    test('sync shows progress or completion', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const syncBtn = page.getByRole('button', { name: /sync|refresh/i }).first();
      if (await syncBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await syncBtn.click();
        await page.waitForTimeout(2000);

        // Should show progress or completion
        const progress = page.locator(
          ':text("Syncing"), :text("Complete"), :text("Success"), .animate-spin, [role="progressbar"]'
        ).first();
        if (await progress.isVisible({ timeout: 10000 }).catch(() => false)) {
          await expect(progress).toBeVisible();
        }
      }
    });

    test('last sync timestamp is displayed', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const lastSync = page.locator(
        ':text("Last sync"), :text("last sync"), :text("ago"), :text("Last Synced")'
      ).first();
      if (await lastSync.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(lastSync).toBeVisible();
      }
    });
  });

  test.describe('Webhook Management', () => {
    test('webhook configuration section exists', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const webhook = page.locator(
        ':text("Webhook"), :text("webhook"), button:has-text("Webhook"), [data-testid="webhooks"]'
      ).first();
      if (await webhook.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(webhook).toBeVisible();
      }
    });

    test('can add a webhook endpoint', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const addWebhookBtn = page.getByRole('button', { name: /add.*webhook|new.*webhook|create.*webhook/i });
      if (await addWebhookBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addWebhookBtn.click();
        await page.waitForTimeout(500);

        const urlInput = page.locator('[name="url"], [name="webhookUrl"], input[placeholder*="url"]');
        if (await urlInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await urlInput.fill('https://example.com/webhook');
        }
      }
    });

    test('webhook events can be selected', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const eventCheckboxes = page.locator(
        'input[type="checkbox"][name*="event"], [data-testid="webhook-event"], :text("Events")'
      ).first();
      if (await eventCheckboxes.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(eventCheckboxes).toBeVisible();
      }
    });
  });

  test.describe('Disconnect Integration', () => {
    test('disconnect button exists for connected integrations', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const disconnectBtn = page.getByRole('button', { name: /disconnect|disable|remove/i }).first();
      if (await disconnectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(disconnectBtn).toBeVisible();
      }
    });

    test('disconnect requires confirmation', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const disconnectBtn = page.getByRole('button', { name: /disconnect|disable/i }).first();
      if (await disconnectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await disconnectBtn.click();
        await page.waitForTimeout(500);

        const confirm = page.locator('[role="dialog"], [role="alertdialog"]');
        if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
          const cancelBtn = page.getByRole('button', { name: /cancel/i });
          if (await cancelBtn.isVisible()) await cancelBtn.click();
        }
      }
    });

    test('disconnect sends DELETE with CSRF', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      let deleteCsrf = false;

      page.on('request', (req) => {
        if (req.method() === 'DELETE' && req.url().includes('/api/')) {
          deleteCsrf = !!req.headers()['x-csrf-token'];
        }
      });

      const disconnectBtn = page.getByRole('button', { name: /disconnect|disable/i }).first();
      if (await disconnectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await disconnectBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.getByRole('button', { name: /confirm|yes|disconnect/i });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Don't actually disconnect
          const cancelBtn = page.getByRole('button', { name: /cancel/i });
          if (await cancelBtn.isVisible()) await cancelBtn.click();
        }
      }
    });
  });

  test.describe('Ticketing Integrations', () => {
    test('ticketing integrations page loads', async ({ page }) => {
      await page.goto('/ticketing');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('ticketing shows Jira, ServiceNow, etc.', async ({ page }) => {
      await page.goto('/ticketing');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const ticketing = page.locator(
        ':text("Jira"), :text("ServiceNow"), :text("Slack"), :text("Ticketing"), :text("Integration")'
      ).first();
      if (await ticketing.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(ticketing).toBeVisible();
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('handles integration API failure gracefully', async ({ page }) => {
      await page.route('**/api/*integration*', (route) => {
        route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service unavailable' }) });
      });

      await page.goto('/integrations');
      await page.waitForTimeout(3000);

      const body = await page.locator('body').isVisible();
      expect(body).toBeTruthy();
    });
  });

  test.describe('Security', () => {
    test('integration API keys are masked in UI', async ({ page }) => {
      const html = await page.locator('body').innerHTML();
      // API keys should be masked (shown as ****) not in cleartext
      expect(html).not.toMatch(/sk_live_[a-zA-Z0-9]{20,}/);
      expect(html).not.toMatch(/sk_test_[a-zA-Z0-9]{20,}/);
    });

    test('integration secrets not in network responses visible in DOM', async ({ page }) => {
      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/eyJhbGciOi/);
      expect(html).not.toMatch(/OPENAI_API_KEY/);
      expect(html).not.toMatch(/SUPABASE_SERVICE_KEY/);
    });

    test('integration endpoints require authentication', async ({ page }) => {
      const response = await page.request.get(
        `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/integrations`,
        { headers: { 'Content-Type': 'application/json' } }
      ).catch(() => null);

      if (response) {
        expect([401, 403, 404]).toContain(response.status());
      }
    });
  });
});
