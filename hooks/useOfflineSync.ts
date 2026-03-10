/**
 * useOfflineSync Hook
 *
 * Manages an offline mutation queue backed by IndexedDB (with localStorage fallback).
 * Provides:
 *  - isOnline: current connectivity status
 *  - pendingCount: number of queued requests awaiting sync
 *  - addToQueue(request): enqueue a failed/offline mutation for later replay
 *  - processQueue(): manually replay all queued requests
 *
 * On reconnect (online event), automatically processes queued requests.
 * Queue items: { id, url, method, body, headers, timestamp }
 * Retry logic with exponential backoff.
 * Reports sync progress and errors.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QueueItem {
  id: string;
  url: string;
  method: string;
  body: string | null;
  headers: Record<string, string>;
  timestamp: number;
  retryCount?: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

export interface SyncError {
  id: string;
  url: string;
  error: string;
  statusCode?: number;
}

export interface UseOfflineSyncReturn {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Number of requests pending in the offline queue */
  pendingCount: number;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Progress of the current sync operation */
  syncProgress: SyncProgress;
  /** Errors from the last sync attempt */
  syncErrors: SyncError[];
  /** Add a request to the offline queue */
  addToQueue: (request: Omit<QueueItem, 'id' | 'timestamp'>) => Promise<void>;
  /** Process all queued requests manually */
  processQueue: () => Promise<void>;
  /** Clear all pending requests from the queue */
  clearQueue: () => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DB_NAME = 'complyeasyai-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending-requests';
const LS_FALLBACK_KEY = 'complyeasyai-offline-queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;

// ─── IndexedDB Helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGetAll(db: IDBDatabase): Promise<QueueItem[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, item: QueueItem): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbClear(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbCount(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── localStorage Fallback ──────────────────────────────────────────────────

function lsGetAll(): QueueItem[] {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsSave(items: QueueItem[]): void {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items));
  } catch {
    console.warn('[useOfflineSync] localStorage save failed');
  }
}

// ─── Generate unique ID ────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Exponential backoff delay ──────────────────────────────────────────────

function backoffDelay(retryCount: number): number {
  const delay = BASE_BACKOFF_MS * Math.pow(2, retryCount);
  // Add jitter: +/- 25%
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, 30000); // Cap at 30 seconds
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false,
  });
  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);

  const dbRef = useRef<IDBDatabase | null>(null);
  const useIDB = useRef(true);
  const syncingRef = useRef(false);

  // ── Initialize database ─────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const db = await openDB();
        dbRef.current = db;
        const count = await idbCount(db);
        if (mounted) setPendingCount(count);
      } catch {
        // IndexedDB not available, fall back to localStorage
        console.warn('[useOfflineSync] IndexedDB unavailable, using localStorage fallback');
        useIDB.current = false;
        if (mounted) {
          const items = lsGetAll();
          setPendingCount(items.length);
        }
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Online/offline event listeners ──────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when reconnecting
      processQueueInternal();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refresh the pending count ───────────────────────────────────────────

  const refreshCount = useCallback(async () => {
    if (useIDB.current && dbRef.current) {
      try {
        const count = await idbCount(dbRef.current);
        setPendingCount(count);
      } catch {
        setPendingCount(0);
      }
    } else {
      setPendingCount(lsGetAll().length);
    }
  }, []);

  // ── Add a request to the queue ──────────────────────────────────────────

  const addToQueue = useCallback(
    async (request: Omit<QueueItem, 'id' | 'timestamp'>) => {
      const item: QueueItem = {
        id: generateId(),
        url: request.url,
        method: request.method,
        body: request.body,
        headers: request.headers,
        timestamp: Date.now(),
        retryCount: 0,
      };

      if (useIDB.current && dbRef.current) {
        try {
          await idbPut(dbRef.current, item);
        } catch {
          // Fallback to localStorage on write failure
          const items = lsGetAll();
          items.push(item);
          lsSave(items);
        }
      } else {
        const items = lsGetAll();
        items.push(item);
        lsSave(items);
      }

      await refreshCount();

      // Notify service worker if available
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'QUEUE_REQUEST',
          payload: {
            url: item.url,
            method: item.method,
            headers: item.headers,
            body: item.body,
          },
        });
      }
    },
    [refreshCount]
  );

  // ── Process the queue (replay all pending requests) ─────────────────────

  const processQueueInternal = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    let items: QueueItem[];

    if (useIDB.current && dbRef.current) {
      try {
        items = await idbGetAll(dbRef.current);
      } catch {
        items = lsGetAll();
      }
    } else {
      items = lsGetAll();
    }

    if (items.length === 0) {
      syncingRef.current = false;
      setIsSyncing(false);
      return;
    }

    const progress: SyncProgress = {
      total: items.length,
      completed: 0,
      failed: 0,
      inProgress: true,
    };
    setSyncProgress(progress);

    const errors: SyncError[] = [];

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
          credentials: 'include',
        });

        if (response.ok) {
          // Successfully synced -- remove from queue
          if (useIDB.current && dbRef.current) {
            await idbDelete(dbRef.current, item.id);
          } else {
            const remaining = lsGetAll().filter((i) => i.id !== item.id);
            lsSave(remaining);
          }
          progress.completed++;
        } else if (response.status >= 500) {
          // Server error -- increment retry count
          const retryCount = (item.retryCount || 0) + 1;

          if (retryCount >= MAX_RETRIES) {
            // Max retries exhausted -- remove and report error
            if (useIDB.current && dbRef.current) {
              await idbDelete(dbRef.current, item.id);
            } else {
              const remaining = lsGetAll().filter((i) => i.id !== item.id);
              lsSave(remaining);
            }
            progress.failed++;
            errors.push({
              id: item.id,
              url: item.url,
              error: `Server error ${response.status} after ${retryCount} retries`,
              statusCode: response.status,
            });
          } else {
            // Update retry count and wait with backoff before continuing
            const updated = { ...item, retryCount };
            if (useIDB.current && dbRef.current) {
              await idbPut(dbRef.current, updated);
            } else {
              const all = lsGetAll().map((i) => (i.id === item.id ? updated : i));
              lsSave(all);
            }
            const delay = backoffDelay(retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        } else {
          // Client error (4xx) -- remove, will not succeed on retry
          if (useIDB.current && dbRef.current) {
            await idbDelete(dbRef.current, item.id);
          } else {
            const remaining = lsGetAll().filter((i) => i.id !== item.id);
            lsSave(remaining);
          }
          progress.failed++;
          errors.push({
            id: item.id,
            url: item.url,
            error: `Client error ${response.status}`,
            statusCode: response.status,
          });
        }
      } catch {
        // Network error -- stop processing, we are likely still offline
        break;
      }

      setSyncProgress({ ...progress, inProgress: true });
    }

    progress.inProgress = false;
    setSyncProgress(progress);
    setSyncErrors(errors);

    await refreshCount();
    syncingRef.current = false;
    setIsSyncing(false);
  }, [refreshCount]);

  // ── Public processQueue wrapper ─────────────────────────────────────────

  const processQueue = useCallback(async () => {
    await processQueueInternal();
  }, [processQueueInternal]);

  // ── Clear all queued items ──────────────────────────────────────────────

  const clearQueue = useCallback(async () => {
    if (useIDB.current && dbRef.current) {
      try {
        await idbClear(dbRef.current);
      } catch {
        lsSave([]);
      }
    } else {
      lsSave([]);
    }

    setPendingCount(0);
    setSyncErrors([]);
    setSyncProgress({ total: 0, completed: 0, failed: 0, inProgress: false });
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncProgress,
    syncErrors,
    addToQueue,
    processQueue,
    clearQueue,
  };
}

export default useOfflineSync;
