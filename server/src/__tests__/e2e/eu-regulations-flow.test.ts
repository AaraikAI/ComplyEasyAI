/**
 * E2E Tests - EU Regulations Flow
 * Tests complete EU regulatory compliance workflows including
 * EU AI Act, Digital Markets Act, and Digital Services Act.
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

jest.mock('../../middleware/tierMiddleware', () => ({
  requireTier: () => (req: any, res: any, next: any) => next(),
}));

import euRegulationsRoutes from '../../routes/euRegulations';
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
      riskCategory: 'High-Risk',
      purpose: 'Automated credit decisions',
      organizationId: 'org-123',
      status: 'Active',
      registrationNumber: 'EU-AI-2024-001',
    };

    const mockConformityAssessment = {
      id: 'ca-123',
      aiSystemId: 'ai-123',
      type: 'Self-Assessment',
      status: 'Passed',
      completedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    it('should register AI system', async () => {
      prismaMock.euAiSystem.create.mockResolvedValue(mockAISystem as any);

      const response = await request(app)
        .post('/api/eu-regulations/ai-act/systems')
        .send({
          name: 'Credit Scoring AI',
          purpose: 'Automated credit decisions',
          riskCategory: 'High-Risk',
          dataCategories: ['Financial', 'Personal'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.riskCategory).toBe('High-Risk');
    });

    it('should classify AI system risk level', async () => {
      const response = await request(app)
        .post('/api/eu-regulations/ai-act/classify')
        .send({
          purpose: 'Biometric identification',
          context: 'Law enforcement',
          dataTypes: ['Biometric'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskCategory');
      expect(response.body).toHaveProperty('rationale');
    });

    it('should perform conformity assessment', async () => {
      prismaMock.euAiSystem.findFirst.mockResolvedValue(mockAISystem as any);
      prismaMock.conformityAssessment.create.mockResolvedValue(mockConformityAssessment as any);

      const response = await request(app)
        .post('/api/eu-regulations/ai-act/systems/ai-123/conformity-assessment')
        .send({
          type: 'Self-Assessment',
          evidence: ['doc-1', 'doc-2'],
          assessor: 'Internal Team',
        })
        .expect(201);

      expect(response.body).toHaveProperty('status');
    });

    it('should generate EU AI Act transparency report', async () => {
      prismaMock.euAiSystem.findFirst.mockResolvedValue(mockAISystem as any);

      const response = await request(app)
        .get('/api/eu-regulations/ai-act/systems/ai-123/transparency-report')
        .expect(200);

      expect(response.body).toHaveProperty('systemInfo');
      expect(response.body).toHaveProperty('humanOversight');
      expect(response.body).toHaveProperty('dataGovernance');
    });

    it('should track prohibited AI practices', async () => {
      const response = await request(app)
        .post('/api/eu-regulations/ai-act/prohibited-check')
        .send({
          practices: [
            'social_scoring',
            'subliminal_manipulation',
            'exploitation_of_vulnerabilities',
          ],
        })
        .expect(200);

      expect(response.body).toHaveProperty('violations');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should manage human oversight requirements', async () => {
      prismaMock.euAiSystem.findFirst.mockResolvedValue(mockAISystem as any);
      prismaMock.euAiSystem.update.mockResolvedValue({
        ...mockAISystem,
        humanOversight: {
          level: 'Human-in-the-loop',
          mechanisms: ['Manual review', 'Override capability'],
          responsible: 'user-456',
        },
      } as any);

      const response = await request(app)
        .patch('/api/eu-regulations/ai-act/systems/ai-123/human-oversight')
        .send({
          level: 'Human-in-the-loop',
          mechanisms: ['Manual review', 'Override capability'],
          responsible: 'user-456',
        })
        .expect(200);

      expect(response.body.humanOversight).toBeDefined();
    });
  });

  // ===========================================================================
  // Digital Markets Act (DMA) Compliance
  // ===========================================================================
  describe('Digital Markets Act Compliance', () => {
    const mockGatekeeperService = {
      id: 'gk-123',
      serviceName: 'App Store',
      serviceType: 'App Distribution Platform',
      status: 'Designated',
      organizationId: 'org-123',
    };

    const mockDMAObligation = {
      id: 'obl-123',
      serviceId: 'gk-123',
      article: 'Article 5(4)',
      description: 'Allow third-party app stores',
      status: 'Compliant',
      evidence: [],
    };

    it('should register gatekeeper service', async () => {
      prismaMock.dmaService.create.mockResolvedValue(mockGatekeeperService as any);

      const response = await request(app)
        .post('/api/eu-regulations/dma/services')
        .send({
          serviceName: 'App Store',
          serviceType: 'App Distribution Platform',
          userBase: 50000000,
          revenue: 1000000000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should assess gatekeeper designation', async () => {
      const response = await request(app)
        .post('/api/eu-regulations/dma/gatekeeper-assessment')
        .send({
          activeUsers: 50000000,
          businessUsers: 10000,
          marketCap: 75000000000,
          memberStates: 5,
        })
        .expect(200);

      expect(response.body).toHaveProperty('isGatekeeper');
      expect(response.body).toHaveProperty('criteria');
    });

    it('should track DMA obligations', async () => {
      prismaMock.dmaService.findFirst.mockResolvedValue(mockGatekeeperService as any);
      prismaMock.dmaObligation.findMany.mockResolvedValue([mockDMAObligation] as any);

      const response = await request(app)
        .get('/api/eu-regulations/dma/services/gk-123/obligations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update obligation compliance status', async () => {
      prismaMock.dmaObligation.findFirst.mockResolvedValue(mockDMAObligation as any);
      prismaMock.dmaObligation.update.mockResolvedValue({
        ...mockDMAObligation,
        status: 'Compliant',
        evidence: ['ev-1'],
        lastAssessed: new Date(),
      } as any);

      const response = await request(app)
        .patch('/api/eu-regulations/dma/obligations/obl-123')
        .send({
          status: 'Compliant',
          evidence: ['ev-1'],
          notes: 'Implemented third-party store access',
        })
        .expect(200);

      expect(response.body.status).toBe('Compliant');
    });

    it('should generate DMA compliance report', async () => {
      prismaMock.dmaService.findMany.mockResolvedValue([mockGatekeeperService] as any);
      prismaMock.dmaObligation.findMany.mockResolvedValue([mockDMAObligation] as any);

      const response = await request(app)
        .get('/api/eu-regulations/dma/compliance-report')
        .expect(200);

      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('overallCompliance');
    });
  });

  // ===========================================================================
  // Digital Services Act (DSA) Compliance
  // ===========================================================================
  describe('Digital Services Act Compliance', () => {
    const mockPlatform = {
      id: 'plat-123',
      name: 'Social Network',
      type: 'VLOP', // Very Large Online Platform
      userCount: 50000000,
      organizationId: 'org-123',
    };

    const mockContentModeration = {
      id: 'cm-123',
      platformId: 'plat-123',
      type: 'Illegal Content',
      actionsCount: 10000,
      period: 'Q1-2024',
    };

    it('should register platform', async () => {
      prismaMock.dsaPlatform.create.mockResolvedValue(mockPlatform as any);

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms')
        .send({
          name: 'Social Network',
          type: 'Online Platform',
          monthlyUsers: 50000000,
          services: ['Social Media', 'Marketplace'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should classify platform category', async () => {
      const response = await request(app)
        .post('/api/eu-regulations/dsa/classify-platform')
        .send({
          monthlyActiveUsers: 50000000,
          services: ['Hosting', 'Social Media'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('obligations');
    });

    it('should track content moderation actions', async () => {
      prismaMock.dsaPlatform.findFirst.mockResolvedValue(mockPlatform as any);
      prismaMock.contentModerationLog.create.mockResolvedValue(mockContentModeration as any);

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/content-moderation')
        .send({
          type: 'Illegal Content',
          action: 'Removal',
          contentType: 'Post',
          reason: 'Hate speech',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should generate transparency report', async () => {
      prismaMock.dsaPlatform.findFirst.mockResolvedValue(mockPlatform as any);
      prismaMock.contentModerationLog.groupBy.mockResolvedValue([
        { type: 'Illegal Content', _count: { id: 10000 } },
        { type: 'Terms Violation', _count: { id: 50000 } },
      ] as any);

      const response = await request(app)
        .get('/api/eu-regulations/dsa/platforms/plat-123/transparency-report')
        .query({ period: 'Q1-2024' })
        .expect(200);

      expect(response.body).toHaveProperty('contentModerationStats');
      expect(response.body).toHaveProperty('averageResponseTime');
    });

    it('should manage ad repository', async () => {
      prismaMock.dsaAdRecord.create.mockResolvedValue({
        id: 'ad-123',
        platformId: 'plat-123',
        advertiser: 'Company ABC',
        targetingCriteria: { age: '18-35', location: 'EU' },
        displayedFrom: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/ads')
        .send({
          advertiser: 'Company ABC',
          content: 'Ad content',
          targetingCriteria: { age: '18-35', location: 'EU' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should handle illegal content notices', async () => {
      prismaMock.dsaPlatform.findFirst.mockResolvedValue(mockPlatform as any);
      prismaMock.illegalContentNotice.create.mockResolvedValue({
        id: 'notice-123',
        platformId: 'plat-123',
        contentUrl: 'https://example.com/content',
        notifierType: 'Trusted Flagger',
        status: 'Received',
      } as any);

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/notices')
        .send({
          contentUrl: 'https://example.com/content',
          reason: 'Illegal content',
          notifierType: 'Trusted Flagger',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should track systemic risk assessments', async () => {
      prismaMock.dsaPlatform.findFirst.mockResolvedValue(mockPlatform as any);
      prismaMock.systemicRiskAssessment.create.mockResolvedValue({
        id: 'sra-123',
        platformId: 'plat-123',
        riskType: 'Disinformation',
        severity: 'High',
        mitigations: [],
      } as any);

      const response = await request(app)
        .post('/api/eu-regulations/dsa/platforms/plat-123/risk-assessment')
        .send({
          riskType: 'Disinformation',
          assessment: 'High impact on electoral processes',
          mitigations: ['Fact-checking', 'Labeling'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('riskType');
    });
  });

  // ===========================================================================
  // EU Regulations Dashboard
  // ===========================================================================
  describe('EU Regulations Dashboard', () => {
    it('should get combined compliance dashboard', async () => {
      prismaMock.euAiSystem.count.mockResolvedValue(5);
      prismaMock.dmaService.count.mockResolvedValue(2);
      prismaMock.dsaPlatform.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/api/eu-regulations/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('aiAct');
      expect(response.body).toHaveProperty('dma');
      expect(response.body).toHaveProperty('dsa');
    });

    it('should get compliance calendar', async () => {
      const response = await request(app)
        .get('/api/eu-regulations/calendar')
        .expect(200);

      expect(response.body).toHaveProperty('upcomingDeadlines');
      expect(response.body).toHaveProperty('regulatoryUpdates');
    });
  });
});
