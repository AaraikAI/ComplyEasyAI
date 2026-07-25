import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.unmock('react-router');

vi.mock('../../AIFeatures/RFPResponder', () => ({
  RFPResponder: (props: any) => <div data-testid="rfp-responder">RFPResponder</div>,
}));
vi.mock('../../AIFeatures/BCPGenerator', () => ({
  BCPGenerator: (props: any) => <div data-testid="bcp-generator">BCPGenerator</div>,
}));
vi.mock('../../AIFeatures/GapAnalysis', () => ({
  GapAnalysis: (props: any) => <div data-testid="gap-analysis">GapAnalysis</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    FileText: (props: any) => <svg data-testid="icon-file-text" {...props} />,
    LifeBuoy: (props: any) => <svg data-testid="icon-life-buoy" {...props} />,
    GitGraph: (props: any) => <svg data-testid="icon-git-graph" {...props} />,
  };
});

import AIDocumentTools from '../../hubs/AIDocumentTools';

const renderWithRouter = (initialEntry = '/ai-documents') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AIDocumentTools />
    </MemoryRouter>
  );
};

describe('AIDocumentTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('RFP Responder')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('RFP Responder')).toBeInTheDocument();
    expect(screen.getByText('BCP Generator')).toBeInTheDocument();
    expect(screen.getByText('Gap Analysis')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['RFP Responder', 'BCP Generator', 'Gap Analysis'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('rfp-responder')).toBeInTheDocument();
    });
  });

  it('switches to BCP Generator tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('BCP Generator'));
    await waitFor(() => {
      expect(screen.getByTestId('bcp-generator')).toBeInTheDocument();
    });
  });

  it('switches to Gap Analysis tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Gap Analysis'));
    await waitFor(() => {
      expect(screen.getByTestId('gap-analysis')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Gap Analysis'));
    await waitFor(() => {
      expect(screen.getByTestId('gap-analysis')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('RFP Responder'));
    await waitFor(() => {
      expect(screen.getByTestId('rfp-responder')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('rfp-responder')).toBeInTheDocument();
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
