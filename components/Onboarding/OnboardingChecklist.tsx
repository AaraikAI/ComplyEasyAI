import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ListChecks, Sparkles, X } from 'lucide-react';
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
  const [isDismissed, setIsDismissed] = useState(() => {
    try { return localStorage.getItem('onboarding-checklist-dismissed') === 'true'; } catch { return false; }
  });

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

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try { localStorage.setItem('onboarding-checklist-dismissed', 'true'); } catch {}
  };

  // Don't render if dismissed, all items complete, or no items
  if (isDismissed || isComplete || totalCount === 0) return null;

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
          className={`mb-3 w-80 bg-signal-panel2/95 backdrop-blur border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden ${
            reducedMotion ? '' : 'animate-onboarding-slide-up'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ListChecks className="w-5 h-5 text-signal-green" />
                <h3 className="font-display text-sm font-bold text-signal-ink">Setup Checklist</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal-muted">
                  {completedCount}/{totalCount}
                </span>
                <button
                  onClick={handleDismiss}
                  className="p-0.5 rounded hover:bg-white/[0.08] text-signal-muted hover:text-signal-ink transition-colors"
                  aria-label="Dismiss setup checklist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-signal-green ${
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
                    : 'hover:bg-white/[0.05] cursor-pointer'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="w-5 h-5 text-signal-good flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-signal-muted flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    item.done ? 'text-signal-muted line-through' : 'text-signal-body'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-signal-muted">
              <Sparkles className="w-3.5 h-3.5 text-signal-green" />
              <span>Click any item to start a guided walkthrough</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed widget */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); } }}
        className={`relative flex items-center gap-3 px-4 py-3 pr-16 bg-signal-panel2/95 backdrop-blur border border-white/[0.08] rounded-2xl shadow-2xl hover:border-signal-green/30 transition-all cursor-pointer ${
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
            className="text-white/[0.08]"
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
            className={`text-signal-green ${reducedMotion ? '' : 'transition-all duration-700 ease-out'}`}
          />
        </svg>
        <span className="absolute top-1/2 -translate-y-1/2" style={{ left: '16px', width: `${ringSize}px`, textAlign: 'center' }}>
          <span className="font-mono text-[10px] font-bold text-signal-ink">{percentage}%</span>
        </span>

        <div className="text-left">
          <p className="text-sm font-semibold text-signal-ink">Setup Progress</p>
          <p className="text-xs text-signal-sub">
            {completedCount} of {totalCount} tasks
          </p>
        </div>

        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-signal-sub" />
        ) : (
          <ChevronUp className="w-4 h-4 text-signal-sub" />
        )}

        {/* Incomplete badge */}
        {!isExpanded && totalCount - completedCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-signal-canvas bg-signal-green rounded-full">
            {totalCount - completedCount}
          </span>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/[0.08] text-signal-muted hover:text-signal-ink transition-colors z-10"
          aria-label="Dismiss setup progress"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
