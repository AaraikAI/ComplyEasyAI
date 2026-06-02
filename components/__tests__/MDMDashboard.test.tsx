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
    mdm: {
      listDevices: apiGet,
      listPolicies: apiGet,
      getDashboard: apiGet,
      createPolicy: apiPost,
      executeAction: apiPost,
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import MDMDashboard from '../MDMDashboard';

describe('MDMDashboard', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
    apiPost.mockResolvedValue({ data: { id: 'mdm1' } });
  });

  it('renders without crashing', () => {
    render(<MDMDashboard onBack={onBack} />);
    expect(screen.getByRole('heading', { name: /Mobile Device Management/i })).toBeInTheDocument();
  });

  it('shows tab navigation', () => {
    render(<MDMDashboard onBack={onBack} />);
    // All five tabs render as buttons unconditionally.
    expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Devices/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Policies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compliance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actions Log/i })).toBeInTheDocument();
  });

  it('switches to devices tab', () => {
    render(<MDMDashboard onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Devices$/i }));
    // Devices tab renders the search box and the platform filter.
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enroll Device/i })).toBeInTheDocument();
  });

  it('switches to policies tab', () => {
    render(<MDMDashboard onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Policies$/i }));
    expect(screen.getByRole('heading', { name: /MDM Policies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Policy/i })).toBeInTheDocument();
  });

  it('switches to compliance tab', () => {
    render(<MDMDashboard onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Compliance$/i }));
    expect(screen.getByText('Auto-Remediation Settings')).toBeInTheDocument();
  });

  it('switches to actions log tab', () => {
    render(<MDMDashboard onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions Log/i }));
    expect(screen.getByText(/actions recorded/i)).toBeInTheDocument();
  });

  it('filters devices by search', () => {
    render(<MDMDashboard onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Devices$/i }));
    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });
    expect(searchInput.value).toBe('iPhone');
  });

  it('shows overview stat cards', () => {
    render(<MDMDashboard onBack={onBack} />);
    // The overview tab renders the fleet metric cards even with an empty fleet.
    expect(screen.getByText('Total Devices')).toBeInTheDocument();
    expect(screen.getByText('Fleet Compliance')).toBeInTheDocument();
  });

  it('calls the MDM API on mount', async () => {
    render(<MDMDashboard onBack={onBack} />);
    await waitFor(() => {
      // listDevices, listPolicies and getDashboard all route through apiGet.
      expect(apiGet).toHaveBeenCalled();
    });
    expect(apiGet.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('shows an error banner and retry when the API fails', async () => {
    apiGet.mockRejectedValue(new Error('Network error'));
    render(<MDMDashboard onBack={onBack} />);
    // When every MDM call rejects, the dashboard surfaces an error banner with retry.
    expect(await screen.findByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(screen.getByText(/Failed to load|Failed to connect/i)).toBeInTheDocument();
  });

  it('filters devices by platform', () => {
    render(<MDMDashboard onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /^Devices$/i }));
    const platformSelect = screen.getByDisplayValue('All Platforms') as HTMLSelectElement;
    fireEvent.change(platformSelect, { target: { value: 'iOS' } });
    expect(platformSelect.value).toBe('iOS');
  });
});
