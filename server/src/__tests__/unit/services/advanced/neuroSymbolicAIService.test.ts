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

    // Re-establish mock implementations (cleared by resetMocks)
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn<any>().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));

    mockGenerateContent.mockResolvedValue({
      response: {
        text: jest.fn<any>().mockReturnValue(JSON.stringify({
          prediction: 'Compliance risk detected',
          confidence: 0.85,
          factors: ['Missing controls', 'Policy gaps'],
        })),
      },
    });

    const { Engine } = require('json-rules-engine');
    Engine.mockImplementation(() => ({
      addRule: jest.fn(),
      run: jest.fn<any>().mockResolvedValue({ events: [] }),
    }));

    // Prisma mocks
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.neuroSymbolicReasoning.create as jest.Mock<any>).mockResolvedValue({ id: 'reasoning-1' });
    (prismaMock.neuroSymbolicReasoning.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.ruleInference.create as jest.Mock<any>).mockResolvedValue({ id: 'inference-1' });
    (prismaMock.ruleInference.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.ruleInference.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.ruleInference.update as jest.Mock<any>).mockResolvedValue({});
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
      (prismaMock.neuroSymbolicReasoning.create as jest.Mock<any>).mockResolvedValue({ id: 'reasoning-1' });
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

    it('should fall back to symbolic-only reasoning when Gemini API key is not configured', async () => {
      delete process.env.GEMINI_API_KEY;

      (prismaMock.neuroSymbolicReasoning.create as jest.Mock<any>).mockResolvedValue({ id: 'reasoning-1' });

      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'Test query'
      );

      // Should succeed but with degraded neural prediction
      expect(result).toBeDefined();
      expect(result.neuralPrediction.confidence).toBe(0);
      expect(result.neuralPrediction.model).toBe('error');
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
      (prismaMock.ruleInference.create as jest.Mock<any>).mockResolvedValue({ id: 'inference-1' });
      (prismaMock.neuroSymbolicReasoning.create as jest.Mock<any>).mockResolvedValue({ id: 'reasoning-1' });
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

      // Source uses findFirst, not findUnique
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
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

      // Source expects violation as { controlId, frameworkId, violationType }
      const result = await neuroSymbolicAIService.performCausalReasoning(
        orgId,
        { controlId: 'ctrl-1', frameworkId: 'fw-1', violationType: 'non_compliance' }
      );

      expect(result).toBeDefined();

      delete process.env.GEMINI_API_KEY;
    });

    it('should throw error if control not found', async () => {
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        neuroSymbolicAIService.performCausalReasoning(
          orgId,
          { controlId: 'nonexistent', frameworkId: 'fw-1', violationType: 'test' }
        )
      ).rejects.toThrow();
    });
  });

  describe('getReasoningHistory', () => {
    it('should return reasoning history for an organization', async () => {
      (prismaMock.neuroSymbolicReasoning.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'reasoning-1',
          organizationId: orgId,
          query: 'Test query',
          createdAt: new Date(),
        },
      ]);

      const result = await neuroSymbolicAIService.getReasoningHistory(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('validateInferredRule', () => {
    it('should validate an inferred rule', async () => {
      (prismaMock.ruleInference.update as jest.Mock<any>).mockResolvedValue({
        id: 'inference-1',
        validationStatus: 'validated',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      // Source signature: (inferenceId, organizationId, userId, validated)
      const result = await neuroSymbolicAIService.validateInferredRule(
        'inference-1',
        orgId,
        'user-123',
        true
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
      (prismaMock.neuroSymbolicReasoning.create as jest.Mock<any>).mockResolvedValue({ id: 'r-1' });
      (prismaMock.ruleInference.create as jest.Mock<any>).mockResolvedValue({ id: 'i-1' });
      (prismaMock.ruleInference.findMany as jest.Mock<any>).mockResolvedValue([]);

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
