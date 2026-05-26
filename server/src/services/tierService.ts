/**
 * Tier Service
 *
 * Production-level service for managing user tiers, feature access,
 * and usage limits. Handles:
 * - Feature access control
 * - Usage limit enforcement
 * - Tier comparisons and upgrades
 * - Usage tracking and metrics
 */

import prisma from '../config/database';
import logger from '../config/logger';
import {
  TierName,
  TierFeatures,
  TierLimits,
  Tier,
  TIERS,
  TIER_ORDER,
  getTier,
  getTierIndex,
  isTierAtLeast,
  hasFeature,
  getLimit,
  isWithinLimit,
  getNextTier,
  getFeaturesDifference,
  FEATURE_DISPLAY_NAMES,
  LIMIT_DISPLAY_NAMES,
  calculateAnnualPrice,
  calculateMonthlyPrice,
} from '../config/tiers';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureCheckResult {
  allowed: boolean;
  requiredTier?: TierName;
  currentTier: TierName;
  feature: string;
  displayName: string;
  upgradeMessage?: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  limitType: string;
  displayName: string;
  isUnlimited: boolean;
  upgradeMessage?: string;
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

export interface TierComparisonResult {
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

// ============================================================================
// TIER SERVICE CLASS
// ============================================================================

class TierService {
  /**
   * Get organization's current tier
   */
  async getOrganizationTier(organizationId: string): Promise<TierName> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });

    if (!org) {
      logger.warn(`Organization not found: ${organizationId}`);
      return 'Foundation'; // Default to Foundation
    }

    return org.plan as TierName;
  }

  /**
   * Get full tier information for an organization
   */
  async getOrganizationTierInfo(organizationId: string): Promise<Tier> {
    const tierName = await this.getOrganizationTier(organizationId);
    return getTier(tierName);
  }

  /**
   * Check if organization has access to a specific feature
   * Now checks both tier access and feature subscriptions
   */
  async checkFeatureAccess(
    organizationId: string,
    feature: keyof TierFeatures
  ): Promise<FeatureCheckResult> {
    const currentTier = await this.getOrganizationTier(organizationId);
    const tierHasFeature = hasFeature(currentTier, feature);
    const displayName = FEATURE_DISPLAY_NAMES[feature];

    // Check if feature is included in tier
    if (tierHasFeature) {
      return {
        allowed: true,
        currentTier,
        feature,
        displayName,
      };
    }

    // Check if feature is purchased as add-on
    // Map tier feature key to feature ID
    const featureIdMap: Record<string, string> = {
      aiContractAnalyzer: 'ai-contract-analyzer',
      aiRfpGenerator: 'ai-rfp-generator',
      aiPhishingSimulator: 'ai-phishing-simulator',
      aiVendorScorer: 'ai-vendor-scorer',
      aiDataMapper: 'ai-data-mapper',
      aiBcpGenerator: 'ai-bcp-generator',
      personnelManagement: 'personnel-management',
      vendorRiskManagement: 'vendor-risk-management',
      policyLibrary: 'policy-library',
      trustCenter: 'trust-center',
      multiWorkspace: 'multi-workspace',
      advancedReporting: 'advanced-reporting',
      issueManagement: 'issue-management',
      acosGoals: 'acos-goals',
      acosControlLoops: 'acos-control-loops',
      acosDebtTracking: 'acos-debt-tracking',
      acosChangeImpact: 'acos-change-impact',
      acosAgenticActions: 'acos-agentic-actions',
      acosEvidenceTruth: 'acos-evidence-truth',
      acosRegulatoryIntelligence: 'acos-regulatory-intelligence',
      acosTemporalGraphs: 'acos-temporal-graphs',
      acosDigitalTwin: 'acos-digital-twin',
      acosRedTeam: 'acos-red-team',
      acosFederatedLearning: 'acos-federated-learning',
      acosMultiModal: 'acos-multimodal',
      acosPhysicalAi: 'physical-ai',
      acosVrTraining: 'vr-training',
      acosSwarmIntelligence: 'swarm-intelligence',
      acosNeuroSymbolic: 'neuro-symbolic',
      acosHomomorphicEncryption: 'homomorphic-encryption',
      acosMonteCarlo: 'monte-carlo',
      acosRiskPrediction: 'risk-prediction',
      acosJitCompliance: 'jit-compliance',
      acosRealTimeCompliance: 'real-time-compliance',
      zeroTrustSecurity: 'zero-trust',
      zkProofs: 'zk-proofs',
      byokEncryption: 'byok-encryption',
      complianceAsCode: 'compliance-as-code',
      iotEdgeCompliance: 'iot-edge',
      slaGuarantee: 'sla-guarantee',
      prioritySupport: 'priority-support',
      whiteGloveOnboarding: 'white-glove-onboarding',
    };

    const featureId = featureIdMap[feature];
    if (featureId) {
      const featureSubscription = await prisma.featureSubscription.findFirst({
        where: {
          organizationId,
          featureId,
          status: 'active',
          OR: [
            { endsAt: null },
            { endsAt: { gt: new Date() } },
          ],
        },
      });

      if (featureSubscription) {
        return {
          allowed: true,
          currentTier,
          feature,
          displayName,
        };
      }
    }

    // Feature not available
    const requiredTier = TIER_ORDER.find(tier => hasFeature(tier, feature));
    const result: FeatureCheckResult = {
      allowed: false,
      requiredTier,
      currentTier,
      feature,
      displayName,
    };

    if (requiredTier) {
      result.upgradeMessage = `Purchase ${displayName} as add-on or upgrade to ${requiredTier} tier`;
    }

    return result;
  }

  /**
   * Check if organization is within a specific limit
   */
  async checkLimit(
    organizationId: string,
    limitType: keyof TierLimits,
    currentValue?: number
  ): Promise<LimitCheckResult> {
    const currentTier = await this.getOrganizationTier(organizationId);
    const limit = getLimit(currentTier, limitType);
    const displayName = LIMIT_DISPLAY_NAMES[limitType];
    const isUnlimited = limit === -1;

    // If currentValue not provided, fetch from usage tracking
    let current = currentValue;
    if (current === undefined) {
      current = await this.getCurrentUsage(organizationId, limitType);
    }

    const allowed = isUnlimited || current < limit;
    const remaining = isUnlimited ? -1 : Math.max(0, limit - current);

    const result: LimitCheckResult = {
      allowed,
      current,
      limit,
      remaining,
      limitType,
      displayName,
      isUnlimited,
    };

    if (!allowed) {
      const nextTier = getNextTier(currentTier);
      if (nextTier) {
        const nextLimit = getLimit(nextTier, limitType);
        const nextLimitDisplay = nextLimit === -1 ? 'unlimited' : nextLimit.toString();
        result.upgradeMessage = `Upgrade to ${nextTier} to increase your ${displayName} limit to ${nextLimitDisplay}`;
      }
    }

    return result;
  }

  /**
   * Get current usage for a specific metric
   */
  async getCurrentUsage(organizationId: string, metricType: keyof TierLimits): Promise<number> {
    switch (metricType) {
      case 'maxUsers':
        return await prisma.user.count({ where: { organizationId } });

      case 'maxFrameworks':
        return await prisma.complianceFramework.count({ where: { organizationId } });

      case 'maxWorkspaces': {
        // Count child organizations (workspaces)
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: { childOrganizations: true },
        });
        return org?.childOrganizations.length || 0;
      }

      case 'maxQuestionnairesPerMonth': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return await prisma.questionnaire.count({
          where: {
            organizationId,
            createdAt: { gte: startOfMonth },
          },
        });
      }

      case 'maxVendors':
        return await prisma.vendor.count({ where: { organizationId } });

      case 'maxPolicies':
        return await prisma.policy.count({ where: { organizationId } });

      case 'maxIntegrations':
        return await prisma.integration.count({ where: { organizationId, connected: true } });

      case 'maxCustomReports':
        return await prisma.customReport.count({ where: { organizationId } });

      case 'maxMonitors':
        return await prisma.continuousMonitor.count({ where: { organizationId } });

      case 'maxIssues':
        return await prisma.issue.count({ where: { organizationId } });

      case 'maxRiskAssessments':
        return await prisma.riskAssessment.count({ where: { organizationId } });

      case 'maxAiRequestsPerMonth':
        return await this.getMonthlyUsageFromTracking(organizationId, 'ai_requests');

      case 'maxStorageGB':
        return await this.getUsageFromTracking(organizationId, 'storage_gb');

      case 'maxApiRequestsPerDay':
        return await this.getDailyUsageFromTracking(organizationId, 'api_calls');

      case 'dataRetentionDays':
        return 0; // Not a countable metric

      default:
        return 0;
    }
  }

  /**
   * Get all usage metrics for an organization
   */
  async getAllUsageMetrics(organizationId: string): Promise<UsageMetrics> {
    const [
      users,
      frameworks,
      questionnairesThisMonth,
      vendors,
      policies,
      integrations,
      customReports,
      monitors,
      issues,
      riskAssessments,
      aiRequestsThisMonth,
      storageGB,
      apiRequestsToday,
    ] = await Promise.all([
      this.getCurrentUsage(organizationId, 'maxUsers'),
      this.getCurrentUsage(organizationId, 'maxFrameworks'),
      this.getCurrentUsage(organizationId, 'maxQuestionnairesPerMonth'),
      this.getCurrentUsage(organizationId, 'maxVendors'),
      this.getCurrentUsage(organizationId, 'maxPolicies'),
      this.getCurrentUsage(organizationId, 'maxIntegrations'),
      this.getCurrentUsage(organizationId, 'maxCustomReports'),
      this.getCurrentUsage(organizationId, 'maxMonitors'),
      this.getCurrentUsage(organizationId, 'maxIssues'),
      this.getCurrentUsage(organizationId, 'maxRiskAssessments'),
      this.getCurrentUsage(organizationId, 'maxAiRequestsPerMonth'),
      this.getCurrentUsage(organizationId, 'maxStorageGB'),
      this.getCurrentUsage(organizationId, 'maxApiRequestsPerDay'),
    ]);

    // Get workspace count
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { childOrganizations: true },
    });
    const workspaces = org?.childOrganizations.length || 0;

    return {
      users,
      frameworks,
      workspaces,
      questionnairesThisMonth,
      vendors,
      policies,
      integrations,
      customReports,
      monitors,
      issues,
      riskAssessments,
      aiRequestsThisMonth,
      storageGB,
      apiRequestsToday,
    };
  }

  /**
   * Get usage comparison with tier limits
   */
  async getUsageVsLimits(organizationId: string): Promise<Array<LimitCheckResult>> {
    const tierName = await this.getOrganizationTier(organizationId);
    const metrics = await this.getAllUsageMetrics(organizationId);
    const tier = getTier(tierName);

    const limitChecks: Array<LimitCheckResult> = [];

    const limitMappings: Array<{ metric: keyof UsageMetrics; limit: keyof TierLimits }> = [
      { metric: 'users', limit: 'maxUsers' },
      { metric: 'frameworks', limit: 'maxFrameworks' },
      { metric: 'workspaces', limit: 'maxWorkspaces' },
      { metric: 'questionnairesThisMonth', limit: 'maxQuestionnairesPerMonth' },
      { metric: 'vendors', limit: 'maxVendors' },
      { metric: 'policies', limit: 'maxPolicies' },
      { metric: 'integrations', limit: 'maxIntegrations' },
      { metric: 'customReports', limit: 'maxCustomReports' },
      { metric: 'monitors', limit: 'maxMonitors' },
      { metric: 'issues', limit: 'maxIssues' },
      { metric: 'riskAssessments', limit: 'maxRiskAssessments' },
      { metric: 'aiRequestsThisMonth', limit: 'maxAiRequestsPerMonth' },
      { metric: 'storageGB', limit: 'maxStorageGB' },
      { metric: 'apiRequestsToday', limit: 'maxApiRequestsPerDay' },
    ];

    for (const { metric, limit } of limitMappings) {
      const current = metrics[metric];
      const maxLimit = tier.limits[limit];
      const isUnlimited = maxLimit === -1;

      limitChecks.push({
        allowed: isUnlimited || current < maxLimit,
        current,
        limit: maxLimit,
        remaining: isUnlimited ? -1 : Math.max(0, maxLimit - current),
        limitType: limit,
        displayName: LIMIT_DISPLAY_NAMES[limit],
        isUnlimited,
      });
    }

    return limitChecks;
  }

  /**
   * Compare two tiers for upgrade/downgrade analysis
   */
  compareTiers(fromTier: TierName, toTier: TierName): TierComparisonResult {
    const currentTier = getTier(fromTier);
    const comparedTier = getTier(toTier);

    const newFeatures = getFeaturesDifference(fromTier, toTier);
    const newFeatureDisplayNames = newFeatures.map(
      f => FEATURE_DISPLAY_NAMES[f as keyof TierFeatures]
    );

    const limitIncreases: TierComparisonResult['limitIncreases'] = [];
    const limitKeys = Object.keys(currentTier.limits) as Array<keyof TierLimits>;

    for (const limitKey of limitKeys) {
      const currentLimit = currentTier.limits[limitKey];
      const newLimit = comparedTier.limits[limitKey];

      if (newLimit > currentLimit || (newLimit === -1 && currentLimit !== -1)) {
        limitIncreases.push({
          limit: limitKey,
          displayName: LIMIT_DISPLAY_NAMES[limitKey],
          current: currentLimit,
          new: newLimit,
          isNewUnlimited: newLimit === -1,
        });
      }
    }

    return {
      currentTier,
      comparedTier,
      newFeatures,
      newFeatureDisplayNames,
      limitIncreases,
      priceDifference: {
        annualMin: comparedTier.pricing.annualMin - currentTier.pricing.annualMin,
        annualMax: comparedTier.pricing.annualMax - currentTier.pricing.annualMax,
      },
    };
  }

  /**
   * Increment usage for a tracked metric
   */
  async incrementUsage(
    organizationId: string,
    metricType: string,
    amount: number = 1
  ): Promise<void> {
    const now = new Date();
    let period: string;

    // Determine period based on metric type
    if (metricType === 'api_calls') {
      period = now.toISOString().split('T')[0]; // Daily: YYYY-MM-DD
    } else if (metricType.includes('month') || metricType === 'ai_requests') {
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Monthly: YYYY-MM
    } else {
      period = 'lifetime'; // Lifetime tracking
    }

    try {
      await prisma.usageTracking.upsert({
        where: {
          organizationId_metricType_period: {
            organizationId,
            metricType,
            period,
          },
        },
        create: {
          organizationId,
          metricType,
          period,
          count: amount,
        },
        update: {
          count: { increment: amount },
          updatedAt: now,
        },
      });
    } catch (error) {
      logger.error('Failed to increment usage', { organizationId, metricType, error });
    }
  }

  /**
   * Get monthly usage from tracking table
   */
  private async getMonthlyUsageFromTracking(
    organizationId: string,
    metricType: string
  ): Promise<number> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usage = await prisma.usageTracking.findUnique({
      where: {
        organizationId_metricType_period: {
          organizationId,
          metricType,
          period,
        },
      },
    });

    return usage?.count || 0;
  }

  /**
   * Get daily usage from tracking table
   */
  private async getDailyUsageFromTracking(
    organizationId: string,
    metricType: string
  ): Promise<number> {
    const period = new Date().toISOString().split('T')[0];

    const usage = await prisma.usageTracking.findUnique({
      where: {
        organizationId_metricType_period: {
          organizationId,
          metricType,
          period,
        },
      },
    });

    return usage?.count || 0;
  }

  /**
   * Get lifetime usage from tracking table
   */
  private async getUsageFromTracking(
    organizationId: string,
    metricType: string
  ): Promise<number> {
    const usage = await prisma.usageTracking.findUnique({
      where: {
        organizationId_metricType_period: {
          organizationId,
          metricType,
          period: 'lifetime',
        },
      },
    });

    return usage?.count || 0;
  }

  /**
   * Validate if organization can perform an action based on tier
   */
  async validateAction(
    organizationId: string,
    requiredFeature?: keyof TierFeatures,
    requiredLimit?: keyof TierLimits
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check feature access if required
    if (requiredFeature) {
      const featureCheck = await this.checkFeatureAccess(organizationId, requiredFeature);
      if (!featureCheck.allowed) {
        return {
          allowed: false,
          reason: featureCheck.upgradeMessage || `Feature ${featureCheck.displayName} not available in your tier`,
        };
      }
    }

    // Check limit if required
    if (requiredLimit) {
      const limitCheck = await this.checkLimit(organizationId, requiredLimit);
      if (!limitCheck.allowed) {
        return {
          allowed: false,
          reason: limitCheck.upgradeMessage || `You have reached your ${limitCheck.displayName} limit`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get tier pricing summary for display
   */
  getTierPricingSummary(tierName: TierName, userCount: number = 10): {
    annualPrice: number;
    monthlyPrice: number;
    pricePerUserMonth: number;
  } {
    const annualPrice = calculateAnnualPrice(tierName, userCount);
    const monthlyPrice = calculateMonthlyPrice(annualPrice, tierName);
    const pricePerUserMonth = Math.round((monthlyPrice / userCount) * 100) / 100;

    return {
      annualPrice,
      monthlyPrice,
      pricePerUserMonth,
    };
  }

  /**
   * Check if tier can be downgraded (validate current usage fits lower tier limits)
   */
  async canDowngrade(organizationId: string, targetTier: TierName): Promise<{
    allowed: boolean;
    blockers: string[];
  }> {
    const currentTier = await this.getOrganizationTier(organizationId);

    if (!isTierAtLeast(currentTier, targetTier)) {
      return {
        allowed: false,
        blockers: [`Cannot downgrade: ${targetTier} is not lower than ${currentTier}`],
      };
    }

    const metrics = await this.getAllUsageMetrics(organizationId);
    const targetTierLimits = getTier(targetTier).limits;
    const blockers: string[] = [];

    // Check each limit
    if (targetTierLimits.maxUsers !== -1 && metrics.users > targetTierLimits.maxUsers) {
      blockers.push(`Current users (${metrics.users}) exceeds ${targetTier} limit (${targetTierLimits.maxUsers})`);
    }
    if (targetTierLimits.maxFrameworks !== -1 && metrics.frameworks > targetTierLimits.maxFrameworks) {
      blockers.push(`Current frameworks (${metrics.frameworks}) exceeds ${targetTier} limit (${targetTierLimits.maxFrameworks})`);
    }
    if (targetTierLimits.maxWorkspaces !== -1 && metrics.workspaces > targetTierLimits.maxWorkspaces) {
      blockers.push(`Current workspaces (${metrics.workspaces}) exceeds ${targetTier} limit (${targetTierLimits.maxWorkspaces})`);
    }
    if (targetTierLimits.maxVendors !== -1 && metrics.vendors > targetTierLimits.maxVendors) {
      blockers.push(`Current vendors (${metrics.vendors}) exceeds ${targetTier} limit (${targetTierLimits.maxVendors})`);
    }
    if (targetTierLimits.maxPolicies !== -1 && metrics.policies > targetTierLimits.maxPolicies) {
      blockers.push(`Current policies (${metrics.policies}) exceeds ${targetTier} limit (${targetTierLimits.maxPolicies})`);
    }
    if (targetTierLimits.maxIntegrations !== -1 && metrics.integrations > targetTierLimits.maxIntegrations) {
      blockers.push(`Current integrations (${metrics.integrations}) exceeds ${targetTier} limit (${targetTierLimits.maxIntegrations})`);
    }

    return {
      allowed: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Get all available tiers with comparison to current
   */
  async getAvailableTiers(organizationId: string): Promise<Array<{
    tier: Tier;
    isCurrent: boolean;
    isUpgrade: boolean;
    isDowngrade: boolean;
    canDowngrade?: boolean;
    comparison?: TierComparisonResult;
  }>> {
    const currentTier = await this.getOrganizationTier(organizationId);
    const currentIndex = getTierIndex(currentTier);

    const result = [];

    for (const tierName of TIER_ORDER) {
      const tierIndex = getTierIndex(tierName);
      const isCurrent = tierName === currentTier;
      const isUpgrade = tierIndex > currentIndex;
      const isDowngrade = tierIndex < currentIndex;

      const tierResult: any = {
        tier: getTier(tierName),
        isCurrent,
        isUpgrade,
        isDowngrade,
      };

      if (isUpgrade || isDowngrade) {
        tierResult.comparison = this.compareTiers(currentTier, tierName);
      }

      if (isDowngrade) {
        const downgradeCheck = await this.canDowngrade(organizationId, tierName);
        tierResult.canDowngrade = downgradeCheck.allowed;
      }

      result.push(tierResult);
    }

    return result;
  }
}

export default new TierService();
