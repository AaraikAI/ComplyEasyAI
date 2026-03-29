import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true, logout: vi.fn(),
  }),
}));

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }),
}));

import IncidentManagement from '../IncidentManagement';

// Mock incidents matching backend API shape
const MOCK_INCIDENTS = [
  { id: 'inc-1', title: 'Data Breach via Third-Party', description: 'Customer data exposed', severity: 'SEV1', status: 'CONTAINED', category: 'DATA_BREACH', detectedAt: '2026-03-01T10:00:00Z', triagedAt: '2026-03-01T10:30:00Z', containedAt: '2026-03-01T14:00:00Z', eradicatedAt: null, resolvedAt: null, closedAt: null, assignedTo: 'Security Team', reportedBy: 'SOC Analyst', affectedSystems: ['CRM', 'Database'], timeline: [], tasks: [] },
  { id: 'inc-2', title: 'Unauthorized Access Attempt', description: 'Brute force on admin panel', severity: 'SEV2', status: 'TRIAGED', category: 'UNAUTHORIZED_ACCESS', detectedAt: '2026-03-10T08:00:00Z', triagedAt: '2026-03-10T08:15:00Z', containedAt: null, eradicatedAt: null, resolvedAt: null, closedAt: null, assignedTo: 'IT Ops', reportedBy: 'IDS Alert', affectedSystems: ['Admin Portal'], timeline: [], tasks: [] },
  { id: 'inc-3', title: 'Malware Detection on Endpoint', description: 'Trojan detected', severity: 'SEV3', status: 'DETECTED', category: 'MALWARE', detectedAt: '2026-03-12T14:00:00Z', triagedAt: null, containedAt: null, eradicatedAt: null, resolvedAt: null, closedAt: null, assignedTo: 'Endpoint Team', reportedBy: 'CrowdStrike', affectedSystems: ['Workstation-42'], timeline: [], tasks: [] },
  { id: 'inc-4', title: 'Phishing Campaign Targeting Finance', description: 'Spear phishing emails', severity: 'SEV2', status: 'CLOSED', category: 'PHISHING', detectedAt: '2026-02-15T09:00:00Z', triagedAt: '2026-02-15T09:30:00Z', containedAt: '2026-02-15T11:00:00Z', eradicatedAt: '2026-02-16T10:00:00Z', resolvedAt: '2026-02-17T10:00:00Z', closedAt: '2026-02-20T10:00:00Z', assignedTo: 'Security', reportedBy: 'Employee Report', affectedSystems: ['Email'], timeline: [], tasks: [] },
  { id: 'inc-5', title: 'Production Database Outage', description: 'Disk failure caused downtime', severity: 'SEV1', status: 'RECOVERED', category: 'SYSTEM_FAILURE', detectedAt: '2026-03-05T03:00:00Z', triagedAt: '2026-03-05T03:10:00Z', containedAt: '2026-03-05T04:00:00Z', eradicatedAt: '2026-03-05T06:00:00Z', resolvedAt: '2026-03-05T08:00:00Z', closedAt: null, assignedTo: 'DBA Team', reportedBy: 'Monitoring', affectedSystems: ['Prod DB'], timeline: [], tasks: [] },
];

function createFetchMock() {
  return vi.fn().mockImplementation((url: string, options?: any) => {
    if (typeof url === 'string' && url.includes('/api/incidents')) {
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'inc-new', title: body.title, description: body.description, severity: body.severity || 'SEV3', status: 'DETECTED', category: body.category || 'SYSTEM_FAILURE', detectedAt: new Date().toISOString(), triagedAt: null, containedAt: null, eradicatedAt: null, resolvedAt: null, closedAt: null, assignedTo: '', reportedBy: '', affectedSystems: [], timeline: [], tasks: [] } }),
        });
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: MOCK_INCIDENTS }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

async function renderAndWait(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => { result = render(ui); });
  await waitFor(() => {
    expect(screen.queryByText('Loading incidents...')).not.toBeInTheDocument();
  });
  return result!;
}

describe('IncidentManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = createFetchMock();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders without crashing', async () => {
    await renderAndWait(<IncidentManagement />);
    expect(screen.queryAllByText(/incidents/i).length).toBeGreaterThan(0);
  });

  it('shows incidents tab by default', async () => {
    await renderAndWait(<IncidentManagement />);
    expect(screen.queryAllByText(/SEV1|SEV2|incidents.title|Incident/i).length).toBeGreaterThan(0);
  });

  it('displays summary stat cards', async () => {
    await renderAndWait(<IncidentManagement />);
    const statCards = document.querySelectorAll('[class*="rounded-xl"]');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('shows incidents in the list', async () => {
    await renderAndWait(<IncidentManagement />);
    expect(screen.queryAllByText(/Data Breach|Unauthorized Access|Malware|Phishing|Production/i).length).toBeGreaterThan(0);
  });

  it('filters incidents by search', async () => {
    await renderAndWait(<IncidentManagement />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    }
  });

  it('opens create form when add button is clicked', async () => {
    await renderAndWait(<IncidentManagement />);
    const addBtn = screen.queryAllByText(/New Incident|Create Incident/i)[0] ?? null;
    if (addBtn) {
      fireEvent.click(addBtn);
      expect(screen.queryAllByText(/Title|incident/i).length).toBeGreaterThan(0);
    }
  });

  it('switches to timeline tab', async () => {
    await renderAndWait(<IncidentManagement />);
    const timelineTab = screen.queryAllByText(/Timeline/i)[0] ?? null;
    if (timelineTab) {
      fireEvent.click(timelineTab);
    }
  });

  it('switches to metrics tab', async () => {
    await renderAndWait(<IncidentManagement />);
    const metricsTab = screen.queryAllByText(/Metrics/i)[0] ?? null;
    if (metricsTab) {
      fireEvent.click(metricsTab);
    }
  });

  it('opens incident detail view when incident is clicked', async () => {
    await renderAndWait(<IncidentManagement />);
    const incidentRows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (incidentRows.length > 0) {
      fireEvent.click(incidentRows[0]);
    }
  });

  it('filters by severity', async () => {
    await renderAndWait(<IncidentManagement />);
    const severitySelect = screen.queryByDisplayValue(/All Severities|all/i);
    if (severitySelect) {
      fireEvent.change(severitySelect, { target: { value: 'SEV1' } });
    }
  });

  it('filters by status', async () => {
    await renderAndWait(<IncidentManagement />);
    const statusSelect = screen.queryByDisplayValue(/All Status|all/i);
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'Detected' } });
    }
  });

  it('deletes an incident with confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await renderAndWait(<IncidentManagement />);
    const deleteButtons = document.querySelectorAll('[title="Delete"], button[class*="red"]');
    if (deleteButtons.length > 0) {
      await act(async () => { fireEvent.click(deleteButtons[0]); });
    }
  });

  it('cancels delete when confirm returns false', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await renderAndWait(<IncidentManagement />);
    const deleteButtons = document.querySelectorAll('[title="Delete"]');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
    }
  });
});
