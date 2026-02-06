import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Create mock audit log methods
const mockAuditLog = {
  create: jest.fn() as jest.Mock<any>,
  createMany: jest.fn() as jest.Mock<any>,
  findMany: jest.fn() as jest.Mock<any>,
  count: jest.fn() as jest.Mock<any>,
  deleteMany: jest.fn() as jest.Mock<any>,
};

// Mock database module directly (not @prisma/client)
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    auditLog: mockAuditLog,
  },
}));

// Mock logger
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import after mocks
import { AuditLogger } from '../../utils/auditLogger';

describe('AuditLogger', () => {
  beforeEach(() => {
    // Re-establish mock implementations cleared by resetMocks: true
    // (individual tests will set mockResolvedValue as needed)
  });

  describe('log', () => {
    it('should create an audit log entry successfully', async () => {
      const mockLogData = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'user.login',
        resourceType: 'User',
        resourceId: 'user-123',
        metadata: { ip: '192.168.1.1' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const mockCreatedLog = {
        id: 'log-123',
        ...mockLogData,
        hash: expect.any(String),
        timestamp: expect.any(Date),
      };

      mockAuditLog.create.mockResolvedValue(mockCreatedLog);

      await AuditLogger.log(mockLogData);

      expect(mockAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockLogData.userId,
          organizationId: mockLogData.organizationId,
          action: mockLogData.action,
          resourceType: mockLogData.resourceType,
          resourceId: mockLogData.resourceId,
          metadata: mockLogData.metadata,
          ipAddress: mockLogData.ipAddress,
          userAgent: mockLogData.userAgent,
          hash: expect.any(String),
          timestamp: expect.any(Date),
        }),
      });
    });

    it('should handle errors gracefully and not throw', async () => {
      const mockLogData = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'user.login',
        resourceType: 'User',
        resourceId: 'user-123',
      };

      mockAuditLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(AuditLogger.log(mockLogData)).resolves.not.toThrow();
    });

    it('should use default empty object for metadata if not provided', async () => {
      const mockLogData = {
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'user.login',
        resourceType: 'User',
        resourceId: 'user-123',
      };

      mockAuditLog.create.mockResolvedValue({});

      await AuditLogger.log(mockLogData);

      expect(mockAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {},
        }),
      });
    });
  });

  describe('logBatch', () => {
    it('should create multiple audit log entries', async () => {
      const mockEvents = [
        {
          userId: 'user-1',
          organizationId: 'org-123',
          action: 'action-1',
          resourceType: 'Resource1',
          resourceId: 'res-1',
        },
        {
          userId: 'user-2',
          organizationId: 'org-123',
          action: 'action-2',
          resourceType: 'Resource2',
          resourceId: 'res-2',
        },
      ];

      mockAuditLog.createMany.mockResolvedValue({ count: 2 });

      await AuditLogger.logBatch(mockEvents);

      expect(mockAuditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            action: 'action-1',
            hash: expect.any(String),
            timestamp: expect.any(Date),
          }),
          expect.objectContaining({
            userId: 'user-2',
            action: 'action-2',
            hash: expect.any(String),
            timestamp: expect.any(Date),
          }),
        ]),
      });
    });
  });

  describe('query', () => {
    it('should query audit logs with filters', async () => {
      const mockLogs = [
        { id: 'log-1', action: 'user.login', userId: 'user-1' },
        { id: 'log-2', action: 'user.logout', userId: 'user-1' },
      ];

      mockAuditLog.findMany.mockResolvedValue(mockLogs);
      mockAuditLog.count.mockResolvedValue(2);

      const filters = {
        organizationId: 'org-123',
        userId: 'user-1',
        action: 'user.login',
        limit: 10,
        offset: 0,
      };

      const result = await AuditLogger.query(filters);

      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
        limit: 10,
        offset: 0,
      });

      expect(mockAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            userId: 'user-1',
            action: 'user.login',
          }),
        })
      );
    });

    it('should apply date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockAuditLog.findMany.mockResolvedValue([]);
      mockAuditLog.count.mockResolvedValue(0);

      await AuditLogger.query({
        organizationId: 'org-123',
        startDate,
        endDate,
      });

      expect(mockAuditLog.findMany).toHaveBeenCalledWith(
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
  });

  describe('cleanup', () => {
    it('should delete old audit logs based on retention period', async () => {
      const retentionDays = 90;
      mockAuditLog.deleteMany.mockResolvedValue({ count: 42 });

      const result = await AuditLogger.cleanup(retentionDays);

      expect(result).toBe(42);
      expect(mockAuditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should filter by organization if provided', async () => {
      mockAuditLog.deleteMany.mockResolvedValue({ count: 10 });

      await AuditLogger.cleanup(90, 'org-123');

      expect(mockAuditLog.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
        }),
      });
    });
  });
});
