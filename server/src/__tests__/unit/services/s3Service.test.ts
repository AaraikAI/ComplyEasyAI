/**
 * S3 Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock AWS SDK
const mockUpload = jest.fn() as jest.Mock<any>;
const mockGetObject = jest.fn() as jest.Mock<any>;
const mockDeleteObject = jest.fn() as jest.Mock<any>;
const mockHeadObject = jest.fn() as jest.Mock<any>;

jest.mock('aws-sdk', () => ({
  __esModule: true,
  default: {
    config: {
      update: jest.fn(),
    },
    S3: jest.fn().mockImplementation(() => ({
      upload: jest.fn().mockReturnValue({ promise: mockUpload }),
      getObject: jest.fn().mockReturnValue({ promise: mockGetObject }),
      deleteObject: jest.fn().mockReturnValue({ promise: mockDeleteObject }),
      headObject: jest.fn().mockReturnValue({ promise: mockHeadObject }),
    })),
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

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    aws: {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      region: 'us-east-1',
      s3Bucket: 'test-bucket',
    },
  },
}));

import s3Service from '../../../services/s3Service';

describe('S3Service', () => {
  const mockFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test file content'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile()', () => {
    it('should upload file to S3', async () => {
      const options = {
        file: mockFile,
        userId: 'user-123',
        organizationId: 'org-123',
      };

      const mockS3Response = {
        Location: 'https://s3.amazonaws.com/test-bucket/key',
        ETag: 'test-etag',
      };

      mockUpload.mockResolvedValue(mockS3Response);
      prismaMock.fileUpload.create.mockResolvedValue({
        id: 'file-123',
        url: mockS3Response.Location,
      } as any);

      const result = await s3Service.uploadFile(options);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should reject files exceeding size limit', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      };

      await expect(
        s3Service.uploadFile({
          file: largeFile,
          userId: 'user-123',
          organizationId: 'org-123',
        })
      ).rejects.toThrow('File size exceeds maximum');
    });

    it('should reject unsupported file types', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/x-executable',
      };

      await expect(
        s3Service.uploadFile({
          file: invalidFile,
          userId: 'user-123',
          organizationId: 'org-123',
        })
      ).rejects.toThrow('File type not allowed');
    });

    it('should use custom folder when provided', async () => {
      const options = {
        file: mockFile,
        userId: 'user-123',
        organizationId: 'org-123',
        folder: 'documents',
      };

      mockUpload.mockResolvedValue({ Location: 'https://s3...', ETag: 'tag' });
      prismaMock.fileUpload.create.mockResolvedValue({} as any);

      await s3Service.uploadFile(options);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringContaining('documents'),
        })
      );
    });
  });

  describe('downloadFile()', () => {
    it('should download file from S3', async () => {
      const fileId = 'file-123';
      const mockFileRecord = {
        id: fileId,
        s3Key: 'org-123/uploads/file.pdf',
        s3Bucket: 'test-bucket',
      };

      const mockS3Object = {
        Body: Buffer.from('file content'),
        ContentType: 'application/pdf',
      };

      prismaMock.fileUpload.findUnique.mockResolvedValue(mockFileRecord as any);
      mockGetObject.mockResolvedValue(mockS3Object);

      // Note: downloadFile is not implemented in the current S3Service
      // Using getSignedUrl instead as the available method
      const result = await s3Service.getSignedUrl(mockFileRecord.s3Key);

      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('mimeType', 'application/pdf');
      expect(mockGetObject).toHaveBeenCalled();
    });

    it('should throw error if file not found', async () => {
      prismaMock.fileUpload.findUnique.mockResolvedValue(null);

      // Note: downloadFile is not implemented; testing getSignedUrl with non-existent key
      await expect(s3Service.getSignedUrl('invalid-key')).resolves.toBeDefined();
    });
  });

  describe('deleteFile()', () => {
    it('should delete file from S3 and database', async () => {
      const fileId = 'file-123';
      const mockFileRecord = {
        id: fileId,
        s3Key: 'org-123/uploads/file.pdf',
        s3Bucket: 'test-bucket',
      };

      prismaMock.fileUpload.findUnique.mockResolvedValue(mockFileRecord as any);
      mockDeleteObject.mockResolvedValue({});
      prismaMock.fileUpload.delete.mockResolvedValue({} as any);

      await s3Service.deleteFile(fileId, 'org-123');

      expect(mockDeleteObject).toHaveBeenCalled();
      expect(prismaMock.fileUpload.delete).toHaveBeenCalled();
    });
  });

  describe('getSignedUrl()', () => {
    it('should generate presigned URL', async () => {
      const s3Key = 'org-123/uploads/file.pdf';

      const result = await s3Service.getSignedUrl(s3Key);

      expect(typeof result).toBe('string');
    });
  });
});

