/**
 * BYOK Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

const mockSend = jest.fn<any>();

// Mock AWS SDK
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  EncryptCommand: jest.fn(),
  DecryptCommand: jest.fn(),
  GenerateDataKeyCommand: jest.fn(),
  DescribeKeyCommand: jest.fn(),
  CreateKeyCommand: jest.fn(),
  ScheduleKeyDeletionCommand: jest.fn(),
}));

// Mock Azure SDK
jest.mock('@azure/keyvault-keys', () => ({
  KeyClient: (jest.fn() as jest.Mock<any>).mockImplementation(() => ({
    getKey: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      name: 'test-key',
      properties: { enabled: true },
    }),
    createKey: (jest.fn() as jest.Mock<any>).mockResolvedValue({ name: 'test-key' }),
  })),
  CryptographyClient: (jest.fn() as jest.Mock<any>).mockImplementation(() => ({
    encrypt: (jest.fn() as jest.Mock<any>).mockResolvedValue({ result: Buffer.alloc(32) }),
    decrypt: (jest.fn() as jest.Mock<any>).mockResolvedValue({ result: Buffer.alloc(32) }),
  })),
}));

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@google-cloud/kms', () => ({
  KeyManagementServiceClient: jest.fn().mockImplementation(() => ({
    cryptoKeyPath: jest.fn().mockReturnValue('projects/test/locations/us/keyRings/kr/cryptoKeys/k'),
    encrypt: (jest.fn() as jest.Mock<any>).mockResolvedValue([{ ciphertext: Buffer.alloc(32) }]),
    decrypt: (jest.fn() as jest.Mock<any>).mockResolvedValue([{ plaintext: Buffer.alloc(32) }]),
  })),
}));

jest.mock('../../../../utils/urlValidator', () => ({
  isUrlSafe: jest.fn().mockReturnValue(true),
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

import byokService from '../../../../services/advanced/byokService';

describe('BYOKService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock keyUsage for trackKeyUsage
    (prismaMock as any).keyUsage = {
      create: jest.fn<any>().mockResolvedValue({}),
      findMany: jest.fn<any>().mockResolvedValue([]),
    };
    // Mock encryptionMetadata for storeEncryptionMetadata
    (prismaMock as any).encryptionMetadata = {
      upsert: jest.fn<any>().mockResolvedValue({}),
      create: jest.fn<any>().mockResolvedValue({}),
    };
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    // Default AWS KMS send mock for generateDataKey
    mockSend.mockResolvedValue({
      Plaintext: Buffer.alloc(32),
      CiphertextBlob: Buffer.alloc(64),
      KeyMetadata: { Enabled: true },
    });
  });

  describe('generateDataKey()', () => {
    it('should generate data key using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.generateDataKey(config, 'org-123');

      expect(result).toHaveProperty('plaintext');
      expect(result).toHaveProperty('encrypted');
      expect(Buffer.isBuffer(result.plaintext)).toBe(true);
    });

    it('should generate data key using Azure Key Vault', async () => {
      const config = {
        provider: 'azure_kv' as const,
        keyId: 'test-key',
        vaultUrl: 'https://test-vault.vault.azure.net/',
      };

      const result = await byokService.generateDataKey(config, 'org-123');

      expect(result).toHaveProperty('plaintext');
      expect(result).toHaveProperty('encrypted');
    });
  });

  describe('encryptData()', () => {
    it('should encrypt data using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const plaintext = Buffer.from('sensitive data');

      const result = await byokService.encryptData(plaintext, config, 'org-123');

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('encryptedDataKey');
      expect(result).toHaveProperty('provider', 'aws_kms');
      expect(result).toHaveProperty('keyId');
    });

    it('should encrypt data using Azure Key Vault', async () => {
      const config = {
        provider: 'azure_kv' as const,
        keyId: 'test-key',
        vaultUrl: 'https://test-vault.vault.azure.net/',
      };

      const plaintext = Buffer.from('sensitive data');

      const result = await byokService.encryptData(plaintext, config, 'org-123');

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('provider', 'azure_kv');
    });
  });

  describe('decryptData()', () => {
    it('should decrypt data using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      // First encrypt some data to get valid encrypted payload
      const plaintext = Buffer.from('sensitive data');
      const encrypted = await byokService.encryptData(plaintext, config, 'org-123');

      // Mock the DecryptCommand response to return the same key
      mockSend.mockResolvedValueOnce({
        Plaintext: Buffer.alloc(32), // same 32-byte key
      });

      const result = await byokService.decryptData(encrypted, config);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should decrypt data using Azure Key Vault', async () => {
      const config = {
        provider: 'azure_kv' as const,
        keyId: 'test-key',
        vaultUrl: 'https://test-vault.vault.azure.net/',
      };

      // First encrypt some data to get valid encrypted payload
      const plaintext = Buffer.from('sensitive data');
      const encrypted = await byokService.encryptData(plaintext, config, 'org-123');

      const result = await byokService.decryptData(encrypted, config);

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('rotateKey()', () => {
    it('should rotate encryption key', async () => {
      const oldConfig = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const newConfig = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/new-key-id',
        region: 'us-east-1',
      };

      // First encrypt some data
      const plaintext = Buffer.from('sensitive data');
      const encrypted = await byokService.encryptData(plaintext, oldConfig, 'org-123');

      const result = await byokService.rotateKey('org-123', oldConfig, newConfig, [encrypted]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('keyId', newConfig.keyId);
    });
  });

  describe('verifyKeyAccess()', () => {
    it('should verify key access for AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.verifyKeyAccess(config);

      expect(typeof result).toBe('boolean');
    });
  });
});
