/**
 * FIPS 140-3 (ISO 19790) Compliant Password Hashing Utility
 *
 * Provides PBKDF2-SHA256 based password hashing that meets FIPS 140-3 requirements.
 * This module replaces bcrypt for password hashing in environments requiring
 * FIPS compliance, since bcrypt is not a FIPS-approved algorithm.
 *
 * FIPS 140-2 Compliance Details:
 * - Algorithm: PBKDF2 with HMAC-SHA256 (NIST SP 800-132 approved)
 * - Iterations: 600,000 (OWASP 2023 recommendation for PBKDF2-SHA256)
 * - Salt: 32 bytes of cryptographically secure random data via crypto.randomBytes
 * - Derived Key: 64 bytes (512 bits) for maximum collision resistance
 * - All cryptographic operations use Node.js built-in crypto module,
 *   which delegates to OpenSSL's FIPS-validated implementations
 *
 * Output Format:
 *   pbkdf2_sha256$600000$<base64_salt>$<base64_hash>
 *
 * Legacy Support:
 *   This module supports verifying passwords against legacy bcrypt hashes
 *   (prefixed with $2a$ or $2b$) for seamless migration. When a legacy hash
 *   is detected, bcryptjs is dynamically imported for verification. Use
 *   needsRehash() to identify legacy hashes that should be upgraded.
 *
 * Usage:
 *   import { hashPassword, verifyPassword, needsRehash } from './fipsPasswordHashing';
 *
 *   // Hash a new password
 *   const hash = await hashPassword('userPassword123');
 *
 *   // Verify a password (works with both PBKDF2 and legacy bcrypt)
 *   const isValid = await verifyPassword('userPassword123', storedHash);
 *
 *   // Check if hash needs rehashing (e.g., during login)
 *   if (needsRehash(storedHash)) {
 *     const newHash = await hashPassword('userPassword123');
 *     // Update stored hash in database
 *   }
 */

import crypto from 'crypto';
import logger from '../config/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

/** PBKDF2 iteration count per OWASP 2023 recommendation for SHA-256 */
const PBKDF2_ITERATIONS = 600_000;

/** Hash algorithm - SHA-256 is FIPS 140-2 approved */
const HASH_ALGORITHM = 'sha256';

/** Salt length in bytes - 32 bytes provides 256 bits of entropy */
const SALT_LENGTH = 32;

/** Derived key length in bytes - 64 bytes (512 bits) */
const KEY_LENGTH = 64;

/** Prefix for PBKDF2 hashes to identify the algorithm and parameters */
const PBKDF2_PREFIX = 'pbkdf2_sha256';

/** Delimiter used to separate hash components */
const DELIMITER = '$';

/** Prefixes that identify legacy bcrypt hashes */
const BCRYPT_PREFIXES = ['$2a$', '$2b$'];

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Hash a password using PBKDF2-SHA256 with FIPS 140-2 compliant parameters.
 *
 * Generates a cryptographically secure random salt and derives a key using
 * PBKDF2 with 600,000 iterations of HMAC-SHA256. The output includes the
 * algorithm identifier, iteration count, salt, and hash for self-contained
 * verification.
 *
 * @param password - The plaintext password to hash
 * @returns A promise resolving to the formatted hash string:
 *          pbkdf2_sha256$600000$<base64_salt>$<base64_hash>
 * @throws Error if the password is empty or if crypto operations fail
 *
 * @example
 * const hash = await hashPassword('MySecurePassword123!');
 * // => "pbkdf2_sha256$600000$abc123...=$xyz789...="
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);

  try {
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        HASH_ALGORITHM,
        (err, key) => {
          if (err) {
            reject(new Error(`PBKDF2 hashing failed: ${err.message}`));
          } else {
            resolve(key);
          }
        }
      );
    });

    const saltBase64 = salt.toString('base64');
    const hashBase64 = derivedKey.toString('base64');

    const result = [
      PBKDF2_PREFIX,
      PBKDF2_ITERATIONS.toString(),
      saltBase64,
      hashBase64,
    ].join(DELIMITER);

    // FIPS 140-3 key zeroization: clear sensitive buffers
    derivedKey.fill(0);

    return result;
  } finally {
    // FIPS 140-3 key zeroization: clear salt buffer
    salt.fill(0);
  }
}

/**
 * Verify a password against a stored hash.
 *
 * Supports both FIPS-compliant PBKDF2-SHA256 hashes and legacy bcrypt hashes.
 * For PBKDF2, uses crypto.timingSafeEqual to prevent timing side-channel attacks.
 * For legacy bcrypt, dynamically imports bcryptjs for backward compatibility.
 *
 * @param password - The plaintext password to verify
 * @param storedHash - The stored hash string to verify against
 * @returns A promise resolving to true if the password matches, false otherwise
 *
 * @example
 * // Verify against PBKDF2 hash
 * const valid = await verifyPassword('password', pbkdf2Hash);
 *
 * // Also works with legacy bcrypt hashes
 * const valid = await verifyPassword('password', '$2a$12$...');
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) {
    return false;
  }

  // Check if this is a legacy bcrypt hash
  if (isLegacyBcryptHash(storedHash)) {
    logger.warn(
      'Legacy bcrypt hash detected during verification. ' +
      'Consider rehashing with FIPS-compliant PBKDF2 on next login.'
    );
    return verifyBcryptPassword(password, storedHash);
  }

  // Verify PBKDF2 hash
  return verifyPbkdf2Password(password, storedHash);
}

/**
 * Check whether a stored hash uses a legacy format that should be upgraded.
 *
 * Returns true if the hash is a legacy bcrypt hash (prefixed with $2a$ or $2b$).
 * This should be called after successful authentication to determine if the
 * password hash needs to be rehashed with the current FIPS-compliant algorithm.
 *
 * @param storedHash - The stored hash string to check
 * @returns true if the hash uses a legacy format and should be rehashed
 *
 * @example
 * if (needsRehash(user.passwordHash)) {
 *   const newHash = await hashPassword(plaintextPassword);
 *   await updateUserPasswordHash(user.id, newHash);
 * }
 */
export function needsRehash(storedHash: string): boolean {
  if (!storedHash) {
    return true;
  }

  // Legacy bcrypt hashes need rehashing
  if (isLegacyBcryptHash(storedHash)) {
    return true;
  }

  // Check if using current PBKDF2 format with current iteration count
  const parts = storedHash.split(DELIMITER);
  if (parts.length !== 4) {
    return true;
  }

  const [algorithm, iterationsStr] = parts;
  const iterations = parseInt(iterationsStr, 10);

  // Needs rehash if algorithm or iterations don't match current settings
  if (algorithm !== PBKDF2_PREFIX || iterations < PBKDF2_ITERATIONS) {
    return true;
  }

  return false;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Determine if a hash string is a legacy bcrypt hash.
 *
 * @param hash - The hash string to check
 * @returns true if the hash is prefixed with $2a$ or $2b$
 */
function isLegacyBcryptHash(hash: string): boolean {
  return BCRYPT_PREFIXES.some((prefix) => hash.startsWith(prefix));
}

/**
 * Verify a password against a PBKDF2-SHA256 hash using timing-safe comparison.
 *
 * Parses the stored hash to extract the salt and iteration count, then
 * recomputes the PBKDF2 derivation and compares using crypto.timingSafeEqual
 * to prevent timing side-channel attacks.
 *
 * @param password - The plaintext password
 * @param storedHash - The PBKDF2 hash string in format: pbkdf2_sha256$iterations$salt$hash
 * @returns true if the password matches
 */
async function verifyPbkdf2Password(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(DELIMITER);

  if (parts.length !== 4) {
    logger.warn('Invalid PBKDF2 hash format encountered during verification');
    return false;
  }

  const [algorithm, iterationsStr, saltBase64, hashBase64] = parts;

  if (algorithm !== PBKDF2_PREFIX) {
    logger.warn(`Unknown hash algorithm: ${algorithm}`);
    return false;
  }

  const iterations = parseInt(iterationsStr, 10);
  if (isNaN(iterations) || iterations <= 0) {
    logger.warn('Invalid iteration count in stored hash');
    return false;
  }

  let salt: Buffer;
  let storedKey: Buffer;

  try {
    salt = Buffer.from(saltBase64, 'base64');
    storedKey = Buffer.from(hashBase64, 'base64');
  } catch {
    logger.warn('Failed to decode base64 components of stored hash');
    return false;
  }

  try {
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        storedKey.length,
        HASH_ALGORITHM,
        (err, key) => {
          if (err) {
            reject(err);
          } else {
            resolve(key);
          }
        }
      );
    });

    try {
      // Use timing-safe comparison to prevent timing attacks
      if (derivedKey.length !== storedKey.length) {
        return false;
      }

      return crypto.timingSafeEqual(derivedKey, storedKey);
    } finally {
      // FIPS 140-3 key zeroization
      derivedKey.fill(0);
      storedKey.fill(0);
    }
  } catch (error: any) {
    logger.error('PBKDF2 verification failed:', error.message);
    return false;
  }
}

/**
 * Verify a password against a legacy bcrypt hash.
 *
 * Dynamically imports bcryptjs to avoid requiring it as a hard dependency
 * in FIPS-compliant environments where bcrypt may not be available.
 *
 * @param password - The plaintext password
 * @param storedHash - The bcrypt hash string
 * @returns true if the password matches the bcrypt hash
 */
async function verifyBcryptPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Dynamic import to avoid hard dependency on bcryptjs in FIPS environments
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, storedHash);
  } catch (error: any) {
    logger.error(
      'Failed to verify legacy bcrypt password. ' +
      'Ensure bcryptjs is installed for backward compatibility:',
      error.message
    );
    return false;
  }
}
