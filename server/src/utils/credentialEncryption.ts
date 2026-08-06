/**
 * Field-Level Credential Encryption
 *
 * Provides AES-256-GCM encryption/decryption for sensitive fields
 * stored in the database (OAuth tokens, API keys, credentials).
 * Uses the ENCRYPTION_KEY from environment configuration.
 *
 * Encrypted values are stored as: enc_v1:<iv>:<authTag>:<ciphertext>
 * All components are base64-encoded for safe storage in text columns.
 */

import crypto from 'crypto';
import config from '../config';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
/** Legacy envelope: PBKDF2 with a fixed, publicly known salt. Read-only. */
const ENCRYPTED_PREFIX = 'enc_v1:';
/** Current envelope: HKDF with a random per-record salt carried in the value. */
const ENCRYPTED_PREFIX_V2 = 'enc_v2:';
const SALT_LENGTH = 16;
const HKDF_INFO = Buffer.from('complyeasy-field-encryption-v2');

/**
 * Derive a 32-byte encryption key from the configured ENCRYPTION_KEY
 * using PBKDF2 with a fixed salt (key is already high entropy).
 */
function deriveKey(): Buffer {
  const rawKey = config.encryption.key;
  if (!rawKey) {
    throw new AppError('ENCRYPTION_KEY is not configured', 500);
  }
  return crypto.pbkdf2Sync(rawKey, 'complyeasy-credential-salt', 100000, 32, 'sha256');
}

let _derivedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!_derivedKey) {
    _derivedKey = deriveKey();
  }
  return _derivedKey;
}

/**
 * FIPS 140-3 key zeroization: destroy the cached derived key.
 * Call during graceful shutdown to clear key material from memory.
 */
export function destroyKey(): void {
  if (_derivedKey) {
    _derivedKey.fill(0);
    _derivedKey = null;
  }
}

/**
 * Derive a per-record key with HKDF-SHA256 (NIST SP 800-56C).
 *
 * v1 used PBKDF2 with the literal salt 'complyeasy-credential-salt', published
 * in this repository. Two things were wrong with that. The salt being public
 * meant the derivation had no secret input beyond the key itself; and PBKDF2's
 * 100k iterations exist to stretch LOW-entropy passwords, which buys nothing
 * for a 256-bit random key while costing ~100ms per operation — prohibitive
 * once the salt is per-record.
 *
 * HKDF is the correct primitive for high-entropy input keying material: it is
 * fast enough to run per record, and a random per-record salt means two
 * identical plaintexts no longer share a key.
 *
 * Note honestly what this does NOT do: because the salt is stored beside the
 * ciphertext, it offers no protection against disclosure of ENCRYPTION_KEY
 * itself. Defending against that needs the key to stop living in the process —
 * i.e. envelope encryption with a KMS data key.
 */
function deriveKeyV2(salt: Buffer): Buffer {
  const rawKey = config.encryption.key;
  if (!rawKey) {
    throw new AppError('ENCRYPTION_KEY is not configured', 500);
  }
  return Buffer.from(
    crypto.hkdfSync('sha256', Buffer.from(rawKey, 'utf8'), salt, HKDF_INFO, 32) as ArrayBuffer,
  );
}

/**
 * Encrypt a plaintext string value.
 * Returns a prefixed string: enc_v2:<salt>:<iv>:<authTag>:<ciphertext>
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  // Already encrypted under either envelope version.
  if (plaintext.startsWith(ENCRYPTED_PREFIX) || plaintext.startsWith(ENCRYPTED_PREFIX_V2)) {
    return plaintext;
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKeyV2(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX_V2}${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string value.
 * If the value is not encrypted (no prefix), returns it as-is for backward compatibility.
 */
export function decryptField(encryptedValue: string): string {
  if (!encryptedValue) return encryptedValue;

  const isV2 = encryptedValue.startsWith(ENCRYPTED_PREFIX_V2);
  const isV1 = encryptedValue.startsWith(ENCRYPTED_PREFIX);
  if (!isV1 && !isV2) return encryptedValue; // Not encrypted, return as-is

  try {
    // v1 values carry no salt and use the legacy fixed-salt PBKDF2 key; v2
    // values carry their own salt. Both are readable so a rollout does not
    // require rewriting every row before it can serve traffic.
    const prefix = isV2 ? ENCRYPTED_PREFIX_V2 : ENCRYPTED_PREFIX;
    const parts = encryptedValue.slice(prefix.length).split(':');
    const expected = isV2 ? 4 : 3;
    if (parts.length !== expected) {
      logger.warn('Invalid encrypted field format, returning as-is');
      return encryptedValue;
    }

    const [saltB64, ivB64, authTagB64, ciphertextB64] = isV2
      ? parts
      : ([undefined, ...parts] as [undefined, string, string, string]);

    const key = isV2 ? deriveKeyV2(Buffer.from(saltB64 as string, 'base64')) : getKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    logger.error('Failed to decrypt field:', error.message);
    throw new AppError('Credential decryption failed - check ENCRYPTION_KEY', 500);
  }
}

/**
 * Encrypt sensitive fields in a JSON config object.
 * Targets known sensitive keys: accessKeyId, secretAccessKey, sessionToken,
 * api_key, apiKey, token, secret, password, credentials.
 */
const SENSITIVE_CONFIG_KEYS = new Set([
  'accessKeyId',
  'secretAccessKey',
  'sessionToken',
  'api_key',
  'apiKey',
  'token',
  'secret',
  'password',
  'credentials',
  'client_secret',
  'private_key',
]);

export function encryptConfigFields(configObj: any): any {
  if (!configObj || typeof configObj !== 'object') return configObj;

  const encrypted = { ...configObj };
  for (const [key, value] of Object.entries(encrypted)) {
    if (typeof value === 'string' && SENSITIVE_CONFIG_KEYS.has(key)) {
      encrypted[key] = encryptField(value);
    }
  }
  return encrypted;
}

export function decryptConfigFields(configObj: any): any {
  if (!configObj || typeof configObj !== 'object') return configObj;

  const decrypted = { ...configObj };
  for (const [key, value] of Object.entries(decrypted)) {
    if (typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX)) {
      decrypted[key] = decryptField(value);
    }
  }
  return decrypted;
}

/**
 * Encrypt sensitive fields of a config object before persistence. Targets the known
 * SENSITIVE_CONFIG_KEYS plus any config-specific secret key names passed in
 * `extraFields` (e.g. 'webhookSecret', 'scimToken', 'signingSecret'). Idempotent —
 * already-encrypted values are passed through unchanged by encryptField.
 */
export function encryptConfigSecrets(configObj: any, extraFields: string[] = []): any {
  if (!configObj || typeof configObj !== 'object') return configObj;

  const targets = new Set<string>([...SENSITIVE_CONFIG_KEYS, ...extraFields]);
  const encrypted = { ...configObj };
  for (const [key, value] of Object.entries(encrypted)) {
    if (typeof value === 'string' && value && targets.has(key)) {
      encrypted[key] = encryptField(value);
    }
  }
  return encrypted;
}

/** Inverse of encryptConfigSecrets — decrypts any prefixed values regardless of key name. */
export function decryptConfigSecrets(configObj: any, extraFields: string[] = []): any {
  if (!configObj || typeof configObj !== 'object') return configObj;

  const targets = new Set<string>([...SENSITIVE_CONFIG_KEYS, ...extraFields]);
  const decrypted = { ...configObj };
  for (const [key, value] of Object.entries(decrypted)) {
    if (
      typeof value === 'string' &&
      value.startsWith(ENCRYPTED_PREFIX) &&
      (targets.has(key) || extraFields.length === 0)
    ) {
      decrypted[key] = decryptField(value);
    }
  }
  return decrypted;
}
