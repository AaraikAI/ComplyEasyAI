/**
 * OfflineBanner Component
 *
 * Shows a slim banner at the top of the page when the user is offline.
 * Uses navigator.onLine and online/offline events to detect connectivity.
 * Dismissible with an X button. Displays pending sync count when applicable.
 * Animates slide-down on appear with the dark glass UI theme.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

interface OfflineBannerProps {
  /** Number of pending sync operations (optional) */
  pendingSyncCount?: number;
  /** Override online/offline status (defaults to navigator.onLine) */
  isOnline?: boolean;
  /** Delay in ms before showing the banner to avoid flicker (default: 1500) */
  showDelay?: number;
}

export function OfflineBanner({
  pendingSyncCount = 0,
  isOnline: isOnlineProp,
  showDelay = 1500,
}: OfflineBannerProps) {
  const [online, setOnline] = useState(
    isOnlineProp !== undefined ? isOnlineProp : navigator.onLine
  );
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with controlled prop
  useEffect(() => {
    if (isOnlineProp !== undefined) {
      setOnline(isOnlineProp);
    }
  }, [isOnlineProp]);

  // Listen for native online/offline events when not controlled via prop
  useEffect(() => {
    if (isOnlineProp !== undefined) return;

    const handleOnline = () => {
      setOnline(true);
      setDismissed(false);
    };
    const handleOffline = () => {
      setOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnlineProp]);

  // Show/hide with animation timing
  useEffect(() => {
    if (!online && !dismissed) {
      showTimerRef.current = setTimeout(() => {
        setShouldRender(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setVisible(true);
          });
        });
      }, showDelay);
    } else {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      setVisible(false);
      hideTimerRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [online, dismissed, showDelay]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        fixed top-0 left-0 right-0 z-[9999]
        transition-all duration-300 ease-out
        ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
    >
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-amber-500/20 border-b border-amber-500/30 backdrop-blur-sm">
        <WifiOff className="w-4 h-4 text-amber-200 flex-shrink-0" />

        <span className="text-sm font-medium text-amber-200">
          You are offline. Changes will sync when reconnected.
          {pendingSyncCount > 0 && (
            <span className="ml-1.5">
              <strong>{pendingSyncCount}</strong> pending change{pendingSyncCount !== 1 ? 's' : ''}.
            </span>
          )}
        </span>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-500/30 rounded-md hover:bg-amber-500/30 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss offline notification"
          className="flex items-center justify-center w-6 h-6 text-amber-200/60 hover:text-amber-200 hover:bg-amber-500/20 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default OfflineBanner;
