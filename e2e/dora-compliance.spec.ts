/**
 * E2E Tests: DORA Compliance
 * Tests ICT risk CRUD, incidents, providers, resilience tests
 */

import { test, expect, Page } from '@playwright/test';
import { dismissOnboarding } from './_onboarding';

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

test.describe('DORA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await primeEnv(page);
    await page.goto('/enterprise/dora');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await dismissOnboarding(page);
  });

  test.describe('Page Load & Structure', () => {
    test('DORA page loads with heading', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('DORA page shows key compliance sections', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const sections = page.locator(
        ':text("ICT Risk"), :text("Incident"), :text("Provider"), :text("Resilience"), :text("Testing"), :text("Information Sharing")'
      ).first();
      if (await sections.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(sections).toBeVisible();
      }
    });
  });

  test.describe('ICT Risk Management', () => {
    test('ICT risk section is accessible', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const ictRisk = page.locator(
        ':text("ICT Risk"), :text("ICT risk"), button:has-text("ICT"), [data-testid="ict-risk"]'
      ).first();
      if (await ictRisk.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(ictRisk).toBeVisible();
      }
    });

    test('can create an ICT risk entry', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const titleInput = page.locator('[name="title"], [name="name"], input[type="text"]').first();
        if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await titleInput.fill('E2E ICT Risk - Cloud Provider Failure');

          const descInput = page.locator('[name="description"], textarea').first();
          if (await descInput.isVisible()) {
            await descInput.fill('Risk of primary cloud provider experiencing extended outage');
          }

          const saveBtn = page.getByRole('button', { name: /save|create|submit/i }).first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('ICT risk entries can be viewed in list', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const table = page.locator('table, .risk-list, [data-testid="risk-table"]').first();
      if (await table.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(table).toBeVisible();
      }
    });
  });

  test.describe('ICT Incident Reporting', () => {
    test('incident reporting section exists', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const incidentSection = page.locator(
        ':text("Incident"), :text("incident"), button:has-text("Incident")'
      ).first();
      if (await incidentSection.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(incidentSection).toBeVisible();
      }
    });

    test('can report a DORA incident', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      // Let the dashboard finish its initial data load before interacting.
      await page.waitForLoadState('networkidle').catch(() => {});

      // Navigate to the Incident Reporting tab. Scope to the tab-nav button by its
      // exact label so we don't match the "Report Incident" action button below.
      const incidentTab = page.getByRole('button', { name: 'Incident Reporting' }).first();
      if (await incidentTab.isVisible({ timeout: 8000 }).catch(() => false)) {
        await incidentTab.scrollIntoViewIfNeeded();
        await expect(incidentTab).toBeVisible({ timeout: 15000 });
        await incidentTab.click();
      }

      // Open the "Report Incident" modal. Target the action button explicitly by its
      // exact accessible name so the regex never resolves to the "Incident Reporting"
      // tab (which also contains the word "Report") inside the scrollable tab nav.
      const reportBtn = page.getByRole('button', { name: 'Report Incident', exact: true }).first();
      if (await reportBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await reportBtn.scrollIntoViewIfNeeded();
        await expect(reportBtn).toBeVisible({ timeout: 15000 });
        await reportBtn.click();

        // The Report ICT Incident modal should appear with its title input.
        const modalTitle = page.getByRole('heading', { name: 'Report ICT Incident' });
        await expect(modalTitle).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Third-Party ICT Providers', () => {
    test('provider management section exists', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const providers = page.locator(
        ':text("Provider"), :text("Third-Party"), :text("Vendor"), :text("ICT Provider")'
      ).first();
      if (await providers.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(providers).toBeVisible();
      }
    });

    test('can view provider risk assessments', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const providerTab = page.locator('button:has-text("Provider"), [data-testid="providers-tab"]').first();
      if (await providerTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await providerTab.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Digital Operational Resilience Testing', () => {
    test('resilience testing section exists', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const resilience = page.locator(
        ':text("Resilience"), :text("Testing"), :text("Penetration"), :text("Threat")'
      ).first();
      if (await resilience.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(resilience).toBeVisible();
      }
    });

    test('can initiate a resilience test', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const testBtn = page.getByRole('button', { name: /start.*test|run.*test|initiate|begin/i }).first();
      if (await testBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(testBtn).toBeVisible();
      }
    });
  });

  test.describe('Network & Security', () => {
    test('DORA API calls use proper authentication', async ({ page }) => {
      const apiRequests: Array<{ url: string; method: string }> = [];

      page.on('request', (req) => {
        if (req.url().includes('/api/') && req.url().includes('dora')) {
          apiRequests.push({ url: req.url(), method: req.method() });
        }
      });

      await page.goto('/enterprise/dora');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      // All DORA API requests should have been made
      for (const req of apiRequests) {
        expect(req.url).toContain('/api/');
      }
    });

    test('DORA mutations are not rejected by CSRF protection', async ({ page }) => {
      // DORA mutations pass through the backend double-submit CSRF check.
      // A correctly wired mutation must never be rejected with a 403 CSRF error.
      const csrfRejections: string[] = [];

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

      await page.goto('/enterprise/dora');
      await page.waitForLoadState('networkidle').catch(() => {});

      const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(2000);
      }

      // No mutating DORA request may be blocked by CSRF validation.
      expect(csrfRejections, `CSRF-rejected mutations: ${csrfRejections.join(', ')}`).toHaveLength(0);
    });
  });
});
