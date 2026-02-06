/**
 * Features Configuration Unit Tests
 * Tests for feature catalog, bundles, pricing, and tier-based availability
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  FEATURES,
  FEATURE_BUNDLES,
  calculateFeaturePrice,
  getAvailableFeatures,
  getAvailableBundles,
  getFeature,
  getBundle,
} from '../../../config/features';
import type { Feature, FeatureBundle } from '../../../config/features';

describe('Features Configuration', () => {
  describe('FEATURES Catalog Structure', () => {
    it('should export FEATURES as a non-empty Record', () => {
      expect(FEATURES).toBeDefined();
      expect(typeof FEATURES).toBe('object');
      expect(Object.keys(FEATURES).length).toBeGreaterThan(0);
    });

    it('should have properly structured feature objects', () => {
      for (const [key, feature] of Object.entries(FEATURES)) {
        expect(feature.id).toBe(key);
        expect(typeof feature.name).toBe('string');
        expect(feature.name.length).toBeGreaterThan(0);
        expect(typeof feature.description).toBe('string');
        expect(feature.description.length).toBeGreaterThan(0);
        expect(['core', 'ai', 'enterprise', 'acos', 'visionary', 'support']).toContain(
          feature.category
        );
        expect(typeof feature.basePriceAnnual).toBe('number');
        expect(feature.basePriceAnnual).toBeGreaterThanOrEqual(0);
        expect(typeof feature.basePriceMonthly).toBe('number');
        expect(feature.basePriceMonthly).toBeGreaterThanOrEqual(0);
        expect(typeof feature.availableAsAddOn).toBe('boolean');
      }
    });

    it('should have features with consistent ID and key matching', () => {
      for (const [key, feature] of Object.entries(FEATURES)) {
        expect(feature.id).toEqual(key);
      }
    });

    it('should have AI category features requiring at least Essentials tier', () => {
      const aiFeatures = Object.values(FEATURES).filter((f) => f.category === 'ai');
      expect(aiFeatures.length).toBeGreaterThan(0);

      for (const feature of aiFeatures) {
        expect(feature.requiresTier).toBe('Essentials');
      }
    });

    it('should have enterprise category features requiring at least Essentials tier', () => {
      const enterpriseFeatures = Object.values(FEATURES).filter(
        (f) => f.category === 'enterprise'
      );
      expect(enterpriseFeatures.length).toBeGreaterThan(0);

      for (const feature of enterpriseFeatures) {
        expect(feature.requiresTier).toBe('Essentials');
      }
    });

    it('should have aCOS category features requiring at least Growth tier', () => {
      const acosFeatures = Object.values(FEATURES).filter((f) => f.category === 'acos');
      expect(acosFeatures.length).toBeGreaterThan(0);

      for (const feature of acosFeatures) {
        expect(feature.requiresTier).toBe('Growth');
      }
    });

    it('should have visionary category features requiring Visionary tier', () => {
      const visionaryFeatures = Object.values(FEATURES).filter(
        (f) => f.category === 'visionary'
      );
      expect(visionaryFeatures.length).toBeGreaterThan(0);

      for (const feature of visionaryFeatures) {
        expect(feature.requiresTier).toBe('Visionary');
      }
    });

    it('should contain specific known features', () => {
      expect(FEATURES['ai-contract-analyzer']).toBeDefined();
      expect(FEATURES['ai-rfp-generator']).toBeDefined();
      expect(FEATURES['ai-phishing-simulator']).toBeDefined();
      expect(FEATURES['vendor-risk-management']).toBeDefined();
      expect(FEATURES['acos-goals']).toBeDefined();
      expect(FEATURES['physical-ai']).toBeDefined();
    });

    it('should have monthly prices lower than annual prices', () => {
      for (const feature of Object.values(FEATURES)) {
        // Monthly price * 12 should be more expensive than annual (incentivizing annual)
        expect(feature.basePriceMonthly * 12).toBeGreaterThanOrEqual(feature.basePriceAnnual);
      }
    });

    it('should contain support category features', () => {
      const supportFeatures = Object.values(FEATURES).filter(
        (f) => f.category === 'support'
      );
      expect(supportFeatures.length).toBeGreaterThan(0);
      expect(supportFeatures.map((f) => f.id)).toContain('sla-guarantee');
      expect(supportFeatures.map((f) => f.id)).toContain('priority-support');
      expect(supportFeatures.map((f) => f.id)).toContain('white-glove-onboarding');
    });
  });

  describe('FEATURE_BUNDLES Structure', () => {
    it('should export FEATURE_BUNDLES as a non-empty Record', () => {
      expect(FEATURE_BUNDLES).toBeDefined();
      expect(typeof FEATURE_BUNDLES).toBe('object');
      expect(Object.keys(FEATURE_BUNDLES).length).toBeGreaterThan(0);
    });

    it('should have properly structured bundle objects', () => {
      for (const [key, bundle] of Object.entries(FEATURE_BUNDLES)) {
        expect(bundle.id).toBe(key);
        expect(typeof bundle.name).toBe('string');
        expect(typeof bundle.description).toBe('string');
        expect(Array.isArray(bundle.featureIds)).toBe(true);
        expect(bundle.featureIds.length).toBeGreaterThan(0);
        expect(typeof bundle.discountPercent).toBe('number');
        expect(bundle.discountPercent).toBeGreaterThan(0);
        expect(bundle.discountPercent).toBeLessThanOrEqual(100);
        expect(typeof bundle.basePriceAnnual).toBe('number');
        expect(typeof bundle.basePriceMonthly).toBe('number');
        expect(typeof bundle.availableAsAddOn).toBe('boolean');
      }
    });

    it('should reference only valid feature IDs in bundles', () => {
      for (const bundle of Object.values(FEATURE_BUNDLES)) {
        for (const featureId of bundle.featureIds) {
          expect(FEATURES[featureId]).toBeDefined();
        }
      }
    });

    it('should contain the ai-suite-bundle', () => {
      const aiBundle = FEATURE_BUNDLES['ai-suite-bundle'];
      expect(aiBundle).toBeDefined();
      expect(aiBundle.featureIds).toContain('ai-contract-analyzer');
      expect(aiBundle.featureIds).toContain('ai-rfp-generator');
      expect(aiBundle.featureIds).toContain('ai-phishing-simulator');
      expect(aiBundle.featureIds).toContain('ai-vendor-scorer');
      expect(aiBundle.featureIds).toContain('ai-data-mapper');
      expect(aiBundle.featureIds).toContain('ai-bcp-generator');
      expect(aiBundle.discountPercent).toBe(15);
      expect(aiBundle.requiresTier).toBe('Essentials');
    });

    it('should contain the enterprise-bundle', () => {
      const enterpriseBundle = FEATURE_BUNDLES['enterprise-bundle'];
      expect(enterpriseBundle).toBeDefined();
      expect(enterpriseBundle.requiresTier).toBe('Essentials');
      expect(enterpriseBundle.discountPercent).toBe(15);
      expect(enterpriseBundle.featureIds.length).toBe(7);
    });

    it('should contain the acos-bundle', () => {
      const acosBundle = FEATURE_BUNDLES['acos-bundle'];
      expect(acosBundle).toBeDefined();
      expect(acosBundle.requiresTier).toBe('Growth');
      expect(acosBundle.discountPercent).toBe(15);
      expect(acosBundle.featureIds.length).toBe(12);
    });

    it('should contain the visionary-bundle', () => {
      const visionaryBundle = FEATURE_BUNDLES['visionary-bundle'];
      expect(visionaryBundle).toBeDefined();
      expect(visionaryBundle.requiresTier).toBe('Visionary');
      expect(visionaryBundle.discountPercent).toBe(15);
      expect(visionaryBundle.featureIds.length).toBe(14);
    });

    it('should offer bundle prices lower than sum of individual feature prices', () => {
      for (const bundle of Object.values(FEATURE_BUNDLES)) {
        const individualTotal = bundle.featureIds.reduce((sum, id) => {
          return sum + (FEATURES[id]?.basePriceAnnual || 0);
        }, 0);
        expect(bundle.basePriceAnnual).toBeLessThan(individualTotal);
      }
    });
  });

  describe('calculateFeaturePrice()', () => {
    it('should apply 2.0x multiplier for Foundation tier', () => {
      const feature: Feature = FEATURES['ai-contract-analyzer'];
      const annualPrice = calculateFeaturePrice(feature, 'Foundation', 'annual');
      expect(annualPrice).toBe(Math.round(feature.basePriceAnnual * 2.0));

      const monthlyPrice = calculateFeaturePrice(feature, 'Foundation', 'monthly');
      expect(monthlyPrice).toBe(Math.round(feature.basePriceMonthly * 2.0));
    });

    it('should apply 1.5x multiplier for Essentials tier', () => {
      const feature: Feature = FEATURES['ai-contract-analyzer'];
      const annualPrice = calculateFeaturePrice(feature, 'Essentials', 'annual');
      expect(annualPrice).toBe(Math.round(feature.basePriceAnnual * 1.5));

      const monthlyPrice = calculateFeaturePrice(feature, 'Essentials', 'monthly');
      expect(monthlyPrice).toBe(Math.round(feature.basePriceMonthly * 1.5));
    });

    it('should apply 1.2x multiplier for Growth tier', () => {
      const feature: Feature = FEATURES['acos-goals'];
      const annualPrice = calculateFeaturePrice(feature, 'Growth', 'annual');
      expect(annualPrice).toBe(Math.round(feature.basePriceAnnual * 1.2));

      const monthlyPrice = calculateFeaturePrice(feature, 'Growth', 'monthly');
      expect(monthlyPrice).toBe(Math.round(feature.basePriceMonthly * 1.2));
    });

    it('should apply 1.0x multiplier for Visionary tier', () => {
      const feature: Feature = FEATURES['physical-ai'];
      const annualPrice = calculateFeaturePrice(feature, 'Visionary', 'annual');
      expect(annualPrice).toBe(Math.round(feature.basePriceAnnual * 1.0));

      const monthlyPrice = calculateFeaturePrice(feature, 'Visionary', 'monthly');
      expect(monthlyPrice).toBe(Math.round(feature.basePriceMonthly * 1.0));
    });

    it('should return rounded integer prices', () => {
      const feature: Feature = FEATURES['ai-phishing-simulator']; // 400 annual, 40 monthly
      const price = calculateFeaturePrice(feature, 'Essentials', 'annual');
      expect(Number.isInteger(price)).toBe(true);
    });

    it('should use annual base price for annual billing cycle', () => {
      const feature: Feature = FEATURES['acos-goals']; // 800 annual
      const price = calculateFeaturePrice(feature, 'Visionary', 'annual');
      expect(price).toBe(800);
    });

    it('should use monthly base price for monthly billing cycle', () => {
      const feature: Feature = FEATURES['acos-goals']; // 80 monthly
      const price = calculateFeaturePrice(feature, 'Visionary', 'monthly');
      expect(price).toBe(80);
    });

    it('should handle Foundation multiplier for each billing cycle', () => {
      const feature: Feature = FEATURES['policy-library']; // 300/30
      expect(calculateFeaturePrice(feature, 'Foundation', 'annual')).toBe(600);
      expect(calculateFeaturePrice(feature, 'Foundation', 'monthly')).toBe(60);
    });

    it('should produce progressively lower prices for higher tiers', () => {
      const feature: Feature = FEATURES['ai-contract-analyzer'];
      const foundationPrice = calculateFeaturePrice(feature, 'Foundation', 'annual');
      const essentialsPrice = calculateFeaturePrice(feature, 'Essentials', 'annual');
      const growthPrice = calculateFeaturePrice(feature, 'Growth', 'annual');
      const visionaryPrice = calculateFeaturePrice(feature, 'Visionary', 'annual');

      expect(foundationPrice).toBeGreaterThan(essentialsPrice);
      expect(essentialsPrice).toBeGreaterThan(growthPrice);
      expect(growthPrice).toBeGreaterThan(visionaryPrice);
    });
  });

  describe('getAvailableFeatures()', () => {
    it('should return an array of features', () => {
      const features = getAvailableFeatures('Visionary');
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    });

    it('should return no tier-gated features for Foundation', () => {
      const features = getAvailableFeatures('Foundation');
      // Foundation cannot access features that require Essentials, Growth, or Visionary
      for (const feature of features) {
        if (feature.requiresTier) {
          expect(['Foundation']).toContain(feature.requiresTier);
        }
      }
    });

    it('should return Essentials-tier features for Essentials', () => {
      const features = getAvailableFeatures('Essentials');
      const featureIds = features.map((f) => f.id);
      // AI and Enterprise features require Essentials
      expect(featureIds).toContain('ai-contract-analyzer');
      expect(featureIds).toContain('vendor-risk-management');
      expect(featureIds).toContain('priority-support');
    });

    it('should not return Growth-tier features for Essentials', () => {
      const features = getAvailableFeatures('Essentials');
      const featureIds = features.map((f) => f.id);
      expect(featureIds).not.toContain('acos-goals');
      expect(featureIds).not.toContain('acos-control-loops');
    });

    it('should return aCOS features for Growth tier', () => {
      const features = getAvailableFeatures('Growth');
      const featureIds = features.map((f) => f.id);
      expect(featureIds).toContain('acos-goals');
      expect(featureIds).toContain('acos-control-loops');
      expect(featureIds).toContain('acos-digital-twin');
      expect(featureIds).toContain('sla-guarantee');
    });

    it('should not return Visionary features for Growth tier', () => {
      const features = getAvailableFeatures('Growth');
      const featureIds = features.map((f) => f.id);
      expect(featureIds).not.toContain('physical-ai');
      expect(featureIds).not.toContain('vr-training');
      expect(featureIds).not.toContain('swarm-intelligence');
    });

    it('should return all features for Visionary tier', () => {
      const features = getAvailableFeatures('Visionary');
      const featureIds = features.map((f) => f.id);
      expect(featureIds).toContain('ai-contract-analyzer');
      expect(featureIds).toContain('acos-goals');
      expect(featureIds).toContain('physical-ai');
      expect(featureIds).toContain('swarm-intelligence');
      expect(featureIds).toContain('sla-guarantee');
    });

    it('should only include features marked as availableAsAddOn', () => {
      const features = getAvailableFeatures('Visionary');
      for (const feature of features) {
        expect(feature.availableAsAddOn).toBe(true);
      }
    });

    it('should return progressively more features for higher tiers', () => {
      const foundationFeatures = getAvailableFeatures('Foundation');
      const essentialsFeatures = getAvailableFeatures('Essentials');
      const growthFeatures = getAvailableFeatures('Growth');
      const visionaryFeatures = getAvailableFeatures('Visionary');

      expect(essentialsFeatures.length).toBeGreaterThan(foundationFeatures.length);
      expect(growthFeatures.length).toBeGreaterThan(essentialsFeatures.length);
      expect(visionaryFeatures.length).toBeGreaterThan(growthFeatures.length);
    });
  });

  describe('getAvailableBundles()', () => {
    it('should return an array of bundles', () => {
      const bundles = getAvailableBundles('Visionary');
      expect(Array.isArray(bundles)).toBe(true);
      expect(bundles.length).toBeGreaterThan(0);
    });

    it('should return no bundles for Foundation tier', () => {
      const bundles = getAvailableBundles('Foundation');
      expect(bundles.length).toBe(0);
    });

    it('should return ai-suite and enterprise bundles for Essentials tier', () => {
      const bundles = getAvailableBundles('Essentials');
      const bundleIds = bundles.map((b) => b.id);
      expect(bundleIds).toContain('ai-suite-bundle');
      expect(bundleIds).toContain('enterprise-bundle');
      expect(bundleIds).not.toContain('acos-bundle');
      expect(bundleIds).not.toContain('visionary-bundle');
    });

    it('should return aCOS bundle for Growth tier', () => {
      const bundles = getAvailableBundles('Growth');
      const bundleIds = bundles.map((b) => b.id);
      expect(bundleIds).toContain('ai-suite-bundle');
      expect(bundleIds).toContain('enterprise-bundle');
      expect(bundleIds).toContain('acos-bundle');
      expect(bundleIds).not.toContain('visionary-bundle');
    });

    it('should return all bundles for Visionary tier', () => {
      const bundles = getAvailableBundles('Visionary');
      const bundleIds = bundles.map((b) => b.id);
      expect(bundleIds).toContain('ai-suite-bundle');
      expect(bundleIds).toContain('enterprise-bundle');
      expect(bundleIds).toContain('acos-bundle');
      expect(bundleIds).toContain('visionary-bundle');
    });

    it('should return progressively more bundles for higher tiers', () => {
      const foundationBundles = getAvailableBundles('Foundation');
      const essentialsBundles = getAvailableBundles('Essentials');
      const growthBundles = getAvailableBundles('Growth');
      const visionaryBundles = getAvailableBundles('Visionary');

      expect(essentialsBundles.length).toBeGreaterThan(foundationBundles.length);
      expect(growthBundles.length).toBeGreaterThan(essentialsBundles.length);
      expect(visionaryBundles.length).toBeGreaterThan(growthBundles.length);
    });
  });

  describe('getFeature()', () => {
    it('should return a feature by its ID', () => {
      const feature = getFeature('ai-contract-analyzer');
      expect(feature).toBeDefined();
      expect(feature!.id).toBe('ai-contract-analyzer');
      expect(feature!.name).toBe('AI Contract Analyzer');
    });

    it('should return undefined for non-existent feature ID', () => {
      const feature = getFeature('non-existent-feature');
      expect(feature).toBeUndefined();
    });

    it('should return the exact same object from FEATURES catalog', () => {
      const feature = getFeature('acos-goals');
      expect(feature).toBe(FEATURES['acos-goals']);
    });
  });

  describe('getBundle()', () => {
    it('should return a bundle by its ID', () => {
      const bundle = getBundle('ai-suite-bundle');
      expect(bundle).toBeDefined();
      expect(bundle!.id).toBe('ai-suite-bundle');
      expect(bundle!.name).toBe('AI Suite Bundle');
    });

    it('should return undefined for non-existent bundle ID', () => {
      const bundle = getBundle('non-existent-bundle');
      expect(bundle).toBeUndefined();
    });

    it('should return the exact same object from FEATURE_BUNDLES', () => {
      const bundle = getBundle('acos-bundle');
      expect(bundle).toBe(FEATURE_BUNDLES['acos-bundle']);
    });
  });

  describe('Pricing Multipliers', () => {
    it('should verify Foundation multiplier is 2.0', () => {
      // Verify by checking a known feature price
      const feature = FEATURES['ai-contract-analyzer']; // basePriceAnnual: 500
      const price = calculateFeaturePrice(feature, 'Foundation', 'annual');
      expect(price).toBe(1000); // 500 * 2.0
    });

    it('should verify Essentials multiplier is 1.5', () => {
      const feature = FEATURES['ai-contract-analyzer']; // basePriceAnnual: 500
      const price = calculateFeaturePrice(feature, 'Essentials', 'annual');
      expect(price).toBe(750); // 500 * 1.5
    });

    it('should verify Growth multiplier is 1.2', () => {
      const feature = FEATURES['ai-contract-analyzer']; // basePriceAnnual: 500
      const price = calculateFeaturePrice(feature, 'Growth', 'annual');
      expect(price).toBe(600); // 500 * 1.2
    });

    it('should verify Visionary multiplier is 1.0', () => {
      const feature = FEATURES['ai-contract-analyzer']; // basePriceAnnual: 500
      const price = calculateFeaturePrice(feature, 'Visionary', 'annual');
      expect(price).toBe(500); // 500 * 1.0
    });
  });

  describe('Default Export', () => {
    it('should export FEATURES as the default export', async () => {
      const defaultExport = (await import('../../../config/features')).default;
      expect(defaultExport).toBe(FEATURES);
    });
  });
});
