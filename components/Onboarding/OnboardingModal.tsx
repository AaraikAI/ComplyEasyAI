import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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
        className={`relative w-full max-w-lg bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto ${
          reducedMotion ? '' : 'animate-onboarding-modal-in'
        }`}
      >
        {/* Close button */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          {icon && (
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                {icon}
              </div>
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>

          {/* Description */}
          <p className="text-slate-300 text-base leading-relaxed mb-6 max-w-md mx-auto">
            {description}
          </p>

          {/* Custom children */}
          {children}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors shadow-lg shadow-brand-600/20"
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
