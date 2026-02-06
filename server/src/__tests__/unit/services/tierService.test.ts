/**
 * Tier Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockOrganization } from '../../mocks/prisma';

// Add missing models to prismaMock
const createMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;

(prismaMock as any).usageTracking = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  upsert: createMockFn(),
  delete: createMockFn(),
  count: createMockFn(),
};
(prismaMock as any).continuousMonitor = {
  ...((prismaMock as any).continuousMonitor || {}),
  count: createMockFn(),
};
(prismaMock as any).integration = {
  ...((prismaMock as any).integration || {}),
  count: createMockFn(),
};

// Mock the database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock tiers config
jest.mock('../../../config/tiers', () => {
  const foundationFeatures = {
    aiPolicyGeneration: true,
    aiGapAnalysis: true,
    aiContractAnalyzer: false,
    aiRfpGenerator: false,
    acosGoals: false,
    euAiAct: false,
  };
  const essentialsFeatures = {
    ...foundationFeatures,
    aiContractAnalyzer: true,
    aiRfpGenerator: true,
  };
  const growthFeatures = {
    ...essentialsFeatures,
    acosGoals: true,
  };
  const visionaryFeatures = {
    ...growthFeatures,
    euAiAct: true,
  };

  const foundationLimits = {
    maxUsers: 10,
    maxFrameworks: 3,
    maxWorkspaces: 1,
    maxQuestionnairesPerMonth: 10,
    maxVendors: 20,
    maxPolicies: 30,
    maxIntegrations: 5,
    maxCustomReports: 3,
    maxMonitors: 5,
    maxIssues: 50,
    maxRiskAssessments: 10,
    maxAiRequestsPerMonth: 100,
    maxStorageGB: 5,
    maxApiRequestsPerDay: 1000,
    dataRetentionDays: 365,
  };

  const essentialsLimits = {
    ...foundationLimits,
    maxUsers: 100,
    maxFrameworks: 10,
    maxWorkspaces: 3,
    maxVendors: 100,
    maxPolicies: 100,
    maxIntegrations: 20,
    maxCustomReports: 10,
    maxMonitors: 20,
    maxIssues: 200,
  };

  const growthLimits = {
    ...essentialsLimits,
    maxUsers: 1000,
    maxFrameworks: 50,
    maxWorkspaces: 10,
  };

  const visionaryLimits = {
    ...growthLimits,
    maxUsers: -1,
    maxFrameworks: -1,
    maxWorkspaces: -1,
    maxVendors: -1,
    maxPolicies: -1,
    maxIntegrations: -1,
  };

  const foundationTier = {
    name: 'Foundation',
    features: foundationFeatures,
    limits: foundationLimits,
    pricing: { annualMin: 5000, annualMax: 15000, monthlyMultiplier: 1.15 },
    highlights: ['Basic AI'],
  };
  const essentialsTier = {
    name: 'Essentials',
    features: essentialsFeatures,
    limits: essentialsLimits,
    pricing: { annualMin: 15000, annualMax: 40000, monthlyMultiplier: 1.2 },
    highlights: ['AI Suite'],
  };
  const growthTier = {
    name: 'Growth',
    features: growthFeatures,
    limits: growthLimits,
    pricing: { annualMin: 40000, annualMax: 100000, monthlyMultiplier: 1.2 },
    highlights: ['aCOS'],
  };
  const visionaryTier = {
    name: 'Visionary',
    features: visionaryFeatures,
    limits: visionaryLimits,
    pricing: { annualMin: 100000, annualMax: 250000, monthlyMultiplier: 1.2 },
    highlights: ['EU AI Act'],
  };

  const TIERS: Record<string, any> = {
    Foundation: foundationTier,
    Essentials: essentialsTier,
    Growth: growthTier,
    Visionary: visionaryTier,
  };

  const TIER_ORDER: string[] = ['Foundation', 'Essentials', 'Growth', 'Visionary'];

  return {
    TIERS,
    TIER_ORDER,
    getTier: jest.fn().mockImplementation((name: string) => TIERS[name] || foundationTier),
    getTierIndex: jest.fn().mockImplementation((name: string) => TIER_ORDER.indexOf(name)),
    isTierAtLeast: jest.fn().mockImplementation((current: string, target: string) =>
      TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(target)
    ),
    hasFeature: jest.fn().mockImplementation((tier: string, feature: string) => {
      return TIERS[tier]?.features?.[feature] ?? false;
    }),
    getLimit: jest.fn().mockImplementation((tier: string, limit: string) => {
      return TIERS[tier]?.limits?.[limit] ?? 0;
    }),
    isWithinLimit: jest.fn().mockImplementation((tier: string, limit: string, current: number) => {
      const max = TIERS[tier]?.limits?.[limit] ?? 0;
      return max === -1 || current < max;
    }),
    getNextTier: jest.fn().mockImplementation((tier: string) => {
      const idx = TIER_ORDER.indexOf(tier);
      return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
    }),
    getFeaturesDifference: jest.fn().mockImplementation((from: string, to: string) => {
      const fromFeatures = TIERS[from]?.features || {};
      const toFeatures = TIERS[to]?.features || {};
      return Object.keys(toFeatures).filter(k => toFeatures[k] && !fromFeatures[k]);
    }),
    FEATURE_DISPLAY_NAMES: {
      aiPolicyGeneration: 'AI Policy Generation',
      aiGapAnalysis: 'AI Gap Analysis',
      aiContractAnalyzer: 'AI Contract Analyzer',
      aiRfpGenerator: 'AI RFP Generator',
      acosGoals: 'aCOS Goals',
      euAiAct: 'EU AI Act',
    },
    LIMIT_DISPLAY_NAMES: {
      maxUsers: 'Users',
      maxFrameworks: 'Frameworks',
      maxWorkspaces: 'Workspaces',
      maxQuestionnairesPerMonth: 'Questionnaires/Month',
      maxVendors: 'Vendors',
      maxPolicies: 'Policies',
      maxIntegrations: 'Integrations',
      maxCustomReports: 'Custom Reports',
      maxMonitors: 'Monitors',
      maxIssues: 'Issues',
      maxRiskAssessments: 'Risk Assessments',
      maxAiRequestsPerMonth: 'AI Requests/Month',
      maxStorageGB: 'Storage (GB)',
      maxApiRequestsPerDay: 'API Requests/Day',
      dataRetentionDays: 'Data Retention (Days)',
    },
    calculateAnnualPrice: jest.fn().mockImplementation((tier: string, _users: number) => {
      return TIERS[tier]?.pricing?.annualMin || 0;
    }),
    calculateMonthlyPrice: jest.fn().mockImplementation((annual: number, tier: string) => {
      return Math.round((annual / 12) * (TIERS[tier]?.pricing?.monthlyMultiplier || 1.2));
    }),
    TierName: {},
    TierFeatures: {},
    TierLimits: {},
    Tier: {},
  };
});

// Import after mocking
import tierService from '../../../services/tierService';

describe('TierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-set tiers config mock implementations that get cleared by resetMocks: true
    const tiersConfig = require('../../../config/tiers');
    const TIERS = tiersConfig.TIERS;
    const TIER_ORDER = tiersConfig.TIER_ORDER;
    (tiersConfig.getTier as jest.Mock<any>).mockImplementation((name: string) => TIERS[name] || TIERS['Foundation']);
    (tiersConfig.getTierIndex as jest.Mock<any>).mockImplementation((name: string) => TIER_ORDER.indexOf(name));
    (tiersConfig.isTierAtLeast as jest.Mock<any>).mockImplementation((current: string, target: string) =>
      TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(target)
    );
    (tiersConfig.hasFeature as jest.Mock<any>).mockImplementation((tier: string, feature: string) => {
      return TIERS[tier]?.features?.[feature] ?? false;
    });
    (tiersConfig.getLimit as jest.Mock<any>).mockImplementation((tier: string, limit: string) => {
      return TIERS[tier]?.limits?.[limit] ?? 0;
    });
    (tiersConfig.isWithinLimit as jest.Mock<any>).mockImplementation((tier: string, limit: string, current: number) => {
      const max = TIERS[tier]?.limits?.[limit] ?? 0;
      return max === -1 || current < max;
    });
    (tiersConfig.getNextTier as jest.Mock<any>).mockImplementation((tier: string) => {
      const idx = TIER_ORDER.indexOf(tier);
      return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
    });
    (tiersConfig.getFeaturesDifference as jest.Mock<any>).mockImplementation((from: string, to: string) => {
      const fromFeatures = TIERS[from]?.features || {};
      const toFeatures = TIERS[to]?.features || {};
      return Object.keys(toFeatures).filter((k: string) => toFeatures[k] && !fromFeatures[k]);
    });
    (tiersConfig.calculateAnnualPrice as jest.Mock<any>).mockImplementation((tier: string, _users: number) => {
      return TIERS[tier]?.pricing?.annualMin || 0;
    });
    (tiersConfig.calculateMonthlyPrice as jest.Mock<any>).mockImplementation((annual: number, tier: string) => {
      return Math.round((annual / 12) * (TIERS[tier]?.pricing?.monthlyMultiplier || 1.2));
    });
  });

  // ======================================================================
  // getOrganizationTier
  // ======================================================================
  describe('getOrganizationTier()', () => {
    it('should return the organization plan', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Essentials' }) as any
      );

      const result = await tierService.getOrganizationTier('org-123');

      expect(result).toBe('Essentials');
    });

    it('should default to Foundation when organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await tierService.getOrganizationTier('nonexistent');

      expect(result).toBe('Foundation');
    });
  });

  // ======================================================================
  // getOrganizationTierInfo
  // ======================================================================
  describe('getOrganizationTierInfo()', () => {
    it('should return full tier info for the organization', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Growth' }) as any
      );

      const result = await tierService.getOrganizationTierInfo('org-123');

      expect(result.name).toBe('Growth');
      expect(result.features).toBeDefined();
      expect(result.limits).toBeDefined();
    });
  });

  // ======================================================================
  // checkFeatureAccess
  // ======================================================================
  describe('checkFeatureAccess()', () => {
    it('should allow feature included in tier', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );

      const result = await tierService.checkFeatureAccess('org-123', 'aiPolicyGeneration');

      expect(result.allowed).toBe(true);
      expect(result.currentTier).toBe('Foundation');
      expect(result.feature).toBe('aiPolicyGeneration');
      expect(result.displayName).toBe('AI Policy Generation');
    });

    it('should deny feature not in tier and no add-on subscription', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      const result = await tierService.checkFeatureAccess('org-123', 'aiContractAnalyzer');

      expect(result.allowed).toBe(false);
      expect(result.requiredTier).toBe('Essentials');
      expect(result.upgradeMessage).toContain('upgrade');
    });

    it('should allow feature via add-on subscription', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue({
        id: 'fs-1',
        featureId: 'ai-contract-analyzer',
        status: 'active',
        organizationId: 'org-123',
      } as any);

      const result = await tierService.checkFeatureAccess('org-123', 'aiContractAnalyzer');

      expect(result.allowed).toBe(true);
    });

    it('should default to Foundation for unknown org', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      const result = await tierService.checkFeatureAccess('nonexistent', 'aiContractAnalyzer');

      expect(result.currentTier).toBe('Foundation');
      expect(result.allowed).toBe(false);
    });
  });

  // ======================================================================
  // checkLimit
  // ======================================================================
  describe('checkLimit()', () => {
    it('should return allowed when within limit', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );

      const result = await tierService.checkLimit('org-123', 'maxUsers', 5);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(5);
      expect(result.isUnlimited).toBe(false);
    });

    it('should return not allowed when at limit', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );

      const result = await tierService.checkLimit('org-123', 'maxUsers', 10);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.upgradeMessage).toContain('Essentials');
    });

    it('should always allow for unlimited (-1) limits', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Visionary' }) as any
      );

      const result = await tierService.checkLimit('org-123', 'maxUsers', 99999);

      expect(result.allowed).toBe(true);
      expect(result.isUnlimited).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('should fetch current usage from DB when not provided', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.user.count.mockResolvedValue(7);

      const result = await tierService.checkLimit('org-123', 'maxUsers');

      expect(result.current).toBe(7);
      expect(result.allowed).toBe(true);
    });
  });

  // ======================================================================
  // getCurrentUsage
  // ======================================================================
  describe('getCurrentUsage()', () => {
    it('should count users', async () => {
      prismaMock.user.count.mockResolvedValue(5);

      const result = await tierService.getCurrentUsage('org-123', 'maxUsers');

      expect(result).toBe(5);
      expect(prismaMock.user.count).toHaveBeenCalledWith({ where: { organizationId: 'org-123' } });
    });

    it('should count frameworks', async () => {
      prismaMock.complianceFramework.count.mockResolvedValue(3);

      const result = await tierService.getCurrentUsage('org-123', 'maxFrameworks');

      expect(result).toBe(3);
    });

    it('should count workspaces from child organizations', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        childOrganizations: [{ id: 'child-1' }, { id: 'child-2' }],
      } as any);

      const result = await tierService.getCurrentUsage('org-123', 'maxWorkspaces');

      expect(result).toBe(2);
    });

    it('should return 0 workspaces when org has no children', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await tierService.getCurrentUsage('org-123', 'maxWorkspaces');

      expect(result).toBe(0);
    });

    it('should count questionnaires this month', async () => {
      prismaMock.questionnaire.count.mockResolvedValue(8);

      const result = await tierService.getCurrentUsage('org-123', 'maxQuestionnairesPerMonth');

      expect(result).toBe(8);
    });

    it('should count vendors', async () => {
      prismaMock.vendor.count.mockResolvedValue(15);

      const result = await tierService.getCurrentUsage('org-123', 'maxVendors');

      expect(result).toBe(15);
    });

    it('should count policies', async () => {
      prismaMock.policy.count.mockResolvedValue(20);

      const result = await tierService.getCurrentUsage('org-123', 'maxPolicies');

      expect(result).toBe(20);
    });

    it('should count connected integrations', async () => {
      (prismaMock.integration as any).count.mockResolvedValue(4);

      const result = await tierService.getCurrentUsage('org-123', 'maxIntegrations');

      expect(result).toBe(4);
    });

    it('should count custom reports', async () => {
      prismaMock.customReport.count.mockResolvedValue(2);

      const result = await tierService.getCurrentUsage('org-123', 'maxCustomReports');

      expect(result).toBe(2);
    });

    it('should count monitors', async () => {
      (prismaMock.continuousMonitor as any).count.mockResolvedValue(3);

      const result = await tierService.getCurrentUsage('org-123', 'maxMonitors');

      expect(result).toBe(3);
    });

    it('should count issues', async () => {
      prismaMock.issue.count.mockResolvedValue(25);

      const result = await tierService.getCurrentUsage('org-123', 'maxIssues');

      expect(result).toBe(25);
    });

    it('should count risk assessments', async () => {
      prismaMock.riskAssessment.count.mockResolvedValue(5);

      const result = await tierService.getCurrentUsage('org-123', 'maxRiskAssessments');

      expect(result).toBe(5);
    });

    it('should get monthly AI requests from tracking', async () => {
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue({ count: 55 });

      const result = await tierService.getCurrentUsage('org-123', 'maxAiRequestsPerMonth');

      expect(result).toBe(55);
    });

    it('should return 0 for untracked monthly metric', async () => {
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue(null);

      const result = await tierService.getCurrentUsage('org-123', 'maxAiRequestsPerMonth');

      expect(result).toBe(0);
    });

    it('should get daily API requests from tracking', async () => {
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue({ count: 500 });

      const result = await tierService.getCurrentUsage('org-123', 'maxApiRequestsPerDay');

      expect(result).toBe(500);
    });

    it('should get storage from tracking', async () => {
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue({ count: 3 });

      const result = await tierService.getCurrentUsage('org-123', 'maxStorageGB');

      expect(result).toBe(3);
    });

    it('should return 0 for dataRetentionDays', async () => {
      const result = await tierService.getCurrentUsage('org-123', 'dataRetentionDays');

      expect(result).toBe(0);
    });
  });

  // ======================================================================
  // getAllUsageMetrics
  // ======================================================================
  describe('getAllUsageMetrics()', () => {
    it('should return all usage metrics', async () => {
      prismaMock.user.count.mockResolvedValue(5);
      prismaMock.complianceFramework.count.mockResolvedValue(2);
      prismaMock.questionnaire.count.mockResolvedValue(3);
      prismaMock.vendor.count.mockResolvedValue(10);
      prismaMock.policy.count.mockResolvedValue(15);
      (prismaMock.integration as any).count.mockResolvedValue(4);
      prismaMock.customReport.count.mockResolvedValue(1);
      (prismaMock.continuousMonitor as any).count.mockResolvedValue(2);
      prismaMock.issue.count.mockResolvedValue(20);
      prismaMock.riskAssessment.count.mockResolvedValue(3);
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue(null);
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        childOrganizations: [{ id: 'ws-1' }],
      } as any);

      const result = await tierService.getAllUsageMetrics('org-123');

      expect(result.users).toBe(5);
      expect(result.frameworks).toBe(2);
      expect(result.questionnairesThisMonth).toBe(3);
      expect(result.vendors).toBe(10);
      expect(result.policies).toBe(15);
      expect(result.integrations).toBe(4);
      expect(result.customReports).toBe(1);
      expect(result.monitors).toBe(2);
      expect(result.issues).toBe(20);
      expect(result.riskAssessments).toBe(3);
      expect(result.workspaces).toBe(1);
    });
  });

  // ======================================================================
  // compareTiers
  // ======================================================================
  describe('compareTiers()', () => {
    it('should return new features when upgrading', () => {
      const result = tierService.compareTiers('Foundation', 'Essentials');

      expect(result.currentTier.name).toBe('Foundation');
      expect(result.comparedTier.name).toBe('Essentials');
      expect(result.newFeatures).toContain('aiContractAnalyzer');
      expect(result.newFeatures).toContain('aiRfpGenerator');
      expect(result.newFeatureDisplayNames).toContain('AI Contract Analyzer');
      expect(result.newFeatureDisplayNames).toContain('AI RFP Generator');
    });

    it('should return limit increases', () => {
      const result = tierService.compareTiers('Foundation', 'Essentials');

      const userLimit = result.limitIncreases.find(l => l.limit === 'maxUsers');
      expect(userLimit).toBeDefined();
      expect(userLimit!.current).toBe(10);
      expect(userLimit!.new).toBe(100);
    });

    it('should calculate price difference', () => {
      const result = tierService.compareTiers('Foundation', 'Essentials');

      expect(result.priceDifference.annualMin).toBe(10000); // 15000 - 5000
      expect(result.priceDifference.annualMax).toBe(25000); // 40000 - 15000
    });

    it('should show unlimited for Visionary limits', () => {
      const result = tierService.compareTiers('Foundation', 'Visionary');

      const userLimit = result.limitIncreases.find(l => l.limit === 'maxUsers');
      expect(userLimit?.isNewUnlimited).toBe(true);
    });
  });

  // ======================================================================
  // incrementUsage
  // ======================================================================
  describe('incrementUsage()', () => {
    it('should upsert usage tracking for API calls (daily period)', async () => {
      (prismaMock as any).usageTracking.upsert.mockResolvedValue({});

      await tierService.incrementUsage('org-123', 'api_calls', 1);

      expect((prismaMock as any).usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId_metricType_period: expect.objectContaining({
              organizationId: 'org-123',
              metricType: 'api_calls',
            }),
          }),
          create: expect.objectContaining({
            count: 1,
          }),
          update: expect.objectContaining({
            count: { increment: 1 },
          }),
        })
      );
    });

    it('should upsert usage tracking for AI requests (monthly period)', async () => {
      (prismaMock as any).usageTracking.upsert.mockResolvedValue({});

      await tierService.incrementUsage('org-123', 'ai_requests', 5);

      expect((prismaMock as any).usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId_metricType_period: expect.objectContaining({
              metricType: 'ai_requests',
            }),
          }),
          create: expect.objectContaining({
            count: 5,
          }),
          update: expect.objectContaining({
            count: { increment: 5 },
          }),
        })
      );
    });

    it('should use lifetime period for other metrics', async () => {
      (prismaMock as any).usageTracking.upsert.mockResolvedValue({});

      await tierService.incrementUsage('org-123', 'storage_gb', 1);

      expect((prismaMock as any).usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId_metricType_period: expect.objectContaining({
              period: 'lifetime',
            }),
          }),
        })
      );
    });

    it('should default amount to 1', async () => {
      (prismaMock as any).usageTracking.upsert.mockResolvedValue({});

      await tierService.incrementUsage('org-123', 'api_calls');

      expect((prismaMock as any).usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            count: 1,
          }),
        })
      );
    });

    it('should not throw on database error', async () => {
      (prismaMock as any).usageTracking.upsert.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await tierService.incrementUsage('org-123', 'api_calls');
    });
  });

  // ======================================================================
  // validateAction
  // ======================================================================
  describe('validateAction()', () => {
    it('should allow action when feature and limit both pass', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.user.count.mockResolvedValue(5);

      const result = await tierService.validateAction('org-123', 'aiPolicyGeneration', 'maxUsers');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny action when feature not available', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      const result = await tierService.validateAction('org-123', 'aiContractAnalyzer');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('upgrade');
    });

    it('should deny action when limit exceeded', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.user.count.mockResolvedValue(10);

      const result = await tierService.validateAction('org-123', undefined, 'maxUsers');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit');
    });

    it('should allow action with no feature or limit requirements', async () => {
      const result = await tierService.validateAction('org-123');

      expect(result.allowed).toBe(true);
    });
  });

  // ======================================================================
  // getTierPricingSummary
  // ======================================================================
  describe('getTierPricingSummary()', () => {
    it('should return pricing summary for a tier', () => {
      const result = tierService.getTierPricingSummary('Foundation', 10);

      expect(result).toHaveProperty('annualPrice');
      expect(result).toHaveProperty('monthlyPrice');
      expect(result).toHaveProperty('pricePerUserMonth');
      expect(result.annualPrice).toBeGreaterThan(0);
      expect(result.monthlyPrice).toBeGreaterThan(0);
      expect(result.pricePerUserMonth).toBeGreaterThan(0);
    });
  });

  // ======================================================================
  // canDowngrade
  // ======================================================================
  describe('canDowngrade()', () => {
    it('should allow downgrade when usage fits lower tier', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Essentials', childOrganizations: [] }) as any
      );
      prismaMock.user.count.mockResolvedValue(5);
      prismaMock.complianceFramework.count.mockResolvedValue(2);
      prismaMock.questionnaire.count.mockResolvedValue(0);
      prismaMock.vendor.count.mockResolvedValue(5);
      prismaMock.policy.count.mockResolvedValue(10);
      (prismaMock.integration as any).count.mockResolvedValue(3);
      prismaMock.customReport.count.mockResolvedValue(1);
      (prismaMock.continuousMonitor as any).count.mockResolvedValue(2);
      prismaMock.issue.count.mockResolvedValue(10);
      prismaMock.riskAssessment.count.mockResolvedValue(2);
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue(null);

      const result = await tierService.canDowngrade('org-123', 'Foundation');

      expect(result.allowed).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it('should block downgrade when usage exceeds lower tier limits', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Essentials', childOrganizations: [] }) as any
      );
      prismaMock.user.count.mockResolvedValue(50); // Exceeds Foundation limit of 10
      prismaMock.complianceFramework.count.mockResolvedValue(8); // Exceeds Foundation limit of 3
      prismaMock.questionnaire.count.mockResolvedValue(0);
      prismaMock.vendor.count.mockResolvedValue(5);
      prismaMock.policy.count.mockResolvedValue(10);
      (prismaMock.integration as any).count.mockResolvedValue(3);
      prismaMock.customReport.count.mockResolvedValue(1);
      (prismaMock.continuousMonitor as any).count.mockResolvedValue(2);
      prismaMock.issue.count.mockResolvedValue(10);
      prismaMock.riskAssessment.count.mockResolvedValue(2);
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue(null);

      const result = await tierService.canDowngrade('org-123', 'Foundation');

      expect(result.allowed).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers.some(b => b.includes('users'))).toBe(true);
      expect(result.blockers.some(b => b.includes('frameworks'))).toBe(true);
    });

    it('should not allow downgrading to a higher tier', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );

      const result = await tierService.canDowngrade('org-123', 'Essentials');

      expect(result.allowed).toBe(false);
      expect(result.blockers[0]).toContain('not lower');
    });
  });

  // ======================================================================
  // getAvailableTiers
  // ======================================================================
  describe('getAvailableTiers()', () => {
    it('should return all tiers with comparison info', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Essentials', childOrganizations: [] }) as any
      );
      prismaMock.user.count.mockResolvedValue(5);
      prismaMock.complianceFramework.count.mockResolvedValue(2);
      prismaMock.questionnaire.count.mockResolvedValue(0);
      prismaMock.vendor.count.mockResolvedValue(5);
      prismaMock.policy.count.mockResolvedValue(10);
      (prismaMock.integration as any).count.mockResolvedValue(3);
      prismaMock.customReport.count.mockResolvedValue(1);
      (prismaMock.continuousMonitor as any).count.mockResolvedValue(2);
      prismaMock.issue.count.mockResolvedValue(10);
      prismaMock.riskAssessment.count.mockResolvedValue(2);
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue(null);

      const result = await tierService.getAvailableTiers('org-123');

      expect(result).toHaveLength(4);

      // Foundation should be downgrade
      expect(result[0].isDowngrade).toBe(true);
      expect(result[0].isCurrent).toBe(false);

      // Essentials should be current
      expect(result[1].isCurrent).toBe(true);
      expect(result[1].isUpgrade).toBe(false);
      expect(result[1].isDowngrade).toBe(false);

      // Growth should be upgrade
      expect(result[2].isUpgrade).toBe(true);
      expect(result[2].comparison).toBeDefined();

      // Visionary should be upgrade
      expect(result[3].isUpgrade).toBe(true);
    });
  });

  // ======================================================================
  // getUsageVsLimits
  // ======================================================================
  describe('getUsageVsLimits()', () => {
    it('should return limit check results for all metrics', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation', childOrganizations: [] }) as any
      );
      prismaMock.user.count.mockResolvedValue(5);
      prismaMock.complianceFramework.count.mockResolvedValue(2);
      prismaMock.questionnaire.count.mockResolvedValue(3);
      prismaMock.vendor.count.mockResolvedValue(10);
      prismaMock.policy.count.mockResolvedValue(15);
      (prismaMock.integration as any).count.mockResolvedValue(3);
      prismaMock.customReport.count.mockResolvedValue(1);
      (prismaMock.continuousMonitor as any).count.mockResolvedValue(2);
      prismaMock.issue.count.mockResolvedValue(20);
      prismaMock.riskAssessment.count.mockResolvedValue(5);
      (prismaMock as any).usageTracking.findUnique.mockResolvedValue(null);

      const result = await tierService.getUsageVsLimits('org-123');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('allowed');
      expect(result[0]).toHaveProperty('current');
      expect(result[0]).toHaveProperty('limit');
      expect(result[0]).toHaveProperty('remaining');
      expect(result[0]).toHaveProperty('limitType');
      expect(result[0]).toHaveProperty('displayName');
      expect(result[0]).toHaveProperty('isUnlimited');
    });
  });
});
