/**
 * Onboarding Controller
 *
 * Handles all onboarding progress tracking, checklist management,
 * and analytics event recording for the guided onboarding system.
 */

import { Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';

class OnboardingController {
  /**
   * GET /api/onboarding/progress
   * Get current user's onboarding progress + organization tier
   */
  async getProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;
      const organizationId = user.organizationId;

      // Upsert: create progress if it doesn't exist
      const progress = await prisma.onboardingProgress.upsert({
        where: {
          userId_organizationId: { userId, organizationId },
        },
        create: {
          userId,
          organizationId,
        },
        update: {},
      });

      // Get organization plan for tier-specific flows
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true, name: true, onboardingCompleted: true, onboardingStep: true },
      });

      res.json({
        progress,
        organizationPlan: organization?.plan || 'Foundation',
        organizationName: organization?.name || '',
        onboardingCompleted: organization?.onboardingCompleted || false,
      });
    } catch (error: any) {
      logger.error('Failed to get onboarding progress:', error);
      res.status(500).json({ error: 'Failed to get onboarding progress' });
    }
  }

  /**
   * PUT /api/onboarding/progress
   * Update onboarding progress (flow, step, milestones)
   */
  async updateProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;
      const organizationId = user.organizationId;
      const updates = req.body;

      // Whitelist allowed fields
      const allowedFields: Record<string, boolean> = {
        currentFlow: true,
        currentStep: true,
        welcomeCompleted: true,
        tierTourCompleted: true,
        firstFrameworkCompleted: true,
        firstEvidenceCompleted: true,
        firstControlPassCompleted: true,
        inviteTeamCompleted: true,
        integrationSetupCompleted: true,
        aiFeatureTrialCompleted: true,
        acosDigitalTwinTourCompleted: true,
        advancedFeaturesTourCompleted: true,
        tooltipsShown: true,
        skippedFlows: true,
        completedAt: true,
        lastActiveFlow: true,
        lastActiveStep: true,
        showHints: true,
        reducedMotion: true,
      };

      const sanitizedUpdates: Record<string, any> = {};
      for (const key of Object.keys(updates)) {
        if (allowedFields[key]) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      const progress = await prisma.onboardingProgress.upsert({
        where: {
          userId_organizationId: { userId, organizationId },
        },
        create: {
          userId,
          organizationId,
          ...sanitizedUpdates,
        },
        update: sanitizedUpdates,
      });

      // If all major milestones completed, update org-level onboarding status
      if (progress.welcomeCompleted && progress.tierTourCompleted && progress.firstFrameworkCompleted) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            onboardingCompleted: true,
            onboardingStep: 999,
          },
        });
      }

      res.json({ progress });
    } catch (error: any) {
      logger.error('Failed to update onboarding progress:', error);
      res.status(500).json({ error: 'Failed to update onboarding progress' });
    }
  }

  /**
   * POST /api/onboarding/event
   * Track an onboarding analytics event
   */
  async trackEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { eventType, flowName, stepIndex, metadata } = req.body;

      if (!eventType) {
        res.status(400).json({ error: 'eventType is required' });
        return;
      }

      const event = await prisma.onboardingEvent.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          eventType,
          flowName: flowName || null,
          stepIndex: stepIndex !== undefined ? stepIndex : null,
          metadata: metadata || null,
        },
      });

      res.status(201).json({ event });
    } catch (error: any) {
      logger.error('Failed to track onboarding event:', error);
      res.status(500).json({ error: 'Failed to track onboarding event' });
    }
  }

  /**
   * POST /api/onboarding/complete-milestone
   * Mark a specific milestone as complete
   */
  async completeMilestone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;
      const organizationId = user.organizationId;
      const { milestone } = req.body;

      if (!milestone) {
        res.status(400).json({ error: 'milestone is required' });
        return;
      }

      const milestoneFieldMap: Record<string, string> = {
        welcome: 'welcomeCompleted',
        tier_tour: 'tierTourCompleted',
        first_framework: 'firstFrameworkCompleted',
        first_evidence: 'firstEvidenceCompleted',
        first_control: 'firstControlPassCompleted',
        invite_team: 'inviteTeamCompleted',
        integration_setup: 'integrationSetupCompleted',
        ai_feature_trial: 'aiFeatureTrialCompleted',
        acos_digital_twin: 'acosDigitalTwinTourCompleted',
        advanced_features: 'advancedFeaturesTourCompleted',
      };

      const field = milestoneFieldMap[milestone];
      if (!field) {
        res.status(400).json({ error: `Invalid milestone: ${milestone}` });
        return;
      }

      const updateData: Record<string, any> = {
        [field]: true,
      };

      const progress = await prisma.onboardingProgress.upsert({
        where: {
          userId_organizationId: { userId, organizationId },
        },
        create: {
          userId,
          organizationId,
          ...updateData,
        },
        update: updateData,
      });

      // Track milestone event
      await prisma.onboardingEvent.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          eventType: 'milestone_reached',
          flowName: milestone,
          metadata: { milestone, field },
        },
      });

      // Also update the checklist if relevant
      const checklistFieldMap: Record<string, string> = {
        welcome: 'profileCompleted',
        first_framework: 'firstFrameworkAdded',
        first_evidence: 'firstEvidenceUploaded',
        first_control: 'firstControlPassed',
        invite_team: 'teamInvited',
        integration_setup: 'integrationConnected',
        ai_feature_trial: 'aiFeatureUsed',
        acos_digital_twin: 'digitalTwinActivated',
      };

      const checklistField = checklistFieldMap[milestone];
      if (checklistField) {
        await prisma.onboardingChecklist.upsert({
          where: {
            organizationId,
          },
          create: {
            organizationId,
            [checklistField]: true,
          },
          update: {
            [checklistField]: true,
          },
        });
      }

      res.json({ progress });
    } catch (error: any) {
      logger.error('Failed to complete milestone:', error);
      res.status(500).json({ error: 'Failed to complete milestone' });
    }
  }

  /**
   * PUT /api/onboarding/preferences
   * Update onboarding preferences (showHints, reducedMotion)
   */
  async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;
      const organizationId = user.organizationId;
      const { showHints, reducedMotion } = req.body;

      const updateData: Record<string, any> = {};
      if (showHints !== undefined) updateData.showHints = showHints;
      if (reducedMotion !== undefined) updateData.reducedMotion = reducedMotion;

      const progress = await prisma.onboardingProgress.upsert({
        where: {
          userId_organizationId: { userId, organizationId },
        },
        create: {
          userId,
          organizationId,
          ...updateData,
        },
        update: updateData,
      });

      res.json({ progress });
    } catch (error: any) {
      logger.error('Failed to update onboarding preferences:', error);
      res.status(500).json({ error: 'Failed to update onboarding preferences' });
    }
  }

  /**
   * POST /api/onboarding/skip-flow
   * Skip a specific flow
   */
  async skipFlow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;
      const organizationId = user.organizationId;
      const { flowName } = req.body;

      if (!flowName) {
        res.status(400).json({ error: 'flowName is required' });
        return;
      }

      // Get current progress
      const existing = await prisma.onboardingProgress.findUnique({
        where: {
          userId_organizationId: { userId, organizationId },
        },
      });

      const currentSkipped = (existing?.skippedFlows as string[]) || [];
      const updatedSkipped = currentSkipped.includes(flowName)
        ? currentSkipped
        : [...currentSkipped, flowName];

      const progress = await prisma.onboardingProgress.upsert({
        where: {
          userId_organizationId: { userId, organizationId },
        },
        create: {
          userId,
          organizationId,
          skippedFlows: updatedSkipped,
        },
        update: {
          skippedFlows: updatedSkipped,
        },
      });

      // Track skip event
      await prisma.onboardingEvent.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          eventType: 'flow_skipped',
          flowName,
        },
      });

      res.json({ progress });
    } catch (error: any) {
      logger.error('Failed to skip flow:', error);
      res.status(500).json({ error: 'Failed to skip flow' });
    }
  }

  /**
   * POST /api/onboarding/reset
   * Reset onboarding progress (admin only)
   */
  async resetProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;
      const organizationId = user.organizationId;

      // Delete existing progress
      await prisma.onboardingProgress.deleteMany({
        where: { userId, organizationId },
      });

      // Create fresh progress
      const progress = await prisma.onboardingProgress.create({
        data: {
          userId,
          organizationId,
        },
      });

      // Reset org-level onboarding status
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });

      // Track reset event
      await prisma.onboardingEvent.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          eventType: 'onboarding_reset',
        },
      });

      res.json({ progress });
    } catch (error: any) {
      logger.error('Failed to reset onboarding:', error);
      res.status(500).json({ error: 'Failed to reset onboarding' });
    }
  }

  /**
   * GET /api/onboarding/checklist
   * Get organization's setup checklist
   */
  async getChecklist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const organizationId = user.organizationId;

      const checklist = await prisma.onboardingChecklist.upsert({
        where: { organizationId },
        create: { organizationId },
        update: {},
      });

      res.json({ checklist });
    } catch (error: any) {
      logger.error('Failed to get onboarding checklist:', error);
      res.status(500).json({ error: 'Failed to get onboarding checklist' });
    }
  }

  /**
   * PUT /api/onboarding/checklist
   * Update checklist item
   */
  async updateChecklist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const organizationId = user.organizationId;
      const updates = req.body;

      const allowedFields: Record<string, boolean> = {
        profileCompleted: true,
        teamInvited: true,
        firstFrameworkAdded: true,
        firstEvidenceUploaded: true,
        firstControlPassed: true,
        integrationConnected: true,
        aiFeatureUsed: true,
        firstReportGenerated: true,
        acosConfigured: true,
        digitalTwinActivated: true,
      };

      const sanitizedUpdates: Record<string, any> = {};
      for (const key of Object.keys(updates)) {
        if (allowedFields[key]) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      const checklist = await prisma.onboardingChecklist.upsert({
        where: { organizationId },
        create: {
          organizationId,
          ...sanitizedUpdates,
        },
        update: sanitizedUpdates,
      });

      // Check if all items are complete
      const allComplete =
        checklist.profileCompleted &&
        checklist.teamInvited &&
        checklist.firstFrameworkAdded &&
        checklist.firstEvidenceUploaded &&
        checklist.firstControlPassed &&
        checklist.integrationConnected &&
        checklist.aiFeatureUsed &&
        checklist.firstReportGenerated;

      if (allComplete && !checklist.completedAt) {
        await prisma.onboardingChecklist.update({
          where: { organizationId },
          data: { completedAt: new Date() },
        });
      }

      res.json({ checklist });
    } catch (error: any) {
      logger.error('Failed to update onboarding checklist:', error);
      res.status(500).json({ error: 'Failed to update onboarding checklist' });
    }
  }
}

export const onboardingController = new OnboardingController();
