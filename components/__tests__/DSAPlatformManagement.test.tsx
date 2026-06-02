import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DSAPlatformManagement } from '../DSAPlatformManagement';

vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }: any) => <div>{children}</div>, AreaChart: ({ children }: any) => <div>{children}</div>, Area: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, PieChart: ({ children }: any) => <div>{children}</div>, Pie: () => null, Cell: () => null, BarChart: ({ children }: any) => <div>{children}</div>, Bar: () => null, Legend: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn().mockReturnValue({ user: { id: '1', role: 'admin', organizationId: 'org-1', organization: { plan: 'Visionary' } }, isAuthenticated: true }) }));
vi.mock('@/services/api', () => ({ api: { euRegulations: { dsa: { getPlatforms: vi.fn().mockResolvedValue({ platforms: [] }), registerPlatform: vi.fn().mockResolvedValue({}), recordContentModeration: vi.fn().mockResolvedValue({}), getContentModerationHistory: vi.fn().mockResolvedValue([]), getTransparencyReports: vi.fn().mockResolvedValue([]) } } }, getAuthToken: vi.fn().mockReturnValue('token') }));

describe('DSAPlatformManagement', () => {
  it('should render the platform statistics and registered-platforms panel', async () => {
    render(<DSAPlatformManagement />);
    await waitFor(() => { expect(screen.getByText('Registered Platforms')).toBeInTheDocument(); });
    expect(screen.getByText('Total Platforms')).toBeInTheDocument();
    expect(screen.getByText('VLOPs')).toBeInTheDocument();
    expect(screen.getByText('VLOSE')).toBeInTheDocument();
  });
  it('should load platforms from the API and render the empty state when none exist', async () => {
    const { api } = await import('@/services/api');
    render(<DSAPlatformManagement />);
    await waitFor(() => { expect(screen.getByText('No platforms registered yet')).toBeInTheDocument(); });
    expect(api.euRegulations.dsa.getPlatforms).toHaveBeenCalled();
  });
  it('should render platform rows when the API returns platforms', async () => {
    const { api } = await import('@/services/api');
    (api.euRegulations.dsa.getPlatforms as any).mockResolvedValueOnce({
      platforms: [{ id: 'p-1', platformName: 'Acme Social', platformType: 'online_platform', isVLOP: false, isVLOSE: false, complianceStatus: 'compliant' }],
    });
    render(<DSAPlatformManagement />);
    await waitFor(() => { expect(screen.getByText('Acme Social')).toBeInTheDocument(); });
    expect(screen.getByText('Record Moderation')).toBeInTheDocument();
  });
});
