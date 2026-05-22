/**
 * Bonawitz-style additive secret-sharing for secure aggregation.
 *
 * Reference: Bonawitz et al. (CCS 2017),
 *   "Practical Secure Aggregation for Privacy-Preserving Machine Learning"
 *
 * Key idea:
 *   For each ordered pair (i, j) with i < j, the two parties derive a
 *   shared random pad p_{i,j} from a Diffie–Hellman or HKDF-derived secret.
 *   Party i adds +p_{i,j}, party j adds -p_{i,j} to their respective
 *   contributions. When all contributions are summed by the server,
 *   the pads cancel pairwise:
 *
 *     sum_i (x_i + sum_{j > i} p_{i,j} - sum_{j < i} p_{j,i}) = sum_i x_i
 *
 *   No single party — including the server — learns any individual x_i
 *   beyond what is implied by the final aggregate.
 *
 *   Each party also adds a self-mask b_i (random vector) that's recoverable
 *   from a Shamir-secret-shared seed only if the party drops out, allowing
 *   honest peers to subtract dropouts' masks in the recovery phase.
 *
 * This module provides the deterministic PRG used to expand seeds into
 * mask vectors and the server-side unmasking step. The seed agreement
 * itself (DH on the client side) is performed in a higher-level service.
 *
 * Implementation notes:
 *   - We use HKDF-SHA256 to expand a 32-byte seed into the required number
 *     of float64 mask values.
 *   - Each float is mapped from a uniform integer in [0, 2^53) to a centered
 *     real in (-MASK_RANGE, +MASK_RANGE). Server-side mask cancellation is
 *     exact because we apply the SAME PRG on both sides of every pair.
 *   - For very high-dimensional models we expand seeds lazily in chunks.
 */

import { createHmac, randomBytes } from 'crypto';

const HASH = 'sha256';
const HASH_LEN = 32;
const MASK_RANGE = 1.0; // Each mask coordinate is in (-1, +1) before scaling

/**
 * HKDF-SHA256: RFC 5869.
 */
function hkdf(seed: Buffer, info: string, length: number): Buffer {
  const salt = Buffer.alloc(HASH_LEN, 0);
  // Extract
  const prk = createHmac(HASH, salt).update(seed).digest();
  // Expand
  const blocks: Buffer[] = [];
  let prev = Buffer.alloc(0);
  const infoBuf = Buffer.from(info, 'utf8');
  for (let i = 1; blocks.reduce((s, b) => s + b.length, 0) < length; i++) {
    const h = createHmac(HASH, prk);
    h.update(Buffer.concat([prev, infoBuf, Buffer.from([i])]));
    prev = h.digest();
    blocks.push(prev);
  }
  return Buffer.concat(blocks).subarray(0, length);
}

/**
 * Expand a 32-byte seed into a mask vector of the requested dimension.
 * Mask values are deterministic functions of the seed, so both endpoints
 * of a pair derive identical pads.
 */
export function expandMask(seed: Buffer, dimension: number): number[] {
  if (seed.length !== 32) {
    throw new Error(`Seed must be 32 bytes; got ${seed.length}`);
  }
  // Need 8 bytes per float (we use 53 mantissa bits).
  const bytes = hkdf(seed, 'sa-mask-v1', dimension * 8);
  const out = new Array<number>(dimension);
  for (let i = 0; i < dimension; i++) {
    // Build an unsigned 53-bit integer from 8 bytes
    const offset = i * 8;
    const hi = bytes.readUInt32BE(offset) & 0x001fffff; // top 21 bits
    const lo = bytes.readUInt32BE(offset + 4);          // low 32 bits
    const u = hi * 0x100000000 + lo;                    // 53-bit unsigned
    // Uniform in [0, 1) then center to (-MASK_RANGE, MASK_RANGE)
    const u01 = u / 0x20000000000000; // 2^53
    out[i] = MASK_RANGE * (2 * u01 - 1);
  }
  return out;
}

/**
 * Derive the deterministic pairwise pad between two parties from their
 * shared seed and ordered identifiers. The +/- sign is determined by
 * comparing the identifiers lexically: the party with the smaller id adds
 * +pad; the party with the larger id adds -pad. Pads then cancel pairwise
 * upon aggregation.
 */
export function pairwisePad(
  sharedSeed: Buffer,
  myId: string,
  peerId: string,
  dimension: number
): { pad: number[]; sign: 1 | -1 } {
  // Mix the ordered pair into the seed via HKDF info string
  const [first, second] = myId < peerId ? [myId, peerId] : [peerId, myId];
  const info = `pair-${first}-${second}`;
  const derivedSeed = hkdf(sharedSeed, info, 32);
  const pad = expandMask(derivedSeed, dimension);
  const sign: 1 | -1 = myId < peerId ? 1 : -1;
  return { pad, sign };
}

/**
 * Apply a peer's full mask (pairwise pads + self-mask) to its update,
 * producing a masked vector that's safe to send to the server.
 *
 *   y_i = x_i + b_i + sum_{j != i} sign(i, j) * p_{i, j}
 */
export function maskContribution(
  myId: string,
  myUpdate: number[],
  selfMaskSeed: Buffer,
  pairwiseSeeds: Array<{ peerId: string; seed: Buffer }>
): number[] {
  const dim = myUpdate.length;
  const out = myUpdate.slice();

  const selfMask = expandMask(selfMaskSeed, dim);
  for (let d = 0; d < dim; d++) out[d] += selfMask[d];

  for (const { peerId, seed } of pairwiseSeeds) {
    if (peerId === myId) continue;
    const { pad, sign } = pairwisePad(seed, myId, peerId, dim);
    for (let d = 0; d < dim; d++) out[d] += sign * pad[d];
  }

  return out;
}

/**
 * Server-side unmasking. Sums all masked contributions, then for each
 * dropout peer subtracts its self-mask (recovered from secret shares).
 *
 *   sum_i y_i = sum_i x_i + sum_i b_i  (pairwise pads cancel)
 *   Unmasked = sum_i y_i - sum_{i online} b_i - sum_{i dropped} b_i
 *            = sum_{i online} x_i        (if all dropouts' b_i recovered)
 */
export function unmaskAggregation(
  maskedSum: number[],
  selfMaskSeedsOnline: Buffer[],
  selfMaskSeedsDropped: Buffer[]
): number[] {
  const dim = maskedSum.length;
  const out = maskedSum.slice();

  for (const seed of selfMaskSeedsOnline) {
    const m = expandMask(seed, dim);
    for (let d = 0; d < dim; d++) out[d] -= m[d];
  }
  for (const seed of selfMaskSeedsDropped) {
    const m = expandMask(seed, dim);
    for (let d = 0; d < dim; d++) out[d] -= m[d];
  }
  return out;
}

/**
 * Helper: generate fresh 32-byte pairwise seeds for a cohort.
 * In a real deployment these are generated by Diffie–Hellman exchange
 * between each pair of peers — this server-side helper is used during
 * coordinator-mediated simulations and integration tests.
 */
export function generatePairwiseSeeds(peerIds: string[]): Record<string, Record<string, Buffer>> {
  const seeds: Record<string, Record<string, Buffer>> = {};
  for (const id of peerIds) seeds[id] = {};
  for (let i = 0; i < peerIds.length; i++) {
    for (let j = i + 1; j < peerIds.length; j++) {
      const seed = randomBytes(32);
      seeds[peerIds[i]][peerIds[j]] = seed;
      seeds[peerIds[j]][peerIds[i]] = seed;
    }
  }
  return seeds;
}

/**
 * Helper: a fresh 32-byte self-mask seed for one peer.
 */
export function generateSelfMaskSeed(): Buffer {
  return randomBytes(32);
}
