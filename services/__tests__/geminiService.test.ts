import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the Google GenAI module before importing the service
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    default: {
      GoogleGenAI: vi.fn().mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }))
    }
  };
});

// Mock the API service to prevent actual HTTP calls
vi.mock('../api', () => ({
  api: {
    ai: {
      generateReport: vi.fn().mockResolvedValue({ report: 'Report Content' }),
      chat: vi.fn().mockResolvedValue({ response: 'Chat response' }),
    },
    risks: {
      prioritize: vi.fn().mockResolvedValue([
        { id: '1', score: 95, rationale: 'Critical' }
      ])
    }
  }
}));

import { generateComplianceReport, chatWithComplianceBot, prioritizeRisks } from '../geminiService';

describe('Gemini AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set test environment variables
    process.env.GEMINI_API_KEY = 'test-api-key';
    import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
  });

  it('generateComplianceReport returns text on success', async () => {
    const result = await generateComplianceReport('SOC2', 'Acme', 'Context');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('generateComplianceReport handles API failure gracefully', async () => {
    // Mock API failure
    const { api } = await import('../api');
    vi.mocked(api.ai.generateReport).mockRejectedValueOnce(new Error('API Error'));
    
    const result = await generateComplianceReport('SOC2', 'Acme', 'Context');
    expect(result).toBe('An error occurred while generating the report.');
  });

  it('prioritizeRisks parses JSON response correctly', async () => {
    const mockRisks = [{ id: '1', description: 'risk', severity: 'High' }];
    
    const result = await prioritizeRisks(mockRisks);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(95);
    expect(result[0].rationale).toBe('Critical');
  });
});
