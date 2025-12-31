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
import logger from '../../config/logger';
import prisma from '../../config/database';

interface DeviceTrust {
  deviceId: string;
  deviceType: 'browser' | 'mobile' | 'server' | 'iot';
  fingerprint: string;
  trustScore: number;
  lastVerified: Date;
  isTrusted: boolean;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    os?: string;
    browser?: string;
  };
}

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
      throw new Error('Zero Trust initialization failed');
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
      // Check cache first
      const cached = this.deviceTrustCache.get(deviceId);
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
        detectedDeviceType = this.detectDeviceType({ 
          ...metadata, 
          deviceType: (metadata as any).deviceType || undefined 
        });
      } catch (error: any) {
        logger.error('Error detecting device type', error);
        detectedDeviceType = 'browser'; // Default fallback
      }

      const deviceTrust: DeviceTrust = {
        deviceId,
        deviceType: detectedDeviceType,
        fingerprint,
        trustScore,
        lastVerified: new Date(),
        isTrusted,
        metadata,
      };

      // Cache the result
      this.deviceTrustCache.set(deviceId, deviceTrust);

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
      throw new Error(`Device trust verification failed: ${error.message || error}`);
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
  private async isKnownLocation(location: string, organizationId: string): Promise<boolean> {
    // In production, check against known locations
    const knownLocations = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { allowedLocations: true },
    });
    
    // For now, return true (implement location whitelist)
    return true;
  }

  /**
   * Check IP reputation (0-1)
   */
  private async checkIPReputation(ipAddress: string): Promise<number> {
    // In production, integrate with IP reputation service
    // For now, check if IP is in private range (trusted)
    if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('127.')) {
      return 1.0;
    }
    // Check against known malicious IPs (would use threat intelligence)
    return 0.8; // Default moderate trust
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

      const prevMetadata = previous.metadata as any;

      if (metadata.os && prevMetadata?.os) {
        total++;
        if (metadata.os === prevMetadata.os) matches++;
      }

      if (metadata.browser && prevMetadata?.browser) {
        total++;
        if (metadata.browser === prevMetadata.browser) matches++;
      }

      // Check MAC address if available
      if (metadata.macAddress && prevMetadata?.macAddress) {
        total++;
        if (metadata.macAddress === prevMetadata.macAddress) matches++;
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
    // Simple condition evaluation (in production, use a proper expression evaluator)
    const condition = rule.condition.toLowerCase();

    if (rule.type === 'device') {
      if (condition.includes('trusted') && deviceTrust.isTrusted) return true;
      if (condition.includes('score') && condition.includes('>')) {
        const threshold = parseInt(condition.match(/>\s*(\d+)/)?.[1] || '0');
        return deviceTrust.trustScore > threshold;
      }
    }

    if (rule.type === 'network') {
      const segment = await this.getNetworkSegment(request.context.ipAddress, organizationId);
      if (condition.includes('segment') && segment) {
        const segmentName = condition.match(/segment\s*==\s*['"]([^'"]+)['"]/)?.[1];
        return segment?.name === segmentName;
      }
    }

    if (rule.type === 'user') {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { role: true },
      });
      if (condition.includes('role') && user) {
        const role = condition.match(/role\s*==\s*['"]([^'"]+)['"]/)?.[1];
        return user.role === role;
      }
    }

    if (rule.type === 'resource') {
      if (condition.includes('resource') && condition.includes(request.resourceId)) {
        return true;
      }
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
      throw new Error('Failed to create Zero Trust policy');
    }
  }

  /**
   * Get network segment for IP address
   */
  private async getNetworkSegment(
    ipAddress: string,
    organizationId: string
  ): Promise<NetworkSegment | null> {
    // In production, use proper CIDR matching
    // For now, return default segment
    const segments = Array.from(this.networkSegments.values());
    return segments.find(s => s.cidr && this.ipInCIDR(ipAddress, s.cidr)) || null;
  }

  /**
   * Check if IP is in CIDR range
   */
  private ipInCIDR(ip: string, cidr: string): boolean {
    // Simplified CIDR check (in production, use proper library)
    if (cidr.includes('/')) {
      const [network, prefix] = cidr.split('/');
      // Simplified check
      return ip.startsWith(network.split('.').slice(0, parseInt(prefix) / 8).join('.'));
    }
    return ip === cidr;
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
          trustLevel: segment.trustLevel as any,
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
    deviceTrust: DeviceTrust,
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
          metadata: deviceTrust.metadata as any, // Prisma handles JSON automatically
        },
        create: {
          deviceId,
          organizationId,
          deviceType: deviceTrust.deviceType,
          fingerprint: deviceTrust.fingerprint,
          trustScore: deviceTrust.trustScore,
          isTrusted: deviceTrust.isTrusted,
          lastVerified: deviceTrust.lastVerified,
          metadata: deviceTrust.metadata as any, // Prisma handles JSON automatically
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
      // In production, you might want to throw here
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
        deviceId: stored.deviceId,
        deviceType: stored.deviceType as any,
        fingerprint: stored.fingerprint,
        trustScore: stored.trustScore,
        lastVerified: stored.lastVerified,
        isTrusted: stored.isTrusted,
        metadata: JSON.parse(stored.metadata as string),
      };
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
        deviceId: stored.deviceId,
        deviceType: stored.deviceType as any,
        fingerprint: stored.fingerprint,
        trustScore: stored.trustScore,
        lastVerified: stored.lastVerified,
        isTrusted: stored.isTrusted,
        metadata: (stored.metadata as any) || {},
      }));
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
}

export default new ZeroTrustService();

