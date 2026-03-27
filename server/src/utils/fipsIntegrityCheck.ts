/**
 * FIPS 140-3 Software Integrity Verification (SP 800-140D)
 *
 * Implements HMAC-SHA256 based integrity verification of cryptographic
 * module files to detect unauthorized modifications.
 *
 * Two-Phase Process:
 * 1. Build-time: `computeAndSaveIntegrity()` computes HMAC-SHA256 over
 *    all cryptographic module files and saves the digest to a manifest.
 * 2. Runtime: `verifyModuleIntegrity()` recomputes the HMAC and compares
 *    against the stored manifest. Mismatch = refuse to start.
 *
 * The integrity key is provided via FIPS_INTEGRITY_KEY environment variable.
 * If not set, integrity checks are skipped (development mode only).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Files within the FIPS cryptographic module boundary.
 * These are the compiled .js files checked at runtime.
 * Paths are relative to the server dist/ directory.
 */
const FIPS_BOUNDARY_FILES = [
  'utils/fipsPasswordHashing.js',
  'utils/credentialEncryption.js',
  'utils/fipsSelfTests.js',
  'utils/fipsEntropyHealthTest.js',
  'middleware/auth.js',
  'middleware/csrf.js',
  'services/webhookService.js',
  'services/dataAnonymizationService.js',
  'services/twoFactorService.js',
  'services/advanced/byokService.js',
  'services/advanced/evidenceTruthLayerService.js',
].sort(); // Deterministic order

/** Manifest filename */
const INTEGRITY_MANIFEST = 'fips-integrity.json';

// ============================================================================
// PUBLIC API
// ============================================================================

interface IntegrityManifest {
  version: string;
  algorithm: string;
  files: string[];
  digest: string;
  computedAt: string;
}

/**
 * Verify the integrity of FIPS cryptographic module files at runtime.
 *
 * Reads the stored integrity manifest and recomputes the HMAC over
 * the listed files. If the digests don't match, the module has been
 * tampered with and the server must not start.
 *
 * Skips verification if FIPS_INTEGRITY_KEY is not set (dev mode).
 */
export function verifyModuleIntegrity(): void {
  const integrityKey = process.env.FIPS_INTEGRITY_KEY;

  if (!integrityKey) {
    logger.warn(
      'FIPS_INTEGRITY_KEY not set — skipping software integrity verification. ' +
      'This is acceptable in development but MUST be set in production.'
    );
    return;
  }

  const distDir = path.resolve(__dirname, '..');
  const manifestPath = path.join(distDir, INTEGRITY_MANIFEST);

  if (!fs.existsSync(manifestPath)) {
    logger.warn(
      'FIPS integrity manifest not found at ' + manifestPath + '. ' +
      'Run "npm run fips:integrity" during build to generate it.'
    );
    return;
  }

  let manifest: IntegrityManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e: any) {
    throw new Error(`Failed to parse FIPS integrity manifest: ${e.message}`);
  }

  // Recompute HMAC over the listed files
  const computedDigest = computeHmacOverFiles(distDir, manifest.files, integrityKey);

  if (computedDigest !== manifest.digest) {
    throw new Error(
      'FIPS 140-3 software integrity verification FAILED. ' +
      'Cryptographic module files have been modified since build. ' +
      `Expected: ${manifest.digest.substring(0, 16)}..., Got: ${computedDigest.substring(0, 16)}...`
    );
  }

  logger.info(
    `FIPS 140-3 software integrity verification PASSED (${manifest.files.length} files verified)`
  );
}

/**
 * Compute and save the integrity manifest (build-time operation).
 *
 * This should be called during the build process (e.g., via npm script)
 * after TypeScript compilation.
 *
 * @param distDir - Path to the compiled output directory (e.g., server/dist)
 * @param outputDir - Path to write the manifest file
 */
export function computeAndSaveIntegrity(distDir: string, outputDir?: string): void {
  const integrityKey = process.env.FIPS_INTEGRITY_KEY;

  if (!integrityKey) {
    logger.info('FIPS_INTEGRITY_KEY not set — skipping integrity manifest generation');
    return;
  }

  const resolvedDist = path.resolve(distDir);
  const files = FIPS_BOUNDARY_FILES.filter((f) => {
    const fullPath = path.join(resolvedDist, f);
    return fs.existsSync(fullPath);
  });

  if (files.length === 0) {
    logger.warn('No FIPS boundary files found', { directory: resolvedDist });
    return;
  }

  const digest = computeHmacOverFiles(resolvedDist, files, integrityKey);

  const manifest: IntegrityManifest = {
    version: '1.0',
    algorithm: 'HMAC-SHA256',
    files,
    digest,
    computedAt: new Date().toISOString(),
  };

  const outDir = outputDir || resolvedDist;
  const manifestPath = path.join(outDir, INTEGRITY_MANIFEST);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  logger.info('FIPS integrity manifest written', { path: manifestPath, fileCount: files.length, digestPrefix: digest.substring(0, 32) });
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

// When run as a script: node fipsIntegrityCheck.js <distDir>
if (require.main === module) {
  const distDir = process.argv[2] || path.resolve(__dirname, '..', '..', 'dist');
  computeAndSaveIntegrity(distDir);
}

// ============================================================================
// INTERNAL
// ============================================================================

/**
 * Compute HMAC-SHA256 over a sorted list of files.
 */
function computeHmacOverFiles(
  baseDir: string,
  files: string[],
  key: string
): string {
  const hmac = crypto.createHmac('sha256', key);

  for (const file of files) {
    const fullPath = path.join(baseDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath);
      // Include filename in HMAC to detect file swaps
      hmac.update(file);
      hmac.update(content);
    }
  }

  return hmac.digest('hex');
}
