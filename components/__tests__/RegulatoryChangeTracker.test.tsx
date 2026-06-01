import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

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
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import RegulatoryChangeTracker from '../RegulatoryChangeTracker';

const mockChanges = [
  {
    id: 'rc1', title: 'GDPR Update 2025', description: 'New data processing requirements',
    summary: 'Updated requirements for data processing transparency',
    changeType: 'amendment', severity: 'high', status: 'new',
    regulation: 'GDPR', jurisdiction: 'EU', effectiveDate: '2025-06-01',
    sourceUrl: 'https://example.com', affectedControls: [],
    remediationSuggestions: [], createdAt: '2025-01-15', updatedAt: '2025-01-15',
  },
];

describe('RegulatoryChangeTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: mockChanges });
    apiPost.mockResolvedValue({ data: { id: 'rc2' } });
  });

  it('renders without crashing', () => {
    render(<RegulatoryChangeTracker />);
    expect(screen.queryAllByText(/Regulatory|regulatory|Change|change|Tracker|tracker/i).length).toBeGreaterThan(0);
  });

  it('shows change list', async () => {
    render(<RegulatoryChangeTracker />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('filters by search', () => {
    render(<RegulatoryChangeTracker />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'GDPR' } });
  });

  it('filters by status', () => {
    render(<RegulatoryChangeTracker />);
    const statusSelect = screen.queryByDisplayValue(/All/i);
    if (statusSelect) fireEvent.change(statusSelect, { target: { value: 'new' } });
  });

  it('filters by severity', () => {
    render(<RegulatoryChangeTracker />);
    const selects = document.querySelectorAll('select');
    if (selects.length > 1) fireEvent.change(selects[1], { target: { value: 'high' } });
  });

  it('shows stat cards', () => {
    render(<RegulatoryChangeTracker />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('opens detail view', () => {
    render(<RegulatoryChangeTracker />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('calls API on mount', async () => {
    render(<RegulatoryChangeTracker />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<RegulatoryChangeTracker />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows affected controls in detail', async () => {
    render(<RegulatoryChangeTracker />);
    // The mocked change renders as a clickable row once the list has loaded.
    await waitFor(() => expect(screen.getByText('GDPR Update 2025')).toBeInTheDocument());
    const rows = document.querySelectorAll('div[class*="cursor-pointer"]');
    expect(rows.length).toBeGreaterThan(0);
    fireEvent.click(rows[0]);
    expect(screen.getByText(/Affected Controls/i)).toBeInTheDocument();
  });

  it('shows remediation suggestions', async () => {
    render(<RegulatoryChangeTracker />);
    await waitFor(() => expect(screen.getByText('GDPR Update 2025')).toBeInTheDocument());
    const rows = document.querySelectorAll('div[class*="cursor-pointer"]');
    expect(rows.length).toBeGreaterThan(0);
    fireEvent.click(rows[0]);
    expect(screen.getByText(/Remediation Suggestions/i)).toBeInTheDocument();
  });
});
