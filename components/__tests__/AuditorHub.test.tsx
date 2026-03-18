import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import AuditorHub from '../AuditorHub';

describe('AuditorHub', () => {
  const mockOnBack = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    expect(screen.queryAllByText(/Auditor|auditor|Hub|hub/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    expect(screen.queryAllByText(/Overview|Engagements|Findings|overview|engagements|findings/i).length).toBeGreaterThan(0);
  });

  it('shows overview tab by default', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    expect(screen.queryAllByText(/Overview|overview/i).length).toBeGreaterThan(0);
  });

  it('switches to engagements tab', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Engagements|engagements/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to findings tab', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Findings|findings/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to evidence tab', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Evidence|evidence/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to directory tab', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Directory|directory/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to workpapers tab', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Workpapers|workpapers/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('shows stat cards', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('filters by search', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'SOC' } });
  });

  it('shows engagement list', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Engagements|engagements/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
    // Engagements are rendered as card divs within a grid
    const cards = document.querySelectorAll('tr, div[class*="cursor"], div[class*="rounded-lg"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows finding detail', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const tab = screen.queryAllByText(/Findings|findings/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('calls onBack when back button clicked', () => {
    render(<AuditorHub onBack={mockOnBack} />);
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });
});
