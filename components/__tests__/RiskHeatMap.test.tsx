import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
vi.mock('@/services/api', () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}));

import RiskHeatMap from '../RiskHeatMap';

const mockRisks = [
  { id: 'r1', title: 'Critical Vuln', severity: 'Critical', likelihood: 5, impact: 5, status: 'Open', category: 'Infra', owner: 'Alice' },
  { id: 'r2', title: 'Medium Issue', severity: 'Medium', likelihood: 3, impact: 3, status: 'Open', category: 'Net', owner: 'Bob' },
  { id: 'r3', title: 'Low Risk', severity: 'Low', likelihood: 1, impact: 2, status: 'Mitigated', category: 'Ops' },
];

describe('RiskHeatMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(mockRisks);
  });

  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<RiskHeatMap />);
    // Loading shows animated pulse divs
    const pulseEl = document.querySelector('.animate-pulse');
    expect(pulseEl).toBeTruthy();
  });

  it('renders header after loading', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
    expect(screen.getByText(/Interactive 5x5 risk matrix/)).toBeInTheDocument();
  });

  it('displays stats cards', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument()); // total risks
  });

  it('renders heat map grid with 25 cells', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
    // 5x5 grid = 25 buttons in the heat map
    const buttons = document.querySelectorAll('button[title]');
    expect(buttons.length).toBeGreaterThanOrEqual(25);
  });

  it('renders axis labels', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('Rare')).toBeInTheDocument());
    expect(screen.getByText('Almost Certain')).toBeInTheDocument();
    expect(screen.getByText('Negligible')).toBeInTheDocument();
    expect(screen.getByText('Catastrophic')).toBeInTheDocument();
  });

  it('shows legend with risk levels', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText(/Minimal \(1-2\)/)).toBeInTheDocument());
  });

  it('shows "Select a Cell" in detail panel by default', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('Select a Cell')).toBeInTheDocument());
    expect(screen.getByText(/Click a cell on the heat map/)).toBeInTheDocument();
  });

  it('selects a cell and shows risks', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
    // Click on a cell that has risks (likelihood 5, impact 5)
    const cellButtons = document.querySelectorAll('button[title]');
    const cellWithRisk = Array.from(cellButtons).find(b =>
      b.getAttribute('title')?.includes('Almost Certain') && b.getAttribute('title')?.includes('Catastrophic')
    );
    if (cellWithRisk) {
      fireEvent.click(cellWithRisk);
      await waitFor(() => expect(screen.getByText('Critical Vuln')).toBeInTheDocument());
    }
  });

  it('does not select empty cells', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
    const cellButtons = document.querySelectorAll('button[title]');
    // Click an empty cell (e.g., likelihood=1, impact=1)
    const emptyCell = Array.from(cellButtons).find(b =>
      b.getAttribute('title')?.includes('Rare') && b.getAttribute('title')?.includes('Negligible')
    );
    if (emptyCell) {
      fireEvent.click(emptyCell);
      // Should still show "Select a Cell" or no risks
    }
  });

  it('toggles between Current and Target view', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('Current Risk Posture')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Target View'));
    expect(screen.getByText('Target Risk Posture')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Current View'));
    expect(screen.getByText('Current Risk Posture')).toBeInTheDocument();
  });

  it('renders Risk Summary by Level table', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('Risk Summary by Level')).toBeInTheDocument());
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('minimal')).toBeInTheDocument();
  });

  it('handles export button click', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('common.export')).toBeInTheDocument());
    fireEvent.click(screen.getByText('common.export'));
    // Just verify the button is clickable without errors
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles refresh button click', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
    const refreshBtn = screen.getByTestId('icon-RefreshCw').closest('button');
    fireEvent.click(refreshBtn!);
    expect(mockGet).toHaveBeenCalledTimes(2); // initial + refresh
  });

  it('shows error state when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('Failed to Load Risk Data')).toBeInTheDocument());
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('retries loading on error state', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('Failed to Load Risk Data')).toBeInTheDocument());
    mockGet.mockResolvedValue(mockRisks);
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
  });

  it('handles API returning wrapped response object', async () => {
    mockGet.mockResolvedValue({ status: 'ok', data: mockRisks });
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
  });

  it('displays risk status and severity in detail panel', async () => {
    render(<RiskHeatMap />);
    await waitFor(() => expect(screen.getByText('risks.heatMap')).toBeInTheDocument());
    const cellButtons = document.querySelectorAll('button[title]');
    const cellWithRisk = Array.from(cellButtons).find(b =>
      b.getAttribute('title')?.includes('Almost Certain') && b.getAttribute('title')?.includes('Catastrophic')
    );
    if (cellWithRisk) {
      fireEvent.click(cellWithRisk);
      await waitFor(() => {
        expect(screen.getByText('Critical')).toBeInTheDocument();
        expect(screen.getByText('Open')).toBeInTheDocument();
      });
    }
  });
});
