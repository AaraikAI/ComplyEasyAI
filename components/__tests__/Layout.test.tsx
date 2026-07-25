import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

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

vi.mock('../NotificationCenter', () => ({
  default: () => <div data-testid="notification-center"><button data-testid="bell-button"><span data-testid="icon-Bell" /></button></div>,
}));

vi.mock('../GlobalSearch', () => ({
  default: ({ isOpen }: any) => isOpen ? <div data-testid="global-search" /> : null,
}));

vi.mock('../CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('../LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('../ThemeToggle', () => ({
  ThemeToggleCompact: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs" />,
}));

vi.mock('../SlimSidebar', () => ({
  SlimSidebar: ({ onSwitchToClassic }: any) => (
    <div data-testid="slim-sidebar">
      <button onClick={onSwitchToClassic}>Switch to Classic</button>
    </div>
  ),
}));

vi.mock('../../routes/routeConfig', () => ({
  pathToView: vi.fn((path: string) => path.replace('/', '') || 'dashboard'),
  viewToPath: vi.fn((view: string) => `/${view}`),
  getBreadcrumbs: vi.fn((path: string) => [{ label: 'Dashboard', path: '/dashboard' }]),
  ROUTES: {
    DASHBOARD: '/dashboard',
    RISKS: '/risks',
    ISSUES: '/issues',
    VENDORS: '/vendors',
    POLICIES: '/policies',
    FRAMEWORKS: '/frameworks',
    AI_RMF: '/ai-rmf',
    EU_AI_ACT: '/eu-ai-act',
    EU_CRA: '/eu-cra',
    CSRD: '/csrd',
    ECODESIGN: '/ecodesign',
    NIS2: '/nis2',
    DMA: '/dma',
    DSA: '/dsa',
    US_PRIVACY: '/us-privacy',
    DORA: '/dora',
    REGULATORY_CHANGES: '/regulatory-changes',
    GOVERNANCE: '/governance',
    SOX: '/sox',
    EVIDENCE_HUB: '/evidence-hub',
    PRODUCTS: '/products',
    POST_MARKET_SURVEILLANCE: '/post-market-surveillance',
    MONITORING: '/monitoring',
    REPORTS: '/reports',
    AUDIT_TRAIL: '/audit',
    EXECUTIVE_DASHBOARD: '/executive',
    PRIVACY: '/privacy',
    DPIA: '/dpia',
    ROPA: '/ropa',
    PRIVACY_NOTICES: '/privacy-notices',
    ACCOUNT_DELETION: '/account-deletion',
    WORKSPACES: '/workspaces',
    ENTERPRISE_OPS: '/enterprise-ops',
    QUESTIONNAIRES: '/questionnaires',
    ACOS: '/acos',
    CALENDAR: '/calendar',
    MATURITY: '/maturity',
    INTEGRATIONS: '/integrations',
    SETTINGS: '/settings',
    AI_DOCUMENT_TOOLS: '/ai-document-tools',
    AI_COMPLIANCE_TOOLS: '/ai-compliance-tools',
  },
}));

import { Layout } from '../Layout';

const renderLayout = (path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>
        <div>Test Content</div>
      </Layout>
    </MemoryRouter>
  );

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to 'classic' sidebar for most tests
    localStorage.setItem('complyeasy_sidebar_variant', 'classic');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ===== RENDERING =====
  describe('Rendering', () => {
    it('renders the layout with children', () => {
      renderLayout();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders the sidebar with ComplyEasy branding', () => {
      renderLayout();
      expect(screen.getByText('ComplyEasy')).toBeInTheDocument();
    });

    it('renders user name in the header', () => {
      renderLayout();
      // User name may appear in both sidebar footer and header
      expect(screen.getAllByText('Test User').length).toBeGreaterThanOrEqual(1);
    });

    it('renders user avatar initials', () => {
      renderLayout();
      // Avatar text appears in header
      expect(screen.getAllByText('TU').length).toBeGreaterThanOrEqual(1);
    });

    it('renders current view title in header', () => {
      renderLayout();
      // "Dashboard" appears in both sidebar nav and header title
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the plan chip in the sidebar', () => {
      renderLayout();
      // The old "Encrypted Zero Trust" trust badge was removed in the Signal
      // redesign; the sidebar header now surfaces the org plan chip instead.
      expect(screen.getByText('Growth')).toBeInTheDocument();
    });

    it('renders the Sign Out control', () => {
      renderLayout();
      // Sign-out is now an icon button labelled via aria-label / title.
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    });

    it('renders onboarding components', () => {
      renderLayout();
      expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-checklist')).toBeInTheDocument();
    });

    it('renders compliance chat', () => {
      renderLayout();
      expect(screen.getByTestId('compliance-chat')).toBeInTheDocument();
    });
  });

  // ===== NAVIGATION =====
  describe('Navigation', () => {
    it('renders Platform section label', () => {
      renderLayout();
      expect(screen.getByText('Platform')).toBeInTheDocument();
    });

    it('renders AI Tools section label', () => {
      renderLayout();
      expect(screen.getByText('AI Tools')).toBeInTheDocument();
    });

    it('renders Admin section label for admin users', () => {
      renderLayout();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('renders Dashboard nav item', () => {
      renderLayout();
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Frameworks nav item', () => {
      renderLayout();
      expect(screen.getByText('Frameworks')).toBeInTheDocument();
    });

    it('renders Risk Management nav item', () => {
      renderLayout();
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });

    it('renders AI Tool items', () => {
      renderLayout();
      expect(screen.getByText('AI Document Tools')).toBeInTheDocument();
      expect(screen.getByText('AI Compliance Tools')).toBeInTheDocument();
    });

    it('navigates when Dashboard link is clicked', () => {
      renderLayout('/settings');
      const dashboardLinks = screen.getAllByText('Dashboard');
      const dashboardLink = dashboardLinks[0].closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('navigates when Frameworks link is clicked', () => {
      renderLayout();
      const link = screen.getByText('Frameworks').closest('a');
      expect(link).toHaveAttribute('href', '/frameworks');
    });

    it('navigates when Settings link is clicked', () => {
      renderLayout();
      const link = screen.getByText('Settings').closest('a');
      expect(link).toHaveAttribute('href', '/settings');
    });

    it('highlights active nav item', async () => {
      // Override useLocation to simulate being on /dashboard
      const rrdom = await import('react-router');
      (rrdom.useLocation as any).mockReturnValue({ pathname: '/dashboard', search: '', hash: '', state: null });
      renderLayout('/dashboard');
      const dashboardLinks = screen.getAllByText('Dashboard');
      // Find the one that's a nav link (closest 'a' tag)
      const dashboardLink = dashboardLinks.map(el => el.closest('a')).find(a => a?.getAttribute('href') === '/dashboard');
      // Signal active state uses the green accent instead of the old brand fill.
      expect(dashboardLink?.className).toContain('bg-signal-green/10');
      // Restore
      (rrdom.useLocation as any).mockReturnValue({ pathname: '/', search: '', hash: '', state: null });
    });
  });

  // ===== SIDEBAR VARIANTS =====
  describe('Sidebar Variants', () => {
    it('renders classic sidebar by default when no localStorage', () => {
      localStorage.removeItem('complyeasy_sidebar_variant');
      renderLayout();
      // Default variant is now 'classic' (Signal redesign), not 'slim'.
      expect(screen.queryByTestId('slim-sidebar')).not.toBeInTheDocument();
      expect(screen.getByText('ComplyEasy')).toBeInTheDocument();
    });

    it('renders classic sidebar when localStorage says classic', () => {
      localStorage.setItem('complyeasy_sidebar_variant', 'classic');
      renderLayout();
      expect(screen.getByText('ComplyEasy')).toBeInTheDocument();
    });

    it('renders mobile menu button in classic mode', () => {
      renderLayout();
      // Menu icon is rendered for mobile in classic sidebar
      const menuIcons = screen.getAllByTestId('icon-Menu');
      expect(menuIcons.length).toBeGreaterThan(0);
    });
  });

  // ===== LOGOUT =====
  describe('Logout', () => {
    it('calls logout when Sign Out is clicked', async () => {
      const { useAuth } = await import('../../contexts/AuthContext');
      renderLayout();
      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
      const authResult = (useAuth as any)();
      expect(authResult.logout).toHaveBeenCalled();
    });
  });

  // ===== NULL USER =====
  describe('Null User', () => {
    it('returns null when user is not authenticated', async () => {
      const { useAuth } = await import('../../contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false, logout: vi.fn() });

      const { container } = render(
        <MemoryRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </MemoryRouter>
      );
      expect(container.firstChild).toBeNull();

      // Restore the default mock for other tests
      (useAuth as any).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', avatar: 'TU', organization: { plan: 'Growth', name: 'Test Org' } },
        isAuthenticated: true,
        logout: vi.fn(),
      });
    });
  });
});
