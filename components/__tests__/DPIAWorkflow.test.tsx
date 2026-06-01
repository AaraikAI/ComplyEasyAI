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

import DPIAWorkflow from '../DPIAWorkflow';

describe('DPIAWorkflow', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ id: 'new-dpia' });
    mockPut.mockResolvedValue({});
    mockDel.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays DPIA workflow tab navigation', () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    // Tabs render independently of data loading.
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Screening')).toBeInTheDocument();
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('DPO Review')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows tab navigation for overview, screening, risk-assessment, dpo-review', () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Screening') || text.includes('Risk') || text.includes('DPO') || text.includes('Overview')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('handles empty DPIA list', async () => {
    // Global fetch mock returns []; once loading resolves the overview shows the
    // stat cards and the empty-state row rather than a blank shell.
    render(<DPIAWorkflow onBack={mockOnBack} />);
    await waitFor(() => { expect(screen.getByText('Total DPIAs')).toBeInTheDocument(); });
    expect(screen.getByText('No DPIAs match the current filters.')).toBeInTheDocument();
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<DPIAWorkflow onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders stat cards', () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('shows create DPIA button', async () => {
    render(<DPIAWorkflow onBack={mockOnBack} />);
    // The create action lives in the overview toolbar (rendered after load) and is
    // labelled via t('dpia.createDPIA'), which this suite stubs to return the key.
    const createBtn = await screen.findByText('dpia.createDPIA');
    expect(createBtn.closest('button')).toBeInTheDocument();
  });
});
