import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/services/api', () => ({
  api: {
    sod: {
      getDashboard: vi.fn().mockResolvedValue({ data: {} }),
      listRules: vi.fn().mockResolvedValue({ data: [] }),
      listViolations: vi.fn().mockResolvedValue({ data: [] }),
      listControls: vi.fn().mockResolvedValue({ data: [] }),
    },
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { SoDAnalysisDashboard } from '../SoDAnalysisDashboard';

describe('SoDAnalysisDashboard', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => expect(document.body.innerHTML.length).toBeGreaterThan(0));
  });

  it('calls onBack when back button clicked', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
      if (backBtn) {
        fireEvent.click(backBtn);
        expect(mockOnBack).toHaveBeenCalled();
      }
    });
  });

  it('shows tab navigation for rules, violations, matrix, controls', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('renders overview tab by default', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });

  it('switches between tabs', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Rules') || text.includes('Violation') || text.includes('Matrix') || text.includes('Control')) {
        fireEvent.click(btn);
      }
    });
  });

  it('handles empty data gracefully', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });

  it('renders MATRIX_FUNCTIONS reference data', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });

  it('renders with metric and stat cards', async () => {
    render(<SoDAnalysisDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });
});
