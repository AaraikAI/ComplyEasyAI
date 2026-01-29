import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { OnboardingFlowName, OnboardingFlowConfig, OnboardingStepConfig } from '../types';
import { getFlowConfig } from '../constants/onboardingFlows';

/**
 * Primary hook to access onboarding context.
 * Provides all state and methods for onboarding management.
 */
export const useOnboarding = () => {
  return useOnboardingContext();
};

/**
 * Hook for managing a specific onboarding flow.
 * Returns flow-specific state and controls.
 */
export const useOnboardingFlow = (flowName: OnboardingFlowName) => {
  const {
    currentFlow,
    currentStep,
    isOnboarding,
    organizationPlan,
    startFlow,
    nextStep,
    prevStep,
    skipFlow,
    completeFlow,
    shouldShowFlow,
  } = useOnboardingContext();

  const isActive = isOnboarding && currentFlow?.id === flowName;
  const flowConfig = useMemo(
    () => getFlowConfig(flowName, organizationPlan),
    [flowName, organizationPlan]
  );
  const steps: OnboardingStepConfig[] = flowConfig?.steps || [];
  const step = isActive ? steps[currentStep] || null : null;
  const canShow = shouldShowFlow(flowName);

  return {
    isActive,
    currentStep: isActive ? currentStep : 0,
    step,
    steps,
    flowConfig,
    canShow,
    start: () => startFlow(flowName),
    next: nextStep,
    prev: prevStep,
    skip: skipFlow,
    complete: completeFlow,
  };
};

/**
 * Hook to auto-trigger an onboarding flow when a condition becomes true.
 * Prevents duplicate triggers using a ref guard.
 */
export const useOnboardingTrigger = (
  flowName: OnboardingFlowName,
  condition: boolean
) => {
  const { startFlow, shouldShowFlow, isOnboarding, isLoaded } = useOnboardingContext();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (
      isLoaded &&
      condition &&
      !hasTriggeredRef.current &&
      !isOnboarding &&
      shouldShowFlow(flowName)
    ) {
      hasTriggeredRef.current = true;
      // Delay slightly to let the page render first
      const timer = setTimeout(() => {
        startFlow(flowName);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, condition, isOnboarding, flowName, shouldShowFlow, startFlow]);
};

/**
 * Hook for showing contextual hints near UI elements.
 * Returns hint visibility state and dismiss handler.
 */
export const useOnboardingHint = (
  hintId: string,
  targetRef: React.RefObject<HTMLElement | null>
) => {
  const { progress, updatePreferences, trackEvent } = useOnboardingContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const hasShownRef = useRef(false);

  const showHints = progress?.showHints ?? true;
  const tooltipsShown = (progress?.tooltipsShown as string[]) || [];
  const alreadyShown = tooltipsShown.includes(hintId);

  useEffect(() => {
    if (!showHints || alreadyShown || hasShownRef.current) return;

    const timer = setTimeout(() => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        });
        setIsVisible(true);
        hasShownRef.current = true;
        trackEvent('tooltip_shown', undefined, undefined, { hintId });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [showHints, alreadyShown, hintId, targetRef, trackEvent]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    trackEvent('tooltip_dismissed', undefined, undefined, { hintId });
  }, [hintId, trackEvent]);

  const disableAllHints = useCallback(() => {
    setIsVisible(false);
    updatePreferences({ showHints: false });
  }, [updatePreferences]);

  return {
    isVisible,
    position,
    dismiss,
    disableAllHints,
  };
};

/**
 * Hook to access checklist state and methods.
 */
export const useOnboardingChecklist = () => {
  const {
    checklist,
    progress,
    organizationPlan,
    startFlow,
    isOnboarding,
  } = useOnboardingContext();

  const items = useMemo(() => {
    if (!checklist) return [];

    const baseItems = [
      { key: 'profileCompleted', label: 'Complete your profile', done: checklist.profileCompleted, flow: 'welcome' as OnboardingFlowName },
      { key: 'teamInvited', label: 'Invite team members', done: checklist.teamInvited, flow: 'invite_team' as OnboardingFlowName },
      { key: 'firstFrameworkAdded', label: 'Add your first framework', done: checklist.firstFrameworkAdded, flow: 'first_framework' as OnboardingFlowName },
      { key: 'firstEvidenceUploaded', label: 'Upload your first evidence', done: checklist.firstEvidenceUploaded, flow: 'first_evidence' as OnboardingFlowName },
      { key: 'firstControlPassed', label: 'Pass your first control', done: checklist.firstControlPassed, flow: 'first_control' as OnboardingFlowName },
      { key: 'aiFeatureUsed', label: 'Try an AI feature', done: checklist.aiFeatureUsed, flow: 'ai_feature_trial' as OnboardingFlowName },
      { key: 'firstReportGenerated', label: 'Generate a report', done: checklist.firstReportGenerated, flow: 'first_framework' as OnboardingFlowName },
    ];

    if (organizationPlan === 'Essentials' || organizationPlan === 'Growth' || organizationPlan === 'Visionary') {
      baseItems.push({
        key: 'integrationConnected',
        label: 'Connect an integration',
        done: checklist.integrationConnected,
        flow: 'integration_setup' as OnboardingFlowName,
      });
    }

    if (organizationPlan === 'Growth' || organizationPlan === 'Visionary') {
      baseItems.push(
        {
          key: 'acosConfigured',
          label: 'Configure aCOS',
          done: checklist.acosConfigured,
          flow: 'acos_digital_twin' as OnboardingFlowName,
        },
        {
          key: 'digitalTwinActivated',
          label: 'Activate Digital Twin',
          done: checklist.digitalTwinActivated,
          flow: 'acos_digital_twin' as OnboardingFlowName,
        }
      );
    }

    return baseItems;
  }, [checklist, organizationPlan]);

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  const startFlowForItem = useCallback(
    (itemKey: string) => {
      const item = items.find((i) => i.key === itemKey);
      if (item && !item.done && !isOnboarding) {
        startFlow(item.flow);
      }
    },
    [items, isOnboarding, startFlow]
  );

  return {
    items,
    completedCount,
    totalCount,
    percentage,
    isComplete,
    startFlowForItem,
  };
};

/**
 * Hook to trigger confetti celebration imperatively.
 */
export const useConfetti = () => {
  const { triggerCelebration, dismissCelebration, showCelebration, celebrationMessage } =
    useOnboardingContext();

  return {
    trigger: triggerCelebration,
    dismiss: dismissCelebration,
    isShowing: showCelebration,
    message: celebrationMessage,
  };
};
