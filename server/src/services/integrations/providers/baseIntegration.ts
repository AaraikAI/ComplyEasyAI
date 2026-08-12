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
import { assertUrlSafe } from '../../../utils/urlValidator';
import { AppError } from '../../../middleware/errorHandler';

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
      // Never follow a redirect automatically: the interceptor below validates
      // the URL it is given, but axios would chase a 302 to an internal address
      // afterwards without that check ever running again. Fail closed instead.
      maxRedirects: 0,
    });

    // SSRF chokepoint: validate every outbound URL before the request is sent.
    // This covers all 381 configuration-driven providers and any subclass that
    // routes through `this.httpClient`. URLs interpolating user-supplied tokens
    // (baseUrl/tenantId/region/accountId) are blocked if they resolve to
    // private IPs, localhost, link-local, or unsupported protocols.
    this.httpClient.interceptors.request.use(async (cfg) => {
      const baseURL = (cfg.baseURL || '').toString();
      const url = (cfg.url || '').toString();
      const fullUrl = /^https?:\/\//i.test(url) || !baseURL
        ? url
        : `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
      if (fullUrl) {
        try {
          // assertUrlSafe layers DNS resolution on top of the synchronous
          // checks, so a hostname the tenant controls that resolves to an
          // internal address (evil.example.com -> 169.254.169.254) is blocked
          // too. isUrlSafe alone only catches hosts written as IP literals.
          await assertUrlSafe(fullUrl);
        } catch {
          logger.error('Integration outbound URL rejected by SSRF validation', {
            providerId: this.providerId,
            url: fullUrl,
          });
          throw new AppError(`Unsafe outbound URL for provider ${this.providerId}: ${fullUrl}`, 400);
        }
      }
      return cfg;
    });
  }

  /** Set credentials for this integration */
  configure(credentials: IntegrationCredentials): void {
    this.credentials = credentials;
    this.configureHttpClient();
  }

  /**
   * Produce a fresh, independent instance of this provider with its own
   * credential state and its own httpClient. The registry calls this per request
   * so that per-tenant credentials/headers set via {@link configure} can never
   * leak across concurrent callers that share the registry's singleton.
   */
  abstract clone(): BaseIntegrationProvider;

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
