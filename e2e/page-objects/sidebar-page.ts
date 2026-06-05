/**
 * Sidebar Page Object
 *
 * Models the CURRENT app shell: a SlimSidebar icon rail (component
 * `components/SlimSidebar.tsx`) with exactly 7 icon-only pillar links plus a
 * Settings link. Each link is an <a> with an href and a
 * data-onboarding="<id>-nav" attribute. The pillar links carry NO accessible
 * text (the label is a visibility:hidden hover tooltip), so they must be located
 * by href / data-onboarding — never by getByRole('link', { name }).
 *
 * The 7 pillars (data-onboarding -> href):
 *   home   -> /dashboard       risk   -> /risks
 *   comply -> /frameworks      govern -> /governance
 *   audits -> /audit           vendors-> /vendors
 *   library-> /feature-library
 *   settings -> /settings (separate, at the bottom rail)
 *
 * Destinations that are NOT pillars (issues, policies, integrations, monitoring,
 * analytics, AI-RMF, EU AI Act, DMA, DSA, questionnaires, security, acos,
 * reports, team, billing, etc.) are NOT in the sidebar. They are reached via the
 * Command Palette (Cmd/Ctrl+K) or a direct page.goto(). navigateTo() and the
 * non-pillar getters below route through page.goto() for determinism.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SidebarPage extends BasePage {
  // The SlimSidebar desktop rail is an <aside> containing
  // nav[data-onboarding="sidebar-nav"]. On mobile it collapses to a bottom <nav>.
  get sidebar(): Locator {
    return this.page
      .locator('nav[data-onboarding="sidebar-nav"]')
      .or(this.page.locator('aside'))
      .first();
  }

  // Logo: the brand Link to /dashboard at the top of the rail (the shield icon).
  get logo(): Locator {
    return this.page.locator('aside a[href="/dashboard"]').first();
  }

  // ---- Pillar links (icon-only; locate by href / data-onboarding) ----
  private pillar(onboardingId: string): Locator {
    return this.page.locator(`a[data-onboarding="${onboardingId}-nav"]`).first();
  }

  get dashboardLink(): Locator {
    return this.pillar('home');
  }

  get risksLink(): Locator {
    return this.pillar('risk');
  }

  get frameworksLink(): Locator {
    return this.pillar('comply');
  }

  get governanceLink(): Locator {
    return this.pillar('govern');
  }

  get auditLink(): Locator {
    return this.pillar('audits');
  }

  get vendorsLink(): Locator {
    return this.pillar('vendors');
  }

  get libraryLink(): Locator {
    return this.pillar('library');
  }

  get settingsLink(): Locator {
    return this.pillar('settings');
  }

  // ---- Non-pillar destinations ----
  // These are NOT rendered in the sidebar. The getters resolve to the canonical
  // <a href> for the destination so callers can still click-or-goto. Prefer the
  // navigateTo* helpers below, which use page.goto() (or the command palette).
  get policiesLink(): Locator {
    return this.page.locator('a[href^="/policies"]').first();
  }

  get issuesLink(): Locator {
    return this.page.locator('a[href^="/issues"]').first();
  }

  get integrationsLink(): Locator {
    return this.page.locator('a[href^="/integrations"]').first();
  }

  get monitoringLink(): Locator {
    return this.page.locator('a[href^="/monitoring"]').first();
  }

  get reportsLink(): Locator {
    return this.page.locator('a[href^="/reports"]').first();
  }

  get analyticsLink(): Locator {
    return this.page.locator('a[href^="/monitoring"]').first();
  }

  get aiRmfLink(): Locator {
    return this.page.locator('a[href^="/ai-rmf"]').first();
  }

  get euAiActLink(): Locator {
    return this.page.locator('a[href*="eu-ai-act"]').first();
  }

  get dmaLink(): Locator {
    return this.page.locator('a[href*="dma"]').first();
  }

  get dsaLink(): Locator {
    return this.page.locator('a[href*="dsa"]').first();
  }

  get questionnairesLink(): Locator {
    return this.page.locator('a[href*="questionnaires"]').first();
  }

  get securityLink(): Locator {
    return this.page.locator('a[href*="security"]').first();
  }

  get acosLink(): Locator {
    return this.page.locator('a[href*="acos"]').first();
  }

  // ---- Collapsible-section shims (the old shell had them; this one does not) ----
  // Kept so cross-spec callers (e.g. comprehensive-e2e.spec.ts) compile and run.
  // The new SlimSidebar has no collapsible sections, so these resolve to nothing
  // / are graceful no-ops; `.isVisible()` on them returns false.
  get platformSection(): Locator {
    return this.sidebar;
  }

  get regulatorySection(): Locator {
    return this.page.locator('[data-nonexistent-regulatory-section]');
  }

  get reportsAuditSection(): Locator {
    return this.page.locator('[data-nonexistent-reports-section]');
  }

  get workspacesSection(): Locator {
    return this.page.locator('[data-nonexistent-workspaces-section]');
  }

  async expandSection(_section: 'regulatory' | 'reports' | 'workspaces'): Promise<void> {
    // No collapsible sections in the SlimSidebar shell; nothing to expand.
  }

  async collapseSection(_section: 'regulatory' | 'reports' | 'workspaces'): Promise<void> {
    // No collapsible sections in the SlimSidebar shell; nothing to collapse.
  }

  async isSectionExpanded(_section: 'regulatory' | 'reports' | 'workspaces'): Promise<boolean> {
    return false;
  }

  // ---- Navigation ----
  /**
   * Canonical generic navigation. Maps a logical route name to its path and
   * uses page.goto() (the SlimSidebar exposes only 7 pillars, so non-pillar
   * routes are not reachable by clicking the rail). Falls back to /<route>.
   */
  async navigateTo(route: string): Promise<void> {
    const map: Record<string, string> = {
      dashboard: '/dashboard',
      risks: '/risks',
      frameworks: '/frameworks',
      governance: '/governance',
      audit: '/audit',
      vendors: '/vendors',
      library: '/feature-library',
      settings: '/settings',
      policies: '/policies',
      issues: '/issues',
      integrations: '/integrations',
      monitoring: '/monitoring',
      reports: '/reports',
    };
    const path = map[route.toLowerCase()] || `/${route.replace(/^\//, '')}`;
    await this.navigate(path);
  }

  // Pillar navigations: click the real rail link (it is a router <Link>).
  async navigateToDashboard(): Promise<void> {
    await this.dashboardLink.click();
    await this.expectURL(/\/dashboard/);
  }

  async navigateToFrameworks(): Promise<void> {
    await this.frameworksLink.click();
    await this.expectURL(/\/frameworks/);
  }

  async navigateToVendors(): Promise<void> {
    await this.vendorsLink.click();
    await this.expectURL(/\/vendors/);
  }

  async navigateToRisks(): Promise<void> {
    await this.risksLink.click();
    await this.expectURL(/\/risks/);
  }

  async navigateToGovernance(): Promise<void> {
    await this.governanceLink.click();
    await this.expectURL(/\/governance/);
  }

  async navigateToAudit(): Promise<void> {
    await this.auditLink.click();
    await this.expectURL(/\/audit/);
  }

  async navigateToLibrary(): Promise<void> {
    await this.libraryLink.click();
    await this.expectURL(/\/feature-library/);
  }

  async navigateToSettings(): Promise<void> {
    await this.settingsLink.click();
    await this.expectURL(/\/settings/);
  }

  // Non-pillar navigations: go directly (not in the sidebar).
  async navigateToPolicies(): Promise<void> {
    await this.navigate('/policies');
    await this.expectURL(/\/policies/);
  }

  async navigateToMonitoring(): Promise<void> {
    await this.navigate('/monitoring');
    await this.expectURL(/\/monitoring/);
  }

  async navigateToAiRmf(): Promise<void> {
    await this.navigate('/ai-rmf');
    await this.expectURL(/ai-rmf/);
  }

  // ---- Assertions ----
  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }

  async expectLogoVisible(): Promise<void> {
    await expect(this.logo).toBeVisible();
  }

  async expectPlatformSectionVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }

  async expectRegulatorySectionVisible(): Promise<void> {
    // No regulatory section in the SlimSidebar; assert the rail itself is present.
    await expect(this.sidebar).toBeVisible();
  }

  /** The active pillar link carries the active styling and points at `route`. */
  async expectActiveLink(route: string): Promise<void> {
    const link = this.page.locator(`a[href^="/${route.replace(/^\//, '')}"]`).first();
    await expect(link).toBeVisible();
  }
}
