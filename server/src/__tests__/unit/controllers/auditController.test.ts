/**
 * Audit Controller Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock uuid
const mockUuidv4 = jest.fn<any>();
jest.mock('uuid', () => ({
  v4: mockUuidv4,
}));

// Mock blockchain service
const mockRecordAuditLog = jest.fn<any>();
jest.mock('../../../services/advanced/blockchainService', () => ({
  __esModule: true,
  default: {
    recordAuditLog: mockRecordAuditLog,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import auditController from '../../../controllers/auditController';
import { AppError } from '../../../middleware/errorHandler';

describe('AuditController', () => {
  let mockReq: any;
  let mockRes: any;
  const mockNext: NextFunction = jest.fn() as any;

  beforeEach(() => {
    mockUuidv4.mockReturnValue('test-uuid-1234');

    mockReq = {
      user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  // ============================================================================
  // list
  // ============================================================================

  describe('list', () => {
    it('should return paginated audit logs with default parameters', async () => {
      const logs = [
        { id: 'log-1', action: 'user.login', user: { id: 'user-1', name: 'Test', email: 'test@test.com' } },
        { id: 'log-2', action: 'user.logout', user: { id: 'user-1', name: 'Test', email: 'test@test.com' } },
      ];

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue(logs);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(2);

      await auditController.list(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
          orderBy: { timestamp: 'desc' },
          take: 100,
          skip: 0,
        })
      );
      expect(prismaMock.auditLog.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        logs,
        total: 2,
        limit: 100,
        offset: 0,
      });
    });

    it('should apply custom pagination parameters', async () => {
      mockReq.query = { limit: '25', offset: '50' };

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);

      await auditController.list(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 50,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        logs: [],
        total: 0,
        limit: 25,
        offset: 50,
      });
    });

    it('should filter by action', async () => {
      mockReq.query = { action: 'user.login' };

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);

      await auditController.list(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            action: { contains: 'user.login', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should filter by userId', async () => {
      mockReq.query = { userId: 'user-2' };

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);

      await auditController.list(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            userId: 'user-2',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      mockReq.query = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);

      await auditController.list(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: new Date('2025-01-01T00:00:00Z'),
              lte: new Date('2025-12-31T23:59:59Z'),
            },
          }),
        })
      );
    });

    it('should filter by startDate only', async () => {
      mockReq.query = { startDate: '2025-06-01T00:00:00Z' };

      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);

      await auditController.list(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: new Date('2025-06-01T00:00:00Z'),
            },
          }),
        })
      );
    });

    it('should re-throw AppError from prisma', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockRejectedValue(
        new AppError('Forbidden', 403)
      );

      await expect(
        auditController.list(mockReq, mockRes, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 500 AppError on generic error', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockRejectedValue(
        new Error('Connection lost')
      );

      await expect(
        auditController.list(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to fetch audit logs');
    });
  });

  // ============================================================================
  // log
  // ============================================================================

  describe('log', () => {
    it('should create an audit log entry and return 201', async () => {
      mockReq.body = { action: 'user.login', details: 'Logged in from Chrome' };

      const createdLog = {
        id: 'log-1',
        action: 'user.login',
        userId: 'user-1',
        organizationId: 'org-1',
        details: 'Logged in from Chrome',
        hash: 'test-uuid-1234',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'user.login',
            userId: 'user-1',
            organizationId: 'org-1',
            details: 'Logged in from Chrome',
            hash: 'test-uuid-1234',
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdLog);
    });

    it('should include user name in action string when provided', async () => {
      mockReq.body = { action: 'framework.create', user: 'John Doe', details: null };

      const createdLog = {
        id: 'log-2',
        action: 'framework.create (by John Doe)',
        userId: 'user-1',
        organizationId: 'org-1',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'framework.create (by John Doe)',
          }),
        })
      );
    });

    it('should not include user name when it is "User"', async () => {
      mockReq.body = { action: 'risk.update', user: 'User' };

      const createdLog = {
        id: 'log-3',
        action: 'risk.update',
        userId: 'user-1',
        organizationId: 'org-1',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'risk.update',
          }),
        })
      );
    });

    it('should stringify object details', async () => {
      mockReq.body = { action: 'test.action', details: { key: 'value' } };

      const createdLog = {
        id: 'log-4',
        action: 'test.action',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: JSON.stringify({ key: 'value' }),
          }),
        })
      );
    });

    it('should throw AppError when action is missing', async () => {
      mockReq.body = {};

      await expect(
        auditController.log(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Action is required');
    });

    it('should submit critical actions to blockchain', async () => {
      mockReq.body = { action: 'user.delete', details: 'Deleted user account' };

      const createdLog = {
        id: 'log-5',
        action: 'user.delete',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      const blockchainRecord = {
        transactionHash: '0xabc123',
        network: 'polygon',
        blockNumber: 12345,
        verified: true,
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);
      mockRecordAuditLog.mockResolvedValue(blockchainRecord);
      (prismaMock.auditLog.update as jest.Mock<any>).mockResolvedValue({});

      await auditController.log(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRecordAuditLog).toHaveBeenCalledWith(
        'org-1',
        'user.delete',
        { logId: 'log-5', details: 'Deleted user account' },
        'polygon'
      );
    });

    it('should not submit non-critical actions to blockchain', async () => {
      mockReq.body = { action: 'user.login', details: 'Logged in' };

      const createdLog = {
        id: 'log-6',
        action: 'user.login',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(mockRecordAuditLog).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should convert non-string action to string', async () => {
      mockReq.body = { action: 123 };

      const createdLog = {
        id: 'log-7',
        action: '123',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: '123',
          }),
        })
      );
    });

    it('should re-throw AppError from prisma', async () => {
      mockReq.body = { action: 'test' };
      (prismaMock.auditLog.create as jest.Mock<any>).mockRejectedValue(
        new AppError('Conflict', 409)
      );

      await expect(
        auditController.log(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Conflict');
    });

    it('should throw 500 AppError on generic database error', async () => {
      mockReq.body = { action: 'test' };
      (prismaMock.auditLog.create as jest.Mock<any>).mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(
        auditController.log(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to create audit log: Connection refused');
    });

    it('should handle null details gracefully', async () => {
      mockReq.body = { action: 'test.action' };

      const createdLog = {
        id: 'log-8',
        action: 'test.action',
        metadata: null,
        user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue(createdLog);

      await auditController.log(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: null,
          }),
        })
      );
    });
  });
});
