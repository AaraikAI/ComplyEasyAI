/**
 * BYOK Service Unit Tests - Comprehensive Coverage
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

const mockSend = jest.fn<any>();
const mockCryptoEncrypt = jest.fn<any>();
const mockCryptoDecrypt = jest.fn<any>();
const mockGcpEncrypt = jest.fn<any>();
const mockGcpDecrypt = jest.fn<any>();
const mockGcpCryptoKeyPath = jest.fn<any>();

jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn(),
  EncryptCommand: jest.fn(),
  DecryptCommand: jest.fn(),
  GenerateDataKeyCommand: jest.fn(),
  DescribeKeyCommand: jest.fn(),
  CreateKeyCommand: jest.fn(),
  ScheduleKeyDeletionCommand: jest.fn(),
}));

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
    debug: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import byokService from '../../../../services/advanced/byokService';

describe('BYOKService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();

    const { KMSClient } = require('@aws-sdk/client-kms');
    KMSClient.mockImplementation(() => ({ send: mockSend }));

    const { KeyClient, CryptographyClient } = require('@azure/keyvault-keys');
    KeyClient.mockImplementation(() => ({
      getKey: jest.fn<any>().mockResolvedValue({ name: 'test-key', properties: { enabled: true } }),
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

    (prismaMock.keyUsage.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.keyUsage.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.keyUsage.count as jest.Mock<any>).mockResolvedValue(0);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.encryptionMetadata.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.encryptionMetadata.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.encryptionMetadata.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.keyRotationPolicy.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.keyRotationPolicy.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.keyRotationPolicy.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.keyRotationPolicy.update as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.keyRotationPolicy.upsert as jest.Mock<any>).mockResolvedValue({});
  });

  // ===================== generateDataKey =====================
  describe('generateDataKey', () => {
    it('should generate data key using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.generateDataKey(config, orgId);
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

      const result = await byokService.generateDataKey(config, orgId);
      expect(result).toHaveProperty('plaintext');
      expect(result).toHaveProperty('encrypted');
    });

    it('should generate data key using GCP KMS', async () => {
      const config = {
        provider: 'gcp_kms' as const,
        keyId: 'test-key',
        keyRing: 'kr',
        location: 'us',
        credentials: { projectId: 'test' },
      };

      const result = await byokService.generateDataKey(config, orgId);
      expect(result).toHaveProperty('plaintext');
      expect(result).toHaveProperty('encrypted');
    });

    it('should throw for unsupported provider', async () => {
      const config = { provider: 'unsupported' as any, keyId: 'test' };

      await expect(byokService.generateDataKey(config, orgId)).rejects.toThrow();
    });
  });

  // ===================== encryptData =====================
  describe('encryptData', () => {
    it('should encrypt data using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.encryptData(Buffer.from('sensitive data'), config, orgId);
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('encryptedDataKey');
      expect(result).toHaveProperty('provider', 'aws_kms');
    });

    it('should encrypt data using Azure Key Vault', async () => {
      const config = {
        provider: 'azure_kv' as const,
        keyId: 'test-key',
        vaultUrl: 'https://test-vault.vault.azure.net/',
      };

      const result = await byokService.encryptData(Buffer.from('sensitive data'), config, orgId);
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('provider', 'azure_kv');
    });

    it('should encrypt data using GCP KMS', async () => {
      const config = {
        provider: 'gcp_kms' as const,
        keyId: 'test-key',
        keyRing: 'kr',
        location: 'us',
        credentials: { projectId: 'test' },
      };

      const result = await byokService.encryptData(Buffer.from('sensitive data'), config, orgId);
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('provider', 'gcp_kms');
    });

    it('should encrypt string data', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.encryptData('string data', config, orgId);
      expect(result).toHaveProperty('ciphertext');
    });
  });

  // ===================== decryptData =====================
  describe('decryptData', () => {
    it('should decrypt data using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const encrypted = await byokService.encryptData(Buffer.from('sensitive data'), config, orgId);
      const result = await byokService.decryptData(encrypted, config);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should decrypt data using Azure Key Vault', async () => {
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

      const encrypted = await byokService.encryptData(Buffer.from('sensitive data'), config, orgId);
      const result = await byokService.decryptData(encrypted, config);
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  // ===================== rotateKey =====================
  describe('rotateKey', () => {
    it('should rotate encryption key', async () => {
      const oldConfig = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/old-key-id',
        region: 'us-east-1',
      };

      const newConfig = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/new-key-id',
        region: 'us-east-1',
      };

      const encrypted = await byokService.encryptData(Buffer.from('sensitive data'), oldConfig, orgId);
      const result = await byokService.rotateKey(orgId, oldConfig, newConfig, [encrypted]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('keyId', newConfig.keyId);
    });

    it('should handle empty encrypted items array', async () => {
      const oldConfig = { provider: 'aws_kms' as const, keyId: 'old-key', region: 'us-east-1' };
      const newConfig = { provider: 'aws_kms' as const, keyId: 'new-key', region: 'us-east-1' };

      const result = await byokService.rotateKey(orgId, oldConfig, newConfig, []);
      expect(result).toEqual([]);
    });
  });

  // ===================== verifyKeyAccess =====================
  describe('verifyKeyAccess', () => {
    it('should verify key access for AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.verifyKeyAccess(config);
      expect(typeof result).toBe('boolean');
    });

    it('should verify key access for Azure', async () => {
      const config = {
        provider: 'azure_kv' as const,
        keyId: 'test-key',
        vaultUrl: 'https://test-vault.vault.azure.net/',
      };

      const result = await byokService.verifyKeyAccess(config);
      expect(typeof result).toBe('boolean');
    });

    it('should verify key access for GCP', async () => {
      const config = {
        provider: 'gcp_kms' as const,
        keyId: 'projects/test/locations/us/keyRings/kr/cryptoKeys/k',
      };

      const result = await byokService.verifyKeyAccess(config);
      expect(typeof result).toBe('boolean');
    });

    it('should return false when AWS key is disabled', async () => {
      mockSend.mockResolvedValueOnce({ KeyMetadata: { Enabled: false } });

      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123:key/disabled-key',
        region: 'us-east-1',
      };

      const result = await byokService.verifyKeyAccess(config);
      expect(result).toBe(false);
    });

    it('should return false when AWS KMS throws', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access denied'));

      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123:key/no-access',
        region: 'us-east-1',
      };

      const result = await byokService.verifyKeyAccess(config);
      expect(result).toBe(false);
    });
  });

  // ===================== getKeyUsageStats =====================
  describe('getKeyUsageStats', () => {
    it('should return key usage statistics', async () => {
      (prismaMock.keyUsage.findMany as jest.Mock<any>).mockResolvedValue([
        { operation: 'encrypt', provider: 'aws_kms', createdAt: new Date() },
        { operation: 'decrypt', provider: 'aws_kms', createdAt: new Date() },
      ]);

      const result = await byokService.getKeyUsageStats(orgId, 'test-key-id');
      expect(result).toBeDefined();
    });

    it('should return empty stats when no usage', async () => {
      (prismaMock.keyUsage.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await byokService.getKeyUsageStats(orgId, 'test-key-id');
      expect(result).toBeDefined();
    });

    it('should handle stats with date range', async () => {
      (prismaMock.keyUsage.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await byokService.getKeyUsageStats(orgId, 'test-key-id', new Date('2025-01-01'), new Date());
      expect(result).toBeDefined();
    });
  });

  // ===================== setKeyRotationPolicy =====================
  describe('setKeyRotationPolicy', () => {
    it('should set key rotation policy', async () => {
      await byokService.setKeyRotationPolicy(orgId, 'arn:aws:kms:us-east-1:123:key/test-key', 'aws_kms', {
        keyId: 'arn:aws:kms:us-east-1:123:key/test-key',
        rotationIntervalDays: 90,
        autoRotate: true,
        notifyDaysBefore: 7,
        nextRotation: new Date(Date.now() + 90 * 86400000),
      });

      expect(prismaMock.keyRotationPolicy.upsert).toHaveBeenCalled();
    });

    it('should update existing rotation policy', async () => {
      await byokService.setKeyRotationPolicy(orgId, 'test-key', 'aws_kms', {
        keyId: 'test-key',
        rotationIntervalDays: 60,
        autoRotate: false,
        notifyDaysBefore: 7,
        nextRotation: new Date(Date.now() + 60 * 86400000),
      });

      expect(prismaMock.keyRotationPolicy.upsert).toHaveBeenCalled();
    });
  });

  // ===================== checkAndRotateKeys =====================
  describe('checkAndRotateKeys', () => {
    it('should check and rotate keys needing rotation', async () => {
      (prismaMock.keyRotationPolicy.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await byokService.checkAndRotateKeys(orgId);
      expect(typeof result).toBe('number');
    });

    it('should handle no policies', async () => {
      (prismaMock.keyRotationPolicy.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await byokService.checkAndRotateKeys();
      expect(result).toBe(0);
    });
  });

  // ===================== scheduleKeyDeletion =====================
  describe('scheduleKeyDeletion', () => {
    it('should schedule AWS key deletion', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123:key/to-delete',
        region: 'us-east-1',
      };

      await byokService.scheduleKeyDeletion(config, 30);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle deletion scheduling error', async () => {
      mockSend.mockRejectedValueOnce(new Error('Deletion failed'));

      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123:key/fail-delete',
        region: 'us-east-1',
      };

      await expect(byokService.scheduleKeyDeletion(config, 30)).rejects.toThrow();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle AWS KMS encrypt error', async () => {
      mockSend.mockRejectedValueOnce(new Error('KMS error')).mockRejectedValueOnce(new Error('KMS error'));

      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123:key/error-key',
        region: 'us-east-1',
      };

      await expect(
        byokService.encryptData(Buffer.from('data'), config, orgId)
      ).rejects.toThrow();
    });

    it('should handle Azure Key Vault encrypt error', async () => {
      mockCryptoEncrypt.mockRejectedValue(new Error('Azure error'));

      const config = {
        provider: 'azure_kv' as const,
        keyId: 'error-key',
        vaultUrl: 'https://test.vault.azure.net/',
      };

      await expect(
        byokService.encryptData(Buffer.from('data'), config, orgId)
      ).rejects.toThrow();
    });
  });
});
