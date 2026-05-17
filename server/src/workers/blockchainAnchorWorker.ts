/**
 * Blockchain Anchor retry worker.
 *
 * Consumes BLOCKCHAIN_ANCHOR jobs (enqueued when the inline anchor attempt in
 * evidenceTruthLayerService.analyzeAndAnchor fails). On success, persists the
 * anchor record onto the most recent EvidenceAnalysis row. On final attempt
 * failure, writes a permanent-failure audit log row so the integrity trail is
 * preserved. Cleans up S3-backed payloads on success and on permanent failure.
 */

import jobQueueService, { QUEUE_NAMES, Job } from '../services/queue/jobQueue';
import prisma from '../config/database';
import logger from '../config/logger';
import { recordAnchorDuration } from '../services/monitoring/anchorSLA';
import { getAnchorBlob, deleteAnchorBlob } from '../services/queue/anchorBlobStore';
import { anchorPermanentFailures } from '../services/monitoring/metrics';

interface AnchorJobData {
  evidenceId: string;
  organizationId: string;
  // S3-backed payload (preferred)
  s3Bucket?: string;
  s3Key?: string;
  // Inline-base64 payload (fallback when S3 isn't configured)
  fileBufferBase64?: string;
  metadata: {
    filename?: string;
    mimeType?: string;
    controlId?: string;
    frameworkId?: string;
  };
  network: 'ethereum' | 'polygon' | 'hyperledger';
}

async function loadFileBuffer(data: AnchorJobData): Promise<Buffer> {
  if (data.s3Bucket && data.s3Key) {
    return getAnchorBlob(data.s3Bucket, data.s3Key);
  }
  if (data.fileBufferBase64) {
    return Buffer.from(data.fileBufferBase64, 'base64');
  }
  throw new Error('Anchor retry job has no payload (neither S3 key nor base64 buffer)');
}

export function registerBlockchainAnchorWorker(): void {
  jobQueueService.registerProcessor<AnchorJobData>(
    QUEUE_NAMES.BLOCKCHAIN_ANCHOR,
    async (job: Job<AnchorJobData>) => {
      const { evidenceId, organizationId, metadata, network, s3Bucket, s3Key } = job.data;
      const start = Date.now();

      let fileBuffer: Buffer;
      try {
        fileBuffer = await loadFileBuffer(job.data);
      } catch (loadError) {
        logger.error(`[AnchorWorker] Failed to load retry payload for ${evidenceId}`, loadError);
        throw loadError;
      }

      try {
        const blockchainService = (await import('../services/advanced/blockchainService')).default;
        const anchor = await blockchainService.anchorEvidenceHash(
          organizationId,
          evidenceId,
          fileBuffer,
          metadata,
          network
        );

        recordAnchorDuration(Date.now() - start, network, 'success');

        const latest = await prisma.evidenceAnalysis.findFirst({
          where: { evidenceId, organizationId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, physicalAttestation: true },
        });

        if (latest) {
          const prev = (latest.physicalAttestation as Record<string, unknown> | null) ?? {};
          await prisma.evidenceAnalysis.update({
            where: { id: latest.id },
            data: {
              physicalAttestation: {
                ...prev,
                blockchainAnchor: {
                  evidenceHash: anchor.evidenceHash,
                  transactionHash: anchor.transactionHash,
                  blockNumber: anchor.blockNumber,
                  anchoredAt: anchor.anchoredAt.toISOString(),
                  network: anchor.network,
                  recoveredFromRetry: true,
                  retryAttempt: job.attemptsMade,
                },
              },
            },
          });
        } else {
          logger.warn(
            `[AnchorWorker] No EvidenceAnalysis row to attach anchor to for ${evidenceId} (org ${organizationId})`
          );
        }

        // Clean up S3 retry blob on success
        if (s3Bucket && s3Key) {
          await deleteAnchorBlob(s3Bucket, s3Key);
        }

        logger.info(
          `[AnchorWorker] Anchor recovered on retry ${job.attemptsMade} for ${evidenceId} tx=${anchor.transactionHash}`
        );
        return { success: true, transactionHash: anchor.transactionHash };
      } catch (error) {
        recordAnchorDuration(Date.now() - start, network, 'failure');
        const finalAttempt = job.attemptsMade + 1 >= job.maxAttempts;
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (finalAttempt) {
          try {
            await prisma.auditLog.create({
              data: {
                action: 'evidence_truth_layer.anchor_failed_permanently',
                organizationId,
                userId: 'system',
                hash: '',
                details: JSON.stringify({
                  evidenceId,
                  network,
                  attempts: job.attemptsMade + 1,
                  error: message,
                }),
              },
            });
          } catch (auditError) {
            logger.error('[AnchorWorker] Failed to write permanent-failure audit log', auditError);
          }

          try {
            anchorPermanentFailures.labels(network).inc();
          } catch {
            // metrics optional
          }

          // Clean up S3 retry blob even on permanent failure — audit log preserves trail
          if (s3Bucket && s3Key) {
            await deleteAnchorBlob(s3Bucket, s3Key);
          }

          logger.error(
            `[AnchorWorker] Anchor permanently failed for ${evidenceId} after ${job.attemptsMade + 1} attempts: ${message}`
          );
        } else {
          logger.warn(
            `[AnchorWorker] Anchor attempt ${job.attemptsMade + 1}/${job.maxAttempts} failed for ${evidenceId}: ${message} — will retry`
          );
        }

        throw error;
      }
    }
  );

  logger.info('[AnchorWorker] Blockchain anchor retry worker registered');
}
