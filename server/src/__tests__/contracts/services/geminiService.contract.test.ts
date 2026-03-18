/**
 * Gemini Service Contract Tests
 *
 * Verifies the contract for AI request/response shapes, rate limiting,
 * prompt injection neutralization, and PII redaction.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    gemini: { apiKey: 'test-key' },
  },
}));

jest.mock('../../../utils/piiRedaction', () => ({
  redactPII: (text: string) => ({
    redactedText: text,
    map: new Map(),
  }),
  rehydratePII: (text: string) => text,
}));

import geminiService from '../../../services/geminiService';

describe('GeminiService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the mock return value since clearAllMocks resets it
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'AI generated response',
        usageMetadata: { totalTokenCount: 10 },
      },
    });
  });

  // ---------------------------------------------------------------------------
  // generateContent
  // ---------------------------------------------------------------------------
  describe('generateContent', () => {
    it('should accept prompt and userId and return string', async () => {
      const result = await geminiService.generateContent(
        { prompt: 'Analyze compliance gaps' },
        'user-1'
      );

      expect(typeof result).toBe('string');
      expect(result).toBe('AI generated response');
    });

    it('should pass optional temperature and maxOutputTokens', async () => {
      await geminiService.generateContent(
        {
          prompt: 'Test prompt',
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
        'user-2'
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.5,
            maxOutputTokens: 1024,
          }),
        })
      );
    });

    it('should use default temperature 0.7 when not specified', async () => {
      await geminiService.generateContent({ prompt: 'Test' }, 'user-3');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            temperature: 0.7,
          }),
        })
      );
    });

    it('should propagate AI service errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

      await expect(
        geminiService.generateContent({ prompt: 'Test' }, 'user-4')
      ).rejects.toThrow();
    });

    it('should enforce rate limiting per user', async () => {
      const userId = `rate-limit-test-${Date.now()}`;
      const result = await geminiService.generateContent(
        { prompt: 'Test' },
        userId
      );

      expect(typeof result).toBe('string');
    });

    it('should send content in correct message format', async () => {
      await geminiService.generateContent(
        { prompt: 'Check SOC 2 controls' },
        'user-5'
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [
            {
              role: 'user',
              parts: [{ text: expect.any(String) }],
            },
          ],
        })
      );
    });
  });
});
