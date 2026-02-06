import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => {
    if (name === '__esModule') return true;
    return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />;
  },
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboardingTrigger: vi.fn(),
}));

describe('Dashboard', () => {
  const mockNavigate = vi.fn();
  const defaultProps = {
    frameworks: [],
    risks: [],
    onNavigate: mockNavigate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with empty data', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText(/compliance/i)).toBeTruthy();
  });

  it('should render with frameworks data', () => {
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 65, controls: [] },
      { id: '2', name: 'GDPR', status: 'Compliant' as any, progress: 100, controls: [] },
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText('SOC 2')).toBeTruthy();
    expect(screen.getByText('GDPR')).toBeTruthy();
  });

  it('should render with risks data', () => {
    const risks = [
      { id: '1', title: 'Data Breach Risk', severity: 'High' as any, status: 'Open' as any, description: 'test', category: 'Security' },
    ];
    render(<Dashboard {...defaultProps} risks={risks} />);
    expect(screen.getByText(/risk/i)).toBeTruthy();
  });

  it('should display compliance score', () => {
    const frameworks = [
      { id: '1', name: 'SOC 2', status: 'In Progress' as any, progress: 80, controls: [
        { id: 'c1', name: 'AC-1', status: 'Implemented', description: 'test' },
        { id: 'c2', name: 'AC-2', status: 'Not Started', description: 'test' },
      ]},
    ];
    render(<Dashboard {...defaultProps} frameworks={frameworks} />);
    expect(screen.getByText(/50%|80%|\d+%/)).toBeTruthy();
  });

  it('should show chart container', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByTestId('chart-container')).toBeTruthy();
  });
});
