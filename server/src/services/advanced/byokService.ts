/**
 * Bring Your Own Key (BYOK) Encryption Service
 * Allows customers to use their own encryption keys from AWS KMS or Azure Key Vault
 * Provides client-side encryption with customer-managed keys
 */

import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
  DescribeKeyCommand,
  CreateKeyCommand,
  ScheduleKeyDeletionCommand,
} from '@aws-sdk/client-kms';
import {
  KeyClient,
  CryptographyClient,
} from '@azure/keyvault-keys';
import { DefaultAzureCredential } from '@azure/identity';
import crypto from 'crypto';
import logger from '../config/logger';
import prisma from '../config/database';

type KeyProvider = 'aws_kms' | 'azure_kv' | 'local';

interface BYOKConfig {
  provider: KeyProvider;
  keyId: string;
  region?: string; // AWS region
  vaultUrl?: string; // Azure Key Vault URL
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

interface EncryptedPayload {
  ciphertext: string;
  encryptedDataKey: string;
  iv: string;
  authTag: string;
  provider: KeyProvider;
  keyId: string;
  algorithm: string;
}

interface DataKey {
  plaintext: Buffer;
  encrypted: string;
}

/**
 * BYOK Service for customer-managed encryption
 *
 * Features:
 * 1. AWS KMS integration for key management
 * 2. Azure Key Vault integration
 * 3. Envelope encryption (encrypt data with DEK, encrypt DEK with master key)
 * 4. Client-side encryption before data leaves customer environment
 * 5. Key rotation support
 */
class BYOKService {
  private kmsClients: Map<string, KMSClient> = new Map();
  private azureKeyClients: Map<string, KeyClient> = new Map();

  /**
   * Initialize AWS KMS client
   */
  private getKMSClient(region: string, credentials?: any): KMSClient {
    const key = `${region}-${credentials?.accessKeyId || 'default'}`;

    if (!this.kmsClients.has(key)) {
      const client = new KMSClient({
        region,
        credentials: credentials || undefined,
      });
      this.kmsClients.set(key, client);
    }

    return this.kmsClients.get(key)!;
  }

  /**
   * Initialize Azure Key Vault client
   */
  private getAzureKeyClient(vaultUrl: string): KeyClient {
    if (!this.azureKeyClients.has(vaultUrl)) {
      const credential = new DefaultAzureCredential();
      const client = new KeyClient(vaultUrl, credential);
      this.azureKeyClients.set(vaultUrl, client);
    }

    return this.azureKeyClients.get(vaultUrl)!;
  }

  /**
   * Generate data encryption key (DEK) using customer's master key
   * Implements envelope encryption pattern
   */
  async generateDataKey(config: BYOKConfig): Promise<DataKey> {
    try {
      if (config.provider === 'aws_kms') {
        return await this.generateDataKeyAWS(config);
      } else if (config.provider === 'azure_kv') {
        return await this.generateDataKeyAzure(config);
      } else {
        // Local key generation (for testing)
        return this.generateDataKeyLocal();
      }
    } catch (error) {
      logger.error('Error generating data key', error);
      throw new Error('Failed to generate data encryption key');
    }
  }

  /**
   * Generate DEK using AWS KMS
   */
  private async generateDataKeyAWS(config: BYOKConfig): Promise<DataKey> {
    try {
      const client = this.getKMSClient(
        config.region || process.env.AWS_REGION || 'us-east-1',
        config.credentials
      );

      const command = new GenerateDataKeyCommand({
        KeyId: config.keyId,
        KeySpec: 'AES_256',
      });

      const response = await client.send(command);

      if (!response.Plaintext || !response.CiphertextBlob) {
        throw new Error('KMS did not return data key');
      }

      logger.info(`Generated data key using AWS KMS: ${config.keyId}`);

      return {
        plaintext: Buffer.from(response.Plaintext),
        encrypted: Buffer.from(response.CiphertextBlob).toString('base64'),
      };
    } catch (error) {
      logger.error('Error generating AWS KMS data key', error);
      throw new Error('AWS KMS data key generation failed');
    }
  }

  /**
   * Generate DEK using Azure Key Vault
   */
  private async generateDataKeyAzure(config: BYOKConfig): Promise<DataKey> {
    try {
      if (!config.vaultUrl) {
        throw new Error('Azure Key Vault URL is required');
      }

      const keyClient = this.getAzureKeyClient(config.vaultUrl);

      // Generate random DEK
      const dek = crypto.randomBytes(32);

      // Encrypt DEK with Azure Key Vault key
      const cryptoClient = new CryptographyClient(
        config.keyId,
        new DefaultAzureCredential()
      );

      const encryptResult = await cryptoClient.encrypt({
        algorithm: 'RSA-OAEP-256',
        plaintext: dek,
      });

      logger.info(`Generated data key using Azure Key Vault: ${config.keyId}`);

      return {
        plaintext: dek,
        encrypted: Buffer.from(encryptResult.result).toString('base64'),
      };
    } catch (error) {
      logger.error('Error generating Azure Key Vault data key', error);
      throw new Error('Azure Key Vault data key generation failed');
    }
  }

  /**
   * Generate local DEK (for testing)
   */
  private generateDataKeyLocal(): DataKey {
    const dek = crypto.randomBytes(32);
    return {
      plaintext: dek,
      encrypted: dek.toString('base64'), // In production, encrypt with local master key
    };
  }

  /**
   * Encrypt data using customer's key (envelope encryption)
   */
  async encryptData(
    data: Buffer | string,
    config: BYOKConfig,
    organizationId: string
  ): Promise<EncryptedPayload> {
    try {
      // Generate data encryption key
      const dataKey = await this.generateDataKey(config);

      // Encrypt data with DEK using AES-256-GCM
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', dataKey.plaintext, iv);

      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
      const encrypted = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      // Store encryption metadata
      await this.storeEncryptionMetadata(organizationId, config.provider, config.keyId);

      logger.info(`Encrypted data using ${config.provider} key: ${config.keyId}`);

      return {
        ciphertext: encrypted.toString('base64'),
        encryptedDataKey: dataKey.encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        provider: config.provider,
        keyId: config.keyId,
        algorithm: 'AES-256-GCM',
      };
    } catch (error) {
      logger.error('Error encrypting data with BYOK', error);
      throw new Error('BYOK encryption failed');
    }
  }

  /**
   * Decrypt data using customer's key
   */
  async decryptData(
    encryptedPayload: EncryptedPayload,
    config: BYOKConfig
  ): Promise<Buffer> {
    try {
      // Decrypt the data encryption key
      let dekPlaintext: Buffer;

      if (config.provider === 'aws_kms') {
        dekPlaintext = await this.decryptDataKeyAWS(
          encryptedPayload.encryptedDataKey,
          config
        );
      } else if (config.provider === 'azure_kv') {
        dekPlaintext = await this.decryptDataKeyAzure(
          encryptedPayload.encryptedDataKey,
          config
        );
      } else {
        dekPlaintext = Buffer.from(encryptedPayload.encryptedDataKey, 'base64');
      }

      // Decrypt data with DEK
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        dekPlaintext,
        Buffer.from(encryptedPayload.iv, 'base64')
      );

      decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, 'base64'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedPayload.ciphertext, 'base64')),
        decipher.final(),
      ]);

      logger.info(`Decrypted data using ${config.provider} key: ${config.keyId}`);

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting data with BYOK', error);
      throw new Error('BYOK decryption failed');
    }
  }

  /**
   * Decrypt DEK using AWS KMS
   */
  private async decryptDataKeyAWS(
    encryptedKey: string,
    config: BYOKConfig
  ): Promise<Buffer> {
    try {
      const client = this.getKMSClient(
        config.region || process.env.AWS_REGION || 'us-east-1',
        config.credentials
      );

      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
        KeyId: config.keyId,
      });

      const response = await client.send(command);

      if (!response.Plaintext) {
        throw new Error('KMS did not return decrypted key');
      }

      return Buffer.from(response.Plaintext);
    } catch (error) {
      logger.error('Error decrypting AWS KMS data key', error);
      throw new Error('AWS KMS data key decryption failed');
    }
  }

  /**
   * Decrypt DEK using Azure Key Vault
   */
  private async decryptDataKeyAzure(
    encryptedKey: string,
    config: BYOKConfig
  ): Promise<Buffer> {
    try {
      if (!config.vaultUrl) {
        throw new Error('Azure Key Vault URL is required');
      }

      const cryptoClient = new CryptographyClient(
        config.keyId,
        new DefaultAzureCredential()
      );

      const decryptResult = await cryptoClient.decrypt({
        algorithm: 'RSA-OAEP-256',
        ciphertext: Buffer.from(encryptedKey, 'base64'),
      });

      return Buffer.from(decryptResult.result);
    } catch (error) {
      logger.error('Error decrypting Azure Key Vault data key', error);
      throw new Error('Azure Key Vault data key decryption failed');
    }
  }

  /**
   * Create new customer master key in AWS KMS
   */
  async createAWSKey(
    region: string,
    description: string,
    organizationId: string,
    credentials?: any
  ): Promise<string> {
    try {
      const client = this.getKMSClient(region, credentials);

      const command = new CreateKeyCommand({
        Description: description,
        KeyUsage: 'ENCRYPT_DECRYPT',
        Origin: 'AWS_KMS',
        MultiRegion: false,
        Tags: [
          { TagKey: 'Organization', TagValue: organizationId },
          { TagKey: 'ManagedBy', TagValue: 'ComplyEasy' },
        ],
      });

      const response = await client.send(command);

      if (!response.KeyMetadata?.KeyId) {
        throw new Error('Failed to create KMS key');
      }

      logger.info(`Created AWS KMS key: ${response.KeyMetadata.KeyId} for org ${organizationId}`);

      return response.KeyMetadata.KeyId;
    } catch (error) {
      logger.error('Error creating AWS KMS key', error);
      throw new Error('AWS KMS key creation failed');
    }
  }

  /**
   * Create new customer master key in Azure Key Vault
   */
  async createAzureKey(
    vaultUrl: string,
    keyName: string,
    organizationId: string
  ): Promise<string> {
    try {
      const keyClient = this.getAzureKeyClient(vaultUrl);

      const result = await keyClient.createRsaKey(keyName, {
        keySize: 4096,
        tags: {
          organization: organizationId,
          managedBy: 'ComplyEasy',
        },
      });

      logger.info(`Created Azure Key Vault key: ${result.name} for org ${organizationId}`);

      return result.name;
    } catch (error) {
      logger.error('Error creating Azure Key Vault key', error);
      throw new Error('Azure Key Vault key creation failed');
    }
  }

  /**
   * Verify key accessibility and permissions
   */
  async verifyKeyAccess(config: BYOKConfig): Promise<boolean> {
    try {
      if (config.provider === 'aws_kms') {
        return await this.verifyAWSKeyAccess(config);
      } else if (config.provider === 'azure_kv') {
        return await this.verifyAzureKeyAccess(config);
      }
      return true;
    } catch (error) {
      logger.error('Error verifying key access', error);
      return false;
    }
  }

  /**
   * Verify AWS KMS key access
   */
  private async verifyAWSKeyAccess(config: BYOKConfig): Promise<boolean> {
    try {
      const client = this.getKMSClient(
        config.region || process.env.AWS_REGION || 'us-east-1',
        config.credentials
      );

      const command = new DescribeKeyCommand({
        KeyId: config.keyId,
      });

      const response = await client.send(command);

      return response.KeyMetadata?.Enabled === true;
    } catch (error) {
      logger.error('AWS KMS key access verification failed', error);
      return false;
    }
  }

  /**
   * Verify Azure Key Vault key access
   */
  private async verifyAzureKeyAccess(config: BYOKConfig): Promise<boolean> {
    try {
      if (!config.vaultUrl) {
        return false;
      }

      const keyClient = this.getAzureKeyClient(config.vaultUrl);
      const key = await keyClient.getKey(config.keyId);

      return key.properties.enabled === true;
    } catch (error) {
      logger.error('Azure Key Vault key access verification failed', error);
      return false;
    }
  }

  /**
   * Rotate encryption key (generate new DEK)
   */
  async rotateKey(
    organizationId: string,
    oldConfig: BYOKConfig,
    newConfig: BYOKConfig,
    encryptedData: EncryptedPayload[]
  ): Promise<EncryptedPayload[]> {
    try {
      logger.info(`Starting key rotation for org ${organizationId}`);

      const reencryptedData: EncryptedPayload[] = [];

      for (const payload of encryptedData) {
        // Decrypt with old key
        const decrypted = await this.decryptData(payload, oldConfig);

        // Re-encrypt with new key
        const reencrypted = await this.encryptData(decrypted, newConfig, organizationId);

        reencryptedData.push(reencrypted);
      }

      logger.info(`Completed key rotation for org ${organizationId}: ${reencryptedData.length} items`);

      return reencryptedData;
    } catch (error) {
      logger.error('Error during key rotation', error);
      throw new Error('Key rotation failed');
    }
  }

  /**
   * Store encryption metadata in audit log
   */
  private async storeEncryptionMetadata(
    organizationId: string,
    provider: KeyProvider,
    keyId: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `BYOK Encryption: ${provider}`,
          organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            provider,
            keyId,
            algorithm: 'AES-256-GCM',
            envelopeEncryption: true,
          }),
        },
      });
    } catch (error) {
      logger.error('Error storing encryption metadata', error);
    }
  }

  /**
   * Delete customer master key (schedule deletion)
   */
  async scheduleKeyDeletion(
    config: BYOKConfig,
    pendingWindowInDays: number = 30
  ): Promise<void> {
    try {
      if (config.provider === 'aws_kms') {
        const client = this.getKMSClient(
          config.region || process.env.AWS_REGION || 'us-east-1',
          config.credentials
        );

        const command = new ScheduleKeyDeletionCommand({
          KeyId: config.keyId,
          PendingWindowInDays: pendingWindowInDays,
        });

        await client.send(command);

        logger.info(`Scheduled AWS KMS key deletion: ${config.keyId} (${pendingWindowInDays} days)`);
      } else if (config.provider === 'azure_kv' && config.vaultUrl) {
        const keyClient = this.getAzureKeyClient(config.vaultUrl);
        await keyClient.beginDeleteKey(config.keyId);

        logger.info(`Deleted Azure Key Vault key: ${config.keyId}`);
      }
    } catch (error) {
      logger.error('Error scheduling key deletion', error);
      throw new Error('Key deletion failed');
    }
  }
}

export default new BYOKService();
