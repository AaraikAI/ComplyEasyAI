/**
 * Discrete Bayesian Network with binary nodes.
 *
 * Implements:
 *   - Variable elimination for exact inference on small networks
 *   - Likelihood weighting for approximate inference on larger networks
 *   - Beta-Binomial conjugate updating for CPTs from observational data
 *
 * Each node represents a binary random variable X ∈ {0, 1}. CPTs are
 * stored as P(X = 1 | parents) for every parent assignment, with the
 * complementary probability P(X = 0 | parents) = 1 - P(X = 1 | parents).
 *
 * This is a self-contained implementation (no external libs) suitable
 * for the ComplyEasyAI causal-reasoning use case where graphs are
 * typically O(10-100) nodes and ≤4 parents per node.
 *
 * References:
 *   - Koller & Friedman, "Probabilistic Graphical Models", 2009, ch. 9
 *   - Russell & Norvig, "Artificial Intelligence", 3e, ch. 14
 *   - Heckerman, "A Tutorial on Learning with Bayesian Networks", 1995
 */

export interface BayesianNode {
  id: string;                 // stable identifier
  name: string;
  parentIds: string[];        // ordered parent ids
  cpt: number[];              // P(X=1 | parents). length = 2^|parents|
                              // CPT index = bitmask of parent assignments (LSB = first parent)
  // Posterior pseudocounts (Beta(alpha, beta)) for each parent assignment.
  // Used for incremental learning from observed data.
  alpha: number[];            // length = 2^|parents|
  beta: number[];             // length = 2^|parents|
}

export class BayesianNetwork {
  private nodes = new Map<string, BayesianNode>();

  addNode(node: BayesianNode): void {
    const expectedSize = 1 << node.parentIds.length;
    if (node.cpt.length !== expectedSize) {
      throw new Error(
        `Node ${node.id}: CPT size ${node.cpt.length} != expected ${expectedSize} for ${node.parentIds.length} parents`
      );
    }
    if (node.alpha.length !== expectedSize || node.beta.length !== expectedSize) {
      throw new Error(`Node ${node.id}: alpha/beta arrays must match CPT length`);
    }
    this.nodes.set(node.id, { ...node });
  }

  getNode(id: string): BayesianNode | undefined {
    return this.nodes.get(id);
  }

  getNodes(): BayesianNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Topological order of node ids. Throws if the graph is cyclic.
   */
  topologicalOrder(): string[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const [id] of this.nodes) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }
    for (const [id, node] of this.nodes) {
      for (const parentId of node.parentIds) {
        if (!this.nodes.has(parentId)) {
          throw new Error(`Node ${id} references unknown parent ${parentId}`);
        }
        adj.get(parentId)!.push(id);
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      }
    }
    const queue: string[] = [];
    for (const [id, d] of inDegree) if (d === 0) queue.push(id);
    const out: string[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      out.push(id);
      for (const child of adj.get(id)!) {
        const d = (inDegree.get(child) || 0) - 1;
        inDegree.set(child, d);
        if (d === 0) queue.push(child);
      }
    }
    if (out.length !== this.nodes.size) {
      throw new Error('Bayesian network contains a cycle');
    }
    return out;
  }

  /**
   * Compute the marginal probability P(query = true | evidence).
   * Uses variable elimination for ≤16 hidden variables; falls back to
   * likelihood weighting for larger networks.
   */
  query(
    queryId: string,
    evidence: Record<string, 0 | 1> = {},
    options: {
      samples?: number;
      method?: 'auto' | 'exact' | 'likelihood_weighting' | 'variable_elimination';
    } = {}
  ): number {
    if (!this.nodes.has(queryId)) {
      throw new Error(`Unknown query node ${queryId}`);
    }
    const method = options.method ?? 'auto';
    const order = this.topologicalOrder();
    const hidden = order.filter((id) => id !== queryId && !(id in evidence));

    if (
      method === 'exact' ||
      method === 'variable_elimination' ||
      (method === 'auto' && hidden.length <= 16)
    ) {
      return this.variableElimination(queryId, evidence);
    }
    return this.likelihoodWeighting(queryId, evidence, options.samples ?? 10_000);
  }

  /**
   * Exact inference via variable elimination over the joint distribution.
   * O(2^|hidden|) so use only for small networks.
   */
  private variableElimination(queryId: string, evidence: Record<string, 0 | 1>): number {
    const order = this.topologicalOrder();
    let pTrue = 0, pFalse = 0;

    // Enumerate all assignments to hidden variables and accumulate joint prob
    const hidden = order.filter((id) => id !== queryId && !(id in evidence));
    const numAssignments = 1 << hidden.length;

    for (const queryVal of [0, 1] as const) {
      const fullEvidence = { ...evidence, [queryId]: queryVal };
      let totalProb = 0;
      for (let assignmentBits = 0; assignmentBits < numAssignments; assignmentBits++) {
        const assignment: Record<string, 0 | 1> = { ...fullEvidence };
        for (let i = 0; i < hidden.length; i++) {
          assignment[hidden[i]] = ((assignmentBits >> i) & 1) as 0 | 1;
        }
        totalProb += this.jointProbability(assignment);
      }
      if (queryVal === 1) pTrue = totalProb;
      else pFalse = totalProb;
    }

    const denom = pTrue + pFalse;
    return denom > 0 ? pTrue / denom : 0.5;
  }

  /**
   * Approximate inference via likelihood weighting (Russell & Norvig, fig 14.15).
   * Each sample is weighted by P(evidence | sampled non-evidence) so all samples
   * contribute (no rejection).
   */
  private likelihoodWeighting(
    queryId: string,
    evidence: Record<string, 0 | 1>,
    numSamples: number
  ): number {
    const order = this.topologicalOrder();
    let weightedTrue = 0;
    let weightedTotal = 0;

    for (let s = 0; s < numSamples; s++) {
      const sample: Record<string, 0 | 1> = {};
      let weight = 1;

      for (const id of order) {
        const node = this.nodes.get(id)!;
        const parentBits = this.assignmentBits(node.parentIds, sample);
        const pTrue = node.cpt[parentBits];

        if (id in evidence) {
          sample[id] = evidence[id];
          weight *= evidence[id] === 1 ? pTrue : (1 - pTrue);
        } else {
          // Sample
          const r = Math.random();
          sample[id] = (r < pTrue ? 1 : 0) as 0 | 1;
        }
      }

      weightedTotal += weight;
      if (sample[queryId] === 1) weightedTrue += weight;
    }

    return weightedTotal > 0 ? weightedTrue / weightedTotal : 0.5;
  }

  /**
   * Joint probability P(all variables = assignment), assuming the assignment
   * covers every node. Used by variable elimination.
   */
  private jointProbability(assignment: Record<string, 0 | 1>): number {
    let prob = 1;
    for (const [id, node] of this.nodes) {
      const parentBits = this.assignmentBits(node.parentIds, assignment);
      const pTrue = node.cpt[parentBits];
      prob *= assignment[id] === 1 ? pTrue : (1 - pTrue);
      if (prob === 0) return 0;
    }
    return prob;
  }

  private assignmentBits(parentIds: string[], assignment: Record<string, 0 | 1>): number {
    let bits = 0;
    for (let i = 0; i < parentIds.length; i++) {
      if (assignment[parentIds[i]] === 1) bits |= (1 << i);
    }
    return bits;
  }

  /**
   * Update CPTs via Beta-Binomial conjugate updating from an observed sample.
   * For each node, increment alpha or beta for the parent assignment seen
   * in this observation, then refresh the CPT mean = alpha / (alpha + beta).
   */
  observe(assignment: Record<string, 0 | 1>): void {
    for (const [id, node] of this.nodes) {
      if (!(id in assignment)) continue;
      const parentBits = this.assignmentBits(node.parentIds, assignment);
      if (assignment[id] === 1) node.alpha[parentBits] += 1;
      else node.beta[parentBits] += 1;
      const a = node.alpha[parentBits];
      const b = node.beta[parentBits];
      node.cpt[parentBits] = a / (a + b);
    }
  }

  /**
   * Compute the posterior marginal P(node = 1) over all parent assignments,
   * weighted by the network's stationary marginal over the parents. Useful
   * for the "prior" reported in causal analysis.
   */
  marginal(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Unknown node ${nodeId}`);
    if (node.parentIds.length === 0) return node.cpt[0];
    // Without enumerating ancestors, approximate by averaging over parent
    // configurations weighted uniformly. Callers that need exact marginals
    // should call query() instead.
    return node.cpt.reduce((s, p) => s + p, 0) / node.cpt.length;
  }

  /**
   * Convert pairwise CPT P(child=1|parent=1), P(child=1|parent=0) to the
   * single-parent CPT layout used internally.
   *   bit 0 = parent = false → cpt[0] = pTrueGivenFalse
   *   bit 1 = parent = true  → cpt[1] = pTrueGivenTrue
   */
  static cptFromPairwise(pTrueGivenTrue: number, pTrueGivenFalse: number): number[] {
    return [pTrueGivenFalse, pTrueGivenTrue];
  }
}
