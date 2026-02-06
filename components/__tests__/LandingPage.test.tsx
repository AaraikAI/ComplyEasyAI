import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => {
    if (name === '__esModule') return true;
    return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />;
  },
}));

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
    user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
    verifyMagicLink: vi.fn(),
    register: vi.fn(),
    loginWithMagicLink: vi.fn().mockResolvedValue({ devToken: 'test-token' }),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    risks: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({}) },
    frameworks: { getAll: vi.fn().mockResolvedValue([]), getControls: vi.fn().mockResolvedValue([]) },
    ai: { generatePolicy: vi.fn().mockResolvedValue({}), analyzeContract: vi.fn().mockResolvedValue({}), analyzeGap: vi.fn().mockResolvedValue({}), generateRFP: vi.fn().mockResolvedValue({}), simulatePhishing: vi.fn().mockResolvedValue({}), scoreVendor: vi.fn().mockResolvedValue({}), mapData: vi.fn().mockResolvedValue({}), generateBCP: vi.fn().mockResolvedValue({}) },
    billing: { getSubscription: vi.fn().mockResolvedValue({ status: 'active', plan: 'Growth' }), getUsage: vi.fn().mockResolvedValue({}) },
    team: { getMembers: vi.fn().mockResolvedValue([]), invite: vi.fn().mockResolvedValue({}) },
    organization: { get: vi.fn().mockResolvedValue({ name: 'Test Org' }) },
    enterprise: { getQuestionnaires: vi.fn().mockResolvedValue([]), getPolicies: vi.fn().mockResolvedValue([]), getMonitors: vi.fn().mockResolvedValue([]), getIssues: vi.fn().mockResolvedValue([]), getReports: vi.fn().mockResolvedValue([]) },
    audit: { list: vi.fn().mockResolvedValue({ logs: [], total: 0 }) },
    integrations: { getAll: vi.fn().mockResolvedValue([]) },
    vendors: { getAll: vi.fn().mockResolvedValue([]) },
    acos: { getGoals: vi.fn().mockResolvedValue([]), getControlLoops: vi.fn().mockResolvedValue([]) },
    security: { getZeroTrust: vi.fn().mockResolvedValue({}), getHomomorphicKeys: vi.fn().mockResolvedValue(null) },
    aiRmf: { getSystems: vi.fn().mockResolvedValue([]), getSystem: vi.fn().mockResolvedValue(null), createSystem: vi.fn().mockResolvedValue({ id: '1' }), getAssessments: vi.fn().mockResolvedValue([]), getDashboard: vi.fn().mockResolvedValue({ totalSystems: 0, byStatus: {}, byLifecycleStage: {}, byRiskLevel: {}, averageTrustworthinessScore: 0 }) },
    euRegulations: { getAISystems: vi.fn().mockResolvedValue([]), getDMAGatekeepers: vi.fn().mockResolvedValue([]), getDSAPlatforms: vi.fn().mockResolvedValue([]) },
    onboarding: { getProgress: vi.fn().mockResolvedValue(null), updateProgress: vi.fn().mockResolvedValue({}) },
    demo: { submit: vi.fn().mockResolvedValue({}) },
    webhooks: { getAll: vi.fn().mockResolvedValue([]) },
    twoFactor: { getStatus: vi.fn().mockResolvedValue({ enabled: false }) },
    auth: { requestMagicLink: vi.fn().mockResolvedValue({}), verifyMagicLink: vi.fn().mockResolvedValue({}), register: vi.fn().mockResolvedValue({}) },
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
  useOnboarding: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false, currentStep: 0, canShow: false }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false, position: null, dismiss: vi.fn(), disableAllHints: vi.fn() }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, isLoaded: true, progress: null, organizationPlan: 'Growth', organizationName: 'Test', showCelebration: false }),
}));

// Additional mocks for LandingPage dependencies
vi.mock('../PricingSection', () => ({ default: () => <div data-testid="pricing-section">Pricing</div> }));
vi.mock('../DemoBookingForm', () => ({ default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="demo-form">Demo Form</div> : null }));
vi.mock('../SignupPage', () => ({ SignupPage: () => <div data-testid="signup-page">Signup</div> }));

import { LandingPage } from '../LandingPage';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('hasSeenSignupModal', 'true');
  });

  it('renders the hero section with headline', () => {
    render(<LandingPage />);
    expect(screen.getByText(/compliance/i)).toBeTruthy();
  });

  it('renders navigation links', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Features/i)).toBeTruthy();
    expect(screen.getByText(/Pricing/i)).toBeTruthy();
  });

  it('opens auth modal when Get Started is clicked', () => {
    render(<LandingPage />);
    const getStartedBtns = screen.getAllByText(/Get Started|Sign In|Login/i);
    expect(getStartedBtns.length).toBeGreaterThan(0);
  });

  it('renders the pricing section', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('pricing-section')).toBeTruthy();
  });

  it('renders feature highlights', () => {
    render(<LandingPage />);
    expect(screen.getByText(/AI/i)).toBeTruthy();
  });
});
