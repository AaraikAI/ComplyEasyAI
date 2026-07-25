import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.unmock('react-router');

vi.mock('../../IssueManagement', () => ({ default: () => <div data-testid="issue-management">IssueManagement</div> }));
vi.mock('../../IncidentManagement', () => ({ default: () => <div data-testid="incident-management">IncidentManagement</div> }));
vi.mock('../../BreachNotificationWizard', () => ({
  BreachNotificationWizard: (props: any) => <div data-testid="breach-wizard">BreachNotificationWizard</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    AlertTriangle: (props: any) => <svg data-testid="icon-alert-triangle" {...props} />,
    AlertOctagon: (props: any) => <svg data-testid="icon-alert-octagon" {...props} />,
    ShieldAlert: (props: any) => <svg data-testid="icon-shield-alert" {...props} />,
  };
});

import IncidentHub from '../../hubs/IncidentHub';

const renderWithRouter = (initialEntry = '/incidents') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <IncidentHub />
    </MemoryRouter>
  );
};

describe('IncidentHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('Incidents')).toBeInTheDocument();
    expect(screen.getByText('Breach Notification')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Issues', 'Incidents', 'Breach Notification'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('issue-management')).toBeInTheDocument();
    });
  });

  it('switches to Incidents tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Incidents'));
    await waitFor(() => {
      expect(screen.getByTestId('incident-management')).toBeInTheDocument();
    });
  });

  it('switches to Breach Notification tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Breach Notification'));
    await waitFor(() => {
      expect(screen.getByTestId('breach-wizard')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Incidents'));
    await waitFor(() => {
      expect(screen.getByTestId('incident-management')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Issues'));
    await waitFor(() => {
      expect(screen.getByTestId('issue-management')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('issue-management')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 3 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
  });
});
