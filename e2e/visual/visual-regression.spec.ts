/**
 * Visual Regression Tests
 * Screenshot-based visual testing for all major pages
 */

import { test, expect } from '@playwright/test';

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

test.describe('Visual Regression - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations and SVG rendering
  });

  test('Dashboard - Desktop view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [
        page.locator('.timestamp'),
        page.locator('[data-testid="current-time"]'),
        page.locator('.user-avatar'),
        page.locator('h1:has-text("Good")'), // Mask time-based greeting
        page.locator('text=/\\d{1,2}.*\\d{4}/'), // Mask date
      ],
    });
  });

  test('Dashboard - Tablet view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      maxDiffPixelRatio: 0.05,
      mask: [
        page.locator('.timestamp'),
        page.locator('.user-avatar'),
        page.locator('h1:has-text("Good")'),
      ],
    });
  });

  test('Dashboard - Mobile view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixelRatio: 0.05,
      mask: [
        page.locator('.timestamp'),
        page.locator('.user-avatar'),
        page.locator('h1:has-text("Good")'),
      ],
    });
  });

  test('Dashboard - Welcome Banner', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Capture just the welcome banner
    const welcomeBanner = page.locator('.bg-gradient-to-br').first();
    if (await welcomeBanner.isVisible()) {
      await expect(welcomeBanner).toHaveScreenshot('welcome-banner.png', {
        maxDiffPixelRatio: 0.05,
        mask: [page.locator('h1:has-text("Good")'), page.locator('text=/\\d{1,2}.*\\d{4}/')],
      });
    }
  });

  test('Dashboard - Compliance Score Ring', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Capture compliance score card with SVG ring
    const scoreCard = page.locator('[data-onboarding="compliance-score"]');
    if (await scoreCard.isVisible()) {
      await expect(scoreCard).toHaveScreenshot('compliance-score-ring.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });

  test('Dashboard - Quick Actions dropdown', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Open quick actions dropdown
    const quickActionsBtn = page.getByRole('button', { name: /quick actions/i });
    if (await quickActionsBtn.isVisible()) {
      await quickActionsBtn.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('quick-actions-dropdown.png', {
        maxDiffPixelRatio: 0.05,
        mask: [page.locator('h1:has-text("Good")')],
      });
    }
  });
});

test.describe('Visual Regression - Frameworks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Frameworks list - Desktop view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await expect(page).toHaveScreenshot('frameworks-list-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.timestamp'), page.locator('.date')],
    });
  });

  test('Frameworks list - Mobile view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(page).toHaveScreenshot('frameworks-list-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Framework create modal', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Open create modal
    const addBtn = page.getByRole('button', { name: /add framework/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('framework-create-modal.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });
});

test.describe('Visual Regression - Vendors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Vendors list - Desktop view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await expect(page).toHaveScreenshot('vendors-list-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.timestamp'), page.locator('.date')],
    });
  });

  test('Vendors list - Mobile view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(page).toHaveScreenshot('vendors-list-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Visual Regression - Policies', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/policies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Policies list - Desktop view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await expect(page).toHaveScreenshot('policies-list-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.timestamp'), page.locator('.date')],
    });
  });

  test('Policies list - Tablet view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await expect(page).toHaveScreenshot('policies-list-tablet.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Visual Regression - Risks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/risks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Risks list - Desktop view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await expect(page).toHaveScreenshot('risks-list-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.timestamp'), page.locator('.date')],
    });
  });

  test('Risks list - Mobile view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await expect(page).toHaveScreenshot('risks-list-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Visual Regression - AI Features', () => {
  test('AI Policy Generator - Desktop view', async ({ page }) => {
    await page.goto('/ai-policy');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    await expect(page).toHaveScreenshot('ai-policy-desktop.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('AI Contract Analyzer - Desktop view', async ({ page }) => {
    await page.goto('/ai-contract');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    await expect(page).toHaveScreenshot('ai-contract-desktop.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('AI Gap Analysis - Desktop view', async ({ page }) => {
    await page.goto('/ai-gap');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    await expect(page).toHaveScreenshot('ai-gap-analysis-desktop.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Visual Regression - Enterprise Features', () => {
  test('Monitoring Dashboard - Desktop view', async ({ page }) => {
    await page.goto('/monitoring');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    await expect(page).toHaveScreenshot('monitoring-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.timestamp'), page.locator('.live-data')],
    });
  });

  test('Analytics Dashboard - Desktop view', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    await expect(page).toHaveScreenshot('analytics-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.timestamp'), page.locator('.chart')],
    });
  });

  test('Settings Page - Desktop view', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    await expect(page).toHaveScreenshot('settings-desktop.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.user-avatar'), page.locator('[data-testid="email"]')],
    });
  });
});

test.describe('Visual Regression - Interactive States', () => {
  test('Button hover states', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.desktop);

    // Capture button in default state
    const primaryBtn = page.getByRole('button').first();
    if (await primaryBtn.isVisible()) {
      await expect(primaryBtn).toHaveScreenshot('button-default.png');

      // Hover state
      await primaryBtn.hover();
      await expect(primaryBtn).toHaveScreenshot('button-hover.png');
    }
  });

  test('Sidebar navigation states', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.desktop);

    const sidebar = page.locator('nav, [data-testid="sidebar"]');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('sidebar-default.png', {
        mask: [page.locator('.user-avatar')],
      });
    }
  });

  test('Modal dialog appearance', async ({ page }) => {
    await page.goto('/frameworks');
    await page.setViewportSize(VIEWPORTS.desktop);

    const addBtn = page.getByRole('button', { name: /add framework/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal');
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('modal-dialog.png');
      }
    }
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], [aria-label*="dark"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('Dashboard - Dark mode desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Check if dark mode is active
    const isDarkMode = await page.evaluate(() => {
      return (
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark')
      );
    });

    if (isDarkMode) {
      await expect(page).toHaveScreenshot('dashboard-dark-desktop.png', {
        maxDiffPixelRatio: 0.05,
        mask: [page.locator('.timestamp'), page.locator('.user-avatar')],
      });
    }
  });
});

test.describe('Visual Regression - Error States', () => {
  test('404 page appearance', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    // Verify 404 content and screenshot
    const is404 =
      (await page.locator('text=/404|not found/i').isVisible()) ||
      (await page.locator('h1').textContent())?.includes('404');

    if (is404) {
      await expect(page).toHaveScreenshot('404-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });

  test('Empty state appearance', async ({ page }) => {
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize(VIEWPORTS.desktop);

    // If empty state is visible, capture it
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });
});

test.describe('Visual Regression - Responsive Navigation', () => {
  test('Mobile navigation menu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForLoadState('networkidle');

    // Open mobile menu
    const menuBtn = page.locator('[aria-label*="menu"], .hamburger, [data-testid="mobile-menu"]');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('mobile-nav-open.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });

  test('Tablet sidebar collapsed', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tablet-sidebar.png', {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.user-avatar')],
    });
  });
});

test.describe('Visual Regression - Command Palette', () => {
  test('Command Palette - Open state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForLoadState('networkidle');

    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Check if command palette is visible
    const commandPalette = page.locator('.fixed.inset-0').filter({
      has: page.locator('input[placeholder*="Search"], input[placeholder*="command"]'),
    });

    if (await commandPalette.isVisible()) {
      await expect(page).toHaveScreenshot('command-palette-open.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });

  test('Command Palette - Search results', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForLoadState('networkidle');

    // Open and search
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(300);

    const input = page.locator('input[placeholder*="Search"], input[placeholder*="command"]');
    if (await input.isVisible()) {
      await input.fill('frameworks');
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('command-palette-search.png', {
        maxDiffPixelRatio: 0.05,
      });
    }
  });
});

test.describe('Visual Regression - Sidebar Sections', () => {
  test('Sidebar - Platform section', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside, nav, [data-testid="sidebar"]').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('sidebar-platform.png', {
        maxDiffPixelRatio: 0.05,
        mask: [page.locator('.user-avatar')],
      });
    }
  });

  test('Sidebar - Regulatory section expanded', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForLoadState('networkidle');

    // Expand regulatory section
    const regulatoryBtn = page.locator('button:has-text("Regulatory")');
    if (await regulatoryBtn.isVisible()) {
      await regulatoryBtn.click();
      await page.waitForTimeout(300);

      const sidebar = page.locator('aside, nav, [data-testid="sidebar"]').first();
      await expect(sidebar).toHaveScreenshot('sidebar-regulatory-expanded.png', {
        maxDiffPixelRatio: 0.05,
        mask: [page.locator('.user-avatar')],
      });
    }
  });
});
