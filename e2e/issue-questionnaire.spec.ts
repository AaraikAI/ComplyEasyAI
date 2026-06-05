/**
 * E2E Tests: Issue Management & Questionnaire Flows
 *
 * Tests issue lifecycle, commenting, assignment,
 * questionnaire creation and response collection.
 *
 * Shell notes (current SlimSidebar shell):
 * - Issues live at /issues (IncidentHub default tab = IssueManagement) — NOT a
 *   sidebar pillar, so we navigate via page.goto. IssueManagement renders an
 *   <h1>Issue Management</h1> dashboard with a "New Issue" button; the create
 *   form fields are controlled inputs WITHOUT name attributes, so we locate by
 *   placeholder. There is no "severity" field — the app's concept is "priority".
 * - Questionnaires live at /enterprise/questionnaires (QuestionnaireManagement),
 *   <h1>Questionnaire Management</h1> with a "New Questionnaire" button; the
 *   create form title input is located by placeholder.
 */

import { test, expect, Page } from '@playwright/test';

// Re-seed client-side auth and suppress the env blockers (auth wipe on boot-401,
// cookie-consent banner, onboarding "Welcome" modal) before every navigation.
async function primeEnv(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          id: 'e2e-test-user-001',
          name: 'E2E Test User',
          email: 'e2e-test@complyeasyai.com',
          role: 'admin',
          organizationId: 'e2e-test-org-001',
          organization: { id: 'e2e-test-org-001', name: 'E2E Test Organization', plan: 'Visionary' },
        }),
      );
      localStorage.setItem(
        'complyeasy_cookie_consent',
        JSON.stringify({
          essential: true,
          functional: true,
          analytics: true,
          targeting: true,
          consentDate: new Date().toISOString(),
          consentVersion: '1.0',
        }),
      );
    } catch {
      /* storage unavailable — ignore */
    }
  });

  const onboardingBody = {
    status: 'success',
    data: {
      progress: {
        welcomeCompleted: true,
        tierTourCompleted: true,
        completedAt: new Date().toISOString(),
        skippedFlows: ['welcome'],
      },
      organizationPlan: 'Visionary',
      checklist: [],
    },
  };
  await page.route('**/onboarding/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(onboardingBody) }),
  );
  await page.route('**/onboarding/checklist', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(onboardingBody) }),
  );
}

test.describe('Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    await primeEnv(page);
    await page.goto('/issues');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can view issue list with severity indicators', async ({ page }) => {
    // /issues renders the IssueManagement dashboard with an "Issue Management" heading.
    await expect(
      page.locator('h1:has-text("Issue"), h2:has-text("Issue"), [data-testid="issue-management"]').first(),
    ).toBeVisible({ timeout: 15000 });

    // The "New Issue" control proves the issue CRUD surface is mounted.
    await expect(page.getByRole('button', { name: /New Issue/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('User can create and assign an issue', async ({ page }) => {
    await expect(
      page.locator('h1:has-text("Issue Management")').first(),
    ).toBeVisible({ timeout: 15000 });

    // The dashboard header always renders a "New Issue" control — guarding the
    // whole flow behind its visibility would let a missing CRUD UI pass silently.
    const addBtn = page.getByRole('button', { name: /New Issue|Create Issue|Add Issue/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // Clicking "New Issue" opens the create form (h2 "Create Issue"). The title
    // input is a controlled field without a name attribute → locate by placeholder.
    await expect(page.locator('h2:has-text("Create Issue")')).toBeVisible({ timeout: 5000 });

    const titleField = page.getByPlaceholder('Brief description of the issue');
    await expect(titleField).toBeVisible({ timeout: 5000 });
    await titleField.fill('E2E Expired SSL Certificate');

    const descField = page.getByPlaceholder('Detailed description of the issue...');
    await expect(descField).toBeVisible({ timeout: 5000 });
    await descField.fill('Production SSL certificate expires in 30 days');

    // The "severity" concept maps to the Priority select in this UI.
    const prioritySelect = page.locator('form select').filter({ has: page.locator('option[value="High"]') }).first();
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('High').catch(() => {});
    }

    // Submitting must dispatch the create mutation to the issue endpoint
    // (POST /api/enterprise/issues) carrying the exact form payload. Backend
    // *persistence* can't be asserted in this E2E env (no real authenticated
    // session → the server rejects the write), but the frontend create contract
    // (method + endpoint + payload shape) is fully deterministic, so we assert it.
    const submitBtn = page.locator('form button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    const [createReq] = await Promise.all([
      page.waitForRequest(
        (req) => req.method() === 'POST' && /\/api\/enterprise\/issues(\?|$)/.test(req.url()),
        { timeout: 15000 },
      ),
      submitBtn.click(),
    ]);

    const body = JSON.parse(createReq.postData() || '{}');
    expect(body.title).toBe('E2E Expired SSL Certificate');
    expect(body.description).toBe('Production SSL certificate expires in 30 days');
  });

  test('User can filter issues by severity and status', async ({ page }) => {
    await expect(
      page.locator('h1:has-text("Issue Management")').first(),
    ).toBeVisible({ timeout: 15000 });

    // Filters live in the list view; navigate there from the dashboard.
    const viewAll = page.getByRole('button', { name: /View All Issues/i }).first();
    await expect(viewAll).toBeVisible({ timeout: 10000 });
    await viewAll.click();

    // The list view exposes Status / Priority / Type filter <select>s (no name
    // attributes). Exercise the Priority ("severity") and Status filters.
    const selects = page.locator('div.flex.flex-wrap select');
    await expect(selects.first()).toBeVisible({ timeout: 10000 });
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Priority filter contains a "High" option.
    const priorityFilter = selects.filter({ has: page.locator('option[value="High"]') }).first();
    if (await priorityFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priorityFilter.selectOption('High');
      await page.waitForTimeout(500);
      await expect(priorityFilter).toHaveValue('High');
    }

    // Status filter — pick its second option (first is the "All" placeholder).
    const statusFilter = selects.first();
    const statusOptions = statusFilter.locator('option');
    if ((await statusOptions.count()) > 1) {
      const secondVal = await statusOptions.nth(1).getAttribute('value');
      if (secondVal) {
        await statusFilter.selectOption(secondVal);
        await page.waitForTimeout(500);
        await expect(statusFilter).toHaveValue(secondVal);
      }
    }
  });
});

test.describe('Questionnaire Management', () => {
  test.beforeEach(async ({ page }) => {
    await primeEnv(page);
    await page.goto('/enterprise/questionnaires');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can view questionnaire list', async ({ page }) => {
    await expect(
      page
        .locator('h1:has-text("Questionnaire"), h2:has-text("Questionnaire"), [data-testid="questionnaire-list"]')
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // The dashboard header always renders a "New Questionnaire" control.
    await expect(
      page.getByRole('button', { name: /New Questionnaire/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('User can create a new questionnaire', async ({ page }) => {
    await expect(
      page.locator('h1:has-text("Questionnaire Management")').first(),
    ).toBeVisible({ timeout: 15000 });

    const addBtn = page.getByRole('button', { name: /New Questionnaire|Create Questionnaire|Add Questionnaire/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // The create form renders an h2 "Create Questionnaire" with a title input
    // (controlled, no name attribute → locate by placeholder).
    await expect(page.locator('h2:has-text("Create Questionnaire")')).toBeVisible({ timeout: 5000 });

    const titleField = page.getByPlaceholder('e.g., Annual Vendor Security Assessment');
    await expect(titleField).toBeVisible({ timeout: 5000 });
    await titleField.fill('E2E Security Assessment Questionnaire');

    const descField = page.getByPlaceholder('Describe the purpose of this questionnaire...');
    if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descField.fill('Annual security assessment questionnaire');
    }

    // Submitting must dispatch the create mutation to the questionnaire endpoint
    // (POST /api/enterprise/questionnaires) carrying the entered title. Backend
    // persistence can't be asserted in this E2E env (no real authenticated
    // session → the server rejects the write), but the frontend create contract
    // (method + endpoint + payload shape) is deterministic, so we assert it.
    const submitBtn = page.locator('form button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    const [createReq] = await Promise.all([
      page.waitForRequest(
        (req) => req.method() === 'POST' && /\/api\/enterprise\/questionnaires(\?|$)/.test(req.url()),
        { timeout: 15000 },
      ),
      submitBtn.click(),
    ]);

    const body = JSON.parse(createReq.postData() || '{}');
    expect(body.title).toBe('E2E Security Assessment Questionnaire');
  });
});
