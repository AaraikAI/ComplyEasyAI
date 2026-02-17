/**
 * Tier-based feature gating for the frontend.
 * Mirrors server/src/config/tiers.ts TierFeatures so nav and routes can be gated by plan.
 */

import type { TierName } from '../types';

export const TIER_ORDER: TierName[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];

/** Normalize legacy plan names from DB to TierName */
export function normalizePlan(plan: string | undefined): TierName {
  if (!plan) return 'Foundation';
  const p = String(plan);
  if (TIER_ORDER.includes(p as TierName)) return p as TierName;
  if (p === 'Basic') return 'Foundation';
  if (p === 'Pro') return 'Essentials';
  if (p === 'Enterprise') return 'Growth';
  return 'Foundation';
}

/** Feature flags per tier (subset used for UI gating). Matches server TierFeatures. */
const TIER_FEATURES: Record<TierName, Record<string, boolean>> = {
  Foundation: {
    dashboard: true,
    riskManagement: true,
    complianceFrameworks: true,
    auditLogging: true,
    teamManagement: true,
    aiPolicyGeneration: true,
    aiGapAnalysis: true,
    continuousMonitoring: true,
    advancedReporting: false,
    aiContractAnalyzer: false,
    aiRfpGenerator: false,
    aiPhishingSimulator: false,
    aiVendorScorer: false,
    aiDataMapper: false,
    aiBcpGenerator: false,
    personnelManagement: false,
    vendorRiskManagement: false,
    acosGoals: false,
    nistAiRmf: false,
    euAiAct: false,
    dsa: false,
    dma: false,
    zeroTrustSecurity: false,
  },
  Essentials: {
    dashboard: true,
    riskManagement: true,
    complianceFrameworks: true,
    auditLogging: true,
    teamManagement: true,
    aiPolicyGeneration: true,
    aiGapAnalysis: true,
    continuousMonitoring: true,
    advancedReporting: true,
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
    aiPhishingSimulator: true,
    aiVendorScorer: true,
    aiDataMapper: true,
    aiBcpGenerator: true,
    personnelManagement: true,
    vendorRiskManagement: true,
    acosGoals: false,
    nistAiRmf: false,
    euAiAct: false,
    dsa: false,
    dma: false,
    zeroTrustSecurity: false,
  },
  Growth: {
    dashboard: true,
    riskManagement: true,
    complianceFrameworks: true,
    auditLogging: true,
    teamManagement: true,
    aiPolicyGeneration: true,
    aiGapAnalysis: true,
    continuousMonitoring: true,
    advancedReporting: true,
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
    aiPhishingSimulator: true,
    aiVendorScorer: true,
    aiDataMapper: true,
    aiBcpGenerator: true,
    personnelManagement: true,
    vendorRiskManagement: true,
    acosGoals: true,
    nistAiRmf: false,
    euAiAct: false,
    dsa: false,
    dma: false,
    zeroTrustSecurity: false,
  },
  Visionary: {
    dashboard: true,
    riskManagement: true,
    complianceFrameworks: true,
    auditLogging: true,
    teamManagement: true,
    aiPolicyGeneration: true,
    aiGapAnalysis: true,
    continuousMonitoring: true,
    advancedReporting: true,
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
    aiPhishingSimulator: true,
    aiVendorScorer: true,
    aiDataMapper: true,
    aiBcpGenerator: true,
    personnelManagement: true,
    vendorRiskManagement: true,
    acosGoals: true,
    nistAiRmf: true,
    euAiAct: true,
    dsa: true,
    dma: true,
    zeroTrustSecurity: true,
  },
};

/** Nav item id / view id -> tier feature key (must match keys in TIER_FEATURES) */
export const VIEW_TO_FEATURE: Record<string, string> = {
  dashboard: 'dashboard',
  'my-tasks': 'dashboard',
  risks: 'riskManagement',
  frameworks: 'complianceFrameworks',
  'framework-details': 'complianceFrameworks',
  reports: 'advancedReporting',
  audit: 'auditLogging',
  analytics: 'continuousMonitoring',
  integrations: 'complianceFrameworks',
  security: 'zeroTrustSecurity',
  acos: 'acosGoals',
  'ai-rmf': 'nistAiRmf',
  'ai-rmf-systems': 'nistAiRmf',
  'ai-rmf-create': 'nistAiRmf',
  'ai-rmf-details': 'nistAiRmf',
  'ai-rmf-assessments': 'nistAiRmf',
  'eu-ai-act': 'euAiAct',
  dma: 'dma',
  dsa: 'dsa',
  'ai-policy': 'aiPolicyGeneration',
  'ai-contract': 'aiContractAnalyzer',
  'ai-gap': 'aiGapAnalysis',
  'ai-rfp': 'aiRfpGenerator',
  'ai-phishing': 'aiPhishingSimulator',
  'ai-vendor': 'aiVendorScorer',
  'ai-data-map': 'aiDataMapper',
  'ai-bcp': 'aiBcpGenerator',
  settings: 'dashboard',
  // Phase 1: EU Regulations & US Privacy
  'eu-cra': 'euAiAct',
  csrd: 'euAiAct',
  ecodesign: 'euAiAct',
  nis2: 'euAiAct',
  'us-privacy': 'complianceFrameworks',
  // Phase 2-3: Process Mapping & Governance
  'process-mapper': 'advancedReporting',
  governance: 'advancedReporting',
  // Phase 5: Certification & Market Access
  'ce-marking': 'euAiAct',
  'digital-product-passport': 'euAiAct',
  // Phase 6: ESG & Surveillance
  'esg-reporting': 'advancedReporting',
  'post-market-surveillance': 'euAiAct',
  // Phase 7: Breach Management
  'breach-wizard': 'advancedReporting',
  // Phase 8: Post-Market Lifecycle
  'sbom-manager': 'euAiAct',
  'product-decommissioning': 'euAiAct',
  'environmental-lifecycle': 'euAiAct',
  // AI Tier Features
  'ai-cross-mapper': 'aiGapAnalysis',
  'ai-auto-remediation': 'acosGoals',
  'ai-evidence-checker': 'aiGapAnalysis',
  'ai-agentic-vendor': 'aiVendorScorer',
  'ai-audit-simulator': 'acosGoals',
  'ai-nl-query': 'aiGapAnalysis',
  'compliance-forecasting': 'continuousMonitoring',
  'product-lifecycle': 'euAiAct',
  // Related sub-views
  vendors: 'vendorRiskManagement',
  policies: 'personnelManagement',
  monitoring: 'continuousMonitoring',
  workspaces: 'advancedReporting',
  questionnaires: 'advancedReporting',
  issues: 'riskManagement',
};

export function hasFeature(plan: TierName | string | undefined, featureKey: string): boolean {
  const tier = normalizePlan(plan);
  const features = TIER_FEATURES[tier];
  if (!features) return false;
  return features[featureKey] === true;
}

/** Whether the given view/id is allowed for the user's plan */
export function canAccessView(plan: TierName | string | undefined, viewId: string): boolean {
  const featureKey = VIEW_TO_FEATURE[viewId];
  if (!featureKey) return true; // unknown view, allow (e.g. my-tasks)
  return hasFeature(plan, featureKey);
}
