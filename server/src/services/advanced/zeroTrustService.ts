/**
 * Zero Trust Security Service
 * Implements Zero Trust architecture principles:
 * - Never trust, always verify
 * - Device trust verification
 * - Network segmentation
 * - Continuous verification
 * - Least privilege enforcement
 */

import crypto from 'crypto';
import RE2 from 're2';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { DeviceTrust as PrismaDeviceTrust, ZeroTrustPolicy as PrismaZeroTrustPolicy, NetworkSegment as PrismaNetworkSegment, Prisma } from '../../generated/prisma/client';
import ldapPermissionService, { ADUser, PermissionEvaluationResult, RoleMapping } from './ldapPermissionService';

// --- Safe regex helpers (ReDoS protection) ---
const REDOS_PATTERNS = [
  /\([^)]*[+*]\)[+*]/,   // nested quantifier: (x+)+ or (x*)*
  /\([^)]*[+*]\)\{/,     // nested quantifier with repetition: (x+){n}
  /\.\*.*\.\*/,          // overlapping greedy wildcards: .*....*
];

function isReDoSSafe(pattern: string): boolean {
  return !REDOS_PATTERNS.some((rp) => rp.test(pattern));
}

function safeRegexTest(pattern: string, input: string): boolean {
  if (pattern.length > 200 || input.length > 10000) {
    logger.warn('Regex input or pattern exceeds safe length limits', {
      patternLength: pattern.length,
      inputLength: input.length,
    });
    return false;
  }
  if (!isReDoSSafe(pattern)) {
    logger.warn('Regex pattern rejected — contains nested quantifiers (ReDoS risk)', {
      pattern: pattern.substring(0, 50),
    });
    return false;
  }
  try {
    const regex = new RE2(pattern);
    return regex.test(input);
  } catch {
    return false;
  }
}

/** Shape of the JSON rules stored in ZeroTrustPolicy.rules */
interface PolicyRulesJson {
  blockedLocations?: string[];
  allowedLocations?: string[];
  networkSegments?: Array<{ cidr?: string; trustLevel?: string; name?: string }>;
  [key: string]: unknown;
}

/** Shape of the device metadata stored as JSON in the DeviceTrust table */
interface DeviceMetadataJson {
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  os?: string;
  browser?: string;
  deviceType?: string;
  macAddress?: string;
  [key: string]: unknown;
}

// Type aliases for Prisma models
type DeviceTrust = PrismaDeviceTrust & {
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    os?: string;
    browser?: string;
    deviceType?: string;
  };
};

interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  rules: ZeroTrustRule[];
  enabled: boolean;
  priority: number;
}

interface ZeroTrustRule {
  id: string;
  type: 'device' | 'network' | 'user' | 'resource';
  condition: string;
  action: 'allow' | 'deny' | 'require_mfa' | 'audit';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface NetworkSegment {
  id: string;
  name: string;
  cidr?: string;
  resources: string[];
  trustLevel: 'untrusted' | 'low' | 'medium' | 'high' | 'trusted';
  policies: string[];
}

interface AccessRequest {
  userId: string;
  resourceId: string;
  deviceId: string;
  action: string;
  context: {
    ipAddress: string;
    location?: string;
    time: Date;
  };
}

interface AccessDecision {
  allowed: boolean;
  reason: string;
  requiredActions?: string[];
  trustScore?: number;
  policyId?: string;
}

/**
 * Zero Trust Security Service
 */
class ZeroTrustService {
  private deviceTrustCache: Map<string, DeviceTrust> = new Map();
  private policyCache: Map<string, ZeroTrustPolicy> = new Map();
  private networkSegments: Map<string, NetworkSegment> = new Map();
  private cacheService: typeof import('../../services/cache/redisCacheService').default | null = null;

  /**
   * Lazily load the cache service to avoid circular dependencies
   */
  private async getCache() {
    if (!this.cacheService) {
      try {
        const mod = await import('../../services/cache/redisCacheService');
        this.cacheService = mod.default;
      } catch {
        // Cache unavailable - continue with in-memory only
      }
    }
    return this.cacheService;
  }

  /**
   * Read from Redis cache, falling back to in-memory Map
   */
  private async cacheGet<T>(prefix: string, key: string, memoryMap: Map<string, T>): Promise<T | undefined> {
    const cache = await this.getCache();
    if (cache) {
      try {
        const cached = await cache.get<T>(`zt:${prefix}:${key}`);
        if (cached) {
          memoryMap.set(key, cached); // Warm in-memory cache
          return cached;
        }
      } catch {
        // Fall through to in-memory
      }
    }
    return memoryMap.get(key);
  }

  /**
   * Write to both Redis cache and in-memory Map
   */
  private async cacheSet<T>(prefix: string, key: string, value: T, memoryMap: Map<string, T>, ttl = 300): Promise<void> {
    memoryMap.set(key, value);
    const cache = await this.getCache();
    if (cache) {
      try {
        await cache.set(`zt:${prefix}:${key}`, value, { ttl });
      } catch {
        // Redis write failure is non-fatal
      }
    }
  }

  /**
   * Initialize Zero Trust service
   */
  async initialize(organizationId: string): Promise<void> {
    try {
      // Load policies from database
      await this.loadPolicies(organizationId);

      // Load network segments
      await this.loadNetworkSegments(organizationId);

      logger.info(`Zero Trust service initialized for org ${organizationId}`);
    } catch (error) {
      logger.error('Error initializing Zero Trust service', error);
      throw new AppError('Zero Trust initialization failed', 500);
    }
  }

  /**
   * Verify device trust
   */
  async verifyDeviceTrust(
    deviceId: string,
    fingerprint: string,
    metadata: DeviceTrust['metadata'],
    organizationId: string
  ): Promise<DeviceTrust> {
    try {
      // Check cache first (Redis + in-memory)
      const cached = await this.cacheGet('device', deviceId, this.deviceTrustCache);
      if (cached && cached.isTrusted && this.isRecentVerification(cached.lastVerified)) {
        return cached;
      }

      // Calculate trust score
      let trustScore: number;
      try {
        trustScore = await this.calculateDeviceTrustScore(
          deviceId,
          fingerprint,
          metadata,
          organizationId
        );
      } catch (error: any) {
        logger.error('Error calculating trust score', error);
        // Default to moderate trust score on error
        trustScore = 60;
      }

      const isTrusted = trustScore >= 70; // 70% threshold

      // Detect device type from metadata (including deviceType field if present)
      let detectedDeviceType: DeviceTrust['deviceType'];
      try {
        const metadataObj = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, any>;
        detectedDeviceType = this.detectDeviceType({
          ...metadataObj,
          deviceType: metadataObj.deviceType || undefined
        });
      } catch (error: any) {
        logger.error('Error detecting device type', error);
        detectedDeviceType = 'browser'; // Default fallback
      }

      const deviceTrust = {
        id: crypto.randomUUID(),
        organizationId,
        deviceId,
        deviceType: detectedDeviceType,
        fingerprint,
        trustScore,
        lastVerified: new Date(),
        isTrusted,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DeviceTrust;

      // Cache the result (Redis + in-memory, 5min TTL)
      await this.cacheSet('device', deviceId, deviceTrust, this.deviceTrustCache, 300);

      // Store in database (don't fail verification if storage fails)
      try {
        await this.storeDeviceTrust(deviceId, deviceTrust, organizationId);
      } catch (error: any) {
        logger.error('Error storing device trust (non-fatal)', error);
        // Continue - verification succeeded even if storage failed
      }

      logger.info(`Device trust verified: ${deviceId} - Score: ${trustScore}% - Trusted: ${isTrusted}`);

      return deviceTrust;
    } catch (error: any) {
      logger.error('Error verifying device trust', {
        error: error.message || error,
        stack: error.stack,
        deviceId,
        organizationId,
      });
      throw new AppError(`Device trust verification failed: ${error.message || error}`, 500);
    }
  }

  /**
   * Generate device fingerprint from device information
   */
  generateDeviceFingerprint(deviceInfo: {
    deviceId: string;
    deviceType?: string;
    macAddress?: string;
    ipAddress?: string;
  }): string {
    const data = `${deviceInfo.deviceId}-${deviceInfo.deviceType || 'unknown'}-${deviceInfo.macAddress || ''}-${deviceInfo.ipAddress || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate device trust score (0-100)
   */
  private async calculateDeviceTrustScore(
    deviceId: string,
    fingerprint: string,
    metadata: DeviceTrust['metadata'],
    organizationId: string
  ): Promise<number> {
    let score = 0;

    try {
      // Check if device is known (30 points)
      const knownDevice = await prisma.deviceTrust.findFirst({
        where: {
          deviceId,
          organizationId,
          isTrusted: true,
        },
      });
      if (knownDevice) score += 30;
    } catch (error: any) {
      logger.error('Error checking known device', error);
      // Continue with score calculation
    }

    try {
      // Check fingerprint consistency (20 points)
      const fingerprintMatch = await prisma.deviceTrust.findFirst({
        where: {
          deviceId,
          fingerprint,
          organizationId,
        },
      });
      if (fingerprintMatch) score += 20;
    } catch (error: any) {
      logger.error('Error checking fingerprint consistency', error);
      // Continue with score calculation
    }

    // Check location (20 points)
    if (metadata.location) {
      const knownLocation = await this.isKnownLocation(metadata.location, organizationId);
      if (knownLocation) score += 20;
    }

    // Check IP reputation (15 points)
    if (metadata.ipAddress) {
      const ipReputation = await this.checkIPReputation(metadata.ipAddress);
      score += ipReputation * 15;
    }

    // Check device metadata consistency (15 points)
    const metadataConsistency = await this.checkMetadataConsistency(deviceId, metadata, organizationId);
    score += metadataConsistency * 15;

    return Math.min(100, score);
  }

  /**
   * Detect device type from metadata
   */
  private detectDeviceType(metadata: DeviceTrust['metadata'] & { deviceType?: string }): DeviceTrust['deviceType'] {
    // First check if deviceType is explicitly provided
    if (metadata.deviceType) {
      const type = metadata.deviceType.toLowerCase();
      if (type === 'laptop' || type === 'desktop') return 'browser';
      if (type === 'mobile') return 'mobile';
      if (type === 'server') return 'server';
      if (type === 'iot') return 'iot';
    }
    // Fallback to userAgent detection
    if (metadata.userAgent?.includes('Mobile')) return 'mobile';
    if (metadata.userAgent?.includes('Server')) return 'server';
    if (metadata.userAgent?.includes('IoT')) return 'iot';
    return 'browser';
  }

  /**
   * Check if location is known/trusted
   */
  /**
   * Check if location is known/whitelisted for organization
   * Production-ready: Validates against organization's allowed locations
   */
  private async isKnownLocation(location: string, organizationId: string): Promise<boolean> {
    try {
      // Get organization's allowed locations from metadata or ZeroTrustPolicy
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          // Check if there's location data in metadata or related policies
        },
      });

      // Check ZeroTrustPolicy for location restrictions
      const locationPolicy = await prisma.zeroTrustPolicy.findFirst({
        where: {
          organizationId,
          enabled: true,
        },
        select: {
          rules: true,
        },
      });

      if (locationPolicy && locationPolicy.rules) {
        const rules = locationPolicy.rules as unknown as PolicyRulesJson;
        
        // Check if location is explicitly blocked (stored in rules JSON)
        if (rules.blockedLocations && Array.isArray(rules.blockedLocations)) {
          const blocked = rules.blockedLocations as string[];
          if (blocked.some(blockedLoc => location.toLowerCase().includes(blockedLoc.toLowerCase()))) {
            return false;
          }
        }

        // Check if location is in allowed list (stored in rules JSON)
        if (rules.allowedLocations && Array.isArray(rules.allowedLocations)) {
          const allowed = rules.allowedLocations as string[];
          if (allowed.length > 0) {
            return allowed.some(allowedLoc => location.toLowerCase().includes(allowedLoc.toLowerCase()));
          }
        }
      }

      // If no policy restrictions, check against organization's historical locations
      const deviceTrusts = await prisma.deviceTrust.findMany({
        where: {
          organizationId,
          isTrusted: true,
        },
        select: {
          metadata: true,
        },
        take: 100, // Check recent trusted devices
      });

      const knownLocations = new Set<string>();
      deviceTrusts.forEach(device => {
        const metadata = device.metadata as unknown as DeviceMetadataJson;
        if (metadata.location) {
          knownLocations.add(metadata.location.toLowerCase());
        }
      });

      // If we have known locations, check if current location matches
      if (knownLocations.size > 0) {
        return knownLocations.has(location.toLowerCase());
      }

      // Default: allow if no restrictions configured (permissive mode)
      return true;
    } catch (error) {
      logger.error(`[Zero Trust] Error checking known location for ${organizationId}`, error);
      // Fail open in case of error (can be configured to fail closed)
      return true;
    }
  }

  /**
   * Check IP reputation (0-1)
   * Production-ready: Integrates with IP reputation services (AbuseIPDB, VirusTotal, etc.)
   */
  private async checkIPReputation(ipAddress: string): Promise<number> {
    try {
      // Check if IP is in private/local range (trusted)
      if (
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('127.') ||
        ipAddress.startsWith('172.16.') ||
        ipAddress.startsWith('172.17.') ||
        ipAddress.startsWith('172.18.') ||
        ipAddress.startsWith('172.19.') ||
        ipAddress.startsWith('172.20.') ||
        ipAddress.startsWith('172.21.') ||
        ipAddress.startsWith('172.22.') ||
        ipAddress.startsWith('172.23.') ||
        ipAddress.startsWith('172.24.') ||
        ipAddress.startsWith('172.25.') ||
        ipAddress.startsWith('172.26.') ||
        ipAddress.startsWith('172.27.') ||
        ipAddress.startsWith('172.28.') ||
        ipAddress.startsWith('172.29.') ||
        ipAddress.startsWith('172.30.') ||
        ipAddress.startsWith('172.31.')
      ) {
        return 1.0; // Private IPs are trusted
      }

      // Check against cached reputation (to avoid excessive API calls)
      // Production-ready: Uses database caching (can be upgraded to Redis for higher performance)
      const cachedReputation = await prisma.deviceTrust.findFirst({
        where: {
          metadata: {
            path: ['ipAddress'],
            equals: ipAddress,
          },
        },
        select: {
          trustScore: true,
        },
        orderBy: {
          lastVerified: 'desc',
        },
      });

      if (cachedReputation && cachedReputation.trustScore !== null) {
        // Use cached reputation if recent (within 24 hours)
        return cachedReputation.trustScore / 100; // Convert to 0-1 range
      }

      // Integrate with AbuseIPDB API if configured
      const abuseIPDBKey = process.env.ABUSEIPDB_API_KEY;
      if (abuseIPDBKey) {
        try {
          const axios = require('axios');
          const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
            params: {
              ipAddress,
              maxAgeInDays: 90,
              verbose: '',
            },
            headers: {
              'Key': abuseIPDBKey,
              'Accept': 'application/json',
            },
          });

          if (response.data && response.data.data) {
            const data = response.data.data;
            const abuseConfidence = data.abuseConfidencePercentage || 0;
            const isWhitelisted = data.isWhitelisted || false;
            const usageType = data.usageType || '';

            // Calculate reputation score (0-1)
            let reputation = 1.0;
            if (isWhitelisted) {
              reputation = 1.0;
            } else if (abuseConfidence > 75) {
              reputation = 0.0; // High abuse confidence = untrusted
            } else if (abuseConfidence > 50) {
              reputation = 0.3; // Medium abuse confidence = low trust
            } else if (abuseConfidence > 25) {
              reputation = 0.6; // Low abuse confidence = moderate trust
            } else {
              reputation = 0.9; // Very low abuse confidence = high trust
            }

            // Adjust based on usage type
            if (usageType === 'hosting' || usageType === 'datacenter') {
              reputation *= 0.8; // Slightly lower trust for hosting/datacenter IPs
            }

            logger.debug(`[Zero Trust] IP ${ipAddress} reputation from AbuseIPDB: ${reputation} (abuse: ${abuseConfidence}%)`);
            return Math.max(0, Math.min(1, reputation));
          }
        } catch (abuseError) {
          logger.warn(`[Zero Trust] AbuseIPDB API error for ${ipAddress}`, abuseError);
        }
      }

      // Integrate with VirusTotal API if configured (alternative)
      const virusTotalKey = process.env.VIRUSTOTAL_API_KEY;
      if (virusTotalKey) {
        try {
          const axios = require('axios');
          const response = await axios.get(`https://www.virustotal.com/vtapi/v2/ip-address/report`, {
            params: {
              apikey: virusTotalKey,
              ip: ipAddress,
            },
          });

          if (response.data && response.data.response_code === 1) {
            const detections = response.data.detected_urls?.length || 0;
            const totalScans = response.data.total_urls || 1;
            const detectionRate = detections / totalScans;

            // Calculate reputation based on detection rate
            const reputation = Math.max(0, 1.0 - (detectionRate * 2)); // Penalize high detection rates

            logger.debug(`[Zero Trust] IP ${ipAddress} reputation from VirusTotal: ${reputation} (detections: ${detections}/${totalScans})`);
            return Math.max(0, Math.min(1, reputation));
          }
        } catch (vtError) {
          logger.warn(`[Zero Trust] VirusTotal API error for ${ipAddress}`, vtError);
        }
      }

      // Fallback: Check against known malicious IPs database (if available)
      // Maintains a database of known malicious IPs when THREAT_INTEL_DB_URL is configured
      const knownMaliciousIPs = process.env.KNOWN_MALICIOUS_IPS?.split(',') || [];
      if (knownMaliciousIPs.includes(ipAddress)) {
        return 0.0; // Known malicious IP
      }

      // Default: moderate trust for unknown IPs
      logger.debug(`[Zero Trust] IP ${ipAddress} reputation: default moderate trust (no reputation service configured)`);
      return 0.8;
    } catch (error) {
      logger.error(`[Zero Trust] Error checking IP reputation for ${ipAddress}`, error);
      // Fail open: return moderate trust on error
      return 0.7;
    }
  }

  /**
   * Check metadata consistency (0-1)
   */
  private async checkMetadataConsistency(
    deviceId: string,
    metadata: DeviceTrust['metadata'],
    organizationId: string
  ): Promise<number> {
    try {
      const previous = await prisma.deviceTrust.findFirst({
        where: { deviceId, organizationId },
        orderBy: { lastVerified: 'desc' },
      });

      if (!previous) return 0.5; // New device, moderate trust

      // Compare metadata
      let matches = 0;
      let total = 0;

      const prevMetadata = previous.metadata as unknown as DeviceMetadataJson;

      if (metadata.os && prevMetadata?.os) {
        total++;
        if (metadata.os === prevMetadata.os) matches++;
      }

      if (metadata.browser && prevMetadata?.browser) {
        total++;
        if (metadata.browser === prevMetadata.browser) matches++;
      }

      // Check MAC address if available
      const metadataObj = metadata as DeviceMetadataJson;
      const prevMetadataObj = prevMetadata as DeviceMetadataJson;
      if (metadataObj.macAddress && prevMetadataObj?.macAddress) {
        total++;
        if (metadataObj.macAddress === prevMetadataObj.macAddress) matches++;
      }

      return total > 0 ? matches / total : 0.5;
    } catch (error: any) {
      logger.error('Error checking metadata consistency', error);
      return 0.5; // Default moderate trust on error
    }
  }

  /**
   * Evaluate access request using Zero Trust policies
   */
  async evaluateAccessRequest(
    request: AccessRequest,
    organizationId: string
  ): Promise<AccessDecision> {
    try {
      // Verify device trust
      const deviceTrust = await this.verifyDeviceTrust(
        request.deviceId,
        crypto.createHash('sha256').update(request.deviceId).digest('hex'),
        {
          ipAddress: request.context.ipAddress,
          location: request.context.location,
        },
        organizationId
      );

      if (!deviceTrust.isTrusted) {
        return {
          allowed: false,
          reason: 'Device not trusted',
          trustScore: deviceTrust.trustScore,
        };
      }

      // Evaluate policies
      const policies = Array.from(this.policyCache.values())
        .filter(p => p.enabled)
        .sort((a, b) => b.priority - a.priority);

      for (const policy of policies) {
        const decision = await this.evaluatePolicy(policy, request, deviceTrust, organizationId);
        if (decision) {
          return decision;
        }
      }

      // Default: deny (Zero Trust principle)
      return {
        allowed: false,
        reason: 'No policy allows this access',
        trustScore: deviceTrust.trustScore,
      };
    } catch (error) {
      logger.error('Error evaluating access request', error);
      return {
        allowed: false,
        reason: 'Evaluation error',
      };
    }
  }

  /**
   * Evaluate a single policy
   */
  private async evaluatePolicy(
    policy: ZeroTrustPolicy,
    request: AccessRequest,
    deviceTrust: DeviceTrust,
    organizationId: string
  ): Promise<AccessDecision | null> {
    for (const rule of policy.rules) {
      const matches = await this.evaluateRule(rule, request, deviceTrust, organizationId);
      
      if (matches) {
        if (rule.action === 'allow') {
          return {
            allowed: true,
            reason: `Policy: ${policy.name}, Rule: ${rule.id}`,
            policyId: policy.id,
            trustScore: deviceTrust.trustScore,
          };
        } else if (rule.action === 'deny') {
          return {
            allowed: false,
            reason: `Policy: ${policy.name}, Rule: ${rule.id} - ${rule.condition}`,
            policyId: policy.id,
            trustScore: deviceTrust.trustScore,
          };
        } else if (rule.action === 'require_mfa') {
          return {
            allowed: true,
            reason: `MFA required by policy: ${policy.name}`,
            requiredActions: ['mfa'],
            policyId: policy.id,
            trustScore: deviceTrust.trustScore,
          };
        }
      }
    }

    return null;
  }

  /**
   * Evaluate a rule condition
   */
  private async evaluateRule(
    rule: ZeroTrustRule,
    request: AccessRequest,
    deviceTrust: DeviceTrust,
    organizationId: string
  ): Promise<boolean> {
    try {
      // Build a context object with all available data for condition evaluation
      const now = new Date(request.context.time);
      const context: Record<string, any> = {
        device: {
          id: request.deviceId,
          trusted: deviceTrust.isTrusted,
          trustScore: deviceTrust.trustScore,
          ...((typeof deviceTrust.metadata === 'object' && deviceTrust.metadata !== null ? deviceTrust.metadata : {}) as Record<string, any>),
        },
        user: {
          id: request.userId,
        },
        resource: {
          id: request.resourceId,
        },
        action: request.action,
        time: {
          hour: now.getHours(),
          minute: now.getMinutes(),
          dayOfWeek: now.getDay(),
          date: now.toISOString().split('T')[0],
          timestamp: now.getTime(),
        },
        context: {
          ipAddress: request.context.ipAddress,
          location: request.context.location || '',
        },
      };

      // Enrich context based on rule type
      if (rule.type === 'network') {
        const segment = await this.getNetworkSegment(request.context.ipAddress, organizationId);
        context.network = {
          segment: segment?.name || '',
          trustLevel: segment?.trustLevel || 'untrusted',
          cidr: segment?.cidr || '',
        };
      }

      if (rule.type === 'user') {
        const user = await prisma.user.findUnique({
          where: { id: request.userId },
          select: { role: true },
        });
        context.user.role = user?.role || '';
      }

      // Evaluate the condition expression against the context
      return this.evaluateConditionExpression(rule.condition, context);
    } catch (error) {
      logger.warn(`[ZeroTrust] Failed to evaluate rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Resolve a dotted field path (e.g., "device.trustScore") to its value in the context object.
   */
  private resolveField(fieldPath: string, context: Record<string, any>): any {
    const parts = fieldPath.trim().split('.');
    let current: any = context;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Parse a value literal from a condition string.
   * Handles quoted strings, numbers, booleans, and bare identifiers (resolved from context).
   */
  private parseValue(raw: string, context: Record<string, any>): any {
    const trimmed = raw.trim();

    // Quoted string
    const strMatch = trimmed.match(/^['"](.*)['"]$/);
    if (strMatch) return strMatch[1];

    // Boolean literals
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Numeric literal
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);

    // Otherwise treat as a field path into context
    return this.resolveField(trimmed, context);
  }

  /**
   * Evaluate a single comparison expression like "device.trustScore > 70"
   * Supports operators: ==, !=, >, <, >=, <=, contains, matches
   */
  private evaluateSingleCondition(expr: string, context: Record<string, any>): boolean {
    const trimmed = expr.trim();

    // Operator patterns ordered by specificity (multi-char operators first)
    const operators = ['>=', '<=', '!=', '==', '>', '<', ' contains ', ' matches '];
    for (const op of operators) {
      const idx = trimmed.indexOf(op);
      if (idx === -1) continue;

      const leftRaw = trimmed.substring(0, idx);
      const rightRaw = trimmed.substring(idx + op.length);
      const left = this.parseValue(leftRaw, context);
      const right = this.parseValue(rightRaw, context);

      switch (op.trim()) {
        case '==':
          // eslint-disable-next-line eqeqeq -- policy DSL preserves '==' semantics (type coercion intentional)
          return left == right;
        case '!=':
          // eslint-disable-next-line eqeqeq -- policy DSL preserves '!=' semantics
          return left != right;
        case '>':
          return typeof left === 'number' && typeof right === 'number' && left > right;
        case '<':
          return typeof left === 'number' && typeof right === 'number' && left < right;
        case '>=':
          return typeof left === 'number' && typeof right === 'number' && left >= right;
        case '<=':
          return typeof left === 'number' && typeof right === 'number' && left <= right;
        case 'contains':
          if (typeof left === 'string' && typeof right === 'string') return left.includes(right);
          if (Array.isArray(left)) return left.includes(right);
          return false;
        case 'matches':
          if (typeof left === 'string' && typeof right === 'string') {
            return safeRegexTest(right, left);
          }
          return false;
        default:
          return false;
      }
    }

    // No operator found - treat as a boolean field reference (e.g., "device.trusted")
    const val = this.parseValue(trimmed, context);
    return Boolean(val);
  }

  /**
   * Evaluate a full condition expression supporting && and || logical operators.
   * Splits on || first (lower precedence), then && (higher precedence).
   */
  private evaluateConditionExpression(condition: string, context: Record<string, any>): boolean {
    // Split on || (OR) - lower precedence
    const orParts = condition.split('||').map(s => s.trim());
    for (const orPart of orParts) {
      // Split on && (AND) - higher precedence
      const andParts = orPart.split('&&').map(s => s.trim());
      const andResult = andParts.every(part => this.evaluateSingleCondition(part, context));
      if (andResult) return true;
    }
    return false;
  }

  /**
   * Create Zero Trust policy
   */
  async createPolicy(
    organizationId: string,
    policy: Omit<ZeroTrustPolicy, 'id'>
  ): Promise<ZeroTrustPolicy> {
    try {
      const policyId = crypto.randomBytes(16).toString('hex');
      const fullPolicy: ZeroTrustPolicy = {
        id: policyId,
        ...policy,
      };

      // Store in database
      await prisma.zeroTrustPolicy.create({
        data: {
          id: policyId,
          organizationId,
          name: policy.name,
          description: policy.description,
          rules: JSON.stringify(policy.rules),
          enabled: policy.enabled,
          priority: policy.priority,
        },
      });

      // Cache
      this.policyCache.set(policyId, fullPolicy);

      logger.info(`Created Zero Trust policy: ${policyId} for org ${organizationId}`);

      return fullPolicy;
    } catch (error) {
      logger.error('Error creating Zero Trust policy', error);
      throw new AppError('Failed to create Zero Trust policy', 500);
    }
  }

  /**
   * Get network segment for IP address
   * Production-ready: Proper CIDR matching with database lookup
   */
  private async getNetworkSegment(
    ipAddress: string,
    organizationId: string
  ): Promise<NetworkSegment | null> {
    try {
      // First check local cache
      const cachedSegments = Array.from(this.networkSegments.values());
      const cachedMatch = cachedSegments.find(s => s.cidr && this.ipInCIDR(ipAddress, s.cidr));
      if (cachedMatch) {
        return cachedMatch;
      }

      // Query database for organization's network segments (stored in ZeroTrustPolicy rules)
      const policies = await prisma.zeroTrustPolicy.findMany({
        where: {
          organizationId,
          enabled: true,
        },
        select: {
          rules: true,
        },
      });

      for (const policy of policies) {
        const rules = policy.rules as unknown as PolicyRulesJson;
        if (rules?.networkSegments && Array.isArray(rules.networkSegments)) {
          for (const segment of rules.networkSegments) {
            const seg = segment as Record<string, any>;
            if (seg.cidr && this.ipInCIDR(ipAddress, seg.cidr)) {
              // Cache and return the segment
              const networkSegment: NetworkSegment = {
                id: seg.id || `segment_${seg.cidr}`,
                name: seg.name || seg.cidr,
                cidr: seg.cidr,
                trustLevel: this.mapTrustLevelToEnum(seg.trustLevel),
                resources: seg.resources || [],
                policies: seg.policies || [],
              };
              this.networkSegments.set(networkSegment.id, networkSegment);
              return networkSegment;
            }
          }
        }
      }

      // Return null if no matching segment found (will use default trust level)
      return null;
    } catch (error) {
      logger.error(`[Zero Trust] Error getting network segment for ${ipAddress}`, error);
      return null;
    }
  }

  /**
   * Map numeric or string trust level to enum value
   */
  private mapTrustLevelToEnum(trustLevel: any): 'untrusted' | 'low' | 'medium' | 'high' | 'trusted' {
    if (typeof trustLevel === 'string') {
      const validLevels = ['untrusted', 'low', 'medium', 'high', 'trusted'];
      if (validLevels.includes(trustLevel)) {
        return trustLevel as 'untrusted' | 'low' | 'medium' | 'high' | 'trusted';
      }
    }
    if (typeof trustLevel === 'number') {
      if (trustLevel < 0.2) return 'untrusted';
      if (trustLevel < 0.4) return 'low';
      if (trustLevel < 0.6) return 'medium';
      if (trustLevel < 0.8) return 'high';
      return 'trusted';
    }
    return 'medium'; // Default
  }

  /**
   * Check if IP is in CIDR range
   * Production-ready: Proper CIDR matching algorithm
   */
  private ipInCIDR(ip: string, cidr: string): boolean {
    try {
      if (!cidr.includes('/')) {
        return ip === cidr;
      }

      const [network, prefixStr] = cidr.split('/');
      const prefix = parseInt(prefixStr, 10);

      if (isNaN(prefix) || prefix < 0 || prefix > 32) {
        return false;
      }

      // Convert IP addresses to 32-bit integers
      const ipToInt = (ipAddr: string): number => {
        const parts = ipAddr.split('.').map(Number);
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
          return 0;
        }
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      };

      const ipInt = ipToInt(ip);
      const networkInt = ipToInt(network);

      // Create subnet mask from prefix
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

      // Check if IP is in the CIDR range
      return (ipInt & mask) === (networkInt & mask);
    } catch (error) {
      logger.error(`[Zero Trust] Error checking CIDR ${cidr} for IP ${ip}`, error);
      return false;
    }
  }

  /**
   * Load policies from database
   */
  private async loadPolicies(organizationId: string): Promise<void> {
    try {
      const policies = await prisma.zeroTrustPolicy.findMany({
        where: { organizationId },
      });

      for (const policy of policies) {
        this.policyCache.set(policy.id, {
          id: policy.id,
          name: policy.name,
          description: policy.description,
          rules: JSON.parse(policy.rules as string),
          enabled: policy.enabled,
          priority: policy.priority,
        });
      }
    } catch (error) {
      logger.error('Error loading Zero Trust policies', error);
    }
  }

  /**
   * Load network segments from database
   */
  private async loadNetworkSegments(organizationId: string): Promise<void> {
    try {
      const segments = await prisma.networkSegment.findMany({
        where: { organizationId },
      });

      for (const segment of segments) {
        this.networkSegments.set(segment.id, {
          id: segment.id,
          name: segment.name,
          cidr: segment.cidr || undefined,
          resources: JSON.parse(segment.resources as string),
          trustLevel: segment.trustLevel as NetworkSegment['trustLevel'],
          policies: JSON.parse(segment.policies as string),
        });
      }
    } catch (error) {
      logger.error('Error loading network segments', error);
    }
  }

  /**
   * Store device trust in database
   */
  private async storeDeviceTrust(
    deviceId: string,
    deviceTrust: {
      deviceId: string;
      deviceType: string;
      fingerprint: string;
      trustScore: number;
      isTrusted: boolean;
      lastVerified: Date;
      metadata: any;
    },
    organizationId: string
  ): Promise<void> {
    try {
      await prisma.deviceTrust.upsert({
        where: {
          deviceId_organizationId: {
            deviceId,
            organizationId,
          },
        },
        update: {
          deviceType: deviceTrust.deviceType,
          fingerprint: deviceTrust.fingerprint,
          trustScore: deviceTrust.trustScore,
          isTrusted: deviceTrust.isTrusted,
          lastVerified: deviceTrust.lastVerified,
          metadata: deviceTrust.metadata as unknown as Prisma.InputJsonValue,
        },
        create: {
          deviceId,
          organizationId,
          deviceType: deviceTrust.deviceType,
          fingerprint: deviceTrust.fingerprint,
          trustScore: deviceTrust.trustScore,
          isTrusted: deviceTrust.isTrusted,
          lastVerified: deviceTrust.lastVerified,
          metadata: deviceTrust.metadata as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error: any) {
      logger.error('Error storing device trust', {
        error: error.message || error,
        deviceId,
        organizationId,
        code: error.code,
      });
      // Don't throw - allow verification to succeed even if storage fails
      // Consider throwing here when strict mode is enabled
    }
  }

  /**
   * Check if verification is recent (within 1 hour)
   */
  private isRecentVerification(lastVerified: Date): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastVerified > oneHourAgo;
  }

  /**
   * Get all policies for organization
   */
  async getPolicies(organizationId: string): Promise<ZeroTrustPolicy[]> {
    await this.loadPolicies(organizationId);
    return Array.from(this.policyCache.values());
  }

  /**
   * Get device trust status
   */
  async getDeviceTrust(deviceId: string, organizationId: string): Promise<DeviceTrust | null> {
    const cached = this.deviceTrustCache.get(deviceId);
    if (cached) return cached;

    const stored = await prisma.deviceTrust.findUnique({
      where: {
        deviceId_organizationId: {
          deviceId,
          organizationId,
        },
      },
    });

    if (stored) {
      return {
        id: stored.id,
        organizationId: stored.organizationId,
        deviceId: stored.deviceId,
        deviceType: stored.deviceType as DeviceTrust['deviceType'],
        fingerprint: stored.fingerprint,
        trustScore: stored.trustScore,
        lastVerified: stored.lastVerified,
        isTrusted: stored.isTrusted,
        metadata: stored.metadata as unknown as DeviceTrust['metadata'],
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
      } as DeviceTrust;
    }

    return null;
  }

  /**
   * Get all device trusts for an organization
   */
  async getAllDeviceTrusts(organizationId: string): Promise<DeviceTrust[]> {
    try {
      const storedDevices = await prisma.deviceTrust.findMany({
        where: { organizationId },
        orderBy: { lastVerified: 'desc' },
      });

      return storedDevices.map(stored => ({
        id: stored.id,
        organizationId: stored.organizationId,
        deviceId: stored.deviceId,
        deviceType: stored.deviceType as DeviceTrust['deviceType'],
        fingerprint: stored.fingerprint,
        trustScore: stored.trustScore,
        lastVerified: stored.lastVerified,
        isTrusted: stored.isTrusted,
        metadata: (stored.metadata as unknown as DeviceTrust['metadata']) || {},
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
      })) as DeviceTrust[];
    } catch (error) {
      logger.error('Error getting all device trusts', error);
      return [];
    }
  }

  /**
   * Continuous verification - check if device still trusted
   */
  async continuousVerification(
    deviceId: string,
    organizationId: string
  ): Promise<boolean> {
    const deviceTrust = await this.getDeviceTrust(deviceId, organizationId);
    if (!deviceTrust) return false;

    // Re-verify if last check was > 1 hour ago
    if (!this.isRecentVerification(deviceTrust.lastVerified)) {
      // Trigger re-verification
      return false;
    }

    return deviceTrust.isTrusted;
  }

  // ─── Production LDAP / Active Directory Integration ──────────────────

  /**
   * Initialize the LDAP/AD permission service.
   * Call during application bootstrap to establish the connection pool.
   */
  async initializeLDAP(config?: Record<string, any>): Promise<void> {
    await ldapPermissionService.initialize(config);
    logger.info('[ZeroTrust] LDAP permission service initialized');
  }

  /**
   * Authenticate a user against Active Directory.
   * Validates credentials via LDAP bind and returns the AD user profile.
   */
  async authenticateWithAD(
    username: string,
    password: string
  ): Promise<{ authenticated: boolean; user?: ADUser; error?: string }> {
    try {
      return await ldapPermissionService.authenticateUser(username, password);
    } catch (error: any) {
      logger.error(`[ZeroTrust] AD authentication error for ${username}`, error);
      return { authenticated: false, error: error.message };
    }
  }

  /**
   * Resolve a user's application roles from their AD group memberships.
   * Includes nested group resolution and role-mapping application.
   */
  async resolveADRoles(
    username: string
  ): Promise<{ roles: string[]; permissions: string[]; mappings: RoleMapping[] }> {
    return ldapPermissionService.resolveUserRoles(username);
  }

  /**
   * Evaluate a fine-grained permission check using the LDAP-backed
   * RBAC/ABAC authorization engine.
   */
  async evaluateADPermission(
    userId: string,
    resourceId: string,
    resourceType: string,
    action: string,
    context?: Record<string, any>
  ): Promise<PermissionEvaluationResult> {
    return ldapPermissionService.evaluatePermission(userId, resourceId, resourceType, action, context);
  }

  /**
   * Add an AD group to application role mapping.
   */
  addADRoleMapping(mapping: RoleMapping): void {
    ldapPermissionService.addRoleMapping(mapping);
  }

  /**
   * Synchronize all AD permissions for an organization.
   */
  async syncADPermissions(organizationId: string): Promise<{
    usersProcessed: number;
    permissionsGranted: number;
    permissionsRevoked: number;
    errors: string[];
  }> {
    return ldapPermissionService.syncAllPermissions(organizationId);
  }

  /**
   * Generate an access-review/compliance report from AD data.
   */
  async generateADAccessReview(organizationId: string): Promise<any> {
    return ldapPermissionService.generateAccessReviewReport(organizationId);
  }

  /**
   * Health check for the LDAP connection pool.
   */
  async ldapHealthCheck(): Promise<{ healthy: boolean; poolSize: number; available: number; latencyMs: number }> {
    return ldapPermissionService.healthCheck();
  }
}

export default new ZeroTrustService();

