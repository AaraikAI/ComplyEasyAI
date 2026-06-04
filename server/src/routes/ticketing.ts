/**
 * Ticketing Integration Routes
 *
 * Unified API for managing ticketing system integrations (Jira, ServiceNow, Azure DevOps).
 * Provides configuration, connection testing, synchronization, and ticket creation
 * from any compliance resource (risks, incidents, findings, etc.).
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { encryptField, decryptField } from '../utils/credentialEncryption';
import {
  saveTicketingConfigSchema, testTicketingConnectionSchema,
  syncTicketingSchema, createTicketSchema, bulkTicketSyncSchema,
  updateFieldMappingSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';
import jiraService from '../services/integrations/jiraService';
import servicenowService from '../services/integrations/servicenowService';
import azureDevOpsService from '../services/integrations/azureDevOpsService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketingProvider = 'jira' | 'servicenow' | 'azure_devops';

interface TicketingConfig {
  provider: TicketingProvider;
  instanceUrl?: string;
  organization?: string;
  project?: string;
  projectKey?: string;
  authType: 'basic' | 'oauth' | 'pat';
  username?: string;
  password?: string;
  pat?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  cloudId?: string;
  siteName?: string;
  siteUrl?: string;
  tenantId?: string;
  defaultIssueType?: string;
  defaultPriority?: string;
  syncEnabled?: boolean;
  syncDirection?: 'push' | 'pull' | 'bidirectional';
  syncIntervalMinutes?: number;
  webhookSecret?: string;
  mappingRules?: {
    risk?: { issueType: string; labels?: string[] };
    incident?: { issueType: string; labels?: string[] };
    finding?: { issueType: string; labels?: string[] };
    exception?: { issueType: string; labels?: string[] };
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProviderForOrg(config: TicketingConfig): TicketingProvider {
  return config.provider;
}

function sanitizeConfigForResponse(config: any): any {
  if (!config) return null;
  const sanitized = { ...config };
  // Remove sensitive credentials from the response
  delete sanitized.password;
  delete sanitized.pat;
  delete sanitized.clientSecret;
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  delete sanitized.apiToken;
  // Surface the webhook secret as a presence flag only — never return the encrypted value.
  if ('webhookSecret' in sanitized) {
    sanitized.webhookSecret = sanitized.webhookSecret ? '********' : null;
    sanitized.webhookSecretConfigured = !!config.webhookSecret;
  }
  // Mask username partially
  if (sanitized.username) {
    sanitized.username = sanitized.username.length > 4
      ? sanitized.username.slice(0, 2) + '***' + sanitized.username.slice(-2)
      : '****';
  }
  return sanitized;
}

// Resolve the inbound-webhook HMAC secret for a save flow: use the client-supplied
// value when present, otherwise reuse an already-persisted secret, otherwise
// generate a fresh one. Returns the plaintext secret (returned once to the caller)
// and its encrypted form for storage.
async function resolveWebhookSecret(
  organizationId: string,
  provider: TicketingProvider,
  supplied?: string | null,
): Promise<{ plaintext: string; encrypted: string; generated: boolean }> {
  if (supplied) {
    return { plaintext: supplied, encrypted: encryptField(supplied), generated: false };
  }

  const existing = await prisma.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider } },
    select: { config: true },
  });
  const existingEncrypted = (existing?.config as any)?.webhookSecret as string | undefined;
  if (existingEncrypted) {
    return { plaintext: decryptField(existingEncrypted), encrypted: existingEncrypted, generated: false };
  }

  const generated = crypto.randomBytes(32).toString('hex');
  return { plaintext: generated, encrypted: encryptField(generated), generated: true };
}

// Merge the encrypted webhook secret into an already-saved integration's config.
// Used after provider services persist their own config (servicenow / azure_devops).
async function persistWebhookSecret(
  organizationId: string,
  provider: TicketingProvider,
  encryptedSecret: string,
): Promise<void> {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider } },
    select: { id: true, config: true },
  });
  if (!integration) return;
  const mergedConfig = { ...((integration.config as any) || {}), webhookSecret: encryptedSecret };
  await prisma.integration.update({
    where: { id: integration.id },
    data: { config: mergedConfig as any },
  });
}

// ============================================================================
// GET /config - Get ticketing configuration
// ============================================================================

router.get(
  '/config',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    // Look for any connected ticketing integration
    const integrations = await prisma.integration.findMany({
      where: {
        organizationId,
        provider: { in: ['jira', 'servicenow', 'azure_devops'] },
      },
      select: {
        id: true,
        provider: true,
        name: true,
        connected: true,
        lastSync: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const activeIntegration = integrations.find((i) => i.connected);

    res.json({
      configured: !!activeIntegration,
      activeProvider: activeIntegration?.provider || null,
      integrations: integrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        name: i.name,
        connected: i.connected,
        lastSync: i.lastSync,
        config: sanitizeConfigForResponse(i.config),
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
    });
  })
);

// ============================================================================
// POST /config - Save ticketing configuration
// ============================================================================

router.post(
  '/config',
  validateBody(saveTicketingConfigSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const config: TicketingConfig = req.body;

    if (!config.provider) {
      throw new AppError('Provider is required (jira, servicenow, azure_devops)', 400);
    }

    if (!['jira', 'servicenow', 'azure_devops'].includes(config.provider)) {
      throw new AppError('Invalid provider. Use jira, servicenow, or azure_devops', 400);
    }

    try {
      // Resolve (or generate) the inbound-webhook HMAC secret used by POST /webhook/:provider.
      const webhookSecret = await resolveWebhookSecret(organizationId, config.provider, config.webhookSecret);

      switch (config.provider) {
        case 'jira': {
          if (config.authType === 'oauth' && config.accessToken) {
            await jiraService.saveIntegration(
              organizationId,
              {
                access_token: config.accessToken,
                refresh_token: config.refreshToken || '',
                expires_in: 3600,
                token_type: 'Bearer',
                scope: 'read:jira-user read:jira-work write:jira-work offline_access',
              },
              config.cloudId || '',
              config.siteName || '',
              config.siteUrl || ''
            );
            await persistWebhookSecret(organizationId, 'jira', webhookSecret.encrypted);
          } else {
            // API token auth -- store as basic auth config
            await prisma.integration.upsert({
              where: {
                organizationId_provider: { organizationId, provider: 'jira' },
              },
              create: {
                organizationId,
                name: 'Jira',
                category: 'project',
                provider: 'jira',
                connected: true,
                config: {
                  instanceUrl: config.instanceUrl,
                  authType: 'basic',
                  username: config.username,
                  // Encrypt the Jira API token at rest (mirrors jiraService OAuth token handling).
                  apiToken: config.password ? encryptField(config.password) : null,
                  projectKey: config.projectKey,
                  defaultIssueType: config.defaultIssueType || 'Task',
                  syncEnabled: config.syncEnabled ?? false,
                  syncDirection: config.syncDirection || 'bidirectional',
                  mappingRules: config.mappingRules,
                  // Encrypt the inbound-webhook HMAC secret at rest.
                  webhookSecret: webhookSecret.encrypted,
                } as any,
                lastSync: new Date(),
              },
              update: {
                connected: true,
                config: {
                  instanceUrl: config.instanceUrl,
                  authType: 'basic',
                  username: config.username,
                  // Encrypt the Jira API token at rest (mirrors jiraService OAuth token handling).
                  apiToken: config.password ? encryptField(config.password) : null,
                  projectKey: config.projectKey,
                  defaultIssueType: config.defaultIssueType || 'Task',
                  syncEnabled: config.syncEnabled ?? false,
                  syncDirection: config.syncDirection || 'bidirectional',
                  mappingRules: config.mappingRules,
                  // Encrypt the inbound-webhook HMAC secret at rest.
                  webhookSecret: webhookSecret.encrypted,
                } as any,
                lastSync: new Date(),
              },
            });
          }
          break;
        }

        case 'servicenow': {
          await servicenowService.saveIntegration(organizationId, {
            instanceUrl: config.instanceUrl || '',
            authType: config.authType === 'oauth' ? 'oauth' : 'basic',
            username: config.username,
            password: config.password,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
          });
          await persistWebhookSecret(organizationId, 'servicenow', webhookSecret.encrypted);
          break;
        }

        case 'azure_devops': {
          await azureDevOpsService.saveIntegration(organizationId, {
            organization: config.organization || '',
            project: config.project || '',
            authType: config.authType === 'pat' ? 'pat' : 'oauth',
            pat: config.pat,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
            tenantId: config.tenantId,
          });
          await persistWebhookSecret(organizationId, 'azure_devops', webhookSecret.encrypted);
          break;
        }
      }

      logger.info(`Ticketing integration configured: ${config.provider} for org ${organizationId}`);

      res.json({
        success: true,
        message: `${config.provider} integration configured successfully`,
        provider: config.provider,
        // Return the plaintext secret only when it was generated server-side, so the
        // client can register it with the provider's webhook configuration.
        ...(webhookSecret.generated ? { webhookSecret: webhookSecret.plaintext } : {}),
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error saving ticketing config', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to save configuration', 500);
    }
  })
);

// ============================================================================
// DELETE /config - Remove ticketing integration
// ============================================================================

router.delete(
  '/config',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider } = req.query as { provider?: TicketingProvider };

    if (!provider) {
      throw new AppError('Provider query parameter is required', 400);
    }

    try {
      switch (provider) {
        case 'jira':
          await jiraService.disconnect(organizationId);
          break;
        case 'servicenow':
          await servicenowService.disconnect(organizationId);
          break;
        case 'azure_devops':
          await azureDevOpsService.disconnect(organizationId);
          break;
        default:
          throw new AppError('Invalid provider', 400);
      }

      logger.info(`Ticketing integration disconnected: ${provider} for org ${organizationId}`);
      res.json({ success: true, message: `${provider} integration disconnected` });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error disconnecting ticketing integration', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to disconnect', 500);
    }
  })
);

// ============================================================================
// POST /test - Test connection to ticketing system
// ============================================================================

router.post(
  '/test',
  validateBody(testTicketingConnectionSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider } = req.body as { provider?: TicketingProvider };

    if (!provider) {
      throw new AppError('Provider is required', 400);
    }

    try {
      let result: { success: boolean; message: string };

      switch (provider) {
        case 'jira': {
          // Test by listing projects
          const projects = await jiraService.listProjects(organizationId);
          result = {
            success: true,
            message: `Connected to Jira. Found ${projects.length} project(s).`,
          };
          break;
        }
        case 'servicenow':
          result = await servicenowService.testConnection(organizationId);
          break;
        case 'azure_devops':
          result = await azureDevOpsService.testConnection(organizationId);
          break;
        default:
          throw new AppError('Invalid provider', 400);
      }

      res.json(result);
    } catch (error: any) {
      logger.error(`Ticketing connection test failed for ${provider}`, error);
      res.json({
        success: false,
        message: error.message || `Connection test failed for ${provider}`,
      });
    }
  })
);

// ============================================================================
// POST /sync - Manual sync from ticketing system
// ============================================================================

router.post(
  '/sync',
  validateBody(syncTicketingSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider, direction, since } = req.body as {
      provider?: TicketingProvider;
      direction?: 'push' | 'pull' | 'bidirectional';
      since?: string;
    };

    if (!provider) {
      throw new AppError('Provider is required', 400);
    }

    const sinceDate = since ? new Date(since) : undefined;

    try {
      let result: { pushed: number; pulled: number; updated: number; errors: string[] };

      switch (provider) {
        case 'jira':
          result = await jiraService.syncComplianceIssues(organizationId, {
            direction: direction || 'bidirectional',
            since: sinceDate,
          });
          break;
        case 'servicenow':
          result = await servicenowService.syncIncidents(organizationId, {
            direction: direction || 'bidirectional',
            since: sinceDate,
          });
          break;
        case 'azure_devops':
          result = await azureDevOpsService.syncWorkItems(organizationId, {
            direction: direction || 'bidirectional',
            since: sinceDate,
          });
          break;
        default:
          throw new AppError('Invalid provider', 400);
      }

      // Update last sync time
      await prisma.integration.updateMany({
        where: { organizationId, provider },
        data: { lastSync: new Date() },
      });

      res.json({
        success: true,
        syncResult: result,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error(`Ticketing sync failed for ${provider}`, error);
      throw new AppError(error instanceof Error ? error.message : `Sync failed for ${provider}`, 500);
    }
  })
);

// ============================================================================
// POST /create-ticket - Create ticket from compliance resource
// ============================================================================

router.post(
  '/create-ticket',
  validateBody(createTicketSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const {
      provider,
      title,
      description,
      severity,
      framework,
      controlId,
      sourceType,
      sourceId,
      projectKey,
      issueType,
    } = req.body;

    if (!provider) {
      throw new AppError('Provider is required', 400);
    }
    if (!title) {
      throw new AppError('Title is required', 400);
    }

    try {
      let ticket: any;

      switch (provider) {
        case 'jira': {
          const integration = await jiraService.getIntegration(organizationId);
          const config = integration?.config as any;
          const targetProjectKey = projectKey || config?.projectKey || '';

          if (!targetProjectKey) {
            throw new AppError('Jira project key is required', 400);
          }

          ticket = await jiraService.createComplianceTicket(organizationId, targetProjectKey, {
            title,
            description: description || '',
            severity: severity || 'Medium',
            framework,
            controlId,
          });
          break;
        }

        case 'servicenow': {
          ticket = await servicenowService.createComplianceIncident(organizationId, {
            title,
            description: description || '',
            severity: severity || 'Medium',
            framework,
            controlId,
            sourceType,
            sourceId,
          });
          break;
        }

        case 'azure_devops': {
          ticket = await azureDevOpsService.createComplianceWorkItem(organizationId, {
            title,
            description: description || '',
            severity: severity || 'Medium',
            framework,
            controlId,
            sourceType,
            sourceId,
          });
          break;
        }

        default:
          throw new AppError('Invalid provider', 400);
      }

      // Record in audit log
      await prisma.auditLog.create({
        data: {
          action: 'ticketing.ticket_created',
          userId: req.user?.id,
          organizationId,
          hash: `${provider}:${sourceType || 'manual'}:${sourceId || 'none'}`,
          details: JSON.stringify({
            provider,
            ticket,
            sourceType,
            sourceId,
            framework,
            controlId,
          }),
        },
      });

      res.json({
        success: true,
        provider,
        ticket,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating ticket', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to create ticket', 500);
    }
  })
);

// ============================================================================
// GET /tickets - List synced tickets
// ============================================================================

router.get(
  '/tickets',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId,
      action: { startsWith: provider ? `${provider}_sync.` : '' },
    };

    // If no specific provider, get all ticketing sync records
    if (!provider) {
      where.action = {
        in: [
          'jira_sync.pushed',
          'jira_sync.pulled',
          'servicenow_sync.pushed',
          'servicenow_sync.pulled',
          'azuredevops_sync.pushed',
          'azuredevops_sync.pulled',
          'ticketing.ticket_created',
        ],
      };
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          action: true,
          hash: true,
          details: true,
          timestamp: true,
          userId: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formattedTickets = tickets.map((t) => {
      let parsedDetails: any = {};
      try {
        parsedDetails = JSON.parse(t.details || '{}');
      } catch {
        parsedDetails = {};
      }

      let ticketProvider = 'unknown';
      if (t.action.startsWith('jira_sync') || t.action.includes('jira')) ticketProvider = 'jira';
      else if (t.action.startsWith('servicenow_sync') || t.action.includes('servicenow')) ticketProvider = 'servicenow';
      else if (t.action.startsWith('azuredevops_sync') || t.action.includes('azuredevops')) ticketProvider = 'azure_devops';

      return {
        id: t.id,
        provider: ticketProvider,
        action: t.action,
        direction: t.action.includes('.pushed') ? 'push' : t.action.includes('.pulled') ? 'pull' : 'created',
        externalId:
          parsedDetails.jiraIssueKey ||
          parsedDetails.snowIncidentNumber ||
          parsedDetails.adoWorkItemId ||
          parsedDetails.incidentNumber ||
          null,
        externalSysId:
          parsedDetails.jiraIssueId ||
          parsedDetails.snowIncidentSysId ||
          parsedDetails.adoWorkItemId ||
          parsedDetails.incidentSysId ||
          null,
        localIssueId: parsedDetails.localIssueId || null,
        sourceType: parsedDetails.sourceType || null,
        sourceId: parsedDetails.sourceId || null,
        syncedAt: t.timestamp,
        userId: t.userId,
      };
    });

    res.json({
      tickets: formattedTickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  })
);

// ============================================================================
// GET /sync-status - Get sync status for connected provider
// ============================================================================

router.get(
  '/sync-status',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider } = req.query as { provider?: TicketingProvider };

    if (!provider) {
      throw new AppError('Provider query parameter is required', 400);
    }

    try {
      let status: {
        lastSync: Date | null;
        totalSynced: number;
        pendingSync: number;
        syncErrors: number;
      };

      switch (provider) {
        case 'jira':
          status = await jiraService.getSyncStatus(organizationId);
          break;
        case 'servicenow':
          status = await servicenowService.getSyncStatus(organizationId);
          break;
        case 'azure_devops':
          status = await azureDevOpsService.getSyncStatus(organizationId);
          break;
        default:
          throw new AppError('Invalid provider', 400);
      }

      res.json({ provider, ...status });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error(`Error getting sync status for ${provider}`, error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to get sync status', 500);
    }
  })
);

// ============================================================================
// GET /connections - List all ticketing connections for org
// ============================================================================

router.get(
  '/connections',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const integrations = await prisma.integration.findMany({
      where: {
        organizationId,
        provider: { in: ['jira', 'servicenow', 'azure_devops'] },
      },
      select: {
        id: true,
        provider: true,
        name: true,
        connected: true,
        lastSync: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      connections: integrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        name: i.name,
        connected: i.connected,
        lastSync: i.lastSync,
        config: sanitizeConfigForResponse(i.config),
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
    });
  })
);

// ============================================================================
// POST /connections - Create / configure a new connection
// ============================================================================

router.post(
  '/connections',
  validateBody(saveTicketingConfigSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const config: TicketingConfig = req.body;

    if (!config.provider || !['jira', 'servicenow', 'azure_devops'].includes(config.provider)) {
      throw new AppError('Valid provider required (jira, servicenow, azure_devops)', 400);
    }

    try {
      // Resolve (or generate) the inbound-webhook HMAC secret used by POST /webhook/:provider.
      const webhookSecret = await resolveWebhookSecret(organizationId, config.provider, config.webhookSecret);

      switch (config.provider) {
        case 'jira': {
          if (config.authType === 'oauth' && config.accessToken) {
            await jiraService.saveIntegration(
              organizationId,
              {
                access_token: config.accessToken,
                refresh_token: config.refreshToken || '',
                expires_in: 3600,
                token_type: 'Bearer',
                scope: 'read:jira-user read:jira-work write:jira-work offline_access',
              },
              config.cloudId || '',
              config.siteName || '',
              config.siteUrl || ''
            );
            await persistWebhookSecret(organizationId, 'jira', webhookSecret.encrypted);
          } else {
            await prisma.integration.upsert({
              where: {
                organizationId_provider: { organizationId, provider: 'jira' },
              },
              create: {
                organizationId,
                name: 'Jira',
                category: 'project',
                provider: 'jira',
                connected: true,
                config: {
                  instanceUrl: config.instanceUrl,
                  authType: 'basic',
                  username: config.username,
                  // Encrypt the Jira API token at rest (mirrors jiraService OAuth token handling).
                  apiToken: config.password ? encryptField(config.password) : null,
                  projectKey: config.projectKey,
                  defaultIssueType: config.defaultIssueType || 'Task',
                  syncEnabled: config.syncEnabled ?? false,
                  syncDirection: config.syncDirection || 'bidirectional',
                  mappingRules: config.mappingRules,
                  // Encrypt the inbound-webhook HMAC secret at rest.
                  webhookSecret: webhookSecret.encrypted,
                } as any,
                lastSync: new Date(),
              },
              update: {
                connected: true,
                config: {
                  instanceUrl: config.instanceUrl,
                  authType: 'basic',
                  username: config.username,
                  // Encrypt the Jira API token at rest (mirrors jiraService OAuth token handling).
                  apiToken: config.password ? encryptField(config.password) : null,
                  projectKey: config.projectKey,
                  defaultIssueType: config.defaultIssueType || 'Task',
                  syncEnabled: config.syncEnabled ?? false,
                  syncDirection: config.syncDirection || 'bidirectional',
                  mappingRules: config.mappingRules,
                  // Encrypt the inbound-webhook HMAC secret at rest.
                  webhookSecret: webhookSecret.encrypted,
                } as any,
                lastSync: new Date(),
              },
            });
          }
          break;
        }

        case 'servicenow': {
          await servicenowService.saveIntegration(organizationId, {
            instanceUrl: config.instanceUrl || '',
            authType: config.authType === 'oauth' ? 'oauth' : 'basic',
            username: config.username,
            password: config.password,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
          });
          await persistWebhookSecret(organizationId, 'servicenow', webhookSecret.encrypted);
          break;
        }

        case 'azure_devops': {
          await azureDevOpsService.saveIntegration(organizationId, {
            organization: config.organization || '',
            project: config.project || '',
            authType: config.authType === 'pat' ? 'pat' : 'oauth',
            pat: config.pat,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
            tenantId: config.tenantId,
          });
          await persistWebhookSecret(organizationId, 'azure_devops', webhookSecret.encrypted);
          break;
        }
      }

      logger.info(`Ticketing connection created: ${config.provider} for org ${organizationId}`);

      // Fetch the saved integration to return
      const saved = await prisma.integration.findUnique({
        where: {
          organizationId_provider: { organizationId, provider: config.provider },
        },
      });

      res.json({
        success: true,
        // Return the plaintext secret only when it was generated server-side, so the
        // client can register it with the provider's webhook configuration.
        ...(webhookSecret.generated ? { webhookSecret: webhookSecret.plaintext } : {}),
        connection: saved
          ? {
              id: saved.id,
              provider: saved.provider,
              name: saved.name,
              connected: saved.connected,
              lastSync: saved.lastSync,
              config: sanitizeConfigForResponse(saved.config),
            }
          : null,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating ticketing connection', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to create connection', 500);
    }
  })
);

// ============================================================================
// DELETE /connections/:id - Remove a specific connection
// ============================================================================

router.delete(
  '/connections/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, provider: { in: ['jira', 'servicenow', 'azure_devops'] } },
    });

    if (!integration) {
      throw new AppError('Connection not found', 404);
    }

    try {
      switch (integration.provider) {
        case 'jira':
          await jiraService.disconnect(organizationId);
          break;
        case 'servicenow':
          await servicenowService.disconnect(organizationId);
          break;
        case 'azure_devops':
          await azureDevOpsService.disconnect(organizationId);
          break;
      }

      logger.info(`Ticketing connection ${id} deleted for org ${organizationId}`);
      res.json({ success: true, message: 'Connection removed' });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting ticketing connection', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to delete connection', 500);
    }
  })
);

// ============================================================================
// POST /connections/:id/test - Test a specific connection
// ============================================================================

router.post(
  '/connections/:id/test',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId, provider: { in: ['jira', 'servicenow', 'azure_devops'] } },
    });

    if (!integration) {
      throw new AppError('Connection not found', 404);
    }

    try {
      let result: { success: boolean; message: string };

      switch (integration.provider) {
        case 'jira': {
          const projects = await jiraService.listProjects(organizationId);
          result = { success: true, message: `Connected. Found ${projects.length} project(s).` };
          break;
        }
        case 'servicenow':
          result = await servicenowService.testConnection(organizationId);
          break;
        case 'azure_devops':
          result = await azureDevOpsService.testConnection(organizationId);
          break;
        default:
          result = { success: false, message: 'Unknown provider' };
      }

      res.json(result);
    } catch (error: any) {
      res.json({ success: false, message: error.message || 'Connection test failed' });
    }
  })
);

// ============================================================================
// GET /tickets/:id - Get ticket details from external system
// ============================================================================

router.get(
  '/tickets/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { id } = req.params;

    // Look up the sync record
    const syncRecord = await prisma.auditLog.findFirst({
      where: {
        id,
        organizationId,
        action: {
          in: [
            'jira_sync.pushed', 'jira_sync.pulled',
            'servicenow_sync.pushed', 'servicenow_sync.pulled',
            'azuredevops_sync.pushed', 'azuredevops_sync.pulled',
            'ticketing.ticket_created',
          ],
        },
      },
    });

    if (!syncRecord) {
      throw new AppError('Ticket sync record not found', 404);
    }

    let parsedDetails: any = {};
    try {
      parsedDetails = JSON.parse(syncRecord.details || '{}');
    } catch {
      parsedDetails = {};
    }

    // Determine provider and fetch live details
    let provider = 'unknown';
    let externalDetails: any = null;

    try {
      if (syncRecord.action.startsWith('jira_sync') || syncRecord.action.includes('jira')) {
        provider = 'jira';
        // Jira issues can be fetched by key but we'd need the full API; return stored details
        externalDetails = parsedDetails;
      } else if (syncRecord.action.startsWith('servicenow_sync') || syncRecord.action.includes('servicenow')) {
        provider = 'servicenow';
        if (parsedDetails.snowIncidentSysId || parsedDetails.incidentSysId) {
          const sysId = parsedDetails.snowIncidentSysId || parsedDetails.incidentSysId;
          externalDetails = await servicenowService.getIncident(organizationId, sysId);
        } else {
          externalDetails = parsedDetails;
        }
      } else if (syncRecord.action.startsWith('azuredevops_sync') || syncRecord.action.includes('azuredevops')) {
        provider = 'azure_devops';
        if (parsedDetails.adoWorkItemId) {
          externalDetails = await azureDevOpsService.getWorkItem(
            organizationId,
            Number(parsedDetails.adoWorkItemId)
          );
        } else {
          externalDetails = parsedDetails;
        }
      }
    } catch (error: any) {
      logger.warn(`Could not fetch live details for ticket ${id}`, error.message);
      externalDetails = parsedDetails;
    }

    res.json({
      id: syncRecord.id,
      provider,
      action: syncRecord.action,
      syncedAt: syncRecord.timestamp,
      details: parsedDetails,
      externalDetails,
    });
  })
);

// ============================================================================
// PATCH /tickets/:id/sync - Sync status from external system for one ticket
// ============================================================================

router.patch(
  '/tickets/:id/sync',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { id } = req.params;

    const syncRecord = await prisma.auditLog.findFirst({
      where: {
        id,
        organizationId,
        action: {
          in: [
            'jira_sync.pushed', 'jira_sync.pulled',
            'servicenow_sync.pushed', 'servicenow_sync.pulled',
            'servicenow_sync.change_created',
            'azuredevops_sync.pushed', 'azuredevops_sync.pulled',
            'ticketing.ticket_created',
          ],
        },
      },
    });

    if (!syncRecord) {
      throw new AppError('Ticket sync record not found', 404);
    }

    let parsedDetails: any = {};
    try {
      parsedDetails = JSON.parse(syncRecord.details || '{}');
    } catch {
      parsedDetails = {};
    }

    try {
      let statusResult: any = null;

      if (syncRecord.action.startsWith('servicenow_sync') || syncRecord.action.includes('servicenow')) {
        const sysId = parsedDetails.snowIncidentSysId || parsedDetails.incidentSysId || parsedDetails.externalId;
        if (sysId) {
          const table = parsedDetails.table || 'incident';
          statusResult = await servicenowService.syncStatus(organizationId, sysId, table);
        }
      } else if (syncRecord.action.startsWith('azuredevops_sync') || syncRecord.action.includes('azuredevops')) {
        const wiId = parsedDetails.adoWorkItemId || parsedDetails.workItemId;
        if (wiId) {
          statusResult = await azureDevOpsService.syncStatus(organizationId, Number(wiId));
        }
      } else if (syncRecord.action.startsWith('jira_sync') || syncRecord.action.includes('jira')) {
        // Jira status sync via update
        if (parsedDetails.jiraIssueKey) {
          statusResult = { message: 'Use Jira sync endpoint for full status sync' };
        }
      }

      res.json({ success: true, statusResult });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error(`Error syncing ticket ${id}`, error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to sync ticket status', 500);
    }
  })
);

// ============================================================================
// POST /tickets/bulk-sync - Sync all active tickets
// ============================================================================

router.post(
  '/tickets/bulk-sync',
  validateBody(bulkTicketSyncSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider } = req.body as { provider?: TicketingProvider };
    const results: Record<string, any> = {};

    try {
      const providers = provider
        ? [provider]
        : ['jira', 'servicenow', 'azure_devops'] as TicketingProvider[];

      for (const p of providers) {
        const integration = await prisma.integration.findUnique({
          where: {
            organizationId_provider: { organizationId, provider: p },
          },
        });

        if (!integration?.connected) continue;

        try {
          switch (p) {
            case 'jira':
              results.jira = await jiraService.syncComplianceIssues(organizationId, {
                direction: 'bidirectional',
              });
              break;
            case 'servicenow':
              results.servicenow = await servicenowService.syncIncidents(organizationId, {
                direction: 'bidirectional',
              });
              break;
            case 'azure_devops':
              results.azure_devops = await azureDevOpsService.syncWorkItems(organizationId, {
                direction: 'bidirectional',
              });
              break;
          }

          // Update last sync time
          await prisma.integration.update({
            where: { id: integration.id },
            data: { lastSync: new Date() },
          });
        } catch (err: any) {
          results[p] = { error: err.message };
        }
      }

      res.json({ success: true, results });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error in bulk sync', error);
      throw new AppError(error instanceof Error ? error.message : 'Bulk sync failed', 500);
    }
  })
);

// ============================================================================
// GET /field-mapping/:provider - Get field mapping configuration
// ============================================================================

router.get(
  '/field-mapping/:provider',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider } = req.params as { provider: TicketingProvider };

    if (!['jira', 'servicenow', 'azure_devops'].includes(provider)) {
      throw new AppError('Invalid provider', 400);
    }

    const integration = await prisma.integration.findUnique({
      where: {
        organizationId_provider: { organizationId, provider },
      },
      select: { config: true },
    });

    const config = (integration?.config || {}) as any;

    // Default mapping rules by provider
    const defaultMappings: Record<string, any> = {
      jira: {
        risk: { issueType: 'Bug', labels: ['compliance', 'risk'] },
        incident: { issueType: 'Bug', labels: ['compliance', 'incident'] },
        finding: { issueType: 'Task', labels: ['compliance', 'finding'] },
        exception: { issueType: 'Task', labels: ['compliance', 'exception'] },
      },
      servicenow: {
        risk: { table: 'incident', category: 'Compliance', urgency: '2' },
        incident: { table: 'incident', category: 'Security', urgency: '1' },
        finding: { table: 'incident', category: 'Compliance', urgency: '3' },
        exception: { table: 'change_request', category: 'Compliance', risk: 'moderate' },
      },
      azure_devops: {
        risk: { workItemType: 'Bug', tags: 'compliance;risk' },
        incident: { workItemType: 'Bug', tags: 'compliance;incident' },
        finding: { workItemType: 'Task', tags: 'compliance;finding' },
        exception: { workItemType: 'Task', tags: 'compliance;exception' },
      },
    };

    const mappingRules = config.mappingRules || defaultMappings[provider] || {};

    res.json({
      provider,
      mappingRules,
      severityMapping: {
        Critical: provider === 'azure_devops' ? 1 : '1',
        High: provider === 'azure_devops' ? 2 : '2',
        Medium: provider === 'azure_devops' ? 3 : '3',
        Low: provider === 'azure_devops' ? 4 : '4',
      },
    });
  })
);

// ============================================================================
// PUT /field-mapping/:provider - Update field mapping
// ============================================================================

router.put(
  '/field-mapping/:provider',
  validateBody(updateFieldMappingSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new AppError('Organization context required', 403);
    }

    const { provider } = req.params as { provider: TicketingProvider };
    const { mappingRules } = req.body;

    if (!['jira', 'servicenow', 'azure_devops'].includes(provider)) {
      throw new AppError('Invalid provider', 400);
    }

    if (!mappingRules || typeof mappingRules !== 'object') {
      throw new AppError('mappingRules object is required', 400);
    }

    try {
      const integration = await prisma.integration.findUnique({
        where: {
          organizationId_provider: { organizationId, provider },
        },
      });

      if (!integration) {
        throw new AppError(`${provider} integration not found`, 404);
      }

      const existingConfig = (integration.config || {}) as any;
      const updatedConfig = { ...existingConfig, mappingRules };

      await prisma.integration.update({
        where: { id: integration.id },
        data: { config: updatedConfig as any },
      });

      logger.info(`Field mapping updated for ${provider} in org ${organizationId}`);

      res.json({
        success: true,
        provider,
        mappingRules,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating field mapping', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to update field mapping', 500);
    }
  })
);

// ============================================================================
// POST /webhook/:provider - Webhook endpoint for receiving updates
// ============================================================================

// Per-provider HMAC signature config. Each provider uses a different header and algorithm.
const PROVIDER_HMAC_CONFIG: Record<TicketingProvider, { header: string; algo: 'sha256' | 'sha1'; prefix?: string }> = {
  jira: { header: 'x-hub-signature-256', algo: 'sha256', prefix: 'sha256=' },
  servicenow: { header: 'x-servicenow-webhook-signature', algo: 'sha256' },
  azure_devops: { header: 'x-vss-signature', algo: 'sha1', prefix: 'sha1=' },
};

function verifyWebhookHmac(
  raw: Buffer,
  signature: string | undefined,
  secret: string,
  algo: 'sha256' | 'sha1',
  prefix?: string,
): boolean {
  if (!signature) return false;
  let sig = signature;
  if (prefix && sig.toLowerCase().startsWith(prefix)) sig = sig.slice(prefix.length);
  const expected = crypto.createHmac(algo, secret).update(raw).digest('hex');
  try {
    const a = Buffer.from(sig.toLowerCase(), 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

router.post(
  '/webhook/:provider',
  asyncHandler(async (req: Request, res: Response) => {
    const { provider } = req.params as { provider: TicketingProvider };
    const orgId =
      (req.headers['x-complyeasy-org-id'] as string) ||
      (req.query.orgId as string);

    if (!orgId) {
      logger.warn(`[Ticketing Webhook] No organization ID in ${provider} webhook`, { ip: req.ip });
      return res.status(400).json({ error: 'Missing organization context' });
    }

    const cfg = PROVIDER_HMAC_CONFIG[provider];
    if (!cfg) {
      throw new AppError('Invalid provider', 400);
    }

    // Look up the org's integration to get the webhook secret. The secret is stored
    // encrypted in integration.config.webhookSecret per the credential encryption rule.
    const integration = await prisma.integration.findFirst({
      where: { organizationId: orgId, provider, connected: true },
      select: { config: true },
    });

    const encryptedSecret = (integration?.config as any)?.webhookSecret as string | undefined;
    if (!encryptedSecret) {
      logger.warn(`[Ticketing Webhook] No webhook secret configured for ${provider}/${orgId}`, { ip: req.ip });
      return res.status(401).json({ error: 'Webhook secret not configured for this integration' });
    }

    const secret = decryptField(encryptedSecret);
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    const signatureHeader = req.headers[cfg.header] as string | undefined;

    if (!verifyWebhookHmac(rawBody, signatureHeader, secret, cfg.algo, cfg.prefix)) {
      logger.warn(`[Ticketing Webhook] Invalid HMAC signature on ${provider} webhook`, {
        provider,
        orgId,
        ip: req.ip,
        hasSignature: !!signatureHeader,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Signature verified — parse JSON
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    try {
      let result: { processed: boolean };

      switch (provider) {
        case 'jira':
          result = await jiraService.processWebhookEvent(orgId, payload);
          break;
        case 'servicenow':
          result = await servicenowService.processWebhookEvent(orgId, payload);
          break;
        case 'azure_devops':
          result = await azureDevOpsService.processWebhookEvent(orgId, payload);
          break;
        default:
          throw new AppError('Invalid provider', 400);
      }

      res.json({ received: true, processed: result.processed });
    } catch (error: any) {
      // Logger is wired to Sentry transport — this captures the exception in error tracking.
      logger.error(`[Ticketing Webhook] Error processing ${provider} webhook`, {
        err: error,
        provider,
        orgId,
        ticketId: (payload as any)?.id,
        ip: req.ip,
      });
      // Intentionally return 200 to prevent webhook retry storms (signature already verified).
      res.status(200).json({ received: true, processed: false, error: 'logged' });
    }
  })
);

export default router;
