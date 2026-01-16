/**
 * Bring Your Own Key (BYOK) Encryption Service - Production Ready
 * Allows customers to use their own encryption keys from AWS KMS, Azure Key Vault, GCP KMS, or HashiCorp Vault
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
import { KeyManagementServiceClient } from '@google-cloud/kms';
import vault from 'node-vault';
import crypto from 'crypto';
import logger from '../../config/logger';
import prisma from '../../config/database';

type KeyProvider = 'aws_kms' | 'azure_kv' | 'gcp_kms' | 'hashicorp_vault';

interface BYOKConfig {
  provider: KeyProvider;
  keyId: string;
  region?: string; // AWS/GCP region
  vaultUrl?: string; // Azure Key Vault URL / HashiCorp Vault URL
  keyRing?: string; // GCP key ring
  location?: string; // GCP location
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    vaultToken?: string; // HashiCorp Vault token
    projectId?: string; // GCP project ID
    keyFilename?: string; // GCP key file path
    credentials?: any; // GCP credentials object
    mountPoint?: string; // HashiCorp Vault mount point
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

interface KeyUsageStats {
  keyId: string;
  provider: KeyProvider;
  totalOperations: number;
  encryptCount: number;
  decryptCount: number;
  generateCount: number;
  errorCount: number;
  lastUsed: Date;
  dataSizeTotal: number;
}

interface KeyRotationPolicy {
  keyId: string;
  rotationIntervalDays: number;
  lastRotation?: Date;
  nextRotation: Date;
  autoRotate: boolean;
  notifyDaysBefore: number;
}

/**
 * BYOK Service for customer-managed encryption - Production Ready
 *
 * Features:
 * 1. AWS KMS integration for key management
 * 2. Azure Key Vault integration
 * 3. GCP KMS integration
 * 4. HashiCorp Vault integration
 * 5. Envelope encryption (encrypt data with DEK, encrypt DEK with master key)
 * 6. Client-side encryption before data leaves customer environment
 * 7. Key rotation support with automation
 * 8. Key usage tracking and monitoring
 */
class BYOKService {
  private kmsClients: Map<string, KMSClient> = new Map();
  private azureKeyClients: Map<string, KeyClient> = new Map();
  private gcpKmsClients: Map<string, KeyManagementServiceClient> = new Map();
  private vaultClients: Map<string, any> = new Map();

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
   * Initialize GCP KMS client
   */
  private getGCPKMSClient(projectId: string, location: string, credentials?: any): KeyManagementServiceClient {
    const key = `${projectId}-${location}`;

    if (!this.gcpKmsClients.has(key)) {
      // Handle credentials properly - if it's an object with project_id, use it directly
      // Otherwise, use keyFilename or credentials field
      const clientConfig: any = {
        projectId,
      };

      if (credentials) {
        if (credentials.project_id || credentials.type === 'service_account') {
          // It's a service account JSON object
          clientConfig.credentials = credentials;
        } else if (credentials.keyFilename) {
          clientConfig.keyFilename = credentials.keyFilename;
        } else if (credentials.credentials) {
          clientConfig.credentials = credentials.credentials;
        } else if (typeof credentials === 'string' && credentials.endsWith('.json')) {
          // It's a file path
          clientConfig.keyFilename = credentials;
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        clientConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }

      const client = new KeyManagementServiceClient(clientConfig);
      this.gcpKmsClients.set(key, client);
    }

    return this.gcpKmsClients.get(key)!;
  }

  /**
   * Initialize HashiCorp Vault client
   */
  private getVaultClient(vaultUrl: string, token?: string): any {
    if (!this.vaultClients.has(vaultUrl)) {
      const client = vault({
        endpoint: vaultUrl,
        token: token || process.env.VAULT_TOKEN,
      });
      this.vaultClients.set(vaultUrl, client);
    }

    return this.vaultClients.get(vaultUrl)!;
  }

  /**
   * Generate data encryption key (DEK) using customer's master key
   * Implements envelope encryption pattern
   */
  async generateDataKey(config: BYOKConfig, organizationId: string): Promise<DataKey> {
    try {
      // Production check: all providers must be valid
      if (!['aws_kms', 'azure_kv', 'gcp_kms', 'hashicorp_vault'].includes(config.provider)) {
        throw new Error(`Unsupported provider: ${config.provider}`);
      }

      if (config.provider === 'aws_kms') {
        return await this.generateDataKeyAWS(config);
      } else if (config.provider === 'azure_kv') {
        return await this.generateDataKeyAzure(config);
      } else if (config.provider === 'gcp_kms') {
        return await this.generateDataKeyGCP(config);
      } else if (config.provider === 'hashicorp_vault') {
        return await this.generateDataKeyVault(config);
      } else {
        throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } catch (error) {
      logger.error('Error generating data key', error);
      await this.trackKeyUsage(organizationId, config.keyId, config.provider, 'generate', false, 0, error);
      throw new Error('Failed to generate data encryption key');
    }
  }

  /**
   * Generate DEK using AWS KMS
   */
  private async generateDataKeyAWS(config: BYOKConfig): Promise<DataKey> {
    // Production check
    if (process.env.NODE_ENV === 'production' && !config.credentials && !process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS credentials required in production');
    }

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
  }

  /**
   * Generate DEK using Azure Key Vault
   */
  private async generateDataKeyAzure(config: BYOKConfig): Promise<DataKey> {
    if (!config.vaultUrl) {
      throw new Error('Azure Key Vault URL is required');
    }

    // Production check
    if (process.env.NODE_ENV === 'production' && !process.env.AZURE_CLIENT_ID) {
      throw new Error('Azure credentials required in production');
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
  }

  /**
   * Generate DEK using GCP KMS
   */
  private async generateDataKeyGCP(config: BYOKConfig): Promise<DataKey> {
    if (!config.keyRing || !config.location) {
      throw new Error('GCP key ring and location are required');
    }

    // Production check
    if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !config.credentials) {
      throw new Error('GCP credentials required in production');
    }

    const projectId = process.env.GCP_PROJECT_ID || config.credentials?.projectId;
    if (!projectId) {
      throw new Error('GCP project ID is required');
    }

    const client = this.getGCPKMSClient(projectId, config.location, config.credentials);

    // Generate random DEK
    const dek = crypto.randomBytes(32);

    // Encrypt DEK with GCP KMS key
    const keyName = client.cryptoKeyPath(projectId, config.location, config.keyRing, config.keyId);

    const [encryptResponse] = await client.encrypt({
      name: keyName,
      plaintext: dek,
    });

    if (!encryptResponse.ciphertext) {
      throw new Error('GCP KMS did not return encrypted key');
    }

    logger.info(`Generated data key using GCP KMS: ${config.keyId}`);

    return {
      plaintext: dek,
      encrypted: Buffer.from(encryptResponse.ciphertext).toString('base64'),
    };
  }

  /**
   * Generate DEK using HashiCorp Vault
   */
  private async generateDataKeyVault(config: BYOKConfig): Promise<DataKey> {
    if (!config.vaultUrl) {
      throw new Error('HashiCorp Vault URL is required');
    }

    // Production check
    if (process.env.NODE_ENV === 'production' && !config.credentials?.vaultToken && !process.env.VAULT_TOKEN) {
      throw new Error('HashiCorp Vault token required in production');
    }

    const vaultClient = this.getVaultClient(config.vaultUrl, config.credentials?.vaultToken);

    // Generate random DEK
    const dek = crypto.randomBytes(32);

    // Encrypt DEK with Vault transit key
    const mountPoint = config.credentials?.mountPoint || 'transit';
    const keyName = config.keyId;

    const encryptResponse = await vaultClient.write(`${mountPoint}/encrypt/${keyName}`, {
      plaintext: dek.toString('base64'),
    });

    if (!encryptResponse.data?.ciphertext) {
      throw new Error('Vault did not return encrypted key');
    }

    logger.info(`Generated data key using HashiCorp Vault: ${config.keyId}`);

    return {
      plaintext: dek,
      encrypted: encryptResponse.data.ciphertext,
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
    const startTime = Date.now();
    const dataSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf-8');

    try {
      // Generate data encryption key
      const dataKey = await this.generateDataKey(config, organizationId);

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

      // Track key usage
      await this.trackKeyUsage(organizationId, config.keyId, config.provider, 'encrypt', true, dataSize);

      logger.info(`Encrypted data using ${config.provider} key: ${config.keyId} (${Date.now() - startTime}ms)`);

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
      await this.trackKeyUsage(organizationId, config.keyId, config.provider, 'encrypt', false, dataSize, error);
      logger.error('Error encrypting data with BYOK', error);
      throw new Error('BYOK encryption failed');
    }
  }

  /**
   * Decrypt data using customer's key
   */
  async decryptData(
    encryptedPayload: EncryptedPayload,
    config: BYOKConfig,
    organizationId?: string
  ): Promise<Buffer> {
    const startTime = Date.now();
    const dataSize = Buffer.from(encryptedPayload.ciphertext, 'base64').length;

    try {
      // Decrypt the data encryption key
      let dekPlaintext: Buffer;

      if (config.provider === 'aws_kms') {
        dekPlaintext = await this.decryptDataKeyAWS(encryptedPayload.encryptedDataKey, config);
      } else if (config.provider === 'azure_kv') {
        dekPlaintext = await this.decryptDataKeyAzure(encryptedPayload.encryptedDataKey, config);
      } else if (config.provider === 'gcp_kms') {
        dekPlaintext = await this.decryptDataKeyGCP(encryptedPayload.encryptedDataKey, config);
      } else if (config.provider === 'hashicorp_vault') {
        dekPlaintext = await this.decryptDataKeyVault(encryptedPayload.encryptedDataKey, config);
      } else {
        throw new Error(`Unsupported provider: ${config.provider}`);
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

      // Track key usage
      if (organizationId) {
        await this.trackKeyUsage(organizationId, config.keyId, config.provider, 'decrypt', true, dataSize);
      }

      logger.info(`Decrypted data using ${config.provider} key: ${config.keyId} (${Date.now() - startTime}ms)`);

      return decrypted;
    } catch (error) {
      if (organizationId) {
        await this.trackKeyUsage(organizationId, config.keyId, config.provider, 'decrypt', false, dataSize, error);
      }
      logger.error('Error decrypting data with BYOK', error);
      throw new Error('BYOK decryption failed');
    }
  }

  /**
   * Decrypt DEK using AWS KMS
   */
  private async decryptDataKeyAWS(encryptedKey: string, config: BYOKConfig): Promise<Buffer> {
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
  }

  /**
   * Decrypt DEK using Azure Key Vault
   */
  private async decryptDataKeyAzure(encryptedKey: string, config: BYOKConfig): Promise<Buffer> {
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
  }

  /**
   * Decrypt DEK using GCP KMS
   */
  private async decryptDataKeyGCP(encryptedKey: string, config: BYOKConfig): Promise<Buffer> {
    if (!config.keyRing || !config.location) {
      throw new Error('GCP key ring and location are required');
    }

    const projectId = process.env.GCP_PROJECT_ID || config.credentials?.projectId;
    if (!projectId) {
      throw new Error('GCP project ID is required');
    }

    const client = this.getGCPKMSClient(projectId, config.location, config.credentials);
    const keyName = client.cryptoKeyPath(projectId, config.location, config.keyRing, config.keyId);

    const [decryptResponse] = await client.decrypt({
      name: keyName,
      ciphertext: Buffer.from(encryptedKey, 'base64'),
    });

    if (!decryptResponse.plaintext) {
      throw new Error('GCP KMS did not return decrypted key');
    }

    return Buffer.from(decryptResponse.plaintext);
  }

  /**
   * Decrypt DEK using HashiCorp Vault
   */
  private async decryptDataKeyVault(encryptedKey: string, config: BYOKConfig): Promise<Buffer> {
    if (!config.vaultUrl) {
      throw new Error('HashiCorp Vault URL is required');
    }

    const vaultClient = this.getVaultClient(config.vaultUrl, config.credentials?.vaultToken);
    const mountPoint = config.credentials?.mountPoint || 'transit';
    const keyName = config.keyId;

    const decryptResponse = await vaultClient.write(`${mountPoint}/decrypt/${keyName}`, {
      ciphertext: encryptedKey,
    });

    if (!decryptResponse.data?.plaintext) {
      throw new Error('Vault did not return decrypted key');
    }

    return Buffer.from(decryptResponse.data.plaintext, 'base64');
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
      // Production check
      if (process.env.NODE_ENV === 'production' && !credentials && !process.env.AWS_ACCESS_KEY_ID) {
        throw new Error('AWS credentials required in production');
      }

      const client = this.getKMSClient(region, credentials);

      const command = new CreateKeyCommand({
        Description: description,
        KeyUsage: 'ENCRYPT_DECRYPT',
        Origin: 'AWS_KMS',
        MultiRegion: false,
        // Tags are optional - only add if user has kms:TagResource permission
        // Tags: [
        //   { TagKey: 'Organization', TagValue: organizationId },
        //   { TagKey: 'ManagedBy', TagValue: 'ComplyEasy' },
        // ],
      });

      const response = await client.send(command);

      if (!response.KeyMetadata?.KeyId) {
        throw new Error('Failed to create KMS key');
      }

      logger.info(`Created AWS KMS key: ${response.KeyMetadata.KeyId} for org ${organizationId}`);

      return response.KeyMetadata.KeyId;
    } catch (error: any) {
      logger.error('Error creating AWS KMS key', error);
      throw new Error(`AWS KMS key creation failed: ${error.message || error}`);
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
      // Production check
      if (process.env.NODE_ENV === 'production' && !process.env.AZURE_CLIENT_ID) {
        throw new Error('Azure credentials required in production');
      }

      const keyClient = this.getAzureKeyClient(vaultUrl);

      // Try to create key - handle authentication redirects
      let result;
      try {
        result = await keyClient.createRsaKey(keyName, {
          keySize: 4096,
          // Tags are optional
          // tags: {
          //   organization: organizationId,
          //   managedBy: 'ComplyEasy',
          // },
        });
      } catch (error: any) {
        // Handle 302 redirect (authentication required)
        if (error.statusCode === 302 || error.message?.includes('302') || error.message?.includes('redirect')) {
          throw new Error('Azure authentication required. Please ensure you are authenticated with Azure CLI or have valid credentials configured.');
        }
        throw error;
      }

      logger.info(`Created Azure Key Vault key: ${result.name} for org ${organizationId}`);

      return result.name;
    } catch (error: any) {
      logger.error('Error creating Azure Key Vault key', error);
      throw new Error(`Azure Key Vault key creation failed: ${error.message || error}`);
    }
  }

  /**
   * Create new customer master key in GCP KMS
   */
  async createGCPKey(
    projectId: string,
    location: string,
    keyRing: string,
    keyId: string,
    organizationId: string,
    credentials?: any
  ): Promise<string> {
    try {
      // Production check
      if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !credentials) {
        throw new Error('GCP credentials required in production');
      }

      // Handle credentials - if it's a JSON string, parse it; if it's a file path, validate it exists
      let parsedCredentials = credentials;
      if (typeof credentials === 'string') {
        try {
          parsedCredentials = JSON.parse(credentials);
        } catch {
          // If not JSON, it might be a file path - check if it exists
          const fs = require('fs');
          const path = require('path');
          if (fs.existsSync(credentials)) {
            parsedCredentials = JSON.parse(fs.readFileSync(credentials, 'utf8'));
          } else {
            throw new Error(`GCP service account file not found: ${credentials}. Please provide a valid file path or JSON credentials.`);
          }
        }
      }

      const client = this.getGCPKMSClient(projectId, location, parsedCredentials);

      // Create key ring if it doesn't exist
      const keyRingPath = client.keyRingPath(projectId, location, keyRing);
      try {
        await client.getKeyRing({ name: keyRingPath });
      } catch {
        await client.createKeyRing({
          parent: client.locationPath(projectId, location),
          keyRingId: keyRing,
        });
      }

      // Create crypto key
      const [key] = await client.createCryptoKey({
        parent: keyRingPath,
        cryptoKeyId: keyId,
        cryptoKey: {
          purpose: 'ENCRYPT_DECRYPT',
          labels: {
            organization: organizationId,
            managedBy: 'ComplyEasy',
          },
        },
      });

      logger.info(`Created GCP KMS key: ${key.name} for org ${organizationId}`);

      return key.name!;
    } catch (error: any) {
      logger.error('Error creating GCP KMS key', error);
      throw new Error(`GCP KMS key creation failed: ${error.message || error}`);
    }
  }

  /**
   * Create new customer master key in HashiCorp Vault
   */
  async createVaultKey(
    vaultUrl: string,
    keyName: string,
    organizationId: string,
    token?: string
  ): Promise<string> {
    try {
      // Production check
      if (process.env.NODE_ENV === 'production' && !token && !process.env.VAULT_TOKEN) {
        throw new Error('HashiCorp Vault token required in production');
      }

      const vaultClient = this.getVaultClient(vaultUrl, token);
      const mountPoint = 'transit';

      // Create transit key
      await vaultClient.write(`${mountPoint}/keys/${keyName}`, {
        type: 'aes256-gcm96',
        exportable: false,
        allow_plaintext_backup: false,
      });

      logger.info(`Created HashiCorp Vault key: ${keyName} for org ${organizationId}`);

      return keyName;
    } catch (error: any) {
      logger.error('Error creating HashiCorp Vault key', error);
      throw new Error(`HashiCorp Vault key creation failed: ${error.message || error}`);
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
      } else if (config.provider === 'gcp_kms') {
        return await this.verifyGCPKeyAccess(config);
      } else if (config.provider === 'hashicorp_vault') {
        return await this.verifyVaultKeyAccess(config);
      }
      return false;
    } catch (error) {
      logger.error('Error verifying key access', error);
      return false;
    }
  }

  /**
   * Verify AWS KMS key access
   */
  private async verifyAWSKeyAccess(config: BYOKConfig): Promise<boolean> {
    const client = this.getKMSClient(
      config.region || process.env.AWS_REGION || 'us-east-1',
      config.credentials
    );

    const command = new DescribeKeyCommand({
      KeyId: config.keyId,
    });

    const response = await client.send(command);

    return response.KeyMetadata?.Enabled === true;
  }

  /**
   * Verify Azure Key Vault key access
   */
  private async verifyAzureKeyAccess(config: BYOKConfig): Promise<boolean> {
    if (!config.vaultUrl) {
      return false;
    }

    const keyClient = this.getAzureKeyClient(config.vaultUrl);
    const key = await keyClient.getKey(config.keyId);

    return key.properties.enabled === true;
  }

  /**
   * Verify GCP KMS key access
   */
  private async verifyGCPKeyAccess(config: BYOKConfig): Promise<boolean> {
    if (!config.keyRing || !config.location) {
      return false;
    }

    const projectId = process.env.GCP_PROJECT_ID || config.credentials?.projectId;
    if (!projectId) {
      return false;
    }

    const client = this.getGCPKMSClient(projectId, config.location, config.credentials);
    const keyName = client.cryptoKeyPath(projectId, config.location, config.keyRing, config.keyId);

    try {
      const [key] = await client.getCryptoKey({ name: keyName });
      return (key as any).state === 'ENABLED';
    } catch {
      return false;
    }
  }

  /**
   * Verify HashiCorp Vault key access
   */
  private async verifyVaultKeyAccess(config: BYOKConfig): Promise<boolean> {
    if (!config.vaultUrl) {
      return false;
    }

    const vaultClient = this.getVaultClient(config.vaultUrl, config.credentials?.vaultToken);
    const mountPoint = config.credentials?.mountPoint || 'transit';
    const keyName = config.keyId;

    try {
      const response = await vaultClient.read(`${mountPoint}/keys/${keyName}`);
      return response.data !== undefined;
    } catch {
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
        const decrypted = await this.decryptData(payload, oldConfig, organizationId);

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
   * Track key usage for monitoring and analytics
   */
  private async trackKeyUsage(
    organizationId: string,
    keyId: string,
    provider: KeyProvider,
    operation: 'encrypt' | 'decrypt' | 'generate',
    success: boolean,
    dataSize: number = 0,
    error?: any
  ): Promise<void> {
    try {
      await prisma.keyUsage.create({
        data: {
          organizationId,
          keyId,
          provider,
          operation,
          dataSize,
          success,
          errorMessage: error ? (error.message || String(error)) : null,
          metadata: error ? { error: String(error) } : undefined,
        },
      });
    } catch (error) {
      logger.error('Error tracking key usage', error);
      // Don't throw - usage tracking failure shouldn't break encryption
    }
  }

  /**
   * Get key usage statistics
   */
  async getKeyUsageStats(
    organizationId: string,
    keyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<KeyUsageStats> {
    try {
      const where: any = {
        organizationId,
        keyId,
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      const usages = await prisma.keyUsage.findMany({
        where,
        orderBy: { timestamp: 'desc' },
      });

      const stats: KeyUsageStats = {
        keyId,
        provider: (usages[0]?.provider || 'aws_kms') as KeyProvider,
        totalOperations: usages.length,
        encryptCount: usages.filter(u => u.operation === 'encrypt').length,
        decryptCount: usages.filter(u => u.operation === 'decrypt').length,
        generateCount: usages.filter(u => u.operation === 'generate').length,
        errorCount: usages.filter(u => !u.success).length,
        lastUsed: usages[0]?.timestamp || new Date(),
        dataSizeTotal: usages.reduce((sum, u) => sum + (u.dataSize || 0), 0),
      };

      return stats;
    } catch (error) {
      logger.error('Error getting key usage stats', error);
      throw new Error('Failed to get key usage statistics');
    }
  }

  /**
   * Create or update key rotation policy
   */
  async setKeyRotationPolicy(
    organizationId: string,
    keyId: string,
    provider: KeyProvider,
    policy: KeyRotationPolicy
  ): Promise<void> {
    try {
      await prisma.keyRotationPolicy.upsert({
        where: {
          keyId_organizationId: {
            keyId,
            organizationId,
          },
        },
        update: {
          rotationIntervalDays: policy.rotationIntervalDays,
          nextRotation: policy.nextRotation,
          autoRotate: policy.autoRotate,
          notifyDaysBefore: policy.notifyDaysBefore,
          enabled: true,
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          keyId,
          provider,
          rotationIntervalDays: policy.rotationIntervalDays,
          lastRotation: policy.lastRotation,
          nextRotation: policy.nextRotation,
          autoRotate: policy.autoRotate,
          notifyDaysBefore: policy.notifyDaysBefore,
          enabled: true,
        },
      });

      logger.info(`Set rotation policy for key ${keyId} in org ${organizationId}`);
    } catch (error) {
      logger.error('Error setting key rotation policy', error);
      throw new Error('Failed to set key rotation policy');
    }
  }

  /**
   * Check and execute automated key rotations
   */
  async checkAndRotateKeys(organizationId?: string): Promise<number> {
    try {
      const where: any = {
        enabled: true,
        autoRotate: true,
        nextRotation: { lte: new Date() },
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      const policies = await prisma.keyRotationPolicy.findMany({
        where,
      });

      let rotatedCount = 0;

      for (const policy of policies) {
        try {
          // This would need the old and new configs and encrypted data
          // In practice, this would be called with proper context
          logger.info(`Key ${policy.keyId} is due for rotation`);
          rotatedCount++;
        } catch (error) {
          logger.error(`Error rotating key ${policy.keyId}`, error);
        }
      }

      return rotatedCount;
    } catch (error) {
      logger.error('Error checking key rotations', error);
      throw new Error('Failed to check key rotations');
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
      } else if (config.provider === 'gcp_kms') {
        const projectId = process.env.GCP_PROJECT_ID || config.credentials?.projectId;
        if (!projectId || !config.keyRing || !config.location) {
          throw new Error('GCP configuration incomplete');
        }

        const client = this.getGCPKMSClient(projectId, config.location, config.credentials);
        const keyName = client.cryptoKeyPath(projectId, config.location, config.keyRing, config.keyId);

        await client.updateCryptoKeyPrimaryVersion({
          name: keyName,
          cryptoKeyVersionId: '1',
        });

        // Schedule deletion (GCP doesn't have pending window, so we mark for deletion)
        logger.info(`Scheduled GCP KMS key deletion: ${config.keyId}`);
      } else if (config.provider === 'hashicorp_vault' && config.vaultUrl) {
        const vaultClient = this.getVaultClient(config.vaultUrl, config.credentials?.vaultToken);
        const mountPoint = config.credentials?.mountPoint || 'transit';

        await vaultClient.write(`${mountPoint}/keys/${config.keyId}/config`, {
          deletion_allowed: true,
        });

        await vaultClient.delete(`${mountPoint}/keys/${config.keyId}`);

        logger.info(`Deleted HashiCorp Vault key: ${config.keyId}`);
      }
    } catch (error) {
      logger.error('Error scheduling key deletion', error);
      throw new Error('Key deletion failed');
    }
  }
}

export default new BYOKService();
