/**
 * AWS Secrets Manager Rotation Lambda
 *
 * This Lambda function handles automatic rotation of secrets stored in AWS Secrets Manager.
 * It supports rotation for:
 * - Database credentials (PostgreSQL/Supabase)
 * - JWT secrets
 * - API keys
 * - Encryption keys
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  DescribeSecretCommand,
  UpdateSecretVersionStageCommand,
} from '@aws-sdk/client-secrets-manager';
import { randomBytes, createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface RotationEvent {
  SecretId: string;
  ClientRequestToken: string;
  Step: 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';
}

interface SecretMetadata {
  SecretType: 'database' | 'jwt' | 'api_key' | 'encryption_key';
  RotationDays?: number;
  DatabaseHost?: string;
  DatabasePort?: number;
  DatabaseName?: string;
}

// ============================================================================
// SECRETS MANAGER CLIENT
// ============================================================================

const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const handler = async (event: RotationEvent): Promise<void> => {
  const { SecretId, ClientRequestToken, Step } = event;

  // Log only the non-sensitive rotation step; the secret identifier/ARN
  // is intentionally omitted from logs.
  console.log(`Processing rotation step: ${Step}`);

  // Get secret metadata to determine rotation strategy
  const describeResponse = await secretsManager.send(
    new DescribeSecretCommand({ SecretId })
  );

  const metadata: SecretMetadata = describeResponse.Tags?.reduce((acc, tag) => {
    if (tag.Key && tag.Value) {
      acc[tag.Key as keyof SecretMetadata] = tag.Value;
    }
    return acc;
  }, {} as SecretMetadata) || { SecretType: 'api_key' };

  switch (Step) {
    case 'createSecret':
      await createSecret(SecretId, ClientRequestToken, metadata);
      break;
    case 'setSecret':
      await setSecret(SecretId, ClientRequestToken, metadata);
      break;
    case 'testSecret':
      await testSecret(SecretId, ClientRequestToken, metadata);
      break;
    case 'finishSecret':
      await finishSecret(SecretId, ClientRequestToken);
      break;
    default:
      throw new Error(`Unknown rotation step: ${Step}`);
  }
};

// ============================================================================
// ROTATION STEPS
// ============================================================================

/**
 * Create a new secret version with AWSPENDING label
 */
async function createSecret(
  secretId: string,
  clientRequestToken: string,
  metadata: SecretMetadata
): Promise<void> {
  // Check if pending version already exists
  try {
    await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: clientRequestToken,
        VersionStage: 'AWSPENDING',
      })
    );
    console.log('Pending secret version already exists');
    return;
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  // Get current secret value
  const currentSecret = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
    })
  );

  const currentValue = JSON.parse(currentSecret.SecretString || '{}');

  // Generate new secret value based on type
  const newValue = await generateNewSecret(currentValue, metadata);

  // Store the new secret with AWSPENDING label
  await secretsManager.send(
    new PutSecretValueCommand({
      SecretId: secretId,
      ClientRequestToken: clientRequestToken,
      SecretString: JSON.stringify(newValue),
      VersionStages: ['AWSPENDING'],
    })
  );

  console.log('Created new pending secret version');
}

/**
 * Set the secret in the target service (e.g., database, application)
 */
async function setSecret(
  secretId: string,
  clientRequestToken: string,
  metadata: SecretMetadata
): Promise<void> {
  // Get the pending secret
  const pendingSecret = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: clientRequestToken,
      VersionStage: 'AWSPENDING',
    })
  );

  const pendingValue = JSON.parse(pendingSecret.SecretString || '{}');

  // Apply the secret to the target service based on type
  switch (metadata.SecretType) {
    case 'database':
      await setDatabasePassword(pendingValue, metadata);
      break;
    case 'jwt':
    case 'api_key':
    case 'encryption_key':
      // These don't require external service updates
      // The application will pick up the new value on next read
      console.log(`Secret type ${metadata.SecretType} does not require external update`);
      break;
    default:
      console.log('Unknown secret type, skipping external update');
  }
}

/**
 * Test the new secret works correctly
 */
async function testSecret(
  secretId: string,
  clientRequestToken: string,
  metadata: SecretMetadata
): Promise<void> {
  // Get the pending secret
  const pendingSecret = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: clientRequestToken,
      VersionStage: 'AWSPENDING',
    })
  );

  const pendingValue = JSON.parse(pendingSecret.SecretString || '{}');

  // Test the secret based on type
  switch (metadata.SecretType) {
    case 'database':
      await testDatabaseConnection(pendingValue, metadata);
      break;
    case 'jwt':
      testJwtSecret(pendingValue);
      break;
    case 'api_key':
      testApiKey(pendingValue);
      break;
    case 'encryption_key':
      testEncryptionKey(pendingValue);
      break;
    default:
      console.log('Unknown secret type, skipping test');
  }

  console.log('Secret test passed');
}

/**
 * Move the AWSCURRENT label to the new secret version
 */
async function finishSecret(
  secretId: string,
  clientRequestToken: string
): Promise<void> {
  // Get secret metadata to find current version
  const describeResponse = await secretsManager.send(
    new DescribeSecretCommand({ SecretId: secretId })
  );

  const currentVersion = Object.entries(describeResponse.VersionIdsToStages || {})
    .find(([_, stages]) => stages?.includes('AWSCURRENT'))?.[0];

  if (currentVersion === clientRequestToken) {
    console.log('Secret rotation already complete');
    return;
  }

  // Move AWSCURRENT label to new version
  await secretsManager.send(
    new UpdateSecretVersionStageCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
      MoveToVersionId: clientRequestToken,
      RemoveFromVersionId: currentVersion,
    })
  );

  console.log('Secret rotation complete');
}

// ============================================================================
// SECRET GENERATION
// ============================================================================

async function generateNewSecret(
  currentValue: Record<string, any>,
  metadata: SecretMetadata
): Promise<Record<string, any>> {
  switch (metadata.SecretType) {
    case 'database':
      return {
        ...currentValue,
        password: generateSecurePassword(32),
        rotatedAt: new Date().toISOString(),
      };

    case 'jwt':
      return {
        secret: generateSecureToken(64),
        refreshSecret: generateSecureToken(64),
        rotatedAt: new Date().toISOString(),
      };

    case 'api_key':
      return {
        key: generateApiKey(),
        rotatedAt: new Date().toISOString(),
      };

    case 'encryption_key':
      return {
        key: generateEncryptionKey(),
        rotatedAt: new Date().toISOString(),
      };

    default:
      return {
        ...currentValue,
        value: generateSecureToken(32),
        rotatedAt: new Date().toISOString(),
      };
  }
}

function generateSecurePassword(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

function generateSecureToken(length: number): string {
  return randomBytes(length).toString('hex');
}

function generateApiKey(): string {
  const prefix = 'sk_live_';
  const key = randomBytes(32).toString('base64url');
  return prefix + key;
}

function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

// ============================================================================
// SERVICE-SPECIFIC OPERATIONS
// ============================================================================

async function setDatabasePassword(
  secret: Record<string, any>,
  metadata: SecretMetadata
): Promise<void> {
  // Require explicit identities — never default to a well-known role.
  const adminUser = secret.adminUsername || process.env.DB_ADMIN_USER;
  if (!adminUser) {
    throw new Error(
      'Rotation aborted: admin username not provided (set secret.adminUsername or DB_ADMIN_USER).'
    );
  }
  const dbUser = secret.username;
  if (!dbUser) {
    throw new Error(
      'Rotation aborted: target database username not provided (set secret.username).'
    );
  }

  const { Client } = await import('pg');
  const adminClient = new Client({
    host: secret.host || process.env.DB_HOST,
    port: secret.port || parseInt(process.env.DB_PORT || '5432'),
    database: secret.dbname || process.env.DB_NAME,
    user: adminUser,
    password: secret.adminPassword || process.env.DB_ADMIN_PASSWORD,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.RDS_CA_CERT || undefined,
    },
  });

  try {
    await adminClient.connect();
    // Use parameterized query — password is passed safely via SET PASSWORD
    await adminClient.query(
      `ALTER USER ${adminClient.escapeIdentifier(dbUser)} WITH PASSWORD $1`,
      [secret.password]
    );
    console.log(`Database password rotated for user: ${dbUser}`);
  } finally {
    await adminClient.end();
  }
}

async function testDatabaseConnection(
  secret: Record<string, any>,
  _metadata: SecretMetadata
): Promise<void> {
  if (!secret.password || secret.password.length < 16) {
    throw new Error('Invalid database password');
  }
  if (!secret.username) {
    throw new Error(
      'Rotation test aborted: target database username not provided (set secret.username).'
    );
  }

  const { Client } = await import('pg');
  const client = new Client({
    host: secret.host || process.env.DB_HOST,
    port: secret.port || parseInt(process.env.DB_PORT || '5432'),
    database: secret.dbname || process.env.DB_NAME,
    user: secret.username,
    password: secret.password,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.RDS_CA_CERT || undefined,
    },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    console.log('Database connection test passed');
  } finally {
    await client.end();
  }
}

function testJwtSecret(secret: Record<string, any>): void {
  if (!secret.secret || secret.secret.length < 64) {
    throw new Error('JWT secret too short');
  }
  if (!secret.refreshSecret || secret.refreshSecret.length < 64) {
    throw new Error('JWT refresh secret too short');
  }
}

function testApiKey(secret: Record<string, any>): void {
  if (!secret.key || !secret.key.startsWith('sk_')) {
    throw new Error('Invalid API key format');
  }
}

function testEncryptionKey(secret: Record<string, any>): void {
  if (!secret.key || secret.key.length !== 64) {
    throw new Error('Encryption key must be 64 hex characters (256 bits)');
  }
}

export default { handler };
