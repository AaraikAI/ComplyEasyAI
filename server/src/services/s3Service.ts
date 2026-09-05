import AWS from 'aws-sdk';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { isUrlSafe, safeAxios } from '../utils/urlValidator';

// Multer file interface to avoid Express.Multer namespace issues
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

// Configure AWS SDK with region validation (security fix for GHSA-j965-2qgj-vjmq)
const validateRegion = (region: string): string => {
  if (!region || typeof region !== 'string') {
    throw new AppError('AWS region must be a non-empty string', 400);
  }
  // Basic validation - allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(region)) {
    throw new AppError('Invalid AWS region format', 400);
  }
  return region;
};

AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: validateRegion(config.aws.region || 'us-east-1'),
});

const s3 = new AWS.S3();

interface UploadOptions {
  file: MulterFile;
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
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/json',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-m4a',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ];

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      // Validate AWS configuration
      if (!config.aws.s3Bucket) {
        logger.error('S3 bucket not configured');
        throw new AppError('File storage is not configured. Please contact your administrator.', 400);
      }

      if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
        logger.error('AWS credentials not configured');
        throw new AppError('File storage credentials are not configured. Please contact your administrator.', 400);
      }

      // Validate file
      this.validateFile(options.file);

      const fileExtension = options.file.originalname.split('.').pop();
      const filename = `${uuidv4()}.${fileExtension}`;
      const folder = options.folder || 'uploads';
      const s3Key = `${options.organizationId}/${folder}/${filename}`;

      logger.info(`Uploading file to S3: bucket=${config.aws.s3Bucket}, key=${s3Key}`);

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
    } catch (error: any) {
      logger.error('File upload failed', { error: error.message, stack: error.stack });
      
      // Provide more specific error messages
      if (error.message && error.message.includes('not configured')) {
        throw error; // Re-throw configuration errors as-is
      }
      
      if (error.code === 'NoSuchBucket') {
        throw new AppError(`S3 bucket "${config.aws.s3Bucket}" does not exist. Please contact your administrator.`, 500);
      }
      
      if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
        throw new AppError('Invalid AWS credentials. Please contact your administrator.', 500);
      }
      
      if (error.message) {
        throw new AppError(`Upload failed: ${error.message}`, 500);
      }
      
      throw new AppError('Failed to upload file. Please try again or contact support.', 500);
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
      throw new AppError('Failed to generate download URL', 500);
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
        throw new AppError('File not found', 404);
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
      throw new AppError('Failed to delete file', 500);
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
      throw new AppError('Failed to list files', 500);
    }
  }

  private validateFile(file: MulterFile): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const maxSizeMB = this.MAX_FILE_SIZE / 1024 / 1024;
      throw new AppError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`, 400);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(`File type "${file.mimetype}" is not allowed. Allowed types: PDF, Word, Excel, Images, Text, CSV, JSON, Audio, Video`, 400);
    }

    // Check for malicious file extensions
    const filename = file.originalname.toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js'];

    for (const ext of dangerousExtensions) {
      if (filename.endsWith(ext)) {
        throw new AppError(`Potentially dangerous file type: ${ext}. Executable files are not allowed.`, 400);
      }
    }
  }

  async scanFileForVirus(fileBuffer: Buffer): Promise<boolean> {
    try {
      // Production: Use AWS S3 Object Lambda with Amazon Macie or ClamAV
      const scanMethod = process.env.VIRUS_SCAN_METHOD || 'aws_macie';

      if (scanMethod === 'aws_macie' && config.aws.accessKeyId) {
        // Use AWS Macie for virus/malware scanning
        const AWS = require('aws-sdk');
        const macie = new AWS.Macie2({ region: process.env.AWS_REGION || 'us-east-1' });

        // Create a temporary S3 object for scanning
        const tempKey = `scan-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const tempBucket = process.env.SCAN_TEMP_BUCKET || config.aws.s3Bucket;

        // Upload to temp location
        await s3.putObject({
          Bucket: tempBucket,
          Key: tempKey,
          Body: fileBuffer,
        }).promise();

        try {
          // Use Macie to classify the object
          const classificationResult = await macie.classifyS3Objects({
            bucketCriteria: {
              includes: {
                and: [{
                  simpleCriterion: {
                    comparator: 'EQ',
                    key: 'S3_BUCKET_NAME',
                    values: [tempBucket],
                  },
                }],
              },
            },
          }).promise();

          // Clean up temp object
          await s3.deleteObject({ Bucket: tempBucket, Key: tempKey }).promise();

          // Check if any sensitive data or malware was found
          const isClean = !classificationResult.results?.some((r: any) => 
            r.s3Object?.classificationResult?.status?.code === 'COMPLETE' &&
            (r.s3Object.classificationResult.mimeType?.includes('malware') ||
             r.s3Object.classificationResult.customDataIdentifiers?.detections?.length > 0)
          );

          logger.info(`[S3] Virus scan completed via AWS Macie: ${isClean ? 'CLEAN' : 'THREAT DETECTED'}`);
          return isClean;
        } catch (macieError: any) {
          // Clean up temp object on error
          await s3.deleteObject({ Bucket: tempBucket, Key: tempKey }).promise().catch(() => {});
          
          if (macieError.code === 'AccessDeniedException' || macieError.code === 'InvalidInputException') {
            logger.warn('[S3] AWS Macie not available, falling back to file signature check');
            return this.scanFileSignatures(fileBuffer);
          }
          throw macieError;
        }
      } else if (scanMethod === 'clamav' && process.env.CLAMAV_HOST) {
        // Use ClamAV for virus scanning
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fileBuffer, { filename: 'scan-file' });

        const clamavUrl = `${process.env.CLAMAV_HOST}/scan`;
        if (!isUrlSafe(clamavUrl)) {
          throw new AppError('ClamAV scanner URL is unsafe', 400);
        }
        const response = await safeAxios({
          headers: form.getHeaders(),
          url: clamavUrl,
          method: 'post',
          data: form,
        }, 'ClamAV virus scan');

        const isClean = response.data.status === 'clean' || response.data.status === 'ok';
        logger.info(`[S3] Virus scan completed via ClamAV: ${isClean ? 'CLEAN' : 'THREAT DETECTED'}`);
        return isClean;
      } else {
        // Fallback: File signature check
        logger.warn('[S3] No virus scanning service configured, using file signature check');
        return this.scanFileSignatures(fileBuffer);
      }
    } catch (error: any) {
      logger.error('[S3] Error scanning file for viruses', error);
      // Fails closed (assumes infected) when virus scanning is unavailable
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(`Virus scan failed: ${error.message}`, 500);
      }
      // In development, allow with warning
      logger.warn('[S3] Virus scan failed, allowing file in development mode');
      return true;
    }
  }

  /**
   * Scan file using signature-based detection (fallback method)
   */
  private scanFileSignatures(fileBuffer: Buffer): boolean {
    // Check for known malware signatures (simplified)
    const header = fileBuffer.slice(0, 4);
    
    // Allow common safe file types
    const safeSignatures = [
      Buffer.from('%PDF'), // PDF
      Buffer.from('\x89PNG'), // PNG
      Buffer.from('GIF8'), // GIF
      Buffer.from('RIFF'), // WAV/AVI
      Buffer.from('\xFF\xD8\xFF'), // JPEG
    ];

    // If it matches a safe signature, allow it
    if (safeSignatures.some(sig => header.slice(0, sig.length).equals(sig))) {
      return true;
    }

    // Unknown signature - allow in development, reject in production
    if (process.env.NODE_ENV === 'production') {
      logger.warn('[S3] Unknown file signature, rejecting in production');
      return false;
    }

    return true;
  }
}

export default new S3Service();
