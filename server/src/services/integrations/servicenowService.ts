/**
 * ServiceNow REST API Integration Service
 *
 * Provides full integration with ServiceNow for incident management,
 * CMDB operations, and compliance ticket synchronization using the
 * ServiceNow Table API with support for basic auth and OAuth 2.0.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { isUrlSafe } from '../../utils/urlValidator';
import { encryptField, decryptField } from '../../utils/credentialEncryption';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceNowConfig {
  instanceUrl: string; // e.g. https://mycompany.service-now.com
  authType: 'basic' | 'oauth';
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}

interface ServiceNowOAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface ServiceNowRecord {
  sys_id: string;
  [key: string]: any;
}

interface ServiceNowListResponse {
  result: ServiceNowRecord[];
}

interface ServiceNowSingleResponse {
  result: ServiceNowRecord;
}

interface ServiceNowQueryOptions {
  sysparm_query?: string;
  sysparm_limit?: number;
  sysparm_offset?: number;
  sysparm_fields?: string;
  sysparm_display_value?: 'true' | 'false' | 'all';
  sysparm_order_by?: string;
}

export interface ServiceNowIncident {
  sys_id: string;
  number: string;
  short_description: string;
  description: string;
  state: string;
  impact: string;
  urgency: string;
  priority: string;
  category: string;
  subcategory: string;
  assignment_group: string;
  assigned_to: string;
  caller_id: string;
  opened_at: string;
  resolved_at: string;
  closed_at: string;
  close_notes: string;
  work_notes: string;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface CreateIncidentInput {
  short_description: string;
  description?: string;
  impact?: string;
  urgency?: string;
  priority?: string;
  category?: string;
  subcategory?: string;
  assignment_group?: string;
  assigned_to?: string;
  caller_id?: string;
  contact_type?: string;
  [key: string]: any;
}

export interface UpdateIncidentInput {
  short_description?: string;
  description?: string;
  state?: string;
  impact?: string;
  urgency?: string;
  priority?: string;
  category?: string;
  assignment_group?: string;
  assigned_to?: string;
  work_notes?: string;
  close_notes?: string;
  close_code?: string;
  resolution_code?: string;
  [key: string]: any;
}

export interface CMDBItem {
  sys_id: string;
  name: string;
  asset_tag: string;
  serial_number: string;
  model_id: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  install_status: string;
  operational_status: string;
  assigned_to: string;
  location: string;
  ip_address: string;
  mac_address: string;
  sys_class_name: string;
  sys_created_on: string;
  sys_updated_on: string;
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

class ServiceNowService {
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000;

  /**
   * Build a config snapshot with sensitive credential fields encrypted for at-rest storage.
   * Non-sensitive identifiers (instanceUrl, authType, clientId, tokenExpiresAt) are left untouched.
   */
  private encryptConfigSecrets(cfg: ServiceNowConfig): ServiceNowConfig {
    return {
      ...cfg,
      password: cfg.password ? encryptField(cfg.password) : cfg.password,
      clientSecret: cfg.clientSecret ? encryptField(cfg.clientSecret) : cfg.clientSecret,
      accessToken: cfg.accessToken ? encryptField(cfg.accessToken) : cfg.accessToken,
      refreshToken: cfg.refreshToken ? encryptField(cfg.refreshToken) : cfg.refreshToken,
    };
  }

  /**
   * Decrypt sensitive credential fields after reading from the database.
   */
  private decryptConfigSecrets(cfg: ServiceNowConfig): ServiceNowConfig {
    return {
      ...cfg,
      password: cfg.password ? decryptField(cfg.password) : cfg.password,
      clientSecret: cfg.clientSecret ? decryptField(cfg.clientSecret) : cfg.clientSecret,
      accessToken: cfg.accessToken ? decryptField(cfg.accessToken) : cfg.accessToken,
      refreshToken: cfg.refreshToken ? decryptField(cfg.refreshToken) : cfg.refreshToken,
    };
  }

  /**
   * Build an authenticated axios client for a given organization
   */
  private async getClient(organizationId: string): Promise<AxiosInstance> {
    const integration = await this.getIntegration(organizationId);
    if (!integration || !integration.connected) {
      throw new AppError('ServiceNow integration not connected', 400);
    }

    const rawConfig = integration.config as unknown as ServiceNowConfig;
    if (!rawConfig?.instanceUrl) {
      throw new AppError('ServiceNow instance URL not configured', 400);
    }
    const config = this.decryptConfigSecrets(rawConfig);

    const instanceUrl = config.instanceUrl.replace(/\/+$/, '');

    if (!isUrlSafe(instanceUrl)) {
      throw new AppError(`Unsafe ServiceNow instance URL: ${instanceUrl}`, 400);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (config.authType === 'oauth') {
      const token = await this.ensureValidOAuthToken(organizationId, config);
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      if (!config.username || !config.password) {
        throw new AppError('ServiceNow basic auth credentials not configured', 400);
      }
      const encoded = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    return axios.create({ baseURL: `${instanceUrl}/api/now`, headers, timeout: 30000 });
  }

  /**
   * Ensure OAuth token is valid; refresh if expired
   */
  private async ensureValidOAuthToken(
    organizationId: string,
    config: ServiceNowConfig
  ): Promise<string> {
    if (config.accessToken && config.tokenExpiresAt) {
      const expiresAt = new Date(config.tokenExpiresAt);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (expiresAt > fiveMinutesFromNow) {
        return config.accessToken;
      }
    }

    if (!config.refreshToken) {
      throw new AppError('No refresh token available. Please reconnect the ServiceNow integration.', 400);
    }

    return this.refreshOAuthToken(organizationId, config);
  }

  /**
   * Refresh OAuth token with retry
   */
  private async refreshOAuthToken(
    organizationId: string,
    config: ServiceNowConfig
  ): Promise<string> {
    const instanceUrl = config.instanceUrl.replace(/\/+$/, '');

    if (!isUrlSafe(instanceUrl)) {
      throw new AppError(`Unsafe ServiceNow instance URL: ${instanceUrl}`, 400);
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post<ServiceNowOAuthTokenResponse>(
          `${instanceUrl}/oauth_token.do`,
          new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: config.clientId!,
            client_secret: config.clientSecret!,
            refresh_token: config.refreshToken!,
          }).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

        // Persist new tokens (encrypted at rest)
        const integration = await this.getIntegration(organizationId);
        if (integration) {
          const updatedConfig: ServiceNowConfig = {
            ...config,
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiresAt,
          };
          await prisma.integration.update({
            where: { id: integration.id },
            data: {
              accessToken: access_token ? encryptField(access_token) : null,
              refreshToken: refresh_token ? encryptField(refresh_token) : null,
              expiresAt: new Date(tokenExpiresAt),
              config: this.encryptConfigSecrets(updatedConfig) as any,
            },
          });
        }

        return access_token;
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AppError('OAuth refresh token is invalid. Please reconnect the ServiceNow integration.', 403);
        }
        if (attempt < this.maxRetries) {
          const delay = this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(`ServiceNow token refresh attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new AppError(`Failed to refresh ServiceNow OAuth token: ${error.message}`, 500);
      }
    }

    throw new AppError('Failed to refresh ServiceNow OAuth token after retries', 500);
  }

  /**
   * Make a request with retry logic for rate-limiting (429) and transient errors
   */
  private async requestWithRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        // Retry on 429 (rate limit) or 5xx server errors
        if (attempt < this.maxRetries && (status === 429 || (status && status >= 500))) {
          const retryAfter = axiosError.response?.headers?.['retry-after'];
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(
            `[ServiceNow] ${context} - HTTP ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Retry on network errors
        if (
          attempt < this.maxRetries &&
          (error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            error.message?.includes('timeout'))
        ) {
          const delay = this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(`[ServiceNow] ${context} - Network error, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        logger.error(`[ServiceNow] ${context} failed`, error);
        throw error;
      }
    }

    throw new AppError(`[ServiceNow] ${context} failed after ${this.maxRetries} retries`, 500);
  }

  // =========================================================================
  // Integration persistence
  // =========================================================================

  async getIntegration(organizationId: string) {
    return prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'servicenow',
        },
      },
    });
  }

  async saveIntegration(
    organizationId: string,
    config: ServiceNowConfig
  ): Promise<void> {
    const expiresAt = config.tokenExpiresAt ? new Date(config.tokenExpiresAt) : null;
    const encryptedConfig = this.encryptConfigSecrets(config);

    await prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'servicenow',
        },
      },
      create: {
        organizationId,
        name: 'ServiceNow',
        category: 'itsm',
        provider: 'servicenow',
        connected: true,
        accessToken: config.accessToken ? encryptField(config.accessToken) : null,
        refreshToken: config.refreshToken ? encryptField(config.refreshToken) : null,
        expiresAt,
        config: encryptedConfig as any,
        lastSync: new Date(),
      },
      update: {
        connected: true,
        accessToken: config.accessToken ? encryptField(config.accessToken) : null,
        refreshToken: config.refreshToken ? encryptField(config.refreshToken) : null,
        expiresAt,
        config: encryptedConfig as any,
        lastSync: new Date(),
      },
    });

    logger.info(`ServiceNow integration saved for organization ${organizationId}`);
  }

  async disconnect(organizationId: string): Promise<void> {
    await prisma.integration.update({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'servicenow',
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

    logger.info(`ServiceNow integration disconnected for organization ${organizationId}`);
  }

  // =========================================================================
  // Test connection
  // =========================================================================

  async testConnection(organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const client = await this.getClient(organizationId);
      const response = await client.get('/table/sys_user', {
        params: { sysparm_limit: 1, sysparm_fields: 'sys_id' },
      });

      if (response.status === 200) {
        return { success: true, message: 'Connection successful' };
      }
      return { success: false, message: `Unexpected status: ${response.status}` };
    } catch (error: any) {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) {
        return { success: false, message: 'Authentication failed. Check credentials.' };
      }
      return { success: false, message: error.message || 'Connection failed' };
    }
  }

  // =========================================================================
  // Incident Management
  // =========================================================================

  async createIncident(
    organizationId: string,
    fields: CreateIncidentInput
  ): Promise<ServiceNowIncident> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);
      const response = await client.post<ServiceNowSingleResponse>('/table/incident', fields);

      logger.info(
        `[ServiceNow] Created incident ${response.data.result.number} for org ${organizationId}`
      );
      return this.mapIncident(response.data.result);
    }, 'createIncident');
  }

  async updateIncident(
    organizationId: string,
    sysId: string,
    fields: UpdateIncidentInput
  ): Promise<ServiceNowIncident> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);
      const response = await client.patch<ServiceNowSingleResponse>(
        `/table/incident/${encodeURIComponent(sysId)}`,
        fields
      );

      logger.info(
        `[ServiceNow] Updated incident ${response.data.result.number} for org ${organizationId}`
      );
      return this.mapIncident(response.data.result);
    }, 'updateIncident');
  }

  async getIncident(organizationId: string, sysId: string): Promise<ServiceNowIncident> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);
      const response = await client.get<ServiceNowSingleResponse>(
        `/table/incident/${encodeURIComponent(sysId)}`,
        { params: { sysparm_display_value: 'all' } }
      );
      return this.mapIncident(response.data.result);
    }, 'getIncident');
  }

  async addWorkNote(
    organizationId: string,
    sysId: string,
    note: string
  ): Promise<ServiceNowIncident> {
    return this.updateIncident(organizationId, sysId, { work_notes: note });
  }

  // =========================================================================
  // Generic Table API
  // =========================================================================

  async queryTable(
    organizationId: string,
    tableName: string,
    options: ServiceNowQueryOptions = {}
  ): Promise<{ records: ServiceNowRecord[]; totalCount: number }> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);

      const params: Record<string, string | number> = {
        sysparm_limit: options.sysparm_limit ?? 100,
        sysparm_offset: options.sysparm_offset ?? 0,
        sysparm_display_value: options.sysparm_display_value ?? 'false',
      };
      if (options.sysparm_query) params['sysparm_query'] = options.sysparm_query;
      if (options.sysparm_fields) params['sysparm_fields'] = options.sysparm_fields;
      if (options.sysparm_order_by) params['sysparm_order_by'] = options.sysparm_order_by;

      const response = await client.get<ServiceNowListResponse>(
        `/table/${encodeURIComponent(tableName)}`,
        { params }
      );

      const totalCountHeader = response.headers['x-total-count'];
      const totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : response.data.result.length;

      return { records: response.data.result, totalCount };
    }, `queryTable(${tableName})`);
  }

  /**
   * Paginate through all records matching a query
   */
  async queryAllRecords(
    organizationId: string,
    tableName: string,
    query?: string,
    fields?: string,
    maxRecords: number = 1000
  ): Promise<ServiceNowRecord[]> {
    const allRecords: ServiceNowRecord[] = [];
    const pageSize = 100;
    let offset = 0;

    while (offset < maxRecords) {
      const { records, totalCount } = await this.queryTable(organizationId, tableName, {
        sysparm_query: query,
        sysparm_fields: fields,
        sysparm_limit: Math.min(pageSize, maxRecords - offset),
        sysparm_offset: offset,
      });

      allRecords.push(...records);
      offset += records.length;

      if (records.length < pageSize || offset >= totalCount) break;
    }

    return allRecords;
  }

  // =========================================================================
  // Change Requests
  // =========================================================================

  /**
   * Create a new change request in ServiceNow
   */
  async createChange(
    organizationId: string,
    data: {
      short_description: string;
      description?: string;
      type?: string;
      risk?: string;
      impact?: string;
      category?: string;
      assignment_group?: string;
      requested_by?: string;
      start_date?: string;
      end_date?: string;
      justification?: string;
    }
  ): Promise<ServiceNowRecord> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);
      const response = await client.post<ServiceNowSingleResponse>('/table/change_request', data);

      logger.info(
        `[ServiceNow] Created change request ${response.data.result.number} for org ${organizationId}`
      );

      // Record sync
      await prisma.auditLog.create({
        data: {
          action: 'servicenow_sync.change_created',
          organizationId,
          hash: response.data.result.sys_id,
          details: JSON.stringify({
            externalId: response.data.result.sys_id,
            number: response.data.result.number,
            table: 'change_request',
            provider: 'servicenow',
          }),
        },
      });

      return response.data.result;
    }, 'createChange');
  }

  // =========================================================================
  // Generic Table Record helpers
  // =========================================================================

  /**
   * Get records from any ServiceNow table with query, fields, and limit.
   */
  async getTableRecords(
    organizationId: string,
    table: string,
    query?: string,
    fields?: string,
    limit: number = 50
  ): Promise<ServiceNowRecord[]> {
    const { records } = await this.queryTable(organizationId, table, {
      sysparm_query: query,
      sysparm_fields: fields,
      sysparm_limit: limit,
      sysparm_display_value: 'true',
    });
    return records;
  }

  /**
   * Create a record in any ServiceNow table.
   */
  async createTableRecord(
    organizationId: string,
    table: string,
    data: Record<string, any>
  ): Promise<ServiceNowRecord> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);
      const response = await client.post<ServiceNowSingleResponse>(
        `/table/${encodeURIComponent(table)}`,
        data
      );

      logger.info(
        `[ServiceNow] Created record in ${table}: ${response.data.result.sys_id} for org ${organizationId}`
      );
      return response.data.result;
    }, `createTableRecord(${table})`);
  }

  /**
   * List incidents with optional encoded query, limit, and offset.
   */
  async listIncidents(
    organizationId: string,
    query?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceNowRecord[]> {
    const { records } = await this.queryTable(organizationId, 'incident', {
      sysparm_query: query || 'ORDERBYDESCsys_created_on',
      sysparm_limit: limit,
      sysparm_offset: offset,
      sysparm_display_value: 'true',
      sysparm_fields:
        'sys_id,number,short_description,description,state,urgency,impact,priority,category,' +
        'assignment_group,assigned_to,opened_at,resolved_at,closed_at,sys_updated_on',
    });
    return records;
  }

  /**
   * Sync status for a single external record (incident or change).
   */
  async syncStatus(
    organizationId: string,
    externalId: string,
    table: string = 'incident'
  ): Promise<{ externalId: string; status: string; mappedStatus: string; updatedAt: string }> {
    return this.requestWithRetry(async () => {
      const client = await this.getClient(organizationId);
      const response = await client.get<ServiceNowSingleResponse>(
        `/table/${encodeURIComponent(table)}/${encodeURIComponent(externalId)}`,
        {
          params: {
            sysparm_fields: 'sys_id,state,sys_updated_on,number',
            sysparm_display_value: 'true',
          },
        }
      );

      const record = response.data.result;
      const mappedStatus = this.mapSnowStateToLocal(record.state);

      logger.info(
        `[ServiceNow] Synced status for ${record.number || externalId}: ${record.state} -> ${mappedStatus}`
      );

      return {
        externalId: record.sys_id,
        status: record.state || '',
        mappedStatus,
        updatedAt: record.sys_updated_on || '',
      };
    }, `syncStatus(${table}/${externalId})`);
  }

  /**
   * Map ServiceNow states to ComplyEasy internal statuses (public alias).
   */
  mapToComplyEasyStatus(snStatus: string): string {
    return this.mapSnowStateToLocal(snStatus);
  }

  // =========================================================================
  // CMDB
  // =========================================================================

  async getCMDBItems(
    organizationId: string,
    query?: string,
    limit: number = 100
  ): Promise<CMDBItem[]> {
    const { records } = await this.queryTable(organizationId, 'cmdb_ci', {
      sysparm_query: query,
      sysparm_limit: limit,
      sysparm_fields:
        'sys_id,name,asset_tag,serial_number,model_id,manufacturer,category,subcategory,' +
        'install_status,operational_status,assigned_to,location,ip_address,mac_address,' +
        'sys_class_name,sys_created_on,sys_updated_on',
      sysparm_display_value: 'true',
    });

    return records.map((r) => this.mapCMDBItem(r));
  }

  // =========================================================================
  // Compliance-aware operations
  // =========================================================================

  async createComplianceIncident(
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
  ): Promise<ServiceNowIncident> {
    const priorityMap: Record<string, string> = {
      Critical: '1',
      High: '2',
      Medium: '3',
      Low: '4',
    };

    const fields: CreateIncidentInput = {
      short_description: `[ComplyEasyAI] ${ticket.title}`,
      description:
        `${ticket.description}\n\n` +
        `---\n` +
        `Framework: ${ticket.framework || 'General'}\n` +
        `Severity: ${ticket.severity}\n` +
        (ticket.controlId ? `Control ID: ${ticket.controlId}\n` : '') +
        (ticket.sourceType ? `Source: ${ticket.sourceType} (${ticket.sourceId})\n` : '') +
        `Created by: ComplyEasyAI`,
      priority: priorityMap[ticket.severity] || '3',
      category: 'Compliance',
      contact_type: 'Self-service',
    };

    const incident = await this.createIncident(organizationId, fields);

    // Record the sync in audit log
    await prisma.auditLog.create({
      data: {
        action: 'servicenow_sync.pushed',
        organizationId,
        hash: incident.sys_id,
        details: JSON.stringify({
          incidentSysId: incident.sys_id,
          incidentNumber: incident.number,
          sourceType: ticket.sourceType,
          sourceId: ticket.sourceId,
        }),
      },
    });

    return incident;
  }

  /**
   * Sync compliance incidents between ComplyEasyAI and ServiceNow
   */
  async syncIncidents(
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

    // PUSH: local compliance issues -> ServiceNow
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
                action: 'servicenow_sync.pushed',
                details: { contains: issue.id },
              },
            });

            if (!existingSync) {
              const incident = await this.createComplianceIncident(organizationId, {
                title: issue.title,
                description: issue.description || '',
                severity: issue.priority || 'Medium',
                sourceType: 'issue',
                sourceId: issue.id,
              });

              await prisma.auditLog.create({
                data: {
                  action: 'servicenow_sync.pushed',
                  organizationId,
                  hash: issue.id,
                  details: JSON.stringify({
                    localIssueId: issue.id,
                    snowIncidentSysId: incident.sys_id,
                    snowIncidentNumber: incident.number,
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

    // PULL: ServiceNow compliance incidents -> local
    if (direction === 'pull' || direction === 'bidirectional') {
      try {
        const sinceStr = since.toISOString().replace('T', ' ').slice(0, 19);
        const { records } = await this.queryTable(organizationId, 'incident', {
          sysparm_query: `category=Compliance^sys_updated_on>=${sinceStr}^ORDERBYDESCsys_updated_on`,
          sysparm_limit: 100,
          sysparm_display_value: 'true',
        });

        for (const record of records) {
          try {
            const existingSync = await prisma.auditLog.findFirst({
              where: {
                organizationId,
                action: 'servicenow_sync.pulled',
                details: { contains: record.sys_id },
              },
            });

            if (existingSync) {
              const syncDetails = JSON.parse(existingSync.details || '{}');
              if (syncDetails.localIssueId) {
                await prisma.issue
                  .update({
                    where: { id: syncDetails.localIssueId },
                    data: {
                      status: this.mapSnowStateToLocal(record.state),
                      updatedAt: new Date(),
                    },
                  })
                  .catch((err) => { logger.error('ServiceNow sync issue update failed', { error: err.message, issueId: syncDetails.localIssueId }); });
                updated++;
              }
            } else {
              const localIssue = await prisma.issue.create({
                data: {
                  organizationId,
                  title: record.short_description || record.number || 'ServiceNow Incident',
                  description: record.description || '',
                  issueType: 'compliance',
                  priority: this.mapSnowPriorityToSeverity(record.priority) as any,
                  status: this.mapSnowStateToLocal(record.state),
                  createdById: 'system',
                  tags: JSON.stringify({
                    source: 'servicenow',
                    snowSysId: record.sys_id,
                    snowNumber: record.number,
                  }),
                },
              });

              await prisma.auditLog.create({
                data: {
                  action: 'servicenow_sync.pulled',
                  organizationId,
                  hash: record.sys_id,
                  details: JSON.stringify({
                    localIssueId: localIssue.id,
                    snowIncidentSysId: record.sys_id,
                    snowIncidentNumber: record.number,
                  }),
                },
              });

              pulled++;
            }
          } catch (recordError: any) {
            errors.push(`Pull failed for SNOW incident ${record.sys_id}: ${recordError.message}`);
          }
        }
      } catch (pullError: any) {
        errors.push(`Pull phase failed: ${pullError.message}`);
      }
    }

    logger.info(
      `[ServiceNow] Sync complete for org ${organizationId}: pushed=${pushed}, pulled=${pulled}, updated=${updated}, errors=${errors.length}`
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
          where: { organizationId, action: { startsWith: 'servicenow_sync.' } },
          orderBy: { timestamp: 'desc' },
        }),
        prisma.auditLog.count({
          where: { organizationId, action: { startsWith: 'servicenow_sync.' } },
        }),
        prisma.auditLog.count({
          where: { organizationId, action: 'servicenow_sync.error' },
        }),
      ]);

      const totalLocalIssues = await prisma.issue.count({
        where: { organizationId, status: { not: 'Closed' } },
      });
      const syncedIssueIds = await prisma.auditLog.findMany({
        where: { organizationId, action: 'servicenow_sync.pushed' },
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
      logger.error('[ServiceNow] Error getting sync status', error);
      return { lastSync: null, totalSynced: 0, pendingSync: 0, syncErrors: 0 };
    }
  }

  /**
   * Process ServiceNow webhook event (inbound)
   */
  async processWebhookEvent(
    organizationId: string,
    event: {
      type: string;
      table: string;
      sys_id: string;
      action: string;
      record?: ServiceNowRecord;
    }
  ): Promise<{ processed: boolean }> {
    try {
      if (event.table !== 'incident') {
        logger.debug(`[ServiceNow] Ignoring webhook for table: ${event.table}`);
        return { processed: false };
      }

      const syncRecord = await prisma.auditLog.findFirst({
        where: {
          organizationId,
          action: { startsWith: 'servicenow_sync.' },
          details: { contains: event.sys_id },
        },
      });

      if (!syncRecord) {
        logger.debug(`[ServiceNow] No local record found for sys_id ${event.sys_id}`);
        return { processed: false };
      }

      const syncDetails = JSON.parse(syncRecord.details || '{}');
      if (!syncDetails.localIssueId) {
        return { processed: false };
      }

      switch (event.action) {
        case 'update':
        case 'insert': {
          if (event.record) {
            await prisma.issue
              .update({
                where: { id: syncDetails.localIssueId },
                data: {
                  status: this.mapSnowStateToLocal(event.record.state) as any,
                  updatedAt: new Date(),
                },
              })
              .catch((err) => { logger.error('ServiceNow webhook issue update failed', { error: err.message, issueId: syncDetails.localIssueId }); });
          }
          break;
        }
        case 'delete': {
          logger.info(`[ServiceNow] Incident deleted in ServiceNow: ${event.sys_id}`);
          break;
        }
        default:
          logger.debug(`[ServiceNow] Unhandled webhook action: ${event.action}`);
      }

      return { processed: true };
    } catch (error) {
      logger.error('[ServiceNow] Error processing webhook event', error);
      return { processed: false };
    }
  }

  // =========================================================================
  // Mapping helpers
  // =========================================================================

  private mapIncident(record: ServiceNowRecord): ServiceNowIncident {
    return {
      sys_id: record.sys_id,
      number: record.number || '',
      short_description: record.short_description || '',
      description: record.description || '',
      state: record.state || '',
      impact: record.impact || '',
      urgency: record.urgency || '',
      priority: record.priority || '',
      category: record.category || '',
      subcategory: record.subcategory || '',
      assignment_group: record.assignment_group?.display_value || record.assignment_group || '',
      assigned_to: record.assigned_to?.display_value || record.assigned_to || '',
      caller_id: record.caller_id?.display_value || record.caller_id || '',
      opened_at: record.opened_at || '',
      resolved_at: record.resolved_at || '',
      closed_at: record.closed_at || '',
      close_notes: record.close_notes || '',
      work_notes: record.work_notes || '',
      sys_created_on: record.sys_created_on || '',
      sys_updated_on: record.sys_updated_on || '',
    };
  }

  private mapCMDBItem(record: ServiceNowRecord): CMDBItem {
    return {
      sys_id: record.sys_id,
      name: record.name || '',
      asset_tag: record.asset_tag || '',
      serial_number: record.serial_number || '',
      model_id: record.model_id?.display_value || record.model_id || '',
      manufacturer: record.manufacturer?.display_value || record.manufacturer || '',
      category: record.category || '',
      subcategory: record.subcategory || '',
      install_status: record.install_status || '',
      operational_status: record.operational_status || '',
      assigned_to: record.assigned_to?.display_value || record.assigned_to || '',
      location: record.location?.display_value || record.location || '',
      ip_address: record.ip_address || '',
      mac_address: record.mac_address || '',
      sys_class_name: record.sys_class_name || '',
      sys_created_on: record.sys_created_on || '',
      sys_updated_on: record.sys_updated_on || '',
    };
  }

  private mapSnowStateToLocal(
    state?: string
  ): 'Open' | 'In_Progress' | 'Resolved' | 'Closed' | 'Reopened' {
    if (!state) return 'Open';
    // ServiceNow incident states: 1=New, 2=In Progress, 3=On Hold,
    // 6=Resolved, 7=Closed, 8=Cancelled
    const stateMap: Record<string, 'Open' | 'In_Progress' | 'Resolved' | 'Closed' | 'Reopened'> = {
      '1': 'Open',
      New: 'Open',
      '2': 'In_Progress',
      'In Progress': 'In_Progress',
      '3': 'Open', // On Hold -> Open
      'On Hold': 'Open',
      '6': 'Resolved',
      Resolved: 'Resolved',
      '7': 'Closed',
      Closed: 'Closed',
      '8': 'Closed', // Cancelled -> Closed
      Cancelled: 'Closed',
    };
    return stateMap[state] || 'Open';
  }

  private mapSnowPriorityToSeverity(priority?: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!priority) return 'Medium';
    const priorityMap: Record<string, 'Critical' | 'High' | 'Medium' | 'Low'> = {
      '1': 'Critical',
      Critical: 'Critical',
      '2': 'High',
      High: 'High',
      '3': 'Medium',
      Moderate: 'Medium',
      '4': 'Low',
      Low: 'Low',
      '5': 'Low',
      Planning: 'Low',
    };
    return priorityMap[priority] || 'Medium';
  }
}

export const servicenowService = new ServiceNowService();
export default servicenowService;
