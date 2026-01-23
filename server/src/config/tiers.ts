/**
 * ComplyEasyAI Tier Configuration
 *
 * Production-level tier system with 4 tiers:
 * - Foundation: Startups/SMBs worldwide
 * - Essentials: Growing SMBs (10-100 users)
 * - Growth: Mid-market/MSPs (100-1k users)
 * - Visionary: Large corps/gov (1k+ users)
 */

export type TierName = 'Foundation' | 'Essentials' | 'Growth' | 'Visionary';
export type BillingCycle = 'monthly' | 'annual';

export interface TierPricing {
  annualMin: number;        // Minimum annual price in USD
  annualMax: number;        // Maximum annual price in USD
  monthlyMultiplier: number; // Typically 1.0 for billed annually pricing
  monthlyMin?: number;      // Monthly rate when billed annually (annualMin/12)
  monthlyMax?: number;      // Monthly rate when billed annually (annualMax/12)
  perUserIncrement?: number; // Additional cost per 10 users (for scaling tiers)
  stripePriceIdAnnual?: string;
  stripePriceIdMonthly?: string;
  netAfterStripeMin: number; // After ~2.9% + $0.30 Stripe fees
  netAfterStripeMax: number;
  margin: string;           // Profit margin description
}

export interface TierLimits {
  maxUsers: number;
  maxFrameworks: number;
  maxWorkspaces: number;
  maxQuestionnairesPerMonth: number;
  maxVendors: number;
  maxPolicies: number;
  maxIntegrations: number;
  maxCustomReports: number;
  maxMonitors: number;
  maxIssues: number;
  maxRiskAssessments: number;
  maxAiRequestsPerMonth: number;
  maxStorageGB: number;
  maxApiRequestsPerDay: number;
  dataRetentionDays: number;
}

export interface TierFeatures {
  // Core Features
  authentication: boolean;
  twoFactorAuth: boolean;
  complianceFrameworks: boolean;
  riskManagement: boolean;
  auditLogging: boolean;
  dashboard: boolean;
  teamManagement: boolean;

  // Basic AI Features
  aiPolicyGeneration: boolean;
  aiGapAnalysis: boolean;

  // Full AI Features (Essentials+)
  aiContractAnalyzer: boolean;
  aiRfpGenerator: boolean;
  aiPhishingSimulator: boolean;
  aiVendorScorer: boolean;
  aiDataMapper: boolean;
  aiBcpGenerator: boolean;

  // Enterprise Features
  personnelManagement: boolean;
  vendorRiskManagement: boolean;
  policyLibrary: boolean;
  trustCenter: boolean;
  multiWorkspace: boolean;
  advancedReporting: boolean;
  continuousMonitoring: boolean;
  issueManagement: boolean;

  // aCOS Features (Growth+)
  acosGoals: boolean;
  acosControlLoops: boolean;
  acosDebtTracking: boolean;
  acosChangeImpact: boolean;
  acosAgenticActions: boolean;
  acosEvidenceTruth: boolean;
  acosRegulatoryIntelligence: boolean;
  acosTemporalGraphs: boolean;
  acosDigitalTwin: boolean;
  acosRedTeam: boolean;
  acosFederatedLearning: boolean;
  acosMultiModal: boolean;
  customFrameworks: boolean;

  // Visionary Features
  acosPhysicalAi: boolean;
  acosVrTraining: boolean;
  acosSwarmIntelligence: boolean;
  acosNeuroSymbolic: boolean;
  acosHomomorphicEncryption: boolean;
  acosMonteCarlo: boolean;
  acosRiskPrediction: boolean;
  acosJitCompliance: boolean;
  acosRealTimeCompliance: boolean;
  zeroTrustSecurity: boolean;
  zkProofs: boolean;
  byokEncryption: boolean;
  complianceAsCode: boolean;
  iotEdgeCompliance: boolean;

  // EU Regulations & AI Governance (Visionary)
  nistAiRmf: boolean;
  euAiAct: boolean;
  dsa: boolean;
  dma: boolean;

  // Support & SLA
  slaGuarantee: boolean;
  dedicatedSupport: boolean;
  onPremDeployment: boolean;
  customAiModels: boolean;
  prioritySupport: boolean;
  whiteGloveOnboarding: boolean;

  // Add-ons Availability
  customFrameworksAddOn: boolean;
  onPremAddOn: boolean;
  customAiAddOn: boolean;
}

export interface TierAddOn {
  id: string;
  name: string;
  description: string;
  priceAnnual: number;
  stripePriceId?: string;
  availableForTiers: TierName[];
}

export interface Tier {
  name: TierName;
  displayName: string;
  tagline: string;
  description: string;
  targetAudience: string;
  pricing: TierPricing;
  limits: TierLimits;
  features: TierFeatures;
  highlights: string[];
  growthDrivers: string[];
}

// ============================================================================
// FOUNDATION TIER
// ============================================================================
const foundationTier: Tier = {
  name: 'Foundation',
  displayName: 'Foundation',
  tagline: 'Start Your Compliance Journey',
  description: 'Perfect for startups and SMBs beginning their compliance journey with essential features and AI assistance.',
  targetAudience: 'Startups/SMBs worldwide (e.g., tech/AI firms testing regulations)',

  pricing: {
    annualMin: 8500,
    annualMax: 8500,
    monthlyMultiplier: 2.0, // Monthly billing: (8500 * 2) / 12 = $1,417/mo
    monthlyMin: 1417,
    monthlyMax: 1417,
    netAfterStripeMin: 8253, // Annual: 8500 - (8500 * 0.029 + 0.30) = 8253.20
    netAfterStripeMax: 8253,
    margin: '>92% margins (covers minimal costs)',
  },

  limits: {
    maxUsers: 10,
    maxFrameworks: 3,
    maxWorkspaces: 1,
    maxQuestionnairesPerMonth: 5,
    maxVendors: 10,
    maxPolicies: 25,
    maxIntegrations: 3,
    maxCustomReports: 5,
    maxMonitors: 5,
    maxIssues: 50,
    maxRiskAssessments: 10,
    maxAiRequestsPerMonth: 100,
    maxStorageGB: 5,
    maxApiRequestsPerDay: 1000,
    dataRetentionDays: 365, // 1 year
  },

  features: {
    // Core Features - ALL INCLUDED
    authentication: true,
    twoFactorAuth: true,
    complianceFrameworks: true,
    riskManagement: true,
    auditLogging: true,
    dashboard: true,
    teamManagement: true,

    // Basic AI Features - INCLUDED
    aiPolicyGeneration: true,
    aiGapAnalysis: true,

    // Full AI Features - NOT INCLUDED
    aiContractAnalyzer: false,
    aiRfpGenerator: false,
    aiPhishingSimulator: false,
    aiVendorScorer: false,
    aiDataMapper: false,
    aiBcpGenerator: false,

    // Enterprise Features - LIMITED
    personnelManagement: false,
    vendorRiskManagement: false,
    policyLibrary: false,
    trustCenter: false,
    multiWorkspace: false,
    advancedReporting: false,
    continuousMonitoring: true, // Basic monitoring only
    issueManagement: false,

    // aCOS Features - NOT INCLUDED
    acosGoals: false,
    acosControlLoops: false,
    acosDebtTracking: false,
    acosChangeImpact: false,
    acosAgenticActions: false,
    acosEvidenceTruth: false,
    acosRegulatoryIntelligence: false,
    acosTemporalGraphs: false,
    acosDigitalTwin: false,
    acosRedTeam: false,
    acosFederatedLearning: false,
    acosMultiModal: false,
    customFrameworks: false,

    // Visionary Features - NOT INCLUDED
    acosPhysicalAi: false,
    acosVrTraining: false,
    acosSwarmIntelligence: false,
    acosNeuroSymbolic: false,
    acosHomomorphicEncryption: false,
    acosMonteCarlo: false,
    acosRiskPrediction: false,
    acosJitCompliance: false,
    acosRealTimeCompliance: false,
    zeroTrustSecurity: false,
    zkProofs: false,
    byokEncryption: false,
    complianceAsCode: false,
    iotEdgeCompliance: false,

    // EU Regulations & AI Governance - NOT INCLUDED
    nistAiRmf: false,
    euAiAct: false,
    dsa: false,
    dma: false,

    // Support & SLA - BASIC
    slaGuarantee: false,
    dedicatedSupport: false,
    onPremDeployment: false,
    customAiModels: false,
    prioritySupport: false,
    whiteGloveOnboarding: false,

    // Add-ons - NOT AVAILABLE
    customFrameworksAddOn: false,
    onPremAddOn: false,
    customAiAddOn: false,
  },

  highlights: [
    'Core authentication with 2FA',
    'Up to 3 compliance frameworks',
    '10 team members',
    'Basic AI policy generation',
    'AI gap analysis',
    'Basic monitoring',
    'Full audit logging',
    'Interactive dashboard',
  ],

  growthDrivers: [
    'Entry paid tier with low barrier for trials',
    'Affordable onboarding for startups',
    'Natural upsell path to Essentials',
  ],
};

// ============================================================================
// ESSENTIALS TIER
// ============================================================================
const essentialsTier: Tier = {
  name: 'Essentials',
  displayName: 'Essentials',
  tagline: 'Complete Compliance Toolkit',
  description: 'Full-featured compliance platform with advanced AI and enterprise basics for growing organizations.',
  targetAudience: 'Growing SMBs (10-100 users; tech/finance/healthcare)',

  pricing: {
    annualMin: 17000,
    annualMax: 17000,
    monthlyMultiplier: 1.5, // Monthly billing: (17000 * 1.5) / 12 = $2,125/mo
    monthlyMin: 2125,
    monthlyMax: 2125,
    netAfterStripeMin: 16507, // Annual: 17000 - (17000 * 0.029 + 0.30) = 16506.70
    netAfterStripeMax: 16507,
    margin: '90%+ margins (absorb ~3% fees)',
  },

  limits: {
    maxUsers: 100,
    maxFrameworks: 10,
    maxWorkspaces: 5,
    maxQuestionnairesPerMonth: 50,
    maxVendors: 100,
    maxPolicies: 250,
    maxIntegrations: 15,
    maxCustomReports: 50,
    maxMonitors: 50,
    maxIssues: 500,
    maxRiskAssessments: 100,
    maxAiRequestsPerMonth: 1000,
    maxStorageGB: 50,
    maxApiRequestsPerDay: 10000,
    dataRetentionDays: 730, // 2 years
  },

  features: {
    // Core Features - ALL INCLUDED
    authentication: true,
    twoFactorAuth: true,
    complianceFrameworks: true,
    riskManagement: true,
    auditLogging: true,
    dashboard: true,
    teamManagement: true,

    // Basic AI Features - INCLUDED
    aiPolicyGeneration: true,
    aiGapAnalysis: true,

    // Full AI Features - ALL INCLUDED
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
    aiPhishingSimulator: true,
    aiVendorScorer: true,
    aiDataMapper: true,
    aiBcpGenerator: true,

    // Enterprise Features - ALL INCLUDED
    personnelManagement: true,
    vendorRiskManagement: true,
    policyLibrary: true,
    trustCenter: true,
    multiWorkspace: true,
    advancedReporting: true,
    continuousMonitoring: true,
    issueManagement: true,

    // aCOS Features - NOT INCLUDED
    acosGoals: false,
    acosControlLoops: false,
    acosDebtTracking: false,
    acosChangeImpact: false,
    acosAgenticActions: false,
    acosEvidenceTruth: false,
    acosRegulatoryIntelligence: false,
    acosTemporalGraphs: false,
    acosDigitalTwin: false,
    acosRedTeam: false,
    acosFederatedLearning: false,
    acosMultiModal: false,
    customFrameworks: false,

    // Visionary Features - NOT INCLUDED
    acosPhysicalAi: false,
    acosVrTraining: false,
    acosSwarmIntelligence: false,
    acosNeuroSymbolic: false,
    acosHomomorphicEncryption: false,
    acosMonteCarlo: false,
    acosRiskPrediction: false,
    acosJitCompliance: false,
    acosRealTimeCompliance: false,
    zeroTrustSecurity: false,
    zkProofs: false,
    byokEncryption: false,
    complianceAsCode: false,
    iotEdgeCompliance: false,

    // EU Regulations & AI Governance - NOT INCLUDED
    nistAiRmf: false,
    euAiAct: false,
    dsa: false,
    dma: false,

    // Support & SLA
    slaGuarantee: false,
    dedicatedSupport: false,
    onPremDeployment: false,
    customAiModels: false,
    prioritySupport: true,
    whiteGloveOnboarding: false,

    // Add-ons
    customFrameworksAddOn: false,
    onPremAddOn: false,
    customAiAddOn: false,
  },

  highlights: [
    'Everything in Foundation',
    'Full AI suite (Contract Analyzer, RFP, Phishing, etc.)',
    'Personnel & Vendor Risk Management',
    'Policy Library & Trust Center',
    'Up to 5 workspaces',
    'Advanced reporting & analytics',
    'Up to 100 users',
    'Priority support',
  ],

  growthDrivers: [
    'Captures competitors\' customers with superior AI at lower cost',
    'Organic growth via integrations and content marketing',
    '20-25% below competitor pricing ($6k-$15k)',
  ],
};

// ============================================================================
// GROWTH TIER
// ============================================================================
const growthTier: Tier = {
  name: 'Growth',
  displayName: 'Growth',
  tagline: 'Autonomous Compliance Excellence',
  description: 'Advanced aCOS capabilities for mid-market companies and MSPs requiring autonomous compliance orchestration.',
  targetAudience: 'Mid-market/MSPs (100-1k users; multi-region)',

  pricing: {
    annualMin: 8500,
    annualMax: 25500,
    monthlyMultiplier: 1.0, // Monthly billed annually: $708-$2,125/mo
    monthlyMin: 708,
    monthlyMax: 2125,
    netAfterStripeMin: 8250,
    netAfterStripeMax: 24735,
    margin: '88% margins',
  },

  limits: {
    maxUsers: 1000,
    maxFrameworks: 50,
    maxWorkspaces: 25,
    maxQuestionnairesPerMonth: 500,
    maxVendors: 1000,
    maxPolicies: 2500,
    maxIntegrations: 50,
    maxCustomReports: 250,
    maxMonitors: 250,
    maxIssues: 5000,
    maxRiskAssessments: 1000,
    maxAiRequestsPerMonth: 10000,
    maxStorageGB: 500,
    maxApiRequestsPerDay: 100000,
    dataRetentionDays: 1825, // 5 years
  },

  features: {
    // Core Features - ALL INCLUDED
    authentication: true,
    twoFactorAuth: true,
    complianceFrameworks: true,
    riskManagement: true,
    auditLogging: true,
    dashboard: true,
    teamManagement: true,

    // Basic AI Features - INCLUDED
    aiPolicyGeneration: true,
    aiGapAnalysis: true,

    // Full AI Features - ALL INCLUDED
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
    aiPhishingSimulator: true,
    aiVendorScorer: true,
    aiDataMapper: true,
    aiBcpGenerator: true,

    // Enterprise Features - ALL INCLUDED
    personnelManagement: true,
    vendorRiskManagement: true,
    policyLibrary: true,
    trustCenter: true,
    multiWorkspace: true,
    advancedReporting: true,
    continuousMonitoring: true,
    issueManagement: true,

    // aCOS Basic Features - INCLUDED
    acosGoals: true,
    acosControlLoops: true,
    acosDebtTracking: true,
    acosChangeImpact: true,
    acosAgenticActions: true,
    acosEvidenceTruth: true,
    acosRegulatoryIntelligence: true,
    acosTemporalGraphs: true,
    acosDigitalTwin: true,
    acosRedTeam: true,
    acosFederatedLearning: true,
    acosMultiModal: true,
    customFrameworks: true,

    // Visionary Features - NOT INCLUDED
    acosPhysicalAi: false,
    acosVrTraining: false,
    acosSwarmIntelligence: false,
    acosNeuroSymbolic: false,
    acosHomomorphicEncryption: false,
    acosMonteCarlo: false,
    acosRiskPrediction: false,
    acosJitCompliance: false,
    acosRealTimeCompliance: false,
    zeroTrustSecurity: false,
    zkProofs: false,
    byokEncryption: false,
    complianceAsCode: false,
    iotEdgeCompliance: false,

    // EU Regulations & AI Governance - NOT INCLUDED
    nistAiRmf: false,
    euAiAct: false,
    dsa: false,
    dma: false,

    // Support & SLA
    slaGuarantee: true,
    dedicatedSupport: false,
    onPremDeployment: false,
    customAiModels: false,
    prioritySupport: true,
    whiteGloveOnboarding: true,

    // Add-ons
    customFrameworksAddOn: true, // $750-800 add-on available
    onPremAddOn: false,
    customAiAddOn: false,
  },

  highlights: [
    'Everything in Essentials',
    'Full aCOS v3.0 capabilities',
    'Compliance Goals & Control Loops',
    'Debt Tracking & Change Impact Analysis',
    'Agentic Actions & Evidence Truth',
    'Regulatory Intelligence',
    'Digital Twin & Red Team simulations',
    'Federated Learning & Multi-Modal AI',
    'Custom frameworks add-on available',
    'Up to 1,000 users',
  ],

  growthDrivers: [
    'Viral growth via MSP partnerships',
    'International appeal with regulatory fabric for global capture',
    '20-25% below competitor pricing ($10k-$30k)',
  ],
};

// ============================================================================
// VISIONARY TIER
// ============================================================================
const visionaryTier: Tier = {
  name: 'Visionary',
  displayName: 'Visionary',
  tagline: 'Future-Proof Compliance Innovation',
  description: 'Cutting-edge compliance technology with full aCOS, advanced AI, and enterprise-grade security for large organizations.',
  targetAudience: 'Large corps/gov (1k+ users; energy/manufacturing/crypto)',

  pricing: {
    annualMin: 17000,
    annualMax: 85000,
    monthlyMultiplier: 1.0, // Monthly billed annually: $1,417-$7,083/mo
    monthlyMin: 1417,
    monthlyMax: 7083,
    netAfterStripeMin: 16490,
    netAfterStripeMax: 82450,
    margin: '85%+ margins (optimized costs)',
  },

  limits: {
    maxUsers: -1, // Unlimited
    maxFrameworks: -1, // Unlimited
    maxWorkspaces: -1, // Unlimited
    maxQuestionnairesPerMonth: -1, // Unlimited
    maxVendors: -1, // Unlimited
    maxPolicies: -1, // Unlimited
    maxIntegrations: -1, // Unlimited
    maxCustomReports: -1, // Unlimited
    maxMonitors: -1, // Unlimited
    maxIssues: -1, // Unlimited
    maxRiskAssessments: -1, // Unlimited
    maxAiRequestsPerMonth: -1, // Unlimited (fair use policy)
    maxStorageGB: -1, // Unlimited (fair use policy)
    maxApiRequestsPerDay: -1, // Unlimited (fair use policy)
    dataRetentionDays: 3650, // 10 years
  },

  features: {
    // Core Features - ALL INCLUDED
    authentication: true,
    twoFactorAuth: true,
    complianceFrameworks: true,
    riskManagement: true,
    auditLogging: true,
    dashboard: true,
    teamManagement: true,

    // Basic AI Features - INCLUDED
    aiPolicyGeneration: true,
    aiGapAnalysis: true,

    // Full AI Features - ALL INCLUDED
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
    aiPhishingSimulator: true,
    aiVendorScorer: true,
    aiDataMapper: true,
    aiBcpGenerator: true,

    // Enterprise Features - ALL INCLUDED
    personnelManagement: true,
    vendorRiskManagement: true,
    policyLibrary: true,
    trustCenter: true,
    multiWorkspace: true,
    advancedReporting: true,
    continuousMonitoring: true,
    issueManagement: true,

    // aCOS Basic Features - ALL INCLUDED
    acosGoals: true,
    acosControlLoops: true,
    acosDebtTracking: true,
    acosChangeImpact: true,
    acosAgenticActions: true,
    acosEvidenceTruth: true,
    acosRegulatoryIntelligence: true,
    acosTemporalGraphs: true,
    acosDigitalTwin: true,
    acosRedTeam: true,
    acosFederatedLearning: true,
    acosMultiModal: true,
    customFrameworks: true,

    // Visionary Features - ALL INCLUDED
    acosPhysicalAi: true,
    acosVrTraining: true,
    acosSwarmIntelligence: true,
    acosNeuroSymbolic: true,
    acosHomomorphicEncryption: true,
    acosMonteCarlo: true,
    acosRiskPrediction: true,
    acosJitCompliance: true,
    acosRealTimeCompliance: true,
    zeroTrustSecurity: true,
    zkProofs: true,
    byokEncryption: true,
    complianceAsCode: true,
    iotEdgeCompliance: true,

    // EU Regulations & AI Governance - ALL INCLUDED
    nistAiRmf: true,
    euAiAct: true,
    dsa: true,
    dma: true,

    // Support & SLA - ALL INCLUDED
    slaGuarantee: true,
    dedicatedSupport: true,
    onPremDeployment: true,
    customAiModels: true,
    prioritySupport: true,
    whiteGloveOnboarding: true,

    // Add-ons - ALL AVAILABLE
    customFrameworksAddOn: true,
    onPremAddOn: true, // $3,750-4,000
    customAiAddOn: true, // $2,250-2,400
  },

  highlights: [
    'Everything in Growth',
    'NIST AI RMF Framework',
    'EU AI Act Compliance',
    'Digital Services Act (DSA)',
    'Digital Markets Act (DMA)',
    'Physical AI & VR Training',
    'Swarm Intelligence & Neuro-Symbolic AI',
    'Homomorphic Encryption & Monte Carlo',
    'Zero Trust Security & ZK Proofs',
    'BYOK Encryption & Compliance-as-Code',
    'IoT/Edge Compliance',
    'On-premises deployment option',
    'Dedicated support & SLA',
    'Unlimited users & resources',
  ],

  growthDrivers: [
    'Premium positioning for visionary features',
    'Thought leadership and enterprise trials',
    '20-25% below competitor pricing ($20k-$100k+)',
  ],
};

// ============================================================================
// ADD-ONS
// ============================================================================
export const tierAddOns: TierAddOn[] = [
  {
    id: 'custom-frameworks',
    name: 'Custom Frameworks',
    description: 'Create unlimited custom compliance frameworks tailored to your industry',
    priceAnnual: 660, // Mid-point of $640-680 (10-15% below comp)
    availableForTiers: ['Growth', 'Visionary'],
  },
  {
    id: 'on-prem-deployment',
    name: 'On-Premises Deployment',
    description: 'Deploy ComplyEasyAI on your own infrastructure with full data control',
    priceAnnual: 3200, // Mid-point of $3,000-3,400 (10-15% below comp)
    availableForTiers: ['Visionary'],
  },
  {
    id: 'custom-ai-models',
    name: 'Custom AI Models',
    description: 'Fine-tuned AI models trained on your compliance data and requirements',
    priceAnnual: 1920, // Mid-point of $1,800-2,040 (10-15% below comp)
    availableForTiers: ['Visionary'],
  },
];

// ============================================================================
// TIER COLLECTION
// ============================================================================
export const TIERS: Record<TierName, Tier> = {
  Foundation: foundationTier,
  Essentials: essentialsTier,
  Growth: growthTier,
  Visionary: visionaryTier,
};

export const TIER_ORDER: TierName[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get tier by name
 */
export function getTier(tierName: TierName): Tier {
  return TIERS[tierName];
}

/**
 * Get tier index (for comparison)
 */
export function getTierIndex(tierName: TierName): number {
  return TIER_ORDER.indexOf(tierName);
}

/**
 * Check if tier A is higher than tier B
 */
export function isTierHigher(tierA: TierName, tierB: TierName): boolean {
  return getTierIndex(tierA) > getTierIndex(tierB);
}

/**
 * Check if tier A is at least tier B
 */
export function isTierAtLeast(tierA: TierName, tierB: TierName): boolean {
  return getTierIndex(tierA) >= getTierIndex(tierB);
}

/**
 * Get next tier upgrade
 */
export function getNextTier(currentTier: TierName): TierName | null {
  const currentIndex = getTierIndex(currentTier);
  if (currentIndex >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[currentIndex + 1];
}

/**
 * Get previous tier (for downgrade)
 */
export function getPreviousTier(currentTier: TierName): TierName | null {
  const currentIndex = getTierIndex(currentTier);
  if (currentIndex <= 0) return null;
  return TIER_ORDER[currentIndex - 1];
}

/**
 * Check if a feature is available for a tier
 */
export function hasFeature(tierName: TierName, feature: keyof TierFeatures): boolean {
  return TIERS[tierName].features[feature];
}

/**
 * Get limit value for a tier (-1 means unlimited)
 */
export function getLimit(tierName: TierName, limit: keyof TierLimits): number {
  return TIERS[tierName].limits[limit];
}

/**
 * Check if within limit (handles unlimited case)
 */
export function isWithinLimit(tierName: TierName, limit: keyof TierLimits, currentValue: number): boolean {
  const maxValue = getLimit(tierName, limit);
  if (maxValue === -1) return true; // Unlimited
  return currentValue < maxValue;
}

/**
 * Get available add-ons for a tier
 */
export function getAvailableAddOns(tierName: TierName): TierAddOn[] {
  return tierAddOns.filter(addon => addon.availableForTiers.includes(tierName));
}

/**
 * Calculate annual price based on user count (for scaling tiers)
 */
export function calculateAnnualPrice(tierName: TierName, userCount: number): number {
  const tier = TIERS[tierName];
  const basePrice = tier.pricing.annualMin;

  if (!tier.pricing.perUserIncrement) {
    return basePrice;
  }

  // Calculate price based on user tiers (per 10 users)
  const userTiers = Math.ceil(userCount / 10);
  const additionalCost = (userTiers - 1) * tier.pricing.perUserIncrement;

  return Math.min(basePrice + additionalCost, tier.pricing.annualMax);
}

/**
 * Calculate monthly price
 */
export function calculateMonthlyPrice(annualPrice: number, tierName: TierName): number {
  const tier = TIERS[tierName];
  const monthlyTotal = annualPrice * tier.pricing.monthlyMultiplier;
  return Math.round((monthlyTotal / 12) * 100) / 100;
}

/**
 * Get all features difference between two tiers
 */
export function getFeaturesDifference(fromTier: TierName, toTier: TierName): string[] {
  const fromFeatures = TIERS[fromTier].features;
  const toFeatures = TIERS[toTier].features;

  const newFeatures: string[] = [];

  for (const key in toFeatures) {
    const featureKey = key as keyof TierFeatures;
    if (toFeatures[featureKey] && !fromFeatures[featureKey]) {
      newFeatures.push(key);
    }
  }

  return newFeatures;
}

/**
 * Feature display names for UI
 */
export const FEATURE_DISPLAY_NAMES: Record<keyof TierFeatures, string> = {
  authentication: 'Authentication',
  twoFactorAuth: 'Two-Factor Authentication',
  complianceFrameworks: 'Compliance Frameworks',
  riskManagement: 'Risk Management',
  auditLogging: 'Audit Logging',
  dashboard: 'Dashboard',
  teamManagement: 'Team Management',
  aiPolicyGeneration: 'AI Policy Generation',
  aiGapAnalysis: 'AI Gap Analysis',
  aiContractAnalyzer: 'AI Contract Analyzer',
  aiRfpGenerator: 'AI RFP Generator',
  aiPhishingSimulator: 'AI Phishing Simulator',
  aiVendorScorer: 'AI Vendor Scorer',
  aiDataMapper: 'AI Data Mapper',
  aiBcpGenerator: 'AI BCP Generator',
  personnelManagement: 'Personnel Management',
  vendorRiskManagement: 'Vendor Risk Management',
  policyLibrary: 'Policy Library',
  trustCenter: 'Trust Center',
  multiWorkspace: 'Multi-Workspace',
  advancedReporting: 'Advanced Reporting',
  continuousMonitoring: 'Continuous Monitoring',
  issueManagement: 'Issue Management',
  acosGoals: 'aCOS Compliance Goals',
  acosControlLoops: 'aCOS Control Loops',
  acosDebtTracking: 'aCOS Debt Tracking',
  acosChangeImpact: 'aCOS Change Impact Analysis',
  acosAgenticActions: 'aCOS Agentic Actions',
  acosEvidenceTruth: 'aCOS Evidence Truth',
  acosRegulatoryIntelligence: 'aCOS Regulatory Intelligence',
  acosTemporalGraphs: 'aCOS Temporal Graphs',
  acosDigitalTwin: 'aCOS Digital Twin',
  acosRedTeam: 'aCOS Red Team Simulations',
  acosFederatedLearning: 'aCOS Federated Learning',
  acosMultiModal: 'aCOS Multi-Modal AI',
  customFrameworks: 'Custom Frameworks',
  acosPhysicalAi: 'Physical AI Compliance',
  acosVrTraining: 'VR Training',
  acosSwarmIntelligence: 'Swarm Intelligence',
  acosNeuroSymbolic: 'Neuro-Symbolic AI',
  acosHomomorphicEncryption: 'Homomorphic Encryption',
  acosMonteCarlo: 'Monte Carlo Simulations',
  acosRiskPrediction: 'AI Risk Prediction',
  acosJitCompliance: 'JIT Compliance',
  acosRealTimeCompliance: 'Real-Time Compliance',
  zeroTrustSecurity: 'Zero Trust Security',
  zkProofs: 'Zero-Knowledge Proofs',
  byokEncryption: 'BYOK Encryption',
  complianceAsCode: 'Compliance-as-Code',
  iotEdgeCompliance: 'IoT/Edge Compliance',
  nistAiRmf: 'NIST AI RMF Framework',
  euAiAct: 'EU AI Act Compliance',
  dsa: 'Digital Services Act (DSA)',
  dma: 'Digital Markets Act (DMA)',
  slaGuarantee: 'SLA Guarantee',
  dedicatedSupport: 'Dedicated Support',
  onPremDeployment: 'On-Premises Deployment',
  customAiModels: 'Custom AI Models',
  prioritySupport: 'Priority Support',
  whiteGloveOnboarding: 'White-Glove Onboarding',
  customFrameworksAddOn: 'Custom Frameworks Add-On',
  onPremAddOn: 'On-Premises Add-On',
  customAiAddOn: 'Custom AI Add-On',
};

/**
 * Limit display names for UI
 */
export const LIMIT_DISPLAY_NAMES: Record<keyof TierLimits, string> = {
  maxUsers: 'Maximum Users',
  maxFrameworks: 'Maximum Frameworks',
  maxWorkspaces: 'Maximum Workspaces',
  maxQuestionnairesPerMonth: 'Questionnaires per Month',
  maxVendors: 'Maximum Vendors',
  maxPolicies: 'Maximum Policies',
  maxIntegrations: 'Maximum Integrations',
  maxCustomReports: 'Maximum Custom Reports',
  maxMonitors: 'Maximum Monitors',
  maxIssues: 'Maximum Issues',
  maxRiskAssessments: 'Maximum Risk Assessments',
  maxAiRequestsPerMonth: 'AI Requests per Month',
  maxStorageGB: 'Storage (GB)',
  maxApiRequestsPerDay: 'API Requests per Day',
  dataRetentionDays: 'Data Retention (Days)',
};

export default TIERS;
