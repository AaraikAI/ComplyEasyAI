import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { OnboardingProgress, OnboardingChecklist, OnboardingFlowName, OnboardingFlowConfig, TierName } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { getFlowConfig, getFlowsForTier } from '../constants/onboardingFlows';

interface OnboardingContextType {
  // State
  progress: OnboardingProgress | null;
  checklist: OnboardingChecklist | null;
  currentFlow: OnboardingFlowConfig | null;
  currentStep: number;
  isOnboarding: boolean;
  isLoaded: boolean;
  organizationPlan: TierName;
  organizationName: string;
  tierFlows: OnboardingFlowName[];

  // Flow control methods
  startFlow: (flowName: OnboardingFlowName) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipFlow: () => void;
  completeFlow: () => void;
  completeMilestone: (milestone: string) => Promise<void>;
  resetOnboarding: () => Promise<void>;

  // Preferences
  updatePreferences: (prefs: { showHints?: boolean; reducedMotion?: boolean }) => Promise<void>;

  // Analytics
  trackEvent: (eventType: string, flowName?: string, stepIndex?: number, metadata?: Record<string, any>) => void;

  // Helpers
  shouldShowFlow: (flowName: OnboardingFlowName) => boolean;
  getFlowsForTier: (tier: TierName) => OnboardingFlowName[];

  // Celebration
  showCelebration: boolean;
  celebrationMessage: string;
  triggerCelebration: (message: string) => void;
  dismissCelebration: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlowConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [organizationPlan, setOrganizationPlan] = useState<TierName>('Foundation');
  const [organizationName, setOrganizationName] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnboarding = currentFlow !== null;
  const tierFlows = getFlowsForTier(organizationPlan);

  // Fetch onboarding progress on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProgress(null);
      setChecklist(null);
      setIsLoaded(false);
      return;
    }

    let isMounted = true;

    const loadProgress = async () => {
      try {
        const [progressRes, checklistRes] = await Promise.all([
          api.onboarding.getProgress(),
          api.onboarding.getChecklist(),
        ]);

        if (!isMounted) return;

        setProgress(progressRes.progress);
        setOrganizationPlan(progressRes.organizationPlan as TierName);
        setOrganizationName(progressRes.organizationName);
        setChecklist(checklistRes.checklist);
        setIsLoaded(true);

        // Auto-start welcome flow for new users
        if (
          progressRes.progress &&
          !progressRes.progress.welcomeCompleted &&
          !progressRes.progress.completedAt &&
          !(progressRes.progress.skippedFlows as string[]).includes('welcome')
        ) {
          const welcomeConfig = getFlowConfig('welcome', progressRes.organizationPlan as TierName);
          if (welcomeConfig) {
            setCurrentFlow(welcomeConfig);
            setCurrentStep(0);
          }
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
        if (isMounted) {
          setIsLoaded(true); // Mark as loaded even on error so app isn't blocked
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Debounced save to backend
  const saveProgress = useCallback(
    (updates: Partial<OnboardingProgress>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await api.onboarding.updateProgress(updates);
        } catch (error) {
          console.error('Failed to save onboarding progress:', error);
        }
      }, 300);
    },
    []
  );

  const startFlow = useCallback(
    (flowName: OnboardingFlowName) => {
      if (!progress) return;

      const config = getFlowConfig(flowName, organizationPlan);
      if (!config) return;

      // Check if tier is sufficient
      if (config.requiredTier && !config.requiredTier.includes(organizationPlan)) {
        return;
      }

      setCurrentFlow(config);
      setCurrentStep(0);

      // Track event
      api.onboarding.trackEvent({
        eventType: 'flow_started',
        flowName,
        stepIndex: 0,
      }).catch(() => {});

      // Save to backend
      saveProgress({
        currentFlow: flowName,
        currentStep: 0,
        lastActiveFlow: flowName,
        lastActiveStep: 0,
      });
    },
    [progress, organizationPlan, saveProgress]
  );

  const nextStep = useCallback(() => {
    if (!currentFlow) return;

    const nextIdx = currentStep + 1;
    if (nextIdx >= currentFlow.steps.length) {
      // Flow is complete
      completeFlow();
      return;
    }

    setCurrentStep(nextIdx);

    api.onboarding.trackEvent({
      eventType: 'step_completed',
      flowName: currentFlow.id,
      stepIndex: currentStep,
    }).catch(() => {});

    saveProgress({
      currentStep: nextIdx,
      lastActiveStep: nextIdx,
    });
  }, [currentFlow, currentStep, saveProgress]);

  const prevStep = useCallback(() => {
    if (!currentFlow || currentStep <= 0) return;
    const prevIdx = currentStep - 1;
    setCurrentStep(prevIdx);
    saveProgress({ currentStep: prevIdx, lastActiveStep: prevIdx });
  }, [currentFlow, currentStep, saveProgress]);

  const skipFlow = useCallback(() => {
    if (!currentFlow) return;

    const flowName = currentFlow.id;
    setCurrentFlow(null);
    setCurrentStep(0);

    api.onboarding.skipFlow(flowName).then((res) => {
      setProgress(res.progress);
    }).catch(() => {});

    // Auto-advance: if welcome was skipped, start tier tour
    if (flowName === 'welcome' && progress && !progress.tierTourCompleted) {
      setTimeout(() => {
        const tourConfig = getFlowConfig('tier_tour', organizationPlan);
        if (tourConfig) {
          setCurrentFlow(tourConfig);
          setCurrentStep(0);
        }
      }, 500);
    }
  }, [currentFlow, progress, organizationPlan]);

  const completeFlow = useCallback(() => {
    if (!currentFlow) return;

    const flowName = currentFlow.id;
    const lastStep = currentFlow.steps[currentFlow.steps.length - 1];

    // Show celebration if the last step has confetti
    if (lastStep?.showConfetti) {
      triggerCelebration(`${currentFlow.name} completed!`);
    }

    setCurrentFlow(null);
    setCurrentStep(0);

    // Mark milestone and track completion
    api.onboarding.completeMilestone(flowName).then((res) => {
      setProgress(res.progress);
    }).catch(() => {});

    api.onboarding.trackEvent({
      eventType: 'flow_completed',
      flowName,
    }).catch(() => {});

    // Auto-advance logic
    if (flowName === 'welcome') {
      setTimeout(() => {
        startFlow('tier_tour');
      }, 1000);
    }
  }, [currentFlow, organizationPlan, startFlow]);

  const completeMilestone = useCallback(
    async (milestone: string) => {
      try {
        const res = await api.onboarding.completeMilestone(milestone);
        setProgress(res.progress);

        // Refresh checklist
        const checklistRes = await api.onboarding.getChecklist();
        setChecklist(checklistRes.checklist);
      } catch (error) {
        console.error('Failed to complete milestone:', error);
      }
    },
    []
  );

  const resetOnboarding = useCallback(async () => {
    try {
      const res = await api.onboarding.reset();
      setProgress(res.progress);
      setCurrentFlow(null);
      setCurrentStep(0);

      const checklistRes = await api.onboarding.getChecklist();
      setChecklist(checklistRes.checklist);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }, []);

  const updatePreferences = useCallback(
    async (prefs: { showHints?: boolean; reducedMotion?: boolean }) => {
      try {
        const res = await api.onboarding.updatePreferences(prefs);
        setProgress(res.progress);
      } catch (error) {
        console.error('Failed to update preferences:', error);
      }
    },
    []
  );

  const trackEvent = useCallback(
    (eventType: string, flowName?: string, stepIndex?: number, metadata?: Record<string, any>) => {
      api.onboarding.trackEvent({ eventType, flowName, stepIndex, metadata }).catch(() => {});
    },
    []
  );

  const shouldShowFlow = useCallback(
    (flowName: OnboardingFlowName): boolean => {
      if (!progress) return false;

      // Check if already completed or skipped
      const milestoneMap: Record<string, keyof OnboardingProgress> = {
        welcome: 'welcomeCompleted',
        tier_tour: 'tierTourCompleted',
        first_framework: 'firstFrameworkCompleted',
        first_evidence: 'firstEvidenceCompleted',
        first_control: 'firstControlPassCompleted',
        invite_team: 'inviteTeamCompleted',
        integration_setup: 'integrationSetupCompleted',
        ai_feature_trial: 'aiFeatureTrialCompleted',
        acos_digital_twin: 'acosDigitalTwinTourCompleted',
        advanced_features: 'advancedFeaturesTourCompleted',
      };

      const field = milestoneMap[flowName];
      if (field && progress[field]) return false;

      if ((progress.skippedFlows as string[]).includes(flowName)) return false;

      // Check tier requirements
      const config = getFlowConfig(flowName, organizationPlan);
      if (config?.requiredTier && !config.requiredTier.includes(organizationPlan)) {
        return false;
      }

      return true;
    },
    [progress, organizationPlan]
  );

  const triggerCelebration = useCallback((message: string) => {
    setCelebrationMessage(message);
    setShowCelebration(true);
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationMessage('');
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        progress,
        checklist,
        currentFlow,
        currentStep,
        isOnboarding,
        isLoaded,
        organizationPlan,
        organizationName,
        tierFlows,
        startFlow,
        nextStep,
        prevStep,
        skipFlow,
        completeFlow,
        completeMilestone,
        resetOnboarding,
        updatePreferences,
        trackEvent,
        shouldShowFlow,
        getFlowsForTier,
        showCelebration,
        celebrationMessage,
        triggerCelebration,
        dismissCelebration,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};
