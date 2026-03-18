/**
 * Control Mappings Controller Contract Tests
 *
 * Validates the contract for cross-framework control mapping CRUD
 * and CSV export endpoints.
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

import controlMappingsController from '../../../controllers/controlMappingsController';
import { AppError } from '../../../middleware/errorHandler';

const createMockMapping = (overrides = {}) => ({
  id: 'map-123',
  sourceControlId: 'ctrl-1',
  targetControlId: 'ctrl-2',
  mappingType: 'equivalent',
  confidence: 0.9,
  notes: null,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  sourceControl: {
    id: 'ctrl-1',
    name: 'CC1.1',
    framework: { id: 'fw-1', name: 'SOC 2', organizationId: 'org-123' },
  },
  targetControl: {
    id: 'ctrl-2',
    name: 'A.5.1',
    framework: { id: 'fw-2', name: 'ISO 27001', organizationId: 'org-123' },
  },
  ...overrides,
});

describe('ControlMappingsController Contract Tests', () => {
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
      setHeader: jest.fn().mockReturnThis() as any,
      send: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // createMapping
  // ===========================================================================
  describe('createMapping()', () => {
    it('should create mapping with status 201', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
        mappingType: 'equivalent',
        confidence: 0.9,
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce({
          id: 'ctrl-1',
          name: 'CC1.1',
          framework: { organizationId: 'org-123' },
        } as never)
        .mockResolvedValueOnce({
          id: 'ctrl-2',
          name: 'A.5.1',
          framework: { organizationId: 'org-123' },
        } as never);
      (prismaMock.controlMapping.findFirst as jest.Mock<any>).mockResolvedValue(null as never);
      (prismaMock.controlMapping.create as jest.Mock<any>).mockResolvedValue(
        createMockMapping() as never
      );
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await controlMappingsController.createMapping(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('created'),
          mapping: expect.any(Object),
        })
      );
    });

    it('should throw 400 when source or target missing', async () => {
      mockReq.body = { sourceControlId: 'ctrl-1' };

      await expect(
        controlMappingsController.createMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 404 when source control not found', async () => {
      mockReq.body = { sourceControlId: 'ctrl-1', targetControlId: 'ctrl-2' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce({ id: 'ctrl-2', framework: { organizationId: 'org-123' } } as never);

      await expect(
        controlMappingsController.createMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 404 when target control belongs to different org', async () => {
      mockReq.body = { sourceControlId: 'ctrl-1', targetControlId: 'ctrl-2' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce({
          id: 'ctrl-1',
          framework: { organizationId: 'org-123' },
        } as never)
        .mockResolvedValueOnce({
          id: 'ctrl-2',
          framework: { organizationId: 'org-other' }, // different org
        } as never);

      await expect(
        controlMappingsController.createMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 400 when mapping already exists', async () => {
      mockReq.body = { sourceControlId: 'ctrl-1', targetControlId: 'ctrl-2' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce({ id: 'ctrl-1', framework: { organizationId: 'org-123' } } as never)
        .mockResolvedValueOnce({ id: 'ctrl-2', framework: { organizationId: 'org-123' } } as never);
      (prismaMock.controlMapping.findFirst as jest.Mock<any>).mockResolvedValue(
        createMockMapping() as never
      );

      await expect(
        controlMappingsController.createMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // getMappings
  // ===========================================================================
  describe('getMappings()', () => {
    it('should return mappings for a control', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'ctrl-1',
        framework: { organizationId: 'org-123' },
      } as never);
      (prismaMock.controlMapping.findMany as jest.Mock<any>).mockResolvedValue(
        [createMockMapping()] as never
      );

      await controlMappingsController.getMappings(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.controlMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { sourceControlId: 'ctrl-1' },
              { targetControlId: 'ctrl-1' },
            ],
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ mappings: expect.any(Array) })
      );
    });

    it('should throw 404 when control not found or wrong org', async () => {
      mockReq.params = { controlId: 'ctrl-missing' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        controlMappingsController.getMappings(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // updateMapping
  // ===========================================================================
  describe('updateMapping()', () => {
    it('should update mapping', async () => {
      mockReq.params = { mappingId: 'map-123' };
      mockReq.body = { confidence: 0.95, notes: 'Updated' };

      (prismaMock.controlMapping.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockMapping() as never
      );
      (prismaMock.controlMapping.update as jest.Mock<any>).mockResolvedValue(
        createMockMapping({ confidence: 0.95 }) as never
      );
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await controlMappingsController.updateMapping(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('updated'),
          mapping: expect.any(Object),
        })
      );
    });

    it('should throw 404 when mapping not found', async () => {
      mockReq.params = { mappingId: 'map-missing' };

      (prismaMock.controlMapping.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        controlMappingsController.updateMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 403 when mapping belongs to different org', async () => {
      mockReq.params = { mappingId: 'map-123' };

      (prismaMock.controlMapping.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockMapping({
          sourceControl: { framework: { organizationId: 'org-other' } },
          targetControl: { framework: { organizationId: 'org-other' } },
        }) as never
      );

      await expect(
        controlMappingsController.updateMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // deleteMapping
  // ===========================================================================
  describe('deleteMapping()', () => {
    it('should delete mapping and return success', async () => {
      mockReq.params = { mappingId: 'map-123' };

      (prismaMock.controlMapping.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockMapping() as never
      );
      (prismaMock.controlMapping.delete as jest.Mock<any>).mockResolvedValue({} as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await controlMappingsController.deleteMapping(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.controlMapping.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'map-123' } })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('deleted') })
      );
    });

    it('should throw 404 when mapping not found', async () => {
      mockReq.params = { mappingId: 'map-missing' };

      (prismaMock.controlMapping.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        controlMappingsController.deleteMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 403 for unauthorized org', async () => {
      mockReq.params = { mappingId: 'map-123' };

      (prismaMock.controlMapping.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockMapping({
          sourceControl: { framework: { organizationId: 'org-other' } },
          targetControl: { framework: { organizationId: 'org-other' } },
        }) as never
      );

      await expect(
        controlMappingsController.deleteMapping(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // exportMappings
  // ===========================================================================
  describe('exportMappings()', () => {
    it('should export CSV with correct headers', async () => {
      (prismaMock.controlMapping.findMany as jest.Mock<any>).mockResolvedValue([
        createMockMapping(),
      ] as never);

      await controlMappingsController.exportMappings(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=control-mappings.csv'
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('Source Framework,Source Control,Target Framework,Target Control')
      );
    });

    it('should export empty CSV when no mappings', async () => {
      (prismaMock.controlMapping.findMany as jest.Mock<any>).mockResolvedValue([] as never);

      await controlMappingsController.exportMappings(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('Source Framework')
      );
    });
  });
});
