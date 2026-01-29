import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, X, Eye } from 'lucide-react';
import { OnboardingTierBadge } from './OnboardingTierBadge';
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
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md ${
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
            <div className="w-[600px] h-[600px] rounded-full border border-brand-500/5 animate-pulse-slow" />
            <div className="absolute inset-4 rounded-full border border-brand-500/10 animate-pulse-slow-delay" />
            <div className="absolute inset-12 rounded-full border border-brand-500/10 animate-pulse-slow" />
            <div className="absolute inset-20 rounded-full border border-brand-500/15 animate-pulse-slow-delay" />
            <div className="absolute inset-28 rounded-full border border-brand-500/5 animate-pulse-slow" />
          </div>
        </div>
      )}

      {/* Content card */}
      <div
        className={`relative w-full max-w-lg ${
          reducedMotion ? '' : `transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`
        }`}
      >
        {/* Skip link */}
        <button
          onClick={onSkip}
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Skip onboarding
          <X className="w-4 h-4" />
        </button>

        <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden">
          {/* Brand header */}
          <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600" />

          <div className="p-8 text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex items-center justify-center">
                <ShieldCheck className="w-9 h-9 text-brand-400" />
              </div>
            </div>

            {/* Greeting */}
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome, {userName}!
            </h1>
            <p className="text-slate-400 text-base mb-5">
              {organizationName}
            </p>

            {/* Tier badge */}
            <div className="flex justify-center mb-6">
              <OnboardingTierBadge tier={tier} variant="large" />
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Let us take you on a quick tour of your compliance platform. We will show you the key features
              available on your {tier} plan and help you get set up for success.
            </p>

            {/* Hints toggle */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => onToggleHints(!showHints)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  showHints
                    ? 'border-brand-500/30 bg-brand-500/10 text-brand-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-400'
                }`}
              >
                <Eye className="w-4 h-4" />
                {showHints ? 'Contextual hints enabled' : 'Contextual hints disabled'}
              </button>
            </div>

            {/* CTA button */}
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
