/**
 * UpdateAvailableBanner Component
 *
 * Shows a banner when a new service worker version is available.
 * Provides "Update Now" and "Dismiss" buttons.
 * "Update Now" calls registration.waiting.postMessage({type:'SKIP_WAITING'})
 * then reloads the page. Uses the dark glass UI theme with Tailwind.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';

interface UpdateAvailableBannerProps {
  /** Whether an update is available */
  isUpdateAvailable: boolean;
  /** The active service worker registration (used to message the waiting worker) */
  registration?: ServiceWorkerRegistration | null;
  /** Callback to apply the update (alternative to using registration directly) */
  onUpdate?: () => void;
  /** Callback when the banner is dismissed */
  onDismiss?: () => void;
}

export function UpdateAvailableBanner({
  isUpdateAvailable,
  registration,
  onUpdate,
  onDismiss,
}: UpdateAvailableBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Show/hide with animation
  useEffect(() => {
    if (isUpdateAvailable && !dismissed) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isUpdateAvailable, dismissed]);

  // Reset dismissed state when a new update appears
  useEffect(() => {
    if (isUpdateAvailable) {
      setDismissed(false);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate();
      return;
    }

    // Default behavior: message the waiting service worker then reload
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }, [registration, onUpdate]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (!shouldRender) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        fixed top-0 left-0 right-0 z-[9998]
        transition-all duration-300 ease-out
        ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
    >
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-blue-500/20 border-b border-blue-500/30 backdrop-blur-sm">
        <Download className="w-4 h-4 text-blue-200 flex-shrink-0" />

        <span className="text-sm font-medium text-blue-200">
          A new version is available.
        </span>

        <button
          onClick={handleUpdate}
          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-500/30 border border-blue-400/40 rounded-md hover:bg-blue-500/50 transition-colors"
        >
          Update Now
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss update notification"
          className="flex items-center justify-center w-6 h-6 text-blue-200/60 hover:text-blue-200 hover:bg-blue-500/20 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default UpdateAvailableBanner;
