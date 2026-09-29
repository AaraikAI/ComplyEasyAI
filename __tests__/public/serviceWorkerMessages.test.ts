import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

/**
 * Guards the service worker's `message` handler: commands that write to or purge
 * Cache Storage (and queue offline requests) are honoured only when they come
 * from a same-origin client. The worker source is evaluated in an isolated vm
 * context with a minimal ServiceWorkerGlobalScope stand-in.
 */
const ROOT = resolve(__dirname, '..', '..');
const source = readFileSync(resolve(ROOT, 'public/service-worker.js'), 'utf8');
const APP_ORIGIN = 'https://app.complyeasy.test';

type Listener = (event: Record<string, unknown>) => void;

function loadWorker() {
  const listeners: Record<string, Listener> = {};
  const skipWaiting = vi.fn();
  const cachesApi = {
    open: vi.fn(() => Promise.resolve({ add: vi.fn(() => Promise.resolve()) })),
    keys: vi.fn(() => Promise.resolve([] as string[])),
    delete: vi.fn(() => Promise.resolve(true)),
  };
  const self = {
    location: { origin: APP_ORIGIN },
    skipWaiting,
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn;
    },
  };
  runInNewContext(source, {
    self,
    caches: cachesApi,
    fetch: vi.fn(),
    URL,
    Response: globalThis.Response,
    indexedDB: {},
    AbortController,
    setTimeout,
    clearTimeout,
    console: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
  });
  const post = (data: unknown, origin: string, sourceUrl?: string) => {
    const waitUntil = vi.fn();
    listeners.message({
      data,
      origin,
      source: sourceUrl ? { url: sourceUrl } : null,
      waitUntil,
    });
    return waitUntil;
  };
  return { post, skipWaiting, cachesApi };
}

describe('service worker message handler', () => {
  let worker: ReturnType<typeof loadWorker>;

  beforeEach(() => {
    worker = loadWorker();
  });

  it('executes commands from a same-origin client', () => {
    worker.post({ type: 'SKIP_WAITING' }, APP_ORIGIN);
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1);

    const waitUntil = worker.post({ type: 'CLEAR_API_CACHE' }, APP_ORIGIN);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(worker.cachesApi.delete).toHaveBeenCalledWith('complyeasyai-api-v1');
  });

  it('ignores commands whose origin is a different site', () => {
    worker.post({ type: 'SKIP_WAITING' }, 'https://attacker.example');
    const waitUntil = worker.post({ type: 'CACHE_URLS', payload: ['/x'] }, 'https://attacker.example');
    worker.post({ type: 'CLEAR_CACHE' }, 'https://app.complyeasy.test.attacker.example');

    expect(worker.skipWaiting).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
    expect(worker.cachesApi.open).not.toHaveBeenCalled();
    expect(worker.cachesApi.keys).not.toHaveBeenCalled();
  });

  it('falls back to the sending client URL when the event origin is empty', () => {
    worker.post({ type: 'SKIP_WAITING' }, '', `${APP_ORIGIN}/dashboard`);
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1);

    worker.post({ type: 'SKIP_WAITING' }, '', 'https://attacker.example/page');
    worker.post({ type: 'SKIP_WAITING' }, '');
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1);
  });
});
