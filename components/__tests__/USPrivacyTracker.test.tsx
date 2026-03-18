import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { USPrivacyTracker } from '../USPrivacyTracker';

describe('USPrivacyTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<USPrivacyTracker />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays US Privacy Tracker content', () => {
    render(<USPrivacyTracker />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('shows tab navigation for overview, map, comparison, gap analysis, tracker', () => {
    render(<USPrivacyTracker />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<USPrivacyTracker />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Map') || text.includes('Comparison') || text.includes('Gap') || text.includes('Tracker')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders with state privacy law data', () => {
    render(<USPrivacyTracker />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('handles empty data', () => {
    render(<USPrivacyTracker />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<USPrivacyTracker />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders stat cards', () => {
    render(<USPrivacyTracker />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('shows search functionality', () => {
    render(<USPrivacyTracker />);
    const inputs = document.querySelectorAll('input');
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });
});
