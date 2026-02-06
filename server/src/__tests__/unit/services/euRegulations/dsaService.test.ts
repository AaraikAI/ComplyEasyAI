/**
 * DSA (Digital Services Act) Service Unit Tests
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

// ---------- Add DSA-specific Prisma models ----------
const dSAPlatform = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
  delete: jest.fn() as jest.Mock<any>,
};
const dSAContentModeration = {
  create: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
};
const dSAIllegalContentReport = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
};
const dSAAdRepository = {
  create: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
};
const dSATransparencyReport = {
  create: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
};
const dSARiskAssessment = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
};
const dSANonPersonalizedFeed = {
  upsert: jest.fn() as jest.Mock<any>,
  findUnique: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
};

(prismaMock as any).dSAPlatform = dSAPlatform;
(prismaMock as any).dSAContentModeration = dSAContentModeration;
(prismaMock as any).dSAIllegalContentReport = dSAIllegalContentReport;
(prismaMock as any).dSAAdRepository = dSAAdRepository;
(prismaMock as any).dSATransparencyReport = dSATransparencyReport;
(prismaMock as any).dSARiskAssessment = dSARiskAssessment;
(prismaMock as any).dSANonPersonalizedFeed = dSANonPersonalizedFeed;

// ---------- Import after mocks ----------
import dsaService from '../../../../services/euRegulations/dsaService';

describe('DSAService', () => {
  const orgId = 'org-123';
  const platformId = 'plat-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------
  // checkVLOPStatus
  // -------------------------------------------------------------------
  describe('checkVLOPStatus()', () => {
    it('should return VLOP/VLOSE true when above 45M threshold', async () => {
      const result = await dsaService.checkVLOPStatus(50_000_000);
      expect(result.isVLOP).toBe(true);
      expect(result.isVLOSE).toBe(true);
      expect(result.reason).toContain('exceeding');
    });

    it('should return false when below threshold', async () => {
      const result = await dsaService.checkVLOPStatus(10_000_000);
      expect(result.isVLOP).toBe(false);
      expect(result.isVLOSE).toBe(false);
      expect(result.reason).toContain('below');
    });

    it('should return false when users is undefined', async () => {
      const result = await dsaService.checkVLOPStatus(undefined);
      expect(result.isVLOP).toBe(false);
    });

    it('should return false when users is exactly 45M (boundary)', async () => {
      const result = await dsaService.checkVLOPStatus(45_000_000);
      expect(result.isVLOP).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // registerPlatform
  // -------------------------------------------------------------------
  describe('registerPlatform()', () => {
    it('should register a VLOP platform when type is very_large_online_platform', async () => {
      dSAPlatform.create.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        platformName: 'BigPlatform',
        platformType: 'very_large_online_platform',
        monthlyActiveUsers: 100_000_000,
        isVLOP: true,
        isVLOSE: false,
        designationDate: new Date(),
        complianceStatus: 'in_review',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.registerPlatform(orgId, {
        platformName: 'BigPlatform',
        platformType: 'very_large_online_platform',
        monthlyActiveUsers: 100_000_000,
      });

      expect(result.isVLOP).toBe(true);
      expect(result.platformType).toBe('very_large_online_platform');
    });

    it('should register a normal platform with low users', async () => {
      dSAPlatform.create.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        platformName: 'SmallPlatform',
        platformType: 'online_platform',
        monthlyActiveUsers: 1_000,
        isVLOP: false,
        isVLOSE: false,
        complianceStatus: 'in_review',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.registerPlatform(orgId, {
        platformName: 'SmallPlatform',
        platformType: 'online_platform',
        monthlyActiveUsers: 1_000,
      });

      expect(result.isVLOP).toBe(false);
      expect(result.isVLOSE).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // recordContentModeration
  // -------------------------------------------------------------------
  describe('recordContentModeration()', () => {
    it('should throw 404 when platform is not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);

      await expect(
        dsaService.recordContentModeration(orgId, 'plat-missing', {
          actionType: 'removal',
          contentType: 'text',
          reason: 'hate speech',
          automatedDecision: false,
        }),
      ).rejects.toThrow('Platform not found');
    });

    it('should create moderation record with appealAvailable true', async () => {
      dSAPlatform.findFirst.mockResolvedValue({ id: platformId, organizationId: orgId });
      dSAContentModeration.create.mockResolvedValue({
        id: 'mod-1',
        platformId,
        organizationId: orgId,
        actionType: 'removal',
        contentType: 'text',
        reason: 'hate speech',
        automatedDecision: false,
        appealAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.recordContentModeration(orgId, platformId, {
        actionType: 'removal',
        contentType: 'text',
        reason: 'hate speech',
        automatedDecision: false,
      });

      expect(result.appealAvailable).toBe(true);
      expect(result.actionType).toBe('removal');
    });
  });

  // -------------------------------------------------------------------
  // getContentModerationHistory
  // -------------------------------------------------------------------
  describe('getContentModerationHistory()', () => {
    it('should throw 404 if platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.getContentModerationHistory(orgId, 'plat-missing'),
      ).rejects.toThrow('Platform not found');
    });

    it('should return moderation records', async () => {
      dSAPlatform.findFirst.mockResolvedValue({ id: platformId, organizationId: orgId });
      dSAContentModeration.findMany.mockResolvedValue([
        {
          id: 'mod-1',
          platformId,
          organizationId: orgId,
          actionType: 'removal',
          contentType: 'text',
          reason: 'spam',
          automatedDecision: true,
          appealAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await dsaService.getContentModerationHistory(orgId, platformId);
      expect(result).toHaveLength(1);
      expect(result[0].actionType).toBe('removal');
    });
  });

  // -------------------------------------------------------------------
  // reportIllegalContent
  // -------------------------------------------------------------------
  describe('reportIllegalContent()', () => {
    it('should throw 404 if platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.reportIllegalContent(orgId, 'plat-missing', {
          reportedBy: 'user-1',
          isTrustedFlagger: false,
          contentType: 'image',
          reason: 'illegal content',
        }),
      ).rejects.toThrow('Platform not found');
    });

    it('should create illegal content report with pending status', async () => {
      dSAPlatform.findFirst.mockResolvedValue({ id: platformId, organizationId: orgId });
      dSAIllegalContentReport.create.mockResolvedValue({
        id: 'report-1',
        platformId,
        organizationId: orgId,
        reportedBy: 'user-1',
        isTrustedFlagger: true,
        contentType: 'image',
        reason: 'illegal content',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.reportIllegalContent(orgId, platformId, {
        reportedBy: 'user-1',
        isTrustedFlagger: true,
        contentType: 'image',
        reason: 'illegal content',
      });

      expect(result.status).toBe('pending');
      expect(result.isTrustedFlagger).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // processIllegalContentReport
  // -------------------------------------------------------------------
  describe('processIllegalContentReport()', () => {
    it('should throw 404 when report is not found', async () => {
      dSAIllegalContentReport.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.processIllegalContentReport(orgId, 'report-999', {
          status: 'action_taken',
        }),
      ).rejects.toThrow('Report not found');
    });

    it('should update the report status', async () => {
      dSAIllegalContentReport.findFirst.mockResolvedValue({
        id: 'report-1',
        organizationId: orgId,
      });
      dSAIllegalContentReport.update.mockResolvedValue({
        id: 'report-1',
        platformId,
        organizationId: orgId,
        reportedBy: 'user-1',
        isTrustedFlagger: false,
        contentType: 'text',
        reason: 'spam',
        status: 'action_taken',
        actionTaken: 'Content removed',
        responseTime: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.processIllegalContentReport(orgId, 'report-1', {
        status: 'action_taken',
        actionTaken: 'Content removed',
        responseTime: 12,
      });

      expect(result.status).toBe('action_taken');
      expect(result.actionTaken).toBe('Content removed');
    });
  });

  // -------------------------------------------------------------------
  // addAdToRepository
  // -------------------------------------------------------------------
  describe('addAdToRepository()', () => {
    it('should throw 404 when platform is not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.addAdToRepository(orgId, 'plat-missing', {
          adId: 'ad-1',
          advertiserName: 'Corp',
          adContent: { text: 'ad text' },
          displayPeriod: { start: new Date(), end: new Date() },
          isPoliticalAd: false,
          isTargetedToMinors: false,
        }),
      ).rejects.toThrow('Platform not found');
    });

    it('should throw 400 when platform is not VLOP', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: false,
      });

      await expect(
        dsaService.addAdToRepository(orgId, platformId, {
          adId: 'ad-1',
          advertiserName: 'Corp',
          adContent: { text: 'ad text' },
          displayPeriod: { start: new Date(), end: new Date() },
          isPoliticalAd: false,
          isTargetedToMinors: false,
        }),
      ).rejects.toThrow('Ad repositories are only required for Very Large Online Platforms');
    });

    it('should throw 400 when ad targets minors with targeting criteria', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: true,
      });

      await expect(
        dsaService.addAdToRepository(orgId, platformId, {
          adId: 'ad-1',
          advertiserName: 'Corp',
          adContent: { text: 'ad text' },
          targetingCriteria: { demographics: ['teens'] },
          displayPeriod: { start: new Date(), end: new Date() },
          isPoliticalAd: false,
          isTargetedToMinors: true,
        }),
      ).rejects.toThrow('Targeted advertising to minors is prohibited');
    });

    it('should create ad entry with isTargetedToMinors always false', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: true,
      });
      dSAAdRepository.create.mockResolvedValue({
        id: 'ad-entry-1',
        platformId,
        organizationId: orgId,
        adId: 'ad-1',
        advertiserName: 'Corp',
        adContent: { text: 'ad text' },
        displayPeriod: { start: new Date(), end: new Date() },
        isPoliticalAd: true,
        isTargetedToMinors: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.addAdToRepository(orgId, platformId, {
        adId: 'ad-1',
        advertiserName: 'Corp',
        adContent: { text: 'ad text' },
        displayPeriod: { start: new Date(), end: new Date() },
        isPoliticalAd: true,
        isTargetedToMinors: false,
      });

      expect(result.isTargetedToMinors).toBe(false);
      expect(result.isPoliticalAd).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // getAdsFromRepository
  // -------------------------------------------------------------------
  describe('getAdsFromRepository()', () => {
    it('should throw 404 when platform is not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(dsaService.getAdsFromRepository(orgId, 'plat-missing')).rejects.toThrow(
        'Platform not found',
      );
    });

    it('should return ads', async () => {
      dSAPlatform.findFirst.mockResolvedValue({ id: platformId, organizationId: orgId });
      dSAAdRepository.findMany.mockResolvedValue([]);
      const result = await dsaService.getAdsFromRepository(orgId, platformId);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // generateTransparencyReport
  // -------------------------------------------------------------------
  describe('generateTransparencyReport()', () => {
    it('should throw 404 when platform is not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.generateTransparencyReport(orgId, 'plat-missing', {
          start: new Date(),
          end: new Date(),
        }),
      ).rejects.toThrow('Platform not found');
    });

    it('should throw 400 when platform is not VLOP/VLOSE', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: false,
        isVLOSE: false,
        contentModeration: [],
        illegalContentReports: [],
      });

      await expect(
        dsaService.generateTransparencyReport(orgId, platformId, {
          start: new Date(),
          end: new Date(),
        }),
      ).rejects.toThrow('Transparency reports are only required for VLOPs and VLOSE');
    });

    it('should generate report for VLOP platform', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: true,
        isVLOSE: false,
        contentModeration: [
          { actionType: 'removal', automatedDecision: true, appealStatus: null },
          { actionType: 'suspension', automatedDecision: false, appealStatus: 'approved' },
        ],
        illegalContentReports: [
          { isTrustedFlagger: true, status: 'action_taken', responseTime: 6 },
          { isTrustedFlagger: false, status: 'pending', responseTime: null },
        ],
      });

      dSATransparencyReport.create.mockResolvedValue({
        id: 'tr-1',
        platformId,
        organizationId: orgId,
        reportingPeriodStart: new Date('2025-01-01'),
        reportingPeriodEnd: new Date('2025-12-31'),
        contentModerationStats: {
          totalRemovals: 1,
          totalSuspensions: 1,
          totalRestrictions: 0,
          automatedRemovals: 1,
          manualRemovals: 0,
          appealsReceived: 1,
          appealsApproved: 1,
          appealsRejected: 0,
        },
        userReports: {
          totalReports: 2,
          reportsFromTrustedFlaggers: 1,
          reportsActioned: 1,
          averageResponseTime: 6,
        },
        trustedFlaggerReports: { totalReports: 1, actionedReports: 1, averageResponseTime: 6 },
        automatedDetection: { contentScanned: 0, contentFlagged: 1, falsePositiveRate: 0 },
        appealsProcessed: { totalAppeals: 1, approved: 1, rejected: 0, averageProcessingTime: 0 },
        submittedToCommission: false,
        createdAt: new Date(),
      });

      const result = await dsaService.generateTransparencyReport(orgId, platformId, {
        start: new Date('2025-01-01'),
        end: new Date('2025-12-31'),
      });

      expect(result.id).toBe('tr-1');
      expect(result.submittedToCommission).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // getPlatform / getPlatforms
  // -------------------------------------------------------------------
  describe('getPlatform()', () => {
    it('should throw 404 when platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(dsaService.getPlatform(orgId, 'plat-missing')).rejects.toThrow(
        'Platform not found',
      );
    });

    it('should return mapped platform', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        platformName: 'TestPlatform',
        platformType: 'online_platform',
        isVLOP: false,
        isVLOSE: false,
        complianceStatus: 'in_review',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.getPlatform(orgId, platformId);
      expect(result.platformName).toBe('TestPlatform');
    });
  });

  describe('getPlatforms()', () => {
    it('should return all platforms for organization', async () => {
      dSAPlatform.findMany.mockResolvedValue([]);
      const result = await dsaService.getPlatforms(orgId);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // updatePlatform
  // -------------------------------------------------------------------
  describe('updatePlatform()', () => {
    it('should throw 404 when platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.updatePlatform(orgId, 'plat-missing', { platformName: 'New' }),
      ).rejects.toThrow('Platform not found');
    });

    it('should update platform', async () => {
      dSAPlatform.findFirst.mockResolvedValue({ id: platformId, organizationId: orgId });
      dSAPlatform.update.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        platformName: 'Updated',
        platformType: 'online_platform',
        isVLOP: false,
        isVLOSE: false,
        complianceStatus: 'compliant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.updatePlatform(orgId, platformId, {
        complianceStatus: 'compliant',
      });
      expect(result.complianceStatus).toBe('compliant');
    });
  });

  // -------------------------------------------------------------------
  // deletePlatform
  // -------------------------------------------------------------------
  describe('deletePlatform()', () => {
    it('should throw 404 when platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(dsaService.deletePlatform(orgId, 'plat-missing')).rejects.toThrow(
        'Platform not found',
      );
    });

    it('should delete the platform', async () => {
      dSAPlatform.findFirst.mockResolvedValue({ id: platformId, organizationId: orgId });
      dSAPlatform.delete.mockResolvedValue({});

      await dsaService.deletePlatform(orgId, platformId);
      expect(dSAPlatform.delete).toHaveBeenCalledWith({ where: { id: platformId } });
    });
  });

  // -------------------------------------------------------------------
  // conductRiskAssessment
  // -------------------------------------------------------------------
  describe('conductRiskAssessment()', () => {
    it('should throw 404 when platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.conductRiskAssessment(orgId, 'plat-missing', 'user-1', {
          riskCategory: 'illegal_content',
          mitigationMeasures: [],
        }),
      ).rejects.toThrow('Platform not found');
    });

    it('should throw 400 when platform is not VLOP/VLOSE', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: false,
        isVLOSE: false,
      });

      await expect(
        dsaService.conductRiskAssessment(orgId, platformId, 'user-1', {
          riskCategory: 'illegal_content',
          mitigationMeasures: [],
        }),
      ).rejects.toThrow('Risk assessments are only required');
    });

    it('should create risk assessment for VLOP platform', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: true,
        isVLOSE: false,
      });

      dSARiskAssessment.create.mockResolvedValue({
        id: 'ra-1',
        platformId,
        organizationId: orgId,
        assessedBy: 'user-1',
        riskCategory: 'illegal_content',
        systemicRisks: {},
        overallRiskLevel: 'high',
        mitigationMeasures: [],
        status: 'draft',
        assessmentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.conductRiskAssessment(orgId, platformId, 'user-1', {
        riskCategory: 'illegal_content',
        illegalContentRisks: {
          risks: ['hate speech'],
          severity: 'high',
          description: 'Prevalence of hate speech',
        },
        mitigationMeasures: [
          { measure: 'AI filter', status: 'planned' as const },
        ],
      });

      expect(result.id).toBe('ra-1');
      expect(dSARiskAssessment.create).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------
  // configureNonPersonalizedFeed
  // -------------------------------------------------------------------
  describe('configureNonPersonalizedFeed()', () => {
    it('should throw 404 when platform not found', async () => {
      dSAPlatform.findFirst.mockResolvedValue(null);
      await expect(
        dsaService.configureNonPersonalizedFeed(orgId, 'plat-missing', {
          isEnabled: true,
          userOptInMethod: 'toggle',
          feedAlgorithmType: 'chronological',
        }),
      ).rejects.toThrow('Platform not found');
    });

    it('should throw 400 when platform is not VLOP', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: false,
      });

      await expect(
        dsaService.configureNonPersonalizedFeed(orgId, platformId, {
          isEnabled: true,
          userOptInMethod: 'toggle',
          feedAlgorithmType: 'chronological',
        }),
      ).rejects.toThrow('Non-personalized feed option is only required for Very Large Online Platforms');
    });

    it('should upsert non-personalized feed configuration', async () => {
      dSAPlatform.findFirst.mockResolvedValue({
        id: platformId,
        organizationId: orgId,
        isVLOP: true,
      });
      dSANonPersonalizedFeed.upsert.mockResolvedValue({
        id: 'feed-1',
        platformId,
        organizationId: orgId,
        isEnabled: true,
        userOptInMethod: 'toggle',
        feedAlgorithmType: 'chronological',
        complianceStatus: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.configureNonPersonalizedFeed(orgId, platformId, {
        isEnabled: true,
        userOptInMethod: 'toggle',
        feedAlgorithmType: 'chronological',
      });

      expect(result.isEnabled).toBe(true);
      expect(dSANonPersonalizedFeed.upsert).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------
  // getNonPersonalizedFeed
  // -------------------------------------------------------------------
  describe('getNonPersonalizedFeed()', () => {
    it('should return null when not found', async () => {
      dSANonPersonalizedFeed.findUnique.mockResolvedValue(null);
      const result = await dsaService.getNonPersonalizedFeed(orgId, platformId);
      expect(result).toBeNull();
    });

    it('should return null when organization does not match', async () => {
      dSANonPersonalizedFeed.findUnique.mockResolvedValue({
        organizationId: 'other-org',
        platformId,
      });
      const result = await dsaService.getNonPersonalizedFeed(orgId, platformId);
      expect(result).toBeNull();
    });

    it('should return feed config when found', async () => {
      dSANonPersonalizedFeed.findUnique.mockResolvedValue({
        id: 'feed-1',
        platformId,
        organizationId: orgId,
        isEnabled: true,
        userOptInMethod: 'settings_page',
        feedAlgorithmType: 'popularity',
        complianceStatus: 'implemented',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.getNonPersonalizedFeed(orgId, platformId);
      expect(result).not.toBeNull();
      expect(result.isEnabled).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // updateNonPersonalizedFeedStatus
  // -------------------------------------------------------------------
  describe('updateNonPersonalizedFeedStatus()', () => {
    it('should throw 404 when feed config not found', async () => {
      dSANonPersonalizedFeed.findUnique.mockResolvedValue(null);
      await expect(
        dsaService.updateNonPersonalizedFeedStatus(orgId, platformId, {
          complianceStatus: 'compliant',
        }),
      ).rejects.toThrow('Non-personalized feed configuration not found');
    });

    it('should update feed status', async () => {
      dSANonPersonalizedFeed.findUnique.mockResolvedValue({
        id: 'feed-1',
        platformId,
        organizationId: orgId,
      });
      dSANonPersonalizedFeed.update.mockResolvedValue({
        id: 'feed-1',
        platformId,
        organizationId: orgId,
        complianceStatus: 'compliant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dsaService.updateNonPersonalizedFeedStatus(orgId, platformId, {
        complianceStatus: 'compliant',
      });

      expect(result.complianceStatus).toBe('compliant');
    });
  });
});
