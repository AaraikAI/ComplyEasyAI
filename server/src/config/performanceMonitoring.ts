/**
 * Performance Monitoring Integration
 * Tracks performance metrics and integrates with monitoring systems
 */

import monitoring from './monitoring';
import logger from './logger';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
}

interface PerformanceThreshold {
  endpoint: string;
  method: string;
  maxResponseTime: number;
  maxErrorRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics in memory

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Check thresholds
    this.checkThresholds(metric);

    // Send to monitoring system
    this.sendToMonitoring(metric);
  }

  /**
   * Set performance threshold
   */
  setThreshold(threshold: PerformanceThreshold): void {
    const existing = this.thresholds.findIndex(
      (t) => t.endpoint === threshold.endpoint && t.method === threshold.method
    );

    if (existing >= 0) {
      this.thresholds[existing] = threshold;
    } else {
      this.thresholds.push(threshold);
    }
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(
      (t) => t.endpoint === metric.endpoint && t.method === metric.method
    );

    if (!threshold) return;

    // Check response time
    if (metric.responseTime > threshold.maxResponseTime) {
      logger.warn(
        `Performance threshold exceeded: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms (threshold: ${threshold.maxResponseTime}ms)`
      );

      monitoring.captureException(new Error('Performance threshold exceeded'), {
        level: 'warning',
        tags: {
          endpoint: metric.endpoint,
          method: metric.method,
          responseTime: metric.responseTime.toString(),
        },
        extra: {
          threshold: threshold.maxResponseTime,
          statusCode: metric.statusCode,
        },
      });
    }

    // Check error rate (calculated over recent metrics)
    const recentMetrics = this.metrics.filter(
      (m) =>
        m.endpoint === metric.endpoint &&
        m.method === metric.method &&
        Date.now() - m.timestamp.getTime() < 60000 // Last minute
    );

    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length;
    const errorRate = (errorCount / recentMetrics.length) * 100;

    if (errorRate > threshold.maxErrorRate && recentMetrics.length > 10) {
      logger.warn(
        `Error rate threshold exceeded: ${metric.method} ${metric.endpoint} - ${errorRate.toFixed(2)}% (threshold: ${threshold.maxErrorRate}%)`
      );

      monitoring.captureException(new Error('Error rate threshold exceeded'), {
        level: 'warning',
        tags: {
          endpoint: metric.endpoint,
          method: metric.method,
          errorRate: errorRate.toFixed(2),
        },
        extra: {
          threshold: threshold.maxErrorRate,
          errorCount,
          totalRequests: recentMetrics.length,
        },
      });
    }
  }

  /**
   * Send metric to monitoring system
   */
  private sendToMonitoring(metric: PerformanceMetric): void {
    // Add to Sentry transaction
    const transaction = monitoring.startTransaction(
      `${metric.method} ${metric.endpoint}`,
      'http.server'
    );

    if (transaction) {
      transaction.setData('responseTime', metric.responseTime);
      transaction.setData('statusCode', metric.statusCode);
      transaction.setTag('endpoint', metric.endpoint);
      transaction.setTag('method', metric.method);

      if (metric.userId) {
        transaction.setUser({ id: metric.userId });
      }

      transaction.finish();
    }

    // Add custom metric
    monitoring.addBreadcrumb(
      `Performance: ${metric.method} ${metric.endpoint}`,
      'performance',
      {
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
      }
    );
  }

  /**
   * Get performance statistics
   */
  getStatistics(
    endpoint?: string,
    method?: string,
    timeWindow?: number
  ): {
    averageResponseTime: number;
    p50: number;
    p95: number;
    p99: number;
    minResponseTime: number;
    maxResponseTime: number;
    totalRequests: number;
    errorRate: number;
    requestsPerSecond: number;
  } {
    let filtered = this.metrics;

    // Filter by endpoint
    if (endpoint) {
      filtered = filtered.filter((m) => m.endpoint === endpoint);
    }

    // Filter by method
    if (method) {
      filtered = filtered.filter((m) => m.method === method);
    }

    // Filter by time window
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filtered = filtered.filter((m) => m.timestamp.getTime() > cutoff);
    }

    if (filtered.length === 0) {
      return {
        averageResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        requestsPerSecond: 0,
      };
    }

    const responseTimes = filtered
      .map((m) => m.responseTime)
      .sort((a, b) => a - b);

    const errorCount = filtered.filter((m) => m.statusCode >= 400).length;
    const errorRate = (errorCount / filtered.length) * 100;

    const timeSpan = timeWindow || Date.now() - filtered[0].timestamp.getTime();
    const requestsPerSecond = (filtered.length / (timeSpan / 1000)).toFixed(2);

    return {
      averageResponseTime:
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      totalRequests: filtered.length,
      errorRate,
      requestsPerSecond: parseFloat(requestsPerSecond),
    };
  }

  /**
   * Get performance trends
   */
  getTrends(
    endpoint: string,
    method: string,
    intervals: number = 10
  ): Array<{
    timestamp: Date;
    averageResponseTime: number;
    errorRate: number;
    requestCount: number;
  }> {
    const filtered = this.metrics.filter(
      (m) => m.endpoint === endpoint && m.method === method
    );

    if (filtered.length === 0) return [];

    const sorted = filtered.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const timeSpan = sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime();
    const intervalSize = timeSpan / intervals;

    const trends = [];

    for (let i = 0; i < intervals; i++) {
      const startTime = sorted[0].timestamp.getTime() + i * intervalSize;
      const endTime = startTime + intervalSize;

      const intervalMetrics = sorted.filter(
        (m) =>
          m.timestamp.getTime() >= startTime && m.timestamp.getTime() < endTime
      );

      if (intervalMetrics.length > 0) {
        const responseTimes = intervalMetrics.map((m) => m.responseTime);
        const errorCount = intervalMetrics.filter((m) => m.statusCode >= 400).length;

        trends.push({
          timestamp: new Date(startTime),
          averageResponseTime:
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          errorRate: (errorCount / intervalMetrics.length) * 100,
          requestCount: intervalMetrics.length,
        });
      }
    }

    return trends;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);
  }
}

// Default thresholds
const defaultThresholds: PerformanceThreshold[] = [
  { endpoint: '/health', method: 'GET', maxResponseTime: 100, maxErrorRate: 1 },
  { endpoint: '/api/frameworks', method: 'GET', maxResponseTime: 500, maxErrorRate: 5 },
  { endpoint: '/api/risks', method: 'GET', maxResponseTime: 500, maxErrorRate: 5 },
  { endpoint: '/api/ai/generate-report', method: 'POST', maxResponseTime: 10000, maxErrorRate: 10 },
];

const performanceMonitor = new PerformanceMonitor();

// Set default thresholds
defaultThresholds.forEach((threshold) => {
  performanceMonitor.setThreshold(threshold);
});

export default performanceMonitor;
export { PerformanceMonitor, PerformanceMetric, PerformanceThreshold };

