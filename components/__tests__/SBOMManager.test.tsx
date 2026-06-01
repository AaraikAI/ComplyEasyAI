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
      sbom: {
        listEntries: apiGet,
        listRepositories: apiGet,
        updateEntry: apiPut,
        deleteRepository: apiDelete,
        createRepository: apiPost,
        deleteEntry: apiDelete,
        updateRepository: apiPut,
      },
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import SBOMManager from '../SBOMManager';

describe('SBOMManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'sbom1' } });
  });

  it('renders without crashing', () => {
    render(<SBOMManager />);
    expect(screen.queryAllByText(/SBOM|Software Bill|Bill of Materials/i).length).toBeGreaterThan(0);
  });

  it('shows tab navigation', () => {
    render(<SBOMManager />);
    expect(screen.queryAllByText(/Overview|Components|Vulnerabilities|overview|components|vulnerabilities/i).length).toBeGreaterThan(0);
  });

  it('switches to components tab', () => {
    render(<SBOMManager onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Components/i }));
    // The components tab exposes its own search box.
    expect(screen.getByPlaceholderText('Search components...')).toBeInTheDocument();
  });

  it('switches to vulnerabilities tab', () => {
    render(<SBOMManager onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Vulnerabilities/i }));
    expect(screen.getByPlaceholderText(/Search by CVE/i)).toBeInTheDocument();
  });

  it('switches to licenses tab', () => {
    render(<SBOMManager onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Licenses/i }));
    // License category summary cards are unique to the licenses tab.
    expect(screen.getByText('Permissive')).toBeInTheDocument();
    expect(screen.getByText('Copyleft')).toBeInTheDocument();
  });

  it('switches to repositories tab', () => {
    render(<SBOMManager onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Repositories/i }));
    expect(screen.getByText('Connected Repositories')).toBeInTheDocument();
  });

  it('filters by search', () => {
    render(<SBOMManager />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'react' } });
  });

  it('shows overview summary cards', () => {
    render(<SBOMManager onBack={vi.fn()} />);
    // Overview is the default tab and always renders its labelled summary cards.
    expect(screen.getByText('Critical CVEs')).toBeInTheDocument();
    expect(screen.getByText('High CVEs')).toBeInTheDocument();
    expect(screen.getByText('License Issues')).toBeInTheDocument();
  });

  it('calls API on mount', async () => {
    render(<SBOMManager />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('handles API errors', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<SBOMManager />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });

  it('shows component detail view', async () => {
    render(<SBOMManager onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Components/i }));
    // Reference fixtures load once listLicenses is unavailable; a known component row appears.
    const row = (await screen.findByText('express')).closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!);
    // Clicking a row reveals the detail panel exposing PURL / CPE metadata.
    await waitFor(() => expect(screen.getByText('PURL')).toBeInTheDocument());
    expect(screen.getByText('CPE')).toBeInTheDocument();
  });

  it('filters by severity', async () => {
    render(<SBOMManager onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Vulnerabilities/i }));
    // Wait for reference fixtures so the vulnerability list is populated, then narrow to Critical.
    await screen.findByText('CVE-2024-33883');
    // The severity <select> is identified by its current option text (".. Severity").
    const severitySelect = screen.getByDisplayValue(/Severity/i);
    fireEvent.change(severitySelect, { target: { value: 'Critical' } });
    expect((severitySelect as HTMLSelectElement).value).toBe('Critical');
    // A High-severity CVE is filtered out while a Critical one remains.
    expect(screen.getByText('CVE-2024-33883')).toBeInTheDocument();
    expect(screen.queryByText('CVE-2024-29041')).not.toBeInTheDocument();
  });
});
