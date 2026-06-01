/* global self, caches, fetch, URL, Response, indexedDB, AbortController, setTimeout, clearTimeout, console */
/**
 * ComplyEasyAI Service Worker
 *
 * Production-ready PWA service worker with:
 * - Cache-first strategy for static assets (App Shell)
 * - Network-first strategy for API calls with offline fallback
 * - Offline fallback to offline.html for navigation requests
 * - Background sync queue for offline mutations
 * - Push notification handling
 * - Skip waiting and claim clients on install
 * - Cache cleanup of old versions on activate
 * - Self-registration with scope '/'
 */

// ─── Cache Configuration ────────────────────────────────────────────────────

const CACHE_V1 = 'complyeasyai-cache-v1';
const API_CACHE = 'complyeasyai-api-v1';
const OFFLINE_PAGE = '/offline.html';

// App Shell resources to pre-cache on install
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// URL patterns for routing decisions
const API_URL_PATTERN = /\/api\//;
const STATIC_ASSET_PATTERN = /\/assets\/.*\.(js|css|woff2?|ttf|eot|png|jpe?g|gif|svg|ico|webp)(\?.*)?$/;

// API endpoints that must never be persisted to Cache Storage because they
// return per-user credentials or auth/session state. These are always served
// network-only (no offline copy) regardless of response headers.
const NON_CACHEABLE_API_PATTERN =
  /\/api\/(auth|sso|session|two-factor|2fa|magic-link|verify|refresh|logout|csrf-token|billing|payment|stripe|subscription)\b/;

// Background sync configuration
const SYNC_TAG = 'complyeasyai-offline-sync';
const SYNC_DB_NAME = 'complyeasyai-offline-queue';
const SYNC_DB_VERSION = 1;
const SYNC_STORE_NAME = 'pending-requests';

// Maximum entries per cache to prevent unbounded growth
const MAX_API_CACHE_ENTRIES = 100;
const MAX_STATIC_CACHE_ENTRIES = 300;

// ─── Install Event ──────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_V1)
      .then((cache) => {
        // Cache each asset individually so a single failure does not block install
        return Promise.allSettled(
          APP_SHELL_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to pre-cache ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting();
      })
  );
});

// ─── Activate Event ─────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  const currentCaches = [CACHE_V1, API_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// ─── Fetch Event ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests through the cache; non-GET requests pass through
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP(S) protocols (e.g., chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Sensitive API endpoints (auth/session/billing): never touch Cache Storage.
  if (NON_CACHEABLE_API_PATTERN.test(url.pathname)) {
    event.respondWith(networkOnlyStrategy(request));
    return;
  }

  // API calls: network-first with cache fallback
  if (API_URL_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets under /assets/*: cache-first
  if (STATIC_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Navigation requests (HTML pages): network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Everything else (fonts, images, etc.): cache-first
  event.respondWith(cacheFirstStrategy(request));
});

// ─── Cache-First Strategy ───────────────────────────────────────────────────

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_V1);
      cache.put(request, networkResponse.clone());
      await trimCache(CACHE_V1, MAX_STATIC_CACHE_ENTRIES);
    }
    return networkResponse;
  } catch {
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// ─── Network-Only Strategy (sensitive endpoints) ────────────────────────────

// Used for auth/session/billing endpoints. Always goes to the network and never
// reads from or writes to Cache Storage, so per-user credentials and session
// state are never persisted on shared devices.
async function networkOnlyStrategy(request) {
  try {
    return await fetchWithTimeout(request, 8000);
  } catch {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This action requires a connection.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Respect server caching directives: never persist a response that the server
// marks no-store / private / no-cache (e.g. authenticated, org-scoped data).
function isResponseCacheable(response) {
  const cacheControl = (response.headers.get('Cache-Control') || '').toLowerCase();
  if (
    cacheControl.includes('no-store') ||
    cacheControl.includes('private') ||
    cacheControl.includes('no-cache')
  ) {
    return false;
  }
  return true;
}

// ─── Network-First Strategy ─────────────────────────────────────────────────

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 8000);
    if (networkResponse.ok && isResponseCacheable(networkResponse)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      await trimCache(API_CACHE, MAX_API_CACHE_ENTRIES);
    }
    return networkResponse;
  } catch {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline-aware JSON error for API requests
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This data will be available when you reconnect.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ─── Navigation Strategy ────────────────────────────────────────────────────

async function navigationStrategy(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 10000);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_V1);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Try serving from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fall back to the offline page
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort inline fallback
    return new Response(
      '<html><body style="background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif"><div style="text-align:center"><h1>Offline</h1><p>Please check your connection and try again.</p><button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:#3B82F6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem">Retry</button></div></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ─── Background Sync ────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayOfflineRequests());
  }
});

async function replayOfflineRequests() {
  let db;
  try {
    db = await openSyncDB();
  } catch (error) {
    console.error('[SW] Could not open sync DB:', error);
    return;
  }

  const allRequests = await getAllFromStore(db);
  const results = [];

  for (const entry of allRequests) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers || {},
        body: entry.body || null,
        credentials: 'include',
      });

      if (response.ok) {
        await deleteFromStore(db, entry.id);
        results.push({ id: entry.id, status: 'synced' });
      } else if (response.status >= 500) {
        // Server error -- keep in queue for retry
        results.push({ id: entry.id, status: 'retry' });
      } else {
        // Client error (4xx) -- remove, it will not succeed on retry
        await deleteFromStore(db, entry.id);
        results.push({ id: entry.id, status: 'failed', error: response.status });
      }
    } catch {
      // Network still down -- keep in queue
      results.push({ id: entry.id, status: 'retry' });
    }
  }

  // Notify all clients about sync results
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      results,
      remaining: results.filter((r) => r.status === 'retry').length,
    });
  });
}

// ─── Push Notification Handling ─────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {
    title: 'ComplyEasyAI',
    body: 'You have a new notification',
    url: '/',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || 'complyeasyai-notification',
    renotify: data.renotify || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ComplyEasyAI', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing window if one is open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── Message Handling ───────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (Array.isArray(payload)) {
        event.waitUntil(
          caches.open(CACHE_V1).then((cache) => {
            return Promise.allSettled(payload.map((url) => cache.add(url)));
          })
        );
      }
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((names) =>
          Promise.all(names.map((name) => caches.delete(name)))
        )
      );
      break;

    case 'CLEAR_API_CACHE':
      // Purge cached, org-scoped API responses (e.g. on logout) so a subsequent
      // user on a shared device cannot be served the prior user's data offline.
      event.waitUntil(caches.delete(API_CACHE));
      break;

    case 'QUEUE_REQUEST':
      if (payload) {
        event.waitUntil(queueOfflineRequest(payload));
      }
      break;

    default:
      break;
  }
});

// ─── IndexedDB Helpers for Background Sync ──────────────────────────────────

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, SYNC_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        const store = db.createObjectStore(SYNC_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteFromStore(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function queueOfflineRequest(requestData) {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);

    await new Promise((resolve, reject) => {
      const req = store.add({
        url: requestData.url,
        method: requestData.method || 'POST',
        headers: requestData.headers || {},
        body: requestData.body || null,
        timestamp: Date.now(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Register for background sync if the API is available
    if (self.registration.sync) {
      await self.registration.sync.register(SYNC_TAG);
    }
  } catch (error) {
    console.error('[SW] Failed to queue offline request:', error);
  }
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timed out'));
    }, timeoutMs);

    fetch(request, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    const deleteCount = keys.length - maxEntries;
    const toDelete = keys.slice(0, deleteCount);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
    console.log(`[SW] Trimmed ${deleteCount} entries from ${cacheName}`);
  }
}
