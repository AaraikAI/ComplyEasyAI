/**
 * Token Blacklist Service Tests
 *
 * Tests JWT token revocation, blacklist checks, user-wide revocation,
 * and TTL-based auto-expiry of blacklist entries.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock the cache service before importing the blacklist service
const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('../../services/cache/redisCacheService', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    set: (...args: any[]) => mockSet(...args),
    initialize: jest.fn(),
  },
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import tokenBlacklist from '../../services/tokenBlacklistService';

const JWT_SECRET = 'test-secret-minimum-32-chars!!!!!!';

function createToken(
  payload: Record<string, any> = {},
  expiresIn: string | number = '1h'
): string {
  return jwt.sign(
    { userId: 'user-1', email: 'test@test.com', ...payload },
    JWT_SECRET,
    { expiresIn }
  );
}

describe('TokenBlacklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(undefined);
  });

  // ============================================================================
  // REVOKE
  // ============================================================================

  describe('revoke', () => {
    it('should store a hashed token in the cache with TTL matching remaining token lifetime', async () => {
      const token = createToken({}, '2h'); // 2 hours from now

      await tokenBlacklist.revoke(token, 'logout');

      expect(mockSet).toHaveBeenCalledTimes(1);

      const [key, value, options] = mockSet.mock.calls[0];
      expect(key).toMatch(/^blacklist:[a-f0-9]{64}$/); // SHA-256 hash
      expect(value).toEqual(expect.objectContaining({
        revokedAt: expect.any(Number),
        reason: 'logout',
      }));
      expect(options.namespace).toBe('token-blacklist');
      // TTL should be approximately 7200 seconds (2 hours), give or take a few seconds
      expect(options.ttl).toBeGreaterThan(7190);
      expect(options.ttl).toBeLessThanOrEqual(7200);
    });

    it('should not store an already-expired token', async () => {
      const token = jwt.sign(
        { userId: 'user-1' },
        JWT_SECRET,
        { expiresIn: -10 } // already expired
      );

      await tokenBlacklist.revoke(token, 'logout');

      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should accept different revocation reasons', async () => {
      const token = createToken({}, '1h');

      await tokenBlacklist.revoke(token, 'token_rotation');

      const [, value] = mockSet.mock.calls[0];
      expect(value.reason).toBe('token_rotation');
    });
  });

  // ============================================================================
  // IS REVOKED
  // ============================================================================

  describe('isRevoked', () => {
    it('should return false for a non-blacklisted token', async () => {
      mockGet.mockResolvedValue(null);

      const token = createToken();
      const result = await tokenBlacklist.isRevoked(token);

      expect(result).toBe(false);
    });

    it('should return true for a blacklisted token', async () => {
      mockGet.mockResolvedValue({ revokedAt: Date.now(), reason: 'logout' });

      const token = createToken();
      const result = await tokenBlacklist.isRevoked(token);

      expect(result).toBe(true);
    });

    it('should look up by SHA-256 hash of the token', async () => {
      const token = createToken();
      await tokenBlacklist.isRevoked(token);

      const [key, options] = mockGet.mock.calls[0];
      expect(key).toMatch(/^blacklist:[a-f0-9]{64}$/);
      expect(options.namespace).toBe('token-blacklist');
    });
  });

  // ============================================================================
  // REVOKE ALL FOR USER
  // ============================================================================

  describe('revokeAllForUser', () => {
    it('should store a revoke-all entry keyed by userId', async () => {
      await tokenBlacklist.revokeAllForUser('user-42');

      expect(mockSet).toHaveBeenCalledTimes(1);
      const [key, value, options] = mockSet.mock.calls[0];
      expect(key).toBe('revoke-all:user-42');
      expect(value.revokedAt).toBeCloseTo(Math.floor(Date.now() / 1000), -1);
      expect(options.namespace).toBe('token-blacklist');
      // Default TTL: 7 days = 604800s
      expect(options.ttl).toBe(604800);
    });

    it('should accept a custom maxTtl', async () => {
      await tokenBlacklist.revokeAllForUser('user-42', 3600);

      const [, , options] = mockSet.mock.calls[0];
      expect(options.ttl).toBe(3600);
    });
  });

  // ============================================================================
  // IS REVOKED BY USER RESET
  // ============================================================================

  describe('isRevokedByUserReset', () => {
    it('should return false when no revoke-all entry exists', async () => {
      mockGet.mockResolvedValue(null);

      const token = createToken();
      const result = await tokenBlacklist.isRevokedByUserReset(token, 'user-1');

      expect(result).toBe(false);
    });

    it('should return true when token was issued before revoke-all timestamp', async () => {
      // Token issued "now"
      const token = createToken();

      // Revoke-all set 1 second in the future
      mockGet.mockResolvedValue({
        revokedAt: Math.floor(Date.now() / 1000) + 1,
      });

      const result = await tokenBlacklist.isRevokedByUserReset(token, 'user-1');
      expect(result).toBe(true);
    });

    it('should return false when token was issued after revoke-all timestamp', async () => {
      // Token issued "now"
      const token = createToken();

      // Revoke-all set 10 seconds ago
      mockGet.mockResolvedValue({
        revokedAt: Math.floor(Date.now() / 1000) - 10,
      });

      const result = await tokenBlacklist.isRevokedByUserReset(token, 'user-1');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // INTEGRATION: REVOKE + CHECK
  // ============================================================================

  describe('Revoke then Check', () => {
    it('should correctly round-trip: revoke a token, then find it revoked', async () => {
      const token = createToken({}, '1h');

      // Simulate cache behavior: set stores, get retrieves
      let stored: any = null;
      mockSet.mockImplementation(async (_key: any, value: any) => {
        stored = value;
      });
      mockGet.mockImplementation(async () => stored);

      await tokenBlacklist.revoke(token, 'logout');
      const result = await tokenBlacklist.isRevoked(token);

      expect(result).toBe(true);
    });
  });
});
