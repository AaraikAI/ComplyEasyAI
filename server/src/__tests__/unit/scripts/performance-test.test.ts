/**
 * Performance Tester Script Unit Tests
 * Verifies the exports of performance-test
 */

import { jest, describe, it, expect } from '@jest/globals';

// Mock all external dependencies before importing
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    $use: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../performance/query-profiler', () => ({
  QueryProfiler: jest.fn().mockImplementation(() => ({
    enable: jest.fn(),
    disable: jest.fn(),
    getStats: jest.fn().mockReturnValue([]),
    getSlowQueries: jest.fn().mockReturnValue([]),
  })),
  createQueryProfilingMiddleware: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('../../performance/load-test', () => ({
  LoadTester: jest.fn().mockImplementation(() => ({
    testEndpoint: jest.fn().mockResolvedValue(undefined),
    getResults: jest.fn().mockReturnValue([]),
  })),
}));

describe('performance-test', () => {
  it('should export PerformanceTester as a class', async () => {
    const { PerformanceTester } = await import('../../../scripts/performance-test');
    expect(PerformanceTester).toBeDefined();
    expect(typeof PerformanceTester).toBe('function');
  });

  it('should be instantiable', async () => {
    const { PerformanceTester } = await import('../../../scripts/performance-test');
    const tester = new PerformanceTester();
    expect(tester).toBeInstanceOf(PerformanceTester);
  });

  it('should have a runAllTests method', async () => {
    const { PerformanceTester } = await import('../../../scripts/performance-test');
    const tester = new PerformanceTester();
    expect(typeof tester.runAllTests).toBe('function');
  });
});
