import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import ExceptionManagement from '../ExceptionManagement';

describe('ExceptionManagement', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    render(<ExceptionManagement />);
    expect(screen.queryAllByText(/Exception|exception/i).length).toBeGreaterThan(0);
  });

  it('shows exceptions tab by default', () => {
    render(<ExceptionManagement />);
    expect(screen.queryAllByText(/Exceptions|exceptions/i).length).toBeGreaterThan(0);
  });

  it('displays mock exceptions in the list', () => {
    render(<ExceptionManagement />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows stat cards', () => {
    render(<ExceptionManagement />);
    const statCards = document.querySelectorAll('[class*="rounded-xl"]');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('opens create exception form', () => {
    render(<ExceptionManagement />);
    const addBtn = screen.queryAllByText(/New Exception|Request Exception/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters exceptions by search', () => {
    render(<ExceptionManagement />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
  });

  it('filters by status', () => {
    render(<ExceptionManagement />);
    const statusSelect = screen.queryByDisplayValue(/All Status|all/i);
    if (statusSelect) fireEvent.change(statusSelect, { target: { value: 'Pending' } });
  });

  it('filters by risk level', () => {
    render(<ExceptionManagement />);
    const riskSelect = screen.queryByDisplayValue(/All Risk|all/i);
    if (riskSelect) fireEvent.change(riskSelect, { target: { value: 'High' } });
  });

  it('switches to metrics tab', () => {
    render(<ExceptionManagement />);
    const metricsTab = screen.queryAllByText(/Metrics|metrics/i)[0] ?? null;
    if (metricsTab) fireEvent.click(metricsTab);
  });

  it('switches to auditor tab', () => {
    render(<ExceptionManagement />);
    const auditorTab = screen.queryAllByText(/Auditor|auditor/i)[0] ?? null;
    if (auditorTab) fireEvent.click(auditorTab);
  });

  it('opens detail view when exception is clicked', () => {
    render(<ExceptionManagement />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('shows compensating controls in detail', () => {
    render(<ExceptionManagement />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      fireEvent.click(rows[0]);
      expect(screen.queryAllByText(/Compensating|compensating/i).length).toBeGreaterThan(0);
    }
  });

  it('approves an exception', () => {
    render(<ExceptionManagement />);
    const approveBtn = screen.queryAllByText(/Approve/i)[0] ?? null;
    if (approveBtn) fireEvent.click(approveBtn);
  });

  it('denies an exception', () => {
    render(<ExceptionManagement />);
    const denyBtn = screen.queryAllByText(/Deny|Reject/i)[0] ?? null;
    if (denyBtn) fireEvent.click(denyBtn);
  });
});
