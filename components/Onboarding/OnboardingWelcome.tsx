import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, X, Eye } from 'lucide-react';
import { OnboardingTierBadge } from './OnboardingTierBadge';
import { OnboardingStepper } from './OnboardingProgress';
import { TierName } from '../../types';

export interface OnboardingWelcomeProps {
  userName: string;
  organizationName: string;
  tier: TierName;
  onStart: () => void;
  onSkip: () => void;
  showHints: boolean;
  onToggleHints: (show: boolean) => void;
  reducedMotion?: boolean;
  /** Titles of the flow's steps; when provided, a left step rail is rendered. */
  stepTitles?: string[];
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  userName,
  organizationName,
  tier,
  onStart,
  onSkip,
  showHints,
  onToggleHints,
  reducedMotion = false,
  stepTitles,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasStepper = Boolean(stepTitles && stepTitles.length > 0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-signal-canvas/95 backdrop-blur-md ${
        reducedMotion ? '' : 'transition-opacity duration-500'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ComplyEasy AI"
    >
      {/* Animated background circles (CSS-only) */}
      {!reducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[600px] h-[600px] rounded-full border border-signal-green/5 animate-pulse-slow" />
            <div className="absolute inset-4 rounded-full border border-signal-green/10 animate-pulse-slow-delay" />
            <div className="absolute inset-12 rounded-full border border-signal-green/10 animate-pulse-slow" />
            <div className="absolute inset-20 rounded-full border border-signal-green/15 animate-pulse-slow-delay" />
            <div className="absolute inset-28 rounded-full border border-signal-green/5 animate-pulse-slow" />
          </div>
        </div>
      )}

      {/* Content card */}
      <div
        className={`relative w-full ${hasStepper ? 'max-w-3xl' : 'max-w-lg'} ${
          reducedMotion ? '' : `transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`
        }`}
      >
        {/* Skip link */}
        <button
          onClick={onSkip}
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-sm text-signal-muted hover:text-signal-body transition-colors"
        >
          Skip onboarding
          <X className="w-4 h-4" />
        </button>

        <div className="bg-signal-panel2 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left step rail */}
            {hasStepper && (
              <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/[0.08] bg-signal-panel p-5">
                <OnboardingStepper steps={stepTitles as string[]} currentIndex={0} reducedMotion={reducedMotion} />
              </aside>
            )}

            <div className={`flex-1 p-8 ${hasStepper ? 'text-left' : 'text-center'}`}>
              {/* Logo mark */}
              <div className={`mb-6 flex ${hasStepper ? 'justify-start' : 'justify-center'}`}>
                <div className="w-14 h-14 bg-signal-green/10 rounded-2xl border border-signal-green/25 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-signal-green" />
                </div>
              </div>

              {/* Kicker */}
              <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-signal-green">
                Guided setup
              </p>

              {/* Greeting */}
              <h1 className="font-display text-3xl font-bold tracking-tight text-signal-ink mb-2">
                Welcome, {userName}!
              </h1>
              <p className="text-signal-sub text-base mb-5">
                {organizationName}
              </p>

              {/* Tier badge */}
              <div className={`flex ${hasStepper ? 'justify-start' : 'justify-center'} mb-6`}>
                <OnboardingTierBadge tier={tier} variant="large" />
              </div>

              {/* Description */}
              <p className={`text-signal-body text-sm leading-relaxed mb-8 max-w-md ${hasStepper ? '' : 'mx-auto'}`}>
                Let us take you on a quick tour of your compliance platform. We will show you the key features
                available on your {tier} plan and help you get set up for success.
              </p>

              {/* Hints toggle */}
              <div className={`flex items-center ${hasStepper ? 'justify-start' : 'justify-center'} gap-2 mb-8`}>
                <button
                  onClick={() => onToggleHints(!showHints)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${
                    showHints
                      ? 'border-signal-green/40 bg-signal-green/10 text-signal-green'
                      : 'border-white/[0.10] bg-white/[0.04] text-signal-sub'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {showHints ? 'Contextual hints enabled' : 'Contextual hints disabled'}
                </button>
              </div>

              {/* CTA button */}
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-semibold text-signal-canvas bg-signal-green rounded-xl transition-all shadow-[0_6px_24px_rgba(56,232,166,0.28)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-green/60"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
