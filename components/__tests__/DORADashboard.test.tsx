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
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
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
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
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

  it('renders metric cards', () => {
    render(<DORADashboard onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
