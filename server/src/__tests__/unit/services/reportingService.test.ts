/**
 * Reporting Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue({}),
  },
}));

import { ReportingService } from '../../../services/reportingService';

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportingService();
  });

  describe('createReport()', () => {
    it('should create custom report', async () => {
      const data = {
        organizationId: 'org-123',
        name: 'Monthly Compliance Report',
        reportType: 'Compliance',
        template: { sections: [] },
        userId: 'user-123',
      };

      const mockReport = {
        id: 'report-123',
        ...data,
      };

      prismaMock.customReport.create.mockResolvedValue(mockReport as any);

      const result = await service.createReport(data);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', data.name);
    });
  });

  describe('generateComplianceReport()', () => {
    it('should generate compliance report', async () => {
      const mockFrameworks = [
        {
          id: 'framework-1',
          name: 'SOC 2',
          status: 'In_Progress',
          progress: 75,
          controls: [
            { id: 'c-1', status: 'Implemented' },
            { id: 'c-2', status: 'In_Progress' },
          ],
        },
      ];

      prismaMock.complianceFramework.findMany.mockResolvedValue(mockFrameworks as any);

      const result = await service.generateComplianceReport('org-123');

      expect(result).toHaveProperty('reportType', 'Compliance Status');
      expect(result).toHaveProperty('frameworks');
      expect(Array.isArray(result.frameworks)).toBe(true);
    });
  });

  describe('generateRiskReport()', () => {
    it('should generate risk report', async () => {
      const mockRisks = [
        { id: 'risk-1', severity: 'High', status: 'Open' },
        { id: 'risk-2', severity: 'Medium', status: 'In Progress' },
      ];

      prismaMock.riskItem.findMany.mockResolvedValue(mockRisks as any);

      const result = await service.generateRiskReport('org-123');

      expect(result).toHaveProperty('reportType', 'Risk Assessment');
      expect(result).toHaveProperty('risks');
    });
  });
});

