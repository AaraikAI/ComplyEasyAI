
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
  NIST = 'NIST 800-53',
  EU_AI_ACT = 'EU AI Act',
  DMA = 'Digital Markets Act (DMA)',
  DSA = 'Digital Services Act (DSA)',
  EU_CRA = 'EU Cyber Resilience Act (CRA)',
  CSRD = 'CSRD',
  ECODESIGN = 'Ecodesign for Sustainable Products',
  NIS2 = 'NIS2 Directive'
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
  /** Optional one-time setup fee (e.g. On-Prem, Custom AI) */
  priceOneTime?: number;
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
  /** Set by login/verify; used for tier-based feature gating */
  organization?: { id: string; name: string; plan: TierName | string };
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
  title?: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  category: string;
  detectedAt: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Ignored';
  assignedTo?: string | { id: string; name: string }; // User name or object from backend
  assignedToId?: string;
  assignedAvatar?: string;
  aiPriorityScore?: number; // 0-100
  aiRationale?: string;
  mitigationPlan?: string;
  owner?: string;
  organizationId?: string;
  riskScore?: number;
  likelihood?: number;
  impact?: number;
  targetDate?: string;
  frameworkId?: string;
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
  category: 'Cloud' | 'HR' | 'Dev' | 'Security' | 'Identity' | 'ITSM' | 'MDM' | 'Productivity' | 'Finance' | 'Communication' | 'Database' | 'Monitoring' | 'Compliance' | 'CRM' | 'Storage' | 'Network' | 'CI/CD' | 'Container' | 'Automation' | 'Analytics' | 'EDR' | 'Email' | 'GRC' | 'Training' | 'SIEM' | 'VPN' | 'SSO' | 'Code' | 'Backup' | 'BI' | 'Ticketing';
  connected: boolean;
  lastSync: string;
  icon: string;
  config?: Record<string, any>; // Encrypted config placeholder
  description?: string;
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
  | 'acos'
  | 'eu-ai-act'
  | 'dma'
  | 'dsa'
  | 'security'
  | 'analytics'
  | 'ai-rmf'
  | 'ai-rmf-systems'
  | 'ai-rmf-create'
  | 'ai-rmf-details'
  | 'ai-rmf-assessments'
  | 'vendors'
  | 'policies'
  | 'monitoring'
  | 'workspaces'
  | 'questionnaires'
  | 'issues'
  // Phase 1: EU Regulations & US Privacy
  | 'eu-cra'
  | 'csrd'
  | 'ecodesign'
  | 'nis2'
  | 'us-privacy'
  // Phase 2-3: Process Mapping & Governance
  | 'process-mapper'
  | 'governance'
  // Phase 5: Certification & Market Access
  | 'ce-marking'
  | 'digital-product-passport'
  // Phase 6: ESG & Surveillance
  | 'esg-reporting'
  | 'post-market-surveillance'
  // Phase 7: Breach Management
  | 'breach-wizard'
  // Phase 8: Post-Market Lifecycle
  | 'sbom-manager'
  | 'product-decommissioning'
  | 'environmental-lifecycle'
  // AI Tier Features
  | 'ai-cross-mapper'
  | 'ai-auto-remediation'
  | 'ai-evidence-checker'
  | 'ai-agentic-vendor'
  | 'ai-audit-simulator'
  | 'ai-nl-query'
  | 'compliance-forecasting'
  | 'product-lifecycle'
  // New Modules: SOX, SoD, MDM, DORA, Auditor, Workflow, Privacy
  | 'sox'
  | 'sod'
  | 'mdm'
  | 'dora'
  | 'auditor'
  | 'workflow-builder'
  | 'privacy'
  | 'account-deletion'
  // Enhancement Modules
  | 'incidents'
  | 'assets'
  | 'calendar'
  | 'maturity'
  | 'bia'
  | 'exceptions'
  | 'certifications'
  | 'costs'
  | 'executive'
  | 'report-builder'
  | 'global-search'
  | 'regulatory-changes'
  | 'evidence-collection'
  | 'audit-prep'
  | 'control-testing'
  | 'vendor-monitoring'
  | 'cicd-gates'
  | 'sso-settings'
  | 'scim-settings'
  | 'role-manager'
  | 'branding-settings'
  | 'risk-heatmap'
  | 'notification-center'
  | 'ticketing'
  | 'accessibility-settings'
  | 'workflow-automation';

// ============================================================================
// TIER CONFIGURATION (Frontend copy of backend tiers)
// ============================================================================

export const TIER_ORDER: TierName[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];

export const TIER_COLORS: Record<TierName, { primary: string; bg: string; border: string }> = {
  Foundation: { primary: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  Essentials: { primary: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
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

// ============================================================================
// ONBOARDING SYSTEM
// ============================================================================

export type OnboardingFlowName =
  | 'welcome'
  | 'tier_tour'
  | 'first_framework'
  | 'first_evidence'
  | 'first_control'
  | 'invite_team'
  | 'integration_setup'
  | 'ai_feature_trial'
  | 'acos_digital_twin'
  | 'advanced_features'
  | 'risk_heatmap'
  | 'regulatory_tracker'
  | 'vendor_monitoring'
  | 'privacy_platform'
  | 'incident_management'
  | 'control_testing'
  | 'audit_prep'
  | 'workflow_automation'
  | 'complete';

export interface OnboardingProgress {
  id: string;
  userId: string;
  organizationId: string;
  currentFlow: OnboardingFlowName;
  currentStep: number;
  welcomeCompleted: boolean;
  tierTourCompleted: boolean;
  firstFrameworkCompleted: boolean;
  firstEvidenceCompleted: boolean;
  firstControlPassCompleted: boolean;
  inviteTeamCompleted: boolean;
  integrationSetupCompleted: boolean;
  aiFeatureTrialCompleted: boolean;
  acosDigitalTwinTourCompleted: boolean;
  advancedFeaturesTourCompleted: boolean;
  tooltipsShown: string[];
  skippedFlows: string[];
  completedAt: string | null;
  lastActiveFlow: string | null;
  lastActiveStep: number | null;
  showHints: boolean;
  reducedMotion: boolean;
}

export interface OnboardingChecklist {
  id: string;
  organizationId: string;
  profileCompleted: boolean;
  teamInvited: boolean;
  firstFrameworkAdded: boolean;
  firstEvidenceUploaded: boolean;
  firstControlPassed: boolean;
  integrationConnected: boolean;
  aiFeatureUsed: boolean;
  firstReportGenerated: boolean;
  acosConfigured: boolean;
  digitalTwinActivated: boolean;
  // Enterprise GRC modules
  riskHeatmapViewed: boolean;
  regulatoryTrackerViewed: boolean;
  vendorMonitoringConfigured: boolean;
  privacyPlatformViewed: boolean;
  incidentManagementViewed: boolean;
  controlTestingConfigured: boolean;
  auditPrepStarted: boolean;
  workflowAutomationConfigured: boolean;
  completedAt: string | null;
}

export interface OnboardingStepConfig {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  targetRoute?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'input' | 'navigate' | 'observe';
  requiredTier?: TierName[];
  showConfetti?: boolean;
}

export interface OnboardingFlowConfig {
  id: OnboardingFlowName;
  name: string;
  description: string;
  requiredTier?: TierName[];
  steps: OnboardingStepConfig[];
  triggerCondition?: string;
  skippable: boolean;
  estimatedMinutes: number;
}

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
