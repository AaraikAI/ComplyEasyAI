import { Prisma } from '../generated/prisma/client';
import prisma from '../config/database';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { escapeCsvCell } from './csvExport';

/**
 * Canonical, deterministically-serializable fields that define an audit entry.
 * Every value here is persisted on the row, so the hash can be recomputed and
 * verified after the fact.
 */
interface AuditHashInput {
  userId: string | null;
  organizationId: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string; // ISO-8601
  prevHash: string; // hash of the previous entry in this organization's chain
}

/**
 * Produce a stable JSON string with sorted keys so equal inputs always yield an
 * identical digest regardless of property insertion order.
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}

/**
 * Deterministically derive a tamper-evident hash for an audit entry. The digest
 * covers the canonical entry fields and is chained to the previous entry's hash,
 * so the full ledger can be re-verified later (no time/random salt).
 */
function generateAuditHash(input: AuditHashInput): string {
  const content = canonicalize({
    userId: input.userId,
    organizationId: input.organizationId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata ?? null,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    timestamp: input.timestamp,
    prevHash: input.prevHash,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

const GENESIS_HASH = '0'.repeat(64);

/**
 * Fetch the most recent audit entry's hash for an organization to chain the next
 * entry to it. Returns the genesis value when no prior entry exists.
 */
async function getPreviousHash(organizationId: string): Promise<string> {
  const last = await prisma.auditLog.findFirst({
    where: { organizationId },
    orderBy: { timestamp: 'desc' },
    select: { hash: true },
  });
  return last?.hash || GENESIS_HASH;
}

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
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const timestamp = new Date();
      const metadata = params.metadata ?? {};
      const prevHash = await getPreviousHash(params.organizationId);
      const hash = generateAuditHash({
        userId: params.userId,
        organizationId: params.organizationId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        timestamp: timestamp.toISOString(),
        prevHash,
      });

      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          organizationId: params.organizationId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          hash,
          timestamp,
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
      metadata?: Prisma.InputJsonValue;
    }>
  ): Promise<void> {
    try {
      // Seed a per-organization running hash from the last persisted entry so
      // batch entries chain correctly both to the existing ledger and to each
      // other (entries are chained in array order within the batch).
      const orgIds = Array.from(new Set(events.map((e) => e.organizationId)));
      const runningHash = new Map<string, string>();
      await Promise.all(
        orgIds.map(async (orgId) => {
          runningHash.set(orgId, await getPreviousHash(orgId));
        })
      );

      const data = events.map((event) => {
        const timestamp = new Date();
        const metadata = event.metadata ?? {};
        const prevHash = runningHash.get(event.organizationId) || GENESIS_HASH;
        const hash = generateAuditHash({
          userId: event.userId,
          organizationId: event.organizationId,
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metadata,
          ipAddress: null,
          userAgent: null,
          timestamp: timestamp.toISOString(),
          prevHash,
        });
        runningHash.set(event.organizationId, hash);
        return {
          userId: event.userId,
          organizationId: event.organizationId,
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metadata,
          hash,
          timestamp,
        };
      });

      await prisma.auditLog.createMany({ data });

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

      // RFC 4180 quoting + formula-injection neutralization on every cell.
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
        .join('\n');

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
