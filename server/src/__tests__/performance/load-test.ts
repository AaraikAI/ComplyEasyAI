/**
 * Load Testing Suite
 * Tests API endpoints under various load conditions
 */

import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../index';

interface LoadTestResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
}

class LoadTester {
  private results: LoadTestResult[] = [];

  /**
   * Run load test on an endpoint
   */
  async testEndpoint(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    options: {
      totalRequests?: number;
      concurrency?: number;
      payload?: any;
      headers?: Record<string, string>;
      expectedStatus?: number;
    } = {}
  ): Promise<LoadTestResult> {
    const {
      totalRequests = 100,
      concurrency = 10,
      payload,
      headers = {},
      expectedStatus = 200,
    } = options;

    const responseTimes: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    const makeRequest = async (): Promise<void> => {
      const startTime = Date.now();
      try {
        let req = request(app)[method](endpoint);

        if (Object.keys(headers).length > 0) {
          Object.entries(headers).forEach(([key, value]) => {
            req = req.set(key, value);
          });
        }

        if (payload) {
          req = req.send(payload);
        }

        const response = await req;

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        if (response.status === expectedStatus) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (error) {
        failedRequests++;
        responseTimes.push(Date.now() - startTime);
      }
    };

    // Run requests in batches
    const batches = Math.ceil(totalRequests / concurrency);
    for (let i = 0; i < batches; i++) {
      const batchSize = Math.min(concurrency, totalRequests - i * concurrency);
      await Promise.all(Array(batchSize).fill(0).map(() => makeRequest()));
    }

    // Calculate statistics
    responseTimes.sort((a, b) => a - b);
    const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
    const averageResponseTime = totalTime / responseTimes.length;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    const testDuration = Math.max(...responseTimes) / 1000; // seconds
    const requestsPerSecond = totalRequests / testDuration;

    const result: LoadTestResult = {
      endpoint,
      method: method.toUpperCase(),
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p50,
      p95,
      p99,
      requestsPerSecond,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Get all test results
   */
  getResults(): LoadTestResult[] {
    return this.results;
  }

  /**
   * Print summary report
   */
  printReport(): void {
    console.log('\n=== Load Test Results ===\n');
    this.results.forEach((result) => {
      console.log(`${result.method} ${result.endpoint}`);
      console.log(`  Total Requests: ${result.totalRequests}`);
      console.log(`  Successful: ${result.successfulRequests}`);
      console.log(`  Failed: ${result.failedRequests}`);
      console.log(`  Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
      console.log(`  Avg Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${result.minResponseTime}ms, Max: ${result.maxResponseTime}ms`);
      console.log(`  P50: ${result.p50}ms, P95: ${result.p95}ms, P99: ${result.p99}ms`);
      console.log(`  Requests/sec: ${result.requestsPerSecond.toFixed(2)}\n`);
    });
  }
}

describe('Load Testing', () => {
  let loadTester: LoadTester;
  let authToken: string;

  beforeAll(async () => {
    loadTester = new LoadTester();
    // Get auth token for authenticated endpoints
    // In real scenario, this would be from actual login
    authToken = 'test-token';
  });

  afterAll(() => {
    loadTester.printReport();
  });

  describe('Health Check Endpoint', () => {
    it('should handle 100 concurrent requests', async () => {
      const result = await loadTester.testEndpoint('get', '/health', {
        totalRequests: 100,
        concurrency: 10,
        expectedStatus: 200,
      });

      expect(result.successfulRequests).toBeGreaterThan(95);
      expect(result.averageResponseTime).toBeLessThan(100);
      expect(result.p95).toBeLessThan(200);
    });
  });

  describe('API Endpoints', () => {
    it('should handle moderate load on GET /api/frameworks', async () => {
      const result = await loadTester.testEndpoint('get', '/api/frameworks', {
        totalRequests: 50,
        concurrency: 5,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        expectedStatus: 200,
      });

      expect(result.successfulRequests).toBeGreaterThan(45);
      expect(result.averageResponseTime).toBeLessThan(500);
    });

    it('should handle load on POST /api/risks', async () => {
      const result = await loadTester.testEndpoint(
        'post',
        '/api/risks',
        {
          totalRequests: 30,
          concurrency: 3,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          payload: {
            title: 'Load Test Risk',
            severity: 'Medium',
            likelihood: 3,
            impact: 3,
          },
          expectedStatus: 201,
        }
      );

      expect(result.successfulRequests).toBeGreaterThan(25);
      expect(result.averageResponseTime).toBeLessThan(1000);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance SLA for health check', async () => {
      const result = await loadTester.testEndpoint('get', '/health', {
        totalRequests: 200,
        concurrency: 20,
      });

      // SLA: 95% of requests should complete in < 200ms
      expect(result.p95).toBeLessThan(200);
      // SLA: 99% of requests should complete in < 500ms
      expect(result.p99).toBeLessThan(500);
    });

    it('should handle burst traffic', async () => {
      const result = await loadTester.testEndpoint('get', '/health', {
        totalRequests: 500,
        concurrency: 100, // High concurrency
      });

      expect(result.successfulRequests).toBeGreaterThan(450);
      expect(result.averageResponseTime).toBeLessThan(500);
    });
  });
});

export { LoadTester, LoadTestResult };

