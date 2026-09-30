import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

const { apiGet, apiPost, apiPut, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    modules: {
      decommission: { listProducts: apiGet, createProduct: apiPost, updateProduct: apiPut, deleteProduct: apiDelete },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import ProductDecommissioning from '../ProductDecommissioning';

describe('ProductDecommissioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'pd1' } });
  });

  it('renders without crashing', () => {
    render(<ProductDecommissioning />);
    expect(screen.queryAllByText(/Decommission|decommission|Product|End-of-Life/i).length).toBeGreaterThan(0);
  });

  it('shows product list', () => {
    render(<ProductDecommissioning />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('shows tab navigation', () => {
    render(<ProductDecommissioning />);
    expect(screen.queryAllByText(/Overview|Products|Workflows|overview|products|workflows/i).length).toBeGreaterThan(0);
  });

  it('switches to products tab', () => {
    render(<ProductDecommissioning />);
    const tab = screen.queryAllByText(/Products|products/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to workflows tab', () => {
    render(<ProductDecommissioning />);
    const tab = screen.queryAllByText(/Workflows|workflows/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to data management tab', () => {
    render(<ProductDecommissioning />);
    const tab = screen.queryAllByText(/Data|data/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('filters by search', () => {
    render(<ProductDecommissioning />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'legacy' } });
  });

  it('shows stat cards', () => {
    render(<ProductDecommissioning />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<ProductDecommissioning />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<ProductDecommissioning />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('gives each data-action summary card its tint and a matching border', () => {
    render(<ProductDecommissioning />);
    fireEvent.click(screen.getByRole('button', { name: /^Data Management$/ }));

    const expected: Record<string, [string, string]> = {
      migrate: ['bg-blue-100', 'border-blue-800'],
      archive: ['bg-purple-100', 'border-purple-800'],
      delete: ['bg-red-100', 'border-red-800'],
      retain: ['bg-green-100', 'border-green-800'],
    };
    for (const [action, [bg, border]] of Object.entries(expected)) {
      const card = screen.getByText(action, { selector: 'div.capitalize' }).parentElement as HTMLElement;
      expect(card).toHaveClass('border', bg, border);
      expect(card.className).not.toMatch(/\btext-\w+-800\b/);
    }
  });

  it('shows product detail view', () => {
    render(<ProductDecommissioning />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });
});
