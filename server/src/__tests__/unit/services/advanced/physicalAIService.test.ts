/**
 * Physical AI Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
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

jest.mock('../../../../services/advanced/mqttService', () => ({
  __esModule: true,
  default: {
    getConnectionStatus: jest.fn<any>().mockReturnValue(false),
    subscribe: jest.fn(),
    publish: jest.fn(),
    connect: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

import physicalAIService from '../../../../services/advanced/physicalAIService';

describe('PhysicalAIService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    const mqttService = require('../../../../services/advanced/mqttService').default;
    mqttService.getConnectionStatus.mockReturnValue(false);
    mqttService.subscribe.mockImplementation(() => {});
    mqttService.publish.mockImplementation(() => {});
    mqttService.connect.mockResolvedValue(undefined);

    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.ioTDevice.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.ioTDevice.update as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.ioTDevice.delete as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.edgeComplianceCheck.create as jest.Mock<any>).mockResolvedValue({});
  });

  describe('constructor', () => {
    it('should initialize with default policies', () => {
      expect((physicalAIService as any).devicePolicies.size).toBeGreaterThan(0);
      expect((physicalAIService as any).devicePolicies.has('default_iot_policy')).toBe(true);
    });
  });

  describe('registerDevice', () => {
    it('should register a new IoT device', async () => {
      const createdDevice = {
        id: 'device-uuid-1',
        deviceId: 'sensor-001',
        deviceType: 'temperature_sensor',
        location: 'Server Room A',
        complianceStatus: 'pending_review',
        lastSeen: new Date(),
        organizationId: orgId,
        sensorData: {},
      };
      // First findFirst: existingDevice check returns null
      // Second findFirst: performEdgeComplianceCheck inside registerDevice looks up device
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createdDevice);
      (prismaMock.ioTDevice.create as jest.Mock<any>).mockResolvedValue(createdDevice);
      (prismaMock.ioTDevice.update as jest.Mock<any>).mockResolvedValue(createdDevice);

      const result = await physicalAIService.registerDevice(
        orgId,
        {
          deviceId: 'sensor-001',
          deviceType: 'temperature_sensor',
          location: 'Server Room A',
          firmware: '1.0.0',
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.deviceId).toBe('sensor-001');
      expect(result.deviceType).toBe('temperature_sensor');
    });

    it('should reject duplicate device registration', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'existing-device',
        deviceId: 'sensor-001',
        organizationId: orgId,
      });

      await expect(
        physicalAIService.registerDevice(
          orgId,
          {
            deviceId: 'sensor-001',
            deviceType: 'temperature_sensor',
            location: 'Server Room A',
          },
          userId
        )
      ).rejects.toThrow('already registered');
    });

    it('should validate device certificates if provided', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        physicalAIService.registerDevice(
          orgId,
          {
            deviceId: 'sensor-002',
            deviceType: 'camera',
            location: 'Entrance',
            certificates: [{
              type: 'x509',
              issuer: 'TestCA',
              validFrom: new Date('2020-01-01'),
              validUntil: new Date('2021-01-01'),
              fingerprint: 'a'.repeat(40),
            }],
          },
          userId
        )
      ).rejects.toThrow('Certificate validation failed');
    });
  });

  describe('performEdgeComplianceCheck', () => {
    it('should perform compliance check on a device', async () => {
      const mockDevice = {
        id: 'device-1',
        deviceId: 'sensor-001',
        deviceType: 'temperature_sensor',
        location: 'Server Room',
        complianceStatus: 'pending_review',
        sensorData: {
          encryption: { algorithm: 'AES-256-GCM', keyLength: 256, enabled: true },
          accessControl: { hasRBAC: true, hasMFA: true },
          auditLogging: { enabled: true, tamperProof: true, remoteSync: true },
          firmware: { signed: true, verified: true, version: '1.0.0' },
        },
        organizationId: orgId,
        complianceChecks: [],
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(mockDevice);
      (prismaMock.ioTDevice.update as jest.Mock<any>).mockResolvedValue(mockDevice);

      // Note: performEdgeComplianceCheck(deviceId, organizationId)
      const result = await physicalAIService.performEdgeComplianceCheck(
        'sensor-001',
        orgId
      );

      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);
    });

    it('should throw error if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        physicalAIService.performEdgeComplianceCheck('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  describe('startHealthMonitoring', () => {
    it('should start health monitoring interval', () => {
      physicalAIService.startHealthMonitoring(60000);
      expect((physicalAIService as any).healthCheckInterval).toBeDefined();
      physicalAIService.shutdown();
    });

    it('should clear previous interval on restart', () => {
      physicalAIService.startHealthMonitoring(60000);
      const firstInterval = (physicalAIService as any).healthCheckInterval;

      physicalAIService.startHealthMonitoring(30000);
      const secondInterval = (physicalAIService as any).healthCheckInterval;

      expect(firstInterval).not.toBe(secondInterval);
      physicalAIService.shutdown();
    });
  });

  describe('getDevices', () => {
    it('should return all devices for an organization', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'd-1', deviceId: 'sensor-001', deviceType: 'temp', complianceStatus: 'compliant', complianceChecks: [] },
        { id: 'd-2', deviceId: 'sensor-002', deviceType: 'camera', complianceStatus: 'non_compliant', complianceChecks: [] },
      ]);

      const result = await physicalAIService.getDevices(orgId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
    });
  });

  describe('deregisterDevice', () => {
    it('should deregister an existing device', async () => {
      const mockDevice = {
        id: 'device-1',
        deviceId: 'sensor-001',
        organizationId: orgId,
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(mockDevice);
      (prismaMock.ioTDevice.delete as jest.Mock<any>).mockResolvedValue(mockDevice);

      await expect(
        physicalAIService.deregisterDevice(orgId, 'sensor-001', userId)
      ).resolves.not.toThrow();
    });

    it('should throw error if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        physicalAIService.deregisterDevice(orgId, 'nonexistent', userId)
      ).rejects.toThrow();
    });
  });

  describe('receiveSensorData', () => {
    it('should process sensor data from a device', async () => {
      const mockDevice = {
        id: 'device-1',
        deviceId: 'sensor-001',
        organizationId: orgId,
        sensorData: {},
        complianceChecks: [],
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(mockDevice);
      (prismaMock.ioTDevice.update as jest.Mock<any>).mockResolvedValue(mockDevice);

      const result = await physicalAIService.receiveSensorData(
        orgId,
        'sensor-001',
        { temperature: 22.5, humidity: 45 }
      );

      expect(result).toBeDefined();
    });
  });

  describe('getHealthDashboard', () => {
    it('should return health dashboard data', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'd-1',
          deviceId: 'sensor-001',
          lastSeen: new Date(),
          complianceStatus: 'compliant',
          sensorData: { battery: 85 },
          complianceChecks: [{ status: 'pass', checkType: 'encryption' }],
        },
      ]);

      const result = await physicalAIService.getHealthDashboard(orgId);

      expect(result).toBeDefined();
      expect(result.totalDevices).toBeDefined();
    });
  });

  describe('bulkRegisterDevices', () => {
    it('should register multiple devices', async () => {
      // Each registerDevice call does findFirst (null) then findFirst again (for compliance check)
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockImplementation(() => {
        // Return null for existence checks but device data for compliance checks
        return Promise.resolve(null);
      });
      (prismaMock.ioTDevice.create as jest.Mock<any>).mockImplementation((args: any) => Promise.resolve({
        id: 'uuid-' + Math.random(),
        ...args.data,
        sensorData: args.data?.sensorData || {},
      }));
      (prismaMock.ioTDevice.update as jest.Mock<any>).mockResolvedValue({});

      const devices = [
        { deviceId: 's-001', deviceType: 'sensor', location: 'Room A' },
        { deviceId: 's-002', deviceType: 'camera', location: 'Room B' },
      ];

      const result = await physicalAIService.bulkRegisterDevices(orgId, devices, userId);

      expect(result).toBeDefined();
      expect(result.successful).toBeDefined();
    });
  });

  describe('shutdown', () => {
    it('should clear health monitoring interval', () => {
      physicalAIService.startHealthMonitoring(60000);
      physicalAIService.shutdown();

      // After shutdown, the interval is cleared (may be null or a cleared timer object)
      const interval = (physicalAIService as any).healthCheckInterval;
      // The service sets it to null or clears it
      expect(interval === null || interval._destroyed === true).toBe(true);
    });
  });
});
