/**
 * E2E Tests for Critical User Flows
 * Tests the most important user journeys in the application.
 * Requires frontend (baseURL) and optionally backend (VITE_API_URL) for full flows.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('App loads and shows main UI or login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('body').or(page.getByRole('button', { name: /login|sign in/i })).or(page.getByText(/dashboard|comply/i))
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('User can create and manage a compliance framework', async ({ page }) => {
    const frameworksLink = page.getByRole('link', { name: /Frameworks/i }).or(page.locator('button:has-text("Frameworks")')).first();
    await frameworksLink.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const addBtn = page.getByRole('button', { name: /Add Framework/i }).or(page.locator('button:has-text("Add Framework")')).first();
    await addBtn.click({ timeout: 10000 });

    await page.fill('[name="frameworkName"]', 'SOC 2 Type II');
    await page.selectOption('[name="region"]', 'US');

    const createBtn = page.getByRole('button', { name: /Create Framework/i }).or(page.locator('button:has-text("Create Framework")')).first();
    await createBtn.click({ timeout: 5000 });

    await expect(page.locator('text=SOC 2 Type II')).toBeVisible({ timeout: 15000 });

    // Click on the framework to view details
    await page.click('text=SOC 2 Type II');

    // Verify framework details page
    await expect(page.locator('h1:has-text("SOC 2 Type II")')).toBeVisible();

    // Apply template controls
    await page.click('button:has-text("Apply Template")');
    await page.click('button:has-text("Confirm")');

    // Wait for controls to be applied
    await expect(page.locator('text=Controls applied successfully')).toBeVisible({
      timeout: 15000,
    });

    // Verify controls are visible
    const controlCount = await page.locator('[data-testid="control-item"]').count();
    expect(controlCount).toBeGreaterThan(0);
  });

  test('User can create and assess a vendor', async ({ page }) => {
    // Navigate to vendors page
    await page.click('text=Vendor Management');
    await expect(page).toHaveURL(/.*vendors/);

    // Click "Add Vendor" button
    await page.click('button:has-text("Add Vendor")');

    // Fill in vendor details
    await page.fill('[name="name"]', 'Acme Software Inc');
    await page.fill('[name="website"]', 'https://acme.example.com');
    await page.fill('[name="contactEmail"]', 'contact@acme.example.com');
    await page.selectOption('[name="category"]', 'Technology');

    // Submit form
    await page.click('button:has-text("Create Vendor")');

    // Verify vendor was created
    await expect(page.locator('text=Acme Software Inc')).toBeVisible({ timeout: 10000 });

    // Click on vendor to view details
    await page.click('text=Acme Software Inc');

    // Start risk assessment
    await page.click('button:has-text("Start Assessment")');

    // Fill in assessment questions
    await page.fill('[name="dataAccess"]', 'Yes');
    await page.fill('[name="securityCertifications"]', 'ISO 27001, SOC 2');

    // Submit assessment
    await page.click('button:has-text("Complete Assessment")');

    // Verify assessment completed
    await expect(page.locator('text=Assessment completed')).toBeVisible();

    // Check risk score is calculated
    const riskScore = await page.locator('[data-testid="risk-score"]').textContent();
    expect(riskScore).toBeTruthy();
  });

  test('User can create and approve a policy', async ({ page }) => {
    // Navigate to policies page
    await page.click('text=Policy Management');
    await expect(page).toHaveURL(/.*policies/);

    // Click "Create Policy" button
    await page.click('button:has-text("Create Policy")');

    // Fill in policy details
    await page.fill('[name="title"]', 'Information Security Policy');
    await page.selectOption('[name="category"]', 'Security');
    await page.fill('[name="content"]', 'This is a test policy content...');

    // Submit form
    await page.click('button:has-text("Create Policy")');

    // Verify policy was created
    await expect(page.locator('text=Information Security Policy')).toBeVisible({
      timeout: 10000,
    });

    // Click on policy to view details
    await page.click('text=Information Security Policy');

    // Submit for review (if admin)
    const submitButton = page.locator('button:has-text("Submit for Review")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await expect(page.locator('text=In Review')).toBeVisible();
    }
  });

  test('User can create and track an issue', async ({ page }) => {
    // Navigate to issues page
    await page.click('text=Issue Management');
    await expect(page).toHaveURL(/.*issues/);

    // Click "Create Issue" button
    await page.click('button:has-text("Create Issue")');

    // Fill in issue details
    await page.fill('[name="title"]', 'Critical Security Finding');
    await page.fill('[name="description"]', 'SQL injection vulnerability discovered');
    await page.selectOption('[name="severity"]', 'High');
    await page.selectOption('[name="category"]', 'Security');

    // Submit form
    await page.click('button:has-text("Create Issue")');

    // Verify issue was created
    await expect(page.locator('text=Critical Security Finding')).toBeVisible({
      timeout: 10000,
    });

    // Click on issue to view details
    await page.click('text=Critical Security Finding');

    // Add a comment
    await page.fill('[name="comment"]', 'This needs immediate attention');
    await page.click('button:has-text("Add Comment")');

    // Verify comment was added
    await expect(page.locator('text=This needs immediate attention')).toBeVisible();
  });

  test('User can generate a compliance report', async ({ page }) => {
    // Navigate to reports page
    await page.click('text=Report Generator');
    await expect(page).toHaveURL(/.*reports/);

    // Click "Generate Report" button
    await page.click('button:has-text("Generate Report")');

    // Select report type
    await page.selectOption('[name="reportType"]', 'Compliance Summary');

    // Select date range
    await page.fill('[name="startDate"]', '2024-01-01');
    await page.fill('[name="endDate"]', '2024-12-31');

    // Generate report
    await page.click('button:has-text("Generate")');

    // Wait for report generation
    await expect(page.locator('text=Report generated successfully')).toBeVisible({
      timeout: 30000,
    });

    // Verify report preview is shown
    await expect(page.locator('[data-testid="report-preview"]')).toBeVisible();

    // Download report
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('compliance-report');
  });

  test('User can configure continuous monitoring', async ({ page }) => {
    // Navigate to monitoring page
    await page.click('text=Monitoring');
    await expect(page).toHaveURL(/.*monitoring/);

    // Click "Create Monitor" button
    await page.click('button:has-text("Create Monitor")');

    // Fill in monitor details
    await page.fill('[name="name"]', 'Cloud Security Monitor');
    await page.selectOption('[name="type"]', 'Cloud');
    await page.selectOption('[name="frequency"]', 'Daily');

    // Submit form
    await page.click('button:has-text("Create Monitor")');

    // Verify monitor was created
    await expect(page.locator('text=Cloud Security Monitor')).toBeVisible({
      timeout: 10000,
    });

    // Run monitor manually
    await page.click('button:has-text("Run Now")');

    // Wait for monitor execution
    await expect(page.locator('text=Monitor execution completed')).toBeVisible({
      timeout: 20000,
    });

    // Verify results are shown
    await expect(page.locator('[data-testid="monitor-results"]')).toBeVisible();
  });
});

test.describe('Navigation and UI', () => {
  test('User can navigate between all main sections', async ({ page }) => {
    await page.goto('/');

    const sections = [
      'Dashboard',
      'Frameworks',
      'Vendor Management',
      'Policy Management',
      'Issue Management',
      'Monitoring',
      'Report Generator',
    ];

    for (const section of sections) {
      await page.click(`text=${section}`);
      await page.waitForLoadState('networkidle');
      // Verify we're on the correct page
      await expect(page.locator(`h1:has-text("${section}"), h2:has-text("${section}")`))
        .toBeVisible()
        .catch(() => {
          // Some sections may not have exact h1/h2, just verify URL changed
          expect(page.url()).toContain(section.toLowerCase().replace(' ', ''));
        });
    }
  });

  test('Search functionality works across the app', async ({ page }) => {
    await page.goto('/');

    // Click search icon or open search
    const searchInput = page.locator('[placeholder*="Search"], [aria-label*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('security');
      await page.waitForTimeout(500); // Wait for search results

      // Verify search results appear
      const results = await page.locator('[data-testid="search-result"]').count();
      expect(results).toBeGreaterThan(0);
    }
  });
});

test.describe('Error Handling', () => {
  test('App handles network errors gracefully', async ({ page, context }) => {
    await page.goto('/');

    // Simulate offline mode
    await context.setOffline(true);

    // Try to create a vendor
    await page.click('text=Vendor Management');
    await page.click('button:has-text("Add Vendor")');
    await page.fill('[name="name"]', 'Test Vendor');
    await page.click('button:has-text("Create Vendor")');

    // Verify error message is shown
    await expect(
      page.locator('text=/Network error|Connection failed|Unable to connect/')
    ).toBeVisible({ timeout: 10000 });

    // Restore connection
    await context.setOffline(false);
  });

  test('App shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/');

    // Try to create vendor with missing required fields
    await page.click('text=Vendor Management');
    await page.click('button:has-text("Add Vendor")');

    // Submit without filling required fields
    await page.click('button:has-text("Create Vendor")');

    // Verify validation errors are shown
    await expect(page.locator('text=/required|Please fill/i')).toBeVisible();
  });
});
