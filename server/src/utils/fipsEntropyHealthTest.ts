/**
 * FIPS 140-3 Entropy Source Health Testing (SP 800-90B)
 *
 * Implements two NIST SP 800-90B health tests for continuous monitoring
 * of the entropy source (Node.js crypto.randomBytes → OpenSSL DRBG → OS).
 *
 * Tests Implemented:
 * 1. Repetition Count Test (SP 800-90B §4.4.1)
 *    Detects if the noise source becomes stuck producing the same value.
 *
 * 2. Adaptive Proportion Test (SP 800-90B §4.4.2)
 *    Detects a significant decrease in entropy by checking if any single
 *    value dominates a sample window.
 *
 * These tests should be run:
 * - Once at startup (as part of pre-operational self-tests)
 * - Periodically during operation (recommended: hourly)
 */

import crypto from 'crypto';
import logger from '../config/logger';

// ============================================================================
// CONSTANTS (per NIST SP 800-90B Table 2)
// ============================================================================

/**
 * Repetition Count Test cutoff value.
 * For alpha = 2^(-20) false positive probability and H_min = 1:
 * C = 1 + ceil(20 / H_min) = 21
 */
const REPETITION_CUTOFF = 21;

/**
 * Adaptive Proportion Test window size.
 * For 8-bit samples, W = 512 (per SP 800-90B §4.4.2).
 */
const PROPORTION_WINDOW = 512;

/**
 * Adaptive Proportion Test cutoff.
 * For W = 512, alpha = 2^(-20), 8-bit samples:
 * Cutoff ≈ 384 (conservative threshold).
 */
const PROPORTION_CUTOFF = 384;

/** Default sample size for health tests */
const DEFAULT_SAMPLE_SIZE = 1024;

// ============================================================================
// PUBLIC API
// ============================================================================

export interface EntropyHealthResult {
  passed: boolean;
  repetitionTest: { passed: boolean; maxRun: number; cutoff: number };
  proportionTest: { passed: boolean; maxCount: number; cutoff: number };
}

/**
 * Run both SP 800-90B health tests on a sample from the entropy source.
 *
 * @param sample - Buffer of random bytes to test. If not provided,
 *                 generates a fresh sample from crypto.randomBytes.
 * @returns Test results with pass/fail for each sub-test.
 */
export function runEntropyHealthTest(sample?: Buffer): EntropyHealthResult {
  const testSample = sample || crypto.randomBytes(DEFAULT_SAMPLE_SIZE);

  const repResult = repetitionCountTest(testSample);
  const propResult = adaptiveProportionTest(testSample);

  const result: EntropyHealthResult = {
    passed: repResult.passed && propResult.passed,
    repetitionTest: repResult,
    proportionTest: propResult,
  };

  if (!result.passed) {
    logger.error('FIPS 140-3 entropy health test FAILED', {
      repetition: repResult,
      proportion: propResult,
    });
  }

  return result;
}

/**
 * Start periodic entropy health monitoring.
 * Runs health tests at the specified interval and logs results.
 *
 * @param intervalMs - Interval between tests in milliseconds (default: 1 hour)
 * @returns The interval timer (can be cleared with clearInterval)
 */
export function startPeriodicHealthMonitoring(
  intervalMs: number = 3600000
): ReturnType<typeof setInterval> {
  logger.info(`FIPS 140-3 entropy health monitoring started (interval: ${intervalMs}ms)`);

  const timer = setInterval(() => {
    const result = runEntropyHealthTest();
    if (result.passed) {
      logger.debug('FIPS 140-3 periodic entropy health test PASSED', {
        maxRun: result.repetitionTest.maxRun,
        maxProportion: result.proportionTest.maxCount,
      });
    } else {
      logger.error('FIPS 140-3 periodic entropy health test FAILED — entropy source may be degraded');
    }
  }, intervalMs);

  // Do not keep the event loop alive solely for this monitor; allow graceful exit.
  timer.unref?.();

  return timer;
}

// ============================================================================
// SP 800-90B HEALTH TESTS
// ============================================================================

/**
 * Repetition Count Test (SP 800-90B §4.4.1)
 *
 * Scans the sample for the longest consecutive run of identical byte values.
 * If any run exceeds the cutoff C, the test fails, indicating the entropy
 * source may be stuck.
 */
function repetitionCountTest(
  sample: Buffer
): { passed: boolean; maxRun: number; cutoff: number } {
  let maxRun = 1;
  let currentRun = 1;

  for (let i = 1; i < sample.length; i++) {
    if (sample[i] === sample[i - 1]) {
      currentRun++;
      if (currentRun > maxRun) {
        maxRun = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  return {
    passed: maxRun < REPETITION_CUTOFF,
    maxRun,
    cutoff: REPETITION_CUTOFF,
  };
}

/**
 * Adaptive Proportion Test (SP 800-90B §4.4.2)
 *
 * In a sliding window of W samples, counts the maximum frequency of any
 * single byte value. If any value appears more than the cutoff times,
 * the test fails, indicating entropy is lower than expected.
 */
function adaptiveProportionTest(
  sample: Buffer
): { passed: boolean; maxCount: number; cutoff: number } {
  let overallMaxCount = 0;

  // Process each window of size PROPORTION_WINDOW
  for (let windowStart = 0; windowStart + PROPORTION_WINDOW <= sample.length; windowStart += PROPORTION_WINDOW) {
    const window = sample.subarray(windowStart, windowStart + PROPORTION_WINDOW);

    // Count frequency of each byte value in this window
    const counts = new Uint16Array(256);
    let windowMaxCount = 0;

    for (let i = 0; i < window.length; i++) {
      counts[window[i]]++;
      if (counts[window[i]] > windowMaxCount) {
        windowMaxCount = counts[window[i]];
      }
    }

    if (windowMaxCount > overallMaxCount) {
      overallMaxCount = windowMaxCount;
    }
  }

  return {
    passed: overallMaxCount < PROPORTION_CUTOFF,
    maxCount: overallMaxCount,
    cutoff: PROPORTION_CUTOFF,
  };
}
