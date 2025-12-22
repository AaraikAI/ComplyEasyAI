/**
 * Gemini Service Unit Tests
 * Comprehensive test coverage for AI service
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock Google Generative AI
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    gemini: {
      apiKey: 'test-api-key',
    },
  },
}));

jest.mock('../../utils/piiRedaction', () => ({
  redactPII: jest.fn().mockReturnValue({
    redactedText: 'redacted prompt',
    map: new Map(),
  }),
  rehydratePII: jest.fn().mockImplementation((text) => text),
}));

import geminiService from '../../../services/geminiService';

describe('GeminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
  });

  describe('generateContent()', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Generated content'),
          usageMetadata: {
            totalTokenCount: 100,
          },
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateContent(
        { prompt: 'Test prompt' },
        'user-123'
      );

      expect(result).toBe('Generated content');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should enforce rate limiting', async () => {
      // Make 60 requests to hit rate limit
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Content'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Make requests rapidly
      const requests = Array(60).fill(0).map(() =>
        geminiService.generateContent({ prompt: 'test' }, 'user-123')
      );

      await Promise.all(requests);

      // 61st request should fail
      await expect(
        geminiService.generateContent({ prompt: 'test' }, 'user-123')
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle API quota errors', async () => {
      mockGenerateContent.mockRejectedValue({
        message: 'quota exceeded',
      });

      await expect(
        geminiService.generateContent({ prompt: 'test' }, 'user-123')
      ).rejects.toThrow('AI service quota exceeded');
    });

    it('should use custom model when provided', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Content'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await geminiService.generateContent(
        { prompt: 'test', model: 'gemini-1.5-pro' },
        'user-123'
      );

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
      });
    });

    it('should use default temperature when not provided', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Content'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await geminiService.generateContent({ prompt: 'test' }, 'user-123');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.7,
          }),
        })
      );
    });
  });

  describe('generateComplianceReport()', () => {
    it('should generate compliance report', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('# Compliance Report\n\n## Executive Summary\n...'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateComplianceReport(
        'SOC 2',
        'Test Company',
        'Annual audit',
        'user-123'
      );

      expect(result).toContain('Compliance Report');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should use lower temperature for reports', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Report'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await geminiService.generateComplianceReport(
        'SOC 2',
        'Company',
        'Context',
        'user-123'
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.5,
          }),
        })
      );
    });
  });

  describe('prioritizeRisks()', () => {
    it('should prioritize risks and return scores', async () => {
      const risks = [
        { id: 'risk-1', description: 'Critical vulnerability', severity: 'High', category: 'Security' },
        { id: 'risk-2', description: 'Minor issue', severity: 'Low', category: 'Compliance' },
      ];

      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify([
            { id: 'risk-1', score: 95, rationale: 'Critical security issue' },
            { id: 'risk-2', score: 30, rationale: 'Low priority' },
          ])),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.prioritizeRisks(risks, 'user-123');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('rationale');
    });

    it('should handle invalid JSON response', async () => {
      const risks = [{ id: 'risk-1', description: 'Test' }];

      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Invalid JSON response'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.prioritizeRisks(risks, 'user-123');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should use lower temperature for prioritization', async () => {
      const risks = [{ id: 'risk-1', description: 'Test' }];
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('[]'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await geminiService.prioritizeRisks(risks, 'user-123');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.3,
          }),
        })
      );
    });
  });

  describe('generateRemediationPlan()', () => {
    it('should generate remediation plan', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('# Remediation Plan\n\n## Immediate Actions\n...'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateRemediationPlan(
        'SQL injection vulnerability',
        'user-123'
      );

      expect(result).toContain('Remediation Plan');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('generatePolicy()', () => {
    it('should generate policy document', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('# Security Policy\n\n## Purpose\n...'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generatePolicy(
        'Security Policy',
        'Test Company',
        'professional',
        'user-123'
      );

      expect(result).toContain('Policy');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('analyzeContract()', () => {
    it('should analyze contract text', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Contract analysis: ...'),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.analyzeContract(
        'Contract text here...',
        'user-123'
      );

      expect(typeof result).toBe('string');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });
});

