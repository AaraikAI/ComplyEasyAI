/**
 * BYOK Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock AWS SDK
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  EncryptCommand: jest.fn(),
  DecryptCommand: jest.fn(),
  GenerateDataKeyCommand: jest.fn(),
  DescribeKeyCommand: jest.fn(),
}));

// Mock Azure SDK
jest.mock('@azure/keyvault-keys', () => ({
  KeyClient: jest.fn().mockImplementation(() => ({
    getKey: jest.fn().mockResolvedValue({ name: 'test-key' }),
    createKey: jest.fn().mockResolvedValue({ name: 'test-key' }),
  })),
  CryptographyClient: jest.fn().mockImplementation(() => ({
    encrypt: jest.fn().mockResolvedValue({ result: Buffer.from('encrypted') }),
    decrypt: jest.fn().mockResolvedValue({ result: Buffer.from('decrypted') }),
  })),
}));

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({})),
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
  });

  describe('generateDataKey()', () => {
    it('should generate data key using AWS KMS', async () => {
      const config = {
        provider: 'aws_kms' as const,
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
      };

      const result = await byokService.generateDataKey(config);

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

      const result = await byokService.generateDataKey(config);

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

      const encryptedPayload = {
        ciphertext: 'encrypted-data',
        encryptedDataKey: 'encrypted-key',
        iv: 'initialization-vector',
        authTag: 'auth-tag',
        provider: 'aws_kms' as const,
        keyId: config.keyId,
        algorithm: 'AES-256-GCM',
      };

      const result = await byokService.decryptData(encryptedPayload, config);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should decrypt data using Azure Key Vault', async () => {
      const config = {
        provider: 'azure_kv' as const,
        keyId: 'test-key',
        vaultUrl: 'https://test-vault.vault.azure.net/',
      };

      const encryptedPayload = {
        ciphertext: 'encrypted-data',
        encryptedDataKey: 'encrypted-key',
        iv: 'initialization-vector',
        authTag: 'auth-tag',
        provider: 'azure_kv' as const,
        keyId: config.keyId,
        algorithm: 'AES-256-GCM',
      };

      const result = await byokService.decryptData(encryptedPayload, config);

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

      const encryptedData = [{
        ciphertext: 'encrypted-data',
        encryptedDataKey: 'encrypted-key',
        iv: 'initialization-vector',
        authTag: 'auth-tag',
        provider: 'aws_kms' as const,
        keyId: oldConfig.keyId,
        algorithm: 'AES-256-GCM',
      }];

      const result = await byokService.rotateKey('org-123', oldConfig, newConfig, encryptedData);

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

