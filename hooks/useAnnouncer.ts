import { useCallback, useEffect, useRef } from 'react';

/**
 * ARIA live region announcer for screen readers.
 * Creates a visually hidden live region that announces messages.
 * Supports 'polite' and 'assertive' politeness levels.
 */
export const useAnnouncer = () => {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create or find the live region
    let element = document.getElementById('aria-live-announcer') as HTMLDivElement;
    if (!element) {
      element = document.createElement('div');
      element.id = 'aria-live-announcer';
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.setAttribute('role', 'status');
      // Visually hidden but accessible to screen readers
      Object.assign(element.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      });
      document.body.appendChild(element);
    }
    announceRef.current = element;

    return () => {
      // Don't remove on unmount - other components may use it
    };
  }, []);

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;
    announceRef.current.setAttribute('aria-live', politeness);
    // Clear and re-set to trigger announcement
    announceRef.current.textContent = '';
    requestAnimationFrame(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    });
  }, []);

  return { announce };
};

export default useAnnouncer;
