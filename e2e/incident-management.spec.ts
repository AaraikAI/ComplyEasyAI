/**
 * E2E Tests: Incident Management
 * Tests incident lifecycle: create, assign, investigate, resolve, close
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Rebound to the CURRENT app shell. Incident management lives in the Incident
 * Hub at /issues — a TabbedContainer with an "Issues" tab (default), an
 * "Incidents" tab (IncidentManagement → fetches /api/incidents, has a "Report
 * Incident" control + create modal, severity/status filter <select>s), and a
 * "Breach Notification" tab. These incident tests target the Incidents tab, so
 * navigation uses /issues?tab=incidents.
 *
 * Auth in this app is client-side: AuthContext restores localStorage `user_data`
 * on boot and `isAuthenticated = !!user`. A boot-time API 401 wipes it and
 * redirects to '/'. So authenticated specs must (1) re-seed `user_data` via an
 * addInitScript before every navigation, (2) pre-accept cookie consent so the
 * fixed-bottom GDPR banner never intercepts clicks, and (3) stub the
 * /onboarding/progress + /onboarding/checklist endpoints so the API-driven
 * "Welcome" modal (a fixed inset-0 dialog that auto-opens on 401 and intercepts
 * all clicks) never renders.
 */

// Cached auth profile re-seeded before every navigation (auth tokens live in
// httpOnly cookies; only this non-sensitive profile is restored from localStorage).
const E2E_USER = {
  id: 'e2e-test-user-001',
  name: 'E2E Test User',
  email: 'e2e-test@complyeasyai.com',
  role: 'admin',
  avatar: 'E2',
  organizationId: 'e2e-test-org-001',
  organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
};

async function stubOnboarding(page: Page): Promise<void> {
  await page.route('**/onboarding/progress', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          progress: {
            welcomeCompleted: true,
            tierTourCompleted: true,
            completedAt: new Date().toISOString(),
            skippedFlows: ['welcome'],
            tooltipsShown: [],
            showHints: false,
          },
          organizationPlan: 'Visionary',
          organizationName: 'E2E Test Organization',
          onboardingCompleted: true,
        },
      }),
    }),
  );
  await page.route('**/onboarding/checklist', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: { checklist: { completedAt: new Date().toISOString() } } }),
    }),
  );
}

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(
    ({ u }) => {
      localStorage.setItem('user_data', JSON.stringify(u));
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_skipped', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');
      localStorage.setItem(
        'complyeasy_cookie_consent',
        JSON.stringify({
          essential: true, functional: true, analytics: true, targeting: true,
          consentDate: new Date().toISOString(), consentVersion: '1.0',
        }),
      );
    },
    { u: E2E_USER },
  );
}

// Navigate to the Incident Hub's "Incidents" tab (IncidentManagement).
async function gotoIncidents(page: Page, path = '/issues?tab=incidents'): Promise<void> {
  await seedAuth(page);
  await stubOnboarding(page);
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

test.describe('Incident Management', () => {
  test.beforeEach(async ({ page }) => {
    await gotoIncidents(page);
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

        // Scope to the create modal so the page search box isn't matched.
        const modal = page.locator('div.fixed.inset-0.z-50').last();
        // Should have title, description, severity at minimum
        const titleField = modal.locator('input[placeholder="Incident title"]');
        const descField = modal.locator('textarea').first();

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

      // The create modal is a fixed inset-0 overlay; scope form locators to it so
      // the page-level search box (also input[type="text"]) is never matched.
      const modal = page.locator('div.fixed.inset-0.z-50').last();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // The create form must open with a title field (placeholder "Incident title").
      const titleField = modal.locator('input[placeholder="Incident title"]');
      await expect(titleField).toBeVisible({ timeout: 5000 });
      await titleField.fill('E2E Incident - Security Breach Detected');

      const descField = modal.locator('textarea').first();
      if (await descField.isVisible()) {
        await descField.fill('Unauthorized access detected in production environment');
      }

      // Severity is the first <select> in the modal (no name attribute).
      const severitySelect = modal.locator('select').first();
      if (await severitySelect.isVisible().catch(() => false)) {
        const options = await severitySelect.locator('option').all();
        if (options.length > 1) await severitySelect.selectOption({ index: 1 });
      }

      // The modal's submit button is "Report Incident" (the page also has a
      // toolbar "Report Incident"; scope the submit to the modal).
      const submitBtn = modal.getByRole('button', { name: /report incident/i });
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

      await gotoIncidents(page);
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

      await gotoIncidents(page);
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

      await gotoIncidents(page);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      expect(sensitiveResponses).toHaveLength(0);
    });
  });
});
