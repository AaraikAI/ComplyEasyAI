import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { NIS2Dashboard } from '../NIS2Dashboard';

describe('NIS2Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders the header and directive subtitle', () => {
    render(<NIS2Dashboard />);
    // Title is the i18n key; the directive reference subtitle is literal text.
    expect(screen.getByRole('heading', { name: 'euRegulations.nis2' })).toBeInTheDocument();
    expect(screen.getByText(/Network and Information Security Directive \(EU\) 2022\/2555/i)).toBeInTheDocument();
  });

  it('shows tab navigation with classification, measures, incidents and supply chain', () => {
    render(<NIS2Dashboard />);
    expect(screen.getByRole('button', { name: /Classification/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Risk Measures/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Incidents$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Supply Chain/i })).toBeInTheDocument();
  });

  it('renders the overview tab with penalty-risk and Article 21 sections', () => {
    render(<NIS2Dashboard />);
    // Overview is the default tab; these section headings always render.
    expect(screen.getByRole('heading', { name: /Penalty Risk Overview/i })).toBeInTheDocument();
    expect(screen.getByText('Entity Type')).toBeInTheDocument();
    expect(screen.getByText('Open Incidents')).toBeInTheDocument();
  });

  it('exposes the penalty-risk and export-report actions', () => {
    render(<NIS2Dashboard />);
    expect(screen.getByRole('button', { name: /Penalty Risk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Report/i })).toBeInTheDocument();
  });

  it('falls back to template data and surfaces an error banner when the API is unavailable', async () => {
    render(<NIS2Dashboard />);
    // api.regulationData is not provided by the mock, so the loader fails and the
    // component shows the reference-template warning while still rendering data.
    expect(await screen.findByText(/Unable to connect to server\. Showing reference template data\./i)).toBeInTheDocument();
    // Template measures populate the Article 21 progress list.
    await waitFor(() => {
      expect(screen.getByText('Incident handling procedures')).toBeInTheDocument();
    });
  });

  it('switches to the incidents tab and shows the reporting timeline + search', async () => {
    render(<NIS2Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^Incidents$/i }));
    // The incidents tab renders the NIS2 reporting timeline and a search box.
    expect(screen.getByText(/NIS2 Incident Reporting Timeline/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search incidents...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Report Incident/i })).toBeInTheDocument();
    // A template incident is listed once data has loaded.
    expect(await screen.findByText('Ransomware Attack on File Storage')).toBeInTheDocument();
  });

  it('filters incidents by the search box', async () => {
    render(<NIS2Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^Incidents$/i }));
    // Wait for template incidents to load.
    await screen.findByText('Ransomware Attack on File Storage');
    const search = screen.getByPlaceholderText('Search incidents...') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'DDoS' } });
    expect(search.value).toBe('DDoS');
    expect(screen.getByText('DDoS Attack on Customer Portal')).toBeInTheDocument();
    expect(screen.queryByText('Ransomware Attack on File Storage')).not.toBeInTheDocument();
  });

  it('switches to the classification tab', async () => {
    render(<NIS2Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Classification/i }));
    expect(screen.getByRole('heading', { name: /Entity Classification/i })).toBeInTheDocument();
    // Essential / Important sector guides render.
    expect(screen.getByText(/Essential Entities \(Annex I\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Important Entities \(Annex II\)/i)).toBeInTheDocument();
  });

  it('opens the report-incident modal', async () => {
    render(<NIS2Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^Incidents$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Report Incident/i }));
    // Modal heading + required title field appear.
    expect(screen.getByRole('heading', { name: /Report Security Incident/i })).toBeInTheDocument();
    expect(screen.getByText('Incident Title *')).toBeInTheDocument();
  });
});
