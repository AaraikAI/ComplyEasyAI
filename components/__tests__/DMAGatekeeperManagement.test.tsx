import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DMAGatekeeperManagement } from '../DMAGatekeeperManagement';

vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }: any) => <div>{children}</div>, AreaChart: ({ children }: any) => <div>{children}</div>, Area: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, PieChart: ({ children }: any) => <div>{children}</div>, Pie: () => null, Cell: () => null, BarChart: ({ children }: any) => <div>{children}</div>, Bar: () => null, Legend: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn().mockReturnValue({ user: { id: '1', role: 'admin', organizationId: 'org-1', organization: { plan: 'Visionary' } }, isAuthenticated: true }) }));
vi.mock('@/services/api', () => ({ api: { euRegulations: { dma: { getGatekeepers: vi.fn().mockResolvedValue({ gatekeepers: [] }), registerGatekeeper: vi.fn().mockResolvedValue({}), generateComplianceReport: vi.fn().mockResolvedValue({}), getObligations: vi.fn().mockResolvedValue([]), updateObligationCompliance: vi.fn().mockResolvedValue({}) } } }, getAuthToken: vi.fn().mockReturnValue('token') }));

describe('DMAGatekeeperManagement', () => {
  it('should render the registered-platforms panel and register action', async () => {
    render(<DMAGatekeeperManagement />);
    await waitFor(() => { expect(screen.getByText('Registered Platforms')).toBeInTheDocument(); });
    expect(screen.getAllByText('Register Platform').length).toBeGreaterThan(0);
    expect(screen.getByText('Total Obligations')).toBeInTheDocument();
  });
  it('should load gatekeepers from the API and render the empty state when none exist', async () => {
    const { api } = await import('@/services/api');
    render(<DMAGatekeeperManagement />);
    await waitFor(() => { expect(screen.getByText('No platforms registered yet')).toBeInTheDocument(); });
    expect(api.euRegulations.dma.getGatekeepers).toHaveBeenCalled();
  });
  it('should render gatekeeper rows when the API returns platforms', async () => {
    const { api } = await import('@/services/api');
    (api.euRegulations.dma.getGatekeepers as any).mockResolvedValueOnce({
      gatekeepers: [{ id: 'gk-1', platformName: 'Acme Marketplace', corePlatformServices: ['operating_systems'], designationStatus: 'designated', obligations: ['interoperability'], complianceStatus: 'compliant' }],
    });
    render(<DMAGatekeeperManagement />);
    await waitFor(() => { expect(screen.getByText('Acme Marketplace')).toBeInTheDocument(); });
    expect(screen.getByText('View Obligations')).toBeInTheDocument();
  });
});
