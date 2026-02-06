import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboardingTrigger: vi.fn(),
}));

describe('Dashboard', () => {
  const mockNavigate = vi.fn();
  const defaultProps = {
    frameworks: [] as any[],
    risks: [] as any[],
    onNavigate: mockNavigate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect for the chart container
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
    });
  });

  // ---- Basic Rendering ----

  it('renders with empty data showing 0% compliance score', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
  });

  it('renders all four KPI cards', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    expect(screen.getByText('Critical Risks')).toBeInTheDocument();
    expect(screen.getByText('Active Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Audit')).toBeInTheDocument();
  });

  it('renders the chart section heading', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Compliance Readiness Trend')).toBeInTheDocument();
  });

  it('renders priority actions section', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Priority Actions')).toBeInTheDocument();
  });

  it('shows "No open risks" when risks are empty', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('No open risks')).toBeInTheDocument();
  });

  it('renders "View All" button for risks', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('renders "View Risk Registry" button', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('View Risk Registry')).toBeInTheDocument();
  });

  // ---- Frameworks Data ----

  it('displays active framework count', () => {
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [], nextAuditDate: '2026-06-01' },
      { id: '2', name: 'GDPR', status: 'Compliant' as any, progress: 100, controls: [], nextAuditDate: '2026-07-01' },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    // Active Frameworks count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows framework names in Active Frameworks card', () => {
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [], nextAuditDate: '2026-06-01' },
      { id: '2', name: 'GDPR', status: 'Compliant' as any, progress: 100, controls: [], nextAuditDate: '2026-07-01' },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('SOC 2, GDPR')).toBeInTheDocument();
  });

  it('calculates compliance score from controls', () => {
    const frameworks = [
      {
        id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 80,
        controls: [
          { id: 'c1', name: 'AC-1', status: 'Implemented', description: 'test' },
          { id: 'c2', name: 'AC-2', status: 'Not Started', description: 'test' },
          { id: 'c3', name: 'AC-3', status: 'Implemented', description: 'test' },
          { id: 'c4', name: 'AC-4', status: 'Compliant', description: 'test' },
        ],
        nextAuditDate: '2026-06-01',
      },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    // 3 out of 4 controls = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('falls back to progress when controls are empty', () => {
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 60, controls: [], nextAuditDate: '2026-06-01' },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  // ---- Risks Data ----

  it('counts critical risks (High severity, not Resolved)', () => {
    const risks = [
      { id: '1', description: 'High risk 1', severity: 'High', status: 'Open', category: 'Security', detectedAt: '2026-01-01' },
      { id: '2', description: 'High risk 2', severity: 'High', status: 'Resolved', category: 'Security', detectedAt: '2026-01-01' },
      { id: '3', description: 'Low risk', severity: 'Low', status: 'Open', category: 'Other', detectedAt: '2026-01-01' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    // Critical Risks card shows 1 (only unresolved high severity)
    const critRiskCard = screen.getByText('Critical Risks').closest('div');
    expect(critRiskCard?.querySelector('h3')?.textContent).toBe('1');
  });

  it('shows priority risk descriptions', () => {
    const risks = [
      { id: '1', description: 'Missing encryption', severity: 'High', status: 'Open', category: 'Security', detectedAt: '2026-01-01' },
      { id: '2', description: 'Data breach risk', severity: 'Medium', status: 'In Progress', category: 'Data', detectedAt: '2026-01-02' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    expect(screen.getByText('Missing encryption')).toBeInTheDocument();
    expect(screen.getByText('Data breach risk')).toBeInTheDocument();
  });

  it('shows severity badges on risk items', () => {
    const risks = [
      { id: '1', description: 'High severity risk', severity: 'High', status: 'Open', category: 'Security', detectedAt: '2026-01-01' },
      { id: '2', description: 'Medium severity risk', severity: 'Medium', status: 'Open', category: 'Data', detectedAt: '2026-01-01' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('only shows up to 3 priority risks', () => {
    const risks = [
      { id: '1', description: 'Risk 1', severity: 'High', status: 'Open', category: 'A', detectedAt: '2026-01-01' },
      { id: '2', description: 'Risk 2', severity: 'Medium', status: 'Open', category: 'B', detectedAt: '2026-01-01' },
      { id: '3', description: 'Risk 3', severity: 'Low', status: 'Open', category: 'C', detectedAt: '2026-01-01' },
      { id: '4', description: 'Risk 4', severity: 'High', status: 'Open', category: 'D', detectedAt: '2026-01-01' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    expect(screen.getByText('Risk 1')).toBeInTheDocument();
    expect(screen.getByText('Risk 2')).toBeInTheDocument();
    expect(screen.getByText('Risk 3')).toBeInTheDocument();
    expect(screen.queryByText('Risk 4')).not.toBeInTheDocument();
  });

  it('does not show resolved risks in priority actions', () => {
    const risks = [
      { id: '1', description: 'Resolved risk', severity: 'High', status: 'Resolved', category: 'Security', detectedAt: '2026-01-01' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    expect(screen.queryByText('Resolved risk')).not.toBeInTheDocument();
    expect(screen.getByText('No open risks')).toBeInTheDocument();
  });

  // ---- Upcoming Audit ----

  it('shows "No audits scheduled" when no frameworks have audit dates', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('No audits scheduled')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows days until next audit', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [], nextAuditDate: futureDate.toISOString() },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('30d')).toBeInTheDocument();
    // SOC 2 appears in both Active Frameworks card and Upcoming Audit card
    expect(screen.getAllByText('SOC 2').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Overdue" when audit date is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const frameworks = [
      { id: '1', name: 'GDPR', status: 'In Progress' as any, progress: 50, controls: [], nextAuditDate: pastDate.toISOString() },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows "Today" when audit date is today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const frameworks = [
      { id: '1', name: 'HIPAA', status: 'In Progress' as any, progress: 50, controls: [], nextAuditDate: today.toISOString() },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows audit count when multiple audits exist', () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 10);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 20);
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [], nextAuditDate: futureDate1.toISOString() },
      { id: '2', name: 'GDPR', status: 'In Progress' as any, progress: 80, controls: [], nextAuditDate: futureDate2.toISOString() },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('(2 audits)')).toBeInTheDocument();
  });

  // ---- Navigation (Click handlers) ----

  it('navigates to risks when Critical Risks card is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    const critRisksCard = screen.getByText('Critical Risks').closest('div[class*="cursor-pointer"]');
    if (critRisksCard) fireEvent.click(critRisksCard);
    expect(mockNavigate).toHaveBeenCalledWith('risks');
  });

  it('navigates to frameworks when Active Frameworks card is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    const fwCard = screen.getByText('Active Frameworks').closest('div[class*="cursor-pointer"]');
    if (fwCard) fireEvent.click(fwCard);
    expect(mockNavigate).toHaveBeenCalledWith('frameworks');
  });

  it('navigates to risks when "View All" is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByText('View All'));
    expect(mockNavigate).toHaveBeenCalledWith('risks');
  });

  it('navigates to risks when "View Risk Registry" is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByText('View Risk Registry'));
    expect(mockNavigate).toHaveBeenCalledWith('risks');
  });

  it('navigates to risks when a risk item is clicked', () => {
    const risks = [
      { id: '1', description: 'Click me risk', severity: 'High', status: 'Open', category: 'Security', detectedAt: '2026-01-01' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    const riskItem = screen.getByText('Click me risk').closest('div[class*="cursor-pointer"]');
    if (riskItem) fireEvent.click(riskItem);
    expect(mockNavigate).toHaveBeenCalledWith('risks');
  });

  it('shows alert with audit info when Upcoming Audit card is clicked', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [], nextAuditDate: futureDate.toISOString() },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    const auditCard = screen.getByText('Upcoming Audit').closest('div[class*="cursor-pointer"]');
    if (auditCard) fireEvent.click(auditCard);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Upcoming Audits'));
    alertSpy.mockRestore();
  });

  it('shows "No audits scheduled" alert when audit card clicked with no audits', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [] },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    const auditCard = screen.getByText('Upcoming Audit').closest('div[class*="cursor-pointer"]');
    if (auditCard) fireEvent.click(auditCard);
    expect(alertSpy).toHaveBeenCalledWith('No audits scheduled for any frameworks.');
    alertSpy.mockRestore();
  });

  // ---- Chart ----

  it('shows chart loading state when container has no dimensions', () => {
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0,
    });
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  // ---- Trend data ----

  it('renders trend chart with frameworks', () => {
    const frameworks = [
      {
        id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 80,
        controls: [
          { id: 'c1', name: 'AC-1', status: 'Implemented', description: 'test' },
        ],
        nextAuditDate: '2026-06-01',
      },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    // Check chart container is rendered
    const chartContainer = document.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });
});
