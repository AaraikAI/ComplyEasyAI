import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus trap hook for modals and dialogs.
 * Traps focus within a container element, cycling Tab/Shift+Tab through focusable elements.
 * Restores focus to the previously focused element on unmount.
 *
 * Usage:
 *   const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
 *   return <div ref={trapRef}>...modal content...</div>
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean = true) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const FOCUSABLE_SELECTORS = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ].join(', ');

    function getFocusableElements(): HTMLElement[] {
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }

    // Focus first focusable element
    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      requestAnimationFrame(() => focusables[0].focus());
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const elements = getFocusableElements();
      if (elements.length === 0) { e.preventDefault(); return; }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

export default useFocusTrap;
