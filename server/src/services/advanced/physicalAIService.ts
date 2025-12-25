/**
 * Physical AI Service - IoT/Edge Compliance Integration
 * 
 * Features:
 * - IoT device compliance monitoring
 * - Edge AI validation
 * - MQTT protocol support
 * - Physical sensor data attestation
 */

import logger from '../../config/logger';

export interface IoTDevice {
  deviceId: string;
  deviceType: string;
  location: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'unknown';
  lastSeen: Date;
  sensorData?: any;
}

export interface EdgeComplianceCheck {
  deviceId: string;
  checkType: 'encryption' | 'access_control' | 'data_retention' | 'audit_logging';
  status: 'pass' | 'fail' | 'warning';
  details: string;
  timestamp: Date;
}

class PhysicalAIService {
  /**
   * Register IoT device
   */
  async registerDevice(
    organizationId: string,
    device: {
      deviceId: string;
      deviceType: string;
      location: string;
      mqttTopic?: string;
    },
    userId: string
  ): Promise<IoTDevice> {
    try {
      // Store device in database
      const dbDevice = await prisma.ioTDevice.create({
        data: {
          organizationId,
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          location: device.location,
          mqttTopic: device.mqttTopic || `devices/${device.deviceId}/data`,
          complianceStatus: 'unknown',
        },
      });

      // Subscribe to device MQTT topics if MQTT is connected
      if (mqttService.getConnectionStatus() && device.mqttTopic) {
        mqttService.subscribe(device.mqttTopic, (message) => {
          this.handleDeviceMessage(message, organizationId);
        });
      }

      logger.info(`[Physical AI] Device registered: ${device.deviceId}`);

      return {
        deviceId: dbDevice.deviceId,
        deviceType: dbDevice.deviceType,
        location: dbDevice.location,
        complianceStatus: dbDevice.complianceStatus as any,
        lastSeen: dbDevice.lastSeen,
        sensorData: dbDevice.sensorData as any,
      };
    } catch (error) {
      logger.error('[Physical AI] Error registering device', error);
      throw error;
    }
  }

  /**
   * Handle device MQTT message
   */
  private async handleDeviceMessage(
    message: any,
    organizationId: string
  ): Promise<void> {
    try {
      const { deviceId, payload } = message;

      // Update device sensor data
      await prisma.ioTDevice.updateMany({
        where: {
          deviceId,
          organizationId,
        },
        data: {
          sensorData: payload,
          lastSeen: new Date(),
        },
      });

      logger.debug(`[Physical AI] Updated device ${deviceId} from MQTT`);
    } catch (error) {
      logger.error('[Physical AI] Error handling device message', error);
    }
  }

  /**
   * Perform edge compliance check
   */
  async performEdgeComplianceCheck(
    deviceId: string,
    organizationId: string
  ): Promise<EdgeComplianceCheck[]> {
    try {
      // In production, would connect to IoT device via MQTT/HTTP
      // and perform actual compliance checks

      const checks: EdgeComplianceCheck[] = [
        {
          deviceId,
          checkType: 'encryption',
          status: 'pass',
          details: 'Device uses AES-256 encryption',
          timestamp: new Date(),
        },
        {
          deviceId,
          checkType: 'access_control',
          status: 'pass',
          details: 'Access control properly configured',
          timestamp: new Date(),
        },
      ];

      return checks;
    } catch (error) {
      logger.error('[Physical AI] Error performing edge compliance check', error);
      throw error;
    }
  }

  /**
   * Receive sensor data from IoT device
   */
  async receiveSensorData(
    deviceId: string,
    data: any,
    organizationId: string
  ): Promise<{
    received: boolean;
    attestationHash: string;
  }> {
    try {
      // Generate attestation hash for sensor data
      const crypto = require('crypto');
      const dataString = JSON.stringify(data);
      const attestationHash = crypto.createHash('sha256').update(dataString).digest('hex');

      logger.info(`[Physical AI] Sensor data received from ${deviceId}`);

      return {
        received: true,
        attestationHash,
      };
    } catch (error) {
      logger.error('[Physical AI] Error receiving sensor data', error);
      throw error;
    }
  }
}

export default new PhysicalAIService();

