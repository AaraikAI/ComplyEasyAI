/**
 * Control Mappings Controller Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock uuid
const mockUuidv4 = jest.fn<any>();
jest.mock('uuid', () => ({
  v4: mockUuidv4,
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

// Add missing controlMapping model to prismaMock
const mockControlMapping = {
  findFirst: jest.fn<any>(),
  findUnique: jest.fn<any>(),
  findMany: jest.fn<any>(),
  create: jest.fn<any>(),
  update: jest.fn<any>(),
  delete: jest.fn<any>(),
  count: jest.fn<any>(),
};
(prismaMock as any).controlMapping = mockControlMapping;

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import controlMappingsController from '../../../controllers/controlMappingsController';
import { AppError } from '../../../middleware/errorHandler';

describe('ControlMappingsController', () => {
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
      setHeader: jest.fn() as any,
      send: jest.fn() as any,
    };
  });

  // ============================================================================
  // createMapping
  // ============================================================================

  describe('createMapping', () => {
    const sourceControl = {
      id: 'ctrl-1',
      name: 'AC-1',
      framework: { id: 'fw-1', name: 'NIST', organizationId: 'org-1' },
    };

    const targetControl = {
      id: 'ctrl-2',
      name: 'A.9.1',
      framework: { id: 'fw-2', name: 'ISO 27001', organizationId: 'org-1' },
    };

    it('should create a control mapping and return 201', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
        mappingType: 'equivalent',
        confidence: 0.95,
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(sourceControl)
        .mockResolvedValueOnce(targetControl);
      mockControlMapping.findFirst.mockResolvedValue(null);

      const createdMapping = {
        id: 'map-1',
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
        mappingType: 'equivalent',
        confidence: 0.95,
        sourceControl: { ...sourceControl },
        targetControl: { ...targetControl },
      };
      mockControlMapping.create.mockResolvedValue(createdMapping);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controlMappingsController.createMapping(mockReq, mockRes, mockNext);

      expect(prismaMock.frameworkControl.findFirst).toHaveBeenCalledTimes(2);
      expect(mockControlMapping.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { sourceControl: { framework: { organizationId: 'org-1' } } },
              { targetControl: { framework: { organizationId: 'org-1' } } },
              {
                OR: [
                  { sourceControlId: 'ctrl-1', targetControlId: 'ctrl-2' },
                  { sourceControlId: 'ctrl-2', targetControlId: 'ctrl-1' },
                ],
              },
            ],
          },
        })
      );
      expect(mockControlMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceControlId: 'ctrl-1',
            targetControlId: 'ctrl-2',
            mappingType: 'equivalent',
            confidence: 0.95,
          }),
        })
      );
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Mapping created successfully',
        mapping: createdMapping,
      });
    });

    it('should use default mappingType when not provided', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(sourceControl)
        .mockResolvedValueOnce(targetControl);
      mockControlMapping.findFirst.mockResolvedValue(null);
      mockControlMapping.create.mockResolvedValue({ id: 'map-1' });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controlMappingsController.createMapping(mockReq, mockRes, mockNext);

      expect(mockControlMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mappingType: 'equivalent',
            confidence: null,
          }),
        })
      );
    });

    it('should throw 400 when sourceControlId is missing', async () => {
      mockReq.body = { targetControlId: 'ctrl-2' };

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Source and target control IDs are required');
    });

    it('should throw 400 when targetControlId is missing', async () => {
      mockReq.body = { sourceControlId: 'ctrl-1' };

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Source and target control IDs are required');
    });

    it('should throw 404 when source control not found', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(targetControl);

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Source control not found');
    });

    it('should throw 404 when source control belongs to another organization', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      const otherOrgControl = {
        id: 'ctrl-1',
        name: 'AC-1',
        framework: { id: 'fw-1', name: 'NIST', organizationId: 'org-other' },
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(otherOrgControl)
        .mockResolvedValueOnce(targetControl);

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Source control not found');
    });

    it('should throw 404 when target control not found', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(sourceControl)
        .mockResolvedValueOnce(null);

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Target control not found');
    });

    it('should throw 404 when target control belongs to another organization', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      const otherOrgTarget = {
        id: 'ctrl-2',
        name: 'A.9.1',
        framework: { id: 'fw-2', name: 'ISO 27001', organizationId: 'org-other' },
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(sourceControl)
        .mockResolvedValueOnce(otherOrgTarget);

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Target control not found');
    });

    it('should throw 400 when mapping already exists', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(sourceControl)
        .mockResolvedValueOnce(targetControl);
      mockControlMapping.findFirst.mockResolvedValue({ id: 'map-existing' });

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Mapping already exists');
    });

    it('should throw 500 on generic error', async () => {
      mockReq.body = {
        sourceControlId: 'ctrl-1',
        targetControlId: 'ctrl-2',
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>)
        .mockRejectedValue(new Error('DB error'));

      await expect(
        controlMappingsController.createMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to create mapping');
    });
  });

  // ============================================================================
  // getMappings
  // ============================================================================

  describe('getMappings', () => {
    it('should return mappings for a control', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      const control = {
        id: 'ctrl-1',
        name: 'AC-1',
        framework: { id: 'fw-1', organizationId: 'org-1' },
      };

      const mappings = [
        {
          id: 'map-1',
          sourceControlId: 'ctrl-1',
          targetControlId: 'ctrl-2',
          sourceControl: { name: 'AC-1', framework: { id: 'fw-1', name: 'NIST' } },
          targetControl: { name: 'A.9.1', framework: { id: 'fw-2', name: 'ISO 27001' } },
        },
      ];

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(control);
      mockControlMapping.findMany.mockResolvedValue(mappings);

      await controlMappingsController.getMappings(mockReq, mockRes, mockNext);

      expect(prismaMock.frameworkControl.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ctrl-1' },
          include: { framework: true },
        })
      );
      expect(mockControlMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { sourceControlId: 'ctrl-1' },
              { targetControlId: 'ctrl-1' },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ mappings });
    });

    it('should return empty mappings array when none exist', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      const control = {
        id: 'ctrl-1',
        framework: { id: 'fw-1', organizationId: 'org-1' },
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(control);
      mockControlMapping.findMany.mockResolvedValue([]);

      await controlMappingsController.getMappings(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ mappings: [] });
    });

    it('should throw 404 when control not found', async () => {
      mockReq.params = { controlId: 'nonexistent' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        controlMappingsController.getMappings(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Control not found');
    });

    it('should throw 404 when control belongs to another organization', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      const otherOrgControl = {
        id: 'ctrl-1',
        framework: { id: 'fw-1', organizationId: 'org-other' },
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(otherOrgControl);

      await expect(
        controlMappingsController.getMappings(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Control not found');
    });

    it('should throw 500 on generic error', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockRejectedValue(
        new Error('DB error')
      );

      await expect(
        controlMappingsController.getMappings(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to fetch mappings');
    });
  });

  // ============================================================================
  // deleteMapping
  // ============================================================================

  describe('deleteMapping', () => {
    const mapping = {
      id: 'map-1',
      sourceControl: {
        framework: { organizationId: 'org-1' },
      },
      targetControl: {
        framework: { organizationId: 'org-1' },
      },
    };

    it('should delete a mapping and return success message', async () => {
      mockReq.params = { mappingId: 'map-1' };

      mockControlMapping.findUnique.mockResolvedValue(mapping);
      mockControlMapping.delete.mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controlMappingsController.deleteMapping(mockReq, mockRes, mockNext);

      expect(mockControlMapping.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'map-1' },
        })
      );
      expect(mockControlMapping.delete).toHaveBeenCalledWith({ where: { id: 'map-1' } });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'Control mapping deleted',
            userId: 'user-1',
            organizationId: 'org-1',
            hash: 'test-uuid-1234',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Mapping deleted successfully' });
    });

    it('should throw 404 when mapping not found', async () => {
      mockReq.params = { mappingId: 'nonexistent' };

      mockControlMapping.findUnique.mockResolvedValue(null);

      await expect(
        controlMappingsController.deleteMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Mapping not found');
    });

    it('should throw 403 when source control belongs to another organization', async () => {
      mockReq.params = { mappingId: 'map-1' };

      const otherOrgMapping = {
        id: 'map-1',
        sourceControl: { framework: { organizationId: 'org-other' } },
        targetControl: { framework: { organizationId: 'org-1' } },
      };

      mockControlMapping.findUnique.mockResolvedValue(otherOrgMapping);

      await expect(
        controlMappingsController.deleteMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw 403 when target control belongs to another organization', async () => {
      mockReq.params = { mappingId: 'map-1' };

      const otherOrgMapping = {
        id: 'map-1',
        sourceControl: { framework: { organizationId: 'org-1' } },
        targetControl: { framework: { organizationId: 'org-other' } },
      };

      mockControlMapping.findUnique.mockResolvedValue(otherOrgMapping);

      await expect(
        controlMappingsController.deleteMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw 500 on generic error', async () => {
      mockReq.params = { mappingId: 'map-1' };

      mockControlMapping.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        controlMappingsController.deleteMapping(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to delete mapping');
    });
  });

  // ============================================================================
  // exportMappings
  // ============================================================================

  describe('exportMappings', () => {
    it('should export mappings as CSV with proper headers', async () => {
      const mappings = [
        {
          sourceControl: { name: 'AC-1', framework: { name: 'NIST' } },
          targetControl: { name: 'A.9.1', framework: { name: 'ISO 27001' } },
          mappingType: 'equivalent',
          confidence: 0.95,
        },
        {
          sourceControl: { name: 'AC-2', framework: { name: 'NIST' } },
          targetControl: { name: 'A.9.2', framework: { name: 'ISO 27001' } },
          mappingType: 'partial',
          confidence: 0.7,
        },
      ];

      mockControlMapping.findMany.mockResolvedValue(mappings);

      await controlMappingsController.exportMappings(mockReq, mockRes, mockNext);

      expect(mockControlMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { sourceControl: { framework: { organizationId: 'org-1' } } },
              { targetControl: { framework: { organizationId: 'org-1' } } },
            ],
          },
        })
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=control-mappings.csv'
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('Source Framework,Source Control,Target Framework,Target Control,Mapping Type,Confidence')
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('"NIST","AC-1","ISO 27001","A.9.1","equivalent","0.95"')
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('"NIST","AC-2","ISO 27001","A.9.2","partial","0.7"')
      );
    });

    it('should export empty CSV when no mappings exist', async () => {
      mockControlMapping.findMany.mockResolvedValue([]);

      await controlMappingsController.exportMappings(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.send).toHaveBeenCalledWith(
        'Source Framework,Source Control,Target Framework,Target Control,Mapping Type,Confidence\n'
      );
    });

    it('should handle mappings with empty confidence', async () => {
      const mappings = [
        {
          sourceControl: { name: 'AC-1', framework: { name: 'NIST' } },
          targetControl: { name: 'A.9.1', framework: { name: 'ISO 27001' } },
          mappingType: 'equivalent',
          confidence: null,
        },
      ];

      mockControlMapping.findMany.mockResolvedValue(mappings);

      await controlMappingsController.exportMappings(mockReq, mockRes, mockNext);

      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('"NIST","AC-1","ISO 27001","A.9.1","equivalent",""')
      );
    });

    it('should throw 500 on generic error', async () => {
      mockControlMapping.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        controlMappingsController.exportMappings(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to export mappings');
    });
  });
});
