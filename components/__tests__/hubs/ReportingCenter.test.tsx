import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.unmock('react-router-dom');

vi.mock('../../Reports', () => ({
  Reports: () => <div data-testid="reports">Reports</div>,
}));
vi.mock('../../ReportBuilder', () => ({ default: () => <div data-testid="report-builder">ReportBuilder</div> }));
vi.mock('../../AIReportGenerator', () => ({
  AIReportGenerator: () => <div data-testid="ai-report-generator">AIReportGenerator</div>,
}));
vi.mock('../../ESGReportingModule', () => ({
  ESGReportingModule: (props: any) => <div data-testid="esg-reporting">ESGReportingModule</div>,
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    FileText: (props: any) => <svg data-testid="icon-file-text" {...props} />,
    BarChart3: (props: any) => <svg data-testid="icon-bar-chart" {...props} />,
    Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
    Leaf: (props: any) => <svg data-testid="icon-leaf" {...props} />,
  };
});

import ReportingCenter from '../../hubs/ReportingCenter';

const renderWithRouter = (initialEntry = '/reports') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ReportingCenter />
    </MemoryRouter>
  );
};

describe('ReportingCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
    expect(screen.getByText('Report Builder')).toBeInTheDocument();
    expect(screen.getByText('AI Generator')).toBeInTheDocument();
    expect(screen.getByText('ESG Reports')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    ['Reports', 'Report Builder', 'AI Generator', 'ESG Reports'].forEach(label => {
      const buttons = nav.querySelectorAll('button');
      const button = Array.from(buttons).find(btn => btn.textContent?.includes(label));
      expect(button).toBeTruthy();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('reports')).toBeInTheDocument();
    });
  });

  it('switches to Report Builder tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Report Builder'));
    await waitFor(() => {
      expect(screen.getByTestId('report-builder')).toBeInTheDocument();
    });
  });

  it('switches to AI Generator tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('AI Generator'));
    await waitFor(() => {
      expect(screen.getByTestId('ai-report-generator')).toBeInTheDocument();
    });
  });

  it('switches to ESG Reports tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('ESG Reports'));
    await waitFor(() => {
      expect(screen.getByTestId('esg-reporting')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('ESG Reports'));
    await waitFor(() => {
      expect(screen.getByTestId('esg-reporting')).toBeInTheDocument();
    });
    // Use the tab navigation to find the Reports button specifically
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const reportsBtn = Array.from(nav.querySelectorAll('button')).find(btn => btn.textContent?.includes('Reports') && !btn.textContent?.includes('ESG'));
    fireEvent.click(reportsBtn!);
    await waitFor(() => {
      expect(screen.getByTestId('reports')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('reports')).toBeInTheDocument();
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
