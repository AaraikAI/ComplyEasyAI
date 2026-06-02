/**
 * AI RMF Routes Integration Tests
 *
 * Tests for NIST AI Risk Management Framework implementation.
 *
 * These tests exercise the REAL aiRmfController (route -> asyncHandler -> controller)
 * and stub only the data-access layer (aiRmfService). This verifies that:
 *  - each route is mounted on the correct method/path and reaches the right handler,
 *  - the controller passes the authenticated org/user scope down to the service,
 *  - the controller maps service results/errors to the documented HTTP shape
 *    (e.g. delete -> { success: true }, calculate -> { score }, AppError -> status).
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Service stub: the controller delegates all persistence to aiRmfService.
const aiRmfServiceMock = {
  createAISystem: jest.fn() as any,
  getAISystems: jest.fn() as any,
  getAISystemById: jest.fn() as any,
  updateAISystem: jest.fn() as any,
  deleteAISystem: jest.fn() as any,
  updateCoreFunction: jest.fn() as any,
  updateCategory: jest.fn() as any,
  updateSubcategory: jest.fn() as any,
  updateTrustworthinessCharacteristic: jest.fn() as any,
  updateLifecycleStage: jest.fn() as any,
  addActor: jest.fn() as any,
  removeActor: jest.fn() as any,
  createAssessment: jest.fn() as any,
  getAssessments: jest.fn() as any,
  deleteAssessment: jest.fn() as any,
  createProfile: jest.fn() as any,
  createRiskActivity: jest.fn() as any,
  updateRiskActivity: jest.fn() as any,
  calculateTrustworthinessScore: jest.fn() as any,
  getDashboardData: jest.fn() as any,
};

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
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(_req: any, _res: any, next: any) => next()],
}));

// Real validateBody is permissive enough for the payloads below; stub it so the
// suite focuses on controller<->service wiring rather than Joi schema specifics.
jest.mock('../../../middleware/validate', () => ({
  validateBody: () => (_req: any, _res: any, next: any) => next(),
}));

// Stub the data-access service (the unit under test is the controller above it).
jest.mock('../../../services/aiRmfService', () => ({
  __esModule: true,
  default: aiRmfServiceMock,
}));

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  const { errorHandler } = await import('../../../middleware/errorHandler');
  const aiRmfRoutes = (await import('../../../routes/aiRmf')).default;
  app.use('/api/ai-rmf', aiRmfRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  Object.values(aiRmfServiceMock).forEach((fn: any) => fn.mockReset());
});

describe('AI RMF Routes Integration', () => {
  // ===========================================================================
  // AI System Management
  // ===========================================================================
  describe('AI System Management', () => {
    describe('POST /api/ai-rmf/systems', () => {
      it('creates a system scoped to the caller org and returns 201 with the service result', async () => {
        aiRmfServiceMock.createAISystem.mockResolvedValue({
          id: 'ai-rmf-system-123',
          name: 'Risk Assessment Model',
          status: 'Active',
          organizationId: 'org-123',
        });

        const response = await request(app)
          .post('/api/ai-rmf/systems')
          .send({
            name: 'Risk Assessment Model',
            description: 'ML model for risk assessment',
            useCase: 'Automated risk scoring',
            deploymentContext: 'Production',
          })
          .expect(201);

        expect(response.body).toEqual(
          expect.objectContaining({ id: 'ai-rmf-system-123', status: 'Active' })
        );
        // Controller must scope to org-123 and forward the payload fields.
        expect(aiRmfServiceMock.createAISystem).toHaveBeenCalledTimes(1);
        const [orgArg, payloadArg, userArg] = aiRmfServiceMock.createAISystem.mock.calls[0];
        expect(orgArg).toBe('org-123');
        expect(userArg).toBe('user-123');
        expect(payloadArg).toEqual(
          expect.objectContaining({
            name: 'Risk Assessment Model',
            useCase: 'Automated risk scoring',
            deploymentContext: 'Production',
          })
        );
      });

      it('maps a service AppError to its HTTP status', async () => {
        const { AppError } = await import('../../../middleware/errorHandler');
        aiRmfServiceMock.createAISystem.mockRejectedValue(new AppError('Name already exists', 409));

        const response = await request(app)
          .post('/api/ai-rmf/systems')
          .send({ name: 'dup' })
          .expect(409);

        expect(response.body.error || response.body.message).toMatch(/already exists/i);
      });
    });

    describe('GET /api/ai-rmf/systems', () => {
      it('returns systems for the caller org and passes query filters through', async () => {
        aiRmfServiceMock.getAISystems.mockResolvedValue([
          { id: 'sys-1', name: 'ML Model A', status: 'Active' },
          { id: 'sys-2', name: 'ML Model B', status: 'Development' },
        ]);

        const response = await request(app)
          .get('/api/ai-rmf/systems?status=Active')
          .expect(200);

        expect(response.body).toHaveLength(2);
        expect(aiRmfServiceMock.getAISystems).toHaveBeenCalledWith(
          'org-123',
          expect.objectContaining({ status: 'Active' })
        );
      });
    });

    describe('GET /api/ai-rmf/systems/:id', () => {
      it('fetches the system by id within the caller org', async () => {
        aiRmfServiceMock.getAISystemById.mockResolvedValue({
          id: 'sys-123',
          name: 'AI System',
          coreFunctions: [],
          trustworthinessCharacteristics: [],
        });

        const response = await request(app)
          .get('/api/ai-rmf/systems/sys-123')
          .expect(200);

        expect(response.body).toHaveProperty('id', 'sys-123');
        expect(aiRmfServiceMock.getAISystemById).toHaveBeenCalledWith('org-123', 'sys-123');
      });

      it('returns 404 when the service reports the system is absent', async () => {
        const { AppError } = await import('../../../middleware/errorHandler');
        aiRmfServiceMock.getAISystemById.mockRejectedValue(new AppError('AI System not found', 404));

        await request(app).get('/api/ai-rmf/systems/nonexistent').expect(404);
        expect(aiRmfServiceMock.getAISystemById).toHaveBeenCalledWith('org-123', 'nonexistent');
      });
    });

    describe('PATCH /api/ai-rmf/systems/:id', () => {
      it('updates the system with the org scope and request body', async () => {
        aiRmfServiceMock.updateAISystem.mockResolvedValue({ id: 'sys-123', status: 'Development' });

        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123')
          .send({ status: 'Development', description: 'Updated description' })
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({ id: 'sys-123', status: 'Development' })
        );
        const [orgArg, idArg, bodyArg] = aiRmfServiceMock.updateAISystem.mock.calls[0];
        expect(orgArg).toBe('org-123');
        expect(idArg).toBe('sys-123');
        expect(bodyArg).toEqual(expect.objectContaining({ status: 'Development' }));
      });
    });

    describe('DELETE /api/ai-rmf/systems/:id', () => {
      it('deletes and returns the documented { success: true } shape', async () => {
        aiRmfServiceMock.deleteAISystem.mockResolvedValue(undefined);

        const response = await request(app)
          .delete('/api/ai-rmf/systems/sys-123')
          .expect(200);

        // Controller normalizes delete to { success: true } regardless of service return.
        expect(response.body).toEqual({ success: true });
        // Controller forwards request context: ipAddress (string) and userAgent (undefined here).
        expect(aiRmfServiceMock.deleteAISystem).toHaveBeenCalledWith(
          'org-123',
          'sys-123',
          'user-123',
          expect.any(String),
          undefined
        );
      });
    });
  });

  // ===========================================================================
  // Core Functions
  // ===========================================================================
  describe('Core Functions', () => {
    it('updates a core function, forwarding org/system/function and body', async () => {
      aiRmfServiceMock.updateCoreFunction.mockResolvedValue({
        functionName: 'GOVERN',
        status: 'Implemented',
      });

      const response = await request(app)
        .patch('/api/ai-rmf/systems/sys-123/functions/GOVERN')
        .send({ status: 'Implemented', maturityLevel: 3 })
        .expect(200);

      expect(response.body).toHaveProperty('functionName', 'GOVERN');
      const [orgArg, sysArg, fnArg, bodyArg] = aiRmfServiceMock.updateCoreFunction.mock.calls[0];
      expect(orgArg).toBe('org-123');
      expect(sysArg).toBe('sys-123');
      expect(fnArg).toBe('GOVERN');
      expect(bodyArg).toEqual(expect.objectContaining({ status: 'Implemented', maturityLevel: 3 }));
    });
  });

  // ===========================================================================
  // Categories and Subcategories
  // ===========================================================================
  describe('Categories and Subcategories', () => {
    it('updates a category scoped to the org', async () => {
      aiRmfServiceMock.updateCategory.mockResolvedValue({ id: 'cat-123', status: 'Compliant' });

      await request(app)
        .patch('/api/ai-rmf/categories/cat-123')
        .send({ status: 'Compliant', notes: 'All requirements met' })
        .expect(200);

      expect(aiRmfServiceMock.updateCategory).toHaveBeenCalledWith(
        'org-123',
        'cat-123',
        expect.objectContaining({ status: 'Compliant' }),
        'user-123',
        expect.any(String),
        undefined
      );
    });

    it('updates a subcategory scoped to the org', async () => {
      aiRmfServiceMock.updateSubcategory.mockResolvedValue({ id: 'subcat-123', status: 'In Progress' });

      await request(app)
        .patch('/api/ai-rmf/subcategories/subcat-123')
        .send({ status: 'In Progress' })
        .expect(200);

      expect(aiRmfServiceMock.updateSubcategory).toHaveBeenCalledWith(
        'org-123',
        'subcat-123',
        expect.objectContaining({ status: 'In Progress' }),
        'user-123',
        expect.any(String),
        undefined
      );
    });
  });

  // ===========================================================================
  // Trustworthiness Characteristics
  // ===========================================================================
  describe('Trustworthiness Characteristics', () => {
    it('updates a characteristic, forwarding the score in the body', async () => {
      aiRmfServiceMock.updateTrustworthinessCharacteristic.mockResolvedValue({
        characteristic: 'validity',
        score: 85,
      });

      const response = await request(app)
        .patch('/api/ai-rmf/systems/sys-123/trustworthiness/validity')
        .send({ score: 85, evidence: ['Validation reports'] })
        .expect(200);

      expect(response.body).toHaveProperty('characteristic', 'validity');
      const call = aiRmfServiceMock.updateTrustworthinessCharacteristic.mock.calls[0];
      expect(call[0]).toBe('org-123');
      expect(call[1]).toBe('sys-123');
      expect(call[2]).toBe('validity');
      expect(call[3]).toEqual(expect.objectContaining({ score: 85 }));
    });
  });

  // ===========================================================================
  // Lifecycle Stages
  // ===========================================================================
  describe('Lifecycle Stages', () => {
    it('updates a lifecycle stage scoped to the org/system', async () => {
      aiRmfServiceMock.updateLifecycleStage.mockResolvedValue({ stage: 'deployment', status: 'In Progress' });

      const response = await request(app)
        .patch('/api/ai-rmf/systems/sys-123/lifecycle/deployment')
        .send({ status: 'In Progress' })
        .expect(200);

      expect(response.body).toHaveProperty('stage', 'deployment');
      const call = aiRmfServiceMock.updateLifecycleStage.mock.calls[0];
      expect(call[0]).toBe('org-123');
      expect(call[1]).toBe('sys-123');
      expect(call[2]).toBe('deployment');
    });
  });

  // ===========================================================================
  // AI Actors
  // ===========================================================================
  describe('AI Actors', () => {
    it('adds an actor (201) scoped to the org/system', async () => {
      aiRmfServiceMock.addActor.mockResolvedValue({ id: 'actor-123', name: 'ML Engineer' });

      const response = await request(app)
        .post('/api/ai-rmf/systems/sys-123/actors')
        .send({ name: 'ML Engineer', role: 'Developer' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'actor-123');
      expect(aiRmfServiceMock.addActor).toHaveBeenCalledWith(
        'org-123',
        'sys-123',
        expect.objectContaining({ name: 'ML Engineer', role: 'Developer' })
      );
    });

    it('removes an actor and returns { success: true }', async () => {
      aiRmfServiceMock.removeActor.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/ai-rmf/actors/actor-123')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(aiRmfServiceMock.removeActor).toHaveBeenCalledWith('org-123', 'actor-123');
    });
  });

  // ===========================================================================
  // Assessments
  // ===========================================================================
  describe('Assessments', () => {
    it('creates an assessment (201) scoped to the org/system', async () => {
      aiRmfServiceMock.createAssessment.mockResolvedValue({ id: 'assessment-123', status: 'In Progress' });

      const response = await request(app)
        .post('/api/ai-rmf/systems/sys-123/assessments')
        .send({ assessmentType: 'Impact', scope: 'Full system' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'assessment-123');
      const call = aiRmfServiceMock.createAssessment.mock.calls[0];
      expect(call[0]).toBe('org-123');
      expect(call[1]).toBe('sys-123');
      expect(call[2]).toEqual(expect.objectContaining({ assessmentType: 'Impact' }));
    });

    it('lists assessments for the org/system', async () => {
      aiRmfServiceMock.getAssessments.mockResolvedValue([
        { id: 'assess-1', status: 'Completed' },
        { id: 'assess-2', status: 'In Progress' },
      ]);

      const response = await request(app)
        .get('/api/ai-rmf/systems/sys-123/assessments')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(aiRmfServiceMock.getAssessments).toHaveBeenCalledWith('org-123', 'sys-123');
    });

    it('deletes an assessment and returns { success: true }', async () => {
      aiRmfServiceMock.deleteAssessment.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/ai-rmf/assessments/assess-123')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(aiRmfServiceMock.deleteAssessment).toHaveBeenCalledWith(
        'org-123',
        'assess-123',
        'user-123',
        expect.any(String),
        undefined
      );
    });
  });

  // ===========================================================================
  // Profiles
  // ===========================================================================
  describe('Profiles', () => {
    it('creates a profile (201) scoped to the org/system', async () => {
      aiRmfServiceMock.createProfile.mockResolvedValue({ id: 'profile-123', profileType: 'Current' });

      const response = await request(app)
        .post('/api/ai-rmf/systems/sys-123/profiles')
        .send({ profileType: 'Current', targetState: { governMaturity: 3 } })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'profile-123');
      expect(aiRmfServiceMock.createProfile).toHaveBeenCalledWith(
        'org-123',
        'sys-123',
        expect.objectContaining({ profileType: 'Current' })
      );
    });
  });

  // ===========================================================================
  // Risk Activities
  // ===========================================================================
  describe('Risk Activities', () => {
    it('creates a risk activity (201) scoped to the org/system', async () => {
      aiRmfServiceMock.createRiskActivity.mockResolvedValue({ id: 'risk-activity-123', status: 'Pending' });

      const response = await request(app)
        .post('/api/ai-rmf/systems/sys-123/risk-activities')
        .send({ activityType: 'Risk Identification', description: 'Identify bias' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'risk-activity-123');
      const call = aiRmfServiceMock.createRiskActivity.mock.calls[0];
      expect(call[0]).toBe('org-123');
      expect(call[1]).toBe('sys-123');
    });

    it('updates a risk activity scoped to the org', async () => {
      aiRmfServiceMock.updateRiskActivity.mockResolvedValue({ id: 'risk-act-123', status: 'Completed' });

      await request(app)
        .patch('/api/ai-rmf/risk-activities/risk-act-123')
        .send({ status: 'Completed' })
        .expect(200);

      expect(aiRmfServiceMock.updateRiskActivity).toHaveBeenCalledWith(
        'org-123',
        'risk-act-123',
        expect.objectContaining({ status: 'Completed' }),
        'user-123',
        expect.any(String),
        undefined
      );
    });
  });

  // ===========================================================================
  // Analytics and Reporting
  // ===========================================================================
  describe('Analytics and Reporting', () => {
    it('returns the trustworthiness score wrapped as { score }', async () => {
      aiRmfServiceMock.calculateTrustworthinessScore.mockResolvedValue({
        overallScore: 78,
        dimensions: { validity: 85, fairness: 76, explainability: 72 },
      });

      const response = await request(app)
        .post('/api/ai-rmf/systems/sys-123/calculate-trustworthiness')
        .expect(200);

      // Controller wraps the service result under a `score` key.
      expect(response.body).toHaveProperty('score');
      expect(response.body.score).toHaveProperty('overallScore', 78);
      expect(response.body.score.dimensions).toHaveProperty('validity', 85);
      expect(aiRmfServiceMock.calculateTrustworthinessScore).toHaveBeenCalledWith('org-123', 'sys-123');
    });

    it('returns dashboard data for the caller org', async () => {
      aiRmfServiceMock.getDashboardData.mockResolvedValue({
        totalSystems: 5,
        systemsByStatus: { Active: 3 },
        averageTrustworthiness: 76,
        pendingAssessments: 2,
        riskDistribution: { High: 1, Medium: 2, Low: 2 },
      });

      const response = await request(app)
        .get('/api/ai-rmf/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalSystems', 5);
      expect(response.body).toHaveProperty('riskDistribution');
      expect(aiRmfServiceMock.getDashboardData).toHaveBeenCalledWith('org-123');
    });
  });
});
