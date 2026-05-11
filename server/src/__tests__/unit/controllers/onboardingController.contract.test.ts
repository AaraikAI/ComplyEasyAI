/**
 * Onboarding Controller Contract Tests
 *
 * Validates the contract for onboarding progress tracking, checklist management,
 * milestone completion, preferences, flow skipping, and reset endpoints.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import { onboardingController } from '../../../controllers/onboardingController';
import { AppError } from '../../../middleware/errorHandler';

/**
 * Invokes a controller and captures the thrown error.
 */
async function captureThrown(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('Expected controller to throw, but it resolved.');
}

const createMockProgress = (overrides = {}) => ({
  id: 'prog-123',
  userId: 'user-123',
  organizationId: 'org-123',
  currentFlow: null,
  currentStep: 0,
  welcomeCompleted: false,
  tierTourCompleted: false,
  firstFrameworkCompleted: false,
  firstEvidenceCompleted: false,
  firstControlPassCompleted: false,
  inviteTeamCompleted: false,
  integrationSetupCompleted: false,
  aiFeatureTrialCompleted: false,
  acosDigitalTwinTourCompleted: false,
  advancedFeaturesTourCompleted: false,
  tooltipsShown: [],
  skippedFlows: [],
  completedAt: null,
  lastActiveFlow: null,
  lastActiveStep: null,
  showHints: true,
  reducedMotion: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockChecklist = (overrides = {}) => ({
  id: 'cl-123',
  organizationId: 'org-123',
  profileCompleted: false,
  teamInvited: false,
  firstFrameworkAdded: false,
  firstEvidenceUploaded: false,
  firstControlPassed: false,
  integrationConnected: false,
  aiFeatureUsed: false,
  firstReportGenerated: false,
  acosConfigured: false,
  digitalTwinActivated: false,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('OnboardingController Contract Tests', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      headers: {},
    };

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };
  });

  // ===========================================================================
  // getProgress
  // ===========================================================================
  describe('getProgress()', () => {
    it('should return progress and organization info', async () => {
      const progress = createMockProgress();
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress as never);
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        plan: 'Essentials',
        name: 'Acme Corp',
        onboardingCompleted: false,
        onboardingStep: 2,
      } as never);

      await onboardingController.getProgress(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_organizationId: { userId: 'user-123', organizationId: 'org-123' },
          },
        })
      );
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'org-123' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: expect.any(Object),
          organizationPlan: 'Essentials',
          organizationName: 'Acme Corp',
          onboardingCompleted: false,
        })
      );
    });

    it('should default organizationPlan to Foundation when org not found', async () => {
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress() as never
      );
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await onboardingController.getProgress(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationPlan: 'Foundation',
          organizationName: '',
          onboardingCompleted: false,
        })
      );
    });

    it('should wrap database errors as AppError(500)', async () => {
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.getProgress(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Failed to get onboarding progress');
    });
  });

  // ===========================================================================
  // updateProgress
  // ===========================================================================
  describe('updateProgress()', () => {
    it('should update progress with whitelisted fields', async () => {
      mockReq.body = { currentFlow: 'welcome', currentStep: 2, maliciousField: 'ignored' };

      const progress = createMockProgress({ currentFlow: 'welcome', currentStep: 2 });
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress as never);

      await onboardingController.updateProgress(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_organizationId: { userId: 'user-123', organizationId: 'org-123' },
          },
          update: expect.not.objectContaining({ maliciousField: 'ignored' }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ progress: expect.any(Object) })
      );
    });

    it('should update org onboarding status when major milestones completed', async () => {
      mockReq.body = { welcomeCompleted: true };

      const progress = createMockProgress({
        welcomeCompleted: true,
        tierTourCompleted: true,
        firstFrameworkCompleted: true,
      });
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress as never);
      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue({} as never);

      await onboardingController.updateProgress(mockReq, mockRes as Response);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'org-123' },
          data: { onboardingCompleted: true, onboardingStep: 999 },
        })
      );
    });

    it('should wrap database errors as AppError(500)', async () => {
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.updateProgress(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Failed to update onboarding progress');
    });
  });

  // ===========================================================================
  // trackEvent
  // ===========================================================================
  describe('trackEvent()', () => {
    it('should create event with status 201', async () => {
      mockReq.body = { eventType: 'step_viewed', flowName: 'welcome', stepIndex: 0 };

      const event = {
        id: 'evt-1',
        userId: 'user-123',
        organizationId: 'org-123',
        eventType: 'step_viewed',
        flowName: 'welcome',
        stepIndex: 0,
        metadata: null,
        createdAt: new Date(),
      };
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue(event as never);

      await onboardingController.trackEvent(mockReq, mockRes as Response);

      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            organizationId: 'org-123',
            eventType: 'step_viewed',
            flowName: 'welcome',
            stepIndex: 0,
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ event: expect.any(Object) })
      );
    });

    it('should throw AppError(400) when eventType is missing', async () => {
      mockReq.body = { flowName: 'welcome' };

      const err = await captureThrown(() =>
        onboardingController.trackEvent(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('eventType is required');
    });

    it('should wrap database errors as AppError(500)', async () => {
      mockReq.body = { eventType: 'step_viewed' };
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.trackEvent(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // completeMilestone
  // ===========================================================================
  describe('completeMilestone()', () => {
    it('should mark milestone as complete and update checklist', async () => {
      mockReq.body = { milestone: 'welcome' };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ welcomeCompleted: true }) as never
      );
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({} as never);
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(
        createMockChecklist({ profileCompleted: true }) as never
      );

      await onboardingController.completeMilestone(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ welcomeCompleted: true }),
        })
      );
      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'milestone_reached',
            flowName: 'welcome',
          }),
        })
      );
      expect(prismaMock.onboardingChecklist.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
          update: expect.objectContaining({ profileCompleted: true }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ progress: expect.any(Object) })
      );
    });

    it('should throw AppError(400) when milestone is missing', async () => {
      mockReq.body = {};

      const err = await captureThrown(() =>
        onboardingController.completeMilestone(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('milestone is required');
    });

    it('should throw AppError(400) for invalid milestone name', async () => {
      mockReq.body = { milestone: 'nonexistent_milestone' };

      const err = await captureThrown(() =>
        onboardingController.completeMilestone(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toEqual(expect.stringContaining('Invalid milestone'));
    });

    it('should not update checklist for milestones without checklist mapping', async () => {
      mockReq.body = { milestone: 'tier_tour' };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ tierTourCompleted: true }) as never
      );
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({} as never);

      await onboardingController.completeMilestone(mockReq, mockRes as Response);

      expect(prismaMock.onboardingChecklist.upsert).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ progress: expect.any(Object) })
      );
    });

    it('should wrap database errors as AppError(500)', async () => {
      mockReq.body = { milestone: 'welcome' };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.completeMilestone(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // updatePreferences
  // ===========================================================================
  describe('updatePreferences()', () => {
    it('should update showHints and reducedMotion', async () => {
      mockReq.body = { showHints: false, reducedMotion: true };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ showHints: false, reducedMotion: true }) as never
      );

      await onboardingController.updatePreferences(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            showHints: false,
            reducedMotion: true,
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ progress: expect.any(Object) })
      );
    });

    it('should handle partial preferences update', async () => {
      mockReq.body = { showHints: false };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ showHints: false }) as never
      );

      await onboardingController.updatePreferences(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { showHints: false },
        })
      );
    });

    it('should wrap database errors as AppError(500)', async () => {
      mockReq.body = { showHints: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.updatePreferences(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // skipFlow
  // ===========================================================================
  describe('skipFlow()', () => {
    it('should add flow to skipped list and track event', async () => {
      mockReq.body = { flowName: 'tier_tour' };

      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ skippedFlows: [] }) as never
      );
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ skippedFlows: ['tier_tour'] }) as never
      );
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({} as never);

      await onboardingController.skipFlow(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_organizationId: { userId: 'user-123', organizationId: 'org-123' },
          },
        })
      );
      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            skippedFlows: ['tier_tour'],
          }),
        })
      );
      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'flow_skipped',
            flowName: 'tier_tour',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ progress: expect.any(Object) })
      );
    });

    it('should not duplicate flow in skipped list', async () => {
      mockReq.body = { flowName: 'tier_tour' };

      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ skippedFlows: ['tier_tour'] }) as never
      );
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(
        createMockProgress({ skippedFlows: ['tier_tour'] }) as never
      );
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({} as never);

      await onboardingController.skipFlow(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            skippedFlows: ['tier_tour'],
          }),
        })
      );
    });

    it('should throw AppError(400) when flowName is missing', async () => {
      mockReq.body = {};

      const err = await captureThrown(() =>
        onboardingController.skipFlow(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('flowName is required');
    });

    it('should wrap database errors as AppError(500)', async () => {
      mockReq.body = { flowName: 'welcome' };
      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.skipFlow(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // resetProgress
  // ===========================================================================
  describe('resetProgress()', () => {
    it('should delete progress, create fresh, reset org, and track event', async () => {
      (prismaMock.onboardingProgress.deleteMany as jest.Mock<any>).mockResolvedValue(
        { count: 1 } as never
      );
      (prismaMock.onboardingProgress.create as jest.Mock<any>).mockResolvedValue(
        createMockProgress() as never
      );
      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue({} as never);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({} as never);

      await onboardingController.resetProgress(mockReq, mockRes as Response);

      expect(prismaMock.onboardingProgress.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', organizationId: 'org-123' },
        })
      );
      expect(prismaMock.onboardingProgress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            organizationId: 'org-123',
          }),
        })
      );
      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'org-123' },
          data: { onboardingCompleted: false, onboardingStep: 0 },
        })
      );
      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'onboarding_reset',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ progress: expect.any(Object) })
      );
    });

    it('should wrap database errors as AppError(500)', async () => {
      (prismaMock.onboardingProgress.deleteMany as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.resetProgress(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Failed to reset onboarding');
    });
  });

  // ===========================================================================
  // getChecklist
  // ===========================================================================
  describe('getChecklist()', () => {
    it('should return checklist for organization', async () => {
      const checklist = createMockChecklist();
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(
        checklist as never
      );

      await onboardingController.getChecklist(mockReq, mockRes as Response);

      expect(prismaMock.onboardingChecklist.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
          create: { organizationId: 'org-123' },
          update: {},
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ checklist: expect.any(Object) })
      );
    });

    it('should wrap database errors as AppError(500)', async () => {
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.getChecklist(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
    });
  });

  // ===========================================================================
  // updateChecklist
  // ===========================================================================
  describe('updateChecklist()', () => {
    it('should update checklist with whitelisted fields', async () => {
      mockReq.body = { profileCompleted: true, teamInvited: true, maliciousField: 'ignored' };

      const checklist = createMockChecklist({ profileCompleted: true, teamInvited: true });
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(
        checklist as never
      );

      await onboardingController.updateChecklist(mockReq, mockRes as Response);

      expect(prismaMock.onboardingChecklist.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
          update: expect.not.objectContaining({ maliciousField: 'ignored' }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ checklist: expect.any(Object) })
      );
    });

    it('should set completedAt when all core items are complete', async () => {
      mockReq.body = { firstReportGenerated: true };

      const checklist = createMockChecklist({
        profileCompleted: true,
        teamInvited: true,
        firstFrameworkAdded: true,
        firstEvidenceUploaded: true,
        firstControlPassed: true,
        integrationConnected: true,
        aiFeatureUsed: true,
        firstReportGenerated: true,
        completedAt: null,
      });
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(
        checklist as never
      );
      (prismaMock.onboardingChecklist.update as jest.Mock<any>).mockResolvedValue(
        { ...checklist, completedAt: new Date() } as never
      );

      await onboardingController.updateChecklist(mockReq, mockRes as Response);

      expect(prismaMock.onboardingChecklist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
          data: { completedAt: expect.any(Date) },
        })
      );
    });

    it('should not set completedAt when already set', async () => {
      mockReq.body = { profileCompleted: true };

      const checklist = createMockChecklist({
        profileCompleted: true,
        teamInvited: true,
        firstFrameworkAdded: true,
        firstEvidenceUploaded: true,
        firstControlPassed: true,
        integrationConnected: true,
        aiFeatureUsed: true,
        firstReportGenerated: true,
        completedAt: new Date(),
      });
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(
        checklist as never
      );

      await onboardingController.updateChecklist(mockReq, mockRes as Response);

      expect(prismaMock.onboardingChecklist.update).not.toHaveBeenCalled();
    });

    it('should wrap database errors as AppError(500)', async () => {
      mockReq.body = { profileCompleted: true };
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error') as never
      );

      const err = await captureThrown(() =>
        onboardingController.updateChecklist(mockReq, mockRes as Response) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Failed to update onboarding checklist');
    });
  });
});
