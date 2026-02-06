import { describe, it, expect } from 'vitest';
import { getLimit, isAtLimit, LIMIT_LABELS, UPGRADE_LINK, getUpgradeMessage } from '../tierLimits';

describe('tierLimits', () => {
  describe('getLimit', () => {
    it('should return Foundation limits', () => {
      expect(getLimit('Foundation', 'maxUsers')).toBe(10);
      expect(getLimit('Foundation', 'maxFrameworks')).toBe(3);
      expect(getLimit('Foundation', 'maxWorkspaces')).toBe(1);
      expect(getLimit('Foundation', 'maxIntegrations')).toBe(3);
    });

    it('should return Essentials limits', () => {
      expect(getLimit('Essentials', 'maxUsers')).toBe(100);
      expect(getLimit('Essentials', 'maxFrameworks')).toBe(10);
      expect(getLimit('Essentials', 'maxWorkspaces')).toBe(5);
    });

    it('should return Growth limits', () => {
      expect(getLimit('Growth', 'maxUsers')).toBe(1000);
      expect(getLimit('Growth', 'maxFrameworks')).toBe(50);
    });

    it('should return -1 (unlimited) for Visionary', () => {
      expect(getLimit('Visionary', 'maxUsers')).toBe(-1);
      expect(getLimit('Visionary', 'maxFrameworks')).toBe(-1);
      expect(getLimit('Visionary', 'maxWorkspaces')).toBe(-1);
      expect(getLimit('Visionary', 'maxIntegrations')).toBe(-1);
    });

    it('should normalize legacy plan names', () => {
      expect(getLimit('Basic', 'maxUsers')).toBe(10);
      expect(getLimit('Pro', 'maxUsers')).toBe(100);
      expect(getLimit('Enterprise', 'maxUsers')).toBe(1000);
    });

    it('should default to Foundation for undefined plan', () => {
      expect(getLimit(undefined, 'maxUsers')).toBe(10);
    });
  });

  describe('isAtLimit', () => {
    it('should return true when at limit', () => {
      expect(isAtLimit('Foundation', 'maxUsers', 10)).toBe(true);
    });

    it('should return true when over limit', () => {
      expect(isAtLimit('Foundation', 'maxUsers', 15)).toBe(true);
    });

    it('should return false when under limit', () => {
      expect(isAtLimit('Foundation', 'maxUsers', 5)).toBe(false);
    });

    it('should never return true for Visionary (unlimited)', () => {
      expect(isAtLimit('Visionary', 'maxUsers', 999999)).toBe(false);
      expect(isAtLimit('Visionary', 'maxFrameworks', 999999)).toBe(false);
    });

    it('should return false at zero count', () => {
      expect(isAtLimit('Foundation', 'maxUsers', 0)).toBe(false);
    });
  });

  describe('LIMIT_LABELS', () => {
    it('should have labels for all limit keys', () => {
      expect(LIMIT_LABELS.maxUsers).toBe('users');
      expect(LIMIT_LABELS.maxFrameworks).toBe('frameworks');
      expect(LIMIT_LABELS.maxWorkspaces).toBe('workspaces');
      expect(LIMIT_LABELS.maxIntegrations).toBe('integrations');
      expect(LIMIT_LABELS.maxPolicies).toBe('policies');
      expect(LIMIT_LABELS.maxVendors).toBe('vendors');
      expect(LIMIT_LABELS.maxMonitors).toBe('monitors');
    });

    it('should have readable labels', () => {
      expect(LIMIT_LABELS.maxAiRequestsPerMonth).toBe('AI requests per month');
      expect(LIMIT_LABELS.maxStorageGB).toBe('GB storage');
      expect(LIMIT_LABELS.dataRetentionDays).toBe('days data retention');
    });
  });

  describe('UPGRADE_LINK', () => {
    it('should point to settings billing tab', () => {
      expect(UPGRADE_LINK).toBe('/settings?tab=billing');
    });
  });

  describe('getUpgradeMessage', () => {
    it('should return message when at limit', () => {
      const msg = getUpgradeMessage('Foundation', 'maxUsers', 10);
      expect(msg).toContain('10');
      expect(msg).toContain('Upgrade');
      expect(msg).toContain('Billing');
    });

    it('should return empty string when under limit', () => {
      expect(getUpgradeMessage('Foundation', 'maxUsers', 5)).toBe('');
    });

    it('should return empty string for unlimited (Visionary)', () => {
      expect(getUpgradeMessage('Visionary', 'maxUsers', 999999)).toBe('');
    });

    it('should include the limit number in message', () => {
      const msg = getUpgradeMessage('Foundation', 'maxFrameworks', 3);
      expect(msg).toContain('3');
    });

    it('should return message when over limit', () => {
      const msg = getUpgradeMessage('Foundation', 'maxUsers', 15);
      expect(msg).toContain('Upgrade');
    });
  });
});
