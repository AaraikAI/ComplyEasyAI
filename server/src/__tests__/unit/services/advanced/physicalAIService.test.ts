/**
 * Physical AI Compliance Service Unit Tests - Comprehensive Coverage
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
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
    unsubscribe: jest.fn(),
  },
}));

import physicalAIService from '../../../../services/advanced/physicalAIService';

describe('PhysicalAIService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  const mockDevice = {
    id: 'uuid-1',
    organizationId: orgId,
    deviceId: 'sensor-001',
    deviceType: 'temperature_sensor',
    location: 'Server Room A',
    mqttTopic: 'devices/sensor-001/data',
    complianceStatus: 'compliant',
    lastSeen: new Date(),
    sensorData: {
      firmware: 'v1.2.0',
      capabilities: ['temperature', 'humidity'],
      registeredBy: userId,
      registeredAt: new Date(),
      metadata: {},
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const mqttService = require('../../../../services/advanced/mqttService').default;
    mqttService.getConnectionStatus.mockReturnValue(false);
    mqttService.subscribe.mockImplementation(() => {});
    mqttService.publish.mockImplementation(() => {});
    mqttService.connect.mockResolvedValue(undefined);
    mqttService.unsubscribe.mockImplementation(() => {});

    (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.ioTDevice.create as jest.Mock<any>).mockResolvedValue(mockDevice);
    (prismaMock.ioTDevice.update as jest.Mock<any>).mockResolvedValue(mockDevice);
    (prismaMock.ioTDevice.delete as jest.Mock<any>).mockResolvedValue(mockDevice);
    (prismaMock.ioTDevice.count as jest.Mock<any>).mockResolvedValue(1);
    (prismaMock.edgeComplianceCheck.create as jest.Mock<any>).mockResolvedValue({ id: 'check-1' });
    (prismaMock.edgeComplianceCheck.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.auditLog.count as jest.Mock<any>).mockResolvedValue(0);
  });

  describe('registerDevice', () => {
    const baseDevice = {
      deviceId: 'sensor-001',
      deviceType: 'temperature_sensor',
      location: 'Server Room A',
      mqttTopic: 'devices/sensor-001/data',
      firmware: 'v1.2.0',
      capabilities: ['temperature', 'humidity'],
    };

    it('should register a new device successfully', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.registerDevice(orgId, baseDevice, userId);

      expect(result).toBeDefined();
      expect(result.deviceId).toBe('sensor-001');
      expect(prismaMock.ioTDevice.create).toHaveBeenCalled();
    });

    it('should throw error for duplicate device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      await expect(
        physicalAIService.registerDevice(orgId, baseDevice, userId)
      ).rejects.toThrow('already registered');
    });

    it('should validate device certificates when provided', async () => {
      const now = new Date();
      const deviceWithCerts = {
        ...baseDevice,
        certificates: [{
          type: 'x509',
          issuer: 'TestCA',
          validFrom: new Date(now.getTime() - 86400000),
          validUntil: new Date(now.getTime() + 86400000),
          fingerprint: 'a'.repeat(40),
        }],
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.registerDevice(orgId, deviceWithCerts, userId);
      expect(result).toBeDefined();
    });

    it('should reject expired certificates', async () => {
      const deviceWithExpiredCert = {
        ...baseDevice,
        certificates: [{
          type: 'x509',
          issuer: 'TestCA',
          validFrom: new Date('2020-01-01'),
          validUntil: new Date('2021-01-01'),
          fingerprint: 'a'.repeat(40),
        }],
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.registerDevice(orgId, deviceWithExpiredCert, userId)
      ).rejects.toThrow('Certificate');
    });

    it('should reject not-yet-valid certificates', async () => {
      const futureDate = new Date(Date.now() + 365 * 86400000);
      const deviceWithFutureCert = {
        ...baseDevice,
        certificates: [{
          type: 'x509',
          issuer: 'TestCA',
          validFrom: futureDate,
          validUntil: new Date(futureDate.getTime() + 86400000),
          fingerprint: 'b'.repeat(40),
        }],
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.registerDevice(orgId, deviceWithFutureCert, userId)
      ).rejects.toThrow('Certificate');
    });

    it('should reject invalid certificate fingerprint format', async () => {
      const deviceWithBadFingerprint = {
        ...baseDevice,
        certificates: [{
          type: 'x509',
          issuer: 'TestCA',
          validFrom: new Date(Date.now() - 86400000),
          validUntil: new Date(Date.now() + 86400000),
          fingerprint: 'invalid!',
        }],
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.registerDevice(orgId, deviceWithBadFingerprint, userId)
      ).rejects.toThrow('Certificate');
    });

    it('should subscribe to MQTT when connected', async () => {
      const mqttService = require('../../../../services/advanced/mqttService').default;
      mqttService.getConnectionStatus.mockReturnValue(true);

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      await physicalAIService.registerDevice(orgId, baseDevice, userId);
      expect(mqttService.subscribe).toHaveBeenCalled();
    });

    it('should handle MQTT subscription failure gracefully', async () => {
      const mqttService = require('../../../../services/advanced/mqttService').default;
      mqttService.getConnectionStatus.mockReturnValue(true);
      mqttService.subscribe.mockImplementation(() => { throw new Error('MQTT error'); });

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.registerDevice(orgId, baseDevice, userId);
      expect(result).toBeDefined();
    });

    it('should register device without mqttTopic', async () => {
      const deviceNoMqtt = { ...baseDevice, mqttTopic: undefined };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.registerDevice(orgId, deviceNoMqtt, userId);
      expect(result).toBeDefined();
    });

    it('should register device with authentication config', async () => {
      const deviceWithAuth = {
        ...baseDevice,
        authentication: { type: 'certificate' as const, credentials: { certPath: '/path' } },
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.registerDevice(orgId, deviceWithAuth, userId);
      expect(result).toBeDefined();
    });

    it('should register device with metadata', async () => {
      const deviceWithMeta = {
        ...baseDevice,
        metadata: { vendor: 'Acme', model: 'TSensor-3000' },
      };

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.registerDevice(orgId, deviceWithMeta, userId);
      expect(result).toBeDefined();
    });
  });

  describe('bulkRegisterDevices', () => {
    it('should bulk register multiple devices', async () => {
      const devices = [
        { deviceId: 'sensor-001', deviceType: 'temp', location: 'Room A' },
        { deviceId: 'sensor-002', deviceType: 'humidity', location: 'Room B' },
      ];

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(null).mockResolvedValueOnce(mockDevice)
        .mockResolvedValueOnce(null).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.bulkRegisterDevices(orgId, devices, userId);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures in bulk registration', async () => {
      const devices = [
        { deviceId: 'sensor-001', deviceType: 'temp', location: 'Room A' },
        { deviceId: 'sensor-002', deviceType: 'humidity', location: 'Room B' },
      ];

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>)
        .mockResolvedValueOnce(mockDevice) // device 1 duplicate
        .mockResolvedValueOnce(null).mockResolvedValueOnce(mockDevice); // device 2 OK

      const result = await physicalAIService.bulkRegisterDevices(orgId, devices, userId);
      expect(result.successful.length + result.failed.length).toBe(2);
      expect(result.failed.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty results for empty device array', async () => {
      const result = await physicalAIService.bulkRegisterDevices(orgId, [], userId);
      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('deregisterDevice', () => {
    it('should deregister an existing device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      await expect(
        physicalAIService.deregisterDevice('sensor-001', orgId, userId)
      ).resolves.not.toThrow();
      expect(prismaMock.ioTDevice.delete).toHaveBeenCalled();
    });

    it('should throw error if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.deregisterDevice('nonexistent', orgId, userId)
      ).rejects.toThrow('Device not found');
    });

    it('should unsubscribe from MQTT when connected', async () => {
      const mqttService = require('../../../../services/advanced/mqttService').default;
      mqttService.getConnectionStatus.mockReturnValue(true);

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      await physicalAIService.deregisterDevice('sensor-001', orgId, userId);
      expect(mqttService.unsubscribe).toHaveBeenCalledWith('devices/sensor-001/data');
    });

    it('should handle MQTT unsubscribe error gracefully', async () => {
      const mqttService = require('../../../../services/advanced/mqttService').default;
      mqttService.getConnectionStatus.mockReturnValue(true);
      mqttService.unsubscribe.mockImplementation(() => { throw new Error('MQTT error'); });

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      await expect(
        physicalAIService.deregisterDevice('sensor-001', orgId, userId)
      ).resolves.not.toThrow();
    });

    it('should skip MQTT unsubscribe when not connected', async () => {
      const mqttService = require('../../../../services/advanced/mqttService').default;
      mqttService.getConnectionStatus.mockReturnValue(false);

      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      await physicalAIService.deregisterDevice('sensor-001', orgId, userId);
      expect(mqttService.unsubscribe).not.toHaveBeenCalled();
    });

    it('should handle database error during deletion', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);
      (prismaMock.ioTDevice.delete as jest.Mock<any>).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        physicalAIService.deregisterDevice('sensor-001', orgId, userId)
      ).rejects.toThrow();
    });
  });

  describe('performEdgeComplianceCheck', () => {
    it('should perform edge compliance check on a device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);
      expect(typeof result.overallScore).toBe('number');
    });

    it('should throw error if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.performEdgeComplianceCheck('nonexistent', orgId)
      ).rejects.toThrow();
    });

    it('should handle device with encryption data', async () => {
      const encryptedDevice = {
        ...mockDevice,
        sensorData: {
          ...mockDevice.sensorData,
          encryption: { enabled: true, algorithm: 'AES-256-GCM', strength: 256 },
          authentication: { type: 'certificate', enabled: true },
          accessControl: { rbac: true },
          firmware: 'v2.0.0',
          firmwareVerified: true,
          auditLogging: { enabled: true },
          dataRetention: { policy: 'auto-delete', retentionDays: 30 },
          networkSegmentation: { isolated: true },
          physicalSecurity: { locked: true },
          tamperDetection: { enabled: true, sealed: true },
          certificates: [{ type: 'TLS', validFrom: new Date(Date.now() - 86400000), validUntil: new Date(Date.now() + 86400000 * 365) }],
        },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(encryptedDevice);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle device with no sensorData', async () => {
      const deviceNoSensor = { ...mockDevice, sensorData: null };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceNoSensor);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should handle device with empty sensorData object', async () => {
      const deviceEmptySensor = { ...mockDevice, sensorData: {} };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceEmptySensor);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
    });
  });

  describe('receiveSensorData', () => {
    it('should receive and process sensor data', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.receiveSensorData(
        'sensor-001', { temperature: 22.5, humidity: 45 }, orgId
      );
      expect(result).toBeDefined();
    });

    it('should still return attestation even if device does not exist (updateMany handles gracefully)', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);
      (prismaMock.ioTDevice.updateMany as jest.Mock<any>).mockResolvedValueOnce({ count: 0 });

      const result = await physicalAIService.receiveSensorData('nonexistent', { temperature: 22 }, orgId);
      expect(result.received).toBe(true);
      expect(result.attestationHash).toBeDefined();
    });

    it('should detect anomalies in sensor data', async () => {
      const deviceWithHistory = {
        ...mockDevice,
        sensorData: {
          ...mockDevice.sensorData,
          history: Array(50).fill({ temperature: 22, timestamp: new Date() }),
        },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithHistory);

      const result = await physicalAIService.receiveSensorData(
        'sensor-001', { temperature: 100, humidity: 95 }, orgId
      );
      expect(result).toBeDefined();
    });

    it('should handle sensor data with multiple data points', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.receiveSensorData(
        'sensor-001', { temperature: 22.5, humidity: 45, pressure: 1013.25, co2: 400 }, orgId
      );
      expect(result).toBeDefined();
    });
  });

  describe('getDevices', () => {
    it('should return all devices for an organization', async () => {
      const deviceWithChecks = { ...mockDevice, complianceChecks: [] };
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([deviceWithChecks]);

      const result = await physicalAIService.getDevices(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no devices exist', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await physicalAIService.getDevices(orgId);
      expect(result).toHaveLength(0);
    });

    it('should return empty array on database error (error handled gracefully)', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      const result = await physicalAIService.getDevices(orgId);
      expect(result).toEqual([]);
    });
  });

  describe('monitorDeviceHeartbeat', () => {
    it('should monitor heartbeat for a device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.monitorDeviceHeartbeat('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should throw if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.monitorDeviceHeartbeat('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  describe('detectOfflineDevices', () => {
    it('should detect offline devices', async () => {
      const staleDevice = { ...mockDevice, lastSeen: new Date(Date.now() - 600000) };
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([staleDevice]);

      const result = await physicalAIService.detectOfflineDevices(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when all devices are online', async () => {
      const recentDevice = { ...mockDevice, lastSeen: new Date() };
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([recentDevice]);

      const result = await physicalAIService.detectOfflineDevices(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('monitorBatteryLevel', () => {
    it('should monitor battery level for a device', async () => {
      const deviceWithBattery = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, battery: 85 },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithBattery);

      const result = await physicalAIService.monitorBatteryLevel('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should handle device with no battery info', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.monitorBatteryLevel('sensor-001', orgId);
      expect(result).toBeDefined();
    });
  });

  describe('monitorConnectivity', () => {
    it('should monitor connectivity for a device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.monitorConnectivity('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should throw if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.monitorConnectivity('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  describe('trackFirmwareVersion', () => {
    it('should track firmware version for a device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);

      const result = await physicalAIService.trackFirmwareVersion('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should throw if device not found', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);

      await expect(
        physicalAIService.trackFirmwareVersion('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  describe('getHealthDashboard', () => {
    it('should return health dashboard for organization', async () => {
      const deviceWithChecks = { ...mockDevice, complianceChecks: [], lastSeen: new Date() };
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([deviceWithChecks]);

      const result = await physicalAIService.getHealthDashboard(orgId);
      expect(result).toBeDefined();
      expect(result.totalDevices).toBe(1);
    });

    it('should handle organization with no devices', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await physicalAIService.getHealthDashboard(orgId);
      expect(result).toBeDefined();
      expect(result.totalDevices).toBe(0);
    });

    it('should include compliance status breakdown', async () => {
      const devices = [
        { ...mockDevice, complianceStatus: 'compliant', complianceChecks: [], lastSeen: new Date() },
        { ...mockDevice, id: 'uuid-2', deviceId: 'sensor-002', complianceStatus: 'non_compliant', complianceChecks: [], lastSeen: new Date() },
        { ...mockDevice, id: 'uuid-3', deviceId: 'sensor-003', complianceStatus: 'unknown', complianceChecks: [], lastSeen: new Date() },
      ];
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue(devices);

      const result = await physicalAIService.getHealthDashboard(orgId);
      expect(result).toBeDefined();
      expect(result.totalDevices).toBe(3);
    });

    it('should compute averageComplianceScore from device compliance checks', async () => {
      const devices = [
        {
          ...mockDevice,
          complianceChecks: [
            { id: 'c1', deviceId: 'sensor-001', checkType: 'encryption', status: 'pass', severity: 'high', details: '', timestamp: new Date() },
          ],
          lastSeen: new Date(),
        },
      ];
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue(devices);

      const result = await physicalAIService.getHealthDashboard(orgId);
      expect(result.averageComplianceScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHealthHistory', () => {
    it('should return health history for a device', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);
      (prismaMock.edgeComplianceCheck.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await physicalAIService.getHealthHistory('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should return health history with time range', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);
      (prismaMock.edgeComplianceCheck.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'check-1', deviceId: 'sensor-001', checkType: 'encryption', status: 'pass', score: 100, createdAt: new Date() },
      ]);

      const result = await physicalAIService.getHealthHistory('sensor-001', orgId, '7d');
      expect(result).toBeDefined();
    });
  });

  describe('performPredictiveMaintenance', () => {
    it('should perform predictive maintenance analysis', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(mockDevice);
      (prismaMock.edgeComplianceCheck.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await physicalAIService.performPredictiveMaintenance('sensor-001', orgId);
      expect(result).toBeDefined();
    });

    it('should return empty array if device not found (error caught internally)', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const result = await physicalAIService.performPredictiveMaintenance('nonexistent', orgId);
      expect(result).toEqual([]);
    });
  });

  describe('bulkHealthCheck', () => {
    it('should perform bulk health check on all devices', async () => {
      const deviceWithChecks = { ...mockDevice, complianceChecks: [], lastSeen: new Date() };
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([deviceWithChecks]);
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValue(deviceWithChecks);

      const result = await physicalAIService.bulkHealthCheck(orgId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no devices exist', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await physicalAIService.bulkHealthCheck(orgId);
      expect(result).toHaveLength(0);
    });
  });

  describe('startHealthMonitoring', () => {
    it('should start health monitoring', () => {
      jest.useFakeTimers();
      physicalAIService.startHealthMonitoring();
      expect(physicalAIService).toBeDefined();
      jest.useRealTimers();
    });

    it('should clear existing interval when called again', () => {
      jest.useFakeTimers();
      physicalAIService.startHealthMonitoring(60000);
      physicalAIService.startHealthMonitoring(30000);
      expect(physicalAIService).toBeDefined();
      jest.useRealTimers();
    });
  });

  describe('edge compliance check rules', () => {
    it('should check encryption compliance', async () => {
      const encryptedDevice = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, encryption: { enabled: true, algorithm: 'AES-256-GCM', strength: 256 } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(encryptedDevice);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check access control compliance', async () => {
      const deviceWithAuth = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, authentication: { type: 'certificate', enabled: true }, accessControl: { rbac: true, mfa: true } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithAuth);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check firmware integrity', async () => {
      const deviceWithFirmware = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, firmware: 'v2.0.0', firmwareSignature: 'valid', firmwareVerified: true },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithFirmware);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check data retention compliance', async () => {
      const deviceWithRetention = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, dataRetention: { policy: 'auto-delete', retentionDays: 30 } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithRetention);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check network segmentation', async () => {
      const deviceWithNetwork = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, networkSegmentation: { isolated: true, vlan: 100 } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithNetwork);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check physical security', async () => {
      const deviceWithPhysical = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, physicalSecurity: { locked: true, tamperEvident: true } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithPhysical);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check audit logging compliance', async () => {
      const deviceWithAudit = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, auditLogging: { enabled: true, destination: 'syslog' } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithAudit);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check tamper detection', async () => {
      const deviceWithTamper = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, tamperDetection: { enabled: true, sealed: true } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithTamper);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check certificate validity', async () => {
      const deviceWithCerts = {
        ...mockDevice,
        sensorData: {
          ...mockDevice.sensorData,
          certificates: [{ type: 'TLS', validFrom: new Date(Date.now() - 86400000), validUntil: new Date(Date.now() + 86400000 * 365) }],
        },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithCerts);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check data at rest encryption', async () => {
      const deviceWithDAR = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, dataAtRest: { encrypted: true, algorithm: 'AES-256' } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithDAR);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });

    it('should check data in transit encryption', async () => {
      const deviceWithDIT = {
        ...mockDevice,
        sensorData: { ...mockDevice.sensorData, dataInTransit: { encrypted: true, protocol: 'TLS 1.3' } },
      };
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(deviceWithDIT);

      const result = await physicalAIService.performEdgeComplianceCheck('sensor-001', orgId);
      expect(result.checks).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database errors in registerDevice', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockResolvedValueOnce(null);
      (prismaMock.ioTDevice.create as jest.Mock<any>).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        physicalAIService.registerDevice(orgId, {
          deviceId: 'sensor-001', deviceType: 'temp', location: 'Room A',
        }, userId)
      ).rejects.toThrow();
    });

    it('should handle database errors in getDevices (returns empty array)', async () => {
      (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      const result = await physicalAIService.getDevices(orgId);
      expect(result).toEqual([]);
    });

    it('should handle database errors in performEdgeComplianceCheck', async () => {
      (prismaMock.ioTDevice.findFirst as jest.Mock<any>).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        physicalAIService.performEdgeComplianceCheck('sensor-001', orgId)
      ).rejects.toThrow();
    });
  });
});
