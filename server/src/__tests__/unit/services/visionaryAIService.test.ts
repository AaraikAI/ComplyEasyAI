/**
 * Visionary AI Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Keep references to mock functions so we can re-set them after resetMocks
const mockText = jest.fn() as jest.Mock<any>;
const mockGenerateContent = jest.fn() as jest.Mock<any>;
const mockGetGenerativeModel = jest.fn() as jest.Mock<any>;

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: (jest.fn() as jest.Mock<any>).mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

const mockAuditLog = jest.fn() as jest.Mock<any>;
jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: mockAuditLog,
  },
}));

import { VisionaryAIService } from '../../../services/visionaryAIService';

describe('VisionaryAIService', () => {
  let service: VisionaryAIService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-set mock implementations (cleared by jest config resetMocks: true)
    mockText.mockReturnValue(JSON.stringify({
      title: 'Data Encryption Policy',
      content: 'Full policy content',
      sections: [{ name: 'Purpose', content: 'Purpose content' }],
      frameworkMappings: [{ framework: 'SOC 2', controls: ['CC6.1'] }],
      confidence: 0.9,
    }));
    mockGenerateContent.mockResolvedValue({ response: { text: mockText } });
    mockGetGenerativeModel.mockReturnValue({ generateContent: mockGenerateContent });
    mockAuditLog.mockResolvedValue({});

    service = new VisionaryAIService();
  });

  describe('getComplianceCoPilotRecommendations()', () => {
    it('should get compliance co-pilot recommendations', async () => {
      const organizationId = 'org-123';
      const userId = 'user-123';

      prismaMock.complianceFramework.findMany.mockResolvedValue([]);
      prismaMock.riskItem.findMany.mockResolvedValue([]);
      prismaMock.vendor.findMany.mockResolvedValue([]);
      prismaMock.personnel.findMany.mockResolvedValue([]);
      prismaMock.continuousMonitor.findMany.mockResolvedValue([]);
      prismaMock.issue.findMany.mockResolvedValue([]);
      prismaMock.policy.findMany.mockResolvedValue([]);

      const result = await service.getComplianceCoPilotRecommendations(organizationId, userId);

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('criticalActions');
      expect(result).toHaveProperty('quickWins');
      expect(result).toHaveProperty('longTermInitiatives');
    });
  });

  describe('predictFutureRisks()', () => {
    it('should predict future risks', async () => {
      const organizationId = 'org-123';
      const userId = 'user-123';
      const timeHorizonDays = 30;

      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'risk-1', severity: 'High', category: 'Security' },
      ] as any);
      prismaMock.riskAssessment.findMany.mockResolvedValue([]);
      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
        name: 'Test Org',
        frameworks: [],
        vendors: [],
      } as any);

      const result = await service.predictFutureRisks(organizationId, timeHorizonDays, userId);

      expect(result).toHaveProperty('predictions');
      expect(Array.isArray(result.predictions)).toBe(true);
    });
  });

  describe('generatePolicyFromNaturalLanguage()', () => {
    it('should generate policy from natural language', async () => {
      const organizationId = 'org-123';
      const userId = 'user-123';
      const policyData = {
        description: 'Create a data encryption policy',
        category: 'Security',
        frameworkAlignment: ['SOC2'],
        industry: 'Technology',
      };

      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
        name: 'Test Org',
        plan: 'Visionary',
        frameworks: [{ name: 'SOC 2', controls: [] }],
      } as any);
      prismaMock.policy.create.mockResolvedValue({
        id: 'policy-123',
        organizationId,
        title: 'Data Encryption Policy',
        category: 'Security',
        content: 'Full policy content',
        version: '1.0-DRAFT',
        status: 'Draft',
      } as any);

      const result = await service.generatePolicyFromNaturalLanguage(
        organizationId,
        policyData,
        userId
      );

      expect(result).toHaveProperty('policy');
      expect(result).toHaveProperty('confidence');
    });
  });
});

