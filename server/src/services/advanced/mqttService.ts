/**
 * MQTT Service for IoT Device Integration
 * 
 * Features:
 * - MQTT broker connection
 * - Device management
 * - Real-time sensor data streaming
 * - Topic-based messaging
 */

import mqtt, { MqttClient } from 'mqtt';
import logger from '../../config/logger';
import prisma from '../../config/database';
import physicalAIService from './physicalAIService';

export interface MQTTConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId: string;
  keepalive?: number;
  reconnectPeriod?: number;
}

export interface DeviceMessage {
  deviceId: string;
  topic: string;
  payload: any;
  timestamp: Date;
}

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected = false;
  private subscriptions: Map<string, (message: DeviceMessage) => void> = new Map();

  /**
   * Connect to MQTT broker
   */
  async connect(config: MQTTConfig): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        logger.info('[MQTT] Already connected');
        return;
      }

      const options: mqtt.IClientOptions = {
        clientId: config.clientId,
        username: config.username,
        password: config.password,
        keepalive: config.keepalive || 60,
        reconnectPeriod: config.reconnectPeriod || 1000,
        clean: true,
      };

      logger.info(`[MQTT] Connecting to broker: ${config.brokerUrl}`);

      this.client = mqtt.connect(config.brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('[MQTT] Connected to broker successfully');
        this.setupDefaultSubscriptions();
      });

      this.client.on('error', (error) => {
        logger.error('[MQTT] Connection error', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('[MQTT] Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        logger.info('[MQTT] Reconnecting...');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        if (!this.client) {
          reject(new Error('MQTT client not initialized'));
          return;
        }

        this.client.once('connect', () => {
          resolve();
        });

        this.client.once('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      logger.error('[MQTT] Error connecting to broker', error);
      throw error;
    }
  }

  /**
   * Setup default subscriptions
   */
  private setupDefaultSubscriptions(): void {
    if (!this.client) {
      return;
    }

    // Subscribe to device data topics
    this.subscribe('devices/+/data', (message) => {
      this.handleDeviceData(message);
    });

    // Subscribe to device status topics
    this.subscribe('devices/+/status', (message) => {
      this.handleDeviceStatus(message);
    });

    // Subscribe to compliance check topics
    this.subscribe('devices/+/compliance', (message) => {
      this.handleComplianceCheck(message);
    });
  }

  /**
   * Subscribe to a topic
   */
  subscribe(
    topic: string,
    callback: (message: DeviceMessage) => void
  ): void {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    this.client.subscribe(topic, (error) => {
      if (error) {
        logger.error(`[MQTT] Error subscribing to ${topic}`, error);
        return;
      }

      logger.info(`[MQTT] Subscribed to topic: ${topic}`);
      this.subscriptions.set(topic, callback);
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): void {
    if (!this.client || !this.isConnected) {
      return;
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        logger.error(`[MQTT] Error unsubscribing from ${topic}`, error);
        return;
      }

      logger.info(`[MQTT] Unsubscribed from topic: ${topic}`);
      this.subscriptions.delete(topic);
    });
  }

  /**
   * Publish message to a topic
   */
  publish(topic: string, payload: any, options?: { qos?: 0 | 1 | 2; retain?: boolean }): void {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    const message = JSON.stringify(payload);
    this.client.publish(topic, message, options || {}, (error) => {
      if (error) {
        logger.error(`[MQTT] Error publishing to ${topic}`, error);
        return;
      }

      logger.debug(`[MQTT] Published to ${topic}`);
    });
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      const deviceMessage: DeviceMessage = {
        deviceId: this.extractDeviceId(topic),
        topic,
        payload,
        timestamp: new Date(),
      };

      // Find matching subscription callback
      for (const [subTopic, callback] of this.subscriptions.entries()) {
        if (this.topicMatches(subTopic, topic)) {
          callback(deviceMessage);
          return;
        }
      }

      logger.debug(`[MQTT] No handler for topic: ${topic}`);
    } catch (error) {
      logger.error(`[MQTT] Error handling message from ${topic}`, error);
    }
  }

  /**
   * Check if topic matches subscription pattern
   */
  private topicMatches(pattern: string, topic: string): boolean {
    // Simple wildcard matching: + matches single level, # matches multiple levels
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length !== topicParts.length && !pattern.includes('#')) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') {
        return true; // Multi-level wildcard matches rest
      }
      if (patternParts[i] === '+') {
        continue; // Single-level wildcard matches any
      }
      if (patternParts[i] !== topicParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract device ID from topic
   */
  private extractDeviceId(topic: string): string {
    const parts = topic.split('/');
    if (parts.length >= 2 && parts[0] === 'devices') {
      return parts[1];
    }
    return 'unknown';
  }

  /**
   * Handle device data message
   */
  private async handleDeviceData(message: DeviceMessage): Promise<void> {
    try {
      const { deviceId, payload } = message;

      // Find device in database
      const device = await prisma.ioTDevice.findFirst({
        where: {
          deviceId,
        },
      });

      if (!device) {
        logger.warn(`[MQTT] Device not found: ${deviceId}`);
        return;
      }

      // Update device sensor data
      await prisma.ioTDevice.update({
        where: { id: device.id },
        data: {
          sensorData: payload,
          lastSeen: new Date(),
        },
      });

      // Process sensor data for compliance
      await physicalAIService.receiveSensorData(
        deviceId,
        payload,
        device.organizationId
      );

      logger.debug(`[MQTT] Processed device data from ${deviceId}`);
    } catch (error) {
      logger.error('[MQTT] Error handling device data', error);
    }
  }

  /**
   * Handle device status message
   */
  private async handleDeviceStatus(message: DeviceMessage): Promise<void> {
    try {
      const { deviceId, payload } = message;

      const device = await prisma.ioTDevice.findFirst({
        where: { deviceId },
      });

      if (!device) {
        return;
      }

      await prisma.ioTDevice.update({
        where: { id: device.id },
        data: {
          complianceStatus: payload.status || 'unknown',
          lastSeen: new Date(),
        },
      });

      logger.debug(`[MQTT] Updated device status for ${deviceId}`);
    } catch (error) {
      logger.error('[MQTT] Error handling device status', error);
    }
  }

  /**
   * Handle compliance check message
   */
  private async handleComplianceCheck(message: DeviceMessage): Promise<void> {
    try {
      const { deviceId, payload } = message;

      const device = await prisma.ioTDevice.findFirst({
        where: { deviceId },
      });

      if (!device) {
        return;
      }

      // Store compliance check result
      await prisma.edgeComplianceCheck.create({
        data: {
          deviceId: device.id,
          organizationId: device.organizationId,
          checkType: payload.checkType || 'general',
          status: payload.status || 'unknown',
          details: payload.details || 'Compliance check performed',
        },
      });

      logger.debug(`[MQTT] Stored compliance check for ${deviceId}`);
    } catch (error) {
      logger.error('[MQTT] Error handling compliance check', error);
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      this.subscriptions.clear();
      logger.info('[MQTT] Disconnected from broker');
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default new MQTTService();

