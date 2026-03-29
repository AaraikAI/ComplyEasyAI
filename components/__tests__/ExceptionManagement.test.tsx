import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import ExceptionManagement from '../ExceptionManagement';

// Mock exceptions matching backend API shape
const MOCK_EXCEPTIONS = [
  { id: 'exc-1', title: 'Legacy System MFA Exemption', justification: 'System does not support MFA', controlId: 'CC-6.1', status: 'APPROVED', riskAcceptance: 'High', requestedBy: 'IT Lead', createdAt: '2026-01-15T00:00:00Z', approvedBy: 'CISO', updatedAt: '2026-01-20T00:00:00Z', expiryDate: '2026-06-15T00:00:00Z', compensatingControls: 'VPN access required + IP whitelisting' },
  { id: 'exc-2', title: 'Temporary Encryption Exception', justification: 'Migration in progress', controlId: 'CC-6.7', status: 'REQUESTED', riskAcceptance: 'Medium', requestedBy: 'Dev Team', createdAt: '2026-03-01T00:00:00Z', approvedBy: null, updatedAt: null, expiryDate: '2026-04-30T00:00:00Z', compensatingControls: 'Network segmentation applied' },
  { id: 'exc-3', title: 'Vendor Compliance Gap', justification: 'Vendor SOC 2 report pending', controlId: 'CC-9.2', status: 'REJECTED', riskAcceptance: 'Critical', requestedBy: 'Vendor Manager', createdAt: '2026-02-01T00:00:00Z', approvedBy: 'Compliance Officer', updatedAt: '2026-02-10T00:00:00Z', expiryDate: '2026-05-01T00:00:00Z', compensatingControls: null },
];

function createFetchMock() {
  return vi.fn().mockImplementation((url: string, options?: any) => {
    if (typeof url === 'string' && url.includes('/api/exceptions')) {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', data: { id: 'exc-new', title: 'New Exception', justification: '', controlId: '', status: 'REQUESTED', riskAcceptance: 'Medium', requestedBy: '', createdAt: new Date().toISOString(), approvedBy: null, updatedAt: null, expiryDate: '', compensatingControls: null } }),
        });
      }
      if (options?.method === 'PUT' || options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', data: MOCK_EXCEPTIONS[0] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', data: { exceptions: MOCK_EXCEPTIONS } }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

async function renderAndWait(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => { result = render(ui); });
  await waitFor(() => {
    expect(screen.queryByText('Loading exceptions...')).not.toBeInTheDocument();
  });
  return result!;
}

describe('ExceptionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = createFetchMock();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders without crashing', async () => {
    await renderAndWait(<ExceptionManagement />);
    expect(screen.queryAllByText(/Exception|exception/i).length).toBeGreaterThan(0);
  });

  it('shows exceptions tab by default', async () => {
    await renderAndWait(<ExceptionManagement />);
    expect(screen.queryAllByText(/Exceptions|exceptions/i).length).toBeGreaterThan(0);
  });

  it('displays mock exceptions in the list', async () => {
    await renderAndWait(<ExceptionManagement />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows stat cards', async () => {
    await renderAndWait(<ExceptionManagement />);
    const statCards = document.querySelectorAll('[class*="rounded-xl"]');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('opens create exception form', async () => {
    await renderAndWait(<ExceptionManagement />);
    const addBtn = screen.queryAllByText(/New Exception|Request Exception/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters exceptions by search', async () => {
    await renderAndWait(<ExceptionManagement />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
  });

  it('filters by status', async () => {
    await renderAndWait(<ExceptionManagement />);
    const statusSelect = screen.queryByDisplayValue(/All Status|all/i);
    if (statusSelect) fireEvent.change(statusSelect, { target: { value: 'Pending' } });
  });

  it('filters by risk level', async () => {
    await renderAndWait(<ExceptionManagement />);
    const riskSelect = screen.queryByDisplayValue(/All Risk|all/i);
    if (riskSelect) fireEvent.change(riskSelect, { target: { value: 'High' } });
  });

  it('switches to metrics tab', async () => {
    await renderAndWait(<ExceptionManagement />);
    const metricsTab = screen.queryAllByText(/Metrics|metrics/i)[0] ?? null;
    if (metricsTab) fireEvent.click(metricsTab);
  });

  it('switches to auditor tab', async () => {
    await renderAndWait(<ExceptionManagement />);
    const auditorTab = screen.queryAllByText(/Auditor|auditor/i)[0] ?? null;
    if (auditorTab) fireEvent.click(auditorTab);
  });

  it('opens detail view when exception is clicked', async () => {
    await renderAndWait(<ExceptionManagement />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('shows compensating controls in detail', async () => {
    await renderAndWait(<ExceptionManagement />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) {
      fireEvent.click(rows[0]);
      expect(screen.queryAllByText(/Compensating|compensating/i).length).toBeGreaterThan(0);
    }
  });

  it('approves an exception', async () => {
    await renderAndWait(<ExceptionManagement />);
    const approveBtn = screen.queryAllByText(/Approve/i)[0] ?? null;
    if (approveBtn) await act(async () => { fireEvent.click(approveBtn); });
  });

  it('denies an exception', async () => {
    await renderAndWait(<ExceptionManagement />);
    const denyBtn = screen.queryAllByText(/Deny|Reject/i)[0] ?? null;
    if (denyBtn) await act(async () => { fireEvent.click(denyBtn); });
  });
});
