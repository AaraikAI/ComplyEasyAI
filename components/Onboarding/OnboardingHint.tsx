import React from 'react';
import { Lightbulb, X, EyeOff } from 'lucide-react';

export interface OnboardingHintProps {
  message: string;
  position: { top: number; left: number } | null;
  isVisible: boolean;
  onDismiss: () => void;
  onDisableAll: () => void;
  reducedMotion?: boolean;
}

export const OnboardingHint: React.FC<OnboardingHintProps> = ({
  message,
  position,
  isVisible,
  onDismiss,
  onDisableAll,
  reducedMotion = false,
}) => {
  if (!isVisible || !position) return null;

  return (
    <div
      className={`fixed z-[45] ${
        reducedMotion ? '' : 'transition-all duration-300'
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      style={{
        top: position.top,
        left: Math.max(16, Math.min(position.left - 140, window.innerWidth - 296)),
      }}
      role="status"
      aria-live="polite"
    >
      {/* Pulsing dot indicator above */}
      <div className="flex justify-center mb-1">
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full bg-signal-green ${reducedMotion ? '' : 'animate-pulse'}`} />
          {!reducedMotion && (
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-signal-green animate-ping opacity-30" />
          )}
        </div>
      </div>

      {/* Hint card */}
      <div className="w-72 bg-signal-panel2/95 backdrop-blur border border-white/[0.10] rounded-xl shadow-xl p-3">
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 mt-0.5 p-1.5 bg-signal-green/10 rounded-lg">
            <Lightbulb className="w-4 h-4 text-signal-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-signal-body leading-relaxed">{message}</p>
            <div className="flex items-center gap-3 mt-2.5">
              <button
                onClick={onDismiss}
                className="text-xs font-semibold text-signal-green hover:opacity-80 transition-opacity"
              >
                Got it
              </button>
              <button
                onClick={onDisableAll}
                className="flex items-center gap-1 text-xs text-signal-muted hover:text-signal-sub transition-colors"
              >
                <EyeOff className="w-3 h-3" />
                Don&apos;t show hints
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-signal-muted hover:text-signal-sub transition-colors"
            aria-label="Dismiss hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
