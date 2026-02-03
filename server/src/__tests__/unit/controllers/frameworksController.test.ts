/**
 * Frameworks Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import frameworksController from '../../../controllers/frameworksController';
import { AppError } from '../../../middleware/errorHandler';

describe('FrameworksController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  describe('list()', () => {
    it('should list frameworks for organization', async () => {
      const mockFrameworks = [
        { id: 'framework-1', name: 'SOC 2', organizationId: 'org-123' },
        { id: 'framework-2', name: 'ISO 27001', organizationId: 'org-123' },
      ];

      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue(mockFrameworks as any);

      await frameworksController.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockFrameworks);
      expect(prismaMock.complianceFramework.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });
  });

  describe('getById()', () => {
    it('should get framework by ID', async () => {
      const frameworkId = 'framework-123';
      mockRequest.params = { id: frameworkId };

      const mockFramework = {
        id: frameworkId,
        name: 'SOC 2',
        organizationId: 'org-123',
        controls: [],
      };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);

      await frameworksController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockFramework);
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { id: 'invalid-id' };
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.getById(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('create()', () => {
    it('should create framework', async () => {
      mockRequest.body = {
        name: 'SOC 2',
        region: 'US',
        nextAuditDate: '2025-12-31',
      };

      const mockFramework = {
        id: 'framework-123',
        ...mockRequest.body,
        organizationId: 'org-123',
      };

      (prismaMock.complianceFramework.create as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if required fields missing', async () => {
      mockRequest.body = { name: 'SOC 2' };

      await expect(
        frameworksController.create(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('update()', () => {
    it('should update framework', async () => {
      const frameworkId = 'framework-123';
      mockRequest.params = { id: frameworkId };
      mockRequest.body = { name: 'Updated Framework' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue({
        id: frameworkId,
        organizationId: 'org-123',
      } as any);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue({
        id: frameworkId,
        ...mockRequest.body,
      } as any);

      await frameworksController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
