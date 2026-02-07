/**
 * Neuro-Symbolic AI Service Unit Tests - Comprehensive Coverage
 * Tests: performHybridReasoning, inferRulesFromPatterns, performCausalReasoning,
 *        generateExplainableDecision, getReasoningHistory, validateInferredRule
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
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
    gemini: { apiKey: 'test-api-key' },
    server: { env: 'test' },
  },
}));

const mockGenerateContent = jest.fn<any>();
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
    run: jest.fn<any>().mockResolvedValue({
      results: [],
      events: [],
      failureResults: [],
    }),
  })),
}));

import neuroSymbolicAIService from '../../../../services/advanced/neuroSymbolicAIService';

describe('NeuroSymbolicAIService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  const mockFramework = {
    id: 'fw-1',
    name: 'SOC 2',
    organizationId: orgId,
    status: 'In_Progress',
    controls: [
      { id: 'c-1', name: 'CC1.1', description: 'Control Environment', status: 'Implemented', category: 'Security' },
      { id: 'c-2', name: 'CC2.1', description: 'Risk Assessment', status: 'Pending', category: 'Security' },
    ],
  };

  const mockReasoning = {
    id: 'reasoning-1',
    organizationId: orgId,
    query: 'Analyze compliance gaps',
    neuralResult: { prediction: 'needs_improvement', confidence: 0.85 },
    symbolicResult: { conclusion: 'Missing 2 controls', confidence: 0.9 },
    fusedResult: { decision: 'Implement controls CC2.1 and CC3.1', confidence: 0.87 },
    createdAt: new Date(),
  };

  const mockRuleInference = {
    id: 'inference-1',
    organizationId: orgId,
    condition: 'risk.severity == "Critical"',
    outcome: 'Immediate remediation required',
    confidence: 0.92,
    validationStatus: 'pending',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGenerateContent.mockResolvedValue({
      response: {
        text: jest.fn<any>().mockReturnValue(JSON.stringify({
          prediction: 'needs_improvement',
          confidence: 0.85,
          reasoning: 'Multiple controls need attention',
          recommendations: ['Implement CC2.1', 'Review policies'],
        })),
      },
    });

    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework]);
    (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockFramework.controls);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'risk-1', title: 'Data Breach', severity: 'High', status: 'Open', likelihood: 4, impact: 5, category: 'Security', organizationId: orgId, createdAt: new Date() },
    ]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'policy-1', title: 'Data Protection', status: 'Active', organizationId: orgId },
    ]);
    (prismaMock.vendor.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.neuroSymbolicReasoning.create as jest.Mock<any>).mockResolvedValue(mockReasoning);
    (prismaMock.neuroSymbolicReasoning.findMany as jest.Mock<any>).mockResolvedValue([mockReasoning]);
    (prismaMock.neuroSymbolicReasoning.findUnique as jest.Mock<any>).mockResolvedValue(mockReasoning);
    (prismaMock.ruleInference.create as jest.Mock<any>).mockResolvedValue(mockRuleInference);
    (prismaMock.ruleInference.findMany as jest.Mock<any>).mockResolvedValue([mockRuleInference]);
    (prismaMock.ruleInference.findUnique as jest.Mock<any>).mockResolvedValue(mockRuleInference);
    (prismaMock.ruleInference.update as jest.Mock<any>).mockResolvedValue({
      ...mockRuleInference,
      validationStatus: 'validated',
      validatedBy: userId,
      validatedAt: new Date(),
    });
  });

  // ===================== performHybridReasoning =====================
  describe('performHybridReasoning', () => {
    it('should perform hybrid reasoning successfully', async () => {
      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'What are our compliance gaps?'
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
    });

    it('should perform reasoning with framework context', async () => {
      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'How compliant are we with SOC 2?',
        { frameworks: ['SOC 2'] }
      );

      expect(result).toBeDefined();
    });

    it('should perform reasoning with control context', async () => {
      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'Which controls need attention?',
        { controls: ['CC1.1', 'CC2.1'] }
      );

      expect(result).toBeDefined();
    });

    it('should perform reasoning with risk context', async () => {
      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'What are the highest risk areas?',
        { risks: ['Data Breach'] }
      );

      expect(result).toBeDefined();
    });

    it('should handle AI service errors gracefully', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('AI service unavailable'));

      const result = await neuroSymbolicAIService.performHybridReasoning(
        orgId,
        'Test query'
      );

      // Service should still return a result using symbolic reasoning
      expect(result).toBeDefined();
    });
  });

  // ===================== inferRulesFromPatterns =====================
  describe('inferRulesFromPatterns', () => {
    it('should infer rules from compliance patterns', async () => {
      const patterns = [
        { condition: 'high_risk_count > 5', outcome: 'escalation_required', frequency: 15 },
        { condition: 'control_gap_ratio > 0.3', outcome: 'remediation_needed', frequency: 10 },
      ];

      const result = await neuroSymbolicAIService.inferRulesFromPatterns(orgId, patterns);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty patterns', async () => {
      const result = await neuroSymbolicAIService.inferRulesFromPatterns(orgId, []);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle single pattern', async () => {
      const patterns = [
        { condition: 'risk.severity == "Critical"', outcome: 'immediate_action', frequency: 20 },
      ];

      const result = await neuroSymbolicAIService.inferRulesFromPatterns(orgId, patterns);
      expect(result).toBeDefined();
    });
  });

  // ===================== performCausalReasoning =====================
  describe('performCausalReasoning', () => {
    beforeEach(() => {
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(
        { id: 'c-2', name: 'CC2.1', description: 'Risk Assessment', status: 'Pending', category: 'Security', frameworkId: 'fw-1' }
      );
    });

    it('should perform causal reasoning on a violation', async () => {
      const result = await neuroSymbolicAIService.performCausalReasoning(orgId, {
        controlId: 'c-2',
        frameworkId: 'fw-1',
        violationType: 'non_compliance',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('rootCauses');
      expect(result).toHaveProperty('causalChain');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('confidence');
    });

    it('should handle causal reasoning with different violation types', async () => {
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(
        { id: 'c-1', name: 'CC1.1', description: 'Control Environment', status: 'Implemented', category: 'Security', frameworkId: 'fw-1' }
      );

      const result = await neuroSymbolicAIService.performCausalReasoning(orgId, {
        controlId: 'c-1',
        frameworkId: 'fw-1',
        violationType: 'partial_compliance',
      });

      expect(result).toBeDefined();
    });

    it('should throw when control not found', async () => {
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        neuroSymbolicAIService.performCausalReasoning(orgId, {
          controlId: 'nonexistent',
          frameworkId: 'fw-1',
          violationType: 'non_compliance',
        })
      ).rejects.toThrow('Control not found');
    });
  });

  // ===================== generateExplainableDecision =====================
  describe('generateExplainableDecision', () => {
    it('should generate an explainable decision', async () => {
      const result = await neuroSymbolicAIService.generateExplainableDecision(orgId, {
        action: 'approve_vendor',
        reasoning: 'Vendor meets SOC 2 requirements',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('explanation');
    });

    it('should include symbolic justification', async () => {
      const result = await neuroSymbolicAIService.generateExplainableDecision(orgId, {
        action: 'escalate_risk',
        reasoning: 'Risk score exceeds threshold',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('symbolicJustification');
    });

    it('should include neural factors', async () => {
      const result = await neuroSymbolicAIService.generateExplainableDecision(orgId, {
        action: 'reject_evidence',
        reasoning: 'Evidence quality below threshold',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('neuralFactors');
    });
  });

  // ===================== getReasoningHistory =====================
  describe('getReasoningHistory', () => {
    it('should get reasoning history for organization', async () => {
      const result = await neuroSymbolicAIService.getReasoningHistory(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get reasoning history with limit', async () => {
      const result = await neuroSymbolicAIService.getReasoningHistory(orgId, 5);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no history', async () => {
      (prismaMock.neuroSymbolicReasoning.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.getReasoningHistory(orgId);
      expect(result).toEqual([]);
    });
  });

  // ===================== validateInferredRule =====================
  describe('validateInferredRule', () => {
    it('should validate an inferred rule', async () => {
      const result = await neuroSymbolicAIService.validateInferredRule(
        'inference-1', orgId, userId, true
      );

      expect(result).toBeDefined();
      expect(prismaMock.ruleInference.update).toHaveBeenCalled();
    });

    it('should reject an inferred rule', async () => {
      (prismaMock.ruleInference.update as jest.Mock<any>).mockResolvedValue({
        ...mockRuleInference,
        validationStatus: 'rejected',
        validatedBy: userId,
        validatedAt: new Date(),
      });

      const result = await neuroSymbolicAIService.validateInferredRule(
        'inference-1', orgId, userId, false
      );

      expect(result).toBeDefined();
    });

    it('should handle non-existent rule', async () => {
      (prismaMock.ruleInference.update as jest.Mock<any>).mockRejectedValue(new Error('Record not found'));

      await expect(
        neuroSymbolicAIService.validateInferredRule('nonexistent', orgId, userId, true)
      ).rejects.toThrow();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle database error in performHybridReasoning gracefully', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      // Service handles errors gracefully and returns a result via fallback
      const result = await neuroSymbolicAIService.performHybridReasoning(orgId, 'test query');
      expect(result).toBeDefined();
    });

    it('should handle database error in getReasoningHistory gracefully', async () => {
      (prismaMock.neuroSymbolicReasoning.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      // Service catches errors and returns empty array
      const result = await neuroSymbolicAIService.getReasoningHistory(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle AI error in generateExplainableDecision', async () => {
      mockGenerateContent.mockRejectedValue(new Error('AI error'));

      const result = await neuroSymbolicAIService.generateExplainableDecision(orgId, {
        action: 'test',
        reasoning: 'test',
      });

      // Should still produce a result using fallback
      expect(result).toBeDefined();
    });
  });
});
