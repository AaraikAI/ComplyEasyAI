import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

vi.mock('../../PolicyManagement', () => ({ default: () => <div data-testid="policy-management">PolicyManagement</div> }));
vi.mock('../../AIFeatures/PolicyGenerator', () => ({
  PolicyGenerator: (props: any) => <div data-testid="policy-generator">PolicyGenerator</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    FileCheck: (props: any) => <svg data-testid="icon-file-check" {...props} />,
    Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
  };
});

import PolicyHub from '../../hubs/PolicyHub';

const renderWithRouter = (initialEntry = '/policies') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PolicyHub />
    </MemoryRouter>
  );
};

describe('PolicyHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Policies')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText('AI Generator')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Policies', 'AI Generator'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('policy-management')).toBeInTheDocument();
    });
  });

  it('switches to AI Generator tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('AI Generator'));
    await waitFor(() => {
      expect(screen.getByTestId('policy-generator')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('AI Generator'));
    await waitFor(() => {
      expect(screen.getByTestId('policy-generator')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Policies'));
    await waitFor(() => {
      expect(screen.getByTestId('policy-management')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('policy-management')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 2 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
  });
});
