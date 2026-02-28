/**
 * Auditor Service Unit Tests
 * Comprehensive tests for Auditor Collaboration Hub functionality
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  prismaMock,
  createMockAuditorProfile,
  createMockAuditEngagement,
  createMockAuditFinding,
  createMockAuditWorkpaper,
  createMockAuditRequest,
} from '../../mocks/prisma';

// Mock the database - MUST be before importing modules that use it
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock dependencies
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Import after mocking
import auditorService from '../../../services/auditorService';
import { AuditLogger } from '../../../utils/auditLogger';

describe('AuditorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // DASHBOARD STATS TESTS
  // ==========================================================================

  describe('getDashboardStats()', () => {
    it('should return comprehensive dashboard statistics', async () => {
      const orgId = 'org-123';

      // Mock all the Promise.all queries
      prismaMock.auditorProfile.count.mockResolvedValue(5);
      prismaMock.auditEngagement.count.mockResolvedValue(3);
      prismaMock.auditFinding.count.mockResolvedValue(10);
      prismaMock.auditRequest.count.mockResolvedValue(7);
      prismaMock.auditFinding.groupBy.mockResolvedValue([
        { severity: 'High', _count: { id: 4 } },
        { severity: 'Medium', _count: { id: 5 } },
        { severity: 'Low', _count: { id: 1 } },
      ]);
      prismaMock.auditEngagement.groupBy.mockResolvedValue([
        { status: 'Planning', _count: { id: 1 } },
        { status: 'In_Progress', _count: { id: 2 } },
      ]);
      prismaMock.auditEngagement.findMany.mockResolvedValue([
        { id: 'eng-1', title: 'SOC 2 Audit', endDate: new Date() },
      ]);
      prismaMock.auditFinding.findMany.mockResolvedValue([
        { id: 'finding-1', title: 'Access Control', targetRemediationDate: new Date() },
      ]);
      prismaMock.auditRequest.findMany.mockResolvedValue([
        { id: 'req-1', title: 'Policy Document', dueDate: new Date() },
      ]);

      const result = await auditorService.getDashboardStats(orgId);

      expect(result).toHaveProperty('totalAuditors', 5);
      expect(result).toHaveProperty('activeEngagements', 3);
      expect(result).toHaveProperty('openFindings', 10);
      expect(result).toHaveProperty('pendingRequests', 7);
      expect(result).toHaveProperty('findingsBySeverity');
      expect(result).toHaveProperty('engagementsByStatus');
      expect(result).toHaveProperty('upcomingDeadlines');
      expect(result.findingsBySeverity).toEqual({ High: 4, Medium: 5, Low: 1 });
    });

    it('should handle empty statistics', async () => {
      prismaMock.auditorProfile.count.mockResolvedValue(0);
      prismaMock.auditEngagement.count.mockResolvedValue(0);
      prismaMock.auditFinding.count.mockResolvedValue(0);
      prismaMock.auditRequest.count.mockResolvedValue(0);
      prismaMock.auditFinding.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.findMany.mockResolvedValue([]);
      prismaMock.auditFinding.findMany.mockResolvedValue([]);
      prismaMock.auditRequest.findMany.mockResolvedValue([]);

      const result = await auditorService.getDashboardStats('org-123');

      expect(result.totalAuditors).toBe(0);
      expect(result.activeEngagements).toBe(0);
      expect(result.upcomingDeadlines).toEqual([]);
    });

    it('should sort upcoming deadlines by date', async () => {
      const now = Date.now();
      prismaMock.auditorProfile.count.mockResolvedValue(0);
      prismaMock.auditEngagement.count.mockResolvedValue(0);
      prismaMock.auditFinding.count.mockResolvedValue(0);
      prismaMock.auditRequest.count.mockResolvedValue(0);
      prismaMock.auditFinding.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.groupBy.mockResolvedValue([]);
      prismaMock.auditEngagement.findMany.mockResolvedValue([
        { id: 'eng-1', title: 'Later Engagement', endDate: new Date(now + 20 * 24 * 60 * 60 * 1000) },
      ]);
      prismaMock.auditFinding.findMany.mockResolvedValue([
        { id: 'finding-1', title: 'Earlier Finding', targetRemediationDate: new Date(now + 5 * 24 * 60 * 60 * 1000) },
      ]);
      prismaMock.auditRequest.findMany.mockResolvedValue([
        { id: 'req-1', title: 'Middle Request', dueDate: new Date(now + 10 * 24 * 60 * 60 * 1000) },
      ]);

      const result = await auditorService.getDashboardStats('org-123');

      expect(result.upcomingDeadlines[0].type).toBe('finding');
      expect(result.upcomingDeadlines[1].type).toBe('request');
      expect(result.upcomingDeadlines[2].type).toBe('engagement');
    });
  });

  // ==========================================================================
  // AUDITOR MATCHING TESTS
  // ==========================================================================

  describe('matchAuditors()', () => {
    it('should match auditors based on specializations', async () => {
      const auditors = [
        createMockAuditorProfile({
          id: 'auditor-1',
          specializations: ['SOC 2', 'ISO 27001'],
          certification: ['CISA'],
          rating: 4.5,
          completedAudits: 20,
        }),
        createMockAuditorProfile({
          id: 'auditor-2',
          specializations: ['HIPAA', 'PCI DSS'],
          certification: ['CISSP'],
          rating: 4.0,
          completedAudits: 15,
        }),
      ];

      prismaMock.auditorProfile.findMany.mockResolvedValue(
        auditors.map(a => ({ ...a, engagements: [] }))
      );

      const result = await auditorService.matchAuditors('org-123', {
        specializations: ['SOC 2'],
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].matchScore).toBeGreaterThan(0);
      expect(result[0].matchReasons).toContain('Specializations: SOC 2');
    });

    it('should match auditors based on certifications', async () => {
      const auditors = [
        createMockAuditorProfile({
          id: 'auditor-1',
          specializations: [],
          certification: ['CISA', 'CPA'],
          rating: 4.0,
          completedAudits: 10,
        }),
      ];

      prismaMock.auditorProfile.findMany.mockResolvedValue(
        auditors.map(a => ({ ...a, engagements: [] }))
      );

      const result = await auditorService.matchAuditors('org-123', {
        certifications: ['CISA'],
      });

      expect(result[0].matchReasons).toContain('Certifications: CISA');
    });

    it('should filter by engagement type', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);

      await auditorService.matchAuditors('org-123', {
        engagementType: 'External',
      });

      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            engagementType: 'External',
          }),
        })
      );
    });

    it('should filter by minimum rating', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);

      await auditorService.matchAuditors('org-123', {
        rating: 4.0,
      });

      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: { gte: 4.0 },
          }),
        })
      );
    });

    it('should filter by max hourly rate', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);

      await auditorService.matchAuditors('org-123', {
        maxHourlyRate: 200,
      });

      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { hourlyRate: { lte: 200 } },
              { hourlyRate: null },
            ],
          }),
        })
      );
    });

    it('should sort results by match score, rating, and experience', async () => {
      const auditors = [
        createMockAuditorProfile({
          id: 'auditor-1',
          specializations: ['SOC 2'],
          certification: [],
          rating: 3.5,
          completedAudits: 5,
        }),
        createMockAuditorProfile({
          id: 'auditor-2',
          specializations: ['SOC 2', 'ISO 27001'],
          certification: ['CISA'],
          rating: 4.5,
          completedAudits: 30,
        }),
      ];

      prismaMock.auditorProfile.findMany.mockResolvedValue(
        auditors.map(a => ({ ...a, engagements: [] }))
      );

      const result = await auditorService.matchAuditors('org-123', {
        specializations: ['SOC 2', 'ISO 27001'],
        certifications: ['CISA'],
      });

      // Auditor-2 should rank higher due to better matches
      expect(result[0].id).toBe('auditor-2');
    });

    it('should filter zero-score matches when criteria provided', async () => {
      const auditors = [
        createMockAuditorProfile({
          id: 'auditor-1',
          specializations: ['HIPAA'], // No match
          certification: ['PCI'],    // No match
          rating: 5.0,
          completedAudits: 50,
        }),
      ];

      prismaMock.auditorProfile.findMany.mockResolvedValue(
        auditors.map(a => ({ ...a, engagements: [] }))
      );

      const result = await auditorService.matchAuditors('org-123', {
        specializations: ['SOC 2'],
        certifications: ['CISA'],
      });

      expect(result.length).toBe(0);
    });
  });

  // ==========================================================================
  // AUDITOR PROFILE CRUD TESTS
  // ==========================================================================

  describe('listAuditorProfiles()', () => {
    it('should return paginated auditor profiles', async () => {
      const mockProfiles = [createMockAuditorProfile(), createMockAuditorProfile({ id: 'auditor-2' })];
      prismaMock.auditorProfile.findMany.mockResolvedValue(
        mockProfiles.map(p => ({ ...p, engagements: [] }))
      );
      prismaMock.auditorProfile.count.mockResolvedValue(2);

      const result = await auditorService.listAuditorProfiles('org-123', { page: 1, limit: 25 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
    });

    it('should filter by status', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);
      prismaMock.auditorProfile.count.mockResolvedValue(0);

      await auditorService.listAuditorProfiles('org-123', { status: 'Active' });

      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Active',
          }),
        })
      );
    });

    it('should filter by specialization', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);
      prismaMock.auditorProfile.count.mockResolvedValue(0);

      await auditorService.listAuditorProfiles('org-123', { specialization: 'SOC 2' });

      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            specializations: { has: 'SOC 2' },
          }),
        })
      );
    });
  });

  describe('createAuditorProfile()', () => {
    it('should create a new auditor profile', async () => {
      const mockProfile = createMockAuditorProfile();
      prismaMock.auditorProfile.create.mockResolvedValue(mockProfile);

      const result = await auditorService.createAuditorProfile('org-123', {
        name: 'John Smith',
        email: 'john@audit.com',
        firm: 'Audit Firm LLC',
        certification: ['CPA', 'CISA'],
        specializations: ['SOC 2', 'ISO 27001'],
      });

      expect(result.name).toBe('John Smith');
      expect(prismaMock.auditorProfile.create).toHaveBeenCalledTimes(1);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auditor_profile.create',
          resourceType: 'AuditorProfile',
        })
      );
    });

    it('should use default values for optional fields', async () => {
      const mockProfile = createMockAuditorProfile();
      prismaMock.auditorProfile.create.mockResolvedValue(mockProfile);

      await auditorService.createAuditorProfile('org-123', {
        name: 'Jane Doe',
        email: 'jane@audit.com',
      });

      expect(prismaMock.auditorProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            certification: [],
            specializations: [],
            engagementType: 'External',
            status: 'Active',
            ndaSigned: false,
          }),
        })
      );
    });
  });

  describe('getAuditorProfile()', () => {
    it('should return auditor profile with engagements and findings', async () => {
      const mockProfile = {
        ...createMockAuditorProfile(),
        engagements: [createMockAuditEngagement()],
        findings: [createMockAuditFinding()],
      };
      prismaMock.auditorProfile.findFirst.mockResolvedValue(mockProfile);

      const result = await auditorService.getAuditorProfile('org-123', 'auditor-123');

      expect(result.id).toBe('auditor-123');
      expect(result.engagements).toHaveLength(1);
    });

    it('should throw error for non-existent profile', async () => {
      prismaMock.auditorProfile.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.getAuditorProfile('org-123', 'non-existent')
      ).rejects.toThrow('Auditor profile not found');
    });
  });

  describe('updateAuditorProfile()', () => {
    it('should update auditor profile', async () => {
      const existingProfile = createMockAuditorProfile();
      const updatedProfile = { ...existingProfile, rating: 5.0 };

      prismaMock.auditorProfile.findFirst.mockResolvedValue(existingProfile);
      prismaMock.auditorProfile.update.mockResolvedValue(updatedProfile);

      const result = await auditorService.updateAuditorProfile('org-123', 'auditor-123', {
        rating: 5.0,
      });

      expect(result.rating).toBe(5.0);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auditor_profile.update',
          metadata: { updatedFields: ['rating'] },
        })
      );
    });

    it('should throw error when profile not found', async () => {
      prismaMock.auditorProfile.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.updateAuditorProfile('org-123', 'non-existent', { rating: 5.0 })
      ).rejects.toThrow('Auditor profile not found');
    });
  });

  describe('deleteAuditorProfile()', () => {
    it('should delete auditor profile', async () => {
      const existingProfile = createMockAuditorProfile();
      prismaMock.auditorProfile.findFirst.mockResolvedValue(existingProfile);
      prismaMock.auditorProfile.delete.mockResolvedValue(existingProfile);

      await auditorService.deleteAuditorProfile('org-123', 'auditor-123');

      expect(prismaMock.auditorProfile.delete).toHaveBeenCalledWith({
        where: { id: 'auditor-123' },
      });
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auditor_profile.delete',
        })
      );
    });

    it('should throw error when profile not found', async () => {
      prismaMock.auditorProfile.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.deleteAuditorProfile('org-123', 'non-existent')
      ).rejects.toThrow('Auditor profile not found');
    });
  });

  // ==========================================================================
  // AUDIT ENGAGEMENT CRUD TESTS
  // ==========================================================================

  describe('listEngagements()', () => {
    it('should return paginated engagements', async () => {
      const mockEngagements = [
        { ...createMockAuditEngagement(), auditor: createMockAuditorProfile(), findings: [] },
      ];
      prismaMock.auditEngagement.findMany.mockResolvedValue(mockEngagements);
      prismaMock.auditEngagement.count.mockResolvedValue(1);

      const result = await auditorService.listEngagements('org-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status and framework', async () => {
      prismaMock.auditEngagement.findMany.mockResolvedValue([]);
      prismaMock.auditEngagement.count.mockResolvedValue(0);

      await auditorService.listEngagements('org-123', {
        status: 'In_Progress',
        framework: 'SOC 2',
      });

      expect(prismaMock.auditEngagement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'In_Progress',
            framework: 'SOC 2',
          }),
        })
      );
    });
  });

  describe('createEngagement()', () => {
    it('should create a new engagement', async () => {
      const auditorProfile = createMockAuditorProfile();
      const mockEngagement = {
        ...createMockAuditEngagement(),
        auditor: { id: auditorProfile.id, name: auditorProfile.name, email: auditorProfile.email, firm: auditorProfile.firm },
      };

      prismaMock.auditorProfile.findFirst.mockResolvedValue(auditorProfile);
      prismaMock.auditEngagement.create.mockResolvedValue(mockEngagement);

      const result = await auditorService.createEngagement('org-123', {
        auditorId: 'auditor-123',
        title: 'SOC 2 Type II Audit',
        engagementType: 'Compliance',
        framework: 'SOC 2',
        startDate: new Date(),
      });

      expect(result.title).toBe('SOC 2 Type II Audit 2024');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'audit_engagement.create',
        })
      );
    });

    it('should throw error when auditor not found', async () => {
      prismaMock.auditorProfile.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.createEngagement('org-123', {
          auditorId: 'non-existent',
          title: 'Test',
          engagementType: 'Compliance',
          framework: 'SOC 2',
          startDate: new Date(),
        })
      ).rejects.toThrow('Auditor profile not found');
    });
  });

  describe('getEngagement()', () => {
    it('should return engagement with related data', async () => {
      const mockEngagement = {
        ...createMockAuditEngagement(),
        auditor: createMockAuditorProfile(),
        findings: [createMockAuditFinding()],
        workpapers: [createMockAuditWorkpaper()],
        requests: [createMockAuditRequest()],
      };
      prismaMock.auditEngagement.findFirst.mockResolvedValue(mockEngagement);

      const result = await auditorService.getEngagement('org-123', 'engagement-123');

      expect(result.findings).toHaveLength(1);
      expect(result.workpapers).toHaveLength(1);
      expect(result.requests).toHaveLength(1);
    });

    it('should throw error when engagement not found', async () => {
      prismaMock.auditEngagement.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.getEngagement('org-123', 'non-existent')
      ).rejects.toThrow('Audit engagement not found');
    });
  });

  describe('updateEngagement()', () => {
    it('should update engagement and increment auditor completedAudits on completion', async () => {
      const existingEngagement = createMockAuditEngagement({ status: 'In_Progress' });
      const updatedEngagement = {
        ...existingEngagement,
        status: 'Completed',
        auditor: createMockAuditorProfile(),
      };

      prismaMock.auditEngagement.findFirst.mockResolvedValue(existingEngagement);
      prismaMock.auditEngagement.update.mockResolvedValue(updatedEngagement);
      prismaMock.auditorProfile.update.mockResolvedValue(createMockAuditorProfile({ completedAudits: 26 }));

      await auditorService.updateEngagement('org-123', 'engagement-123', {
        status: 'Completed',
      });

      expect(prismaMock.auditorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedAudits: { increment: 1 },
          }),
        })
      );
    });

    it('should not increment completedAudits for non-completion updates', async () => {
      const existingEngagement = createMockAuditEngagement({ status: 'Planning' });
      const updatedEngagement = { ...existingEngagement, status: 'In_Progress', auditor: createMockAuditorProfile() };

      prismaMock.auditEngagement.findFirst.mockResolvedValue(existingEngagement);
      prismaMock.auditEngagement.update.mockResolvedValue(updatedEngagement);

      await auditorService.updateEngagement('org-123', 'engagement-123', {
        status: 'In_Progress',
      });

      expect(prismaMock.auditorProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteEngagement()', () => {
    it('should delete engagement', async () => {
      const existingEngagement = createMockAuditEngagement();
      prismaMock.auditEngagement.findFirst.mockResolvedValue(existingEngagement);
      prismaMock.auditEngagement.delete.mockResolvedValue(existingEngagement);

      await auditorService.deleteEngagement('org-123', 'engagement-123');

      expect(prismaMock.auditEngagement.delete).toHaveBeenCalled();
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'audit_engagement.delete',
        })
      );
    });
  });

  // ==========================================================================
  // AUDIT FINDING CRUD TESTS
  // ==========================================================================

  describe('listFindings()', () => {
    it('should return paginated findings', async () => {
      const mockFindings = [
        {
          ...createMockAuditFinding(),
          auditor: createMockAuditorProfile(),
          engagement: createMockAuditEngagement(),
        },
      ];
      prismaMock.auditFinding.findMany.mockResolvedValue(mockFindings);
      prismaMock.auditFinding.count.mockResolvedValue(1);

      const result = await auditorService.listFindings('org-123');

      expect(result.data).toHaveLength(1);
    });

    it('should filter by severity and status', async () => {
      prismaMock.auditFinding.findMany.mockResolvedValue([]);
      prismaMock.auditFinding.count.mockResolvedValue(0);

      await auditorService.listFindings('org-123', {
        severity: 'High',
        status: 'Open',
      });

      expect(prismaMock.auditFinding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: 'High',
            status: 'Open',
          }),
        })
      );
    });
  });

  describe('createFinding()', () => {
    it('should create a new finding', async () => {
      const mockEngagement = createMockAuditEngagement();
      const mockFinding = {
        ...createMockAuditFinding(),
        auditor: createMockAuditorProfile(),
        engagement: mockEngagement,
      };

      prismaMock.auditEngagement.findFirst.mockResolvedValue(mockEngagement);
      prismaMock.auditFinding.create.mockResolvedValue(mockFinding);

      const result = await auditorService.createFinding('org-123', {
        engagementId: 'engagement-123',
        auditorId: 'auditor-123',
        title: 'Access Control Gap',
        description: 'Missing access reviews',
        findingType: 'Control Deficiency',
        severity: 'High',
      });

      expect(result.title).toBe('Insufficient Access Controls');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'audit_finding.create',
          metadata: expect.objectContaining({
            severity: 'High',
          }),
        })
      );
    });

    it('should use default severity of Medium', async () => {
      prismaMock.auditEngagement.findFirst.mockResolvedValue(createMockAuditEngagement());
      prismaMock.auditFinding.create.mockResolvedValue(createMockAuditFinding());

      await auditorService.createFinding('org-123', {
        engagementId: 'engagement-123',
        auditorId: 'auditor-123',
        title: 'Minor Issue',
        description: 'Minor documentation gap',
        findingType: 'Observation',
      });

      expect(prismaMock.auditFinding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            severity: 'Medium',
            status: 'Open',
          }),
        })
      );
    });
  });

  describe('getFinding()', () => {
    it('should return finding with auditor and engagement', async () => {
      const mockFinding = {
        ...createMockAuditFinding(),
        auditor: createMockAuditorProfile(),
        engagement: createMockAuditEngagement(),
      };
      prismaMock.auditFinding.findFirst.mockResolvedValue(mockFinding);

      const result = await auditorService.getFinding('org-123', 'finding-123');

      expect(result.auditor).toBeDefined();
      expect(result.engagement).toBeDefined();
    });

    it('should throw error for non-existent finding', async () => {
      prismaMock.auditFinding.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.getFinding('org-123', 'non-existent')
      ).rejects.toThrow('Audit finding not found');
    });
  });

  describe('updateFinding()', () => {
    it('should update finding status and retest info', async () => {
      const existingFinding = createMockAuditFinding();
      const updatedFinding = {
        ...existingFinding,
        status: 'Closed',
        retestResult: 'Passed',
        retestDate: new Date(),
        auditor: createMockAuditorProfile(),
        engagement: createMockAuditEngagement(),
      };

      prismaMock.auditFinding.findFirst.mockResolvedValue(existingFinding);
      prismaMock.auditFinding.update.mockResolvedValue(updatedFinding);

      const result = await auditorService.updateFinding('org-123', 'finding-123', {
        status: 'Closed',
        retestResult: 'Passed',
        retestDate: new Date(),
      });

      expect(result.status).toBe('Closed');
      expect(result.retestResult).toBe('Passed');
    });
  });

  describe('deleteFinding()', () => {
    it('should delete finding', async () => {
      const existingFinding = createMockAuditFinding();
      prismaMock.auditFinding.findFirst.mockResolvedValue(existingFinding);
      prismaMock.auditFinding.delete.mockResolvedValue(existingFinding);

      await auditorService.deleteFinding('org-123', 'finding-123');

      expect(prismaMock.auditFinding.delete).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // AUDIT WORKPAPER CRUD TESTS
  // ==========================================================================

  describe('listWorkpapers()', () => {
    it('should return paginated workpapers', async () => {
      const mockWorkpapers = [
        { ...createMockAuditWorkpaper(), engagement: createMockAuditEngagement() },
      ];
      prismaMock.auditWorkpaper.findMany.mockResolvedValue(mockWorkpapers);
      prismaMock.auditWorkpaper.count.mockResolvedValue(1);

      const result = await auditorService.listWorkpapers('org-123');

      expect(result.data).toHaveLength(1);
    });

    it('should filter by engagement and workpaper type', async () => {
      prismaMock.auditWorkpaper.findMany.mockResolvedValue([]);
      prismaMock.auditWorkpaper.count.mockResolvedValue(0);

      await auditorService.listWorkpapers('org-123', {
        engagementId: 'engagement-123',
        workpaperType: 'Testing',
      });

      expect(prismaMock.auditWorkpaper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            engagementId: 'engagement-123',
            workpaperType: 'Testing',
          }),
        })
      );
    });
  });

  describe('createWorkpaper()', () => {
    it('should create a new workpaper', async () => {
      const mockEngagement = createMockAuditEngagement();
      const mockWorkpaper = {
        ...createMockAuditWorkpaper(),
        engagement: mockEngagement,
      };

      prismaMock.auditEngagement.findFirst.mockResolvedValue(mockEngagement);
      prismaMock.auditWorkpaper.create.mockResolvedValue(mockWorkpaper);

      const result = await auditorService.createWorkpaper('org-123', {
        engagementId: 'engagement-123',
        title: 'Access Control Testing',
        workpaperType: 'Testing',
        uploadedBy: 'auditor-123',
      });

      expect(result.title).toBe('Access Control Testing');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'audit_workpaper.create',
        })
      );
    });
  });

  describe('getWorkpaper()', () => {
    it('should return workpaper with engagement', async () => {
      const mockWorkpaper = {
        ...createMockAuditWorkpaper(),
        engagement: createMockAuditEngagement(),
      };
      prismaMock.auditWorkpaper.findFirst.mockResolvedValue(mockWorkpaper);

      const result = await auditorService.getWorkpaper('org-123', 'workpaper-123');

      expect(result.engagement).toBeDefined();
    });

    it('should throw error for non-existent workpaper', async () => {
      prismaMock.auditWorkpaper.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.getWorkpaper('org-123', 'non-existent')
      ).rejects.toThrow('Workpaper not found');
    });
  });

  describe('updateWorkpaper()', () => {
    it('should update workpaper with review info', async () => {
      const existingWorkpaper = createMockAuditWorkpaper();
      const updatedWorkpaper = {
        ...existingWorkpaper,
        status: 'Reviewed',
        reviewedBy: 'manager-123',
        reviewDate: new Date(),
        engagement: createMockAuditEngagement(),
      };

      prismaMock.auditWorkpaper.findFirst.mockResolvedValue(existingWorkpaper);
      prismaMock.auditWorkpaper.update.mockResolvedValue(updatedWorkpaper);

      const result = await auditorService.updateWorkpaper('org-123', 'workpaper-123', {
        status: 'Reviewed',
        reviewedBy: 'manager-123',
        reviewDate: new Date(),
      });

      expect(result.status).toBe('Reviewed');
      expect(result.reviewedBy).toBe('manager-123');
    });
  });

  describe('deleteWorkpaper()', () => {
    it('should delete workpaper', async () => {
      const existingWorkpaper = createMockAuditWorkpaper();
      prismaMock.auditWorkpaper.findFirst.mockResolvedValue(existingWorkpaper);
      prismaMock.auditWorkpaper.delete.mockResolvedValue(existingWorkpaper);

      await auditorService.deleteWorkpaper('org-123', 'workpaper-123');

      expect(prismaMock.auditWorkpaper.delete).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // AUDIT REQUEST CRUD TESTS
  // ==========================================================================

  describe('listRequests()', () => {
    it('should return paginated requests', async () => {
      const mockRequests = [
        { ...createMockAuditRequest(), engagement: createMockAuditEngagement() },
      ];
      prismaMock.auditRequest.findMany.mockResolvedValue(mockRequests);
      prismaMock.auditRequest.count.mockResolvedValue(1);

      const result = await auditorService.listRequests('org-123');

      expect(result.data).toHaveLength(1);
    });

    it('should filter by status and priority', async () => {
      prismaMock.auditRequest.findMany.mockResolvedValue([]);
      prismaMock.auditRequest.count.mockResolvedValue(0);

      await auditorService.listRequests('org-123', {
        status: 'Open',
        priority: 'High',
      });

      expect(prismaMock.auditRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Open',
            priority: 'High',
          }),
        })
      );
    });

    it('should filter by assigned user', async () => {
      prismaMock.auditRequest.findMany.mockResolvedValue([]);
      prismaMock.auditRequest.count.mockResolvedValue(0);

      await auditorService.listRequests('org-123', {
        assignedTo: 'user-123',
      });

      expect(prismaMock.auditRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedTo: 'user-123',
          }),
        })
      );
    });
  });

  describe('createRequest()', () => {
    it('should create a new request', async () => {
      const mockEngagement = createMockAuditEngagement();
      const mockRequest = {
        ...createMockAuditRequest(),
        engagement: mockEngagement,
      };

      prismaMock.auditEngagement.findFirst.mockResolvedValue(mockEngagement);
      prismaMock.auditRequest.create.mockResolvedValue(mockRequest);

      const result = await auditorService.createRequest('org-123', {
        engagementId: 'engagement-123',
        requestedBy: 'auditor-123',
        title: 'Policy Document Request',
        description: 'Please provide access control policy',
        category: 'Documentation',
      });

      expect(result.title).toBe('Access Control Policy Document');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'audit_request.create',
        })
      );
    });

    it('should use default priority of Medium', async () => {
      prismaMock.auditEngagement.findFirst.mockResolvedValue(createMockAuditEngagement());
      prismaMock.auditRequest.create.mockResolvedValue(createMockAuditRequest());

      await auditorService.createRequest('org-123', {
        engagementId: 'engagement-123',
        requestedBy: 'auditor-123',
        title: 'Test Request',
        description: 'Test description',
        category: 'Documentation',
      });

      expect(prismaMock.auditRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'Medium',
            status: 'Open',
          }),
        })
      );
    });
  });

  describe('getRequest()', () => {
    it('should return request with engagement', async () => {
      const mockRequest = {
        ...createMockAuditRequest(),
        engagement: createMockAuditEngagement(),
      };
      prismaMock.auditRequest.findFirst.mockResolvedValue(mockRequest);

      const result = await auditorService.getRequest('org-123', 'request-123');

      expect(result.engagement).toBeDefined();
    });

    it('should throw error for non-existent request', async () => {
      prismaMock.auditRequest.findFirst.mockResolvedValue(null);

      await expect(
        auditorService.getRequest('org-123', 'non-existent')
      ).rejects.toThrow('Audit request not found');
    });
  });

  describe('updateRequest()', () => {
    it('should update request with response', async () => {
      const existingRequest = createMockAuditRequest();
      const updatedRequest = {
        ...existingRequest,
        status: 'Completed',
        response: 'Here is the document you requested',
        engagement: createMockAuditEngagement(),
      };

      prismaMock.auditRequest.findFirst.mockResolvedValue(existingRequest);
      prismaMock.auditRequest.update.mockResolvedValue(updatedRequest);

      const result = await auditorService.updateRequest('org-123', 'request-123', {
        status: 'Completed',
        response: 'Here is the document you requested',
      });

      expect(result.status).toBe('Completed');
      expect(result.response).toBe('Here is the document you requested');
    });
  });

  describe('deleteRequest()', () => {
    it('should delete request', async () => {
      const existingRequest = createMockAuditRequest();
      prismaMock.auditRequest.findFirst.mockResolvedValue(existingRequest);
      prismaMock.auditRequest.delete.mockResolvedValue(existingRequest);

      await auditorService.deleteRequest('org-123', 'request-123');

      expect(prismaMock.auditRequest.delete).toHaveBeenCalled();
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'audit_request.delete',
        })
      );
    });
  });

  // ==========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.auditorProfile.count.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        auditorService.getDashboardStats('org-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle empty string filters', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);
      prismaMock.auditorProfile.count.mockResolvedValue(0);

      // Should not add empty filters to query
      await auditorService.listAuditorProfiles('org-123', {
        status: undefined,
        engagementType: undefined,
      });

      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });

    it('should handle concurrent operations', async () => {
      prismaMock.auditorProfile.findMany.mockResolvedValue([]);
      prismaMock.auditorProfile.count.mockResolvedValue(0);

      // Simulate concurrent requests
      const results = await Promise.all([
        auditorService.listAuditorProfiles('org-123'),
        auditorService.listAuditorProfiles('org-456'),
        auditorService.listAuditorProfiles('org-789'),
      ]);

      expect(results).toHaveLength(3);
      expect(prismaMock.auditorProfile.findMany).toHaveBeenCalledTimes(3);
    });
  });
});
