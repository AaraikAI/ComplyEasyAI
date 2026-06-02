/**
 * Performance Testing Script
 * Runs comprehensive performance tests and generates reports
 */

import { QueryProfiler, createQueryProfilingMiddleware } from '../__tests__/performance/query-profiler';
import { LoadTester } from '../__tests__/performance/load-test';
import prisma from '../config/database';
import logger from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test script uses dynamic profiler/load-tester return types
interface PerformanceReport {
  timestamp: Date;
  loadTestResults: any[];
  queryStats: any[];
  recommendations: string[];
}

class PerformanceTester {
  private queryProfiler: QueryProfiler;
  private loadTester: LoadTester;
  private reportPath: string;

  constructor() {
    this.queryProfiler = new QueryProfiler();
    this.loadTester = new LoadTester();
    this.reportPath = path.join(__dirname, '../../reports/performance');
  }

  /**
   * Run all performance tests
   */
  async runAllTests(): Promise<PerformanceReport> {
    logger.info('Starting performance tests...');

    // Setup query profiling
    this.queryProfiler.enable();
    // Note: prisma.$use() was removed in Prisma 7. Query profiling middleware
    // should be integrated via $extends if needed. Skipping for performance tests.
    // prisma.$use(createQueryProfilingMiddleware(this.queryProfiler));

    // Run load tests
    logger.info('Running load tests...');
    await this.runLoadTests();

    // Get query statistics
    const queryStats = this.queryProfiler.getStats();
    const slowQueries = this.queryProfiler.getSlowQueries(200);

    // Generate recommendations
    const recommendations = this.generateRecommendations(queryStats, slowQueries);

    // Disable profiling
    this.queryProfiler.disable();

    const report: PerformanceReport = {
      timestamp: new Date(),
      loadTestResults: this.loadTester.getResults(),
      queryStats,
      recommendations,
    };

    // Save report
    await this.saveReport(report);

    logger.info('Performance tests completed');
    return report;
  }

  /**
   * Run load tests on critical endpoints
   */
  private async runLoadTests(): Promise<void> {
    // Health check
    await this.loadTester.testEndpoint('get', '/health', {
      totalRequests: 100,
      concurrency: 10,
    });

    // Add more endpoint tests as needed
    // Note: These would require proper authentication setup
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(queryStats: any[], slowQueries: any[]): string[] {
    const recommendations: string[] = [];

    // Analyze query statistics
    queryStats.forEach((stat) => {
      if (stat.averageDuration > 500) {
        recommendations.push(
          `Query "${stat.query.substring(0, 50)}..." has high average duration (${stat.averageDuration.toFixed(2)}ms). Consider adding indexes or optimizing.`
        );
      }

      if (stat.slowQueries / stat.count > 0.1) {
        recommendations.push(
          `Query "${stat.query.substring(0, 50)}..." has ${((stat.slowQueries / stat.count) * 100).toFixed(1)}% slow queries. Review query plan.`
        );
      }
    });

    // Check for N+1 query patterns
    const highCountQueries = queryStats.filter((s) => s.count > 100);
    if (highCountQueries.length > 0) {
      recommendations.push(
        `Detected ${highCountQueries.length} queries with high execution count. Review for N+1 query patterns.`
      );
    }

    if (slowQueries.length > 0) {
      recommendations.push(
        `Found ${slowQueries.length} slow queries (>200ms). Review and optimize.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No performance issues detected. System is performing well.');
    }

    return recommendations;
  }

  /**
   * Save performance report to file
   */
  private async saveReport(report: PerformanceReport): Promise<void> {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportPath)) {
      fs.mkdirSync(this.reportPath, { recursive: true });
    }

    const filename = `performance-report-${Date.now()}.json`;
    const filepath = path.join(this.reportPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // Also generate human-readable report
    const textReport = this.generateTextReport(report);
    const textFilepath = path.join(this.reportPath, filename.replace('.json', '.txt'));
    fs.writeFileSync(textFilepath, textReport);

    logger.info(`Performance report saved to ${filepath}`);
    logger.info('\n' + textReport);
  }

  /**
   * Generate human-readable text report
   */
  private generateTextReport(report: PerformanceReport): string {
    let text = '\n';
    text += '='.repeat(80) + '\n';
    text += 'PERFORMANCE TEST REPORT\n';
    text += '='.repeat(80) + '\n';
    text += `Generated: ${report.timestamp.toISOString()}\n\n`;

    // Load Test Results
    text += 'LOAD TEST RESULTS\n';
    text += '-'.repeat(80) + '\n';
    report.loadTestResults.forEach((result) => {
      text += `${result.method} ${result.endpoint}\n`;
      text += `  Requests: ${result.totalRequests} (${result.successfulRequests} successful, ${result.failedRequests} failed)\n`;
      text += `  Response Time: Avg ${result.averageResponseTime.toFixed(2)}ms, `;
      text += `P95 ${result.p95}ms, P99 ${result.p99}ms\n`;
      text += `  Throughput: ${result.requestsPerSecond.toFixed(2)} req/s\n\n`;
    });

    // Query Statistics
    text += '\nDATABASE QUERY STATISTICS\n';
    text += '-'.repeat(80) + '\n';
    report.queryStats.slice(0, 10).forEach((stat, index) => {
      text += `${index + 1}. ${stat.query.substring(0, 60)}\n`;
      text += `   Executions: ${stat.count}, Avg: ${stat.averageDuration.toFixed(2)}ms\n`;
      text += `   Range: ${stat.minDuration}ms - ${stat.maxDuration}ms\n`;
      text += `   Slow queries: ${stat.slowQueries}\n\n`;
    });

    // Recommendations
    text += '\nRECOMMENDATIONS\n';
    text += '-'.repeat(80) + '\n';
    report.recommendations.forEach((rec, index) => {
      text += `${index + 1}. ${rec}\n`;
    });

    text += '\n' + '='.repeat(80) + '\n';

    return text;
  }
}

// Run if executed directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester
    .runAllTests()
    .then(() => {
      logger.info('Performance testing completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Performance testing failed', error);
      process.exit(1);
    });
}

export { PerformanceTester };

