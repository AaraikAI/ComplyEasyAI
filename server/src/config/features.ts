/**
 * Feature Catalog Configuration
 * 
 * Production-ready feature catalog for a-la-carte feature sales.
 * Pricing is calculated based on tier multipliers:
 * - Foundation: Base price × 2.0
 * - Essentials: Base price × 1.5
 * - Growth: Base price × 1.2
 * - Visionary: Base price × 1.0 (though all features included)
 */

import { TierName } from './tiers';

export type FeatureCategory = 'core' | 'ai' | 'enterprise' | 'acos' | 'visionary' | 'support';

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  basePriceAnnual: number;
  basePriceMonthly: number;
  requiresTier?: TierName;
  requiresFeatures?: string[]; // Prerequisite features
  availableAsAddOn: boolean;
  stripePriceIdAnnual?: string; // To be configured in Stripe
  stripePriceIdMonthly?: string; // To be configured in Stripe
  tierFeatureKey?: keyof import('./tiers').TierFeatures; // Maps to tier feature flag
}

/**
 * Calculate feature price based on tier
 */
export function calculateFeaturePrice(
  feature: Feature,
  tier: TierName,
  billingCycle: 'monthly' | 'annual'
): number {
  let multiplier = 1.0;
  
  switch (tier) {
    case 'Foundation':
      multiplier = 2.0;
      break;
    case 'Essentials':
      multiplier = 1.5;
      break;
    case 'Growth':
      multiplier = 1.2;
      break;
    case 'Visionary':
      multiplier = 1.0; // Though all features included, pricing for reference
      break;
  }
  
  const basePrice = billingCycle === 'annual' 
    ? feature.basePriceAnnual 
    : feature.basePriceMonthly;
  
  return Math.round(basePrice * multiplier);
}

/**
 * Feature Catalog - All available features for a-la-carte purchase
 */
export const FEATURES: Record<string, Feature> = {
  // ============================================================================
  // FULL AI FEATURES (Essentials+)
  // ============================================================================
  'ai-contract-analyzer': {
    id: 'ai-contract-analyzer',
    name: 'AI Contract Analyzer',
    description: 'Automated contract analysis and compliance checking using advanced AI',
    category: 'ai',
    basePriceAnnual: 500,
    basePriceMonthly: 50,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'aiContractAnalyzer',
  },
  'ai-rfp-generator': {
    id: 'ai-rfp-generator',
    name: 'AI RFP Generator',
    description: 'Generate comprehensive RFP responses with AI-powered compliance insights',
    category: 'ai',
    basePriceAnnual: 500,
    basePriceMonthly: 50,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'aiRfpGenerator',
  },
  'ai-phishing-simulator': {
    id: 'ai-phishing-simulator',
    name: 'AI Phishing Simulator',
    description: 'Simulate phishing attacks and train employees on security awareness',
    category: 'ai',
    basePriceAnnual: 400,
    basePriceMonthly: 40,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'aiPhishingSimulator',
  },
  'ai-vendor-scorer': {
    id: 'ai-vendor-scorer',
    name: 'AI Vendor Scorer',
    description: 'AI-powered vendor risk assessment and scoring',
    category: 'ai',
    basePriceAnnual: 400,
    basePriceMonthly: 40,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'aiVendorScorer',
  },
  'ai-data-mapper': {
    id: 'ai-data-mapper',
    name: 'AI Data Mapper',
    description: 'Automated data mapping and classification for compliance',
    category: 'ai',
    basePriceAnnual: 500,
    basePriceMonthly: 50,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'aiDataMapper',
  },
  'ai-bcp-generator': {
    id: 'ai-bcp-generator',
    name: 'AI BCP Generator',
    description: 'Generate business continuity plans with AI assistance',
    category: 'ai',
    basePriceAnnual: 400,
    basePriceMonthly: 40,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'aiBcpGenerator',
  },

  // ============================================================================
  // ENTERPRISE FEATURES (Essentials+)
  // ============================================================================
  'personnel-management': {
    id: 'personnel-management',
    name: 'Personnel Management',
    description: 'Comprehensive personnel management and access control',
    category: 'enterprise',
    basePriceAnnual: 400,
    basePriceMonthly: 40,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'personnelManagement',
  },
  'vendor-risk-management': {
    id: 'vendor-risk-management',
    name: 'Vendor Risk Management',
    description: 'Advanced vendor risk assessment and management',
    category: 'enterprise',
    basePriceAnnual: 500,
    basePriceMonthly: 50,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'vendorRiskManagement',
  },
  'policy-library': {
    id: 'policy-library',
    name: 'Policy Library',
    description: 'Centralized policy library with version control',
    category: 'enterprise',
    basePriceAnnual: 300,
    basePriceMonthly: 30,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'policyLibrary',
  },
  'trust-center': {
    id: 'trust-center',
    name: 'Trust Center',
    description: 'Public-facing trust center for compliance transparency',
    category: 'enterprise',
    basePriceAnnual: 400,
    basePriceMonthly: 40,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'trustCenter',
  },
  'multi-workspace': {
    id: 'multi-workspace',
    name: 'Multi-Workspace',
    description: 'Manage multiple workspaces and organizational units',
    category: 'enterprise',
    basePriceAnnual: 600,
    basePriceMonthly: 60,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'multiWorkspace',
  },
  'advanced-reporting': {
    id: 'advanced-reporting',
    name: 'Advanced Reporting',
    description: 'Advanced analytics and custom reporting capabilities',
    category: 'enterprise',
    basePriceAnnual: 400,
    basePriceMonthly: 40,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'advancedReporting',
  },
  'issue-management': {
    id: 'issue-management',
    name: 'Issue Management',
    description: 'Comprehensive issue tracking and remediation workflow',
    category: 'enterprise',
    basePriceAnnual: 300,
    basePriceMonthly: 30,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'issueManagement',
  },

  // ============================================================================
  // ACOS FEATURES (Growth+)
  // ============================================================================
  'acos-goals': {
    id: 'acos-goals',
    name: 'aCOS Compliance Goals',
    description: 'Set and track compliance goals with autonomous orchestration',
    category: 'acos',
    basePriceAnnual: 800,
    basePriceMonthly: 80,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosGoals',
  },
  'acos-control-loops': {
    id: 'acos-control-loops',
    name: 'aCOS Control Loops',
    description: 'Autonomous control loops for continuous compliance',
    category: 'acos',
    basePriceAnnual: 800,
    basePriceMonthly: 80,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosControlLoops',
  },
  'acos-debt-tracking': {
    id: 'acos-debt-tracking',
    name: 'aCOS Debt Tracking',
    description: 'Track and manage compliance debt over time',
    category: 'acos',
    basePriceAnnual: 600,
    basePriceMonthly: 60,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosDebtTracking',
  },
  'acos-change-impact': {
    id: 'acos-change-impact',
    name: 'aCOS Change Impact Analysis',
    description: 'Analyze impact of changes on compliance posture',
    category: 'acos',
    basePriceAnnual: 600,
    basePriceMonthly: 60,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosChangeImpact',
  },
  'acos-agentic-actions': {
    id: 'acos-agentic-actions',
    name: 'aCOS Agentic Actions',
    description: 'Autonomous agentic actions for compliance automation',
    category: 'acos',
    basePriceAnnual: 1000,
    basePriceMonthly: 100,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosAgenticActions',
  },
  'acos-evidence-truth': {
    id: 'acos-evidence-truth',
    name: 'aCOS Evidence Truth',
    description: 'Immutable evidence truth layer for compliance proof',
    category: 'acos',
    basePriceAnnual: 800,
    basePriceMonthly: 80,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosEvidenceTruth',
  },
  'acos-regulatory-intelligence': {
    id: 'acos-regulatory-intelligence',
    name: 'aCOS Regulatory Intelligence',
    description: 'Real-time regulatory intelligence and monitoring',
    category: 'acos',
    basePriceAnnual: 1000,
    basePriceMonthly: 100,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosRegulatoryIntelligence',
  },
  'acos-temporal-graphs': {
    id: 'acos-temporal-graphs',
    name: 'aCOS Temporal Graphs',
    description: 'Temporal graph networks for compliance prediction',
    category: 'acos',
    basePriceAnnual: 800,
    basePriceMonthly: 80,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosTemporalGraphs',
  },
  'acos-digital-twin': {
    id: 'acos-digital-twin',
    name: 'aCOS Digital Twin',
    description: 'Digital twin of compliance infrastructure',
    category: 'acos',
    basePriceAnnual: 1200,
    basePriceMonthly: 120,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosDigitalTwin',
  },
  'acos-red-team': {
    id: 'acos-red-team',
    name: 'aCOS Red Team Simulations',
    description: 'Automated red team simulations for compliance testing',
    category: 'acos',
    basePriceAnnual: 1000,
    basePriceMonthly: 100,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosRedTeam',
  },
  'acos-federated-learning': {
    id: 'acos-federated-learning',
    name: 'aCOS Federated Learning',
    description: 'Federated learning for privacy-preserving compliance AI',
    category: 'acos',
    basePriceAnnual: 1200,
    basePriceMonthly: 120,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosFederatedLearning',
  },
  'acos-multimodal': {
    id: 'acos-multimodal',
    name: 'aCOS Multi-Modal AI',
    description: 'Multi-modal AI for comprehensive compliance analysis',
    category: 'acos',
    basePriceAnnual: 1000,
    basePriceMonthly: 100,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'acosMultiModal',
  },

  // ============================================================================
  // VISIONARY FEATURES (Visionary only)
  // ============================================================================
  'physical-ai': {
    id: 'physical-ai',
    name: 'Physical AI Compliance',
    description: 'Physical AI devices compliance monitoring and management',
    category: 'visionary',
    basePriceAnnual: 5000,
    basePriceMonthly: 500,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosPhysicalAi',
  },
  'vr-training': {
    id: 'vr-training',
    name: 'VR Training',
    description: 'Virtual reality training for compliance and security',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosVrTraining',
  },
  'swarm-intelligence': {
    id: 'swarm-intelligence',
    name: 'Swarm Intelligence',
    description: 'Swarm intelligence for distributed compliance orchestration',
    category: 'visionary',
    basePriceAnnual: 5000,
    basePriceMonthly: 500,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosSwarmIntelligence',
  },
  'neuro-symbolic': {
    id: 'neuro-symbolic',
    name: 'Neuro-Symbolic AI',
    description: 'Neuro-symbolic AI for advanced compliance reasoning',
    category: 'visionary',
    basePriceAnnual: 5000,
    basePriceMonthly: 500,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosNeuroSymbolic',
  },
  'homomorphic-encryption': {
    id: 'homomorphic-encryption',
    name: 'Homomorphic Encryption',
    description: 'Homomorphic encryption for privacy-preserving compliance',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosHomomorphicEncryption',
  },
  'monte-carlo': {
    id: 'monte-carlo',
    name: 'Monte Carlo Simulations',
    description: 'Monte Carlo simulations for risk analysis',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosMonteCarlo',
  },
  'risk-prediction': {
    id: 'risk-prediction',
    name: 'AI Risk Prediction',
    description: 'Advanced AI-powered risk prediction and forecasting',
    category: 'visionary',
    basePriceAnnual: 1200,
    basePriceMonthly: 120,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosRiskPrediction',
  },
  'jit-compliance': {
    id: 'jit-compliance',
    name: 'JIT Compliance',
    description: 'Just-in-time compliance for dynamic environments',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosJitCompliance',
  },
  'real-time-compliance': {
    id: 'real-time-compliance',
    name: 'Real-Time Compliance',
    description: 'Real-time compliance monitoring and enforcement',
    category: 'visionary',
    basePriceAnnual: 1200,
    basePriceMonthly: 120,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'acosRealTimeCompliance',
  },
  'zero-trust': {
    id: 'zero-trust',
    name: 'Zero Trust Security',
    description: 'Zero trust security architecture for compliance',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'zeroTrustSecurity',
  },
  'zk-proofs': {
    id: 'zk-proofs',
    name: 'Zero-Knowledge Proofs',
    description: 'Zero-knowledge proofs for privacy-preserving compliance',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'zkProofs',
  },
  'byok-encryption': {
    id: 'byok-encryption',
    name: 'BYOK Encryption',
    description: 'Bring your own key encryption for data sovereignty',
    category: 'visionary',
    basePriceAnnual: 1200,
    basePriceMonthly: 120,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'byokEncryption',
  },
  'compliance-as-code': {
    id: 'compliance-as-code',
    name: 'Compliance-as-Code',
    description: 'Compliance-as-code with OPA/Rego policies',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'complianceAsCode',
  },
  'iot-edge': {
    id: 'iot-edge',
    name: 'IoT/Edge Compliance',
    description: 'IoT and edge device compliance monitoring',
    category: 'visionary',
    basePriceAnnual: 1500,
    basePriceMonthly: 150,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
    tierFeatureKey: 'iotEdgeCompliance',
  },

  // ============================================================================
  // SUPPORT & SLA FEATURES
  // ============================================================================
  'sla-guarantee': {
    id: 'sla-guarantee',
    name: 'SLA Guarantee',
    description: 'Service level agreement guarantee with uptime commitments',
    category: 'support',
    basePriceAnnual: 1000,
    basePriceMonthly: 100,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'slaGuarantee',
  },
  'priority-support': {
    id: 'priority-support',
    name: 'Priority Support',
    description: 'Priority support with faster response times',
    category: 'support',
    basePriceAnnual: 500,
    basePriceMonthly: 50,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
    tierFeatureKey: 'prioritySupport',
  },
  'white-glove-onboarding': {
    id: 'white-glove-onboarding',
    name: 'White-Glove Onboarding',
    description: 'Dedicated onboarding specialist for smooth implementation',
    category: 'support',
    basePriceAnnual: 1000,
    basePriceMonthly: 100,
    requiresTier: 'Growth',
    availableAsAddOn: true,
    tierFeatureKey: 'whiteGloveOnboarding',
  },
};

/**
 * Feature bundles with discounts
 */
export interface FeatureBundle {
  id: string;
  name: string;
  description: string;
  featureIds: string[];
  discountPercent: number; // 10-15% discount
  basePriceAnnual: number;
  basePriceMonthly: number;
  requiresTier?: TierName;
  availableAsAddOn: boolean;
}

export const FEATURE_BUNDLES: Record<string, FeatureBundle> = {
  'ai-suite-bundle': {
    id: 'ai-suite-bundle',
    name: 'AI Suite Bundle',
    description: 'All 6 Full AI Features at a discounted rate',
    featureIds: [
      'ai-contract-analyzer',
      'ai-rfp-generator',
      'ai-phishing-simulator',
      'ai-vendor-scorer',
      'ai-data-mapper',
      'ai-bcp-generator',
    ],
    discountPercent: 15,
    basePriceAnnual: 2200, // 15% off $2,600
    basePriceMonthly: 220,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
  },
  'enterprise-bundle': {
    id: 'enterprise-bundle',
    name: 'Enterprise Bundle',
    description: 'All 7 Enterprise Features at a discounted rate',
    featureIds: [
      'personnel-management',
      'vendor-risk-management',
      'policy-library',
      'trust-center',
      'multi-workspace',
      'advanced-reporting',
      'issue-management',
    ],
    discountPercent: 15,
    basePriceAnnual: 2500, // 15% off $2,900
    basePriceMonthly: 250,
    requiresTier: 'Essentials',
    availableAsAddOn: true,
  },
  'acos-bundle': {
    id: 'acos-bundle',
    name: 'aCOS Bundle',
    description: 'All 12 aCOS Features at a discounted rate',
    featureIds: [
      'acos-goals',
      'acos-control-loops',
      'acos-debt-tracking',
      'acos-change-impact',
      'acos-agentic-actions',
      'acos-evidence-truth',
      'acos-regulatory-intelligence',
      'acos-temporal-graphs',
      'acos-digital-twin',
      'acos-red-team',
      'acos-federated-learning',
      'acos-multimodal',
    ],
    discountPercent: 15,
    basePriceAnnual: 9000, // 15% off $10,600
    basePriceMonthly: 900,
    requiresTier: 'Growth',
    availableAsAddOn: true,
  },
  'visionary-bundle': {
    id: 'visionary-bundle',
    name: 'Visionary Bundle',
    description: 'All 14 Visionary Features at a discounted rate',
    featureIds: [
      'physical-ai',
      'vr-training',
      'swarm-intelligence',
      'neuro-symbolic',
      'homomorphic-encryption',
      'monte-carlo',
      'risk-prediction',
      'jit-compliance',
      'real-time-compliance',
      'zero-trust',
      'zk-proofs',
      'byok-encryption',
      'compliance-as-code',
      'iot-edge',
    ],
    discountPercent: 15,
    basePriceAnnual: 18000, // 15% off $21,200
    basePriceMonthly: 1800,
    requiresTier: 'Visionary',
    availableAsAddOn: true,
  },
};

/**
 * Get all features available for a tier
 */
export function getAvailableFeatures(tier: TierName): Feature[] {
  return Object.values(FEATURES).filter(feature => {
    if (!feature.availableAsAddOn) return false;
    if (!feature.requiresTier) return true;
    return isTierAtLeast(tier, feature.requiresTier);
  });
}

/**
 * Get all bundles available for a tier
 */
export function getAvailableBundles(tier: TierName): FeatureBundle[] {
  return Object.values(FEATURE_BUNDLES).filter(bundle => {
    if (!bundle.availableAsAddOn) return false;
    if (!bundle.requiresTier) return true;
    return isTierAtLeast(tier, bundle.requiresTier);
  });
}

/**
 * Helper to check if tier A is at least tier B
 */
function isTierAtLeast(tierA: TierName, tierB: TierName): boolean {
  const TIER_ORDER: TierName[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];
  return TIER_ORDER.indexOf(tierA) >= TIER_ORDER.indexOf(tierB);
}

/**
 * Get feature by ID
 */
export function getFeature(featureId: string): Feature | undefined {
  return FEATURES[featureId];
}

/**
 * Get bundle by ID
 */
export function getBundle(bundleId: string): FeatureBundle | undefined {
  return FEATURE_BUNDLES[bundleId];
}

export default FEATURES;

