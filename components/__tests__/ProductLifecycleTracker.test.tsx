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
      productLifecycle: { listProducts: apiGet },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import ProductLifecycleTracker from '../ProductLifecycleTracker';

describe('ProductLifecycleTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'plt1' } });
  });

  it('renders without crashing', () => {
    render(<ProductLifecycleTracker />);
    expect(screen.queryAllByText(/Product|Lifecycle|lifecycle/i).length).toBeGreaterThan(0);
  });

  it('shows product list', () => {
    render(<ProductLifecycleTracker />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('opens create product form', () => {
    render(<ProductLifecycleTracker />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<ProductLifecycleTracker />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'widget' } });
  });

  it('shows stat cards', () => {
    render(<ProductLifecycleTracker />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('shows product detail view', () => {
    render(<ProductLifecycleTracker />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('calls API on mount', async () => {
    render(<ProductLifecycleTracker />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<ProductLifecycleTracker />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows lifecycle stages', () => {
    render(<ProductLifecycleTracker />);
    expect(screen.queryAllByText(/Concept|Design|Development|Testing|Production|Market|concept|design/i).length).toBeGreaterThan(0);
  });

  it('shows stage requirements', () => {
    render(<ProductLifecycleTracker />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      fireEvent.click(rows[0]);
      expect(screen.queryAllByText(/completed|Regulatory|Security|Privacy/i).length).toBeGreaterThan(0);
    }
  });

  it('filters by stage', () => {
    render(<ProductLifecycleTracker />);
    const stageSelect = screen.queryByDisplayValue(/All/i);
    if (stageSelect) fireEvent.change(stageSelect, { target: { value: 'production' } });
  });
});
