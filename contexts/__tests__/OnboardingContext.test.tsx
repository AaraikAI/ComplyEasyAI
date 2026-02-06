import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OnboardingProvider, useOnboardingContext } from '../OnboardingContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    onboarding: {
      getProgress: vi.fn().mockResolvedValue({
        completedFlows: [],
        skippedFlows: [],
        currentFlow: null,
        currentStep: 0,
        milestones: {},
        preferences: { showHints: true, reducedMotion: false },
      }),
      updateProgress: vi.fn().mockResolvedValue({}),
      trackEvent: vi.fn().mockResolvedValue({}),
      completeMilestone: vi.fn().mockResolvedValue({}),
      updatePreferences: vi.fn().mockResolvedValue({}),
      skipFlow: vi.fn().mockResolvedValue({}),
      resetProgress: vi.fn().mockResolvedValue({}),
      getChecklist: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/constants/onboardingFlows', () => ({
  getFlowConfig: vi.fn().mockReturnValue({
    name: 'welcome',
    title: 'Welcome',
    steps: [
      { title: 'Step 1', description: 'First step', position: 'center' },
      { title: 'Step 2', description: 'Second step', position: 'center' },
    ],
    showCelebration: true,
    celebrationMessage: 'Great!',
  }),
  getFlowsForTier: vi.fn().mockReturnValue(['welcome', 'tier_tour']),
}));

const TestConsumer = () => {
  const ctx = useOnboardingContext();
  return (
    <div>
      <span data-testid="is-loaded">{String(ctx.isLoaded)}</span>
      <span data-testid="is-onboarding">{String(ctx.isOnboarding)}</span>
      <span data-testid="org-plan">{ctx.organizationPlan}</span>
      <span data-testid="show-celebration">{String(ctx.showCelebration)}</span>
      <button onClick={() => ctx.startFlow('welcome' as any)}>Start</button>
      <button onClick={() => ctx.nextStep()}>Next</button>
      <button onClick={() => ctx.prevStep()}>Prev</button>
      <button onClick={() => ctx.skipFlow()}>Skip</button>
      <button onClick={() => ctx.triggerCelebration('Test!')}>Celebrate</button>
      <button onClick={() => ctx.dismissCelebration()}>Dismiss</button>
    </div>
  );
};

describe('OnboardingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render provider with children', async () => {
    await act(async () => {
      render(
        <OnboardingProvider>
          <div data-testid="child">Hello</div>
        </OnboardingProvider>
      );
    });
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('should throw error when useOnboardingContext used outside provider', () => {
    const ErrorComponent = () => {
      try {
        useOnboardingContext();
        return <div>No error</div>;
      } catch (e: any) {
        return <div data-testid="error">{e.message}</div>;
      }
    };
    render(<ErrorComponent />);
    expect(screen.getByTestId('error')).toBeTruthy();
  });

  it('should provide initial state', async () => {
    await act(async () => {
      render(
        <OnboardingProvider>
          <TestConsumer />
        </OnboardingProvider>
      );
    });
    expect(screen.getByTestId('is-onboarding').textContent).toBe('false');
    expect(screen.getByTestId('org-plan')).toBeTruthy();
  });

  it('should handle celebration trigger and dismiss', async () => {
    await act(async () => {
      render(
        <OnboardingProvider>
          <TestConsumer />
        </OnboardingProvider>
      );
    });

    await act(async () => {
      screen.getByText('Celebrate').click();
    });
    expect(screen.getByTestId('show-celebration').textContent).toBe('true');

    await act(async () => {
      screen.getByText('Dismiss').click();
    });
    expect(screen.getByTestId('show-celebration').textContent).toBe('false');
  });

  it('should start a flow', async () => {
    await act(async () => {
      render(
        <OnboardingProvider>
          <TestConsumer />
        </OnboardingProvider>
      );
    });

    await act(async () => {
      screen.getByText('Start').click();
    });
    expect(screen.getByTestId('is-onboarding').textContent).toBe('true');
  });
});
