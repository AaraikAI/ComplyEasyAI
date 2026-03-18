/**
 * Incidents Page Object
 * Covers incident lifecycle: create, assign, investigate, resolve, close
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class IncidentsPage extends BasePage {
  readonly path = '/incidents';
  readonly issuesPath = '/issues';

  get pageTitle(): Locator {
    return this.page.locator('h1:has-text("Incident"), h2:has-text("Incident"), h1:has-text("Issue")').first();
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: /create|add|new|report/i }).first();
  }

  get incidentTable(): Locator {
    return this.page.locator('table, [data-testid="incidents-table"], .incidents-list');
  }

  get incidentRows(): Locator {
    return this.page.locator('table tbody tr, [data-testid="incident-row"], .incident-item');
  }

  get filterDropdown(): Locator {
    return this.page.locator('select[name="status"], [data-testid="status-filter"]').first();
  }

  get searchInput(): Locator {
    return this.page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search"]');
  }

  // Incident form fields
  get titleInput(): Locator {
    return this.page.locator('[name="title"], [name="name"], [data-testid="incident-title"]');
  }

  get descriptionInput(): Locator {
    return this.page.locator('[name="description"], textarea').first();
  }

  get severitySelect(): Locator {
    return this.page.locator('select[name="severity"], [data-testid="severity-select"]');
  }

  get categorySelect(): Locator {
    return this.page.locator('select[name="category"], [data-testid="category-select"]');
  }

  get assigneeSelect(): Locator {
    return this.page.locator('select[name="assignee"], [data-testid="assignee-select"]');
  }

  get statusSelect(): Locator {
    return this.page.locator('select[name="status"], [data-testid="status-select"]');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /create|save|submit/i }).first();
  }

  // Detail view
  get detailPanel(): Locator {
    return this.page.locator('[data-testid="incident-detail"], .detail-panel, [role="dialog"]');
  }

  get resolveButton(): Locator {
    return this.page.getByRole('button', { name: /resolve/i });
  }

  get closeButton(): Locator {
    return this.page.getByRole('button', { name: /close.*incident|mark.*closed/i });
  }

  get reopenButton(): Locator {
    return this.page.getByRole('button', { name: /reopen/i });
  }

  get editButton(): Locator {
    return this.page.getByRole('button', { name: /edit/i }).first();
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i });
  }

  get timelineSection(): Locator {
    return this.page.locator('[data-testid="timeline"], .timeline, :text("Timeline")').first();
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async gotoIssues(): Promise<void> {
    await this.page.goto(this.issuesPath);
    await this.waitForPageLoad();
  }

  async createIncident(data: {
    title: string;
    description: string;
    severity?: string;
    category?: string;
  }): Promise<void> {
    await this.createButton.click();
    await this.page.waitForTimeout(500);
    await this.titleInput.fill(data.title);
    await this.descriptionInput.fill(data.description);
    if (data.severity && await this.severitySelect.isVisible()) {
      await this.severitySelect.selectOption(data.severity);
    }
    if (data.category && await this.categorySelect.isVisible()) {
      await this.categorySelect.selectOption(data.category);
    }
    await this.submitButton.click();
  }

  async openIncident(index: number = 0): Promise<void> {
    await this.incidentRows.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  async resolveIncident(): Promise<void> {
    await this.resolveButton.click();
    await this.page.waitForTimeout(500);
  }

  async closeIncident(): Promise<void> {
    await this.closeButton.click();
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.filterDropdown.selectOption(status);
    await this.page.waitForTimeout(500);
  }

  async searchIncidents(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async getIncidentCount(): Promise<number> {
    return await this.incidentRows.count();
  }
}
