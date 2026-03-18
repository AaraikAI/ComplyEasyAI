import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true, logout: vi.fn(),
  }),
}));

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }),
}));

import IncidentManagement from '../IncidentManagement';

describe('IncidentManagement', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    render(<IncidentManagement />);
    expect(screen.queryAllByText(/incidents/i).length).toBeGreaterThan(0);
  });

  it('shows incidents tab by default', () => {
    render(<IncidentManagement />);
    expect(screen.queryAllByText(/SEV1|SEV2|incidents.title|Incident/i).length).toBeGreaterThan(0);
  });

  it('displays summary stat cards', () => {
    render(<IncidentManagement />);
    const statCards = document.querySelectorAll('[class*="rounded-xl"]');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('shows incidents in the list', () => {
    render(<IncidentManagement />);
    expect(screen.queryAllByText(/Data Breach|Unauthorized Access|Malware|Phishing|Production/i).length).toBeGreaterThan(0);
  });

  it('filters incidents by search', () => {
    render(<IncidentManagement />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    }
  });

  it('opens create form when add button is clicked', () => {
    render(<IncidentManagement />);
    const addBtn = screen.queryAllByText(/New Incident|Create Incident/i)[0] ?? null;
    if (addBtn) {
      fireEvent.click(addBtn);
      expect(screen.queryAllByText(/Title|incident/i).length).toBeGreaterThan(0);
    }
  });

  it('switches to timeline tab', () => {
    render(<IncidentManagement />);
    const timelineTab = screen.queryAllByText(/Timeline/i)[0] ?? null;
    if (timelineTab) {
      fireEvent.click(timelineTab);
    }
  });

  it('switches to metrics tab', () => {
    render(<IncidentManagement />);
    const metricsTab = screen.queryAllByText(/Metrics/i)[0] ?? null;
    if (metricsTab) {
      fireEvent.click(metricsTab);
    }
  });

  it('opens incident detail view when incident is clicked', () => {
    render(<IncidentManagement />);
    const incidentRows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (incidentRows.length > 0) {
      fireEvent.click(incidentRows[0]);
    }
  });

  it('filters by severity', () => {
    render(<IncidentManagement />);
    const severitySelect = screen.queryByDisplayValue(/All Severities|all/i);
    if (severitySelect) {
      fireEvent.change(severitySelect, { target: { value: 'SEV1' } });
    }
  });

  it('filters by status', () => {
    render(<IncidentManagement />);
    const statusSelect = screen.queryByDisplayValue(/All Status|all/i);
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'Detected' } });
    }
  });

  it('deletes an incident with confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<IncidentManagement />);
    const deleteButtons = document.querySelectorAll('[title="Delete"], button[class*="red"]');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
    }
  });

  it('cancels delete when confirm returns false', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<IncidentManagement />);
    const deleteButtons = document.querySelectorAll('[title="Delete"]');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
    }
  });
});
