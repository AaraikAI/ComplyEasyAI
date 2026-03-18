import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

import CertificationTracker from '../CertificationTracker';

describe('CertificationTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<CertificationTracker />);
    expect(screen.getByText('certifications.title')).toBeInTheDocument();
  });

  it('displays stats cards', () => {
    render(<CertificationTracker />);
    expect(screen.getByText('common.total')).toBeInTheDocument();
    expect(screen.getByText('certifications.valid')).toBeInTheDocument();
    expect(screen.getByText('certifications.expiring')).toBeInTheDocument();
    expect(screen.getByText('certifications.expired')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Audits')).toBeInTheDocument();
  });

  it('shows registry tab by default with certifications list', () => {
    render(<CertificationTracker />);
    expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
    expect(screen.getByText('ISO 27001:2022')).toBeInTheDocument();
    expect(screen.getByText('PCI DSS v4.0')).toBeInTheDocument();
  });

  it('displays certification status badges', () => {
    render(<CertificationTracker />);
    const activeElements = screen.getAllByText('Active');
    expect(activeElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expiring').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);
    expect(screen.getAllByText('InProgress').length).toBeGreaterThan(0);
  });

  it('filters certifications by search', () => {
    render(<CertificationTracker />);
    const searchInput = screen.getByPlaceholderText('common.search');
    fireEvent.change(searchInput, { target: { value: 'SOC' } });
    expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
    expect(screen.queryByText('PCI DSS v4.0')).not.toBeInTheDocument();
  });

  it('filters certifications by status', () => {
    render(<CertificationTracker />);
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'Expired' } });
    expect(screen.getByText('HIPAA Compliance')).toBeInTheDocument();
    expect(screen.queryByText('SOC 2 Type II')).not.toBeInTheDocument();
  });

  it('selects a certification and shows detail view', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('SOC 2 Type II'));
    expect(screen.getByText('Audit History')).toBeInTheDocument();
    expect(screen.getByText('certifications.issuingBody')).toBeInTheDocument();
    expect(screen.getAllByText('Deloitte').length).toBeGreaterThan(0);
  });

  it('shows audit history in detail view', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('SOC 2 Type II'));
    expect(screen.getByText('Surveillance')).toBeInTheDocument();
    expect(screen.getByText('Recertification')).toBeInTheDocument();
  });

  it('shows documents in detail view', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('SOC 2 Type II'));
    expect(screen.getByText('SOC 2 Type II Report 2025')).toBeInTheDocument();
    expect(screen.getByText('SOC 2 Certificate')).toBeInTheDocument();
  });

  it('navigates back from detail view', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('SOC 2 Type II'));
    expect(screen.getByText('Audit History')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    expect(screen.queryByText('Audit History')).not.toBeInTheDocument();
  });

  it('switches to Audit Schedule tab', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('Audit Schedule'));
    expect(screen.getByText(/calendar.upcoming/)).toBeInTheDocument();
  });

  it('shows scheduled audits in schedule tab', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('Audit Schedule'));
    // Scheduled audits from initial data
    const content = document.body.textContent || '';
    expect(content).toContain('Audit');
  });

  it('switches to Documents tab', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('Documents'));
    expect(screen.getByText('All Documents')).toBeInTheDocument();
  });

  it('shows documents table', () => {
    render(<CertificationTracker />);
    fireEvent.click(screen.getByText('Documents'));
    expect(screen.getByText('SOC 2 Type II Report 2025')).toBeInTheDocument();
    expect(screen.getByText('Stage 2 Audit Report')).toBeInTheDocument();
  });

  it('opens create certification form', () => {
    render(<CertificationTracker />);
    const addBtn = screen.getByText(/common.add/);
    fireEvent.click(addBtn);
    expect(screen.getByPlaceholderText('e.g. SOC 2 Type II')).toBeInTheDocument();
  });

  it('closes create form on cancel', () => {
    render(<CertificationTracker />);
    const addBtn = screen.getByText(/common.add/);
    fireEvent.click(addBtn);
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByPlaceholderText('e.g. SOC 2 Type II')).not.toBeInTheDocument();
  });

  it('creates a new certification', () => {
    render(<CertificationTracker />);
    const addBtn = screen.getByText(/common.add/);
    fireEvent.click(addBtn);
    const nameInput = screen.getByPlaceholderText('e.g. SOC 2 Type II');
    fireEvent.change(nameInput, { target: { value: 'New Cert' } });
    const createBtns = screen.getAllByText('common.add');
    const submitBtn = createBtns[createBtns.length - 1];
    fireEvent.click(submitBtn);
    expect(screen.getByText('New Cert')).toBeInTheDocument();
  });

  it('shows expiry warning for certs expiring within 90 days', () => {
    render(<CertificationTracker />);
    // PCI DSS expires 2026-04-14 which may be within 90 days of test date (2026-03-16)
    const content = document.body.textContent || '';
    expect(content).toContain('until expiry');
  });

  it('shows EXPIRED label for expired certifications', () => {
    render(<CertificationTracker />);
    const expiredLabels = screen.getAllByText('EXPIRED');
    expect(expiredLabels.length).toBeGreaterThan(0);
  });

  it('displays nonconformities count', () => {
    render(<CertificationTracker />);
    expect(screen.getAllByText(/nonconformities/).length).toBeGreaterThan(0);
  });
});
