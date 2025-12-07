import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Centralized Audit Logging System
 * Tracks all critical actions across the enterprise platform
 */
export class AuditLogger {
  /**
   * Log an audit event to the database
   * @param params - Audit log parameters
   */
  static async log(params: {
    userId: string;
    organizationId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          organizationId: params.organizationId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          hash: uuidv4(),
          timestamp: new Date(),
        },
      });

      // Also log to Winston for real-time monitoring
      logger.info('Audit Log', {
        userId: params.userId,
        organizationId: params.organizationId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      });
    } catch (error) {
      // Don't throw errors from audit logging - log and continue
      logger.error('Failed to create audit log entry', {
        error,
        params,
      });
    }
  }

  /**
   * Log multiple audit events in batch
   * @param events - Array of audit log parameters
   */
  static async logBatch(
    events: Array<{
      userId: string;
      organizationId: string;
      action: string;
      resourceType: string;
      resourceId: string;
      metadata?: any;
    }>
  ): Promise<void> {
    try {
      await prisma.auditLog.createMany({
        data: events.map((event) => ({
          userId: event.userId,
          organizationId: event.organizationId,
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metadata: event.metadata || {},
          hash: uuidv4(),
          timestamp: new Date(),
        })),
      });

      logger.info(`Batch audit log: ${events.length} events`);
    } catch (error) {
      logger.error('Failed to create batch audit log entries', {
        error,
        count: events.length,
      });
    }
  }

  /**
   * Query audit logs with filters
   * @param filters - Query filters
   */
  static async query(filters: {
    organizationId: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      organizationId: filters.organizationId,
    };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get audit log statistics
   * @param organizationId - Organization ID
   * @param timeRange - Time range for statistics
   */
  static async getStatistics(
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ) {
    const where: any = { organizationId };

    if (timeRange) {
      where.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      select: {
        action: true,
        resourceType: true,
        userId: true,
        timestamp: true,
      },
    });

    // Calculate statistics
    const actionCounts: Record<string, number> = {};
    const resourceTypeCounts: Record<string, number> = {};
    const userActivityCounts: Record<string, number> = {};

    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      if (log.resourceType) {
        resourceTypeCounts[log.resourceType] =
          (resourceTypeCounts[log.resourceType] || 0) + 1;
      }
      if (log.userId) {
        userActivityCounts[log.userId] =
          (userActivityCounts[log.userId] || 0) + 1;
      }
    });

    return {
      totalEvents: logs.length,
      actionBreakdown: actionCounts,
      resourceTypeBreakdown: resourceTypeCounts,
      topUsers: Object.entries(userActivityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count })),
      timeRange: timeRange || {
        start: logs[logs.length - 1]?.timestamp,
        end: logs[0]?.timestamp,
      },
    };
  }

  /**
   * Delete old audit logs (data retention)
   * @param retentionDays - Number of days to retain logs
   * @param organizationId - Optional organization ID
   */
  static async cleanup(retentionDays: number, organizationId?: string) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const where: any = {
      timestamp: { lt: cutoffDate },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const result = await prisma.auditLog.deleteMany({ where });

    logger.info(`Audit log cleanup: deleted ${result.count} old entries`, {
      retentionDays,
      cutoffDate,
      organizationId,
    });

    return result.count;
  }

  /**
   * Export audit logs for compliance reporting
   * @param filters - Export filters
   */
  static async export(filters: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
    format?: 'json' | 'csv';
  }) {
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: filters.organizationId,
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (filters.format === 'csv') {
      // Convert to CSV format
      const headers = [
        'Timestamp',
        'User ID',
        'User Name',
        'User Email',
        'Action',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'Metadata',
      ];

      const rows = logs.map((log) => [
        log.timestamp.toISOString(),
        log.userId || '',
        log.user?.name || '',
        log.user?.email || '',
        log.action,
        log.resourceType || '',
        log.resourceId || '',
        log.ipAddress || '',
        JSON.stringify(log.metadata),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      return {
        format: 'csv',
        data: csv,
        count: logs.length,
      };
    }

    // Default: JSON format
    return {
      format: 'json',
      data: logs,
      count: logs.length,
      startDate: filters.startDate,
      endDate: filters.endDate,
    };
  }
}

export default AuditLogger;
