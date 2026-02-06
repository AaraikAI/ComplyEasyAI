import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div data-testid="markdown">{children}</div> }));

vi.mock('dompurify', () => ({
  default: { sanitize: (html: string) => html },
}));

vi.mock('@/services/geminiService', () => ({
  generateComplianceReport: vi.fn().mockResolvedValue('Generated AI report content about compliance status.'),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

const { mockFrameworks } = vi.hoisted(() => {
  const mockFrameworks = [
    { id: 'fw-1', name: 'SOC 2', status: 'In Progress', progress: 75, nextAuditDate: '2026-06-01', controls: [
      { id: 'c1', name: 'AC-1', status: 'Implemented', description: 'Access control' },
      { id: 'c2', name: 'AC-2', status: 'Not Started', description: 'Encryption', evidence: 'doc.pdf' },
    ]},
    { id: 'fw-2', name: 'GDPR', status: 'Compliant', progress: 100, nextAuditDate: '2026-07-15', controls: [
      { id: 'c3', name: 'DP-1', status: 'Compliant', description: 'Data processing' },
    ]},
    { id: 'fw-3', name: 'HIPAA', status: 'In Progress', progress: 30, nextAuditDate: '2026-08-01', controls: [] },
  ];
  return { mockFrameworks };
});

vi.mock('@/services/api', () => ({
  api: {
    frameworks: { list: vi.fn().mockResolvedValue(mockFrameworks) },
    risks: { list: vi.fn().mockResolvedValue([
      { id: 'r1', severity: 'High', description: 'Data breach risk', title: 'Data Breach', status: 'Open', detectedAt: new Date().toISOString() },
    ])},
    enterprise: {
      reports: {
        getExecutiveSummary: vi.fn().mockResolvedValue({
          overallComplianceScore: 82,
          frameworkSummaries: [
            { name: 'SOC 2', score: 75, status: 'In Progress', trend: 'up' },
            { name: 'GDPR', score: 100, status: 'Compliant', trend: 'stable' },
          ],
          riskHighlights: [{ category: 'Security', count: 5, criticalCount: 2 }],
          keyMetrics: { totalControls: 50, compliantControls: 40, openIssues: 5, overdueTasks: 2 },
          recommendations: ['Improve SOC 2 controls', 'Review HIPAA policy'],
          narrative: 'Overall compliance is strong with areas for improvement.',
        }),
        getRiskReport: vi.fn().mockResolvedValue({
          totalRisks: 15,
          criticalRisks: 3,
          highRisks: 5,
          mediumRisks: 4,
          lowRisks: 3,
          risksByCategory: [{ category: 'Security', count: 8 }, { category: 'Data', count: 7 }],
          trends: [{ period: 'Jan', count: 10 }, { period: 'Feb', count: 12 }, { period: 'Mar', count: 15 }],
          topRisks: [
            { title: 'Unpatched servers', severity: 'Critical', status: 'Open', framework: 'SOC 2' },
            { title: 'Data leakage', severity: 'High', status: 'Open' },
          ],
          summary: 'Risk posture has deteriorated over the past quarter.',
        }),
        getVendorRiskReport: vi.fn().mockResolvedValue({
          totalVendors: 20,
          highRiskVendors: 3,
          averageScore: 72,
          vendorsByRiskLevel: [{ level: 'High', count: 3 }, { level: 'Medium', count: 10 }, { level: 'Low', count: 7 }],
          topRiskyVendors: [
            { name: 'VendorA', score: 45, riskLevel: 'High', dataAccess: 'Full' },
            { name: 'VendorB', score: 55, riskLevel: 'Medium', dataAccess: 'Read Only' },
          ],
          summary: 'Three vendors pose elevated risk to the organization.',
        }),
      },
      autopilot: {
        run: vi.fn().mockResolvedValue({
          gapsIdentified: [{ gap: 'Missing encryption policy', framework: 'SOC 2', severity: 'High', recommendation: 'Implement AES-256' }],
          actionsProposed: [{ action: 'Enable encryption', priority: 'High', estimatedEffort: '2 days' }],
          actionsExecuted: [{ action: 'Updated firewall rules', result: 'Success', timestamp: '2026-01-15T10:00:00Z' }],
          itemsRequiringApproval: [{ item: 'Policy change', reason: 'Requires CISO approval', suggestedAction: 'Review and approve' }],
          summary: 'Autopilot identified 1 gap and executed 1 fix.',
          overallScore: 78,
        }),
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
  VIEW_TO_FEATURE: {},
}));

vi.mock('@/constants/tierLimits', () => ({
  getLimit: vi.fn().mockReturnValue(100),
  isAtLimit: vi.fn().mockReturnValue(false),
  getUpgradeMessage: vi.fn().mockReturnValue(''),
  LIMIT_LABELS: {},
  UPGRADE_LINK: '/settings?tab=billing',
}));

import { Reports } from '@/components/Reports';

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Dashboard View ----

  it('renders dashboard heading', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Compliance Reports')).toBeInTheDocument();
      expect(screen.getByText('AI-powered compliance reporting and analytics')).toBeInTheDocument();
    });
  });

  it('loads frameworks on mount', async () => {
    const { api } = await import('@/services/api');
    render(<Reports />);
    await waitFor(() => {
      expect(api.frameworks.list).toHaveBeenCalled();
    });
  });

  it('displays quick stat cards after loading', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Total Frameworks')).toBeInTheDocument();
      expect(screen.getByText('Avg. Progress')).toBeInTheDocument();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });
  });

  it('shows correct framework count', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 total frameworks
    });
  });

  it('calculates average progress', async () => {
    render(<Reports />);
    await waitFor(() => {
      // (75 + 100 + 30) / 3 = 68.33, rounded to 68%
      expect(screen.getByText('68%')).toBeInTheDocument();
    });
  });

  it('calculates compliant frameworks count', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // GDPR is Compliant
    });
  });

  it('calculates at-risk frameworks count', async () => {
    render(<Reports />);
    await waitFor(() => {
      // HIPAA has progress 30 < 50, so 1 at risk
      const atRiskCard = screen.getByText('At Risk').closest('div');
      expect(atRiskCard).toBeInTheDocument();
    });
  });

  it('renders action buttons for report types', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
      expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Compliance Autopilot')).toBeInTheDocument();
      expect(screen.getByText('Risk Report')).toBeInTheDocument();
    });
  });

  it('renders additional report types', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Additional Reports')).toBeInTheDocument();
      expect(screen.getByText('Vendor Risk Report')).toBeInTheDocument();
      expect(screen.getByText('Control Status Report')).toBeInTheDocument();
      expect(screen.getByText('Audit Trail Report')).toBeInTheDocument();
    });
  });

  it('shows framework progress chart when frameworks exist', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Framework Progress')).toBeInTheDocument();
    });
  });

  // ---- Generate Report View ----

  it('switches to Generate Report view', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => {
      expect(screen.getByText('Generate Compliance Report')).toBeInTheDocument();
      expect(screen.getByText('Report Configuration')).toBeInTheDocument();
    });
  });

  it('shows framework checkboxes in generate view', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => {
      expect(screen.getByText('SOC 2')).toBeInTheDocument();
      expect(screen.getByText('GDPR')).toBeInTheDocument();
      expect(screen.getByText('HIPAA')).toBeInTheDocument();
    });
  });

  it('shows back button that returns to dashboard', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('Dashboard'));
    fireEvent.click(screen.getByText('Dashboard'));
    await waitFor(() => {
      expect(screen.getByText('Compliance Reports')).toBeInTheDocument();
    });
  });

  it('toggles framework selection', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('SOC 2'));
    const checkbox = screen.getByText('SOC 2').closest('label')!.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);
    expect(screen.getByText('1 framework(s) selected')).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(screen.queryByText('1 framework(s) selected')).not.toBeInTheDocument();
  });

  it('shows error when generating report without selecting frameworks', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('AI Generate Report'));
    fireEvent.click(screen.getByText('AI Generate Report'));
    await waitFor(() => {
      expect(screen.getByText('Please select at least one framework')).toBeInTheDocument();
    });
  });

  it('generates report after selecting a framework', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('SOC 2'));
    // Select SOC 2
    const checkbox = screen.getByText('SOC 2').closest('label')!.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);
    await act(async () => {
      fireEvent.click(screen.getByText('AI Generate Report'));
    });
    await waitFor(() => {
      expect(screen.getByText(/Compliance Report/)).toBeInTheDocument();
    });
  });

  it('shows report preview with empty state initially', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => {
      expect(screen.getByText('No report generated yet')).toBeInTheDocument();
    });
  });

  it('shows customization options when toggle is clicked', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('Show Customization'));
    fireEvent.click(screen.getByText('Show Customization'));
    await waitFor(() => {
      expect(screen.getByText('Report Sections')).toBeInTheDocument();
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Framework Status')).toBeInTheDocument();
      expect(screen.getByText('Control Status')).toBeInTheDocument();
      expect(screen.getByText('Risk Summary')).toBeInTheDocument();
      expect(screen.getByText('Evidence Summary')).toBeInTheDocument();
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });
  });

  it('toggles report sections in customization', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('Show Customization'));
    fireEvent.click(screen.getByText('Show Customization'));
    await waitFor(() => screen.getByText('Evidence Summary'));
    const evidenceCheckbox = screen.getByText('Evidence Summary').closest('label')!.querySelector('input[type="checkbox"]')!;
    fireEvent.click(evidenceCheckbox);
    // It should toggle off the evidence section
    expect((evidenceCheckbox as HTMLInputElement).checked).toBe(false);
  });

  it('hides customization when toggle is clicked again', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('Show Customization'));
    fireEvent.click(screen.getByText('Show Customization'));
    await waitFor(() => screen.getByText('Hide Customization'));
    fireEvent.click(screen.getByText('Hide Customization'));
    expect(screen.queryByText('Report Sections')).not.toBeInTheDocument();
  });

  it('shows export buttons after generating report', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('SOC 2'));
    const checkbox = screen.getByText('SOC 2').closest('label')!.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);
    await act(async () => {
      fireEvent.click(screen.getByText('AI Generate Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });

  it('dismisses error when X is clicked', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Generate Report'));
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => screen.getByText('AI Generate Report'));
    fireEvent.click(screen.getByText('AI Generate Report'));
    await waitFor(() => screen.getByText('Please select at least one framework'));
    const closeButton = screen.getAllByTestId('icon-X')[0].closest('button');
    if (closeButton) fireEvent.click(closeButton);
    expect(screen.queryByText('Please select at least one framework')).not.toBeInTheDocument();
  });

  // ---- AI Executive Summary ----

  it('generates executive summary when button is clicked', async () => {
    const { api } = await import('@/services/api');
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(api.enterprise.reports.getExecutiveSummary).toHaveBeenCalled();
      expect(screen.getByText('Overall Compliance Score')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });
  });

  it('shows executive summary key metrics', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(screen.getByText('Total Controls')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Open Issues')).toBeInTheDocument();
      expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    });
  });

  it('shows executive narrative', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(screen.getByText('Executive Narrative')).toBeInTheDocument();
      expect(screen.getByText(/Overall compliance is strong/)).toBeInTheDocument();
    });
  });

  it('shows framework summaries in executive view', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(screen.getByText('Framework Status')).toBeInTheDocument();
    });
  });

  it('shows recommendations in executive view', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(screen.getByText('Key Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Improve SOC 2 controls')).toBeInTheDocument();
      expect(screen.getByText('Review HIPAA policy')).toBeInTheDocument();
    });
  });

  it('shows Export JSON button in executive summary', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });
  });

  // ---- Compliance Autopilot ----

  it('runs compliance autopilot when button is clicked', async () => {
    const { api } = await import('@/services/api');
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(api.enterprise.autopilot.run).toHaveBeenCalled();
      expect(screen.getByText('Compliance Autopilot Report')).toBeInTheDocument();
    });
  });

  it('shows autopilot summary and score', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Autopilot Summary')).toBeInTheDocument();
      expect(screen.getByText('Score: 78%')).toBeInTheDocument();
      expect(screen.getByText(/Autopilot identified 1 gap/)).toBeInTheDocument();
    });
  });

  it('shows autopilot stats cards', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Gaps Identified')).toBeInTheDocument();
      expect(screen.getByText('Actions Proposed')).toBeInTheDocument();
      expect(screen.getByText('Actions Executed')).toBeInTheDocument();
      expect(screen.getByText('Requiring Approval')).toBeInTheDocument();
    });
  });

  it('shows gaps identified in autopilot', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Missing encryption policy')).toBeInTheDocument();
      expect(screen.getByText('Implement AES-256')).toBeInTheDocument();
    });
  });

  it('shows actions proposed in autopilot', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Enable encryption')).toBeInTheDocument();
      expect(screen.getByText('2 days')).toBeInTheDocument();
    });
  });

  it('shows executed actions in autopilot', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Updated firewall rules')).toBeInTheDocument();
    });
  });

  it('shows items requiring approval in autopilot', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Policy change')).toBeInTheDocument();
      expect(screen.getByText(/Requires CISO approval/)).toBeInTheDocument();
      expect(screen.getByText(/Review and approve/)).toBeInTheDocument();
    });
  });

  // ---- Risk Report ----

  it('generates risk report when button is clicked', async () => {
    const { api } = await import('@/services/api');
    render(<Reports />);
    await waitFor(() => screen.getByText('Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Risk Report'));
    });
    await waitFor(() => {
      expect(api.enterprise.reports.getRiskReport).toHaveBeenCalled();
      expect(screen.getByText('AI Risk Report')).toBeInTheDocument();
    });
  });

  it('shows risk statistics cards', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('Total Risks')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  it('shows risk analysis summary', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('AI Risk Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Risk posture has deteriorated/)).toBeInTheDocument();
    });
  });

  it('shows top risks table', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('Top Risks')).toBeInTheDocument();
      expect(screen.getByText('Unpatched servers')).toBeInTheDocument();
      expect(screen.getByText('Data leakage')).toBeInTheDocument();
    });
  });

  // ---- Vendor Risk Report ----

  it('generates vendor risk report', async () => {
    const { api } = await import('@/services/api');
    render(<Reports />);
    await waitFor(() => screen.getByText('Vendor Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Vendor Risk Report'));
    });
    await waitFor(() => {
      expect(api.enterprise.reports.getVendorRiskReport).toHaveBeenCalled();
      expect(screen.getByText('Vendor Risk Report')).toBeInTheDocument();
    });
  });

  it('shows vendor statistics', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Vendor Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Vendor Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('Total Vendors')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('High Risk Vendors')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });
  });

  it('shows vendor analysis summary', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Vendor Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Vendor Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('AI Vendor Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Three vendors pose elevated risk/)).toBeInTheDocument();
    });
  });

  it('shows high risk vendors list', async () => {
    render(<Reports />);
    await waitFor(() => screen.getByText('Vendor Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Vendor Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('High Risk Vendors')).toBeInTheDocument();
      expect(screen.getByText('VendorA')).toBeInTheDocument();
      expect(screen.getByText('VendorB')).toBeInTheDocument();
      expect(screen.getByText('Data Access: Full')).toBeInTheDocument();
    });
  });

  // ---- Error Handling ----

  it('shows error when frameworks fail to load', async () => {
    const { api } = await import('@/services/api');
    (api.frameworks.list as any).mockRejectedValueOnce(new Error('API error'));
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load frameworks')).toBeInTheDocument();
    });
  });

  it('shows error when executive summary fails', async () => {
    const { api } = await import('@/services/api');
    (api.enterprise.reports.getExecutiveSummary as any).mockRejectedValueOnce(new Error('Summary failed'));
    render(<Reports />);
    await waitFor(() => screen.getByText('AI Executive Summary'));
    await act(async () => {
      fireEvent.click(screen.getByText('AI Executive Summary'));
    });
    await waitFor(() => {
      expect(screen.getByText('Summary failed')).toBeInTheDocument();
    });
  });

  it('shows error when autopilot fails', async () => {
    const { api } = await import('@/services/api');
    (api.enterprise.autopilot.run as any).mockRejectedValueOnce(new Error('Autopilot failed'));
    render(<Reports />);
    await waitFor(() => screen.getByText('Compliance Autopilot'));
    await act(async () => {
      fireEvent.click(screen.getByText('Compliance Autopilot'));
    });
    await waitFor(() => {
      expect(screen.getByText('Autopilot failed')).toBeInTheDocument();
    });
  });

  it('shows error when risk report fails', async () => {
    const { api } = await import('@/services/api');
    (api.enterprise.reports.getRiskReport as any).mockRejectedValueOnce(new Error('Risk report failed'));
    render(<Reports />);
    await waitFor(() => screen.getByText('Risk Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Risk Report'));
    });
    await waitFor(() => {
      expect(screen.getByText('Risk report failed')).toBeInTheDocument();
    });
  });
});
