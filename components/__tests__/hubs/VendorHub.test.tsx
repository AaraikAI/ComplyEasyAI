import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

// Mock lazy-loaded sub-components
vi.mock('../../VendorManagement', () => ({ default: () => <div data-testid="vendor-management">VendorManagement</div> }));
vi.mock('../../VendorMonitoringDashboard', () => ({ default: () => <div data-testid="vendor-monitoring">VendorMonitoringDashboard</div> }));
vi.mock('../../AIFeatures/VendorScorer', () => ({
  VendorScorer: (props: any) => <div data-testid="vendor-scorer">VendorScorer</div>,
}));
vi.mock('../../AIFeatures/AgenticVendorRisk', () => ({
  AgenticVendorRisk: (props: any) => <div data-testid="agentic-vendor-risk">AgenticVendorRisk</div>,
}));
vi.mock('../../AIFeatures/ContractAnalyzer', () => ({
  ContractAnalyzer: (props: any) => <div data-testid="contract-analyzer">ContractAnalyzer</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    Users: (props: any) => <svg data-testid="icon-users" {...props} />,
    Satellite: (props: any) => <svg data-testid="icon-satellite" {...props} />,
    ShieldAlert: (props: any) => <svg data-testid="icon-shield-alert" {...props} />,
    Target: (props: any) => <svg data-testid="icon-target" {...props} />,
    Briefcase: (props: any) => <svg data-testid="icon-briefcase" {...props} />,
  };
});

import VendorHub from '../../hubs/VendorHub';

const renderWithRouter = (initialEntry = '/vendors') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <VendorHub />
    </MemoryRouter>
  );
};

describe('VendorHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Continuous Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('Agentic Risk Analysis')).toBeInTheDocument();
    expect(screen.getByText('Contract Analyzer')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    const tabs = ['Vendors', 'Continuous Monitoring', 'Risk Assessment', 'Agentic Risk Analysis', 'Contract Analyzer'];
    tabs.forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('vendor-management')).toBeInTheDocument();
    });
  });

  it('switches to Continuous Monitoring tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Continuous Monitoring'));
    await waitFor(() => {
      expect(screen.getByTestId('vendor-monitoring')).toBeInTheDocument();
    });
  });

  it('switches to Risk Assessment tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Risk Assessment'));
    await waitFor(() => {
      expect(screen.getByTestId('vendor-scorer')).toBeInTheDocument();
    });
  });

  it('switches to Agentic Risk Analysis tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Agentic Risk Analysis'));
    await waitFor(() => {
      expect(screen.getByTestId('agentic-vendor-risk')).toBeInTheDocument();
    });
  });

  it('switches to Contract Analyzer tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Contract Analyzer'));
    await waitFor(() => {
      expect(screen.getByTestId('contract-analyzer')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Continuous Monitoring'));
    await waitFor(() => {
      expect(screen.getByTestId('vendor-monitoring')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => {
      expect(screen.getByTestId('vendor-management')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('vendor-management')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 5 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(5);
  });
});
