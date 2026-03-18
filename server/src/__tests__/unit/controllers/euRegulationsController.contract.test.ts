/**
 * EU Regulations Controller Contract Tests
 *
 * Validates the contract for EU AI Act, DMA, and DSA endpoints.
 * These controllers use asyncHandler and delegate to services.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

const mockEuAiActService = {
  registerAISystem: jest.fn<any>().mockResolvedValue({ id: 'ai-sys-1', name: 'Test AI' } as never),
  getAISystems: jest.fn<any>().mockResolvedValue([{ id: 'ai-sys-1' }] as never),
  getAISystem: jest.fn<any>().mockResolvedValue({ id: 'ai-sys-1' } as never),
  getRiskAssessments: jest.fn<any>().mockResolvedValue([{ id: 'ra-1' }] as never),
  getLatestRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-1' } as never),
  conductRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-new' } as never),
  generateTransparencyReport: jest.fn<any>().mockResolvedValue({ id: 'tr-1' } as never),
  getTransparencyReports: jest.fn<any>().mockResolvedValue([] as never),
  updateAISystem: jest.fn<any>().mockResolvedValue({ id: 'ai-sys-1' } as never),
  deleteAISystem: jest.fn<any>().mockResolvedValue(undefined as never),
};

const mockDmaService = {
  registerGatekeeper: jest.fn<any>().mockResolvedValue({ id: 'gk-1' } as never),
  getGatekeepers: jest.fn<any>().mockResolvedValue([{ id: 'gk-1' }] as never),
  getGatekeeper: jest.fn<any>().mockResolvedValue({ id: 'gk-1' } as never),
  updateObligationCompliance: jest.fn<any>().mockResolvedValue(undefined as never),
  getObligations: jest.fn<any>().mockResolvedValue([] as never),
  getComplianceReports: jest.fn<any>().mockResolvedValue([] as never),
  getLatestComplianceReport: jest.fn<any>().mockResolvedValue({ id: 'cr-1' } as never),
  generateComplianceReport: jest.fn<any>().mockResolvedValue({ id: 'cr-new' } as never),
  updateGatekeeper: jest.fn<any>().mockResolvedValue({ id: 'gk-1' } as never),
  deleteGatekeeper: jest.fn<any>().mockResolvedValue(undefined as never),
};

const mockDsaService = {
  registerPlatform: jest.fn<any>().mockResolvedValue({ id: 'plat-1' } as never),
  getPlatforms: jest.fn<any>().mockResolvedValue([{ id: 'plat-1' }] as never),
  getPlatform: jest.fn<any>().mockResolvedValue({ id: 'plat-1' } as never),
  recordContentModeration: jest.fn<any>().mockResolvedValue({ id: 'mod-1' } as never),
  getContentModerationHistory: jest.fn<any>().mockResolvedValue([] as never),
  reportIllegalContent: jest.fn<any>().mockResolvedValue({ id: 'rpt-1' } as never),
  processIllegalContentReport: jest.fn<any>().mockResolvedValue({ id: 'rpt-1' } as never),
  addAdToRepository: jest.fn<any>().mockResolvedValue({ id: 'ad-1' } as never),
  getAdsFromRepository: jest.fn<any>().mockResolvedValue([] as never),
  generateTransparencyReport: jest.fn<any>().mockResolvedValue({ id: 'tr-1' } as never),
  getTransparencyReports: jest.fn<any>().mockResolvedValue([] as never),
  conductRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-1' } as never),
  getRiskAssessments: jest.fn<any>().mockResolvedValue([] as never),
  getLatestRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-1' } as never),
  updateRiskAssessment: jest.fn<any>().mockResolvedValue({ id: 'ra-1' } as never),
  configureNonPersonalizedFeed: jest.fn<any>().mockResolvedValue({ id: 'feed-1' } as never),
  getNonPersonalizedFeed: jest.fn<any>().mockResolvedValue({ id: 'feed-1' } as never),
  updateNonPersonalizedFeedStatus: jest.fn<any>().mockResolvedValue({ id: 'feed-1' } as never),
  updatePlatform: jest.fn<any>().mockResolvedValue({ id: 'plat-1' } as never),
  deletePlatform: jest.fn<any>().mockResolvedValue(undefined as never),
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
  __esModule: true,
  asyncHandler: (fn: any) => fn,
}));

import euRegulationsController from '../../../controllers/euRegulationsController';

describe('EURegulationsController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations cleared by resetMocks: true in jest config
    mockEuAiActService.registerAISystem.mockResolvedValue({ id: 'ai-sys-1', name: 'Test AI' } as never);
    mockEuAiActService.getAISystems.mockResolvedValue([{ id: 'ai-sys-1' }] as never);
    mockEuAiActService.getAISystem.mockResolvedValue({ id: 'ai-sys-1' } as never);
    mockEuAiActService.getRiskAssessments.mockResolvedValue([{ id: 'ra-1' }] as never);
    mockEuAiActService.getLatestRiskAssessment.mockResolvedValue({ id: 'ra-1' } as never);
    mockEuAiActService.conductRiskAssessment.mockResolvedValue({ id: 'ra-new' } as never);
    mockEuAiActService.generateTransparencyReport.mockResolvedValue({ id: 'tr-1' } as never);
    mockEuAiActService.getTransparencyReports.mockResolvedValue([] as never);
    mockEuAiActService.updateAISystem.mockResolvedValue({ id: 'ai-sys-1' } as never);
    mockEuAiActService.deleteAISystem.mockResolvedValue(undefined as never);

    mockDmaService.registerGatekeeper.mockResolvedValue({ id: 'gk-1' } as never);
    mockDmaService.getGatekeepers.mockResolvedValue([{ id: 'gk-1' }] as never);
    mockDmaService.getGatekeeper.mockResolvedValue({ id: 'gk-1' } as never);
    mockDmaService.updateObligationCompliance.mockResolvedValue(undefined as never);
    mockDmaService.getObligations.mockResolvedValue([] as never);
    mockDmaService.getComplianceReports.mockResolvedValue([] as never);
    mockDmaService.getLatestComplianceReport.mockResolvedValue({ id: 'cr-1' } as never);
    mockDmaService.generateComplianceReport.mockResolvedValue({ id: 'cr-new' } as never);
    mockDmaService.updateGatekeeper.mockResolvedValue({ id: 'gk-1' } as never);
    mockDmaService.deleteGatekeeper.mockResolvedValue(undefined as never);

    mockDsaService.registerPlatform.mockResolvedValue({ id: 'plat-1' } as never);
    mockDsaService.getPlatforms.mockResolvedValue([{ id: 'plat-1' }] as never);
    mockDsaService.getPlatform.mockResolvedValue({ id: 'plat-1' } as never);
    mockDsaService.recordContentModeration.mockResolvedValue({ id: 'mod-1' } as never);
    mockDsaService.getContentModerationHistory.mockResolvedValue([] as never);
    mockDsaService.reportIllegalContent.mockResolvedValue({ id: 'rpt-1' } as never);
    mockDsaService.processIllegalContentReport.mockResolvedValue({ id: 'rpt-1' } as never);
    mockDsaService.addAdToRepository.mockResolvedValue({ id: 'ad-1' } as never);
    mockDsaService.getAdsFromRepository.mockResolvedValue([] as never);
    mockDsaService.generateTransparencyReport.mockResolvedValue({ id: 'tr-1' } as never);
    mockDsaService.getTransparencyReports.mockResolvedValue([] as never);
    mockDsaService.conductRiskAssessment.mockResolvedValue({ id: 'ra-1' } as never);
    mockDsaService.getRiskAssessments.mockResolvedValue([] as never);
    mockDsaService.getLatestRiskAssessment.mockResolvedValue({ id: 'ra-1' } as never);
    mockDsaService.updateRiskAssessment.mockResolvedValue({ id: 'ra-1' } as never);
    mockDsaService.configureNonPersonalizedFeed.mockResolvedValue({ id: 'feed-1' } as never);
    mockDsaService.getNonPersonalizedFeed.mockResolvedValue({ id: 'feed-1' } as never);
    mockDsaService.updateNonPersonalizedFeedStatus.mockResolvedValue({ id: 'feed-1' } as never);
    mockDsaService.updatePlatform.mockResolvedValue({ id: 'plat-1' } as never);
    mockDsaService.deletePlatform.mockResolvedValue(undefined as never);

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      headers: {},
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
      send: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // EU AI Act
  // ===========================================================================
  describe('EU AI Act', () => {
    it('registerAISystem should return 201 with system', async () => {
      mockReq.body = { name: 'Test AI', riskCategory: 'High' };

      await euRegulationsController.registerAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ system: expect.objectContaining({ id: 'ai-sys-1' }) })
      );
      expect(mockEuAiActService.registerAISystem).toHaveBeenCalledWith('org-123', 'user-123', mockReq.body);
    });

    it('getAISystems should return systems array', async () => {
      await euRegulationsController.getAISystems(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ systems: expect.any(Array) })
      );
      expect(mockEuAiActService.getAISystems).toHaveBeenCalledWith('org-123');
    });

    it('getAISystem should pass org and id', async () => {
      mockReq.params = { id: 'ai-sys-1' };

      await euRegulationsController.getAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockEuAiActService.getAISystem).toHaveBeenCalledWith('org-123', 'ai-sys-1');
    });

    it('conductRiskAssessment should return 201', async () => {
      mockReq.params = { id: 'ai-sys-1' };
      mockReq.body = { riskFactors: [] };

      await euRegulationsController.conductRiskAssessment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('deleteAISystem should return 204', async () => {
      mockReq.params = { id: 'ai-sys-1' };

      await euRegulationsController.deleteAISystem(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockEuAiActService.deleteAISystem).toHaveBeenCalledWith('org-123', 'ai-sys-1');
    });
  });

  // ===========================================================================
  // DMA
  // ===========================================================================
  describe('DMA', () => {
    it('registerGatekeeper should return 201', async () => {
      mockReq.body = { name: 'Test Gatekeeper' };

      await euRegulationsController.registerGatekeeper(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ gatekeeper: expect.any(Object) })
      );
    });

    it('getGatekeepers should return array', async () => {
      await euRegulationsController.getGatekeepers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ gatekeepers: expect.any(Array) })
      );
    });

    it('updateObligationCompliance should pass org, id, type', async () => {
      mockReq.params = { id: 'gk-1', obligationType: 'interoperability' };
      mockReq.body = { status: 'compliant' };

      await euRegulationsController.updateObligationCompliance(mockReq as Request, mockRes as Response, mockNext);

      expect(mockDmaService.updateObligationCompliance).toHaveBeenCalledWith(
        'org-123', 'gk-1', 'interoperability', mockReq.body
      );
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('deleteGatekeeper should return 204', async () => {
      mockReq.params = { id: 'gk-1' };

      await euRegulationsController.deleteGatekeeper(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  // ===========================================================================
  // DSA
  // ===========================================================================
  describe('DSA', () => {
    it('registerPlatform should return 201', async () => {
      mockReq.body = { name: 'Test Platform' };

      await euRegulationsController.registerPlatform(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ platform: expect.any(Object) })
      );
    });

    it('recordContentModeration should return 201', async () => {
      mockReq.params = { id: 'plat-1' };
      mockReq.body = { action: 'removed', reason: 'hate speech' };

      await euRegulationsController.recordContentModeration(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('reportIllegalContent should return 201', async () => {
      mockReq.params = { id: 'plat-1' };
      mockReq.body = { contentUrl: 'https://example.com/content' };

      await euRegulationsController.reportIllegalContent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('getPlatforms should return platforms array', async () => {
      await euRegulationsController.getPlatforms(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ platforms: expect.any(Array) })
      );
    });

    it('deletePlatform should return 204', async () => {
      mockReq.params = { id: 'plat-1' };

      await euRegulationsController.deletePlatform(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('conductDSARiskAssessment should return 201', async () => {
      mockReq.params = { id: 'plat-1' };
      mockReq.body = { assessmentData: {} };

      await euRegulationsController.conductDSARiskAssessment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockDsaService.conductRiskAssessment).toHaveBeenCalledWith(
        'org-123', 'plat-1', 'user-123', mockReq.body
      );
    });

    it('configureNonPersonalizedFeed should return 201', async () => {
      mockReq.params = { id: 'plat-1' };
      mockReq.body = { enabled: true };

      await euRegulationsController.configureNonPersonalizedFeed(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
