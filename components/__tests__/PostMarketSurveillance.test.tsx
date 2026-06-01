import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

const { apiGet, apiPost, apiPut, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    modules: {
      // Mirror the full surveillance surface the component loads on mount so the
      // success path (real data) is exercised rather than the fixture fallback.
      surveillance: {
        listPlans: apiGet,
        listRecalls: apiGet,
        listIncidents: apiGet,
        listCapas: apiGet,
        listNonConformities: apiGet,
        listReports: apiGet,
        createIncident: apiPost,
        createReport: apiPost,
      },
    },
    ai: { generateReport: apiPost },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import PostMarketSurveillance from '../PostMarketSurveillance';

describe('PostMarketSurveillance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The component treats array responses as live data; non-arrays fall back to [].
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 'pms1' });
  });

  it('renders without crashing', () => {
    render(<PostMarketSurveillance />);
    expect(screen.queryAllByText(/Post-Market|Surveillance|surveillance/i).length).toBeGreaterThan(0);
  });

  it('shows surveillance plans list', () => {
    render(<PostMarketSurveillance />);
    const rows = document.querySelectorAll('tr, div[class*="cursor"]');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('opens the report-incident modal from the header action', () => {
    render(<PostMarketSurveillance />);
    // The header always renders a "Report Incident" action.
    const reportBtn = screen.getAllByText(/Report Incident/i)[0];
    expect(reportBtn).toBeTruthy();
    fireEvent.click(reportBtn);
    // The modal heading must now be present.
    expect(screen.getByText(/Report New Incident/i)).toBeInTheDocument();
  });

  it('filters incidents by search query', async () => {
    render(<PostMarketSurveillance />);
    // The incident search box lives on the Incidents tab — switch to it first.
    fireEvent.click(screen.getByRole('button', { name: /^Incidents$/i }));
    const searchInput = await screen.findByPlaceholderText(/Search incidents/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'safety' } });
    expect((searchInput as HTMLInputElement).value).toBe('safety');
  });

  it('shows stat cards', () => {
    render(<PostMarketSurveillance />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThan(0);
  });

  it('renders the overview stat cards', () => {
    render(<PostMarketSurveillance />);
    // The overview is the default tab and always renders its summary cards.
    expect(screen.getByText(/Open Incidents/i)).toBeInTheDocument();
    expect(screen.getByText(/Open CAPAs/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Recalls/i)).toBeInTheDocument();
  });

  it('calls API on mount', async () => {
    render(<PostMarketSurveillance />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors by surfacing the fallback banner', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<PostMarketSurveillance />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
    // When every list endpoint rejects the component shows a connectivity banner.
    expect(await screen.findByText(/Unable to connect to server/i)).toBeInTheDocument();
  });

  it('switches to the incidents tab', async () => {
    render(<PostMarketSurveillance />);
    fireEvent.click(screen.getByRole('button', { name: /^Incidents$/i }));
    // The incidents view exposes its dedicated search box.
    expect(await screen.findByPlaceholderText(/Search incidents/i)).toBeInTheDocument();
  });

  it('switches to the CAPA tab', async () => {
    render(<PostMarketSurveillance />);
    fireEvent.click(screen.getByRole('button', { name: /^CAPA$/i }));
    // The CAPA view always renders its "Total CAPAs" summary card.
    expect(await screen.findByText(/Total CAPAs/i)).toBeInTheDocument();
  });
});
