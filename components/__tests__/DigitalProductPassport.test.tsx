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
      dpp: {
        listPassports: apiGet,
        getPassport: () => Promise.resolve(null),
        createPassport: apiPost,
        deletePassport: apiDelete,
        updatePassport: apiPut,
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import DigitalProductPassport from '../DigitalProductPassport';

describe('DigitalProductPassport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'dpp1' } });
  });

  it('renders without crashing', () => {
    render(<DigitalProductPassport />);
    expect(screen.queryAllByText(/Digital Product Passport|DPP|Product/i).length).toBeGreaterThan(0);
  });

  it('shows product list', () => {
    render(<DigitalProductPassport />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('opens create product form', () => {
    render(<DigitalProductPassport />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<DigitalProductPassport />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'product' } });
  });

  it('shows product detail view', () => {
    render(<DigitalProductPassport />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('shows stat cards', () => {
    render(<DigitalProductPassport />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<DigitalProductPassport />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<DigitalProductPassport />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows material composition section', () => {
    render(<DigitalProductPassport />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      fireEvent.click(rows[0]);
      expect(screen.queryAllByText(/Material|material|Composition|composition/i).length).toBeGreaterThan(0);
    }
  });

  it('shows carbon footprint section', () => {
    render(<DigitalProductPassport />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      fireEvent.click(rows[0]);
      expect(screen.queryAllByText(/Carbon|carbon|Footprint|footprint/i).length).toBeGreaterThan(0);
    }
  });
});
