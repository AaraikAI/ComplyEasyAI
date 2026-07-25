import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.unmock('react-router');

vi.mock('../../AssetManagement', () => ({ default: () => <div data-testid="asset-management">AssetManagement</div> }));
vi.mock('../../MDMDashboard', () => ({
  MDMDashboard: (props: any) => <div data-testid="mdm-dashboard">MDMDashboard</div>,
}));
vi.mock('../../CICDGateSettings', () => ({ default: () => <div data-testid="cicd-gates">CICDGateSettings</div> }));
vi.mock('../../SecurityFeatures', () => ({ default: (props: any) => <div data-testid="security-features">SecurityFeatures</div> }));
vi.mock('../../BusinessImpactAnalysis', () => ({ default: () => <div data-testid="bia">BusinessImpactAnalysis</div> }));
vi.mock('../../SecurityTrainingDashboard', () => ({ default: (props: any) => <div data-testid="security-training">SecurityTrainingDashboard</div> }));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    Boxes: (props: any) => <svg data-testid="icon-boxes" {...props} />,
    Smartphone: (props: any) => <svg data-testid="icon-smartphone" {...props} />,
    GitBranch: (props: any) => <svg data-testid="icon-git-branch" {...props} />,
    Lock: (props: any) => <svg data-testid="icon-lock" {...props} />,
    Radar: (props: any) => <svg data-testid="icon-radar" {...props} />,
    BookOpen: (props: any) => <svg data-testid="icon-book-open" {...props} />,
  };
});

import EnterpriseOpsHub from '../../hubs/EnterpriseOpsHub';

const renderWithRouter = (initialEntry = '/enterprise-ops') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <EnterpriseOpsHub />
    </MemoryRouter>
  );
};

describe('EnterpriseOpsHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('IT Assets')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('IT Assets')).toBeInTheDocument();
    expect(screen.getByText('Mobile Devices')).toBeInTheDocument();
    expect(screen.getByText('CI/CD Gates')).toBeInTheDocument();
    expect(screen.getByText('Security Features')).toBeInTheDocument();
    expect(screen.getByText('Business Impact')).toBeInTheDocument();
    expect(screen.getByText('Security Training')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['IT Assets', 'Mobile Devices', 'CI/CD Gates', 'Security Features', 'Business Impact', 'Security Training'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('asset-management')).toBeInTheDocument();
    });
  });

  it('switches to Mobile Devices tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Mobile Devices'));
    await waitFor(() => {
      expect(screen.getByTestId('mdm-dashboard')).toBeInTheDocument();
    });
  });

  it('switches to CI/CD Gates tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('CI/CD Gates'));
    await waitFor(() => {
      expect(screen.getByTestId('cicd-gates')).toBeInTheDocument();
    });
  });

  it('switches to Security Features tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Security Features'));
    await waitFor(() => {
      expect(screen.getByTestId('security-features')).toBeInTheDocument();
    });
  });

  it('switches to Business Impact tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Business Impact'));
    await waitFor(() => {
      expect(screen.getByTestId('bia')).toBeInTheDocument();
    });
  });

  it('switches to Security Training tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Security Training'));
    await waitFor(() => {
      expect(screen.getByTestId('security-training')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Security Training'));
    await waitFor(() => {
      expect(screen.getByTestId('security-training')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('IT Assets'));
    await waitFor(() => {
      expect(screen.getByTestId('asset-management')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('asset-management')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 6 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(6);
  });
});
