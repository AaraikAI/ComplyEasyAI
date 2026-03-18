import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

vi.mock('../../EvidenceCollectionRules', () => ({ default: () => <div data-testid="evidence-collection">EvidenceCollectionRules</div> }));
vi.mock('../../AIFeatures/EvidenceCompletenessChecker', () => ({
  EvidenceCompletenessChecker: (props: any) => <div data-testid="evidence-checker">EvidenceCompletenessChecker</div>,
}));
vi.mock('../../ExceptionManagement', () => ({ default: () => <div data-testid="exception-management">ExceptionManagement</div> }));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    ScanSearch: (props: any) => <svg data-testid="icon-scan-search" {...props} />,
    Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
    FileWarning: (props: any) => <svg data-testid="icon-file-warning" {...props} />,
  };
});

import EvidenceHub from '../../hubs/EvidenceHub';

const renderWithRouter = (initialEntry = '/evidence') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <EvidenceHub />
    </MemoryRouter>
  );
};

describe('EvidenceHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Evidence Collection')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Evidence Collection')).toBeInTheDocument();
    expect(screen.getByText('Completeness Checker')).toBeInTheDocument();
    expect(screen.getByText('Exceptions')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Evidence Collection', 'Completeness Checker', 'Exceptions'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('evidence-collection')).toBeInTheDocument();
    });
  });

  it('switches to Completeness Checker tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Completeness Checker'));
    await waitFor(() => {
      expect(screen.getByTestId('evidence-checker')).toBeInTheDocument();
    });
  });

  it('switches to Exceptions tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Exceptions'));
    await waitFor(() => {
      expect(screen.getByTestId('exception-management')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Exceptions'));
    await waitFor(() => {
      expect(screen.getByTestId('exception-management')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Evidence Collection'));
    await waitFor(() => {
      expect(screen.getByTestId('evidence-collection')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('evidence-collection')).toBeInTheDocument();
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
