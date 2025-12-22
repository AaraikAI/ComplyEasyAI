/**
 * Blockchain Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock dependencies
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

jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBlockNumber: jest.fn().mockResolvedValue(12345),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0x1234567890123456789012345678901234567890',
    })),
    Contract: jest.fn().mockImplementation(() => ({
      recordAuditLog: jest.fn().mockResolvedValue({
        hash: '0xabc123',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12345,
          hash: '0xtx123',
        }),
      }),
      recordCompliance: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12345,
          hash: '0xtx123',
          logs: [],
        }),
      }),
      issueComplianceCertificate: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12345,
          hash: '0xtx123',
          logs: [],
        }),
      }),
      verifyComplianceCertificate: jest.fn().mockResolvedValue([true, 'SOC2', Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60]),
      verifyAuditLog: jest.fn().mockResolvedValue([true, 12345, '0x123']),
      interface: {
        parseLog: jest.fn().mockReturnValue({
          name: 'CertificateIssued',
          args: {
            certId: '0x' + 'c'.repeat(64),
          },
        }),
      },
    })),
  },
}));

// Import after mocking
import blockchainService from '../../../../services/advanced/blockchainService';

describe('BlockchainService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.ETHEREUM_RPC_URL = 'https://test-rpc.com';
    process.env.POLYGON_RPC_URL = 'https://test-polygon-rpc.com';
    process.env.BLOCKCHAIN_PRIVATE_KEY = '0x' + '1'.repeat(64);
    process.env.COMPLIANCE_CONTRACT_ADDRESS = '0x' + '2'.repeat(40);
  });

  describe('initialize()', () => {
    it('should initialize blockchain providers successfully', async () => {
      await expect(blockchainService.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors gracefully', async () => {
      process.env.ETHEREUM_RPC_URL = 'invalid-url';
      // Should not throw, but log error
      await expect(blockchainService.initialize()).resolves.not.toThrow();
    });
  });

  describe('recordAuditLog()', () => {
    it('should record audit log on blockchain', async () => {
      await blockchainService.initialize();
      
      const result = await blockchainService.recordAuditLog(
        'org-123',
        'user_login',
        { userId: 'user-1' },
        'polygon'
      );

      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('recordType', 'audit_log');
      expect(result).toHaveProperty('dataHash');
      expect(result).toHaveProperty('transactionHash');
      expect(result).toHaveProperty('network', 'polygon');
    });

    it('should create correct data hash', async () => {
      await blockchainService.initialize();
      
      const result = await blockchainService.recordAuditLog(
        'org-123',
        'test_action',
        { test: 'data' },
        'polygon'
      );

      expect(result.dataHash).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  describe('verifyAuditLog()', () => {
    it('should verify audit log on blockchain', async () => {
      await blockchainService.initialize();
      
      const result = await blockchainService.verifyAuditLog('0xabc123', 'polygon');

      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('blockNumber');
    });
  });

  describe('recordComplianceProof()', () => {
    it('should record compliance proof on blockchain', async () => {
      await blockchainService.initialize();
      
      const proof = {
        organizationId: 'org-123',
        framework: 'SOC2',
        score: 95,
        evidenceHash: '0x' + 'e'.repeat(64),
        timestamp: new Date(),
      };

      const result = await blockchainService.recordComplianceProof(proof, 'polygon');

      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('framework', 'SOC2');
      expect(result).toHaveProperty('score', 95);
    });
  });

  describe('issueComplianceCertificate()', () => {
    it('should issue compliance certificate', async () => {
      await blockchainService.initialize();
      
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      
      const result = await blockchainService.issueComplianceCertificate(
        'org-123',
        'SOC2',
        validUntil,
        'polygon'
      );

      expect(result).toHaveProperty('certificateId');
      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('framework', 'SOC2');
    });
  });

  describe('verifyComplianceCertificate()', () => {
    it('should verify compliance certificate', async () => {
      await blockchainService.initialize();
      
      const result = await blockchainService.verifyComplianceCertificate('cert-123');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('framework');
    });
  });
});

