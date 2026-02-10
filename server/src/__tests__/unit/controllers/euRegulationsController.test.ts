/**
 * EU Regulations Controller Unit Tests
 *
 * Tests for EU AI Act, DMA, and DSA compliance endpoints.
 * Controller uses asyncHandler — errors propagate to next() via .catch(next).
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

jest.mock('../../../types/express', () => ({
  asyncHandler: (fn: any) => async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  },
  authAsyncHandler: (fn: any) => async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  },
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

    it('should forward AppError to next when service throws AppError', async () => {
      mockReq.body = { name: '' };
      const error = new AppError('Name is required', 400);
      mockEuAiActService.registerAISystem.mockRejectedValue(error);

      await controller.registerAISystem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error to next', async () => {
      mockReq.body = { name: 'System' };
      const error = new Error('DB connection failed');
      mockEuAiActService.registerAISystem.mockRejectedValue(error);

      await controller.registerAISystem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward unexpected error to next', async () => {
      const error = new Error('DB error');
      mockEuAiActService.getAISystems.mockRejectedValue(error);

      await controller.getAISystems(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError 404 to next', async () => {
      mockReq.params = { id: 'nonexistent' };
      const error = new AppError('AI system not found', 404);
      mockEuAiActService.getAISystem.mockRejectedValue(error);

      await controller.getAISystem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error to next', async () => {
      mockReq.params = { id: 'sys-1' };
      const error = new Error('Timeout');
      mockEuAiActService.getAISystem.mockRejectedValue(error);

      await controller.getAISystem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError to next', async () => {
      mockReq.params = { id: 'sys-bad' };
      const error = new AppError('System not found', 404);
      mockEuAiActService.getRiskAssessments.mockRejectedValue(error);

      await controller.getRiskAssessments(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error to next', async () => {
      mockReq.params = { id: 'sys-1' };
      const error = new Error('Query failed');
      mockEuAiActService.getRiskAssessments.mockRejectedValue(error);

      await controller.getRiskAssessments(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError to next', async () => {
      mockReq.params = { id: 'sys-bad' };
      const error = new AppError('No assessments found', 404);
      mockEuAiActService.getLatestRiskAssessment.mockRejectedValue(error);

      await controller.getLatestRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error to next', async () => {
      mockReq.params = { id: 'sys-1' };
      const error = new Error('Failure');
      mockEuAiActService.getLatestRiskAssessment.mockRejectedValue(error);

      await controller.getLatestRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError to next (e.g., validation error)', async () => {
      mockReq.params = { id: 'sys-1' };
      mockReq.body = {};
      const error = new AppError('Assessment criteria required', 400);
      mockEuAiActService.conductRiskAssessment.mockRejectedValue(error);

      await controller.conductRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error to next', async () => {
      mockReq.params = { id: 'sys-1' };
      mockReq.body = { criteria: {} };
      const error = new Error('Internal');
      mockEuAiActService.conductRiskAssessment.mockRejectedValue(error);

      await controller.conductRiskAssessment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward error to next when reportingPeriod is missing', async () => {
      mockReq.body = {};

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      // Destructuring undefined throws TypeError, caught by asyncHandler
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockEuAiActService.generateTransparencyReport).not.toHaveBeenCalled();
    });

    it('should forward AppError from service to next', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-01-01', end: '2024-06-30' } };
      const error = new AppError('No systems found', 404);
      mockEuAiActService.generateTransparencyReport.mockRejectedValue(error);

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error from service to next', async () => {
      mockReq.body = { reportingPeriod: { start: '2024-01-01', end: '2024-06-30' } };
      const error = new Error('Crash');
      mockEuAiActService.generateTransparencyReport.mockRejectedValue(error);

      await controller.generateTransparencyReport(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward unexpected error to next', async () => {
      const error = new Error('Fail');
      mockEuAiActService.getTransparencyReports.mockRejectedValue(error);

      await controller.getTransparencyReports(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError to next', async () => {
      mockReq.params = { id: 'sys-bad' };
      mockReq.body = {};
      const error = new AppError('Not found', 404);
      mockEuAiActService.updateAISystem.mockRejectedValue(error);

      await controller.updateAISystem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError to next', async () => {
      mockReq.params = { id: 'sys-bad' };
      const error = new AppError('Not found', 404);
      mockEuAiActService.deleteAISystem.mockRejectedValue(error);

      await controller.deleteAISystem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward error to next', async () => {
      mockReq.body = {};
      const error = new Error('DB error');
      mockDmaService.registerGatekeeper.mockRejectedValue(error);

      await controller.registerGatekeeper(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward 404 AppError to next', async () => {
      mockReq.params = { id: 'bad-id' };
      const error = new AppError('Gatekeeper not found', 404);
      mockDmaService.getGatekeeper.mockRejectedValue(error);

      await controller.getGatekeeper(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward error to next', async () => {
      mockReq.body = {};
      const error = new Error('error');
      mockDsaService.registerPlatform.mockRejectedValue(error);

      await controller.registerPlatform(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward not found error to next', async () => {
      mockReq.params = { id: 'bad-id' };
      const error = new AppError('Platform not found', 404);
      mockDsaService.getPlatform.mockRejectedValue(error);

      await controller.getPlatform(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward unexpected error to next', async () => {
      mockReq.params = { id: 'plt-1' };
      mockReq.body = {};
      const error = new Error('fail');
      mockDsaService.conductRiskAssessment.mockRejectedValue(error);

      await controller.conductDSARiskAssessment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

    it('should forward AppError to next', async () => {
      mockReq.params = { id: 'bad-id' };
      const error = new AppError('Not found', 404);
      mockDsaService.deletePlatform.mockRejectedValue(error);

      await controller.deletePlatform(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should forward unexpected error to next', async () => {
      mockReq.params = { id: 'plt-1' };
      const error = new Error('error');
      mockDsaService.deletePlatform.mockRejectedValue(error);

      await controller.deletePlatform(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
