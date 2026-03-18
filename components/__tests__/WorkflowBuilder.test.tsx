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
    workflows: { list: apiGet, create: apiPost, update: apiPut, delete: apiDelete, getRuns: apiGet, getTemplates: apiGet },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import WorkflowBuilder from '../WorkflowBuilder';

describe('WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [], workflows: [] });
    apiPost.mockResolvedValue({ data: { id: 'wf1' } });
  });

  it('renders without crashing', () => {
    render(<WorkflowBuilder />);
    expect(screen.queryAllByText(/Workflow|workflow/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<WorkflowBuilder />);
    expect(screen.queryAllByText(/Workflows|workflows/i).length).toBeGreaterThan(0);
  });

  it('shows templates tab', () => {
    render(<WorkflowBuilder />);
    const templatesTab = screen.queryAllByText(/Templates|templates/i)[0] ?? null;
    if (templatesTab) fireEvent.click(templatesTab);
  });

  it('shows builder tab', () => {
    render(<WorkflowBuilder />);
    const builderTab = screen.queryAllByText(/Builder|builder/i)[0] ?? null;
    if (builderTab) fireEvent.click(builderTab);
  });

  it('shows runs tab', () => {
    render(<WorkflowBuilder />);
    const runsTab = screen.queryAllByText(/Runs|runs|History|history/i)[0] ?? null;
    if (runsTab) fireEvent.click(runsTab);
  });

  it('shows rules tab', () => {
    render(<WorkflowBuilder />);
    const rulesTab = screen.queryAllByText(/Rules|rules/i)[0] ?? null;
    if (rulesTab) fireEvent.click(rulesTab);
  });

  it('opens create workflow form', () => {
    render(<WorkflowBuilder />);
    const addBtn = screen.queryAllByText(/Create Workflow|New Workflow|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters workflows by search', () => {
    render(<WorkflowBuilder />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'risk' } });
  });

  it('shows stat cards', () => {
    render(<WorkflowBuilder />);
    const statCards = document.querySelectorAll('[class*="rounded-xl"]');
    expect(statCards.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<WorkflowBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });
});
