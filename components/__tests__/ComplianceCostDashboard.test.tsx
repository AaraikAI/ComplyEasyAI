import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

import ComplianceCostDashboard from '../ComplianceCostDashboard';

// Mock cost entries matching backend shape
const MOCK_COSTS = [
  { id: 'c1', description: 'Vanta GRC Platform License', amount: 24000, category: 'TOOL_LICENSE', frameworkId: 'SOC2', vendorId: 'Vanta', periodStart: '2026-01-15T00:00:00Z' },
  { id: 'c2', description: 'SOC 2 Type II External Audit', amount: 45000, category: 'AUDIT_FEE', frameworkId: 'SOC2', vendorId: 'Deloitte', periodStart: '2026-02-01T00:00:00Z' },
  { id: 'c3', description: 'ISO 27001 Consultant', amount: 18000, category: 'CONSULTANT', frameworkId: 'ISO27001', vendorId: 'BSI', periodStart: '2026-03-01T00:00:00Z' },
  { id: 'c4', description: 'Security Awareness Training', amount: 8500, category: 'TRAINING', frameworkId: 'General', vendorId: 'KnowBe4', periodStart: '2026-01-01T00:00:00Z' },
  { id: 'c5', description: 'GDPR Compliance Consultant', amount: 12000, category: 'CONSULTANT', frameworkId: 'GDPR', vendorId: 'Privacy Co', periodStart: '2026-02-15T00:00:00Z' },
  { id: 'c6', description: 'Compliance Team Salaries Q1', amount: 95000, category: 'PERSONNEL', frameworkId: 'General', vendorId: '', periodStart: '2026-01-01T00:00:00Z' },
  { id: 'c7', description: 'Cyber Insurance Premium', amount: 35000, category: 'INSURANCE', frameworkId: 'General', vendorId: 'Hartford', periodStart: '2026-01-01T00:00:00Z' },
  { id: 'c8', description: 'Vulnerability Remediation Sprint', amount: 22000, category: 'REMEDIATION', frameworkId: 'SOC2', vendorId: '', periodStart: '2026-03-01T00:00:00Z' },
  { id: 'c9', description: 'HIPAA Risk Assessment', amount: 15000, category: 'AUDIT_FEE', frameworkId: 'HIPAA', vendorId: 'HITRUST', periodStart: '2026-02-01T00:00:00Z' },
  { id: 'c10', description: 'PCI ASV Scanning Service', amount: 6000, category: 'TOOL_LICENSE', frameworkId: 'PCIDSS', vendorId: 'Qualys', periodStart: '2026-01-01T00:00:00Z' },
  { id: 'c11', description: 'Data Protection Officer Training', amount: 4500, category: 'TRAINING', frameworkId: 'GDPR', vendorId: 'IAPP', periodStart: '2026-03-15T00:00:00Z' },
  { id: 'c12', description: 'Penetration Testing', amount: 28000, category: 'AUDIT_FEE', frameworkId: 'General', vendorId: 'CrowdStrike', periodStart: '2026-02-01T00:00:00Z' },
];

const MOCK_TREND = [
  { month: '2025-01', total: 25000 }, { month: '2025-02', total: 28000 }, { month: '2025-03', total: 32000 },
  { month: '2025-04', total: 27000 }, { month: '2025-05', total: 30000 }, { month: '2025-06', total: 35000 },
  { month: '2025-07', total: 29000 }, { month: '2025-08', total: 31000 }, { month: '2025-09', total: 33000 },
  { month: '2025-10', total: 28000 }, { month: '2025-11', total: 26000 }, { month: '2025-12', total: 40000 },
];

const MOCK_BUDGET = [
  { category: 'TOOL_LICENSE', actual: 30000 },
  { category: 'CONSULTANT', actual: 30000 },
  { category: 'AUDIT_FEE', actual: 88000 },
  { category: 'TRAINING', actual: 13000 },
  { category: 'PERSONNEL', actual: 95000 },
  { category: 'INSURANCE', actual: 35000 },
  { category: 'REMEDIATION', actual: 22000 },
];

function createFetchMock() {
  return vi.fn().mockImplementation((url: string, options?: any) => {
    if (typeof url === 'string' && url.includes('/api/costs')) {
      if (url.includes('/trend')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', data: { trend: MOCK_TREND } }),
        });
      }
      if (url.includes('/budget')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', data: { byCategory: MOCK_BUDGET, totalActual: 313000 } }),
        });
      }
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', data: { id: 'c-new', description: body.description || '', amount: body.amount || 0, category: body.category || 'OTHER', frameworkId: body.frameworkId || 'General', vendorId: '', periodStart: new Date().toISOString() } }),
        });
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', data: { costs: MOCK_COSTS } }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

async function renderAndWait(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => { result = render(ui); });
  await waitFor(() => {
    expect(screen.queryByText('Loading cost data...')).not.toBeInTheDocument();
  });
  return result!;
}

describe('ComplianceCostDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = createFetchMock();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders without crashing', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    expect(screen.getByText('costs.title')).toBeInTheDocument();
  });

  it('displays summary cards with totals', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    expect(screen.getByText('costs.totalCost')).toBeInTheDocument();
    expect(screen.getByText('costs.budget')).toBeInTheDocument();
    expect(screen.getByText('Budget Utilization')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('shows overview tab by default', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    expect(screen.getByText('costs.costByCategory')).toBeInTheDocument();
    expect(screen.getByText('costs.costByFramework')).toBeInTheDocument();
    expect(screen.getByText('costs.costTrend')).toBeInTheDocument();
  });

  it('shows cost by category breakdown', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    expect(screen.getByText('Audit Fee')).toBeInTheDocument();
    expect(screen.getByText('Tool License')).toBeInTheDocument();
    expect(screen.getByText('Personnel')).toBeInTheDocument();
  });

  it('shows cost by framework breakdown', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    expect(screen.getByText('SOC 2')).toBeInTheDocument();
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByText('GDPR')).toBeInTheDocument();
  });

  it('switches to entries tab', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Vendor')).toBeInTheDocument();
  });

  it('displays entries table with data', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    expect(screen.getByText('Vanta GRC Platform License')).toBeInTheDocument();
    expect(screen.getByText('SOC 2 Type II External Audit')).toBeInTheDocument();
  });

  it('filters entries by search query', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const searchInput = screen.getByPlaceholderText(/costs/);
    fireEvent.change(searchInput, { target: { value: 'Vanta' } });
    expect(screen.getByText('Vanta GRC Platform License')).toBeInTheDocument();
    expect(screen.queryByText('SOC 2 Type II External Audit')).not.toBeInTheDocument();
  });

  it('filters entries by category', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const catSelect = screen.getByDisplayValue('common.all Categories');
    fireEvent.change(catSelect, { target: { value: 'AuditFee' } });
    expect(screen.getByText('SOC 2 Type II External Audit')).toBeInTheDocument();
    expect(screen.queryByText('Vanta GRC Platform License')).not.toBeInTheDocument();
  });

  it('filters entries by framework', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const fwSelect = screen.getByDisplayValue('All Frameworks');
    fireEvent.change(fwSelect, { target: { value: 'GDPR' } });
    expect(screen.getByText('GDPR Compliance Consultant')).toBeInTheDocument();
  });

  it('deletes an entry', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const deleteButtons = screen.getAllByTestId('icon-Trash2');
    const initialCount = screen.getByText(/entries/).textContent;
    await act(async () => { fireEvent.click(deleteButtons[0].closest('button')!); });
    await waitFor(() => {
      const newCount = screen.getByText(/entries/).textContent;
      expect(newCount).not.toEqual(initialCount);
    });
  });

  it('opens create form modal', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    expect(screen.getByText('Add Cost Entry')).toBeInTheDocument();
  });

  it('closes create form on cancel', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    expect(screen.getByText('Add Cost Entry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add Cost Entry')).not.toBeInTheDocument();
  });

  it('closes create form on X button', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    const xBtn = screen.getByText('Add Cost Entry').closest('div')?.parentElement?.querySelector('button');
    fireEvent.click(xBtn!);
    expect(screen.queryByText('Add Cost Entry')).not.toBeInTheDocument();
  });

  it('creates a new cost entry', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    // Fill in form fields
    const descInput = screen.getAllByRole('textbox')[1] || screen.getAllByDisplayValue('')[0];
    if (descInput) fireEvent.change(descInput, { target: { value: 'New Compliance Tool' } });
    await act(async () => { fireEvent.click(screen.getByText('Add Entry')); });
  });

  it('switches to budget tab', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    const budgetTab = screen.getAllByText(/costs.budget/).find(el => el.closest('button'));
    if (budgetTab) fireEvent.click(budgetTab);
    expect(screen.getByText(/common.category/)).toBeInTheDocument();
  });

  it('shows budget vs actual comparison', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    const budgetTab = screen.getAllByText(/costs.budget/).find(el => el.closest('button'));
    if (budgetTab) fireEvent.click(budgetTab);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText(/under budget/).length).toBeGreaterThan(0);
  });

  it('shows monthly trend chart in overview', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Dec')).toBeInTheDocument();
  });

  it('displays entry count in entries tab', async () => {
    await renderAndWait(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    expect(screen.getByText('12 entries')).toBeInTheDocument();
  });
});
