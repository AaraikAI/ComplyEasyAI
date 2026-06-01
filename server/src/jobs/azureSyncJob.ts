/**
 * Azure Sync Job
 * Scheduled job for automatic synchronization of Azure data.
 * Can be triggered by cron or manually via API.
 */

import logger from '../config/logger';
import prisma from '../config/database';
import azureSyncService from '../services/integrations/azureSyncService';
import jobQueueService, { QUEUE_NAMES } from '../services/queue/jobQueue';

/** Job name used for per-organization Azure sync work items. */
const AZURE_ORG_SYNC_JOB = 'azure-org-sync';

/** Bounded retry policy for per-org sync jobs. Exhausted attempts are routed
 *  to the shared dead-letter queue by the job queue service. */
const ORG_SYNC_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
};

let orgSyncProcessorRegistered = false;

/**
 * Register the processor that performs a single organization's full Azure sync.
 * Registered once; the job queue handles retries/backoff and dead-lettering so a
 * transient per-org failure is retried rather than silently dropped.
 */
function ensureOrgSyncProcessor(): void {
  if (orgSyncProcessorRegistered) return;
  orgSyncProcessorRegistered = true;

  jobQueueService.registerProcessor(QUEUE_NAMES.INTEGRATION_SYNC, async (job) => {
    if (job.name !== AZURE_ORG_SYNC_JOB) return;
    const organizationId = job.data.organizationId as string;
    const triggeredBy = (job.data.triggeredBy as string) || 'system';

    const result = await azureSyncService.runFullSync(organizationId, triggeredBy);
    if (!result.success) {
      // Surface as a failure so the queue applies its retry/backoff policy and,
      // once attempts are exhausted, routes the job to the dead-letter queue.
      throw new Error(`Azure sync for org ${organizationId} completed with errors`);
    }
    return result;
  });
}

interface AzureSyncJobConfig {
  // How often to run sync (in hours)
  syncIntervalHours: number;
  // Maximum concurrent syncs
  maxConcurrent: number;
  // Batch size for processing organizations
  batchSize: number;
}

const defaultConfig: AzureSyncJobConfig = {
  syncIntervalHours: 6, // Sync every 6 hours
  maxConcurrent: 5,
  batchSize: 10,
};

class AzureSyncJob {
  private config: AzureSyncJobConfig;
  private running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<AzureSyncJobConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Start the scheduled sync job
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('[AzureSyncJob] Job already running');
      return;
    }

    const intervalMs = this.config.syncIntervalHours * 60 * 60 * 1000;

    // Ensure the per-org sync processor (with retry/backoff + DLQ) is wired up.
    ensureOrgSyncProcessor();

    // Run immediately on start, then schedule
    this.runSyncCycle().catch(error => {
      logger.error('[AzureSyncJob] Initial sync cycle failed', error);
    });

    this.intervalId = setInterval(() => {
      this.runSyncCycle().catch(error => {
        logger.error('[AzureSyncJob] Scheduled sync cycle failed', error);
      });
    }, intervalMs);
    this.intervalId?.unref?.();

    logger.info(`[AzureSyncJob] Started with ${this.config.syncIntervalHours}h interval`);
  }

  /**
   * Stop the scheduled sync job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[AzureSyncJob] Stopped');
    }
  }

  /**
   * Run a sync cycle for all connected Azure integrations
   */
  async runSyncCycle(): Promise<void> {
    if (this.running) {
      logger.warn('[AzureSyncJob] Sync cycle already in progress, skipping');
      return;
    }

    this.running = true;
    const startTime = Date.now();

    try {
      logger.info('[AzureSyncJob] Starting sync cycle');

      // Find all organizations with connected Azure integrations
      const integrations = await prisma.integration.findMany({
        where: {
          provider: 'azure',
          connected: true,
        },
        select: {
          organizationId: true,
        },
      });

      logger.info(`[AzureSyncJob] Found ${integrations.length} connected Azure integrations`);

      if (integrations.length === 0) {
        logger.info('[AzureSyncJob] No Azure integrations to sync');
        return;
      }

      // Check which orgs need syncing (based on last sync time)
      const orgsToSync: string[] = [];
      const syncThreshold = new Date(Date.now() - this.config.syncIntervalHours * 60 * 60 * 1000);

      for (const integration of integrations) {
        const lastSync = await azureSyncService.getLatestSyncStatus(integration.organizationId);

        if (!lastSync || !lastSync.completedAt || lastSync.completedAt < syncThreshold) {
          orgsToSync.push(integration.organizationId);
        }
      }

      logger.info(`[AzureSyncJob] ${orgsToSync.length} organizations need syncing`);

      // Ensure the durable per-org processor is registered before enqueueing.
      ensureOrgSyncProcessor();

      // Enqueue each org sync as a bounded-retry job. The job queue applies
      // exponential backoff on transient failures and routes exhausted jobs to
      // the dead-letter queue, so a single org's failure no longer silently
      // drops until the next interval. A stable jobId per org+cycle de-dupes
      // overlapping cycles.
      const cycleStamp = Math.floor(startTime / (this.config.syncIntervalHours * 60 * 60 * 1000));
      let enqueued = 0;
      let enqueueFailed = 0;

      for (const orgId of orgsToSync) {
        try {
          await jobQueueService.addJob(
            QUEUE_NAMES.INTEGRATION_SYNC,
            AZURE_ORG_SYNC_JOB,
            { organizationId: orgId, triggeredBy: 'system' },
            { ...ORG_SYNC_JOB_OPTIONS, jobId: `azure-sync:${orgId}:${cycleStamp}` }
          );
          enqueued++;
        } catch (error) {
          enqueueFailed++;
          logger.error(`[AzureSyncJob] Failed to enqueue sync for org ${orgId}`, error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`[AzureSyncJob] Sync cycle dispatched: ${enqueued} org sync jobs enqueued, ${enqueueFailed} enqueue failures, ${duration}ms`);

    } catch (error) {
      logger.error('[AzureSyncJob] Sync cycle error', error);
    } finally {
      this.running = false;
    }
  }

  /**
   * Trigger a manual sync for a specific organization
   */
  async triggerManualSync(organizationId: string, triggeredBy?: string): Promise<any> {
    logger.info(`[AzureSyncJob] Manual sync triggered for org ${organizationId}`);

    try {
      // Check if integration is connected
      const integration = await prisma.integration.findUnique({
        where: {
          organizationId_provider: {
            organizationId,
            provider: 'azure',
          },
        },
      });

      if (!integration || !integration.connected) {
        throw new Error('Azure integration not connected');
      }

      const result = await azureSyncService.runFullSync(organizationId, triggeredBy);
      return result;
    } catch (error: any) {
      logger.error(`[AzureSyncJob] Manual sync failed for org ${organizationId}`, error);
      throw error;
    }
  }

  /**
   * Get sync status for an organization
   */
  async getSyncStatus(organizationId: string): Promise<{
    isRunning: boolean;
    lastSync: any | null;
    nextScheduledSync: Date | null;
    stats: any;
  }> {
    const [lastSync, stats] = await Promise.all([
      azureSyncService.getLatestSyncStatus(organizationId),
      azureSyncService.getSyncedResourceStats(organizationId),
    ]);

    // Calculate next scheduled sync
    let nextScheduledSync: Date | null = null;
    if (lastSync?.completedAt) {
      nextScheduledSync = new Date(
        lastSync.completedAt.getTime() + this.config.syncIntervalHours * 60 * 60 * 1000
      );
    }

    return {
      isRunning: lastSync?.status === 'running',
      lastSync,
      nextScheduledSync,
      stats,
    };
  }

  /**
   * Check if job is currently running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Check if scheduled job is active
   */
  isScheduled(): boolean {
    return this.intervalId !== null;
  }
}

// Export singleton instance
export const azureSyncJob = new AzureSyncJob();

// Export class for custom configurations
export { AzureSyncJob };
