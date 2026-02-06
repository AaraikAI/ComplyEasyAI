/**
 * Evidence Versioning Controller Unit Tests
 *
 * Tests for evidence version history, creation, restoration, and deletion.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-v4'),
}));

import controller from '../../../controllers/evidenceVersioningController';
import { AppError } from '../../../middleware/errorHandler';

describe('EvidenceVersioningController', () => {
  const mockReq = {
    user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
    params: {},
    query: {},
    body: {},
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test' },
  } as any;
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn(),
  } as any;
  const mockNext = jest.fn();

  const mockControl = {
    id: 'ctrl-1',
    name: 'CC1.1 - Control Environment',
    framework: { organizationId: 'org-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq.params = {};
    mockReq.body = {};
    mockRes.status.mockReturnThis();
    mockRes.json.mockReturnThis();
  });

  // ==========================================================================
  // getVersions
  // ==========================================================================

  describe('getVersions()', () => {
    it('should return version history sorted by version number descending', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      const versions = [
        { id: 'v-2', controlId: 'ctrl-1', versionNumber: 2, isCurrent: true, uploader: { id: 'user-1', name: 'Test User', email: 'test@test.com' } },
        { id: 'v-1', controlId: 'ctrl-1', versionNumber: 1, isCurrent: false, uploader: { id: 'user-1', name: 'Test User', email: 'test@test.com' } },
      ];

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findMany as jest.Mock<any>).mockResolvedValue(versions);

      await controller.getVersions(mockReq, mockRes, mockNext);

      expect(prismaMock.frameworkControl.findFirst).toHaveBeenCalledWith({
        where: { id: 'ctrl-1' },
        include: { framework: true },
      });
      expect(prismaMock.evidenceVersion.findMany).toHaveBeenCalledWith({
        where: { controlId: 'ctrl-1' },
        include: {
          uploader: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { versionNumber: 'desc' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({ versions });
    });

    it('should return empty array when no versions exist', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findMany as jest.Mock<any>).mockResolvedValue([]);

      await controller.getVersions(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ versions: [] });
    });

    it('should throw AppError 404 when control not found', async () => {
      mockReq.params = { controlId: 'nonexistent' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(controller.getVersions(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
      await expect(controller.getVersions(mockReq, mockRes, mockNext)).rejects.toThrow('Control not found');
    });

    it('should throw AppError 404 when control belongs to different org', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'ctrl-1',
        framework: { organizationId: 'other-org' },
      });

      await expect(controller.getVersions(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
    });

    it('should throw AppError 500 on unexpected error', async () => {
      mockReq.params = { controlId: 'ctrl-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB timeout'));

      await expect(controller.getVersions(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
      await expect(controller.getVersions(mockReq, mockRes, mockNext)).rejects.toThrow(/Failed to fetch versions/);
    });
  });

  // ==========================================================================
  // createVersion
  // ==========================================================================

  describe('createVersion()', () => {
    it('should create a new version with incremented version number and return 201', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = {
        fileUrl: 'https://storage.example.com/evidence.pdf',
        fileName: 'evidence.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      };

      const createdVersion = {
        id: 'v-new',
        controlId: 'ctrl-1',
        versionNumber: 3,
        fileUrl: 'https://storage.example.com/evidence.pdf',
        fileName: 'evidence.pdf',
        isCurrent: true,
        uploader: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue({ versionNumber: 2 });
      (prismaMock.evidenceVersion.updateMany as jest.Mock<any>).mockResolvedValue({ count: 2 });
      (prismaMock.evidenceVersion.create as jest.Mock<any>).mockResolvedValue(createdVersion);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controller.createVersion(mockReq, mockRes, mockNext);

      expect(prismaMock.evidenceVersion.updateMany).toHaveBeenCalledWith({
        where: { controlId: 'ctrl-1' },
        data: { isCurrent: false },
      });
      expect(prismaMock.evidenceVersion.create).toHaveBeenCalledWith({
        data: {
          controlId: 'ctrl-1',
          versionNumber: 3,
          fileUrl: 'https://storage.example.com/evidence.pdf',
          fileName: 'evidence.pdf',
          uploadedBy: 'user-1',
          fileSize: BigInt(1024),
          mimeType: 'application/pdf',
          isCurrent: true,
        },
        include: {
          uploader: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: expect.stringContaining('Evidence version 3 created'),
          userId: 'user-1',
          organizationId: 'org-1',
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ version: createdVersion });
    });

    it('should start at version 1 when no previous versions exist', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = {
        fileUrl: 'https://storage.example.com/first.pdf',
        fileName: 'first.pdf',
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.evidenceVersion.updateMany as jest.Mock<any>).mockResolvedValue({ count: 0 });
      (prismaMock.evidenceVersion.create as jest.Mock<any>).mockResolvedValue({
        id: 'v-1',
        versionNumber: 1,
        isCurrent: true,
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controller.createVersion(mockReq, mockRes, mockNext);

      expect(prismaMock.evidenceVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 1,
            fileSize: null,
            mimeType: null,
          }),
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should throw AppError 400 when fileUrl is missing', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = { fileName: 'test.pdf' };

      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow('File URL and name are required');
    });

    it('should throw AppError 400 when fileName is missing', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = { fileUrl: 'https://example.com/file.pdf' };

      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow('File URL and name are required');
    });

    it('should throw AppError 400 when both fileUrl and fileName are missing', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = {};

      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow('File URL and name are required');
    });

    it('should throw AppError 404 when control not found', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = { fileUrl: 'https://example.com/file.pdf', fileName: 'file.pdf' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Control not found');
    });

    it('should throw AppError 404 when control belongs to a different org', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = { fileUrl: 'https://example.com/file.pdf', fileName: 'file.pdf' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'ctrl-1',
        framework: { organizationId: 'different-org' },
      });

      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Control not found');
    });

    it('should throw AppError 500 on unexpected database error', async () => {
      mockReq.params = { controlId: 'ctrl-1' };
      mockReq.body = { fileUrl: 'https://example.com/file.pdf', fileName: 'file.pdf' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockRejectedValue(new Error('Connection lost'));

      await expect(controller.createVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Failed to create version');
    });
  });

  // ==========================================================================
  // restoreVersion
  // ==========================================================================

  describe('restoreVersion()', () => {
    it('should restore a previous version successfully', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-1' };
      const versionToRestore = {
        id: 'v-1',
        controlId: 'ctrl-1',
        versionNumber: 1,
        fileUrl: 'https://storage.example.com/old-evidence.pdf',
        isCurrent: false,
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue(versionToRestore);
      (prismaMock.evidenceVersion.updateMany as jest.Mock<any>).mockResolvedValue({ count: 2 });
      (prismaMock.evidenceVersion.update as jest.Mock<any>).mockResolvedValue({ ...versionToRestore, isCurrent: true });
      (prismaMock.frameworkControl.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controller.restoreVersion(mockReq, mockRes, mockNext);

      expect(prismaMock.evidenceVersion.updateMany).toHaveBeenCalledWith({
        where: { controlId: 'ctrl-1' },
        data: { isCurrent: false },
      });
      expect(prismaMock.evidenceVersion.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: { isCurrent: true },
      });
      expect(prismaMock.frameworkControl.update).toHaveBeenCalledWith({
        where: { id: 'ctrl-1' },
        data: { evidence: 'https://storage.example.com/old-evidence.pdf' },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: expect.stringContaining('Evidence version 1 restored'),
          userId: 'user-1',
          organizationId: 'org-1',
        }),
      });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Version restored successfully' });
    });

    it('should throw AppError 404 when control not found', async () => {
      mockReq.params = { controlId: 'ctrl-bad', versionId: 'v-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(controller.restoreVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Control not found');
    });

    it('should throw AppError 404 when version not found', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-nonexistent' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(controller.restoreVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Version not found');
    });

    it('should throw AppError 500 on unexpected error', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'v-1', controlId: 'ctrl-1', versionNumber: 1, fileUrl: 'url', isCurrent: false,
      });
      (prismaMock.evidenceVersion.updateMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(controller.restoreVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Failed to restore version');
    });
  });

  // ==========================================================================
  // deleteVersion
  // ==========================================================================

  describe('deleteVersion()', () => {
    it('should delete a non-current version successfully', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-1' };
      const versionToDelete = {
        id: 'v-1',
        controlId: 'ctrl-1',
        versionNumber: 1,
        isCurrent: false,
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue(versionToDelete);
      (prismaMock.evidenceVersion.delete as jest.Mock<any>).mockResolvedValue(versionToDelete);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await controller.deleteVersion(mockReq, mockRes, mockNext);

      expect(prismaMock.evidenceVersion.delete).toHaveBeenCalledWith({
        where: { id: 'v-1' },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: expect.stringContaining('Evidence version 1 deleted'),
          userId: 'user-1',
          organizationId: 'org-1',
        }),
      });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Version deleted successfully' });
    });

    it('should throw AppError 400 when attempting to delete the current version', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-2' };
      const currentVersion = {
        id: 'v-2',
        controlId: 'ctrl-1',
        versionNumber: 2,
        isCurrent: true,
      };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue(currentVersion);

      await expect(controller.deleteVersion(mockReq, mockRes, mockNext)).rejects.toThrow(AppError);
      await expect(controller.deleteVersion(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Cannot delete current version. Restore another version first.',
      );
    });

    it('should throw AppError 404 when control not found', async () => {
      mockReq.params = { controlId: 'ctrl-bad', versionId: 'v-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(controller.deleteVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Control not found');
    });

    it('should throw AppError 404 when version not found', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-nonexistent' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(controller.deleteVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Version not found');
    });

    it('should throw AppError 500 on unexpected error during delete', async () => {
      mockReq.params = { controlId: 'ctrl-1', versionId: 'v-1' };

      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(mockControl);
      (prismaMock.evidenceVersion.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'v-1', controlId: 'ctrl-1', versionNumber: 1, isCurrent: false,
      });
      (prismaMock.evidenceVersion.delete as jest.Mock<any>).mockRejectedValue(new Error('Constraint violation'));

      await expect(controller.deleteVersion(mockReq, mockRes, mockNext)).rejects.toThrow('Failed to delete version');
    });
  });
});
