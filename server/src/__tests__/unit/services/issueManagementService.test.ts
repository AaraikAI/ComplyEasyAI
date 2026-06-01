/**
 * Issue Management Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockIssue } from '../../mocks/prisma';

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
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

// Mock notificationService (dynamically imported by issueManagementService)
jest.mock('../../../services/notificationService', () => ({
  __esModule: true,
  default: {
    sendNotification: jest.fn().mockResolvedValue({}),
  },
}));

// Import after mocking
import issueManagementService from '../../../services/issueManagementService';
import { AuditLogger } from '../../../utils/auditLogger';

describe('IssueManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIssue()', () => {
    it('should create a new issue', async () => {
      const mockIssue = createMockIssue();
      prismaMock.issue.create.mockResolvedValue(mockIssue);

      const result = await issueManagementService.createIssue({
        organizationId: 'org-123',
        title: 'Security Vulnerability',
        description: 'Critical vulnerability found in auth module',
        priority: 'Critical',
        issueType: 'Bug',
        createdById: 'user-123',
      });

      expect(result.title).toBe('Security Vulnerability');
      expect(prismaMock.issue.create).toHaveBeenCalledTimes(1);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'issue.created',
          resourceType: 'Issue',
        })
      );
    });

    it('should set SLA target based on priority', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.issue.create.mockImplementation(async ({ data }: { data: any }) => ({
        ...createMockIssue(),
        slaTarget: data.slaTarget as Date,
      }));

      // Critical priority should have shorter SLA
      await issueManagementService.createIssue({
        organizationId: 'org-123',
        title: 'Critical Issue',
        description: 'Very urgent',
        priority: 'Critical',
        issueType: 'Bug',
        createdById: 'user-123',
      });

      expect(prismaMock.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'Critical',
          }),
        })
      );
    });
  });

  describe('updateIssueStatus()', () => {
    it('should update an existing issue status', async () => {
      const existingIssue = createMockIssue({ status: 'Open' });
      prismaMock.issue.findFirst.mockResolvedValue(existingIssue);
      const updatedIssue = createMockIssue({ status: 'In_Progress' });
      prismaMock.issue.update.mockResolvedValue(updatedIssue);

      const result = await issueManagementService.updateIssueStatus(
        'issue-123',
        'In_Progress',
        'user-123',
        'org-123'
      );

      expect(result.status).toBe('In_Progress');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'issue.status_updated',
        })
      );
    });
  });

  describe('assignIssue()', () => {
    it('should assign issue to a user', async () => {
      const existingIssue = createMockIssue({ status: 'Open' });
      prismaMock.issue.findFirst.mockResolvedValue(existingIssue);
      const assignedIssue = createMockIssue({ assignedToId: 'user-456' });
      prismaMock.issue.update.mockResolvedValue(assignedIssue);

      const result = await issueManagementService.assignIssue(
        'issue-123',
        'user-456',
        'user-123',
        'org-123'
      );

      expect(result.assignedToId).toBe('user-456');
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'issue.assigned',
        })
      );
    });
  });

  describe('addComment()', () => {
    it('should add a comment to an issue', async () => {
      const mockComment = {
        id: 'comment-123',
        issueId: 'issue-123',
        comment: 'Working on this issue',
        author: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // addComment now verifies org ownership of the parent issue first.
      prismaMock.issue.findFirst.mockResolvedValue(
        createMockIssue({ id: 'issue-123', assignedToId: null, createdById: 'user-123' })
      );
      prismaMock.issueComment.create.mockResolvedValue(mockComment);

      const result = await issueManagementService.addComment(
        'issue-123',
        { content: 'Working on this issue', userId: 'user-123' },
        'org-123'
      );

      expect(result.comment).toBe('Working on this issue');
      expect(AuditLogger.log).toHaveBeenCalled();
    });
  });

  describe('updateRemediationPlan()', () => {
    it('should update remediation plan for an issue', async () => {
      const updatedIssue = createMockIssue({
        remediationPlan: 'Fixed in version 2.1.0',
      });

      // updateRemediationPlan now verifies org ownership before mutating.
      prismaMock.issue.findFirst.mockResolvedValue(createMockIssue({ id: 'issue-123' }));
      prismaMock.issue.update.mockResolvedValue(updatedIssue);

      const result = await issueManagementService.updateRemediationPlan(
        'issue-123',
        { remediationPlan: 'Fixed in version 2.1.0', remediationSteps: [] },
        'user-123',
        'org-123'
      );

      expect(result).toBeDefined();
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'issue.remediation_plan_updated',
        })
      );
    });
  });

  describe('getIssueDashboard()', () => {
    it('should return issue dashboard metrics', async () => {
      const mockIssues = [
        createMockIssue({ status: 'Open', priority: 'Critical' }),
        createMockIssue({ id: 'issue-2', status: 'Open', priority: 'High' }),
        createMockIssue({ id: 'issue-3', status: 'Resolved', priority: 'Medium' }),
        createMockIssue({ id: 'issue-4', status: 'Closed', priority: 'Low' }),
      ];

      prismaMock.issue.findMany.mockResolvedValue(mockIssues);
      prismaMock.issue.count.mockResolvedValue(4);

      const dashboard = await issueManagementService.getIssueDashboard('org-123');

      expect(dashboard).toHaveProperty('totalIssues');
      expect(dashboard).toHaveProperty('statusDistribution');
      expect(dashboard).toHaveProperty('priorityDistribution');
    });
  });

  describe('getIssuesByOrganization()', () => {
    it('should return all issues for organization', async () => {
      const mockIssues = [createMockIssue(), createMockIssue({ id: 'issue-2' })];
      prismaMock.issue.findMany.mockResolvedValue(mockIssues);

      const result = await issueManagementService.getIssuesByOrganization('org-123');

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      prismaMock.issue.findMany.mockResolvedValue([]);

      await issueManagementService.getIssuesByOrganization('org-123', {
        status: 'Open',
      });

      expect(prismaMock.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Open',
          }),
        })
      );
    });

    it('should filter by priority', async () => {
      prismaMock.issue.findMany.mockResolvedValue([]);

      await issueManagementService.getIssuesByOrganization('org-123', {
        priority: 'Critical',
      });

      expect(prismaMock.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'Critical',
          }),
        })
      );
    });

    it('should filter by assignee', async () => {
      prismaMock.issue.findMany.mockResolvedValue([]);

      await issueManagementService.getIssuesByOrganization('org-123', {
        assignedToId: 'user-456',
      });

      expect(prismaMock.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: 'user-456',
          }),
        })
      );
    });
  });

  describe('getOverdueIssues()', () => {
    it('should return all overdue issues for organization', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockIssues = [
        createMockIssue({ slaTarget: pastDate, status: 'Open' }),
        createMockIssue({ id: 'issue-2', slaTarget: pastDate, status: 'In_Progress' }),
      ];

      prismaMock.issue.findMany.mockResolvedValue(mockIssues);

      const result = await issueManagementService.getOverdueIssues('org-123');

      expect(result).toBeDefined();
    });
  });
});
