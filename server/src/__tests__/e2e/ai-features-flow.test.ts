/**
 * E2E Tests - AI Features Flow
 * Tests AI-powered workflows: policy/report generation, gap analysis, chat,
 * vendor scoring, and the NIST AI RMF governance routes.
 *
 * Exercises the real routes in src/routes/ai.ts and src/routes/aiRmf.ts. The
 * handlers delegate to geminiService / secureChatService / aiRmfService, which
 * are mocked here so assertions verify route wiring (path + method + status +
 * response envelope) deterministically.
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

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// Provide ALL tierMiddleware exports both AI route modules import at load time.
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

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    generateComplianceReport: jest.fn(),
    generatePolicy: jest.fn(),
    performGapAnalysis: jest.fn(),
    scoreVendorRisk: jest.fn(),
  },
}));

jest.mock('../../services/secureChatService', () => ({
  __esModule: true,
  default: {
    chatWithUser: jest.fn(),
  },
}));

jest.mock('../../services/aiRmfService', () => ({
  __esModule: true,
  default: {
    createAISystem: jest.fn(),
    getAISystems: jest.fn(),
    getAISystemById: jest.fn(),
    updateAISystem: jest.fn(),
    deleteAISystem: jest.fn(),
    createAssessment: jest.fn(),
    getAssessments: jest.fn(),
    calculateTrustworthinessScore: jest.fn(),
    getDashboardData: jest.fn(),
  },
}));

import aiRoutes from '../../routes/ai';
import aiRmfRoutes from '../../routes/aiRmf';
import { errorHandler } from '../../middleware/errorHandler';
import geminiService from '../../services/geminiService';
import secureChatService from '../../services/secureChatService';
import aiRmfService from '../../services/aiRmfService';

const gemini = geminiService as unknown as Record<string, jest.Mock>;
const chat = secureChatService as unknown as Record<string, jest.Mock>;
const aiRmf = aiRmfService as unknown as Record<string, jest.Mock>;

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/ai', aiRoutes);
app.use('/api/ai-rmf', aiRmfRoutes);
app.use(errorHandler);

describe('E2E: AI Features Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // AI Generation
  // ===========================================================================
  describe('AI Generation', () => {
    it('should generate a compliance report', async () => {
      gemini.generateComplianceReport.mockResolvedValue({ content: 'Report body...', sections: ['Intro'] });

      const response = await request(app)
        .post('/api/ai/report')
        .send({
          framework: 'SOC2',
          companyName: 'Test Company',
          context: 'A SaaS provider pursuing SOC 2 Type II.',
        })
        .expect(200);

      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('content');
      expect(gemini.generateComplianceReport).toHaveBeenCalledWith(
        'SOC2', 'Test Company', expect.any(String), 'user-123'
      );
    });

    it('should generate a policy draft', async () => {
      gemini.generatePolicy.mockResolvedValue({ content: 'Generated policy...', sections: ['Scope'] });

      const response = await request(app)
        .post('/api/ai/policy')
        .send({
          type: 'Access Control',
          company: 'Test Company',
          tone: 'formal',
        })
        .expect(200);

      expect(response.body).toHaveProperty('policy');
      expect(response.body.policy).toHaveProperty('content');
    });
  });

  // ===========================================================================
  // AI Gap Analysis
  // ===========================================================================
  describe('AI Gap Analysis', () => {
    it('should perform a gap analysis', async () => {
      gemini.performGapAnalysis.mockResolvedValue({
        score: 78,
        gaps: ['Missing documentation', 'Incomplete testing'],
      });

      const response = await request(app)
        .post('/api/ai/gap-analysis')
        .send({
          current: 'We have MFA and quarterly access reviews.',
          target: ['SOC2', 'ISO27001'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('score', 78);
      expect(response.body).toHaveProperty('gaps');
      // The route normalizes a string/array target into an array.
      expect(gemini.performGapAnalysis).toHaveBeenCalledWith(
        expect.any(String), ['SOC2', 'ISO27001'], 'user-123'
      );
    });
  });

  // ===========================================================================
  // AI Compliance Assistant (Chat)
  // ===========================================================================
  describe('AI Compliance Assistant', () => {
    it('should answer compliance questions', async () => {
      chat.chatWithUser.mockResolvedValue({
        response: 'Based on SOC 2 requirements...',
        sources: ['CC1.1', 'CC6.1'],
        encrypted: false,
      });

      const response = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'What are the requirements for SOC 2 access control?' })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('sources');
      expect(chat.chatWithUser).toHaveBeenCalledWith(
        'What are the requirements for SOC 2 access control?', 'user-123', 'org-123', undefined
      );
    });

    it('should reject an empty chat message with 400', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({ message: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  // ===========================================================================
  // AI Vendor Scoring
  // ===========================================================================
  describe('AI Vendor Scoring', () => {
    it('should score a vendor', async () => {
      gemini.scoreVendorRisk.mockResolvedValue({ riskScore: 65, riskLevel: 'Medium' });

      const response = await request(app)
        .post('/api/ai/vendor-score')
        .send({
          vendor: 'Acme Cloud',
          service: 'Infrastructure hosting',
          dataAccess: 'Customer PII',
        })
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body.score).toHaveProperty('riskLevel', 'Medium');
    });
  });

  // ===========================================================================
  // NIST AI RMF Workflow
  // ===========================================================================
  describe('AI RMF (Risk Management Framework) Workflow', () => {
    const mockAISystem = {
      id: 'ai-sys-123',
      name: 'Customer Recommendation Engine',
      riskLevel: 'High',
      organizationId: 'org-123',
    };

    it('should register an AI system', async () => {
      aiRmf.createAISystem.mockResolvedValue(mockAISystem);

      const response = await request(app)
        .post('/api/ai-rmf/systems')
        .send({
          name: 'Customer Recommendation Engine',
          purpose: 'Product recommendations',
          riskLevel: 'High',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'ai-sys-123');
    });

    it('should list AI systems', async () => {
      aiRmf.getAISystems.mockResolvedValue([mockAISystem]);

      const response = await request(app)
        .get('/api/ai-rmf/systems')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id', 'ai-sys-123');
    });

    it('should perform an AI risk assessment', async () => {
      aiRmf.createAssessment.mockResolvedValue({
        id: 'assess-123',
        aiSystemId: 'ai-sys-123',
        riskLevel: 'High',
      });

      const response = await request(app)
        .post('/api/ai-rmf/systems/ai-sys-123/assessments')
        .send({
          assessmentType: 'Comprehensive',
          riskCategories: ['Bias', 'Privacy'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('riskLevel', 'High');
    });

    it('should calculate the trustworthiness score', async () => {
      aiRmf.calculateTrustworthinessScore.mockResolvedValue({ overall: 0.88, characteristics: {} });

      const response = await request(app)
        .post('/api/ai-rmf/systems/ai-sys-123/calculate-trustworthiness')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body.score).toHaveProperty('overall', 0.88);
    });

    it('should get the AI governance dashboard', async () => {
      aiRmf.getDashboardData.mockResolvedValue({
        totalSystems: 5,
        byRiskLevel: { High: 2, Medium: 3 },
        byLifecycleStage: { Deployment: 4 },
      });

      const response = await request(app)
        .get('/api/ai-rmf/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalSystems', 5);
      expect(response.body).toHaveProperty('byRiskLevel');
      expect(response.body).toHaveProperty('byLifecycleStage');
    });
  });
});
