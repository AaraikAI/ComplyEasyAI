/**
 * Redis Caching Layer
 *
 * Production-ready caching service with Redis backing and in-memory fallback.
 * Provides typed cache operations, TTL management, cache invalidation patterns,
 * and tag-based cache groups for efficient bulk invalidation.
 *
 * When Redis is unavailable, uses an in-memory LRU cache suitable for
 * development and single-instance deployments.
 *
 * Connection lifecycle when REDIS_URL / REDIS_HOST is configured:
 * - A connection that fails at startup, or a client that ends, is retried in
 *   the background with exponential backoff (1 s up to 60 s, ±20% jitter) for
 *   as long as the process runs. One attempt runs at a time and the timer never
 *   holds the process open.
 * - An established client reconnects on its own and never gives up. While it is
 *   not ready, every operation is served from the in-memory store.
 * - Entries written with `durable: true` (token revocations) are mirrored in
 *   memory, and those written while Redis was not serving are copied into Redis
 *   before operations switch back to it.
 */

import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import Redis from 'ioredis';

// ============================================================================
// TYPES
// ============================================================================

export interface CacheOptions {
  /** Time-to-live in seconds. Default: 300 (5 minutes) */
  ttl?: number;
  /** Tags for group invalidation */
  tags?: string[];
  /** Namespace prefix for key isolation */
  namespace?: string;
  /**
   * Keep a copy in the in-memory store while Redis serves the entry, and copy
   * entries written while Redis was not serving into Redis once it is back.
   * Meant for small security records read by key, such as token revocations;
   * tags are not carried over.
   */
  durable?: boolean;
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
  hits: number;
  /** Written with `durable: true` (see CacheOptions). */
  durable?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: string;
  size: number;
  mode: 'redis' | 'memory';
  memoryUsageMB?: number;
  /** True when REDIS_URL / REDIS_HOST is configured. */
  redisConfigured?: boolean;
  /** True while Redis is configured and a connection is being (re)established. */
  reconnecting?: boolean;
  /** Background connection attempts since Redis last served operations. */
  reconnectAttempts?: number;
}

// ============================================================================
// CACHE TTL PRESETS
// ============================================================================

export const CACHE_TTL = {
  /** 30 seconds - for rapidly changing data */
  SHORT: 30,
  /** 5 minutes - default for most queries */
  MEDIUM: 300,
  /** 30 minutes - for semi-static data */
  LONG: 1800,
  /** 1 hour - for configuration and templates */
  VERY_LONG: 3600,
  /** 24 hours - for static reference data */
  DAY: 86400,
  /** 7 days - for framework templates and rarely changing data */
  WEEK: 604800,
} as const;

// ============================================================================
// CACHE KEY PATTERNS (type-safe key generators)
// ============================================================================

export const CACHE_KEYS = {
  // Organization-scoped keys
  orgDashboard: (orgId: string) => `org:${orgId}:dashboard`,
  orgVendors: (orgId: string) => `org:${orgId}:vendors`,
  orgPolicies: (orgId: string) => `org:${orgId}:policies`,
  orgFrameworks: (orgId: string) => `org:${orgId}:frameworks`,
  orgRisks: (orgId: string) => `org:${orgId}:risks`,
  orgIssues: (orgId: string) => `org:${orgId}:issues`,
  orgMonitors: (orgId: string) => `org:${orgId}:monitors`,
  orgTeam: (orgId: string) => `org:${orgId}:team`,

  // Entity-specific keys
  vendor: (id: string) => `vendor:${id}`,
  vendorScorecard: (id: string) => `vendor:${id}:scorecard`,
  policy: (id: string) => `policy:${id}`,
  framework: (id: string) => `framework:${id}`,
  frameworkControls: (id: string) => `framework:${id}:controls`,
  risk: (id: string) => `risk:${id}`,
  user: (id: string) => `user:${id}`,
  userSession: (userId: string) => `session:${userId}`,

  // Global keys
  frameworkTemplates: () => 'global:framework-templates',
  tierLimits: (plan: string) => `global:tier-limits:${plan}`,
  healthStatus: () => 'global:health-status',

  // Query cache keys
  query: (model: string, hash: string) => `query:${model}:${hash}`,

  // Feature flags
  featureFlags: (orgId: string) => `features:${orgId}`,
} as const;

// ============================================================================
// CONNECTION POLICY
// ============================================================================

/** Background reconnect backoff: starts at 1 s and doubles up to a 60 s cap. */
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 60_000;
/** ±20% jitter so replicas do not reconnect in lockstep. */
const RECONNECT_JITTER = 0.2;
/** Upper bound on one connection attempt (TCP connect, ready check and PING). */
const CONNECT_ATTEMPT_TIMEOUT_MS = 15_000;
/** An established client retries its own connection at most this far apart. */
const CLIENT_RETRY_MAX_MS = 2_000;
/** Upper bound on QUIT during shutdown before the socket is dropped. */
const SHUTDOWN_QUIT_TIMEOUT_MS = 2_000;
/** Connection errors are logged at most once per interval, with a suppressed count. */
const CONNECTION_ERROR_LOG_INTERVAL_MS = 60_000;
/** Copy passes over degraded-mode durable entries before switching back to Redis. */
const MAX_SYNC_PASSES = 3;

/** Rejects when `promise` has not settled within `ms`; the timer never holds the process open. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AppError(message, 503)), ms);
    timer.unref?.();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** The numeric `revokedAt` of a token-revocation record, or null. */
function revokedAtOf(value: unknown): number | null {
  if (value && typeof value === 'object') {
    const revokedAt = (value as { revokedAt?: unknown }).revokedAt;
    if (typeof revokedAt === 'number') return revokedAt;
  }
  return null;
}

/**
 * Decides whether a degraded-mode durable entry replaces the copy already in
 * Redis: only when ours is a revocation record with a later `revokedAt` (a
 * later user-wide revoke-all revokes more tokens). Otherwise Redis keeps its copy.
 */
function supersedesExisting(ours: unknown, existingRaw: string): boolean {
  const oursAt = revokedAtOf(ours);
  if (oursAt === null) return false;
  let existing: unknown;
  try {
    existing = JSON.parse(existingRaw);
  } catch {
    return true; // unreadable copy: the revocation record takes its place
  }
  const existingAt = revokedAtOf(existing);
  return existingAt === null || oursAt > existingAt;
}

/**
 * Maps cache statistics to the `/health` cache check. The cache reports
 * `warning` while Redis is configured but not serving. `/health` is public, so
 * the check never carries hosts or error text.
 */
export function buildCacheHealthCheck(stats: CacheStats): Record<string, unknown> {
  const degraded = stats.redisConfigured === true && stats.mode !== 'redis';
  return {
    status: degraded ? 'warning' : 'ok',
    mode: stats.mode,
    hitRate: stats.hitRate,
    size: stats.size,
    ...(stats.redisConfigured
      ? { reconnecting: stats.reconnecting === true, reconnectAttempts: stats.reconnectAttempts ?? 0 }
      : {}),
  };
}

// ============================================================================
// REDIS CACHE SERVICE
// ============================================================================

export class RedisCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: '0%',
    size: 0,
    mode: 'memory',
  };
  private maxMemoryEntries: number = 10000;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private defaultNamespace: string = 'complyeasy';
  /** True while the adopted client is ready and serving operations. */
  private redisConnected: boolean = false;
  /** The adopted client; it may be reconnecting. */
  private redisClient: Redis | null = null;
  private redisUrl: string | null = null;
  private initPromise: Promise<void> | null = null;
  /** A client whose connection attempt has not finished yet. */
  private connectingClient: Redis | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private reconnectInFlight: boolean = false;
  private promoting: boolean = false;
  /** Bumped by shutdown(); attempts and listeners from an earlier lifecycle stop acting. */
  private lifecycleEpoch: number = 0;
  /** Durable keys whose newest value is only in memory. */
  private unsyncedKeys: Set<string> = new Set();
  private lastConnectionErrorLogAt: number = 0;
  private suppressedConnectionErrors: number = 0;

  /**
   * Initialize the cache service.
   * Attempts a Redis connection and falls back to in-memory, retrying Redis in
   * the background. Concurrent callers share one initialization.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.initPromise) {
      const pending: Promise<void> = this.doInitialize().finally(() => {
        if (this.initPromise === pending) this.initPromise = null;
      });
      this.initPromise = pending;
    }
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    const epoch = this.lifecycleEpoch;
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    this.redisUrl = redisUrl || null;

    if (redisUrl) {
      logger.info(`[Cache] Connecting to Redis at ${redisUrl.replace(/\/\/.*@/, '//***@')}`);
      const connected = await this.connectRedis(redisUrl);
      if (epoch !== this.lifecycleEpoch) return; // shutdown() ran while connecting

      if (connected) {
        logger.info('[Cache] Redis cache initialized');
      } else {
        logger.warn('[Cache] Redis unavailable at startup; serving from the in-memory cache and retrying in the background');
        this.scheduleReconnect();
      }
    } else {
      logger.info('[Cache] No REDIS_URL configured, using in-memory LRU cache');
      this.stats.mode = 'memory';
    }

    // Start periodic cleanup for expired entries (in-memory only)
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
    this.cleanupInterval?.unref?.();

    this.initialized = true;
  }

  /**
   * Get a value from cache.
   *
   * A Redis failure falls back to the in-memory store, which holds what was
   * written while Redis was not serving plus a mirror of durable entries, so a
   * Redis outage never turns a read into an error.
   */
  async get<T = any>(key: string, options?: { namespace?: string }): Promise<T | null> {
    if (!this.initialized) await this.initialize();

    const fullKey = this.buildKey(key, options?.namespace);

    // Redis path
    const client = this.readClientFor(fullKey);
    if (client) {
      try {
        const raw = await client.get(fullKey);
        if (!raw) {
          this.stats.misses++;
          this.updateHitRate();
          return null;
        }
        this.stats.hits++;
        this.updateHitRate();
        return JSON.parse(raw) as T;
      } catch (error) {
        logger.warn(`[Cache] Redis get error for key "${fullKey}", falling back to memory`, error);
        // Fall through to in-memory
      }
    }

    // In-memory path
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check expiration
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      this.removeFromTagIndex(fullKey, entry.tags);
      this.unsyncedKeys.delete(fullKey);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  /**
   * Set a value in cache.
   */
  async set<T = any>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.initialized) await this.initialize();

    const ttl = options?.ttl ?? CACHE_TTL.MEDIUM;
    const tags = options?.tags ?? [];
    const durable = options?.durable === true;
    const fullKey = this.buildKey(key, options?.namespace);

    // Redis path
    const client = this.readyClient();
    if (client) {
      try {
        const serialized = JSON.stringify(value);
        if (ttl > 0) {
          await client.setex(fullKey, ttl, serialized);
        } else {
          await client.set(fullKey, serialized);
        }

        // Store tags in Redis using sets
        for (const tag of tags) {
          const tagKey = `${this.defaultNamespace}:__tag__:${tag}`;
          await client.sadd(tagKey, fullKey);
          // Tag sets expire after the longest possible TTL (7 days) to self-clean
          await client.expire(tagKey, CACHE_TTL.WEEK);
        }

        if (durable) {
          // Mirror so the entry can still be read from memory if Redis drops.
          this.writeMemoryEntry(fullKey, value, ttl, tags, true);
          this.unsyncedKeys.delete(fullKey);
        }

        this.stats.sets++;
        return;
      } catch (error) {
        logger.warn(`[Cache] Redis set error for key "${fullKey}", falling back to memory`, error);
        // Fall through to in-memory
      }
    }

    // In-memory path
    this.writeMemoryEntry(fullKey, value, ttl, tags, durable);
    this.stats.sets++;

    if (durable && this.redisUrl) {
      // Redis is configured but did not take this write: copy it over once Redis serves again.
      this.unsyncedKeys.add(fullKey);
    }
  }

  /**
   * Delete a specific key from cache.
   */
  async del(key: string, options?: { namespace?: string }): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    const fullKey = this.buildKey(key, options?.namespace);

    // Redis path
    const client = this.readyClient();
    if (client) {
      try {
        const result = await client.del(fullKey);
        this.removeMemoryEntry(fullKey); // durable mirror, if any
        this.stats.deletes++;
        return result > 0;
      } catch (error) {
        logger.warn(`[Cache] Redis del error for key "${fullKey}", falling back to memory`, error);
      }
    }

    // In-memory path
    if (this.removeMemoryEntry(fullKey)) {
      this.stats.deletes++;
      return true;
    }

    return false;
  }

  /**
   * Delete all keys matching a pattern.
   * Pattern supports * wildcard at the end.
   */
  async delPattern(pattern: string, options?: { namespace?: string }): Promise<number> {
    if (!this.initialized) await this.initialize();

    const prefix = this.buildKey(pattern.replace(/\*$/, ''), options?.namespace);

    // Redis path
    const client = this.readyClient();
    if (client) {
      try {
        let deleted = 0;
        let cursor = '0';
        do {
          const [nextCursor, keys] = await client.scan(
            cursor, 'MATCH', `${prefix}*`, 'COUNT', 100
          );
          cursor = nextCursor;
          if (keys.length > 0) {
            deleted += await client.del(...keys);
          }
        } while (cursor !== '0');

        this.stats.deletes += deleted;
        return deleted;
      } catch (error) {
        logger.warn(`[Cache] Redis delPattern error, falling back to memory`, error);
      }
    }

    // In-memory path
    let deleted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.removeFromTagIndex(key, entry.tags);
        this.cache.delete(key);
        this.unsyncedKeys.delete(key);
        deleted++;
      }
    }

    this.stats.deletes += deleted;
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Invalidate all cache entries with a specific tag.
   * Useful for invalidating all data for an organization or entity type.
   */
  async invalidateByTag(tag: string): Promise<number> {
    if (!this.initialized) await this.initialize();

    // Redis path
    const client = this.readyClient();
    if (client) {
      try {
        const tagKey = `${this.defaultNamespace}:__tag__:${tag}`;
        const keys = await client.smembers(tagKey);
        let deleted = 0;
        if (keys.length > 0) {
          deleted = await client.del(...keys);
          await client.del(tagKey);
        }
        this.stats.deletes += deleted;
        logger.debug(`[Cache] Invalidated ${deleted} entries with tag "${tag}" (Redis)`);
        return deleted;
      } catch (error) {
        logger.warn(`[Cache] Redis invalidateByTag error, falling back to memory`, error);
      }
    }

    // In-memory path
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    let deleted = 0;
    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.unsyncedKeys.delete(key);
        deleted++;
      }
    }

    this.tagIndex.delete(tag);
    this.stats.deletes += deleted;
    this.stats.size = this.cache.size;

    logger.debug(`[Cache] Invalidated ${deleted} entries with tag "${tag}"`);
    return deleted;
  }

  /**
   * Get or set pattern: returns cached value if present, otherwise calls
   * the factory function, caches the result, and returns it.
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, { namespace: options?.namespace });
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Check if a key exists in cache (without counting as a hit/miss).
   */
  async exists(key: string, options?: { namespace?: string }): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    const fullKey = this.buildKey(key, options?.namespace);

    // Redis path
    const client = this.readClientFor(fullKey);
    if (client) {
      try {
        const result = await client.exists(fullKey);
        return result === 1;
      } catch (error) {
        logger.warn(`[Cache] Redis exists error, falling back to memory`, error);
      }
    }

    // In-memory path
    const entry = this.cache.get(fullKey);

    if (!entry) return false;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Get remaining TTL for a key in seconds.
   * Returns -1 if key doesn't exist, 0 if no TTL (never expires).
   */
  async ttl(key: string, options?: { namespace?: string }): Promise<number> {
    if (!this.initialized) await this.initialize();

    const fullKey = this.buildKey(key, options?.namespace);

    // Redis path
    const client = this.readClientFor(fullKey);
    if (client) {
      try {
        const result = await client.ttl(fullKey);
        return result; // Redis returns -2 for non-existent, -1 for no TTL
      } catch (error) {
        logger.warn(`[Cache] Redis ttl error, falling back to memory`, error);
      }
    }

    // In-memory path
    const entry = this.cache.get(fullKey);

    if (!entry) return -1;
    if (entry.expiresAt === 0) return 0;

    const remaining = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    return remaining;
  }

  /**
   * Clear the entire cache.
   */
  async flush(): Promise<void> {
    // Redis path
    const client = this.readyClient();
    if (client) {
      try {
        // Only flush keys with our namespace prefix to avoid nuking other apps' data
        let cursor = '0';
        do {
          const [nextCursor, keys] = await client.scan(
            cursor, 'MATCH', `${this.defaultNamespace}:*`, 'COUNT', 100
          );
          cursor = nextCursor;
          if (keys.length > 0) {
            await client.del(...keys);
          }
        } while (cursor !== '0');
      } catch (error) {
        logger.warn('[Cache] Redis flush error', error);
      }
    }

    this.cache.clear();
    this.tagIndex.clear();
    this.unsyncedKeys.clear();
    this.stats.size = 0;
    logger.info('[Cache] Cache flushed');
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size,
      memoryUsageMB: this.estimateMemoryUsage(),
      redisConfigured: this.redisUrl !== null,
      reconnecting: this.redisUrl !== null && !this.redisConnected && (
        this.reconnectTimer !== null
        || this.reconnectInFlight
        || this.connectingClient !== null
        || this.redisClient !== null
      ),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Warm cache with frequently accessed data.
   */
  async warmCache(entries: Array<{ key: string; factory: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    logger.info(`[Cache] Warming cache with ${entries.length} entries...`);

    const results = await Promise.allSettled(
      entries.map(async ({ key, factory, options }) => {
        try {
          const value = await factory();
          await this.set(key, value, options);
        } catch (error) {
          logger.warn(`[Cache] Failed to warm cache key "${key}"`, error);
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    logger.info(`[Cache] Cache warmed: ${succeeded}/${entries.length} entries loaded`);
  }

  /**
   * Get the underlying Redis client (for direct operations like pub/sub).
   * Returns null unless Redis can serve a command right now.
   */
  getRedisClient(): Redis | null {
    return this.readyClient();
  }

  /**
   * Check if Redis is connected.
   */
  isRedisConnected(): boolean {
    return this.redisConnected;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.defaultNamespace;
    return `${ns}:${key}`;
  }

  /** The adopted client when it can serve commands now; null while (re)connecting or in memory mode. */
  private readyClient(): Redis | null {
    return this.redisConnected && this.redisClient?.status === 'ready' ? this.redisClient : null;
  }

  /** Like readyClient(), but null for a durable key whose newest value is only in memory. */
  private readClientFor(fullKey: string): Redis | null {
    return this.unsyncedKeys.has(fullKey) ? null : this.readyClient();
  }

  /**
   * Makes one connection attempt. Resolves true once the client is adopted.
   * A failed client is disconnected so it cannot keep reconnecting unowned.
   */
  private async connectRedis(url: string): Promise<boolean> {
    const epoch = this.lifecycleEpoch;
    let client: Redis;
    try {
      client = new Redis(url, {
        maxRetriesPerRequest: 3,
        // An established connection keeps retrying instead of reaching "end".
        retryStrategy: (times: number) => Math.min(times * 200, CLIENT_RETRY_MAX_MS),
        lazyConnect: true,
        connectTimeout: 10000,
        enableReadyCheck: true,
      });
    } catch (error) {
      this.logConnectionError(error);
      return false;
    }

    this.attachLifecycleListeners(client, epoch);
    this.connectingClient = client;
    try {
      await withTimeout(
        client.connect().then(() => client.ping()),
        CONNECT_ATTEMPT_TIMEOUT_MS,
        'Redis connection attempt timed out',
      );
    } catch (error) {
      client.disconnect();
      this.logConnectionError(error);
      return false;
    } finally {
      if (this.connectingClient === client) this.connectingClient = null;
    }

    if (epoch !== this.lifecycleEpoch) {
      client.disconnect();
      return false;
    }

    this.redisClient = client;
    await this.promoteClient(client, epoch);
    return true;
  }

  /** Keeps `redisConnected` in step with the client's connection events. */
  private attachLifecycleListeners(client: Redis, epoch: number): void {
    client.on('error', (err: Error) => {
      this.logConnectionError(err);
      if (client.status !== 'ready') this.handleClientDown(client, epoch);
    });
    client.on('close', () => this.handleClientDown(client, epoch));
    client.on('ready', () => {
      this.handleClientReady(client, epoch).catch((error: unknown) => {
        logger.warn('[Cache] Could not switch back to Redis after reconnecting', {
          message: error instanceof Error ? error.message : String(error),
        });
      });
    });
    client.on('end', () => this.handleClientEnd(client, epoch));
  }

  private handleClientDown(client: Redis, epoch: number): void {
    if (epoch !== this.lifecycleEpoch || client !== this.redisClient || !this.redisConnected) return;
    this.redisConnected = false;
    this.stats.mode = 'memory';
    logger.warn('[Cache] Redis connection lost; serving from the in-memory cache while the client reconnects');
  }

  private async handleClientReady(client: Redis, epoch: number): Promise<void> {
    if (epoch !== this.lifecycleEpoch || client !== this.redisClient || this.redisConnected) return;
    if (await this.promoteClient(client, epoch)) {
      logger.info('[Cache] Redis connection restored; cache mode is redis');
    }
  }

  /** A client that ends on its own is dropped and replaced by the background retry. */
  private handleClientEnd(client: Redis, epoch: number): void {
    if (epoch !== this.lifecycleEpoch || client !== this.redisClient) return;
    this.redisClient = null;
    this.redisConnected = false;
    this.stats.mode = 'memory';
    logger.warn('[Cache] Redis connection ended; serving from the in-memory cache and retrying in the background');
    this.scheduleReconnect();
  }

  /**
   * Copies durable entries written while Redis was not serving into Redis,
   * then switches operations to the client. Resolves true when it switched.
   */
  private async promoteClient(client: Redis, epoch: number): Promise<boolean> {
    if (this.promoting) return false;
    this.promoting = true;
    try {
      for (let pass = 0; pass < MAX_SYNC_PASSES && this.unsyncedKeys.size > 0; pass++) {
        await this.syncUnsyncedEntries(client);
      }
    } finally {
      if (epoch === this.lifecycleEpoch) this.promoting = false;
    }

    if (epoch !== this.lifecycleEpoch || client !== this.redisClient || client.status !== 'ready') return false;

    // No await between the last copy pass and this switch, so no write lands in between.
    this.redisConnected = true;
    this.stats.mode = 'redis';
    this.reconnectAttempts = 0;
    this.dropDegradedEntries();

    // Writes that kept arriving during the copy passes; their reads use memory until copied.
    if (this.unsyncedKeys.size > 0) {
      await this.syncUnsyncedEntries(client);
    }
    return true;
  }

  /** Copies unsynced durable entries into Redis; an entry that fails stays queued for the next reconnect. */
  private async syncUnsyncedEntries(client: Redis): Promise<void> {
    for (const key of [...this.unsyncedKeys]) {
      const entry = this.cache.get(key);
      const remainingSeconds = entry && entry.expiresAt > 0
        ? Math.ceil((entry.expiresAt - Date.now()) / 1000)
        : 0;
      if (!entry || (entry.expiresAt > 0 && remainingSeconds <= 0)) {
        this.unsyncedKeys.delete(key);
        continue;
      }

      try {
        const existing = await client.get(key);
        if (existing === null || supersedesExisting(entry.value, existing)) {
          const serialized = JSON.stringify(entry.value);
          if (remainingSeconds > 0) {
            await client.set(key, serialized, 'EX', remainingSeconds);
          } else {
            await client.set(key, serialized);
          }
        }
        // A newer write to the same key while this one was in flight stays queued.
        if (this.cache.get(key) === entry) this.unsyncedKeys.delete(key);
      } catch (error) {
        // Only the namespace is logged: keys carry token hashes and user IDs.
        logger.warn('[Cache] Could not copy a degraded-mode entry into Redis; it is retried on the next reconnect', {
          namespace: key.split(':')[0],
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /** Removes non-durable entries written while Redis was not serving, so they are never served stale. */
  private dropDegradedEntries(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!entry.durable) {
        this.removeFromTagIndex(key, entry.tags);
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  /** Arms the next background attempt; a no-op while one is pending or a client owns the connection. */
  private scheduleReconnect(): void {
    if (!this.redisUrl || this.redisClient || this.reconnectTimer || this.reconnectInFlight) return;

    const exponent = Math.min(this.reconnectAttempts, 16);
    const backoff = Math.min(RECONNECT_BASE_MS * 2 ** exponent, RECONNECT_MAX_MS);
    const jitter = 1 - RECONNECT_JITTER + Math.random() * 2 * RECONNECT_JITTER;
    const epoch = this.lifecycleEpoch;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.attemptReconnect(epoch);
    }, Math.round(backoff * jitter));
    this.reconnectTimer.unref?.();
  }

  private async attemptReconnect(epoch: number): Promise<void> {
    if (epoch !== this.lifecycleEpoch || this.redisClient || !this.redisUrl || this.reconnectInFlight) return;

    this.reconnectInFlight = true;
    const attempt = ++this.reconnectAttempts;
    let connected = false;
    try {
      connected = await this.connectRedis(this.redisUrl);
    } catch (error) {
      this.logConnectionError(error);
    } finally {
      if (epoch === this.lifecycleEpoch) this.reconnectInFlight = false;
    }
    if (epoch !== this.lifecycleEpoch) return;

    if (connected) {
      logger.info(`[Cache] Redis reconnected after ${attempt} background attempt(s); cache mode is ${this.stats.mode}`);
      return;
    }

    if (attempt <= 3 || attempt % 10 === 0) {
      logger.warn(
        `[Cache] Redis still unavailable after ${attempt} background attempt(s); ` +
        `retrying with backoff (max ${RECONNECT_MAX_MS / 1000}s)`
      );
    }
    this.scheduleReconnect();
  }

  private logConnectionError(error: unknown): void {
    const now = Date.now();
    if (now - this.lastConnectionErrorLogAt < CONNECTION_ERROR_LOG_INTERVAL_MS) {
      this.suppressedConnectionErrors += 1;
      return;
    }
    logger.warn('[Cache] Redis connection error', {
      message: error instanceof Error ? error.message : String(error),
      suppressedSinceLastLog: this.suppressedConnectionErrors,
    });
    this.lastConnectionErrorLogAt = now;
    this.suppressedConnectionErrors = 0;
  }

  private writeMemoryEntry<T>(fullKey: string, value: T, ttl: number, tags: string[], durable: boolean): void {
    // Evict if at capacity (LRU)
    if (this.cache.size >= this.maxMemoryEntries) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl > 0 ? Date.now() + (ttl * 1000) : 0,
      tags,
      createdAt: Date.now(),
      hits: 0,
    };
    if (durable) entry.durable = true;

    this.cache.set(fullKey, entry);
    this.stats.size = this.cache.size;

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(fullKey);
    }
  }

  /** Removes one in-memory entry. Returns true when one existed. */
  private removeMemoryEntry(fullKey: string): boolean {
    this.unsyncedKeys.delete(fullKey);
    const entry = this.cache.get(fullKey);
    if (!entry) return false;

    this.removeFromTagIndex(fullKey, entry.tags);
    this.cache.delete(fullKey);
    this.stats.size = this.cache.size;
    return true;
  }

  private removeFromTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      const tagKeys = this.tagIndex.get(tag);
      if (tagKeys) {
        tagKeys.delete(key);
        if (tagKeys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0
      ? `${((this.stats.hits / total) * 100).toFixed(1)}%`
      : '0%';
  }

  private evictLRU(): void {
    // Find the least recently used entry (lowest hits + oldest)
    let oldestKey: string | null = null;
    let oldestScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score: lower = more likely to evict (fewer hits, older creation)
      const score = entry.hits * 1000 + (Date.now() - entry.createdAt);
      if (score < oldestScore) {
        oldestScore = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.removeFromTagIndex(oldestKey, entry.tags);
      }
      this.cache.delete(oldestKey);
      this.unsyncedKeys.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.removeFromTagIndex(key, entry.tags);
        this.cache.delete(key);
        this.unsyncedKeys.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.size = this.cache.size;
      logger.debug(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimate: 500 bytes per entry on average
    return Math.round((this.cache.size * 500) / (1024 * 1024) * 100) / 100;
  }

  /**
   * Graceful shutdown. Stops the background retry and any in-flight attempt,
   * so nothing reconnects afterwards.
   */
  async shutdown(): Promise<void> {
    // Invalidate in-flight attempts and listeners before touching any client.
    this.lifecycleEpoch += 1;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectInFlight = false;
    this.promoting = false;
    this.reconnectAttempts = 0;
    this.initPromise = null;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const connecting = this.connectingClient;
    this.connectingClient = null;
    connecting?.disconnect();

    // Detach first so the client's 'end' event cannot schedule a reconnect.
    const client = this.redisClient;
    this.redisClient = null;
    this.redisConnected = false;
    this.stats.mode = 'memory';
    if (client) {
      try {
        await withTimeout(client.quit(), SHUTDOWN_QUIT_TIMEOUT_MS, 'Redis QUIT timed out');
      } catch (error) {
        logger.warn('[Cache] Redis QUIT failed during shutdown; closing the connection', {
          message: error instanceof Error ? error.message : String(error),
        });
        client.disconnect();
      }
    }

    this.cache.clear();
    this.tagIndex.clear();
    this.unsyncedKeys.clear();
    this.redisUrl = null;
    this.initialized = false;
    logger.info('[Cache] Cache service shutdown');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const cacheService = new RedisCacheService();

export default cacheService;
