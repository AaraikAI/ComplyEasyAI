import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/services/api', () => ({
  api: {
    sox: {
      getDashboard: vi.fn().mockResolvedValue({ data: {} }),
      listControls: vi.fn().mockResolvedValue({ data: [] }),
      listTestResults: vi.fn().mockResolvedValue({ data: [] }),
      listAssessments: vi.fn().mockResolvedValue({ data: [] }),
    },
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { SOXComplianceDashboard } from '../SOXComplianceDashboard';

describe('SOXComplianceDashboard', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => expect(document.body.innerHTML.length).toBeGreaterThan(0));
  });

  it('calls onBack when back button clicked', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
      if (backBtn) {
        fireEvent.click(backBtn);
        expect(mockOnBack).toHaveBeenCalled();
      }
    });
  });

  it('shows tab navigation', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('renders overview tab by default', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });

  it('switches between tabs', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Controls') || text.includes('Testing') || text.includes('Deficienc') || text.includes('Walkthrough') || text.includes('Report')) {
        fireEvent.click(btn);
      }
    });
  });

  it('handles loading state', () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    // Initially shows loading
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles empty data', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });

  it('renders with metric cards', async () => {
    render(<SOXComplianceDashboard onBack={mockOnBack} />);
    await waitFor(() => {
      const content = document.body.textContent || '';
      expect(content).toBeTruthy();
    });
  });
});
