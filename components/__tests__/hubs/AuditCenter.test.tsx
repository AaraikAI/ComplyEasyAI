import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

vi.mock('../../AuditTrail', () => ({
  AuditTrail: () => <div data-testid="audit-trail">AuditTrail</div>,
}));
vi.mock('../../AuditPrepAssistant', () => ({ default: () => <div data-testid="audit-prep">AuditPrepAssistant</div> }));
vi.mock('../../AIFeatures/AuditSimulator', () => ({
  AuditSimulator: (props: any) => <div data-testid="audit-simulator">AuditSimulator</div>,
}));
vi.mock('../../AuditorHub', () => ({
  AuditorHub: (props: any) => <div data-testid="auditor-hub">AuditorHub</div>,
}));
vi.mock('../../ControlTestResults', () => ({ default: () => <div data-testid="control-test">ControlTestResults</div> }));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    Activity: (props: any) => <svg data-testid="icon-activity" {...props} />,
    Target: (props: any) => <svg data-testid="icon-target" {...props} />,
    Crosshair: (props: any) => <svg data-testid="icon-crosshair" {...props} />,
    BookOpen: (props: any) => <svg data-testid="icon-book-open" {...props} />,
    TestTube: (props: any) => <svg data-testid="icon-test-tube" {...props} />,
  };
});

import AuditCenter from '../../hubs/AuditCenter';

const renderWithRouter = (initialEntry = '/audit') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuditCenter />
    </MemoryRouter>
  );
};

describe('AuditCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Preparation')).toBeInTheDocument();
    expect(screen.getByText('Simulator')).toBeInTheDocument();
    expect(screen.getByText('Auditor Hub')).toBeInTheDocument();
    expect(screen.getByText('Control Testing')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Audit Trail', 'Preparation', 'Simulator', 'Auditor Hub', 'Control Testing'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('audit-trail')).toBeInTheDocument();
    });
  });

  it('switches to Preparation tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Preparation'));
    await waitFor(() => {
      expect(screen.getByTestId('audit-prep')).toBeInTheDocument();
    });
  });

  it('switches to Simulator tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Simulator'));
    await waitFor(() => {
      expect(screen.getByTestId('audit-simulator')).toBeInTheDocument();
    });
  });

  it('switches to Auditor Hub tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Auditor Hub'));
    await waitFor(() => {
      expect(screen.getByTestId('auditor-hub')).toBeInTheDocument();
    });
  });

  it('switches to Control Testing tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Control Testing'));
    await waitFor(() => {
      expect(screen.getByTestId('control-test')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Simulator'));
    await waitFor(() => {
      expect(screen.getByTestId('audit-simulator')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Audit Trail'));
    await waitFor(() => {
      expect(screen.getByTestId('audit-trail')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('audit-trail')).toBeInTheDocument();
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
