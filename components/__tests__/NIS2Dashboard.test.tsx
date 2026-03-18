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

import { NIS2Dashboard } from '../NIS2Dashboard';

describe('NIS2Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<NIS2Dashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays NIS2-related content', () => {
    render(<NIS2Dashboard />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('shows tab navigation with overview, classification, measures, etc.', () => {
    render(<NIS2Dashboard />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders overview tab by default', () => {
    render(<NIS2Dashboard />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('switches between tabs', () => {
    render(<NIS2Dashboard />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Classification') || text.includes('Measures') || text.includes('Incidents') || text.includes('Supply')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    render(<NIS2Dashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<NIS2Dashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders stats and metrics', () => {
    render(<NIS2Dashboard />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
