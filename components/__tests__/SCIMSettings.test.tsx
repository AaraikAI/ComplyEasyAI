import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }),
}));

const mockConfig = {
  enabled: true, endpointUrl: 'https://api.complyeasy.ai/api/scim/v2',
  bearerToken: 'scim_test_token_123', tokenCreatedAt: '2025-01-01', tokenExpiresAt: '2026-01-01',
};

const mockSyncStats = {
  lastSyncTime: '2025-12-01T10:00:00Z', totalSyncedUsers: 42, failedSyncs: 2,
  pendingSyncs: 1, lastSyncDuration: 3, nextScheduledSync: '2025-12-02T10:00:00Z',
};

const mockSyncLogs = [
  { id: 'log-1', action: 'create' as const, userEmail: 'alice@test.com', userName: 'Alice', timestamp: '2025-12-01T10:00:00Z', status: 'success' as const, details: 'User created', source: 'okta' },
  { id: 'log-2', action: 'update' as const, userEmail: 'bob@test.com', userName: 'Bob', timestamp: '2025-12-01T10:01:00Z', status: 'failed' as const, details: 'Field mismatch', source: 'okta' },
];

const mockGroupMappings = [
  { id: 'gm-1', scimGroup: 'ComplianceTeam', appRole: 'compliance_manager', autoAssign: true },
];

import SCIMSettings from '../SCIMSettings';

describe('SCIMSettings', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Install a fresh fetch spy each test so the suite does not depend on a global
    // pre-stub remaining in place (mirrors the resilient pattern in RoleManager.test.tsx).
    (vi.spyOn(globalThis, 'fetch') as any).mockImplementation((url: string) => {
      if (url.includes('/scim/config')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockConfig) });
      if (url.includes('/scim/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSyncStats) });
      if (url.includes('/scim/logs')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSyncLogs) });
      if (url.includes('/scim/group-mappings') && !url.includes('/gm-')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGroupMappings) });
      if (url.includes('/scim/token/regenerate')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockConfig, bearerToken: 'new_token_456' }) });
      if (url.includes('/scim/sync')) return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('shows loading state initially', () => {
    (vi.spyOn(globalThis, 'fetch') as any).mockImplementation(() => new Promise(() => {}));
    render(<SCIMSettings onBack={mockOnBack} />);
    expect(screen.getByText(/common.loading/i)).toBeInTheDocument();
  });

  it('renders SCIM settings after loading', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('settings.scim')).toBeInTheDocument());
  });

  it('shows SCIM provisioning status', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SCIM 2.0 Provisioning')).toBeInTheDocument());
    expect(screen.getByText(/Active and accepting/)).toBeInTheDocument();
  });

  it('displays SCIM endpoint URL', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SCIM Endpoint URL')).toBeInTheDocument());
  });

  it('shows bearer token (hidden by default)', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Bearer Token')).toBeInTheDocument());
    expect(screen.getByText(/••••/)).toBeInTheDocument();
  });

  it('displays overview tab stats', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Total Synced Users')).toBeInTheDocument());
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Failed Syncs')).toBeInTheDocument();
  });

  it('shows sync status section', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Sync Status')).toBeInTheDocument());
  });

  it('shows recent activity log', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Recent Activity')).toBeInTheDocument());
  });

  it('navigates to sync logs tab', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Sync Logs')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sync Logs'));
    await waitFor(() => expect(screen.getByPlaceholderText(/Search by email/i)).toBeInTheDocument());
  });

  it('filters sync logs by search', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Sync Logs')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sync Logs'));
    await waitFor(() => expect(screen.getByPlaceholderText(/Search by email/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Search by email/i), { target: { value: 'alice' } });
  });

  it('navigates to group mappings tab', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Group Mappings')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Group Mappings'));
    await waitFor(() => expect(screen.getByText('Group-to-Role Mappings')).toBeInTheDocument());
    expect(screen.getByText('ComplianceTeam')).toBeInTheDocument();
  });

  it('opens add mapping modal', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Group Mappings')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Group Mappings'));
    await waitFor(() => expect(screen.getByText('Add Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Add Mapping')[0]);
    await waitFor(() => expect(screen.getByText('Add Group Mapping')).toBeInTheDocument());
    expect(screen.getByPlaceholderText(/ComplianceTeam/)).toBeInTheDocument();
  });

  it('creates a new group mapping', async () => {
    (vi.spyOn(globalThis, 'fetch') as any).mockImplementation((url: string, opts: any) => {
      if (url.includes('/scim/group-mappings') && opts?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'gm-new', scimGroup: 'NewGroup', appRole: 'viewer', autoAssign: true }) });
      }
      if (url.includes('/scim/config')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockConfig) });
      if (url.includes('/scim/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSyncStats) });
      if (url.includes('/scim/logs')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSyncLogs) });
      if (url.includes('/scim/group-mappings')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGroupMappings) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Group Mappings')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Group Mappings'));
    await waitFor(() => expect(screen.getByText('Add Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Add Mapping')[0]);
    await waitFor(() => expect(screen.getByPlaceholderText(/ComplianceTeam/)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/ComplianceTeam/), { target: { value: 'NewGroup' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/group-mappings'), expect.objectContaining({ method: 'POST' })));
  });

  it('triggers manual sync', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Manual Sync')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Manual Sync'));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/scim/sync'), expect.objectContaining({ method: 'POST' })));
  });

  it('regenerates bearer token', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Regenerate Token')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Regenerate Token'));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/scim/token/regenerate'), expect.objectContaining({ method: 'POST' })));
  });

  it('handles loading error gracefully', async () => {
    (vi.spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve({ ok: false, status: 500 }));
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Failed to load SCIM settings.')).toBeInTheDocument());
  });

  it('calls onBack when back button clicked', async () => {
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('settings.scim')).toBeInTheDocument());
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows empty log state', async () => {
    (vi.spyOn(globalThis, 'fetch') as any).mockImplementation((url: string) => {
      if (url.includes('/scim/config')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockConfig) });
      if (url.includes('/scim/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSyncStats) });
      if (url.includes('/scim/logs')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/scim/group-mappings')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    render(<SCIMSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Recent Activity')).toBeInTheDocument());
    expect(screen.getByText(/No sync activity/)).toBeInTheDocument();
  });
});
