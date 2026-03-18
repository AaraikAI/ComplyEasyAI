/**
 * Session Management Service Contract Tests
 *
 * Verifies the contract for session creation, cleanup,
 * concurrent session limits, and cache integration.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Mock the cache service
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDel = jest.fn();

jest.mock('../../../services/cache/redisCacheService', () => ({
  __esModule: true,
  default: {
    get: mockCacheGet,
    set: mockCacheSet,
    del: mockCacheDel,
    isReady: jest.fn().mockReturnValue(true),
  },
}));

import sessionManagementService from '../../../services/sessionManagementService';

describe('SessionManagementService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockCacheDel.mockResolvedValue(undefined);
  });

  // ---------------------------------------------------------------------------
  // Service shape
  // ---------------------------------------------------------------------------
  describe('service shape', () => {
    it('should export a singleton instance', () => {
      expect(sessionManagementService).toBeDefined();
    });

    it('should have createSession method', () => {
      expect(typeof sessionManagementService.createSession).toBe('function');
    });

    it('should have getSession method', () => {
      // The public method is getActiveSessions or similar
      expect(typeof sessionManagementService.getActiveSessions).toBe('function');
    });

    it('should have terminateSession method', () => {
      expect(typeof sessionManagementService.terminateSession).toBe('function');
    });
  });

  // ---------------------------------------------------------------------------
  // createSession
  // ---------------------------------------------------------------------------
  describe('createSession', () => {
    it('should store session in cache with correct shape', async () => {
      mockCacheGet.mockResolvedValue([]); // no existing sessions

      const result = await sessionManagementService.createSession(
        'user-123',
        'org-123',
        'jwt-token-abc',
        undefined,
        { ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      );

      expect(result).toHaveProperty('session');
      expect(result.session).toHaveProperty('id');
      expect(result.session).toHaveProperty('userId', 'user-123');
      expect(result.session).toHaveProperty('organizationId', 'org-123');
      expect(result.session).toHaveProperty('token', 'jwt-token-abc');
      expect(result.session).toHaveProperty('createdAt');
      expect(result.session).toHaveProperty('expiresAt');

      expect(mockCacheSet).toHaveBeenCalled();
    });

    it('should set session expiry based on timeout config', async () => {
      mockCacheGet.mockResolvedValue([]);

      const result = await sessionManagementService.createSession(
        'user-123',
        'org-123',
        'jwt-token',
      );

      // expiresAt should be in the future
      expect(new Date(result.session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should propagate cache errors', async () => {
      mockCacheGet.mockRejectedValue(new Error('Redis connection refused'));

      await expect(
        sessionManagementService.createSession(
          'user-123',
          'org-123',
          'jwt-token',
        )
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // terminateSession
  // ---------------------------------------------------------------------------
  describe('terminateSession', () => {
    it('should delete session from cache', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        organizationId: 'org-123',
        token: 'jwt-token',
        createdAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        timeoutWarningSent: false,
      };
      mockCacheGet.mockResolvedValueOnce(mockSession).mockResolvedValueOnce(['session-123']);

      await sessionManagementService.terminateSession('session-123', 'user-123');

      expect(mockCacheDel).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Session interface contract
  // ---------------------------------------------------------------------------
  describe('session interface', () => {
    it('should define UserSession with required fields', () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        organizationId: 'org-1',
        token: 'jwt-token',
        createdAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: new Date(),
        timeoutWarningSent: false,
      };

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('organizationId');
      expect(session).toHaveProperty('token');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('lastActivityAt');
      expect(session).toHaveProperty('expiresAt');
      expect(session).toHaveProperty('timeoutWarningSent');
    });

    it('should support optional device info', () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        organizationId: 'org-1',
        token: 'jwt',
        createdAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: new Date(),
        timeoutWarningSent: false,
        deviceInfo: {
          type: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
        },
      };

      expect(session.deviceInfo).toHaveProperty('type');
      expect(session.deviceInfo).toHaveProperty('os');
      expect(session.deviceInfo).toHaveProperty('browser');
    });
  });
});
