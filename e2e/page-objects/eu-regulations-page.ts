/**
 * EU Regulations Page Object
 * Covers EU AI Act, DMA, DSA, CRA, CSRD, Ecodesign, NIS2
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export type RegulationType = 'eu-ai-act' | 'dma' | 'dsa' | 'eu-cra' | 'csrd' | 'ecodesign' | 'nis2' | 'us-privacy';

export class EURegulationsPage extends BasePage {
  readonly routes: Record<RegulationType, string> = {
    'eu-ai-act': '/regulations/eu-ai-act',
    'dma': '/regulations/dma',
    'dsa': '/regulations/dsa',
    'eu-cra': '/regulations/eu-cra',
    'csrd': '/regulations/csrd',
    'ecodesign': '/regulations/ecodesign',
    'nis2': '/regulations/nis2',
    'us-privacy': '/regulations/us-privacy',
  };

  // Common regulation page elements
  get pageTitle(): Locator {
    return this.page.locator('h1, h2').first();
  }

  get complianceScore(): Locator {
    return this.page.locator('[data-testid="compliance-score"], :text("Compliance Score"), :text("compliance")').first();
  }

  get requirementsList(): Locator {
    return this.page.locator('[data-testid="requirements"], table, .requirements-list');
  }

  get addRequirementButton(): Locator {
    return this.page.getByRole('button', { name: /add|create|new/i }).first();
  }

  get assessmentButton(): Locator {
    return this.page.getByRole('button', { name: /assess|evaluate|start assessment/i }).first();
  }

  get exportButton(): Locator {
    return this.page.getByRole('button', { name: /export|download|report/i }).first();
  }

  get statusBadges(): Locator {
    return this.page.locator('.badge, [data-testid="status-badge"], span:has-text("Compliant"), span:has-text("Non-Compliant"), span:has-text("In Progress")');
  }

  // EU AI Act specific
  get riskClassification(): Locator {
    return this.page.locator('[data-testid="risk-classification"], :text("Risk Classification"), :text("High Risk")').first();
  }

  get aiSystemRegistry(): Locator {
    return this.page.locator('[data-testid="ai-systems"], :text("AI Systems")').first();
  }

  // DMA specific
  get gatekeeperStatus(): Locator {
    return this.page.locator('[data-testid="gatekeeper"], :text("Gatekeeper")').first();
  }

  get obligationsList(): Locator {
    return this.page.locator('[data-testid="obligations"], :text("Obligation")').first();
  }

  // DSA specific
  get contentModeration(): Locator {
    return this.page.locator('[data-testid="content-moderation"], :text("Content Moderation")').first();
  }

  get transparencyReports(): Locator {
    return this.page.locator('[data-testid="transparency"], :text("Transparency")').first();
  }

  // Actions
  async gotoRegulation(regulation: RegulationType): Promise<void> {
    await this.page.goto(this.routes[regulation]);
    await this.waitForPageLoad();
  }

  async startAssessment(): Promise<void> {
    await this.assessmentButton.click();
    await this.waitForPageLoad();
  }

  async exportReport(): Promise<void> {
    await this.exportButton.click();
  }

  async expectPageLoaded(regulation: RegulationType): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.routes[regulation].replace('/', '\\/')));
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }
}
