/**
 * Frameworks Controller Contract Tests
 *
 * Validates the contract for framework CRUD, control management, and
 * framework-level operations.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../services/euRegulations/controlTemplatesService', () => ({
  __esModule: true,
  default: {
    getTemplatesForFramework: jest.fn<any>().mockReturnValue([]),
  },
}));

import frameworksController from '../../../controllers/frameworksController';
import { AppError } from '../../../middleware/errorHandler';

const createMockFramework = (overrides = {}) => ({
  id: 'fw-123',
  name: 'SOC 2 Type II',
  status: 'In_Progress',
  progress: 45,
  organizationId: 'org-123',
  nextAuditDate: new Date(),
  controls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockControl = (overrides = {}) => ({
  id: 'ctrl-123',
  name: 'CC1.1',
  description: 'Control Environment',
  status: 'Implemented',
  evidence: null,
  frameworkId: 'fw-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('FrameworksController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      headers: {},
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // list
  // ===========================================================================
  describe('list()', () => {
    it('should list frameworks filtered by organizationId', async () => {
      const frameworks = [createMockFramework(), createMockFramework({ id: 'fw-456', name: 'GDPR' })];
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue(frameworks as never);

      await frameworksController.list(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.complianceFramework.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(frameworks);
    });
  });

  // ===========================================================================
  // getById
  // ===========================================================================
  describe('getById()', () => {
    it('should return framework by id with multi-tenancy check', async () => {
      mockReq.params = { id: 'fw-123' };
      const fw = createMockFramework();
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(fw as never);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([] as never);
      (prismaMock.frameworkControl.count as jest.Mock<any>).mockResolvedValue(0 as never);

      await frameworksController.getById(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.complianceFramework.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'fw-123',
            organizationId: 'org-123',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'fw-123',
          name: 'SOC 2 Type II',
          controls: [],
          pagination: expect.objectContaining({
            page: 1,
            total: 0,
          }),
        })
      );
    });

    it('should throw 404 when framework not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        frameworksController.getById(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // create
  // ===========================================================================
  describe('create()', () => {
    it('should create framework with status 201', async () => {
      mockReq.body = { name: 'HIPAA', description: 'HIPAA compliance', nextAuditDate: '2026-12-31' };

      const newFw = createMockFramework({ id: 'fw-new', name: 'HIPAA' });
      (prismaMock.complianceFramework.create as jest.Mock<any>).mockResolvedValue(newFw as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await frameworksController.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(prismaMock.complianceFramework.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should throw 400 when name is missing', async () => {
      mockReq.body = {};

      await expect(
        frameworksController.create(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // update
  // ===========================================================================
  describe('update()', () => {
    it('should update framework', async () => {
      mockReq.params = { id: 'fw-123' };
      mockReq.body = { status: 'Completed' };

      const existingFw = createMockFramework();
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(
        createMockFramework({ status: 'Completed' }) as never
      );
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await frameworksController.update(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.complianceFramework.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fw-123' },
        })
      );
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should throw 404 when framework not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { status: 'Completed' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        frameworksController.update(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // remove
  // ===========================================================================
  describe('remove()', () => {
    it('should delete framework and return success', async () => {
      mockReq.params = { id: 'fw-123' };

      const existingFw = createMockFramework();
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.complianceFramework.delete as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await frameworksController.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.complianceFramework.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'fw-123' } })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });

  // ===========================================================================
  // Control operations
  // ===========================================================================
  describe('updateControl()', () => {
    it('should update a control within a framework', async () => {
      mockReq.params = { frameworkId: 'fw-123', controlId: 'ctrl-123' };
      mockReq.body = { status: 'Passed' };

      const existingFw = createMockFramework();
      const existingCtrl = createMockControl();
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(existingCtrl as never);
      (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue(
        createMockControl({ status: 'Passed' }) as never
      );
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([createMockControl()] as never);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await frameworksController.updateControl(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.frameworkControl.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ctrl-123' },
        })
      );
    });
  });

  describe('addControl()', () => {
    it('should add a control with status 201', async () => {
      mockReq.params = { frameworkId: 'fw-123' };
      mockReq.body = { name: 'CC2.1', description: 'Communication and Information' };

      const existingFw = createMockFramework();
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.frameworkControl.create as jest.Mock<any>).mockResolvedValue(
        createMockControl({ id: 'ctrl-new', name: 'CC2.1' }) as never
      );
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([createMockControl()] as never);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(existingFw as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await frameworksController.createControl(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
