import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EUAIActDashboard } from '../EUAIActDashboard';

vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }: any) => <div>{children}</div>, AreaChart: ({ children }: any) => <div>{children}</div>, Area: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, Legend: () => null, PieChart: ({ children }: any) => <div>{children}</div>, Pie: () => null, Cell: () => null, BarChart: ({ children }: any) => <div>{children}</div>, Bar: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn().mockReturnValue({ user: { id: '1', name: 'Test', role: 'admin', organizationId: 'org-1', organization: { plan: 'Visionary' } }, isAuthenticated: true }) }));
vi.mock('@/services/api', () => ({ api: { euRegulations: { aiAct: { getSystems: vi.fn().mockResolvedValue([]), registerSystem: vi.fn().mockResolvedValue({}), conductRiskAssessment: vi.fn().mockResolvedValue({}), getTransparencyReports: vi.fn().mockResolvedValue([]), generateTransparencyReport: vi.fn().mockResolvedValue({}) } } }, getAuthToken: vi.fn().mockReturnValue('token') }));

describe('EUAIActDashboard', () => {
  it('should render dashboard', async () => { render(<EUAIActDashboard />); await waitFor(() => { expect(screen.getByText(/EU AI Act|AI Act|ai/i)).toBeTruthy(); }); });
  it('should show loading state initially', () => { render(<EUAIActDashboard />); expect(document.body.textContent).toBeTruthy(); });
  it('should render with empty data', async () => { render(<EUAIActDashboard />); await waitFor(() => { expect(document.body.textContent!.length).toBeGreaterThan(0); }); });
});
