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
    dpo: { list: apiGet, create: apiPost, update: apiPut, delete: apiDelete },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import GovernanceManager from '../GovernanceManager';

describe('GovernanceManager', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'new1' } });
    apiPut.mockResolvedValue({ data: {} });
    apiDelete.mockResolvedValue({ data: {} });
  });

  it('renders without crashing', () => {
    render(<GovernanceManager onBack={onBack} />);
    // The page title is always rendered.
    expect(screen.getByRole('heading', { name: /Governance Manager/i })).toBeInTheDocument();
  });

  it('shows tab navigation', () => {
    render(<GovernanceManager onBack={onBack} />);
    // The three top-level tabs render unconditionally.
    expect(screen.getByRole('button', { name: /DPO Management/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Committees/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escalation Paths/i })).toBeInTheDocument();
  });

  it('displays the DPO profile by default', () => {
    render(<GovernanceManager onBack={onBack} />);
    // DPO tab is active on mount and shows the DPO designation + sub-tabs.
    expect(screen.getByText('Data Protection Officer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Profile$/i })).toBeInTheDocument();
  });

  it('shows committees section when the Committees tab is opened', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    // The committees overview renders the consolidated members table.
    expect(screen.getByText('All Governance Members')).toBeInTheDocument();
  });

  it('shows a committee detail with members and meetings sub-tabs', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    // Selecting a committee card opens its detail with sub-tabs.
    fireEvent.click(screen.getByText('Privacy Committee'));
    expect(screen.getByRole('button', { name: /^Members$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Meetings$/i }));
    expect(screen.getByText(/Next Meeting:/i)).toBeInTheDocument();
  });

  it('opens the create DPO task form', () => {
    render(<GovernanceManager onBack={onBack} />);
    // Navigate to the DPO Tasks sub-tab and open the add-task modal.
    fireEvent.click(screen.getByRole('button', { name: /^Tasks$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add Task/i }));
    expect(screen.getByRole('heading', { name: /New DPO Task/i })).toBeInTheDocument();
  });

  it('shows decision records for a committee', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Committees/i }));
    fireEvent.click(screen.getByText('Privacy Committee'));
    fireEvent.click(screen.getByRole('button', { name: /^Decisions$/i }));
    // The seeded Privacy Committee has a recorded decision.
    expect(screen.getByText('AI Chatbot DPIA Approval')).toBeInTheDocument();
  });

  it('shows the DPO activity log', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activity$/i }));
    expect(screen.getByRole('heading', { name: /DPO Activity Log/i })).toBeInTheDocument();
  });

  it('renders the escalation paths tab', () => {
    render(<GovernanceManager onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Escalation Paths/i }));
    // The escalation list shows the seeded Data Breach path.
    expect(screen.getByText('Data Breach Escalation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Path/i })).toBeInTheDocument();
  });
});
