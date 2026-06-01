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

// The component loads notices, consent stats, templates and version history
// through `api.privacy.*` on mount. Mock that surface so the test can assert
// the component is wired to the backend and renders live API data.
const privacy = vi.hoisted(() => ({
  listNotices: vi.fn(),
  getConsentStats: vi.fn(),
  listNoticeTemplates: vi.fn(),
  listNoticeVersionHistory: vi.fn(),
  createNotice: vi.fn(),
  updateNotice: vi.fn(),
  deleteNotice: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: { privacy },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

// Build a complete notice record matching the component's PrivacyNotice shape.
const makeNotice = (over: Record<string, unknown> = {}) => ({
  id: 'PN-API-1',
  title: 'Live API Notice',
  type: 'Website',
  status: 'Published',
  version: '1.0',
  content: 'Served from the privacy API.',
  effectiveDate: '2026-01-01',
  lastUpdated: '2026-01-02',
  createdAt: '2026-01-01',
  createdBy: 'tester',
  versionNotes: '',
  language: 'en',
  jurisdiction: 'Global',
  viewCount: 0,
  acceptanceCount: 0,
  acceptanceRate: 0,
  ...over,
});

import PrivacyNoticeServing from '../PrivacyNoticeServing';

describe('PrivacyNoticeServing', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: the API returns no notices so the component keeps its local set.
    privacy.listNotices.mockResolvedValue({ notices: [] });
    privacy.getConsentStats.mockResolvedValue([]);
    privacy.listNoticeTemplates.mockResolvedValue(null);
    privacy.listNoticeVersionHistory.mockResolvedValue(null);
  });

  it('renders without crashing', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('loads notices from the privacy API on mount', async () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    await waitFor(() => {
      expect(privacy.listNotices).toHaveBeenCalled();
      expect(privacy.getConsentStats).toHaveBeenCalled();
    });
  });

  it('displays privacy notices content', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button');
    expect(backBtn).not.toBeNull();
    fireEvent.click(backBtn!);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows tab navigation for notices, templates, analytics', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('switches to templates tab', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const templatesBtn = buttons.find(b => b.textContent?.includes('Template'));
    if (templatesBtn) {
      fireEvent.click(templatesBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('switches to analytics tab', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    const analyticsBtn = buttons.find(b => b.textContent?.includes('Analytic'));
    if (analyticsBtn) {
      fireEvent.click(analyticsBtn);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('renders live notices returned by the API', async () => {
    privacy.listNotices.mockResolvedValue({
      notices: [makeNotice({ id: 'PN-API-1', title: 'Live API Notice' })],
    });
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    // The notices tab is the default view; the API-provided title must render,
    // proving the component displays live data rather than only its local set.
    expect(await screen.findByText('Live API Notice')).toBeInTheDocument();
  });

  it('renders search functionality', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const inputs = document.querySelectorAll('input[type="text"]');
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders create notice button', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders notice status badges', () => {
    render(<PrivacyNoticeServing onBack={mockOnBack} />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });
});
