/**
 * Anchor SLA recorder.
 *
 * Tracks per-attempt blockchain-anchor latency in an in-process ring buffer and
 * exposes a summary (p50/p95/p99 + sample count) for the admin SLA endpoint.
 *
 * Per-process only — multi-replica deployments will see one window per replica.
 * Migration to a shared store (Redis/Prometheus) is tracked as a follow-up.
 */

const RING_CAPACITY = 1000;

export const ANCHOR_SLA_TARGET = {
  p50Ms: 15_000,
  p95Ms: 60_000,
} as const;

const durations: number[] = [];
let writeIndex = 0;
let totalRecorded = 0;
let lastUpdated: Date | null = null;

export function recordAnchorDuration(
  ms: number,
  network: string = 'unknown',
  result: 'success' | 'failure' = 'success'
): void {
  if (!Number.isFinite(ms) || ms < 0) return;
  if (durations.length < RING_CAPACITY) {
    durations.push(ms);
  } else {
    durations[writeIndex] = ms;
    writeIndex = (writeIndex + 1) % RING_CAPACITY;
  }
  totalRecorded += 1;
  lastUpdated = new Date();

  // Also push to Prometheus registry (best-effort — never throw from a recorder).
  try {
    // Inline require avoids a hard dep cycle if metrics module fails to load.
    const { observeAnchorDuration } = require('./metrics');
    observeAnchorDuration(ms, network, result);
  } catch {
    // Metrics module unavailable; in-process ring buffer still has the data.
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

export interface AnchorSLASummary {
  p50: number;
  p95: number;
  p99: number;
  sampleCount: number;
  totalRecorded: number;
  windowCapacity: number;
  lastUpdated: Date | null;
  target: { p50Ms: number; p95Ms: number };
  withinTarget: { p50: boolean; p95: boolean };
}

export function summarizeAnchorSLA(): AnchorSLASummary {
  const sorted = [...durations].sort((a, b) => a - b);
  const p50 = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  const p99 = percentile(sorted, 0.99);
  return {
    p50,
    p95,
    p99,
    sampleCount: sorted.length,
    totalRecorded,
    windowCapacity: RING_CAPACITY,
    lastUpdated,
    target: { p50Ms: ANCHOR_SLA_TARGET.p50Ms, p95Ms: ANCHOR_SLA_TARGET.p95Ms },
    withinTarget: {
      p50: sorted.length === 0 ? true : p50 <= ANCHOR_SLA_TARGET.p50Ms,
      p95: sorted.length === 0 ? true : p95 <= ANCHOR_SLA_TARGET.p95Ms,
    },
  };
}

export function resetAnchorSLA(): void {
  durations.length = 0;
  writeIndex = 0;
  totalRecorded = 0;
  lastUpdated = null;
}
