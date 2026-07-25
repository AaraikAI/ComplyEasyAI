import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.unmock('react-router');

// Mock lazy-loaded sub-components
vi.mock('../../RiskManagement', () => ({
  RiskManagement: (props: any) => <div data-testid="risk-management">RiskManagement</div>,
  default: { RiskManagement: (props: any) => <div data-testid="risk-management">RiskManagement</div> },
}));
vi.mock('../../RiskHeatMap', () => ({ default: () => <div data-testid="risk-heatmap">RiskHeatMap</div> }));
vi.mock('../../RiskCanvas', () => ({ default: () => <div data-testid="risk-canvas">RiskCanvas</div> }));
vi.mock('../../MyTasks', () => ({
  MyTasks: () => <div data-testid="my-tasks">MyTasks</div>,
  default: { MyTasks: () => <div data-testid="my-tasks">MyTasks</div> },
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    ShieldAlert: (props: any) => <svg data-testid="icon-shield-alert" {...props} />,
    Target: (props: any) => <svg data-testid="icon-target" {...props} />,
    Network: (props: any) => <svg data-testid="icon-network" {...props} />,
    CheckSquare: (props: any) => <svg data-testid="icon-check-square" {...props} />,
  };
});

import RiskHub from '../../hubs/RiskHub';

const renderWithRouter = (initialEntry = '/risk') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RiskHub />
    </MemoryRouter>
  );
};

describe('RiskHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Risk Register')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Risk Register')).toBeInTheDocument();
    expect(screen.getByText('Heat Map')).toBeInTheDocument();
    expect(screen.getByText('Risk Canvas')).toBeInTheDocument();
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    const tabs = ['Risk Register', 'Heat Map', 'Risk Canvas', 'My Tasks'];
    tabs.forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('risk-management')).toBeInTheDocument();
    });
  });

  it('switches to Heat Map tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Heat Map'));
    await waitFor(() => {
      expect(screen.getByTestId('risk-heatmap')).toBeInTheDocument();
    });
  });

  it('switches to Risk Canvas tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Risk Canvas'));
    await waitFor(() => {
      expect(screen.getByTestId('risk-canvas')).toBeInTheDocument();
    });
  });

  it('switches to My Tasks tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('My Tasks'));
    await waitFor(() => {
      expect(screen.getByTestId('my-tasks')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();

    // Click Heat Map
    fireEvent.click(screen.getByText('Heat Map'));
    await waitFor(() => {
      expect(screen.getByTestId('risk-heatmap')).toBeInTheDocument();
    });

    // Click back to Risk Register
    fireEvent.click(screen.getByText('Risk Register'));
    await waitFor(() => {
      expect(screen.getByTestId('risk-management')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    // The component should eventually render (Suspense resolves)
    await waitFor(() => {
      expect(screen.getByTestId('risk-management')).toBeInTheDocument();
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
