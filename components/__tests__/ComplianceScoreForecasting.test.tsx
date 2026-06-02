import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    ai: { forecastComplianceScore: vi.fn().mockResolvedValue({ keyInsights: [], recommendedActions: [], summary: '' }) },
  },
}));

import { ComplianceScoreForecasting } from '../ComplianceScoreForecasting';

describe('ComplianceScoreForecasting', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // The component fetches live forecasting projections and historical scores on mount.
    mockGet.mockImplementation((path: string) => {
      if (path === '/compliance/forecasting') {
        return Promise.resolve({
          projections: [
            { id: 'soc2', name: 'SOC 2 Type II', currentScore: 82, projected30: 84, projected60: 86, projected90: 88, projected180: 90, trend: 'improving', trendDelta: 2, category: 'Security' },
          ],
          riskFactors: [
            { id: 'rf1', title: 'EU AI Act enforcement', description: 'd', category: 'regulation', severity: 'critical', impactScore: 5, expectedDate: '2026-06-01', status: 'active', affectedFrameworks: ['SOC 2 Type II'] },
          ],
          recommendations: [
            { id: 'rc1', title: 'Enable MFA everywhere', description: 'd', priority: 'high', estimatedImpact: 3, effort: 'medium', category: 'Technical', affectedFrameworks: ['SOC 2 Type II'], timeToImplement: '2 weeks', status: 'pending' },
          ],
        });
      }
      if (path === '/compliance/history') {
        return Promise.resolve([
          { month: 'Jan 2026', overall: 80, technical: 82, administrative: 78, physical: 80 },
          { month: 'Feb 2026', overall: 82, technical: 84, administrative: 79, physical: 81 },
        ]);
      }
      return Promise.resolve({});
    });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    expect(screen.getByText('Compliance Score Forecasting')).toBeInTheDocument();
  });

  it('fetches live forecasting + history data on mount and renders a projection', async () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // Confirm the component pulls live data rather than relying on built-in static values.
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/compliance/forecasting'));
    expect(mockGet).toHaveBeenCalledWith('/compliance/history');
    // The fetched framework projection name should appear in the dashboard table.
    expect(await screen.findByText('SOC 2 Type II')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button');
    expect(backBtn).not.toBeNull();
    fireEvent.click(backBtn as HTMLElement);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows risk factors section', async () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    expect(await screen.findByText(/Key Risk Factors Affecting Forecast/i)).toBeInTheDocument();
    // The live risk factor returned by the API should be rendered.
    expect(await screen.findByText(/EU AI Act enforcement/i)).toBeInTheDocument();
  });

  it('shows recommendations section', async () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    expect(await screen.findByText(/AI-Generated Top Recommendations/i)).toBeInTheDocument();
    expect(await screen.findByText(/Enable MFA everywhere/i)).toBeInTheDocument();
  });

  it('renders what-if scenarios', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // Navigate to the What-If tab and assert a preset scenario renders.
    fireEvent.click(screen.getByRole('button', { name: /What-If Scenarios/i }));
    expect(screen.getByText(/What-If Scenario Modeling/i)).toBeInTheDocument();
    // The preset scenario appears in both the selector grid and the comparison table.
    expect(screen.getAllByText('Full Encryption Implementation').length).toBeGreaterThan(0);
  });

  it('shows historical data section', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /History/i }));
    expect(screen.getByText(/Historical Compliance Score Trend/i)).toBeInTheDocument();
    expect(screen.getByText(/Monthly Score Breakdown/i)).toBeInTheDocument();
  });

  it('renders overall score display', async () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // Dashboard score cards are present on the default tab.
    expect(screen.getByText('Current Score')).toBeInTheDocument();
    expect(screen.getByText('90-Day Projection')).toBeInTheDocument();
    // Once projections load, the single framework's current score (82) drives the overall ring.
    expect(await screen.findByText('SOC 2 Type II')).toBeInTheDocument();
  });

  it('handles tab navigation between dashboard and projections', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Projections/i }));
    expect(screen.getByText(/All Risk Factors Affecting Compliance Forecast/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Dashboard/i }));
    expect(screen.getByText(/Framework Compliance Trajectory/i)).toBeInTheDocument();
  });

  it('renders projection timeline data', async () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Projections/i }));
    // The projection card timeline shows Now/30d/60d/90d/180d points for the loaded framework.
    expect(await screen.findByText('SOC 2 Type II')).toBeInTheDocument();
    expect(screen.getAllByText('180d').length).toBeGreaterThan(0);
  });
});
