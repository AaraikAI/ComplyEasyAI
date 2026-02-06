/**
 * EU AI Act Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// ---------- Mocks ----------
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
  },
}));

jest.mock('../../../../middleware/errorHandler', () => ({
  __esModule: true,
  AppError: class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  },
}));

const mockRegisterSystem = jest.fn() as jest.Mock<any>;
jest.mock('../../../../services/euRegulations/euAiDatabaseClient', () => ({
  __esModule: true,
  default: {
    registerSystem: mockRegisterSystem,
  },
}));

// ---------- Add EU AI Act Prisma models ----------
const eUAIActSystem = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
  delete: jest.fn() as jest.Mock<any>,
};
const eUAIActRiskAssessment = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
};
const eUAIActTransparencyReport = {
  create: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
};

(prismaMock as any).eUAIActSystem = eUAIActSystem;
(prismaMock as any).eUAIActRiskAssessment = eUAIActRiskAssessment;
(prismaMock as any).eUAIActTransparencyReport = eUAIActTransparencyReport;

// $transaction passes through to callback
(prismaMock as any).$transaction = jest.fn().mockImplementation(async (cb: any) => cb(prismaMock));

// ---------- Import after mocks ----------
import euAiActService from '../../../../services/euRegulations/euAiActService';

describe('EUAIActService', () => {
  const orgId = 'org-123';
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish $transaction mock implementation (cleared by resetMocks: true in jest config)
    (prismaMock as any).$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
  });

  // -------------------------------------------------------------------
  // classifyAIRiskLevel
  // -------------------------------------------------------------------
  describe('classifyAIRiskLevel()', () => {
    const baseSystemData = {
      name: 'Test AI',
      description: 'An AI system',
      useCase: 'general automation',
      targetUsers: ['adults'],
      dataTypes: ['text'],
      decisionMaking: false,
      biometricProcessing: false,
      realTimeProcessing: false,
      affectsFundamentalRights: false,
    };

    it('should classify as minimal risk for basic use case', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, baseSystemData);
      expect(result.riskLevel).toBe('minimal');
      expect(result.prohibitedPractices).toHaveLength(0);
    });

    it('should classify as unacceptable for cognitive manipulation', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'cognitive manipulation of users',
      });
      expect(result.riskLevel).toBe('unacceptable');
      expect(result.prohibitedPractices).toContain('cognitive_manipulation');
    });

    it('should classify as unacceptable when targeting children', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        targetUsers: ['children'],
      });
      expect(result.riskLevel).toBe('unacceptable');
      expect(result.prohibitedPractices).toContain('cognitive_manipulation');
    });

    it('should classify as unacceptable for social scoring', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'social scoring of citizens',
      });
      expect(result.riskLevel).toBe('unacceptable');
      expect(result.prohibitedPractices).toContain('social_scoring');
    });

    it('should classify as unacceptable for biometric identification', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'biometric identification',
        biometricProcessing: true,
      });
      expect(result.riskLevel).toBe('unacceptable');
      expect(result.prohibitedPractices).toContain('biometric_identification');
    });

    it('should add real_time_biometric_identification for real-time biometric', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'biometric identification',
        biometricProcessing: true,
        realTimeProcessing: true,
      });
      expect(result.prohibitedPractices).toContain('real_time_biometric_identification');
    });

    it('should classify as unacceptable for emotion recognition in workplace', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'emotion recognition in workplace settings',
      });
      expect(result.riskLevel).toBe('unacceptable');
      expect(result.prohibitedPractices).toContain('emotion_recognition_workplace');
    });

    it('should classify as unacceptable for predictive policing', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'predictive policing system',
      });
      expect(result.riskLevel).toBe('unacceptable');
      expect(result.prohibitedPractices).toContain('predictive_policing');
    });

    it('should classify as high risk for critical infrastructure', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'critical infrastructure monitoring',
      });
      expect(result.riskLevel).toBe('high');
      expect(result.category).toBe('critical_infrastructure');
    });

    it('should classify as high risk for education', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'education grading system',
      });
      expect(result.riskLevel).toBe('high');
      expect(result.category).toBe('education_training');
    });

    it('should classify as high risk for employment/recruitment', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'recruitment screening',
      });
      expect(result.riskLevel).toBe('high');
      expect(result.category).toBe('employment_worker_management');
    });

    it('should classify as high risk for law enforcement', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'law enforcement evidence analysis',
      });
      expect(result.riskLevel).toBe('high');
      expect(result.category).toBe('law_enforcement');
    });

    it('should classify as high risk for migration/border control', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'border control screening',
      });
      expect(result.riskLevel).toBe('high');
      expect(result.category).toBe('migration_asylum_border');
    });

    it('should classify as high risk for biometric processing (non-identification)', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        useCase: 'general biometric access',
        biometricProcessing: true,
      });
      expect(result.riskLevel).toBe('high');
      expect(result.category).toBe('biometric_identification');
    });

    it('should classify as limited risk when affecting fundamental rights', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        affectsFundamentalRights: true,
      });
      expect(result.riskLevel).toBe('limited');
    });

    it('should classify as limited risk when involves decision making', async () => {
      const result = await euAiActService.classifyAIRiskLevel(orgId, {
        ...baseSystemData,
        decisionMaking: true,
      });
      expect(result.riskLevel).toBe('limited');
    });
  });

  // -------------------------------------------------------------------
  // registerAISystem
  // -------------------------------------------------------------------
  describe('registerAISystem()', () => {
    const minimalSystemData = {
      name: 'ChatBot',
      description: 'Customer chatbot',
      useCase: 'customer support',
      targetUsers: ['adults'],
      dataTypes: ['text'],
      decisionMaking: false,
      biometricProcessing: false,
      realTimeProcessing: false,
      affectsFundamentalRights: false,
      isGeneralPurpose: false,
      isGenerative: false,
    };

    it('should throw 400 for systems with prohibited practices', async () => {
      await expect(
        euAiActService.registerAISystem(orgId, userId, {
          ...minimalSystemData,
          useCase: 'social scoring of citizens',
        }),
      ).rejects.toThrow('prohibited practices');
    });

    it('should register a minimal-risk AI system', async () => {
      const mockSystem = {
        id: 'sys-1',
        organizationId: orgId,
        name: 'ChatBot',
        description: 'Customer chatbot',
        riskLevel: 'minimal',
        isGeneralPurpose: false,
        isGenerative: false,
        prohibitedPractices: [],
        transparencyRequirements: {
          aiGeneratedContentLabeling: false,
          copyrightDataSummary: false,
          illegalContentPrevention: false,
        },
        complianceStatus: 'in_review',
        registeredInEUDatabase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      eUAIActSystem.create.mockResolvedValue(mockSystem);

      const result = await euAiActService.registerAISystem(orgId, userId, minimalSystemData);

      expect(result.riskLevel).toBe('minimal');
      expect(result.registeredInEUDatabase).toBe(false);
      expect(mockRegisterSystem).not.toHaveBeenCalled();
    });

    it('should register a high-risk system and attempt EU database registration', async () => {
      const highRiskSystem = {
        ...minimalSystemData,
        useCase: 'critical infrastructure monitoring',
      };

      const mockSystem = {
        id: 'sys-2',
        organizationId: orgId,
        name: 'ChatBot',
        description: 'Customer chatbot',
        riskLevel: 'high',
        highRiskCategory: 'critical_infrastructure',
        isGeneralPurpose: false,
        isGenerative: false,
        prohibitedPractices: [],
        transparencyRequirements: {
          aiGeneratedContentLabeling: false,
          copyrightDataSummary: false,
          illegalContentPrevention: false,
        },
        complianceStatus: 'in_review',
        registeredInEUDatabase: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      eUAIActSystem.create.mockResolvedValue(mockSystem);
      eUAIActRiskAssessment.create.mockResolvedValue({});
      mockRegisterSystem.mockResolvedValue('eu-reg-id-123');
      eUAIActSystem.update.mockResolvedValue({
        ...mockSystem,
        euDatabaseRegistrationId: 'eu-reg-id-123',
      });

      const result = await euAiActService.registerAISystem(orgId, userId, highRiskSystem);

      expect(result.registeredInEUDatabase).toBe(true);
      expect(mockRegisterSystem).toHaveBeenCalledTimes(1);
      expect(eUAIActSystem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { euDatabaseRegistrationId: 'eu-reg-id-123' },
        }),
      );
    });

    it('should continue if EU database registration fails', async () => {
      const highRiskSystem = {
        ...minimalSystemData,
        useCase: 'critical infrastructure monitoring',
      };

      const mockSystem = {
        id: 'sys-3',
        organizationId: orgId,
        name: 'ChatBot',
        riskLevel: 'high',
        highRiskCategory: 'critical_infrastructure',
        isGeneralPurpose: false,
        isGenerative: false,
        prohibitedPractices: [],
        transparencyRequirements: {},
        complianceStatus: 'in_review',
        registeredInEUDatabase: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      eUAIActSystem.create.mockResolvedValue(mockSystem);
      eUAIActRiskAssessment.create.mockResolvedValue({});
      mockRegisterSystem.mockRejectedValue(new Error('Network error'));

      const result = await euAiActService.registerAISystem(orgId, userId, highRiskSystem);

      // Should still return the system without crashing
      expect(result.id).toBe('sys-3');
    });

    it('should set transparency requirements for generative AI', async () => {
      const generativeSystem = {
        ...minimalSystemData,
        isGenerative: true,
      };

      const mockSystem = {
        id: 'sys-4',
        organizationId: orgId,
        name: 'ChatBot',
        riskLevel: 'minimal',
        isGeneralPurpose: false,
        isGenerative: true,
        prohibitedPractices: [],
        transparencyRequirements: {
          aiGeneratedContentLabeling: true,
          copyrightDataSummary: true,
          illegalContentPrevention: true,
        },
        complianceStatus: 'in_review',
        registeredInEUDatabase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      eUAIActSystem.create.mockResolvedValue(mockSystem);

      const result = await euAiActService.registerAISystem(orgId, userId, generativeSystem);
      expect(result.transparencyRequirements.aiGeneratedContentLabeling).toBe(true);
      expect(result.transparencyRequirements.copyrightDataSummary).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // conductRiskAssessment
  // -------------------------------------------------------------------
  describe('conductRiskAssessment()', () => {
    it('should throw 404 when system not found', async () => {
      eUAIActSystem.findFirst.mockResolvedValue(null);
      await expect(
        euAiActService.conductRiskAssessment(orgId, 'sys-999', userId, {
          safetyRisks: [],
          fundamentalRightsRisks: [],
          discriminationRisks: [],
          privacyRisks: [],
          mitigationMeasures: [],
          recommendations: [],
        }),
      ).rejects.toThrow('AI system not found');
    });

    it('should throw 400 when system is not high-risk', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({
        id: 'sys-1',
        organizationId: orgId,
        riskLevel: 'minimal',
      });

      await expect(
        euAiActService.conductRiskAssessment(orgId, 'sys-1', userId, {
          safetyRisks: [],
          fundamentalRightsRisks: [],
          discriminationRisks: [],
          privacyRisks: [],
          mitigationMeasures: [],
          recommendations: [],
        }),
      ).rejects.toThrow('Risk assessments are only required for high-risk AI systems');
    });

    it('should score 100 when no risks are found', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({
        id: 'sys-1',
        organizationId: orgId,
        riskLevel: 'high',
      });

      eUAIActRiskAssessment.create.mockResolvedValue({
        id: 'ra-1',
        systemId: 'sys-1',
        organizationId: orgId,
        assessedBy: userId,
        assessmentDate: new Date(),
        riskLevel: 'high',
        findings: {
          safetyRisks: [],
          fundamentalRightsRisks: [],
          discriminationRisks: [],
          privacyRisks: [],
        },
        mitigationMeasures: [],
        complianceScore: 100,
        recommendations: [],
        status: 'approved',
      });

      eUAIActSystem.update.mockResolvedValue({});

      const result = await euAiActService.conductRiskAssessment(orgId, 'sys-1', userId, {
        safetyRisks: [],
        fundamentalRightsRisks: [],
        discriminationRisks: [],
        privacyRisks: [],
        mitigationMeasures: [],
        recommendations: [],
      });

      expect(result.complianceScore).toBe(100);
      expect(result.status).toBe('approved');
    });

    it('should reduce compliance score for discovered risks', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({
        id: 'sys-1',
        organizationId: orgId,
        riskLevel: 'high',
      });

      // 3 risks * 10 = 30 deducted => 70 base, + 1 mitigation * 5 = 75
      eUAIActRiskAssessment.create.mockResolvedValue({
        id: 'ra-1',
        systemId: 'sys-1',
        organizationId: orgId,
        assessedBy: userId,
        assessmentDate: new Date(),
        riskLevel: 'high',
        findings: {
          safetyRisks: ['risk1'],
          fundamentalRightsRisks: ['risk2'],
          discriminationRisks: ['risk3'],
          privacyRisks: [],
        },
        mitigationMeasures: ['mitigation1'],
        complianceScore: 75,
        recommendations: [],
        status: 'approved',
      });

      eUAIActSystem.update.mockResolvedValue({});

      const result = await euAiActService.conductRiskAssessment(orgId, 'sys-1', userId, {
        safetyRisks: ['risk1'],
        fundamentalRightsRisks: ['risk2'],
        discriminationRisks: ['risk3'],
        privacyRisks: [],
        mitigationMeasures: ['mitigation1'],
        recommendations: [],
      });

      expect(result.complianceScore).toBe(75);
    });
  });

  // -------------------------------------------------------------------
  // getAISystems / getAISystem
  // -------------------------------------------------------------------
  describe('getAISystems()', () => {
    it('should return all AI systems for organization', async () => {
      eUAIActSystem.findMany.mockResolvedValue([]);
      const result = await euAiActService.getAISystems(orgId);
      expect(result).toEqual([]);
    });
  });

  describe('getAISystem()', () => {
    it('should throw 404 when system not found', async () => {
      eUAIActSystem.findFirst.mockResolvedValue(null);
      await expect(euAiActService.getAISystem(orgId, 'sys-missing')).rejects.toThrow(
        'AI system not found',
      );
    });

    it('should return mapped system', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({
        id: 'sys-1',
        organizationId: orgId,
        name: 'TestAI',
        description: 'desc',
        riskLevel: 'minimal',
        isGeneralPurpose: false,
        isGenerative: false,
        prohibitedPractices: [],
        transparencyRequirements: {},
        complianceStatus: 'in_review',
        registeredInEUDatabase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await euAiActService.getAISystem(orgId, 'sys-1');
      expect(result.name).toBe('TestAI');
    });
  });

  // -------------------------------------------------------------------
  // updateAISystem
  // -------------------------------------------------------------------
  describe('updateAISystem()', () => {
    it('should throw 404 when system not found', async () => {
      eUAIActSystem.findFirst.mockResolvedValue(null);
      await expect(
        euAiActService.updateAISystem(orgId, 'sys-missing', { name: 'New' }),
      ).rejects.toThrow('AI system not found');
    });

    it('should update and return the system', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({ id: 'sys-1', organizationId: orgId });
      eUAIActSystem.update.mockResolvedValue({
        id: 'sys-1',
        organizationId: orgId,
        name: 'Updated AI',
        riskLevel: 'minimal',
        isGeneralPurpose: false,
        isGenerative: false,
        prohibitedPractices: [],
        transparencyRequirements: {},
        complianceStatus: 'compliant',
        registeredInEUDatabase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await euAiActService.updateAISystem(orgId, 'sys-1', {
        complianceStatus: 'compliant',
      });
      expect(result.complianceStatus).toBe('compliant');
    });
  });

  // -------------------------------------------------------------------
  // deleteAISystem
  // -------------------------------------------------------------------
  describe('deleteAISystem()', () => {
    it('should throw 404 when system not found', async () => {
      eUAIActSystem.findFirst.mockResolvedValue(null);
      await expect(euAiActService.deleteAISystem(orgId, 'sys-missing')).rejects.toThrow(
        'AI system not found',
      );
    });

    it('should delete the system', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({ id: 'sys-1', organizationId: orgId });
      eUAIActSystem.delete.mockResolvedValue({});

      await euAiActService.deleteAISystem(orgId, 'sys-1');
      expect(eUAIActSystem.delete).toHaveBeenCalledWith({ where: { id: 'sys-1' } });
    });
  });

  // -------------------------------------------------------------------
  // getRiskAssessments / getLatestRiskAssessment
  // -------------------------------------------------------------------
  describe('getRiskAssessments()', () => {
    it('should throw 404 when system not found', async () => {
      eUAIActSystem.findFirst.mockResolvedValue(null);
      await expect(euAiActService.getRiskAssessments(orgId, 'sys-missing')).rejects.toThrow(
        'AI system not found',
      );
    });

    it('should return assessments', async () => {
      eUAIActSystem.findFirst.mockResolvedValue({ id: 'sys-1', organizationId: orgId });
      eUAIActRiskAssessment.findMany.mockResolvedValue([]);
      const result = await euAiActService.getRiskAssessments(orgId, 'sys-1');
      expect(result).toEqual([]);
    });
  });

  describe('getLatestRiskAssessment()', () => {
    it('should return null when no assessment exists', async () => {
      eUAIActRiskAssessment.findFirst.mockResolvedValue(null);
      const result = await euAiActService.getLatestRiskAssessment(orgId, 'sys-1');
      expect(result).toBeNull();
    });

    it('should return mapped assessment when found', async () => {
      eUAIActRiskAssessment.findFirst.mockResolvedValue({
        id: 'ra-1',
        systemId: 'sys-1',
        organizationId: orgId,
        assessedBy: userId,
        assessmentDate: new Date(),
        riskLevel: 'high',
        findings: { safetyRisks: [], fundamentalRightsRisks: [], discriminationRisks: [], privacyRisks: [] },
        mitigationMeasures: [],
        complianceScore: 85,
        recommendations: [],
        status: 'approved',
      });

      const result = await euAiActService.getLatestRiskAssessment(orgId, 'sys-1');
      expect(result).not.toBeNull();
      expect(result!.complianceScore).toBe(85);
    });
  });

  // -------------------------------------------------------------------
  // generateTransparencyReport
  // -------------------------------------------------------------------
  describe('generateTransparencyReport()', () => {
    it('should generate transparency report for organization', async () => {
      eUAIActSystem.findMany.mockResolvedValue([
        {
          id: 'sys-1',
          name: 'GenAI',
          isGenerative: true,
          riskLevel: 'minimal',
          complianceStatus: 'compliant',
          riskAssessments: [],
        },
        {
          id: 'sys-2',
          name: 'HighRiskAI',
          isGenerative: false,
          riskLevel: 'high',
          complianceStatus: 'at_risk',
          riskAssessments: [{ id: 'ra-1' }],
        },
      ]);

      eUAIActTransparencyReport.create.mockResolvedValue({
        id: 'tr-1',
        organizationId: orgId,
        reportingPeriodStart: new Date('2025-01-01'),
        reportingPeriodEnd: new Date('2025-12-31'),
        generativeAISystems: [{ systemId: 'sys-1', systemName: 'GenAI' }],
        highRiskSystems: [{ systemId: 'sys-2', systemName: 'HighRiskAI', assessmentsCompleted: 1 }],
        prohibitedPracticesDetected: 0,
        complaintsReceived: 0,
        complaintsResolved: 0,
        submittedToCommission: false,
      });

      const result = await euAiActService.generateTransparencyReport(orgId, {
        start: new Date('2025-01-01'),
        end: new Date('2025-12-31'),
      });

      expect(result.id).toBe('tr-1');
      expect(result.submittedToCommission).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // getTransparencyReports
  // -------------------------------------------------------------------
  describe('getTransparencyReports()', () => {
    it('should return transparency reports', async () => {
      eUAIActTransparencyReport.findMany.mockResolvedValue([]);
      const result = await euAiActService.getTransparencyReports(orgId);
      expect(result).toEqual([]);
    });

    it('should apply date filters', async () => {
      eUAIActTransparencyReport.findMany.mockResolvedValue([]);
      await euAiActService.getTransparencyReports(orgId, new Date('2025-01-01'), new Date('2025-12-31'));
      expect(eUAIActTransparencyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: orgId,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });
});
