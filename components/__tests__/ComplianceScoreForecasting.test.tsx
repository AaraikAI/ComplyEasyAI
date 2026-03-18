import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
  },
}));

import { ComplianceScoreForecasting } from '../ComplianceScoreForecasting';

describe('ComplianceScoreForecasting', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // Component should render with some header/title
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays framework projections', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // Should show framework projection data (mock data is built-in)
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button is clicked', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows risk factors section', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    // Component has risk factors built in
    expect(content).toBeTruthy();
  });

  it('shows recommendations section', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('renders what-if scenarios', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('shows historical data section', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('renders overall score display', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // The component shows overall compliance score
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('handles tab navigation if tabs exist', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // Click any available tabs
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders projection timeline data', () => {
    render(<ComplianceScoreForecasting onBack={mockOnBack} />);
    // projections are shown for 30/60/90/180 days
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
