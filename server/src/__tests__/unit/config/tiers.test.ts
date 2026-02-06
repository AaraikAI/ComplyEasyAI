/**
 * Tiers Configuration Unit Tests
 * Comprehensive tests for tier system, pricing, limits, features, and utility functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  TIERS,
  TIER_ORDER,
  tierAddOns,
  FEATURE_DISPLAY_NAMES,
  LIMIT_DISPLAY_NAMES,
  getTier,
  getTierIndex,
  isTierHigher,
  isTierAtLeast,
  getNextTier,
  getPreviousTier,
  hasFeature,
  getLimit,
  isWithinLimit,
  getAvailableAddOns,
  calculateAnnualPrice,
  calculateMonthlyPrice,
  getFeaturesDifference,
} from '../../../config/tiers';
import type { TierName, Tier, TierFeatures, TierLimits } from '../../../config/tiers';

describe('Tiers Configuration', () => {
  describe('TIERS Object Structure', () => {
    it('should export TIERS with all four tiers', () => {
      expect(TIERS).toBeDefined();
      expect(TIERS.Foundation).toBeDefined();
      expect(TIERS.Essentials).toBeDefined();
      expect(TIERS.Growth).toBeDefined();
      expect(TIERS.Visionary).toBeDefined();
    });

    it('should have correct tier names', () => {
      expect(TIERS.Foundation.name).toBe('Foundation');
      expect(TIERS.Essentials.name).toBe('Essentials');
      expect(TIERS.Growth.name).toBe('Growth');
      expect(TIERS.Visionary.name).toBe('Visionary');
    });

    it('should have display names for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].displayName).toBeDefined();
        expect(typeof TIERS[tierName].displayName).toBe('string');
      }
    });

    it('should have taglines for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].tagline).toBeDefined();
        expect(TIERS[tierName].tagline.length).toBeGreaterThan(0);
      }
    });

    it('should have descriptions for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].description).toBeDefined();
        expect(TIERS[tierName].description.length).toBeGreaterThan(0);
      }
    });

    it('should have target audience for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].targetAudience).toBeDefined();
      }
    });

    it('should have highlights array for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(Array.isArray(TIERS[tierName].highlights)).toBe(true);
        expect(TIERS[tierName].highlights.length).toBeGreaterThan(0);
      }
    });

    it('should have growthDrivers array for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(Array.isArray(TIERS[tierName].growthDrivers)).toBe(true);
        expect(TIERS[tierName].growthDrivers.length).toBeGreaterThan(0);
      }
    });
  });

  describe('TIER_ORDER', () => {
    it('should define tier order from lowest to highest', () => {
      expect(TIER_ORDER).toEqual(['Foundation', 'Essentials', 'Growth', 'Visionary']);
    });

    it('should have 4 tiers', () => {
      expect(TIER_ORDER.length).toBe(4);
    });
  });

  describe('Tier Pricing', () => {
    it('should have increasing annual prices across tiers', () => {
      expect(TIERS.Foundation.pricing.annualMin).toBeLessThan(TIERS.Essentials.pricing.annualMin);
      expect(TIERS.Essentials.pricing.annualMin).toBeLessThan(TIERS.Growth.pricing.annualMin);
      expect(TIERS.Growth.pricing.annualMin).toBeLessThan(TIERS.Visionary.pricing.annualMin);
    });

    it('should have Foundation pricing at $8,500/year', () => {
      expect(TIERS.Foundation.pricing.annualMin).toBe(8500);
      expect(TIERS.Foundation.pricing.annualMax).toBe(8500);
    });

    it('should have Essentials pricing at $17,000/year', () => {
      expect(TIERS.Essentials.pricing.annualMin).toBe(17000);
      expect(TIERS.Essentials.pricing.annualMax).toBe(17000);
    });

    it('should have Growth pricing range $42,500-$65,000/year', () => {
      expect(TIERS.Growth.pricing.annualMin).toBe(42500);
      expect(TIERS.Growth.pricing.annualMax).toBe(65000);
    });

    it('should have Visionary pricing range $68,000-$170,000/year', () => {
      expect(TIERS.Visionary.pricing.annualMin).toBe(68000);
      expect(TIERS.Visionary.pricing.annualMax).toBe(170000);
    });

    it('should have monthly multipliers for all tiers', () => {
      expect(TIERS.Foundation.pricing.monthlyMultiplier).toBe(2.0);
      expect(TIERS.Essentials.pricing.monthlyMultiplier).toBe(1.5);
      expect(TIERS.Growth.pricing.monthlyMultiplier).toBe(1.0);
      expect(TIERS.Visionary.pricing.monthlyMultiplier).toBe(1.0);
    });

    it('should have net-after-stripe values for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].pricing.netAfterStripeMin).toBeGreaterThan(0);
        expect(TIERS[tierName].pricing.netAfterStripeMax).toBeGreaterThan(0);
        expect(TIERS[tierName].pricing.netAfterStripeMin).toBeLessThan(
          TIERS[tierName].pricing.annualMin
        );
      }
    });

    it('should have margin descriptions for all tiers', () => {
      for (const tierName of TIER_ORDER) {
        expect(typeof TIERS[tierName].pricing.margin).toBe('string');
        expect(TIERS[tierName].pricing.margin.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Tier Limits', () => {
    it('should have increasing user limits across tiers', () => {
      expect(TIERS.Foundation.limits.maxUsers).toBe(10);
      expect(TIERS.Essentials.limits.maxUsers).toBe(100);
      expect(TIERS.Growth.limits.maxUsers).toBe(1000);
      expect(TIERS.Visionary.limits.maxUsers).toBe(-1); // Unlimited
    });

    it('should have increasing framework limits across tiers', () => {
      expect(TIERS.Foundation.limits.maxFrameworks).toBe(3);
      expect(TIERS.Essentials.limits.maxFrameworks).toBe(10);
      expect(TIERS.Growth.limits.maxFrameworks).toBe(50);
      expect(TIERS.Visionary.limits.maxFrameworks).toBe(-1);
    });

    it('should have increasing workspace limits across tiers', () => {
      expect(TIERS.Foundation.limits.maxWorkspaces).toBe(1);
      expect(TIERS.Essentials.limits.maxWorkspaces).toBe(5);
      expect(TIERS.Growth.limits.maxWorkspaces).toBe(25);
      expect(TIERS.Visionary.limits.maxWorkspaces).toBe(-1);
    });

    it('should have increasing AI request limits across tiers', () => {
      expect(TIERS.Foundation.limits.maxAiRequestsPerMonth).toBe(100);
      expect(TIERS.Essentials.limits.maxAiRequestsPerMonth).toBe(1000);
      expect(TIERS.Growth.limits.maxAiRequestsPerMonth).toBe(10000);
      expect(TIERS.Visionary.limits.maxAiRequestsPerMonth).toBe(-1);
    });

    it('should have increasing storage limits across tiers', () => {
      expect(TIERS.Foundation.limits.maxStorageGB).toBe(5);
      expect(TIERS.Essentials.limits.maxStorageGB).toBe(50);
      expect(TIERS.Growth.limits.maxStorageGB).toBe(500);
      expect(TIERS.Visionary.limits.maxStorageGB).toBe(-1);
    });

    it('should have increasing data retention across tiers', () => {
      expect(TIERS.Foundation.limits.dataRetentionDays).toBe(365);
      expect(TIERS.Essentials.limits.dataRetentionDays).toBe(730);
      expect(TIERS.Growth.limits.dataRetentionDays).toBe(1825);
      expect(TIERS.Visionary.limits.dataRetentionDays).toBe(3650);
    });

    it('should have Visionary tier with unlimited (-1) for most limits', () => {
      const vLimits = TIERS.Visionary.limits;
      expect(vLimits.maxUsers).toBe(-1);
      expect(vLimits.maxFrameworks).toBe(-1);
      expect(vLimits.maxWorkspaces).toBe(-1);
      expect(vLimits.maxQuestionnairesPerMonth).toBe(-1);
      expect(vLimits.maxVendors).toBe(-1);
      expect(vLimits.maxPolicies).toBe(-1);
      expect(vLimits.maxIntegrations).toBe(-1);
      expect(vLimits.maxCustomReports).toBe(-1);
      expect(vLimits.maxMonitors).toBe(-1);
      expect(vLimits.maxIssues).toBe(-1);
      expect(vLimits.maxRiskAssessments).toBe(-1);
      expect(vLimits.maxAiRequestsPerMonth).toBe(-1);
      expect(vLimits.maxStorageGB).toBe(-1);
      expect(vLimits.maxApiRequestsPerDay).toBe(-1);
    });

    it('should have all required limit keys for every tier', () => {
      const requiredLimitKeys: (keyof TierLimits)[] = [
        'maxUsers',
        'maxFrameworks',
        'maxWorkspaces',
        'maxQuestionnairesPerMonth',
        'maxVendors',
        'maxPolicies',
        'maxIntegrations',
        'maxCustomReports',
        'maxMonitors',
        'maxIssues',
        'maxRiskAssessments',
        'maxAiRequestsPerMonth',
        'maxStorageGB',
        'maxApiRequestsPerDay',
        'dataRetentionDays',
      ];

      for (const tierName of TIER_ORDER) {
        for (const key of requiredLimitKeys) {
          expect(typeof TIERS[tierName].limits[key]).toBe('number');
        }
      }
    });
  });

  describe('Tier Features', () => {
    it('should give all tiers core features', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].features.authentication).toBe(true);
        expect(TIERS[tierName].features.twoFactorAuth).toBe(true);
        expect(TIERS[tierName].features.complianceFrameworks).toBe(true);
        expect(TIERS[tierName].features.riskManagement).toBe(true);
        expect(TIERS[tierName].features.auditLogging).toBe(true);
        expect(TIERS[tierName].features.dashboard).toBe(true);
        expect(TIERS[tierName].features.teamManagement).toBe(true);
      }
    });

    it('should give all tiers basic AI features', () => {
      for (const tierName of TIER_ORDER) {
        expect(TIERS[tierName].features.aiPolicyGeneration).toBe(true);
        expect(TIERS[tierName].features.aiGapAnalysis).toBe(true);
      }
    });

    it('should NOT give Foundation full AI features', () => {
      expect(TIERS.Foundation.features.aiContractAnalyzer).toBe(false);
      expect(TIERS.Foundation.features.aiRfpGenerator).toBe(false);
      expect(TIERS.Foundation.features.aiPhishingSimulator).toBe(false);
    });

    it('should give Essentials full AI features', () => {
      expect(TIERS.Essentials.features.aiContractAnalyzer).toBe(true);
      expect(TIERS.Essentials.features.aiRfpGenerator).toBe(true);
      expect(TIERS.Essentials.features.aiPhishingSimulator).toBe(true);
      expect(TIERS.Essentials.features.aiVendorScorer).toBe(true);
      expect(TIERS.Essentials.features.aiDataMapper).toBe(true);
      expect(TIERS.Essentials.features.aiBcpGenerator).toBe(true);
    });

    it('should NOT give Foundation enterprise features', () => {
      expect(TIERS.Foundation.features.personnelManagement).toBe(false);
      expect(TIERS.Foundation.features.vendorRiskManagement).toBe(false);
      expect(TIERS.Foundation.features.policyLibrary).toBe(false);
    });

    it('should give Essentials enterprise features', () => {
      expect(TIERS.Essentials.features.personnelManagement).toBe(true);
      expect(TIERS.Essentials.features.vendorRiskManagement).toBe(true);
      expect(TIERS.Essentials.features.policyLibrary).toBe(true);
      expect(TIERS.Essentials.features.trustCenter).toBe(true);
      expect(TIERS.Essentials.features.multiWorkspace).toBe(true);
      expect(TIERS.Essentials.features.advancedReporting).toBe(true);
    });

    it('should NOT give Foundation or Essentials aCOS features', () => {
      expect(TIERS.Foundation.features.acosGoals).toBe(false);
      expect(TIERS.Foundation.features.acosControlLoops).toBe(false);
      expect(TIERS.Essentials.features.acosGoals).toBe(false);
      expect(TIERS.Essentials.features.acosControlLoops).toBe(false);
    });

    it('should give Growth aCOS features', () => {
      expect(TIERS.Growth.features.acosGoals).toBe(true);
      expect(TIERS.Growth.features.acosControlLoops).toBe(true);
      expect(TIERS.Growth.features.acosDebtTracking).toBe(true);
      expect(TIERS.Growth.features.acosChangeImpact).toBe(true);
      expect(TIERS.Growth.features.acosAgenticActions).toBe(true);
      expect(TIERS.Growth.features.acosEvidenceTruth).toBe(true);
      expect(TIERS.Growth.features.acosDigitalTwin).toBe(true);
      expect(TIERS.Growth.features.customFrameworks).toBe(true);
    });

    it('should NOT give Growth Visionary features', () => {
      expect(TIERS.Growth.features.acosPhysicalAi).toBe(false);
      expect(TIERS.Growth.features.acosVrTraining).toBe(false);
      expect(TIERS.Growth.features.acosSwarmIntelligence).toBe(false);
      expect(TIERS.Growth.features.zeroTrustSecurity).toBe(false);
    });

    it('should give Visionary ALL features', () => {
      const vFeatures = TIERS.Visionary.features;
      for (const [key, value] of Object.entries(vFeatures)) {
        expect(value).toBe(true);
      }
    });

    it('should give Visionary EU regulation features', () => {
      expect(TIERS.Visionary.features.nistAiRmf).toBe(true);
      expect(TIERS.Visionary.features.euAiAct).toBe(true);
      expect(TIERS.Visionary.features.dsa).toBe(true);
      expect(TIERS.Visionary.features.dma).toBe(true);
    });

    it('should NOT give non-Visionary tiers EU regulation features', () => {
      for (const tierName of ['Foundation', 'Essentials', 'Growth'] as TierName[]) {
        expect(TIERS[tierName].features.nistAiRmf).toBe(false);
        expect(TIERS[tierName].features.euAiAct).toBe(false);
        expect(TIERS[tierName].features.dsa).toBe(false);
        expect(TIERS[tierName].features.dma).toBe(false);
      }
    });
  });

  describe('getTier()', () => {
    it('should return Foundation tier', () => {
      const tier = getTier('Foundation');
      expect(tier).toBeDefined();
      expect(tier.name).toBe('Foundation');
    });

    it('should return Essentials tier', () => {
      const tier = getTier('Essentials');
      expect(tier.name).toBe('Essentials');
    });

    it('should return Growth tier', () => {
      const tier = getTier('Growth');
      expect(tier.name).toBe('Growth');
    });

    it('should return Visionary tier', () => {
      const tier = getTier('Visionary');
      expect(tier.name).toBe('Visionary');
    });

    it('should return the exact same object from TIERS', () => {
      expect(getTier('Foundation')).toBe(TIERS.Foundation);
      expect(getTier('Visionary')).toBe(TIERS.Visionary);
    });
  });

  describe('getTierIndex()', () => {
    it('should return 0 for Foundation', () => {
      expect(getTierIndex('Foundation')).toBe(0);
    });

    it('should return 1 for Essentials', () => {
      expect(getTierIndex('Essentials')).toBe(1);
    });

    it('should return 2 for Growth', () => {
      expect(getTierIndex('Growth')).toBe(2);
    });

    it('should return 3 for Visionary', () => {
      expect(getTierIndex('Visionary')).toBe(3);
    });

    it('should return -1 for invalid tier name', () => {
      expect(getTierIndex('Invalid' as TierName)).toBe(-1);
    });
  });

  describe('isTierHigher()', () => {
    it('should return true when first tier is higher', () => {
      expect(isTierHigher('Visionary', 'Growth')).toBe(true);
      expect(isTierHigher('Growth', 'Essentials')).toBe(true);
      expect(isTierHigher('Essentials', 'Foundation')).toBe(true);
    });

    it('should return false for same tier', () => {
      expect(isTierHigher('Foundation', 'Foundation')).toBe(false);
      expect(isTierHigher('Visionary', 'Visionary')).toBe(false);
    });

    it('should return false when first tier is lower', () => {
      expect(isTierHigher('Foundation', 'Essentials')).toBe(false);
      expect(isTierHigher('Essentials', 'Growth')).toBe(false);
      expect(isTierHigher('Growth', 'Visionary')).toBe(false);
    });

    it('should work across multiple tier gaps', () => {
      expect(isTierHigher('Visionary', 'Foundation')).toBe(true);
      expect(isTierHigher('Foundation', 'Visionary')).toBe(false);
    });
  });

  describe('isTierAtLeast()', () => {
    it('should return true for same tier', () => {
      expect(isTierAtLeast('Foundation', 'Foundation')).toBe(true);
      expect(isTierAtLeast('Essentials', 'Essentials')).toBe(true);
      expect(isTierAtLeast('Growth', 'Growth')).toBe(true);
      expect(isTierAtLeast('Visionary', 'Visionary')).toBe(true);
    });

    it('should return true when first tier is higher', () => {
      expect(isTierAtLeast('Visionary', 'Foundation')).toBe(true);
      expect(isTierAtLeast('Growth', 'Foundation')).toBe(true);
      expect(isTierAtLeast('Essentials', 'Foundation')).toBe(true);
      expect(isTierAtLeast('Visionary', 'Growth')).toBe(true);
    });

    it('should return false when first tier is lower', () => {
      expect(isTierAtLeast('Foundation', 'Essentials')).toBe(false);
      expect(isTierAtLeast('Foundation', 'Growth')).toBe(false);
      expect(isTierAtLeast('Foundation', 'Visionary')).toBe(false);
      expect(isTierAtLeast('Essentials', 'Growth')).toBe(false);
      expect(isTierAtLeast('Growth', 'Visionary')).toBe(false);
    });
  });

  describe('getNextTier()', () => {
    it('should return Essentials as next tier after Foundation', () => {
      expect(getNextTier('Foundation')).toBe('Essentials');
    });

    it('should return Growth as next tier after Essentials', () => {
      expect(getNextTier('Essentials')).toBe('Growth');
    });

    it('should return Visionary as next tier after Growth', () => {
      expect(getNextTier('Growth')).toBe('Visionary');
    });

    it('should return null for Visionary (highest tier)', () => {
      expect(getNextTier('Visionary')).toBeNull();
    });
  });

  describe('getPreviousTier()', () => {
    it('should return null for Foundation (lowest tier)', () => {
      expect(getPreviousTier('Foundation')).toBeNull();
    });

    it('should return Foundation as previous tier before Essentials', () => {
      expect(getPreviousTier('Essentials')).toBe('Foundation');
    });

    it('should return Essentials as previous tier before Growth', () => {
      expect(getPreviousTier('Growth')).toBe('Essentials');
    });

    it('should return Growth as previous tier before Visionary', () => {
      expect(getPreviousTier('Visionary')).toBe('Growth');
    });
  });

  describe('hasFeature()', () => {
    it('should return true for features included in a tier', () => {
      expect(hasFeature('Foundation', 'authentication')).toBe(true);
      expect(hasFeature('Foundation', 'aiPolicyGeneration')).toBe(true);
      expect(hasFeature('Essentials', 'aiContractAnalyzer')).toBe(true);
      expect(hasFeature('Growth', 'acosGoals')).toBe(true);
      expect(hasFeature('Visionary', 'acosPhysicalAi')).toBe(true);
    });

    it('should return false for features not included in a tier', () => {
      expect(hasFeature('Foundation', 'aiContractAnalyzer')).toBe(false);
      expect(hasFeature('Foundation', 'acosGoals')).toBe(false);
      expect(hasFeature('Essentials', 'acosGoals')).toBe(false);
      expect(hasFeature('Growth', 'acosPhysicalAi')).toBe(false);
    });

    it('should correctly check support features', () => {
      expect(hasFeature('Foundation', 'slaGuarantee')).toBe(false);
      expect(hasFeature('Essentials', 'prioritySupport')).toBe(true);
      expect(hasFeature('Growth', 'slaGuarantee')).toBe(true);
      expect(hasFeature('Visionary', 'dedicatedSupport')).toBe(true);
    });

    it('should correctly check add-on availability flags', () => {
      expect(hasFeature('Foundation', 'customFrameworksAddOn')).toBe(false);
      expect(hasFeature('Growth', 'customFrameworksAddOn')).toBe(true);
      expect(hasFeature('Visionary', 'onPremAddOn')).toBe(true);
    });
  });

  describe('getLimit()', () => {
    it('should return correct limits for Foundation tier', () => {
      expect(getLimit('Foundation', 'maxUsers')).toBe(10);
      expect(getLimit('Foundation', 'maxFrameworks')).toBe(3);
      expect(getLimit('Foundation', 'maxWorkspaces')).toBe(1);
      expect(getLimit('Foundation', 'maxStorageGB')).toBe(5);
    });

    it('should return correct limits for Essentials tier', () => {
      expect(getLimit('Essentials', 'maxUsers')).toBe(100);
      expect(getLimit('Essentials', 'maxFrameworks')).toBe(10);
      expect(getLimit('Essentials', 'maxWorkspaces')).toBe(5);
    });

    it('should return correct limits for Growth tier', () => {
      expect(getLimit('Growth', 'maxUsers')).toBe(1000);
      expect(getLimit('Growth', 'maxFrameworks')).toBe(50);
    });

    it('should return -1 (unlimited) for Visionary tier limits', () => {
      expect(getLimit('Visionary', 'maxUsers')).toBe(-1);
      expect(getLimit('Visionary', 'maxFrameworks')).toBe(-1);
      expect(getLimit('Visionary', 'maxStorageGB')).toBe(-1);
    });

    it('should return data retention days', () => {
      expect(getLimit('Foundation', 'dataRetentionDays')).toBe(365);
      expect(getLimit('Visionary', 'dataRetentionDays')).toBe(3650);
    });
  });

  describe('isWithinLimit()', () => {
    it('should return true when value is below limit', () => {
      expect(isWithinLimit('Foundation', 'maxUsers', 5)).toBe(true);
      expect(isWithinLimit('Foundation', 'maxUsers', 0)).toBe(true);
      expect(isWithinLimit('Foundation', 'maxUsers', 9)).toBe(true);
    });

    it('should return false when value equals or exceeds limit', () => {
      expect(isWithinLimit('Foundation', 'maxUsers', 10)).toBe(false);
      expect(isWithinLimit('Foundation', 'maxUsers', 11)).toBe(false);
      expect(isWithinLimit('Foundation', 'maxUsers', 100)).toBe(false);
    });

    it('should always return true for unlimited (-1) limits', () => {
      expect(isWithinLimit('Visionary', 'maxUsers', 0)).toBe(true);
      expect(isWithinLimit('Visionary', 'maxUsers', 10000)).toBe(true);
      expect(isWithinLimit('Visionary', 'maxUsers', 999999)).toBe(true);
    });

    it('should work correctly at the boundary', () => {
      // Foundation maxFrameworks is 3
      expect(isWithinLimit('Foundation', 'maxFrameworks', 2)).toBe(true);
      expect(isWithinLimit('Foundation', 'maxFrameworks', 3)).toBe(false);
    });

    it('should handle different limit types', () => {
      expect(isWithinLimit('Foundation', 'maxAiRequestsPerMonth', 99)).toBe(true);
      expect(isWithinLimit('Foundation', 'maxAiRequestsPerMonth', 100)).toBe(false);
      expect(isWithinLimit('Essentials', 'maxVendors', 50)).toBe(true);
    });
  });

  describe('getAvailableAddOns()', () => {
    it('should return add-ons available for Foundation tier', () => {
      const addOns = getAvailableAddOns('Foundation');
      expect(Array.isArray(addOns)).toBe(true);
      expect(addOns.length).toBeGreaterThan(0);
    });

    it('should return add-ons available for all tiers since all add-ons are for ALL_TIERS', () => {
      const foundationAddOns = getAvailableAddOns('Foundation');
      const visionaryAddOns = getAvailableAddOns('Visionary');
      // All add-ons are available for all tiers
      expect(foundationAddOns.length).toBe(visionaryAddOns.length);
    });

    it('should include custom-frameworks add-on', () => {
      const addOns = getAvailableAddOns('Foundation');
      const customFrameworks = addOns.find((a) => a.id === 'custom-frameworks');
      expect(customFrameworks).toBeDefined();
      expect(customFrameworks!.priceAnnual).toBe(2997);
    });

    it('should include on-prem-deployment add-on with one-time cost', () => {
      const addOns = getAvailableAddOns('Visionary');
      const onPrem = addOns.find((a) => a.id === 'on-prem-deployment');
      expect(onPrem).toBeDefined();
      expect(onPrem!.priceOneTime).toBe(19997);
      expect(onPrem!.priceAnnual).toBe(9997);
    });

    it('should include vciso-service add-on', () => {
      const addOns = getAvailableAddOns('Growth');
      const vciso = addOns.find((a) => a.id === 'vciso-service');
      expect(vciso).toBeDefined();
      expect(vciso!.priceAnnual).toBe(9997);
    });

    it('should return all 5 add-ons', () => {
      const addOns = getAvailableAddOns('Foundation');
      expect(addOns.length).toBe(5);
    });
  });

  describe('calculateAnnualPrice()', () => {
    it('should return base price when no perUserIncrement is defined', () => {
      // Foundation has no perUserIncrement
      expect(calculateAnnualPrice('Foundation', 1)).toBe(8500);
      expect(calculateAnnualPrice('Foundation', 10)).toBe(8500);
      expect(calculateAnnualPrice('Foundation', 100)).toBe(8500);
    });

    it('should return base price for Essentials regardless of user count', () => {
      expect(calculateAnnualPrice('Essentials', 1)).toBe(17000);
      expect(calculateAnnualPrice('Essentials', 50)).toBe(17000);
      expect(calculateAnnualPrice('Essentials', 100)).toBe(17000);
    });

    it('should return base price for Growth regardless of user count', () => {
      // Growth also has no perUserIncrement defined
      expect(calculateAnnualPrice('Growth', 1)).toBe(42500);
      expect(calculateAnnualPrice('Growth', 500)).toBe(42500);
    });

    it('should return base price for Visionary regardless of user count', () => {
      expect(calculateAnnualPrice('Visionary', 1)).toBe(68000);
      expect(calculateAnnualPrice('Visionary', 10000)).toBe(68000);
    });
  });

  describe('calculateMonthlyPrice()', () => {
    it('should calculate monthly price for Foundation (2.0x multiplier)', () => {
      const monthlyPrice = calculateMonthlyPrice(8500, 'Foundation');
      // (8500 * 2.0) / 12 = 1416.67 -> rounded to 2 decimal places
      expect(monthlyPrice).toBe(Math.round(((8500 * 2.0) / 12) * 100) / 100);
    });

    it('should calculate monthly price for Essentials (1.5x multiplier)', () => {
      const monthlyPrice = calculateMonthlyPrice(17000, 'Essentials');
      // (17000 * 1.5) / 12 = 2125
      expect(monthlyPrice).toBe(Math.round(((17000 * 1.5) / 12) * 100) / 100);
    });

    it('should calculate monthly price for Growth (1.0x multiplier)', () => {
      const monthlyPrice = calculateMonthlyPrice(42500, 'Growth');
      // (42500 * 1.0) / 12 = 3541.67
      expect(monthlyPrice).toBe(Math.round(((42500 * 1.0) / 12) * 100) / 100);
    });

    it('should calculate monthly price for Visionary (1.0x multiplier)', () => {
      const monthlyPrice = calculateMonthlyPrice(68000, 'Visionary');
      // (68000 * 1.0) / 12 = 5666.67
      expect(monthlyPrice).toBe(Math.round(((68000 * 1.0) / 12) * 100) / 100);
    });

    it('should round to 2 decimal places', () => {
      const monthlyPrice = calculateMonthlyPrice(8500, 'Foundation');
      const decimalParts = monthlyPrice.toString().split('.');
      if (decimalParts.length > 1) {
        expect(decimalParts[1].length).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('getFeaturesDifference()', () => {
    it('should return new features when upgrading from Foundation to Essentials', () => {
      const diff = getFeaturesDifference('Foundation', 'Essentials');
      expect(diff).toContain('aiContractAnalyzer');
      expect(diff).toContain('aiRfpGenerator');
      expect(diff).toContain('personnelManagement');
      expect(diff).toContain('vendorRiskManagement');
      expect(diff).toContain('prioritySupport');
    });

    it('should return aCOS features when upgrading from Essentials to Growth', () => {
      const diff = getFeaturesDifference('Essentials', 'Growth');
      expect(diff).toContain('acosGoals');
      expect(diff).toContain('acosControlLoops');
      expect(diff).toContain('acosDebtTracking');
      expect(diff).toContain('customFrameworks');
      expect(diff).toContain('slaGuarantee');
      expect(diff).toContain('whiteGloveOnboarding');
    });

    it('should return Visionary features when upgrading from Growth to Visionary', () => {
      const diff = getFeaturesDifference('Growth', 'Visionary');
      expect(diff).toContain('acosPhysicalAi');
      expect(diff).toContain('acosVrTraining');
      expect(diff).toContain('acosSwarmIntelligence');
      expect(diff).toContain('zeroTrustSecurity');
      expect(diff).toContain('nistAiRmf');
      expect(diff).toContain('euAiAct');
      expect(diff).toContain('dedicatedSupport');
      expect(diff).toContain('onPremDeployment');
    });

    it('should return empty array for same tier comparison', () => {
      const diff = getFeaturesDifference('Foundation', 'Foundation');
      expect(diff).toEqual([]);
    });

    it('should return empty array when downgrading (no new features)', () => {
      const diff = getFeaturesDifference('Visionary', 'Foundation');
      // Visionary has all features true; Foundation does not have new features
      expect(diff.length).toBe(0);
    });

    it('should return all features gained from Foundation to Visionary', () => {
      const diff = getFeaturesDifference('Foundation', 'Visionary');
      // Should include all features that are false in Foundation but true in Visionary
      expect(diff.length).toBeGreaterThan(20);
      expect(diff).toContain('aiContractAnalyzer');
      expect(diff).toContain('acosGoals');
      expect(diff).toContain('acosPhysicalAi');
      expect(diff).toContain('nistAiRmf');
    });

    it('should not include features already present in the source tier', () => {
      const diff = getFeaturesDifference('Foundation', 'Essentials');
      // authentication is in both tiers
      expect(diff).not.toContain('authentication');
      expect(diff).not.toContain('twoFactorAuth');
      expect(diff).not.toContain('aiPolicyGeneration');
    });
  });

  describe('tierAddOns', () => {
    it('should have 5 add-ons defined', () => {
      expect(tierAddOns.length).toBe(5);
    });

    it('should have unique IDs for each add-on', () => {
      const ids = tierAddOns.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have all add-ons available for all tiers', () => {
      for (const addon of tierAddOns) {
        expect(addon.availableForTiers).toContain('Foundation');
        expect(addon.availableForTiers).toContain('Essentials');
        expect(addon.availableForTiers).toContain('Growth');
        expect(addon.availableForTiers).toContain('Visionary');
      }
    });

    it('should have proper structure for each add-on', () => {
      for (const addon of tierAddOns) {
        expect(typeof addon.id).toBe('string');
        expect(typeof addon.name).toBe('string');
        expect(typeof addon.description).toBe('string');
        expect(typeof addon.priceAnnual).toBe('number');
        expect(Array.isArray(addon.availableForTiers)).toBe(true);
      }
    });
  });

  describe('FEATURE_DISPLAY_NAMES', () => {
    it('should have display names for all features in TierFeatures', () => {
      const featureKeys = Object.keys(TIERS.Visionary.features);
      for (const key of featureKeys) {
        expect(FEATURE_DISPLAY_NAMES[key as keyof TierFeatures]).toBeDefined();
        expect(typeof FEATURE_DISPLAY_NAMES[key as keyof TierFeatures]).toBe('string');
      }
    });
  });

  describe('LIMIT_DISPLAY_NAMES', () => {
    it('should have display names for all limit keys', () => {
      const limitKeys = Object.keys(TIERS.Foundation.limits);
      for (const key of limitKeys) {
        expect(LIMIT_DISPLAY_NAMES[key as keyof TierLimits]).toBeDefined();
        expect(typeof LIMIT_DISPLAY_NAMES[key as keyof TierLimits]).toBe('string');
      }
    });
  });
});
