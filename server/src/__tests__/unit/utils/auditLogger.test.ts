/**
 * AuditLogger Unit Tests
 * Tests for the centralized audit logging system
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockAuditLog, createMockUser } from '../../mocks/prisma';

// Mock the database - MUST be before importing modules that use it
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock the logger
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import { AuditLogger } from '../../../utils/auditLogger';
import logger from '../../../config/logger';

describe('AuditLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('log()', () => {
    it('should create an audit log entry successfully', async () => {
      const mockLog = createMockAuditLog();
      prismaMock.auditLog.create.mockResolvedValue(mockLog);

      await AuditLogger.log({
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'user.login',
        resourceType: 'User',
        resourceId: 'user-123',
      });

      expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          organizationId: 'org-123',
          action: 'user.login',
          resourceType: 'User',
          resourceId: 'user-123',
          hash: expect.any(String),
          timestamp: expect.any(Date),
        }),
      });
      expect(logger.info).toHaveBeenCalledWith('Audit Log', expect.any(Object));
    });

    it('should include optional metadata in audit log', async () => {
      const mockLog = createMockAuditLog({ metadata: { key: 'value' } });
      prismaMock.auditLog.create.mockResolvedValue(mockLog);

      await AuditLogger.log({
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'data.export',
        resourceType: 'Report',
        resourceId: 'report-123',
        metadata: { format: 'csv', records: 100 },
      });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { format: 'csv', records: 100 },
        }),
      });
    });

    it('should include IP address and user agent when provided', async () => {
      const mockLog = createMockAuditLog();
      prismaMock.auditLog.create.mockResolvedValue(mockLog);

      await AuditLogger.log({
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'user.login',
        resourceType: 'User',
        resourceId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('should handle database errors gracefully', async () => {
      prismaMock.auditLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        AuditLogger.log({
          userId: 'user-123',
          organizationId: 'org-123',
          action: 'test.action',
          resourceType: 'Test',
          resourceId: 'test-123',
        })
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create audit log entry',
        expect.any(Object)
      );
    });

    it('should generate unique hashes for different entries', async () => {
      const hashes: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.auditLog.create.mockImplementation(async ({ data }: { data: any }) => {
        hashes.push(data.hash);
        return createMockAuditLog({ hash: data.hash });
      });

      await AuditLogger.log({
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'action.one',
        resourceType: 'Test',
        resourceId: 'test-1',
      });

      await AuditLogger.log({
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'action.two',
        resourceType: 'Test',
        resourceId: 'test-2',
      });

      expect(hashes[0]).not.toBe(hashes[1]);
    });
  });

  describe('logBatch()', () => {
    it('should create multiple audit log entries in batch', async () => {
      prismaMock.auditLog.createMany.mockResolvedValue({ count: 3 });

      const events = [
        {
          userId: 'user-1',
          organizationId: 'org-123',
          action: 'bulk.action',
          resourceType: 'Item',
          resourceId: 'item-1',
        },
        {
          userId: 'user-1',
          organizationId: 'org-123',
          action: 'bulk.action',
          resourceType: 'Item',
          resourceId: 'item-2',
        },
        {
          userId: 'user-1',
          organizationId: 'org-123',
          action: 'bulk.action',
          resourceType: 'Item',
          resourceId: 'item-3',
        },
      ];

      await AuditLogger.logBatch(events);

      expect(prismaMock.auditLog.createMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.auditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            action: 'bulk.action',
            hash: expect.any(String),
          }),
        ]),
      });
      expect(logger.info).toHaveBeenCalledWith('Batch audit log: 3 events');
    });

    it('should handle batch errors gracefully', async () => {
      prismaMock.auditLog.createMany.mockRejectedValue(new Error('Batch error'));

      await expect(
        AuditLogger.logBatch([
          {
            userId: 'user-1',
            organizationId: 'org-123',
            action: 'test',
            resourceType: 'Test',
            resourceId: 'test-1',
          },
        ])
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('query()', () => {
    it('should query audit logs with filters', async () => {
      const mockLogs = [createMockAuditLog(), createMockAuditLog()];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);
      prismaMock.auditLog.count.mockResolvedValue(2);

      const result = await AuditLogger.query({
        organizationId: 'org-123',
        userId: 'user-123',
        action: 'user.login',
      });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            userId: 'user-123',
            action: 'user.login',
          }),
        })
      );
    });

    it('should support date range filtering', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.auditLog.count.mockResolvedValue(0);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      await AuditLogger.query({
        organizationId: 'org-123',
        startDate,
        endDate,
      });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should support pagination', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.auditLog.count.mockResolvedValue(100);

      const result = await AuditLogger.query({
        organizationId: 'org-123',
        limit: 20,
        offset: 40,
      });

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        })
      );
    });
  });

  describe('getStatistics()', () => {
    it('should calculate audit log statistics', async () => {
      const mockLogs = [
        { action: 'user.login', resourceType: 'User', userId: 'user-1', timestamp: new Date() },
        { action: 'user.login', resourceType: 'User', userId: 'user-2', timestamp: new Date() },
        { action: 'data.export', resourceType: 'Report', userId: 'user-1', timestamp: new Date() },
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const stats = await AuditLogger.getStatistics('org-123');

      expect(stats.totalEvents).toBe(3);
      expect(stats.actionBreakdown['user.login']).toBe(2);
      expect(stats.actionBreakdown['data.export']).toBe(1);
      expect(stats.resourceTypeBreakdown['User']).toBe(2);
      expect(stats.resourceTypeBreakdown['Report']).toBe(1);
    });

    it('should support time range for statistics', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);

      const timeRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-12-31'),
      };

      await AuditLogger.getStatistics('org-123', timeRange);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: timeRange.start,
              lte: timeRange.end,
            },
          }),
        })
      );
    });

    it('should handle null userId and resourceType', async () => {
      const mockLogs = [
        { action: 'system.startup', resourceType: null, userId: null, timestamp: new Date() },
        { action: 'user.login', resourceType: 'User', userId: 'user-1', timestamp: new Date() },
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const stats = await AuditLogger.getStatistics('org-123');

      expect(stats.totalEvents).toBe(2);
      expect(stats.actionBreakdown['system.startup']).toBe(1);
      expect(stats.resourceTypeBreakdown['User']).toBe(1);
    });
  });

  describe('cleanup()', () => {
    it('should delete old audit logs based on retention period', async () => {
      prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 50 });

      const deletedCount = await AuditLogger.cleanup(90); // 90 days retention

      expect(deletedCount).toBe(50);
      expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          timestamp: { lt: expect.any(Date) },
        }),
      });
    });

    it('should support organization-specific cleanup', async () => {
      prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 10 });

      await AuditLogger.cleanup(30, 'org-123');

      expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
        }),
      });
    });
  });

  describe('export()', () => {
    it('should export audit logs as JSON', async () => {
      const mockLogs = [
        createMockAuditLog({ user: createMockUser() }),
        createMockAuditLog({ user: createMockUser() }),
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await AuditLogger.export({
        organizationId: 'org-123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        format: 'json',
      });

      expect(result.format).toBe('json');
      expect(result.count).toBe(2);
      expect(result.data).toEqual(mockLogs);
    });

    it('should export audit logs as CSV', async () => {
      const mockLogs = [
        {
          ...createMockAuditLog(),
          user: createMockUser(),
        },
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await AuditLogger.export({
        organizationId: 'org-123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        format: 'csv',
      });

      expect(result.format).toBe('csv');
      expect(result.count).toBe(1);
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('Timestamp');
      expect(result.data).toContain('User ID');
    });

    it('should handle missing user data in CSV export', async () => {
      const mockLogs = [
        {
          ...createMockAuditLog(),
          user: null,
          userId: null,
          resourceType: null,
          resourceId: null,
        },
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await AuditLogger.export({
        organizationId: 'org-123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        format: 'csv',
      });

      expect(result.format).toBe('csv');
      // Should not throw and should contain empty values
      expect(result.data).toBeDefined();
    });
  });
});
