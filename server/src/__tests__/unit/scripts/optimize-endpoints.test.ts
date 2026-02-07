/**
 * Endpoint Optimizer Script Unit Tests
 * Verifies the exports and basic functionality of optimize-endpoints
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { EndpointOptimizer } from '../../../scripts/optimize-endpoints';
import type { EndpointAnalysis, OptimizationReport } from '../../../scripts/optimize-endpoints';

describe('optimize-endpoints', () => {
  describe('EndpointOptimizer export', () => {
    it('should export EndpointOptimizer as a class', () => {
      expect(EndpointOptimizer).toBeDefined();
      expect(typeof EndpointOptimizer).toBe('function');
    });

    it('should be instantiable', () => {
      const optimizer = new EndpointOptimizer();
      expect(optimizer).toBeInstanceOf(EndpointOptimizer);
    });
  });

  describe('analyzeEndpoint', () => {
    let optimizer: EndpointOptimizer;

    beforeEach(() => {
      optimizer = new EndpointOptimizer();
    });

    it('should accept endpoint analysis data without throwing', () => {
      expect(() => {
        optimizer.analyzeEndpoint('/api/test', 'GET', 150);
      }).not.toThrow();
    });

    it('should accept endpoint analysis data with optional query count', () => {
      expect(() => {
        optimizer.analyzeEndpoint('/api/test', 'GET', 150, 5);
      }).not.toThrow();
    });
  });

  describe('generateRecommendations', () => {
    let optimizer: EndpointOptimizer;

    beforeEach(() => {
      optimizer = new EndpointOptimizer();
    });

    it('should return an OptimizationReport when no data has been analyzed', () => {
      const report = optimizer.generateRecommendations();
      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(report.endpoints)).toBe(true);
      expect(Array.isArray(report.databaseOptimizations)).toBe(true);
      expect(Array.isArray(report.codeOptimizations)).toBe(true);
    });

    it('should return an empty endpoints array when no data has been analyzed', () => {
      const report = optimizer.generateRecommendations();
      expect(report.endpoints.length).toBe(0);
    });

    it('should return analysis results after analyzing endpoints', () => {
      optimizer.analyzeEndpoint('/api/test', 'GET', 150);
      optimizer.analyzeEndpoint('/api/test', 'GET', 200);

      const report = optimizer.generateRecommendations();
      expect(report.endpoints.length).toBe(1);
      expect(report.endpoints[0].endpoint).toBe('/api/test');
      expect(report.endpoints[0].method).toBe('GET');
      expect(report.endpoints[0].totalRequests).toBe(2);
    });

    it('should flag slow endpoints with issues and recommendations', () => {
      optimizer.analyzeEndpoint('/api/slow', 'POST', 2000);
      optimizer.analyzeEndpoint('/api/slow', 'POST', 1500);

      const report = optimizer.generateRecommendations();
      expect(report.endpoints[0].issues.length).toBeGreaterThan(0);
      expect(report.endpoints[0].recommendations.length).toBeGreaterThan(0);
    });

    it('should flag high query count endpoints', () => {
      optimizer.analyzeEndpoint('/api/heavy', 'GET', 500, 15);
      optimizer.analyzeEndpoint('/api/heavy', 'GET', 600, 20);

      const report = optimizer.generateRecommendations();
      const heavyEndpoint = report.endpoints.find((e) => e.endpoint === '/api/heavy');
      expect(heavyEndpoint).toBeDefined();
      expect(heavyEndpoint!.issues.some((i) => i.includes('query count'))).toBe(true);
    });

    it('should add code optimizations for very slow endpoints', () => {
      optimizer.analyzeEndpoint('/api/very-slow', 'GET', 3000);

      const report = optimizer.generateRecommendations();
      expect(report.codeOptimizations.length).toBeGreaterThan(0);
    });

    it('should sort endpoints by average response time descending', () => {
      optimizer.analyzeEndpoint('/api/fast', 'GET', 100);
      optimizer.analyzeEndpoint('/api/slow', 'GET', 2000);
      optimizer.analyzeEndpoint('/api/medium', 'GET', 500);

      const report = optimizer.generateRecommendations();
      expect(report.endpoints[0].endpoint).toBe('/api/slow');
      expect(report.endpoints[report.endpoints.length - 1].endpoint).toBe('/api/fast');
    });
  });
});
