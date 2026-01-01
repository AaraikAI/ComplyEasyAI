
export enum ComplianceStatus {
  COMPLIANT = 'Compliant',
  AT_RISK = 'At Risk',
  NON_COMPLIANT = 'Non-Compliant',
  IN_REVIEW = 'In Review'
}

export enum FrameworkType {
  SOC2 = 'SOC 2 Type II',
  GDPR = 'GDPR',
  HIPAA = 'HIPAA',
  ISO27001 = 'ISO 27001',
  PCI_DSS = 'PCI DSS',
  CCPA = 'CCPA',
  NIST = 'NIST 800-53'
}

export type Role = 'admin' | 'editor' | 'viewer';

// ============================================================================
// TIER SYSTEM
// ============================================================================

export type TierName = 'Foundation' | 'Essentials' | 'Growth' | 'Visionary';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type BillingCycle = 'monthly' | 'annual';

export interface TierPricing {
  annualMin: number;
  annualMax: number;
  monthlyMultiplier: number;
  monthlyMin?: number;      // Monthly rate when billed annually
  monthlyMax?: number;      // Monthly rate when billed annually
  perUserIncrement?: number;
  netAfterStripeMin: number;
  netAfterStripeMax: number;
  margin: string;
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

export interface SubscriptionDetails {
  tier: TierName;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  addOns: string[];
  nextInvoiceAmount: number | null;
  usage: {
    users: number;
  };
}

export interface UsageMetrics {
  users: number;
  frameworks: number;
  workspaces: number;
  questionnairesThisMonth: number;
  vendors: number;
  policies: number;
  integrations: number;
  customReports: number;
  monitors: number;
  issues: number;
  riskAssessments: number;
  aiRequestsThisMonth: number;
  storageGB: number;
  apiRequestsToday: number;
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  limitType: string;
  displayName: string;
  isUnlimited: boolean;
  upgradeMessage?: string;
}

export interface TierComparison {
  currentTier: Tier;
  comparedTier: Tier;
  newFeatures: string[];
  newFeatureDisplayNames: string[];
  limitIncreases: Array<{
    limit: keyof TierLimits;
    displayName: string;
    current: number;
    new: number;
    isNewUnlimited: boolean;
  }>;
  priceDifference: {
    annualMin: number;
    annualMax: number;
  };
}

export interface UpgradePreview {
  currentTier: TierName;
  targetTier: TierName;
  proratedAmount: number;
  newMonthlyAmount: number;
  immediateCharge: number;
  nextBillingDate: string;
}

export interface SubscriptionHistoryEntry {
  id: string;
  organizationId: string;
  previousPlan: TierName | null;
  newPlan: TierName;
  previousStatus: SubscriptionStatus | null;
  newStatus: SubscriptionStatus;
  changeType: SubscriptionChangeType;
  reason?: string;
  changedBy?: string;
  stripeEventId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type SubscriptionChangeType =
  | 'trial_started'
  | 'trial_ended'
  | 'upgrade'
  | 'downgrade'
  | 'renewal'
  | 'cancellation'
  | 'reactivation'
  | 'payment_failed'
  | 'payment_recovered'
  | 'addon_added'
  | 'addon_removed';

// ============================================================================
// WEBHOOK SYSTEM
// ============================================================================

export interface Webhook {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  enabled: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  webhookId?: string;
  organizationId: string;
  eventType: string;
  payload: Record<string, any>;
  status: WebhookEventStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
}

export type WebhookEventStatus =
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'exhausted';

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

// ============================================================================
// USER & ORGANIZATION
// ============================================================================

// Database Schema: User
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  organizationId: string;
  lastLogin?: string;
}

// Database Schema: Organization
export interface Organization {
  id: string;
  name: string;
  plan: TierName;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialEndsAt?: string;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  activeAddOns: string[];
}

// ============================================================================
// COMPLIANCE & RISK
// ============================================================================

// Database Schema: Risk
export interface RiskItem {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  category: string;
  detectedAt: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Ignored';
  assignedTo?: string; // User Name
  assignedAvatar?: string;
  aiPriorityScore?: number; // 0-100
  aiRationale?: string;
  mitigationPlan?: string;
  organizationId?: string;
}

// Database Schema: Framework
export interface ComplianceFramework {
  id: string;
  name: string;
  status: ComplianceStatus;
  progress: number;
  nextAuditDate: string;
  region?: string;
  organizationId?: string;
  controls?: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    evidence?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Database Schema: AuditLog
export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  hash: string; // Blockchain hash simulation
  verified: boolean;
  organizationId?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: 'Cloud' | 'HR' | 'Dev' | 'Security';
  connected: boolean;
  lastSync: string;
  icon: string;
  config?: Record<string, any>; // Encrypted config placeholder
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export type ViewState =
  | 'landing'
  | 'dashboard'
  | 'my-tasks'
  | 'integrations'
  | 'reports'
  | 'frameworks'
  | 'framework-details'
  | 'settings'
  | 'audit'
  | 'risks'
  | 'ai-policy'
  | 'ai-contract'
  | 'ai-gap'
  | 'ai-rfp'
  | 'ai-phishing'
  | 'ai-vendor'
  | 'ai-data-map'
  | 'ai-bcp'
  | 'acos';

// ============================================================================
// TIER CONFIGURATION (Frontend copy of backend tiers)
// ============================================================================

export const TIER_ORDER: TierName[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];

export const TIER_COLORS: Record<TierName, { primary: string; bg: string; border: string }> = {
  Foundation: { primary: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  Essentials: { primary: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  Growth: { primary: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
  Visionary: { primary: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
};

export const TIER_ICONS: Record<TierName, string> = {
  Foundation: 'Building2',
  Essentials: 'Rocket',
  Growth: 'TrendingUp',
  Visionary: 'Crown',
};

export const formatLimit = (value: number): string => {
  if (value === -1) return 'Unlimited';
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

export const formatPrice = (amount: number, showCents = false): string => {
  if (showCents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
