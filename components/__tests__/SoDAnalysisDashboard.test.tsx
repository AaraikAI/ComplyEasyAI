import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/services/api', () => ({
  api: {
    sod: {
      getDashboard: vi.fn().mockResolvedValue({ data: {} }),
      listRules: vi.fn().mockResolvedValue({ data: [] }),
      listViolations: vi.fn().mockResolvedValue({ data: [] }),
      listControls: vi.fn().mockResolvedValue({ data: [] }),
    },
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { SoDAnalysisDashboard } from '../SoDAnalysisDashboard';

describe('SoDAnalysisDashboard', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    expect(await screen.findByText('Separation of Duties Analysis')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    // getByTestId throws if the icon is missing; assert the wrapping button exists too.
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button');
    expect(backBtn).not.toBeNull();
    fireEvent.click(backBtn as HTMLButtonElement);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows tab navigation for rules, violations, matrix, controls', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await screen.findByText('Separation of Duties Analysis');
    // All five tab labels are present.
    ['Overview', 'Rules', 'Violations', 'Matrix', 'Compensating Controls'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders overview tab by default', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    // The overview tab shows its risk-score and metric headings.
    expect(await screen.findByText('Risk Score')).toBeInTheDocument();
    expect(screen.getByText('Total Rules')).toBeInTheDocument();
    expect(screen.getByText('Violations by Status')).toBeInTheDocument();
  });

  it('switches to the rules tab when clicked', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    fireEvent.click(await screen.findByText('Rules'));
    // The rules table header column appears only on the rules tab.
    expect(await screen.findByText('Rule ID')).toBeInTheDocument();
    expect(screen.getByText('Function A')).toBeInTheDocument();
  });

  it('switches to the violations tab when clicked', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    fireEvent.click(await screen.findByText('Violations'));
    // The violations table header column appears only on the violations tab.
    expect(await screen.findByText('Violation ID')).toBeInTheDocument();
    expect(screen.getByText('Rule Violated')).toBeInTheDocument();
  });

  it('handles empty data gracefully', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    // With no rules/violations, the rules tab still renders its empty count summary.
    fireEvent.click(await screen.findByText('Rules'));
    expect(await screen.findByText('0 of 0 rules shown')).toBeInTheDocument();
  });

  it('renders MATRIX_FUNCTIONS reference data', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    fireEvent.click(await screen.findByText('Matrix'));
    // The matrix tab renders the SoD conflict matrix heading and reference functions.
    expect(await screen.findByText('SoD Conflict Matrix')).toBeInTheDocument();
    expect(screen.getAllByText('Create Purchase Order').length).toBeGreaterThan(0);
  });

  it('renders with metric and stat cards', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    // The overview metric cards render their labels.
    expect(await screen.findByText('Active Violations')).toBeInTheDocument();
    expect(screen.getByText('High Risk Open')).toBeInTheDocument();
    // 'Mitigated' appears on both a metric card and the status breakdown.
    expect(screen.getAllByText('Mitigated').length).toBeGreaterThanOrEqual(2);
  });
});
