/**
 * Visionary AI Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: (jest.fn() as jest.Mock<any>).mockImplementation(() => ({
    getGenerativeModel: (jest.fn() as jest.Mock<any>).mockReturnValue({
      generateContent: (jest.fn() as jest.Mock<any>).mockResolvedValue({
        response: {
          text: (jest.fn() as jest.Mock<any>).mockReturnValue('AI recommendation'),
        },
      }),
    }),
  })),
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: (jest.fn() as jest.Mock<any>).mockResolvedValue({}),
  },
}));

import { VisionaryAIService } from '../../../services/visionaryAIService';

describe('VisionaryAIService', () => {
  let service: VisionaryAIService;

  beforeEach(() => {
    jest.clearAllMocks();
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

