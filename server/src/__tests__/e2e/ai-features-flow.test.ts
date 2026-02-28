/**
 * E2E Tests - AI Features Flow
 * Tests complete AI-powered workflows including policy generation,
 * risk analysis, compliance suggestions, and AI governance.
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

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    generatePolicyDraft: jest.fn().mockResolvedValue({
      content: 'Generated policy content...',
      sections: ['Introduction', 'Scope', 'Policy', 'Responsibilities'],
    }),
    analyzeRisk: jest.fn().mockResolvedValue({
      riskLevel: 'Medium',
      factors: ['Data sensitivity', 'Access controls'],
      recommendations: ['Implement MFA', 'Review access quarterly'],
    }),
    suggestControls: jest.fn().mockResolvedValue([
      { name: 'Access Control', relevance: 0.95 },
      { name: 'Encryption', relevance: 0.88 },
    ]),
    assessCompliance: jest.fn().mockResolvedValue({
      score: 78,
      gaps: ['Missing documentation', 'Incomplete testing'],
    }),
    chat: jest.fn().mockResolvedValue({
      response: 'Based on SOC 2 requirements...',
      sources: ['CC1.1', 'CC6.1'],
    }),
  },
}));

import aiRoutes from '../../routes/ai';
import aiRmfRoutes from '../../routes/aiRmf';
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
app.use('/api/ai', aiRoutes);
app.use('/api/ai-rmf', aiRmfRoutes);
app.use(errorHandler);

describe('E2E: AI Features Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Policy Generation Workflow', () => {
    it('should generate policy draft', async () => {
      const response = await request(app)
        .post('/api/ai/generate-policy')
        .send({
          policyType: 'Access Control',
          framework: 'SOC2',
          industry: 'Technology',
          requirements: ['MFA required', 'Quarterly reviews'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('sections');
    });

    it('should refine generated policy', async () => {
      const response = await request(app)
        .post('/api/ai/refine-policy')
        .send({
          originalContent: 'Draft policy content...',
          feedback: 'Make it more specific to cloud environments',
          tone: 'formal',
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });

    it('should suggest policy improvements', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-policy')
        .send({
          content: 'Existing policy content...',
          framework: 'ISO27001',
        })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('complianceGaps');
    });
  });

  describe('AI Risk Analysis Workflow', () => {
    it('should analyze risk from description', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-risk')
        .send({
          description: 'Third-party vendor with access to customer PII',
          context: {
            dataTypes: ['PII', 'Financial'],
            accessLevel: 'Read/Write',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskLevel');
      expect(response.body).toHaveProperty('factors');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should prioritize risks', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'r1', title: 'Risk 1', severity: 'High' },
        { id: 'r2', title: 'Risk 2', severity: 'Medium' },
      ] as any);

      const response = await request(app)
        .post('/api/ai/prioritize-risks')
        .send({
          riskIds: ['r1', 'r2'],
          criteria: ['businessImpact', 'likelihood', 'urgency'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('prioritizedList');
    });

    it('should generate remediation plan', async () => {
      prismaMock.riskItem.findFirst.mockResolvedValue({
        id: 'r1',
        title: 'Unencrypted Data',
        severity: 'High',
      } as any);

      const response = await request(app)
        .post('/api/ai/remediation-plan')
        .send({
          riskId: 'r1',
          constraints: {
            budget: 'Medium',
            timeline: '3 months',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('steps');
    });
  });

  describe('AI Compliance Assistant Workflow', () => {
    it('should answer compliance questions', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'What are the requirements for SOC 2 access control?',
          context: {
            framework: 'SOC2',
            currentProgress: 45,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('sources');
    });

    it('should suggest relevant controls', async () => {
      const response = await request(app)
        .post('/api/ai/suggest-controls')
        .send({
          requirement: 'CC6.1 - Logical Access Security',
          existingControls: ['ctrl-1', 'ctrl-2'],
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('relevance');
    });

    it('should assess compliance readiness', async () => {
      prismaMock.framework.findFirst.mockResolvedValue({
        id: 'fw-123',
        requirements: [],
        controls: [],
      } as any);

      const response = await request(app)
        .post('/api/ai/assess-readiness')
        .send({
          frameworkId: 'fw-123',
          auditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('gaps');
    });
  });

  describe('AI RMF (Risk Management Framework) Workflow', () => {
    const mockAISystem = {
      id: 'ai-sys-123',
      name: 'Customer Recommendation Engine',
      type: 'Machine Learning',
      riskLevel: 'High',
      status: 'Active',
      organizationId: 'org-123',
    };

    it('should register AI system', async () => {
      prismaMock.aiSystem.create.mockResolvedValue(mockAISystem as any);

      const response = await request(app)
        .post('/api/ai-rmf/systems')
        .send({
          name: 'Customer Recommendation Engine',
          type: 'Machine Learning',
          purpose: 'Product recommendations',
          dataInputs: ['Purchase history', 'Browsing behavior'],
          outputs: ['Product recommendations'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should assess AI system trustworthiness', async () => {
      prismaMock.aiSystem.findFirst.mockResolvedValue(mockAISystem as any);

      const response = await request(app)
        .post('/api/ai-rmf/systems/ai-sys-123/trustworthiness')
        .send({
          characteristics: {
            accuracy: 0.92,
            fairness: 0.88,
            transparency: 0.75,
            accountability: 0.90,
            security: 0.95,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('overallScore');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should perform AI risk assessment', async () => {
      prismaMock.aiSystem.findFirst.mockResolvedValue(mockAISystem as any);
      prismaMock.aiRiskAssessment.create.mockResolvedValue({
        id: 'assess-123',
        aiSystemId: 'ai-sys-123',
        riskLevel: 'High',
        mitigations: [],
      } as any);

      const response = await request(app)
        .post('/api/ai-rmf/systems/ai-sys-123/risk-assessment')
        .send({
          assessmentType: 'Comprehensive',
          riskCategories: ['Bias', 'Privacy', 'Security', 'Reliability'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('riskLevel');
    });

    it('should track AI lifecycle stages', async () => {
      prismaMock.aiSystem.findFirst.mockResolvedValue(mockAISystem as any);
      prismaMock.aiSystem.update.mockResolvedValue({
        ...mockAISystem,
        lifecycleStage: 'Deployment',
      } as any);

      const response = await request(app)
        .patch('/api/ai-rmf/systems/ai-sys-123/lifecycle')
        .send({
          stage: 'Deployment',
          notes: 'Moving to production',
          approvedBy: 'user-123',
        })
        .expect(200);

      expect(response.body.lifecycleStage).toBe('Deployment');
    });

    it('should get AI governance dashboard', async () => {
      prismaMock.aiSystem.findMany.mockResolvedValue([mockAISystem] as any);

      const response = await request(app)
        .get('/api/ai-rmf/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalSystems');
      expect(response.body).toHaveProperty('byRiskLevel');
      expect(response.body).toHaveProperty('byLifecycleStage');
    });
  });

  describe('AI Usage Analytics', () => {
    it('should track AI feature usage', async () => {
      prismaMock.aiUsageLog.findMany.mockResolvedValue([
        { feature: 'policy-generation', count: 50 },
        { feature: 'risk-analysis', count: 30 },
        { feature: 'chat', count: 200 },
      ] as any);

      const response = await request(app)
        .get('/api/ai/usage')
        .query({ period: '30d' })
        .expect(200);

      expect(response.body).toHaveProperty('byFeature');
      expect(response.body).toHaveProperty('totalCalls');
    });

    it('should get AI quality metrics', async () => {
      prismaMock.aiFeedback.aggregate.mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: { id: 150 },
      } as any);

      const response = await request(app)
        .get('/api/ai/quality-metrics')
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('feedbackCount');
    });

    it('should submit AI feedback', async () => {
      prismaMock.aiFeedback.create.mockResolvedValue({
        id: 'fb-123',
        feature: 'policy-generation',
        rating: 5,
        comment: 'Very helpful',
      } as any);

      const response = await request(app)
        .post('/api/ai/feedback')
        .send({
          feature: 'policy-generation',
          requestId: 'req-123',
          rating: 5,
          comment: 'Very helpful output',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
