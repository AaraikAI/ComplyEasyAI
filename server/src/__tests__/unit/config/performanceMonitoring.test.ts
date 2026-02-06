/**
 * Performance Monitoring Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ---------- Mocks ----------
const mockCaptureException = jest.fn() as jest.Mock<any>;
const mockStartTransaction = jest.fn() as jest.Mock<any>;
const mockAddBreadcrumb = jest.fn() as jest.Mock<any>;

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: {
    captureException: mockCaptureException,
    startTransaction: mockStartTransaction,
    addBreadcrumb: mockAddBreadcrumb,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ---------- Import after mocks ----------
import { PerformanceMonitor } from '../../../config/performanceMonitoring';
import type { PerformanceMetric, PerformanceThreshold } from '../../../config/performanceMonitoring';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  const createMetric = (overrides: Partial<PerformanceMetric> = {}): PerformanceMetric => ({
    endpoint: '/api/test',
    method: 'GET',
    responseTime: 100,
    statusCode: 200,
    timestamp: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor();

    // Default mock for startTransaction
    mockStartTransaction.mockReturnValue({
      setData: jest.fn(),
      setTag: jest.fn(),
      setUser: jest.fn(),
      finish: jest.fn(),
    });
  });

  // -------------------------------------------------------------------
  // recordMetric
  // -------------------------------------------------------------------
  describe('recordMetric()', () => {
    it('should record a metric and send to monitoring', () => {
      monitor.recordMetric(createMetric());

      expect(mockStartTransaction).toHaveBeenCalledWith('GET /api/test', 'http.server');
      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        'Performance: GET /api/test',
        'performance',
        expect.objectContaining({ responseTime: 100, statusCode: 200 }),
      );
    });

    it('should set user on transaction when userId is provided', () => {
      const mockTransaction = {
        setData: jest.fn(),
        setTag: jest.fn(),
        setUser: jest.fn(),
        finish: jest.fn(),
      };
      mockStartTransaction.mockReturnValue(mockTransaction);

      monitor.recordMetric(createMetric({ userId: 'user-1' }));

      expect(mockTransaction.setUser).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('should handle null transaction gracefully', () => {
      mockStartTransaction.mockReturnValue(null);
      expect(() => monitor.recordMetric(createMetric())).not.toThrow();
    });

    it('should keep metrics under MAX_METRICS (10000)', () => {
      for (let i = 0; i < 10005; i++) {
        monitor.recordMetric(createMetric({ responseTime: i }));
      }

      const stats = monitor.getStatistics('/api/test', 'GET');
      expect(stats.totalRequests).toBeLessThanOrEqual(10000);
    });
  });

  // -------------------------------------------------------------------
  // setThreshold
  // -------------------------------------------------------------------
  describe('setThreshold()', () => {
    it('should add a new threshold', () => {
      const threshold: PerformanceThreshold = {
        endpoint: '/api/test',
        method: 'GET',
        maxResponseTime: 200,
        maxErrorRate: 5,
      };

      monitor.setThreshold(threshold);

      // Verify threshold works by recording a slow metric
      const mockWarn = jest.fn();
      jest.spyOn(require('../../../config/logger').default, 'warn').mockImplementation(mockWarn);

      monitor.recordMetric(createMetric({ responseTime: 300 }));

      expect(mockCaptureException).toHaveBeenCalled();
    });

    it('should update an existing threshold', () => {
      const threshold1: PerformanceThreshold = {
        endpoint: '/api/test',
        method: 'GET',
        maxResponseTime: 100,
        maxErrorRate: 5,
      };
      const threshold2: PerformanceThreshold = {
        endpoint: '/api/test',
        method: 'GET',
        maxResponseTime: 500,
        maxErrorRate: 10,
      };

      monitor.setThreshold(threshold1);
      monitor.setThreshold(threshold2);

      // 200ms should not trigger the updated threshold of 500ms
      monitor.recordMetric(createMetric({ responseTime: 200 }));
      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // checkThresholds
  // -------------------------------------------------------------------
  describe('threshold checking', () => {
    it('should fire warning when response time exceeds threshold', () => {
      monitor.setThreshold({
        endpoint: '/api/slow',
        method: 'POST',
        maxResponseTime: 100,
        maxErrorRate: 50,
      });

      monitor.recordMetric(
        createMetric({ endpoint: '/api/slow', method: 'POST', responseTime: 500 }),
      );

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Performance threshold exceeded' }),
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({ endpoint: '/api/slow', method: 'POST' }),
        }),
      );
    });

    it('should fire warning when error rate exceeds threshold (needs >10 metrics)', () => {
      monitor.setThreshold({
        endpoint: '/api/errors',
        method: 'GET',
        maxResponseTime: 10000,
        maxErrorRate: 5,
      });

      // Record 12 metrics with 6 errors (50% error rate)
      for (let i = 0; i < 6; i++) {
        monitor.recordMetric(
          createMetric({
            endpoint: '/api/errors',
            method: 'GET',
            statusCode: 200,
            timestamp: new Date(),
          }),
        );
      }
      for (let i = 0; i < 6; i++) {
        monitor.recordMetric(
          createMetric({
            endpoint: '/api/errors',
            method: 'GET',
            statusCode: 500,
            timestamp: new Date(),
          }),
        );
      }

      // Should have fired the error rate warning
      const errorRateCalls = mockCaptureException.mock.calls.filter(
        (call: any) => call[0]?.message === 'Error rate threshold exceeded',
      );
      expect(errorRateCalls.length).toBeGreaterThan(0);
    });

    it('should not fire error rate warning with <= 10 metrics', () => {
      monitor.setThreshold({
        endpoint: '/api/few',
        method: 'GET',
        maxResponseTime: 10000,
        maxErrorRate: 5,
      });

      // Record only 5 error metrics
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric(
          createMetric({ endpoint: '/api/few', method: 'GET', statusCode: 500 }),
        );
      }

      const errorRateCalls = mockCaptureException.mock.calls.filter(
        (call: any) => call[0]?.message === 'Error rate threshold exceeded',
      );
      expect(errorRateCalls.length).toBe(0);
    });

    it('should not fire warning when no threshold is set for the endpoint', () => {
      monitor.recordMetric(
        createMetric({
          endpoint: '/api/no-threshold',
          method: 'GET',
          responseTime: 99999,
          statusCode: 500,
        }),
      );

      // captureException should not have been called for threshold violation
      const thresholdCalls = mockCaptureException.mock.calls.filter(
        (call: any) =>
          call[0]?.message === 'Performance threshold exceeded' ||
          call[0]?.message === 'Error rate threshold exceeded',
      );
      expect(thresholdCalls.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------
  // getStatistics
  // -------------------------------------------------------------------
  describe('getStatistics()', () => {
    it('should return zeroed stats when no metrics exist', () => {
      const stats = monitor.getStatistics();
      expect(stats).toEqual({
        averageResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        requestsPerSecond: 0,
      });
    });

    it('should compute correct statistics for recorded metrics', () => {
      const baseTime = Date.now();

      for (let i = 1; i <= 100; i++) {
        monitor.recordMetric(
          createMetric({
            responseTime: i * 10,
            statusCode: i <= 90 ? 200 : 500,
            timestamp: new Date(baseTime + i * 10),
          }),
        );
      }

      const stats = monitor.getStatistics('/api/test', 'GET');
      expect(stats.totalRequests).toBe(100);
      expect(stats.averageResponseTime).toBe(505); // (10+20+...+1000)/100 = 505
      expect(stats.minResponseTime).toBe(10);
      expect(stats.maxResponseTime).toBe(1000);
      expect(stats.errorRate).toBe(10); // 10 errors / 100 total
      expect(stats.p50).toBe(510); // element at index 50
      expect(stats.p95).toBe(960); // element at index 95
      expect(stats.p99).toBe(1000); // element at index 99
    });

    it('should filter by endpoint', () => {
      monitor.recordMetric(createMetric({ endpoint: '/api/a', responseTime: 50 }));
      monitor.recordMetric(createMetric({ endpoint: '/api/b', responseTime: 100 }));

      const statsA = monitor.getStatistics('/api/a');
      expect(statsA.totalRequests).toBe(1);
      expect(statsA.averageResponseTime).toBe(50);
    });

    it('should filter by method', () => {
      monitor.recordMetric(createMetric({ method: 'GET', responseTime: 50 }));
      monitor.recordMetric(createMetric({ method: 'POST', responseTime: 100 }));

      const statsPost = monitor.getStatistics(undefined, 'POST');
      expect(statsPost.totalRequests).toBe(1);
    });

    it('should filter by time window', () => {
      // Old metric
      monitor.recordMetric(
        createMetric({ responseTime: 50, timestamp: new Date(Date.now() - 120000) }),
      );
      // Recent metric
      monitor.recordMetric(createMetric({ responseTime: 100, timestamp: new Date() }));

      const stats = monitor.getStatistics(undefined, undefined, 60000);
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(100);
    });
  });

  // -------------------------------------------------------------------
  // getTrends
  // -------------------------------------------------------------------
  describe('getTrends()', () => {
    it('should return empty array when no metrics exist', () => {
      const trends = monitor.getTrends('/api/test', 'GET');
      expect(trends).toEqual([]);
    });

    it('should return trend data segmented into intervals', () => {
      const baseTime = Date.now();

      for (let i = 0; i < 20; i++) {
        monitor.recordMetric(
          createMetric({
            responseTime: (i + 1) * 10,
            statusCode: i < 15 ? 200 : 500,
            timestamp: new Date(baseTime + i * 1000),
          }),
        );
      }

      const trends = monitor.getTrends('/api/test', 'GET', 5);

      expect(trends.length).toBeGreaterThan(0);
      expect(trends.length).toBeLessThanOrEqual(5);

      for (const trend of trends) {
        expect(trend).toHaveProperty('timestamp');
        expect(trend).toHaveProperty('averageResponseTime');
        expect(trend).toHaveProperty('errorRate');
        expect(trend).toHaveProperty('requestCount');
        expect(trend.requestCount).toBeGreaterThan(0);
      }
    });

    it('should filter by endpoint and method', () => {
      monitor.recordMetric(
        createMetric({
          endpoint: '/api/a',
          method: 'GET',
          timestamp: new Date(Date.now()),
        }),
      );
      monitor.recordMetric(
        createMetric({
          endpoint: '/api/b',
          method: 'POST',
          timestamp: new Date(Date.now() + 1000),
        }),
      );

      const trends = monitor.getTrends('/api/b', 'POST', 2);
      // Only one metric so depends on single-metric interval behavior
      expect(trends.length).toBeLessThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------
  // clearOldMetrics
  // -------------------------------------------------------------------
  describe('clearOldMetrics()', () => {
    it('should remove metrics older than the specified time', () => {
      // Old metric: 2 hours ago
      monitor.recordMetric(
        createMetric({ timestamp: new Date(Date.now() - 7200000), responseTime: 50 }),
      );
      // Recent metric: now
      monitor.recordMetric(createMetric({ timestamp: new Date(), responseTime: 100 }));

      monitor.clearOldMetrics(3600000); // clear older than 1 hour

      const stats = monitor.getStatistics();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(100);
    });

    it('should default to 1 hour if no argument is provided', () => {
      monitor.recordMetric(
        createMetric({ timestamp: new Date(Date.now() - 7200000), responseTime: 50 }),
      );
      monitor.recordMetric(createMetric({ timestamp: new Date(), responseTime: 100 }));

      monitor.clearOldMetrics();

      const stats = monitor.getStatistics();
      expect(stats.totalRequests).toBe(1);
    });

    it('should keep all metrics when none are older than the cutoff', () => {
      monitor.recordMetric(createMetric({ timestamp: new Date() }));
      monitor.recordMetric(createMetric({ timestamp: new Date() }));

      monitor.clearOldMetrics(3600000);

      const stats = monitor.getStatistics();
      expect(stats.totalRequests).toBe(2);
    });
  });

  // -------------------------------------------------------------------
  // Default export (singleton with default thresholds)
  // -------------------------------------------------------------------
  describe('default export', () => {
    it('should be importable as a singleton', async () => {
      const mod = await import('../../../config/performanceMonitoring');
      expect(mod.default).toBeDefined();
      expect(mod.default).toBeInstanceOf(PerformanceMonitor);
    });
  });
});
