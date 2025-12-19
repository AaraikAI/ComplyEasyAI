/**
 * JIT Access Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import jitAccessService from '../../../../services/advanced/jitAccessService';

describe('JITAccessService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
      const mockRequest = {
        id: 'req-123',
        userId: 'user-1',
        organizationId: 'org-1',
        requestedPrivilege: 'admin' as const,
        reason: 'incident_response' as const,
        justification: 'Test',
        duration: 60,
        status: 'pending' as const,
        createdAt: new Date(),
      };

      prismaMock.jITAccessRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'approved',
        approvedBy: 'approver-1',
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const result = await jitAccessService.approveAccess(
        'req-123',
        'approver-1'
      );

      expect(result).toHaveProperty('status', 'approved');
      expect(result).toHaveProperty('approvedBy', 'approver-1');
      expect(result).toHaveProperty('expiresAt');
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

      prismaMock.jITSession.update.mockResolvedValue({
        ...mockSession,
        active: false,
      });

      const result = await jitAccessService.revokeAccess('session-123');

      expect(result).toHaveProperty('active', false);
    });
  });

  describe('extendAccess()', () => {
    it('should extend access session duration', async () => {
      const mockSession = {
        id: 'session-123',
        requestId: 'req-123',
        userId: 'user-1',
        organizationId: 'org-1',
        privilege: 'admin' as const,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        extendedCount: 0,
        actionsPerformed: [],
        active: true,
      };

      prismaMock.jITSession.update.mockResolvedValue({
        ...mockSession,
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        extendedCount: 1,
      });

      const result = await jitAccessService.extendAccess('session-123', 30);

      expect(result).toHaveProperty('extendedCount', 1);
      expect(new Date(result.endTime).getTime()).toBeGreaterThan(
        new Date(mockSession.endTime).getTime()
      );
    });
  });

  describe('getActiveSessions()', () => {
    it('should return active sessions for user', async () => {
      const mockSessions = [
        {
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
        },
      ];

      prismaMock.jITSession.findMany.mockResolvedValue(mockSessions);

      const result = await jitAccessService.getActiveSessions('user-1', 'org-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('active', true);
    });
  });

  describe('checkAccessExpiry()', () => {
    it('should automatically expire sessions after duration', async () => {
      jest.useRealTimers();
      
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

      prismaMock.jITSession.findMany.mockResolvedValue([expiredSession]);
      prismaMock.jITSession.update.mockResolvedValue({
        ...expiredSession,
        active: false,
      });

      await jitAccessService.checkAccessExpiry();

      expect(prismaMock.jITSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-123' },
          data: { active: false },
        })
      );
    });
  });
});

