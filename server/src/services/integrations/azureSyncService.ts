/**
 * Azure Sync Service
 * Handles synchronization of Azure data to the database with full persistence.
 * This service extends the base azureService to add data persistence capabilities.
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import azureService from './azureService';
import { AuditLogger } from '../../utils/auditLogger';

type SyncType = 'full' | 'incremental' | 'resources' | 'security' | 'users' | 'policies';

interface SyncResult {
  success: boolean;
  syncType: SyncType;
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  duration: number;
}

interface FullSyncResult {
  success: boolean;
  jobId: string;
  results: {
    resources: SyncResult;
    securityFindings: SyncResult;
    securityAlerts: SyncResult;
    policyCompliance: SyncResult;
    users: SyncResult;
  };
  totalDuration: number;
}

class AzureSyncService {
  /**
   * Create a new sync job record
   */
  private async createSyncJob(
    organizationId: string,
    syncType: SyncType,
    triggeredBy?: string
  ): Promise<string> {
    const job = await prisma.azureSyncJob.create({
      data: {
        organizationId,
        syncType,
        status: 'pending',
        triggeredBy,
      },
    });
    return job.id;
  }

  /**
   * Update sync job status
   */
  private async updateSyncJob(
    jobId: string,
    data: {
      status?: string;
      startedAt?: Date;
      completedAt?: Date;
      itemsSynced?: number;
      itemsFailed?: number;
      errorMessage?: string;
      errorDetails?: any;
    }
  ): Promise<void> {
    await prisma.azureSyncJob.update({
      where: { id: jobId },
      data,
    });
  }

  /**
   * Run a full sync of all Azure data
   */
  async runFullSync(
    organizationId: string,
    triggeredBy?: string
  ): Promise<FullSyncResult> {
    const startTime = Date.now();
    const jobId = await this.createSyncJob(organizationId, 'full', triggeredBy);

    logger.info(`[AzureSync] Starting full sync for org ${organizationId}, job ${jobId}`);

    await this.updateSyncJob(jobId, { status: 'running', startedAt: new Date() });

    const results = {
      resources: { success: false, syncType: 'resources' as SyncType, itemsSynced: 0, itemsFailed: 0, errors: [] as string[], duration: 0 },
      securityFindings: { success: false, syncType: 'security' as SyncType, itemsSynced: 0, itemsFailed: 0, errors: [] as string[], duration: 0 },
      securityAlerts: { success: false, syncType: 'security' as SyncType, itemsSynced: 0, itemsFailed: 0, errors: [] as string[], duration: 0 },
      policyCompliance: { success: false, syncType: 'policies' as SyncType, itemsSynced: 0, itemsFailed: 0, errors: [] as string[], duration: 0 },
      users: { success: false, syncType: 'users' as SyncType, itemsSynced: 0, itemsFailed: 0, errors: [] as string[], duration: 0 },
    };

    let totalSynced = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Sync resources
    try {
      results.resources = await this.syncResources(organizationId);
      totalSynced += results.resources.itemsSynced;
      totalFailed += results.resources.itemsFailed;
      errors.push(...results.resources.errors);
    } catch (error: any) {
      results.resources.errors.push(error.message);
      errors.push(`Resources sync failed: ${error.message}`);
    }

    // Sync security findings
    try {
      results.securityFindings = await this.syncSecurityFindings(organizationId);
      totalSynced += results.securityFindings.itemsSynced;
      totalFailed += results.securityFindings.itemsFailed;
      errors.push(...results.securityFindings.errors);
    } catch (error: any) {
      results.securityFindings.errors.push(error.message);
      errors.push(`Security findings sync failed: ${error.message}`);
    }

    // Sync security alerts
    try {
      results.securityAlerts = await this.syncSecurityAlerts(organizationId);
      totalSynced += results.securityAlerts.itemsSynced;
      totalFailed += results.securityAlerts.itemsFailed;
      errors.push(...results.securityAlerts.errors);
    } catch (error: any) {
      results.securityAlerts.errors.push(error.message);
      errors.push(`Security alerts sync failed: ${error.message}`);
    }

    // Sync policy compliance
    try {
      results.policyCompliance = await this.syncPolicyCompliance(organizationId);
      totalSynced += results.policyCompliance.itemsSynced;
      totalFailed += results.policyCompliance.itemsFailed;
      errors.push(...results.policyCompliance.errors);
    } catch (error: any) {
      results.policyCompliance.errors.push(error.message);
      errors.push(`Policy compliance sync failed: ${error.message}`);
    }

    // Sync users
    try {
      results.users = await this.syncUsers(organizationId);
      totalSynced += results.users.itemsSynced;
      totalFailed += results.users.itemsFailed;
      errors.push(...results.users.errors);
    } catch (error: any) {
      results.users.errors.push(error.message);
      errors.push(`Users sync failed: ${error.message}`);
    }

    const totalDuration = Date.now() - startTime;
    const allSucceeded = Object.values(results).every(r => r.success || r.errors.length === 0);

    await this.updateSyncJob(jobId, {
      status: allSucceeded ? 'completed' : 'failed',
      completedAt: new Date(),
      itemsSynced: totalSynced,
      itemsFailed: totalFailed,
      errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
      errorDetails: errors.length > 0 ? { errors } : undefined,
    });

    // Create audit log
    await AuditLogger.log({
      userId: triggeredBy || 'system',
      organizationId,
      action: 'azure.sync.full',
      resourceType: 'AzureSync',
      resourceId: jobId,
      metadata: {
        syncType: 'full',
        itemsSynced: totalSynced,
        itemsFailed: totalFailed,
        duration: totalDuration,
      },
    });

    logger.info(`[AzureSync] Full sync completed for org ${organizationId}: ${totalSynced} synced, ${totalFailed} failed, ${totalDuration}ms`);

    return {
      success: allSucceeded,
      jobId,
      results,
      totalDuration,
    };
  }

  /**
   * Sync Azure resources
   */
  async syncResources(organizationId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const resources = await azureService.getResources(organizationId);

      // Get integration for subscription ID
      const integration = await azureService.getIntegration(organizationId);
      const subscriptionId = (integration?.config as any)?.subscriptionId || '';

      for (const resource of resources) {
        try {
          await prisma.azureResource.upsert({
            where: {
              organizationId_azureResourceId: {
                organizationId,
                azureResourceId: resource.id,
              },
            },
            update: {
              name: resource.name,
              resourceType: resource.type,
              location: resource.location,
              resourceGroup: resource.id.split('/')[4] || null,
              tags: resource.tags || undefined,
              provisioningState: resource.provisioningState || null,
              syncedAt: new Date(),
            },
            create: {
              organizationId,
              azureResourceId: resource.id,
              name: resource.name,
              resourceType: resource.type,
              location: resource.location,
              resourceGroup: resource.id.split('/')[4] || null,
              subscriptionId,
              tags: resource.tags || undefined,
              provisioningState: resource.provisioningState || null,
              syncedAt: new Date(),
            },
          });
          itemsSynced++;
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Failed to sync resource ${resource.name}: ${error.message}`);
        }
      }

      logger.info(`[AzureSync] Resources sync: ${itemsSynced} synced, ${itemsFailed} failed`);
    } catch (error: any) {
      errors.push(`Resources sync error: ${error.message}`);
      logger.error('[AzureSync] Resources sync failed', error);
    }

    return {
      success: errors.length === 0,
      syncType: 'resources',
      itemsSynced,
      itemsFailed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync Azure security findings (recommendations)
   */
  async syncSecurityFindings(organizationId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const recommendations = await azureService.getSecurityRecommendations(organizationId);

      for (const rec of recommendations) {
        try {
          await prisma.azureSecurityFinding.upsert({
            where: {
              organizationId_azureFindingId: {
                organizationId,
                azureFindingId: rec.id,
              },
            },
            update: {
              name: rec.name,
              severity: rec.severity,
              status: rec.state,
              description: rec.description || null,
              remediationSteps: rec.remediationDescription || null,
              affectedResourceId: rec.resourceId || null,
              syncedAt: new Date(),
            },
            create: {
              organizationId,
              azureFindingId: rec.id,
              name: rec.name,
              severity: rec.severity,
              status: rec.state,
              description: rec.description || null,
              remediationSteps: rec.remediationDescription || null,
              affectedResourceId: rec.resourceId || null,
              syncedAt: new Date(),
            },
          });
          itemsSynced++;
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Failed to sync finding ${rec.name}: ${error.message}`);
        }
      }

      logger.info(`[AzureSync] Security findings sync: ${itemsSynced} synced, ${itemsFailed} failed`);
    } catch (error: any) {
      errors.push(`Security findings sync error: ${error.message}`);
      logger.error('[AzureSync] Security findings sync failed', error);
    }

    return {
      success: errors.length === 0,
      syncType: 'security',
      itemsSynced,
      itemsFailed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync Azure security alerts
   */
  async syncSecurityAlerts(organizationId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const alerts = await azureService.getSecurityAlerts(organizationId);

      for (const alert of alerts) {
        try {
          await prisma.azureSecurityAlert.upsert({
            where: {
              organizationId_azureAlertId: {
                organizationId,
                azureAlertId: alert.id,
              },
            },
            update: {
              name: alert.name || '',
              severity: alert.severity || 'Unknown',
              status: alert.status || 'Unknown',
              alertType: alert.alertType || null,
              description: alert.description || null,
              compromisedEntity: alert.compromisedEntity || null,
              remediationSteps: alert.remediationSteps || [],
              startTimeUtc: alert.startTimeUtc ? new Date(alert.startTimeUtc) : null,
              endTimeUtc: alert.endTimeUtc ? new Date(alert.endTimeUtc) : null,
              syncedAt: new Date(),
            },
            create: {
              organizationId,
              azureAlertId: alert.id,
              name: alert.name || '',
              severity: alert.severity || 'Unknown',
              status: alert.status || 'Unknown',
              alertType: alert.alertType || null,
              description: alert.description || null,
              compromisedEntity: alert.compromisedEntity || null,
              remediationSteps: alert.remediationSteps || [],
              startTimeUtc: alert.startTimeUtc ? new Date(alert.startTimeUtc) : null,
              endTimeUtc: alert.endTimeUtc ? new Date(alert.endTimeUtc) : null,
              syncedAt: new Date(),
            },
          });
          itemsSynced++;
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Failed to sync alert ${alert.name}: ${error.message}`);
        }
      }

      logger.info(`[AzureSync] Security alerts sync: ${itemsSynced} synced, ${itemsFailed} failed`);
    } catch (error: any) {
      errors.push(`Security alerts sync error: ${error.message}`);
      logger.error('[AzureSync] Security alerts sync failed', error);
    }

    return {
      success: errors.length === 0,
      syncType: 'security',
      itemsSynced,
      itemsFailed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync Azure policy compliance
   */
  async syncPolicyCompliance(organizationId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const policies = await azureService.getPolicyCompliance(organizationId);

      for (const policy of policies) {
        try {
          const assignmentId = `${organizationId}_${policy.policyDefinitionId}`;

          await prisma.azurePolicyCompliance.upsert({
            where: {
              organizationId_azurePolicyAssignmentId: {
                organizationId,
                azurePolicyAssignmentId: assignmentId,
              },
            },
            update: {
              policyDefinitionName: policy.policyDefinitionName,
              complianceState: policy.complianceState,
              evaluatedAt: policy.timestamp ? new Date(policy.timestamp) : null,
              syncedAt: new Date(),
            },
            create: {
              organizationId,
              azurePolicyAssignmentId: assignmentId,
              policyDefinitionId: policy.policyDefinitionId,
              policyDefinitionName: policy.policyDefinitionName,
              complianceState: policy.complianceState,
              evaluatedAt: policy.timestamp ? new Date(policy.timestamp) : null,
              syncedAt: new Date(),
            },
          });
          itemsSynced++;
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Failed to sync policy ${policy.policyDefinitionName}: ${error.message}`);
        }
      }

      logger.info(`[AzureSync] Policy compliance sync: ${itemsSynced} synced, ${itemsFailed} failed`);
    } catch (error: any) {
      errors.push(`Policy compliance sync error: ${error.message}`);
      logger.error('[AzureSync] Policy compliance sync failed', error);
    }

    return {
      success: errors.length === 0,
      syncType: 'policies',
      itemsSynced,
      itemsFailed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync Azure AD users
   */
  async syncUsers(organizationId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const users = await azureService.getUsers(organizationId);

      for (const user of users) {
        try {
          await prisma.azureUser.upsert({
            where: {
              organizationId_azureUserId: {
                organizationId,
                azureUserId: user.id,
              },
            },
            update: {
              displayName: user.displayName,
              userPrincipalName: user.userPrincipalName,
              accountEnabled: user.accountEnabled,
              createdDateTime: user.createdDateTime ? new Date(user.createdDateTime) : null,
              lastSignInDateTime: user.lastSignInDateTime ? new Date(user.lastSignInDateTime) : null,
              syncedAt: new Date(),
            },
            create: {
              organizationId,
              azureUserId: user.id,
              displayName: user.displayName,
              userPrincipalName: user.userPrincipalName,
              accountEnabled: user.accountEnabled,
              createdDateTime: user.createdDateTime ? new Date(user.createdDateTime) : null,
              lastSignInDateTime: user.lastSignInDateTime ? new Date(user.lastSignInDateTime) : null,
              syncedAt: new Date(),
            },
          });
          itemsSynced++;
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Failed to sync user ${user.displayName}: ${error.message}`);
        }
      }

      logger.info(`[AzureSync] Users sync: ${itemsSynced} synced, ${itemsFailed} failed`);
    } catch (error: any) {
      errors.push(`Users sync error: ${error.message}`);
      logger.error('[AzureSync] Users sync failed', error);
    }

    return {
      success: errors.length === 0,
      syncType: 'users',
      itemsSynced,
      itemsFailed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Get sync job history for an organization
   */
  async getSyncHistory(
    organizationId: string,
    options?: { limit?: number; offset?: number; syncType?: SyncType }
  ): Promise<{ jobs: any[]; total: number }> {
    const where: any = { organizationId };
    if (options?.syncType) {
      where.syncType = options.syncType;
    }

    const [jobs, total] = await Promise.all([
      prisma.azureSyncJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      prisma.azureSyncJob.count({ where }),
    ]);

    return { jobs, total };
  }

  /**
   * Get latest sync status for an organization
   */
  async getLatestSyncStatus(organizationId: string): Promise<any | null> {
    return prisma.azureSyncJob.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get synced resource statistics
   */
  async getSyncedResourceStats(organizationId: string): Promise<{
    resources: number;
    securityFindings: number;
    securityAlerts: number;
    policyCompliance: number;
    users: number;
    lastSyncAt: Date | null;
  }> {
    const [resources, securityFindings, securityAlerts, policyCompliance, users, lastJob] = await Promise.all([
      prisma.azureResource.count({ where: { organizationId } }),
      prisma.azureSecurityFinding.count({ where: { organizationId } }),
      prisma.azureSecurityAlert.count({ where: { organizationId } }),
      prisma.azurePolicyCompliance.count({ where: { organizationId } }),
      prisma.azureUser.count({ where: { organizationId } }),
      prisma.azureSyncJob.findFirst({
        where: { organizationId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
    ]);

    return {
      resources,
      securityFindings,
      securityAlerts,
      policyCompliance,
      users,
      lastSyncAt: lastJob?.completedAt || null,
    };
  }

  /**
   * Delete all synced data for an organization (used when disconnecting)
   */
  async deleteSyncedData(organizationId: string): Promise<void> {
    await prisma.$transaction([
      prisma.azureResource.deleteMany({ where: { organizationId } }),
      prisma.azureSecurityFinding.deleteMany({ where: { organizationId } }),
      prisma.azureSecurityAlert.deleteMany({ where: { organizationId } }),
      prisma.azurePolicyCompliance.deleteMany({ where: { organizationId } }),
      prisma.azureUser.deleteMany({ where: { organizationId } }),
      prisma.azureSyncJob.deleteMany({ where: { organizationId } }),
    ]);

    logger.info(`[AzureSync] Deleted all synced data for org ${organizationId}`);
  }
}

export default new AzureSyncService();
