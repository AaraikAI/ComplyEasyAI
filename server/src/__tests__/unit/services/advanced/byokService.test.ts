/**
 * BYOK Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

const mockSend = jest.fn<any>();
const mockCryptoEncrypt = jest.fn<any>();
const mockCryptoDecrypt = jest.fn<any>();
const mockGcpEncrypt = jest.fn<any>();
const mockGcpDecrypt = jest.fn<any>();
const mockGcpCryptoKeyPath = jest.fn<any>();

// Mock AWS SDK
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn(),
  EncryptCommand: jest.fn(),
  DecryptCommand: jest.fn(),
  GenerateDataKeyCommand: jest.fn(),
  DescribeKeyCommand: jest.fn(),
  CreateKeyCommand: jest.fn(),
  ScheduleKeyDeletionCommand: jest.fn(),
}));

// Mock Azure SDK
jest.mock('@azure/keyvault-keys', () => ({
  KeyClient: jest.fn(),
  CryptographyClient: jest.fn(),
}));

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn(),
}));

jest.mock('@google-cloud/kms', () => ({
  KeyManagementServiceClient: jest.fn(),
}));

jest.mock('../../../../utils/urlValidator', () => ({
  isUrlSafe: jest.fn(),
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

    // Re-establish all mock implementations after resetMocks
    const { KMSClient } = require('@aws-sdk/client-kms');
    KMSClient.mockImplementation(() => ({ send: mockSend }));

    const { KeyClient, CryptographyClient } = require('@azure/keyvault-keys');
    KeyClient.mockImplementation(() => ({
      getKey: jest.fn<any>().mockResolvedValue({
        name: 'test-key',
        properties: { enabled: true },
      }),
      createKey: jest.fn<any>().mockResolvedValue({ name: 'test-key' }),
    }));
    CryptographyClient.mockImplementation(() => ({
      encrypt: mockCryptoEncrypt,
      decrypt: mockCryptoDecrypt,
    }));

    const { DefaultAzureCredential } = require('@azure/identity');
    DefaultAzureCredential.mockImplementation(() => ({}));

    const { KeyManagementServiceClient } = require('@google-cloud/kms');
    KeyManagementServiceClient.mockImplementation(() => ({
      cryptoKeyPath: mockGcpCryptoKeyPath,
      encrypt: mockGcpEncrypt,
      decrypt: mockGcpDecrypt,
    }));

    const { isUrlSafe } = require('../../../../utils/urlValidator');
    isUrlSafe.mockReturnValue(true);

    // Set up mock return values
    mockSend.mockResolvedValue({
      Plaintext: Buffer.alloc(32),
      CiphertextBlob: Buffer.alloc(64),
      KeyMetadata: { Enabled: true },
    });
    mockCryptoEncrypt.mockResolvedValue({ result: Buffer.alloc(32) });
    mockCryptoDecrypt.mockResolvedValue({ result: Buffer.alloc(32) });
    mockGcpCryptoKeyPath.mockReturnValue('projects/test/locations/us/keyRings/kr/cryptoKeys/k');
    mockGcpEncrypt.mockResolvedValue([{ ciphertext: Buffer.alloc(32) }]);
    mockGcpDecrypt.mockResolvedValue([{ plaintext: Buffer.alloc(32) }]);

    // Mock prisma tables
    (prismaMock.keyUsage.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.keyUsage.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

    // Clear internal client caches by creating a fresh service
    // The singleton caches clients, so we need the mocks ready before first use
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

      const result = await byokService.decryptData(encrypted, config);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should decrypt data using Azure Key Vault', async () => {
      // Capture the DEK during encrypt so decrypt returns the same key
      let capturedDek: Buffer | null = null;
      mockCryptoEncrypt.mockImplementation(async (params: any) => {
        capturedDek = Buffer.from(params.plaintext);
        return { result: Buffer.alloc(32) };
      });
      mockCryptoDecrypt.mockImplementation(async () => {
        return { result: capturedDek || Buffer.alloc(32) };
      });

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
