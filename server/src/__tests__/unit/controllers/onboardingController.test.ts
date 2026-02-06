/**
 * Onboarding Controller Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import { onboardingController } from '../../../controllers/onboardingController';

describe('OnboardingController', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
      params: {},
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  // ============================================================================
  // getProgress
  // ============================================================================

  describe('getProgress', () => {
    it('should return onboarding progress and organization info', async () => {
      const progress = {
        userId: 'user-1',
        organizationId: 'org-1',
        welcomeCompleted: true,
        tierTourCompleted: false,
      };
      const organization = {
        plan: 'Pro',
        name: 'Test Org',
        onboardingCompleted: false,
        onboardingStep: 2,
      };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(organization);

      await onboardingController.getProgress(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_organizationId: { userId: 'user-1', organizationId: 'org-1' } },
          create: { userId: 'user-1', organizationId: 'org-1' },
          update: {},
        })
      );
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'org-1' },
          select: { plan: true, name: true, onboardingCompleted: true, onboardingStep: true },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        progress,
        organizationPlan: 'Pro',
        organizationName: 'Test Org',
        onboardingCompleted: false,
      });
    });

    it('should use defaults when organization is not found', async () => {
      const progress = { userId: 'user-1', organizationId: 'org-1' };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await onboardingController.getProgress(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        progress,
        organizationPlan: 'Foundation',
        organizationName: '',
        onboardingCompleted: false,
      });
    });

    it('should return 500 on error', async () => {
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.getProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get onboarding progress',
      });
    });
  });

  // ============================================================================
  // updateProgress
  // ============================================================================

  describe('updateProgress', () => {
    it('should update progress with whitelisted fields only', async () => {
      mockReq.body = {
        currentFlow: 'welcome',
        currentStep: 3,
        welcomeCompleted: true,
        maliciousField: 'should be ignored',
      };

      const progress = {
        userId: 'user-1',
        organizationId: 'org-1',
        currentFlow: 'welcome',
        currentStep: 3,
        welcomeCompleted: true,
        tierTourCompleted: false,
        firstFrameworkCompleted: false,
      };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);

      await onboardingController.updateProgress(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            currentFlow: 'welcome',
            currentStep: 3,
            welcomeCompleted: true,
          },
        })
      );
      // maliciousField should not be in the update
      const call = (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mock.calls[0][0];
      expect(call.update.maliciousField).toBeUndefined();
      expect(mockRes.json).toHaveBeenCalledWith({ progress });
    });

    it('should update org onboarding status when major milestones completed', async () => {
      mockReq.body = { firstFrameworkCompleted: true };

      const progress = {
        welcomeCompleted: true,
        tierTourCompleted: true,
        firstFrameworkCompleted: true,
      };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.updateProgress(mockReq, mockRes);

      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { onboardingCompleted: true, onboardingStep: 999 },
      });
    });

    it('should not update org when milestones are incomplete', async () => {
      mockReq.body = { welcomeCompleted: true };

      const progress = {
        welcomeCompleted: true,
        tierTourCompleted: false,
        firstFrameworkCompleted: false,
      };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);

      await onboardingController.updateProgress(mockReq, mockRes);

      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      mockReq.body = { currentStep: 1 };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.updateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to update onboarding progress',
      });
    });
  });

  // ============================================================================
  // trackEvent
  // ============================================================================

  describe('trackEvent', () => {
    it('should track an onboarding event and return 201', async () => {
      mockReq.body = {
        eventType: 'step_viewed',
        flowName: 'welcome',
        stepIndex: 2,
        metadata: { page: 'dashboard' },
      };

      const event = {
        id: 'event-1',
        eventType: 'step_viewed',
        flowName: 'welcome',
        stepIndex: 2,
      };

      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue(event);

      await onboardingController.trackEvent(mockReq, mockRes);

      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          organizationId: 'org-1',
          eventType: 'step_viewed',
          flowName: 'welcome',
          stepIndex: 2,
          metadata: { page: 'dashboard' },
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ event });
    });

    it('should handle null optional fields', async () => {
      mockReq.body = { eventType: 'flow_started' };

      const event = { id: 'event-2', eventType: 'flow_started' };
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue(event);

      await onboardingController.trackEvent(mockReq, mockRes);

      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          flowName: null,
          stepIndex: null,
          metadata: null,
        }),
      });
    });

    it('should return 400 when eventType is missing', async () => {
      mockReq.body = { flowName: 'welcome' };

      await onboardingController.trackEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'eventType is required' });
    });

    it('should return 500 on error', async () => {
      mockReq.body = { eventType: 'test' };
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.trackEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to track onboarding event',
      });
    });
  });

  // ============================================================================
  // completeMilestone
  // ============================================================================

  describe('completeMilestone', () => {
    it('should complete a valid milestone and update progress', async () => {
      mockReq.body = { milestone: 'welcome' };

      const progress = { welcomeCompleted: true };

      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { welcomeCompleted: true },
        })
      );
      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'milestone_reached',
          flowName: 'welcome',
          metadata: { milestone: 'welcome', field: 'welcomeCompleted' },
        }),
      });
      expect(prismaMock.onboardingChecklist.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { profileCompleted: true },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ progress });
    });

    it('should complete first_framework milestone', async () => {
      mockReq.body = { milestone: 'first_framework' };

      const progress = { firstFrameworkCompleted: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { firstFrameworkCompleted: true },
        })
      );
      expect(prismaMock.onboardingChecklist.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { firstFrameworkAdded: true },
        })
      );
    });

    it('should not update checklist for milestones without a checklist mapping', async () => {
      mockReq.body = { milestone: 'tier_tour' };

      const progress = { tierTourCompleted: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(prismaMock.onboardingChecklist.upsert).not.toHaveBeenCalled();
    });

    it('should not update checklist for advanced_features milestone', async () => {
      mockReq.body = { milestone: 'advanced_features' };

      const progress = { advancedFeaturesTourCompleted: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(prismaMock.onboardingChecklist.upsert).not.toHaveBeenCalled();
    });

    it('should return 400 when milestone is missing', async () => {
      mockReq.body = {};

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'milestone is required' });
    });

    it('should return 400 for invalid milestone name', async () => {
      mockReq.body = { milestone: 'nonexistent_milestone' };

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid milestone: nonexistent_milestone',
      });
    });

    it('should return 500 on error', async () => {
      mockReq.body = { milestone: 'welcome' };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.completeMilestone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to complete milestone',
      });
    });
  });

  // ============================================================================
  // updatePreferences
  // ============================================================================

  describe('updatePreferences', () => {
    it('should update showHints preference', async () => {
      mockReq.body = { showHints: false };

      const progress = { showHints: false };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);

      await onboardingController.updatePreferences(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { showHints: false },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ progress });
    });

    it('should update reducedMotion preference', async () => {
      mockReq.body = { reducedMotion: true };

      const progress = { reducedMotion: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);

      await onboardingController.updatePreferences(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { reducedMotion: true },
        })
      );
    });

    it('should update both preferences simultaneously', async () => {
      mockReq.body = { showHints: false, reducedMotion: true };

      const progress = { showHints: false, reducedMotion: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);

      await onboardingController.updatePreferences(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { showHints: false, reducedMotion: true },
        })
      );
    });

    it('should handle empty body gracefully', async () => {
      mockReq.body = {};

      const progress = {};
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(progress);

      await onboardingController.updatePreferences(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {},
        })
      );
    });

    it('should return 500 on error', async () => {
      mockReq.body = { showHints: true };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.updatePreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to update onboarding preferences',
      });
    });
  });

  // ============================================================================
  // skipFlow
  // ============================================================================

  describe('skipFlow', () => {
    it('should add a flow to the skipped list', async () => {
      mockReq.body = { flowName: 'tier_tour' };

      const existing = { skippedFlows: [] };
      const updatedProgress = { skippedFlows: ['tier_tour'] };

      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockResolvedValue(existing);
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(updatedProgress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.skipFlow(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { skippedFlows: ['tier_tour'] },
        })
      );
      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'flow_skipped',
          flowName: 'tier_tour',
        }),
      });
      expect(mockRes.json).toHaveBeenCalledWith({ progress: updatedProgress });
    });

    it('should not duplicate an already skipped flow', async () => {
      mockReq.body = { flowName: 'tier_tour' };

      const existing = { skippedFlows: ['tier_tour'] };
      const updatedProgress = { skippedFlows: ['tier_tour'] };

      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockResolvedValue(existing);
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(updatedProgress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.skipFlow(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { skippedFlows: ['tier_tour'] },
        })
      );
    });

    it('should append to existing skipped flows', async () => {
      mockReq.body = { flowName: 'integration_setup' };

      const existing = { skippedFlows: ['tier_tour'] };
      const updatedProgress = { skippedFlows: ['tier_tour', 'integration_setup'] };

      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockResolvedValue(existing);
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(updatedProgress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.skipFlow(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { skippedFlows: ['tier_tour', 'integration_setup'] },
        })
      );
    });

    it('should handle no existing progress', async () => {
      mockReq.body = { flowName: 'welcome' };

      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockResolvedValue(null);
      const updatedProgress = { skippedFlows: ['welcome'] };
      (prismaMock.onboardingProgress.upsert as jest.Mock<any>).mockResolvedValue(updatedProgress);
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.skipFlow(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            skippedFlows: ['welcome'],
          }),
          update: { skippedFlows: ['welcome'] },
        })
      );
    });

    it('should return 400 when flowName is missing', async () => {
      mockReq.body = {};

      await onboardingController.skipFlow(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'flowName is required' });
    });

    it('should return 500 on error', async () => {
      mockReq.body = { flowName: 'test' };
      (prismaMock.onboardingProgress.findUnique as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.skipFlow(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to skip flow' });
    });
  });

  // ============================================================================
  // resetProgress
  // ============================================================================

  describe('resetProgress', () => {
    it('should delete existing progress and create fresh progress', async () => {
      const freshProgress = {
        userId: 'user-1',
        organizationId: 'org-1',
        welcomeCompleted: false,
        tierTourCompleted: false,
      };

      (prismaMock.onboardingProgress.deleteMany as jest.Mock<any>).mockResolvedValue({ count: 1 });
      (prismaMock.onboardingProgress.create as jest.Mock<any>).mockResolvedValue(freshProgress);
      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.onboardingEvent.create as jest.Mock<any>).mockResolvedValue({});

      await onboardingController.resetProgress(mockReq, mockRes);

      expect(prismaMock.onboardingProgress.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', organizationId: 'org-1' },
      });
      expect(prismaMock.onboardingProgress.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', organizationId: 'org-1' },
      });
      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { onboardingCompleted: false, onboardingStep: 0 },
      });
      expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'onboarding_reset',
          userId: 'user-1',
          organizationId: 'org-1',
        }),
      });
      expect(mockRes.json).toHaveBeenCalledWith({ progress: freshProgress });
    });

    it('should return 500 on error', async () => {
      (prismaMock.onboardingProgress.deleteMany as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.resetProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to reset onboarding' });
    });
  });

  // ============================================================================
  // getChecklist
  // ============================================================================

  describe('getChecklist', () => {
    it('should return the organization checklist via upsert', async () => {
      const checklist = {
        organizationId: 'org-1',
        profileCompleted: true,
        teamInvited: false,
        firstFrameworkAdded: true,
      };

      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(checklist);

      await onboardingController.getChecklist(mockReq, mockRes);

      expect(prismaMock.onboardingChecklist.upsert).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        create: { organizationId: 'org-1' },
        update: {},
      });
      expect(mockRes.json).toHaveBeenCalledWith({ checklist });
    });

    it('should return 500 on error', async () => {
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.getChecklist(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get onboarding checklist',
      });
    });
  });

  // ============================================================================
  // updateChecklist
  // ============================================================================

  describe('updateChecklist', () => {
    it('should update checklist with whitelisted fields only', async () => {
      mockReq.body = {
        profileCompleted: true,
        teamInvited: true,
        invalidField: 'should be ignored',
      };

      const checklist = {
        organizationId: 'org-1',
        profileCompleted: true,
        teamInvited: true,
        firstFrameworkAdded: false,
        firstEvidenceUploaded: false,
        firstControlPassed: false,
        integrationConnected: false,
        aiFeatureUsed: false,
        firstReportGenerated: false,
        completedAt: null,
      };

      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(checklist);

      await onboardingController.updateChecklist(mockReq, mockRes);

      const upsertCall = (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mock.calls[0][0];
      expect(upsertCall.update.profileCompleted).toBe(true);
      expect(upsertCall.update.teamInvited).toBe(true);
      expect(upsertCall.update.invalidField).toBeUndefined();
      expect(mockRes.json).toHaveBeenCalledWith({ checklist });
    });

    it('should set completedAt when all major items are complete', async () => {
      mockReq.body = { firstReportGenerated: true };

      const checklist = {
        organizationId: 'org-1',
        profileCompleted: true,
        teamInvited: true,
        firstFrameworkAdded: true,
        firstEvidenceUploaded: true,
        firstControlPassed: true,
        integrationConnected: true,
        aiFeatureUsed: true,
        firstReportGenerated: true,
        completedAt: null,
      };

      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(checklist);
      (prismaMock.onboardingChecklist.update as jest.Mock<any>).mockResolvedValue({
        ...checklist,
        completedAt: new Date(),
      });

      await onboardingController.updateChecklist(mockReq, mockRes);

      expect(prismaMock.onboardingChecklist.update).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        data: { completedAt: expect.any(Date) },
      });
    });

    it('should not set completedAt when not all items are complete', async () => {
      mockReq.body = { profileCompleted: true };

      const checklist = {
        organizationId: 'org-1',
        profileCompleted: true,
        teamInvited: false,
        firstFrameworkAdded: false,
        firstEvidenceUploaded: false,
        firstControlPassed: false,
        integrationConnected: false,
        aiFeatureUsed: false,
        firstReportGenerated: false,
        completedAt: null,
      };

      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(checklist);

      await onboardingController.updateChecklist(mockReq, mockRes);

      expect(prismaMock.onboardingChecklist.update).not.toHaveBeenCalled();
    });

    it('should not re-set completedAt if already set', async () => {
      mockReq.body = { aiFeatureUsed: true };

      const existingDate = new Date('2025-01-15');
      const checklist = {
        organizationId: 'org-1',
        profileCompleted: true,
        teamInvited: true,
        firstFrameworkAdded: true,
        firstEvidenceUploaded: true,
        firstControlPassed: true,
        integrationConnected: true,
        aiFeatureUsed: true,
        firstReportGenerated: true,
        completedAt: existingDate,
      };

      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockResolvedValue(checklist);

      await onboardingController.updateChecklist(mockReq, mockRes);

      // allComplete is true but checklist.completedAt is truthy, so update should NOT be called
      expect(prismaMock.onboardingChecklist.update).not.toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      mockReq.body = { profileCompleted: true };
      (prismaMock.onboardingChecklist.upsert as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await onboardingController.updateChecklist(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to update onboarding checklist',
      });
    });
  });
});
