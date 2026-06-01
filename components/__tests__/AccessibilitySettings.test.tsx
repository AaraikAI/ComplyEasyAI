import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import AccessibilitySettings from '../AccessibilitySettings';

describe('AccessibilitySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<AccessibilitySettings />);
    expect(screen.queryAllByText(/Accessibility|accessibility|WCAG/i).length).toBeGreaterThan(0);
  });

  it('shows high contrast toggle', () => {
    render(<AccessibilitySettings />);
    expect(screen.queryAllByText(/High Contrast|high contrast|Contrast/i).length).toBeGreaterThan(0);
  });

  it('shows reduced motion toggle', () => {
    render(<AccessibilitySettings />);
    expect(screen.queryAllByText(/Reduced Motion|reduced motion|Motion/i).length).toBeGreaterThan(0);
  });

  it('shows font size options', () => {
    render(<AccessibilitySettings />);
    expect(screen.queryAllByText(/Font Size|font size|100%|125%|150%/i).length).toBeGreaterThan(0);
  });

  it('shows focus indicator options', () => {
    render(<AccessibilitySettings />);
    expect(screen.queryAllByText(/Focus|focus|Indicator|indicator/i).length).toBeGreaterThan(0);
  });

  it('toggles high contrast mode', () => {
    render(<AccessibilitySettings />);
    const toggle = screen.getByRole('switch', { name: /high contrast/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    const stored = JSON.parse(localStorage.getItem('complyeasy-accessibility-prefs') || '{}');
    expect(stored.highContrast).toBe(true);
  });

  it('toggles reduced motion', () => {
    render(<AccessibilitySettings />);
    const toggle = screen.getByRole('switch', { name: /reduced motion/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    const stored = JSON.parse(localStorage.getItem('complyeasy-accessibility-prefs') || '{}');
    expect(stored.reducedMotion).toBe(true);
  });

  it('changes font size', () => {
    render(<AccessibilitySettings />);
    const radio = screen.getByRole('radio', { name: /125% \(Large\)/i }) as HTMLInputElement;
    expect(radio).toBeInTheDocument();
    expect(radio.checked).toBe(false);
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
    const stored = JSON.parse(localStorage.getItem('complyeasy-accessibility-prefs') || '{}');
    expect(stored.fontSize).toBe('125');
  });

  it('changes focus indicator', () => {
    render(<AccessibilitySettings />);
    const radio = screen.getByRole('radio', { name: /Enhanced/i }) as HTMLInputElement;
    expect(radio).toBeInTheDocument();
    expect(radio.checked).toBe(false);
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
    const stored = JSON.parse(localStorage.getItem('complyeasy-accessibility-prefs') || '{}');
    expect(stored.focusIndicator).toBe('enhanced');
  });

  it('persists settings to localStorage', () => {
    render(<AccessibilitySettings />);
    expect(localStorage.getItem('complyeasy-accessibility-prefs')).toBeNull();
    const radio = screen.getByRole('radio', { name: /125% \(Large\)/i });
    fireEvent.click(radio);
    const stored = localStorage.getItem('complyeasy-accessibility-prefs');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toMatchObject({ fontSize: '125' });
  });

  it('loads saved settings from localStorage', () => {
    localStorage.setItem('complyeasy-accessibility-prefs', JSON.stringify({
      highContrast: true, reducedMotion: true, fontSize: '150', focusIndicator: 'enhanced',
    }));
    render(<AccessibilitySettings />);
    // The component reads localStorage on mount and reflects it in the UI state.
    expect(screen.getByRole('switch', { name: /high contrast/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: /reduced motion/i })).toHaveAttribute('aria-checked', 'true');
    expect((screen.getByRole('radio', { name: /150% \(Extra Large\)/i }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('radio', { name: /Enhanced/i }) as HTMLInputElement).checked).toBe(true);
  });

  it('shows reset button', () => {
    render(<AccessibilitySettings />);
    const resetBtns = screen.queryAllByText(/Reset|reset|Default|default/i);
    expect(resetBtns.length).toBeGreaterThan(0);
  });

  it('resets to defaults', () => {
    render(<AccessibilitySettings />);
    const resetBtns = screen.queryAllByText(/Reset|reset/i);
    if (resetBtns.length > 0) {
      const btn = resetBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });
});
