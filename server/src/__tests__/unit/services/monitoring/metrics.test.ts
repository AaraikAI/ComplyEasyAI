/**
 * Prometheus metrics registry + helpers.
 */

import { describe, it, expect } from '@jest/globals';
import {
  registry,
  anchorDurationSeconds,
  anchorAttemptsTotal,
  anchorRetriesEnqueued,
  anchorPermanentFailures,
  attestationsCreatedTotal,
  userSigningKeysGeneratedTotal,
  observeAnchorDuration,
  getMetricsExposition,
} from '../../../../services/monitoring/metrics';

describe('Prometheus metrics module', () => {
  it('registers expected metrics by name', async () => {
    const text = await registry.metrics();
    expect(text).toContain('anchor_duration_seconds');
    expect(text).toContain('anchor_attempts_total');
    expect(text).toContain('anchor_retries_enqueued_total');
    expect(text).toContain('anchor_permanent_failures_total');
    expect(text).toContain('evidence_attestations_created_total');
    expect(text).toContain('user_signing_keys_generated_total');
    expect(text).toContain('http_request_duration_seconds');
  });

  it('observeAnchorDuration records into the histogram + counter', async () => {
    observeAnchorDuration(12_500, 'polygon', 'success');
    observeAnchorDuration(45_000, 'ethereum', 'failure');

    const histogram = await anchorDurationSeconds.get();
    const counter = await anchorAttemptsTotal.get();
    expect(histogram.values.length).toBeGreaterThan(0);
    expect(counter.values.length).toBeGreaterThan(0);

    // Increment the others — proves the counter labels are accepted
    anchorRetriesEnqueued.labels('polygon').inc();
    anchorPermanentFailures.labels('polygon').inc();
    attestationsCreatedTotal.labels('SHA256-RSA').inc(3);
    userSigningKeysGeneratedTotal.inc();

    const exposition = await getMetricsExposition();
    expect(exposition.contentType).toMatch(/text\/plain/);
    expect(exposition.body).toContain('anchor_retries_enqueued_total');
  });
});
