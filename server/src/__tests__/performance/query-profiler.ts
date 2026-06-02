/**
 * Database Query Profiler
 * Profiles and analyzes database query performance
 */

import { Prisma } from '../../generated/prisma/client';
import logger from '../../config/logger';

interface QueryProfile {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
  stack?: string;
}

interface QueryStats {
  query: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  slowQueries: number;
}

class QueryProfiler {
  private queries: QueryProfile[] = [];
  private slowQueryThreshold: number = 100; // milliseconds
  private enabled: boolean = false;

  /**
   * Enable query profiling
   */
  enable(): void {
    this.enabled = true;
    this.queries = [];
  }

  /**
   * Disable query profiling
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Record a query execution
   */
  recordQuery(query: string, duration: number, params?: any): void {
    if (!this.enabled) return;

    const profile: QueryProfile = {
      query: this.normalizeQuery(query),
      duration,
      timestamp: new Date(),
      params,
    };

    this.queries.push(profile);

    // Log slow queries immediately
    if (duration > this.slowQueryThreshold) {
      logger.warn(`Slow query detected: ${duration}ms`, {
        query: profile.query,
        duration,
        params,
      });
    }
  }

  /**
   * Normalize query for grouping (remove values, keep structure)
   */
  private normalizeQuery(query: string): string {
    // Remove parameter values but keep structure
    return query
      .replace(/\$\d+/g, '?')
      .replace(/'\d+'/g, "'?'")
      .replace(/'\w+'/g, "'?'")
      .replace(/\d+/g, '?');
  }

  /**
   * Get statistics for all queries
   */
  getStats(): QueryStats[] {
    const queryMap = new Map<string, QueryProfile[]>();

    // Group queries by normalized query string
    this.queries.forEach((profile) => {
      const normalized = profile.query;
      if (!queryMap.has(normalized)) {
        queryMap.set(normalized, []);
      }
      queryMap.get(normalized)!.push(profile);
    });

    // Calculate statistics for each query type
    const stats: QueryStats[] = [];

    queryMap.forEach((profiles, query) => {
      const durations = profiles.map((p) => p.duration);
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);
      const averageDuration = totalDuration / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      const slowQueries = durations.filter((d) => d > this.slowQueryThreshold).length;

      stats.push({
        query,
        count: profiles.length,
        totalDuration,
        averageDuration,
        minDuration,
        maxDuration,
        slowQueries,
      });
    });

    // Sort by total duration (descending)
    return stats.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold?: number): QueryProfile[] {
    const limit = threshold || this.slowQueryThreshold;
    return this.queries.filter((q) => q.duration > limit);
  }

  /**
   * Get query count
   */
  getQueryCount(): number {
    return this.queries.length;
  }

  /**
   * Clear all recorded queries
   */
  clear(): void {
    this.queries = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats();
    const slowQueries = this.getSlowQueries();
    const totalQueries = this.getQueryCount();

    let report = '\n=== Database Query Performance Report ===\n\n';
    report += `Total Queries: ${totalQueries}\n`;
    report += `Slow Queries (>${this.slowQueryThreshold}ms): ${slowQueries.length}\n\n`;

    report += 'Top 10 Queries by Total Duration:\n';
    report += '─'.repeat(80) + '\n';
    stats.slice(0, 10).forEach((stat, index) => {
      report += `${index + 1}. ${stat.query.substring(0, 60)}\n`;
      report += `   Count: ${stat.count}, Avg: ${stat.averageDuration.toFixed(2)}ms, `;
      report += `Min: ${stat.minDuration}ms, Max: ${stat.maxDuration}ms\n`;
      report += `   Slow: ${stat.slowQueries} (${((stat.slowQueries / stat.count) * 100).toFixed(1)}%)\n\n`;
    });

    if (slowQueries.length > 0) {
      report += '\nSlow Queries:\n';
      report += '─'.repeat(80) + '\n';
      slowQueries.slice(0, 20).forEach((query, index) => {
        report += `${index + 1}. ${query.duration}ms - ${query.query.substring(0, 60)}\n`;
      });
    }

    return report;
  }
}

/**
 * Build a Prisma client extension that records the timing of every model
 * operation into the supplied {@link QueryProfiler}.
 *
 * This uses the `$extends` query-component API (`$allModels.$allOperations`),
 * which is the supported instrumentation hook in Prisma 5+. The previous
 * `(params, next)` `$use` middleware signature was removed in Prisma 5 and
 * would silently no-op if attached to a current client.
 *
 * Apply with `basePrisma.$extends(createQueryProfilingExtension(profiler))`.
 * This is a diagnostic helper intended for local profiling and load tests;
 * the live client in `config/database.ts` does not attach it by default so
 * the hot path carries no per-query timing overhead.
 */
export function createQueryProfilingExtension(profiler: QueryProfiler) {
  return Prisma.defineExtension({
    name: 'query-profiler',
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          args: unknown;
          query: (args: unknown) => Promise<unknown>;
        }) {
          const startTime = Date.now();
          try {
            const result = await query(args);
            profiler.recordQuery(`${model}.${operation}`, Date.now() - startTime, args);
            return result;
          } catch (error) {
            profiler.recordQuery(`${model}.${operation} (ERROR)`, Date.now() - startTime);
            throw error;
          }
        },
      },
    },
  });
}

/**
 * Deprecated alias retained for existing importers. It now returns the
 * `$extends` query-component extension (the same value as
 * {@link createQueryProfilingExtension}) rather than a `$use` middleware,
 * because the `(params, next)` middleware signature was removed in Prisma 5+.
 * New code should call `createQueryProfilingExtension` directly.
 *
 * @deprecated Use {@link createQueryProfilingExtension} with `prisma.$extends`.
 */
export function createQueryProfilingMiddleware(profiler: QueryProfiler) {
  return createQueryProfilingExtension(profiler);
}

export { QueryProfiler };
export type { QueryProfile, QueryStats };

