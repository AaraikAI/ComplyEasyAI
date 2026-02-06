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
    ai: { generatePolicy: vi.fn().mockResolvedValue({ policy: 'Generated policy content' }), analyzeContract: vi.fn().mockResolvedValue({ analysis: 'Contract analysis' }), analyzeGap: vi.fn().mockResolvedValue({ result: 'Gap result', gaps: [], prioritized: [] }), generateRFP: vi.fn().mockResolvedValue({ answers: [] }), simulatePhishing: vi.fn().mockResolvedValue({ scenario: 'Phishing sim', questions: [] }), scoreVendor: vi.fn().mockResolvedValue({ result: 'Vendor score' }), mapData: vi.fn().mockResolvedValue({ map: 'Data map' }), generateBCP: vi.fn().mockResolvedValue({ plan: 'BCP plan', contactTree: [] }), generatePhishing: vi.fn().mockResolvedValue({ scenario: 'Fake phishing email content', questions: [{ question: 'What is suspicious?', answer: 'The sender', explanation: 'Domain mismatch' }] }) },
    frameworks: { getAll: vi.fn().mockResolvedValue([]) },
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

import { PhishingGenerator } from '../PhishingGenerator';
import { api } from '@/services/api';

describe('PhishingGenerator', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and form controls', () => {
    render(<PhishingGenerator onBack={mockOnBack} />);
    expect(screen.getByText('Phishing Simulator')).toBeInTheDocument();
    expect(screen.getByText('Type of Phishing')).toBeInTheDocument();
    expect(screen.getByText('Target Department')).toBeInTheDocument();
    expect(screen.getByText('Scenario Theme')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<PhishingGenerator onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button')!;
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('generates a phishing campaign and shows scenario', async () => {
    render(<PhishingGenerator onBack={mockOnBack} />);

    fireEvent.click(screen.getByText('Generate Campaign'));

    await waitFor(() => {
      expect(api.ai.generatePhishing).toHaveBeenCalledWith('Email', 'Urgent Invoice', 'Finance', 'Medium');
    });

    await waitFor(() => {
      expect(screen.getByText('Fake phishing email content')).toBeInTheDocument();
    });
  });

  it('shows training questions with show/hide answer toggle', async () => {
    render(<PhishingGenerator onBack={mockOnBack} />);
    fireEvent.click(screen.getByText('Generate Campaign'));

    await waitFor(() => {
      expect(screen.getByText('Training Questions')).toBeInTheDocument();
    });

    expect(screen.getByText(/What is suspicious/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Show Answer'));

    expect(screen.getByText('The sender')).toBeInTheDocument();
    expect(screen.getByText('Domain mismatch')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Answer'));
    expect(screen.queryByText('The sender')).not.toBeInTheDocument();
  });

  it('allows changing difficulty level', () => {
    render(<PhishingGenerator onBack={mockOnBack} />);
    const difficultySelect = screen.getByDisplayValue('Medium');
    fireEvent.change(difficultySelect, { target: { value: 'Hard' } });
    expect((difficultySelect as HTMLSelectElement).value).toBe('Hard');
  });
});
