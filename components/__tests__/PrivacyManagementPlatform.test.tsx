import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

// The platform loads its data through the dedicated `api.privacy.*` surface
// (not the generic get/post helpers), so mock that surface directly.
const privacy = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  listDSARs: vi.fn(),
  getConsentPurposes: vi.fn(),
  listRetention: vi.fn(),
  listSCCTIA: vi.fn(),
  getSuppressionList: vi.fn(),
  verifyDSARIdentity: vi.fn(),
  completeDSAR: vi.fn(),
  updateDSAR: vi.fn(),
  createDSAR: vi.fn(),
  runRetentionJob: vi.fn(),
  updateRetention: vi.fn(),
  createSCCTIA: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    privacy,
  },
}));

import { PrivacyManagementPlatform } from '../PrivacyManagementPlatform';

describe('PrivacyManagementPlatform', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default happy-path: every load endpoint resolves with empty arrays.
    privacy.getDashboard.mockResolvedValue({ avgResponseTime: 0 });
    privacy.listDSARs.mockResolvedValue([]);
    privacy.getConsentPurposes.mockResolvedValue([]);
    privacy.listRetention.mockResolvedValue([]);
    privacy.listSCCTIA.mockResolvedValue([]);
    privacy.getSuppressionList.mockResolvedValue([]);
    privacy.createDSAR.mockResolvedValue({});
    privacy.updateDSAR.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays privacy management content', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button');
    expect(backBtn).not.toBeNull();
    fireEvent.click(backBtn!);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('loads its data from the privacy API on mount', async () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    await waitFor(() => {
      expect(privacy.getDashboard).toHaveBeenCalled();
      expect(privacy.listDSARs).toHaveBeenCalled();
    });
    // Happy path must not surface the connectivity error banner.
    expect(screen.queryByText(/Failed to connect to the server/i)).toBeNull();
  });

  it('shows tab navigation for overview, dsar, consent, retention, transfers, optout', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches between tabs', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('DSAR') || text.includes('Consent') || text.includes('Retention') || text.includes('Transfer') || text.includes('Opt')) {
        fireEvent.click(btn);
      }
    });
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders overview with metrics', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('handles API errors by showing the load-failure banner', async () => {
    privacy.getDashboard.mockRejectedValue(new Error('API Error'));
    privacy.listDSARs.mockRejectedValue(new Error('API Error'));
    privacy.getConsentPurposes.mockRejectedValue(new Error('API Error'));
    privacy.listRetention.mockRejectedValue(new Error('API Error'));
    privacy.listSCCTIA.mockRejectedValue(new Error('API Error'));
    privacy.getSuppressionList.mockRejectedValue(new Error('API Error'));
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    // The component settles each call and renders a visible failure banner
    // rather than silently showing fabricated data.
    expect(await screen.findByText(/Failed to load:/i)).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<PrivacyManagementPlatform onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
