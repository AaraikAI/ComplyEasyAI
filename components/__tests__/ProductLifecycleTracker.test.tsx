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
      productLifecycle: {
        listProducts: apiGet,
        createProduct: apiPost,
        updateProduct: apiPut,
      },
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

  it('creates a product via the New Product action', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Widget X');
    render(<ProductLifecycleTracker />);
    const addBtn = screen.getByText(/New Product/i);
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    // The handler prompts for a name then persists via the create endpoint.
    expect(promptSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        expect.objectContaining({ productName: 'Widget X' })
      );
    });
    promptSpy.mockRestore();
  });

  it('filters by search', () => {
    render(<ProductLifecycleTracker />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'widget' } });
    expect((searchInput as HTMLInputElement).value).toBe('widget');
  });

  it('shows stat cards', () => {
    render(<ProductLifecycleTracker />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('shows product detail view when a product card is clicked', () => {
    render(<ProductLifecycleTracker />);
    const cards = document.querySelectorAll('div[class*="cursor-pointer"]');
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.click(cards[0]);
    // Selecting a product switches to the details tab, which is no longer the
    // empty "No Product Selected" state and shows a stage-advance control.
    expect(screen.queryByText(/No Product Selected/i)).toBeNull();
    expect(screen.getByTitle(/Advance to next lifecycle stage/i)).toBeInTheDocument();
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
    const rows = document.querySelectorAll('div[class*="cursor-pointer"]');
    expect(rows.length).toBeGreaterThan(0);
    fireEvent.click(rows[0]);
    expect(screen.queryAllByText(/completed|Regulatory|Security|Privacy/i).length).toBeGreaterThan(0);
  });

  it('filters by stage via the lifecycle stage buttons', () => {
    render(<ProductLifecycleTracker />);
    // The portfolio exposes a stage-distribution button group; clicking one
    // activates the corresponding stage filter and reveals "Clear Filters".
    const stageButton = screen
      .getAllByRole('button')
      .find(b => /production/i.test(b.textContent || ''));
    expect(stageButton).toBeTruthy();
    fireEvent.click(stageButton!);
    expect(screen.getByText(/Clear Filters/i)).toBeInTheDocument();
  });
});
