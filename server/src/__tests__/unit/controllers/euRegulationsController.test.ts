/**
 * EU Regulations Controller Unit Tests
 *
 * Tests for EU AI Act, DMA, and DSA compliance endpoints.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock services before importing controller
const mockEuAiActService = {
  registerAISystem: jest.fn<any>(),
  getAISystems: jest.fn<any>(),
  getAISystem: jest.fn<any>(),
  getRiskAssessments: jest.fn<any>(),
  getLatestRiskAssessment: jest.fn<any>(),
  conductRiskAssessment: jest.fn<any>(),
  generateTransparencyReport: jest.fn<any>(),
  getTransparencyReports: jest.fn<any>(),
  updateAISystem: jest.fn<any>(),
  deleteAISystem: jest.fn<any>(),
};

const mockDmaService = {
  registerGatekeeper: jest.fn<any>(),
  getGatekeepers: jest.fn<any>(),
  getGatekeeper: jest.fn<any>(),
  updateObligationCompliance: jest.fn<any>(),
  getObligations: jest.fn<any>(),
  getComplianceReports: jest.fn<any>(),
  getLatestComplianceReport: jest.fn<any>(),
  generateComplianceReport: jest.fn<any>(),
  updateGatekeeper: jest.fn<any>(),
  deleteGatekeeper: jest.fn<any>(),
};

const mockDsaService = {
  registerPlatform: jest.fn<any>(),
  getPlatforms: jest.fn<any>(),
  getPlatform: jest.fn<any>(),
  recordContentModeration: jest.fn<any>(),
  getContentModerationHistory: jest.fn<any>(),
  reportIllegalContent: jest.fn<any>(),
  processIllegalContentReport: jest.fn<any>(),
  addAdToRepository: jest.fn<any>(),
  getAdsFromRepository: jest.fn<any>(),
  generateTransparencyReport: jest.fn<any>(),
  getTransparencyReports: jest.fn<any>(),
  conductRiskAssessment: jest.fn<any>(),
  getRiskAssessments: jest.fn<any>(),
  getLatestRiskAssessment: jest.fn<any>(),
  updateRiskAssessment: jest.fn<any>(),
  configureNonPersonalizedFeed: jest.fn<any>(),
  getNonPersonalizedFeed: jest.fn<any>(),
  updateNonPersonalizedFeedStatus: jest.fn<any>(),
  updatePlatform: jest.fn<any>(),
  deletePlatform: jest.fn<any>(),
};

jest.mock('../../../services/euRegulations/euAiActService', () => ({
  __esModule: true,
  default: mockEuAiActService,
}));

jest.mock('../../../services/euRegulations/dmaService', () => ({
  __esModule: true,
  default: mockDmaService,
}));

jest.mock('../../../services/euRegulations/dsaService', () => ({
  __esModule: true,
  default: mockDsaService,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import controller from '../../../controllers/euRegulationsController';
import { AppError } from '../../../middleware/errorHandler';

describe('EURegulationsController', () => {
  const mockReq = {
    user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
    params: {},
    query: {},
    body: {},
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test' },
  } as any;
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn(),
  } as any;
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq.params = {};
    mockReq.query = {};
    mockReq.body = {};
    mockRes.status.mockReturnThis();
    mockRes.json.mockReturnThis();
  });

  // ==========================================================================
  // EU AI ACT
  // ==========================================================================

  describe('registerAISystem()', () => {
    it('should register a new AI system and return 201', async () => {
      const systemData = {
        name: 'AI Chatbot',
        purpose: 'Customer support',
        riskCategory: 'HIGH',
      };
      const createdSystem = { id: 'sys-1', ...systemData, organizationId: 'org-1' };
      mockReq.body = systemData;
      mockEuAiActService.registerAISystem.mockResolvedValue(createdSystem);

      await controller.registerAISystem(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.registerAISystem).toHaveBeenCalledWith('org-1', 'user-1', systemData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ system: createdSystem });
    });

    it('should return AppError status when service throws AppError', async () => {
      mockReq.body = { name: '' };
      mockEuAiActService.registerAISystem.mockRejectedValue(new AppError('Name is required', 400));

      await controller.registerAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Name is required' });
    });

    it('should return 500 when service throws unexpected error', async () => {
      mockReq.body = { name: 'System' };
      mockEuAiActService.registerAISystem.mockRejectedValue(new Error('DB connection failed'));

      await controller.registerAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to register AI system' });
    });
  });

  describe('getAISystems()', () => {
    it('should return all AI systems for the organization', async () => {
      const systems = [
        { id: 'sys-1', name: 'System A', organizationId: 'org-1' },
        { id: 'sys-2', name: 'System B', organizationId: 'org-1' },
      ];
      mockEuAiActService.getAISystems.mockResolvedValue(systems);

      await controller.getAISystems(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.getAISystems).toHaveBeenCalledWith('org-1');
      expect(mockRes.json).toHaveBeenCalledWith({ systems });
    });

    it('should return empty array when no systems exist', async () => {
      mockEuAiActService.getAISystems.mockResolvedValue([]);

      await controller.getAISystems(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ systems: [] });
    });

    it('should return 500 on unexpected error', async () => {
      mockEuAiActService.getAISystems.mockRejectedValue(new Error('DB error'));

      await controller.getAISystems(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch AI systems' });
    });
  });

  describe('getAISystem()', () => {
    it('should return a single AI system by ID', async () => {
      const system = { id: 'sys-1', name: 'System A', organizationId: 'org-1' };
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.getAISystem.mockResolvedValue(system);

      await controller.getAISystem(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.getAISystem).toHaveBeenCalledWith('org-1', 'sys-1');
      expect(mockRes.json).toHaveBeenCalledWith({ system });
    });

    it('should handle not found (AppError 404)', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockEuAiActService.getAISystem.mockRejectedValue(new AppError('AI system not found', 404));

      await controller.getAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'AI system not found' });
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.getAISystem.mockRejectedValue(new Error('Timeout'));

      await controller.getAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch AI system' });
    });
  });

  describe('getRiskAssessments()', () => {
    it('should return risk assessments for a system', async () => {
      const assessments = [
        { id: 'ra-1', systemId: 'sys-1', riskLevel: 'HIGH' },
        { id: 'ra-2', systemId: 'sys-1', riskLevel: 'MEDIUM' },
      ];
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.getRiskAssessments.mockResolvedValue(assessments);

      await controller.getRiskAssessments(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.getRiskAssessments).toHaveBeenCalledWith('org-1', 'sys-1');
      expect(mockRes.json).toHaveBeenCalledWith({ assessments });
    });

    it('should handle AppError from service', async () => {
      mockReq.params = { id: 'sys-bad' };
      mockEuAiActService.getRiskAssessments.mockRejectedValue(new AppError('System not found', 404));

      await controller.getRiskAssessments(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'System not found' });
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.getRiskAssessments.mockRejectedValue(new Error('Query failed'));

      await controller.getRiskAssessments(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch risk assessments' });
    });
  });

  describe('getLatestRiskAssessment()', () => {
    it('should return the latest risk assessment', async () => {
      const assessment = { id: 'ra-2', systemId: 'sys-1', riskLevel: 'HIGH', createdAt: new Date() };
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.getLatestRiskAssessment.mockResolvedValue(assessment);

      await controller.getLatestRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.getLatestRiskAssessment).toHaveBeenCalledWith('org-1', 'sys-1');
      expect(mockRes.json).toHaveBeenCalledWith({ assessment });
    });

    it('should handle AppError from service', async () => {
      mockReq.params = { id: 'sys-bad' };
      mockEuAiActService.getLatestRiskAssessment.mockRejectedValue(new AppError('No assessments found', 404));

      await controller.getLatestRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.getLatestRiskAssessment.mockRejectedValue(new Error('Failure'));

      await controller.getLatestRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch latest risk assessment' });
    });
  });

  describe('conductRiskAssessment()', () => {
    it('should conduct a risk assessment and return 201', async () => {
      const body = { criteria: { accuracy: 0.95 } };
      const assessment = { id: 'ra-new', systemId: 'sys-1', ...body };
      mockReq.params = { id: 'sys-1' };
      mockReq.body = body;
      mockEuAiActService.conductRiskAssessment.mockResolvedValue(assessment);

      await controller.conductRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.conductRiskAssessment).toHaveBeenCalledWith(
        'org-1',
        'sys-1',
        'user-1',
        body,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ assessment });
    });

    it('should handle AppError from service (e.g., validation error)', async () => {
      mockReq.params = { id: 'sys-1' };
      mockReq.body = {};
      mockEuAiActService.conductRiskAssessment.mockRejectedValue(
        new AppError('Assessment criteria required', 400),
      );

      await controller.conductRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Assessment criteria required' });
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.params = { id: 'sys-1' };
      mockReq.body = { criteria: {} };
      mockEuAiActService.conductRiskAssessment.mockRejectedValue(new Error('Internal'));

      await controller.conductRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to conduct risk assessment' });
    });
  });

  describe('generateTransparencyReport()', () => {
    it('should generate a transparency report with valid dates and return 201', async () => {
      const report = { id: 'rpt-1', status: 'COMPLETED' };
      mockReq.body = {
        reportingPeriod: { start: '2024-01-01', end: '2024-06-30' },
      };
      mockEuAiActService.generateTransparencyReport.mockResolvedValue(report);

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.generateTransparencyReport).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ report });
    });

    it('should return 400 when reportingPeriod is missing', async () => {
      mockReq.body = {};

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Reporting period is required. Please provide start and end dates.',
      });
      expect(mockEuAiActService.generateTransparencyReport).not.toHaveBeenCalled();
    });

    it('should return 400 when start date is missing', async () => {
      mockReq.body = { reportingPeriod: { end: '2024-06-30' } };

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Both start and end dates are required for the reporting period.',
      });
    });

    it('should return 400 when end date is missing', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-01-01' } };

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Both start and end dates are required for the reporting period.',
      });
    });

    it('should return 400 when dates are invalid format', async () => {
      mockReq.body = { reportingPeriod: { start: 'not-a-date', end: 'also-not' } };

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid date format. Please provide valid start and end dates.',
      });
    });

    it('should return 400 when start date is after end date', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-07-01', end: '2024-01-01' } };

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Start date must be before end date.',
      });
    });

    it('should return 400 when start date equals end date', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-01-01', end: '2024-01-01' } };

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Start date must be before end date.',
      });
    });

    it('should handle AppError from service', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-01-01', end: '2024-06-30' } };
      mockEuAiActService.generateTransparencyReport.mockRejectedValue(
        new AppError('No systems found', 404),
      );

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No systems found' });
    });

    it('should return 500 on unexpected error from service', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-01-01', end: '2024-06-30' } };
      mockEuAiActService.generateTransparencyReport.mockRejectedValue(new Error('Crash'));

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to generate transparency report' });
    });
  });

  describe('getTransparencyReports()', () => {
    it('should return transparency reports without date filters', async () => {
      const reports = [{ id: 'rpt-1' }, { id: 'rpt-2' }];
      mockEuAiActService.getTransparencyReports.mockResolvedValue(reports);

      await controller.getTransparencyReports(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.getTransparencyReports).toHaveBeenCalledWith('org-1', undefined, undefined);
      expect(mockRes.json).toHaveBeenCalledWith({ reports });
    });

    it('should pass date query params when provided', async () => {
      mockReq.query = { startDate: '2024-01-01', endDate: '2024-06-30' };
      mockEuAiActService.getTransparencyReports.mockResolvedValue([]);

      await controller.getTransparencyReports(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.getTransparencyReports).toHaveBeenCalledWith(
        'org-1',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should return 500 on unexpected error', async () => {
      mockEuAiActService.getTransparencyReports.mockRejectedValue(new Error('Fail'));

      await controller.getTransparencyReports(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateAISystem()', () => {
    it('should update an AI system and return it', async () => {
      const updated = { id: 'sys-1', name: 'Updated Name' };
      mockReq.params = { id: 'sys-1' };
      mockReq.body = { name: 'Updated Name' };
      mockEuAiActService.updateAISystem.mockResolvedValue(updated);

      await controller.updateAISystem(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.updateAISystem).toHaveBeenCalledWith('org-1', 'sys-1', { name: 'Updated Name' });
      expect(mockRes.json).toHaveBeenCalledWith({ system: updated });
    });

    it('should handle AppError from service', async () => {
      mockReq.params = { id: 'sys-bad' };
      mockReq.body = {};
      mockEuAiActService.updateAISystem.mockRejectedValue(new AppError('Not found', 404));

      await controller.updateAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteAISystem()', () => {
    it('should delete an AI system and return 204', async () => {
      mockReq.params = { id: 'sys-1' };
      mockEuAiActService.deleteAISystem.mockResolvedValue(undefined);

      await controller.deleteAISystem(mockReq, mockRes, mockNext);

      expect(mockEuAiActService.deleteAISystem).toHaveBeenCalledWith('org-1', 'sys-1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should handle AppError from service', async () => {
      mockReq.params = { id: 'sys-bad' };
      mockEuAiActService.deleteAISystem.mockRejectedValue(new AppError('Not found', 404));

      await controller.deleteAISystem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ==========================================================================
  // DMA
  // ==========================================================================

  describe('registerGatekeeper()', () => {
    it('should register a gatekeeper and return 201', async () => {
      const data = { name: 'Platform X', corePlatformService: 'Social Network' };
      const gatekeeper = { id: 'gk-1', ...data };
      mockReq.body = data;
      mockDmaService.registerGatekeeper.mockResolvedValue(gatekeeper);

      await controller.registerGatekeeper(mockReq, mockRes, mockNext);

      expect(mockDmaService.registerGatekeeper).toHaveBeenCalledWith('org-1', data);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ gatekeeper });
    });

    it('should return 500 on error', async () => {
      mockReq.body = {};
      mockDmaService.registerGatekeeper.mockRejectedValue(new Error('DB error'));

      await controller.registerGatekeeper(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to register gatekeeper' });
    });
  });

  describe('getGatekeepers()', () => {
    it('should return all gatekeepers for org', async () => {
      const gatekeepers = [{ id: 'gk-1' }];
      mockDmaService.getGatekeepers.mockResolvedValue(gatekeepers);

      await controller.getGatekeepers(mockReq, mockRes, mockNext);

      expect(mockDmaService.getGatekeepers).toHaveBeenCalledWith('org-1');
      expect(mockRes.json).toHaveBeenCalledWith({ gatekeepers });
    });
  });

  describe('getGatekeeper()', () => {
    it('should return a single gatekeeper by ID', async () => {
      const gatekeeper = { id: 'gk-1', name: 'Platform X' };
      mockReq.params = { id: 'gk-1' };
      mockDmaService.getGatekeeper.mockResolvedValue(gatekeeper);

      await controller.getGatekeeper(mockReq, mockRes, mockNext);

      expect(mockDmaService.getGatekeeper).toHaveBeenCalledWith('org-1', 'gk-1');
      expect(mockRes.json).toHaveBeenCalledWith({ gatekeeper });
    });

    it('should handle 404 AppError', async () => {
      mockReq.params = { id: 'bad-id' };
      mockDmaService.getGatekeeper.mockRejectedValue(new AppError('Gatekeeper not found', 404));

      await controller.getGatekeeper(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Gatekeeper not found' });
    });
  });

  describe('generateComplianceReport()', () => {
    it('should generate a compliance report and return 201', async () => {
      const report = { id: 'cr-1', status: 'COMPLETED' };
      mockReq.params = { id: 'gk-1' };
      mockReq.body = { reportingPeriod: { start: '2024-01-01', end: '2024-06-30' } };
      mockDmaService.generateComplianceReport.mockResolvedValue(report);

      await controller.generateComplianceReport(mockReq, mockRes, mockNext);

      expect(mockDmaService.generateComplianceReport).toHaveBeenCalledWith(
        'org-1',
        'gk-1',
        { start: '2024-01-01', end: '2024-06-30' },
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ report });
    });
  });

  // ==========================================================================
  // DSA
  // ==========================================================================

  describe('registerPlatform()', () => {
    it('should register a platform and return 201', async () => {
      const data = { name: 'Social Platform', type: 'VLOP' };
      const platform = { id: 'plt-1', ...data };
      mockReq.body = data;
      mockDsaService.registerPlatform.mockResolvedValue(platform);

      await controller.registerPlatform(mockReq, mockRes, mockNext);

      expect(mockDsaService.registerPlatform).toHaveBeenCalledWith('org-1', data);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ platform });
    });

    it('should return 500 on error', async () => {
      mockReq.body = {};
      mockDsaService.registerPlatform.mockRejectedValue(new Error('error'));

      await controller.registerPlatform(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to register platform' });
    });
  });

  describe('getPlatform()', () => {
    it('should return a platform by ID', async () => {
      const platform = { id: 'plt-1', name: 'Social Platform' };
      mockReq.params = { id: 'plt-1' };
      mockDsaService.getPlatform.mockResolvedValue(platform);

      await controller.getPlatform(mockReq, mockRes, mockNext);

      expect(mockDsaService.getPlatform).toHaveBeenCalledWith('org-1', 'plt-1');
      expect(mockRes.json).toHaveBeenCalledWith({ platform });
    });

    it('should handle not found error', async () => {
      mockReq.params = { id: 'bad-id' };
      mockDsaService.getPlatform.mockRejectedValue(new AppError('Platform not found', 404));

      await controller.getPlatform(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Platform not found' });
    });
  });

  describe('recordContentModeration()', () => {
    it('should record content moderation and return 201', async () => {
      const data = { contentType: 'post', action: 'remove', reason: 'illegal' };
      const moderation = { id: 'mod-1', ...data };
      mockReq.params = { id: 'plt-1' };
      mockReq.body = data;
      mockDsaService.recordContentModeration.mockResolvedValue(moderation);

      await controller.recordContentModeration(mockReq, mockRes, mockNext);

      expect(mockDsaService.recordContentModeration).toHaveBeenCalledWith('org-1', 'plt-1', data);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ moderation });
    });
  });

  describe('conductDSARiskAssessment()', () => {
    it('should conduct DSA risk assessment and return 201', async () => {
      const body = { riskTypes: ['systemic'] };
      const assessment = { id: 'dsa-ra-1', ...body };
      mockReq.params = { id: 'plt-1' };
      mockReq.body = body;
      mockDsaService.conductRiskAssessment.mockResolvedValue(assessment);

      await controller.conductDSARiskAssessment(mockReq, mockRes, mockNext);

      expect(mockDsaService.conductRiskAssessment).toHaveBeenCalledWith('org-1', 'plt-1', 'user-1', body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ assessment });
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.params = { id: 'plt-1' };
      mockReq.body = {};
      mockDsaService.conductRiskAssessment.mockRejectedValue(new Error('fail'));

      await controller.conductDSARiskAssessment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to conduct risk assessment' });
    });
  });

  describe('deletePlatform()', () => {
    it('should delete a platform and return 204', async () => {
      mockReq.params = { id: 'plt-1' };
      mockDsaService.deletePlatform.mockResolvedValue(undefined);

      await controller.deletePlatform(mockReq, mockRes, mockNext);

      expect(mockDsaService.deletePlatform).toHaveBeenCalledWith('org-1', 'plt-1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should handle AppError from service', async () => {
      mockReq.params = { id: 'bad-id' };
      mockDsaService.deletePlatform.mockRejectedValue(new AppError('Not found', 404));

      await controller.deletePlatform(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.params = { id: 'plt-1' };
      mockDsaService.deletePlatform.mockRejectedValue(new Error('error'));

      await controller.deletePlatform(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to delete platform' });
    });
  });
});
