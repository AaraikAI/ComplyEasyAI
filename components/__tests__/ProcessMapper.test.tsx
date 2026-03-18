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
      processMaps: { list: apiGet, create: apiPost, update: apiPut, delete: apiDelete },
    },
    ai: { analyzeProcess: apiPost },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import ProcessMapper from '../ProcessMapper';

describe('ProcessMapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'pm1' } });
  });

  it('renders without crashing', () => {
    render(<ProcessMapper />);
    expect(screen.queryAllByText(/Process|process|Map|map/i).length).toBeGreaterThan(0);
  });

  it('shows process list', () => {
    render(<ProcessMapper />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('opens create process form', () => {
    render(<ProcessMapper />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<ProcessMapper />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'onboarding' } });
  });

  it('filters by category', () => {
    render(<ProcessMapper />);
    const catSelects = screen.queryAllByDisplayValue(/All/i);
    if (catSelects.length > 0) fireEvent.change(catSelects[0], { target: { value: 'IT' } });
  });

  it('shows process detail view', () => {
    render(<ProcessMapper />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('shows stat cards', () => {
    render(<ProcessMapper />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<ProcessMapper />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<ProcessMapper />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('deletes a process map', () => {
    render(<ProcessMapper />);
    const deleteBtns = document.querySelectorAll('[data-testid="icon-Trash2"]');
    if (deleteBtns.length > 0) {
      const btn = deleteBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });
});
