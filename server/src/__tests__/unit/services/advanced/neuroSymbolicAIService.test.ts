/**
 * Neuro-Symbolic AI Service Unit Tests - Comprehensive Coverage
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

import neuroSymbolicAIService from '../../../../services/advanced/neuroSymbolicAIService';

describe('NeuroSymbolicAIService', () => {
  const orgId = 'org-123';

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

  const mockRisk = {
    id: 'risk-1',
    title: 'Data Breach',
    severity: 'High',
    status: 'Open',
    likelihood: 4,
    impact: 5,
    category: 'Security',
    organizationId: orgId,
    createdAt: new Date(),
  };

  const mockPolicy = {
    id: 'policy-1',
    title: 'Data Protection Policy',
    status: 'Active',
    organizationId: orgId,
    description: 'Ensures data protection compliance',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework]);
    (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework);
    (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockFramework.controls);
    (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([mockRisk]);
    (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([mockPolicy]);
    (prismaMock.vendor.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  // ===================== analyzeCompliance =====================
  describe('analyzeCompliance', () => {
    it('should analyze compliance for an organization', async () => {
      const result = await neuroSymbolicAIService.analyzeCompliance(orgId);
      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
    });

    it('should include framework analysis', async () => {
      const result = await neuroSymbolicAIService.analyzeCompliance(orgId);
      expect(result.frameworks).toBeDefined();
      expect(Array.isArray(result.frameworks)).toBe(true);
    });

    it('should include risk analysis', async () => {
      const result = await neuroSymbolicAIService.analyzeCompliance(orgId);
      expect(result.risks).toBeDefined();
    });

    it('should handle organization with no frameworks', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.analyzeCompliance(orgId);
      expect(result).toBeDefined();
    });

    it('should handle organization with no risks', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.analyzeCompliance(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== generateRecommendations =====================
  describe('generateRecommendations', () => {
    it('should generate compliance recommendations', async () => {
      const result = await neuroSymbolicAIService.generateRecommendations(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should generate recommendations based on risk severity', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
        { ...mockRisk, severity: 'Critical' },
      ]);
      const result = await neuroSymbolicAIService.generateRecommendations(orgId);
      expect(result).toBeDefined();
    });

    it('should handle empty frameworks for recommendations', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.generateRecommendations(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== runSymbolicReasoning =====================
  describe('runSymbolicReasoning', () => {
    it('should run symbolic reasoning on compliance data', async () => {
      const result = await neuroSymbolicAIService.runSymbolicReasoning(orgId, {
        query: 'What controls are missing?',
        context: 'SOC2 compliance',
      });
      expect(result).toBeDefined();
    });

    it('should run reasoning with risk context', async () => {
      const result = await neuroSymbolicAIService.runSymbolicReasoning(orgId, {
        query: 'What are the highest priority risks?',
        context: 'risk assessment',
      });
      expect(result).toBeDefined();
    });

    it('should run reasoning with policy context', async () => {
      const result = await neuroSymbolicAIService.runSymbolicReasoning(orgId, {
        query: 'Are all policies up to date?',
        context: 'policy review',
      });
      expect(result).toBeDefined();
    });
  });

  // ===================== buildKnowledgeGraph =====================
  describe('buildKnowledgeGraph', () => {
    it('should build a knowledge graph for an organization', async () => {
      const result = await neuroSymbolicAIService.buildKnowledgeGraph(orgId);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should include framework nodes', async () => {
      const result = await neuroSymbolicAIService.buildKnowledgeGraph(orgId);
      const frameworkNodes = result.nodes.filter((n: any) => n.type === 'framework');
      expect(frameworkNodes.length).toBeGreaterThan(0);
    });

    it('should include control nodes', async () => {
      const result = await neuroSymbolicAIService.buildKnowledgeGraph(orgId);
      const controlNodes = result.nodes.filter((n: any) => n.type === 'control');
      expect(controlNodes.length).toBeGreaterThan(0);
    });

    it('should include risk nodes', async () => {
      const result = await neuroSymbolicAIService.buildKnowledgeGraph(orgId);
      const riskNodes = result.nodes.filter((n: any) => n.type === 'risk');
      expect(riskNodes.length).toBeGreaterThan(0);
    });

    it('should handle empty data', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.policy.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.buildKnowledgeGraph(orgId);
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });
  });

  // ===================== detectAnomalies =====================
  describe('detectAnomalies', () => {
    it('should detect compliance anomalies', async () => {
      const result = await neuroSymbolicAIService.detectAnomalies(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should detect anomalies from risk patterns', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
        { ...mockRisk, severity: 'Critical', status: 'Open' },
        { ...mockRisk, id: 'risk-2', severity: 'Critical', status: 'Open' },
      ]);
      const result = await neuroSymbolicAIService.detectAnomalies(orgId);
      expect(result).toBeDefined();
    });

    it('should handle no anomalies found', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([{
        ...mockFramework,
        controls: [{ id: 'c-1', name: 'CC1.1', description: 'Test', status: 'Implemented', category: 'Security' }],
      }]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.detectAnomalies(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== performCausalAnalysis =====================
  describe('performCausalAnalysis', () => {
    it('should perform causal analysis on compliance gaps', async () => {
      const result = await neuroSymbolicAIService.performCausalAnalysis(orgId);
      expect(result).toBeDefined();
    });

    it('should handle empty data', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);
      const result = await neuroSymbolicAIService.performCausalAnalysis(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== generateExplanation =====================
  describe('generateExplanation', () => {
    it('should generate explanation for a compliance finding', async () => {
      const result = await neuroSymbolicAIService.generateExplanation(orgId, {
        findingType: 'control_gap',
        findingId: 'c-2',
      });
      expect(result).toBeDefined();
      expect(typeof result.explanation).toBe('string');
    });

    it('should generate explanation for risk finding', async () => {
      const result = await neuroSymbolicAIService.generateExplanation(orgId, {
        findingType: 'risk',
        findingId: 'risk-1',
      });
      expect(result).toBeDefined();
    });
  });

  // ===================== predictComplianceTrajectory =====================
  describe('predictComplianceTrajectory', () => {
    it('should predict compliance trajectory', async () => {
      const result = await neuroSymbolicAIService.predictComplianceTrajectory(orgId);
      expect(result).toBeDefined();
    });

    it('should predict trajectory with custom timeframe', async () => {
      const result = await neuroSymbolicAIService.predictComplianceTrajectory(orgId, 90);
      expect(result).toBeDefined();
    });
  });

  // ===================== compareFrameworks =====================
  describe('compareFrameworks', () => {
    it('should compare two frameworks', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        mockFramework,
        { ...mockFramework, id: 'fw-2', name: 'ISO 27001', controls: [{ id: 'c-3', name: 'A.5.1', description: 'Policies', status: 'Implemented', category: 'Security' }] },
      ]);
      const result = await neuroSymbolicAIService.compareFrameworks(orgId, 'fw-1', 'fw-2');
      expect(result).toBeDefined();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle database error in analyzeCompliance', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));
      await expect(neuroSymbolicAIService.analyzeCompliance(orgId)).rejects.toThrow();
    });

    it('should handle database error in buildKnowledgeGraph', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));
      await expect(neuroSymbolicAIService.buildKnowledgeGraph(orgId)).rejects.toThrow();
    });
  });
});
