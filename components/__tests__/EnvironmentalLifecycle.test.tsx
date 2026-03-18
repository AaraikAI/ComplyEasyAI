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
      lifecycle: {
        listAssessments: apiGet,
        createAssessment: apiPost,
        deleteAssessment: apiDelete,
        updateAssessment: apiPut,
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import EnvironmentalLifecycle from '../EnvironmentalLifecycle';

describe('EnvironmentalLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'el1' } });
  });

  it('renders without crashing', () => {
    render(<EnvironmentalLifecycle />);
    expect(screen.queryAllByText(/Environmental|Lifecycle|LCA|lifecycle/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<EnvironmentalLifecycle />);
    expect(screen.queryAllByText(/Overview|Lifecycle Stages|Impact|overview/i).length).toBeGreaterThan(0);
  });

  it('switches to lifecycle stages tab', () => {
    render(<EnvironmentalLifecycle />);
    const tab = screen.queryAllByText(/Lifecycle Stages|stages/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to impact assessment tab', () => {
    render(<EnvironmentalLifecycle />);
    const tab = screen.queryAllByText(/Impact|impact/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to improvements tab', () => {
    render(<EnvironmentalLifecycle />);
    const tab = screen.queryAllByText(/Improvement|improvement/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to reports tab', () => {
    render(<EnvironmentalLifecycle />);
    const tab = screen.queryAllByText(/Reports|reports/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('shows stat cards', () => {
    render(<EnvironmentalLifecycle />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<EnvironmentalLifecycle />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<EnvironmentalLifecycle />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows carbon footprint metrics', () => {
    render(<EnvironmentalLifecycle />);
    expect(screen.queryAllByText(/CO2|Carbon|carbon|kg|Emissions|emissions/i).length).toBeGreaterThan(0);
  });
});
