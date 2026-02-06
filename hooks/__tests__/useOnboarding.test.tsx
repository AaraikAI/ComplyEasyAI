import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Unmock so we test the real hooks
vi.unmock('@/hooks/useOnboarding');

const mockContext = {
  progress: null,
  checklist: null,
  currentFlow: null,
  currentStep: 0,
  isOnboarding: false,
  isLoaded: true,
  organizationPlan: 'Growth' as any,
  organizationName: 'Test Org',
  tierFlows: ['welcome', 'tier_tour'] as any[],
  startFlow: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  skipFlow: vi.fn(),
  completeFlow: vi.fn(),
  completeMilestone: vi.fn(),
  resetOnboarding: vi.fn(),
  updatePreferences: vi.fn(),
  trackEvent: vi.fn(),
  shouldShowFlow: vi.fn().mockReturnValue(true),
  getFlowsForTier: vi.fn().mockReturnValue(['welcome']),
  showCelebration: false,
  celebrationMessage: '',
  triggerCelebration: vi.fn(),
  dismissCelebration: vi.fn(),
};

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboardingContext: vi.fn(() => mockContext),
}));

vi.mock('@/constants/onboardingFlows', () => ({
  getFlowConfig: vi.fn().mockReturnValue({
    name: 'welcome',
    title: 'Welcome',
    steps: [
      { title: 'Step 1', description: 'First', position: 'center' },
      { title: 'Step 2', description: 'Second', position: 'center' },
    ],
  }),
  getFlowsForTier: vi.fn().mockReturnValue(['welcome']),
}));

import { useOnboarding, useOnboardingFlow, useOnboardingChecklist, useConfetti } from '../useOnboarding';

import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { getFlowConfig } from '@/constants/onboardingFlows';

const mockedUseOnboardingContext = vi.mocked(useOnboardingContext);
const mockedGetFlowConfig = vi.mocked(getFlowConfig);

describe('useOnboarding hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish mock return values after clearAllMocks
    mockedUseOnboardingContext.mockReturnValue(mockContext as any);
    mockedGetFlowConfig.mockReturnValue({
      name: 'welcome',
      title: 'Welcome',
      steps: [
        { title: 'Step 1', description: 'First', position: 'center' },
        { title: 'Step 2', description: 'Second', position: 'center' },
      ],
    } as any);
  });

  describe('useOnboarding', () => {
    it('should return full onboarding context', () => {
      const { result } = renderHook(() => useOnboarding());
      expect(result.current).toBeDefined();
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isOnboarding).toBe(false);
      expect(result.current.organizationPlan).toBe('Growth');
    });

    it('should provide flow control methods', () => {
      const { result } = renderHook(() => useOnboarding());
      expect(typeof result.current.startFlow).toBe('function');
      expect(typeof result.current.nextStep).toBe('function');
      expect(typeof result.current.prevStep).toBe('function');
      expect(typeof result.current.skipFlow).toBe('function');
    });
  });

  describe('useOnboardingFlow', () => {
    it('should return flow-specific state', () => {
      const { result } = renderHook(() => useOnboardingFlow('welcome' as any));
      expect(result.current).toBeDefined();
      expect(typeof result.current.isActive).toBe('boolean');
      expect(typeof result.current.canShow).toBe('boolean');
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.next).toBe('function');
      expect(typeof result.current.prev).toBe('function');
      expect(typeof result.current.skip).toBe('function');
    });

    it('should report inactive when no current flow', () => {
      const { result } = renderHook(() => useOnboardingFlow('welcome' as any));
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('useOnboardingChecklist', () => {
    it('should return checklist data', () => {
      const { result } = renderHook(() => useOnboardingChecklist());
      expect(result.current).toBeDefined();
      expect(typeof result.current.completedCount).toBe('number');
      expect(typeof result.current.totalCount).toBe('number');
      expect(typeof result.current.percentage).toBe('number');
      expect(typeof result.current.isComplete).toBe('boolean');
    });
  });

  describe('useConfetti', () => {
    it('should return confetti controls', () => {
      const { result } = renderHook(() => useConfetti());
      expect(result.current).toBeDefined();
      expect(typeof result.current.trigger).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
      expect(typeof result.current.isShowing).toBe('boolean');
    });

    it('should not show confetti initially', () => {
      const { result } = renderHook(() => useConfetti());
      expect(result.current.isShowing).toBe(false);
    });
  });
});
