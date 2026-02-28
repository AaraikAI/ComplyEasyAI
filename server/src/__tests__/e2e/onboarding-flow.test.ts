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
  const mockOnboardingProgress = {
    id: 'onboard-123',
    organizationId: 'org-123',
    currentStep: 1,
    completedSteps: ['welcome'],
    totalSteps: 8,
    startedAt: new Date(),
    preferences: {},
  };

  const mockMilestone = {
    id: 'mile-123',
    organizationId: 'org-123',
    name: 'First Framework',
    description: 'Set up your first compliance framework',
    completed: false,
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Organization Setup Wizard', () => {
    it('should get onboarding progress', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue(mockOnboardingProgress as any);

      const response = await request(app)
        .get('/api/onboarding/progress')
        .expect(200);

      expect(response.body).toHaveProperty('currentStep');
      expect(response.body).toHaveProperty('completedSteps');
      expect(response.body).toHaveProperty('totalSteps');
    });

    it('should complete organization profile step', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue(mockOnboardingProgress as any);
      prismaMock.organization.update.mockResolvedValue({
        id: 'org-123',
        name: 'Test Company',
        industry: 'Technology',
        size: '50-200',
      } as any);
      prismaMock.onboardingProgress.update.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 2,
        completedSteps: ['welcome', 'organization-profile'],
      } as any);

      const response = await request(app)
        .post('/api/onboarding/steps/organization-profile')
        .send({
          industry: 'Technology',
          companySize: '50-200',
          headquarters: 'United States',
          website: 'https://example.com',
        })
        .expect(200);

      expect(response.body.completedSteps).toContain('organization-profile');
    });

    it('should complete framework selection step', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 2,
      } as any);
      prismaMock.framework.createMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.onboardingProgress.update.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 3,
        completedSteps: ['welcome', 'organization-profile', 'frameworks'],
      } as any);

      const response = await request(app)
        .post('/api/onboarding/steps/frameworks')
        .send({
          selectedFrameworks: ['SOC2', 'ISO27001'],
          primaryFramework: 'SOC2',
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        })
        .expect(200);

      expect(response.body.completedSteps).toContain('frameworks');
    });

    it('should complete team invitation step', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 3,
      } as any);
      prismaMock.invite.createMany.mockResolvedValue({ count: 3 } as any);
      prismaMock.onboardingProgress.update.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 4,
        completedSteps: ['welcome', 'organization-profile', 'frameworks', 'team'],
      } as any);

      const response = await request(app)
        .post('/api/onboarding/steps/team')
        .send({
          invites: [
            { email: 'analyst@example.com', role: 'Analyst' },
            { email: 'manager@example.com', role: 'Manager' },
          ],
        })
        .expect(200);

      expect(response.body.completedSteps).toContain('team');
    });

    it('should skip optional step', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue(mockOnboardingProgress as any);
      prismaMock.onboardingProgress.update.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 3,
        skippedSteps: ['integrations'],
      } as any);

      const response = await request(app)
        .post('/api/onboarding/steps/integrations/skip')
        .expect(200);

      expect(response.body.skippedSteps).toContain('integrations');
    });

    it('should complete onboarding', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue({
        ...mockOnboardingProgress,
        currentStep: 8,
        completedSteps: ['welcome', 'organization-profile', 'frameworks', 'team', 'integrations', 'security', 'preferences', 'review'],
      } as any);
      prismaMock.onboardingProgress.update.mockResolvedValue({
        ...mockOnboardingProgress,
        completedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/onboarding/complete')
        .expect(200);

      expect(response.body).toHaveProperty('completedAt');
    });
  });

  describe('Onboarding Milestones', () => {
    it('should get milestones', async () => {
      prismaMock.onboardingMilestone.findMany.mockResolvedValue([mockMilestone] as any);

      const response = await request(app)
        .get('/api/onboarding/milestones')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should complete milestone', async () => {
      prismaMock.onboardingMilestone.findFirst.mockResolvedValue(mockMilestone as any);
      prismaMock.onboardingMilestone.update.mockResolvedValue({
        ...mockMilestone,
        completed: true,
        completedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/onboarding/milestones/mile-123/complete')
        .expect(200);

      expect(response.body.completed).toBe(true);
    });

    it('should get milestone progress summary', async () => {
      prismaMock.onboardingMilestone.findMany.mockResolvedValue([
        { ...mockMilestone, completed: true },
        { ...mockMilestone, id: 'mile-2', completed: false },
      ] as any);

      const response = await request(app)
        .get('/api/onboarding/milestones/summary')
        .expect(200);

      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('progress');
    });
  });

  describe('Onboarding Preferences', () => {
    it('should save user preferences', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue(mockOnboardingProgress as any);
      prismaMock.onboardingProgress.update.mockResolvedValue({
        ...mockOnboardingProgress,
        preferences: {
          notifications: { email: true, inApp: true },
          theme: 'dark',
          dashboardLayout: 'detailed',
        },
      } as any);

      const response = await request(app)
        .post('/api/onboarding/preferences')
        .send({
          notifications: { email: true, inApp: true },
          theme: 'dark',
          dashboardLayout: 'detailed',
        })
        .expect(200);

      expect(response.body.preferences).toHaveProperty('theme');
    });

    it('should get preferences', async () => {
      prismaMock.onboardingProgress.findFirst.mockResolvedValue({
        ...mockOnboardingProgress,
        preferences: { theme: 'dark' },
      } as any);

      const response = await request(app)
        .get('/api/onboarding/preferences')
        .expect(200);

      expect(response.body).toHaveProperty('theme');
    });
  });

  describe('Onboarding Checklist', () => {
    it('should get checklist', async () => {
      prismaMock.onboardingChecklist.findMany.mockResolvedValue([
        { id: 'check-1', item: 'Create first policy', completed: true },
        { id: 'check-2', item: 'Add team member', completed: false },
        { id: 'check-3', item: 'Complete risk assessment', completed: false },
      ] as any);

      const response = await request(app)
        .get('/api/onboarding/checklist')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should mark checklist item complete', async () => {
      prismaMock.onboardingChecklist.findFirst.mockResolvedValue({
        id: 'check-2',
        item: 'Add team member',
        completed: false,
      } as any);
      prismaMock.onboardingChecklist.update.mockResolvedValue({
        id: 'check-2',
        completed: true,
        completedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/onboarding/checklist/check-2/complete')
        .expect(200);

      expect(response.body.completed).toBe(true);
    });
  });

  describe('Onboarding Events', () => {
    it('should track onboarding event', async () => {
      prismaMock.onboardingEvent.create.mockResolvedValue({
        id: 'event-123',
        type: 'step_viewed',
        step: 'frameworks',
        timestamp: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/onboarding/events')
        .send({
          type: 'step_viewed',
          step: 'frameworks',
          metadata: { timeSpent: 120 },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should get onboarding analytics', async () => {
      prismaMock.onboardingEvent.groupBy.mockResolvedValue([
        { step: 'welcome', _count: { id: 1 }, _avg: { timeSpent: 30 } },
        { step: 'frameworks', _count: { id: 1 }, _avg: { timeSpent: 180 } },
      ] as any);

      const response = await request(app)
        .get('/api/onboarding/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('stepAnalytics');
    });
  });

  describe('Demo Data', () => {
    it('should load demo data', async () => {
      prismaMock.riskItem.createMany.mockResolvedValue({ count: 5 } as any);
      prismaMock.policy.createMany.mockResolvedValue({ count: 3 } as any);
      prismaMock.control.createMany.mockResolvedValue({ count: 10 } as any);

      const response = await request(app)
        .post('/api/onboarding/demo-data')
        .send({
          includeRisks: true,
          includePolicies: true,
          includeControls: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('loaded');
    });

    it('should clear demo data', async () => {
      prismaMock.riskItem.deleteMany.mockResolvedValue({ count: 5 } as any);
      prismaMock.policy.deleteMany.mockResolvedValue({ count: 3 } as any);

      const response = await request(app)
        .delete('/api/onboarding/demo-data')
        .expect(200);

      expect(response.body).toHaveProperty('cleared', true);
    });
  });

  describe('Guided Tours', () => {
    it('should get available tours', async () => {
      const response = await request(app)
        .get('/api/onboarding/tours')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should mark tour as completed', async () => {
      prismaMock.userTourProgress.upsert.mockResolvedValue({
        userId: 'user-123',
        tourId: 'dashboard-tour',
        completedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/onboarding/tours/dashboard-tour/complete')
        .expect(200);

      expect(response.body).toHaveProperty('completedAt');
    });
  });
});
