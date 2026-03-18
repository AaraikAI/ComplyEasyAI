import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

vi.mock('../../GovernanceManager', () => ({
  GovernanceManager: (props: any) => <div data-testid="governance-manager">GovernanceManager</div>,
}));
vi.mock('../../ProcessMapper', () => ({
  ProcessMapper: (props: any) => <div data-testid="process-mapper">ProcessMapper</div>,
}));
vi.mock('../../WorkflowBuilder', () => ({
  WorkflowBuilder: (props: any) => <div data-testid="workflow-builder">WorkflowBuilder</div>,
}));
vi.mock('../../WorkflowAutomationRules', () => ({ default: () => <div data-testid="automation-rules">WorkflowAutomationRules</div> }));
vi.mock('../../SoDAnalysisDashboard', () => ({
  SoDAnalysisDashboard: (props: any) => <div data-testid="sod-dashboard">SoDAnalysisDashboard</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    UserCheck: (props: any) => <svg data-testid="icon-user-check" {...props} />,
    Workflow: (props: any) => <svg data-testid="icon-workflow" {...props} />,
    Bot: (props: any) => <svg data-testid="icon-bot" {...props} />,
    Scale: (props: any) => <svg data-testid="icon-scale" {...props} />,
  };
});

import GovernanceHub from '../../hubs/GovernanceHub';

const renderWithRouter = (initialEntry = '/governance') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <GovernanceHub />
    </MemoryRouter>
  );
};

describe('GovernanceHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Process Mapper')).toBeInTheDocument();
    expect(screen.getByText('Workflow Builder')).toBeInTheDocument();
    expect(screen.getByText('Automation Rules')).toBeInTheDocument();
    expect(screen.getByText('Segregation of Duties')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Overview', 'Process Mapper', 'Workflow Builder', 'Automation Rules', 'Segregation of Duties'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('governance-manager')).toBeInTheDocument();
    });
  });

  it('switches to Process Mapper tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Process Mapper'));
    await waitFor(() => {
      expect(screen.getByTestId('process-mapper')).toBeInTheDocument();
    });
  });

  it('switches to Workflow Builder tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Workflow Builder'));
    await waitFor(() => {
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument();
    });
  });

  it('switches to Automation Rules tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Automation Rules'));
    await waitFor(() => {
      expect(screen.getByTestId('automation-rules')).toBeInTheDocument();
    });
  });

  it('switches to Segregation of Duties tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Segregation of Duties'));
    await waitFor(() => {
      expect(screen.getByTestId('sod-dashboard')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Automation Rules'));
    await waitFor(() => {
      expect(screen.getByTestId('automation-rules')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Overview'));
    await waitFor(() => {
      expect(screen.getByTestId('governance-manager')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('governance-manager')).toBeInTheDocument();
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
