import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth' } },
    isAuthenticated: true,
  }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDel(...args),
  },
}));

import ControlTestResults from '../ControlTestResults';

const mockTests = [
  {
    id: 'ct1', name: 'MFA Enforcement', description: 'Check MFA is enabled',
    testType: 'access_review', controlId: 'c1', controlName: 'CC6.1 - Logical Access',
    framework: 'SOC 2', frequency: 'monthly', lastRun: '2026-03-01T00:00:00Z',
    lastStatus: 'passed', nextRun: '2026-04-01', passRate: 95, totalRuns: 12,
    consecutivePasses: 5, owner: 'Alice', automated: true,
    results: [
      { id: 'r1', testId: 'ct1', status: 'passed', output: 'All users have MFA', evidenceCaptured: ['screenshot.png'], findings: [], startedAt: '2026-03-01T10:00:00Z', completedAt: '2026-03-01T10:01:00Z', durationMs: 60000, testedBy: 'System' },
    ],
    createdAt: '2025-01-01', updatedAt: '2026-03-01',
  },
  {
    id: 'ct2', name: 'Encryption Check', description: 'Verify encryption at rest',
    testType: 'encryption_check', controlId: 'c2', controlName: 'CC6.7 - Encryption',
    framework: 'SOC 2', frequency: 'quarterly', lastStatus: 'failed', passRate: 60,
    totalRuns: 4, consecutivePasses: 0, owner: 'Bob', automated: true, results: [],
    createdAt: '2025-01-01', updatedAt: '2026-03-01',
  },
];

const mockCoverage = {
  totalControls: 100, testedControls: 75, coveragePercent: 75,
  fullyAutomated: 50, partiallyAutomated: 15, manualOnly: 10, noTesting: 25,
  byFramework: [
    { framework: 'SOC 2', tested: 60, total: 80, percent: 75 },
    { framework: 'ISO 27001', tested: 15, total: 20, percent: 75 },
  ],
};

describe('ControlTestResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((url: string) => {
      if (url.includes('coverage')) return Promise.resolve({ data: mockCoverage });
      if (url.includes('trends')) return Promise.resolve({ data: [{ period: 'Jan', passed: 8, failed: 2, warning: 1 }] });
      return Promise.resolve({ data: mockTests });
    });
    mockPost.mockResolvedValue({ data: { id: 'ct-new', name: 'New Test', testType: 'access_review', controlId: 'c1', controlName: 'New Control', framework: 'SOC 2', frequency: 'monthly', lastStatus: 'pending', passRate: 0, totalRuns: 0, consecutivePasses: 0, owner: 'Test', automated: false, results: [] } });
    mockPut.mockResolvedValue({ data: {} });
    mockDel.mockResolvedValue({});
  });

  it('renders dashboard view by default', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('controls.title')).toBeInTheDocument());
    expect(screen.getByText('Total Tests')).toBeInTheDocument();
  });

  it('shows metric cards', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('controls.title')).toBeInTheDocument());
    expect(screen.getByText('controls.pass')).toBeInTheDocument();
    expect(screen.getByText('controls.fail')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('shows coverage metrics', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('Test Coverage')).toBeInTheDocument());
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Fully Automated')).toBeInTheDocument();
  });

  it('shows coverage by framework', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('Test Coverage by Framework')).toBeInTheDocument());
    expect(screen.getByText('SOC 2')).toBeInTheDocument();
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
  });

  it('shows recent test executions', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('Recent Test Executions')).toBeInTheDocument());
    expect(screen.getByText('MFA Enforcement')).toBeInTheDocument();
    expect(screen.getByText('Encryption Check')).toBeInTheDocument();
  });

  it('shows trend chart', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('Pass/Fail Trend')).toBeInTheDocument());
  });

  it('navigates to test list view', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('All Tests')).toBeInTheDocument());
    fireEvent.click(screen.getByText('All Tests'));
    // Table headers should appear
    await waitFor(() => expect(screen.getByText('Pass Rate')).toBeInTheDocument());
  });

  it('navigates to create test form', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('New Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Test'));
    expect(screen.getAllByText('controls.controlName').length).toBeGreaterThan(0);
  });

  it('creates a new test', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('New Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Test'));
    const nameInput = screen.getByPlaceholderText('e.g., MFA Enforcement Check');
    fireEvent.change(nameInput, { target: { value: 'My New Test' } });
    expect(nameInput).toHaveValue('My New Test');
    // Verify form fields are present
    expect(screen.getByText('Create Test')).toBeInTheDocument();
  });

  it('navigates to test detail', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('MFA Enforcement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('MFA Enforcement'));
    await waitFor(() => expect(screen.getByText('Total Runs')).toBeInTheDocument());
    expect(screen.getByText('Execution History')).toBeInTheDocument();
  });

  it('shows execution history in detail view', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('MFA Enforcement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('MFA Enforcement'));
    await waitFor(() => expect(screen.getByText('Execution History')).toBeInTheDocument());
  });

  it('handles empty tests gracefully', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('coverage')) return Promise.resolve({ data: null });
      if (url.includes('trends')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('common.noResults')).toBeInTheDocument());
  });

  it('handles loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ControlTestResults />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('filters tests by search in list view', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('All Tests')).toBeInTheDocument());
    fireEvent.click(screen.getByText('All Tests'));
    await waitFor(() => expect(screen.getByPlaceholderText('common.search')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('common.search'), { target: { value: 'MFA' } });
    expect(screen.getByText('MFA Enforcement')).toBeInTheDocument();
  });

  it('shows delete confirmation dialog', async () => {
    render(<ControlTestResults />);
    await waitFor(() => expect(screen.getByText('All Tests')).toBeInTheDocument());
    fireEvent.click(screen.getByText('All Tests'));
    await waitFor(() => expect(screen.getAllByTestId('icon-Trash2').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByTestId('icon-Trash2')[0].closest('button')!);
    expect(screen.getAllByText('common.delete').length).toBeGreaterThan(0);
  });
});
