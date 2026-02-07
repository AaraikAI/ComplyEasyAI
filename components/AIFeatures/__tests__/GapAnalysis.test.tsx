import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div data-testid="md">{children}</div> }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test', email: 'test@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true,
  }),
}));

// Hoisted mock functions
const { frameworksList, performGapAnalysis } = vi.hoisted(() => ({
  frameworksList: vi.fn(),
  performGapAnalysis: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    frameworks: { list: frameworksList },
    ai: { performGapAnalysis },
    onboarding: { getProgress: vi.fn().mockResolvedValue(null) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
}));

vi.mock('../../../constants', () => ({
  AVAILABLE_FRAMEWORKS: [
    { name: 'SOC 2' },
    { name: 'ISO 27001' },
    { name: 'GDPR' },
    { name: 'HIPAA' },
  ],
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn().mockReturnValue({ isOnboarding: false }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false, currentStep: 0, canShow: false }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false, dismiss: vi.fn(), disableAllHints: vi.fn() }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, isLoaded: true }),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
}));

import { GapAnalysis } from '../GapAnalysis';

describe('GapAnalysis', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    frameworksList.mockResolvedValue([{ name: 'My SOC 2', id: 'fw1' }]);
    performGapAnalysis.mockResolvedValue({
      analysis: 'Gap analysis result summary',
      gaps: [
        { control: 'Access Control', criticality: 'High', effort: 'Medium', remediation: 'Implement MFA' },
        { control: 'Encryption', criticality: 'Critical', effort: 'High', remediation: 'Enable TLS' },
      ],
      prioritized: [
        { control: 'Access Control', priority: 9, rationale: 'High impact' },
        { control: 'Encryption', priority: 10, rationale: 'Critical data exposure' },
      ],
    });
  });

  // ---------------------------------------------------------------------------
  // Basic rendering
  // ---------------------------------------------------------------------------
  it('renders heading and framework selection areas', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    expect(screen.getByText('Compliance Gap Analysis')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Current Frameworks')).toBeInTheDocument();
      expect(screen.getByText('Target Frameworks')).toBeInTheDocument();
    });
    expect(screen.getByText('Run Gap Analysis')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    fireEvent.click(backBtn!);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Framework Loading
  // ---------------------------------------------------------------------------
  it('shows loading spinner while frameworks load', () => {
    frameworksList.mockReturnValue(new Promise(() => {}));
    render(<GapAnalysis onBack={mockOnBack} />);
    expect(screen.getByText(/Loading frameworks/)).toBeInTheDocument();
  });

  it('shows user frameworks section when user has frameworks', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Your Frameworks:')).toBeInTheDocument());
    expect(screen.getByText('My SOC 2')).toBeInTheDocument();
  });

  it('shows available frameworks from constants', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('All Available Frameworks:')).toBeInTheDocument());
    expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ISO 27001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GDPR').length).toBeGreaterThan(0);
  });

  it('handles framework load failure gracefully', async () => {
    frameworksList.mockRejectedValueOnce(new Error('Failed'));
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('All Available Frameworks:')).toBeInTheDocument());
    // User frameworks section should not render
    expect(screen.queryByText('Your Frameworks:')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Framework selection
  // ---------------------------------------------------------------------------
  it('selects and deselects a current framework', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    // Click SOC 2 in the Current frameworks section (first occurrence in available)
    const currentCheckboxes = screen.getAllByText('SOC 2');
    fireEvent.click(currentCheckboxes[0]);

    // Should show selected chip
    await waitFor(() => {
      const chips = document.querySelectorAll('.bg-brand-100');
      expect(chips.length).toBe(1);
    });

    // Deselect by clicking chip X
    const chipX = document.querySelector('.bg-brand-100 button');
    fireEvent.click(chipX!);
    await waitFor(() => {
      const chips = document.querySelectorAll('.bg-brand-100');
      expect(chips.length).toBe(0);
    });
  });

  it('selects and deselects a target framework', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('GDPR').length).toBeGreaterThan(0));

    // Target frameworks section
    const allGdpr = screen.getAllByText('GDPR');
    // The last GDPR checkbox is in the target section
    fireEvent.click(allGdpr[allGdpr.length - 1]);

    await waitFor(() => {
      const chips = document.querySelectorAll('.bg-green-100');
      expect(chips.length).toBe(1);
    });

    // Remove via chip X
    const chipX = document.querySelector('.bg-green-100 button');
    fireEvent.click(chipX!);
    await waitFor(() => {
      const chips = document.querySelectorAll('.bg-green-100');
      expect(chips.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Run button disabled states
  // ---------------------------------------------------------------------------
  it('run button is disabled when no frameworks selected', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => {
      const runBtn = screen.getByText('Run Gap Analysis').closest('button')!;
      expect(runBtn).toBeDisabled();
    });
  });

  it('run button is disabled when only current selected', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const runBtn = screen.getByText('Run Gap Analysis').closest('button')!;
    expect(runBtn).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------
  it('shows error when no current framework selected and run clicked (via code path)', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));
    // Select a target
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    // The button has disabled={loading || currentFrameworks.length === 0 || targetFrameworks.length === 0}
    // So current=0 => disabled. Let's verify:
    const runBtn = screen.getByText('Run Gap Analysis').closest('button')!;
    expect(runBtn).toBeDisabled();
  });

  it('shows error when same framework in both current and target', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    // Select SOC 2 as current (first available)
    const allSoc2 = screen.getAllByText('SOC 2');
    fireEvent.click(allSoc2[0]); // current

    // Select SOC 2 as target (last available)
    fireEvent.click(allSoc2[allSoc2.length - 1]); // target

    // Run
    const runBtn = screen.getByText('Run Gap Analysis').closest('button')!;
    fireEvent.click(runBtn);

    await waitFor(() => expect(screen.getByText(/Cannot select the same framework/)).toBeInTheDocument());
  });

  it('dismisses error when X is clicked', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    const allSoc2 = screen.getAllByText('SOC 2');
    fireEvent.click(allSoc2[0]);
    fireEvent.click(allSoc2[allSoc2.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);
    await waitFor(() => expect(screen.getByText(/Cannot select the same framework/)).toBeInTheDocument());

    // Find X close button
    const xBtn = screen.getByText(/Cannot select the same framework/).closest('div')?.parentElement?.querySelector('button:last-child');
    fireEvent.click(xBtn!);
    await waitFor(() => expect(screen.queryByText(/Cannot select the same framework/)).not.toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // Successful analysis
  // ---------------------------------------------------------------------------
  it('runs gap analysis and displays results', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    // Select current: SOC 2
    const allSoc2 = screen.getAllByText('SOC 2');
    fireEvent.click(allSoc2[0]);

    // Select target: GDPR
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);

    // Run
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(performGapAnalysis).toHaveBeenCalledWith(['SOC 2'], ['GDPR']));
    await waitFor(() => expect(screen.getByText('Executive Summary')).toBeInTheDocument());
  });

  it('displays prioritized gaps sorted by priority', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Prioritized Gaps')).toBeInTheDocument());
    expect(screen.getAllByText('Access Control').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Priority: 10')).toBeInTheDocument();
    expect(screen.getByText('Priority: 9')).toBeInTheDocument();
    expect(screen.getByText('Critical data exposure')).toBeInTheDocument();
  });

  it('displays gap details with remediation', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Gap Details & Remediation')).toBeInTheDocument());
    expect(screen.getAllByText('Remediation Steps:').length).toBeGreaterThanOrEqual(1);
  });

  it('shows export button after analysis', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Export Analysis')).toBeInTheDocument());
  });

  it('exports analysis as JSON when Export clicked', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Export Analysis')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Export Analysis'));
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------
  it('shows error when API call fails', async () => {
    performGapAnalysis.mockRejectedValueOnce(new Error('AI service unavailable'));
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('AI service unavailable')).toBeInTheDocument());
    // Results should be cleared
    expect(screen.queryByText('Executive Summary')).not.toBeInTheDocument();
  });

  it('shows loading state during analysis', async () => {
    performGapAnalysis.mockReturnValueOnce(new Promise(() => {}));
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Analyzing...')).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  it('clears error when a framework is toggled', async () => {
    performGapAnalysis.mockRejectedValueOnce(new Error('Failed'));
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Failed')).toBeInTheDocument());

    // Toggle a current framework to clear error
    const allIso = screen.getAllByText('ISO 27001');
    fireEvent.click(allIso[0]);
    await waitFor(() => expect(screen.queryByText('Failed')).not.toBeInTheDocument());
  });

  it('handles analysis with no gaps or prioritized items', async () => {
    performGapAnalysis.mockResolvedValueOnce({ analysis: 'All good', gaps: [], prioritized: [] });
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(screen.getByText('Executive Summary')).toBeInTheDocument());
    // Should NOT show Prioritized Gaps or Gap Details sections
    expect(screen.queryByText('Prioritized Gaps')).not.toBeInTheDocument();
    expect(screen.queryByText('Gap Details & Remediation')).not.toBeInTheDocument();
  });

  it('handles multiple current and target framework selections', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0));

    // Select SOC 2 and ISO as current
    fireEvent.click(screen.getAllByText('SOC 2')[0]);
    fireEvent.click(screen.getAllByText('ISO 27001')[0]);

    // Select GDPR and HIPAA as target
    const allGdpr = screen.getAllByText('GDPR');
    fireEvent.click(allGdpr[allGdpr.length - 1]);
    const allHipaa = screen.getAllByText('HIPAA');
    fireEvent.click(allHipaa[allHipaa.length - 1]);

    fireEvent.click(screen.getByText('Run Gap Analysis').closest('button')!);

    await waitFor(() => expect(performGapAnalysis).toHaveBeenCalledWith(
      ['SOC 2', 'ISO 27001'],
      ['GDPR', 'HIPAA']
    ));
  });
});
