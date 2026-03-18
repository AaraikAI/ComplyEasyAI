/**
 * Audit Preparation Page Object
 * Covers audit readiness, evidence gaps, audit simulation, control testing
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class AuditPage extends BasePage {
  readonly auditPath = '/audit';
  readonly auditPrepPath = '/audit-prep';
  readonly controlTestingPath = '/control-testing';

  get pageTitle(): Locator {
    return this.page.locator('h1, h2').first();
  }

  // Audit center tabs
  get preparationTab(): Locator {
    return this.page.getByRole('tab', { name: /preparation/i })
      .or(this.page.locator('button:has-text("Preparation")'));
  }

  get testingTab(): Locator {
    return this.page.getByRole('tab', { name: /testing/i })
      .or(this.page.locator('button:has-text("Testing")'));
  }

  get simulatorTab(): Locator {
    return this.page.getByRole('tab', { name: /simulator/i })
      .or(this.page.locator('button:has-text("Simulator")'));
  }

  get auditorTab(): Locator {
    return this.page.getByRole('tab', { name: /auditor/i })
      .or(this.page.locator('button:has-text("Auditor")'));
  }

  // Readiness elements
  get readinessScore(): Locator {
    return this.page.locator('[data-testid="readiness-score"], :text("Readiness"), :text("readiness")').first();
  }

  get evidenceGapsList(): Locator {
    return this.page.locator('[data-testid="evidence-gaps"], :text("Evidence Gap"), table').first();
  }

  get runReadinessCheck(): Locator {
    return this.page.getByRole('button', { name: /run.*check|assess.*readiness|start/i }).first();
  }

  // Control testing
  get addControlButton(): Locator {
    return this.page.getByRole('button', { name: /add.*control|new.*control|create/i }).first();
  }

  get controlsTable(): Locator {
    return this.page.locator('table, [data-testid="controls-table"]');
  }

  get runTestButton(): Locator {
    return this.page.getByRole('button', { name: /run.*test|test.*control|execute/i }).first();
  }

  get testResultsPanel(): Locator {
    return this.page.locator('[data-testid="test-results"], .test-results, :text("Test Results")').first();
  }

  // Audit simulation
  get startSimulationButton(): Locator {
    return this.page.getByRole('button', { name: /start.*simulation|simulate|begin/i }).first();
  }

  get simulationFrameworkSelect(): Locator {
    return this.page.locator('select[name="framework"], [data-testid="framework-select"]');
  }

  get simulationResults(): Locator {
    return this.page.locator('[data-testid="simulation-results"], .simulation-results').first();
  }

  get findingsList(): Locator {
    return this.page.locator('[data-testid="findings"], .findings-list, :text("Finding")').first();
  }

  // Evidence management
  get uploadEvidenceButton(): Locator {
    return this.page.getByRole('button', { name: /upload.*evidence|add.*evidence/i }).first();
  }

  get evidenceTable(): Locator {
    return this.page.locator('[data-testid="evidence-table"], table');
  }

  // Actions
  async gotoAuditCenter(): Promise<void> {
    await this.page.goto(this.auditPath);
    await this.waitForPageLoad();
  }

  async gotoAuditPrep(): Promise<void> {
    await this.page.goto(this.auditPrepPath);
    await this.waitForPageLoad();
  }

  async gotoControlTesting(): Promise<void> {
    await this.page.goto(this.controlTestingPath);
    await this.waitForPageLoad();
  }

  async switchTab(tab: 'preparation' | 'testing' | 'simulator' | 'auditor'): Promise<void> {
    const tabMap = {
      preparation: this.preparationTab,
      testing: this.testingTab,
      simulator: this.simulatorTab,
      auditor: this.auditorTab,
    };
    await tabMap[tab].click();
    await this.page.waitForTimeout(500);
  }

  async runReadiness(): Promise<void> {
    await this.runReadinessCheck.click();
    await this.page.waitForTimeout(1000);
  }

  async startAuditSimulation(framework?: string): Promise<void> {
    if (framework && await this.simulationFrameworkSelect.isVisible()) {
      await this.simulationFrameworkSelect.selectOption(framework);
    }
    await this.startSimulationButton.click();
    await this.page.waitForTimeout(1000);
  }
}
