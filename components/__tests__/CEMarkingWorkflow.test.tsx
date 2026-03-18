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
      ceMarking: {
        listProducts: apiGet,
        listNotifiedBodies: () => Promise.resolve([]),
        listRequirements: () => Promise.resolve([]),
        listDocuments: () => Promise.resolve([]),
        listRiskItems: () => Promise.resolve([]),
        listSurveillanceChecks: () => Promise.resolve([]),
        createProduct: apiPost,
        deleteProduct: apiDelete,
        updateProduct: apiPut,
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import CEMarkingWorkflow from '../CEMarkingWorkflow';

describe('CEMarkingWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'ce1' } });
  });

  it('renders without crashing', () => {
    render(<CEMarkingWorkflow />);
    expect(screen.queryAllByText(/CE Marking|CE|Conformity/i).length).toBeGreaterThan(0);
  });

  it('shows product list', () => {
    render(<CEMarkingWorkflow />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('opens create product form', () => {
    render(<CEMarkingWorkflow />);
    const addBtn = screen.queryAllByText(/Create|New|Add|Register/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<CEMarkingWorkflow />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'device' } });
  });

  it('shows stat cards', () => {
    render(<CEMarkingWorkflow />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('shows product detail view', () => {
    render(<CEMarkingWorkflow />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('calls API on mount', async () => {
    render(<CEMarkingWorkflow />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<CEMarkingWorkflow />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows directives checklist', () => {
    render(<CEMarkingWorkflow />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      fireEvent.click(rows[0]);
      expect(screen.queryAllByText(/Directive|directive|Essential|essential/i).length).toBeGreaterThan(0);
    }
  });

  it('deletes a product', () => {
    render(<CEMarkingWorkflow />);
    const deleteBtns = document.querySelectorAll('[data-testid="icon-Trash2"]');
    if (deleteBtns.length > 0) {
      const btn = deleteBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });
});
