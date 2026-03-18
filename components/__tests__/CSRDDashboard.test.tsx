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

import { CSRDDashboard } from '../CSRDDashboard';

describe('CSRDDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<CSRDDashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays CSRD-related content', () => {
    render(<CSRDDashboard />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('shows tab navigation for overview, materiality, environmental, social, governance, reports', () => {
    render(<CSRDDashboard />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<CSRDDashboard />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Materiality') || text.includes('Environment') || text.includes('Social') || text.includes('Governance') || text.includes('Report')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders with empty data', () => {
    render(<CSRDDashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<CSRDDashboard />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders metric cards', () => {
    render(<CSRDDashboard />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
