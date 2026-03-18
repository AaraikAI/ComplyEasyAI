/**
 * Issue Management Service Contract Tests
 *
 * Verifies the contract for issue CRUD, SLA tracking, status transitions,
 * and notification sending.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockIssue } from '../../mocks/prisma';

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

import issueManagementService from '../../../services/issueManagementService';

describe('IssueManagementService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createIssue
  // ---------------------------------------------------------------------------
  describe('createIssue', () => {
    it('should call prisma.issue.create with correct shape', async () => {
      const mockIssue = createMockIssue({ id: 'issue-new' });
      prismaMock.issue.create.mockResolvedValue(mockIssue);
      // Notification mock
      prismaMock.notification.create.mockResolvedValue({ id: 'notif-1' });

      await issueManagementService.createIssue({
        organizationId: 'org-123',
        title: 'Security Vulnerability',
        description: 'Critical vulnerability found',
        issueType: 'Bug',
        priority: 'Critical' as any,
        createdById: 'user-1',
        assignedToId: 'user-2',
      });

      expect(prismaMock.issue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          title: 'Security Vulnerability',
          description: 'Critical vulnerability found',
          issueType: 'Bug',
          priority: 'Critical',
          status: 'Open',
          createdById: 'user-1',
          assignedToId: 'user-2',
        }),
        include: {
          assignedTo: true,
          createdBy: true,
        },
      });
    });

    it('should default status to Open', async () => {
      prismaMock.issue.create.mockResolvedValue(createMockIssue());

      await issueManagementService.createIssue({
        organizationId: 'org-123',
        title: 'Issue',
        description: 'Description',
        issueType: 'Task',
        priority: 'Medium' as any,
        createdById: 'user-1',
      });

      expect(prismaMock.issue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'Open',
        }),
        include: expect.any(Object),
      });
    });

    it('should send notification when assignee is specified', async () => {
      prismaMock.issue.create.mockResolvedValue(createMockIssue());
      prismaMock.notification.create.mockResolvedValue({ id: 'notif-1' });

      await issueManagementService.createIssue({
        organizationId: 'org-123',
        title: 'Assigned Issue',
        description: 'Desc',
        issueType: 'Task',
        priority: 'High' as any,
        createdById: 'user-1',
        assignedToId: 'user-2',
      });

      // Should create notification for assignee
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      prismaMock.issue.create.mockRejectedValue(new Error('Foreign key violation'));

      await expect(
        issueManagementService.createIssue({
          organizationId: 'org-123',
          title: 'Issue',
          description: 'Desc',
          issueType: 'Bug',
          priority: 'Low' as any,
          createdById: 'user-1',
        })
      ).rejects.toThrow('Foreign key violation');
    });
  });

  // ---------------------------------------------------------------------------
  // updateIssueStatus
  // ---------------------------------------------------------------------------
  describe('updateIssueStatus', () => {
    it('should find issue first then update', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(createMockIssue({ status: 'Open' }));
      prismaMock.issue.update.mockResolvedValue(
        createMockIssue({ status: 'In_Progress' })
      );

      await issueManagementService.updateIssueStatus(
        'issue-123',
        'In_Progress' as any,
        'user-1',
        'org-123'
      );

      expect(prismaMock.issue.findUnique).toHaveBeenCalledWith({
        where: { id: 'issue-123' },
      });
      expect(prismaMock.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'issue-123' },
          data: expect.objectContaining({
            status: 'In_Progress',
          }),
        })
      );
    });

    it('should set resolvedDate when status is Resolved', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(createMockIssue({ status: 'Open' }));
      prismaMock.issue.update.mockResolvedValue(createMockIssue({ status: 'Resolved' }));

      await issueManagementService.updateIssueStatus(
        'issue-123',
        'Resolved' as any,
        'user-1',
        'org-123'
      );

      expect(prismaMock.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Resolved',
            resolvedDate: expect.any(Date),
          }),
        })
      );
    });

    it('should set closedDate when status is Closed', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(createMockIssue({ status: 'Resolved' }));
      prismaMock.issue.update.mockResolvedValue(createMockIssue({ status: 'Closed' }));

      await issueManagementService.updateIssueStatus(
        'issue-123',
        'Closed' as any,
        'user-1',
        'org-123'
      );

      expect(prismaMock.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Closed',
            closedDate: expect.any(Date),
          }),
        })
      );
    });

    it('should clear dates when reopened', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(
        createMockIssue({ status: 'Closed' })
      );
      prismaMock.issue.update.mockResolvedValue(createMockIssue({ status: 'Reopened' }));

      await issueManagementService.updateIssueStatus(
        'issue-123',
        'Reopened' as any,
        'user-1',
        'org-123'
      );

      expect(prismaMock.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Reopened',
            resolvedDate: null,
            closedDate: null,
          }),
        })
      );
    });

    it('should throw when issue not found', async () => {
      prismaMock.issue.findUnique.mockResolvedValue(null);

      await expect(
        issueManagementService.updateIssueStatus(
          'nonexistent',
          'Closed' as any,
          'user-1',
          'org-123'
        )
      ).rejects.toThrow('Issue not found');
    });
  });
});
