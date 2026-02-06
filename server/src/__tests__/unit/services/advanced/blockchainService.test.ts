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

const mockContractInstance = {
  recordAuditLog: jest.fn() as jest.Mock<any>,
  recordCompliance: jest.fn() as jest.Mock<any>,
  issueComplianceCertificate: jest.fn() as jest.Mock<any>,
  verifyComplianceCertificate: jest.fn() as jest.Mock<any>,
  verifyAuditLog: jest.fn() as jest.Mock<any>,
  interface: {
    parseLog: jest.fn() as jest.Mock<any>,
  },
};

const mockEthers = {
  JsonRpcProvider: jest.fn() as jest.Mock<any>,
  Wallet: jest.fn() as jest.Mock<any>,
  Contract: jest.fn() as jest.Mock<any>,
  keccak256: jest.fn() as jest.Mock<any>,
  toUtf8Bytes: jest.fn() as jest.Mock<any>,
};

jest.mock('ethers', () => ({
  ethers: mockEthers,
}));

// Mock Hyperledger dependencies
jest.mock('@hyperledger/fabric-gateway', () => ({
  connect: jest.fn(),
  Gateway: jest.fn(),
  Network: jest.fn(),
  Contract: jest.fn(),
}));

jest.mock('fabric-network', () => ({
  Wallets: {
    newFileSystemWallet: jest.fn(),
  },
}));

jest.mock('@grpc/grpc-js', () => ({
  credentials: {
    createSsl: jest.fn(),
  },
  Client: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Import after mocking
import blockchainService from '../../../../services/advanced/blockchainService';

function setupMocks() {
  // Re-establish ethers mocks
  mockEthers.JsonRpcProvider.mockImplementation(() => ({
    getBlockNumber: jest.fn<any>().mockResolvedValue(12345),
    getBlock: jest.fn<any>().mockResolvedValue({ timestamp: Math.floor(Date.now() / 1000) }),
  }));
  mockEthers.Wallet.mockImplementation(() => ({
    address: '0x1234567890123456789012345678901234567890',
  }));
  mockEthers.Contract.mockImplementation(() => mockContractInstance);
  mockEthers.keccak256.mockReturnValue('0x' + 'a'.repeat(64));
  mockEthers.toUtf8Bytes.mockReturnValue(new Uint8Array(32));

  // Re-establish contract mock implementations
  mockContractInstance.recordAuditLog.mockResolvedValue({
    hash: '0xabc123',
    wait: jest.fn<any>().mockResolvedValue({
      blockNumber: 12345,
      hash: '0xtx123',
    }),
  });
  mockContractInstance.recordCompliance.mockResolvedValue({
    wait: jest.fn<any>().mockResolvedValue({
      blockNumber: 12345,
      hash: '0xtx123',
      logs: [],
    }),
  });
  mockContractInstance.issueComplianceCertificate.mockResolvedValue({
    wait: jest.fn<any>().mockResolvedValue({
      blockNumber: 12345,
      hash: '0xtx123',
      logs: [],
    }),
  });
  mockContractInstance.verifyComplianceCertificate.mockResolvedValue(
    [true, 'SOC2', Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60]
  );
  mockContractInstance.verifyAuditLog.mockResolvedValue([true, 12345, '0x123']);
  mockContractInstance.interface.parseLog.mockReturnValue({
    name: 'CertificateIssued',
    args: {
      certId: '0x' + 'c'.repeat(64),
    },
  });

  // Hyperledger mocks
  const fabricNetwork = require('fabric-network');
  fabricNetwork.Wallets.newFileSystemWallet.mockResolvedValue({
    get: jest.fn<any>().mockResolvedValue(null),
  });

  // FS mocks
  const fs = require('fs');
  fs.readFileSync.mockReturnValue(Buffer.from('test'));
  fs.existsSync.mockReturnValue(false);
}

describe('BlockchainService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.ETHEREUM_RPC_URL = 'https://test-rpc.com';
    process.env.POLYGON_RPC_URL = 'https://test-polygon-rpc.com';
    process.env.BLOCKCHAIN_PRIVATE_KEY = '0x' + '1'.repeat(64);
    process.env.COMPLIANCE_CONTRACT_ADDRESS = '0x' + '2'.repeat(40);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

    setupMocks();
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

      expect(result).toHaveProperty('exists');
      if (result.exists) {
        expect(result).toHaveProperty('blockNumber');
      }
    });
  });

  describe('recordComplianceProof()', () => {
    it('should record compliance proof on blockchain', async () => {
      await blockchainService.initialize();

      const proof = {
        organizationId: 'org-123',
        framework: 'SOC2',
        score: 95,
        evidenceHash: 'e'.repeat(64),
        timestamp: new Date(),
      };

      const result = await blockchainService.recordComplianceProof(proof, 'polygon');

      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('recordType', 'compliance_proof');
      expect(result).toHaveProperty('transactionHash');
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
      expect(result).toHaveProperty('transactionHash');
      expect(result).toHaveProperty('blockNumber');
    });
  });

  describe('verifyComplianceCertificate()', () => {
    it('should verify compliance certificate', async () => {
      await blockchainService.initialize();

      const result = await blockchainService.verifyComplianceCertificate('cert-123');

      expect(result).toHaveProperty('valid');
      if (result.valid) {
        expect(result).toHaveProperty('framework');
      }
    });
  });
});
