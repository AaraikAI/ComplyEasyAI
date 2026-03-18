/**
 * AI RMF Routes Integration Tests
 *
 * Tests for NIST AI Risk Management Framework implementation.
 */

import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
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

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(req: any, res: any, next: any) => next()],
}));

jest.mock('../../../middleware/validate', () => ({
  validateBody: () => (req: any, res: any, next: any) => next(),
}));

// Mock AI RMF controller
jest.mock('../../../controllers/aiRmfController', () => ({
  __esModule: true,
  default: {
    // AI System Management
    createAISystem: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'ai-rmf-system-123',
        name: req.body.name,
        description: req.body.description,
        purpose: req.body.purpose,
        status: 'Active',
        organizationId: 'org-123',
      });
    }),
    getAISystems: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'sys-1', name: 'ML Model A', purpose: 'Classification', status: 'Active' },
        { id: 'sys-2', name: 'ML Model B', purpose: 'Prediction', status: 'Development' },
      ]);
    }),
    getAISystemById: jest.fn().mockImplementation((req, res) => {
      if (req.params.id === 'nonexistent') {
        return res.status(404).json({ error: 'AI System not found' });
      }
      res.json({
        id: req.params.id,
        name: 'AI System',
        purpose: 'Risk Analysis',
        status: 'Active',
        coreFunctions: [],
        trustworthinessCharacteristics: [],
        lifecycleStages: [],
        actors: [],
      });
    }),
    updateAISystem: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, ...req.body, updated: true });
    }),
    deleteAISystem: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, id: req.params.id });
    }),

    // Core Functions
    updateCoreFunction: jest.fn().mockImplementation((req, res) => {
      res.json({
        aiSystemId: req.params.aiSystemId,
        functionName: req.params.functionName,
        status: req.body.status,
        updated: true,
      });
    }),

    // Categories and Subcategories
    updateCategory: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.categoryId,
        ...req.body,
        updated: true,
      });
    }),
    updateSubcategory: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.subcategoryId,
        ...req.body,
        updated: true,
      });
    }),

    // Trustworthiness Characteristics
    updateTrustworthinessCharacteristic: jest.fn().mockImplementation((req, res) => {
      res.json({
        aiSystemId: req.params.aiSystemId,
        characteristic: req.params.characteristic,
        score: req.body.score,
        evidence: req.body.evidence,
        updated: true,
      });
    }),

    // Lifecycle Stages
    updateLifecycleStage: jest.fn().mockImplementation((req, res) => {
      res.json({
        aiSystemId: req.params.aiSystemId,
        stage: req.params.stage,
        status: req.body.status,
        updated: true,
      });
    }),

    // AI Actors
    addActor: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'actor-123',
        aiSystemId: req.params.aiSystemId,
        name: req.body.name,
        role: req.body.role,
        responsibilities: req.body.responsibilities,
      });
    }),
    removeActor: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, actorId: req.params.actorId });
    }),

    // Assessments
    createAssessment: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'assessment-123',
        aiSystemId: req.params.aiSystemId,
        assessmentType: req.body.assessmentType,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
      });
    }),
    getAssessments: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'assess-1', aiSystemId: req.params.aiSystemId, type: 'Impact', status: 'Completed' },
        { id: 'assess-2', aiSystemId: req.params.aiSystemId, type: 'Bias', status: 'In Progress' },
      ]);
    }),
    deleteAssessment: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, assessmentId: req.params.assessmentId });
    }),

    // Profiles
    createProfile: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'profile-123',
        aiSystemId: req.params.aiSystemId,
        profileType: req.body.profileType,
        targetState: req.body.targetState,
        createdAt: new Date().toISOString(),
      });
    }),

    // Risk Activities
    createRiskActivity: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'risk-activity-123',
        aiSystemId: req.params.aiSystemId,
        activityType: req.body.activityType,
        description: req.body.description,
        status: 'Pending',
      });
    }),
    updateRiskActivity: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.riskActivityId,
        ...req.body,
        updated: true,
      });
    }),

    // Analytics and Reporting
    calculateTrustworthinessScore: jest.fn().mockImplementation((req, res) => {
      res.json({
        aiSystemId: req.params.aiSystemId,
        overallScore: 78,
        dimensions: {
          validity: 85,
          reliability: 80,
          safety: 75,
          security: 82,
          accountability: 70,
          transparency: 78,
          explainability: 72,
          privacy: 80,
          fairness: 76,
        },
        calculatedAt: new Date().toISOString(),
      });
    }),
    getDashboardData: jest.fn().mockImplementation((req, res) => {
      res.json({
        totalSystems: 5,
        systemsByStatus: { Active: 3, Development: 1, Archived: 1 },
        averageTrustworthiness: 76,
        pendingAssessments: 2,
        recentActivities: [],
        riskDistribution: { High: 1, Medium: 2, Low: 2 },
      });
    }),
  },
}));

// Setup app once (controller is fully mocked, no need to re-import per test)
let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const aiRmfRoutes = (await import('../../../routes/aiRmf')).default;
  app.use('/api/ai-rmf', aiRmfRoutes);
});

beforeEach(() => {
  jest.clearAllMocks();

  // Re-setup controller mocks after clearAllMocks
  const controller = require('../../../controllers/aiRmfController').default;
  controller.createAISystem.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'ai-rmf-system-123', name: req.body.name, description: req.body.description, purpose: req.body.purpose, status: 'Active', organizationId: 'org-123' });
  });
  controller.getAISystems.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'sys-1', name: 'ML Model A', purpose: 'Classification', status: 'Active' }, { id: 'sys-2', name: 'ML Model B', purpose: 'Prediction', status: 'Development' }]);
  });
  controller.getAISystemById.mockImplementation((req: any, res: any) => {
    if (req.params.id === 'nonexistent') return res.status(404).json({ error: 'AI System not found' });
    res.json({ id: req.params.id, name: 'AI System', purpose: 'Risk Analysis', status: 'Active', coreFunctions: [], trustworthinessCharacteristics: [], lifecycleStages: [], actors: [] });
  });
  controller.updateAISystem.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, ...req.body, updated: true });
  });
  controller.deleteAISystem.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, id: req.params.id });
  });
  controller.updateCoreFunction.mockImplementation((req: any, res: any) => {
    res.json({ aiSystemId: req.params.aiSystemId, functionName: req.params.functionName, status: req.body.status, updated: true });
  });
  controller.updateCategory.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.categoryId, ...req.body, updated: true });
  });
  controller.updateSubcategory.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.subcategoryId, ...req.body, updated: true });
  });
  controller.updateTrustworthinessCharacteristic.mockImplementation((req: any, res: any) => {
    res.json({ aiSystemId: req.params.aiSystemId, characteristic: req.params.characteristic, score: req.body.score, evidence: req.body.evidence, updated: true });
  });
  controller.updateLifecycleStage.mockImplementation((req: any, res: any) => {
    res.json({ aiSystemId: req.params.aiSystemId, stage: req.params.stage, status: req.body.status, updated: true });
  });
  controller.addActor.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'actor-123', aiSystemId: req.params.aiSystemId, name: req.body.name, role: req.body.role, responsibilities: req.body.responsibilities });
  });
  controller.removeActor.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, actorId: req.params.actorId });
  });
  controller.createAssessment.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'assessment-123', aiSystemId: req.params.aiSystemId, assessmentType: req.body.assessmentType, status: 'In Progress', createdAt: new Date().toISOString() });
  });
  controller.getAssessments.mockImplementation((req: any, res: any) => {
    res.json([{ id: 'assess-1', aiSystemId: req.params.aiSystemId, type: 'Impact', status: 'Completed' }, { id: 'assess-2', aiSystemId: req.params.aiSystemId, type: 'Bias', status: 'In Progress' }]);
  });
  controller.deleteAssessment.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, assessmentId: req.params.assessmentId });
  });
  controller.createProfile.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'profile-123', aiSystemId: req.params.aiSystemId, profileType: req.body.profileType, targetState: req.body.targetState, createdAt: new Date().toISOString() });
  });
  controller.createRiskActivity.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'risk-activity-123', aiSystemId: req.params.aiSystemId, activityType: req.body.activityType, description: req.body.description, status: 'Pending' });
  });
  controller.updateRiskActivity.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.riskActivityId, ...req.body, updated: true });
  });
  controller.calculateTrustworthinessScore.mockImplementation((req: any, res: any) => {
    res.json({ aiSystemId: req.params.aiSystemId, overallScore: 78, dimensions: { validity: 85, reliability: 80, safety: 75, security: 82, accountability: 70, transparency: 78, explainability: 72, privacy: 80, fairness: 76 }, calculatedAt: new Date().toISOString() });
  });
  controller.getDashboardData.mockImplementation((_req: any, res: any) => {
    res.json({ totalSystems: 5, systemsByStatus: { Active: 3, Development: 1, Archived: 1 }, averageTrustworthiness: 76, pendingAssessments: 2, recentActivities: [], riskDistribution: { High: 1, Medium: 2, Low: 2 } });
  });
});

describe('AI RMF Routes Integration', () => {
  // ===========================================================================
  // AI System Management Tests
  // ===========================================================================
  describe('AI System Management', () => {
    describe('POST /api/ai-rmf/systems', () => {
      it('should create new AI system', async () => {
        const response = await request(app)
          .post('/api/ai-rmf/systems')
          .send({
            name: 'Risk Assessment Model',
            description: 'ML model for risk assessment',
            purpose: 'Automated risk scoring',
            deploymentContext: 'Production',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('Active');
      });
    });

    describe('GET /api/ai-rmf/systems', () => {
      it('should list AI systems', async () => {
        const response = await request(app)
          .get('/api/ai-rmf/systems')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
      });
    });

    describe('GET /api/ai-rmf/systems/:id', () => {
      it('should get AI system by ID', async () => {
        const response = await request(app)
          .get('/api/ai-rmf/systems/sys-123')
          .expect(200);

        expect(response.body).toHaveProperty('id', 'sys-123');
        expect(response.body).toHaveProperty('coreFunctions');
        expect(response.body).toHaveProperty('trustworthinessCharacteristics');
      });

      it('should return 404 for non-existent system', async () => {
        await request(app)
          .get('/api/ai-rmf/systems/nonexistent')
          .expect(404);
      });
    });

    describe('PATCH /api/ai-rmf/systems/:id', () => {
      it('should update AI system', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123')
          .send({
            status: 'Development',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
      });
    });

    describe('DELETE /api/ai-rmf/systems/:id', () => {
      it('should delete AI system', async () => {
        const response = await request(app)
          .delete('/api/ai-rmf/systems/sys-123')
          .expect(200);

        expect(response.body).toHaveProperty('deleted', true);
      });
    });
  });

  // ===========================================================================
  // Core Functions Tests
  // ===========================================================================
  describe('Core Functions', () => {
    describe('PATCH /api/ai-rmf/systems/:aiSystemId/functions/:functionName', () => {
      it('should update core function', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/functions/GOVERN')
          .send({
            status: 'Implemented',
            maturityLevel: 3,
            evidence: ['Policy documents', 'Training records'],
          })
          .expect(200);

        expect(response.body).toHaveProperty('functionName', 'GOVERN');
        expect(response.body).toHaveProperty('updated', true);
      });

      it('should update MAP function', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/functions/MAP')
          .send({
            status: 'In Progress',
            maturityLevel: 2,
          })
          .expect(200);

        expect(response.body.functionName).toBe('MAP');
      });

      it('should update MEASURE function', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/functions/MEASURE')
          .send({
            status: 'Implemented',
            maturityLevel: 4,
          })
          .expect(200);

        expect(response.body.functionName).toBe('MEASURE');
      });

      it('should update MANAGE function', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/functions/MANAGE')
          .send({
            status: 'Partial',
            maturityLevel: 2,
          })
          .expect(200);

        expect(response.body.functionName).toBe('MANAGE');
      });
    });
  });

  // ===========================================================================
  // Categories and Subcategories Tests
  // ===========================================================================
  describe('Categories and Subcategories', () => {
    describe('PATCH /api/ai-rmf/categories/:categoryId', () => {
      it('should update category', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/categories/cat-123')
          .send({
            status: 'Compliant',
            notes: 'All requirements met',
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
      });
    });

    describe('PATCH /api/ai-rmf/subcategories/:subcategoryId', () => {
      it('should update subcategory', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/subcategories/subcat-123')
          .send({
            status: 'In Progress',
            implementation: 'Partial',
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
      });
    });
  });

  // ===========================================================================
  // Trustworthiness Characteristics Tests
  // ===========================================================================
  describe('Trustworthiness Characteristics', () => {
    describe('PATCH /api/ai-rmf/systems/:aiSystemId/trustworthiness/:characteristic', () => {
      it('should update validity characteristic', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/trustworthiness/validity')
          .send({
            score: 85,
            evidence: ['Validation reports', 'Accuracy metrics'],
          })
          .expect(200);

        expect(response.body).toHaveProperty('characteristic', 'validity');
        expect(response.body).toHaveProperty('score', 85);
      });

      it('should update fairness characteristic', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/trustworthiness/fairness')
          .send({
            score: 78,
            evidence: ['Bias audit report'],
          })
          .expect(200);

        expect(response.body.characteristic).toBe('fairness');
      });

      it('should update explainability characteristic', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/trustworthiness/explainability')
          .send({
            score: 72,
            evidence: ['SHAP values documentation'],
          })
          .expect(200);

        expect(response.body.characteristic).toBe('explainability');
      });
    });
  });

  // ===========================================================================
  // Lifecycle Stages Tests
  // ===========================================================================
  describe('Lifecycle Stages', () => {
    describe('PATCH /api/ai-rmf/systems/:aiSystemId/lifecycle/:stage', () => {
      it('should update planning stage', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/lifecycle/planning')
          .send({
            status: 'Completed',
            completedAt: new Date().toISOString(),
          })
          .expect(200);

        expect(response.body).toHaveProperty('stage', 'planning');
        expect(response.body).toHaveProperty('updated', true);
      });

      it('should update deployment stage', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/lifecycle/deployment')
          .send({
            status: 'In Progress',
            targetDate: new Date().toISOString(),
          })
          .expect(200);

        expect(response.body.stage).toBe('deployment');
      });

      it('should update monitoring stage', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/systems/sys-123/lifecycle/monitoring')
          .send({
            status: 'Active',
            monitoringTools: ['MLflow', 'Custom Dashboard'],
          })
          .expect(200);

        expect(response.body.stage).toBe('monitoring');
      });
    });
  });

  // ===========================================================================
  // AI Actors Tests
  // ===========================================================================
  describe('AI Actors', () => {
    describe('POST /api/ai-rmf/systems/:aiSystemId/actors', () => {
      it('should add actor to system', async () => {
        const response = await request(app)
          .post('/api/ai-rmf/systems/sys-123/actors')
          .send({
            name: 'ML Engineer',
            role: 'Developer',
            responsibilities: ['Model training', 'Performance optimization'],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('ML Engineer');
      });
    });

    describe('DELETE /api/ai-rmf/actors/:actorId', () => {
      it('should remove actor', async () => {
        const response = await request(app)
          .delete('/api/ai-rmf/actors/actor-123')
          .expect(200);

        expect(response.body).toHaveProperty('deleted', true);
      });
    });
  });

  // ===========================================================================
  // Assessments Tests
  // ===========================================================================
  describe('Assessments', () => {
    describe('POST /api/ai-rmf/systems/:aiSystemId/assessments', () => {
      it('should create assessment', async () => {
        const response = await request(app)
          .post('/api/ai-rmf/systems/sys-123/assessments')
          .send({
            assessmentType: 'Impact',
            scope: 'Full system',
            assessor: 'user-123',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('In Progress');
      });
    });

    describe('GET /api/ai-rmf/systems/:aiSystemId/assessments', () => {
      it('should list assessments', async () => {
        const response = await request(app)
          .get('/api/ai-rmf/systems/sys-123/assessments')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
      });
    });

    describe('DELETE /api/ai-rmf/assessments/:assessmentId', () => {
      it('should delete assessment', async () => {
        const response = await request(app)
          .delete('/api/ai-rmf/assessments/assess-123')
          .expect(200);

        expect(response.body).toHaveProperty('deleted', true);
      });
    });
  });

  // ===========================================================================
  // Profiles Tests
  // ===========================================================================
  describe('Profiles', () => {
    describe('POST /api/ai-rmf/systems/:aiSystemId/profiles', () => {
      it('should create profile', async () => {
        const response = await request(app)
          .post('/api/ai-rmf/systems/sys-123/profiles')
          .send({
            profileType: 'Current',
            targetState: { governMaturity: 3, mapMaturity: 2 },
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('profileType');
      });
    });
  });

  // ===========================================================================
  // Risk Activities Tests
  // ===========================================================================
  describe('Risk Activities', () => {
    describe('POST /api/ai-rmf/systems/:aiSystemId/risk-activities', () => {
      it('should create risk activity', async () => {
        const response = await request(app)
          .post('/api/ai-rmf/systems/sys-123/risk-activities')
          .send({
            activityType: 'Risk Identification',
            description: 'Identify potential bias in training data',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('Pending');
      });
    });

    describe('PATCH /api/ai-rmf/risk-activities/:riskActivityId', () => {
      it('should update risk activity', async () => {
        const response = await request(app)
          .patch('/api/ai-rmf/risk-activities/risk-act-123')
          .send({
            status: 'Completed',
            findings: 'No significant bias detected',
          })
          .expect(200);

        expect(response.body).toHaveProperty('updated', true);
      });
    });
  });

  // ===========================================================================
  // Analytics and Reporting Tests
  // ===========================================================================
  describe('Analytics and Reporting', () => {
    describe('POST /api/ai-rmf/systems/:aiSystemId/calculate-trustworthiness', () => {
      it('should calculate trustworthiness score', async () => {
        const response = await request(app)
          .post('/api/ai-rmf/systems/sys-123/calculate-trustworthiness')
          .expect(200);

        expect(response.body).toHaveProperty('overallScore');
        expect(response.body).toHaveProperty('dimensions');
        expect(response.body.dimensions).toHaveProperty('validity');
        expect(response.body.dimensions).toHaveProperty('fairness');
        expect(response.body.dimensions).toHaveProperty('explainability');
      });
    });

    describe('GET /api/ai-rmf/dashboard', () => {
      it('should return dashboard data', async () => {
        const response = await request(app)
          .get('/api/ai-rmf/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('totalSystems');
        expect(response.body).toHaveProperty('systemsByStatus');
        expect(response.body).toHaveProperty('averageTrustworthiness');
        expect(response.body).toHaveProperty('pendingAssessments');
        expect(response.body).toHaveProperty('riskDistribution');
      });
    });
  });
});
