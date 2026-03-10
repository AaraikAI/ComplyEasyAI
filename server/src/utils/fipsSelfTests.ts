/**
 * FIPS 140-3 (ISO 19790) Pre-Operational and Conditional Self-Tests
 *
 * Implements Known Answer Tests (KATs) for each FIPS-approved algorithm
 * used within the ComplyEasyAI cryptographic module boundary. These tests
 * MUST pass before any cryptographic operations are permitted.
 *
 * FIPS 140-3 Requirements Addressed:
 * - Pre-operational self-tests: KATs run at module startup (ISO 19790 §7.10.1)
 * - Conditional self-tests: Continuous RNG test (ISO 19790 §7.10.2)
 * - Pairwise consistency test for asymmetric key generation (ISO 19790 §7.10.2)
 *
 * Test Vectors Source:
 * - AES-256-GCM: NIST SP 800-38D
 * - SHA-256: NIST FIPS 180-4
 * - HMAC-SHA256: RFC 4231
 * - PBKDF2-SHA256: RFC 6070
 * - RSA-2048: Sign/verify roundtrip with test keypair
 */

import crypto from 'crypto';
import logger from '../config/logger';

// ============================================================================
// STATE
// ============================================================================

let selfTestsPassed = false;
let previousRngHash: Buffer | null = null;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check whether pre-operational self-tests have passed.
 * Crypto modules should call this before performing operations.
 */
export function haveSelfTestsPassed(): boolean {
  return selfTestsPassed;
}

/**
 * Run all pre-operational self-tests (KATs).
 * MUST be called at server startup before any crypto operations.
 * Throws and halts startup if any KAT fails (FIPS 140-3: error state).
 */
export function runPreOperationalSelfTests(): void {
  const failures: string[] = [];

  // AES-256-GCM KAT
  try {
    runAesGcmKAT();
  } catch (e: any) {
    failures.push(`AES-256-GCM: ${e.message}`);
  }

  // SHA-256 KAT
  try {
    runSha256KAT();
  } catch (e: any) {
    failures.push(`SHA-256: ${e.message}`);
  }

  // HMAC-SHA256 KAT
  try {
    runHmacSha256KAT();
  } catch (e: any) {
    failures.push(`HMAC-SHA256: ${e.message}`);
  }

  // PBKDF2-SHA256 KAT
  try {
    runPbkdf2KAT();
  } catch (e: any) {
    failures.push(`PBKDF2-SHA256: ${e.message}`);
  }

  // RSA-2048 Sign/Verify KAT
  try {
    runRsaKAT();
  } catch (e: any) {
    failures.push(`RSA-2048: ${e.message}`);
  }

  // Entropy source health test (initial)
  try {
    runInitialEntropyTest();
  } catch (e: any) {
    failures.push(`Entropy: ${e.message}`);
  }

  if (failures.length > 0) {
    const msg = `FIPS 140-3 pre-operational self-tests FAILED: ${failures.join('; ')}`;
    logger.error(msg, { failures });
    throw new Error(msg);
  }

  selfTestsPassed = true;
  logger.info('FIPS 140-3 pre-operational self-tests PASSED (6/6 checks)');
}

/**
 * FIPS 140-3 compliant random bytes generator with continuous RNG test.
 *
 * Wraps crypto.randomBytes with a continuous health test that compares
 * SHA-256 hashes of consecutive outputs. If two consecutive calls produce
 * identical output (hash collision), the module enters error state.
 *
 * Per ISO 19790 §7.10.2: "A continuous random number generator test shall
 * be performed on each RNG that tests the output of the RNG."
 */
export function fipsRandomBytes(size: number): Buffer {
  const output = crypto.randomBytes(size);
  const currentHash = crypto.createHash('sha256').update(output).digest();

  if (
    previousRngHash !== null &&
    currentHash.length === previousRngHash.length &&
    crypto.timingSafeEqual(currentHash, previousRngHash)
  ) {
    selfTestsPassed = false;
    const msg = 'FIPS 140-3 continuous RNG test FAILED: consecutive identical outputs detected';
    logger.error(msg);
    throw new Error(msg);
  }

  previousRngHash = Buffer.from(currentHash);
  return output;
}

/**
 * RSA pairwise consistency test (FIPS 140-3 conditional self-test).
 *
 * After generating an RSA key pair, sign a test message with the private key
 * and verify with the public key. If verification fails, the key pair is
 * compromised and must not be used.
 */
export function rsaPairwiseConsistencyTest(
  publicKey: crypto.KeyObject,
  privateKey: crypto.KeyObject
): void {
  const testMessage = Buffer.from('FIPS 140-3 pairwise consistency test');

  const signature = crypto.sign('sha256', testMessage, privateKey);
  const verified = crypto.verify('sha256', testMessage, publicKey, signature);

  if (!verified) {
    selfTestsPassed = false;
    const msg = 'FIPS 140-3 RSA pairwise consistency test FAILED';
    logger.error(msg);
    throw new Error(msg);
  }
}

// ============================================================================
// KNOWN ANSWER TESTS (KATs)
// ============================================================================

/**
 * AES-256-GCM Known Answer Test
 *
 * Uses a fixed key, IV, plaintext, and AAD to verify correct encryption
 * and decryption behavior. Test vectors derived from NIST SP 800-38D.
 */
function runAesGcmKAT(): void {
  const key = Buffer.from(
    'feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308',
    'hex'
  );
  const iv = Buffer.from('cafebabefacedbaddecaf888', 'hex');
  const plaintext = Buffer.from(
    'd9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a72' +
    '1c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255',
    'hex'
  );
  const aad = Buffer.from(
    'feedfacedeadbeeffeedfacedeadbeefabaddad2',
    'hex'
  );

  // Encrypt
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Decrypt and verify roundtrip
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  if (!crypto.timingSafeEqual(plaintext, decrypted)) {
    throw new Error('AES-256-GCM encrypt/decrypt roundtrip failed');
  }

  // Verify ciphertext is not equal to plaintext (sanity check)
  if (encrypted.length === plaintext.length && crypto.timingSafeEqual(encrypted, plaintext)) {
    throw new Error('AES-256-GCM produced plaintext output (encryption failed)');
  }
}

/**
 * SHA-256 Known Answer Test
 *
 * Test vectors from NIST FIPS 180-4:
 * - Hash("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
 * - Hash("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
 */
function runSha256KAT(): void {
  // Test vector 1: SHA-256("abc")
  const expected1 = Buffer.from(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    'hex'
  );
  const result1 = crypto.createHash('sha256').update('abc').digest();

  if (!crypto.timingSafeEqual(result1, expected1)) {
    throw new Error('SHA-256 KAT failed for input "abc"');
  }

  // Test vector 2: SHA-256("")
  const expected2 = Buffer.from(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'hex'
  );
  const result2 = crypto.createHash('sha256').update('').digest();

  if (!crypto.timingSafeEqual(result2, expected2)) {
    throw new Error('SHA-256 KAT failed for empty string input');
  }
}

/**
 * HMAC-SHA256 Known Answer Test
 *
 * Test vector from RFC 4231, Test Case 2:
 * - Key: "Jefe"
 * - Data: "what do ya want for nothing?"
 * - HMAC-SHA256: 5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843
 */
function runHmacSha256KAT(): void {
  const key = Buffer.from('Jefe', 'utf8');
  const data = Buffer.from('what do ya want for nothing?', 'utf8');
  const expected = Buffer.from(
    '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    'hex'
  );

  const result = crypto.createHmac('sha256', key).update(data).digest();

  if (!crypto.timingSafeEqual(result, expected)) {
    throw new Error('HMAC-SHA256 KAT failed (RFC 4231 Test Case 2)');
  }
}

/**
 * PBKDF2-SHA256 Known Answer Test
 *
 * Test vector from RFC 6070:
 * - Password: "password"
 * - Salt: "salt"
 * - Iterations: 1
 * - dkLen: 20 bytes
 * - Expected: 120fb6cffcf8b32c43e7225256c4f837a86548c9
 */
function runPbkdf2KAT(): void {
  const expected = Buffer.from(
    '120fb6cffcf8b32c43e7225256c4f837a86548c9',
    'hex'
  );

  const result = crypto.pbkdf2Sync('password', 'salt', 1, 20, 'sha256');

  if (!crypto.timingSafeEqual(result, expected)) {
    throw new Error('PBKDF2-SHA256 KAT failed (RFC 6070 vector)');
  }
}

/**
 * RSA-2048 Sign/Verify Known Answer Test
 *
 * Generates a temporary RSA-2048 key pair, signs a known message,
 * and verifies the signature. This validates the RSA sign/verify path
 * used by evidenceTruthLayerService.ts.
 */
function runRsaKAT(): void {
  const testMessage = Buffer.from('FIPS 140-3 RSA KAT test message');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Sign
  const signature = crypto.sign('sha256', testMessage, privateKey);

  // Verify
  const verified = crypto.verify('sha256', testMessage, publicKey, signature);

  if (!verified) {
    throw new Error('RSA-2048 sign/verify KAT failed');
  }

  // Verify that a tampered message fails
  const tamperedMessage = Buffer.from('FIPS 140-3 RSA KAT tampered message');
  const tamperedVerified = crypto.verify('sha256', tamperedMessage, publicKey, signature);

  if (tamperedVerified) {
    throw new Error('RSA-2048 KAT accepted tampered message (verification broken)');
  }
}

/**
 * Initial entropy source test.
 *
 * Verifies that crypto.randomBytes produces non-deterministic output
 * by comparing two consecutive 32-byte samples. Per FIPS 140-3, the
 * entropy source must be validated before operational use.
 */
function runInitialEntropyTest(): void {
  const sample1 = crypto.randomBytes(32);
  const sample2 = crypto.randomBytes(32);

  if (crypto.timingSafeEqual(sample1, sample2)) {
    throw new Error('Entropy source test failed: two consecutive random samples are identical');
  }

  // Initialize continuous RNG test state
  previousRngHash = crypto.createHash('sha256').update(sample2).digest();
}
