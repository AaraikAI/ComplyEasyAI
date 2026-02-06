/**
 * DMA (Digital Markets Act) Service Unit Tests
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

// ---------- Import after mocks ----------
import dmaService from '../../../../services/euRegulations/dmaService';

// Extend prismaMock with DMA-specific models
const dMAGatekeeper = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
  delete: jest.fn() as jest.Mock<any>,
};
const dMAObligationTracking = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
};
const dMAComplianceReport = {
  create: jest.fn() as jest.Mock<any>,
  findFirst: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
};

(prismaMock as any).dMAGatekeeper = dMAGatekeeper;
(prismaMock as any).dMAObligationTracking = dMAObligationTracking;
(prismaMock as any).dMAComplianceReport = dMAComplianceReport;

describe('DMAService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------
  // checkGatekeeperStatus
  // -------------------------------------------------------------------
  describe('checkGatekeeperStatus()', () => {
    it('should designate as gatekeeper when all three criteria are met', async () => {
      const result = await dmaService.checkGatekeeperStatus(orgId, {
        annualRevenue: 80_000_000_000,
        marketCapitalization: 800_000_000_000,
        monthlyActiveUsers: 50_000_000,
        corePlatformServices: ['online_search_engines'],
      });

      expect(result.isGatekeeper).toBe(true);
      expect(result.reasons).toContain('Organization qualifies as gatekeeper under DMA');
    });

    it('should not designate when revenue is below threshold and no market cap', async () => {
      const result = await dmaService.checkGatekeeperStatus(orgId, {
        annualRevenue: 1_000_000_000,
        monthlyActiveUsers: 50_000_000,
        corePlatformServices: ['online_search_engines'],
      });

      expect(result.isGatekeeper).toBe(false);
    });

    it('should not designate when there are no core platform services', async () => {
      const result = await dmaService.checkGatekeeperStatus(orgId, {
        annualRevenue: 80_000_000_000,
        monthlyActiveUsers: 50_000_000,
        corePlatformServices: [],
      });

      expect(result.isGatekeeper).toBe(false);
    });

    it('should not designate when monthly active users are below threshold', async () => {
      const result = await dmaService.checkGatekeeperStatus(orgId, {
        annualRevenue: 80_000_000_000,
        monthlyActiveUsers: 10_000_000,
        corePlatformServices: ['online_search_engines'],
      });

      expect(result.isGatekeeper).toBe(false);
    });

    it('should use market capitalization instead of revenue', async () => {
      const result = await dmaService.checkGatekeeperStatus(orgId, {
        marketCapitalization: 800_000_000_000,
        monthlyActiveUsers: 50_000_000,
        corePlatformServices: ['advertising_services'],
      });

      expect(result.isGatekeeper).toBe(true);
    });

    it('should include correct reasons when all criteria met', async () => {
      const result = await dmaService.checkGatekeeperStatus(orgId, {
        annualRevenue: 80_000_000_000,
        monthlyActiveUsers: 50_000_000,
        corePlatformServices: ['online_search_engines', 'advertising_services'],
      });

      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('revenue/market cap threshold'),
          expect.stringContaining('2 core platform service(s)'),
          expect.stringContaining('45M+ monthly active users'),
          expect.stringContaining('qualifies as gatekeeper'),
        ]),
      );
    });
  });

  // -------------------------------------------------------------------
  // registerGatekeeper
  // -------------------------------------------------------------------
  describe('registerGatekeeper()', () => {
    const gatekeeperData = {
      platformName: 'MegaPlatform',
      corePlatformServices: ['online_search_engines' as const, 'advertising_services' as const],
      annualRevenue: 80_000_000_000,
      monthlyActiveUsers: 50_000_000,
    };

    const mockCreatedGatekeeper = {
      id: 'gk-1',
      organizationId: orgId,
      platformName: 'MegaPlatform',
      corePlatformServices: ['online_search_engines', 'advertising_services'],
      designationStatus: 'designated',
      designationDate: new Date(),
      annualRevenue: 80_000_000_000,
      marketCapitalization: null,
      monthlyActiveUsers: 50_000_000,
      obligations: [
        'data_portability',
        'interoperability',
        'fair_access',
        'transparency_ranking',
        'transparency_advertising',
        'prohibition_self_preferencing',
        'transparency_measurement',
        'prohibition_most_favored_nation',
        'prohibition_bundling',
        'prohibition_tying',
        'prohibition_restrictive_contracts',
      ],
      complianceStatus: 'in_review',
      lastReviewDate: null,
      nextReviewDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a gatekeeper and obligation tracking records for qualifying org', async () => {
      dMAGatekeeper.create.mockResolvedValue(mockCreatedGatekeeper);
      dMAObligationTracking.create.mockResolvedValue({});

      const result = await dmaService.registerGatekeeper(orgId, gatekeeperData);

      expect(dMAGatekeeper.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('gk-1');
      expect(result.platformName).toBe('MegaPlatform');
      expect(result.designationStatus).toBe('designated');

      // Obligation tracking records should be created for each obligation
      expect(dMAObligationTracking.create).toHaveBeenCalled();
    });

    it('should set status to under_review for non-qualifying org', async () => {
      const nonQualifyingData = {
        platformName: 'SmallPlatform',
        corePlatformServices: ['online_search_engines' as const],
        annualRevenue: 1_000_000,
        monthlyActiveUsers: 100,
      };

      dMAGatekeeper.create.mockResolvedValue({
        ...mockCreatedGatekeeper,
        designationStatus: 'under_review',
        designationDate: null,
      });

      const result = await dmaService.registerGatekeeper(orgId, nonQualifyingData);

      expect(result.designationStatus).toBe('under_review');
      // Non-gatekeeper should not have obligation tracking records
      expect(dMAObligationTracking.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // getObligationDescription
  // -------------------------------------------------------------------
  describe('getObligationDescription()', () => {
    it('should return description for known obligations', () => {
      expect(dmaService.getObligationDescription('data_portability')).toContain('port their data');
      expect(dmaService.getObligationDescription('interoperability')).toContain('interoperability');
      expect(dmaService.getObligationDescription('fair_access')).toContain('fair, reasonable');
    });

    it('should return fallback for unknown obligation strings', () => {
      expect(dmaService.getObligationDescription('nonexistent' as any)).toBe('DMA obligation');
    });
  });

  // -------------------------------------------------------------------
  // updateObligationCompliance
  // -------------------------------------------------------------------
  describe('updateObligationCompliance()', () => {
    it('should throw 404 when gatekeeper is not found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue(null);

      await expect(
        dmaService.updateObligationCompliance(orgId, 'gk-999', 'data_portability', {
          status: 'compliant',
        }),
      ).rejects.toThrow('Gatekeeper not found');
    });

    it('should update existing tracking record', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({ id: 'gk-1', organizationId: orgId });
      dMAObligationTracking.findFirst.mockResolvedValue({
        id: 'track-1',
        obligationType: 'data_portability',
      });
      dMAObligationTracking.update.mockResolvedValue({});

      await dmaService.updateObligationCompliance(orgId, 'gk-1', 'data_portability', {
        status: 'compliant',
        evidence: { docs: ['doc1.pdf'] },
      });

      expect(dMAObligationTracking.update).toHaveBeenCalledWith({
        where: { id: 'track-1' },
        data: expect.objectContaining({ complianceStatus: 'compliant' }),
      });
    });

    it('should create new tracking record when none exists', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({ id: 'gk-1', organizationId: orgId });
      dMAObligationTracking.findFirst.mockResolvedValue(null);
      dMAObligationTracking.create.mockResolvedValue({});

      await dmaService.updateObligationCompliance(orgId, 'gk-1', 'fair_access', {
        status: 'in_progress',
      });

      expect(dMAObligationTracking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gatekeeperId: 'gk-1',
          organizationId: orgId,
          obligationType: 'fair_access',
          complianceStatus: 'in_progress',
        }),
      });
    });
  });

  // -------------------------------------------------------------------
  // generateComplianceReport
  // -------------------------------------------------------------------
  describe('generateComplianceReport()', () => {
    it('should throw 404 when gatekeeper is not found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue(null);

      await expect(
        dmaService.generateComplianceReport(orgId, 'gk-999', {
          start: new Date(),
          end: new Date(),
        }),
      ).rejects.toThrow('Gatekeeper not found');
    });

    it('should generate compliance report for valid gatekeeper', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({
        id: 'gk-1',
        organizationId: orgId,
        obligations: ['data_portability', 'interoperability'],
        obligationsTracking: [
          { obligationType: 'data_portability', complianceStatus: 'compliant', evidence: [] },
        ],
      });

      const mockReport = {
        id: 'report-1',
        gatekeeperId: 'gk-1',
        organizationId: orgId,
        reportingPeriod: { start: new Date(), end: new Date() },
        obligationsStatus: {},
        violations: [],
        remediation: [],
        submittedToCommission: false,
        submittedAt: null,
      };

      dMAComplianceReport.create.mockResolvedValue(mockReport);

      const result = await dmaService.generateComplianceReport(orgId, 'gk-1', {
        start: new Date('2025-01-01'),
        end: new Date('2025-12-31'),
      });

      expect(result.id).toBe('report-1');
      expect(result.submittedToCommission).toBe(false);
      expect(dMAComplianceReport.create).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------
  // getGatekeeper
  // -------------------------------------------------------------------
  describe('getGatekeeper()', () => {
    it('should return gatekeeper when found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({
        id: 'gk-1',
        organizationId: orgId,
        platformName: 'TestPlatform',
        corePlatformServices: ['online_search_engines'],
        designationStatus: 'designated',
        obligations: ['data_portability'],
        complianceStatus: 'in_review',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dmaService.getGatekeeper(orgId, 'gk-1');
      expect(result.id).toBe('gk-1');
      expect(result.platformName).toBe('TestPlatform');
    });

    it('should throw 404 when gatekeeper is not found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue(null);
      await expect(dmaService.getGatekeeper(orgId, 'gk-missing')).rejects.toThrow(
        'Gatekeeper not found',
      );
    });
  });

  // -------------------------------------------------------------------
  // getGatekeepers
  // -------------------------------------------------------------------
  describe('getGatekeepers()', () => {
    it('should return all gatekeepers for organization', async () => {
      dMAGatekeeper.findMany.mockResolvedValue([
        {
          id: 'gk-1',
          organizationId: orgId,
          platformName: 'Platform A',
          corePlatformServices: [],
          obligations: [],
          complianceStatus: 'in_review',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await dmaService.getGatekeepers(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].platformName).toBe('Platform A');
    });
  });

  // -------------------------------------------------------------------
  // updateGatekeeper
  // -------------------------------------------------------------------
  describe('updateGatekeeper()', () => {
    it('should throw 404 when gatekeeper is not found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue(null);
      await expect(
        dmaService.updateGatekeeper(orgId, 'gk-999', { platformName: 'Updated' }),
      ).rejects.toThrow('Gatekeeper not found');
    });

    it('should update and return the gatekeeper', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({ id: 'gk-1', organizationId: orgId });
      dMAGatekeeper.update.mockResolvedValue({
        id: 'gk-1',
        organizationId: orgId,
        platformName: 'Updated',
        corePlatformServices: [],
        obligations: [],
        complianceStatus: 'compliant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await dmaService.updateGatekeeper(orgId, 'gk-1', {
        complianceStatus: 'compliant',
      });
      expect(result.complianceStatus).toBe('compliant');
    });
  });

  // -------------------------------------------------------------------
  // getObligations
  // -------------------------------------------------------------------
  describe('getObligations()', () => {
    it('should throw 404 when gatekeeper is not found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue(null);
      await expect(dmaService.getObligations(orgId, 'gk-999')).rejects.toThrow(
        'Gatekeeper not found',
      );
    });

    it('should return obligations with tracking status', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({
        id: 'gk-1',
        organizationId: orgId,
        obligations: ['data_portability', 'interoperability'],
        obligationsTracking: [
          { obligationType: 'data_portability', complianceStatus: 'compliant', evidence: ['doc'] },
        ],
      });

      const result = await dmaService.getObligations(orgId, 'gk-1');

      expect(result).toHaveLength(2);
      expect(result[0].obligationType).toBe('data_portability');
      expect(result[0].complianceStatus).toBe('compliant');
      expect(result[1].obligationType).toBe('interoperability');
      expect(result[1].complianceStatus).toBe('pending');
    });

    it('should return empty array when obligations is null', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({
        id: 'gk-1',
        organizationId: orgId,
        obligations: null,
        obligationsTracking: [],
      });

      const result = await dmaService.getObligations(orgId, 'gk-1');
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // getComplianceReports
  // -------------------------------------------------------------------
  describe('getComplianceReports()', () => {
    it('should return compliance reports for gatekeeper', async () => {
      dMAComplianceReport.findMany.mockResolvedValue([
        {
          id: 'report-1',
          gatekeeperId: 'gk-1',
          organizationId: orgId,
          reportingPeriod: { start: new Date(), end: new Date() },
          obligationsStatus: {},
          violations: [],
          remediation: [],
          submittedToCommission: false,
        },
      ]);

      const result = await dmaService.getComplianceReports(orgId, 'gk-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('report-1');
    });
  });

  // -------------------------------------------------------------------
  // getLatestComplianceReport
  // -------------------------------------------------------------------
  describe('getLatestComplianceReport()', () => {
    it('should return null when no reports exist', async () => {
      dMAComplianceReport.findFirst.mockResolvedValue(null);
      const result = await dmaService.getLatestComplianceReport(orgId, 'gk-1');
      expect(result).toBeNull();
    });

    it('should return mapped report when found', async () => {
      dMAComplianceReport.findFirst.mockResolvedValue({
        id: 'report-1',
        gatekeeperId: 'gk-1',
        organizationId: orgId,
        reportingPeriod: { start: new Date(), end: new Date() },
        obligationsStatus: {},
        submittedToCommission: true,
        submittedAt: new Date(),
      });

      const result = await dmaService.getLatestComplianceReport(orgId, 'gk-1');
      expect(result).not.toBeNull();
      expect(result!.submittedToCommission).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // deleteGatekeeper
  // -------------------------------------------------------------------
  describe('deleteGatekeeper()', () => {
    it('should throw 404 when gatekeeper is not found', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue(null);
      await expect(dmaService.deleteGatekeeper(orgId, 'gk-999')).rejects.toThrow(
        'Gatekeeper not found',
      );
    });

    it('should delete the gatekeeper', async () => {
      dMAGatekeeper.findFirst.mockResolvedValue({ id: 'gk-1', organizationId: orgId });
      dMAGatekeeper.delete.mockResolvedValue({});

      await dmaService.deleteGatekeeper(orgId, 'gk-1');

      expect(dMAGatekeeper.delete).toHaveBeenCalledWith({ where: { id: 'gk-1' } });
    });
  });
});
