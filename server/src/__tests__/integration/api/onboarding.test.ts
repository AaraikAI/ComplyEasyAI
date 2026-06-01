/**
 * Onboarding Routes Integration Tests
 *
 * Tests for onboarding progress, checklist, events, and preferences.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
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

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

// Mock onboarding controller - named export, method names must match route usage
const mockOnboardingController = {
  getProgress: jest.fn(),
  updateProgress: jest.fn(),
  trackEvent: jest.fn(),
  completeMilestone: jest.fn(),
  updatePreferences: jest.fn(),
  skipFlow: jest.fn(),
  resetProgress: jest.fn(),
  getChecklist: jest.fn(),
  updateChecklist: jest.fn(),
};

jest.mock('../../../controllers/onboardingController', () => ({
  __esModule: true,
  onboardingController: mockOnboardingController,
}));

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  // Re-setup mock implementations (resetMocks: true clears them between tests)
  mockOnboardingController.getProgress.mockImplementation((req: any, res: any) => {
    res.json({
      currentStep: 2,
      totalSteps: 5,
      completedSteps: ['welcome', 'profile'],
      nextStep: 'team',
      percentComplete: 40,
    });
  });
  mockOnboardingController.updateProgress.mockImplementation((req: any, res: any) => {
    res.json({ currentStep: req.body.currentStep, updated: true });
  });
  mockOnboardingController.trackEvent.mockImplementation((req: any, res: any) => {
    res.json({ eventId: 'event-123', eventType: req.body.eventType, recorded: true });
  });
  mockOnboardingController.completeMilestone.mockImplementation((req: any, res: any) => {
    res.json({ milestone: req.body.milestone, completed: true, completedAt: new Date().toISOString() });
  });
  mockOnboardingController.updatePreferences.mockImplementation((req: any, res: any) => {
    res.json({ preferences: req.body, updated: true });
  });
  mockOnboardingController.skipFlow.mockImplementation((req: any, res: any) => {
    res.json({ skipped: true, skipReason: req.body.reason });
  });
  mockOnboardingController.resetProgress.mockImplementation((req: any, res: any) => {
    res.json({ reset: true, currentStep: 1 });
  });
  mockOnboardingController.getChecklist.mockImplementation((req: any, res: any) => {
    res.json({
      items: [
        { id: 'item-1', title: 'Create account', completed: true },
        { id: 'item-2', title: 'Set up profile', completed: true },
        { id: 'item-3', title: 'Invite team', completed: false },
        { id: 'item-4', title: 'Connect integrations', completed: false },
        { id: 'item-5', title: 'Review compliance', completed: false },
      ],
    });
  });
  mockOnboardingController.updateChecklist.mockImplementation((req: any, res: any) => {
    res.json({ items: req.body.items, updated: true });
  });

  app = express();
  app.use(express.json());

  const onboardingRoutes = (await import('../../../routes/onboarding')).default;
  app.use('/api/onboarding', onboardingRoutes);
});

describe('Onboarding Routes Integration', () => {
  // ===========================================================================
  // Progress Tests
  // ===========================================================================
  describe('Onboarding Progress', () => {
    describe('GET /api/onboarding/progress', () => {
      it('should return onboarding progress', async () => {
        const response = await request(app)
          .get('/api/onboarding/progress')
          .expect(200);

        expect(response.body).toHaveProperty('currentStep');
        expect(response.body).toHaveProperty('totalSteps');
        expect(response.body).toHaveProperty('completedSteps');
        expect(response.body).toHaveProperty('percentComplete');
      });
    });

    describe('PUT /api/onboarding/progress', () => {
      it('should update onboarding progress', async () => {
        const response = await request(app)
          .put('/api/onboarding/progress')
          .send({
            currentStep: 3,
            completedSteps: ['welcome', 'profile', 'team'],
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
        expect(response.body.currentStep).toBe(3);
      });
    });
  });

  // ===========================================================================
  // Event Recording Tests
  // ===========================================================================
  describe('Event Recording', () => {
    describe('POST /api/onboarding/event', () => {
      it('should record onboarding event', async () => {
        const response = await request(app)
          .post('/api/onboarding/event')
          .send({
            eventType: 'step_viewed',
            flowName: 'tier_tour',
            stepIndex: 1,
            metadata: { stepId: 'team', source: 'dashboard' },
          })
          .expect(200);

        expect(response.body).toHaveProperty('eventId');
        expect(response.body).toHaveProperty('recorded', true);
      });
    });
  });

  // ===========================================================================
  // Milestone Tests
  // ===========================================================================
  describe('Milestone Completion', () => {
    describe('POST /api/onboarding/complete-milestone', () => {
      it('should complete milestone', async () => {
        const response = await request(app)
          .post('/api/onboarding/complete-milestone')
          .send({
            milestone: 'first_integration',
          })
          .expect(200);

        expect(response.body).toHaveProperty('completed', true);
        expect(response.body.milestone).toBe('first_integration');
      });
    });
  });

  // ===========================================================================
  // Preferences Tests
  // ===========================================================================
  describe('Preferences', () => {
    describe('PUT /api/onboarding/preferences', () => {
      it('should update onboarding preferences', async () => {
        const response = await request(app)
          .put('/api/onboarding/preferences')
          .send({
            showHints: true,
            reducedMotion: false,
            theme: 'dark',
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
        expect(response.body.preferences).toHaveProperty('showHints', true);
      });
    });
  });

  // ===========================================================================
  // Skip/Reset Tests
  // ===========================================================================
  describe('Skip and Reset', () => {
    describe('POST /api/onboarding/skip-flow', () => {
      it('should skip onboarding flow', async () => {
        const response = await request(app)
          .post('/api/onboarding/skip-flow')
          .send({
            flowName: 'tier_tour',
          })
          .expect(200);

        expect(response.body).toHaveProperty('skipped', true);
      });
    });

    describe('POST /api/onboarding/reset', () => {
      it('should reset onboarding', async () => {
        const response = await request(app)
          .post('/api/onboarding/reset')
          .expect(200);

        expect(response.body).toHaveProperty('reset', true);
        expect(response.body.currentStep).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Checklist Tests
  // ===========================================================================
  describe('Checklist', () => {
    describe('GET /api/onboarding/checklist', () => {
      it('should return onboarding checklist', async () => {
        const response = await request(app)
          .get('/api/onboarding/checklist')
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items.length).toBe(5);
      });

      it('should include completion status for each item', async () => {
        const response = await request(app)
          .get('/api/onboarding/checklist')
          .expect(200);

        response.body.items.forEach((item: any) => {
          expect(item).toHaveProperty('completed');
          expect(item).toHaveProperty('title');
        });
      });
    });

    describe('PUT /api/onboarding/checklist', () => {
      it('should update checklist items', async () => {
        const response = await request(app)
          .put('/api/onboarding/checklist')
          .send({
            profileCompleted: true,
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
      });
    });
  });
});
