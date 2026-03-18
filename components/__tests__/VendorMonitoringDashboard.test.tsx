import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));


const {
  vmList, vmGetAlerts, vmGetStats, vmTriggerCheck, vmCreate, vmGetForVendor,
  vendorsList,
} = vi.hoisted(() => ({
  vmList: vi.fn(),
  vmGetAlerts: vi.fn(),
  vmGetStats: vi.fn(),
  vmTriggerCheck: vi.fn(),
  vmCreate: vi.fn(),
  vmGetForVendor: vi.fn(),
  vendorsList: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    vendorMonitoring: {
      list: vmList,
      getAlerts: vmGetAlerts,
      getStats: vmGetStats,
      triggerCheck: vmTriggerCheck,
      create: vmCreate,
      getForVendor: vmGetForVendor,
    },
    vendors: { list: vendorsList },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

const mockChecks = [
  { id: 'chk-1', vendorId: 'v1', vendorName: 'CloudCorp', checkType: 'DOMAIN_REPUTATION', result: 'PASS' as const, details: {}, riskScore: 85, checkedAt: '2025-12-01T00:00:00Z', checkedBy: 'system' },
  { id: 'chk-2', vendorId: 'v1', vendorName: 'CloudCorp', checkType: 'SSL_CERTIFICATE', result: 'FAIL' as const, details: {}, riskScore: 60, checkedAt: '2025-12-02T00:00:00Z', checkedBy: 'system' },
  { id: 'chk-3', vendorId: 'v2', vendorName: 'DataPipe', checkType: 'BREACH_DATABASE', result: 'WARNING' as const, details: {}, riskScore: 45, checkedAt: '2025-12-01T00:00:00Z', checkedBy: 'system' },
];

const mockAlerts = [
  { id: 'al-1', vendorId: 'v1', vendorName: 'CloudCorp', checkType: 'SSL_CERTIFICATE', result: 'FAIL' as const, details: {}, riskScore: 60, checkedAt: '2025-12-02T00:00:00Z', checkedBy: 'system' },
];

const mockStats = { totalChecks: 3, vendorsMonitored: 2, passCount: 1, failCount: 1, warningCount: 1 };

const mockVendors = [
  { id: 'v1', name: 'CloudCorp' },
  { id: 'v2', name: 'DataPipe' },
];

import VendorMonitoringDashboard from '../VendorMonitoringDashboard';

describe('VendorMonitoringDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vmList.mockResolvedValue(mockChecks);
    vmGetAlerts.mockResolvedValue(mockAlerts);
    vmGetStats.mockResolvedValue(mockStats);
    vendorsList.mockResolvedValue(mockVendors);
    vmTriggerCheck.mockResolvedValue({});
    vmCreate.mockResolvedValue({});
    vmGetForVendor.mockResolvedValue([]);
  });

  it('shows loading skeleton initially', () => {
    vmList.mockReturnValue(new Promise(() => {}));
    vmGetAlerts.mockReturnValue(new Promise(() => {}));
    vmGetStats.mockReturnValue(new Promise(() => {}));
    vendorsList.mockReturnValue(new Promise(() => {}));
    render(<VendorMonitoringDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders stats cards after loading', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText('Vendors Monitored')).toBeInTheDocument());
    expect(screen.getByText('Total Checks')).toBeInTheDocument();
    expect(screen.getByText('Passing')).toBeInTheDocument();
    expect(screen.getByText('Failing')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('displays stat values from API', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders vendor summaries in the list', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    expect(screen.getByText('DataPipe')).toBeInTheDocument();
  });

  it('shows recent alerts panel', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText('Recent Alerts')).toBeInTheDocument());
    expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0);
  });

  it('shows no alerts message when empty', async () => {
    vmGetAlerts.mockResolvedValueOnce([]);
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText(/No alerts/)).toBeInTheDocument());
  });

  it('filters vendor list by search query', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    const input = screen.getByPlaceholderText(/vendors/i);
    fireEvent.change(input, { target: { value: 'DataPipe' } });
    await waitFor(() => {
      // DataPipe should be in the vendor list
      expect(screen.getByText('DataPipe')).toBeInTheDocument();
    });
  });

  it('filters vendor list by status dropdown', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    const selects = document.querySelectorAll('select');
    const statusSelect = selects[0];
    fireEvent.change(statusSelect, { target: { value: 'healthy' } });
    // healthy = no fails and no warnings, so both vendors should be filtered since both have issues
  });

  it('shows empty state when no checks exist', async () => {
    vmList.mockResolvedValueOnce([]);
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText(/No monitoring checks yet/)).toBeInTheDocument());
  });

  it('shows empty state when filter matches nothing', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    const input = screen.getByPlaceholderText(/vendors/i);
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    await waitFor(() => expect(screen.getByText(/No vendors match your filters/)).toBeInTheDocument());
  });

  it('expands vendor to show check history', async () => {
    vmGetForVendor.mockResolvedValue([mockChecks[0], mockChecks[1]]);
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('CloudCorp')[0]);
    await waitFor(() => expect(screen.getByText('Check History')).toBeInTheDocument());
  });

  it('triggers monitoring check for a vendor', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    const triggerBtns = document.querySelectorAll('[title="Run monitoring check"]');
    fireEvent.click(triggerBtns[0]);
    await waitFor(() => expect(vmTriggerCheck).toHaveBeenCalled());
  });

  it('opens new check modal and creates check', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText('New Check')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Check'));
    await waitFor(() => expect(screen.getByText('New Monitoring Check')).toBeInTheDocument());
    // Select vendor
    const selects = document.querySelectorAll('select');
    const vendorSelect = Array.from(selects).find(s => {
      const opts = Array.from(s.options);
      return opts.some(o => o.text === 'CloudCorp');
    })!;
    fireEvent.change(vendorSelect, { target: { value: 'v1' } });
    // Click create
    fireEvent.click(screen.getByText('Create Check'));
    await waitFor(() => expect(vmCreate).toHaveBeenCalled());
  });

  it('closes new check modal on cancel', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getByText('New Check')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Check'));
    await waitFor(() => expect(screen.getByText('New Monitoring Check')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('New Monitoring Check')).not.toBeInTheDocument());
  });

  it('shows error banner and allows dismissal', async () => {
    vmTriggerCheck.mockRejectedValueOnce(new Error('Network error'));
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    const triggerBtns = document.querySelectorAll('[title="Run monitoring check"]');
    fireEvent.click(triggerBtns[0]);
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    fireEvent.click(screen.getByText('×'));
    await waitFor(() => expect(screen.queryByText('Network error')).not.toBeInTheDocument());
  });

  it('refresh button reloads data', async () => {
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => expect(vmList).toHaveBeenCalledTimes(2));
  });

  it('handles trigger check error', async () => {
    vmTriggerCheck.mockRejectedValueOnce(new Error('Failed to trigger check'));
    render(<VendorMonitoringDashboard />);
    await waitFor(() => expect(screen.getAllByText('CloudCorp').length).toBeGreaterThan(0));
    const triggerBtns = document.querySelectorAll('[title="Run monitoring check"]');
    fireEvent.click(triggerBtns[0]);
    await waitFor(() => expect(screen.getByText('Failed to trigger check')).toBeInTheDocument());
  });
});
