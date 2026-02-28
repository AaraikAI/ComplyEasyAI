/**
 * Frameworks Controller Unit Tests
 *
 * Comprehensive tests for compliance framework management including
 * CRUD operations, controls, evidence, AI suggestions, and conflict resolution.
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

jest.mock('../../../services/euRegulations/controlTemplatesService', () => ({
  __esModule: true,
  default: {
    getControlsForFramework: jest.fn().mockReturnValue([]),
  },
}));

import frameworksController from '../../../controllers/frameworksController';
import { AppError } from '../../../middleware/errorHandler';

// Mock data factories
const createMockFramework = (overrides: Record<string, unknown> = {}) => ({
  id: 'framework-123',
  name: 'SOC 2 Type II',
  region: 'US',
  status: 'In_Review',
  progress: 0,
  nextAuditDate: new Date('2025-12-31'),
  notes: 'Test notes',
  version: 1,
  lastModifiedBy: 'user-123',
  lastModifiedAt: new Date(),
  organizationId: 'org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  controls: [],
  ...overrides,
});

const createMockControl = (overrides: Record<string, unknown> = {}) => ({
  id: 'control-123',
  frameworkId: 'framework-123',
  name: 'Access Control',
  description: 'Control access to systems',
  status: 'Pending',
  category: 'Security',
  evidence: null,
  evidenceRequired: true,
  ownerId: null,
  owner: null,
  mappedControls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockSuggestion = (overrides: Record<string, unknown> = {}) => ({
  id: 'suggestion-123',
  frameworkId: 'framework-123',
  fileName: 'policy.pdf',
  fileUrl: 'https://s3.example.com/policy.pdf',
  s3Key: 'frameworks/framework-123/policy.pdf',
  classification: 'Security Policy',
  description: 'Auto-suggested security policy',
  confidence: 0.85,
  status: 'pending',
  suggestedBy: 'user-123',
  organizationId: 'org-123',
  createdAt: new Date(),
  ...overrides,
});

describe('FrameworksController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'org-123',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // Framework CRUD Tests
  // ===========================================================================
  describe('list()', () => {
    it('should list frameworks for organization', async () => {
      const mockFrameworks = [
        createMockFramework({ id: 'framework-1', name: 'SOC 2' }),
        createMockFramework({ id: 'framework-2', name: 'ISO 27001' }),
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
          include: { controls: true },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array when no frameworks exist', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);

      await frameworksController.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getById()', () => {
    it('should get framework by ID with controls and pagination', async () => {
      const frameworkId = 'framework-123';
      mockRequest.params = { id: frameworkId };
      mockRequest.query = { page: '1', limit: '10' };

      const mockFramework = createMockFramework();
      const mockControls = [createMockControl(), createMockControl({ id: 'control-2' })];

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(mockControls as any);
      (prismaMock.frameworkControl.count as jest.Mock<any>).mockResolvedValue(2 as any);

      await frameworksController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: frameworkId,
          controls: mockControls,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        })
      );
    });

    it('should support search filtering on controls', async () => {
      mockRequest.params = { id: 'framework-123' };
      mockRequest.query = { search: 'access' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(createMockFramework() as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.frameworkControl.count as jest.Mock<any>).mockResolvedValue(0);

      await frameworksController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prismaMock.frameworkControl.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'access', mode: 'insensitive' } },
            ]),
          }),
        })
      );
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
    it('should create framework with required fields', async () => {
      mockRequest.body = {
        name: 'SOC 2 Type II',
        region: 'US',
        nextAuditDate: '2025-12-31',
        notes: 'Test framework',
      };

      const mockFramework = createMockFramework(mockRequest.body);

      (prismaMock.complianceFramework.create as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockFramework);
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should sanitize XSS input', async () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>SOC 2',
        region: 'US<script>hack</script>',
        nextAuditDate: '2025-12-31',
      };

      const mockFramework = createMockFramework({ name: 'SOC 2', region: 'US' });

      (prismaMock.complianceFramework.create as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prismaMock.complianceFramework.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: expect.not.stringContaining('<script>'),
          }),
        })
      );
    });

    it('should throw error if required fields missing', async () => {
      mockRequest.body = { name: 'SOC 2' };

      await expect(
        frameworksController.create(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if name is missing', async () => {
      mockRequest.body = { nextAuditDate: '2025-12-31' };

      await expect(
        frameworksController.create(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Name and next audit date are required');
    });
  });

  describe('update()', () => {
    it('should update framework', async () => {
      const frameworkId = 'framework-123';
      mockRequest.params = { id: frameworkId };
      mockRequest.body = { name: 'Updated Framework', version: 1 };

      const existingFramework = createMockFramework();
      const updatedFramework = { ...existingFramework, name: 'Updated Framework', version: 2 };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFramework as any);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(updatedFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(updatedFramework);
    });

    it('should detect concurrent edit conflict', async () => {
      mockRequest.params = { id: 'framework-123' };
      mockRequest.body = { name: 'Updated', version: 1 };

      const existingFramework = createMockFramework({ version: 2 }); // Version mismatch

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFramework as any);
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue({ id: 'user-456', name: 'Other User' });

      await expect(
        frameworksController.update(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should allow conflict resolution with overwrite strategy', async () => {
      mockRequest.params = { id: 'framework-123' };
      mockRequest.body = { name: 'Updated', version: 1, resolutionStrategy: 'overwrite' };

      const existingFramework = createMockFramework({ version: 2 });
      const updatedFramework = { ...existingFramework, name: 'Updated', version: 3 };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFramework as any);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(updatedFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(updatedFramework);
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockRequest.body = { name: 'Updated' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.update(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Framework not found');
    });
  });

  describe('delete()', () => {
    it('should delete framework', async () => {
      mockRequest.params = { id: 'framework-123' };

      const mockFramework = createMockFramework();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.complianceFramework.delete as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Framework deleted successfully' });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { id: 'invalid-id' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.delete(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Framework not found');
    });
  });

  // ===========================================================================
  // Control CRUD Tests
  // ===========================================================================
  describe('createControl()', () => {
    it('should create control with required fields', async () => {
      mockRequest.params = { frameworkId: 'framework-123' };
      mockRequest.body = {
        name: 'Access Control',
        description: 'Manage access to systems',
        status: 'Pending',
        category: 'Security',
      };

      const mockFramework = createMockFramework();
      const mockControl = createMockControl(mockRequest.body);

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.create as jest.Mock<any>).mockResolvedValue(mockControl as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([mockControl]);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.createControl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockControl);
    });

    it('should throw error if control name is missing', async () => {
      mockRequest.params = { frameworkId: 'framework-123' };
      mockRequest.body = { description: 'No name provided' };

      await expect(
        frameworksController.createControl(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Control name is required');
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { frameworkId: 'invalid-id' };
      mockRequest.body = { name: 'Test Control' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.createControl(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Framework not found');
    });
  });

  describe('updateControl()', () => {
    it('should update control status', async () => {
      mockRequest.params = { frameworkId: 'framework-123', controlId: 'control-123' };
      mockRequest.body = { status: 'Implemented' };

      const mockFramework = createMockFramework();
      const mockControl = createMockControl({ status: 'Pending' });
      const updatedControl = { ...mockControl, status: 'Implemented' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(mockControl as any);
      (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue(updatedControl as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([updatedControl]);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.updateControl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(updatedControl);
    });

    it('should throw error if control not found', async () => {
      mockRequest.params = { frameworkId: 'framework-123', controlId: 'invalid-id' };
      mockRequest.body = { status: 'Implemented' };

      const mockFramework = createMockFramework();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.updateControl(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Control not found');
    });
  });

  describe('bulkUpdateControls()', () => {
    it('should bulk update multiple controls', async () => {
      mockRequest.params = { frameworkId: 'framework-123' };
      mockRequest.body = {
        controlIds: ['control-1', 'control-2', 'control-3'],
        status: 'Implemented',
        evidenceRequired: true,
      };

      const mockFramework = createMockFramework();
      const updatedControls = [
        createMockControl({ id: 'control-1', status: 'Implemented' }),
        createMockControl({ id: 'control-2', status: 'Implemented' }),
        createMockControl({ id: 'control-3', status: 'Implemented' }),
      ];

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.update as jest.Mock<any>)
        .mockResolvedValueOnce(updatedControls[0] as any)
        .mockResolvedValueOnce(updatedControls[1] as any)
        .mockResolvedValueOnce(updatedControls[2] as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue(updatedControls);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.bulkUpdateControls(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Successfully updated 3 controls',
          controls: updatedControls,
        })
      );
    });

    it('should throw error if controlIds array is empty', async () => {
      mockRequest.params = { frameworkId: 'framework-123' };
      mockRequest.body = { controlIds: [], status: 'Implemented' };

      await expect(
        frameworksController.bulkUpdateControls(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Control IDs array is required');
    });

    it('should throw error if status is missing', async () => {
      mockRequest.params = { frameworkId: 'framework-123' };
      mockRequest.body = { controlIds: ['control-1'] };

      await expect(
        frameworksController.bulkUpdateControls(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Status is required');
    });
  });

  describe('deleteControl()', () => {
    it('should delete control', async () => {
      mockRequest.params = { frameworkId: 'framework-123', controlId: 'control-123' };

      const mockFramework = createMockFramework();
      const mockControl = createMockControl();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl as any);
      (prismaMock.frameworkControl.delete as jest.Mock<any>).mockResolvedValue(mockControl as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.deleteControl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Control deleted successfully' });
    });

    it('should throw error if control not found', async () => {
      mockRequest.params = { frameworkId: 'framework-123', controlId: 'invalid-id' };

      const mockFramework = createMockFramework();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.deleteControl(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Control not found');
    });
  });

  // ===========================================================================
  // Evidence and Export Tests
  // ===========================================================================
  describe('exportControl()', () => {
    it('should export control as report', async () => {
      mockRequest.params = { frameworkId: 'framework-123', controlId: 'control-123' };

      const mockFramework = createMockFramework();
      const mockControl = createMockControl();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.exportControl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          framework: expect.objectContaining({ id: 'framework-123' }),
          control: expect.objectContaining({ id: 'control-123' }),
          metadata: expect.objectContaining({
            exportedBy: 'user-123',
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { frameworkId: 'invalid-id', controlId: 'control-123' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.exportControl(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Framework not found');
    });

    it('should throw error if control not found', async () => {
      mockRequest.params = { frameworkId: 'framework-123', controlId: 'invalid-id' };

      const mockFramework = createMockFramework();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.exportControl(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Control not found');
    });
  });

  // ===========================================================================
  // AI Suggestion Tests
  // ===========================================================================
  describe('getSuggestions()', () => {
    it('should get pending suggestions for framework', async () => {
      mockRequest.params = { frameworkId: 'framework-123' };

      const mockFramework = createMockFramework();
      const mockSuggestions = [
        createMockSuggestion(),
        createMockSuggestion({ id: 'suggestion-2', classification: 'Privacy Policy' }),
      ];

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.aISuggestion.findMany as jest.Mock<any>).mockResolvedValue(mockSuggestions as any);

      await frameworksController.getSuggestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ suggestions: mockSuggestions });
      expect(prismaMock.aISuggestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            frameworkId: 'framework-123',
            status: 'pending',
          }),
        })
      );
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { frameworkId: 'invalid-id' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.getSuggestions(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Framework not found');
    });
  });

  describe('acceptSuggestion()', () => {
    it('should accept suggestion and create control', async () => {
      mockRequest.params = { suggestionId: 'suggestion-123' };

      const mockSuggestion = createMockSuggestion();
      const mockFramework = createMockFramework();
      const mockControl = createMockControl({
        name: mockSuggestion.classification,
        evidence: mockSuggestion.fileUrl,
      });

      (prismaMock.aISuggestion.findFirst as jest.Mock<any>).mockResolvedValue(mockSuggestion as any);
      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.frameworkControl.create as jest.Mock<any>).mockResolvedValue(mockControl as any);
      (prismaMock.aISuggestion.update as jest.Mock<any>).mockResolvedValue({ ...mockSuggestion, status: 'accepted' } as any);
      (prismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([mockControl]);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(mockFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.acceptSuggestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Suggestion accepted and control created',
          control: mockControl,
        })
      );
    });

    it('should throw error if suggestion not found', async () => {
      mockRequest.params = { suggestionId: 'invalid-id' };

      (prismaMock.aISuggestion.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.acceptSuggestion(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Suggestion not found or already processed');
    });
  });

  describe('rejectSuggestion()', () => {
    it('should reject suggestion with feedback', async () => {
      mockRequest.params = { suggestionId: 'suggestion-123' };
      mockRequest.body = { feedback: 'Not relevant to our framework' };

      const mockSuggestion = createMockSuggestion();

      (prismaMock.aISuggestion.findFirst as jest.Mock<any>).mockResolvedValue(mockSuggestion as any);
      (prismaMock.aISuggestion.update as jest.Mock<any>).mockResolvedValue({ ...mockSuggestion, status: 'rejected' } as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.rejectSuggestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Suggestion rejected' });
      expect(prismaMock.aISuggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'rejected',
            feedback: 'Not relevant to our framework',
          }),
        })
      );
    });

    it('should reject suggestion without feedback', async () => {
      mockRequest.params = { suggestionId: 'suggestion-123' };
      mockRequest.body = {};

      const mockSuggestion = createMockSuggestion();

      (prismaMock.aISuggestion.findFirst as jest.Mock<any>).mockResolvedValue(mockSuggestion as any);
      (prismaMock.aISuggestion.update as jest.Mock<any>).mockResolvedValue({ ...mockSuggestion, status: 'rejected' } as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.rejectSuggestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prismaMock.aISuggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            feedback: 'No feedback provided',
          }),
        })
      );
    });

    it('should throw error if suggestion not found', async () => {
      mockRequest.params = { suggestionId: 'invalid-id' };

      (prismaMock.aISuggestion.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.rejectSuggestion(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Suggestion not found or already processed');
    });
  });

  // ===========================================================================
  // Conflict Resolution Tests
  // ===========================================================================
  describe('resolveConflict()', () => {
    it('should resolve conflict with keep_mine strategy', async () => {
      mockRequest.params = { id: 'framework-123' };
      mockRequest.body = {
        resolution: 'keep_mine',
        updateData: { name: 'My Updated Name' },
      };

      const existingFramework = createMockFramework({ version: 2 });
      const updatedFramework = { ...existingFramework, name: 'My Updated Name', version: 3 };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFramework as any);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(updatedFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.resolveConflict(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(updatedFramework);
    });

    it('should resolve conflict with keep_theirs strategy', async () => {
      mockRequest.params = { id: 'framework-123' };
      mockRequest.body = { resolution: 'keep_theirs' };

      const existingFramework = createMockFramework();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFramework as any);
      (prismaMock.complianceFramework.update as jest.Mock<any>).mockResolvedValue(existingFramework as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await frameworksController.resolveConflict(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(existingFramework);
    });

    it('should throw error if framework not found', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockRequest.body = { resolution: 'keep_mine' };

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        frameworksController.resolveConflict(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Framework not found');
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB connection failed'));

      await expect(
        frameworksController.list(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Failed to fetch frameworks');
    });

    it('should handle missing user context', async () => {
      mockRequest.user = undefined as any;

      await expect(
        frameworksController.list(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow();
    });

    it('should validate audit date format', async () => {
      mockRequest.params = { id: 'framework-123' };
      mockRequest.body = { nextAuditDate: 'invalid-date' };

      const existingFramework = createMockFramework();

      (prismaMock.complianceFramework.findFirst as jest.Mock<any>).mockResolvedValue(existingFramework as any);

      await expect(
        frameworksController.update(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Invalid audit date format');
    });
  });
});
