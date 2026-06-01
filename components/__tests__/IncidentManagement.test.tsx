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
    // The search box is always present on the incidents tab.
    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Malware' } });
    expect(searchInput.value).toBe('Malware');
    // Only the matching incident remains; non-matching titles are filtered out.
    expect(screen.getByText('Malware Detection on Endpoint')).toBeInTheDocument();
    expect(screen.queryByText('Data Breach via Third-Party')).not.toBeInTheDocument();
  });

  it('opens create form when add button is clicked', async () => {
    await renderAndWait(<IncidentManagement />);
    // The create button is rendered using the i18n key; assert it exists, then open it.
    const addBtn = screen.getByRole('button', { name: /incidents\.createIncident/i });
    fireEvent.click(addBtn);
    // Modal fields appear with the Title label.
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Incident title')).toBeInTheDocument();
  });

  it('switches to timeline tab', async () => {
    await renderAndWait(<IncidentManagement />);
    const timelineTab = screen.getByRole('button', { name: /Timeline/i });
    fireEvent.click(timelineTab);
    // The timeline tab heading renders (key-based, since per-file i18n returns the key).
    expect(screen.getAllByText(/incidents\.timeline/i).length).toBeGreaterThan(0);
  });

  it('switches to metrics tab', async () => {
    await renderAndWait(<IncidentManagement />);
    const metricsTab = screen.getByRole('button', { name: /Metrics/i });
    fireEvent.click(metricsTab);
    // The metrics tab shows the response-time breakdown sections.
    expect(screen.getByText('Incidents by Severity')).toBeInTheDocument();
    expect(screen.getByText('Response Time Metrics')).toBeInTheDocument();
  });

  it('opens incident detail view when incident is clicked', async () => {
    await renderAndWait(<IncidentManagement />);
    // Click the first incident card to open the detail view.
    fireEvent.click(screen.getByText('Data Breach via Third-Party'));
    // Detail view shows the back link and the status pipeline / reporter field.
    expect(screen.getByText('Back to incidents')).toBeInTheDocument();
    expect(screen.getByText('Reporter')).toBeInTheDocument();
  });

  it('filters by severity', async () => {
    await renderAndWait(<IncidentManagement />);
    // Filter controls are revealed by the filter toggle button.
    fireEvent.click(screen.getByRole('button', { name: /common\.filter/i }));
    const severitySelect = screen.getByDisplayValue('All Severities') as HTMLSelectElement;
    fireEvent.change(severitySelect, { target: { value: 'SEV1' } });
    expect(severitySelect.value).toBe('SEV1');
    // Only SEV1 incidents remain; a SEV3 incident is filtered out.
    expect(screen.getByText('Data Breach via Third-Party')).toBeInTheDocument();
    expect(screen.queryByText('Malware Detection on Endpoint')).not.toBeInTheDocument();
  });

  it('filters by status', async () => {
    await renderAndWait(<IncidentManagement />);
    fireEvent.click(screen.getByRole('button', { name: /common\.filter/i }));
    const statusSelect = screen.getByDisplayValue('All Statuses') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'Triaged' } });
    expect(statusSelect.value).toBe('Triaged');
    // inc-2 is Triaged and remains; inc-1 (Contained) is filtered out.
    expect(screen.getByText('Unauthorized Access Attempt')).toBeInTheDocument();
    expect(screen.queryByText('Data Breach via Third-Party')).not.toBeInTheDocument();
  });

  it('deletes an incident with confirmation', async () => {
    await renderAndWait(<IncidentManagement />);
    // Each incident card exposes a delete button titled "Delete incident".
    const deleteButtons = screen.getAllByTitle('Delete incident');
    expect(deleteButtons.length).toBeGreaterThan(0);
    await act(async () => { fireEvent.click(deleteButtons[0]); });
    // The DELETE call hits the incidents endpoint, then the row is removed.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/incidents/'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
    expect(screen.queryByText('Data Breach via Third-Party')).not.toBeInTheDocument();
  });

  it('advances incident status from the card', async () => {
    await renderAndWait(<IncidentManagement />);
    const advanceButtons = screen.getAllByTitle('Advance status');
    expect(advanceButtons.length).toBeGreaterThan(0);
    await act(async () => { fireEvent.click(advanceButtons[0]); });
    // Advancing issues a PATCH to the incident endpoint.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/incidents/'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });
});
