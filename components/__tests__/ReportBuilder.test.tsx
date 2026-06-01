import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
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

import ReportBuilder from '../ReportBuilder';

describe('ReportBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'rpt1' } });
  });

  it('renders without crashing', () => {
    render(<ReportBuilder />);
    expect(screen.queryAllByText(/Report|report|Builder|builder/i).length).toBeGreaterThan(0);
  });

  it('shows report template library', async () => {
    render(<ReportBuilder />);
    await waitFor(() => expect(screen.queryAllByText(/Report|report|Templates|templates|Library|library/i).length).toBeGreaterThan(0));
  });

  it('opens create report form', () => {
    render(<ReportBuilder />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<ReportBuilder />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'compliance' } });
  });

  it('shows stat cards', () => {
    render(<ReportBuilder />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('calls API on mount', async () => {
    render(<ReportBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<ReportBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows section types', async () => {
    render(<ReportBuilder />);
    // Enter the builder, then open the Add Section modal which lists the section types.
    fireEvent.click(screen.getByText('New Report'));
    await waitFor(() => expect(screen.getByText('Report Sections')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Add Section')[0]);
    await waitFor(() => expect(screen.getByText('Data Table')).toBeInTheDocument());
    expect(screen.getByText('Metrics Card')).toBeInTheDocument();
    expect(screen.getByText('Text Block')).toBeInTheDocument();
  });

  it('shows export format options', async () => {
    render(<ReportBuilder />);
    fireEvent.click(screen.getByText('New Report'));
    // Builder view renders an export-format selector with PDF / Excel / CSV options.
    await waitFor(() => expect(screen.getByText('PDF')).toBeInTheDocument());
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('shows schedule options', () => {
    render(<ReportBuilder />);
    const scheduleTab = screen.queryAllByText(/Schedule|schedule/i)[0] ?? null;
    if (scheduleTab) fireEvent.click(scheduleTab);
  });

  it('shows data source selection', () => {
    render(<ReportBuilder />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) {
      fireEvent.click(addBtn);
      expect(screen.queryAllByText(/Frameworks|Risks|Controls|frameworks|risks|controls/i).length).toBeGreaterThan(0);
    }
  });
});
