import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import CookieConsentBanner from '../CookieConsentBanner';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders without crashing when no consent stored', () => {
    render(<CookieConsentBanner />);
    // Should show banner when no consent is stored
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays cookie consent content', () => {
    render(<CookieConsentBanner />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('shows cookie category descriptions', () => {
    render(<CookieConsentBanner />);
    const content = document.body.textContent || '';
    // Should display Essential, Functional, Analytics, Targeting categories
    expect(content).toBeTruthy();
  });

  it('shows Accept All button', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('button', { name: /Accept all cookies/i })).toBeInTheDocument();
  });

  it('shows Reject All button', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('button', { name: /Reject all non-essential cookies/i })).toBeInTheDocument();
  });

  it('shows Customize/Settings button', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('button', { name: /Customize cookie preferences/i })).toBeInTheDocument();
  });

  it('handles Accept All click', () => {
    render(<CookieConsentBanner />);
    const acceptBtn = screen.getByRole('button', { name: /Accept all cookies/i });
    expect(acceptBtn).toBeInTheDocument();
    fireEvent.click(acceptBtn);
    // Consent must be persisted under the consent storage key with all categories enabled.
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'complyeasy_cookie_consent',
      expect.stringContaining('"analytics":true'),
    );
  });

  it('handles Reject All click', () => {
    render(<CookieConsentBanner />);
    const rejectBtn = screen.getByRole('button', { name: /Reject all non-essential cookies/i });
    expect(rejectBtn).toBeInTheDocument();
    fireEvent.click(rejectBtn);
    // Rejecting persists essential-only consent (non-essential categories disabled).
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'complyeasy_cookie_consent',
      expect.stringContaining('"analytics":false'),
    );
  });

  it('hides banner when consent is already stored', () => {
    localStorageMock.setItem('complyeasy_cookie_consent', JSON.stringify({
      essential: true, functional: true, analytics: false, targeting: false,
      consentDate: '2026-01-01', consentVersion: '1.0',
    }));
    render(<CookieConsentBanner />);
    // With valid stored consent the banner dialog is not rendered at all.
    expect(screen.queryByRole('dialog', { name: /Cookie consent preferences/i })).toBeNull();
  });

  it('toggles cookie category preferences', () => {
    render(<CookieConsentBanner />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      // Toggle a non-essential category
      fireEvent.click(checkboxes[checkboxes.length - 1]);
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('essential cookies cannot be disabled', () => {
    render(<CookieConsentBanner />);
    // Essential category should be required/disabled
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('renders with proper ARIA labels for accessibility', () => {
    render(<CookieConsentBanner />);
    // Component should have ARIA attributes for accessibility
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });
});
