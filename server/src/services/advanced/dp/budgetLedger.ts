/**
 * Cross-round Rényi DP privacy budget ledger.
 *
 * Persists per-organization (alpha, RDP) spend so subsequent rounds can
 * compose with prior history. Provides a strict admission check before
 * each new round: refuses to release noise if doing so would push the
 * organization past its global (epsilon, delta) ceiling.
 */

import prisma from '../../../config/database';
import logger from '../../../config/logger';
import {
  accountStep,
  composeRDP,
  rdpToEpsilon,
  DEFAULT_ALPHAS,
  PrivacySpendResult,
} from './rdpAccountant';

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
  modelType: string
): Promise<number[]> {
  const latest = await prisma.privacyBudgetLedger.findFirst({
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
 */
export async function commitSpend(
  input: BudgetCheckInput,
  check: BudgetCheckResult
): Promise<void> {
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

  await prisma.privacyBudgetLedger.create({
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
      cumulativeRdp: check.cumulativeRdp,
      epsilonAtDelta: check.epsilonAfter,
      targetDelta: input.targetDelta,
      epsilonBudget: input.epsilonBudget,
      budgetExceeded: !check.allowed,
    },
  });

  logger.info(
    `[PrivacyBudget] org=${input.organizationId} model=${input.modelType} round=${input.roundId} ` +
    `step_eps=${check.thisStepEpsilon.toFixed(4)} cumulative_eps=${check.epsilonAfter.toFixed(4)} ` +
    `budget=${input.epsilonBudget} optimal_alpha=${check.optimalAlpha}`
  );
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
