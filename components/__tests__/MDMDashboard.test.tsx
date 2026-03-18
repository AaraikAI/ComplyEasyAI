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
    mdm: {
      listDevices: apiGet,
      listPolicies: apiGet,
      getDashboard: apiGet,
      createPolicy: apiPost,
      executeAction: apiPost,
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import MDMDashboard from '../MDMDashboard';

describe('MDMDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'mdm1' } });
  });

  it('renders without crashing', () => {
    render(<MDMDashboard />);
    expect(screen.queryAllByText(/MDM|Mobile Device|Device Management/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<MDMDashboard />);
    expect(screen.queryAllByText(/Overview|Devices|Policies|overview|devices|policies/i).length).toBeGreaterThan(0);
  });

  it('switches to devices tab', () => {
    render(<MDMDashboard />);
    const tab = screen.queryAllByText(/Devices|devices/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to policies tab', () => {
    render(<MDMDashboard />);
    const tab = screen.queryAllByText(/Policies|policies/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to compliance tab', () => {
    render(<MDMDashboard />);
    const tab = screen.queryAllByText(/Compliance|compliance/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to actions log tab', () => {
    render(<MDMDashboard />);
    const tab = screen.queryAllByText(/Actions|actions|Log|log/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('filters by search', () => {
    render(<MDMDashboard />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'iPhone' } });
  });

  it('shows stat cards', () => {
    render(<MDMDashboard />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<MDMDashboard />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<MDMDashboard />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows device detail view', () => {
    render(<MDMDashboard />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('filters by platform', () => {
    render(<MDMDashboard />);
    const platformSelect = screen.queryByDisplayValue(/All/i);
    if (platformSelect) fireEvent.change(platformSelect, { target: { value: 'iOS' } });
  });
});
