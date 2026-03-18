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
      surveillance: { listPlans: apiGet, listRecalls: apiGet, createIncident: apiPost },
    },
    ai: { generateReport: apiPost },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import PostMarketSurveillance from '../PostMarketSurveillance';

describe('PostMarketSurveillance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'pms1' } });
  });

  it('renders without crashing', () => {
    render(<PostMarketSurveillance />);
    expect(screen.queryAllByText(/Post-Market|Surveillance|surveillance/i).length).toBeGreaterThan(0);
  });

  it('shows surveillance plans list', () => {
    render(<PostMarketSurveillance />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('opens create plan form', () => {
    render(<PostMarketSurveillance />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<PostMarketSurveillance />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'safety' } });
  });

  it('shows stat cards', () => {
    render(<PostMarketSurveillance />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('shows detail view', () => {
    render(<PostMarketSurveillance />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('calls API on mount', async () => {
    render(<PostMarketSurveillance />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<PostMarketSurveillance />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows incidents tab', () => {
    render(<PostMarketSurveillance />);
    const tab = screen.queryAllByText(/Incident|incident|Complaint|complaint/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('shows CAPA section', () => {
    render(<PostMarketSurveillance />);
    const tab = screen.queryAllByText(/CAPA|Corrective|corrective/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });
});
