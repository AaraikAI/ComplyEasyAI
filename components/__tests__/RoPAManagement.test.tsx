import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDel(...args),
  },
}));

import RoPAManagement from '../RoPAManagement';

describe('RoPAManagement', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ id: 'new-ropa' });
    mockPut.mockResolvedValue({});
    mockDel.mockResolvedValue({});
  });

  it('renders the RoPA header and Article 30 label', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    // Header title comes from the i18n key (mock returns the key verbatim).
    expect(await screen.findByText('ropa.title')).toBeInTheDocument();
    expect(screen.getByText('GDPR Article 30')).toBeInTheDocument();
  });

  it('renders the statistics summary cards', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    // Stat cards render once the (empty) activity list has loaded.
    expect(await screen.findByText('Total Activities')).toBeInTheDocument();
    // "Active" also appears as a status-filter <option>, so scope to the stat
    // card by selecting the label that sits in the mono-eyebrow stat-card heading
    // (the <option> has no such class).
    const activeMatches = screen.getAllByText('Active');
    expect(activeMatches.some(el => el.className.includes('font-mono'))).toBe(true);
    expect(screen.getByText('Special Categories')).toBeInTheDocument();
    expect(screen.getByText('International Transfers')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    const backBtn = (await screen.findByTestId('icon-ArrowLeft')).closest('button');
    expect(backBtn).not.toBeNull();
    fireEvent.click(backBtn!);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows the processing activities table with empty-state copy', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    // Column header is i18n-keyed; the empty list shows the no-match message.
    expect(await screen.findByText('Activity Name')).toBeInTheDocument();
    expect(screen.getByText('No activities match the current filters.')).toBeInTheDocument();
  });

  it('shows the create-record button', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    expect(await screen.findByText('ropa.createRecord')).toBeInTheDocument();
  });

  it('renders the legal-basis breakdown panel', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    expect(await screen.findByText('By Legal Basis')).toBeInTheDocument();
  });

  it('renders zero totals when there are no activities', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    await screen.findByText('Total Activities');
    // Total Activities count is rendered as a large number; with no data it is 0.
    const totalLabel = screen.getByText('Total Activities').closest('div');
    expect(totalLabel?.parentElement?.textContent).toContain('0');
  });

  it('surfaces a retry banner when the load fails', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('boom') }));
    render(<RoPAManagement onBack={mockOnBack} />);
    expect(await screen.findByText(/Failed to load processing activities/i)).toBeInTheDocument();
  });

  it('renders an export control', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    await screen.findByText('Total Activities');
    // Export menu trigger uses the common.export i18n key.
    expect(screen.getByText('common.export')).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    render(<RoPAManagement onBack={mockOnBack} />);
    await screen.findByText('Total Activities');
    const searchInputs = document.querySelectorAll('input[type="text"]');
    expect(searchInputs.length).toBeGreaterThan(0);
  });
});
