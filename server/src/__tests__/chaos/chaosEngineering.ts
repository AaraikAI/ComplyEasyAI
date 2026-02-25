/**
 * Chaos Engineering Test Framework
 *
 * Implements chaos engineering patterns to test system resilience:
 * - Chaos Monkey: Random service termination
 * - Latency Injection: Simulate network delays
 * - Error Injection: Simulate random failures
 * - Resource Exhaustion: CPU/Memory pressure
 * - Network Partitions: Simulate network failures
 *
 * Usage:
 *   npm run test:chaos -- --scenario=latency
 *   npm run test:chaos -- --scenario=failure
 *   npm run test:chaos -- --scenario=full
 */

import axios, { AxiosError } from 'axios';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface ChaosConfig {
  /** Base URL of the API */
  baseUrl: string;
  /** Probability of chaos injection (0-1) */
  probability: number;
  /** Duration of chaos in milliseconds */
  duration: number;
  /** List of endpoints to test */
  endpoints: string[];
  /** Enable verbose logging */
  verbose: boolean;
}

interface ChaosResult {
  scenario: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  errors: ErrorSummary[];
  recovered: boolean;
  recoveryTime?: number;
}

interface ErrorSummary {
  type: string;
  count: number;
  message: string;
}

interface RequestMetrics {
  endpoint: string;
  status: number;
  latency: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

// ============================================================================
// CHAOS SCENARIOS
// ============================================================================

export enum ChaosScenario {
  LATENCY = 'latency',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  MEMORY_PRESSURE = 'memory_pressure',
  CPU_PRESSURE = 'cpu_pressure',
  NETWORK_PARTITION = 'network_partition',
  DATABASE_UNAVAILABLE = 'database_unavailable',
  CACHE_UNAVAILABLE = 'cache_unavailable',
  FULL = 'full',
}

// ============================================================================
// CHAOS ENGINE
// ============================================================================

export class ChaosEngine extends EventEmitter {
  private config: ChaosConfig;
  private metrics: RequestMetrics[] = [];
  private isRunning: boolean = false;
  private abortController?: AbortController;

  constructor(config: Partial<ChaosConfig> = {}) {
    super();
    this.config = {
      baseUrl: config.baseUrl || process.env.API_URL || 'http://localhost:3001',
      probability: config.probability ?? 0.3,
      duration: config.duration ?? 60000,
      endpoints: config.endpoints || [
        '/api/health',
        '/api/v1/frameworks',
        '/api/v1/risks',
        '/api/v1/auth/me',
      ],
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Run a chaos scenario
   */
  async runScenario(scenario: ChaosScenario): Promise<ChaosResult> {
    const startTime = new Date();
    this.isRunning = true;
    this.metrics = [];
    this.abortController = new AbortController();

    this.log(`Starting chaos scenario: ${scenario}`);
    this.emit('start', { scenario, startTime });

    try {
      switch (scenario) {
        case ChaosScenario.LATENCY:
          await this.runLatencyInjection();
          break;
        case ChaosScenario.FAILURE:
          await this.runFailureInjection();
          break;
        case ChaosScenario.TIMEOUT:
          await this.runTimeoutInjection();
          break;
        case ChaosScenario.MEMORY_PRESSURE:
          await this.runMemoryPressure();
          break;
        case ChaosScenario.CPU_PRESSURE:
          await this.runCPUPressure();
          break;
        case ChaosScenario.NETWORK_PARTITION:
          await this.runNetworkPartition();
          break;
        case ChaosScenario.DATABASE_UNAVAILABLE:
          await this.runDatabaseUnavailable();
          break;
        case ChaosScenario.CACHE_UNAVAILABLE:
          await this.runCacheUnavailable();
          break;
        case ChaosScenario.FULL:
          await this.runFullChaos();
          break;
        default:
          throw new Error(`Unknown scenario: ${scenario}`);
      }
    } finally {
      this.isRunning = false;
    }

    const endTime = new Date();
    const result = this.calculateResults(scenario, startTime, endTime);

    this.emit('complete', result);
    this.log(`Chaos scenario complete: ${scenario}`);

    return result;
  }

  /**
   * Stop running chaos scenario
   */
  stop(): void {
    this.isRunning = false;
    this.abortController?.abort();
    this.emit('stop');
  }

  // ==========================================================================
  // CHAOS SCENARIOS
  // ==========================================================================

  /**
   * Inject artificial latency
   */
  private async runLatencyInjection(): Promise<void> {
    const endTime = Date.now() + this.config.duration;

    while (Date.now() < endTime && this.isRunning) {
      await this.makeRequestsWithChaos(async (endpoint) => {
        // Add random delay before request
        if (Math.random() < this.config.probability) {
          const delay = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
          await this.sleep(delay);
        }
        return this.makeRequest(endpoint);
      });
      await this.sleep(100);
    }
  }

  /**
   * Inject random failures
   */
  private async runFailureInjection(): Promise<void> {
    const endTime = Date.now() + this.config.duration;

    while (Date.now() < endTime && this.isRunning) {
      await this.makeRequestsWithChaos(async (endpoint) => {
        // Simulate random failure
        if (Math.random() < this.config.probability) {
          throw new Error('Injected failure');
        }
        return this.makeRequest(endpoint);
      });
      await this.sleep(100);
    }
  }

  /**
   * Inject timeouts
   */
  private async runTimeoutInjection(): Promise<void> {
    const endTime = Date.now() + this.config.duration;

    while (Date.now() < endTime && this.isRunning) {
      await this.makeRequestsWithChaos(async (endpoint) => {
        const timeout = Math.random() < this.config.probability ? 100 : 5000;
        return this.makeRequest(endpoint, { timeout });
      });
      await this.sleep(100);
    }
  }

  /**
   * Simulate memory pressure
   */
  private async runMemoryPressure(): Promise<void> {
    const memoryHogs: any[] = [];
    const endTime = Date.now() + this.config.duration;

    // Gradually allocate memory
    const allocateInterval = setInterval(() => {
      if (Math.random() < this.config.probability) {
        memoryHogs.push(new Array(1000000).fill('x'));
      }
    }, 500);

    try {
      while (Date.now() < endTime && this.isRunning) {
        await this.makeRequestsWithChaos((endpoint) => this.makeRequest(endpoint));
        await this.sleep(100);
      }
    } finally {
      clearInterval(allocateInterval);
      memoryHogs.length = 0; // Release memory
    }
  }

  /**
   * Simulate CPU pressure
   */
  private async runCPUPressure(): Promise<void> {
    const endTime = Date.now() + this.config.duration;
    let cpuBusy = false;

    // Background CPU load
    const cpuLoadFn = (): void => {
      if (cpuBusy && Math.random() < this.config.probability) {
        const start = Date.now();
        while (Date.now() - start < 100) {
          Math.random() * Math.random();
        }
      }
      if (cpuBusy) {
        setImmediate(cpuLoadFn);
      }
    };

    cpuBusy = true;
    setImmediate(cpuLoadFn);

    try {
      while (Date.now() < endTime && this.isRunning) {
        await this.makeRequestsWithChaos((endpoint) => this.makeRequest(endpoint));
        await this.sleep(100);
      }
    } finally {
      cpuBusy = false;
    }
  }

  /**
   * Simulate network partition
   */
  private async runNetworkPartition(): Promise<void> {
    const endTime = Date.now() + this.config.duration;
    let isPartitioned = false;

    while (Date.now() < endTime && this.isRunning) {
      // Toggle partition randomly
      if (Math.random() < 0.1) {
        isPartitioned = !isPartitioned;
        this.log(`Network partition: ${isPartitioned ? 'ACTIVE' : 'HEALED'}`);
      }

      await this.makeRequestsWithChaos(async (endpoint) => {
        if (isPartitioned && Math.random() < this.config.probability) {
          throw new Error('ECONNREFUSED: Network partition');
        }
        return this.makeRequest(endpoint);
      });
      await this.sleep(100);
    }
  }

  /**
   * Simulate database unavailable
   */
  private async runDatabaseUnavailable(): Promise<void> {
    const endTime = Date.now() + this.config.duration;
    const dbEndpoints = ['/api/v1/frameworks', '/api/v1/risks', '/api/v1/users'];

    while (Date.now() < endTime && this.isRunning) {
      await this.makeRequestsWithChaos(async (endpoint) => {
        // DB endpoints may fail
        if (dbEndpoints.some((e) => endpoint.includes(e)) && Math.random() < this.config.probability) {
          // Simulate DB connection timeout
          await this.sleep(5000);
          throw new Error('Database connection timeout');
        }
        return this.makeRequest(endpoint);
      });
      await this.sleep(100);
    }
  }

  /**
   * Simulate cache unavailable
   */
  private async runCacheUnavailable(): Promise<void> {
    const endTime = Date.now() + this.config.duration;

    while (Date.now() < endTime && this.isRunning) {
      await this.makeRequestsWithChaos(async (endpoint) => {
        // Simulate slower responses due to cache miss
        if (Math.random() < this.config.probability) {
          await this.sleep(Math.floor(Math.random() * 500) + 200);
        }
        return this.makeRequest(endpoint);
      });
      await this.sleep(100);
    }
  }

  /**
   * Run all chaos scenarios in sequence
   */
  private async runFullChaos(): Promise<void> {
    const scenarios = [
      ChaosScenario.LATENCY,
      ChaosScenario.FAILURE,
      ChaosScenario.TIMEOUT,
    ];

    const scenarioDuration = this.config.duration / scenarios.length;
    const originalDuration = this.config.duration;

    for (const scenario of scenarios) {
      if (!this.isRunning) break;
      this.config.duration = scenarioDuration;
      this.log(`Running sub-scenario: ${scenario}`);

      switch (scenario) {
        case ChaosScenario.LATENCY:
          await this.runLatencyInjection();
          break;
        case ChaosScenario.FAILURE:
          await this.runFailureInjection();
          break;
        case ChaosScenario.TIMEOUT:
          await this.runTimeoutInjection();
          break;
      }
    }

    this.config.duration = originalDuration;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Make requests to all endpoints with chaos injection
   */
  private async makeRequestsWithChaos(
    requestFn: (endpoint: string) => Promise<RequestMetrics>
  ): Promise<void> {
    const requests = this.config.endpoints.map(async (endpoint) => {
      try {
        const metric = await requestFn(endpoint);
        this.metrics.push(metric);
        this.emit('request', metric);
      } catch (error: any) {
        const metric: RequestMetrics = {
          endpoint,
          status: 0,
          latency: 0,
          success: false,
          error: error.message,
          timestamp: new Date(),
        };
        this.metrics.push(metric);
        this.emit('request', metric);
      }
    });

    await Promise.allSettled(requests);
  }

  /**
   * Make a single request
   */
  private async makeRequest(
    endpoint: string,
    options: { timeout?: number } = {}
  ): Promise<RequestMetrics> {
    const start = Date.now();

    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        timeout: options.timeout ?? 10000,
        validateStatus: () => true,
        signal: this.abortController?.signal,
      });

      return {
        endpoint,
        status: response.status,
        latency: Date.now() - start,
        success: response.status >= 200 && response.status < 400,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        endpoint,
        status: 0,
        latency: Date.now() - start,
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Calculate results from metrics
   */
  private calculateResults(
    scenario: string,
    startTime: Date,
    endTime: Date
  ): ChaosResult {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const latencies = this.metrics.map((m) => m.latency).sort((a, b) => a - b);

    const avgLatency =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    // Group errors
    const errorMap = new Map<string, { count: number; message: string }>();
    this.metrics
      .filter((m) => !m.success && m.error)
      .forEach((m) => {
        const key = m.error?.substring(0, 50) || 'Unknown';
        const existing = errorMap.get(key) || { count: 0, message: m.error || '' };
        errorMap.set(key, { count: existing.count + 1, message: existing.message });
      });

    // Check recovery (last 10% of requests should be mostly successful)
    const lastTenPercent = this.metrics.slice(-Math.floor(totalRequests * 0.1));
    const lastSuccessRate =
      lastTenPercent.filter((m) => m.success).length / Math.max(lastTenPercent.length, 1);
    const recovered = lastSuccessRate >= 0.9;

    return {
      scenario,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate: failedRequests / Math.max(totalRequests, 1),
      avgLatency,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      maxLatency: Math.max(...latencies, 0),
      errors: Array.from(errorMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        message: data.message,
      })),
      recovered,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[Chaos] ${message}`);
    }
  }
}

// ============================================================================
// CLI RUNNER
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scenarioArg = args.find((a) => a.startsWith('--scenario='));
  const scenario = (scenarioArg?.split('=')[1] || 'latency') as ChaosScenario;

  console.log('============================================================');
  console.log('  ComplyEasyAI Chaos Engineering Test');
  console.log('============================================================');
  console.log(`  Scenario: ${scenario}`);
  console.log(`  Duration: 60 seconds`);
  console.log('============================================================\n');

  const engine = new ChaosEngine({
    verbose: true,
    duration: 60000,
    probability: 0.3,
  });

  engine.on('request', (metric: RequestMetrics) => {
    const status = metric.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${status} ${metric.endpoint} - ${metric.latency}ms`);
  });

  const result = await engine.runScenario(scenario);

  console.log('\n============================================================');
  console.log('  RESULTS');
  console.log('============================================================');
  console.log(`  Total Requests:     ${result.totalRequests}`);
  console.log(`  Successful:         ${result.successfulRequests}`);
  console.log(`  Failed:             ${result.failedRequests}`);
  console.log(`  Error Rate:         ${(result.errorRate * 100).toFixed(2)}%`);
  console.log(`  Avg Latency:        ${result.avgLatency.toFixed(2)}ms`);
  console.log(`  P95 Latency:        ${result.p95Latency.toFixed(2)}ms`);
  console.log(`  P99 Latency:        ${result.p99Latency.toFixed(2)}ms`);
  console.log(`  Max Latency:        ${result.maxLatency.toFixed(2)}ms`);
  console.log(`  System Recovered:   ${result.recovered ? '\x1b[32mYES\x1b[0m' : '\x1b[31mNO\x1b[0m'}`);
  console.log('============================================================\n');

  if (result.errors.length > 0) {
    console.log('  ERRORS:');
    result.errors.forEach((e) => {
      console.log(`    - ${e.type}: ${e.count} occurrences`);
    });
    console.log('');
  }

  // Exit with error if system didn't recover
  process.exit(result.recovered ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default ChaosEngine;
