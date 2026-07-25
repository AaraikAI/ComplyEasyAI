import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.unmock('react-router');

vi.mock('../../ProductLifecycleTracker', () => ({
  ProductLifecycleTracker: (props: any) => <div data-testid="product-lifecycle">ProductLifecycleTracker</div>,
}));
vi.mock('../../CEMarkingWorkflow', () => ({
  CEMarkingWorkflow: (props: any) => <div data-testid="ce-marking">CEMarkingWorkflow</div>,
}));
vi.mock('../../DigitalProductPassport', () => ({
  DigitalProductPassport: (props: any) => <div data-testid="digital-passport">DigitalProductPassport</div>,
}));
vi.mock('../../SBOMManager', () => ({
  SBOMManager: (props: any) => <div data-testid="sbom-manager">SBOMManager</div>,
}));
vi.mock('../../ProductDecommissioning', () => ({
  ProductDecommissioning: (props: any) => <div data-testid="product-decommissioning">ProductDecommissioning</div>,
}));
vi.mock('../../EnvironmentalLifecycle', () => ({
  EnvironmentalLifecycle: (props: any) => <div data-testid="environmental-lifecycle">EnvironmentalLifecycle</div>,
}));
vi.mock('../../CertificationTracker', () => ({ default: () => <div data-testid="certification-tracker">CertificationTracker</div> }));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual as any,
    Recycle: (props: any) => <svg data-testid="icon-recycle" {...props} />,
    Award: (props: any) => <svg data-testid="icon-award" {...props} />,
    Package: (props: any) => <svg data-testid="icon-package" {...props} />,
    FileCode: (props: any) => <svg data-testid="icon-file-code" {...props} />,
    Trash2: (props: any) => <svg data-testid="icon-trash" {...props} />,
    TreePine: (props: any) => <svg data-testid="icon-tree-pine" {...props} />,
    BadgeCheck: (props: any) => <svg data-testid="icon-badge-check" {...props} />,
  };
});

import ProductHub from '../../hubs/ProductHub';

const renderWithRouter = (initialEntry = '/product') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProductHub />
    </MemoryRouter>
  );
};

describe('ProductHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByText('Product Lifecycle')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    renderWithRouter();
    expect(screen.getByText('Product Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('CE Marking')).toBeInTheDocument();
    expect(screen.getByText('Digital Passport')).toBeInTheDocument();
    expect(screen.getByText('SBOM Manager')).toBeInTheDocument();
    expect(screen.getByText('Decommissioning')).toBeInTheDocument();
    expect(screen.getByText('Environmental')).toBeInTheDocument();
    expect(screen.getByText('Certifications')).toBeInTheDocument();
  });

  it('all tabs are clickable buttons', () => {
    renderWithRouter();
    ['Product Lifecycle', 'CE Marking', 'Digital Passport', 'SBOM Manager', 'Decommissioning', 'Environmental', 'Certifications'].forEach(label => {
      const button = screen.getByText(label).closest('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('shows default tab content on initial render', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('product-lifecycle')).toBeInTheDocument();
    });
  });

  it('switches to CE Marking tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('CE Marking'));
    await waitFor(() => {
      expect(screen.getByTestId('ce-marking')).toBeInTheDocument();
    });
  });

  it('switches to Digital Passport tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Digital Passport'));
    await waitFor(() => {
      expect(screen.getByTestId('digital-passport')).toBeInTheDocument();
    });
  });

  it('switches to SBOM Manager tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('SBOM Manager'));
    await waitFor(() => {
      expect(screen.getByTestId('sbom-manager')).toBeInTheDocument();
    });
  });

  it('switches to Decommissioning tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Decommissioning'));
    await waitFor(() => {
      expect(screen.getByTestId('product-decommissioning')).toBeInTheDocument();
    });
  });

  it('switches to Environmental tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Environmental'));
    await waitFor(() => {
      expect(screen.getByTestId('environmental-lifecycle')).toBeInTheDocument();
    });
  });

  it('switches to Certifications tab when clicked', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Certifications'));
    await waitFor(() => {
      expect(screen.getByTestId('certification-tracker')).toBeInTheDocument();
    });
  });

  it('navigating between tabs preserves correct active state', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Environmental'));
    await waitFor(() => {
      expect(screen.getByTestId('environmental-lifecycle')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Product Lifecycle'));
    await waitFor(() => {
      expect(screen.getByTestId('product-lifecycle')).toBeInTheDocument();
    });
  });

  it('lazy-loaded components render within Suspense boundary', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('product-lifecycle')).toBeInTheDocument();
    });
  });

  it('renders tab navigation container with correct aria label', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(nav).toBeInTheDocument();
  });

  it('renders exactly 7 tab buttons', () => {
    renderWithRouter();
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    const buttons = nav.querySelectorAll('button');
    expect(buttons).toHaveLength(7);
  });
});
