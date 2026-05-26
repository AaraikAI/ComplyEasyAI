/**
 * Anchor blob store.
 *
 * Persists evidence file buffers in S3 between an inline anchor failure and a
 * retry attempt. Reduces Redis memory pressure compared with storing base64
 * payloads inline in BullMQ jobs. Falls back to a base64 payload when S3 is
 * not configured (dev/test).
 *
 * Blobs are short-lived: deleted after successful retry, after final retry
 * failure (audit row still preserves the trail), or by the bucket lifecycle
 * policy if neither path runs (cleanup-on-orphans).
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import logger from '../../config/logger';

interface PutResult {
  s3Bucket: string;
  s3Key: string;
}

let cachedClient: S3Client | null = null;

function getClient(): S3Client | null {
  if (!config.aws.s3Bucket || !config.aws.region) return null;
  if (cachedClient) return cachedClient;

  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region: config.aws.region,
  };
  if (config.aws.accessKeyId && config.aws.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    };
  }
  cachedClient = new S3Client(clientConfig);
  return cachedClient;
}

export function isAnchorBlobStoreAvailable(): boolean {
  return getClient() !== null && Boolean(config.aws.s3Bucket);
}

export async function putAnchorBlob(
  organizationId: string,
  evidenceId: string,
  buffer: Buffer,
  mimeType: string = 'application/octet-stream'
): Promise<PutResult | null> {
  const client = getClient();
  if (!client || !config.aws.s3Bucket) return null;

  const safeEvidence = evidenceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const s3Key = `${organizationId}/anchor-retries/${safeEvidence}/${uuidv4()}.bin`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        evidenceId: safeEvidence,
        organizationId,
        purpose: 'anchor-retry',
      },
      // Tag for S3 lifecycle policy — `purpose=anchor-retry` is the discriminator
      // the bucket-level rule uses to expire orphaned blobs after 7 days.
      Tagging: 'purpose=anchor-retry',
    })
  );

  logger.info(`[AnchorBlobStore] Persisted retry blob to s3://${config.aws.s3Bucket}/${s3Key}`);
  return { s3Bucket: config.aws.s3Bucket, s3Key };
}

export async function getAnchorBlob(s3Bucket: string, s3Key: string): Promise<Buffer> {
  const client = getClient();
  if (!client) {
    logger.error('anchorBlobStore.getAnchorBlob: S3 client not configured', {
      err: 'BLOB_BUCKET or AWS region unset',
      s3Bucket,
      s3Key,
    });
    throw new Error('anchorBlobStore.getAnchorBlob: anchor blob store is not configured');
  }

  const result = await client.send(new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key }));

  if (!result.Body) {
    logger.error('anchorBlobStore.getAnchorBlob: empty body returned from S3', {
      err: 'empty S3 response body',
      s3Bucket,
      s3Key,
    });
    throw new Error(`anchorBlobStore.getAnchorBlob: empty body for s3://${s3Bucket}/${s3Key}`);
  }
  // result.Body is a stream in Node; AWS SDK v3 exposes transformToByteArray().
  const stream = result.Body as { transformToByteArray?: () => Promise<Uint8Array> };
  if (typeof stream.transformToByteArray === 'function') {
    const bytes = await stream.transformToByteArray();
    return Buffer.from(bytes);
  }
  // Fallback for node streams
  const chunks: Buffer[] = [];
  for await (const chunk of result.Body as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteAnchorBlob(s3Bucket: string, s3Key: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: s3Key }));
    logger.info(`[AnchorBlobStore] Deleted retry blob s3://${s3Bucket}/${s3Key}`);
  } catch (error) {
    logger.warn(`[AnchorBlobStore] Failed to delete retry blob s3://${s3Bucket}/${s3Key}`, error);
  }
}
