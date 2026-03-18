/**
 * EU Regulations Routes Integration Tests
 *
 * Tests for EU AI Act, DMA, and DSA compliance routes.
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

// Mock EU regulations controller
jest.mock('../../../controllers/euRegulationsController', () => ({
  __esModule: true,
  default: {
    // EU AI Act
    registerAISystem: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'ai-system-123',
        name: req.body.name,
        riskCategory: req.body.riskCategory,
        status: 'Registered',
      });
    }),
    getAISystems: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'ai-system-1', name: 'Fraud Detection', riskCategory: 'High' },
        { id: 'ai-system-2', name: 'Customer Service Bot', riskCategory: 'Limited' },
      ]);
    }),
    getAISystem: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.id,
        name: 'AI System',
        riskCategory: 'High',
        provider: 'Internal',
        deploymentDate: new Date().toISOString(),
      });
    }),
    updateAISystem: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, ...req.body, updated: true });
    }),
    deleteAISystem: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, id: req.params.id });
    }),
    getRiskAssessments: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'assessment-1', systemId: req.params.id, riskLevel: 'High', date: new Date() },
      ]);
    }),
    getLatestRiskAssessment: jest.fn().mockImplementation((req, res) => {
      res.json({ id: 'assessment-latest', systemId: req.params.id, riskLevel: 'High' });
    }),
    conductRiskAssessment: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'assessment-new',
        systemId: req.params.id,
        riskLevel: 'High',
        findings: [],
      });
    }),
    generateTransparencyReport: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'report-123',
        reportType: 'Transparency',
        generatedAt: new Date().toISOString(),
      });
    }),
    getTransparencyReports: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'report-1', reportType: 'Transparency', generatedAt: new Date() },
      ]);
    }),

    // DMA
    registerGatekeeper: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'gatekeeper-123',
        name: req.body.name,
        coreServices: req.body.coreServices,
        status: 'Registered',
      });
    }),
    getGatekeepers: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'gk-1', name: 'Platform A', coreServices: ['Search', 'Advertising'] },
      ]);
    }),
    getGatekeeper: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, name: 'Platform', coreServices: ['Search'] });
    }),
    updateGatekeeper: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, ...req.body, updated: true });
    }),
    deleteGatekeeper: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, id: req.params.id });
    }),
    getObligations: jest.fn().mockImplementation((req, res) => {
      res.json([
        { type: 'interoperability', status: 'Compliant' },
        { type: 'data_portability', status: 'In Progress' },
      ]);
    }),
    updateObligationCompliance: jest.fn().mockImplementation((req, res) => {
      res.json({
        gatekeeperId: req.params.id,
        obligationType: req.params.obligationType,
        status: req.body.status,
      });
    }),
    getComplianceReports: jest.fn().mockImplementation((req, res) => {
      res.json([{ id: 'report-1', gatekeeperId: req.params.id, date: new Date() }]);
    }),
    getLatestComplianceReport: jest.fn().mockImplementation((req, res) => {
      res.json({ id: 'report-latest', gatekeeperId: req.params.id, score: 85 });
    }),
    generateComplianceReport: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'report-new',
        gatekeeperId: req.params.id,
        generatedAt: new Date().toISOString(),
      });
    }),

    // DSA
    registerPlatform: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'platform-123',
        name: req.body.name,
        type: req.body.type,
        status: 'Registered',
      });
    }),
    getPlatforms: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'platform-1', name: 'Social Media', type: 'VLOP', userCount: 50000000 },
      ]);
    }),
    getPlatform: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, name: 'Platform', type: 'VLOP' });
    }),
    updatePlatform: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, ...req.body, updated: true });
    }),
    deletePlatform: jest.fn().mockImplementation((req, res) => {
      res.json({ deleted: true, id: req.params.id });
    }),
    getContentModerationHistory: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'mod-1', action: 'removed', contentType: 'post', reason: 'Hate speech' },
      ]);
    }),
    recordContentModeration: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'mod-new',
        action: req.body.action,
        contentType: req.body.contentType,
      });
    }),
    reportIllegalContent: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'report-123',
        contentUrl: req.body.contentUrl,
        status: 'Pending Review',
      });
    }),
    processIllegalContentReport: jest.fn().mockImplementation((req, res) => {
      res.json({
        id: req.params.id,
        status: req.body.status,
        processedAt: new Date().toISOString(),
      });
    }),
    addAdToRepository: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'ad-123',
        adId: req.body.adId,
        advertiser: req.body.advertiser,
      });
    }),
    getAdsFromRepository: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'ad-1', adId: 'ext-ad-1', advertiser: 'Company A', targetingInfo: {} },
      ]);
    }),
    getDSATransparencyReports: jest.fn().mockImplementation((req, res) => {
      res.json([{ id: 'tr-1', platformId: req.params.id, period: 'Q1 2024' }]);
    }),
    generateDSATransparencyReport: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'tr-new',
        platformId: req.params.id,
        period: req.body.period,
      });
    }),
    conductDSARiskAssessment: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        id: 'dsa-risk-123',
        platformId: req.params.id,
        riskAreas: req.body.riskAreas,
      });
    }),
    getDSARiskAssessments: jest.fn().mockImplementation((req, res) => {
      res.json([
        { id: 'dsa-risk-1', platformId: req.params.id, date: new Date() },
      ]);
    }),
    getLatestDSARiskAssessment: jest.fn().mockImplementation((req, res) => {
      res.json({ id: 'dsa-risk-latest', platformId: req.params.id });
    }),
    updateDSARiskAssessment: jest.fn().mockImplementation((req, res) => {
      res.json({ id: req.params.id, ...req.body, updated: true });
    }),
    configureNonPersonalizedFeed: jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        platformId: req.params.id,
        feedType: req.body.feedType,
        enabled: true,
      });
    }),
    getNonPersonalizedFeed: jest.fn().mockImplementation((req, res) => {
      res.json({
        platformId: req.params.id,
        feedType: 'chronological',
        enabled: true,
      });
    }),
    updateNonPersonalizedFeedStatus: jest.fn().mockImplementation((req, res) => {
      res.json({
        platformId: req.params.id,
        enabled: req.body.enabled,
      });
    }),
  },
}));

// Setup app once (controller is fully mocked, no need to re-import per test)
let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const euRegulationsRoutes = (await import('../../../routes/euRegulations')).default;
  app.use('/api/eu-regulations', euRegulationsRoutes);
});

beforeEach(() => {
  jest.clearAllMocks();

  // Re-setup controller mocks after clearAllMocks
  const controller = require('../../../controllers/euRegulationsController').default;

  // EU AI Act
  controller.registerAISystem.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'ai-system-123', name: req.body.name, riskCategory: req.body.riskCategory, status: 'Registered' });
  });
  controller.getAISystems.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'ai-system-1', name: 'Fraud Detection', riskCategory: 'High' }, { id: 'ai-system-2', name: 'Customer Service Bot', riskCategory: 'Limited' }]);
  });
  controller.getAISystem.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, name: 'AI System', riskCategory: 'High', provider: 'Internal', deploymentDate: new Date().toISOString() });
  });
  controller.updateAISystem.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, ...req.body, updated: true });
  });
  controller.deleteAISystem.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, id: req.params.id });
  });
  controller.getRiskAssessments.mockImplementation((req: any, res: any) => {
    res.json([{ id: 'assessment-1', systemId: req.params.id, riskLevel: 'High', date: new Date() }]);
  });
  controller.getLatestRiskAssessment.mockImplementation((req: any, res: any) => {
    res.json({ id: 'assessment-latest', systemId: req.params.id, riskLevel: 'High' });
  });
  controller.conductRiskAssessment.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'assessment-new', systemId: req.params.id, riskLevel: 'High', findings: [] });
  });
  controller.generateTransparencyReport.mockImplementation((_req: any, res: any) => {
    res.status(201).json({ id: 'report-123', reportType: 'Transparency', generatedAt: new Date().toISOString() });
  });
  controller.getTransparencyReports.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'report-1', reportType: 'Transparency', generatedAt: new Date() }]);
  });

  // DMA
  controller.registerGatekeeper.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'gatekeeper-123', name: req.body.name, coreServices: req.body.coreServices, status: 'Registered' });
  });
  controller.getGatekeepers.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'gk-1', name: 'Platform A', coreServices: ['Search', 'Advertising'] }]);
  });
  controller.getGatekeeper.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, name: 'Platform', coreServices: ['Search'] });
  });
  controller.updateGatekeeper.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, ...req.body, updated: true });
  });
  controller.deleteGatekeeper.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, id: req.params.id });
  });
  controller.getObligations.mockImplementation((_req: any, res: any) => {
    res.json([{ type: 'interoperability', status: 'Compliant' }, { type: 'data_portability', status: 'In Progress' }]);
  });
  controller.updateObligationCompliance.mockImplementation((req: any, res: any) => {
    res.json({ gatekeeperId: req.params.id, obligationType: req.params.obligationType, status: req.body.status });
  });
  controller.getComplianceReports.mockImplementation((req: any, res: any) => {
    res.json([{ id: 'report-1', gatekeeperId: req.params.id, date: new Date() }]);
  });
  controller.getLatestComplianceReport.mockImplementation((req: any, res: any) => {
    res.json({ id: 'report-latest', gatekeeperId: req.params.id, score: 85 });
  });
  controller.generateComplianceReport.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'report-new', gatekeeperId: req.params.id, generatedAt: new Date().toISOString() });
  });

  // DSA
  controller.registerPlatform.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'platform-123', name: req.body.name, type: req.body.type, status: 'Registered' });
  });
  controller.getPlatforms.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'platform-1', name: 'Social Media', type: 'VLOP', userCount: 50000000 }]);
  });
  controller.getPlatform.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, name: 'Platform', type: 'VLOP' });
  });
  controller.updatePlatform.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, ...req.body, updated: true });
  });
  controller.deletePlatform.mockImplementation((req: any, res: any) => {
    res.json({ deleted: true, id: req.params.id });
  });
  controller.getContentModerationHistory.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'mod-1', action: 'removed', contentType: 'post', reason: 'Hate speech' }]);
  });
  controller.recordContentModeration.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'mod-new', action: req.body.action, contentType: req.body.contentType });
  });
  controller.reportIllegalContent.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'report-123', contentUrl: req.body.contentUrl, status: 'Pending Review' });
  });
  controller.processIllegalContentReport.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, status: req.body.status, processedAt: new Date().toISOString() });
  });
  controller.addAdToRepository.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'ad-123', adId: req.body.adId, advertiser: req.body.advertiser });
  });
  controller.getAdsFromRepository.mockImplementation((_req: any, res: any) => {
    res.json([{ id: 'ad-1', adId: 'ext-ad-1', advertiser: 'Company A', targetingInfo: {} }]);
  });
  controller.getDSATransparencyReports.mockImplementation((req: any, res: any) => {
    res.json([{ id: 'tr-1', platformId: req.params.id, period: 'Q1 2024' }]);
  });
  controller.generateDSATransparencyReport.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'tr-new', platformId: req.params.id, period: req.body.period });
  });
  controller.conductDSARiskAssessment.mockImplementation((req: any, res: any) => {
    res.status(201).json({ id: 'dsa-risk-123', platformId: req.params.id, riskAreas: req.body.riskAreas });
  });
  controller.getDSARiskAssessments.mockImplementation((req: any, res: any) => {
    res.json([{ id: 'dsa-risk-1', platformId: req.params.id, date: new Date() }]);
  });
  controller.getLatestDSARiskAssessment.mockImplementation((req: any, res: any) => {
    res.json({ id: 'dsa-risk-latest', platformId: req.params.id });
  });
  controller.updateDSARiskAssessment.mockImplementation((req: any, res: any) => {
    res.json({ id: req.params.id, ...req.body, updated: true });
  });
  controller.configureNonPersonalizedFeed.mockImplementation((req: any, res: any) => {
    res.status(201).json({ platformId: req.params.id, feedType: req.body.feedType, enabled: true });
  });
  controller.getNonPersonalizedFeed.mockImplementation((req: any, res: any) => {
    res.json({ platformId: req.params.id, feedType: 'chronological', enabled: true });
  });
  controller.updateNonPersonalizedFeedStatus.mockImplementation((req: any, res: any) => {
    res.json({ platformId: req.params.id, enabled: req.body.enabled });
  });
});

describe('EU Regulations Routes Integration', () => {
  // ===========================================================================
  // EU AI Act Tests
  // ===========================================================================
  describe('EU AI Act', () => {
    describe('AI System Management', () => {
      describe('POST /api/eu-regulations/ai-act/systems', () => {
        it('should register new AI system', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/ai-act/systems')
            .send({
              name: 'Credit Scoring AI',
              riskCategory: 'High',
              provider: 'Internal',
              purpose: 'Credit risk assessment',
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body.status).toBe('Registered');
        });
      });

      describe('GET /api/eu-regulations/ai-act/systems', () => {
        it('should list AI systems', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/ai-act/systems')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/eu-regulations/ai-act/systems/:id', () => {
        it('should get AI system by ID', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/ai-act/systems/ai-system-123')
            .expect(200);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('riskCategory');
        });
      });

      describe('PATCH /api/eu-regulations/ai-act/systems/:id', () => {
        it('should update AI system', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/ai-act/systems/ai-system-123')
            .send({ riskCategory: 'Limited' })
            .expect(200);

          expect(response.body).toHaveProperty('updated', true);
        });
      });

      describe('DELETE /api/eu-regulations/ai-act/systems/:id', () => {
        it('should delete AI system', async () => {
          const response = await request(app)
            .delete('/api/eu-regulations/ai-act/systems/ai-system-123')
            .expect(200);

          expect(response.body).toHaveProperty('deleted', true);
        });
      });
    });

    describe('Risk Assessments', () => {
      describe('GET /api/eu-regulations/ai-act/systems/:id/assessments', () => {
        it('should list risk assessments', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/ai-act/systems/ai-system-123/assessments')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/eu-regulations/ai-act/systems/:id/assessments/latest', () => {
        it('should get latest risk assessment', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/ai-act/systems/ai-system-123/assessments/latest')
            .expect(200);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('riskLevel');
        });
      });

      describe('POST /api/eu-regulations/ai-act/systems/:id/assessments', () => {
        it('should conduct risk assessment', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/ai-act/systems/ai-system-123/assessments')
            .send({
              assessmentType: 'Full',
              assessor: 'user-123',
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('riskLevel');
        });
      });
    });

    describe('Transparency Reports', () => {
      describe('POST /api/eu-regulations/ai-act/transparency-reports', () => {
        it('should generate transparency report', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/ai-act/transparency-reports')
            .send({
              systemIds: ['ai-system-123'],
              reportPeriod: 'Q1 2024',
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('generatedAt');
        });
      });

      describe('GET /api/eu-regulations/ai-act/transparency-reports', () => {
        it('should list transparency reports', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/ai-act/transparency-reports')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });
    });
  });

  // ===========================================================================
  // DMA Tests
  // ===========================================================================
  describe('Digital Markets Act (DMA)', () => {
    describe('Gatekeeper Management', () => {
      describe('POST /api/eu-regulations/dma/gatekeepers', () => {
        it('should register gatekeeper', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dma/gatekeepers')
            .send({
              name: 'Search Platform',
              coreServices: ['Search', 'Advertising'],
              designation: 'Designated',
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body.status).toBe('Registered');
        });
      });

      describe('GET /api/eu-regulations/dma/gatekeepers', () => {
        it('should list gatekeepers', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dma/gatekeepers')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/eu-regulations/dma/gatekeepers/:id', () => {
        it('should get gatekeeper by ID', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dma/gatekeepers/gk-123')
            .expect(200);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('coreServices');
        });
      });

      describe('PATCH /api/eu-regulations/dma/gatekeepers/:id', () => {
        it('should update gatekeeper', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/dma/gatekeepers/gk-123')
            .send({ coreServices: ['Search', 'Advertising', 'App Store'] })
            .expect(200);

          expect(response.body).toHaveProperty('updated', true);
        });
      });

      describe('DELETE /api/eu-regulations/dma/gatekeepers/:id', () => {
        it('should delete gatekeeper', async () => {
          const response = await request(app)
            .delete('/api/eu-regulations/dma/gatekeepers/gk-123')
            .expect(200);

          expect(response.body).toHaveProperty('deleted', true);
        });
      });
    });

    describe('Obligations', () => {
      describe('GET /api/eu-regulations/dma/gatekeepers/:id/obligations', () => {
        it('should list obligations', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dma/gatekeepers/gk-123/obligations')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('PATCH /api/eu-regulations/dma/gatekeepers/:id/obligations/:obligationType', () => {
        it('should update obligation compliance', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/dma/gatekeepers/gk-123/obligations/interoperability')
            .send({ status: 'Compliant', evidence: 'API documentation' })
            .expect(200);

          expect(response.body).toHaveProperty('obligationType', 'interoperability');
        });
      });
    });

    describe('Compliance Reports', () => {
      describe('GET /api/eu-regulations/dma/gatekeepers/:id/compliance-reports', () => {
        it('should list compliance reports', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dma/gatekeepers/gk-123/compliance-reports')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/eu-regulations/dma/gatekeepers/:id/compliance-reports/latest', () => {
        it('should get latest compliance report', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dma/gatekeepers/gk-123/compliance-reports/latest')
            .expect(200);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('score');
        });
      });

      describe('POST /api/eu-regulations/dma/gatekeepers/:id/compliance-reports', () => {
        it('should generate compliance report', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dma/gatekeepers/gk-123/compliance-reports')
            .send({ reportPeriod: 'Q1 2024' })
            .expect(201);

          expect(response.body).toHaveProperty('id');
        });
      });
    });
  });

  // ===========================================================================
  // DSA Tests
  // ===========================================================================
  describe('Digital Services Act (DSA)', () => {
    describe('Platform Management', () => {
      describe('POST /api/eu-regulations/dsa/platforms', () => {
        it('should register platform', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms')
            .send({
              name: 'Social Network',
              type: 'VLOP',
              userCount: 50000000,
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body.status).toBe('Registered');
        });
      });

      describe('GET /api/eu-regulations/dsa/platforms', () => {
        it('should list platforms', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/eu-regulations/dsa/platforms/:id', () => {
        it('should get platform by ID', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123')
            .expect(200);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('type');
        });
      });

      describe('PATCH /api/eu-regulations/dsa/platforms/:id', () => {
        it('should update platform', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/dsa/platforms/platform-123')
            .send({ userCount: 60000000 })
            .expect(200);

          expect(response.body).toHaveProperty('updated', true);
        });
      });

      describe('DELETE /api/eu-regulations/dsa/platforms/:id', () => {
        it('should delete platform', async () => {
          const response = await request(app)
            .delete('/api/eu-regulations/dsa/platforms/platform-123')
            .expect(200);

          expect(response.body).toHaveProperty('deleted', true);
        });
      });
    });

    describe('Content Moderation', () => {
      describe('GET /api/eu-regulations/dsa/platforms/:id/content-moderation', () => {
        it('should list content moderation history', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123/content-moderation')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('POST /api/eu-regulations/dsa/platforms/:id/content-moderation', () => {
        it('should record content moderation action', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms/platform-123/content-moderation')
            .send({
              action: 'removed',
              contentType: 'post',
              reason: 'Hate speech',
              contentId: 'content-456',
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body.action).toBe('removed');
        });
      });
    });

    describe('Illegal Content Reports', () => {
      describe('POST /api/eu-regulations/dsa/platforms/:id/illegal-content-reports', () => {
        it('should report illegal content', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms/platform-123/illegal-content-reports')
            .send({
              contentUrl: 'https://platform.com/post/123',
              illegalType: 'Hate speech',
              description: 'Content promoting hate',
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body.status).toBe('Pending Review');
        });
      });

      describe('PATCH /api/eu-regulations/dsa/illegal-content-reports/:id', () => {
        it('should process illegal content report', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/dsa/illegal-content-reports/report-123')
            .send({
              status: 'Content Removed',
              actionTaken: 'Removed content and warned user',
            })
            .expect(200);

          expect(response.body).toHaveProperty('processedAt');
        });
      });
    });

    describe('Ad Repository', () => {
      describe('POST /api/eu-regulations/dsa/platforms/:id/ad-repository', () => {
        it('should add ad to repository', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms/platform-123/ad-repository')
            .send({
              adId: 'ext-ad-123',
              advertiser: 'Company A',
              content: 'Ad content',
              targetingInfo: { demographics: ['18-35'], location: ['EU'] },
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body.advertiser).toBe('Company A');
        });
      });

      describe('GET /api/eu-regulations/dsa/platforms/:id/ad-repository', () => {
        it('should list ads from repository', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123/ad-repository')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });
    });

    describe('Transparency Reports', () => {
      describe('GET /api/eu-regulations/dsa/platforms/:id/transparency-reports', () => {
        it('should list DSA transparency reports', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123/transparency-reports')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('POST /api/eu-regulations/dsa/platforms/:id/transparency-reports', () => {
        it('should generate DSA transparency report', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms/platform-123/transparency-reports')
            .send({ period: 'Q1 2024' })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('period');
        });
      });
    });

    describe('Risk Assessments', () => {
      describe('POST /api/eu-regulations/dsa/platforms/:id/risk-assessments', () => {
        it('should conduct DSA risk assessment', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms/platform-123/risk-assessments')
            .send({
              riskAreas: ['disinformation', 'electoral_manipulation'],
            })
            .expect(201);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('riskAreas');
        });
      });

      describe('GET /api/eu-regulations/dsa/platforms/:id/risk-assessments', () => {
        it('should list DSA risk assessments', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123/risk-assessments')
            .expect(200);

          expect(Array.isArray(response.body)).toBe(true);
        });
      });

      describe('GET /api/eu-regulations/dsa/platforms/:id/risk-assessments/latest', () => {
        it('should get latest DSA risk assessment', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123/risk-assessments/latest')
            .expect(200);

          expect(response.body).toHaveProperty('id');
        });
      });

      describe('PATCH /api/eu-regulations/dsa/risk-assessments/:id', () => {
        it('should update DSA risk assessment', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/dsa/risk-assessments/dsa-risk-123')
            .send({ status: 'Completed', mitigationMeasures: ['Implemented AI detection'] })
            .expect(200);

          expect(response.body).toHaveProperty('updated', true);
        });
      });
    });

    describe('Non-Personalized Feed', () => {
      describe('POST /api/eu-regulations/dsa/platforms/:id/non-personalized-feed', () => {
        it('should configure non-personalized feed', async () => {
          const response = await request(app)
            .post('/api/eu-regulations/dsa/platforms/platform-123/non-personalized-feed')
            .send({
              feedType: 'chronological',
              defaultEnabled: false,
            })
            .expect(201);

          expect(response.body).toHaveProperty('enabled', true);
        });
      });

      describe('GET /api/eu-regulations/dsa/platforms/:id/non-personalized-feed', () => {
        it('should get non-personalized feed config', async () => {
          const response = await request(app)
            .get('/api/eu-regulations/dsa/platforms/platform-123/non-personalized-feed')
            .expect(200);

          expect(response.body).toHaveProperty('feedType');
          expect(response.body).toHaveProperty('enabled');
        });
      });

      describe('PATCH /api/eu-regulations/dsa/platforms/:id/non-personalized-feed', () => {
        it('should update non-personalized feed status', async () => {
          const response = await request(app)
            .patch('/api/eu-regulations/dsa/platforms/platform-123/non-personalized-feed')
            .send({ enabled: false })
            .expect(200);

          expect(response.body).toHaveProperty('enabled');
        });
      });
    });
  });
});
