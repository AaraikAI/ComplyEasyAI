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
    // Header title renders immediately (before data finishes loading).
    expect(screen.getByText('Workflow Builder')).toBeInTheDocument();
  });

  it('shows tab navigation', () => {
    render(<WorkflowBuilder />);
    ['My Workflows', 'Templates', 'Builder', 'Runs', 'Automation Rules'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('shows templates tab', async () => {
    render(<WorkflowBuilder />);
    fireEvent.click(screen.getByText('Templates'));
    // Templates tab renders its own search box and empty state once loaded.
    expect(await screen.findByPlaceholderText('Search templates...')).toBeInTheDocument();
    expect(screen.getByText('No templates match your filters.')).toBeInTheDocument();
  });

  it('shows builder tab', async () => {
    render(<WorkflowBuilder />);
    fireEvent.click(screen.getByText('Builder'));
    // Builder tab renders the node palette and an Add Node affordance.
    expect(await screen.findByText('Node Palette')).toBeInTheDocument();
    expect(screen.getByText('Add Node')).toBeInTheDocument();
  });

  it('shows runs tab', async () => {
    render(<WorkflowBuilder />);
    fireEvent.click(screen.getByText('Runs'));
    // Runs tab renders the summary stat cards.
    expect(await screen.findByText('Total Runs')).toBeInTheDocument();
    expect(screen.getByText('No runs match your filters.')).toBeInTheDocument();
  });

  it('shows rules tab', async () => {
    render(<WorkflowBuilder />);
    fireEvent.click(screen.getByText('Automation Rules'));
    // Rules tab renders the New Rule action and empty state.
    expect(await screen.findByText('New Rule')).toBeInTheDocument();
    expect(screen.getByText('No rules match your filters.')).toBeInTheDocument();
  });

  it('opens create workflow form', async () => {
    render(<WorkflowBuilder />);
    // Wait for the workflows tab to load, then open the create modal.
    const addBtn = await screen.findByText('Create Workflow');
    fireEvent.click(addBtn);
    expect(screen.getByPlaceholderText('e.g. Quarterly Compliance Review')).toBeInTheDocument();
  });

  it('filters workflows by search', async () => {
    render(<WorkflowBuilder />);
    const searchInput = await screen.findByPlaceholderText('Search workflows...');
    fireEvent.change(searchInput, { target: { value: 'risk' } });
    expect((searchInput as HTMLInputElement).value).toBe('risk');
    // No workflows loaded, so the empty state remains.
    expect(screen.getByText('No workflows match your filters.')).toBeInTheDocument();
  });

  it('shows stat cards', async () => {
    render(<WorkflowBuilder />);
    fireEvent.click(screen.getByText('Runs'));
    // The runs tab exposes labelled summary stat cards. 'Failed'/'Running' also
    // appear as status-filter options, so assert at least one of each.
    expect(await screen.findByText('Total Runs')).toBeInTheDocument();
    expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
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
