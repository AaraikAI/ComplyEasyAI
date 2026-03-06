/**
 * Circuit Breaker Pattern Implementation
 *
 * Protects external service calls from cascading failures by:
 * - Failing fast when a service is unhealthy
 * - Allowing periodic test requests to check if service has recovered
 * - Preventing thundering herd when service comes back online
 */

import logger from '../config/logger';
import cacheService from '../services/cache/redisCacheService';

// ============================================================================
// TYPES
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests go through
  OPEN = 'OPEN',         // Failures exceeded threshold, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerOptions {
  /** Name for logging/identification */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time in ms before attempting recovery (half-open) */
  resetTimeout?: number;
  /** Number of successful requests needed to close circuit from half-open */
  successThreshold?: number;
  /** Custom function to determine if an error should count as failure */
  isFailure?: (error: Error) => boolean;
  /** Callback when circuit opens */
  onOpen?: (name: string, error: Error) => void;
  /** Callback when circuit closes */
  onClose?: (name: string) => void;
  /** Callback when circuit transitions to half-open */
  onHalfOpen?: (name: string) => void;
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

export class CircuitBreaker {
  private name: string;
  private state: CircuitState = CircuitState.CLOSED;
  private failureThreshold: number;
  private resetTimeout: number;
  private successThreshold: number;
  private isFailure: (error: Error) => boolean;
  private onOpen?: (name: string, error: Error) => void;
  private onClose?: (name: string) => void;
  private onHalfOpen?: (name: string) => void;

  // Counters
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;

  // Stats
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds default
    this.successThreshold = options.successThreshold ?? 2;
    this.isFailure = options.isFailure ?? (() => true);
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onHalfOpen = options.onHalfOpen;
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Sync state from Redis before checking circuit state (cross-instance consistency)
    await this.syncStateFromRedis();

    this.totalRequests++;

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      // Check if we should transition to half-open
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker '${this.name}' is OPEN`,
          this.name,
          this.state
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      if (this.isFailure(error as Error)) {
        this.onFailure(error as Error);
      }
      throw error;
    }
  }

  /**
   * Wrap a function to use the circuit breaker
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: Parameters<T>) => this.execute(() => fn(...args))) as T;
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.successes++;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.successThreshold) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failures = 0;
    }

    logger.debug(`[CircuitBreaker:${this.name}] Success`, {
      state: this.state,
      successes: this.successes,
    });
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error): void {
    this.totalFailures++;
    this.failures++;
    this.lastFailureTime = Date.now();

    logger.warn(`[CircuitBreaker:${this.name}] Failure`, {
      state: this.state,
      failures: this.failures,
      error: error.message,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open returns to open
      this.transitionToOpen(error);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failures >= this.failureThreshold) {
        this.transitionToOpen(error);
      }
    }
  }

  /**
   * Check if enough time has passed to attempt recovery
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(error: Error): void {
    this.state = CircuitState.OPEN;
    this.successes = 0;

    logger.warn(`[CircuitBreaker:${this.name}] Circuit OPENED after ${this.failures} failures`, {
      lastError: error.message,
      resetTimeout: this.resetTimeout,
    });

    this.onOpen?.(this.name, error);
    this.syncStateToRedis();
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.failures = 0;
    this.successes = 0;

    logger.info(`[CircuitBreaker:${this.name}] Circuit HALF-OPEN, testing recovery`);

    this.onHalfOpen?.(this.name);
    this.syncStateToRedis();
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;

    logger.info(`[CircuitBreaker:${this.name}] Circuit CLOSED, service recovered`);

    this.onClose?.(this.name);
    this.syncStateToRedis();
  }

  // ==========================================================================
  // REDIS STATE SYNCHRONIZATION
  // ==========================================================================

  /** Persist circuit state to Redis for cross-instance consistency */
  async syncStateToRedis(): Promise<void> {
    try {
      await cacheService.set(`circuit-breaker:${this.name}:state`, {
        state: this.state,
        failures: this.failures,
        successes: this.successes,
        lastFailureTime: this.lastFailureTime,
        lastSuccessTime: this.lastSuccessTime,
        totalRequests: this.totalRequests,
        totalFailures: this.totalFailures,
        totalSuccesses: this.totalSuccesses,
      }, { ttl: 300 }); // 5 minute TTL
    } catch {
      // Redis sync is best-effort; local state is always authoritative
    }
  }

  /** Load circuit state from Redis (cross-instance shared state) */
  async syncStateFromRedis(): Promise<void> {
    try {
      const shared = await cacheService.get<{
        state: CircuitState;
        failures: number;
        successes: number;
        lastFailureTime?: number;
        lastSuccessTime?: number;
        totalRequests: number;
        totalFailures: number;
        totalSuccesses: number;
      }>(`circuit-breaker:${this.name}:state`);

      if (shared) {
        // Merge: take the more restrictive state (if any instance has OPEN, stay OPEN)
        if (shared.state === CircuitState.OPEN && this.state === CircuitState.CLOSED) {
          this.state = CircuitState.OPEN;
          this.failures = Math.max(this.failures, shared.failures);
          this.lastFailureTime = shared.lastFailureTime;
        }
        // Aggregate totals from shared state
        this.totalRequests = Math.max(this.totalRequests, shared.totalRequests);
        this.totalFailures = Math.max(this.totalFailures, shared.totalFailures);
        this.totalSuccesses = Math.max(this.totalSuccesses, shared.totalSuccesses);
      }
    } catch {
      // Redis sync is best-effort
    }
  }

  /**
   * Get current circuit breaker stats
   */
  getStats(): CircuitBreakerStats {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : undefined,
      lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime) : undefined,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Force circuit to open state (for testing or manual intervention)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    logger.warn(`[CircuitBreaker:${this.name}] Circuit FORCE OPENED`);
  }

  /**
   * Force circuit to closed state (for testing or manual intervention)
   */
  forceClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    logger.info(`[CircuitBreaker:${this.name}] Circuit FORCE CLOSED`);
  }

  /**
   * Reset all counters and state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    logger.info(`[CircuitBreaker:${this.name}] Circuit RESET`);
  }
}

// ============================================================================
// CIRCUIT BREAKER ERROR
// ============================================================================

export class CircuitBreakerError extends Error {
  serviceName: string;
  circuitState: CircuitState;

  constructor(message: string, serviceName: string, state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.serviceName = serviceName;
    this.circuitState = state;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// CIRCUIT BREAKER REGISTRY
// ============================================================================

/**
 * Global registry for circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  get(name: string, options?: Omit<CircuitBreakerOptions, 'name'>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ name, ...options }));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Check if a breaker exists
   */
  has(name: string): boolean {
    return this.breakers.has(name);
  }

  /**
   * Get all circuit breaker stats (syncs from Redis first for cross-instance consistency)
   */
  async getAllStats(): Promise<CircuitBreakerStats[]> {
    // Sync each breaker from Redis before collecting stats
    await Promise.all(
      Array.from(this.breakers.values()).map(b => b.syncStateFromRedis())
    );
    return Array.from(this.breakers.values()).map(b => b.getStats());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(b => b.reset());
  }

  /**
   * Get count of open circuits
   */
  getOpenCount(): number {
    return Array.from(this.breakers.values()).filter(b => b.isOpen()).length;
  }
}

// Singleton registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a circuit breaker for an external service
 */
export function createCircuitBreaker(
  name: string,
  options?: Omit<CircuitBreakerOptions, 'name'>
): CircuitBreaker {
  return circuitBreakerRegistry.get(name, options);
}

/**
 * Decorator-style wrapper for async functions
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  options?: Omit<CircuitBreakerOptions, 'name'>
): T {
  const breaker = circuitBreakerRegistry.get(name, options);
  return breaker.wrap(fn);
}

export default {
  CircuitBreaker,
  CircuitBreakerError,
  CircuitState,
  circuitBreakerRegistry,
  createCircuitBreaker,
  withCircuitBreaker,
};
