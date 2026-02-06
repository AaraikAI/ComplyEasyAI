import { describe, it, expect } from 'vitest';
import { redactPII, rehydratePII } from '../piiService';

describe('piiService', () => {
  describe('redactPII', () => {
    it('should redact email addresses', () => {
      const result = redactPII('Contact us at test@example.com for help');
      expect(result.redactedText).not.toContain('test@example.com');
      expect(result.redactedText).toContain('[EMAIL_1]');
      expect(result.map.get('[EMAIL_1]')).toBe('test@example.com');
    });

    it('should redact multiple different emails', () => {
      const result = redactPII('From alice@test.com to bob@test.com');
      expect(result.redactedText).not.toContain('alice@test.com');
      expect(result.redactedText).not.toContain('bob@test.com');
      expect(result.map.size).toBe(2);
    });

    it('should assign same token to duplicate PII', () => {
      const result = redactPII('Email test@a.com and again test@a.com');
      const tokens = result.redactedText.match(/\[EMAIL_\d+\]/g) || [];
      expect(tokens[0]).toBe(tokens[1]);
      expect(result.map.size).toBe(1);
    });

    it('should redact phone numbers', () => {
      const result = redactPII('Call (555) 123-4567 now');
      expect(result.redactedText).not.toContain('(555) 123-4567');
      expect(result.redactedText).toContain('[PHONE_');
    });

    it('should redact phone with country code', () => {
      const result = redactPII('Call +1 555-123-4567');
      expect(result.redactedText).not.toContain('555-123-4567');
    });

    it('should redact SSN', () => {
      const result = redactPII('SSN is 123-45-6789');
      expect(result.redactedText).not.toContain('123-45-6789');
      expect(result.redactedText).toContain('[SSN_');
    });

    it('should redact credit card numbers', () => {
      const result = redactPII('Card: 4111 1111 1111 1111');
      expect(result.redactedText).not.toContain('4111 1111 1111 1111');
      expect(result.redactedText).toContain('[CC_');
    });

    it('should redact credit card with dashes', () => {
      const result = redactPII('Card: 4111-1111-1111-1111');
      expect(result.redactedText).not.toContain('4111-1111-1111-1111');
    });

    it('should redact IPv4 addresses', () => {
      const result = redactPII('Server at 8.8.8.8 is up');
      expect(result.redactedText).not.toContain('8.8.8.8');
      expect(result.redactedText).toContain('[IP_');
    });

    it('should handle multiple PII types in same text', () => {
      const text = 'User test@test.com called (555) 123-4567 from 8.8.8.8';
      const result = redactPII(text);
      expect(result.redactedText).not.toContain('test@test.com');
      expect(result.redactedText).not.toContain('8.8.8.8');
      expect(result.map.size).toBeGreaterThanOrEqual(2);
    });

    it('should return unchanged text when no PII found', () => {
      const text = 'This is safe text with no PII';
      const result = redactPII(text);
      expect(result.redactedText).toBe(text);
      expect(result.map.size).toBe(0);
    });

    it('should handle empty string', () => {
      const result = redactPII('');
      expect(result.redactedText).toBe('');
      expect(result.map.size).toBe(0);
    });
  });

  describe('rehydratePII', () => {
    it('should restore redacted PII to original text', () => {
      const original = 'Contact test@example.com for help';
      const { redactedText, map } = redactPII(original);
      const restored = rehydratePII(redactedText, map);
      expect(restored).toBe(original);
    });

    it('should restore multiple PII types', () => {
      const original = 'User test@test.com at 8.8.8.8';
      const { redactedText, map } = redactPII(original);
      const restored = rehydratePII(redactedText, map);
      expect(restored).toBe(original);
    });

    it('should handle empty map', () => {
      const text = 'No PII here';
      const map = new Map<string, string>();
      expect(rehydratePII(text, map)).toBe(text);
    });

    it('should restore duplicate PII occurrences', () => {
      const original = 'From test@a.com to test@a.com';
      const { redactedText, map } = redactPII(original);
      const restored = rehydratePII(redactedText, map);
      expect(restored).toBe(original);
    });
  });
});
