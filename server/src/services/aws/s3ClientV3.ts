/**
 * AWS SDK v3 S3 Client
 *
 * Migration from aws-sdk v2 to @aws-sdk/client-s3 v3
 * - Improved security (addresses GHSA-j965-2qgj-vjmq)
 * - Modular imports for smaller bundle size
 * - Better TypeScript support
 * - Modern async/await patterns
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface UploadOptions {
  file: MulterFile;
  userId: string;
  organizationId: string;
  folder?: string;
  tags?: Record<string, string>;
}

interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  s3Key: string;
  etag?: string;
}

interface S3ServiceConfig {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate AWS region format (security fix for GHSA-j965-2qgj-vjmq)
 */
function validateRegion(region: string): string {
  if (!region || typeof region !== 'string') {
    throw new AppError('AWS region must be a non-empty string', 400);
  }
  // AWS region format: us-east-1, eu-west-2, ap-northeast-1, etc.
  if (!/^[a-z]{2}-[a-z]+-\d+$/.test(region)) {
    // Also allow gov and special regions
    if (!/^[a-z0-9-]+$/.test(region)) {
      throw new AppError(`Invalid AWS region format: ${region}`, 400);
    }
  }
  return region;
}

/**
 * Validate S3 bucket name
 */
function validateBucketName(bucket: string): string {
  if (!bucket || typeof bucket !== 'string') {
    throw new AppError('S3 bucket name must be a non-empty string', 400);
  }
  // S3 bucket naming rules
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new AppError(`Invalid S3 bucket name: ${bucket}`, 400);
  }
  return bucket;
}

// ============================================================================
// S3 CLIENT V3 SERVICE
// ============================================================================

export class S3ServiceV3 {
  private client: S3Client;
  private bucket: string;
  private region: string;

  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/json',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
  ];

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  constructor(serviceConfig?: S3ServiceConfig) {
    const region = validateRegion(serviceConfig?.region || config.aws.region || 'us-east-1');
    this.bucket = validateBucketName(serviceConfig?.bucket || config.aws.s3Bucket || '');
    this.region = region;

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region,
    };

    // Use explicit credentials if provided
    if (serviceConfig?.accessKeyId && serviceConfig?.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: serviceConfig.accessKeyId,
        secretAccessKey: serviceConfig.secretAccessKey,
      };
    } else if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }
    // Otherwise, SDK will use default credential provider chain (IAM roles, env vars, etc.)

    // Custom endpoint for S3-compatible services (MinIO, LocalStack)
    if (serviceConfig?.endpoint) {
      clientConfig.endpoint = serviceConfig.endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);

    logger.info('[S3v3] S3 client initialized', { region, bucket: this.bucket });
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { file, userId, organizationId, folder = 'uploads', tags } = options;

    // Validate configuration
    if (!this.bucket) {
      throw new AppError('S3 bucket not configured', 400);
    }

    // Validate file
    this.validateFile(file);

    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const filename = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${organizationId}/${folder}/${filename}`;

    logger.info('[S3v3] Uploading file', { bucket: this.bucket, key: s3Key, size: file.size });

    try {
      // Use multipart upload for larger files
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ServerSideEncryption: 'AES256',
          Metadata: {
            uploadedBy: userId,
            organizationId,
            originalName: file.originalname,
          },
          Tagging: tags ? Object.entries(tags).map(([k, v]) => `${k}=${v}`).join('&') : undefined,
        },
      });

      const result = await upload.done();
      const location = result.Location || `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`;

      // Save to database
      const fileRecord = await prisma.fileUpload.create({
        data: {
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          s3Key,
          s3Bucket: this.bucket,
          url: location,
          uploadedBy: userId,
          organizationId,
          metadata: {
            folder,
            etag: result.ETag,
            versionId: result.VersionId,
          },
        },
      });

      logger.info('[S3v3] File uploaded successfully', { id: fileRecord.id, key: s3Key });

      return {
        id: fileRecord.id,
        url: location,
        filename,
        size: file.size,
        mimeType: file.mimetype,
        s3Key,
        etag: result.ETag,
      };
    } catch (error: any) {
      logger.error('[S3v3] Upload failed', { error: error.message, key: s3Key });

      if (error.name === 'NoSuchBucket') {
        throw new AppError(`S3 bucket "${this.bucket}" does not exist`, 404);
      }
      if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        throw new AppError('Invalid AWS credentials', 403);
      }

      throw new AppError(`Upload failed: ${error.message}`, 500);
    }
  }

  /**
   * Get a signed URL for downloading a file
   */
  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    logger.debug('[S3v3] Generated signed URL', { key: s3Key, expiresIn });
    return url;
  }

  /**
   * Get a signed URL for uploading a file directly to S3
   */
  async getUploadSignedUrl(
    s3Key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    logger.debug('[S3v3] Generated upload signed URL', { key: s3Key, expiresIn });
    return url;
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    await this.client.send(command);
    logger.info('[S3v3] File deleted', { key: s3Key });
  }

  /**
   * Delete a file by ID (with database cleanup)
   */
  async deleteFileById(fileId: string, organizationId: string): Promise<void> {
    const file = await prisma.fileUpload.findFirst({
      where: { id: fileId, organizationId },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    await this.deleteFile(file.s3Key);

    await prisma.fileUpload.delete({
      where: { id: fileId },
    });

    logger.info('[S3v3] File deleted from S3 and database', { id: fileId, key: file.s3Key });
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(s3Key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Copy a file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
      ServerSideEncryption: 'AES256',
    });

    await this.client.send(command);
    logger.info('[S3v3] File copied', { from: sourceKey, to: destinationKey });
  }

  /**
   * List files in a prefix
   */
  async listFiles(prefix: string, maxKeys: number = 1000): Promise<any[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const result = await this.client.send(command);
    return result.Contents || [];
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: MulterFile): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const maxSizeMB = this.MAX_FILE_SIZE / 1024 / 1024;
      throw new AppError(
        `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of ${maxSizeMB}MB`, 400
      );
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        `File type "${file.mimetype}" not allowed. Allowed: PDF, Word, Excel, Images, Text, CSV, JSON, Audio, Video`, 400
      );
    }

    // Check for dangerous file extensions
    const filename = file.originalname.toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.msi'];

    for (const ext of dangerousExtensions) {
      if (filename.endsWith(ext)) {
        throw new AppError(`Executable file type ${ext} not allowed`, 400);
      }
    }
  }

  /**
   * Get the underlying S3 client for advanced operations
   */
  getClient(): S3Client {
    return this.client;
  }

  /**
   * Get bucket name
   */
  getBucket(): string {
    return this.bucket;
  }
}

// Default singleton instance
export const s3ServiceV3 = new S3ServiceV3();

export default s3ServiceV3;
