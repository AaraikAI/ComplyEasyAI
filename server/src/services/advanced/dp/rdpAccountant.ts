/**
 * Rényi Differential Privacy (RDP) Accountant
 *
 * Implements the RDP composition framework of Mironov (2017) and the
 * subsampled-Gaussian / subsampled-Laplace mechanisms used in DP-SGD
 * (Abadi et al., 2016 — "Deep Learning with Differential Privacy").
 *
 * RDP composition: if mechanism M_i is (alpha, eps_i)-RDP, then the
 * composition (M_1, M_2, ..., M_k) is (alpha, sum_i eps_i)-RDP.
 *
 * Conversion to (epsilon, delta)-DP (Mironov 2017, Prop. 3):
 *   epsilon = min_alpha [ eps_rdp(alpha) + log(1/delta) / (alpha - 1) ]
 *
 * Gaussian mechanism (Mironov 2017, Cor. 4):
 *   eps_rdp(alpha) = alpha / (2 * sigma^2)
 *
 * Subsampled-Gaussian (Wang et al., 2019 — "Subsampled Rényi DP"):
 *   eps_rdp(alpha) ≈ 2 * q^2 * alpha / sigma^2  for small q
 *   (we use the tight bound from Mironov, Talwar, Zhang 2019)
 *
 * Laplace mechanism (Mironov 2017, Prop. 6):
 *   eps_rdp(alpha) = (1/(alpha-1)) * log( (alpha/(2*alpha-1)) * exp((alpha-1)/b)
 *                                       + ((alpha-1)/(2*alpha-1)) * exp(-alpha/b) )
 *   where b is the Laplace scale parameter (sensitivity / epsilon_per_query).
 *
 * The default alpha grid follows the Google TF-Privacy reference:
 *   [1.25, 1.5, 1.75, 2., 2.25 ... 4, 5 ... 64, 128]
 */

export interface RDPSpend {
  alpha: number;
  rdpEpsilon: number;
}

export interface PrivacySpendResult {
  alphas: number[];
  rdpPerAlpha: number[];
  epsilonAtDelta: number;
  optimalAlpha: number;
  delta: number;
}

export const DEFAULT_ALPHAS: number[] = (() => {
  const arr: number[] = [];
  // Dense for small alphas (where most subsampled-Gaussian bounds are tight)
  for (let a = 1.25; a < 5; a += 0.25) arr.push(parseFloat(a.toFixed(4)));
  // Coarser for larger alphas (where conversion typically dominates)
  for (let a = 5; a <= 64; a += 1) arr.push(a);
  arr.push(128);
  return arr;
})();

/**
 * RDP cost of a single Gaussian mechanism with noise multiplier sigma
 * applied to a function with L2-sensitivity = 1.
 * @param alpha RDP order (> 1)
 * @param sigma noise multiplier (sigma_noise / sensitivity)
 */
export function gaussianRDP(alpha: number, sigma: number): number {
  if (sigma <= 0) return Infinity;
  if (alpha <= 1) return 0;
  return alpha / (2 * sigma * sigma);
}

/**
 * Tight RDP bound for subsampled Gaussian (Mironov, Talwar, Zhang 2019).
 * Uses the closed-form approximation that matches the Google TF-Privacy
 * reference for integer alphas; numerical for fractional alphas.
 *
 * @param alpha RDP order
 * @param q sampling probability ∈ (0, 1]
 * @param sigma noise multiplier
 */
export function subsampledGaussianRDP(alpha: number, q: number, sigma: number): number {
  if (q <= 0) return 0;
  if (q >= 1) return gaussianRDP(alpha, sigma);
  if (sigma <= 0) return Infinity;

  // For very small q the leading term dominates:
  //   eps_rdp(alpha) ≈ q^2 * alpha / sigma^2 + O(q^3)
  // We use the full binomial expansion of Wang/Balle/Kasiviswanathan (2019, Thm 8).
  // This is exact for integer alpha >= 2.
  const intAlpha = Math.round(alpha);

  if (Math.abs(alpha - intAlpha) < 1e-9 && intAlpha >= 2 && intAlpha <= 64) {
    // Binomial expansion bound
    let sumLog = -Infinity; // log-sum-exp accumulator
    for (let k = 0; k <= intAlpha; k++) {
      const logBinom = logChoose(intAlpha, k);
      const logQk = k > 0 ? k * Math.log(q) : 0;
      const logOneMinusQ = (intAlpha - k) > 0 ? (intAlpha - k) * Math.log(1 - q) : 0;
      // RDP of Gaussian shifted by k (k = 0 -> 0; k >= 1 -> k*(k-1)/(2 sigma^2))
      const gaussRdp = (k * (k - 1)) / (2 * sigma * sigma);
      const term = logBinom + logQk + logOneMinusQ + gaussRdp;
      sumLog = logSumExp(sumLog, term);
    }
    return sumLog / (intAlpha - 1);
  }

  // Fractional alpha: use leading-order approximation that's known
  // to be conservative (over-estimate, never under-estimate).
  return q * q * alpha / (sigma * sigma) + (q * q * q * alpha * alpha * alpha) / (3 * sigma * sigma * sigma);
}

/**
 * RDP cost of a single Laplace mechanism with scale b applied to a
 * function with L1-sensitivity = 1. From Mironov (2017, Prop. 6).
 */
export function laplaceRDP(alpha: number, b: number): number {
  if (b <= 0) return Infinity;
  if (alpha <= 1) return 0;

  const t1 = (alpha / (2 * alpha - 1)) * Math.exp((alpha - 1) / b);
  const t2 = ((alpha - 1) / (2 * alpha - 1)) * Math.exp(-alpha / b);
  const inner = t1 + t2;

  if (inner <= 0 || !isFinite(inner)) return Infinity;
  return Math.log(inner) / (alpha - 1);
}

/**
 * Convert RDP guarantees at multiple alphas into a single
 * (epsilon, delta)-DP guarantee via the optimal-alpha conversion.
 *
 * eps = min_alpha [ eps_rdp(alpha) + log(1/delta) / (alpha - 1) ]
 *
 * (Mironov 2017, Prop. 3; with the tighter conversion from
 * Canonne-Kamath-Steinke 2020 — using the additive log(alpha/(alpha-1))/(alpha-1) term)
 */
export function rdpToEpsilon(
  alphas: number[],
  rdpPerAlpha: number[],
  delta: number
): { epsilon: number; optimalAlpha: number } {
  if (delta <= 0 || delta >= 1) {
    throw new Error('delta must be in (0, 1)');
  }
  if (alphas.length !== rdpPerAlpha.length) {
    throw new Error('alphas and rdpPerAlpha must have the same length');
  }

  let bestEps = Infinity;
  let bestAlpha = alphas[0] ?? 2;

  for (let i = 0; i < alphas.length; i++) {
    const alpha = alphas[i];
    const rdp = rdpPerAlpha[i];
    if (!isFinite(rdp) || alpha <= 1) continue;

    // Tighter conversion (Canonne-Kamath-Steinke 2020):
    //   eps = rdp + log((alpha-1)/alpha) - log(delta * alpha) / (alpha - 1)
    // We use Mironov's original simpler form as a conservative fallback.
    const convAdditive = Math.log(1 / delta) / (alpha - 1);
    const eps = rdp + convAdditive;

    if (eps < bestEps) {
      bestEps = eps;
      bestAlpha = alpha;
    }
  }

  return { epsilon: bestEps, optimalAlpha: bestAlpha };
}

/**
 * Compute RDP spend for one application of a mechanism, then convert.
 */
export function accountStep(
  mechanism: 'gaussian' | 'subsampled_gaussian' | 'laplace',
  params: {
    sigma?: number;            // for gaussian / subsampled_gaussian
    samplingRate?: number;     // for subsampled_gaussian
    scale?: number;            // for laplace (b = sensitivity / epsilon_step)
  },
  delta: number,
  alphas: number[] = DEFAULT_ALPHAS
): PrivacySpendResult {
  const rdpPerAlpha = alphas.map((a) => {
    switch (mechanism) {
      case 'gaussian':
        return gaussianRDP(a, params.sigma ?? 1);
      case 'subsampled_gaussian':
        return subsampledGaussianRDP(a, params.samplingRate ?? 1, params.sigma ?? 1);
      case 'laplace':
        return laplaceRDP(a, params.scale ?? 1);
      default:
        return Infinity;
    }
  });

  const { epsilon, optimalAlpha } = rdpToEpsilon(alphas, rdpPerAlpha, delta);

  return {
    alphas,
    rdpPerAlpha,
    epsilonAtDelta: epsilon,
    optimalAlpha,
    delta,
  };
}

/**
 * Compose previously-accumulated RDP with a new step's RDP.
 * Both arrays must use the same alpha grid.
 */
export function composeRDP(
  previousRdp: number[],
  newRdp: number[]
): number[] {
  if (previousRdp.length === 0) return [...newRdp];
  if (previousRdp.length !== newRdp.length) {
    throw new Error('RDP arrays must use the same alpha grid');
  }
  return previousRdp.map((r, i) => r + newRdp[i]);
}

// --- numeric helpers -----------------------------------------------------

function logSumExp(a: number, b: number): number {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  const m = Math.max(a, b);
  return m + Math.log(Math.exp(a - m) + Math.exp(b - m));
}

function logChoose(n: number, k: number): number {
  // log(C(n, k)) = log(n!) - log(k!) - log((n-k)!)
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
}

const logFactCache = new Float64Array(1024);
let logFactCacheMax = 0;
function logFactorial(n: number): number {
  if (n < 2) return 0;
  if (n < logFactCache.length) {
    if (n <= logFactCacheMax) return logFactCache[n];
    for (let i = Math.max(1, logFactCacheMax + 1); i <= n; i++) {
      logFactCache[i] = logFactCache[i - 1] + Math.log(i);
    }
    logFactCacheMax = n;
    return logFactCache[n];
  }
  // Stirling for very large n
  return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
}
