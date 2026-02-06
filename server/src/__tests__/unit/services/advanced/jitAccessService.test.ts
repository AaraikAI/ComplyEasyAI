/**
 * JIT Access Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import jitAccessService from '../../../../services/advanced/jitAccessService';

describe('JITAccessService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  describe('requestAccess()', () => {
    it('should create access request', async () => {
      const mockRequest = {
        id: 'req-123',
        userId: 'user-1',
        organizationId: 'org-1',
        requestedPrivilege: 'admin' as const,
        reason: 'incident_response' as const,
        justification: 'Need to investigate security incident',
        duration: 60,
        status: 'pending' as const,
        createdAt: new Date(),
      };

      prismaMock.jITAccessRequest.create.mockResolvedValue(mockRequest);

      const result = await jitAccessService.requestAccess(
        'user-1',
        'org-1',
        'admin',
        'incident_response',
        'Need to investigate security incident',
        60
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', 'user-1');
      expect(result).toHaveProperty('requestedPrivilege', 'admin');
      expect(result).toHaveProperty('status', 'pending');
    });

    it('should reject invalid reason for privilege level', async () => {
      await expect(
        jitAccessService.requestAccess(
          'user-1',
          'org-1',
          'super_admin',
          'data_access_request', // Invalid reason for super_admin
          'Test',
          60
        )
      ).rejects.toThrow();
    });
  });

  describe('approveAccess()', () => {
    it('should approve access request', async () => {
      // Mock getAccessRequest - returns pending request found via auditLog.findMany
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'log-1',
          action: 'JIT Access Request: admin',
          userId: 'user-1',
          organizationId: 'org-1',
          timestamp: new Date(),
          details: JSON.stringify({
            requestId: 'req-123',
            privilege: 'admin',
            reason: 'incident_response',
            justification: 'Test',
            duration: 60,
            status: 'pending',
          }),
        },
      ]);

      // Mock user.findUnique to verify approver is admin
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'approver-1',
        role: 'admin',
        email: 'admin@test.com',
      });

      const result = await jitAccessService.approveAccess(
        'req-123',
        'approver-1',
        'org-1'
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('active', true);
    });
  });

  describe('revokeAccess()', () => {
    it('should revoke active access session', async () => {
      const mockSession = {
        id: 'session-123',
        requestId: 'req-123',
        userId: 'user-1',
        organizationId: 'org-1',
        privilege: 'admin' as const,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        extendedCount: 0,
        actionsPerformed: [],
        active: true,
      };

      // Mock the activeSessions map
      (jitAccessService as any).activeSessions = new Map([
        ['session-123', mockSession]
      ]);

      await jitAccessService.revokeSession('session-123', 'Test revocation');

      const sessions = (jitAccessService as any).activeSessions;
      expect(sessions.has('session-123')).toBe(false);
    });
  });

  describe('extendSession()', () => {
    it('should extend access session duration', async () => {
      const originalEnd = new Date(Date.now() + 30 * 60 * 1000);
      const mockSession = {
        id: 'session-123',
        requestId: 'req-123',
        userId: 'user-1',
        organizationId: 'org-1',
        privilege: 'admin' as const,
        startTime: new Date(),
        endTime: originalEnd,
        extendedCount: 0,
        actionsPerformed: [],
        active: true,
      };

      // Mock the activeSessions map
      (jitAccessService as any).activeSessions = new Map([
        ['session-123', mockSession]
      ]);

      const result = await jitAccessService.extendSession('session-123', 30, 'Need more time');

      expect(result).toHaveProperty('extendedCount', 1);
      expect(new Date(result.endTime).getTime()).toBeGreaterThanOrEqual(
        originalEnd.getTime()
      );
    });
  });

  describe('getUserActiveSessions()', () => {
    it('should return active sessions for user', async () => {
      const mockSession = {
        id: 'session-1',
        requestId: 'req-1',
        userId: 'user-1',
        organizationId: 'org-1',
        privilege: 'admin' as const,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        extendedCount: 0,
        actionsPerformed: [],
        active: true,
      };

      // Mock the activeSessions map
      (jitAccessService as any).activeSessions = new Map([
        ['session-1', mockSession]
      ]);

      const result = await jitAccessService.getUserActiveSessions('user-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('active', true);
    });
  });

  describe('revokeSession()', () => {
    it('should revoke session when expired', async () => {
      const expiredSession = {
        id: 'session-123',
        requestId: 'req-123',
        userId: 'user-1',
        organizationId: 'org-1',
        privilege: 'admin' as const,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (expired)
        extendedCount: 0,
        actionsPerformed: [],
        active: true,
      };

      // Mock the activeSessions map
      (jitAccessService as any).activeSessions = new Map([
        ['session-123', expiredSession]
      ]);

      await jitAccessService.revokeSession('session-123', 'Session expired');

      const sessions = (jitAccessService as any).activeSessions;
      expect(sessions.has('session-123')).toBe(false);
    });
  });
});
