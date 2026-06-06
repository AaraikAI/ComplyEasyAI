/**
 * Integration Registry
 *
 * Central registry that maps all 381 provider IDs to their concrete
 * BaseIntegrationProvider implementations.  The registry is lazily
 * initialised on first access so provider modules are only loaded when
 * actually needed.
 */

import { BaseIntegrationProvider, IntegrationCredentials, ConnectionTestResult, SyncResult, EvidenceItem } from './baseIntegration';
import logger from '../../../config/logger';

// ─── Registry Singleton ──────────────────────────────────────────────────────

class IntegrationRegistry {
  private providers = new Map<string, BaseIntegrationProvider>();
  private initialised = false;

  /** Lazy-load all provider modules and populate the map */
  async initialise(): Promise<void> {
    if (this.initialised) return;

    const loaders: Array<() => Promise<Map<string, BaseIntegrationProvider>>> = [
      async () => (await import('./cloudProviders')).default,
      async () => (await import('./identityProviders')).default,
      async () => (await import('./securityProviders')).default,
      async () => (await import('./devProviders')).default,
      async () => (await import('./monitoringProviders')).default,
      async () => (await import('./businessProviders')).default,
    ];

    for (const load of loaders) {
      try {
        const map = await load();
        for (const [id, provider] of map.entries()) {
          this.providers.set(id, provider);
        }
      } catch (err) {
        logger.error('Failed to load integration provider module', err);
      }
    }

    this.initialised = true;
    logger.info(`Integration registry initialised with ${this.providers.size} providers`);
  }

  /** Get a specific provider by its ID (e.g. "datadog", "okta") */
  get(providerId: string): BaseIntegrationProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Resolve a FRESH, per-request provider instance for the given ID.
   *
   * The map holds one shared template instance per provider; `configure()`
   * mutates per-tenant credentials and httpClient headers, so handing the shared
   * instance to concurrent callers would bleed credentials across tenants.
   * Cloning gives each request its own provider + httpClient, keeping the
   * configured credentials isolated to that call.
   */
  private resolveInstance(providerId: string): BaseIntegrationProvider | undefined {
    const template = this.providers.get(providerId);
    return template ? template.clone() : undefined;
  }

  /** Check if a provider is registered */
  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /** Return every registered provider */
  getAll(): Map<string, BaseIntegrationProvider> {
    return new Map(this.providers);
  }

  /** Return the total number of registered providers */
  get size(): number {
    return this.providers.size;
  }

  /** Return all provider IDs */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /** Return providers filtered by category */
  getByCategory(category: string): Map<string, BaseIntegrationProvider> {
    const filtered = new Map<string, BaseIntegrationProvider>();
    for (const [id, provider] of this.providers.entries()) {
      if (provider.category.toLowerCase() === category.toLowerCase()) {
        filtered.set(id, provider);
      }
    }
    return filtered;
  }

  // ─── Convenience wrappers ────────────────────────────────────────────────

  /** Test connection for a specific provider */
  async testConnection(
    providerId: string,
    credentials: IntegrationCredentials,
  ): Promise<ConnectionTestResult> {
    await this.initialise();
    const provider = this.resolveInstance(providerId);
    if (!provider) {
      return {
        success: false,
        provider: providerId,
        latencyMs: 0,
        error: `Provider "${providerId}" is not registered`,
        timestamp: new Date().toISOString(),
      };
    }
    provider.configure(credentials);
    return provider.testConnection();
  }

  /** Sync & collect evidence for a specific provider */
  async syncProvider(
    providerId: string,
    credentials: IntegrationCredentials,
  ): Promise<SyncResult> {
    await this.initialise();
    const provider = this.resolveInstance(providerId);
    if (!provider) {
      return {
        success: false,
        provider: providerId,
        evidenceCollected: [],
        recordsSynced: 0,
        syncDurationMs: 0,
        errors: [`Provider "${providerId}" is not registered`],
        timestamp: new Date().toISOString(),
      };
    }
    provider.configure(credentials);
    return provider.sync();
  }

  /** Collect evidence only */
  async collectEvidence(
    providerId: string,
    credentials: IntegrationCredentials,
  ): Promise<EvidenceItem[]> {
    await this.initialise();
    const provider = this.resolveInstance(providerId);
    if (!provider) return [];
    provider.configure(credentials);
    return provider.collectEvidence();
  }

  /** Run connection tests for ALL providers (for bulk validation) */
  async testAllConnections(
    credentialsMap: Map<string, IntegrationCredentials>,
  ): Promise<Map<string, ConnectionTestResult>> {
    await this.initialise();
    const results = new Map<string, ConnectionTestResult>();

    // Build thunks (deferred async functions) so a test only starts when its
    // batch slice is invoked — this bounds real concurrency to batchSize.
    const thunks = Array.from(credentialsMap.entries()).map(
      ([providerId, creds]) => async () => {
        try {
          const result = await this.testConnection(providerId, creds);
          results.set(providerId, result);
        } catch (err: any) {
          results.set(providerId, {
            success: false,
            provider: providerId,
            latencyMs: 0,
            error: err.message || 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      },
    );

    // Run in batches of 20 to avoid overwhelming APIs.
    const batchSize = 20;
    for (let i = 0; i < thunks.length; i += batchSize) {
      const slice = thunks.slice(i, i + batchSize);
      await Promise.allSettled(slice.map((fn) => fn()));
    }

    return results;
  }
}

// Export a singleton instance
const registry = new IntegrationRegistry();
export default registry;
