/**
 * RedisCacheService — connection lifecycle.
 *
 * Covers the background reconnect after a startup failure (backoff, cap,
 * jitter, single attempt in flight, shutdown), the established-client safety
 * nets ('close'/'error'/'ready'/'end'), single-flight initialization, the
 * carry-over of degraded-mode revocations, the /health mapping, and the token
 * revocation path while Redis is down.
 *
 * ioredis is replaced by an EventEmitter-based client with plain methods (not
 * jest.fn) so jest's resetMocks/restoreMocks cannot wipe its behaviour.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

type Step = 'ok' | 'fail' | 'hang';

interface FakeClient {
  url: string;
  options: { retryStrategy: (times: number) => number | null | undefined };
  status: string;
  store: Map<string, string>;
  ttls: Map<string, number>;
  getCalls: number;
  disconnectCalls: number;
  quitCalls: number;
  failCommands: boolean;
  emit(event: string | symbol, ...args: unknown[]): boolean;
}

const mockPlan: Step[] = [];
const mockInstances: FakeClient[] = [];
const mockSeed = new Map<string, string>();
let mockRelease: (() => void) | null = null;

jest.mock('ioredis', () => {
  const { EventEmitter } = jest.requireActual<typeof import('events')>('events');

  class FakeRedis extends EventEmitter {
    status = 'wait';
    store = new Map<string, string>(mockSeed);
    ttls = new Map<string, number>();
    getCalls = 0;
    disconnectCalls = 0;
    quitCalls = 0;
    failCommands = false;
    private rejectPending: ((error: Error) => void) | null = null;

    constructor(public url: string, public options: any) {
      super();
      mockInstances.push(this as unknown as FakeClient);
    }

    connect(): Promise<void> {
      const step = mockPlan.shift() ?? 'fail';
      if (step === 'ok') {
        this.markReady();
        return Promise.resolve();
      }
      if (step === 'fail') {
        this.status = 'reconnecting';
        this.emit('error', new Error('connect ECONNREFUSED 10.0.0.5:6379'));
        return Promise.reject(new Error('Connection is closed.'));
      }
      this.status = 'connecting';
      return new Promise<void>((resolve, reject) => {
        this.rejectPending = reject;
        mockRelease = () => {
          this.rejectPending = null;
          this.markReady();
          resolve();
        };
      });
    }

    ping(): Promise<string> {
      return this.status === 'ready' ? Promise.resolve('PONG') : Promise.reject(new Error('Connection is closed.'));
    }

    get(key: string): Promise<string | null> {
      this.getCalls += 1;
      if (!this.serving()) return Promise.reject(new Error('Connection is closed.'));
      return Promise.resolve(this.store.get(key) ?? null);
    }

    set(key: string, value: string, ...args: unknown[]): Promise<string> {
      if (!this.serving()) return Promise.reject(new Error('Connection is closed.'));
      this.store.set(key, value);
      if (args[0] === 'EX') this.ttls.set(key, Number(args[1]));
      return Promise.resolve('OK');
    }

    setex(key: string, ttl: number, value: string): Promise<string> {
      if (!this.serving()) return Promise.reject(new Error('Connection is closed.'));
      this.store.set(key, value);
      this.ttls.set(key, ttl);
      return Promise.resolve('OK');
    }

    del(...keys: string[]): Promise<number> {
      if (!this.serving()) return Promise.reject(new Error('Connection is closed.'));
      return Promise.resolve(keys.filter((k) => this.store.delete(k)).length);
    }

    exists(key: string): Promise<number> {
      return Promise.resolve(this.store.has(key) ? 1 : 0);
    }

    ttl(key: string): Promise<number> {
      return Promise.resolve(this.ttls.get(key) ?? -1);
    }

    sadd(): Promise<number> {
      return Promise.resolve(1);
    }

    expire(): Promise<number> {
      return Promise.resolve(1);
    }

    smembers(): Promise<string[]> {
      return Promise.resolve([]);
    }

    scan(): Promise<[string, string[]]> {
      return Promise.resolve(['0', [...this.store.keys()]]);
    }

    disconnect(): void {
      this.disconnectCalls += 1;
      if (this.rejectPending) {
        const reject = this.rejectPending;
        this.rejectPending = null;
        reject(new Error('Connection is closed.'));
      }
      this.end();
    }

    quit(): Promise<string> {
      this.quitCalls += 1;
      this.end();
      return Promise.resolve('OK');
    }

    private serving(): boolean {
      return this.status === 'ready' && !this.failCommands;
    }

    private markReady(): void {
      this.status = 'ready';
      this.emit('ready');
    }

    private end(): void {
      this.status = 'end';
      this.emit('close');
      this.emit('end');
    }
  }

  return { __esModule: true, default: FakeRedis };
});

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import logger from '../../../../config/logger';
import cacheService, {
  RedisCacheService,
  buildCacheHealthCheck,
} from '../../../../services/cache/redisCacheService';
import tokenBlacklist from '../../../../services/tokenBlacklistService';

const warnMock = logger.warn as unknown as jest.Mock;
const infoMock = logger.info as unknown as jest.Mock;

/** Lets chained promise callbacks settle without advancing jest's clock. */
async function flush(): Promise<void> {
  for (let i = 0; i < 50; i++) {
    await Promise.resolve();
  }
}

function warnsContaining(text: string): unknown[][] {
  return warnMock.mock.calls.filter((call) => String(call[0]).includes(text));
}

function dropConnection(client: FakeClient): void {
  client.status = 'reconnecting';
  client.emit('close');
}

async function restoreConnection(client: FakeClient): Promise<void> {
  client.status = 'ready';
  client.emit('ready');
  await flush();
}

function resetFakes(): void {
  mockPlan.length = 0;
  mockInstances.length = 0;
  mockSeed.clear();
  mockRelease = null;
  process.env.REDIS_URL = 'redis://cache.internal:6379/0';
  delete process.env.REDIS_HOST;
}

const REVOCATION = { namespace: 'token-blacklist', durable: true };

describe('RedisCacheService connection lifecycle', () => {
  let svc: RedisCacheService;

  beforeEach(() => {
    resetFakes();
    jest.useFakeTimers();
    // Jitter factor 1 - 0.2 + 0.5 * 0.4 = 1.0, so delays are exact.
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    svc = new RedisCacheService();
  });

  afterEach(async () => {
    await svc.shutdown();
    jest.useRealTimers();
    delete process.env.REDIS_URL;
  });

  describe('without REDIS_URL', () => {
    it('stays in memory mode with no client, no retry timer and an ok health check', async () => {
      delete process.env.REDIS_URL;

      await svc.initialize();

      expect(mockInstances).toHaveLength(0);
      const stats = svc.getStats();
      expect(stats).toEqual(expect.objectContaining({ mode: 'memory', redisConfigured: false, reconnecting: false }));
      expect(jest.getTimerCount()).toBe(1); // the cleanup interval only
      expect(buildCacheHealthCheck(stats)).toEqual({ status: 'ok', mode: 'memory', hitRate: '0%', size: 0 });
      expect(infoMock).toHaveBeenCalledWith('[Cache] No REDIS_URL configured, using in-memory LRU cache');

      await svc.set('blacklist:a', { revokedAt: 1 }, REVOCATION);
      expect(svc['unsyncedKeys'].size).toBe(0);
      await expect(svc.get('blacklist:a', { namespace: 'token-blacklist' })).resolves.toEqual({ revokedAt: 1 });
    });
  });

  describe('startup', () => {
    it('connects and serves from Redis, with a client retry strategy that never gives up', async () => {
      mockPlan.push('ok');

      await svc.initialize();

      expect(mockInstances).toHaveLength(1);
      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'redis', redisConfigured: true, reconnecting: false }));
      expect(buildCacheHealthCheck(svc.getStats())).toEqual(
        expect.objectContaining({ status: 'ok', mode: 'redis', reconnecting: false, reconnectAttempts: 0 }),
      );

      await svc.set('k', { a: 1 });
      expect(mockInstances[0].store.get('complyeasy:k')).toBe('{"a":1}');
      await expect(svc.get('k')).resolves.toEqual({ a: 1 });

      const { retryStrategy } = mockInstances[0].options;
      expect(retryStrategy(1)).toBe(200);
      expect(retryStrategy(6)).toBe(1200);
      expect(retryStrategy(10_000)).toBe(2000);
    });

    it('disconnects a client that failed, serves from memory and reports a warning', async () => {
      mockPlan.push('fail');

      await svc.initialize();

      expect(mockInstances[0].disconnectCalls).toBe(1);
      const stats = svc.getStats();
      expect(stats).toEqual(expect.objectContaining({ mode: 'memory', redisConfigured: true, reconnecting: true }));
      const health = buildCacheHealthCheck(stats);
      expect(health).toEqual({ status: 'warning', mode: 'memory', hitRate: '0%', size: 0, reconnecting: true, reconnectAttempts: 0 });
      expect(JSON.stringify(health)).not.toMatch(/cache\.internal|ECONNREFUSED|10\.0\.0\.5/);
      expect(warnsContaining('Redis unavailable at startup')).toHaveLength(1);

      await svc.set('k', 'v');
      await expect(svc.get('k')).resolves.toBe('v');
    });

    it('shares one initialization between concurrent callers', async () => {
      mockPlan.push('ok', 'fail');

      await Promise.all([svc.initialize(), svc.initialize(), svc.set('k', 1)]);

      expect(mockInstances).toHaveLength(1);
      expect(mockPlan).toEqual(['fail']); // the second planned connection was never attempted
      expect(jest.getTimerCount()).toBe(1); // one cleanup interval
      expect(svc.getStats().mode).toBe('redis');
      expect(mockInstances[0].store.get('complyeasy:k')).toBe('1');
    });
  });

  describe('background reconnect', () => {
    it('retries after a startup failure and switches back to Redis', async () => {
      mockPlan.push('fail', 'ok');
      await svc.initialize();

      await jest.advanceTimersByTimeAsync(999);
      expect(mockInstances).toHaveLength(1);

      await jest.advanceTimersByTimeAsync(1);
      expect(mockInstances).toHaveLength(2);
      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'redis', reconnecting: false, reconnectAttempts: 0 }));
      expect(infoMock).toHaveBeenCalledWith('[Cache] Redis reconnected after 1 background attempt(s); cache mode is redis');
      expect(buildCacheHealthCheck(svc.getStats()).status).toBe('ok');
    });

    it('backs off exponentially from 1 s and caps the delay at 60 s', async () => {
      mockPlan.push(...(Array(8).fill('fail') as Step[]), 'ok');
      await svc.initialize();

      const gaps = [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000];
      for (const [index, gap] of gaps.entries()) {
        await jest.advanceTimersByTimeAsync(gap - 1);
        expect(mockInstances).toHaveLength(index + 1);
        await jest.advanceTimersByTimeAsync(1);
        expect(mockInstances).toHaveLength(index + 2);
      }
      expect(svc.getStats().mode).toBe('redis');
    });

    it('applies ±20% jitter to each delay', async () => {
      const random = Math.random as unknown as jest.Mock;
      random.mockReturnValue(0);
      mockPlan.push('fail', 'fail');
      await svc.initialize(); // first delay: 1000 * 0.8

      // The next delay is drawn when attempt 1 fails: 2000 * 1.19996 rounds to 2400.
      random.mockReturnValue(0.9999);
      await jest.advanceTimersByTimeAsync(799);
      expect(mockInstances).toHaveLength(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(mockInstances).toHaveLength(2);

      await jest.advanceTimersByTimeAsync(2399);
      expect(mockInstances).toHaveLength(2);
      await jest.advanceTimersByTimeAsync(1);
      expect(mockInstances).toHaveLength(3);
    });

    it('never runs two attempts at once and abandons an attempt that hangs', async () => {
      mockPlan.push('fail', 'hang', 'ok');
      await svc.initialize();

      await jest.advanceTimersByTimeAsync(1000);
      expect(mockInstances).toHaveLength(2);
      expect(svc.getStats().reconnecting).toBe(true);

      await jest.advanceTimersByTimeAsync(14_999);
      expect(mockInstances).toHaveLength(2); // no overlapping attempt while one is in flight

      await jest.advanceTimersByTimeAsync(1); // 15 s attempt timeout
      expect(mockInstances[1].disconnectCalls).toBe(1);

      await jest.advanceTimersByTimeAsync(2000);
      expect(mockInstances).toHaveLength(3);
      expect(svc.getStats().mode).toBe('redis');
    });

    it('keeps retrying indefinitely with low-noise logging', async () => {
      await svc.initialize(); // the plan is empty, so every connection fails

      // 1+2+4+8+16+32 s, then 24 attempts at the 60 s cap = 30 background attempts
      await jest.advanceTimersByTimeAsync(1_503_000);

      expect(mockInstances).toHaveLength(31);
      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'memory', reconnectAttempts: 30, reconnecting: true }));
      const stillUnavailable = warnsContaining('still unavailable').map((call) => String(call[0]));
      expect(stillUnavailable).toHaveLength(6);
      for (const attempt of [1, 2, 3, 10, 20, 30]) {
        expect(stillUnavailable.some((message) => message.includes(`after ${attempt} background attempt(s)`))).toBe(true);
      }
      const connectionErrors = warnsContaining('Redis connection error');
      expect(connectionErrors.length).toBeGreaterThanOrEqual(1);
      expect(connectionErrors.length).toBeLessThanOrEqual(27); // ceil(1503 s / 60 s) + 1
    });

    it('arms timers that never hold the process open', async () => {
      jest.useRealTimers();
      mockPlan.push('fail');

      await svc.initialize();

      expect(svc['reconnectTimer']?.hasRef()).toBe(false);
      expect(svc['cleanupInterval']?.hasRef()).toBe(false);
      await svc.shutdown();
      expect(svc['reconnectTimer']).toBeNull();
    });
  });

  describe('shutdown', () => {
    it('clears the retry timer so nothing reconnects afterwards', async () => {
      mockPlan.push('fail', 'ok');
      await svc.initialize();
      expect(jest.getTimerCount()).toBe(2); // cleanup interval + retry

      await svc.shutdown();

      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(3_600_000);
      expect(mockInstances).toHaveLength(1);
      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'memory', redisConfigured: false, reconnecting: false }));
    });

    it('stops an attempt that is in flight', async () => {
      mockPlan.push('fail', 'hang', 'ok');
      await svc.initialize();
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockInstances).toHaveLength(2);

      await svc.shutdown();
      await flush();

      expect(mockInstances[1].disconnectCalls).toBeGreaterThanOrEqual(1);
      expect(svc.getStats().mode).toBe('memory');
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(3_600_000);
      expect(mockInstances).toHaveLength(2);
    });

    it('stops the startup attempt and does not schedule a retry', async () => {
      mockPlan.push('hang');
      const initializing = svc.initialize();
      expect(mockInstances).toHaveLength(1);

      await svc.shutdown();
      await initializing;

      expect(mockInstances[0].disconnectCalls).toBeGreaterThanOrEqual(1);
      expect(jest.getTimerCount()).toBe(0);
      expect(svc['initialized']).toBe(false);
    });

    it("quits the adopted client without its 'end' event scheduling a retry", async () => {
      mockPlan.push('ok');
      await svc.initialize();

      await svc.shutdown();

      expect(mockInstances[0].quitCalls).toBe(1);
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(3_600_000);
      expect(mockInstances).toHaveLength(1);
    });
  });

  describe('established client', () => {
    it("serves from memory while the client reconnects and switches back on 'ready'", async () => {
      mockPlan.push('ok');
      await svc.initialize();
      const client = mockInstances[0];
      await svc.set('blacklist:before', { revokedAt: 1, reason: 'logout' }, { ttl: 600, ...REVOCATION });

      // ioredis sets the status first and emits 'close' on the next tick.
      client.status = 'reconnecting';
      expect(svc.isRedisConnected()).toBe(false);
      expect(svc.getRedisClient()).toBeNull();

      dropConnection(client);

      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'memory', reconnecting: true }));
      expect(buildCacheHealthCheck(svc.getStats()).status).toBe('warning');
      expect(svc.getRedisClient()).toBeNull();
      expect(svc.isRedisConnected()).toBe(false);
      expect(warnsContaining('Redis connection lost')).toHaveLength(1);

      const getCallsBefore = client.getCalls;
      await expect(svc.get('blacklist:before', { namespace: 'token-blacklist' }))
        .resolves.toEqual({ revokedAt: 1, reason: 'logout' });
      await expect(svc.get('blacklist:other', { namespace: 'token-blacklist' })).resolves.toBeNull();
      expect(client.getCalls).toBe(getCallsBefore); // the reconnecting client is not queried

      await svc.set('blacklist:during', { revokedAt: 2, reason: 'logout' }, { ttl: 600, ...REVOCATION });
      await svc.set('org:1:dashboard', { widgets: 3 });

      await restoreConnection(client);

      expect(svc.getStats().mode).toBe('redis');
      expect(client.store.has('token-blacklist:blacklist:during')).toBe(true);
      expect(client.store.has('complyeasy:org:1:dashboard')).toBe(false);
      expect(infoMock).toHaveBeenCalledWith('[Cache] Redis connection restored; cache mode is redis');
      await expect(svc.get('org:1:dashboard')).resolves.toBeNull(); // degraded-mode data is not served stale
    });

    it("marks the cache disconnected on an 'error' event while the client is not ready", async () => {
      mockPlan.push('ok');
      await svc.initialize();
      const client = mockInstances[0];

      client.status = 'connecting';
      client.emit('error', new Error('read ECONNRESET'));

      expect(svc.getStats().mode).toBe('memory');
      await restoreConnection(client);
      expect(svc.getStats().mode).toBe('redis');
    });

    it("replaces a client that reaches 'end' instead of leaving a dead client in place", async () => {
      mockPlan.push('ok', 'ok');
      await svc.initialize();
      const dead = mockInstances[0];

      dead.status = 'end';
      dead.emit('end');

      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'memory', reconnecting: true }));
      await expect(svc.get('k')).resolves.toBeNull();
      expect(dead.getCalls).toBe(0);

      await jest.advanceTimersByTimeAsync(1000);
      expect(mockInstances).toHaveLength(2);
      expect(svc.getStats().mode).toBe('redis');
      await svc.set('k', 'v');
      expect(mockInstances[1].store.get('complyeasy:k')).toBe('"v"');
    });

    it('falls back to memory when a Redis command fails, even for revocation reads', async () => {
      mockPlan.push('ok');
      await svc.initialize();
      await svc.set('blacklist:x', { revokedAt: 1, reason: 'logout' }, { ttl: 600, ...REVOCATION });
      mockInstances[0].failCommands = true;

      await expect(svc.get('blacklist:x', { namespace: 'token-blacklist' }))
        .resolves.toEqual({ revokedAt: 1, reason: 'logout' });
    });
  });

  describe('degraded-mode revocations', () => {
    it('copies revocations into Redis on reconnect, with their remaining TTL, and drops ordinary cache data', async () => {
      mockPlan.push('fail');
      await svc.initialize();
      await svc.set('blacklist:abc', { revokedAt: 111, reason: 'logout' }, { ttl: 600, ...REVOCATION });
      await svc.set('org:1:dashboard', { widgets: 3 });

      mockPlan.push('ok');
      await jest.advanceTimersByTimeAsync(1000);

      const redis = mockInstances[1];
      expect(redis.store.get('token-blacklist:blacklist:abc')).toBe(JSON.stringify({ revokedAt: 111, reason: 'logout' }));
      expect(redis.ttls.get('token-blacklist:blacklist:abc')).toBe(599);
      expect(redis.store.has('complyeasy:org:1:dashboard')).toBe(false);
      expect(svc.getStats()).toEqual(expect.objectContaining({ mode: 'redis', size: 1 })); // the durable mirror only
      expect(svc['unsyncedKeys'].size).toBe(0);
      await expect(svc.get('org:1:dashboard')).resolves.toBeNull();
    });

    it('keeps the later revoke-all timestamp when Redis already holds one', async () => {
      mockSeed.set('token-blacklist:revoke-all:newer-in-redis', JSON.stringify({ revokedAt: 300 }));
      mockSeed.set('token-blacklist:revoke-all:older-in-redis', JSON.stringify({ revokedAt: 100 }));
      mockPlan.push('fail');
      await svc.initialize();
      await svc.set('revoke-all:newer-in-redis', { revokedAt: 200 }, { ttl: 600, ...REVOCATION });
      await svc.set('revoke-all:older-in-redis', { revokedAt: 200 }, { ttl: 600, ...REVOCATION });

      mockPlan.push('ok');
      await jest.advanceTimersByTimeAsync(1000);

      const redis = mockInstances[1];
      expect(JSON.parse(redis.store.get('token-blacklist:revoke-all:newer-in-redis')!)).toEqual({ revokedAt: 300 });
      expect(JSON.parse(redis.store.get('token-blacklist:revoke-all:older-in-redis')!)).toEqual({ revokedAt: 200 });
    });

    it('evicts ordinary entries before revocations when the in-memory store is full', async () => {
      mockPlan.push('fail');
      await svc.initialize();
      svc['maxMemoryEntries'] = 3;

      await svc.set('blacklist:kept', { revokedAt: 1, reason: 'logout' }, { ttl: 600, ...REVOCATION });
      for (const key of ['a', 'b', 'c', 'd']) {
        await svc.set(key, key);
      }

      expect(svc.getStats().size).toBe(3);
      await expect(svc.get('blacklist:kept', { namespace: 'token-blacklist' }))
        .resolves.toEqual({ revokedAt: 1, reason: 'logout' });
      expect(svc['unsyncedKeys'].has('token-blacklist:blacklist:kept')).toBe(true);

      mockPlan.push('ok');
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockInstances[1].store.has('token-blacklist:blacklist:kept')).toBe(true);
    });

    it('evicts a revocation already in Redis before one that is not, and never for an overwrite', async () => {
      mockPlan.push('ok');
      await svc.initialize();
      svc['maxMemoryEntries'] = 2;
      const client = mockInstances[0];
      await svc.set('blacklist:synced', { revokedAt: 1, reason: 'logout' }, { ttl: 900, ...REVOCATION });

      dropConnection(client);
      await svc.set('blacklist:soon', { revokedAt: 2, reason: 'logout' }, { ttl: 30, ...REVOCATION });
      await svc.set('blacklist:soon', { revokedAt: 3, reason: 'logout' }, { ttl: 30, ...REVOCATION });
      expect(svc.getStats().size).toBe(2); // the overwrite evicted nothing
      await svc.set('blacklist:late', { revokedAt: 4, reason: 'logout' }, { ttl: 600, ...REVOCATION });

      expect(svc['cache'].has('token-blacklist:blacklist:synced')).toBe(false);
      expect([...svc['unsyncedKeys']].sort()).toEqual(['token-blacklist:blacklist:late', 'token-blacklist:blacklist:soon']);
      expect(warnsContaining('not in Redis yet')).toHaveLength(0);

      await restoreConnection(client);
      expect(client.store.has('token-blacklist:blacklist:soon')).toBe(true);
      expect(client.store.has('token-blacklist:blacklist:late')).toBe(true);
    });
  });

  describe('buildCacheHealthCheck', () => {
    const base = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: '0%', size: 0 };

    it('reports ok when Redis serves or is not configured, and warning otherwise', () => {
      expect(buildCacheHealthCheck({ ...base, mode: 'redis', redisConfigured: true }).status).toBe('ok');
      expect(buildCacheHealthCheck({ ...base, mode: 'memory', redisConfigured: false }).status).toBe('ok');
      expect(buildCacheHealthCheck({ ...base, mode: 'memory' }).status).toBe('ok');
      expect(buildCacheHealthCheck({ ...base, mode: 'memory', redisConfigured: true, reconnecting: true }).status)
        .toBe('warning');
    });

    it('keeps the existing fields and never includes error text', () => {
      const check = buildCacheHealthCheck({ ...base, mode: 'memory', redisConfigured: true, reconnectAttempts: 4 });
      expect(Object.keys(check).sort()).toEqual(['hitRate', 'mode', 'reconnectAttempts', 'reconnecting', 'size', 'status']);
      expect(check).not.toHaveProperty('error');
      expect(check).not.toHaveProperty('message');
    });
  });
});

describe('token revocation while Redis is down', () => {
  const secret = process.env.JWT_SECRET as string;

  beforeEach(() => {
    resetFakes();
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(async () => {
    await cacheService.shutdown();
    jest.useRealTimers();
    delete process.env.REDIS_URL;
  });

  it('answers from memory instead of rejecting every token, and keeps this instance\'s revocations', async () => {
    mockPlan.push('ok');
    await cacheService.initialize();
    const revoked = jwt.sign({ userId: 'u1' }, secret, { expiresIn: '1h' });
    const active = jwt.sign({ userId: 'u2' }, secret, { expiresIn: '1h' });
    await tokenBlacklist.revoke(revoked, 'logout');

    const client = mockInstances[0];
    dropConnection(client);

    await expect(tokenBlacklist.isRevoked(active)).resolves.toBe(false);
    await expect(tokenBlacklist.isRevokedByUserReset(active, 'u2')).resolves.toBe(false);
    await expect(tokenBlacklist.isRevoked(revoked)).resolves.toBe(true);

    await jest.advanceTimersByTimeAsync(2000); // the revoke-all must postdate the token's iat
    await tokenBlacklist.revokeAllForUser('u2');
    await expect(tokenBlacklist.isRevokedByUserReset(active, 'u2')).resolves.toBe(true);

    await restoreConnection(client);

    expect(client.store.has('token-blacklist:revoke-all:u2')).toBe(true);
    await expect(tokenBlacklist.isRevokedByUserReset(active, 'u2')).resolves.toBe(true);
    await expect(tokenBlacklist.isRevoked(revoked)).resolves.toBe(true);
  });
});
