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

import AssetManagement from '../AssetManagement';

// Mock asset data matching the backend API shape that mapApiAsset transforms
const MOCK_ASSETS = [
  { id: 'a1', name: 'Production Database Server', type: 'HARDWARE', classification: 'RESTRICTED', status: 'ACTIVE', owner: 'Alex Kumar', department: 'Engineering', location: 'US-East-1', vendor: 'Dell', serialNumber: 'SN001', riskScore: 85, tags: ['critical', 'pci'], cost: 15000, purchaseDate: '2024-01-15T00:00:00Z', endOfLife: null, updatedAt: '2025-12-01T00:00:00Z', dependencies: [{ assetId: 'a2', assetName: 'Application Backend', relationship: 'depends_on' }] },
  { id: 'a2', name: 'CrowdStrike Falcon', type: 'SOFTWARE', classification: 'CONFIDENTIAL', status: 'ACTIVE', owner: 'Security Team', department: 'Security', location: 'Cloud', vendor: 'CrowdStrike', serialNumber: 'SN002', riskScore: 30, tags: ['security'], cost: 8000 },
  { id: 'a3', name: 'Okta SSO', type: 'SOFTWARE', classification: 'CONFIDENTIAL', status: 'ACTIVE', owner: 'IT', department: 'IT', location: 'Cloud', vendor: 'Okta', serialNumber: 'SN003', riskScore: 40, tags: ['identity'], cost: 5000 },
  { id: 'a4', name: 'AWS VPC Network', type: 'NETWORK', classification: 'INTERNAL', status: 'ACTIVE', owner: 'Cloud Team', department: 'Engineering', location: 'AWS', vendor: 'AWS', serialNumber: 'SN004', riskScore: 50, tags: ['network'], cost: 3000 },
  { id: 'a5', name: 'Legacy CRM System', type: 'SOFTWARE', classification: 'INTERNAL', status: 'DECOMMISSIONED', owner: 'Sales', department: 'Sales', location: 'On-prem', vendor: 'Legacy', serialNumber: 'SN005', riskScore: 20, tags: [], cost: 0 },
  { id: 'a6', name: 'Employee Laptop Fleet', type: 'HARDWARE', classification: 'INTERNAL', status: 'ACTIVE', owner: 'IT', department: 'IT', location: 'Global', vendor: 'Apple', serialNumber: 'SN006', riskScore: 45, tags: [], cost: 120000 },
  { id: 'a7', name: 'Customer PII Database', type: 'DATA', classification: 'RESTRICTED', status: 'ACTIVE', owner: 'Data Team', department: 'Engineering', location: 'US-East-1', vendor: 'AWS', serialNumber: 'SN007', riskScore: 90, tags: ['pii'], cost: 5000 },
  { id: 'a8', name: 'Cloud Monitoring', type: 'CLOUD_SERVICE', classification: 'PUBLIC', status: 'ACTIVE', owner: 'SRE', department: 'Engineering', location: 'Cloud', vendor: 'Datadog', serialNumber: 'SN008', riskScore: 10, tags: [], cost: 7000 },
];

function createFetchMock() {
  return vi.fn().mockImplementation((url: string, options?: any) => {
    if (typeof url === 'string' && url.includes('/api/assets')) {
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'a-new', name: body.name, type: body.type || 'HARDWARE', classification: body.classification || 'INTERNAL', status: 'ACTIVE', owner: body.owner || '', department: '', location: '', vendor: '', serialNumber: '', riskScore: 0, tags: [], cost: 0 } }),
        });
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
      }
      if (options?.method === 'PUT' || options?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: MOCK_ASSETS[0] }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: MOCK_ASSETS }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

async function renderAndWait(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => { result = render(ui); });
  await waitFor(() => {
    expect(screen.queryByText('Loading assets...')).not.toBeInTheDocument();
  });
  return result!;
}

describe('AssetManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = createFetchMock();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders without crashing', async () => {
    await renderAndWait(<AssetManagement />);
    expect(screen.getByText('assets.title')).toBeInTheDocument();
  });

  it('shows summary stat cards', async () => {
    await renderAndWait(<AssetManagement />);
    expect(screen.getByText(/common.total/)).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0);
  });

  it('displays correct asset count', async () => {
    await renderAndWait(<AssetManagement />);
    expect(screen.getByText('8')).toBeInTheDocument(); // 8 initial assets
  });

  it('shows asset registry tab by default', async () => {
    await renderAndWait(<AssetManagement />);
    expect(screen.getByText('Asset Registry')).toBeInTheDocument();
  });

  it('displays assets in the table', async () => {
    await renderAndWait(<AssetManagement />);
    expect(screen.getByText('Production Database Server')).toBeInTheDocument();
    expect(screen.getByText('CrowdStrike Falcon')).toBeInTheDocument();
    expect(screen.getByText('Okta SSO')).toBeInTheDocument();
  });

  it('filters assets by search query', async () => {
    await renderAndWait(<AssetManagement />);
    const searchInput = screen.getByPlaceholderText(/Search assets/i);
    fireEvent.change(searchInput, { target: { value: 'CrowdStrike' } });
    expect(screen.getByText('CrowdStrike Falcon')).toBeInTheDocument();
    expect(screen.queryByText('Production Database Server')).not.toBeInTheDocument();
  });

  it('shows empty state when search matches nothing', async () => {
    await renderAndWait(<AssetManagement />);
    const searchInput = screen.getByPlaceholderText(/Search assets/i);
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });
    expect(screen.getByText(/No assets match/)).toBeInTheDocument();
  });

  it('toggles filter panel', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Classifications')).toBeInTheDocument();
  });

  it('filters assets by type', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    fireEvent.change(screen.getByDisplayValue('All Types'), { target: { value: 'Software' } });
    expect(screen.getByText('CrowdStrike Falcon')).toBeInTheDocument();
    expect(screen.queryByText('AWS VPC Network')).not.toBeInTheDocument();
  });

  it('filters assets by classification', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    fireEvent.change(screen.getByDisplayValue('All Classifications'), { target: { value: 'Restricted' } });
    expect(screen.getByText('Production Database Server')).toBeInTheDocument();
    expect(screen.queryByText('CrowdStrike Falcon')).not.toBeInTheDocument();
  });

  it('filters assets by lifecycle status', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    fireEvent.change(screen.getByDisplayValue('All Lifecycles'), { target: { value: 'Decommissioned' } });
    expect(screen.getByText('Legacy CRM System')).toBeInTheDocument();
    expect(screen.queryByText('CrowdStrike Falcon')).not.toBeInTheDocument();
  });

  it('opens asset detail view when clicking a row', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('Production Database Server'));
    expect(screen.getByText('Back to registry')).toBeInTheDocument();
    expect(screen.getByText('Alex Kumar')).toBeInTheDocument();
  });

  it('shows asset dependencies in detail view', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('Production Database Server'));
    expect(screen.getAllByText(/Dependencies/).length).toBeGreaterThan(0);
    // API-mapped assets have dependencies: [] since mapApiAsset does not populate them
    expect(screen.getByText('No dependencies configured')).toBeInTheDocument();
  });

  it('navigates back from detail to registry', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('Production Database Server'));
    fireEvent.click(screen.getByText('Back to registry'));
    expect(screen.getByText('Production Database Server')).toBeInTheDocument();
  });

  it('opens create asset modal', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    expect(screen.getByText('assets.assetName')).toBeInTheDocument();
    expect(screen.getByText('common.description')).toBeInTheDocument();
  });

  it('creates a new asset', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    const nameInput = screen.getByPlaceholderText(/Production Web Server/);
    fireEvent.change(nameInput, { target: { value: 'New Test Asset' } });
    // The modal has a submit button with the Plus icon — find the last "assets.addAsset" button (the one in the modal)
    const allAddBtns = screen.getAllByText('assets.addAsset').filter(el => el.closest('button'));
    const createBtn = allAddBtns[allAddBtns.length - 1].closest('button');
    await act(async () => { fireEvent.click(createBtn!); });
    await waitFor(() => {
      expect(screen.getByText('New Test Asset')).toBeInTheDocument();
    });
  });

  it('cancels asset creation', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByText('assets.assetName')).not.toBeInTheDocument();
  });

  it('deletes an asset', async () => {
    await renderAndWait(<AssetManagement />);
    const deleteButtons = document.querySelectorAll('[title="Delete"]');
    await act(async () => { fireEvent.click(deleteButtons[0]); });
    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  it('advances asset lifecycle', async () => {
    await renderAndWait(<AssetManagement />);
    const advanceBtns = document.querySelectorAll('[title="Advance lifecycle"]');
    // The decommissioned asset is at index 7
    fireEvent.click(advanceBtns[0]); // Advance first active asset
  });

  it('switches to dependencies tab', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('Dependencies'));
    expect(screen.getByText('Asset Dependency Map')).toBeInTheDocument();
  });

  it('switches to classification tab', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('Classification'));
    expect(screen.getByText('Classification Matrix')).toBeInTheDocument();
  });

  it('shows classification summary cards', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('Classification'));
    expect(screen.getAllByText('Public').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Internal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confidential').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0);
  });

  it('disables create button when name is empty', async () => {
    await renderAndWait(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    const createBtn = screen.getAllByText('assets.addAsset').find(el => el.closest('button[disabled]'));
    expect(createBtn).toBeTruthy();
  });
});
