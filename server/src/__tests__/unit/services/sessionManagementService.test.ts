/**
 * Session Management Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Add missing auditLog.updateMany to prismaMock
const createMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;
(prismaMock.auditLog as any).updateMany = createMockFn();

// Mock the database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: () => 'abcd1234',
  }),
}));

// Import after mocking
import sessionManagementService from '../../../services/sessionManagementService';

describe('SessionManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-set crypto mock that gets cleared by resetMocks: true in jest config
    // Use a counter so each call returns a unique value (needed since Date.now() is frozen by fake timers)
    let cryptoCallCount = 0;
    const crypto = require('crypto');
    (crypto.randomBytes as jest.Mock<any>).mockImplementation(() => ({
      toString: () => `mock${String(cryptoCallCount++).padStart(8, '0')}`,
    }));
    // Use fake timers for session expiry tests
    jest.useFakeTimers({ now: new Date('2025-06-01T12:00:00Z') });
    // Reset internal state by terminating all sessions
    // We access private fields via casting for test cleanup
    (sessionManagementService as any).activeSessions = new Map();
    (sessionManagementService as any).userSessions = new Map();
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionManagementService.shutdown();
  });

  // ======================================================================
  // createSession
  // ======================================================================
  describe('createSession()', () => {
    it('should create a new session and store in database', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession(
        'user-123',
        'org-123',
        'token-abc',
        'refresh-token-xyz',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Jest/1.0',
          deviceInfo: { type: 'desktop', os: 'Linux', browser: 'Chrome' },
        }
      );

      expect(result.session).toHaveProperty('id');
      expect(result.session.userId).toBe('user-123');
      expect(result.session.organizationId).toBe('org-123');
      expect(result.session.token).toBe('token-abc');
      expect(result.session.refreshToken).toBe('refresh-token-xyz');
      expect(result.session.ipAddress).toBe('127.0.0.1');
      expect(result.session.userAgent).toBe('Jest/1.0');
      expect(result.session.timeoutWarningSent).toBe(false);
      expect(result.existingSessionsTerminated).toBeUndefined();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'session.created',
            userId: 'user-123',
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should enforce concurrent session limit (FIFO eviction)', async () => {
      // Set maxConcurrentSessions to 2
      (sessionManagementService as any).config.maxConcurrentSessions = 2;
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      // Create 2 sessions
      await sessionManagementService.createSession('user-123', 'org-123', 'token-1');
      await sessionManagementService.createSession('user-123', 'org-123', 'token-2');

      // Third session should evict the oldest
      const result = await sessionManagementService.createSession('user-123', 'org-123', 'token-3');

      expect(result.existingSessionsTerminated).toBe(1);
      const activeSessions = sessionManagementService.getActiveSessions('user-123');
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.find(s => s.token === 'token-1')).toBeUndefined();
      expect(activeSessions.find(s => s.token === 'token-2')).toBeDefined();
      expect(activeSessions.find(s => s.token === 'token-3')).toBeDefined();

      // Reset config
      (sessionManagementService as any).config.maxConcurrentSessions = 5;
    });

    it('should create session without metadata', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-456', 'org-456', 'token-no-meta');

      expect(result.session.ipAddress).toBeUndefined();
      expect(result.session.userAgent).toBeUndefined();
      expect(result.session.deviceInfo).toBeUndefined();
    });

    it('should set session expiration based on config timeout', async () => {
      (sessionManagementService as any).config.sessionTimeout = 7200000; // 2 hours
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-789', 'org-789', 'token-exp');

      const expectedExpiry = new Date(Date.now() + 7200000);
      expect(result.session.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);

      // Reset
      (sessionManagementService as any).config.sessionTimeout = 3600000;
    });

    it('should emit sessionCreated event', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);
      const listener = jest.fn();
      sessionManagementService.on('sessionCreated', listener);

      await sessionManagementService.createSession('user-event', 'org-event', 'token-event');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-event',
          organizationId: 'org-event',
        })
      );

      sessionManagementService.removeListener('sessionCreated', listener);
    });
  });

  // ======================================================================
  // getActiveSessions
  // ======================================================================
  describe('getActiveSessions()', () => {
    it('should return all active sessions for a user', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.createSession('user-multi', 'org-1', 'token-a');
      await sessionManagementService.createSession('user-multi', 'org-1', 'token-b');

      const sessions = sessionManagementService.getActiveSessions('user-multi');

      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.token).sort()).toEqual(['token-a', 'token-b']);
    });

    it('should return empty array for user with no sessions', () => {
      const sessions = sessionManagementService.getActiveSessions('user-none');

      expect(sessions).toEqual([]);
    });

    it('should not include expired sessions', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.createSession('user-exp', 'org-exp', 'token-exp');

      // Advance time past expiration
      jest.advanceTimersByTime(3700000);

      const sessions = sessionManagementService.getActiveSessions('user-exp');

      expect(sessions).toHaveLength(0);
    });
  });

  // ======================================================================
  // updateSessionActivity
  // ======================================================================
  describe('updateSessionActivity()', () => {
    it('should update lastActivityAt for active session', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);
      (prismaMock.auditLog as any).updateMany.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-activity', 'org-act', 'token-act');
      const originalActivity = result.session.lastActivityAt;

      // Advance time a bit
      jest.advanceTimersByTime(5000);

      await sessionManagementService.updateSessionActivity(result.session.id);

      const sessions = sessionManagementService.getActiveSessions('user-activity');
      expect(sessions[0].lastActivityAt.getTime()).toBeGreaterThanOrEqual(originalActivity.getTime());
    });

    it('should do nothing for non-existent session', async () => {
      // Should not throw
      await sessionManagementService.updateSessionActivity('nonexistent-session');

      expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
    });

    it('should terminate expired session on activity update', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-exp2', 'org-exp2', 'token-exp2');

      // Expire the session manually
      const session = (sessionManagementService as any).activeSessions.get(result.session.id);
      session.expiresAt = new Date(Date.now() - 1000);

      await sessionManagementService.updateSessionActivity(result.session.id);

      // Session should be terminated
      const sessions = sessionManagementService.getActiveSessions('user-exp2');
      expect(sessions).toHaveLength(0);
    });
  });

  // ======================================================================
  // terminateSession
  // ======================================================================
  describe('terminateSession()', () => {
    it('should remove session from active sessions', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-term', 'org-term', 'token-term');

      await sessionManagementService.terminateSession(result.session.id, 'manual');

      const sessions = sessionManagementService.getActiveSessions('user-term');
      expect(sessions).toHaveLength(0);
    });

    it('should emit sessionTerminated event', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);
      const listener = jest.fn();
      sessionManagementService.on('sessionTerminated', listener);

      const result = await sessionManagementService.createSession('user-term2', 'org-term2', 'token-term2');
      await sessionManagementService.terminateSession(result.session.id, 'user_logout');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'user_logout',
          session: expect.objectContaining({
            userId: 'user-term2',
          }),
        })
      );

      sessionManagementService.removeListener('sessionTerminated', listener);
    });

    it('should do nothing for non-existent session', async () => {
      await sessionManagementService.terminateSession('nonexistent', 'manual');
      // Should not throw
    });

    it('should store termination in database', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-dbterm', 'org-dbterm', 'token-dbterm');
      jest.clearAllMocks();
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.terminateSession(result.session.id, 'manual');

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'session.terminated',
          }),
        })
      );
    });

    it('should clean up user session map when last session removed', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await sessionManagementService.createSession('user-last', 'org-last', 'token-last');
      await sessionManagementService.terminateSession(result.session.id, 'manual');

      expect((sessionManagementService as any).userSessions.has('user-last')).toBe(false);
    });
  });

  // ======================================================================
  // terminateAllUserSessions
  // ======================================================================
  describe('terminateAllUserSessions()', () => {
    it('should terminate all sessions for a user', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.createSession('user-all', 'org-all', 'token-1');
      await sessionManagementService.createSession('user-all', 'org-all', 'token-2');
      await sessionManagementService.createSession('user-all', 'org-all', 'token-3');

      const count = await sessionManagementService.terminateAllUserSessions('user-all', 'password_change');

      expect(count).toBe(3);
      expect(sessionManagementService.getActiveSessions('user-all')).toHaveLength(0);
    });

    it('should return 0 when user has no sessions', async () => {
      const count = await sessionManagementService.terminateAllUserSessions('user-nosess', 'manual');

      expect(count).toBe(0);
    });
  });

  // ======================================================================
  // getSessionStatistics
  // ======================================================================
  describe('getSessionStatistics()', () => {
    it('should return correct statistics', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.createSession('user-stats1', 'org-stats', 'token-s1');
      await sessionManagementService.createSession('user-stats2', 'org-stats', 'token-s2');
      await sessionManagementService.createSession('user-stats2', 'org-stats', 'token-s3');

      const stats = sessionManagementService.getSessionStatistics('org-stats');

      expect(stats.totalActiveSessions).toBe(3);
      expect(stats.sessionsByUser).toBe(2);
      expect(stats.sessionsExpiringSoon).toBe(0);
      expect(stats.averageSessionDuration).toBeGreaterThanOrEqual(0);
    });

    it('should filter by organizationId', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.createSession('user-orgA', 'org-A', 'token-orgA');
      await sessionManagementService.createSession('user-orgB', 'org-B', 'token-orgB');

      const statsA = sessionManagementService.getSessionStatistics('org-A');
      const statsB = sessionManagementService.getSessionStatistics('org-B');

      expect(statsA.totalActiveSessions).toBe(1);
      expect(statsB.totalActiveSessions).toBe(1);
    });

    it('should return 0s when no sessions', () => {
      const stats = sessionManagementService.getSessionStatistics('org-empty');

      expect(stats.totalActiveSessions).toBe(0);
      expect(stats.sessionsByUser).toBe(0);
      expect(stats.sessionsExpiringSoon).toBe(0);
      expect(stats.averageSessionDuration).toBe(0);
    });

    it('should return all-org stats when no org specified', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await sessionManagementService.createSession('user-g1', 'org-X', 'token-g1');
      await sessionManagementService.createSession('user-g2', 'org-Y', 'token-g2');

      const stats = sessionManagementService.getSessionStatistics();

      expect(stats.totalActiveSessions).toBeGreaterThanOrEqual(2);
    });
  });

  // ======================================================================
  // initialize
  // ======================================================================
  describe('initialize()', () => {
    it('should start cleanup and warning intervals', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      await sessionManagementService.initialize();

      expect(setIntervalSpy).toHaveBeenCalledTimes(2);

      sessionManagementService.shutdown();
      setIntervalSpy.mockRestore();
    });
  });

  // ======================================================================
  // shutdown
  // ======================================================================
  describe('shutdown()', () => {
    it('should clear intervals', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await sessionManagementService.initialize();
      sessionManagementService.shutdown();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
