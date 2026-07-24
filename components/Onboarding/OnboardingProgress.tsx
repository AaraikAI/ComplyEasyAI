import React from 'react';
import { Check } from 'lucide-react';

export interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  flowName: string;
  reducedMotion?: boolean;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  flowName,
  reducedMotion = false,
}) => {
  const percentage = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${flowName} progress`}>
      <div className="flex items-center justify-between gap-3 mb-1.5 px-1">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal-muted truncate">{flowName}</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal-muted whitespace-nowrap">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-signal-green ${
            reducedMotion ? '' : 'transition-all duration-500 ease-out'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export interface OnboardingStepperProps {
  steps: string[];
  currentIndex: number;
  reducedMotion?: boolean;
}

/**
 * Vertical step rail for wizard-style onboarding: numbered circles that turn
 * into green checkmarks when done, with a step counter and thin progress bar.
 */
export const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  steps,
  currentIndex,
  reducedMotion = false,
}) => {
  const total = steps.length;
  const percentage = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <ol className="space-y-1.5" aria-label="Onboarding steps">
        {steps.map((title, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={i}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                active ? 'bg-signal-green/10 border border-signal-green/20' : 'border border-transparent'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-medium ${
                  done
                    ? 'border-signal-green bg-signal-green text-signal-canvas'
                    : active
                    ? 'border-signal-green text-signal-green'
                    : 'border-white/20 text-signal-muted'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`truncate text-sm ${
                  active ? 'font-semibold text-signal-ink' : done ? 'text-signal-body2' : 'text-signal-muted'
                }`}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-auto pt-6">
        <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal-muted">
          Step {currentIndex + 1} of {total}
        </p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className={`h-full rounded-full bg-signal-green ${
              reducedMotion ? '' : 'transition-all duration-500 ease-out'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
