import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const s3 = new AWS.S3();

interface UploadOptions {
  file: Express.Multer.File;
  userId: string;
  organizationId: string;
  folder?: string;
}

interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

class S3Service {
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/json',
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(options.file);

      const fileExtension = options.file.originalname.split('.').pop();
      const filename = `${uuidv4()}.${fileExtension}`;
      const folder = options.folder || 'uploads';
      const s3Key = `${options.organizationId}/${folder}/${filename}`;

      // Upload to S3
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: config.aws.s3Bucket,
        Key: s3Key,
        Body: options.file.buffer,
        ContentType: options.file.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: {
          uploadedBy: options.userId,
          organizationId: options.organizationId,
          originalName: options.file.originalname,
        },
      };

      const s3Response = await s3.upload(uploadParams).promise();

      // Save to database
      const fileRecord = await prisma.fileUpload.create({
        data: {
          filename,
          originalName: options.file.originalname,
          mimeType: options.file.mimetype,
          size: options.file.size,
          s3Key,
          s3Bucket: config.aws.s3Bucket,
          url: s3Response.Location,
          uploadedBy: options.userId,
          organizationId: options.organizationId,
          metadata: {
            folder,
            etag: s3Response.ETag,
          },
        },
      });

      logger.info(`File uploaded: ${filename} by user ${options.userId}`);

      return {
        id: fileRecord.id,
        url: fileRecord.url,
        filename: fileRecord.filename,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
      };
    } catch (error) {
      logger.error('File upload failed', error);
      throw new Error('Failed to upload file');
    }
  }

  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: config.aws.s3Bucket,
        Key: s3Key,
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFile(fileId: string, organizationId: string): Promise<void> {
    try {
      const file = await prisma.fileUpload.findFirst({
        where: {
          id: fileId,
          organizationId,
        },
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Delete from S3
      await s3.deleteObject({
        Bucket: file.s3Bucket,
        Key: file.s3Key,
      }).promise();

      // Delete from database
      await prisma.fileUpload.delete({
        where: { id: fileId },
      });

      logger.info(`File deleted: ${file.filename}`);
    } catch (error) {
      logger.error('Failed to delete file', error);
      throw new Error('Failed to delete file');
    }
  }

  async listFiles(organizationId: string, folder?: string): Promise<any[]> {
    try {
      const files = await prisma.fileUpload.findMany({
        where: {
          organizationId,
          ...(folder && {
            metadata: {
              path: ['folder'],
              equals: folder,
            },
          }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          createdAt: true,
          uploadedBy: true,
        },
      });

      return files;
    } catch (error) {
      logger.error('Failed to list files', error);
      throw new Error('Failed to list files');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }

    // Check for malicious file extensions
    const filename = file.originalname.toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js'];

    for (const ext of dangerousExtensions) {
      if (filename.endsWith(ext)) {
        throw new Error('Potentially dangerous file type');
      }
    }
  }

  async scanFileForVirus(fileBuffer: Buffer): Promise<boolean> {
    // In production, integrate with AWS S3 Virus Scanning or ClamAV
    // For now, just return true (clean)
    logger.info('Virus scan placeholder - file assumed clean');
    return true;
  }
}

export default new S3Service();
