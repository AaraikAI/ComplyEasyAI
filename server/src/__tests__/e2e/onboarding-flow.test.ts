/**
 * E2E Tests - Onboarding Flow
 * Tests complete user and organization onboarding workflows including
 * setup wizard, initial configuration, and progress tracking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
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

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

import onboardingRoutes from '../../routes/onboarding';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/onboarding', onboardingRoutes);
app.use(errorHandler);

describe('E2E: Onboarding Flow', () => {
  const mockProgress = {
    id: 'onboard-123',
    userId: 'user-123',
    organizationId: 'org-123',
    currentFlow: null,
    currentStep: 0,
    welcomeCompleted: false,
    tierTourCompleted: false,
    firstFrameworkCompleted: false,
    skippedFlows: [],
    showHints: true,
    reducedMotion: false,
  };

  const mockChecklist = {
    id: 'checklist-123',
    organizationId: 'org-123',
    profileCompleted: false,
    teamInvited: false,
    firstFrameworkAdded: false,
    firstEvidenceUploaded: false,
    firstControlPassed: false,
    integrationConnected: false,
    aiFeatureUsed: false,
    firstReportGenerated: false,
    completedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Upsert/create/event fallbacks used across the controller.
    prismaMock.onboardingProgress.upsert.mockResolvedValue(mockProgress as any);
    prismaMock.onboardingProgress.create.mockResolvedValue(mockProgress as any);
    prismaMock.onboardingProgress.findUnique.mockResolvedValue(mockProgress as any);
    prismaMock.onboardingProgress.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.onboardingChecklist.upsert.mockResolvedValue(mockChecklist as any);
    prismaMock.onboardingEvent.create.mockResolvedValue({ id: 'event-123' } as any);
    prismaMock.organization.findUnique.mockResolvedValue({
      plan: 'Growth',
      name: 'Test Company',
      onboardingCompleted: false,
      onboardingStep: 0,
    } as any);
    prismaMock.organization.update.mockResolvedValue({ id: 'org-123' } as any);
  });

  describe('Progress tracking', () => {
    it('should get onboarding progress (upserting if absent)', async () => {
      const response = await request(app)
        .get('/api/onboarding/progress')
        .expect(200);

      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('organizationPlan', 'Growth');
      expect(response.body).toHaveProperty('onboardingCompleted', false);
    });

    it('should update onboarding progress (whitelisted fields only)', async () => {
      prismaMock.onboardingProgress.upsert.mockResolvedValue({
        ...mockProgress,
        currentStep: 2,
        welcomeCompleted: true,
      } as any);

      const response = await request(app)
        .put('/api/onboarding/progress')
        .send({ currentStep: 2, currentFlow: 'main' })
        .expect(200);

      expect(response.body.progress).toHaveProperty('currentStep', 2);
    });

    it('should reject progress update with an invalid field shape', async () => {
      const response = await request(app)
        .put('/api/onboarding/progress')
        .send({ currentStep: 'not-a-number', bogusField: true })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reset onboarding progress', async () => {
      const response = await request(app)
        .post('/api/onboarding/reset')
        .expect(200);

      expect(response.body).toHaveProperty('progress');
    });
  });

  describe('Milestones', () => {
    it('should complete a known milestone', async () => {
      prismaMock.onboardingProgress.upsert.mockResolvedValue({
        ...mockProgress,
        firstFrameworkCompleted: true,
      } as any);

      const response = await request(app)
        .post('/api/onboarding/complete-milestone')
        .send({ milestone: 'first_framework' })
        .expect(200);

      expect(response.body).toHaveProperty('progress');
    });

    it('should reject an unknown milestone', async () => {
      const response = await request(app)
        .post('/api/onboarding/complete-milestone')
        .send({ milestone: 'not_a_real_milestone' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Events', () => {
    it('should track an onboarding event', async () => {
      prismaMock.onboardingEvent.create.mockResolvedValue({
        id: 'event-123',
        eventType: 'step_viewed',
      } as any);

      // Frontend sends { eventType, flowName?, stepIndex?, metadata? }.
      const response = await request(app)
        .post('/api/onboarding/event')
        .send({
          eventType: 'step_viewed',
          flowName: 'main',
          stepIndex: 2,
          metadata: { source: 'tour' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('event');
      expect(response.body.event).toHaveProperty('id', 'event-123');
    });

    it('should reject an event without eventType', async () => {
      const response = await request(app)
        .post('/api/onboarding/event')
        .send({ metadata: { foo: 'bar' } })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Preferences', () => {
    it('should update onboarding preferences', async () => {
      prismaMock.onboardingProgress.upsert.mockResolvedValue({
        ...mockProgress,
        showHints: false,
        reducedMotion: true,
      } as any);

      const response = await request(app)
        .put('/api/onboarding/preferences')
        .send({ showHints: false, reducedMotion: true })
        .expect(200);

      expect(response.body.progress).toHaveProperty('showHints', false);
    });
  });

  describe('Checklist', () => {
    it('should get the organization checklist (upserting if absent)', async () => {
      const response = await request(app)
        .get('/api/onboarding/checklist')
        .expect(200);

      expect(response.body).toHaveProperty('checklist');
      expect(response.body.checklist).toHaveProperty('organizationId', 'org-123');
    });

    it('should update a checklist item', async () => {
      prismaMock.onboardingChecklist.upsert.mockResolvedValue({
        ...mockChecklist,
        profileCompleted: true,
      } as any);

      // Frontend sends Partial<OnboardingChecklist> (boolean field flags); the
      // schema and controller both operate on those field names.
      const response = await request(app)
        .put('/api/onboarding/checklist')
        .send({ profileCompleted: true })
        .expect(200);

      expect(response.body).toHaveProperty('checklist');
      expect(response.body.checklist).toHaveProperty('profileCompleted', true);
    });

    it('should reject a checklist update with no recognized fields', async () => {
      const response = await request(app)
        .put('/api/onboarding/checklist')
        .send({ itemId: 'profileCompleted', completed: true })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Skip flow', () => {
    it('should accept a skip-flow request shape', async () => {
      prismaMock.onboardingProgress.upsert.mockResolvedValue({
        ...mockProgress,
        skippedFlows: ['tier_tour'],
      } as any);

      // Frontend sends { flowName }; the schema and controller agree on that name.
      const response = await request(app)
        .post('/api/onboarding/skip-flow')
        .send({ flowName: 'tier_tour' })
        .expect(200);

      expect(response.body).toHaveProperty('progress');
      expect(response.body.progress.skippedFlows).toContain('tier_tour');
    });

    it('should reject a skip-flow request missing flowName', async () => {
      const response = await request(app)
        .post('/api/onboarding/skip-flow')
        .send({ flow: 'tier_tour' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
