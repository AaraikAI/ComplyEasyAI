/**
 * Endpoint Optimization Script
 * Analyzes and optimizes slow API endpoints
 */

import { QueryProfiler } from '../__tests__/performance/query-profiler';
import logger from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

interface EndpointAnalysis {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  slowRequests: number;
  totalRequests: number;
  issues: string[];
  recommendations: string[];
}

interface OptimizationReport {
  timestamp: Date;
  endpoints: EndpointAnalysis[];
  databaseOptimizations: string[];
  codeOptimizations: string[];
}

class EndpointOptimizer {
  private queryProfiler: QueryProfiler;
  private endpointMetrics: Map<string, any[]> = new Map();

  constructor() {
    this.queryProfiler = new QueryProfiler();
  }

  /**
   * Analyze endpoint performance
   */
  analyzeEndpoint(
    endpoint: string,
    method: string,
    responseTime: number,
    queryCount?: number
  ): void {
    const key = `${method}:${endpoint}`;
    if (!this.endpointMetrics.has(key)) {
      this.endpointMetrics.set(key, []);
    }

    this.endpointMetrics.get(key)!.push({
      responseTime,
      queryCount: queryCount || 0,
      timestamp: new Date(),
    });
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(): OptimizationReport {
    const endpoints: EndpointAnalysis[] = [];
    const databaseOptimizations: string[] = [];
    const codeOptimizations: string[] = [];

    // Analyze each endpoint
    this.endpointMetrics.forEach((metrics, key) => {
      const [method, endpoint] = key.split(':');
      const responseTimes = metrics.map((m) => m.responseTime);
      const queryCounts = metrics.map((m) => m.queryCount);

      const averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const slowRequests = responseTimes.filter((time) => time > 1000).length;
      const averageQueryCount =
        queryCounts.reduce((sum, count) => sum + count, 0) / queryCounts.length;

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Identify issues
      if (averageResponseTime > 1000) {
        issues.push(`High average response time: ${averageResponseTime.toFixed(2)}ms`);
        recommendations.push('Consider implementing caching');
        recommendations.push('Review database query optimization');
      }

      if (averageQueryCount > 10) {
        issues.push(`High query count: ${averageQueryCount.toFixed(1)} queries per request`);
        recommendations.push('Review for N+1 query patterns');
        recommendations.push('Consider using data loaders or batch queries');
        databaseOptimizations.push(
          `Endpoint ${endpoint}: Reduce query count from ${averageQueryCount.toFixed(1)} to < 5`
        );
      }

      if (slowRequests / metrics.length > 0.1) {
        issues.push(
          `${((slowRequests / metrics.length) * 100).toFixed(1)}% of requests are slow (>1s)`
        );
        recommendations.push('Investigate intermittent performance issues');
      }

      // Check for missing indexes
      if (endpoint.includes('/api/risks') && averageResponseTime > 500) {
        databaseOptimizations.push(
          'Consider adding index on riskItem(organizationId, status, createdAt)'
        );
      }

      if (endpoint.includes('/api/frameworks') && averageResponseTime > 500) {
        databaseOptimizations.push(
          'Consider adding index on complianceFramework(organizationId, status)'
        );
      }

      endpoints.push({
        endpoint,
        method,
        averageResponseTime,
        slowRequests,
        totalRequests: metrics.length,
        issues,
        recommendations,
      });
    });

    // General code optimizations
    if (endpoints.some((e) => e.averageResponseTime > 2000)) {
      codeOptimizations.push('Implement response caching for frequently accessed data');
      codeOptimizations.push('Consider using Redis for session and cache management');
    }

    if (endpoints.some((e) => e.slowRequests > 15)) {
      codeOptimizations.push('Implement GraphQL DataLoader pattern for batch loading');
      codeOptimizations.push('Review and optimize database queries with EXPLAIN ANALYZE');
    }

    return {
      timestamp: new Date(),
      endpoints: endpoints.sort((a, b) => b.averageResponseTime - a.averageResponseTime),
      databaseOptimizations: [...new Set(databaseOptimizations)],
      codeOptimizations: [...new Set(codeOptimizations)],
    };
  }

  /**
   * Generate optimization report
   */
  async generateReport(): Promise<void> {
    const report = this.generateRecommendations();
    const reportPath = path.join(__dirname, '../../reports/optimization');

    // Ensure reports directory exists
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const filename = `optimization-report-${Date.now()}.json`;
    const filepath = path.join(reportPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // Generate text report
    const textReport = this.generateTextReport(report);
    const textFilepath = path.join(reportPath, filename.replace('.json', '.txt'));
    fs.writeFileSync(textFilepath, textReport);

    logger.info(`Optimization report saved to ${filepath}`);
    console.log('\n' + textReport);
  }

  /**
   * Generate human-readable text report
   */
  private generateTextReport(report: OptimizationReport): string {
    let text = '\n';
    text += '='.repeat(80) + '\n';
    text += 'ENDPOINT OPTIMIZATION REPORT\n';
    text += '='.repeat(80) + '\n';
    text += `Generated: ${report.timestamp.toISOString()}\n\n`;

    // Slow Endpoints
    text += 'SLOW ENDPOINTS (>1000ms average)\n';
    text += '-'.repeat(80) + '\n';
    const slowEndpoints = report.endpoints.filter((e) => e.averageResponseTime > 1000);
    if (slowEndpoints.length === 0) {
      text += 'No slow endpoints detected.\n\n';
    } else {
      slowEndpoints.forEach((endpoint, index) => {
        text += `${index + 1}. ${endpoint.method} ${endpoint.endpoint}\n`;
        text += `   Avg Response Time: ${endpoint.averageResponseTime.toFixed(2)}ms\n`;
        text += `   Slow Requests: ${endpoint.slowRequests}/${endpoint.totalRequests}\n`;
        if (endpoint.issues.length > 0) {
          text += `   Issues:\n`;
          endpoint.issues.forEach((issue) => {
            text += `     - ${issue}\n`;
          });
        }
        if (endpoint.recommendations.length > 0) {
          text += `   Recommendations:\n`;
          endpoint.recommendations.forEach((rec) => {
            text += `     - ${rec}\n`;
          });
        }
        text += '\n';
      });
    }

    // Database Optimizations
    text += '\nDATABASE OPTIMIZATIONS\n';
    text += '-'.repeat(80) + '\n';
    if (report.databaseOptimizations.length === 0) {
      text += 'No database optimizations recommended.\n\n';
    } else {
      report.databaseOptimizations.forEach((opt, index) => {
        text += `${index + 1}. ${opt}\n`;
      });
      text += '\n';
    }

    // Code Optimizations
    text += '\nCODE OPTIMIZATIONS\n';
    text += '-'.repeat(80) + '\n';
    if (report.codeOptimizations.length === 0) {
      text += 'No code optimizations recommended.\n\n';
    } else {
      report.codeOptimizations.forEach((opt, index) => {
        text += `${index + 1}. ${opt}\n`;
      });
      text += '\n';
    }

    text += '='.repeat(80) + '\n';

    return text;
  }
}

export { EndpointOptimizer, EndpointAnalysis, OptimizationReport };

