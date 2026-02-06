/**
 * Zero Trust Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Extend prismaMock with Zero Trust specific models
const ztPrismaMock = {
  ...prismaMock,
  deviceTrust: {
    findUnique: jest.fn() as jest.Mock<any>,
    findFirst: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
    upsert: jest.fn() as jest.Mock<any>,
  },
  zeroTrustPolicy: {
    findUnique: jest.fn() as jest.Mock<any>,
    findFirst: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
  },
  networkSegment: {
    findUnique: jest.fn() as jest.Mock<any>,
    findFirst: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
  },
};

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: ztPrismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import zeroTrustService from '../../../../services/advanced/zeroTrustService';

describe('ZeroTrustService', () => {
  const orgId = 'org-123';
  const deviceId = 'device-abc';

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear internal caches by accessing private fields
    (zeroTrustService as any).deviceTrustCache = new Map();
    (zeroTrustService as any).policyCache = new Map();
    (zeroTrustService as any).networkSegments = new Map();
  });

  // =========================================================================
  // initialize
  // =========================================================================
  describe('initialize', () => {
    it('should load policies and network segments from database', async () => {
      (ztPrismaMock.zeroTrustPolicy.findMany as jest.Mock).mockResolvedValue(
        [
          {
            id: 'policy-1',
            name: 'Default Policy',
            description: 'Test policy',
            rules: JSON.stringify([
              { id: 'rule-1', type: 'device', condition: 'device.trusted', action: 'allow', severity: 'high' },
            ]),
            enabled: true,
            priority: 10,
          },
        ] as any
      );
      (ztPrismaMock.networkSegment.findMany as jest.Mock).mockResolvedValue(
        [
          {
            id: 'seg-1',
            name: 'Internal',
            cidr: '192.168.0.0/16',
            resources: JSON.stringify(['resource-1']),
            trustLevel: 'high',
            policies: JSON.stringify(['policy-1']),
          },
        ] as any
      );

      await zeroTrustService.initialize(orgId);

      expect(ztPrismaMock.zeroTrustPolicy.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect(ztPrismaMock.networkSegment.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
    });

    it('should throw when initialization fails critically', async () => {
      (ztPrismaMock.zeroTrustPolicy.findMany as jest.Mock).mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(zeroTrustService.initialize(orgId)).rejects.toThrow(
        'Zero Trust initialization failed'
      );
    });
  });

  // =========================================================================
  // generateDeviceFingerprint
  // =========================================================================
  describe('generateDeviceFingerprint', () => {
    it('should generate a deterministic SHA-256 fingerprint', () => {
      const fingerprint1 = zeroTrustService.generateDeviceFingerprint({
        deviceId: 'dev-1',
        deviceType: 'laptop',
        ipAddress: '192.168.1.100',
      });

      const fingerprint2 = zeroTrustService.generateDeviceFingerprint({
        deviceId: 'dev-1',
        deviceType: 'laptop',
        ipAddress: '192.168.1.100',
      });

      expect(fingerprint1).toBe(fingerprint2); // Deterministic
      expect(fingerprint1).toHaveLength(64); // SHA-256 hex length
    });

    it('should produce different fingerprints for different devices', () => {
      const fp1 = zeroTrustService.generateDeviceFingerprint({
        deviceId: 'dev-1',
        deviceType: 'laptop',
      });

      const fp2 = zeroTrustService.generateDeviceFingerprint({
        deviceId: 'dev-2',
        deviceType: 'mobile',
      });

      expect(fp1).not.toBe(fp2);
    });

    it('should handle missing optional fields gracefully', () => {
      const fp = zeroTrustService.generateDeviceFingerprint({
        deviceId: 'dev-1',
      });

      expect(typeof fp).toBe('string');
      expect(fp).toHaveLength(64);
    });
  });

  // =========================================================================
  // verifyDeviceTrust
  // =========================================================================
  describe('verifyDeviceTrust', () => {
    it('should return cached trust when recently verified and trusted', async () => {
      const cachedTrust = {
        id: 'dt-1',
        organizationId: orgId,
        deviceId,
        isTrusted: true,
        trustScore: 85,
        lastVerified: new Date(), // Just now => recent
        metadata: { userAgent: 'Chrome', os: 'Mac' },
      };

      (zeroTrustService as any).deviceTrustCache.set(deviceId, cachedTrust);

      const result = await zeroTrustService.verifyDeviceTrust(
        deviceId,
        'fingerprint-abc',
        { userAgent: 'Chrome', os: 'Mac' },
        orgId
      );

      expect(result.isTrusted).toBe(true);
      expect(result.trustScore).toBe(85);
      // Should not have hit the database
      expect(ztPrismaMock.deviceTrust.findFirst).not.toHaveBeenCalled();
    });

    it('should verify a new device and calculate trust score', async () => {
      // No cache
      (ztPrismaMock.deviceTrust.findFirst as jest.Mock).mockResolvedValue(null);
      (ztPrismaMock.deviceTrust.upsert as jest.Mock).mockResolvedValue({} as any);
      (prismaMock.organization.findUnique as jest.Mock).mockResolvedValue({ id: orgId } as any);
      (ztPrismaMock.zeroTrustPolicy.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await zeroTrustService.verifyDeviceTrust(
        'new-device',
        'new-fingerprint',
        { userAgent: 'Firefox', os: 'Linux', ipAddress: '192.168.1.50' },
        orgId
      );

      expect(result).toBeDefined();
      expect(typeof result.trustScore).toBe('number');
      expect(typeof result.isTrusted).toBe('boolean');
      expect(result.deviceId).toBe('new-device');
    });

    it('should detect mobile device type from userAgent', async () => {
      (ztPrismaMock.deviceTrust.findFirst as jest.Mock).mockResolvedValue(null);
      (ztPrismaMock.deviceTrust.upsert as jest.Mock).mockResolvedValue({} as any);
      (prismaMock.organization.findUnique as jest.Mock).mockResolvedValue({ id: orgId } as any);
      (ztPrismaMock.zeroTrustPolicy.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await zeroTrustService.verifyDeviceTrust(
        'mobile-device',
        'mobile-fp',
        { userAgent: 'Mobile Safari', os: 'iOS', ipAddress: '10.0.0.1' },
        orgId
      );

      expect(result.deviceType).toBe('mobile');
    });

    it('should detect browser device type by default', async () => {
      (ztPrismaMock.deviceTrust.findFirst as jest.Mock).mockResolvedValue(null);
      (ztPrismaMock.deviceTrust.upsert as jest.Mock).mockResolvedValue({} as any);
      (prismaMock.organization.findUnique as jest.Mock).mockResolvedValue({ id: orgId } as any);
      (ztPrismaMock.zeroTrustPolicy.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await zeroTrustService.verifyDeviceTrust(
        'browser-device',
        'browser-fp',
        { userAgent: 'Chrome/99', os: 'Windows', ipAddress: '10.0.0.2' },
        orgId
      );

      expect(result.deviceType).toBe('browser');
    });

    it('should give higher trust score for known devices', async () => {
      // Known device in DB
      (ztPrismaMock.deviceTrust.findFirst as jest.Mock)
        .mockResolvedValueOnce({ deviceId, isTrusted: true } as any) // known device
        .mockResolvedValueOnce({ deviceId, fingerprint: 'fp-match' } as any) // fingerprint match
        .mockResolvedValueOnce({ metadata: { os: 'Mac', browser: 'Chrome' } } as any); // metadata
      (ztPrismaMock.deviceTrust.upsert as jest.Mock).mockResolvedValue({} as any);
      (prismaMock.organization.findUnique as jest.Mock).mockResolvedValue({ id: orgId } as any);
      (ztPrismaMock.zeroTrustPolicy.findFirst as jest.Mock).mockResolvedValue(null);
      (ztPrismaMock.deviceTrust.findMany as jest.Mock).mockResolvedValue([] as any);

      const result = await zeroTrustService.verifyDeviceTrust(
        deviceId,
        'fp-match',
        { userAgent: 'Chrome', os: 'Mac', ipAddress: '192.168.1.1' },
        orgId
      );

      // Known device (30pts) + fingerprint match (20pts) + private IP (15pts) = 65+ (plus metadata)
      expect(result.trustScore).toBeGreaterThanOrEqual(50);
    });
  });

  // =========================================================================
  // createPolicy
  // =========================================================================
  describe('createPolicy', () => {
    it('should create a policy and cache it', async () => {
      (ztPrismaMock.zeroTrustPolicy.create as jest.Mock).mockResolvedValue({
        id: 'policy-new',
      } as any);

      const policy = await zeroTrustService.createPolicy(orgId, {
        name: 'Access Policy',
        description: 'Controls office access',
        rules: [
          {
            id: 'rule-1',
            type: 'device',
            condition: 'device.trusted',
            action: 'allow',
            severity: 'high',
          },
        ],
        enabled: true,
        priority: 5,
      });

      expect(policy).toBeDefined();
      expect(policy.name).toBe('Access Policy');
      expect(policy.rules).toHaveLength(1);
      expect(ztPrismaMock.zeroTrustPolicy.create).toHaveBeenCalledTimes(1);
    });

    it('should throw on database failure', async () => {
      (ztPrismaMock.zeroTrustPolicy.create as jest.Mock).mockRejectedValue(
        new Error('Constraint violation')
      );

      await expect(
        zeroTrustService.createPolicy(orgId, {
          name: 'Bad Policy',
          description: 'Fails',
          rules: [],
          enabled: true,
          priority: 1,
        })
      ).rejects.toThrow('Failed to create Zero Trust policy');
    });
  });

  // =========================================================================
  // evaluateAccessRequest
  // =========================================================================
  describe('evaluateAccessRequest', () => {
    it('should deny access when device is not trusted', async () => {
      // Set up for untrusted device
      (ztPrismaMock.deviceTrust.findFirst as jest.Mock).mockResolvedValue(null);
      (ztPrismaMock.deviceTrust.upsert as jest.Mock).mockResolvedValue({} as any);
      (prismaMock.organization.findUnique as jest.Mock).mockResolvedValue({ id: orgId } as any);
      (ztPrismaMock.zeroTrustPolicy.findFirst as jest.Mock).mockResolvedValue(null);
      (ztPrismaMock.deviceTrust.findMany as jest.Mock).mockResolvedValue([] as any);

      const decision = await zeroTrustService.evaluateAccessRequest(
        {
          userId: 'user-1',
          resourceId: 'resource-1',
          deviceId: 'untrusted-device',
          action: 'read',
          context: {
            ipAddress: '1.2.3.4', // External IP
            time: new Date(),
          },
        },
        orgId
      );

      // Untrusted device should result in denied access
      expect(decision.allowed).toBe(false);
    });

    it('should deny by default when no matching policy (Zero Trust principle)', async () => {
      // Set up a trusted device
      const trustedDevice = {
        id: 'dt-1',
        deviceId: 'trusted-dev',
        isTrusted: true,
        trustScore: 90,
        lastVerified: new Date(),
        metadata: {},
      };
      (zeroTrustService as any).deviceTrustCache.set('trusted-dev', trustedDevice);

      // No policies loaded
      (zeroTrustService as any).policyCache = new Map();

      const decision = await zeroTrustService.evaluateAccessRequest(
        {
          userId: 'user-1',
          resourceId: 'resource-1',
          deviceId: 'trusted-dev',
          action: 'read',
          context: {
            ipAddress: '10.0.0.1',
            time: new Date(),
          },
        },
        orgId
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('No policy allows this access');
    });

    it('should allow access when matching allow policy exists', async () => {
      const trustedDevice = {
        id: 'dt-1',
        deviceId: 'trusted-dev',
        isTrusted: true,
        trustScore: 90,
        lastVerified: new Date(),
        metadata: {},
      };
      (zeroTrustService as any).deviceTrustCache.set('trusted-dev', trustedDevice);

      // Set up a policy that allows access for trusted devices
      (zeroTrustService as any).policyCache = new Map([
        [
          'policy-1',
          {
            id: 'policy-1',
            name: 'Allow Trusted',
            description: 'Allow trusted devices',
            rules: [
              {
                id: 'rule-1',
                type: 'device' as const,
                condition: 'device.trusted',
                action: 'allow' as const,
                severity: 'medium' as const,
              },
            ],
            enabled: true,
            priority: 10,
          },
        ],
      ]);

      const decision = await zeroTrustService.evaluateAccessRequest(
        {
          userId: 'user-1',
          resourceId: 'resource-1',
          deviceId: 'trusted-dev',
          action: 'read',
          context: {
            ipAddress: '10.0.0.1',
            time: new Date(),
          },
        },
        orgId
      );

      expect(decision.allowed).toBe(true);
      expect(decision.policyId).toBe('policy-1');
    });

    it('should handle evaluation errors gracefully', async () => {
      // Force an error during verifyDeviceTrust
      (ztPrismaMock.deviceTrust.findFirst as jest.Mock).mockRejectedValue(
        new Error('DB connection lost')
      );
      (ztPrismaMock.deviceTrust.upsert as jest.Mock).mockRejectedValue(
        new Error('DB connection lost')
      );

      const decision = await zeroTrustService.evaluateAccessRequest(
        {
          userId: 'user-1',
          resourceId: 'resource-1',
          deviceId: 'error-device',
          action: 'read',
          context: {
            ipAddress: '10.0.0.1',
            time: new Date(),
          },
        },
        orgId
      );

      // Should deny on error
      expect(decision.allowed).toBe(false);
    });
  });

  // =========================================================================
  // getPolicies
  // =========================================================================
  describe('getPolicies', () => {
    it('should load and return policies from database', async () => {
      (ztPrismaMock.zeroTrustPolicy.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'pol-1',
          name: 'Policy A',
          description: 'Description A',
          rules: JSON.stringify([]),
          enabled: true,
          priority: 1,
        },
        {
          id: 'pol-2',
          name: 'Policy B',
          description: 'Description B',
          rules: JSON.stringify([]),
          enabled: false,
          priority: 2,
        },
      ] as any);

      const policies = await zeroTrustService.getPolicies(orgId);

      expect(policies).toHaveLength(2);
      expect(policies[0].name).toBe('Policy A');
      expect(policies[1].name).toBe('Policy B');
    });

    it('should return empty array when no policies exist', async () => {
      (ztPrismaMock.zeroTrustPolicy.findMany as jest.Mock).mockResolvedValue([] as any);

      const policies = await zeroTrustService.getPolicies(orgId);

      expect(policies).toEqual([]);
    });
  });

  // =========================================================================
  // getDeviceTrust
  // =========================================================================
  describe('getDeviceTrust', () => {
    it('should return cached device trust if available', async () => {
      const cached = {
        id: 'dt-1',
        deviceId,
        organizationId: orgId,
        isTrusted: true,
        trustScore: 80,
      };
      (zeroTrustService as any).deviceTrustCache.set(deviceId, cached);

      const result = await zeroTrustService.getDeviceTrust(deviceId, orgId);

      expect(result).toBe(cached);
      expect(ztPrismaMock.deviceTrust.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database when not in cache', async () => {
      const stored = {
        id: 'dt-2',
        deviceId: 'db-device',
        organizationId: orgId,
        deviceType: 'browser',
        fingerprint: 'fp-abc',
        trustScore: 70,
        lastVerified: new Date(),
        isTrusted: true,
        metadata: { os: 'Windows' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ztPrismaMock.deviceTrust.findUnique as jest.Mock).mockResolvedValue(stored as any);

      const result = await zeroTrustService.getDeviceTrust('db-device', orgId);

      expect(result).toBeDefined();
      expect(result!.trustScore).toBe(70);
      expect(ztPrismaMock.deviceTrust.findUnique).toHaveBeenCalledWith({
        where: {
          deviceId_organizationId: {
            deviceId: 'db-device',
            organizationId: orgId,
          },
        },
      });
    });

    it('should return null when device not found', async () => {
      (ztPrismaMock.deviceTrust.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await zeroTrustService.getDeviceTrust('unknown', orgId);

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // getAllDeviceTrusts
  // =========================================================================
  describe('getAllDeviceTrusts', () => {
    it('should return all device trusts for an organization', async () => {
      const devices = [
        {
          id: 'dt-1',
          deviceId: 'dev-1',
          organizationId: orgId,
          deviceType: 'browser',
          fingerprint: 'fp1',
          trustScore: 80,
          lastVerified: new Date(),
          isTrusted: true,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dt-2',
          deviceId: 'dev-2',
          organizationId: orgId,
          deviceType: 'mobile',
          fingerprint: 'fp2',
          trustScore: 50,
          lastVerified: new Date(),
          isTrusted: false,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (ztPrismaMock.deviceTrust.findMany as jest.Mock).mockResolvedValue(devices as any);

      const result = await zeroTrustService.getAllDeviceTrusts(orgId);

      expect(result).toHaveLength(2);
      expect(result[0].deviceId).toBe('dev-1');
      expect(result[1].deviceId).toBe('dev-2');
    });

    it('should return empty array on error', async () => {
      (ztPrismaMock.deviceTrust.findMany as jest.Mock).mockRejectedValue(
        new Error('Query failed')
      );

      const result = await zeroTrustService.getAllDeviceTrusts(orgId);

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // continuousVerification
  // =========================================================================
  describe('continuousVerification', () => {
    it('should return true for recently verified trusted device', async () => {
      const cached = {
        id: 'dt-1',
        deviceId,
        organizationId: orgId,
        isTrusted: true,
        trustScore: 85,
        lastVerified: new Date(), // just now
      };
      (zeroTrustService as any).deviceTrustCache.set(deviceId, cached);

      const result = await zeroTrustService.continuousVerification(deviceId, orgId);

      expect(result).toBe(true);
    });

    it('should return false for unknown device', async () => {
      (ztPrismaMock.deviceTrust.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await zeroTrustService.continuousVerification('unknown-device', orgId);

      expect(result).toBe(false);
    });

    it('should return false for stale verification (older than 1 hour)', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const staleDevice = {
        id: 'dt-old',
        deviceId: 'stale-device',
        organizationId: orgId,
        isTrusted: true,
        trustScore: 90,
        lastVerified: twoHoursAgo,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ztPrismaMock.deviceTrust.findUnique as jest.Mock).mockResolvedValue(staleDevice as any);

      const result = await zeroTrustService.continuousVerification('stale-device', orgId);

      expect(result).toBe(false);
    });

    it('should return false for untrusted device even if recent', async () => {
      const untrustedDevice = {
        id: 'dt-untrusted',
        deviceId: 'untrusted-dev',
        organizationId: orgId,
        isTrusted: false,
        trustScore: 30,
        lastVerified: new Date(), // recent but untrusted
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ztPrismaMock.deviceTrust.findUnique as jest.Mock).mockResolvedValue(untrustedDevice as any);

      const result = await zeroTrustService.continuousVerification('untrusted-dev', orgId);

      expect(result).toBe(false);
    });
  });
});
