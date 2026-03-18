/**
 * Auditor Service Contract Tests
 *
 * Verifies the contract for auditor profile management, engagement tracking,
 * findings, workpapers, and dashboard statistics.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  prismaMock,
  createMockAuditorProfile,
  createMockAuditEngagement,
  createMockAuditFinding,
} from '../../mocks/prisma';

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

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

import auditorService from '../../../services/auditorService';

describe('AuditorService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getDashboardStats
  // ---------------------------------------------------------------------------
  describe('getDashboardStats', () => {
    it('should query multiple prisma models for dashboard data', async () => {
      prismaMock.auditorProfile.count.mockResolvedValue(5);
      prismaMock.auditEngagement.count.mockResolvedValue(3);
      prismaMock.auditFinding.count.mockResolvedValue(10);
      prismaMock.auditRequest.count.mockResolvedValue(4);
      prismaMock.auditFinding.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.findMany.mockResolvedValue([]);
      prismaMock.auditFinding.findMany.mockResolvedValue([]);
      prismaMock.auditRequest.findMany.mockResolvedValue([]);

      const stats = await auditorService.getDashboardStats('org-123');

      // Should query total auditors
      expect(prismaMock.auditorProfile.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-123', status: 'Active' },
      });

      // Should query active engagements
      expect(prismaMock.auditEngagement.count).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          status: { not: 'Completed' },
        },
      });

      // Should query open findings
      expect(prismaMock.auditFinding.count).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          status: { in: ['Open', 'InProgress'] },
        },
      });

      expect(stats).toHaveProperty('totalAuditors', 5);
      expect(stats).toHaveProperty('activeEngagements', 3);
      expect(stats).toHaveProperty('openFindings', 10);
      expect(stats).toHaveProperty('pendingRequests', 4);
    });

    it('should query findings grouped by severity', async () => {
      prismaMock.auditorProfile.count.mockResolvedValue(0);
      prismaMock.auditEngagement.count.mockResolvedValue(0);
      prismaMock.auditFinding.count.mockResolvedValue(0);
      prismaMock.auditRequest.count.mockResolvedValue(0);
      prismaMock.auditFinding.groupBy.mockResolvedValue([
        { severity: 'High', _count: { id: 3 } },
        { severity: 'Medium', _count: { id: 5 } },
      ]);
      prismaMock.auditEngagement.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.findMany.mockResolvedValue([]);
      prismaMock.auditFinding.findMany.mockResolvedValue([]);
      prismaMock.auditRequest.findMany.mockResolvedValue([]);

      const stats = await auditorService.getDashboardStats('org-123');

      expect(prismaMock.auditFinding.groupBy).toHaveBeenCalledWith({
        by: ['severity'],
        where: {
          organizationId: 'org-123',
          status: { in: ['Open', 'InProgress'] },
        },
        _count: { id: true },
      });

      expect(stats.findingsBySeverity).toBeDefined();
    });

    it('should query upcoming deadlines within 30 days', async () => {
      prismaMock.auditorProfile.count.mockResolvedValue(0);
      prismaMock.auditEngagement.count.mockResolvedValue(0);
      prismaMock.auditFinding.count.mockResolvedValue(0);
      prismaMock.auditRequest.count.mockResolvedValue(0);
      prismaMock.auditFinding.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.findMany.mockResolvedValue([]);
      prismaMock.auditFinding.findMany.mockResolvedValue([]);
      prismaMock.auditRequest.findMany.mockResolvedValue([]);

      await auditorService.getDashboardStats('org-123');

      // Engagement deadline query
      expect(prismaMock.auditEngagement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            status: { not: 'Completed' },
            endDate: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Auditor Profile CRUD
  // ---------------------------------------------------------------------------
  describe('createAuditorProfile', () => {
    it('should call prisma.auditorProfile.create with correct shape', async () => {
      prismaMock.auditorProfile.create.mockResolvedValue(createMockAuditorProfile());

      await auditorService.createAuditorProfile('org-123', {
        name: 'John Smith',
        email: 'john@auditfirm.com',
        firm: 'Big Four',
        certification: ['CPA', 'CISA'],
        specializations: ['SOC 2'],
        engagementType: 'External',
      }, 'user-1');

      expect(prismaMock.auditorProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'John Smith',
          email: 'john@auditfirm.com',
          firm: 'Big Four',
          status: 'Active',
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Engagement management
  // ---------------------------------------------------------------------------
  describe('createEngagement', () => {
    it('should call prisma.auditEngagement.create with correct shape', async () => {
      prismaMock.auditorProfile.findFirst.mockResolvedValue(createMockAuditorProfile({ id: 'auditor-123' }));
      prismaMock.auditEngagement.create.mockResolvedValue(createMockAuditEngagement());

      await auditorService.createEngagement('org-123', {
        auditorId: 'auditor-123',
        title: 'SOC 2 Type II Audit',
        engagementType: 'Compliance',
        framework: 'SOC 2',
        scope: 'Security and Availability',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
      }, 'user-1');

      expect(prismaMock.auditEngagement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            auditorId: 'auditor-123',
            title: 'SOC 2 Type II Audit',
            engagementType: 'Compliance',
            framework: 'SOC 2',
            status: 'Planning',
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Findings
  // ---------------------------------------------------------------------------
  describe('createFinding', () => {
    it('should call prisma.auditFinding.create with correct shape', async () => {
      prismaMock.auditEngagement.findFirst.mockResolvedValue(createMockAuditEngagement({ id: 'engagement-123' }));
      prismaMock.auditFinding.create.mockResolvedValue(createMockAuditFinding());

      await auditorService.createFinding('org-123', {
        engagementId: 'engagement-123',
        auditorId: 'auditor-123',
        title: 'Insufficient Access Controls',
        description: 'Access review lacks periodic certification',
        findingType: 'Control Deficiency',
        severity: 'High',
        controlRef: 'CC6.1',
      }, 'user-1');

      expect(prismaMock.auditFinding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            engagementId: 'engagement-123',
            auditorId: 'auditor-123',
            title: 'Insufficient Access Controls',
            severity: 'High',
            status: 'Open',
          }),
        })
      );
    });

    it('should default status to Open', async () => {
      prismaMock.auditEngagement.findFirst.mockResolvedValue(createMockAuditEngagement({ id: 'eng-1' }));
      prismaMock.auditFinding.create.mockResolvedValue(createMockAuditFinding());

      await auditorService.createFinding('org-123', {
        engagementId: 'eng-1',
        auditorId: 'aud-1',
        title: 'Finding',
        description: 'Description',
        findingType: 'Observation',
        severity: 'Low',
      }, 'user-1');

      expect(prismaMock.auditFinding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Open',
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Error propagation
  // ---------------------------------------------------------------------------
  describe('error propagation', () => {
    it('should propagate Prisma errors from dashboard stats', async () => {
      prismaMock.auditorProfile.count.mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(
        auditorService.getDashboardStats('org-123')
      ).rejects.toThrow();
    });
  });
});
