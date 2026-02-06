import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// --- Mocks ---

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', avatar: 'TU', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('../../services/api', () => ({
  api: {
    risks: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('../../constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
}));

vi.mock('../ComplianceChat', () => ({
  ComplianceChat: () => <div data-testid="compliance-chat">Chat</div>,
}));

vi.mock('../Onboarding', () => ({
  OnboardingOverlay: () => <div data-testid="onboarding-overlay" />,
  OnboardingChecklistWidget: () => <div data-testid="onboarding-checklist" />,
}));

import { Layout } from '../Layout';

describe('Layout Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ===== RENDERING =====
  describe('Rendering', () => {
    it('renders the layout with children', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test Content</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders the sidebar with ComplyEasy branding', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('ComplyEasy')).toBeInTheDocument();
    });

    it('renders user name in the header', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders user role in the header', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('renders user avatar initials', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('renders current view title in header', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('dashboard')).toBeInTheDocument();
    });

    it('renders Encrypted Zero Trust badge', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText(/Encrypted/)).toBeInTheDocument();
    });

    it('renders Sign Out button', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('renders onboarding components', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-checklist')).toBeInTheDocument();
    });

    it('renders compliance chat', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByTestId('compliance-chat')).toBeInTheDocument();
    });
  });

  // ===== NAVIGATION =====
  describe('Navigation', () => {
    it('renders Platform section label', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Platform')).toBeInTheDocument();
    });

    it('renders AI Tools section label', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('AI Tools')).toBeInTheDocument();
    });

    it('renders Admin section label for admin users', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('renders Dashboard nav item', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders Frameworks nav item', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Frameworks')).toBeInTheDocument();
    });

    it('renders Risk Management nav item', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });

    it('renders AI Tool items', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(screen.getByText('Policy Generator')).toBeInTheDocument();
      expect(screen.getByText('Contract Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Gap Analysis')).toBeInTheDocument();
    });

    it('calls onNavigate when Dashboard is clicked', async () => {
      render(
        <Layout currentView="settings" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      fireEvent.click(screen.getByText('Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('dashboard');
    });

    it('calls onNavigate when Frameworks is clicked', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      fireEvent.click(screen.getByText('Frameworks'));
      expect(mockNavigate).toHaveBeenCalledWith('frameworks');
    });

    it('calls onNavigate when Settings is clicked', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      fireEvent.click(screen.getByText('Settings'));
      expect(mockNavigate).toHaveBeenCalledWith('settings');
    });

    it('calls onNavigate when an AI tool is clicked', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      fireEvent.click(screen.getByText('Policy Generator'));
      expect(mockNavigate).toHaveBeenCalledWith('ai-policy');
    });

    it('highlights active nav item', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      const dashboardBtn = screen.getByText('Dashboard').closest('button');
      expect(dashboardBtn?.className).toContain('bg-brand-600');
    });
  });

  // ===== SIDEBAR TOGGLE =====
  describe('Sidebar Toggle', () => {
    it('renders mobile menu button', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      // Menu icon is rendered for mobile
      const menuIcons = screen.getAllByTestId('icon-Menu');
      expect(menuIcons.length).toBeGreaterThan(0);
    });
  });

  // ===== LOGOUT =====
  describe('Logout', () => {
    it('calls logout when Sign Out is clicked', async () => {
      const { useAuth } = await import('../../contexts/AuthContext');
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      fireEvent.click(screen.getByText('Sign Out'));
      const authResult = (useAuth as any)();
      expect(authResult.logout).toHaveBeenCalled();
    });
  });

  // ===== NOTIFICATIONS =====
  describe('Notifications', () => {
    it('renders notification bell', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      const bellIcons = screen.getAllByTestId('icon-Bell');
      expect(bellIcons.length).toBeGreaterThan(0);
    });

    it('opens notification panel when bell is clicked', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });

      const bellButton = screen.getAllByTestId('icon-Bell')[0].closest('button')!;
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('shows no new notifications message when empty', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });

      const bellButton = screen.getAllByTestId('icon-Bell')[0].closest('button')!;
      fireEvent.click(bellButton);

      // Wait a bit longer for debounced notifications
      await act(async () => { vi.advanceTimersByTime(600); });

      await waitFor(() => {
        // Either shows "No new notifications" or shows actual system notification
        const noNotifs = screen.queryByText('No new notifications.');
        const auditNotif = screen.queryByText('Audit Preparedness');
        expect(noNotifs || auditNotif).toBeTruthy();
      });
    });

    it('shows Mark all as read button', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });

      const bellButton = screen.getAllByTestId('icon-Bell')[0].closest('button')!;
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
      });
    });

    it('closes notification panel when bell is clicked again', async () => {
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });

      const bellButton = screen.getAllByTestId('icon-Bell')[0].closest('button')!;
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });

    it('shows notification badge when there are notifications', async () => {
      const apiModule = await import('../../services/api');
      (apiModule.api.risks.list as any).mockResolvedValueOnce([
        { id: 'r1', description: 'Risk alert', detectedAt: '2026-01-01', assignedTo: 'Test User' },
      ]);
      render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });

      // Wait for debounced notification loading
      await act(async () => { vi.advanceTimersByTime(600); });

      const bellContainer = screen.getAllByTestId('icon-Bell')[0].closest('button')!;
      // Check if there's a notification badge (red dot)
      const badge = bellContainer.querySelector('.bg-red-500');
      expect(badge).toBeTruthy();
    });
  });

  // ===== NULL USER =====
  describe('Null User', () => {
    it('returns null when user is not authenticated', async () => {
      const { useAuth } = await import('../../contexts/AuthContext');
      (useAuth as any).mockReturnValueOnce({ user: null, isAuthenticated: false, logout: vi.fn() });

      const { container } = render(
        <Layout currentView="dashboard" onNavigate={mockNavigate}>
          <div>Test Content</div>
        </Layout>
      );
      expect(container.firstChild).toBeNull();
    });
  });

  // ===== VIEW TITLE FORMATTING =====
  describe('View Title Formatting', () => {
    it('formats ai- prefixed views correctly', async () => {
      render(
        <Layout currentView="ai-policy" onNavigate={mockNavigate}>
          <div>Test</div>
        </Layout>
      );
      await act(async () => { vi.advanceTimersByTime(600); });
      // "ai-policy" becomes "AI policy"
      expect(screen.getByText('AI policy')).toBeInTheDocument();
    });
  });
});
