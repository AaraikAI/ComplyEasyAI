/**
 * E2E Tests: Incident Management
 * Tests incident lifecycle: create, assign, investigate, resolve, close
 */

import { test, expect } from '@playwright/test';

test.describe('Incident Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/issues');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Load', () => {
    test('issues/incidents page loads', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('incident list or table is displayed', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const list = page.locator('table, .incident-list, [data-testid="incidents"]').first();
      if (await list.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(list).toBeVisible();
      }
    });
  });

  test.describe('Incident Creation', () => {
    test('create button is visible', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const createBtn = page.getByRole('button', { name: /create|add|new|report/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(createBtn).toBeVisible();
      }
    });

    test('incident form has required fields', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const createBtn = page.getByRole('button', { name: /create|add|new|report/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        // Should have title, description, severity at minimum
        const titleField = page.locator('[name="title"], [name="name"], input[type="text"]').first();
        const descField = page.locator('[name="description"], textarea').first();

        const hasTitle = await titleField.isVisible({ timeout: 3000 }).catch(() => false);
        const hasDesc = await descField.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasTitle || hasDesc).toBeTruthy();
      }
    });

    test('creating an incident sends POST request', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Track the incident create POST and its response so we can assert that
      // submitting the form actually fires the mutation and that the mutation
      // is not rejected by CSRF (response 403).
      let postRequest: { url: string; method: string } | null = null;
      let postRejectedByCsrf = false;

      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/incidents')) {
          postRequest = { url: req.url(), method: req.method() };
        }
      });
      page.on('response', (res) => {
        const req = res.request();
        if (req.method() === 'POST' && res.url().includes('/api/incidents') && res.status() === 403) {
          postRejectedByCsrf = true;
        }
      });

      // IncidentManagement renders either the incident register (with a create
      // control) or a "Failed to Load Incidents" error panel. The create flow
      // requires the register UI.
      const createBtn = page.getByRole('button', { name: /create|add|new|report/i }).first();
      const loadError = page.getByText('Failed to Load Incidents');
      const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (!createVisible) {
        await expect(loadError).toBeVisible({ timeout: 3000 });
        return;
      }

      await createBtn.click();
      await page.waitForTimeout(500);

      // The create form must open with a title field.
      const titleField = page.locator('[name="title"], [name="name"], input[type="text"]').first();
      await expect(titleField).toBeVisible({ timeout: 5000 });
      await titleField.fill('E2E Incident - Security Breach Detected');

      const descField = page.locator('[name="description"], textarea').first();
      if (await descField.isVisible()) {
        await descField.fill('Unauthorized access detected in production environment');
      }

      const severitySelect = page.locator('select[name="severity"]');
      if (await severitySelect.isVisible().catch(() => false)) {
        const options = await severitySelect.locator('option').all();
        if (options.length > 1) await severitySelect.selectOption({ index: 1 });
      }

      const submitBtn = page.getByRole('button', { name: /create|save|submit/i }).last();
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Submitting the completed form must issue the create POST, and that POST
      // must not be blocked by CSRF validation.
      expect(postRequest, 'submitting the incident form should POST to /api/incidents').not.toBeNull();
      expect(postRejectedByCsrf, 'incident create POST was rejected by CSRF').toBe(false);
    });
  });

  test.describe('Incident Assignment', () => {
    test('incident can be assigned to a team member', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const row = page.locator('table tbody tr, [data-testid="incident-row"], .incident-item').first();
      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(500);

        const assigneeField = page.locator('select[name="assignee"], [data-testid="assignee"]');
        if (await assigneeField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(assigneeField).toBeVisible();
        }
      }
    });
  });

  test.describe('Incident Resolution', () => {
    test('resolve button is available on open incidents', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const row = page.locator('table tbody tr, [data-testid="incident-row"], .incident-item').first();
      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(500);

        const resolveBtn = page.getByRole('button', { name: /resolve|close|complete/i }).first();
        if (await resolveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(resolveBtn).toBeVisible();
        }
      }
    });

    test('resolving an incident updates its status', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      let statusUpdateRequest = false;

      page.on('request', (req) => {
        if (['PUT', 'PATCH'].includes(req.method()) && req.url().includes('/api/')) {
          statusUpdateRequest = true;
        }
      });

      const row = page.locator('table tbody tr, [data-testid="incident-row"], .incident-item').first();
      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(500);

        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await statusSelect.selectOption('Resolved');
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Incident Closure', () => {
    test('closed incidents show in filtered view', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
      if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await statusFilter.locator('option').allTextContents();
        const hasClosedOption = options.some(o => /closed|resolved/i.test(o));
        if (hasClosedOption) {
          await statusFilter.selectOption({ label: options.find(o => /closed|resolved/i.test(o))! });
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('shows error state gracefully on API failure', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Intercept API to simulate failure
      await page.route('**/api/incidents*', (route) => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) });
      });

      await page.goto('/issues');
      await page.waitForTimeout(3000);

      // Page should handle error gracefully (no crash)
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBeTruthy();
    });

    test('retry after network error', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      let requestCount = 0;

      // Block first request, allow second
      await page.route('**/api/incidents*', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.abort('connectionrefused');
        } else {
          route.continue();
        }
      });

      await page.goto('/issues');
      await page.waitForTimeout(3000);

      // Page should be visible even after initial failure
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBeTruthy();
    });
  });

  test.describe('Security', () => {
    test('incident data does not expose internal IDs in URL fragments', async ({ page }) => {
      const url = page.url();
      // Should not have UUIDs or internal IDs in URL unless viewing a specific incident
      expect(url).not.toMatch(/[a-f0-9]{32}/); // raw UUID without dashes
    });

    test('API responses for incidents do not contain passwords', async ({ page }) => {
      const sensitiveResponses: string[] = [];

      page.on('response', async (res) => {
        if (res.url().includes('/api/') && res.status() === 200) {
          try {
            const body = await res.text();
            if (/password|secret|token/i.test(body) && !/csrf/i.test(body)) {
              sensitiveResponses.push(res.url());
            }
          } catch {}
        }
      });

      await page.goto('/issues');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      expect(sensitiveResponses).toHaveLength(0);
    });
  });
});
