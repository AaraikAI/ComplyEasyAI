import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.unmock('react-router');

vi.mock('../../MonitoringDashboard', () => ({ default: () => <div data-testid="monitoring-dashboard">MonitoringDashboard</div> }));
vi.mock('../../RealTimeAnalytics', () => ({ default: () => <div data-testid="realtime-analytics">RealTimeAnalytics</div> }));
vi.mock('../../ComplianceScoreForecasting', () => ({
  ComplianceScoreForecasting: (props: any) => <div data-testid="score-forecasting">ComplianceScoreForecasting</div>,
}));
vi.mock('../../ComplianceCostDashboard', () => ({ default: () => <div data-testid="cost-dashboard">ComplianceCostDashboard</div> }));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    Monitor: (props: any) => <svg data-testid="icon-monitor" {...props} />,
    Activity: (props: any) => <svg data-testid="icon-activity" {...props} />,
    TrendingUp: (props: any) => <svg data-testid="icon-trending-up" {...props} />,
    DollarSign: (props: any) => <svg data-testid="icon-dollar-sign" {...props} />,
  };
});

import AnalyticsHub from '../../hubs/AnalyticsHub';

const renderWithRouter = (initialEntry = '/analytics') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AnalyticsHub />
    </MemoryRouter>
  );
};

describe('AnalyticsHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Live Monitoring')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Live Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Score Forecasting')).toBeInTheDocument();
    expect(screen.getByText('Cost Analytics')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Live Monitoring', 'Analytics', 'Score Forecasting', 'Cost Analytics'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('monitoring-dashboard')).toBeInTheDocument();
    });
  });

  it('switches to Analytics tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Analytics'));
    await waitFor(() => {
      expect(screen.getByTestId('realtime-analytics')).toBeInTheDocument();
    });
  });

  it('switches to Score Forecasting tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Score Forecasting'));
    await waitFor(() => {
      expect(screen.getByTestId('score-forecasting')).toBeInTheDocument();
    });
  });

  it('switches to Cost Analytics tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Cost Analytics'));
    await waitFor(() => {
      expect(screen.getByTestId('cost-dashboard')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Cost Analytics'));
    await waitFor(() => {
      expect(screen.getByTestId('cost-dashboard')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Live Monitoring'));
    await waitFor(() => {
      expect(screen.getByTestId('monitoring-dashboard')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('monitoring-dashboard')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 4 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
  });
});
