import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface OnboardingTooltipProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  reducedMotion?: boolean;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  position,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
  reducedMotion = false,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [arrowSide, setArrowSide] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const padding = 16;
    const arrowSize = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top: number;
    let left: number;
    let arrow: 'top' | 'bottom' | 'left' | 'right';

    // Calculate ideal position based on preference
    switch (position) {
      case 'bottom':
        top = targetRect.bottom + arrowSize + padding;
        left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
        arrow = 'top';
        break;
      case 'top':
        top = targetRect.top - tooltip.height - arrowSize - padding;
        left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
        arrow = 'bottom';
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltip.height / 2;
        left = targetRect.right + arrowSize + padding;
        arrow = 'left';
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltip.height / 2;
        left = targetRect.left - tooltip.width - arrowSize - padding;
        arrow = 'right';
        break;
      default:
        top = targetRect.bottom + arrowSize + padding;
        left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
        arrow = 'top';
    }

    // Clamp to viewport — keep tooltip below header (minTop ~72px) so it's never cut off
    const minTop = 72;
    if (left < padding) left = padding;
    if (left + tooltip.width > viewportW - padding) left = viewportW - tooltip.width - padding;
    if (top < minTop) {
      top = Math.min(targetRect.bottom + arrowSize + padding, viewportH - tooltip.height - padding);
      if (top < minTop) top = minTop;
      arrow = 'top';
    }
    if (top + tooltip.height > viewportH - padding) {
      top = Math.max(targetRect.top - tooltip.height - arrowSize - padding, minTop);
      arrow = 'bottom';
    }

    setCoords({ top, left });
    setArrowSide(arrow);
  }, [targetRect, position]);

  useEffect(() => {
    // Small delay for animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [calculatePosition]);

  // Reset visibility on step change for animation
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const arrowClasses: Record<string, string> = {
    top: 'left-1/2 -translate-x-1/2 -top-2 border-l-transparent border-r-transparent border-t-transparent border-b-signal-panel3',
    bottom: 'left-1/2 -translate-x-1/2 -bottom-2 border-l-transparent border-r-transparent border-b-transparent border-t-signal-panel3',
    left: 'top-1/2 -translate-y-1/2 -left-2 border-t-transparent border-b-transparent border-l-transparent border-r-signal-panel3',
    right: 'top-1/2 -translate-y-1/2 -right-2 border-t-transparent border-b-transparent border-r-transparent border-l-signal-panel3',
  };

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[10002] w-80 max-w-[calc(100vw-2rem)] ${
        reducedMotion
          ? 'opacity-100'
          : `transition-all duration-300 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`
      }`}
      style={{ top: coords.top, left: coords.left }}
      role="tooltip"
      aria-label={title}
    >
      <div className="bg-signal-panel2 border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden">
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-[8px] ${arrowClasses[arrowSide]}`}
        />

        {/* Header accent line */}
        <div className="h-1 bg-gradient-to-r from-signal-green to-signal-blue" />

        <div className="p-4">
          {/* Title and close */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-signal-ink pr-4">{title}</h3>
            <button
              onClick={onSkip}
              className="flex-shrink-0 p-1 text-signal-muted hover:text-signal-body transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-signal-body leading-relaxed mb-4">{description}</p>

          {/* Footer: progress dots + nav buttons */}
          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStep
                      ? 'bg-signal-green'
                      : i < currentStep
                      ? 'bg-signal-green/40'
                      : 'bg-white/15'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onPrev}
                  className="p-1.5 text-signal-sub hover:text-signal-ink hover:bg-white/[0.06] rounded-lg transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-signal-canvas bg-signal-green hover:opacity-90 rounded-lg transition-all"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
