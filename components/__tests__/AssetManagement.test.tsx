import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

describe('AssetManagement', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    render(<AssetManagement />);
    expect(screen.getByText('assets.title')).toBeInTheDocument();
  });

  it('shows summary stat cards', () => {
    render(<AssetManagement />);
    expect(screen.getByText(/common.total/)).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0);
  });

  it('displays correct asset count', () => {
    render(<AssetManagement />);
    expect(screen.getByText('8')).toBeInTheDocument(); // 8 initial assets
  });

  it('shows asset registry tab by default', () => {
    render(<AssetManagement />);
    expect(screen.getByText('Asset Registry')).toBeInTheDocument();
  });

  it('displays assets in the table', () => {
    render(<AssetManagement />);
    expect(screen.getByText('Production Database Server')).toBeInTheDocument();
    expect(screen.getByText('CrowdStrike Falcon')).toBeInTheDocument();
    expect(screen.getByText('Okta SSO')).toBeInTheDocument();
  });

  it('filters assets by search query', () => {
    render(<AssetManagement />);
    const searchInput = screen.getByPlaceholderText(/Search assets/i);
    fireEvent.change(searchInput, { target: { value: 'CrowdStrike' } });
    expect(screen.getByText('CrowdStrike Falcon')).toBeInTheDocument();
    expect(screen.queryByText('Production Database Server')).not.toBeInTheDocument();
  });

  it('shows empty state when search matches nothing', () => {
    render(<AssetManagement />);
    const searchInput = screen.getByPlaceholderText(/Search assets/i);
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });
    expect(screen.getByText(/No assets match/)).toBeInTheDocument();
  });

  it('toggles filter panel', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Classifications')).toBeInTheDocument();
  });

  it('filters assets by type', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    fireEvent.change(screen.getByDisplayValue('All Types'), { target: { value: 'Software' } });
    expect(screen.getByText('CrowdStrike Falcon')).toBeInTheDocument();
    expect(screen.queryByText('AWS VPC Network')).not.toBeInTheDocument();
  });

  it('filters assets by classification', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    fireEvent.change(screen.getByDisplayValue('All Classifications'), { target: { value: 'Restricted' } });
    expect(screen.getByText('Production Database Server')).toBeInTheDocument();
    expect(screen.queryByText('CrowdStrike Falcon')).not.toBeInTheDocument();
  });

  it('filters assets by lifecycle status', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('common.filter'));
    fireEvent.change(screen.getByDisplayValue('All Lifecycles'), { target: { value: 'Decommissioned' } });
    expect(screen.getByText('Legacy CRM System')).toBeInTheDocument();
    expect(screen.queryByText('CrowdStrike Falcon')).not.toBeInTheDocument();
  });

  it('opens asset detail view when clicking a row', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('Production Database Server'));
    expect(screen.getByText('Back to registry')).toBeInTheDocument();
    expect(screen.getByText('Alex Kumar')).toBeInTheDocument();
  });

  it('shows asset dependencies in detail view', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('Production Database Server'));
    expect(screen.getAllByText(/Dependencies/).length).toBeGreaterThan(0);
    expect(screen.getByText('Application Backend')).toBeInTheDocument();
  });

  it('navigates back from detail to registry', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('Production Database Server'));
    fireEvent.click(screen.getByText('Back to registry'));
    expect(screen.getByText('Production Database Server')).toBeInTheDocument();
  });

  it('opens create asset modal', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    expect(screen.getByText('assets.assetName')).toBeInTheDocument();
    expect(screen.getByText('common.description')).toBeInTheDocument();
  });

  it('creates a new asset', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    const nameInput = screen.getByPlaceholderText(/Production Web Server/);
    fireEvent.change(nameInput, { target: { value: 'New Test Asset' } });
    // The modal has a submit button with the Plus icon — find the last "assets.addAsset" button (the one in the modal)
    const allAddBtns = screen.getAllByText('assets.addAsset').filter(el => el.closest('button'));
    const createBtn = allAddBtns[allAddBtns.length - 1].closest('button');
    fireEvent.click(createBtn!);
    expect(screen.getByText('New Test Asset')).toBeInTheDocument();
  });

  it('cancels asset creation', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByText('assets.assetName')).not.toBeInTheDocument();
  });

  it('deletes an asset', () => {
    render(<AssetManagement />);
    const deleteButtons = document.querySelectorAll('[title="Delete"]');
    fireEvent.click(deleteButtons[0]);
    // Asset count should decrease
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('advances asset lifecycle', () => {
    render(<AssetManagement />);
    const advanceBtns = document.querySelectorAll('[title="Advance lifecycle"]');
    // The decommissioned asset is at index 7
    fireEvent.click(advanceBtns[0]); // Advance first active asset
  });

  it('switches to dependencies tab', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('Dependencies'));
    expect(screen.getByText('Asset Dependency Map')).toBeInTheDocument();
  });

  it('switches to classification tab', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('Classification'));
    expect(screen.getByText('Classification Matrix')).toBeInTheDocument();
  });

  it('shows classification summary cards', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('Classification'));
    expect(screen.getAllByText('Public').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Internal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confidential').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0);
  });

  it('disables create button when name is empty', () => {
    render(<AssetManagement />);
    fireEvent.click(screen.getByText('assets.addAsset'));
    const createBtn = screen.getAllByText('assets.addAsset').find(el => el.closest('button[disabled]'));
    expect(createBtn).toBeTruthy();
  });
});
