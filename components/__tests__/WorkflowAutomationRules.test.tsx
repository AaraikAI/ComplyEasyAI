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
    // Header title and create button render synchronously.
    expect(screen.getByText('Automation')).toBeInTheDocument();
    expect(screen.getByText('Create Workflow')).toBeInTheDocument();
  });

  it('shows workflows tab', () => {
    render(<WorkflowAutomationRules />);
    // The three tab labels and the workflows stat card are present.
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Total Workflows')).toBeInTheDocument();
  });

  it('shows templates tab', () => {
    render(<WorkflowAutomationRules />);
    fireEvent.click(screen.getByText('Templates'));
    // The templates tab lists the built-in templates with Use Template actions.
    expect(screen.getByText('Auto-escalate SEV1 Incidents')).toBeInTheDocument();
    expect(screen.getAllByText('Use Template').length).toBeGreaterThan(0);
  });

  it('shows history tab', () => {
    render(<WorkflowAutomationRules />);
    fireEvent.click(screen.getByText('History'));
    // With no executions the history tab shows its empty state.
    expect(screen.getByText('No execution history yet')).toBeInTheDocument();
  });

  it('opens create workflow form', () => {
    render(<WorkflowAutomationRules />);
    fireEvent.click(screen.getByText('Create Workflow'));
    // The create modal renders its name field placeholder.
    expect(screen.getByPlaceholderText('e.g. Auto-escalate critical risks')).toBeInTheDocument();
  });

  it('filters by search', async () => {
    render(<WorkflowAutomationRules />);
    // Workflows tab finishes loading to its empty state.
    expect(await screen.findByText('No results found')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText('Search workflows...');
    fireEvent.change(searchInput, { target: { value: 'compliance' } });
    expect((searchInput as HTMLInputElement).value).toBe('compliance');
    // Still empty (no fixtures) — the empty state is retained.
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('shows stat cards', () => {
    render(<WorkflowAutomationRules />);
    // All four dashboard stat labels render.
    ['Total Workflows', 'Active', 'Total Executions', 'Success Rate'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders empty workflow list without toggle controls', async () => {
    render(<WorkflowAutomationRules />);
    // No workflows -> no per-row toggle/delete controls and the empty state shows.
    expect(await screen.findByText('No results found')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid="icon-ToggleLeft"], [data-testid="icon-ToggleRight"]').length).toBe(0);
    expect(document.querySelectorAll('[data-testid="icon-Trash2"]').length).toBe(0);
  });

  it('offers to create a first workflow from the empty state', async () => {
    render(<WorkflowAutomationRules />);
    // The empty state offers an inline create affordance.
    expect(await screen.findByText('Create your first workflow')).toBeInTheDocument();
  });

  it('calls API on mount', async () => {
    render(<WorkflowAutomationRules />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });
});
