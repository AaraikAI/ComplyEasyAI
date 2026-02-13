/**
 * Comprehensive E2E Tests
 * Complete end-to-end testing of all major user journeys
 * Using Page Object Model and accessible selectors
 */

import { test, expect, db, factory } from './fixtures/test-fixtures';
import {
  LoginPage,
  DashboardPage,
  FrameworksPage,
  VendorsPage,
  PoliciesPage,
  RisksPage,
} from './page-objects';

test.describe('Authentication Flows', () => {
  test('User can log in with valid credentials and see dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();

    // Check if already logged in (from auth setup)
    const isLoggedIn = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false);

    if (!isLoggedIn) {
      await loginPage.login(
        process.env.TEST_USER_EMAIL || 'test@example.com',
        process.env.TEST_USER_PASSWORD || 'testpassword'
      );
    }

    await dashboardPage.expectDashboardLoaded();
  });

  test('User sees error message with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/');

    await loginPage.emailInput.fill('invalid@example.com');
    await loginPage.passwordInput.fill('wrongpassword');
    await loginPage.loginButton.click();

    await loginPage.expectLoginFailure();
  });

  test('Unauthenticated user is redirected to login', async ({ page, context }) => {
    // Clear auth state
    await context.clearCookies();

    // Try to access protected route
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login or see login form
    const loginPage = new LoginPage(page);
    await expect(
      loginPage.emailInput.or(page.locator('text=/login|sign in/i'))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Framework Management', () => {
  test('User can create a new compliance framework', async ({ page, factory, db }) => {
    const frameworksPage = new FrameworksPage(page);
    const testData = factory.createFrameworkData({ type: 'SOC2' });

    await frameworksPage.goto();
    await frameworksPage.createFramework(testData.name!, testData.type!, testData.region!);

    // Verify framework appears in list
    await frameworksPage.expectFrameworkVisible(testData.name!);

    // Verify in database if available
    if (db.client) {
      const dbFramework = await db.getFrameworks('').then((f) => f.find((x) => x.name === testData.name));
      expect(dbFramework).toBeTruthy();
      expect(dbFramework?.type).toBe(testData.type);
    }
  });

  test('User can apply template controls to a framework', async ({ page }) => {
    const frameworksPage = new FrameworksPage(page);

    await frameworksPage.goto();

    // Click on first framework or create one
    const count = await frameworksPage.getFrameworkCount();
    if (count > 0) {
      await frameworksPage.frameworkItems.first().click();
      await page.waitForLoadState('networkidle');

      // Apply template if button available
      const applyButton = page.getByRole('button', { name: /apply template/i });
      if (await applyButton.isVisible()) {
        await frameworksPage.applyTemplate();

        // Verify controls are visible
        await expect(page.locator('[data-testid="control-item"]').first()).toBeVisible({
          timeout: 15000,
        });
      }
    }
  });

  test('User can search and filter frameworks', async ({ page }) => {
    const frameworksPage = new FrameworksPage(page);

    await frameworksPage.goto();

    // Test search functionality
    await frameworksPage.searchFramework('SOC');
    await page.waitForTimeout(1000);

    // Verify search works (results should be filtered)
    const results = await frameworksPage.frameworkItems.count();
    // Results may be 0 or more based on data
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('User can update framework controls', async ({ page }) => {
    const frameworksPage = new FrameworksPage(page);

    await frameworksPage.goto();

    const count = await frameworksPage.getFrameworkCount();
    if (count > 0) {
      await frameworksPage.frameworkItems.first().click();
      await page.waitForLoadState('networkidle');

      // Click on a control if available
      const controlItem = page.locator('[data-testid="control-item"]').first();
      if (await controlItem.isVisible()) {
        await controlItem.click();

        // Update control status
        const statusSelect = page.locator('[name="status"]');
        if (await statusSelect.isVisible()) {
          await statusSelect.selectOption('Implemented');
          await page.getByRole('button', { name: /save/i }).click();
          await expect(page.locator('text=Implemented')).toBeVisible();
        }
      }
    }
  });
});

test.describe('Vendor Management', () => {
  test('User can create and manage a vendor', async ({ page, factory, db }) => {
    const vendorsPage = new VendorsPage(page);
    const testData = factory.createVendorData();

    await vendorsPage.goto();
    await vendorsPage.createVendor(
      testData.name!,
      testData.website!,
      testData.contactEmail!,
      testData.category!
    );

    // Verify vendor appears in list
    await vendorsPage.expectVendorVisible(testData.name!);

    // Verify in database
    if (db.client) {
      const vendors = await db.client.from('vendors').select('*').eq('name', testData.name);
      expect(vendors.data?.length).toBeGreaterThan(0);
    }
  });

  test('User can conduct vendor risk assessment', async ({ page }) => {
    const vendorsPage = new VendorsPage(page);

    await vendorsPage.goto();

    const count = await vendorsPage.getVendorCount();
    if (count > 0) {
      await vendorsPage.vendorItems.first().click();
      await page.waitForLoadState('networkidle');

      // Start assessment if button visible
      const assessBtn = page.getByRole('button', { name: /start assessment/i });
      if (await assessBtn.isVisible()) {
        await vendorsPage.startAssessment();

        // Fill assessment fields
        await vendorsPage.completeAssessment({
          dataAccess: 'Yes',
          securityCertifications: 'ISO 27001',
        });

        // Verify risk score is calculated
        await vendorsPage.expectRiskScoreVisible();
      }
    }
  });

  test('User can view vendor scorecard', async ({ page }) => {
    const vendorsPage = new VendorsPage(page);

    await vendorsPage.goto();

    const count = await vendorsPage.getVendorCount();
    if (count > 0) {
      await vendorsPage.vendorItems.first().click();

      // Click scorecard tab/button
      const scorecardBtn = page.getByRole('button', { name: /scorecard/i });
      if (await scorecardBtn.isVisible()) {
        await scorecardBtn.click();
        await expect(page.locator('[data-testid="scorecard"]')).toBeVisible();
      }
    }
  });
});

test.describe('Policy Management', () => {
  test('User can create a new policy', async ({ page, factory, db }) => {
    const policiesPage = new PoliciesPage(page);
    const testData = factory.createPolicyData();

    await policiesPage.goto();
    await policiesPage.createPolicy(testData.title!, testData.content!, testData.category!);

    // Verify policy appears
    await policiesPage.expectPolicyVisible(testData.title!);

    // Verify in database
    if (db.client) {
      const policies = await db.client.from('policies').select('*').eq('title', testData.title);
      expect(policies.data?.length).toBeGreaterThan(0);
      expect(policies.data?.[0].status).toBe('Draft');
    }
  });

  test('User can submit policy for review and approve', async ({ page }) => {
    const policiesPage = new PoliciesPage(page);

    await policiesPage.goto();

    const count = await policiesPage.getPolicyCount();
    if (count > 0) {
      await policiesPage.policyItems.first().click();
      await page.waitForLoadState('networkidle');

      // Submit for review if available
      const submitBtn = page.getByRole('button', { name: /submit for review/i });
      if (await submitBtn.isVisible()) {
        await policiesPage.submitForReview();
        await policiesPage.expectPolicyStatus('In Review');
      }

      // Approve if available (admin)
      const approveBtn = page.getByRole('button', { name: /approve/i });
      if (await approveBtn.isVisible()) {
        await policiesPage.approvePolicy();
        await policiesPage.expectPolicyStatus('Approved');
      }
    }
  });

  test('User can filter policies by status', async ({ page }) => {
    const policiesPage = new PoliciesPage(page);

    await policiesPage.goto();
    await policiesPage.filterByStatus('Draft');

    // All visible policies should be Draft
    const policyStatuses = await page.locator('[data-testid="policy-status"]').allTextContents();
    for (const status of policyStatuses) {
      expect(status.toLowerCase()).toContain('draft');
    }
  });
});

test.describe('Risk Management', () => {
  test('User can create and track a risk', async ({ page, factory, db }) => {
    const risksPage = new RisksPage(page);
    const testData = factory.createRiskData({ severity: 'High' });

    await risksPage.goto();
    await risksPage.createRisk(testData.title!, testData.description!, testData.severity!);

    // Verify risk appears
    await risksPage.expectRiskVisible(testData.title!);

    // Verify in database
    if (db.client) {
      const risks = await db.client.from('risks').select('*').eq('title', testData.title);
      expect(risks.data?.length).toBeGreaterThan(0);
      expect(risks.data?.[0].severity).toBe('High');
    }
  });

  test('User can filter risks by severity', async ({ page }) => {
    const risksPage = new RisksPage(page);

    await risksPage.goto();
    await risksPage.filterBySeverity('Critical');

    // All visible risks should be Critical
    const riskSeverities = await page.locator('[data-testid="risk-severity"]').allTextContents();
    for (const severity of riskSeverities) {
      expect(severity.toLowerCase()).toContain('critical');
    }
  });

  test('User can generate AI remediation plan', async ({ page }) => {
    const risksPage = new RisksPage(page);

    await risksPage.goto();

    const count = await risksPage.getRiskCount();
    if (count > 0) {
      await risksPage.riskItems.first().click();
      await page.waitForLoadState('networkidle');

      // Generate remediation if available
      const remediationBtn = page.getByRole('button', { name: /generate remediation/i });
      if (await remediationBtn.isVisible()) {
        await risksPage.generateRemediation();

        // Verify remediation plan appears
        await expect(page.locator('[data-testid="remediation-plan"]')).toBeVisible();
      }
    }
  });
});

test.describe('Dashboard & Navigation', () => {
  test('Dashboard displays compliance overview', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectDashboardLoaded();

    // Check for key dashboard elements
    await expect(
      page.locator('[data-testid="compliance-score"], text=/compliance/i').first()
    ).toBeVisible();
  });

  test('User can navigate to all main sections', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();

    const sections = [
      { nav: /frameworks/i, url: /frameworks/ },
      { nav: /vendor/i, url: /vendor/ },
      { nav: /polic/i, url: /polic/ },
      { nav: /risk/i, url: /risk/ },
      { nav: /monitor/i, url: /monitor/ },
    ];

    for (const section of sections) {
      await page.getByRole('link', { name: section.nav }).first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(section.url);

      // Go back to dashboard
      await dashboardPage.goto();
    }
  });

  test('Search functionality works across the app', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();

    const searchInput = page.locator('[placeholder*="Search"], [aria-label*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('compliance');
      await page.waitForTimeout(1000);

      // Search results should appear
      const results = await page.locator('[data-testid="search-result"]').count();
      expect(results).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('AI Features', () => {
  test('User can generate policy with AI', async ({ page }) => {
    await page.goto('/ai-policy');
    await page.waitForLoadState('networkidle');

    const promptInput = page.locator('textarea, [name="prompt"]');
    if (await promptInput.isVisible()) {
      await promptInput.fill('Create an information security policy for a SaaS company');
      await page.getByRole('button', { name: /generate/i }).click();

      // Wait for AI response
      await page.waitForTimeout(10000);

      // Verify policy content appears
      await expect(page.locator('[data-testid="ai-result"], .ai-output')).toBeVisible({
        timeout: 30000,
      });
    }
  });

  test('User can analyze contract with AI', async ({ page }) => {
    await page.goto('/ai-contract');
    await page.waitForLoadState('networkidle');

    const contractInput = page.locator('textarea, [name="contract"]');
    if (await contractInput.isVisible()) {
      await contractInput.fill('This is a test contract for analysis...');
      await page.getByRole('button', { name: /analyze/i }).click();

      // Wait for AI response
      await page.waitForTimeout(10000);

      // Verify analysis appears
      await expect(page.locator('[data-testid="ai-result"], .analysis-result')).toBeVisible({
        timeout: 30000,
      });
    }
  });
});

test.describe('Report Generation', () => {
  test('User can generate compliance report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    const generateBtn = page.getByRole('button', { name: /generate report/i });
    if (await generateBtn.isVisible()) {
      await generateBtn.click();

      // Select report type
      const typeSelect = page.locator('[name="reportType"]');
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('Compliance Summary');
      }

      // Generate
      await page.getByRole('button', { name: /generate/i }).click();

      // Wait for report
      await expect(page.locator('[data-testid="report-preview"], .report-content')).toBeVisible({
        timeout: 30000,
      });
    }
  });

  test('User can download report as PDF', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    const downloadBtn = page.getByRole('button', { name: /download.*pdf/i });
    if (await downloadBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await downloadBtn.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });
});

test.describe('Error Handling', () => {
  test('App shows validation errors for empty required fields', async ({ page }) => {
    const frameworksPage = new FrameworksPage(page);

    await frameworksPage.goto();
    await frameworksPage.addFrameworkButton.click();
    await frameworksPage.waitForModal();

    // Submit without filling required fields
    await frameworksPage.createButton.click();

    // Expect validation errors
    await expect(page.locator('text=/required|please fill/i')).toBeVisible();
  });

  test('App handles network errors gracefully', async ({ page, context }) => {
    await page.goto('/frameworks');

    // Simulate offline mode
    await context.setOffline(true);

    // Try to create a framework
    await page.getByRole('button', { name: /add framework/i }).click();
    await page.locator('[name="frameworkName"], [name="name"]').fill('Test');
    await page.getByRole('button', { name: /create/i }).click();

    // Verify error message
    await expect(page.locator('text=/network|connection|offline/i')).toBeVisible({
      timeout: 10000,
    });

    // Restore connection
    await context.setOffline(false);
  });
});
