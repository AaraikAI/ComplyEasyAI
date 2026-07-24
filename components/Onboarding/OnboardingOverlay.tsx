import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingModal } from './OnboardingModal';
import { OnboardingProgressBar } from './OnboardingProgress';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingCelebration } from './OnboardingCelebration';
import { OnboardingTierBadge } from './OnboardingTierBadge';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, ShieldCheck, Target, Upload, CheckCircle, Users, Link2, Brain, Zap, Award } from 'lucide-react';

const flowIcons: Record<string, React.ReactNode> = {
  welcome: <ShieldCheck className="w-8 h-8" />,
  tier_tour: <Sparkles className="w-8 h-8" />,
  first_framework: <Target className="w-8 h-8" />,
  first_evidence: <Upload className="w-8 h-8" />,
  first_control: <CheckCircle className="w-8 h-8" />,
  invite_team: <Users className="w-8 h-8" />,
  integration_setup: <Link2 className="w-8 h-8" />,
  ai_feature_trial: <Brain className="w-8 h-8" />,
  advanced_features: <Zap className="w-8 h-8" />,
  acos_digital_twin: <Award className="w-8 h-8" />,
};

export const OnboardingOverlay: React.FC = () => {
  const { user } = useAuth();
  const {
    currentFlow,
    currentStep,
    isOnboarding,
    progress,
    organizationPlan,
    organizationName,
    nextStep,
    prevStep,
    skipFlow,
    completeFlow,
    updatePreferences,
    showCelebration,
    celebrationMessage,
    dismissCelebration,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});

  const step = currentFlow?.steps[currentStep] || null;
  const hasTargetSelector = Boolean(step?.targetSelector);
  const targetNotFound = hasTargetSelector && !targetRect;
  // Show centered modal when step has no target, or when target element is not in DOM (e.g. user not yet on framework details)
  const isCenteredStep = !hasTargetSelector || targetNotFound;
  const isWelcomeStep = currentFlow?.id === 'welcome' && currentStep === 0;
  const reducedMotion = progress?.reducedMotion ?? false;

  // Find the target element, compute spotlight, and scroll target into view
  const updateTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      setSpotlightStyle({});
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      const padding = 8;
      setSpotlightStyle({
        position: 'fixed' as const,
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        pointerEvents: 'none' as const,
        zIndex: 10000,
        transition: reducedMotion ? 'none' : 'all 0.4s ease-out',
      });
    } else {
      setTargetRect(null);
      setSpotlightStyle({});
    }
  }, [step, reducedMotion]);

  useEffect(() => {
    if (!isOnboarding) return;
    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [isOnboarding, updateTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOnboarding) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipFlow();
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOnboarding, nextStep, prevStep, skipFlow]);

  // Show welcome screen for the very first step
  if (isWelcomeStep && user) {
    return (
      <OnboardingWelcome
        userName={user.name || 'there'}
        organizationName={organizationName || 'Your Organization'}
        tier={organizationPlan}
        onStart={nextStep}
        onSkip={skipFlow}
        showHints={progress?.showHints ?? true}
        onToggleHints={(show) => updatePreferences({ showHints: show })}
        reducedMotion={reducedMotion}
        stepTitles={currentFlow?.steps.map((s) => s.title)}
      />
    );
  }

  // Celebration overlay
  if (showCelebration) {
    return (
      <OnboardingCelebration
        message={celebrationMessage}
        onDismiss={dismissCelebration}
        reducedMotion={reducedMotion}
      />
    );
  }

  // Not onboarding, don't render
  if (!isOnboarding || !currentFlow || !step) return null;

  return (
    <>
      {/* Backdrop / spotlight — above header and sidebar */}
      {isCenteredStep ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={skipFlow} aria-hidden />
      ) : (
        <div style={spotlightStyle} aria-hidden />
      )}

      {/* Progress bar — compact, top-right, with solid background for readability */}
      <div className="fixed top-4 right-4 z-[10001] w-64 max-w-[calc(100vw-2rem)] bg-signal-panel2/95 backdrop-blur border border-white/[0.08] rounded-xl shadow-xl px-3 py-2">
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={currentFlow.steps.length}
          flowName={currentFlow.name}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Tooltip or Modal depending on whether step has a target */}
      {isCenteredStep ? (
        <OnboardingModal
          title={step.title}
          description={step.description}
          icon={flowIcons[currentFlow.id] || <Sparkles className="w-8 h-8" />}
          kicker={currentFlow.name}
          steps={currentFlow.id === 'welcome' ? currentFlow.steps.map((s) => s.title) : undefined}
          stepIndex={currentStep}
          primaryAction={{
            label: currentStep === currentFlow.steps.length - 1 ? 'Complete' : 'Next',
            onClick: nextStep,
          }}
          secondaryAction={
            currentStep > 0
              ? { label: 'Back', onClick: prevStep }
              : currentFlow.skippable
              ? { label: 'Skip Tour', onClick: skipFlow }
              : undefined
          }
          onClose={currentFlow.skippable ? skipFlow : undefined}
          showCloseButton={currentFlow.skippable}
          reducedMotion={reducedMotion}
        >
          {/* Show tier badge on tier-related steps */}
          {(currentFlow.id === 'tier_tour' || step.id === 'welcome-tier-benefits') && (
            <div className="flex justify-center mb-4">
              <OnboardingTierBadge tier={organizationPlan} variant="small" />
            </div>
          )}
        </OnboardingModal>
      ) : (
        <OnboardingTooltip
          title={step.title}
          description={step.description}
          currentStep={currentStep}
          totalSteps={currentFlow.steps.length}
          position={step.position || 'bottom'}
          targetRect={targetRect}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipFlow}
          isFirst={currentStep === 0}
          isLast={currentStep === currentFlow.steps.length - 1}
          reducedMotion={reducedMotion}
        />
      )}
    </>
  );
};
