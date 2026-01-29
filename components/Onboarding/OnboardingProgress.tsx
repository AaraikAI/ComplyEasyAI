import React from 'react';

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
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-xs font-medium text-slate-400">{flowName}</span>
        <span className="text-xs font-medium text-slate-400">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 ${
            reducedMotion ? '' : 'transition-all duration-500 ease-out'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
