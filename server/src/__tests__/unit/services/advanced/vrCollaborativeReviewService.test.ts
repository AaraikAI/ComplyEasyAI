/**
 * VR Collaborative Review Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Extend prismaMock with VR-specific models
const vrPrismaMock = {
  ...prismaMock,
  vRCollaborativeSession: {
    findUnique: jest.fn() as jest.Mock<any>,
    findFirst: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
    updateMany: jest.fn() as jest.Mock<any>,
    delete: jest.fn() as jest.Mock<any>,
  },
  vRTrainingScenario: {
    findUnique: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
  },
  vRTrainingSession: {
    findUnique: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
  },
  vRSessionPerformance: {
    findFirst: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
  },
};

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: vrPrismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import vrService from '../../../../services/advanced/vrCollaborativeReviewService';

describe('VRCollaborativeReviewService', () => {
  const orgId = 'org-123';
  const hostUserId = 'user-host';
  const participantUserId = 'user-participant';

  /**
   * Helper: set up all common mocks needed for createSession.
   * loadComplianceDataForVR queries complianceFramework.findMany AND riskItem.findMany,
   * so both must return valid arrays.
   */
  function mockCreateSessionDeps() {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      id: hostUserId,
      name: 'Host User',
    } as any);
    (prismaMock.complianceFramework.findMany as jest.Mock).mockResolvedValue([] as any);
    (prismaMock.riskItem.findMany as jest.Mock).mockResolvedValue([] as any);
    (vrPrismaMock.vRCollaborativeSession.create as jest.Mock).mockResolvedValue({} as any);
    (vrPrismaMock.vRCollaborativeSession.update as jest.Mock).mockResolvedValue({} as any);
    (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({} as any);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // createSession
  // =========================================================================
  describe('createSession', () => {
    it('should create a new VR session with host participant', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        {
          sessionName: 'Quarterly Review',
          sessionType: 'review',
          environment: 'boardroom',
        },
        hostUserId
      );

      expect(session).toBeDefined();
      expect(session.sessionName).toBe('Quarterly Review');
      expect(session.sessionType).toBe('review');
      expect(session.status).toBe('pending');
      expect(session.hostUserId).toBe(hostUserId);
      expect(session.participants).toHaveLength(1);
      expect(session.participants[0].role).toBe('host');
      expect(vrPrismaMock.vRCollaborativeSession.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
    });

    it('should create session with invited users', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        {
          sessionName: 'With Invites',
          sessionType: 'audit',
          environment: 'command_center',
          invitedUsers: ['user-a', 'user-b'],
          maxParticipants: 10,
        },
        hostUserId
      );

      expect(session).toBeDefined();
      expect(session.sessionType).toBe('audit');
      expect(session.maxParticipants).toBe(10);
    });

    it('should propagate errors from database failures', async () => {
      mockCreateSessionDeps();
      (vrPrismaMock.vRCollaborativeSession.create as jest.Mock).mockRejectedValue(
        new Error('DB connection lost')
      );

      await expect(
        vrService.createSession(
          orgId,
          { sessionName: 'Fail', sessionType: 'review', environment: 'boardroom' },
          hostUserId
        )
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // joinSession
  // =========================================================================
  describe('joinSession', () => {
    it('should allow a user to join an active session', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Join Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      // Now join
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: participantUserId,
        name: 'Participant',
      } as any);

      const { participant, spawnPoint } = await vrService.joinSession(
        session.id,
        participantUserId,
        'reviewer'
      );

      expect(participant.userId).toBe(participantUserId);
      expect(participant.role).toBe('reviewer');
      expect(participant.isActive).toBe(true);
      expect(spawnPoint).toBeDefined();
      expect(spawnPoint.x).toBeDefined();
    });

    it('should throw when session is not found', async () => {
      await expect(
        vrService.joinSession('nonexistent-session', participantUserId, 'reviewer')
      ).rejects.toThrow('Session not found or inactive');
    });

    it('should throw when session is full', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        {
          sessionName: 'Full Session',
          sessionType: 'review',
          environment: 'boardroom',
          maxParticipants: 1,
        },
        hostUserId
      );

      // Session already has 1 participant (the host), max is 1
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: participantUserId,
        name: 'Participant',
      } as any);

      await expect(
        vrService.joinSession(session.id, participantUserId, 'reviewer')
      ).rejects.toThrow(/Session is full/);
    });
  });

  // =========================================================================
  // leaveSession
  // =========================================================================
  describe('leaveSession', () => {
    it('should remove a participant from the session', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Leave Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      // Join
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: participantUserId, name: 'P' } as any);
      (vrPrismaMock.vRCollaborativeSession.update as jest.Mock).mockResolvedValue({} as any);
      await vrService.joinSession(session.id, participantUserId, 'reviewer');

      // Leave
      await vrService.leaveSession(session.id, participantUserId);

      expect(vrPrismaMock.vRCollaborativeSession.update).toHaveBeenCalled();
    });

    it('should throw when leaving a non-existent session', async () => {
      await expect(
        vrService.leaveSession('nonexistent-session', participantUserId)
      ).rejects.toThrow('Session not found');
    });
  });

  // =========================================================================
  // startSession
  // =========================================================================
  describe('startSession', () => {
    it('should start a session when called by the host', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Start Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      const started = await vrService.startSession(session.id, hostUserId);

      expect(started.status).toBe('active');
      expect(started.startedAt).toBeDefined();
    });

    it('should throw when a non-host tries to start', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Auth Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      await expect(
        vrService.startSession(session.id, 'another-user')
      ).rejects.toThrow('Only the host can start the session');
    });

    it('should throw when session not found', async () => {
      await expect(
        vrService.startSession('nonexistent', hostUserId)
      ).rejects.toThrow('Session not found');
    });
  });

  // =========================================================================
  // endSession
  // =========================================================================
  describe('endSession', () => {
    it('should end a session and return summary', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'End Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      await vrService.startSession(session.id, hostUserId);
      const { summary } = await vrService.endSession(session.id, hostUserId);

      expect(summary).toBeDefined();
    });

    it('should throw when session not found', async () => {
      await expect(
        vrService.endSession('nonexistent', hostUserId)
      ).rejects.toThrow('Session not found');
    });
  });

  // =========================================================================
  // addAnnotation
  // =========================================================================
  describe('addAnnotation', () => {
    it('should add an annotation to an active session', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Annotation Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      const annotation = await vrService.addAnnotation(session.id, hostUserId, {
        content: 'Need to review this control',
        position: { x: 1, y: 2, z: 3 },
        type: 'note',
        visibility: 'public',
      });

      expect(annotation).toBeDefined();
      expect(annotation.content).toBe('Need to review this control');
      expect(annotation.type).toBe('note');
      expect(annotation.authorId).toBe(hostUserId);
      expect(annotation.resolved).toBe(false);
      expect(annotation.id).toMatch(/^annotation_/);
    });

    it('should throw when session not found', async () => {
      await expect(
        vrService.addAnnotation('nonexistent', hostUserId, {
          content: 'Test',
          position: { x: 0, y: 0, z: 0 },
          type: 'note',
          visibility: 'public',
        })
      ).rejects.toThrow('Session not found');
    });
  });

  // =========================================================================
  // updateParticipantState
  // =========================================================================
  describe('updateParticipantState', () => {
    it('should update participant position and rotation', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'State Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      // This should not throw
      await vrService.updateParticipantState(session.id, hostUserId, {
        position: { x: 5, y: 1.6, z: 3 },
        rotation: { x: 0, y: 90, z: 0 },
      });
    });

    it('should silently handle non-existent session', async () => {
      // Should not throw
      await vrService.updateParticipantState('nonexistent', hostUserId, {
        position: { x: 0, y: 0, z: 0 },
      });
    });
  });

  // =========================================================================
  // healthCheck
  // =========================================================================
  describe('healthCheck', () => {
    it('should return valid for an active in-memory session', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Health Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      const result = await vrService.healthCheck(session.id);

      expect(result.valid).toBe(true);
    });

    it('should return not valid for unknown session not in DB', async () => {
      (vrPrismaMock.vRCollaborativeSession.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await vrService.healthCheck('totally-unknown');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Session not found');
    });

    it('should return not valid for a completed DB session', async () => {
      (vrPrismaMock.vRCollaborativeSession.findUnique as jest.Mock).mockResolvedValue({
        sessionId: 'completed-session',
        status: 'completed',
      } as any);

      const result = await vrService.healthCheck('completed-session');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Session has ended');
    });
  });

  // =========================================================================
  // getActiveSessions
  // =========================================================================
  describe('getActiveSessions', () => {
    it('should return active sessions from memory and database', async () => {
      (vrPrismaMock.vRCollaborativeSession.findMany as jest.Mock).mockResolvedValue([] as any);

      const sessions = await vrService.getActiveSessions(orgId);

      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  // =========================================================================
  // getSessionDetails
  // =========================================================================
  describe('getSessionDetails', () => {
    it('should return null for non-existent session', async () => {
      const result = await vrService.getSessionDetails('nonexistent');
      expect(result).toBeNull();
    });

    it('should return session details for an in-memory session', async () => {
      mockCreateSessionDeps();
      (vrPrismaMock.vRTrainingSession.findUnique as jest.Mock).mockResolvedValue(null);

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Detail Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      const details = await vrService.getSessionDetails(session.id);

      expect(details).toBeDefined();
      expect(details!.sessionName).toBe('Detail Test');
    });
  });

  // =========================================================================
  // startRecording
  // =========================================================================
  describe('startRecording', () => {
    it('should start recording for an active session', async () => {
      mockCreateSessionDeps();

      const session = await vrService.createSession(
        orgId,
        { sessionName: 'Recording Test', sessionType: 'review', environment: 'boardroom' },
        hostUserId
      );

      const recording = await vrService.startRecording(session.id, hostUserId, 'full');

      expect(recording).toBeDefined();
      expect(recording.id).toMatch(/^recording_/);
      expect(recording.recordingType).toBe('full');
      expect(recording.participants).toContain(hostUserId);
    });

    it('should throw when session not found for recording', async () => {
      await expect(
        vrService.startRecording('nonexistent', hostUserId)
      ).rejects.toThrow('Session not found');
    });
  });

  // =========================================================================
  // trackTrainingProgress
  // =========================================================================
  describe('trackTrainingProgress', () => {
    it('should throw when training progress not found', async () => {
      await expect(
        vrService.trackTrainingProgress('nonexistent-session', 'user-1', 'task-1', true)
      ).rejects.toThrow('Training progress not found');
    });
  });

  // =========================================================================
  // getTrainingHistory
  // =========================================================================
  describe('getTrainingHistory', () => {
    it('should return parsed training history from audit logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'vr_training.history',
          details: JSON.stringify({
            sessionId: 'session-1',
            scenarioId: 'scenario-1',
            scenarioName: 'SOC2 Training',
            score: 85,
            passed: true,
            completedAt: new Date().toISOString(),
          }),
          timestamp: new Date(),
        },
      ];

      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs as any);

      const history = await vrService.getTrainingHistory(hostUserId, orgId);

      expect(history).toHaveLength(1);
      expect(history[0].score).toBe(85);
      expect(history[0].passed).toBe(true);
    });

    it('should return empty array on error', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const history = await vrService.getTrainingHistory(hostUserId, orgId);

      expect(history).toEqual([]);
    });
  });
});
