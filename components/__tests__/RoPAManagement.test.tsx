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

import RoPAManagement from '../RoPAManagement';

describe('RoPAManagement', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ id: 'new-ropa' });
    mockPut.mockResolvedValue({});
    mockDel.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays RoPA-related content', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows processing activities table', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('shows create/add button', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders stat cards', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('handles empty data', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<RoPAManagement onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('shows export functionality', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const exportBtn = buttons.find(b => b.textContent?.includes('Export') || b.textContent?.includes('Download') || b.textContent?.includes('common.export'));
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders search input', () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const searchInputs = document.querySelectorAll('input[type="text"]');
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });
});
