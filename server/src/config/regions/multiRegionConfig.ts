/**
 * Multi-Region Deployment Configuration
 *
 * Provides region-aware configuration for deploying ComplyEasyAI
 * across multiple geographic regions. Handles region detection,
 * data residency rules, service endpoint routing, and failover.
 */

import https from 'https';
import http from 'http';
import logger from '../logger';
import cacheService from '../../services/cache/redisCacheService';

// ============================================================================
// TYPES
// ============================================================================

export type RegionCode = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'eu-central-1' | 'ap-southeast-1' | 'ap-northeast-1';

export interface RegionConfig {
  code: RegionCode;
  name: string;
  displayName: string;
  continent: 'NA' | 'EU' | 'AP';
  country: string;
  timezone: string;
  isActive: boolean;
  isPrimary: boolean;
  endpoints: {
    api: string;
    database: string;
    redis: string;
    s3Bucket: string;
    cdn: string;
  };
  dataResidency: {
    /** Whether data must stay in this region (GDPR, data sovereignty) */
    enforced: boolean;
    /** Allowed regions for data replication */
    allowedReplicationTargets: RegionCode[];
    /** Compliance frameworks requiring this residency */
    requiredBy: string[];
  };
  failover: {
    /** Failover target region */
    target: RegionCode;
    /** Automatic failover enabled */
    autoFailover: boolean;
    /** Health check interval in seconds */
    healthCheckInterval: number;
    /** Consecutive failures before failover */
    failureThreshold: number;
  };
  scaling: {
    /** Minimum number of instances */
    minInstances: number;
    /** Maximum number of instances */
    maxInstances: number;
    /** Target CPU utilization for auto-scaling */
    targetCpuUtilization: number;
  };
}

export interface RegionHealthData {
  healthy: boolean;
  latencyMs: number;
  checkedAt: string; // ISO string for Redis serialization
  consecutiveFailures: number;
}

export interface MultiRegionState {
  currentRegion: RegionCode;
  activeRegions: RegionCode[];
  primaryRegion: RegionCode;
  lastHealthCheck: Record<RegionCode, { healthy: boolean; latencyMs: number; checkedAt: Date }>;
}

/** Redis key prefix for multi-region health state. TTL = 2x health check interval. */
const HEALTH_REDIS_KEY_PREFIX = 'multiregion:health';
const HEALTH_REDIS_TTL = 120; // seconds (2x the 60s health check interval)

// ============================================================================
// REGION DEFINITIONS
// ============================================================================

export const REGIONS: Record<RegionCode, RegionConfig> = {
  'us-east-1': {
    code: 'us-east-1',
    name: 'US East (Virginia)',
    displayName: 'US East',
    continent: 'NA',
    country: 'US',
    timezone: 'America/New_York',
    isActive: true,
    isPrimary: true,
    endpoints: {
      api: process.env.US_EAST_API_URL || 'https://api-us-east.complyeasy.ai',
      database: process.env.US_EAST_DATABASE_URL || '',
      redis: process.env.US_EAST_REDIS_URL || '',
      s3Bucket: process.env.US_EAST_S3_BUCKET || 'complyeasy-us-east-1',
      cdn: 'https://cdn-us-east.complyeasy.ai',
    },
    dataResidency: {
      enforced: false,
      allowedReplicationTargets: ['us-west-2', 'eu-west-1'],
      requiredBy: ['SOC2', 'FedRAMP', 'CMMC'],
    },
    failover: {
      target: 'us-west-2',
      autoFailover: true,
      healthCheckInterval: 30,
      failureThreshold: 3,
    },
    scaling: {
      minInstances: 2,
      maxInstances: 20,
      targetCpuUtilization: 70,
    },
  },

  'us-west-2': {
    code: 'us-west-2',
    name: 'US West (Oregon)',
    displayName: 'US West',
    continent: 'NA',
    country: 'US',
    timezone: 'America/Los_Angeles',
    isActive: true,
    isPrimary: false,
    endpoints: {
      api: process.env.US_WEST_API_URL || 'https://api-us-west.complyeasy.ai',
      database: process.env.US_WEST_DATABASE_URL || '',
      redis: process.env.US_WEST_REDIS_URL || '',
      s3Bucket: process.env.US_WEST_S3_BUCKET || 'complyeasy-us-west-2',
      cdn: 'https://cdn-us-west.complyeasy.ai',
    },
    dataResidency: {
      enforced: false,
      allowedReplicationTargets: ['us-east-1'],
      requiredBy: ['CCPA'],
    },
    failover: {
      target: 'us-east-1',
      autoFailover: true,
      healthCheckInterval: 30,
      failureThreshold: 3,
    },
    scaling: {
      minInstances: 1,
      maxInstances: 10,
      targetCpuUtilization: 70,
    },
  },

  'eu-west-1': {
    code: 'eu-west-1',
    name: 'EU West (Ireland)',
    displayName: 'EU West',
    continent: 'EU',
    country: 'IE',
    timezone: 'Europe/Dublin',
    isActive: true,
    isPrimary: false,
    endpoints: {
      api: process.env.EU_WEST_API_URL || 'https://api-eu-west.complyeasy.ai',
      database: process.env.EU_WEST_DATABASE_URL || '',
      redis: process.env.EU_WEST_REDIS_URL || '',
      s3Bucket: process.env.EU_WEST_S3_BUCKET || 'complyeasy-eu-west-1',
      cdn: 'https://cdn-eu-west.complyeasy.ai',
    },
    dataResidency: {
      enforced: true,
      allowedReplicationTargets: ['eu-central-1'],
      requiredBy: ['GDPR', 'DMA', 'DSA'],
    },
    failover: {
      target: 'eu-central-1',
      autoFailover: true,
      healthCheckInterval: 30,
      failureThreshold: 3,
    },
    scaling: {
      minInstances: 2,
      maxInstances: 15,
      targetCpuUtilization: 70,
    },
  },

  'eu-central-1': {
    code: 'eu-central-1',
    name: 'EU Central (Frankfurt)',
    displayName: 'EU Central',
    continent: 'EU',
    country: 'DE',
    timezone: 'Europe/Berlin',
    isActive: true,
    isPrimary: false,
    endpoints: {
      api: process.env.EU_CENTRAL_API_URL || 'https://api-eu-central.complyeasy.ai',
      database: process.env.EU_CENTRAL_DATABASE_URL || '',
      redis: process.env.EU_CENTRAL_REDIS_URL || '',
      s3Bucket: process.env.EU_CENTRAL_S3_BUCKET || 'complyeasy-eu-central-1',
      cdn: 'https://cdn-eu-central.complyeasy.ai',
    },
    dataResidency: {
      enforced: true,
      allowedReplicationTargets: ['eu-west-1'],
      requiredBy: ['GDPR'],
    },
    failover: {
      target: 'eu-west-1',
      autoFailover: true,
      healthCheckInterval: 30,
      failureThreshold: 3,
    },
    scaling: {
      minInstances: 1,
      maxInstances: 10,
      targetCpuUtilization: 70,
    },
  },

  'ap-southeast-1': {
    code: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    displayName: 'Asia Pacific',
    continent: 'AP',
    country: 'SG',
    timezone: 'Asia/Singapore',
    isActive: false,
    isPrimary: false,
    endpoints: {
      api: process.env.AP_SOUTHEAST_API_URL || 'https://api-ap-southeast.complyeasy.ai',
      database: process.env.AP_SOUTHEAST_DATABASE_URL || '',
      redis: process.env.AP_SOUTHEAST_REDIS_URL || '',
      s3Bucket: process.env.AP_SOUTHEAST_S3_BUCKET || 'complyeasy-ap-southeast-1',
      cdn: 'https://cdn-ap-southeast.complyeasy.ai',
    },
    dataResidency: {
      enforced: false,
      allowedReplicationTargets: ['ap-northeast-1'],
      requiredBy: [],
    },
    failover: {
      target: 'ap-northeast-1',
      autoFailover: true,
      healthCheckInterval: 60,
      failureThreshold: 5,
    },
    scaling: {
      minInstances: 1,
      maxInstances: 8,
      targetCpuUtilization: 70,
    },
  },

  'ap-northeast-1': {
    code: 'ap-northeast-1',
    name: 'Asia Pacific (Tokyo)',
    displayName: 'Japan',
    continent: 'AP',
    country: 'JP',
    timezone: 'Asia/Tokyo',
    isActive: false,
    isPrimary: false,
    endpoints: {
      api: process.env.AP_NORTHEAST_API_URL || 'https://api-ap-northeast.complyeasy.ai',
      database: process.env.AP_NORTHEAST_DATABASE_URL || '',
      redis: process.env.AP_NORTHEAST_REDIS_URL || '',
      s3Bucket: process.env.AP_NORTHEAST_S3_BUCKET || 'complyeasy-ap-northeast-1',
      cdn: 'https://cdn-ap-northeast.complyeasy.ai',
    },
    dataResidency: {
      enforced: false,
      allowedReplicationTargets: ['ap-southeast-1'],
      requiredBy: [],
    },
    failover: {
      target: 'ap-southeast-1',
      autoFailover: true,
      healthCheckInterval: 60,
      failureThreshold: 5,
    },
    scaling: {
      minInstances: 1,
      maxInstances: 8,
      targetCpuUtilization: 70,
    },
  },
};

// ============================================================================
// MULTI-REGION SERVICE
// ============================================================================

class MultiRegionService {
  private currentRegion: RegionCode;
  private healthState: Map<RegionCode, { healthy: boolean; latencyMs: number; checkedAt: Date; consecutiveFailures: number }> = new Map();
  private healthCheckTimers: Map<RegionCode, NodeJS.Timeout> = new Map();

  constructor() {
    this.currentRegion = (process.env.DEPLOY_REGION as RegionCode) || 'us-east-1';
  }

  /**
   * Initialize multi-region service with health checking.
   */
  async initialize(): Promise<void> {
    const region = REGIONS[this.currentRegion];
    if (!region) {
      logger.warn(`[MultiRegion] Unknown region ${this.currentRegion}, defaulting to us-east-1`);
      this.currentRegion = 'us-east-1';
    }

    logger.info(`[MultiRegion] Initialized in region: ${REGIONS[this.currentRegion].name}`);

    // Initialize health state for all active regions
    for (const [code, config] of Object.entries(REGIONS)) {
      if (config.isActive) {
        const healthData = {
          healthy: code === this.currentRegion,
          latencyMs: 0,
          checkedAt: new Date(),
          consecutiveFailures: 0,
        };
        this.healthState.set(code as RegionCode, healthData);

        // Persist initial health state to Redis for cross-instance consistency
        try {
          await cacheService.set(`${HEALTH_REDIS_KEY_PREFIX}:${code}`, {
            ...healthData,
            checkedAt: healthData.checkedAt.toISOString(),
          } as RegionHealthData, { ttl: HEALTH_REDIS_TTL });
        } catch (redisErr) {
          logger.debug('[MultiRegion] Failed to sync initial health state to Redis, using local state');
        }
      }
    }

    // Start health checks for cross-region monitoring
    if (process.env.ENABLE_CROSS_REGION_HEALTH === 'true') {
      this.startHealthChecks();
    }
  }

  /**
   * Get the current deployment region.
   */
  getCurrentRegion(): RegionConfig {
    return REGIONS[this.currentRegion];
  }

  /**
   * Get all active regions.
   */
  getActiveRegions(): RegionConfig[] {
    return Object.values(REGIONS).filter(r => r.isActive);
  }

  /**
   * Get the primary region.
   */
  getPrimaryRegion(): RegionConfig {
    const primary = Object.values(REGIONS).find(r => r.isPrimary);
    return primary || REGIONS['us-east-1'];
  }

  /**
   * Check if data residency is enforced for a given framework.
   */
  isDataResidencyEnforced(framework: string): boolean {
    return Object.values(REGIONS).some(r =>
      r.dataResidency.enforced && r.dataResidency.requiredBy.includes(framework)
    );
  }

  /**
   * Get the appropriate region for storing data based on compliance requirements.
   */
  getDataRegion(frameworks: string[]): RegionConfig {
    // Check if any framework requires EU data residency
    const requiresEU = frameworks.some(f => ['GDPR', 'DMA', 'DSA'].includes(f));
    if (requiresEU) {
      return REGIONS['eu-west-1'].isActive ? REGIONS['eu-west-1'] : REGIONS['eu-central-1'];
    }

    // Check if FedRAMP requires US data residency
    const requiresUS = frameworks.some(f => ['FedRAMP', 'CMMC'].includes(f));
    if (requiresUS) {
      return REGIONS['us-east-1'];
    }

    // Default to current region
    return REGIONS[this.currentRegion];
  }

  /**
   * Get the best API endpoint for a given user location.
   */
  getOptimalEndpoint(userContinent?: string): string {
    if (!userContinent) {
      return REGIONS[this.currentRegion].endpoints.api;
    }

    // Map continent to closest region
    const continentMap: Record<string, RegionCode> = {
      'NA': 'us-east-1',
      'SA': 'us-east-1',
      'EU': 'eu-west-1',
      'AF': 'eu-west-1',
      'AS': 'ap-southeast-1',
      'OC': 'ap-southeast-1',
    };

    const targetRegion = continentMap[userContinent] || this.currentRegion;
    const region = REGIONS[targetRegion];

    if (region.isActive) {
      return region.endpoints.api;
    }

    return REGIONS[this.currentRegion].endpoints.api;
  }

  /**
   * Get health status of all regions.
   * Reads from Redis first for cross-instance consistency, falls back to local Map.
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};
    for (const [code] of this.healthState.entries()) {
      // Try Redis first for cross-instance consistency
      let health: RegionHealthData | null = null;
      try {
        health = await cacheService.get<RegionHealthData>(`${HEALTH_REDIS_KEY_PREFIX}:${code}`);
      } catch {
        // Redis unavailable, fall through to local state
      }

      // Fall back to local Map if Redis didn't have the data
      if (!health) {
        const localHealth = this.healthState.get(code as RegionCode);
        if (localHealth) {
          health = {
            ...localHealth,
            checkedAt: localHealth.checkedAt.toISOString(),
          };
        }
      }

      if (health) {
        status[code] = {
          ...health,
          region: REGIONS[code as RegionCode]?.name,
          isPrimary: REGIONS[code as RegionCode]?.isPrimary,
          isActive: REGIONS[code as RegionCode]?.isActive,
        };
      }
    }
    return status;
  }

  /**
   * Check if a region can replicate data to a target region.
   */
  canReplicateTo(sourceRegion: RegionCode, targetRegion: RegionCode): boolean {
    const source = REGIONS[sourceRegion];
    if (!source) return false;

    if (source.dataResidency.enforced) {
      return source.dataResidency.allowedReplicationTargets.includes(targetRegion);
    }

    return true;
  }

  /**
   * Start periodic health checks for all active regions.
   */
  private startHealthChecks(): void {
    for (const [code, config] of Object.entries(REGIONS)) {
      if (!config.isActive || code === this.currentRegion) continue;

      const timer = setInterval(async () => {
        await this.checkRegionHealth(code as RegionCode);
      }, config.failover.healthCheckInterval * 1000);

      this.healthCheckTimers.set(code as RegionCode, timer);
    }

    logger.info('[MultiRegion] Cross-region health checks started');
  }

  /**
   * Check health of a specific region.
   * Writes results to both the local Map and Redis for cross-instance consistency.
   */
  private async checkRegionHealth(regionCode: RegionCode): Promise<void> {
    const config = REGIONS[regionCode];
    if (!config) return;

    const healthUrl = `${config.endpoints.api}/health`;
    const startTime = Date.now();
    let healthData: { healthy: boolean; latencyMs: number; checkedAt: Date; consecutiveFailures: number };

    try {
      await this.httpHealthCheck(healthUrl, 5000);
      const latencyMs = Date.now() - startTime;

      healthData = {
        healthy: true,
        latencyMs,
        checkedAt: new Date(),
        consecutiveFailures: 0,
      };
    } catch (error) {
      const current = this.healthState.get(regionCode);
      const consecutiveFailures = (current?.consecutiveFailures || 0) + 1;

      healthData = {
        healthy: consecutiveFailures < config.failover.failureThreshold,
        latencyMs: -1,
        checkedAt: new Date(),
        consecutiveFailures,
      };

      if (consecutiveFailures >= config.failover.failureThreshold) {
        logger.error(`[MultiRegion] Region ${regionCode} is unhealthy (${consecutiveFailures} consecutive failures)`);
        if (config.failover.autoFailover) {
          logger.warn(`[MultiRegion] Auto-failover triggered for ${regionCode} -> ${config.failover.target}`);
        }
      }
    }

    // Write to local Map
    this.healthState.set(regionCode, healthData);

    // Sync to Redis for cross-instance consistency
    try {
      await cacheService.set(`${HEALTH_REDIS_KEY_PREFIX}:${regionCode}`, {
        ...healthData,
        checkedAt: healthData.checkedAt.toISOString(),
      } as RegionHealthData, { ttl: HEALTH_REDIS_TTL });
    } catch (redisErr) {
      logger.debug('[MultiRegion] Failed to sync health state to Redis, using local state');
    }
  }

  /**
   * Perform an actual HTTP health check against a region endpoint.
   * Returns a promise that resolves on 2xx response, rejects on error/timeout.
   */
  private httpHealthCheck(url: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, { timeout: timeoutMs }, (res) => {
        // Consume response body to free socket
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Health check returned status ${res.statusCode}`));
        }
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Health check timed out after ${timeoutMs}ms`));
      });
    });
  }

  /**
   * Shutdown health checks.
   */
  shutdown(): void {
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();
    logger.info('[MultiRegion] Health checks stopped');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const multiRegionService = new MultiRegionService();

export default multiRegionService;
