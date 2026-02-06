import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DSAPlatformManagement } from '../DSAPlatformManagement';

vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }: any) => <div>{children}</div>, AreaChart: ({ children }: any) => <div>{children}</div>, Area: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, PieChart: ({ children }: any) => <div>{children}</div>, Pie: () => null, Cell: () => null, BarChart: ({ children }: any) => <div>{children}</div>, Bar: () => null, Legend: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn().mockReturnValue({ user: { id: '1', role: 'admin', organizationId: 'org-1', organization: { plan: 'Visionary' } }, isAuthenticated: true }) }));
vi.mock('@/services/api', () => ({ api: { euRegulations: { dsa: { getPlatforms: vi.fn().mockResolvedValue([]), registerPlatform: vi.fn().mockResolvedValue({}), recordContentModeration: vi.fn().mockResolvedValue({}), getContentModerationHistory: vi.fn().mockResolvedValue([]), getTransparencyReports: vi.fn().mockResolvedValue([]) } } }, getAuthToken: vi.fn().mockReturnValue('token') }));

describe('DSAPlatformManagement', () => {
  it('should render', async () => { render(<DSAPlatformManagement />); await waitFor(() => { expect(screen.getByText(/DSA|Digital Services|platform/i)).toBeTruthy(); }); });
  it('should handle empty data', async () => { render(<DSAPlatformManagement />); await waitFor(() => { expect(document.body.textContent!.length).toBeGreaterThan(0); }); });
  it('should render content', () => { render(<DSAPlatformManagement />); expect(document.body.textContent).toBeTruthy(); });
});
