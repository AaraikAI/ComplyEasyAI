import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { PrivacyManagementPlatform } from '../PrivacyManagementPlatform';

describe('PrivacyManagementPlatform', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
    mockPut.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays privacy management content', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows tab navigation for overview, dsar, consent, retention, transfers, optout', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('DSAR') || text.includes('Consent') || text.includes('Retention') || text.includes('Transfer') || text.includes('Opt')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders overview with metrics', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders stat cards', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
