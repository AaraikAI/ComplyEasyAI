/**
 * Cross-round Rényi DP privacy budget ledger.
 *
 * Persists per-organization (alpha, RDP) spend so subsequent rounds can
 * compose with prior history. Provides a strict admission check before
 * each new round: refuses to release noise if doing so would push the
 * organization past its global (epsilon, delta) ceiling.
 */

import { createHash } from 'crypto';
import { Prisma } from '../../../generated/prisma/client';
import prisma from '../../../config/database';
import logger from '../../../config/logger';
import {
  accountStep,
  composeRDP,
  rdpToEpsilon,
  DEFAULT_ALPHAS,
  PrivacySpendResult,
} from './rdpAccountant';

// The base Prisma client OR an interactive-transaction client. Used so the
// ledger read/compose/commit can run inside the same serialized transaction.
type PrismaLike = typeof prisma | Prisma.TransactionClient;

/**
 * Derive a stable signed 64-bit key for a PostgreSQL transaction-scoped
 * advisory lock from an organization+model pair. Two concurrent DP rounds for
 * the same org+model therefore contend on the same lock and serialize.
 */
function advisoryLockKey(organizationId: string, modelType: string): bigint {
  const digest = createHash('sha256').update(`${organizationId}:${modelType}`).digest();
  // Take the high 8 bytes and reinterpret as a signed BigInt (pg bigint range).
  return digest.readBigInt64BE(0);
}

export interface BudgetCheckInput {
  organizationId: string;
  modelType: string;
  roundId: string;
  mechanism: 'gaussian' | 'subsampled_gaussian' | 'laplace';
  sigma?: number;
  scale?: number;
  samplingRate?: number;
  sensitivity: number;
  epsilonBudget: number;
  targetDelta: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  epsilonAfter: number;
  optimalAlpha: number;
  cumulativeRdp: number[];
  thisStepEpsilon: number;
  reason?: string;
}

/**
 * Load the most recent cumulative RDP vector for an org+model.
 */
async function loadCumulativeRdp(
  organizationId: string,
  modelType: string,
  client: PrismaLike = prisma
): Promise<number[]> {
  const latest = await client.privacyBudgetLedger.findFirst({
    where: { organizationId, modelType },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return new Array<number>(DEFAULT_ALPHAS.length).fill(0);
  // cumulativeRdp is stored as Float[] in same order as DEFAULT_ALPHAS
  return Array.isArray(latest.cumulativeRdp) && latest.cumulativeRdp.length === DEFAULT_ALPHAS.length
    ? latest.cumulativeRdp
    : new Array<number>(DEFAULT_ALPHAS.length).fill(0);
}

/**
 * Pre-flight budget check: compute the RDP cost of the proposed mechanism,
 * compose with prior cumulative RDP, convert to (epsilon, delta), and
 * decide whether the resulting epsilon stays within the global budget.
 *
 * If allowed, the caller should immediately call `commitSpend()` to make
 * the spend durable.
 */
export async function checkBudget(input: BudgetCheckInput): Promise<BudgetCheckResult> {
  const prevCumulative = await loadCumulativeRdp(input.organizationId, input.modelType);

  const stepResult: PrivacySpendResult = accountStep(
    input.mechanism,
    {
      sigma: input.sigma,
      scale: input.scale,
      samplingRate: input.samplingRate,
    },
    input.targetDelta,
    DEFAULT_ALPHAS
  );

  const newCumulative = composeRDP(prevCumulative, stepResult.rdpPerAlpha);
  const { epsilon: epsilonAfter, optimalAlpha } = rdpToEpsilon(
    DEFAULT_ALPHAS,
    newCumulative,
    input.targetDelta
  );

  const allowed = epsilonAfter <= input.epsilonBudget;
  return {
    allowed,
    epsilonAfter,
    optimalAlpha,
    cumulativeRdp: newCumulative,
    thisStepEpsilon: stepResult.epsilonAtDelta,
    reason: allowed ? undefined : `Spend ${epsilonAfter.toFixed(4)} exceeds budget ${input.epsilonBudget}`,
  };
}

/**
 * Persist a committed spend to the ledger.
 *
 * The read-compose-persist sequence runs inside a single transaction holding a
 * PostgreSQL transaction-scoped advisory lock keyed by organization+model.
 * This serializes concurrent rounds for the same org+model: the cumulative RDP
 * is re-derived from the latest committed row *inside* the lock, so two rounds
 * that both passed an earlier (lock-free) `checkBudget` against the same
 * pre-image can no longer both persist as if independent — the second observes
 * the first's spend and its `budgetExceeded` flag reflects the true cumulative
 * epsilon. Returns the authoritative post-commit epsilon for the caller.
 */
export async function commitSpend(
  input: BudgetCheckInput,
  check: BudgetCheckResult
): Promise<{ epsilonAfter: number; optimalAlpha: number; cumulativeRdp: number[]; allowed: boolean }> {
  // Recompute this-step RDP (idempotent — same params produce same result)
  const stepResult: PrivacySpendResult = accountStep(
    input.mechanism,
    {
      sigma: input.sigma,
      scale: input.scale,
      samplingRate: input.samplingRate,
    },
    input.targetDelta,
    DEFAULT_ALPHAS
  );

  const lockKey = advisoryLockKey(input.organizationId, input.modelType);

  return prisma.$transaction(async (tx) => {
    // Serialize all commits for this org+model. The lock auto-releases at the
    // end of the transaction.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    // Re-load the authoritative cumulative RDP under the lock and re-compose
    // with this step, rather than trusting the (possibly stale) pre-image from
    // the lock-free checkBudget call.
    const prevCumulative = await loadCumulativeRdp(input.organizationId, input.modelType, tx);
    const newCumulative = composeRDP(prevCumulative, stepResult.rdpPerAlpha);
    const { epsilon: epsilonAfter, optimalAlpha } = rdpToEpsilon(
      DEFAULT_ALPHAS,
      newCumulative,
      input.targetDelta
    );
    const allowed = epsilonAfter <= input.epsilonBudget;

    await tx.privacyBudgetLedger.create({
      data: {
        organizationId: input.organizationId,
        modelType: input.modelType,
        roundId: input.roundId,
        noiseMechanism: input.mechanism,
        noiseMultiplier: input.sigma ?? input.scale ?? 0,
        samplingRate: input.samplingRate ?? 1.0,
        sensitivity: input.sensitivity,
        alphas: DEFAULT_ALPHAS,
        rdpSpent: stepResult.rdpPerAlpha,
        cumulativeRdp: newCumulative,
        epsilonAtDelta: epsilonAfter,
        targetDelta: input.targetDelta,
        epsilonBudget: input.epsilonBudget,
        budgetExceeded: !allowed,
      },
    });

    logger.info(
      `[PrivacyBudget] org=${input.organizationId} model=${input.modelType} round=${input.roundId} ` +
      `step_eps=${check.thisStepEpsilon.toFixed(4)} cumulative_eps=${epsilonAfter.toFixed(4)} ` +
      `budget=${input.epsilonBudget} optimal_alpha=${optimalAlpha} admitted=${allowed}`
    );

    if (!allowed) {
      logger.warn(
        `[PrivacyBudget] Serialized commit for org=${input.organizationId} model=${input.modelType} ` +
        `round=${input.roundId} pushed cumulative epsilon ${epsilonAfter.toFixed(4)} past budget ` +
        `${input.epsilonBudget} (concurrent round detected); recorded as budgetExceeded.`
      );
    }

    return { epsilonAfter, optimalAlpha, cumulativeRdp: newCumulative, allowed };
  });
}

/**
 * Atomic admission + commit: performs the full load-compose-admit-commit
 * sequence inside one serialized transaction (advisory lock on org+model).
 * Prefer this over a separate `checkBudget()` + `commitSpend()` when the
 * caller does not need to do work between admission and commit, because it
 * fully closes the check-to-commit race window for concurrent rounds.
 *
 * When admission fails, no ledger row is written and `allowed` is false.
 */
export async function checkAndCommitSpend(
  input: BudgetCheckInput
): Promise<BudgetCheckResult> {
  const stepResult: PrivacySpendResult = accountStep(
    input.mechanism,
    {
      sigma: input.sigma,
      scale: input.scale,
      samplingRate: input.samplingRate,
    },
    input.targetDelta,
    DEFAULT_ALPHAS
  );

  const lockKey = advisoryLockKey(input.organizationId, input.modelType);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    const prevCumulative = await loadCumulativeRdp(input.organizationId, input.modelType, tx);
    const newCumulative = composeRDP(prevCumulative, stepResult.rdpPerAlpha);
    const { epsilon: epsilonAfter, optimalAlpha } = rdpToEpsilon(
      DEFAULT_ALPHAS,
      newCumulative,
      input.targetDelta
    );
    const allowed = epsilonAfter <= input.epsilonBudget;

    if (allowed) {
      await tx.privacyBudgetLedger.create({
        data: {
          organizationId: input.organizationId,
          modelType: input.modelType,
          roundId: input.roundId,
          noiseMechanism: input.mechanism,
          noiseMultiplier: input.sigma ?? input.scale ?? 0,
          samplingRate: input.samplingRate ?? 1.0,
          sensitivity: input.sensitivity,
          alphas: DEFAULT_ALPHAS,
          rdpSpent: stepResult.rdpPerAlpha,
          cumulativeRdp: newCumulative,
          epsilonAtDelta: epsilonAfter,
          targetDelta: input.targetDelta,
          epsilonBudget: input.epsilonBudget,
          budgetExceeded: false,
        },
      });

      logger.info(
        `[PrivacyBudget] org=${input.organizationId} model=${input.modelType} round=${input.roundId} ` +
        `committed cumulative_eps=${epsilonAfter.toFixed(4)} budget=${input.epsilonBudget} ` +
        `optimal_alpha=${optimalAlpha}`
      );
    }

    return {
      allowed,
      epsilonAfter,
      optimalAlpha,
      cumulativeRdp: newCumulative,
      thisStepEpsilon: stepResult.epsilonAtDelta,
      reason: allowed ? undefined : `Spend ${epsilonAfter.toFixed(4)} exceeds budget ${input.epsilonBudget}`,
    };
  });
}

/**
 * Read the current cumulative epsilon spend for an org+model (no compose).
 */
export async function getCurrentSpend(
  organizationId: string,
  modelType: string,
  targetDelta: number
): Promise<{ epsilon: number; optimalAlpha: number; cumulativeRdp: number[] }> {
  const cumulative = await loadCumulativeRdp(organizationId, modelType);
  if (cumulative.every((v) => v === 0)) {
    return { epsilon: 0, optimalAlpha: DEFAULT_ALPHAS[0], cumulativeRdp: cumulative };
  }
  const { epsilon, optimalAlpha } = rdpToEpsilon(DEFAULT_ALPHAS, cumulative, targetDelta);
  return { epsilon, optimalAlpha, cumulativeRdp: cumulative };
}
