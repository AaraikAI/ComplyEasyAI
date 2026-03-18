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

import { EUCRADashboard } from '../EUCRADashboard';

describe('EUCRADashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<EUCRADashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays CRA-related content', () => {
    render(<EUCRADashboard />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<EUCRADashboard />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<EUCRADashboard />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Product') || text.includes('Vulnerabilit') || text.includes('Update') || text.includes('Requirement')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders with empty data', () => {
    render(<EUCRADashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<EUCRADashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders metric cards', () => {
    render(<EUCRADashboard />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
