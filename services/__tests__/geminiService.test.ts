
import { generateComplianceReport, chatWithComplianceBot, prioritizeRisks } from '../geminiService';
import { GoogleGenAI } from '@google/genai';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

describe('Gemini AI Service', () => {
  const mockGenerateContent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    }));
    process.env.API_KEY = 'test-api-key';
  });

  test('generateComplianceReport returns text on success', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'Report Content' });
    const result = await generateComplianceReport('SOC2', 'Acme', 'Context');
    expect(result).toBe('Report Content');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  test('generateComplianceReport handles API failure gracefully', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));
    const result = await generateComplianceReport('SOC2', 'Acme', 'Context');
    expect(result).toBe('An error occurred while generating the report.');
  });

  test('prioritizeRisks parses JSON response correctly', async () => {
    const mockRisks = [{ id: '1', description: 'risk', severity: 'High' }];
    const mockResponse = JSON.stringify([{ id: '1', score: 95, rationale: 'Critical' }]);
    
    mockGenerateContent.mockResolvedValueOnce({ text: mockResponse });
    
    const result = await prioritizeRisks(mockRisks);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(95);
  });
});
