/**
 * SCAFFOLD: Stochastic Controlled Averaging for federated learning.
 * Reference: Karimireddy, Kale, Mohri, Reddi, Stich, Suresh (ICML 2020),
 *            "SCAFFOLD: Stochastic Controlled Averaging for Federated Learning"
 *
 * SCAFFOLD reduces variance from heterogeneous (non-IID) client data
 * distributions by tracking control variates `c` (server-side) and
 * `c_i` (client-side) and correcting each local update with `c - c_i`.
 *
 * The aggregation step on the server is:
 *   delta_x = (1/|S|) * sum_{i in S} delta_x_i
 *   delta_c = (1/|N|) * sum_{i in S} delta_c_i      (note: divide by total N, not |S|)
 *   x  <- x  + eta_g * delta_x
 *   c  <- c  + delta_c
 *
 * where:
 *   delta_x_i is the client's local model update (already SCAFFOLD-corrected)
 *   delta_c_i is the client's control-variate update
 *   eta_g is the server-side learning rate
 *   |S| is sampled clients this round, |N| is the total cohort size
 *
 * This module only needs the AGGREGATION half: clients are assumed to have
 * applied their control-variate correction during local training and submitted
 * both `delta_x_i` and `delta_c_i` (or, equivalently, their full updated
 * `c_i^new` from which we derive `delta_c_i = c_i^new - c_i^prev`).
 */

export interface SCAFFOLDUpdate {
  peerId: string;
  deltaX: number[];      // local model delta after SCAFFOLD correction
  deltaC: number[];      // client control-variate delta
  dataSize: number;
}

export interface SCAFFOLDAggregateResult {
  newGlobalDelta: number[];     // server-side delta_x to apply
  newGlobalControlVariate: number[]; // updated global c
  newPeerControlVariates: Record<string, number[]>; // updated c_i for each contributing peer
  selectedClients: number;
  totalCohortSize: number;
  averageDriftMagnitude: number; // L2 norm of average peer drift — convergence diagnostic
}

/**
 * Server-side SCAFFOLD aggregation.
 *
 * @param updates per-peer (delta_x_i, delta_c_i) submitted this round
 * @param prevGlobalControlVariate the current server-side `c` (or zero vector first round)
 * @param prevPeerControlVariates the most recently observed `c_i` for each peer (or zeros)
 * @param totalCohortSize |N|, the full participating cohort (>= updates.length)
 * @param serverLearningRate eta_g (defaults to 1.0)
 */
export function aggregateSCAFFOLD(
  updates: SCAFFOLDUpdate[],
  prevGlobalControlVariate: number[],
  prevPeerControlVariates: Record<string, number[]>,
  totalCohortSize: number,
  serverLearningRate: number = 1.0
): SCAFFOLDAggregateResult {
  if (updates.length === 0) throw new Error('SCAFFOLD requires at least one update');
  const dim = updates[0].deltaX.length;

  // Validate that all updates have the same dimension
  for (const u of updates) {
    if (u.deltaX.length !== dim || u.deltaC.length !== dim) {
      throw new Error(`SCAFFOLD update dimension mismatch for peer ${u.peerId}`);
    }
  }

  // Normalize prev arrays to the expected dimension
  const prevGlobalC: number[] =
    prevGlobalControlVariate.length === dim
      ? prevGlobalControlVariate.slice()
      : new Array(dim).fill(0);

  // Average delta_x weighted equally across participating clients
  const avgDeltaX = new Array<number>(dim).fill(0);
  for (const u of updates) {
    for (let d = 0; d < dim; d++) avgDeltaX[d] += u.deltaX[d] / updates.length;
  }

  // Average delta_c divided by TOTAL cohort size N (Karimireddy et al., 2020, Alg. 1, line 17)
  const avgDeltaC = new Array<number>(dim).fill(0);
  const N = Math.max(totalCohortSize, updates.length);
  for (const u of updates) {
    for (let d = 0; d < dim; d++) avgDeltaC[d] += u.deltaC[d] / N;
  }

  // New global delta = eta_g * avg(delta_x)
  const newGlobalDelta = avgDeltaX.map((v) => serverLearningRate * v);

  // New global control variate = c + avg(delta_c)
  const newGlobalControlVariate = prevGlobalC.map((v, i) => v + avgDeltaC[i]);

  // New per-peer control variates: c_i^new = c_i^prev + delta_c_i
  const newPeerControlVariates: Record<string, number[]> = {};
  for (const u of updates) {
    const prev = prevPeerControlVariates[u.peerId];
    const prevArr =
      Array.isArray(prev) && prev.length === dim ? prev : new Array<number>(dim).fill(0);
    const next = new Array<number>(dim);
    for (let d = 0; d < dim; d++) next[d] = prevArr[d] + u.deltaC[d];
    newPeerControlVariates[u.peerId] = next;
  }

  // Drift magnitude diagnostic: L2 norm of avgDeltaX
  let driftSq = 0;
  for (let d = 0; d < dim; d++) driftSq += avgDeltaX[d] * avgDeltaX[d];
  const averageDriftMagnitude = Math.sqrt(driftSq);

  return {
    newGlobalDelta,
    newGlobalControlVariate,
    newPeerControlVariates,
    selectedClients: updates.length,
    totalCohortSize: N,
    averageDriftMagnitude,
  };
}

/**
 * Derive a SCAFFOLD `delta_c_i` from a peer's local training output when
 * the peer submits its final `c_i^new` rather than the delta directly.
 */
export function deriveDeltaC(
  prevC: number[],
  newC: number[]
): number[] {
  const dim = newC.length;
  const out = new Array<number>(dim);
  for (let d = 0; d < dim; d++) out[d] = newC[d] - (prevC[d] ?? 0);
  return out;
}
