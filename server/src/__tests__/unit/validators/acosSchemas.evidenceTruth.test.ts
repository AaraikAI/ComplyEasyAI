/**
 * Joi schema unit tests for /api/acos/evidence/* additions.
 */

import { describe, it, expect } from '@jest/globals';
import {
  evidenceIdParamSchema,
  analyzeAndAnchorSchema,
  verifyFileHashSchema,
  verifyEvidenceSignatureSchema,
  multiPartyAttestationSchema,
} from '../../../validators/acosSchemas';

describe('Evidence Truth Joi schemas', () => {
  describe('evidenceIdParamSchema', () => {
    it('accepts a normal evidence id', () => {
      const { error } = evidenceIdParamSchema.validate({ evidenceId: 'ev-123' });
      expect(error).toBeUndefined();
    });
    it('rejects an empty evidenceId', () => {
      const { error } = evidenceIdParamSchema.validate({ evidenceId: '' });
      expect(error).toBeDefined();
    });
    it('rejects unknown keys', () => {
      const { error } = evidenceIdParamSchema.validate({ evidenceId: 'ev', sneaky: 'x' });
      expect(error).toBeDefined();
    });
  });

  describe('analyzeAndAnchorSchema', () => {
    it('applies defaults for network and skipBlockchain', () => {
      const { error, value } = analyzeAndAnchorSchema.validate({});
      expect(error).toBeUndefined();
      expect(value.network).toBe('polygon');
      expect(value.skipBlockchain).toBe(false);
    });
    it('coerces skipBlockchain from string (multipart)', () => {
      const { error, value } = analyzeAndAnchorSchema.validate({ skipBlockchain: 'true' });
      expect(error).toBeUndefined();
      expect(value.skipBlockchain).toBe(true);
    });
    it('rejects unknown networks', () => {
      const { error } = analyzeAndAnchorSchema.validate({ network: 'bitcoin' });
      expect(error).toBeDefined();
    });
  });

  describe('verifyFileHashSchema', () => {
    it('accepts a 64-char hex hash', () => {
      const hash = 'a'.repeat(64);
      const { error } = verifyFileHashSchema.validate({ storedHash: hash });
      expect(error).toBeUndefined();
    });
    it('rejects a non-hex hash', () => {
      const { error } = verifyFileHashSchema.validate({ storedHash: 'z'.repeat(64) });
      expect(error).toBeDefined();
    });
    it('rejects a hash of the wrong length', () => {
      const { error } = verifyFileHashSchema.validate({ storedHash: 'ab' });
      expect(error).toBeDefined();
    });
  });

  describe('verifyEvidenceSignatureSchema', () => {
    it('accepts a signature + publicKey pair', () => {
      const { error } = verifyEvidenceSignatureSchema.validate({ signature: 'sig', publicKey: 'pk' });
      expect(error).toBeUndefined();
    });
    it('rejects missing publicKey', () => {
      const { error } = verifyEvidenceSignatureSchema.validate({ signature: 'sig' });
      expect(error).toBeDefined();
    });
  });

  describe('multiPartyAttestationSchema', () => {
    it('accepts at least two parties', () => {
      const { error } = multiPartyAttestationSchema.validate({
        parties: [
          { userId: 'u1', role: 'cfo' },
          { userId: 'u2', role: 'cto' },
        ],
      });
      expect(error).toBeUndefined();
    });
    it('rejects a single-party array (must be >= 2)', () => {
      const { error } = multiPartyAttestationSchema.validate({ parties: [{ userId: 'u1', role: 'r' }] });
      expect(error).toBeDefined();
    });
    it('rejects a party missing role', () => {
      const { error } = multiPartyAttestationSchema.validate({
        parties: [{ userId: 'u1' }, { userId: 'u2', role: 'r' }],
      });
      expect(error).toBeDefined();
    });
    it('rejects > 20 parties', () => {
      const parties = Array.from({ length: 21 }).map((_, i) => ({ userId: `u${i}`, role: 'r' }));
      const { error } = multiPartyAttestationSchema.validate({ parties });
      expect(error).toBeDefined();
    });
  });
});
