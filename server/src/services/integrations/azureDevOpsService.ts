/**
 * Azure DevOps REST API Integration Service
 *
 * Provides full integration with Azure DevOps for work item management,
 * queries (WIQL), and compliance ticket synchronization.
 * Uses Azure DevOps API v7 with PAT or OAuth 2.0 authentication.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import prisma from '../../config/database';
import logger from '../../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AzureDevOpsConfig {
  organization: string; // Azure DevOps org name
  project: string; // Default project name
  authType: 'pat' | 'oauth';
  pat?: string; // Personal Access Token
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  tenantId?: string;
}

interface AzureDevOpsOAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface AzureDevOpsWorkItem {
  id: number;
  rev: number;
  url: string;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.Description': string;
    'System.State': string;
    'System.WorkItemType': string;
    'System.AssignedTo'?: { displayName: string; uniqueName: string };
    'System.CreatedDate': string;
    'System.ChangedDate': string;
    'System.CreatedBy'?: { displayName: string; uniqueName: string };
    'System.AreaPath': string;
    'System.IterationPath': string;
    'System.Tags': string;
    'Microsoft.VSTS.Common.Priority': number;
    'Microsoft.VSTS.Common.Severity': string;
    [key: string]: any;
  };
}

interface WIQLQueryResult {
  queryType: string;
  queryResultType: string;
  asOf: string;
  columns: Array<{ referenceName: string; name: string; url: string }>;
  workItems: Array<{ id: number; url: string }>;
}

interface WorkItemCommentResult {
  id: number;
  text: string;
  createdBy: { displayName: string; uniqueName: string };
  createdDate: string;
  modifiedDate: string;
}

interface WorkItemCommentsResponse {
  totalCount: number;
  count: number;
  comments: WorkItemCommentResult[];
  continuationToken?: string;
}

export interface CreateWorkItemInput {
  title: string;
  description?: string;
  workItemType?: string; // Bug, Task, User Story, Feature, Epic
  assignedTo?: string;
  state?: string;
  priority?: number; // 1-4
  severity?: string;
  tags?: string;
  areaPath?: string;
  iterationPath?: string;
  [key: string]: any;
}

export interface UpdateWorkItemInput {
  title?: string;
  description?: string;
  state?: string;
  assignedTo?: string;
  priority?: number;
  severity?: string;
  tags?: string;
  areaPath?: string;
  iterationPath?: string;
  [key: string]: any;
}

interface JsonPatchOperation {
  op: 'add' | 'replace' | 'remove' | 'test';
  path: string;
  value?: any;
  from?: string;
}

interface SyncResult {
  pushed: number;
  pulled: number;
  updated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class AzureDevOpsService {
  private readonly apiVersion = '7.0';
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000;

  /**
   * Build an authenticated axios client for a given organization
   */
  private async getClient(organizationId: string): Promise<{ client: AxiosInstance; config: AzureDevOpsConfig }> {
    const integration = await this.getIntegration(organizationId);
    if (!integration || !integration.connected) {
      throw new Error('Azure DevOps integration not connected');
    }

    const adoConfig = integration.config as unknown as AzureDevOpsConfig;
    if (!adoConfig?.organization) {
      throw new Error('Azure DevOps organization not configured');
    }

    const baseURL = `https://dev.azure.com/${encodeURIComponent(adoConfig.organization)}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (adoConfig.authType === 'oauth') {
      const token = await this.ensureValidOAuthToken(organizationId, adoConfig);
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      if (!adoConfig.pat) {
        throw new Error('Azure DevOps PAT not configured');
      }
      const encoded = Buffer.from(`:${adoConfig.pat}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    return {
      client: axios.create({ baseURL, headers, timeout: 30000 }),
      config: adoConfig,
    };
  }

  /**
   * Ensure OAuth token is valid; refresh if expired
   */
  private async ensureValidOAuthToken(
    organizationId: string,
    config: AzureDevOpsConfig
  ): Promise<string> {
    if (config.accessToken && config.tokenExpiresAt) {
      const expiresAt = new Date(config.tokenExpiresAt);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (expiresAt > fiveMinutesFromNow) {
        return config.accessToken;
      }
    }

    if (!config.refreshToken) {
      throw new Error('No refresh token available. Please reconnect the Azure DevOps integration.');
    }

    return this.refreshOAuthToken(organizationId, config);
  }

  /**
   * Refresh OAuth token with retry
   */
  private async refreshOAuthToken(
    organizationId: string,
    config: AzureDevOpsConfig
  ): Promise<string> {
    const tokenUrl = config.tenantId
      ? `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
      : 'https://app.vssps.visualstudio.com/oauth2/token';

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const body = config.tenantId
          ? new URLSearchParams({
              client_id: config.clientId!,
              client_secret: config.clientSecret!,
              grant_type: 'refresh_token',
              refresh_token: config.refreshToken!,
              scope: '499b84ac-1321-427f-aa17-267ca6975798/.default',
            }).toString()
          : new URLSearchParams({
              client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
              client_assertion: config.clientSecret!,
              grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
              assertion: config.refreshToken!,
              redirect_uri: `${process.env.APP_URL || 'http://localhost:3001'}/api/integrations/azure-devops/callback`,
            }).toString();

        const response = await axios.post<AzureDevOpsOAuthTokenResponse>(tokenUrl, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        });

        const { access_token, refresh_token, expires_in } = response.data;
        const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

        // Persist new tokens
        const integration = await this.getIntegration(organizationId);
        if (integration) {
          const updatedConfig: AzureDevOpsConfig = {
            ...config,
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiresAt,
          };
          await prisma.integration.update({
            where: { id: integration.id },
            data: {
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresAt: new Date(tokenExpiresAt),
              config: updatedConfig as any,
            },
          });
        }

        return access_token;
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 400) {
          throw new Error('OAuth refresh token is invalid. Please reconnect the Azure DevOps integration.');
        }
        if (attempt < this.maxRetries) {
          const delay = this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(`Azure DevOps token refresh attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Failed to refresh Azure DevOps OAuth token: ${error.message}`);
      }
    }

    throw new Error('Failed to refresh Azure DevOps OAuth token after retries');
  }

  /**
   * Make a request with retry logic for rate-limiting and transient errors
   */
  private async requestWithRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (attempt < this.maxRetries && (status === 429 || (status && status >= 500))) {
          const retryAfter = axiosError.response?.headers?.['retry-after'];
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(
            `[AzureDevOps] ${context} - HTTP ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (
          attempt < this.maxRetries &&
          (error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            error.message?.includes('timeout'))
        ) {
          const delay = this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(`[AzureDevOps] ${context} - Network error, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        logger.error(`[AzureDevOps] ${context} failed`, error);
        throw error;
      }
    }

    throw new Error(`[AzureDevOps] ${context} failed after ${this.maxRetries} retries`);
  }

  // =========================================================================
  // Integration persistence
  // =========================================================================

  async getIntegration(organizationId: string) {
    return prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure_devops',
        },
      },
    });
  }

  async saveIntegration(
    organizationId: string,
    config: AzureDevOpsConfig
  ): Promise<void> {
    const expiresAt = config.tokenExpiresAt ? new Date(config.tokenExpiresAt) : null;

    await prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure_devops',
        },
      },
      create: {
        organizationId,
        name: 'Azure DevOps',
        category: 'devops',
        provider: 'azure_devops',
        connected: true,
        accessToken: config.accessToken || config.pat || null,
        refreshToken: config.refreshToken || null,
        expiresAt,
        config: config as any,
        lastSync: new Date(),
      },
      update: {
        connected: true,
        accessToken: config.accessToken || config.pat || null,
        refreshToken: config.refreshToken || null,
        expiresAt,
        config: config as any,
        lastSync: new Date(),
      },
    });

    logger.info(`Azure DevOps integration saved for organization ${organizationId}`);
  }

  async disconnect(organizationId: string): Promise<void> {
    await prisma.integration.update({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'azure_devops',
        },
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        config: {} as any,
        lastSync: null,
      },
    });

    logger.info(`Azure DevOps integration disconnected for organization ${organizationId}`);
  }

  // =========================================================================
  // Test connection
  // =========================================================================

  async testConnection(organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { client, config: adoConfig } = await this.getClient(organizationId);
      const response = await client.get(`/${encodeURIComponent(adoConfig.project)}/_apis/projects`, {
        params: { 'api-version': this.apiVersion, '$top': 1 },
      });

      if (response.status === 200) {
        return { success: true, message: 'Connection successful' };
      }
      return { success: false, message: `Unexpected status: ${response.status}` };
    } catch (error: any) {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) {
        return { success: false, message: 'Authentication failed. Check PAT or OAuth credentials.' };
      }
      if (status === 404) {
        return { success: false, message: 'Organization or project not found. Check configuration.' };
      }
      return { success: false, message: error.message || 'Connection failed' };
    }
  }

  // =========================================================================
  // Work Item Management
  // =========================================================================

  /**
   * Build JSON Patch document from field updates
   */
  private buildPatchDocument(fields: Record<string, any>): JsonPatchOperation[] {
    const fieldMap: Record<string, string> = {
      title: '/fields/System.Title',
      description: '/fields/System.Description',
      state: '/fields/System.State',
      assignedTo: '/fields/System.AssignedTo',
      priority: '/fields/Microsoft.VSTS.Common.Priority',
      severity: '/fields/Microsoft.VSTS.Common.Severity',
      tags: '/fields/System.Tags',
      areaPath: '/fields/System.AreaPath',
      iterationPath: '/fields/System.IterationPath',
    };

    const operations: JsonPatchOperation[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      const path = fieldMap[key] || `/fields/${key}`;
      operations.push({ op: 'add', path, value });
    }

    return operations;
  }

  async createWorkItem(
    organizationId: string,
    project: string | undefined,
    workItemType: string,
    fields: CreateWorkItemInput
  ): Promise<AzureDevOpsWorkItem> {
    return this.requestWithRetry(async () => {
      const { client, config: adoConfig } = await this.getClient(organizationId);
      const targetProject = project || adoConfig.project;

      const { title, description, assignedTo, state, priority, severity, tags, areaPath, iterationPath, workItemType: _, ...customFields } = fields;

      const patchDoc = this.buildPatchDocument({
        title,
        description,
        assignedTo,
        state,
        priority,
        severity,
        tags,
        areaPath,
        iterationPath,
        ...customFields,
      });

      const response = await client.post<AzureDevOpsWorkItem>(
        `/${encodeURIComponent(targetProject)}/_apis/wit/workitems/$${encodeURIComponent(workItemType)}`,
        patchDoc,
        {
          params: { 'api-version': this.apiVersion },
          headers: { 'Content-Type': 'application/json-patch+json' },
        }
      );

      logger.info(
        `[AzureDevOps] Created work item ${response.data.id} (${workItemType}) for org ${organizationId}`
      );
      return response.data;
    }, `createWorkItem(${workItemType})`);
  }

  async updateWorkItem(
    organizationId: string,
    id: number,
    fields: UpdateWorkItemInput
  ): Promise<AzureDevOpsWorkItem> {
    return this.requestWithRetry(async () => {
      const { client } = await this.getClient(organizationId);

      const patchDoc = this.buildPatchDocument(fields);

      if (patchDoc.length === 0) {
        throw new Error('No fields to update');
      }

      const response = await client.patch<AzureDevOpsWorkItem>(
        `/_apis/wit/workitems/${id}`,
        patchDoc,
        {
          params: { 'api-version': this.apiVersion },
          headers: { 'Content-Type': 'application/json-patch+json' },
        }
      );

      logger.info(`[AzureDevOps] Updated work item ${id} for org ${organizationId}`);
      return response.data;
    }, `updateWorkItem(${id})`);
  }

  async getWorkItem(
    organizationId: string,
    id: number,
    expand?: 'all' | 'relations' | 'fields' | 'links' | 'none'
  ): Promise<AzureDevOpsWorkItem> {
    return this.requestWithRetry(async () => {
      const { client } = await this.getClient(organizationId);

      const params: Record<string, string> = { 'api-version': this.apiVersion };
      if (expand) params['$expand'] = expand;

      const response = await client.get<AzureDevOpsWorkItem>(`/_apis/wit/workitems/${id}`, { params });
      return response.data;
    }, `getWorkItem(${id})`);
  }

  async getWorkItems(
    organizationId: string,
    ids: number[],
    fields?: string[]
  ): Promise<AzureDevOpsWorkItem[]> {
    if (ids.length === 0) return [];

    // Azure DevOps API supports max 200 IDs per request
    const chunks: number[][] = [];
    for (let i = 0; i < ids.length; i += 200) {
      chunks.push(ids.slice(i, i + 200));
    }

    const allItems: AzureDevOpsWorkItem[] = [];

    for (const chunk of chunks) {
      const items = await this.requestWithRetry(async () => {
        const { client } = await this.getClient(organizationId);

        const params: Record<string, string> = {
          ids: chunk.join(','),
          'api-version': this.apiVersion,
        };
        if (fields?.length) params['fields'] = fields.join(',');

        const response = await client.get<{ count: number; value: AzureDevOpsWorkItem[] }>(
          '/_apis/wit/workitems',
          { params }
        );
        return response.data.value || [];
      }, `getWorkItems(batch of ${chunk.length})`);

      allItems.push(...items);
    }

    return allItems;
  }

  /**
   * Query work items using WIQL (Work Item Query Language)
   */
  async queryWorkItems(
    organizationId: string,
    wiql: string,
    maxResults: number = 200
  ): Promise<AzureDevOpsWorkItem[]> {
    return this.requestWithRetry(async () => {
      const { client, config: adoConfig } = await this.getClient(organizationId);

      const response = await client.post<WIQLQueryResult>(
        `/${encodeURIComponent(adoConfig.project)}/_apis/wit/wiql`,
        { query: wiql },
        {
          params: { 'api-version': this.apiVersion, '$top': maxResults },
        }
      );

      const workItemIds = (response.data.workItems || []).map((wi) => wi.id);
      if (workItemIds.length === 0) return [];

      return this.getWorkItems(organizationId, workItemIds);
    }, 'queryWorkItems');
  }

  /**
   * Add a comment to a work item
   */
  async addComment(
    organizationId: string,
    workItemId: number,
    text: string
  ): Promise<WorkItemCommentResult> {
    return this.requestWithRetry(async () => {
      const { client, config: adoConfig } = await this.getClient(organizationId);

      const response = await client.post<WorkItemCommentResult>(
        `/${encodeURIComponent(adoConfig.project)}/_apis/wit/workitems/${workItemId}/comments`,
        { text },
        { params: { 'api-version': '7.0-preview.4' } }
      );

      logger.info(`[AzureDevOps] Added comment to work item ${workItemId}`);
      return response.data;
    }, `addComment(${workItemId})`);
  }

  /**
   * Get comments for a work item
   */
  async getComments(
    organizationId: string,
    workItemId: number,
    maxResults: number = 100
  ): Promise<WorkItemCommentResult[]> {
    return this.requestWithRetry(async () => {
      const { client, config: adoConfig } = await this.getClient(organizationId);

      const response = await client.get<WorkItemCommentsResponse>(
        `/${encodeURIComponent(adoConfig.project)}/_apis/wit/workitems/${workItemId}/comments`,
        { params: { 'api-version': '7.0-preview.4', '$top': maxResults } }
      );

      return response.data.comments || [];
    }, `getComments(${workItemId})`);
  }

  // =========================================================================
  // Project & State helpers
  // =========================================================================

  /**
   * List all projects in the Azure DevOps organization.
   */
  async listProjects(organizationId: string): Promise<Array<{ id: string; name: string; state: string; url: string }>> {
    return this.requestWithRetry(async () => {
      const { client } = await this.getClient(organizationId);

      const response = await client.get<{ count: number; value: any[] }>('/_apis/projects', {
        params: { 'api-version': this.apiVersion, '$top': 100 },
      });

      const projects = (response.data.value || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        state: p.state,
        url: p.url,
        description: p.description || '',
        lastUpdateTime: p.lastUpdateTime || '',
      }));

      logger.info(`[AzureDevOps] Listed ${projects.length} projects for org ${organizationId}`);
      return projects;
    }, 'listProjects');
  }

  /**
   * Get the available workflow states for a work item type in a project.
   */
  async getWorkItemStates(
    organizationId: string,
    workItemType: string,
    project?: string
  ): Promise<Array<{ name: string; color: string; category: string }>> {
    return this.requestWithRetry(async () => {
      const { client, config: adoConfig } = await this.getClient(organizationId);
      const targetProject = project || adoConfig.project;

      const response = await client.get<{ count: number; value: any[] }>(
        `/${encodeURIComponent(targetProject)}/_apis/wit/workitemtypes/${encodeURIComponent(workItemType)}/states`,
        { params: { 'api-version': this.apiVersion } }
      );

      const states = (response.data.value || []).map((s: any) => ({
        name: s.name,
        color: s.color || '',
        category: s.category || '',
      }));

      logger.info(`[AzureDevOps] Found ${states.length} states for ${workItemType}`);
      return states;
    }, `getWorkItemStates(${workItemType})`);
  }

  /**
   * Add a file attachment to a work item.
   */
  async addAttachment(
    organizationId: string,
    workItemId: number,
    filename: string,
    content: Buffer | string
  ): Promise<{ id: string; url: string }> {
    return this.requestWithRetry(async () => {
      const { client, config: adoConfig } = await this.getClient(organizationId);
      const targetProject = adoConfig.project;

      // Step 1: Upload the attachment
      const uploadResponse = await client.post<{ id: string; url: string }>(
        `/${encodeURIComponent(targetProject)}/_apis/wit/attachments`,
        typeof content === 'string' ? Buffer.from(content, 'utf-8') : content,
        {
          params: {
            'api-version': this.apiVersion,
            fileName: filename,
          },
          headers: { 'Content-Type': 'application/octet-stream' },
        }
      );

      const attachmentUrl = uploadResponse.data.url;

      // Step 2: Link the attachment to the work item
      const patchDoc: JsonPatchOperation[] = [
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'AttachedFile',
            url: attachmentUrl,
            attributes: { comment: `Attached: ${filename}` },
          },
        },
      ];

      await client.patch(
        `/_apis/wit/workitems/${workItemId}`,
        patchDoc,
        {
          params: { 'api-version': this.apiVersion },
          headers: { 'Content-Type': 'application/json-patch+json' },
        }
      );

      logger.info(`[AzureDevOps] Attached ${filename} to work item ${workItemId}`);
      return { id: uploadResponse.data.id, url: attachmentUrl };
    }, `addAttachment(${workItemId}, ${filename})`);
  }

  /**
   * Sync status for a single external work item.
   */
  async syncStatus(
    organizationId: string,
    workItemId: number
  ): Promise<{ workItemId: number; status: string; mappedStatus: string; updatedAt: string }> {
    const workItem = await this.getWorkItem(organizationId, workItemId);
    const state = workItem.fields['System.State'] || '';
    const mappedStatus = this.mapAdoStateToLocal(state);
    const updatedAt = workItem.fields['System.ChangedDate'] || '';

    logger.info(`[AzureDevOps] Synced status for WI#${workItemId}: ${state} -> ${mappedStatus}`);

    return { workItemId, status: state, mappedStatus, updatedAt };
  }

  /**
   * Map Azure DevOps states to ComplyEasy internal statuses (public alias).
   */
  mapToComplyEasyStatus(adoState: string): string {
    return this.mapAdoStateToLocal(adoState);
  }

  // =========================================================================
  // Compliance-aware operations
  // =========================================================================

  async createComplianceWorkItem(
    organizationId: string,
    ticket: {
      title: string;
      description: string;
      severity: string;
      framework?: string;
      controlId?: string;
      sourceType?: string;
      sourceId?: string;
    }
  ): Promise<AzureDevOpsWorkItem> {
    const priorityMap: Record<string, number> = {
      Critical: 1,
      High: 2,
      Medium: 3,
      Low: 4,
    };

    const workItem = await this.createWorkItem(organizationId, undefined, 'Task', {
      title: `[ComplyEasyAI] ${ticket.title}`,
      description:
        `<div>${ticket.description}</div>` +
        `<hr/>` +
        `<div><strong>Framework:</strong> ${ticket.framework || 'General'}</div>` +
        `<div><strong>Severity:</strong> ${ticket.severity}</div>` +
        (ticket.controlId ? `<div><strong>Control ID:</strong> ${ticket.controlId}</div>` : '') +
        (ticket.sourceType
          ? `<div><strong>Source:</strong> ${ticket.sourceType} (${ticket.sourceId})</div>`
          : '') +
        `<div><strong>Created by:</strong> ComplyEasyAI</div>`,
      priority: priorityMap[ticket.severity] || 3,
      tags: `compliance;complyeasyai;${ticket.framework || 'general'}`,
    });

    // Record the sync in audit log
    await prisma.auditLog.create({
      data: {
        action: 'azuredevops_sync.pushed',
        organizationId,
        hash: String(workItem.id),
        details: JSON.stringify({
          workItemId: workItem.id,
          workItemUrl: workItem.url,
          sourceType: ticket.sourceType,
          sourceId: ticket.sourceId,
        }),
      },
    });

    return workItem;
  }

  /**
   * Sync compliance work items between ComplyEasyAI and Azure DevOps
   */
  async syncWorkItems(
    organizationId: string,
    options?: {
      direction?: 'push' | 'pull' | 'bidirectional';
      since?: Date;
    }
  ): Promise<SyncResult> {
    const direction = options?.direction || 'bidirectional';
    const since = options?.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let pushed = 0;
    let pulled = 0;
    let updated = 0;
    const errors: string[] = [];

    // PUSH: local compliance issues -> Azure DevOps
    if (direction === 'push' || direction === 'bidirectional') {
      try {
        const localIssues = await prisma.issue.findMany({
          where: {
            organizationId,
            updatedAt: { gte: since },
            status: { not: 'Closed' },
          },
          take: 100,
        });

        for (const issue of localIssues) {
          try {
            const existingSync = await prisma.auditLog.findFirst({
              where: {
                organizationId,
                action: 'azuredevops_sync.pushed',
                details: { contains: issue.id },
              },
            });

            if (!existingSync) {
              const workItem = await this.createComplianceWorkItem(organizationId, {
                title: issue.title,
                description: issue.description || '',
                severity: issue.priority || 'Medium',
                sourceType: 'issue',
                sourceId: issue.id,
              });

              await prisma.auditLog.create({
                data: {
                  action: 'azuredevops_sync.pushed',
                  organizationId,
                  hash: issue.id,
                  details: JSON.stringify({
                    localIssueId: issue.id,
                    adoWorkItemId: workItem.id,
                    adoWorkItemUrl: workItem.url,
                  }),
                },
              });

              pushed++;
            }
          } catch (issueError: any) {
            errors.push(`Push failed for issue ${issue.id}: ${issueError.message}`);
          }
        }
      } catch (pushError: any) {
        errors.push(`Push phase failed: ${pushError.message}`);
      }
    }

    // PULL: Azure DevOps compliance work items -> local
    if (direction === 'pull' || direction === 'bidirectional') {
      try {
        const sinceStr = since.toISOString().slice(0, 10);
        const wiql = `SELECT [System.Id] FROM WorkItems WHERE [System.Tags] CONTAINS 'compliance' AND [System.Tags] CONTAINS 'complyeasyai' AND [System.ChangedDate] >= '${sinceStr}' ORDER BY [System.ChangedDate] DESC`;

        const workItems = await this.queryWorkItems(organizationId, wiql, 100);

        for (const wi of workItems) {
          try {
            const wiIdStr = String(wi.id);
            const existingSync = await prisma.auditLog.findFirst({
              where: {
                organizationId,
                action: 'azuredevops_sync.pulled',
                details: { contains: wiIdStr },
              },
            });

            if (existingSync) {
              const syncDetails = JSON.parse(existingSync.details || '{}');
              if (syncDetails.localIssueId) {
                await prisma.issue
                  .update({
                    where: { id: syncDetails.localIssueId },
                    data: {
                      status: this.mapAdoStateToLocal(wi.fields['System.State']) as any,
                      updatedAt: new Date(),
                    },
                  })
                  .catch(() => {});
                updated++;
              }
            } else {
              const localIssue = await prisma.issue.create({
                data: {
                  organizationId,
                  title: wi.fields['System.Title'] || `ADO Work Item #${wi.id}`,
                  description: wi.fields['System.Description'] || '',
                  issueType: 'compliance',
                  priority: this.mapAdoPriorityToSeverity(wi.fields['Microsoft.VSTS.Common.Priority']) as any,
                  status: this.mapAdoStateToLocal(wi.fields['System.State']),
                  createdById: 'system',
                  tags: JSON.stringify({
                    source: 'azure_devops',
                    adoWorkItemId: wi.id,
                  }),
                },
              });

              await prisma.auditLog.create({
                data: {
                  action: 'azuredevops_sync.pulled',
                  organizationId,
                  hash: wiIdStr,
                  details: JSON.stringify({
                    localIssueId: localIssue.id,
                    adoWorkItemId: wi.id,
                  }),
                },
              });

              pulled++;
            }
          } catch (wiError: any) {
            errors.push(`Pull failed for ADO work item ${wi.id}: ${wiError.message}`);
          }
        }
      } catch (pullError: any) {
        errors.push(`Pull phase failed: ${pullError.message}`);
      }
    }

    logger.info(
      `[AzureDevOps] Sync complete for org ${organizationId}: pushed=${pushed}, pulled=${pulled}, updated=${updated}, errors=${errors.length}`
    );

    return { pushed, pulled, updated, errors };
  }

  /**
   * Get sync status for an organization
   */
  async getSyncStatus(organizationId: string): Promise<{
    lastSync: Date | null;
    totalSynced: number;
    pendingSync: number;
    syncErrors: number;
  }> {
    try {
      const [lastSyncLog, totalSynced, syncErrors] = await Promise.all([
        prisma.auditLog.findFirst({
          where: { organizationId, action: { startsWith: 'azuredevops_sync.' } },
          orderBy: { timestamp: 'desc' },
        }),
        prisma.auditLog.count({
          where: { organizationId, action: { startsWith: 'azuredevops_sync.' } },
        }),
        prisma.auditLog.count({
          where: { organizationId, action: 'azuredevops_sync.error' },
        }),
      ]);

      const totalLocalIssues = await prisma.issue.count({
        where: { organizationId, status: { not: 'Closed' } },
      });
      const syncedIssueIds = await prisma.auditLog.findMany({
        where: { organizationId, action: 'azuredevops_sync.pushed' },
        select: { hash: true },
      });
      const pendingSync = totalLocalIssues - syncedIssueIds.length;

      return {
        lastSync: lastSyncLog?.timestamp || null,
        totalSynced,
        pendingSync: Math.max(0, pendingSync),
        syncErrors,
      };
    } catch (error) {
      logger.error('[AzureDevOps] Error getting sync status', error);
      return { lastSync: null, totalSynced: 0, pendingSync: 0, syncErrors: 0 };
    }
  }

  /**
   * Process Azure DevOps webhook event (Service Hooks)
   */
  async processWebhookEvent(
    organizationId: string,
    event: {
      eventType: string;
      resource: {
        id: number;
        workItemId?: number;
        fields?: Record<string, any>;
        revision?: {
          fields?: Record<string, any>;
        };
      };
    }
  ): Promise<{ processed: boolean }> {
    try {
      const workItemId = event.resource.workItemId || event.resource.id;
      const wiIdStr = String(workItemId);

      const syncRecord = await prisma.auditLog.findFirst({
        where: {
          organizationId,
          action: { startsWith: 'azuredevops_sync.' },
          details: { contains: wiIdStr },
        },
      });

      if (!syncRecord) {
        logger.debug(`[AzureDevOps] No local record found for work item ${workItemId}`);
        return { processed: false };
      }

      const syncDetails = JSON.parse(syncRecord.details || '{}');
      if (!syncDetails.localIssueId) {
        return { processed: false };
      }

      switch (event.eventType) {
        case 'workitem.updated':
        case 'workitem.created': {
          const fields = event.resource.revision?.fields || event.resource.fields;
          if (fields) {
            const state = fields['System.State'];
            if (state) {
              await prisma.issue
                .update({
                  where: { id: syncDetails.localIssueId },
                  data: {
                    status: this.mapAdoStateToLocal(state) as any,
                    updatedAt: new Date(),
                  },
                })
                .catch(() => {});
            }
          }
          break;
        }
        case 'workitem.deleted': {
          logger.info(`[AzureDevOps] Work item deleted in Azure DevOps: ${workItemId}`);
          break;
        }
        default:
          logger.debug(`[AzureDevOps] Unhandled webhook event: ${event.eventType}`);
      }

      return { processed: true };
    } catch (error) {
      logger.error('[AzureDevOps] Error processing webhook event', error);
      return { processed: false };
    }
  }

  // =========================================================================
  // Mapping helpers
  // =========================================================================

  private mapAdoStateToLocal(
    state?: string
  ): 'Open' | 'In_Progress' | 'Resolved' | 'Closed' | 'Reopened' {
    if (!state) return 'Open';
    const stateLower = state.toLowerCase();
    const stateMap: Record<string, 'Open' | 'In_Progress' | 'Resolved' | 'Closed' | 'Reopened'> = {
      new: 'Open',
      active: 'In_Progress',
      'in progress': 'In_Progress',
      resolved: 'Resolved',
      done: 'Closed',
      closed: 'Closed',
      removed: 'Closed',
    };
    return stateMap[stateLower] || 'Open';
  }

  private mapAdoPriorityToSeverity(priority?: number): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!priority) return 'Medium';
    const priorityMap: Record<number, 'Critical' | 'High' | 'Medium' | 'Low'> = {
      1: 'Critical',
      2: 'High',
      3: 'Medium',
      4: 'Low',
    };
    return priorityMap[priority] || 'Medium';
  }
}

export const azureDevOpsService = new AzureDevOpsService();
export default azureDevOpsService;
