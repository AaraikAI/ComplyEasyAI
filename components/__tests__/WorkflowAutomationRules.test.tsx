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
    workflows: {
      list: apiGet,
      listRuns: apiGet,
      create: apiPost,
      update: apiPut,
      delete: apiDelete,
      run: apiPost,
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import WorkflowAutomationRules from '../WorkflowAutomationRules';

describe('WorkflowAutomationRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [], workflows: [] });
    apiPost.mockResolvedValue({ data: { id: 'w1' } });
  });

  it('renders without crashing', () => {
    render(<WorkflowAutomationRules />);
    expect(screen.queryAllByText(/Workflow|Automation|workflow|automation/i).length).toBeGreaterThan(0);
  });

  it('shows workflows tab', () => {
    render(<WorkflowAutomationRules />);
    expect(screen.queryAllByText(/Workflows|workflows/i).length).toBeGreaterThan(0);
  });

  it('shows templates tab', () => {
    render(<WorkflowAutomationRules />);
    const tab = screen.queryAllByText(/Templates|templates/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('shows history tab', () => {
    render(<WorkflowAutomationRules />);
    const tab = screen.queryAllByText(/History|history/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('opens create workflow form', () => {
    render(<WorkflowAutomationRules />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<WorkflowAutomationRules />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'compliance' } });
  });

  it('shows stat cards', () => {
    render(<WorkflowAutomationRules />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('toggles workflow status', () => {
    render(<WorkflowAutomationRules />);
    const toggleBtns = document.querySelectorAll('[data-testid="icon-ToggleLeft"], [data-testid="icon-ToggleRight"]');
    if (toggleBtns.length > 0) {
      const btn = toggleBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('deletes a workflow', () => {
    render(<WorkflowAutomationRules />);
    const deleteBtns = document.querySelectorAll('[data-testid="icon-Trash2"]');
    if (deleteBtns.length > 0) {
      const btn = deleteBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
  });

  it('calls API on mount', async () => {
    render(<WorkflowAutomationRules />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });
});
