import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';


vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null, Legend: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null, Cell: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null, LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null, RadialBarChart: ({ children }: any) => <div>{children}</div>,
  RadialBar: () => null, RadarChart: ({ children }: any) => <div>{children}</div>,
  Radar: () => null, PolarGrid: () => null, PolarAngleAxis: () => null, PolarRadiusAxis: () => null,
}));

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    risks: { getAll: vi.fn().mockResolvedValue([]) },
    frameworks: { getAll: vi.fn().mockResolvedValue([]) },
    ai: { generatePolicy: vi.fn().mockResolvedValue({}), analyzeContract: vi.fn().mockResolvedValue({}), analyzeGap: vi.fn().mockResolvedValue({}), generateRFP: vi.fn().mockResolvedValue({}), simulatePhishing: vi.fn().mockResolvedValue({}), scoreVendor: vi.fn().mockResolvedValue({}), mapData: vi.fn().mockResolvedValue({}), generateBCP: vi.fn().mockResolvedValue({}) },
    billing: { getSubscription: vi.fn().mockResolvedValue({ status: 'active', plan: 'Growth' }), getUsage: vi.fn().mockResolvedValue({}) },
    team: { getMembers: vi.fn().mockResolvedValue([]) },
    organization: { get: vi.fn().mockResolvedValue({ name: 'Test Org' }) },
    enterprise: { getQuestionnaires: vi.fn().mockResolvedValue([]), getPolicies: vi.fn().mockResolvedValue([]), getMonitors: vi.fn().mockResolvedValue([]), getIssues: vi.fn().mockResolvedValue([]), getReports: vi.fn().mockResolvedValue([]) },
    audit: { list: vi.fn().mockResolvedValue({ logs: [], total: 0 }) },
    integrations: { getAll: vi.fn().mockResolvedValue([]) },
    vendors: { getAll: vi.fn().mockResolvedValue([]) },
    acos: { getGoals: vi.fn().mockResolvedValue([]), getControlLoops: vi.fn().mockResolvedValue([]) },
    security: { getZeroTrust: vi.fn().mockResolvedValue({}), getHomomorphicKeys: vi.fn().mockResolvedValue(null) },
    aiRmf: { getSystems: vi.fn().mockResolvedValue([]), getSystem: vi.fn().mockResolvedValue(null), createSystem: vi.fn().mockResolvedValue({ id: '1' }), getAssessments: vi.fn().mockResolvedValue([]), getDashboard: vi.fn().mockResolvedValue({ totalSystems: 0, byStatus: {}, byLifecycleStage: {}, byRiskLevel: {}, averageTrustworthinessScore: 0 }), deleteSystem: vi.fn().mockResolvedValue({}) },
    euRegulations: { getAISystems: vi.fn().mockResolvedValue([]), getDMAGatekeepers: vi.fn().mockResolvedValue([]), getDSAPlatforms: vi.fn().mockResolvedValue([]) },
    onboarding: { getProgress: vi.fn().mockResolvedValue(null) },
    demo: { submit: vi.fn().mockResolvedValue({}) },
    webhooks: { getAll: vi.fn().mockResolvedValue([]) },
    twoFactor: { getStatus: vi.fn().mockResolvedValue({ enabled: false }) },
    auth: { requestMagicLink: vi.fn().mockResolvedValue({}), register: vi.fn().mockResolvedValue({}) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
  VIEW_TO_FEATURE: {},
}));

vi.mock('@/constants/tierLimits', () => ({
  getLimit: vi.fn().mockReturnValue(100),
  isAtLimit: vi.fn().mockReturnValue(false),
  getUpgradeMessage: vi.fn().mockReturnValue(''),
  LIMIT_LABELS: {},
  UPGRADE_LINK: '/settings?tab=billing',
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn().mockReturnValue({ isOnboarding: false }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false, currentStep: 0, canShow: false, start: vi.fn(), next: vi.fn(), prev: vi.fn(), skip: vi.fn(), complete: vi.fn() }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false, position: null, dismiss: vi.fn(), disableAllHints: vi.fn() }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, isLoaded: true, showCelebration: false }),
}));

import { DocsPage } from '@/components/DocsPage';

// The Docs sidebar nav, scoped so category/article queries never collide with the
// marketing chrome (which also has "Platform", "Documentation", etc.).
const getDocsNav = () => screen.getByRole('navigation', { name: 'Docs' });

describe('DocsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default route (no slug) resolves to the Quickstart article.
    vi.mocked(useParams).mockReturnValue({});
  });

  it('renders the default Quickstart article', () => {
    render(<DocsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Quickstart' })).toBeInTheDocument();
    // The article's category eyebrow is shown above the title.
    expect(screen.getAllByText('Get started').length).toBeGreaterThan(0);
  });

  it('lists the Get started category and its articles in the sidebar nav', () => {
    render(<DocsPage />);
    const nav = getDocsNav();
    expect(within(nav).getByText('Get started')).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Quickstart' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Core concepts' })).toBeInTheDocument();
  });

  it('shows the Core concepts article link in the sidebar nav', () => {
    render(<DocsPage />);
    expect(within(getDocsNav()).getByRole('button', { name: 'Core concepts' })).toBeInTheDocument();
  });

  it('groups the Automation category with its articles in the sidebar nav', () => {
    render(<DocsPage />);
    const nav = getDocsNav();
    expect(within(nav).getByText('Automation')).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Continuous monitoring' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'aCOS & the Digital Twin' })).toBeInTheDocument();
  });

  it('renders an "On this page" table of contents for the active article', () => {
    render(<DocsPage />);
    const toc = screen.getByRole('navigation', { name: 'On this page' });
    // Quickstart's section headings become TOC anchors.
    expect(within(toc).getByRole('link', { name: 'Create your workspace' })).toBeInTheDocument();
    expect(within(toc).getByRole('link', { name: 'Add a framework' })).toBeInTheDocument();
  });

  it('navigates to an article route when a sidebar nav item is clicked', () => {
    render(<DocsPage />);
    const navigate = useNavigate();
    fireEvent.click(within(getDocsNav()).getByRole('button', { name: 'Core concepts' }));
    expect(navigate).toHaveBeenCalledWith('/docs/concepts');
  });

  it('deep-links directly to an article via the /docs/:slug route', () => {
    // The route mounts at /docs/* and passes the slug on the splat param.
    vi.mocked(useParams).mockReturnValue({ '*': 'api' });
    render(<DocsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'API & webhooks' })).toBeInTheDocument();
  });
});
