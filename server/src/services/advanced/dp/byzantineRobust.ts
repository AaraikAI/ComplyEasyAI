/**
 * Byzantine-robust aggregation for federated learning.
 *
 * Implements four standard defenses operating on the actual weight vectors
 * (not on metadata):
 *
 *   1. Krum (Blanchard, El Mhamdi, Guerraoui, Stainer — NeurIPS 2017):
 *      For each client i, compute d(i) = sum of squared L2 distances
 *      to the n - f - 2 closest other clients (f = assumed Byzantine count).
 *      Output: the single client with smallest d(i).
 *
 *   2. Multi-Krum: same scoring, but return the average of the m clients
 *      with smallest scores (we use m = n - f).
 *
 *   3. Coordinate-wise median (Yin et al., ICML 2018): per coordinate,
 *      take the median across all clients. Tolerates up to (n-1)/2 Byzantines.
 *
 *   4. Trimmed mean (Yin et al., 2018): per coordinate, sort, drop the top
 *      and bottom k, mean the rest. Tolerates k Byzantines.
 *
 * All four return a single aggregated vector.
 */

export interface ByzantineUpdate {
  peerId: string;
  weights: number[];
  dataSize: number;
}

export interface AggregationResult {
  aggregatedWeights: number[];
  selectedPeers: string[];      // peers contributing to the output
  rejectedPeers: string[];      // peers excluded as suspected Byzantine
  scores: Array<{ peerId: string; score: number }>;
  method: 'krum' | 'multi_krum' | 'median' | 'trimmed_mean';
}

function squaredL2Distance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum;
}

/**
 * Krum: returns the single update closest to its (n-f-2) nearest neighbours.
 */
export function krum(updates: ByzantineUpdate[], assumedByzantines: number): AggregationResult {
  const n = updates.length;
  if (n === 0) throw new Error('Krum requires at least one update');
  if (n === 1) {
    return {
      aggregatedWeights: [...updates[0].weights],
      selectedPeers: [updates[0].peerId],
      rejectedPeers: [],
      scores: [{ peerId: updates[0].peerId, score: 0 }],
      method: 'krum',
    };
  }

  const f = Math.max(0, Math.min(assumedByzantines, Math.floor((n - 2) / 2)));
  const k = Math.max(1, n - f - 2);

  // Distance matrix (symmetric)
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = squaredL2Distance(updates[i].weights, updates[j].weights);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }

  const scores: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const others = dist[i].slice();
    others.splice(i, 1);
    others.sort((a, b) => a - b);
    let s = 0;
    for (let t = 0; t < Math.min(k, others.length); t++) s += others[t];
    scores[i] = s;
  }

  let bestIdx = 0;
  for (let i = 1; i < n; i++) {
    if (scores[i] < scores[bestIdx]) bestIdx = i;
  }

  return {
    aggregatedWeights: [...updates[bestIdx].weights],
    selectedPeers: [updates[bestIdx].peerId],
    rejectedPeers: updates.filter((_, i) => i !== bestIdx).map((u) => u.peerId),
    scores: updates.map((u, i) => ({ peerId: u.peerId, score: scores[i] })),
    method: 'krum',
  };
}

/**
 * Multi-Krum: average of the m = n - f best-scoring updates.
 */
export function multiKrum(updates: ByzantineUpdate[], assumedByzantines: number): AggregationResult {
  const n = updates.length;
  if (n === 0) throw new Error('Multi-Krum requires at least one update');
  if (n === 1) {
    return {
      aggregatedWeights: [...updates[0].weights],
      selectedPeers: [updates[0].peerId],
      rejectedPeers: [],
      scores: [{ peerId: updates[0].peerId, score: 0 }],
      method: 'multi_krum',
    };
  }

  const f = Math.max(0, Math.min(assumedByzantines, Math.floor((n - 2) / 2)));
  const k = Math.max(1, n - f - 2);
  const m = Math.max(1, n - f);

  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = squaredL2Distance(updates[i].weights, updates[j].weights);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }

  const scores: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < n; i++) {
    const others = dist[i].slice();
    others.splice(i, 1);
    others.sort((a, b) => a - b);
    let s = 0;
    for (let t = 0; t < Math.min(k, others.length); t++) s += others[t];
    scores.push({ idx: i, score: s });
  }

  scores.sort((a, b) => a.score - b.score);
  const selected = scores.slice(0, m);
  const selectedIdxSet = new Set(selected.map((s) => s.idx));

  const dim = updates[0].weights.length;
  const out = new Array<number>(dim).fill(0);
  for (const { idx } of selected) {
    for (let d = 0; d < dim; d++) out[d] += updates[idx].weights[d] || 0;
  }
  for (let d = 0; d < dim; d++) out[d] /= selected.length;

  return {
    aggregatedWeights: out,
    selectedPeers: selected.map(({ idx }) => updates[idx].peerId),
    rejectedPeers: updates.filter((_, i) => !selectedIdxSet.has(i)).map((u) => u.peerId),
    scores: updates.map((u, i) => {
      const sc = scores.find((s) => s.idx === i)?.score ?? 0;
      return { peerId: u.peerId, score: sc };
    }),
    method: 'multi_krum',
  };
}

/**
 * Coordinate-wise median: robust under up to (n-1)/2 Byzantines per coordinate.
 */
export function coordinateMedian(updates: ByzantineUpdate[]): AggregationResult {
  const n = updates.length;
  if (n === 0) throw new Error('Median requires at least one update');
  const dim = updates[0].weights.length;
  const out = new Array<number>(dim).fill(0);

  for (let d = 0; d < dim; d++) {
    const vals = updates.map((u) => u.weights[d] || 0).sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    out[d] = vals.length % 2 === 1 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  }

  return {
    aggregatedWeights: out,
    selectedPeers: updates.map((u) => u.peerId),
    rejectedPeers: [],
    scores: updates.map((u) => ({ peerId: u.peerId, score: 0 })),
    method: 'median',
  };
}

/**
 * Coordinate-wise trimmed mean: drops top-k and bottom-k per coordinate,
 * averages the rest.
 */
export function trimmedMean(
  updates: ByzantineUpdate[],
  trimFraction: number = 0.2
): AggregationResult {
  const n = updates.length;
  if (n === 0) throw new Error('Trimmed mean requires at least one update');
  const dim = updates[0].weights.length;
  const out = new Array<number>(dim).fill(0);

  const trim = Math.max(0, Math.min(Math.floor(n * trimFraction), Math.floor((n - 1) / 2)));

  for (let d = 0; d < dim; d++) {
    const vals = updates.map((u) => u.weights[d] || 0).sort((a, b) => a - b);
    const remaining = vals.slice(trim, vals.length - trim);
    out[d] = remaining.reduce((s, v) => s + v, 0) / remaining.length;
  }

  return {
    aggregatedWeights: out,
    selectedPeers: updates.map((u) => u.peerId),
    rejectedPeers: [],
    scores: updates.map((u) => ({ peerId: u.peerId, score: 0 })),
    method: 'trimmed_mean',
  };
}

/**
 * Validate that a weight vector is well-formed and within bounds.
 * Detects: NaN, Infinity, oversized magnitude, length mismatch, and
 * statistical outliers measured against the group's per-coordinate
 * median absolute deviation (MAD).
 */
export function validateWeightVector(
  weights: number[],
  peerGroup: number[][],
  options: { maxAbs?: number; madThreshold?: number } = {}
): { valid: boolean; reason?: string } {
  const maxAbs = options.maxAbs ?? 100;
  const madThreshold = options.madThreshold ?? 6;

  if (!Array.isArray(weights) || weights.length === 0) {
    return { valid: false, reason: 'empty_weights' };
  }
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (!Number.isFinite(w)) return { valid: false, reason: `non_finite_at_${i}` };
    if (Math.abs(w) > maxAbs) return { valid: false, reason: `magnitude_exceeded_at_${i}` };
  }

  if (peerGroup.length < 3) return { valid: true };
  if (peerGroup[0].length !== weights.length) {
    return { valid: false, reason: 'dim_mismatch' };
  }

  // Per-coordinate MAD check: count how many coordinates deviate >= mad*madThreshold from median
  const dim = weights.length;
  let outlierCoords = 0;
  for (let d = 0; d < dim; d++) {
    const coords = peerGroup.map((v) => v[d] || 0).sort((a, b) => a - b);
    const mid = Math.floor(coords.length / 2);
    const median = coords.length % 2 === 1 ? coords[mid] : (coords[mid - 1] + coords[mid]) / 2;
    const deviations = coords.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)] || 1e-9;
    if (Math.abs((weights[d] || 0) - median) > madThreshold * mad) outlierCoords++;
  }

  // If more than 10% of coordinates are outliers, flag as Byzantine
  if (outlierCoords / dim > 0.1) {
    return { valid: false, reason: `outlier_coords_${outlierCoords}_of_${dim}` };
  }

  return { valid: true };
}
