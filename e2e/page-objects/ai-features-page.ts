/**
 * AI Features Page Object
 * Covers all AI-powered compliance tools across document and compliance hubs
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export type AIFeatureTab =
  | 'policy-generator' | 'contract-analyzer' | 'gap-analysis'
  | 'rfp-responder' | 'phishing-simulator' | 'vendor-scorer'
  | 'data-mapper' | 'bcp-generator' | 'cross-framework-mapper'
  | 'auto-remediation' | 'evidence-checker' | 'agentic-vendor-risk'
  | 'audit-simulator' | 'compliance-query' | 'report-generator';

export class AIFeaturesPage extends BasePage {
  readonly documentToolsPath = '/ai/document-tools';
  readonly complianceToolsPath = '/ai/compliance-tools';

  // AI feature direct routes
  readonly featureRoutes: Record<AIFeatureTab, string> = {
    'policy-generator': '/ai/policy-generator',
    'contract-analyzer': '/ai/contract-analyzer',
    'gap-analysis': '/ai/gap-analysis',
    'rfp-responder': '/ai/rfp-responder',
    'phishing-simulator': '/ai/phishing-simulator',
    'vendor-scorer': '/ai/vendor-scorer',
    'data-mapper': '/ai/data-mapper',
    'bcp-generator': '/ai/bcp-generator',
    'cross-framework-mapper': '/ai/cross-framework-mapper',
    'auto-remediation': '/ai/auto-remediation',
    'evidence-checker': '/ai/evidence-checker',
    'agentic-vendor-risk': '/ai/agentic-vendor-risk',
    'audit-simulator': '/ai/audit-simulator',
    'compliance-query': '/ai/compliance-query',
    'report-generator': '/ai/report-generator',
  };

  // Common AI form elements
  get inputTextarea(): Locator {
    return this.page.locator('textarea').first();
  }

  get frameworkSelect(): Locator {
    return this.page.locator('select').first();
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /generate|analyze|run|submit|start|check/i }).first();
  }

  get outputContainer(): Locator {
    return this.page.locator('[data-testid="ai-output"], .ai-output, .output, pre, [class*="result"]').first();
  }

  get copyButton(): Locator {
    return this.page.getByRole('button', { name: /copy/i }).first();
  }

  get exportButton(): Locator {
    return this.page.getByRole('button', { name: /export|download/i }).first();
  }

  get loadingIndicator(): Locator {
    return this.page.locator('[data-testid="ai-loading"], .animate-spin, [aria-busy="true"]').first();
  }

  // Actions
  async gotoFeature(feature: AIFeatureTab): Promise<void> {
    await this.page.goto(this.featureRoutes[feature]);
    await this.waitForPageLoad();
  }

  async gotoDocumentTools(): Promise<void> {
    await this.page.goto(this.documentToolsPath);
    await this.waitForPageLoad();
  }

  async gotoComplianceTools(): Promise<void> {
    await this.page.goto(this.complianceToolsPath);
    await this.waitForPageLoad();
  }

  async fillAndSubmit(inputText: string): Promise<void> {
    if (await this.inputTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.inputTextarea.fill(inputText);
    }
    await this.submitButton.click();
  }

  async waitForAIResponse(timeoutMs: number = 30000): Promise<void> {
    // Wait for loading to appear then disappear
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async copyOutput(): Promise<void> {
    await this.copyButton.click();
  }

  async exportOutput(): Promise<void> {
    await this.exportButton.click();
  }

  async expectOutputVisible(): Promise<void> {
    await expect(this.outputContainer).toBeVisible({ timeout: 30000 });
  }
}
