import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import AccountDeletionWorkflow from '../AccountDeletionWorkflow';

describe('AccountDeletionWorkflow', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
    mockPut.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays account deletion workflow content', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    // Tab labels are static text rendered on the header regardless of data load.
    expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Requests/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button');
    expect(backBtn).not.toBeNull();
    fireEvent.click(backBtn as HTMLElement);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows tab navigation for overview, requests, execution, audit, settings', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    ['Overview', 'Requests', 'Execution', 'Audit', 'Settings'].forEach(label => {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    });
  });

  it('switches between tabs', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    // Settings tab surfaces unique static content not present on Overview.
    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));
    expect(screen.getByText(/Grace Period Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Deletion Method/i)).toBeInTheDocument();
  });

  it('renders overview with metrics', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    // Overview is the default tab and renders the stat-card labels + distribution.
    expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Status Distribution/i)).toBeInTheDocument();
  });

  it('handles empty deletion requests', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    // With no requests loaded, the Requests tab shows the empty-state message.
    fireEvent.click(screen.getByRole('button', { name: /Requests/i }));
    expect(screen.getByText(/No requests match your criteria/i)).toBeInTheDocument();
  });

  it('handles API errors', async () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    // The api mock in this file lacks api.privacy, so the loader surfaces an error banner.
    await waitFor(() => expect(screen.getByText(/Retry/i)).toBeInTheDocument());
  });

  it('shows status flow pipeline', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    // STATUS_FLOW labels appear in the Status Distribution rows.
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    expect(screen.getByText(/Avg Processing Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Retention Hold Conflicts/i)).toBeInTheDocument();
  });

  it('shows search/filter functionality', () => {
    render(<AccountDeletionWorkflow onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Requests/i }));
    const searchInputs = document.querySelectorAll('input[type="text"]');
    expect(searchInputs.length).toBeGreaterThan(0);
  });
});
