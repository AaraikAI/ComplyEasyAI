/**
 * useServiceWorker Hook
 *
 * Registers the service worker from /service-worker.js and tracks its lifecycle.
 * Provides:
 *  - isRegistered: whether the SW is active
 *  - isUpdateAvailable: whether a new SW version is waiting
 *  - registration: the active ServiceWorkerRegistration object
 *  - update(): manually apply pending update (skip waiting + reload)
 *
 * Handles 'controllerchange' event to reload the page when a new SW takes over.
 * Only registers in production (import.meta.env.PROD).
 * Checks for updates periodically (every 60 minutes by default).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseServiceWorkerReturn {
  /** Whether service workers are supported in this browser */
  isSupported: boolean;
  /** Whether a service worker has been registered and is active */
  isRegistered: boolean;
  /** Whether a new service worker version is waiting to activate */
  isUpdateAvailable: boolean;
  /** The active ServiceWorkerRegistration, or null */
  registration: ServiceWorkerRegistration | null;
  /** Error that occurred during registration, if any */
  error: Error | null;
  /** Manually apply the pending update (calls SKIP_WAITING then reloads) */
  update: () => void;
  /** Manually check for service worker updates */
  checkForUpdates: () => Promise<void>;
  /** Dismiss the update-available state */
  dismissUpdate: () => void;
}

interface UseServiceWorkerOptions {
  /** Path to the service worker file (default: '/service-worker.js') */
  path?: string;
  /** Interval in ms to check for updates (default: 3600000 = 60 minutes) */
  updateInterval?: number;
  /** Callback when an update is found */
  onUpdateFound?: () => void;
}

export function useServiceWorker(
  options: UseServiceWorkerOptions = {}
): UseServiceWorkerReturn {
  const {
    path = '/service-worker.js',
    updateInterval = 60 * 60 * 1000, // 60 minutes
    onUpdateFound,
  } = options;

  const [isSupported] = useState(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateFoundRef = useRef(onUpdateFound);
  onUpdateFoundRef.current = onUpdateFound;

  // Track a worker through its lifecycle states
  const trackWorker = useCallback((worker: ServiceWorker) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New version available (existing controller means this is an update)
          setIsUpdateAvailable(true);
          onUpdateFoundRef.current?.();
        } else {
          // First-time install
          setIsRegistered(true);
          setRegistration(registrationRef.current);
        }
      }

      if (worker.state === 'activated') {
        setIsRegistered(true);
        setIsUpdateAvailable(false);
        setRegistration(registrationRef.current);
      }
    });
  }, []);

  // Register the service worker
  useEffect(() => {
    // Only register in production
    if (!isSupported || !import.meta.env.PROD) {
      return;
    }

    let mounted = true;

    async function registerSW() {
      try {
        const reg = await navigator.serviceWorker.register(path, { scope: '/' });
        registrationRef.current = reg;

        if (!mounted) return;

        // If already active, mark as registered
        if (reg.active) {
          setIsRegistered(true);
          setRegistration(reg);
        }

        // If installing, track it
        if (reg.installing) {
          trackWorker(reg.installing);
        }

        // Listen for future updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            trackWorker(newWorker);
          }
        });
      } catch (err) {
        if (!mounted) return;
        const regError = err instanceof Error ? err : new Error(String(err));
        console.error('[useServiceWorker] Registration failed:', regError);
        setError(regError);
      }
    }

    registerSW();

    return () => {
      mounted = false;
    };
  }, [isSupported, path, trackWorker]);

  // Handle controllerchange to reload the page when a new SW takes over
  useEffect(() => {
    if (!isSupported) return;

    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [isSupported]);

  // Periodically check for updates
  useEffect(() => {
    if (!isRegistered || updateInterval <= 0) return;

    intervalRef.current = setInterval(() => {
      registrationRef.current?.update().catch((err: unknown) => {
        console.warn('[useServiceWorker] Periodic update check failed:', err);
      });
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRegistered, updateInterval]);

  // Apply pending update
  const update = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, []);

  // Manually trigger an update check
  const checkForUpdates = useCallback(async () => {
    const reg = registrationRef.current;
    if (!reg) return;
    try {
      await reg.update();
    } catch (err) {
      console.warn('[useServiceWorker] Manual update check failed:', err);
    }
  }, []);

  // Dismiss the update notification
  const dismissUpdate = useCallback(() => {
    setIsUpdateAvailable(false);
  }, []);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    registration,
    error,
    update,
    checkForUpdates,
    dismissUpdate,
  };
}

export default useServiceWorker;
