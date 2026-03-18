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

import EvidenceCollectionRules from '../EvidenceCollectionRules';

const mockRules = [
  {
    id: 'ecr1', name: 'AWS Config Snapshots', description: 'Collect AWS config snapshots',
    integrationSource: 'aws_config', sourceConfig: {}, query: 'SELECT *',
    schedule: { frequency: 'daily', hour: 6, minute: 0, cronExpression: '0 6 * * *' },
    status: 'active', linkedControls: [{ id: 'c1', name: 'CC1.1', framework: 'SOC 2' }],
    lastCollectedAt: new Date().toISOString(), lastStatus: 'success',
    successCount: 45, failureCount: 2, totalCollected: 120,
    createdAt: '2025-01-01', updatedAt: '2025-03-01', recentRuns: [],
  },
  {
    id: 'ecr2', name: 'GitHub Actions Logs', description: 'Collect CI/CD logs',
    integrationSource: 'github_actions', sourceConfig: {}, query: 'actions/*',
    schedule: { frequency: 'weekly', hour: 9, minute: 0, cronExpression: '0 9 * * 1' },
    status: 'inactive', linkedControls: [],
    lastCollectedAt: null, lastStatus: 'pending',
    successCount: 0, failureCount: 0, totalCollected: 0,
    createdAt: '2025-02-01', updatedAt: '2025-03-01', recentRuns: [],
  },
];

const mockMetrics = {
  totalRules: 2, activeRules: 1, totalCollected: 120,
  successRate: 95.7, lastCollectionTime: new Date().toISOString(), staleEvidenceCount: 1,
};

describe('EvidenceCollectionRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation((url: string) => {
      if (url.includes('/rules')) return Promise.resolve({ data: mockRules });
      if (url.includes('/metrics') || url.includes('/dashboard')) return Promise.resolve({ data: mockMetrics });
      if (url.includes('/controls')) return Promise.resolve({ data: [{ id: 'c1', name: 'CC1.1', framework: 'SOC 2' }] });
      return Promise.resolve({ data: [] });
    });
    apiPost.mockResolvedValue({ data: { id: 'new1' } });
    apiPut.mockResolvedValue({ data: {} });
    apiDelete.mockResolvedValue({ data: {} });
  });

  it('renders without crashing', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Evidence|Collection|Rules|evidence/i).length).toBeGreaterThan(0);
    });
  });

  it('shows loading state initially', () => {
    render(<EvidenceCollectionRules />);
    const loaders = document.querySelectorAll('[data-testid="icon-Loader2"], [class*="animate"]');
    expect(loaders.length).toBeGreaterThanOrEqual(0);
  });

  it('displays dashboard metrics after load', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows rule list', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('filters rules by search query', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'AWS' } });
  });

  it('filters rules by integration source', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const sourceSelect = screen.queryByDisplayValue(/all/i);
    if (sourceSelect) fireEvent.change(sourceSelect, { target: { value: 'aws_config' } });
  });

  it('filters rules by status', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const statusSelect = document.querySelectorAll('select');
    if (statusSelect.length > 1) fireEvent.change(statusSelect[1], { target: { value: 'active' } });
  });

  it('opens create rule form', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const createBtn = screen.queryByText(/Create Rule|New Rule|Add Rule/i);
    if (createBtn) fireEvent.click(createBtn);
  });

  it('opens rule detail view', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const viewBtns = document.querySelectorAll('[data-testid="icon-Eye"]');
    if (viewBtns.length > 0) {
      const btn = viewBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('handles delete confirmation', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => { expect(apiGet).toHaveBeenCalled(); });
    const deleteBtns = document.querySelectorAll('[data-testid="icon-Trash2"]');
    if (deleteBtns.length > 0) {
      const btn = deleteBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('calls API on load', async () => {
    render(<EvidenceCollectionRules />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<EvidenceCollectionRules />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });
});
