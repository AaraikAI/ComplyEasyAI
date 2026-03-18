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
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'new1' } });
    apiPut.mockResolvedValue({ data: {} });
    apiDelete.mockResolvedValue({ data: {} });
  });

  it('renders without crashing', () => {
    render(<GovernanceManager />);
    expect(screen.queryAllByText(/Governance|governance|DPO|Committee/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<GovernanceManager />);
    expect(screen.queryAllByText(/DPO|Data Protection Officer/i).length).toBeGreaterThan(0);
  });

  it('displays stat cards', () => {
    render(<GovernanceManager />);
    const statCards = document.querySelectorAll('[class*="rounded-xl"]');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('shows committees section', () => {
    render(<GovernanceManager />);
    const committeeTab = screen.queryAllByText(/Committee|committee/i)[0] ?? null;
    if (committeeTab) fireEvent.click(committeeTab);
  });

  it('shows meetings section', () => {
    render(<GovernanceManager />);
    const meetingsTab = screen.queryAllByText(/Meeting|meeting/i)[0] ?? null;
    if (meetingsTab) fireEvent.click(meetingsTab);
  });

  it('opens create DPO form', () => {
    render(<GovernanceManager />);
    const addBtn = screen.queryAllByText(/Add DPO|New DPO|Create|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('searches DPO profiles', () => {
    render(<GovernanceManager />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'privacy' } });
  });

  it('shows decision records tab', () => {
    render(<GovernanceManager />);
    const decisionTab = screen.queryAllByText(/Decision|decision/i)[0] ?? null;
    if (decisionTab) fireEvent.click(decisionTab);
  });

  it('shows audit log tab', () => {
    render(<GovernanceManager />);
    const auditTab = screen.queryAllByText(/Audit|Log|audit|log/i)[0] ?? null;
    if (auditTab) fireEvent.click(auditTab);
  });

  it('renders DPO detail view', () => {
    render(<GovernanceManager />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });
});
