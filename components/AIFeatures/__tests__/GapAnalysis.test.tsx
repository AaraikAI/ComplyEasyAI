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
  Line: () => null,
}));

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    ai: { generatePolicy: vi.fn().mockResolvedValue({ policy: 'Generated policy content' }), analyzeContract: vi.fn().mockResolvedValue({ analysis: 'Contract analysis' }), analyzeGap: vi.fn().mockResolvedValue({ result: 'Gap result', gaps: [], prioritized: [] }), generateRFP: vi.fn().mockResolvedValue({ answers: [] }), simulatePhishing: vi.fn().mockResolvedValue({ scenario: 'Phishing sim', questions: [] }), scoreVendor: vi.fn().mockResolvedValue({ result: 'Vendor score' }), mapData: vi.fn().mockResolvedValue({ map: 'Data map' }), generateBCP: vi.fn().mockResolvedValue({ plan: 'BCP plan', contactTree: [] }), performGapAnalysis: vi.fn().mockResolvedValue({ analysis: 'Gap analysis result', gaps: [], prioritized: [] }) },
    frameworks: { getAll: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
    aiRmf: { getSystems: vi.fn().mockResolvedValue([]), getSystem: vi.fn().mockResolvedValue({ id: '1', name: 'Test AI System', status: 'active', systemType: 'ml', coreFunctions: {}, trustworthiness: {} }), createSystem: vi.fn().mockResolvedValue({ id: '1' }), getAssessments: vi.fn().mockResolvedValue([]), getDashboard: vi.fn().mockResolvedValue({ totalSystems: 5, byStatus: { active: 3, draft: 2 }, byLifecycleStage: {}, byRiskLevel: {}, averageTrustworthinessScore: 75 }), deleteSystem: vi.fn().mockResolvedValue({}) },
    security: { generateHomomorphicKeys: vi.fn().mockResolvedValue({ publicKey: 'pk', secretKey: 'sk', relinKeys: 'rk' }), homomorphicEncrypt: vi.fn().mockResolvedValue({ result: 'encrypted' }), homomorphicDecrypt: vi.fn().mockResolvedValue({ result: 'decrypted' }) },
    onboarding: { getProgress: vi.fn().mockResolvedValue(null) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, startFlow: vi.fn(), nextStep: vi.fn(), prevStep: vi.fn(), skipFlow: vi.fn(), completeFlow: vi.fn(), triggerCelebration: vi.fn(), dismissCelebration: vi.fn(), showCelebration: false, celebrationMessage: '' }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false, currentStep: 0, canShow: false, start: vi.fn(), next: vi.fn(), prev: vi.fn(), skip: vi.fn(), complete: vi.fn() }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false, position: null, dismiss: vi.fn(), disableAllHints: vi.fn() }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [{ key: 'profile', label: 'Complete profile', completed: true }, { key: 'framework', label: 'Add framework', completed: false }], completedCount: 1, totalCount: 2, percentage: 50, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false, message: '' }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, isLoaded: true, progress: null, organizationPlan: 'Growth', organizationName: 'Test Org', showCelebration: false, celebrationMessage: '', currentStep: 0, startFlow: vi.fn(), nextStep: vi.fn(), prevStep: vi.fn(), skipFlow: vi.fn(), completeFlow: vi.fn(), triggerCelebration: vi.fn(), dismissCelebration: vi.fn(), shouldShowFlow: vi.fn().mockReturnValue(false) }),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
}));

vi.mock('../../../constants', () => ({
  AVAILABLE_FRAMEWORKS: [
    { name: 'SOC 2' },
    { name: 'ISO 27001' },
    { name: 'GDPR' },
  ],
}));

import { GapAnalysis } from '../GapAnalysis';
import { api } from '@/services/api';

describe('GapAnalysis', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and framework selection areas', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    expect(screen.getByText('Compliance Gap Analysis')).toBeInTheDocument();
    expect(screen.getByText('Current Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Target Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Run Gap Analysis')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button')!;
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('run button is disabled when no frameworks are selected', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);
    await waitFor(() => {
      const runBtn = screen.getByText('Run Gap Analysis').closest('button')!;
      expect(runBtn).toBeDisabled();
    });
  });

  it('shows error when trying to run with same framework in both lists', async () => {
    render(<GapAnalysis onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getAllByText('SOC 2').length).toBeGreaterThan(0);
    });

    // Check SOC 2 in current frameworks (first checkbox with label SOC 2)
    const soc2Checkboxes = screen.getAllByRole('checkbox');
    // Current frameworks section checkboxes come first
    // SOC 2 appears in both "All Available Frameworks" sections
    // Click the first SOC 2 checkbox (current) and the second (target)
    const allLabels = screen.getAllByText('SOC 2');
    fireEvent.click(allLabels[0]); // current
    fireEvent.click(allLabels[1]); // target

    const runBtn = screen.getByText('Run Gap Analysis').closest('button')!;
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cannot select the same framework/)).toBeInTheDocument();
    });
  });
});
