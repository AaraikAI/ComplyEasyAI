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

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = 'enc_v1:';

/**
 * Derive a 32-byte encryption key from the configured ENCRYPTION_KEY
 * using PBKDF2 with a fixed salt (key is already high entropy).
 */
function deriveKey(): Buffer {
  const rawKey = config.encryption.key;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is not configured');
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
 * Encrypt a plaintext string value.
 * Returns a prefixed string: enc_v1:<iv>:<authTag>:<ciphertext>
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (plaintext.startsWith(ENCRYPTED_PREFIX)) return plaintext; // Already encrypted

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string value.
 * If the value is not encrypted (no prefix), returns it as-is for backward compatibility.
 */
export function decryptField(encryptedValue: string): string {
  if (!encryptedValue) return encryptedValue;
  if (!encryptedValue.startsWith(ENCRYPTED_PREFIX)) return encryptedValue; // Not encrypted, return as-is

  try {
    const key = getKey();
    const parts = encryptedValue.slice(ENCRYPTED_PREFIX.length).split(':');
    if (parts.length !== 3) {
      logger.warn('Invalid encrypted field format, returning as-is');
      return encryptedValue;
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    logger.error('Failed to decrypt field:', error.message);
    throw new Error('Credential decryption failed - check ENCRYPTION_KEY');
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
