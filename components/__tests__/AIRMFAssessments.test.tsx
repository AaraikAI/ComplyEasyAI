import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';


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
    aiRmf: { getSystems: vi.fn().mockResolvedValue([]), getAISystems: vi.fn().mockResolvedValue([]), getSystem: vi.fn().mockResolvedValue(null), createSystem: vi.fn().mockResolvedValue({ id: '1' }), getAssessments: vi.fn().mockResolvedValue([]), getDashboard: vi.fn().mockResolvedValue({ totalSystems: 0, byStatus: {}, byLifecycleStage: {}, byRiskLevel: {}, averageTrustworthinessScore: 0 }), deleteSystem: vi.fn().mockResolvedValue({}) },
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

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }),
}));

import { AIRMFAssessments } from '@/components/AIRMFAssessments';

describe('AIRMFAssessments', () => {
  const mockOnBack = vi.fn();
  const mockOnViewSystem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<AIRMFAssessments onBack={mockOnBack} onViewSystem={mockOnViewSystem} />);
    await waitFor(() => {
      expect(screen.getByText(/AI RMF Assessments/i)).toBeInTheDocument();
    });
  });

  it('shows New Assessment button', async () => {
    render(<AIRMFAssessments onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('New Assessment')).toBeInTheDocument();
    });
  });

  it('displays search input for filtering', async () => {
    render(<AIRMFAssessments onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/common\.search/i)).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    render(<AIRMFAssessments onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText(/AI RMF Assessments/i)).toBeInTheDocument();
    });
    const backButton = screen.getByTestId('icon-ArrowLeft').closest('button');
    if (backButton) fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('fetches systems on mount', async () => {
    const { api } = await import('@/services/api');
    render(<AIRMFAssessments onBack={mockOnBack} />);
    await waitFor(() => {
      expect(api.aiRmf.getAISystems).toHaveBeenCalled();
    });
  });
});
