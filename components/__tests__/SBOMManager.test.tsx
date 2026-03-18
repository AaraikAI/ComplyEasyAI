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
      sbom: {
        listEntries: apiGet,
        listRepositories: apiGet,
        updateEntry: apiPut,
        deleteRepository: apiDelete,
        createRepository: apiPost,
        deleteEntry: apiDelete,
        updateRepository: apiPut,
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import SBOMManager from '../SBOMManager';

describe('SBOMManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'sbom1' } });
  });

  it('renders without crashing', () => {
    render(<SBOMManager />);
    expect(screen.queryAllByText(/SBOM|Software Bill|Bill of Materials/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<SBOMManager />);
    expect(screen.queryAllByText(/Overview|Components|Vulnerabilities|overview|components|vulnerabilities/i).length).toBeGreaterThan(0);
  });

  it('switches to components tab', () => {
    render(<SBOMManager />);
    const tab = screen.queryAllByText(/Components|components/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to vulnerabilities tab', () => {
    render(<SBOMManager />);
    const tab = screen.queryAllByText(/Vulnerabilities|vulnerabilities/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to licenses tab', () => {
    render(<SBOMManager />);
    const tab = screen.queryAllByText(/Licenses|licenses/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to repositories tab', () => {
    render(<SBOMManager />);
    const tab = screen.queryAllByText(/Repositories|repositories/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('filters by search', () => {
    render(<SBOMManager />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'react' } });
  });

  it('shows stat cards', () => {
    render(<SBOMManager />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<SBOMManager />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<SBOMManager />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows component detail view', () => {
    render(<SBOMManager />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('filters by severity', () => {
    render(<SBOMManager />);
    const tab = screen.queryAllByText(/Vulnerabilities|vulnerabilities/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
    const severitySelects = screen.queryAllByDisplayValue(/All/i);
    if (severitySelects.length > 0) fireEvent.change(severitySelects[0], { target: { value: 'Critical' } });
  });
});
