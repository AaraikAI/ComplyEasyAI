/**
 * S3 Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock AWS SDK - use top-level mock fns so they survive resetMocks
const mockUploadPromise = jest.fn() as jest.Mock<any>;
const mockDeleteObjectPromise = jest.fn() as jest.Mock<any>;
const mockS3Upload = jest.fn() as jest.Mock<any>;
const mockS3DeleteObject = jest.fn() as jest.Mock<any>;
const mockS3GetSignedUrlPromise = jest.fn() as jest.Mock<any>;

jest.mock('aws-sdk', () => ({
  __esModule: true,
  default: {
    config: {
      update: jest.fn(),
    },
    S3: jest.fn().mockImplementation(() => ({
      upload: mockS3Upload,
      deleteObject: mockS3DeleteObject,
      getSignedUrlPromise: mockS3GetSignedUrlPromise,
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
    // Re-set mock implementations that get cleared by resetMocks: true
    mockS3Upload.mockReturnValue({ promise: mockUploadPromise });
    mockS3DeleteObject.mockReturnValue({ promise: mockDeleteObjectPromise });
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

      mockUploadPromise.mockResolvedValue(mockS3Response);
      prismaMock.fileUpload.create.mockResolvedValue({
        id: 'file-123',
        url: mockS3Response.Location,
        filename: 'test.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      } as any);

      const result = await s3Service.uploadFile(options);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(mockUploadPromise).toHaveBeenCalled();
    });

    it('should reject files exceeding size limit', async () => {
      const largeFile = {
        ...mockFile,
        size: 51 * 1024 * 1024, // 51MB exceeds 50MB limit
      };

      await expect(
        s3Service.uploadFile({
          file: largeFile,
          userId: 'user-123',
          organizationId: 'org-123',
        })
      ).rejects.toThrow('exceeds maximum');
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
      ).rejects.toThrow('is not allowed');
    });

    it('should use custom folder when provided', async () => {
      const options = {
        file: mockFile,
        userId: 'user-123',
        organizationId: 'org-123',
        folder: 'documents',
      };

      mockUploadPromise.mockResolvedValue({ Location: 'https://s3...', ETag: 'tag' });
      prismaMock.fileUpload.create.mockResolvedValue({
        id: 'file-123',
        url: 'https://s3...',
        filename: 'test.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      } as any);

      await s3Service.uploadFile(options);

      // Verify the upload was called with the key containing 'documents'
      expect(mockS3Upload).toHaveBeenCalled();
      const uploadParams = mockS3Upload.mock.calls[0][0] as any;
      expect(uploadParams.Key).toContain('documents');
    });
  });

  describe('downloadFile()', () => {
    it('should download file from S3', async () => {
      const s3Key = 'org-123/uploads/file.pdf';
      const mockUrl = 'https://s3.amazonaws.com/test-bucket/signed-url';

      mockS3GetSignedUrlPromise.mockResolvedValue(mockUrl);

      // getSignedUrl returns a string URL
      const result = await s3Service.getSignedUrl(s3Key);

      expect(typeof result).toBe('string');
      expect(result).toBe(mockUrl);
      expect(mockS3GetSignedUrlPromise).toHaveBeenCalledWith('getObject', expect.objectContaining({
        Key: s3Key,
      }));
    });

    it('should throw error on failure', async () => {
      mockS3GetSignedUrlPromise.mockRejectedValue(new Error('Access denied'));

      await expect(s3Service.getSignedUrl('invalid-key')).rejects.toThrow('Failed to generate download URL');
    });
  });

  describe('deleteFile()', () => {
    it('should delete file from S3 and database', async () => {
      const fileId = 'file-123';
      const mockFileRecord = {
        id: fileId,
        s3Key: 'org-123/uploads/file.pdf',
        s3Bucket: 'test-bucket',
        filename: 'file.pdf',
      };

      // deleteFile uses findFirst, not findUnique
      prismaMock.fileUpload.findFirst.mockResolvedValue(mockFileRecord as any);
      mockDeleteObjectPromise.mockResolvedValue({});
      prismaMock.fileUpload.delete.mockResolvedValue({} as any);

      await s3Service.deleteFile(fileId, 'org-123');

      expect(mockS3DeleteObject).toHaveBeenCalled();
      expect(prismaMock.fileUpload.delete).toHaveBeenCalled();
    });
  });

  describe('getSignedUrl()', () => {
    it('should generate presigned URL', async () => {
      const s3Key = 'org-123/uploads/file.pdf';
      const mockUrl = 'https://s3.amazonaws.com/test-bucket/signed-url';

      mockS3GetSignedUrlPromise.mockResolvedValue(mockUrl);

      const result = await s3Service.getSignedUrl(s3Key);

      expect(typeof result).toBe('string');
      expect(result).toBe(mockUrl);
    });
  });
});
