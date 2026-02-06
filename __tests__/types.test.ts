import { describe, it, expect } from 'vitest';
import { formatLimit, formatPrice, ComplianceStatus, FrameworkType, TierName } from '../types';

describe('types', () => {
  describe('formatLimit', () => {
    it('should return "Unlimited" for -1', () => {
      expect(formatLimit(-1)).toBe('Unlimited');
    });

    it('should format millions', () => {
      expect(formatLimit(1000000)).toBe('1M');
      expect(formatLimit(5000000)).toBe('5M');
    });

    it('should format thousands', () => {
      expect(formatLimit(1000)).toBe('1K');
      expect(formatLimit(5000)).toBe('5K');
      expect(formatLimit(10000)).toBe('10K');
    });

    it('should return number as string for small values', () => {
      expect(formatLimit(500)).toBe('500');
      expect(formatLimit(0)).toBe('0');
      expect(formatLimit(1)).toBe('1');
      expect(formatLimit(999)).toBe('999');
    });
  });

  describe('formatPrice', () => {
    it('should format price without cents by default', () => {
      const result = formatPrice(8500);
      expect(result).toContain('8,500');
      expect(result).toContain('$');
    });

    it('should format price with cents when showCents is true', () => {
      const result = formatPrice(8500, true);
      expect(result).toContain('8,500');
      expect(result).toContain('$');
    });

    it('should handle zero amount', () => {
      const result = formatPrice(0);
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('should format small amounts', () => {
      const result = formatPrice(99);
      expect(result).toContain('$');
      expect(result).toContain('99');
    });
  });

  describe('Enums', () => {
    it('should have correct ComplianceStatus values', () => {
      expect(ComplianceStatus.COMPLIANT).toBe('Compliant');
      expect(ComplianceStatus.AT_RISK).toBe('At Risk');
      expect(ComplianceStatus.NON_COMPLIANT).toBe('Non-Compliant');
      expect(ComplianceStatus.IN_REVIEW).toBe('In Review');
    });

    it('should have correct FrameworkType values', () => {
      expect(FrameworkType.SOC2).toBe('SOC 2 Type II');
      expect(FrameworkType.GDPR).toBe('GDPR');
      expect(FrameworkType.HIPAA).toBe('HIPAA');
      expect(FrameworkType.ISO27001).toBe('ISO 27001');
      expect(FrameworkType.PCI_DSS).toBe('PCI DSS');
      expect(FrameworkType.CCPA).toBe('CCPA');
      expect(FrameworkType.NIST).toBe('NIST 800-53');
      expect(FrameworkType.EU_AI_ACT).toBe('EU AI Act');
      expect(FrameworkType.DMA).toBe('Digital Markets Act (DMA)');
      expect(FrameworkType.DSA).toBe('Digital Services Act (DSA)');
    });
  });
});
