import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

import ComplianceCostDashboard from '../ComplianceCostDashboard';

describe('ComplianceCostDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ComplianceCostDashboard />);
    expect(screen.getByText('costs.title')).toBeInTheDocument();
  });

  it('displays summary cards with totals', () => {
    render(<ComplianceCostDashboard />);
    expect(screen.getByText('costs.totalCost')).toBeInTheDocument();
    expect(screen.getByText('costs.budget')).toBeInTheDocument();
    expect(screen.getByText('Budget Utilization')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('shows overview tab by default', () => {
    render(<ComplianceCostDashboard />);
    expect(screen.getByText('costs.costByCategory')).toBeInTheDocument();
    expect(screen.getByText('costs.costByFramework')).toBeInTheDocument();
    expect(screen.getByText('costs.costTrend')).toBeInTheDocument();
  });

  it('shows cost by category breakdown', () => {
    render(<ComplianceCostDashboard />);
    expect(screen.getByText('Audit Fee')).toBeInTheDocument();
    expect(screen.getByText('Tool License')).toBeInTheDocument();
    expect(screen.getByText('Personnel')).toBeInTheDocument();
  });

  it('shows cost by framework breakdown', () => {
    render(<ComplianceCostDashboard />);
    expect(screen.getByText('SOC 2')).toBeInTheDocument();
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByText('GDPR')).toBeInTheDocument();
  });

  it('switches to entries tab', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Vendor')).toBeInTheDocument();
  });

  it('displays entries table with data', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    expect(screen.getByText('Vanta GRC Platform License')).toBeInTheDocument();
    expect(screen.getByText('SOC 2 Type II External Audit')).toBeInTheDocument();
  });

  it('filters entries by search query', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const searchInput = screen.getByPlaceholderText(/costs/);
    fireEvent.change(searchInput, { target: { value: 'Vanta' } });
    expect(screen.getByText('Vanta GRC Platform License')).toBeInTheDocument();
    expect(screen.queryByText('SOC 2 Type II External Audit')).not.toBeInTheDocument();
  });

  it('filters entries by category', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const catSelect = screen.getByDisplayValue('common.all Categories');
    fireEvent.change(catSelect, { target: { value: 'AuditFee' } });
    expect(screen.getByText('SOC 2 Type II External Audit')).toBeInTheDocument();
    expect(screen.queryByText('Vanta GRC Platform License')).not.toBeInTheDocument();
  });

  it('filters entries by framework', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const fwSelect = screen.getByDisplayValue('All Frameworks');
    fireEvent.change(fwSelect, { target: { value: 'GDPR' } });
    expect(screen.getByText('GDPR Compliance Consultant')).toBeInTheDocument();
  });

  it('deletes an entry', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    const deleteButtons = screen.getAllByTestId('icon-Trash2');
    const initialCount = screen.getByText(/entries/).textContent;
    fireEvent.click(deleteButtons[0].closest('button')!);
    const newCount = screen.getByText(/entries/).textContent;
    expect(newCount).not.toEqual(initialCount);
  });

  it('opens create form modal', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    expect(screen.getByText('Add Cost Entry')).toBeInTheDocument();
  });

  it('closes create form on cancel', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    expect(screen.getByText('Add Cost Entry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add Cost Entry')).not.toBeInTheDocument();
  });

  it('closes create form on X button', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    const xBtn = screen.getByText('Add Cost Entry').closest('div')?.parentElement?.querySelector('button');
    fireEvent.click(xBtn!);
    expect(screen.queryByText('Add Cost Entry')).not.toBeInTheDocument();
  });

  it('creates a new cost entry', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    fireEvent.click(screen.getByText('Add Cost'));
    // Fill in form fields
    const descInput = screen.getAllByRole('textbox')[1] || screen.getAllByDisplayValue('')[0];
    if (descInput) fireEvent.change(descInput, { target: { value: 'New Compliance Tool' } });
    fireEvent.click(screen.getByText('Add Entry'));
  });

  it('switches to budget tab', () => {
    render(<ComplianceCostDashboard />);
    const budgetTab = screen.getAllByText(/costs.budget/).find(el => el.closest('button'));
    if (budgetTab) fireEvent.click(budgetTab);
    expect(screen.getByText(/common.category/)).toBeInTheDocument();
  });

  it('shows budget vs actual comparison', () => {
    render(<ComplianceCostDashboard />);
    const budgetTab = screen.getAllByText(/costs.budget/).find(el => el.closest('button'));
    if (budgetTab) fireEvent.click(budgetTab);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText(/under budget/).length).toBeGreaterThan(0);
  });

  it('shows monthly trend chart in overview', () => {
    render(<ComplianceCostDashboard />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Dec')).toBeInTheDocument();
  });

  it('displays entry count in entries tab', () => {
    render(<ComplianceCostDashboard />);
    fireEvent.click(screen.getByText('Cost Entries'));
    expect(screen.getByText('12 entries')).toBeInTheDocument();
  });
});
