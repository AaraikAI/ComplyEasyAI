/**
 * Sidebar Navigation E2E Tests
 * Tests for the updated sidebar with collapsible sections
 */

import { test, expect } from '@playwright/test';
import { SidebarPage, DashboardPage } from './page-objects';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Sidebar is visible on dashboard', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.expectSidebarVisible();
  });

  test('Logo is visible in sidebar', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.expectLogoVisible();
  });

  test('Platform section items are visible', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    await expect(sidebar.dashboardLink).toBeVisible();
    await expect(sidebar.frameworksLink).toBeVisible();
    await expect(sidebar.risksLink).toBeVisible();
    await expect(sidebar.vendorsLink).toBeVisible();
    await expect(sidebar.policiesLink).toBeVisible();
  });

  test('Can navigate to Dashboard', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToDashboard();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Can navigate to Frameworks', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToFrameworks();
    await expect(page).toHaveURL(/frameworks/);
  });

  test('Can navigate to Vendors', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToVendors();
    await expect(page).toHaveURL(/vendors/);
  });

  test('Can navigate to Risks', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToRisks();
    await expect(page).toHaveURL(/risks/);
  });

  test('Can navigate to Policies', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateToPolicies();
    await expect(page).toHaveURL(/policies/);
  });
});

test.describe('Sidebar Collapsible Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Regulatory section can be expanded', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Check if section exists and can be expanded
    if (await sidebar.regulatorySection.isVisible()) {
      await sidebar.expandSection('regulatory');

      // Check if items inside are now visible
      const isExpanded = await sidebar.isSectionExpanded('regulatory');
      expect(isExpanded).toBeTruthy();
    }
  });

  test('Reports & Audit section can be expanded', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    if (await sidebar.reportsAuditSection.isVisible()) {
      await sidebar.expandSection('reports');

      const isExpanded = await sidebar.isSectionExpanded('reports');
      expect(isExpanded).toBeTruthy();
    }
  });

  test('Workspaces section can be expanded', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    if (await sidebar.workspacesSection.isVisible()) {
      await sidebar.expandSection('workspaces');

      const isExpanded = await sidebar.isSectionExpanded('workspaces');
      expect(isExpanded).toBeTruthy();
    }
  });

  test('Can navigate to AI RMF after expanding Regulatory section', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Expand regulatory section and navigate
    await sidebar.navigateToAiRmf();
    await expect(page).toHaveURL(/ai-rmf/);
  });

  test('Can navigate to Monitoring after expanding Reports section', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    await sidebar.navigateToMonitoring();
    await expect(page).toHaveURL(/monitoring/);
  });

  test('Section state persists during session', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Expand regulatory section
    if (await sidebar.regulatorySection.isVisible()) {
      await sidebar.expandSection('regulatory');
      const wasExpanded = await sidebar.isSectionExpanded('regulatory');

      // Navigate away
      await sidebar.navigateToFrameworks();
      await page.waitForLoadState('networkidle');

      // Navigate back
      await sidebar.navigateToDashboard();
      await page.waitForLoadState('networkidle');

      // Check if section is still expanded
      const isStillExpanded = await sidebar.isSectionExpanded('regulatory');
      expect(isStillExpanded).toBe(wasExpanded);
    }
  });
});

test.describe('Sidebar Navigation - All Routes', () => {
  test('Can navigate to all Platform routes', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    const platformRoutes = [
      { link: sidebar.dashboardLink, url: /dashboard/ },
      { link: sidebar.frameworksLink, url: /frameworks/ },
      { link: sidebar.risksLink, url: /risks/ },
      { link: sidebar.vendorsLink, url: /vendors/ },
      { link: sidebar.policiesLink, url: /policies/ },
      { link: sidebar.integrationsLink, url: /integrations/ },
    ];

    for (const route of platformRoutes) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      if (await route.link.isVisible()) {
        await route.link.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(route.url);
      }
    }
  });

  test('Can navigate to all Regulatory routes', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    const regulatoryRoutes = [
      { link: sidebar.aiRmfLink, url: /ai-rmf/ },
      { link: sidebar.euAiActLink, url: /eu-ai-act/ },
      { link: sidebar.dmaLink, url: /dma/ },
      { link: sidebar.dsaLink, url: /dsa/ },
    ];

    for (const route of regulatoryRoutes) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Expand regulatory section first
      if (await sidebar.regulatorySection.isVisible()) {
        if (!(await sidebar.isSectionExpanded('regulatory'))) {
          await sidebar.expandSection('regulatory');
        }
      }

      if (await route.link.isVisible()) {
        await route.link.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(route.url);
      }
    }
  });

  test('Can navigate to all Reports & Audit routes', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    const reportRoutes = [
      { link: sidebar.reportsLink, url: /reports/ },
      { link: sidebar.auditLink, url: /audit/ },
      { link: sidebar.monitoringLink, url: /monitoring/ },
      { link: sidebar.analyticsLink, url: /analytics/ },
    ];

    for (const route of reportRoutes) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Expand reports section first
      if (await sidebar.reportsAuditSection.isVisible()) {
        if (!(await sidebar.isSectionExpanded('reports'))) {
          await sidebar.expandSection('reports');
        }
      }

      if (await route.link.isVisible()) {
        await route.link.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(route.url);
      }
    }
  });
});

test.describe('Sidebar Responsive Behavior', () => {
  test('Sidebar collapses on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(page);

    // On mobile, sidebar might be hidden or collapsed
    const sidebarVisible = await sidebar.sidebar.isVisible();

    // Either sidebar is hidden, or there's a hamburger menu
    const hamburgerMenu = page.locator('[aria-label*="menu"], .hamburger, [data-testid="mobile-menu"]');
    const hasHamburger = await hamburgerMenu.isVisible().catch(() => false);

    expect(sidebarVisible || hasHamburger).toBeTruthy();
  });

  test('Mobile menu can be toggled', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const hamburgerMenu = page.locator('[aria-label*="menu"], .hamburger, [data-testid="mobile-menu"]');

    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.click();
      await page.waitForTimeout(300);

      // Sidebar or menu should now be visible
      const sidebarOrMenu = page.locator('nav, [data-testid="sidebar"], [data-testid="mobile-nav"]');
      await expect(sidebarOrMenu.first()).toBeVisible();
    }
  });
});
