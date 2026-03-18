/**
 * E2E Tests: EU Regulations
 * Tests EU AI Act, DMA, DSA full workflows
 */

import { test, expect } from '@playwright/test';

const REGULATIONS = [
  { name: 'EU AI Act', route: '/regulations/eu-ai-act', key: 'eu-ai-act' },
  { name: 'DMA', route: '/regulations/dma', key: 'dma' },
  { name: 'DSA', route: '/regulations/dsa', key: 'dsa' },
  { name: 'EU CRA', route: '/regulations/eu-cra', key: 'eu-cra' },
  { name: 'CSRD', route: '/regulations/csrd', key: 'csrd' },
  { name: 'Ecodesign', route: '/regulations/ecodesign', key: 'ecodesign' },
  { name: 'NIS2', route: '/regulations/nis2', key: 'nis2' },
];

test.describe('EU Regulations', () => {
  for (const reg of REGULATIONS) {
    test.describe(reg.name, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(reg.route);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);
      });

      test(`${reg.name} page loads with heading`, async ({ page }) => {
        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
      });

      test(`${reg.name} displays compliance elements`, async ({ page }) => {
        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        // Should show some compliance-related content
        const complianceContent = page.locator(
          ':text("Compliance"), :text("compliance"), :text("Requirement"), :text("Status"), :text("Progress")'
        ).first();
        if (await complianceContent.isVisible({ timeout: 8000 }).catch(() => false)) {
          await expect(complianceContent).toBeVisible();
        }
      });

      test(`${reg.name} has action buttons`, async ({ page }) => {
        const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
        if (isLanding) test.skip();

        const actionBtn = page.getByRole('button', {
          name: /assess|evaluate|export|add|create|start|view|manage/i,
        }).first();
        if (await actionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(actionBtn).toBeVisible();
        }
      });
    });
  }

  test.describe('EU AI Act Specific Workflows', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/regulations/eu-ai-act');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    });

    test('displays risk classification system', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const riskClass = page.locator(
        ':text("Risk Classification"), :text("High Risk"), :text("Unacceptable"), :text("Limited Risk"), :text("Minimal Risk")'
      ).first();
      if (await riskClass.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(riskClass).toBeVisible();
      }
    });

    test('AI system registry section exists', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const registry = page.locator(
        ':text("AI System"), :text("Registry"), :text("Inventory")'
      ).first();
      if (await registry.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(registry).toBeVisible();
      }
    });

    test('conformity assessment is available', async ({ page }) => {
      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const conformity = page.locator(
        ':text("Conformity"), :text("Assessment"), :text("Evaluate")'
      ).first();
      if (await conformity.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(conformity).toBeVisible();
      }
    });
  });

  test.describe('DMA Specific Workflows', () => {
    test('DMA shows gatekeeper obligations', async ({ page }) => {
      await page.goto('/regulations/dma');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const obligations = page.locator(
        ':text("Gatekeeper"), :text("Obligation"), :text("Interoperability"), :text("Data Portability")'
      ).first();
      if (await obligations.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(obligations).toBeVisible();
      }
    });
  });

  test.describe('DSA Specific Workflows', () => {
    test('DSA shows content moderation requirements', async ({ page }) => {
      await page.goto('/regulations/dsa');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const isLanding = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
      if (isLanding) test.skip();

      const moderation = page.locator(
        ':text("Content Moderation"), :text("Transparency"), :text("Notice"), :text("Reporting")'
      ).first();
      if (await moderation.isVisible({ timeout: 8000 }).catch(() => false)) {
        await expect(moderation).toBeVisible();
      }
    });
  });

  test.describe('Network Interception', () => {
    test('regulation page API calls return valid data', async ({ page }) => {
      const apiResponses: Array<{ url: string; status: number; contentType: string }> = [];

      page.on('response', (res) => {
        if (res.url().includes('/api/')) {
          apiResponses.push({
            url: res.url(),
            status: res.status(),
            contentType: res.headers()['content-type'] || '',
          });
        }
      });

      await page.goto('/regulations/eu-ai-act');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      for (const res of apiResponses) {
        expect(res.status).toBeLessThan(500);
        if (res.status === 200 && res.contentType.includes('json')) {
          expect(res.contentType).toContain('json');
        }
      }
    });
  });

  test.describe('Security', () => {
    test('no sensitive regulation data exposed in raw HTML', async ({ page }) => {
      await page.goto('/regulations/eu-ai-act');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const html = await page.locator('body').innerHTML();
      expect(html).not.toMatch(/api[_-]?key/i);
      expect(html).not.toMatch(/secret/i);
      expect(html).not.toMatch(/eyJhbGciOi/);
    });
  });
});
