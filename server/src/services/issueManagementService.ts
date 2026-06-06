import { IssueStatus, IssuePriority } from '../generated/prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';


/**
 * Issue & Remediation Workflow Service
 * SLA tracking, notifications, task assignment, and resolution tracking
 */
export class IssueManagementService {
  /**
   * Create issue
   */
  async createIssue(data: {
    organizationId: string;
    title: string;
    description: string;
    issueType: string;
    category?: string;
    priority: IssuePriority;
    assignedToId?: string;
    createdById: string;
    dueDate?: Date;
    slaTarget?: Date;
    remediationPlan?: string;
    remediationSteps?: any;
    tags?: any;
  }) {
    // Calculate SLA status
    const slaStatus = this.calculateSLAStatus(data.slaTarget ?? null);

    // Verify creator and assignee belong to the same organization
    const creator = await prisma.user.findFirst({
      where: { id: data.createdById, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!creator) {
      throw new AppError('User not found in organization', 400);
    }

    if (data.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: data.assignedToId, organizationId: data.organizationId },
        select: { id: true },
      });
      if (!assignee) {
        throw new AppError('Assignee not found in organization', 400);
      }
    }

    const issue = await prisma.issue.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        issueType: data.issueType,
        category: data.category,
        priority: data.priority,
        status: 'Open',
        assignedToId: data.assignedToId,
        createdById: data.createdById,
        dueDate: data.dueDate,
        slaTarget: data.slaTarget,
        slaStatus,
        remediationPlan: data.remediationPlan,
        remediationSteps: data.remediationSteps,
        tags: data.tags || {},
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    await AuditLogger.log({
      userId: data.createdById,
      organizationId: data.organizationId,
      action: 'issue.created',
      resourceType: 'Issue',
      resourceId: issue.id,
      metadata: {
        title: data.title,
        priority: data.priority,
        assignedTo: data.assignedToId,
      },
    });

    // Send notification to assignee
    if (data.assignedToId) {
      await this.sendNotification(
        data.assignedToId,
        `You have been assigned issue: ${data.title}`,
        issue.id,
        data.organizationId
      );
    }

    return issue;
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(
    issueId: string,
    status: IssueStatus,
    userId: string,
    organizationId: string
  ) {
    const issue = await prisma.issue.findFirst({
      where: { id: issueId, organizationId },
    });

    if (!issue) {
      throw new AppError('Issue not found', 404);
    }

    const updateData: any = { status };

    // Set resolved/closed dates
    if (status === 'Resolved' && issue.status !== 'Resolved') {
      updateData.resolvedDate = new Date();
    }

    if (status === 'Closed' && issue.status !== 'Closed') {
      updateData.closedDate = new Date();
    }

    // Reopen issue
    if (status === 'Reopened') {
      updateData.resolvedDate = null;
      updateData.closedDate = null;
    }

    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'issue.status_updated',
      resourceType: 'Issue',
      resourceId: issueId,
      metadata: {
        oldStatus: issue.status,
        newStatus: status,
      },
    });

    return updated;
  }

  /**
   * Assign issue
   */
  async assignIssue(
    issueId: string,
    assignedToId: string,
    userId: string,
    organizationId: string
  ) {
    const existing = await prisma.issue.findFirst({
      where: { id: issueId, organizationId },
    });
    if (!existing) {
      throw new AppError('Issue not found', 404);
    }

    // Verify the assignee belongs to the caller's organization
    const assignee = await prisma.user.findFirst({
      where: { id: assignedToId, organizationId },
      select: { id: true },
    });
    if (!assignee) {
      throw new AppError('Assignee not found in organization', 400);
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        assignedToId,
        status: 'In_Progress',
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'issue.assigned',
      resourceType: 'Issue',
      resourceId: issueId,
      metadata: { assignedTo: assignedToId },
    });

    // Send notification
    await this.sendNotification(
      assignedToId,
      `You have been assigned issue: ${issue.title}`,
      issue.id,
      organizationId
    );

    return issue;
  }

  /**
   * Add comment to issue
   */
  async addComment(
    issueId: string,
    data: {
      content: string;
      userId: string;
    },
    organizationId: string
  ) {
    // Verify the parent issue belongs to the caller's organization
    const issue = await prisma.issue.findFirst({
      where: { id: issueId, organizationId },
      include: { assignedTo: true, createdBy: true },
    });
    if (!issue) {
      throw new AppError('Issue not found', 404);
    }

    const comment = await prisma.issueComment.create({
      data: {
        issueId,
        comment: data.content,
        author: data.userId,
      },
    });

    if (issue) {
      // Notify assignee and creator
      const notifyUsers = [issue.assignedToId, issue.createdById].filter(
        (id) => id && id !== data.userId
      );

      for (const notifyUserId of notifyUsers) {
        if (notifyUserId) {
          await this.sendNotification(
            notifyUserId,
            `New comment on issue: ${issue.title}`,
            issue.id,
            organizationId
          );
        }
      }
    }

    await AuditLogger.log({
      userId: data.userId,
      organizationId,
      action: 'issue.comment_added',
      resourceType: 'Issue',
      resourceId: issueId,
      metadata: { commentId: comment.id },
    });

    return comment;
  }

  /**
   * Update remediation plan
   */
  async updateRemediationPlan(
    issueId: string,
    data: {
      remediationPlan: string;
      remediationSteps: any;
      dueDate?: Date;
    },
    userId: string,
    organizationId: string
  ) {
    // Verify org ownership before mutating
    const existing = await prisma.issue.findFirst({
      where: { id: issueId, organizationId },
    });
    if (!existing) {
      throw new AppError('Issue not found', 404);
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        remediationPlan: data.remediationPlan,
        remediationSteps: data.remediationSteps,
        dueDate: data.dueDate,
      },
      include: {
        assignedTo: true,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'issue.remediation_plan_updated',
      resourceType: 'Issue',
      resourceId: issueId,
      metadata: { dueDate: data.dueDate },
    });

    return issue;
  }

  /**
   * Get issues by organization
   */
  async getIssuesByOrganization(
    organizationId: string,
    filters?: {
      status?: IssueStatus;
      priority?: IssuePriority;
      issueType?: string;
      assignedToId?: string;
    }
  ) {
    return await prisma.issue.findMany({
      where: {
        organizationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.issueType && { issueType: filters.issueType }),
        ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      },
      include: {
        assignedTo: true,
        createdBy: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get issue dashboard
   */
  async getIssueDashboard(organizationId: string) {
    const issues = await prisma.issue.findMany({
      where: { organizationId },
      include: {
        assignedTo: true,
        comments: true,
      },
    });

    const now = new Date();

    return {
      totalIssues: issues.length,
      statusDistribution: {
        open: issues.filter((i) => i.status === 'Open').length,
        inProgress: issues.filter((i) => i.status === 'In_Progress').length,
        resolved: issues.filter((i) => i.status === 'Resolved').length,
        closed: issues.filter((i) => i.status === 'Closed').length,
        reopened: issues.filter((i) => i.status === 'Reopened').length,
      },
      priorityDistribution: {
        critical: issues.filter((i) => i.priority === 'Critical').length,
        high: issues.filter((i) => i.priority === 'High').length,
        medium: issues.filter((i) => i.priority === 'Medium').length,
        low: issues.filter((i) => i.priority === 'Low').length,
      },
      typeDistribution: this.getTypeDistribution(issues),
      slaMetrics: {
        onTrack: issues.filter((i) => i.slaStatus === 'On_Track').length,
        atRisk: issues.filter((i) => i.slaStatus === 'At_Risk').length,
        breached: issues.filter((i) => i.slaStatus === 'Breached').length,
      },
      overdueIssues: issues.filter(
        (i) => i.dueDate && i.dueDate < now && i.status !== 'Closed'
      ).length,
      unassignedIssues: issues.filter((i) => !i.assignedToId).length,
      averageResolutionTime: this.calculateAverageResolutionTime(issues),
      issuesByAssignee: this.groupByAssignee(issues),
      criticalIssues: issues
        .filter((i) => i.priority === 'Critical' && i.status !== 'Closed')
        .map((i) => ({
          id: i.id,
          title: i.title,
          priority: i.priority,
          status: i.status,
          assignedTo: i.assignedTo?.name,
          slaStatus: i.slaStatus,
        })),
    };
  }

  /**
   * Update SLA status for all issues
   */
  async updateSLAStatuses(organizationId: string) {
    const issues = await prisma.issue.findMany({
      where: {
        organizationId,
        status: { notIn: ['Resolved', 'Closed'] },
        slaTarget: { not: null },
      },
    });

    const updates = await Promise.all(
      issues.map(async (issue) => {
        const newSLAStatus = this.calculateSLAStatus(issue.slaTarget!);

        if (newSLAStatus !== issue.slaStatus) {
          return await prisma.issue.update({
            where: { id: issue.id },
            data: { slaStatus: newSLAStatus },
          });
        }

        return issue;
      })
    );

    return updates;
  }

  /**
   * Get overdue issues
   */
  async getOverdueIssues(organizationId: string) {
    const now = new Date();

    return await prisma.issue.findMany({
      where: {
        organizationId,
        status: { notIn: ['Resolved', 'Closed'] },
        OR: [
          { dueDate: { lt: now } },
          { slaTarget: { lt: now } },
        ],
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Private helper: Calculate SLA status
   */
  private calculateSLAStatus(slaTarget: Date | null): string {
    if (!slaTarget) return 'On_Track';

    const now = new Date();
    const timeRemaining = slaTarget.getTime() - now.getTime();
    const daysRemaining = timeRemaining / (24 * 60 * 60 * 1000);

    if (timeRemaining < 0) return 'Breached';
    if (daysRemaining < 2) return 'At_Risk';
    return 'On_Track';
  }

  /**
   * Private helper: Send notification
   */
  private async sendNotification(
    userId: string,
    message: string,
    issueId: string,
    organizationId: string
  ) {
    // Use real notification service
    const notificationService = (await import('./notificationService')).default;
    
    await notificationService.sendNotification(userId, organizationId, {
      type: 'info',
      category: 'issue',
      title: 'Issue Assigned',
      message,
      templateId: 'issue_assigned',
      link: `/issues/${issueId}`,
      metadata: { issueId },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'notification.sent',
      resourceType: 'Issue',
      resourceId: issueId,
      metadata: { message },
    });
  }

  /**
   * Private helper: Get type distribution
   */
  private getTypeDistribution(issues: any[]) {
    const distribution: Record<string, number> = {};
    issues.forEach((issue) => {
      const type = issue.issueType || 'Other';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Private helper: Calculate average resolution time
   */
  private calculateAverageResolutionTime(issues: any[]): number {
    const resolved = issues.filter(
      (i) => i.status === 'Resolved' && i.resolvedDate
    );

    if (resolved.length === 0) return 0;

    const totalDays = resolved.reduce((sum, issue) => {
      const days =
        (issue.resolvedDate.getTime() - issue.createdAt.getTime()) /
        (24 * 60 * 60 * 1000);
      return sum + days;
    }, 0);

    return Math.round(totalDays / resolved.length);
  }

  /**
   * Private helper: Group by assignee
   */
  private groupByAssignee(issues: any[]) {
    const grouped: Record<string, any> = {};

    issues.forEach((issue) => {
      const assignee = issue.assignedTo?.name || 'Unassigned';

      if (!grouped[assignee]) {
        grouped[assignee] = {
          assignee,
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
        };
      }

      grouped[assignee].total++;

      if (issue.status === 'Open') grouped[assignee].open++;
      else if (issue.status === 'In_Progress') grouped[assignee].inProgress++;
      else if (issue.status === 'Resolved') grouped[assignee].resolved++;
    });

    return Object.values(grouped);
  }
}

export default new IssueManagementService();
