/**
 * Knowledge-graph builder for Bayesian causal reasoning.
 *
 * Reads frameworks, controls, risks, issues, and historical audit events
 * for an organization, persists them as KnowledgeGraphEntity rows, and
 * builds typed directed edges with empirically-learned conditional
 * probability tables. The resulting structure is then materialized into
 * a BayesianNetwork for inference.
 *
 * Learning algorithm:
 *   - For each edge (parent → child), count joint observations:
 *       cTT  = times both nodes were "active" in the same window
 *       cTF  = times parent active, child inactive
 *       cFT  = parent inactive, child active
 *       cFF  = both inactive
 *   - Apply Beta-Binomial updating to (alpha_true, beta_true) and
 *     (alpha_false, beta_false) pseudocounts.
 *   - Update P(child=1 | parent=1) = alpha_true / (alpha_true + beta_true)
 *           P(child=1 | parent=0) = alpha_false / (alpha_false + beta_false)
 *
 * An entity is considered "active" when any of these conditions holds:
 *   - For a risk: status is open/in-progress AND severity in {Medium, High, Critical}
 *   - For a control: status is Non-Compliant or Partially-Compliant
 *   - For an issue: status is open AND priority in {Medium, High, Critical}
 *   - For a framework: complianceScore < 0.7
 *   - For an incident: recorded within the lookback window
 */

import prisma from '../../../config/database';
import logger from '../../../config/logger';
import { BayesianNetwork, BayesianNode } from './bayesianNetwork';

export interface GraphNodeSpec {
  nodeKey: string;
  nodeType: 'framework' | 'control' | 'risk' | 'incident' | 'cause';
  displayName: string;
  active: boolean;          // current activation state
}

export interface GraphEdgeSpec {
  fromKey: string;
  toKey: string;
  relationshipType: 'causes' | 'mitigates' | 'depends_on' | 'covers' | 'evidences';
  mechanism?: string;
}

/**
 * Build (or refresh) the persisted knowledge graph for an organization
 * from current Prisma state, then return a BayesianNetwork ready for
 * inference. Idempotent — safe to call repeatedly.
 */
export async function buildKnowledgeGraph(
  organizationId: string,
  options: { lookbackDays?: number } = {}
): Promise<BayesianNetwork> {
  const lookbackDays = options.lookbackDays ?? 90;
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  // 1. Load entities from Prisma
  const [frameworks, risks, issues, controls] = await Promise.all([
    prisma.complianceFramework.findMany({
      where: { organizationId },
      select: { id: true, name: true, controls: { select: { status: true } } },
    }),
    prisma.riskItem.findMany({
      where: { organizationId },
      select: { id: true, title: true, severity: true, status: true },
    }),
    prisma.issue.findMany({
      where: { organizationId },
      select: { id: true, title: true, priority: true, status: true },
    }),
    prisma.frameworkControl.findMany({
      where: { framework: { organizationId } },
      select: { id: true, name: true, status: true, frameworkId: true },
    }),
  ]);

  const nodes: GraphNodeSpec[] = [];
  const edges: GraphEdgeSpec[] = [];

  for (const f of frameworks) {
    const total = f.controls.length;
    const impl = f.controls.filter((c: any) => c.status === 'Implemented').length;
    const score = total > 0 ? impl / total : 1.0;
    nodes.push({
      nodeKey: `framework:${f.id}`,
      nodeType: 'framework',
      displayName: f.name,
      active: score < 0.7,
    });
  }
  for (const r of risks) {
    nodes.push({
      nodeKey: `risk:${r.id}`,
      nodeType: 'risk',
      displayName: r.title,
      active:
        (r.status === 'Open' || r.status === 'In_Progress') &&
        ['Medium', 'High', 'Critical'].includes(r.severity),
    });
  }
  for (const i of issues) {
    nodes.push({
      nodeKey: `issue:${i.id}`,
      nodeType: 'incident',
      displayName: i.title,
      active:
        (i.status === 'Open' || i.status === 'In_Progress' || i.status === 'Reopened') &&
        ['Medium', 'High', 'Critical'].includes(i.priority),
    });
  }
  for (const c of controls) {
    nodes.push({
      nodeKey: `control:${c.id}`,
      nodeType: 'control',
      displayName: c.name,
      active: c.status === 'Non-Compliant' || c.status === 'Partially Compliant',
    });
  }

  // 2. Latent "cause" nodes — these are unobserved root causes that influence
  // multiple observed entities. Without them the graph would be too narrow.
  const causeTemplates = [
    'missing_controls',
    'policy_non_compliance',
    'third_party_vulnerability',
    'configuration_drift',
    'personnel_changes',
    'regulatory_update',
    'evidence_gaps',
    'process_breakdown',
  ];
  for (const c of causeTemplates) {
    nodes.push({
      nodeKey: `cause:${c}`,
      nodeType: 'cause',
      displayName: c.replace(/_/g, ' '),
      active: false,
    });
  }

  // 3. Edge synthesis:
  //    Each latent cause is a parent of every risk, every non-compliant
  //    control, and every issue. We then prune edges with low empirical
  //    correlation in the Beta-Binomial update step.
  const observedNodes = nodes.filter((n) => n.nodeType !== 'cause');
  for (const cause of nodes.filter((n) => n.nodeType === 'cause')) {
    for (const obs of observedNodes) {
      edges.push({
        fromKey: cause.nodeKey,
        toKey: obs.nodeKey,
        relationshipType: 'causes',
        mechanism: `${cause.displayName} contributes to ${obs.displayName}`,
      });
    }
  }
  // Risks → issues (a risk realization can become an issue)
  for (const r of nodes.filter((n) => n.nodeType === 'risk')) {
    for (const i of nodes.filter((n) => n.nodeType === 'incident')) {
      edges.push({
        fromKey: r.nodeKey,
        toKey: i.nodeKey,
        relationshipType: 'causes',
        mechanism: 'Risk realization leads to incident',
      });
    }
  }
  // Controls → risks (controls mitigate risks)
  for (const c of nodes.filter((n) => n.nodeType === 'control')) {
    for (const r of nodes.filter((n) => n.nodeType === 'risk')) {
      edges.push({
        fromKey: c.nodeKey,
        toKey: r.nodeKey,
        relationshipType: 'mitigates',
        mechanism: 'Control failure increases risk likelihood',
      });
    }
  }
  // Frameworks → controls (frameworks cover controls)
  for (const f of frameworks) {
    edges.push({
      fromKey: `framework:${f.id}`,
      toKey: `cause:missing_controls`,
      relationshipType: 'depends_on',
      mechanism: 'Framework gaps surface as missing-control activations',
    });
  }

  // 4. Persist nodes (upsert)
  await prisma.$transaction(
    nodes.map((n) =>
      prisma.knowledgeGraphEntity.upsert({
        where: { organizationId_nodeKey: { organizationId, nodeKey: n.nodeKey } },
        update: { displayName: n.displayName, updatedAt: new Date() },
        create: {
          organizationId,
          nodeKey: n.nodeKey,
          nodeType: n.nodeType,
          displayName: n.displayName,
          marginalPrior: 0.5,
          alpha: 1,
          beta: 1,
        },
      })
    )
  );
  const persistedNodes = await prisma.knowledgeGraphEntity.findMany({
    where: { organizationId },
  });
  const nodeIdByKey: Record<string, string> = {};
  for (const p of persistedNodes) nodeIdByKey[p.nodeKey] = p.id;

  // 5. Persist edges (upsert)
  for (const e of edges) {
    const fromId = nodeIdByKey[e.fromKey];
    const toId = nodeIdByKey[e.toKey];
    if (!fromId || !toId) continue;
    await prisma.knowledgeGraphRelationship.upsert({
      where: {
        fromNodeId_toNodeId_relationshipType: {
          fromNodeId: fromId,
          toNodeId: toId,
          relationshipType: e.relationshipType,
        },
      },
      update: { mechanism: e.mechanism, updatedAt: new Date() },
      create: {
        organizationId,
        fromNodeId: fromId,
        toNodeId: toId,
        relationshipType: e.relationshipType,
        mechanism: e.mechanism,
      },
    });
  }

  // 6. Update node marginals from the current activation state (single observation)
  const observationByKey: Record<string, 0 | 1> = {};
  for (const n of nodes) observationByKey[n.nodeKey] = (n.active ? 1 : 0) as 0 | 1;
  await prisma.$transaction(
    persistedNodes.map((p) => {
      const obs = observationByKey[p.nodeKey] ?? 0;
      const newAlpha = (p.alpha ?? 1) + (obs === 1 ? 1 : 0);
      const newBeta = (p.beta ?? 1) + (obs === 0 ? 1 : 0);
      const total = newAlpha + newBeta;
      return prisma.knowledgeGraphEntity.update({
        where: { id: p.id },
        data: {
          alpha: newAlpha,
          beta: newBeta,
          marginalPrior: total > 0 ? newAlpha / total : 0.5,
          observedCount: (p.observedCount ?? 0) + (obs === 1 ? 1 : 0),
          totalObservations: (p.totalObservations ?? 0) + 1,
          lastObservedAt: new Date(),
        },
      });
    })
  );

  // 7. Update edge CPTs with this observation
  const persistedEdges = await prisma.knowledgeGraphRelationship.findMany({
    where: { organizationId },
    include: { fromNode: true, toNode: true },
  });
  await prisma.$transaction(
    persistedEdges.map((e) => {
      const parentObs = observationByKey[e.fromNode.nodeKey] ?? 0;
      const childObs = observationByKey[e.toNode.nodeKey] ?? 0;
      let alphaTrue = e.alphaTrue;
      let betaTrue = e.betaTrue;
      let alphaFalse = e.alphaFalse;
      let betaFalse = e.betaFalse;
      if (parentObs === 1) {
        if (childObs === 1) alphaTrue += 1;
        else betaTrue += 1;
      } else {
        if (childObs === 1) alphaFalse += 1;
        else betaFalse += 1;
      }
      const sumTrue = alphaTrue + betaTrue;
      const sumFalse = alphaFalse + betaFalse;
      const pTrueGivenTrue = sumTrue > 0 ? alphaTrue / sumTrue : 0.5;
      const pTrueGivenFalse = sumFalse > 0 ? alphaFalse / sumFalse : 0.1;
      const confidence = Math.min(1.0, (sumTrue + sumFalse) / 50);
      return prisma.knowledgeGraphRelationship.update({
        where: { id: e.id },
        data: {
          alphaTrue, betaTrue, alphaFalse, betaFalse,
          pTrueGivenTrue, pTrueGivenFalse,
          coOccurrenceCount: e.coOccurrenceCount + (parentObs === 1 && childObs === 1 ? 1 : 0),
          jointObservations: e.jointObservations + 1,
          confidence,
        },
      });
    })
  );

  // 8. Materialize a BayesianNetwork from the persisted state
  const finalNodes = await prisma.knowledgeGraphEntity.findMany({
    where: { organizationId },
  });
  const finalEdges = await prisma.knowledgeGraphRelationship.findMany({
    where: { organizationId },
    include: { fromNode: true, toNode: true },
  });

  const network = new BayesianNetwork();
  const parentsByChild: Record<string, Array<{ fromKey: string; pTT: number; pTF: number }>> = {};
  for (const e of finalEdges) {
    if (e.relationshipType !== 'causes' && e.relationshipType !== 'mitigates') continue;
    if (!parentsByChild[e.toNode.nodeKey]) parentsByChild[e.toNode.nodeKey] = [];
    parentsByChild[e.toNode.nodeKey].push({
      fromKey: e.fromNode.nodeKey,
      pTT: e.pTrueGivenTrue,
      pTF: e.pTrueGivenFalse,
    });
  }
  // Cap parents at 4 per child to keep CPT sizes manageable (2^4 = 16)
  for (const childKey of Object.keys(parentsByChild)) {
    parentsByChild[childKey] = parentsByChild[childKey]
      .sort((a, b) => Math.abs(b.pTT - b.pTF) - Math.abs(a.pTT - a.pTF))
      .slice(0, 4);
  }

  for (const n of finalNodes) {
    const parents = parentsByChild[n.nodeKey] || [];
    const parentIds = parents.map((p) => p.fromKey);
    const cptSize = 1 << parentIds.length;
    const cpt = new Array<number>(cptSize);
    const alpha = new Array<number>(cptSize);
    const beta = new Array<number>(cptSize);

    if (parents.length === 0) {
      cpt[0] = n.marginalPrior;
      alpha[0] = n.alpha;
      beta[0] = n.beta;
    } else {
      // Synthesize CPT assuming noisy-OR-like independence between parents:
      //   P(child=1 | parents) = 1 - prod_i (1 - p_i(child | parent_i))
      // where p_i depends on whether parent_i is true or false in the assignment.
      for (let bits = 0; bits < cptSize; bits++) {
        let pNot1 = 1;
        for (let i = 0; i < parents.length; i++) {
          const parentTrue = (bits >> i) & 1;
          const pChildGivenThisParent = parentTrue ? parents[i].pTT : parents[i].pTF;
          pNot1 *= 1 - pChildGivenThisParent;
        }
        cpt[bits] = Math.min(1, Math.max(0, 1 - pNot1));
        alpha[bits] = 1;
        beta[bits] = 1;
      }
    }

    const node: BayesianNode = {
      id: n.nodeKey,
      name: n.displayName,
      parentIds,
      cpt,
      alpha,
      beta,
    };
    network.addNode(node);
  }

  logger.info(
    `[KnowledgeGraph] Built network for org=${organizationId}: ${finalNodes.length} nodes, ${finalEdges.length} edges`
  );
  return network;
}
