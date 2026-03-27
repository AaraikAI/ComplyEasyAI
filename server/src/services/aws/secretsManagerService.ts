/**
 * AWS Secrets Manager Service
 *
 * Provides automated secret rotation and management using AWS Secrets Manager.
 *
 * Features:
 * - Automatic secret rotation
 * - Secret caching with TTL
 * - Version management
 * - Rotation scheduling
 * - Audit logging
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  RotateSecretCommand,
  DescribeSecretCommand,
  ListSecretsCommand,
  DeleteSecretCommand,
  PutSecretValueCommand,
  type GetSecretValueCommandOutput,
  type DescribeSecretCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import { randomBytes } from 'crypto';
import config from '../../config';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface SecretConfig {
  name: string;
  description?: string;
  rotationDays?: number;
  tags?: Record<string, string>;
}

interface CachedSecret {
  value: string | Record<string, any>;
  expiresAt: number;
  version?: string;
}

interface SecretMetadata {
  name: string;
  arn: string;
  description?: string;
  rotationEnabled: boolean;
  rotationDays?: number;
  lastRotated?: Date;
  nextRotation?: Date;
  versions: string[];
  tags: Record<string, string>;
}

interface RotationConfig {
  automaticRotation: boolean;
  rotationDays: number;
  rotationLambdaArn?: string;
}

// ============================================================================
// SECRETS MANAGER SERVICE
// ============================================================================

export class SecretsManagerService {
  private client: SecretsManagerClient;
  private cache: Map<string, CachedSecret> = new Map();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_ROTATION_DAYS = 30;

  constructor() {
    const region = config.aws.region || 'us-east-1';

    const clientConfig: ConstructorParameters<typeof SecretsManagerClient>[0] = {
      region,
    };

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new SecretsManagerClient(clientConfig);

    logger.info('[SecretsManager] Service initialized', { region });
  }

  // ==========================================================================
  // SECRET RETRIEVAL
  // ==========================================================================

  /**
   * Get a secret value (with caching)
   */
  async getSecret<T = string>(
    secretName: string,
    options: { parseJson?: boolean; bypassCache?: boolean; versionId?: string } = {}
  ): Promise<T> {
    const { parseJson = false, bypassCache = false, versionId } = options;
    const cacheKey = `${secretName}:${versionId || 'AWSCURRENT'}`;

    // Check cache
    if (!bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug('[SecretsManager] Cache hit', { secretName });
        return (parseJson && typeof cached.value === 'string'
          ? JSON.parse(cached.value)
          : cached.value) as T;
      }
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
        VersionId: versionId,
      });

      const response = await this.client.send(command);
      let value: string | Record<string, any>;

      if (response.SecretString) {
        value = parseJson ? JSON.parse(response.SecretString) : response.SecretString;
      } else if (response.SecretBinary) {
        value = Buffer.from(response.SecretBinary).toString('utf-8');
        if (parseJson) {
          value = JSON.parse(value);
        }
      } else {
        throw new AppError('Secret has no value', 500);
      }

      // Cache the secret
      this.cache.set(cacheKey, {
        value: response.SecretString || '',
        expiresAt: Date.now() + this.DEFAULT_CACHE_TTL,
        version: response.VersionId,
      });

      logger.info('[SecretsManager] Secret retrieved', { secretName, version: response.VersionId });

      return value as T;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        throw new AppError(`Secret not found: ${secretName}`, 404);
      }
      if (error.name === 'DecryptionFailure') {
        throw new AppError(`Failed to decrypt secret: ${secretName}`, 500);
      }
      logger.error('[SecretsManager] Failed to get secret', { secretName, error: error.message });
      throw error;
    }
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets<T extends Record<string, any>>(
    secretNames: string[],
    options: { parseJson?: boolean } = {}
  ): Promise<T> {
    const results: Record<string, any> = {};

    await Promise.all(
      secretNames.map(async (name) => {
        try {
          results[name] = await this.getSecret(name, options);
        } catch (error: any) {
          logger.warn('[SecretsManager] Failed to get secret', { name, error: error.message });
          results[name] = null;
        }
      })
    );

    return results as T;
  }

  // ==========================================================================
  // SECRET MANAGEMENT
  // ==========================================================================

  /**
   * Create a new secret
   */
  async createSecret(
    secretConfig: SecretConfig,
    value: string | Record<string, any>
  ): Promise<string> {
    const secretString = typeof value === 'string' ? value : JSON.stringify(value);

    const command = new CreateSecretCommand({
      Name: secretConfig.name,
      Description: secretConfig.description,
      SecretString: secretString,
      Tags: secretConfig.tags
        ? Object.entries(secretConfig.tags).map(([Key, Value]) => ({ Key, Value }))
        : undefined,
    });

    const response = await this.client.send(command);

    logger.info('[SecretsManager] Secret created', { name: secretConfig.name, arn: response.ARN });

    return response.ARN!;
  }

  /**
   * Update an existing secret
   */
  async updateSecret(
    secretName: string,
    value: string | Record<string, any>
  ): Promise<void> {
    const secretString = typeof value === 'string' ? value : JSON.stringify(value);

    const command = new PutSecretValueCommand({
      SecretId: secretName,
      SecretString: secretString,
    });

    await this.client.send(command);

    // Invalidate cache
    this.invalidateCache(secretName);

    logger.info('[SecretsManager] Secret updated', { secretName });
  }

  /**
   * Delete a secret
   */
  async deleteSecret(secretName: string, forceDelete: boolean = false): Promise<void> {
    const command = new DeleteSecretCommand({
      SecretId: secretName,
      ForceDeleteWithoutRecovery: forceDelete,
      RecoveryWindowInDays: forceDelete ? undefined : 7,
    });

    await this.client.send(command);

    // Invalidate cache
    this.invalidateCache(secretName);

    logger.info('[SecretsManager] Secret deleted', { secretName, forceDelete });
  }

  // ==========================================================================
  // SECRET ROTATION
  // ==========================================================================

  /**
   * Configure automatic rotation for a secret
   */
  async configureRotation(
    secretName: string,
    rotationConfig: RotationConfig
  ): Promise<void> {
    if (!rotationConfig.automaticRotation) {
      logger.info('[SecretsManager] Rotation disabled', { secretName });
      return;
    }

    const command = new RotateSecretCommand({
      SecretId: secretName,
      RotationLambdaARN: rotationConfig.rotationLambdaArn,
      RotationRules: {
        AutomaticallyAfterDays: rotationConfig.rotationDays,
      },
    });

    await this.client.send(command);

    logger.info('[SecretsManager] Rotation configured', {
      secretName,
      rotationDays: rotationConfig.rotationDays,
    });
  }

  /**
   * Trigger immediate rotation
   */
  async rotateSecretNow(secretName: string): Promise<void> {
    const command = new RotateSecretCommand({
      SecretId: secretName,
    });

    await this.client.send(command);

    // Invalidate cache
    this.invalidateCache(secretName);

    logger.info('[SecretsManager] Secret rotation triggered', { secretName });
  }

  /**
   * Generate a new random secret value (for rotation)
   */
  generateSecretValue(length: number = 32, options: {
    includeNumbers?: boolean;
    includeSpecial?: boolean;
    includeLowercase?: boolean;
    includeUppercase?: boolean;
  } = {}): string {
    const {
      includeNumbers = true,
      includeSpecial = true,
      includeLowercase = true,
      includeUppercase = true,
    } = options;

    let chars = '';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSpecial) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      throw new AppError('At least one character type must be enabled', 400);
    }

    const bytes = randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }

    return result;
  }

  /**
   * Rotate a database credential secret
   */
  async rotateDatabaseCredential(
    secretName: string,
    updateDbCallback: (newPassword: string) => Promise<void>
  ): Promise<void> {
    logger.info('[SecretsManager] Starting database credential rotation', { secretName });

    try {
      // Get current secret
      const currentSecret = await this.getSecret<{ username: string; password: string }>(
        secretName,
        { parseJson: true, bypassCache: true }
      );

      // Generate new password
      const newPassword = this.generateSecretValue(32, {
        includeNumbers: true,
        includeSpecial: false, // Avoid special chars that may cause issues
        includeLowercase: true,
        includeUppercase: true,
      });

      // Update database with new password
      await updateDbCallback(newPassword);

      // Update secret in Secrets Manager
      await this.updateSecret(secretName, {
        username: currentSecret.username,
        password: newPassword,
      });

      logger.info('[SecretsManager] Database credential rotated successfully', { secretName });
    } catch (error: any) {
      logger.error('[SecretsManager] Database credential rotation failed', {
        secretName,
        error: error.message,
      });
      throw error;
    }
  }

  // ==========================================================================
  // SECRET METADATA
  // ==========================================================================

  /**
   * Get secret metadata
   */
  async getSecretMetadata(secretName: string): Promise<SecretMetadata> {
    const command = new DescribeSecretCommand({
      SecretId: secretName,
    });

    const response = await this.client.send(command);

    return {
      name: response.Name!,
      arn: response.ARN!,
      description: response.Description,
      rotationEnabled: response.RotationEnabled || false,
      rotationDays: response.RotationRules?.AutomaticallyAfterDays,
      lastRotated: response.LastRotatedDate,
      nextRotation: response.NextRotationDate,
      versions: Object.keys(response.VersionIdsToStages || {}),
      tags: (response.Tags || []).reduce(
        (acc, tag) => ({ ...acc, [tag.Key!]: tag.Value! }),
        {} as Record<string, string>
      ),
    };
  }

  /**
   * List all secrets
   */
  async listSecrets(filters?: {
    namePrefix?: string;
    tagKey?: string;
    tagValue?: string;
  }): Promise<SecretMetadata[]> {
    const command = new ListSecretsCommand({
      Filters: filters
        ? [
            ...(filters.namePrefix
              ? [{ Key: 'name' as const, Values: [filters.namePrefix] }]
              : []),
            ...(filters.tagKey
              ? [{ Key: 'tag-key' as const, Values: [filters.tagKey] }]
              : []),
            ...(filters.tagValue
              ? [{ Key: 'tag-value' as const, Values: [filters.tagValue] }]
              : []),
          ]
        : undefined,
    });

    const response = await this.client.send(command);

    return (response.SecretList || []).map((secret) => ({
      name: secret.Name!,
      arn: secret.ARN!,
      description: secret.Description,
      rotationEnabled: secret.RotationEnabled || false,
      rotationDays: secret.RotationRules?.AutomaticallyAfterDays,
      lastRotated: secret.LastRotatedDate,
      nextRotation: secret.NextRotationDate,
      versions: [],
      tags: (secret.Tags || []).reduce(
        (acc, tag) => ({ ...acc, [tag.Key!]: tag.Value! }),
        {} as Record<string, string>
      ),
    }));
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Invalidate cache for a secret
   */
  invalidateCache(secretName: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${secretName}:`)) {
        this.cache.delete(key);
      }
    }
    logger.debug('[SecretsManager] Cache invalidated', { secretName });
  }

  /**
   * Clear all cached secrets
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('[SecretsManager] All cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; secrets: string[] } {
    return {
      size: this.cache.size,
      secrets: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const secretsManagerService = new SecretsManagerService();

export default secretsManagerService;
