/**
 * Base Integration Service
 *
 * Provides the abstract interface and common utilities for all 381 integration
 * providers. Each provider implements real API calls for:
 *   - testConnection(): Validates credentials against the live API
 *   - sync(): Pulls compliance-relevant data from the provider
 *   - collectEvidence(): Auto-collects evidence artifacts for audit trails
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import logger from '../../../config/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IntegrationCredentials {
  apiKey?: string;
  apiSecret?: string;
  token?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  serviceAccountJson?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  subscriptionId?: string;
  region?: string;
  accountId?: string;
  [key: string]: any;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: string;
  latencyMs: number;
  accountInfo?: {
    accountId?: string;
    accountName?: string;
    email?: string;
    plan?: string;
    permissions?: string[];
  };
  error?: string;
  errorCode?: string;
  timestamp: string;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  provider: string;
  category: string;
  collectedAt: string;
  data: Record<string, any>;
  metadata: {
    apiEndpoint: string;
    httpMethod: string;
    responseCode: number;
    dataHash: string;
  };
}

export type EvidenceType =
  | 'access_control'
  | 'audit_log'
  | 'configuration'
  | 'vulnerability_scan'
  | 'compliance_status'
  | 'user_list'
  | 'policy_config'
  | 'encryption_status'
  | 'backup_status'
  | 'incident_report'
  | 'device_inventory'
  | 'network_config'
  | 'training_completion'
  | 'change_management'
  | 'asset_inventory'
  | 'security_finding'
  | 'endpoint_status'
  | 'container_scan'
  | 'code_scan'
  | 'ci_cd_pipeline'
  | 'data_classification'
  | 'retention_policy'
  | 'siem_event'
  | 'financial_control';

export interface SyncResult {
  success: boolean;
  provider: string;
  evidenceCollected: EvidenceItem[];
  recordsSynced: number;
  syncDurationMs: number;
  nextSyncRecommended?: string;
  errors?: string[];
  timestamp: string;
}

export interface IntegrationCapabilities {
  canTestConnection: boolean;
  canSync: boolean;
  canCollectEvidence: boolean;
  supportedEvidenceTypes: EvidenceType[];
  requiresOAuth: boolean;
  authMethods: ('api-key' | 'api-key-secret' | 'pat' | 'oauth' | 'iam' | 'service-account' | 'username-password')[];
  apiBaseUrl: string;
  apiDocsUrl: string;
  webhookSupport: boolean;
  rateLimitPerMinute: number;
}

// ─── Abstract Base Class ─────────────────────────────────────────────────────

export abstract class BaseIntegrationProvider {
  abstract readonly providerId: string;
  abstract readonly displayName: string;
  abstract readonly category: string;
  abstract readonly capabilities: IntegrationCapabilities;

  protected credentials: IntegrationCredentials = {};
  protected httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /** Set credentials for this integration */
  configure(credentials: IntegrationCredentials): void {
    this.credentials = credentials;
    this.configureHttpClient();
  }

  /** Provider-specific HTTP client configuration (auth headers, base URLs) */
  protected abstract configureHttpClient(): void;

  /** Test connectivity to the provider's API */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /** Sync data from the provider */
  abstract sync(): Promise<SyncResult>;

  /** Collect compliance evidence from the provider */
  abstract collectEvidence(): Promise<EvidenceItem[]>;

  // ─── Shared Utilities ────────────────────────────────────────────────────

  protected createEvidenceItem(
    type: EvidenceType,
    title: string,
    description: string,
    data: Record<string, any>,
    apiEndpoint: string,
    httpMethod: string = 'GET',
    responseCode: number = 200,
  ): EvidenceItem {
    const crypto = require('crypto');
    return {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      provider: this.providerId,
      category: this.category,
      collectedAt: new Date().toISOString(),
      data,
      metadata: {
        apiEndpoint,
        httpMethod,
        responseCode,
        dataHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
      },
    };
  }

  protected async timedRequest<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
    const start = Date.now();
    const result = await fn();
    return { result, latencyMs: Date.now() - start };
  }

  protected buildConnectionResult(
    success: boolean,
    latencyMs: number,
    accountInfo?: ConnectionTestResult['accountInfo'],
    error?: string,
  ): ConnectionTestResult {
    return {
      success,
      provider: this.providerId,
      latencyMs,
      accountInfo,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  protected buildSyncResult(
    success: boolean,
    evidence: EvidenceItem[],
    durationMs: number,
    errors?: string[],
  ): SyncResult {
    return {
      success,
      provider: this.providerId,
      evidenceCollected: evidence,
      recordsSynced: evidence.length,
      syncDurationMs: durationMs,
      nextSyncRecommended: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  protected logApiCall(method: string, url: string, status: number): void {
    logger.info(`[Integration:${this.providerId}] ${method} ${url} → ${status}`);
  }
}

export default BaseIntegrationProvider;
