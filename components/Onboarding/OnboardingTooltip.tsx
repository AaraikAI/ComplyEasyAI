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

    let top = 0;
    let left = 0;
    let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

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

    // Clamp to viewport
    if (left < padding) left = padding;
    if (left + tooltip.width > viewportW - padding) left = viewportW - tooltip.width - padding;
    if (top < padding) {
      top = targetRect.bottom + arrowSize + padding;
      arrow = 'top';
    }
    if (top + tooltip.height > viewportH - padding) {
      top = targetRect.top - tooltip.height - arrowSize - padding;
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
    top: 'left-1/2 -translate-x-1/2 -top-2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-600',
    bottom: 'left-1/2 -translate-x-1/2 -bottom-2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-600',
    left: 'top-1/2 -translate-y-1/2 -left-2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-600',
    right: 'top-1/2 -translate-y-1/2 -right-2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-600',
  };

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[60] w-80 max-w-[calc(100vw-2rem)] ${
        reducedMotion
          ? 'opacity-100'
          : `transition-all duration-300 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`
      }`}
      style={{ top: coords.top, left: coords.left }}
      role="tooltip"
      aria-label={title}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-[8px] ${arrowClasses[arrowSide]}`}
        />

        {/* Header with brand accent line */}
        <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600" />

        <div className="p-4">
          {/* Title and close */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-bold text-white pr-4">{title}</h3>
            <button
              onClick={onSkip}
              className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed mb-4">{description}</p>

          {/* Footer: progress dots + nav buttons */}
          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStep
                      ? 'bg-brand-500'
                      : i < currentStep
                      ? 'bg-brand-500/40'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onPrev}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors"
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
