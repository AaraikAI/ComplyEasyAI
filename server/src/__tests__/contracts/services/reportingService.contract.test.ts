/**
 * Reporting Service Contract Tests
 *
 * Verifies the contract for report creation, compliance report generation,
 * and data aggregation from Prisma.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockFramework, createMockControl } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

import reportingService from '../../../services/reportingService';

describe('ReportingService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createReport
  // ---------------------------------------------------------------------------
  describe('createReport', () => {
    it('should call prisma.customReport.create with correct shape', async () => {
      const mockReport = {
        id: 'report-1',
        organizationId: 'org-123',
        name: 'Monthly Compliance Report',
        reportType: 'Compliance',
      };
      prismaMock.customReport.create.mockResolvedValue(mockReport);

      await reportingService.createReport({
        organizationId: 'org-123',
        name: 'Monthly Compliance Report',
        reportType: 'Compliance',
        template: { sections: ['overview', 'controls'] },
        userId: 'user-1',
      });

      expect(prismaMock.customReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'Monthly Compliance Report',
          reportType: 'Compliance',
          template: { sections: ['overview', 'controls'] },
        }),
      });
    });

    it('should pass optional schedule and recipients', async () => {
      prismaMock.customReport.create.mockResolvedValue({ id: 'report-1' });

      await reportingService.createReport({
        organizationId: 'org-123',
        name: 'Scheduled Report',
        reportType: 'Risk',
        template: { sections: ['risks'] },
        schedule: { frequency: 'monthly', day: 1 },
        recipients: { emails: ['admin@example.com'] },
        userId: 'user-1',
      });

      expect(prismaMock.customReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schedule: { frequency: 'monthly', day: 1 },
          recipients: { emails: ['admin@example.com'] },
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.customReport.create.mockRejectedValue(new Error('Disk full'));

      await expect(
        reportingService.createReport({
          organizationId: 'org-123',
          name: 'Report',
          reportType: 'Compliance',
          template: {},
          userId: 'user-1',
        })
      ).rejects.toThrow('Disk full');
    });
  });

  // ---------------------------------------------------------------------------
  // generateComplianceReport
  // ---------------------------------------------------------------------------
  describe('generateComplianceReport', () => {
    it('should query frameworks with controls included', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);

      await reportingService.generateComplianceReport('org-123');

      expect(prismaMock.complianceFramework.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
        }),
        include: { controls: true },
      });
    });

    it('should filter by frameworkId when provided', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([]);

      await reportingService.generateComplianceReport('org-123', 'fw-1');

      expect(prismaMock.complianceFramework.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
          id: 'fw-1',
        }),
        include: { controls: true },
      });
    });

    it('should transform framework data into report shape', async () => {
      const framework = {
        ...createMockFramework(),
        progress: 50,
        controls: [
          createMockControl({ status: 'Implemented' }),
          createMockControl({ id: 'ctrl-2', status: 'In_Progress' }),
          createMockControl({ id: 'ctrl-3', status: 'Pending' }),
        ],
      };

      prismaMock.complianceFramework.findMany.mockResolvedValue([framework]);

      const report = await reportingService.generateComplianceReport('org-123');

      expect(report).toHaveProperty('frameworks');
      expect(report).toHaveProperty('summary');
      expect(report.frameworks).toHaveLength(1);
      expect(report.frameworks[0]).toHaveProperty('totalControls', 3);
      expect(report.frameworks[0]).toHaveProperty('implementedControls', 1);
      expect(report.frameworks[0]).toHaveProperty('complianceRate');
      expect(report.summary).toHaveProperty('totalFrameworks', 1);
      expect(report.summary).toHaveProperty('overallComplianceRate');
    });

    it('should handle zero controls gracefully', async () => {
      const framework = { ...createMockFramework(), controls: [] };
      prismaMock.complianceFramework.findMany.mockResolvedValue([framework]);

      const report = await reportingService.generateComplianceReport('org-123');

      expect(report.frameworks[0].complianceRate).toBe(0);
    });

    it('should return correct summary for multiple frameworks', async () => {
      const fw1 = {
        ...createMockFramework({ id: 'fw-1', name: 'SOC 2' }),
        progress: 80,
        controls: [
          createMockControl({ status: 'Implemented' }),
          createMockControl({ id: 'c2', status: 'Implemented' }),
        ],
      };
      const fw2 = {
        ...createMockFramework({ id: 'fw-2', name: 'ISO 27001' }),
        progress: 50,
        controls: [
          createMockControl({ id: 'c3', status: 'Implemented' }),
          createMockControl({ id: 'c4', status: 'Pending' }),
        ],
      };

      prismaMock.complianceFramework.findMany.mockResolvedValue([fw1, fw2]);

      const report = await reportingService.generateComplianceReport('org-123');

      expect(report.summary.totalFrameworks).toBe(2);
      expect(report.summary.totalControls).toBe(4);
      expect(report.summary.implementedControls).toBe(3);
      expect(report.summary.overallComplianceRate).toBe(75);
    });
  });
});
