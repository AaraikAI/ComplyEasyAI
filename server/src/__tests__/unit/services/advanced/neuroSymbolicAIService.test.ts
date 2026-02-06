/**
 * NeuroSymbolic AI Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    gemini: { apiKey: '' },
  },
}));

const mockGenerateContent = jest.fn<any>().mockResolvedValue({
  response: {
    text: jest.fn<any>().mockReturnValue(JSON.stringify({
      prediction: 'Compliance risk detected',
      confidence: 0.85,
      factors: ['Missing controls', 'Policy gaps'],
    })),
  },
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn<any>().mockImplementation(() => ({
    getGenerativeModel: jest.fn<any>().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

jest.mock('json-rules-engine', () => ({
  Engine: jest.fn<any>().mockImplementation(() => ({
    addRule: jest.fn(),
    run: jest.fn<any>().mockResolvedValue({ events: [] }),
  })),
}));

import neuroSymbolicAIService from '../../../../services/advanced/neuroSymbolicAIService';

describe('NeuroSymbolicAIService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('performHybridReasoning', () => {
    it('should perform hybrid reasoning with neural and symbolic components', async () => {
      // Mock Gemini API key
      process.env.GEMINI_API_KEY = 'test-key';

      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'c-1', name: 'Access Control', status: 'Implemented', framework: 'SOC2' },
      ]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'r-1', severity: 'High', category: 'Security' },
      ]);
      (prismaMock.neuroSymbolicReasoning as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'reasoning-1' }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'What is the compliance risk for missing access controls?',
        { frameworks: ['SOC2'], controls: ['access_control'] }
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.neuralPrediction).toBeDefined();
      expect(result.symbolicReasoning).toBeDefined();
      expect(result.hybridResult).toBeDefined();
      expect(result.hybridResult.confidence).toBeGreaterThanOrEqual(0);
      expect(result.hybridResult.confidence).toBeLessThanOrEqual(1);

      delete process.env.GEMINI_API_KEY;
    });

    it('should throw error when Gemini API key is not configured', async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        neuroSymbolicAIService.performHybridReasoning(
          orgId,
          'Test query'
        )
      ).rejects.toThrow();
    });
  });

  describe('inferRulesFromPatterns', () => {
    it('should infer rules from observed patterns', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        {
          action: 'control.status_changed',
          details: JSON.stringify({ status: 'Non_Compliant' }),
          createdAt: new Date(),
        },
      ]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.ruleInference as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'inference-1' }),
      };
      (prismaMock.neuroSymbolicReasoning as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'reasoning-1' }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const patterns = [
        {
          pattern: 'Control becomes non-compliant when evidence expires',
          frequency: 10,
          confidence: 0.9,
        },
      ];

      const result = await neuroSymbolicAIService.inferRulesFromPatterns(orgId, patterns);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should skip patterns with low frequency', async () => {
      const patterns = [
        {
          pattern: 'Rare pattern',
          frequency: 2,
          confidence: 0.5,
        },
      ];

      const result = await neuroSymbolicAIService.inferRulesFromPatterns(orgId, patterns);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe('performCausalReasoning', () => {
    it('should perform causal reasoning for a control', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      const mockControl = {
        id: 'ctrl-1',
        name: 'Access Control',
        status: 'At Risk',
        evidence: 'Some evidence',
        frameworkId: 'fw-1',
        framework: { id: 'fw-1', name: 'SOC2', organizationId: orgId },
      };

      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'r-1', title: 'Auth bypass', severity: 'High', category: 'Security' },
      ]);
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: jest.fn<any>().mockReturnValue(JSON.stringify({
            causalGraph: {
              nodes: [{ id: 'cause-1', label: 'Missing MFA' }],
              edges: [{ from: 'cause-1', to: 'effect-1' }],
            },
            rootCauses: ['Missing multi-factor authentication'],
            contributingFactors: ['Weak password policy'],
            recommendations: ['Implement MFA'],
          })),
        },
      });

      const result = await neuroSymbolicAIService.performCausalReasoning(
        orgId,
        'ctrl-1'
      );

      expect(result).toBeDefined();

      delete process.env.GEMINI_API_KEY;
    });

    it('should throw error if control not found', async () => {
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        neuroSymbolicAIService.performCausalReasoning(orgId, 'nonexistent')
      ).rejects.toThrow();
    });
  });

  describe('getReasoningHistory', () => {
    it('should return reasoning history for an organization', async () => {
      (prismaMock.neuroSymbolicReasoning as any) = {
        findMany: jest.fn<any>().mockResolvedValue([
          {
            id: 'reasoning-1',
            organizationId: orgId,
            query: 'Test query',
            createdAt: new Date(),
          },
        ]),
      };

      const result = await neuroSymbolicAIService.getReasoningHistory(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('validateInferredRule', () => {
    it('should validate an inferred rule', async () => {
      (prismaMock.ruleInference as any) = {
        findFirst: jest.fn<any>().mockResolvedValue({
          id: 'inference-1',
          organizationId: orgId,
          validationStatus: 'pending',
        }),
        update: jest.fn<any>().mockResolvedValue({
          id: 'inference-1',
          validationStatus: 'validated',
        }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await neuroSymbolicAIService.validateInferredRule(
        orgId,
        'inference-1',
        true,
        'user-123'
      );

      expect(result).toBeDefined();
    });
  });

  describe('generateExplainableDecision', () => {
    it('should generate an explainable decision', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'c-1', name: 'Control 1', status: 'Implemented' },
      ]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.neuroSymbolicReasoning as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'r-1' }),
      };
      (prismaMock.ruleInference as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'i-1' }),
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const result = await neuroSymbolicAIService.generateExplainableDecision(
        orgId,
        'Should we implement additional access controls?',
        { frameworks: ['SOC2'] }
      );

      expect(result).toBeDefined();

      delete process.env.GEMINI_API_KEY;
    });
  });
});
