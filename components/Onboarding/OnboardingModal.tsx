import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { OnboardingStepper } from './OnboardingProgress';

export interface OnboardingModalProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  onClose?: () => void;
  showCloseButton?: boolean;
  reducedMotion?: boolean;
  children?: React.ReactNode;
  /** Mono uppercase label rendered above the title (e.g. the flow name). */
  kicker?: string;
  /** Titles of the flow's steps; when provided, a left step rail is rendered. */
  steps?: string[];
  /** Index of the active step within `steps`. */
  stepIndex?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  onClose,
  showCloseButton = true,
  reducedMotion = false,
  children,
  kicker,
  steps,
  stepIndex = 0,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const hasStepper = Boolean(steps && steps.length > 0);

  useEffect(() => {
    const node = modalRef.current;
    if (!node) return;

    // Move initial focus into the dialog.
    node.focus();

    const getFocusable = (): HTMLElement[] =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Confine keyboard focus to the dialog (Tab / Shift+Tab cycle); Escape closes.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || active === node || !node.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pt-20" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — pt-20 keeps content below fixed header when layered above */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${hasStepper ? 'max-w-2xl' : 'max-w-lg'} bg-signal-panel2 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto ${
          reducedMotion ? '' : 'animate-onboarding-modal-in'
        }`}
      >
        {/* Close button */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-signal-muted hover:text-signal-ink hover:bg-white/[0.06] rounded-lg transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col md:flex-row">
          {/* Left step rail */}
          {hasStepper && (
            <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/[0.08] bg-signal-panel p-5">
              <OnboardingStepper steps={steps as string[]} currentIndex={stepIndex} reducedMotion={reducedMotion} />
            </aside>
          )}

          {/* Content */}
          <div className="flex-1 p-8 text-center">
            {/* Icon */}
            {icon && (
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-signal-green/10 border border-signal-green/25 flex items-center justify-center text-signal-green">
                  {icon}
                </div>
              </div>
            )}

            {/* Kicker */}
            {kicker && (
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal-green">
                {kicker}
              </p>
            )}

            {/* Title */}
            <h2 className="font-display text-2xl font-bold tracking-tight text-signal-ink mb-3">{title}</h2>

            {/* Description */}
            <p className="text-signal-body text-base leading-relaxed mb-6 max-w-md mx-auto">
              {description}
            </p>

            {/* Custom children */}
            {children}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="px-5 py-2.5 text-sm font-medium text-signal-sub hover:text-signal-ink hover:bg-white/[0.06] border border-white/[0.10] rounded-xl transition-colors"
                >
                  {secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="px-6 py-2.5 text-sm font-semibold text-signal-canvas bg-signal-green rounded-xl transition-all shadow-[0_6px_24px_rgba(56,232,166,0.28)] hover:opacity-90"
                >
                  {primaryAction.label}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
