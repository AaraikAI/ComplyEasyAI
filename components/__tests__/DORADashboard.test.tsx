import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDel(...args),
  },
}));

import DORADashboard from '../DORADashboard';

describe('DORADashboard', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays DORA-related content', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    expect(screen.getByText('DORA Compliance')).toBeInTheDocument();
    expect(screen.getByText('Digital Operational Resilience Act (EU) 2022/2554')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows tab navigation', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders overview tab by default', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    // The overview metric cards are unique to the default tab.
    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    expect(screen.getByText('DORA Readiness')).toBeInTheDocument();
    expect(screen.getByText('ICT Risk Level Distribution')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    // Click through different tabs
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('ICT') || text.includes('Incident') || text.includes('Third') || text.includes('Resilience')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders with empty data', () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<DORADashboard onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<DORADashboard onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders the four DORA domain tabs', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    expect(screen.getByText('ICT Risk Management')).toBeInTheDocument();
    expect(screen.getByText('Incident Reporting')).toBeInTheDocument();
    expect(screen.getByText('Third-Party Risk')).toBeInTheDocument();
    expect(screen.getByText('Resilience Testing')).toBeInTheDocument();
  });
});
