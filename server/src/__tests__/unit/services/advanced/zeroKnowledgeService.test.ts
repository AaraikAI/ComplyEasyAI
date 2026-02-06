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
    fullProve: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      proof: {
        pi_a: ['1', '2'],
        pi_b: [['3', '4'], ['5', '6']],
        pi_c: ['7', '8'],
      },
      publicSignals: ['100', '200'],
    }),
    verify: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
  },
  plonk: {
    fullProve: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      proof: {
        A: '1',
        B: '2',
        C: '3',
      },
      publicSignals: ['100', '200'],
    }),
    verify: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
  },
}));

jest.mock('fs', () => ({
  existsSync: (jest.fn() as jest.Mock<any>).mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: (jest.fn() as jest.Mock<any>).mockReturnValue('circuit-data'),
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

    // Re-establish mock implementations (cleared by resetMocks)
    const snarkjs = require('snarkjs');
    snarkjs.groth16.fullProve.mockResolvedValue({
      proof: {
        pi_a: ['1', '2'],
        pi_b: [['3', '4'], ['5', '6']],
        pi_c: ['7', '8'],
      },
      publicSignals: ['100', '200'],
    });
    snarkjs.groth16.verify.mockResolvedValue(true);
    snarkjs.plonk.fullProve.mockResolvedValue({
      proof: {
        A: '1',
        B: '2',
        C: '3',
      },
      publicSignals: ['100', '200'],
    });
    snarkjs.plonk.verify.mockResolvedValue(true);

    const fsMock = require('fs');
    fsMock.existsSync.mockReturnValue(true);
    fsMock.mkdirSync.mockImplementation(() => {});
    fsMock.readFileSync.mockReturnValue('circuit-data');
    fsMock.writeFileSync.mockImplementation(() => {});
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

      const result = await zeroKnowledgeService.verifyComplianceProof(proof);

      expect(result).toHaveProperty('isValid');
    });
  });

  describe('generateOwnershipProof()', () => {
    it('should generate ownership proof', async () => {
      const dataHash = '0x' + 'b'.repeat(64);
      const privateKey = 'test-private-key-123';

      const result = await zeroKnowledgeService.generateOwnershipProof(
        'user-123',
        dataHash,
        privateKey
      );

      expect(result).toHaveProperty('proof');
      expect(result).toHaveProperty('publicSignals');
    });
  });

  describe('generateCredentialProof()', () => {
    it('should generate credential proof', async () => {
      const credentialData = {
        role: 'admin',
        permissions: ['read', 'write'],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
      const secret = 'test-secret-key';

      const result = await zeroKnowledgeService.generateCredentialProof(
        credentialData,
        secret
      );

      expect(result).toHaveProperty('proof');
      expect(result).toHaveProperty('publicSignals');
    });
  });

  describe('verifyOwnershipProof()', () => {
    it('should verify ownership proof', async () => {
      const proof = {
        proof: {
          pi_a: ['1', '2'],
          pi_b: [['3', '4'], ['5', '6']],
          pi_c: ['7', '8'],
        },
        publicSignals: ['100', '200'],
      };

      const result = await zeroKnowledgeService.verifyOwnershipProof(
        proof,
        'user-123'
      );

      expect(typeof result).toBe('boolean');
    });
  });
});

