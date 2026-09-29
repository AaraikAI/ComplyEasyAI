import { describe, it, expect, beforeEach } from '@jest/globals';
import { redactPII, rehydratePII } from '../../../utils/piiRedaction';

describe('piiRedaction', () => {
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

    it('should redact IPv4 addresses but not local IPs', () => {
      const result = redactPII('Server at 8.8.8.8 is up');
      expect(result.redactedText).not.toContain('8.8.8.8');
      expect(result.redactedText).toContain('[IP_');
    });

    it('should NOT redact common local IPs (192.168.x)', () => {
      const result = redactPII('Local IP is 192.168.1.1');
      expect(result.redactedText).toContain('192.168.1.1');
    });

    it('should NOT redact 10.x local IPs', () => {
      const result = redactPII('Local IP is 10.0.0.1');
      expect(result.redactedText).toContain('10.0.0.1');
    });

    it('should NOT redact 127.x loopback IPs', () => {
      const result = redactPII('Localhost is 127.0.0.1');
      expect(result.redactedText).toContain('127.0.0.1');
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

    it('restores values literally, without interpreting $ replacement patterns', () => {
      const map = new Map([['[SECRET_1]', "a$&b$'c$1"]]);
      expect(rehydratePII('key=[SECRET_1];', map)).toBe("key=a$&b$'c$1;");
    });

    it('ignores an empty token', () => {
      expect(rehydratePII('abc', new Map([['', 'x']]))).toBe('abc');
    });
  });

  describe('email pattern performance', () => {
    it.each([
      ['a run of local-part characters', '%'.repeat(100000)],
      ['a run ending in @', '%'.repeat(100000) + '@'],
      ['an unterminated domain', 'a@' + 'a'.repeat(100000)],
    ])('stays linear on %s', (_label, input) => {
      const start = process.hrtime.bigint();
      redactPII(input);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      expect(elapsedMs).toBeLessThan(1000);
    });

    it('still redacts ordinary addresses', () => {
      const result = redactPII('Mail john.doe+tag@mail.example.co.uk or a%b@x.io');
      expect(result.redactedText).toBe('Mail [EMAIL_1] or [EMAIL_2]');
      expect(result.map.get('[EMAIL_1]')).toBe('john.doe+tag@mail.example.co.uk');
    });
  });
});
