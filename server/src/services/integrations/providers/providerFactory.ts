/**
 * Provider Factory
 *
 * Creates BaseIntegrationProvider instances from configuration descriptors.
 * This avoids 381 hand-written classes by using a configuration-driven approach
 * where each provider is described by its API endpoint, auth method, and
 * evidence collection endpoints.
 */

import BaseIntegrationProvider, {
  IntegrationCredentials,
  IntegrationCapabilities,
  ConnectionTestResult,
  SyncResult,
  EvidenceItem,
  EvidenceType,
} from './baseIntegration';
import logger from '../../../config/logger';
import { isUrlSafe, isPrivateIp } from '../../../utils/urlValidator';
import { AppError } from '../../../middleware/errorHandler';

// ─── Provider Descriptor ─────────────────────────────────────────────────────

export interface EvidenceEndpoint {
  type: EvidenceType;
  title: string;
  description: string;
  path: string;
  method: 'GET' | 'POST';
  /** Optional query params or body to send */
  params?: Record<string, any>;
}

export interface ProviderDescriptor {
  id: string;
  name: string;
  category: string;
  apiBaseUrl: string;
  apiDocsUrl: string;
  authMethods: IntegrationCapabilities['authMethods'];
  /** Header key used for API key auth (default: 'Authorization') */
  authHeader?: string;
  /** Prefix before the token (default: 'Bearer') */
  authPrefix?: string;
  /** Path for the connection test (GET). Should return 2xx on valid creds. */
  testEndpoint: string;
  /** Evidence collection endpoints — each becomes one evidence item */
  evidenceEndpoints: EvidenceEndpoint[];
  /** Rate limit per minute (default: 60) */
  rateLimitPerMinute?: number;
  webhookSupport?: boolean;
  requiresOAuth?: boolean;
}

// ─── Factory-generated Provider ──────────────────────────────────────────────

class ConfiguredProvider extends BaseIntegrationProvider {
  readonly providerId: string;
  readonly displayName: string;
  readonly category: string;
  readonly capabilities: IntegrationCapabilities;

  private descriptor: ProviderDescriptor;

  constructor(d: ProviderDescriptor) {
    super();
    this.descriptor = d;
    this.providerId = d.id;
    this.displayName = d.name;
    this.category = d.category;
    this.capabilities = {
      canTestConnection: true,
      canSync: true,
      canCollectEvidence: true,
      supportedEvidenceTypes: d.evidenceEndpoints.map(e => e.type),
      requiresOAuth: d.requiresOAuth ?? false,
      authMethods: d.authMethods,
      apiBaseUrl: d.apiBaseUrl,
      apiDocsUrl: d.apiDocsUrl,
      webhookSupport: d.webhookSupport ?? false,
      rateLimitPerMinute: d.rateLimitPerMinute ?? 60,
    };
  }

  clone(): BaseIntegrationProvider {
    // A new instance owns a fresh httpClient (created in the base constructor) and
    // its own credential state, so per-request configure() calls stay isolated.
    return new ConfiguredProvider(this.descriptor);
  }

  protected configureHttpClient(): void {
    const baseURL = this.resolveUrl(this.descriptor.apiBaseUrl);
    // SSRF guard: the base URL may embed user-controllable credential segments
    // ({instance}/{host}/{domain}/...). Reject private/loopback/link-local hosts
    // before any request is dispatched.
    if (baseURL) {
      this.assertSafeOutbound(baseURL);
    }
    this.httpClient.defaults.baseURL = baseURL;

    // Trust boundary: credentials reach this factory already decrypted and
    // transiently (set per-call via registry.configure -> setCredentials). This
    // path NEVER persists them — encryption-at-rest is owned by the per-integration
    // services (e.g. servicenowService via encryptConfigSecrets). Values here are
    // only read into outbound request headers.
    const header = this.descriptor.authHeader || 'Authorization';
    const prefix = this.descriptor.authPrefix ?? 'Bearer';
    const token =
      this.credentials.apiKey ||
      this.credentials.token ||
      this.credentials.accessToken ||
      '';

    if (token) {
      this.httpClient.defaults.headers.common[header] =
        prefix ? `${prefix} ${token}` : token;
    }

    // Some providers use basic auth
    if (this.credentials.username && this.credentials.password) {
      const b64 = Buffer.from(
        `${this.credentials.username}:${this.credentials.password}`,
      ).toString('base64');
      this.httpClient.defaults.headers.common['Authorization'] = `Basic ${b64}`;
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      this.configureHttpClient();
      const endpoint = this.resolveUrl(this.descriptor.testEndpoint);
      this.assertSafeOutbound(this.toAbsoluteUrl(endpoint));
      const { result, latencyMs } = await this.timedRequest(() =>
        this.httpClient.get(endpoint),
      );

      this.logApiCall('GET', endpoint, result.status);

      return this.buildConnectionResult(true, latencyMs, {
        accountId: result.data?.id || result.data?.account_id || result.data?.accountId,
        accountName: result.data?.name || result.data?.account_name || result.data?.displayName || result.data?.login,
        email: result.data?.email || result.data?.user?.email,
      });
    } catch (err: any) {
      const status = err.response?.status;
      const latency = 0;
      return this.buildConnectionResult(false, latency, undefined,
        `API returned ${status || 'network error'}: ${err.message}`,
      );
    }
  }

  async sync(): Promise<SyncResult> {
    const start = Date.now();
    try {
      this.configureHttpClient();
      const evidence = await this.collectEvidence();
      return this.buildSyncResult(true, evidence, Date.now() - start);
    } catch (err: any) {
      return this.buildSyncResult(false, [], Date.now() - start, [err.message]);
    }
  }

  async collectEvidence(): Promise<EvidenceItem[]> {
    this.configureHttpClient();
    const items: EvidenceItem[] = [];

    for (const ep of this.descriptor.evidenceEndpoints) {
      try {
        const url = this.resolveUrl(ep.path);
        this.assertSafeOutbound(this.toAbsoluteUrl(url));
        const response =
          ep.method === 'POST'
            ? await this.httpClient.post(url, ep.params || {})
            : await this.httpClient.get(url, { params: ep.params });

        this.logApiCall(ep.method, url, response.status);

        items.push(
          this.createEvidenceItem(
            ep.type,
            ep.title,
            ep.description,
            response.data,
            url,
            ep.method,
            response.status,
          ),
        );
      } catch (err: any) {
        logger.warn(
          `[${this.providerId}] Evidence collection failed for ${ep.path}: ${err.message}`,
        );
        // Still record the failed attempt so the audit trail shows we tried
        items.push(
          this.createEvidenceItem(
            ep.type,
            ep.title,
            `[FAILED] ${ep.description} — ${err.message}`,
            { error: err.message, status: err.response?.status },
            ep.path,
            ep.method,
            err.response?.status || 0,
          ),
        );
      }
    }

    return items;
  }

  /**
   * A token substituted into a descriptor URL must never be able to change the
   * request's authority. Several descriptors are nothing but the placeholder —
   * `https://{instance}`, `https://{host}:5000/v3` — so an unchecked credential
   * pointed the request wherever the caller liked, including 169.254.169.254.
   *
   * Accept only a bare hostname. A leading scheme and trailing slashes are
   * tolerated because operators commonly paste a full base URL, but anything
   * that survives must be DNS labels only: no credentials, port, path, query or
   * fragment, and no private-range IP literal.
   */
  private static sanitizeUrlToken(value: string | undefined, field: string): string {
    if (!value) return '';
    const stripped = value
      .trim()
      .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
      .replace(/\/+$/, '');
    const HOSTNAME =
      /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*$/;
    if (!HOSTNAME.test(stripped)) {
      throw new AppError(
        `Invalid ${field}: expected a hostname with no port, path, query or credentials`,
        400,
      );
    }
    if (isPrivateIp(stripped)) {
      throw new AppError(`Invalid ${field}: resolves to a private address`, 400);
    }
    return stripped;
  }

  /** Replace {placeholder} tokens in URLs with sanitised credential values */
  private resolveUrl(url: string): string {
    const F = ConfiguredProvider.sanitizeUrlToken;
    const base = F(this.credentials.baseUrl, 'baseUrl');
    const region = F(this.credentials.region, 'region');
    const account = F(this.credentials.accountId, 'accountId');
    const tenant = F(this.credentials.tenantId, 'tenantId');
    return url
      .replace(/\{domain\}/g, base)
      .replace(/\{host\}/g, base)
      .replace(/\{instance\}/g, base)
      .replace(/\{tenant\}/g, tenant)
      .replace(/\{region\}/g, region || 'us-east-1')
      .replace(/\{account\}/g, account)
      .replace(/\{org\}/g, account)
      .replace(/\{subdomain\}/g, base)
      .replace(/\{company\}/g, base)
      .replace(/\{geo\}/g, region || 'us')
      .replace(/\{env\}/g, base)
      .replace(/\{portal\}/g, base)
      .replace(/\{dc\}/g, region);
  }

  /**
   * Resolve a (possibly relative) endpoint against the configured base URL into
   * an absolute URL.
   */
  private toAbsoluteUrl(endpoint: string): string {
    const baseURL = (this.httpClient.defaults.baseURL as string) || this.resolveUrl(this.descriptor.apiBaseUrl);
    try {
      return new URL(endpoint, baseURL || undefined).toString();
    } catch {
      // If endpoint is already absolute (or base is empty), fall back to it directly.
      return endpoint;
    }
  }

  /**
   * SSRF defense: reject outbound URLs that resolve to private/loopback/link-local
   * targets. Credential-derived placeholders ({instance}/{host}/{domain}/...) are
   * user-controllable, so the FINAL absolute URL is validated before every request.
   */
  private assertSafeOutbound(absoluteUrl: string): void {
    if (!isUrlSafe(absoluteUrl)) {
      logger.error(
        `[${this.providerId}] Outbound URL rejected by SSRF guard`,
        { url: absoluteUrl },
      );
      throw new AppError(`Unsafe outbound URL for provider ${this.providerId}`, 400);
    }
  }
}

// ─── Public factory function ─────────────────────────────────────────────────

export function createProvider(descriptor: ProviderDescriptor): BaseIntegrationProvider {
  return new ConfiguredProvider(descriptor);
}

export function createProviders(descriptors: ProviderDescriptor[]): Map<string, BaseIntegrationProvider> {
  const map = new Map<string, BaseIntegrationProvider>();
  for (const d of descriptors) {
    map.set(d.id, createProvider(d));
  }
  return map;
}
