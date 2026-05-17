/**
 * Prometheus metrics registry.
 *
 * Exposes per-operation histograms and counters for the Evidence Truth Layer
 * and general HTTP request flow. Scraped at GET /metrics (no auth — restrict
 * via network/firewall as is standard for Prometheus exporters).
 */

import client from 'prom-client';

export const registry = new client.Registry();

// Default process metrics (CPU, memory, GC, event loop lag, file descriptors)
client.collectDefaultMetrics({ register: registry });

// ============================================================================
// HTTP request metrics
// ============================================================================

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds, partitioned by method/route/status',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests, partitioned by method/route/status',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

// ============================================================================
// Blockchain anchor metrics
// ============================================================================

export const anchorDurationSeconds = new client.Histogram({
  name: 'anchor_duration_seconds',
  help: 'Blockchain anchor attempt duration, partitioned by network and result',
  labelNames: ['network', 'result'] as const,
  buckets: [1, 2.5, 5, 10, 15, 30, 60, 120, 300],
  registers: [registry],
});

export const anchorAttemptsTotal = new client.Counter({
  name: 'anchor_attempts_total',
  help: 'Total blockchain anchor attempts, partitioned by network and result',
  labelNames: ['network', 'result'] as const,
  registers: [registry],
});

export const anchorRetriesEnqueued = new client.Counter({
  name: 'anchor_retries_enqueued_total',
  help: 'Total anchor retry jobs enqueued after inline failure',
  labelNames: ['network'] as const,
  registers: [registry],
});

export const anchorPermanentFailures = new client.Counter({
  name: 'anchor_permanent_failures_total',
  help: 'Total anchor jobs that reached the final retry attempt and failed',
  labelNames: ['network'] as const,
  registers: [registry],
});

// ============================================================================
// Evidence Truth Layer metrics
// ============================================================================

export const attestationsCreatedTotal = new client.Counter({
  name: 'evidence_attestations_created_total',
  help: 'Total evidence attestations created (each party is one increment)',
  labelNames: ['algorithm'] as const,
  registers: [registry],
});

export const userSigningKeysGeneratedTotal = new client.Counter({
  name: 'user_signing_keys_generated_total',
  help: 'Total per-user signing keys generated (lazy creation)',
  registers: [registry],
});

// ============================================================================
// Helpers
// ============================================================================

export function observeAnchorDuration(ms: number, network: string, result: 'success' | 'failure'): void {
  anchorDurationSeconds.labels(network, result).observe(ms / 1000);
  anchorAttemptsTotal.labels(network, result).inc();
}

export async function getMetricsExposition(): Promise<{ contentType: string; body: string }> {
  return {
    contentType: registry.contentType,
    body: await registry.metrics(),
  };
}
