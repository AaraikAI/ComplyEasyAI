/**
 * E2E Tests - EU Regulations Flow
 * Tests complete EU regulatory compliance workflows including
 * EU AI Act, Digital Markets Act, and Digital Services Act.
 *
 * Exercises the real routes mounted in src/routes/euRegulations.ts. The route
 * handlers delegate to the euRegulations service layer (euAiActService /
 * dmaService / dsaService), which is mocked here so assertions verify the
 * controller wiring (status codes + response envelope shape) deterministically.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

// Provide ALL tierMiddleware exports the routes import at load time. The
// requireX helpers return arrays of pass-through middleware (the routes spread
// them with `...requireVisionaryFeature(...)`).
jest.mock('../../middleware/tierMiddleware', () => {
  const pass = (_req: any, _res: any, next: any) => next();
  const passArr = () => [pass];
  return {
    __esModule: true,
    requireFeature: () => pass,
    requireTier: () => pass,
    enforceLimit: () => pass,
    attachTierInfo: () => pass,
    trackUsage: () => pass,
    requireFeatureAndLimit: () => pass,
    requireActiveSubscription: () => pass,
    requireAiFeature: passArr,
    requireResourceCreation: passArr,
    requireEnterpriseFeature: passArr,
    requireAcosFeature: passArr,
    requireVisionaryFeature: passArr,
    default: {},
  };
});

jest.mock('../../services/euRegulations/euAiActService', () => ({
  __esModule: true,
  default: {
    registerAISystem: jest.fn(),
    getAISystems: jest.fn(),
    getAISystem: jest.fn(),
    updateAISystem: jest.fn(),
    deleteAISystem: jest.fn(),
    getRiskAssessments: jest.fn(),
    getLatestRiskAssessment: jest.fn(),
    conductRiskAssessment: jest.fn(),
    generateTransparencyReport: jest.fn(),
    getTransparencyReports: jest.fn(),
  },
}));

jest.mock('../../services/euRegulations/dmaService', () => ({
  __esModule: true,
  default: {
    registerGatekeeper: jest.fn(),
    getGatekeepers: jest.fn(),
    getGatekeeper: jest.fn(),
    updateGatekeeper: jest.fn(),
    deleteGatekeeper: jest.fn(),
    getObligations: jest.fn(),
    updateObligationCompliance: jest.fn(),
    getComplianceReports: jest.fn(),
    getLatestComplianceReport: jest.fn(),
    generateComplianceReport: jest.fn(),
  },
}));

jest.mock('../../services/euRegulations/dsaService', () => ({
  __esModule: true,
  default: {
    registerPlatform: jest.fn(),
    getPlatforms: jest.fn(),
    getPlatform: jest.fn(),
    updatePlatform: jest.fn(),
    deletePlatform: jest.fn(),
    recordContentModeration: jest.fn(),
    getContentModerationHistory: jest.fn(),
    reportIllegalContent: jest.fn(),
    processIllegalContentReport: jest.fn(),
    addAdToRepository: jest.fn(),
    getAdsFromRepository: jest.fn(),
    generateTransparencyReport: jest.fn(),
    getTransparencyReports: jest.fn(),
    conductRiskAssessment: jest.fn(),
    getRiskAssessments: jest.fn(),
    getLatestRiskAssessment: jest.fn(),
    updateRiskAssessment: jest.fn(),
    configureNonPersonalizedFeed: jest.fn(),
    getNonPersonalizedFeed: jest.fn(),
    updateNonPersonalizedFeedStatus: jest.fn(),
  },
}));

import euRegulationsRoutes from '../../routes/euRegulations';
import { errorHandler } from '../../middleware/errorHandler';
import euAiActService from '../../services/euRegulations/euAiActService';
import dmaService from '../../services/euRegulations/dmaService';
import dsaService from '../../services/euRegulations/dsaService';

const aiAct = euAiActService as unknown as Record<string, jest.Mock>;
const dma = dmaService as unknown as Record<string, jest.Mock>;
const dsa = dsaService as unknown as Record<string, jest.Mock>;

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
app.use('/api/eu-regulations', euRegulationsRoutes);
app.use(errorHandler);

describe('E2E: EU Regulations Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // EU AI Act Compliance
  // ===========================================================================
  describe('EU AI Act Compliance', () => {
    const mockAISystem = {
      id: 'ai-123',
      name: 'Credit Scoring AI',
      riskCategory: 'high_risk',
      organizationId: 'org-123',
      complianceStatus: 'in_review',
    };

    it('should register AI system', async () => {
      aiAct.registerAISystem.mockResolvedValue(mockAISystem);

      const response = await request(app)
        .post('/api/eu-regulations/ai-act/systems')
        .send({
          name: 'Credit Scoring AI',
          description: 'Automated credit decisioning system',
          useCase: 'Determine creditworthiness of applicants',
          targetUsers: ['Loan officers'],
          dataTypes: ['Financial', 'Personal'],
          decisionMaking: true,
          biometricProcessing: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('system');
      expect(response.body.system).toHaveProperty('id', 'ai-123');
      expect(aiAct.registerAISystem).toHaveBeenCalledWith('org-123', 'user-123', expect.objectContaining({ name: 'Credit Scoring AI' }));
    });

    it('should list AI systems', async () => {
      aiAct.getAISystems.mockResolvedValue([mockAISystem]);

      const response = await request(app)
        .get('/api/eu-regulations/ai-act/systems')
        .expect(200);

      expect(response.body).toHaveProperty('systems');
      expect(Array.isArray(response.body.systems)).toBe(true);
      expect(response.body.systems).toHaveLength(1);
    });

    it('should get a single AI system', async () => {
      aiAct.getAISystem.mockResolvedValue(mockAISystem);

      const response = await request(app)
        .get('/api/eu-regulations/ai-act/systems/ai-123')
        .expect(200);

      expect(response.body.system).toHaveProperty('id', 'ai-123');
      expect(aiAct.getAISystem).toHaveBeenCalledWith('org-123', 'ai-123');
    });

    it('should conduct an AI risk assessment', async () => {
      aiAct.conductRiskAssessment.mockResolvedValue({
        id: 'assess-1',
        aiSystemId: 'ai-123',
        riskLevel: 'high',
      });

      const response = await request(app)
        .post('/api/eu-regulations/ai-act/systems/ai-123/assessments')
        .send({
          safetyRisks: ['Model drift'],
          privacyRisks: ['Re-identification'],
          mitigationMeasures: ['Quarterly retraining'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('assessment');
      expect(response.body.assessment).toHaveProperty('riskLevel', 'high');
    });

    it('should generate a transparency report', async () => {
      aiAct.generateTransparencyReport.mockResolvedValue({
        id: 'report-1',
        systemsCount: 5,
      });

      const response = await request(app)
        .post('/api/eu-regulations/ai-act/transparency-reports')
        .send({
          reportingPeriod: {
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-03-31T23:59:59.000Z',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('id', 'report-1');
    });

    it('should update AI system compliance status', async () => {
      aiAct.updateAISystem.mockResolvedValue({ ...mockAISystem, complianceStatus: 'compliant' });

      const response = await request(app)
        .patch('/api/eu-regulations/ai-act/systems/ai-123')
        .send({ complianceStatus: 'compliant' })
        .expect(200);

      expect(response.body.system).toHaveProperty('complianceStatus', 'compliant');
    });
  });

  // ===========================================================================
  // Digital Markets Act (DMA) Compliance
  // ===========================================================================
  describe('Digital Markets Act Compliance', () => {
    const mockGatekeeper = {
      id: 'gk-123',
      platformName: 'App Store',
      designationStatus: 'designated',
      organizationId: 'org-123',
    };

    it('should register a gatekeeper', async () => {
      dma.registerGatekeeper.mockResolvedValue(mockGatekeeper);

      const response = await request(app)
        .post('/api/eu-regulations/dma/gatekeepers')
        .send({
          platformName: 'App Store',
          corePlatformServices: ['operating_systems', 'online_intermediation'],
          annualRevenue: 1000000000,
          monthlyActiveUsers: 50000000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('gatekeeper');
      expect(response.body.gatekeeper).toHaveProperty('id', 'gk-123');
    });

    it('should list gatekeepers', async () => {
      dma.getGatekeepers.mockResolvedValue([mockGatekeeper]);

      const response = await request(app)
        .get('/api/eu-regulations/dma/gatekeepers')
        .expect(200);

      expect(response.body).toHaveProperty('gatekeepers');
      expect(response.body.gatekeepers).toHaveLength(1);
    });

    it('should get gatekeeper obligations', async () => {
      dma.getObligations.mockResolvedValue([
        { id: 'obl-1', obligationType: 'interoperability', status: 'compliant' },
      ]);

      const response = await request(app)
        .get('/api/eu-regulations/dma/gatekeepers/gk-123/obligations')
        .expect(200);

      expect(response.body).toHaveProperty('obligations');
      expect(Array.isArray(response.body.obligations)).toBe(true);
    });

    it('should update obligation compliance', async () => {
      dma.updateObligationCompliance.mockResolvedValue(undefined);

      const response = await request(app)
        .patch('/api/eu-regulations/dma/gatekeepers/gk-123/obligations/interoperability')
        .send({ status: 'compliant', evidence: ['ev-1'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(dma.updateObligationCompliance).toHaveBeenCalled();
    });

    it('should generate a DMA compliance report', async () => {
      dma.generateComplianceReport.mockResolvedValue({ id: 'dma-report-1', overallStatus: 'compliant' });

      const response = await request(app)
        .post('/api/eu-regulations/dma/gatekeepers/gk-123/compliance-reports')
        .send({
          reportingPeriod: {
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-06-30T23:59:59.000Z',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('overallStatus', 'compliant');
    });
  });

  // ===========================================================================
  // Digital Services Act (DSA) Compliance
  // ===========================================================================
  describe('Digital Services Act Compliance', () => {
    const mockPlatform = {
      id: 'plat-123',
      platformName: 'Social Network',
      platformType: 'very_large_online_platform',
      organizationId: 'org-123',
    };

    it('should register a platform', async () => {
      dsa.registerPlatform.mockResolvedValue(mockPlatform);

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms')
        .send({
          platformName: 'Social Network',
          platformType: 'very_large_online_platform',
          monthlyActiveUsers: 50000000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('platform');
      expect(response.body.platform).toHaveProperty('id', 'plat-123');
    });

    it('should record content moderation', async () => {
      dsa.recordContentModeration.mockResolvedValue({ id: 'cm-1', actionType: 'content_removal' });

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/content-moderation')
        .send({
          actionType: 'content_removal',
          contentType: 'Post',
          reason: 'Hate speech',
          automatedDecision: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('moderation');
      expect(response.body.moderation).toHaveProperty('actionType', 'content_removal');
    });

    it('should report illegal content', async () => {
      dsa.reportIllegalContent.mockResolvedValue({ id: 'notice-1', status: 'received' });

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/illegal-content-reports')
        .send({
          reportedBy: 'trusted-flagger@example.com',
          isTrustedFlagger: true,
          contentType: 'Post',
          contentUrl: 'https://example.com/content',
          reason: 'Illegal content',
        })
        .expect(201);

      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('id', 'notice-1');
    });

    it('should add an ad to the repository', async () => {
      dsa.addAdToRepository.mockResolvedValue({ id: 'ad-1', advertiserName: 'Company ABC' });

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/ad-repository')
        .send({
          adId: 'campaign-001',
          advertiserName: 'Company ABC',
          adContent: { text: 'Ad content' },
          targetingCriteria: { age: '18-35', location: 'EU' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('adEntry');
      expect(response.body.adEntry).toHaveProperty('id', 'ad-1');
    });

    it('should conduct a DSA risk assessment', async () => {
      dsa.conductRiskAssessment.mockResolvedValue({ id: 'sra-1', riskCategory: 'fundamental_rights' });

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/risk-assessments')
        .send({
          riskCategory: 'fundamental_rights',
          fundamentalRightsRisks: { risks: ['Disinformation'], severity: 'high' },
          mitigationMeasures: [
            { measure: 'Fact-checking', status: 'in_progress' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('assessment');
      expect(response.body.assessment).toHaveProperty('riskCategory', 'fundamental_rights');
    });

    it('should generate a DSA transparency report', async () => {
      dsa.generateTransparencyReport.mockResolvedValue({ id: 'dsa-report-1', totalActions: 60000 });

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/transparency-reports')
        .send({
          reportingPeriod: {
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-03-31T23:59:59.000Z',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('totalActions', 60000);
    });
  });
});
