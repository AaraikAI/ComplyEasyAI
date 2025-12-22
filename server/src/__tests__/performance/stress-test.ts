/**
 * Stress Testing Suite
 * Tests system behavior under extreme load conditions
 */

import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../index';
import { LoadTester } from './load-test';

interface StressTestResult {
  testName: string;
  totalRequests: number;
  concurrency: number;
  duration: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageResponseTime: number;
  p95: number;
  p99: number;
  throughput: number;
  breakdown: {
    status200: number;
    status400: number;
    status401: number;
    status429: number;
    status500: number;
    timeouts: number;
  };
}

class StressTester {
  private loadTester: LoadTester;
  private results: StressTestResult[] = [];

  constructor() {
    this.loadTester = new LoadTester();
  }

  /**
   * Run stress test with increasing load
   */
  async runStressTest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    options: {
      baseRequests?: number;
      maxConcurrency?: number;
      steps?: number;
      payload?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<StressTestResult[]> {
    const {
      baseRequests = 50,
      maxConcurrency = 100,
      steps = 5,
      payload,
      headers = {},
    } = options;

    const results: StressTestResult[] = [];

    for (let step = 1; step <= steps; step++) {
      const requests = baseRequests * step;
      const concurrency = Math.min(maxConcurrency, Math.floor(requests / 2));

      console.log(`\nStress Test Step ${step}/${steps}: ${requests} requests, ${concurrency} concurrent`);

      const startTime = Date.now();
      const result = await this.loadTester.testEndpoint(method, endpoint, {
        totalRequests: requests,
        concurrency,
        payload,
        headers,
      });
      const duration = (Date.now() - startTime) / 1000;

      const errorRate = (result.failedRequests / result.totalRequests) * 100;

      const stressResult: StressTestResult = {
        testName: `${method.toUpperCase()} ${endpoint}`,
        totalRequests: requests,
        concurrency,
        duration,
        successfulRequests: result.successfulRequests,
        failedRequests: result.failedRequests,
        errorRate,
        averageResponseTime: result.averageResponseTime,
        p95: result.p95,
        p99: result.p99,
        throughput: result.requestsPerSecond,
        breakdown: {
          status200: 0,
          status400: 0,
          status401: 0,
          status429: 0,
          status500: 0,
          timeouts: 0,
        },
      };

      results.push(stressResult);

      // Check if system is degrading
      if (errorRate > 50) {
        console.warn(`⚠️  High error rate detected: ${errorRate.toFixed(2)}%`);
        break;
      }

      if (result.averageResponseTime > 5000) {
        console.warn(`⚠️  High response time detected: ${result.averageResponseTime.toFixed(2)}ms`);
      }
    }

    this.results.push(...results);
    return results;
  }

  /**
   * Test system recovery after load
   */
  async testRecovery(endpoint: string): Promise<boolean> {
    console.log('\nTesting system recovery...');

    // Wait for system to stabilize
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Run normal load test
    const result = await this.loadTester.testEndpoint('get', endpoint, {
      totalRequests: 10,
      concurrency: 1,
    });

    const recovered = result.successfulRequests === result.totalRequests &&
      result.averageResponseTime < 500;

    console.log(`System recovery: ${recovered ? '✅ Recovered' : '❌ Not recovered'}`);

    return recovered;
  }

  /**
   * Test memory leak detection
   */
  async testMemoryLeaks(endpoint: string, iterations: number = 10): Promise<{
    initialMemory: number;
    finalMemory: number;
    memoryIncrease: number;
    leakDetected: boolean;
  }> {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      await this.loadTester.testEndpoint('get', endpoint, {
        totalRequests: 100,
        concurrency: 10,
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const leakDetected = memoryIncrease > 50 * 1024 * 1024; // 50MB threshold

    return {
      initialMemory,
      finalMemory,
      memoryIncrease,
      leakDetected,
    };
  }

  /**
   * Generate stress test report
   */
  generateReport(): string {
    let report = '\n';
    report += '='.repeat(80) + '\n';
    report += 'STRESS TEST REPORT\n';
    report += '='.repeat(80) + '\n\n';

    this.results.forEach((result, index) => {
      report += `Test ${index + 1}: ${result.testName}\n`;
      report += `  Requests: ${result.totalRequests} (${result.concurrency} concurrent)\n`;
      report += `  Duration: ${result.duration.toFixed(2)}s\n`;
      report += `  Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`;
      report += `  Error Rate: ${result.errorRate.toFixed(2)}%\n`;
      report += `  Avg Response Time: ${result.averageResponseTime.toFixed(2)}ms\n`;
      report += `  P95: ${result.p95}ms, P99: ${result.p99}ms\n`;
      report += `  Throughput: ${result.throughput.toFixed(2)} req/s\n\n`;
    });

    report += '='.repeat(80) + '\n';

    return report;
  }

  getResults(): StressTestResult[] {
    return this.results;
  }
}

describe('Stress Testing', () => {
  let stressTester: StressTester;

  beforeAll(() => {
    stressTester = new StressTester();
  });

  afterAll(() => {
    console.log(stressTester.generateReport());
  });

  describe('Gradual Load Increase', () => {
    it('should handle gradual load increase on health endpoint', async () => {
      const results = await stressTester.runStressTest('get', '/health', {
        baseRequests: 50,
        maxConcurrency: 50,
        steps: 5,
      });

      // System should handle at least 3 steps without degradation
      expect(results.length).toBeGreaterThanOrEqual(3);

      // Error rate should remain low
      const finalResult = results[results.length - 1];
      expect(finalResult.errorRate).toBeLessThan(10);
    });
  });

  describe('Burst Traffic', () => {
    it('should handle sudden burst of traffic', async () => {
      const result = await stressTester.loadTester.testEndpoint('get', '/health', {
        totalRequests: 1000,
        concurrency: 200, // Very high concurrency
      });

      expect(result.successfulRequests).toBeGreaterThan(800);
      expect(result.averageResponseTime).toBeLessThan(2000);
    });
  });

  describe('System Recovery', () => {
    it('should recover after high load', async () => {
      // Apply high load
      await stressTester.loadTester.testEndpoint('get', '/health', {
        totalRequests: 500,
        concurrency: 100,
      });

      // Test recovery
      const recovered = await stressTester.testRecovery('/health');

      expect(recovered).toBe(true);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not have significant memory leaks', async () => {
      const memoryTest = await stressTester.testMemoryLeaks('/health', 10);

      expect(memoryTest.leakDetected).toBe(false);
      expect(memoryTest.memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });

  describe('Endpoint Stress Tests', () => {
    it('should handle stress on API endpoints', async () => {
      const results = await stressTester.runStressTest('get', '/api/frameworks', {
        baseRequests: 20,
        maxConcurrency: 20,
        steps: 3,
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      // Should complete at least 2 steps
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });
});

export { StressTester, StressTestResult };

