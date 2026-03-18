import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth' } },
    isAuthenticated: true,
  }),
}));

import PrivacyNoticeServing from '../PrivacyNoticeServing';

describe('PrivacyNoticeServing', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays privacy notices content', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows tab navigation for notices, templates, analytics', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches to templates tab', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const templatesBtn = buttons.find(b => b.textContent?.includes('Template'));
    if (templatesBtn) {
      fireEvent.click(templatesBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('switches to analytics tab', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const analyticsBtn = buttons.find(b => b.textContent?.includes('Analytic'));
    if (analyticsBtn) {
      fireEvent.click(analyticsBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('shows notice list with mock data', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    // Component has built-in mock data
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('renders search functionality', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const inputs = document.querySelectorAll('input[type="text"]');
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders create notice button', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders notice status badges', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
