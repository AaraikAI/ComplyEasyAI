import { describe, it, expect } from 'vitest';
import { TIER_ORDER, normalizePlan, VIEW_TO_FEATURE, hasFeature, canAccessView } from '../tierFeatures';

describe('tierFeatures', () => {
  describe('TIER_ORDER', () => {
    it('should have 4 tiers in correct order', () => {
      expect(TIER_ORDER).toEqual(['Foundation', 'Essentials', 'Growth', 'Visionary']);
    });

    it('should have Foundation as lowest tier', () => {
      expect(TIER_ORDER[0]).toBe('Foundation');
    });

    it('should have Visionary as highest tier', () => {
      expect(TIER_ORDER[3]).toBe('Visionary');
    });
  });

  describe('normalizePlan', () => {
    it('should return Foundation for null/undefined', () => {
      expect(normalizePlan(undefined)).toBe('Foundation');
      expect(normalizePlan('')).toBe('Foundation');
    });

    it('should pass through already-normalized tier names', () => {
      expect(normalizePlan('Foundation')).toBe('Foundation');
      expect(normalizePlan('Essentials')).toBe('Essentials');
      expect(normalizePlan('Growth')).toBe('Growth');
      expect(normalizePlan('Visionary')).toBe('Visionary');
    });

    it('should convert legacy plan names', () => {
      expect(normalizePlan('Basic')).toBe('Foundation');
      expect(normalizePlan('Pro')).toBe('Essentials');
      expect(normalizePlan('Enterprise')).toBe('Growth');
    });

    it('should default unknown plans to Foundation', () => {
      expect(normalizePlan('SomeRandomPlan')).toBe('Foundation');
      expect(normalizePlan('Premium')).toBe('Foundation');
    });
  });

  describe('VIEW_TO_FEATURE', () => {
    it('should map dashboard to dashboard feature', () => {
      expect(VIEW_TO_FEATURE['dashboard']).toBe('dashboard');
    });

    it('should map AI views to correct features', () => {
      expect(VIEW_TO_FEATURE['ai-policy']).toBe('aiPolicyGeneration');
      expect(VIEW_TO_FEATURE['ai-contract']).toBe('aiContractAnalyzer');
      expect(VIEW_TO_FEATURE['ai-gap']).toBe('aiGapAnalysis');
      expect(VIEW_TO_FEATURE['ai-rfp']).toBe('aiRfpGenerator');
      expect(VIEW_TO_FEATURE['ai-phishing']).toBe('aiPhishingSimulator');
      expect(VIEW_TO_FEATURE['ai-vendor']).toBe('aiVendorScorer');
      expect(VIEW_TO_FEATURE['ai-data-map']).toBe('aiDataMapper');
      expect(VIEW_TO_FEATURE['ai-bcp']).toBe('aiBcpGenerator');
    });

    it('should map regulatory views', () => {
      expect(VIEW_TO_FEATURE['ai-rmf']).toBe('nistAiRmf');
      expect(VIEW_TO_FEATURE['eu-ai-act']).toBe('euAiAct');
      expect(VIEW_TO_FEATURE['dma']).toBe('dma');
      expect(VIEW_TO_FEATURE['dsa']).toBe('dsa');
    });

    it('should map security and acos views', () => {
      expect(VIEW_TO_FEATURE['security']).toBe('zeroTrustSecurity');
      expect(VIEW_TO_FEATURE['acos']).toBe('acosGoals');
    });
  });

  describe('hasFeature', () => {
    it('should return true for Foundation core features', () => {
      expect(hasFeature('Foundation', 'dashboard')).toBe(true);
      expect(hasFeature('Foundation', 'riskManagement')).toBe(true);
      expect(hasFeature('Foundation', 'complianceFrameworks')).toBe(true);
      expect(hasFeature('Foundation', 'aiPolicyGeneration')).toBe(true);
    });

    it('should return false for Foundation advanced features', () => {
      expect(hasFeature('Foundation', 'advancedReporting')).toBe(false);
      expect(hasFeature('Foundation', 'aiContractAnalyzer')).toBe(false);
      expect(hasFeature('Foundation', 'nistAiRmf')).toBe(false);
      expect(hasFeature('Foundation', 'zeroTrustSecurity')).toBe(false);
    });

    it('should return true for Essentials AI features', () => {
      expect(hasFeature('Essentials', 'advancedReporting')).toBe(true);
      expect(hasFeature('Essentials', 'aiContractAnalyzer')).toBe(true);
      expect(hasFeature('Essentials', 'aiRfpGenerator')).toBe(true);
      expect(hasFeature('Essentials', 'personnelManagement')).toBe(true);
    });

    it('should return false for Essentials visionary features', () => {
      expect(hasFeature('Essentials', 'acosGoals')).toBe(false);
      expect(hasFeature('Essentials', 'nistAiRmf')).toBe(false);
    });

    it('should return true for Growth aCOS goals', () => {
      expect(hasFeature('Growth', 'acosGoals')).toBe(true);
    });

    it('should return true for Visionary all features', () => {
      expect(hasFeature('Visionary', 'nistAiRmf')).toBe(true);
      expect(hasFeature('Visionary', 'euAiAct')).toBe(true);
      expect(hasFeature('Visionary', 'dsa')).toBe(true);
      expect(hasFeature('Visionary', 'dma')).toBe(true);
      expect(hasFeature('Visionary', 'zeroTrustSecurity')).toBe(true);
    });

    it('should normalize legacy plan names', () => {
      expect(hasFeature('Basic', 'dashboard')).toBe(true);
      expect(hasFeature('Basic', 'advancedReporting')).toBe(false);
      expect(hasFeature('Pro', 'advancedReporting')).toBe(true);
    });

    it('should return false for unknown feature keys', () => {
      expect(hasFeature('Visionary', 'nonExistentFeature')).toBe(false);
    });

    it('should handle undefined plan', () => {
      expect(hasFeature(undefined, 'dashboard')).toBe(true);
      expect(hasFeature(undefined, 'advancedReporting')).toBe(false);
    });
  });

  describe('canAccessView', () => {
    it('should allow Foundation to access dashboard', () => {
      expect(canAccessView('Foundation', 'dashboard')).toBe(true);
    });

    it('should deny Foundation access to ai-rmf', () => {
      expect(canAccessView('Foundation', 'ai-rmf')).toBe(false);
    });

    it('should deny Foundation access to reports', () => {
      expect(canAccessView('Foundation', 'reports')).toBe(false);
    });

    it('should allow Essentials access to reports', () => {
      expect(canAccessView('Essentials', 'reports')).toBe(true);
    });

    it('should allow Visionary access to all mapped views', () => {
      const views = Object.keys(VIEW_TO_FEATURE);
      views.forEach(view => {
        expect(canAccessView('Visionary', view)).toBe(true);
      });
    });

    it('should allow unknown views by default', () => {
      expect(canAccessView('Foundation', 'some-unknown-view')).toBe(true);
    });
  });
});
