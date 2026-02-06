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

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn().mockReturnValue({ isOnboarding: false }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, isLoaded: true, showCelebration: false }),
}));

import { OnboardingTooltip } from '@/components/Onboarding/OnboardingTooltip';

describe('OnboardingTooltip', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();
  const mockOnSkip = vi.fn();

  const mockTargetRect = {
    top: 100,
    left: 200,
    right: 400,
    bottom: 150,
    width: 200,
    height: 50,
    x: 200,
    y: 100,
    toJSON: () => ({}),
  } as DOMRect;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the tooltip with title and description', async () => {
    render(
      <OnboardingTooltip
        title="Welcome Step"
        description="This is a description"
        currentStep={0}
        totalSteps={3}
        position="bottom"
        targetRect={mockTargetRect}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSkip={mockOnSkip}
        isFirst={true}
        isLast={false}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Welcome Step')).toBeInTheDocument();
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });
  });

  it('shows progress dots for correct total steps', async () => {
    const { container } = render(
      <OnboardingTooltip
        title="Step Title"
        description="Step desc"
        currentStep={1}
        totalSteps={5}
        position="bottom"
        targetRect={mockTargetRect}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSkip={mockOnSkip}
        isFirst={false}
        isLast={false}
      />
    );
    await waitFor(() => {
      // Component renders progress dots (one per step)
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots.length).toBe(5);
    });
  });

  it('calls onNext when Next button is clicked', async () => {
    render(
      <OnboardingTooltip
        title="Step"
        description="Desc"
        currentStep={0}
        totalSteps={3}
        position="bottom"
        targetRect={mockTargetRect}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSkip={mockOnSkip}
        isFirst={true}
        isLast={false}
      />
    );
    await waitFor(() => {
      const nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  it('calls onSkip when close button is clicked', async () => {
    render(
      <OnboardingTooltip
        title="Step"
        description="Desc"
        currentStep={0}
        totalSteps={3}
        position="bottom"
        targetRect={mockTargetRect}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSkip={mockOnSkip}
        isFirst={true}
        isLast={false}
      />
    );
    await waitFor(() => {
      const skipButton = screen.getByLabelText('Skip tour');
      fireEvent.click(skipButton);
      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  it('shows Finish button on last step', async () => {
    render(
      <OnboardingTooltip
        title="Last Step"
        description="Final"
        currentStep={2}
        totalSteps={3}
        position="bottom"
        targetRect={mockTargetRect}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSkip={mockOnSkip}
        isFirst={false}
        isLast={true}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Finish')).toBeInTheDocument();
    });
  });
});
