import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '../../utils/auditLogger';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    auditLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock logger
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AuditLogger', () => {
  let prisma: any;

  beforeEach(() => {
    // Get the mocked Prisma instance
    prisma = new (PrismaClient as any)();
    jest.clearAllMocks();
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

      prisma.auditLog.create.mockResolvedValue(mockCreatedLog);

      await AuditLogger.log(mockLogData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
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

      prisma.auditLog.create.mockRejectedValue(new Error('Database error'));

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

      prisma.auditLog.create.mockResolvedValue({});

      await AuditLogger.log(mockLogData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
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

      prisma.auditLog.createMany.mockResolvedValue({ count: 2 });

      await AuditLogger.logBatch(mockEvents);

      expect(prisma.auditLog.createMany).toHaveBeenCalledWith({
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

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(2);

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

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
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

      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await AuditLogger.query({
        organizationId: 'org-123',
        startDate,
        endDate,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
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
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 42 });

      const result = await AuditLogger.cleanup(retentionDays);

      expect(result).toBe(42);
      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should filter by organization if provided', async () => {
      prisma.auditLog.deleteMany.mockResolvedValue({ count: 10 });

      await AuditLogger.cleanup(90, 'org-123');

      expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
        }),
      });
    });
  });
});
