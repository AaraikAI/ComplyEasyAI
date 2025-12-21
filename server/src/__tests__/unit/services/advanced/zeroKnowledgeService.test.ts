/**
 * Zero-Knowledge Proof Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Mock snarkjs
jest.mock('snarkjs', () => ({
  groth16: {
    fullProve: jest.fn().mockResolvedValue({
      proof: {
        pi_a: ['1', '2'],
        pi_b: [['3', '4'], ['5', '6']],
        pi_c: ['7', '8'],
      },
      publicSignals: ['100', '200'],
    }),
    verify: jest.fn().mockResolvedValue(true),
  },
  plonk: {
    fullProve: jest.fn().mockResolvedValue({
      proof: {
        A: '1',
        B: '2',
        C: '3',
      },
      publicSignals: ['100', '200'],
    }),
    verify: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('circuit-data'),
  writeFileSync: jest.fn(),
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import zeroKnowledgeService from '../../../../services/advanced/zeroKnowledgeService';

describe('ZeroKnowledgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateComplianceProof()', () => {
    it('should generate compliance proof', async () => {
      const privateData = {
        controlsImplemented: 80,
        totalControls: 100,
        evidenceHash: '0x' + 'a'.repeat(64),
      };

      const result = await zeroKnowledgeService.generateComplianceProof(
        'org-123',
        'framework-1',
        privateData
      );

      expect(result).toHaveProperty('proof');
      expect(result).toHaveProperty('publicSignals');
      expect(Array.isArray(result.publicSignals)).toBe(true);
    });

    it('should handle insufficient compliance threshold', async () => {
      const privateData = {
        controlsImplemented: 50, // Below 80% threshold
        totalControls: 100,
        evidenceHash: '0x' + 'a'.repeat(64),
      };

      // Should still generate proof, but verification may fail
      const result = await zeroKnowledgeService.generateComplianceProof(
        'org-123',
        'framework-1',
        privateData
      );

      expect(result).toHaveProperty('proof');
    });
  });

  describe('verifyComplianceProof()', () => {
    it('should verify compliance proof', async () => {
      const proof = {
        proof: {
          pi_a: ['1', '2'],
          pi_b: [['3', '4'], ['5', '6']],
          pi_c: ['7', '8'],
        },
        publicSignals: ['100', '200'],
      };

      const result = await zeroKnowledgeService.verifyComplianceProof(
        proof,
        'org-123',
        'framework-1'
      );

      expect(result).toHaveProperty('isValid');
    });
  });

  describe('generateOwnershipProof()', () => {
    it('should generate ownership proof', async () => {
      const ownershipData = {
        dataHash: '0x' + 'b'.repeat(64),
        ownerId: 'user-123',
        timestamp: Date.now(),
      };

      const result = await zeroKnowledgeService.generateOwnershipProof(
        ownershipData
      );

      expect(result).toHaveProperty('proof');
      expect(result).toHaveProperty('publicSignals');
    });
  });

  describe('generateCredentialProof()', () => {
    it('should generate credential proof', async () => {
      const credentialData = {
        credentialHash: '0x' + 'c'.repeat(64),
        issuerId: 'issuer-123',
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      const result = await zeroKnowledgeService.generateCredentialProof(
        credentialData
      );

      expect(result).toHaveProperty('proof');
      expect(result).toHaveProperty('publicSignals');
    });
  });

  describe('verifyProof()', () => {
    it('should verify generic proof', async () => {
      const proof = {
        proof: {
          pi_a: ['1', '2'],
          pi_b: [['3', '4'], ['5', '6']],
          pi_c: ['7', '8'],
        },
        publicSignals: ['100', '200'],
      };

      const result = await zeroKnowledgeService.verifyProof(
        proof,
        'compliance_check'
      );

      expect(result).toBe(true);
    });
  });
});

