/**
 * Azure Sync Job
 * Scheduled job for automatic synchronization of Azure data.
 * Can be triggered by cron or manually via API.
 */

import logger from '../config/logger';
import prisma from '../config/database';
import azureSyncService from '../services/integrations/azureSyncService';

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

    // Run immediately on start, then schedule
    this.runSyncCycle().catch(error => {
      logger.error('[AzureSyncJob] Initial sync cycle failed', error);
    });

    this.intervalId = setInterval(() => {
      this.runSyncCycle().catch(error => {
        logger.error('[AzureSyncJob] Scheduled sync cycle failed', error);
      });
    }, intervalMs);

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

      // Process in batches with concurrency limit
      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      for (let i = 0; i < orgsToSync.length; i += this.config.batchSize) {
        const batch = orgsToSync.slice(i, i + this.config.batchSize);

        // Process batch with concurrency limit
        const batchPromises = batch.map(async (orgId) => {
          try {
            const result = await azureSyncService.runFullSync(orgId, 'system');
            if (result.success) {
              succeeded++;
            } else {
              failed++;
              logger.warn(`[AzureSyncJob] Sync for org ${orgId} completed with errors`);
            }
          } catch (error: any) {
            failed++;
            logger.error(`[AzureSyncJob] Sync failed for org ${orgId}`, error);
          }
          processed++;
        });

        // Wait for batch to complete
        await Promise.allSettled(batchPromises);

        logger.info(`[AzureSyncJob] Progress: ${processed}/${orgsToSync.length} organizations processed`);
      }

      const duration = Date.now() - startTime;
      logger.info(`[AzureSyncJob] Sync cycle completed: ${succeeded} succeeded, ${failed} failed, ${duration}ms`);

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
