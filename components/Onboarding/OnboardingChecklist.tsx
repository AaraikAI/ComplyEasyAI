import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ListChecks, Sparkles } from 'lucide-react';
import { useOnboardingChecklist } from '../../hooks/useOnboarding';
import { useOnboardingContext } from '../../contexts/OnboardingContext';

export interface OnboardingChecklistWidgetProps {
  reducedMotion?: boolean;
}

export const OnboardingChecklistWidget: React.FC<OnboardingChecklistWidgetProps> = ({
  reducedMotion = false,
}) => {
  const { items, completedCount, totalCount, percentage, isComplete, startFlowForItem } =
    useOnboardingChecklist();
  const { isOnboarding, currentStep } = useOnboardingContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewItems, setHasNewItems] = useState(false);

  // Auto-close when user advances onboarding step (clicks Next)
  useEffect(() => {
    setIsExpanded(false);
  }, [currentStep]);

  // Pulse when new items become available
  useEffect(() => {
    if (completedCount > 0 && completedCount < totalCount) {
      setHasNewItems(true);
      const timer = setTimeout(() => setHasNewItems(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, totalCount]);

  // Don't render if all items complete
  if (isComplete || totalCount === 0) return null;

  // Circular progress ring
  const ringSize = 36;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`fixed bottom-6 z-[9998] ${isOnboarding ? 'left-6' : 'right-[8.5rem]'}`}
      role="complementary"
      aria-label="Setup checklist"
    >
      {/* Expanded checklist */}
      {isExpanded && (
        <div
          className={`mb-3 w-80 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl overflow-hidden ${
            reducedMotion ? '' : 'animate-onboarding-slide-up'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ListChecks className="w-5 h-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Setup Checklist</h3>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {completedCount}/{totalCount}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 ${
                  reducedMotion ? '' : 'transition-all duration-500 ease-out'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="p-2 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (!item.done) {
                    startFlowForItem(item.key);
                  }
                }}
                disabled={item.done}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  item.done
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-slate-700/50 cursor-pointer'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    item.done ? 'text-slate-500 line-through' : 'text-slate-200'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Click any item to start a guided walkthrough</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed widget button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative flex items-center gap-3 px-4 py-3 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl hover:border-brand-500/30 transition-all ${
          reducedMotion ? '' : hasNewItems ? 'animate-pulse' : ''
        }`}
        aria-expanded={isExpanded}
        aria-label={`Setup checklist: ${completedCount} of ${totalCount} complete`}
      >
        {/* Progress ring */}
        <svg width={ringSize} height={ringSize} className="flex-shrink-0 -rotate-90">
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-700"
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`text-brand-500 ${reducedMotion ? '' : 'transition-all duration-700 ease-out'}`}
          />
        </svg>
        <span className="absolute top-1/2 -translate-y-1/2" style={{ left: '16px', width: `${ringSize}px`, textAlign: 'center' }}>
          <span className="text-xs font-bold text-white">{percentage}%</span>
        </span>

        <div className="text-left">
          <p className="text-sm font-semibold text-white">Setup Progress</p>
          <p className="text-xs text-slate-400">
            {completedCount} of {totalCount} tasks
          </p>
        </div>

        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
        )}

        {/* Incomplete badge */}
        {!isExpanded && totalCount - completedCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-brand-600 rounded-full">
            {totalCount - completedCount}
          </span>
        )}
      </button>
    </div>
  );
};
