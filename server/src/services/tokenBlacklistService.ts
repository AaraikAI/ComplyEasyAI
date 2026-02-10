/**
 * JWT Token Blacklist Service
 *
 * Maintains a blacklist of revoked JWT tokens using the cache layer
 * (Redis in production, in-memory fallback for development).
 *
 * Tokens are blacklisted on logout and checked during authentication.
 * Each blacklist entry auto-expires when the original token would have expired,
 * preventing unbounded growth of the blacklist.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import cacheService from './cache/redisCacheService';

const BLACKLIST_NAMESPACE = 'token-blacklist';

/**
 * Compute a SHA-256 hash of the token for storage.
 * We store the hash rather than the raw token to avoid
 * keeping valid credentials in the cache layer.
 */
function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Parse a JWT's remaining TTL in seconds from its `exp` claim.
 * Returns 0 if the token is already expired or un-parseable.
 */
function remainingTtl(token: string): number {
  try {
    // Decode without verification — we just need the exp claim
    const payload = jwt.decode(token) as { exp?: number } | null;
    if (!payload?.exp) return 0;
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

class TokenBlacklistService {
  /**
   * Add a token to the blacklist.
   * The entry lives until the token's original expiry so it
   * doesn't accumulate indefinitely.
   *
   * @param token  The raw JWT string
   * @param reason Why the token was revoked (for logging)
   */
  async revoke(token: string, reason: string = 'logout'): Promise<void> {
    const ttl = remainingTtl(token);
    if (ttl <= 0) {
      // Token already expired — no need to blacklist
      return;
    }

    const hash = tokenHash(token);
    await cacheService.set(
      `blacklist:${hash}`,
      { revokedAt: Date.now(), reason },
      { ttl, namespace: BLACKLIST_NAMESPACE }
    );

    logger.info(`[TokenBlacklist] Token revoked (reason=${reason}, ttl=${ttl}s)`);
  }

  /**
   * Check whether a token has been revoked.
   *
   * @param token The raw JWT string
   * @returns true if the token is blacklisted
   */
  async isRevoked(token: string): Promise<boolean> {
    const hash = tokenHash(token);
    const entry = await cacheService.get(
      `blacklist:${hash}`,
      { namespace: BLACKLIST_NAMESPACE }
    );
    return entry !== null;
  }

  /**
   * Revoke all tokens for a user by storing a "revoke-all" timestamp.
   * Any token issued before this timestamp will be rejected.
   *
   * @param userId  The user whose tokens should be revoked
   * @param maxTtl  Maximum TTL in seconds (defaults to 7 days — the default token expiry)
   */
  async revokeAllForUser(userId: string, maxTtl: number = 7 * 24 * 3600): Promise<void> {
    await cacheService.set(
      `revoke-all:${userId}`,
      { revokedAt: Math.floor(Date.now() / 1000) },
      { ttl: maxTtl, namespace: BLACKLIST_NAMESPACE }
    );

    logger.info(`[TokenBlacklist] All tokens revoked for user ${userId}`);
  }

  /**
   * Check whether a token was issued before a user-level revoke-all.
   *
   * @param token   The raw JWT string
   * @param userId  The user ID from the token payload
   * @returns true if the token was issued before the revoke-all timestamp
   */
  async isRevokedByUserReset(token: string, userId: string): Promise<boolean> {
    const entry = await cacheService.get<{ revokedAt: number }>(
      `revoke-all:${userId}`,
      { namespace: BLACKLIST_NAMESPACE }
    );
    if (!entry) return false;

    try {
      const payload = jwt.decode(token) as { iat?: number } | null;
      if (!payload?.iat) return true; // No iat claim — treat as revoked
      return payload.iat < entry.revokedAt;
    } catch {
      return true;
    }
  }
}

export default new TokenBlacklistService();
