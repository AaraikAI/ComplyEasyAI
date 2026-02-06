/**
 * MQTT Service Unit Tests
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

jest.mock('../../../../services/advanced/physicalAIService', () => ({
  __esModule: true,
  default: {
    receiveSensorData: jest.fn<any>().mockResolvedValue({}),
    getDevices: jest.fn<any>().mockResolvedValue([]),
  },
}));

// Mock mqtt module
const mockMqttClient = {
  on: jest.fn<any>().mockReturnThis(),
  once: jest.fn<any>().mockImplementation(function (this: any, event: string, cb: (...args: any[]) => void) {
    if (event === 'connect') {
      setTimeout(() => cb(), 10);
    }
    return this;
  }),
  subscribe: jest.fn<any>().mockImplementation((_topic: string, cb: (err: Error | null) => void) => {
    cb(null);
  }),
  unsubscribe: jest.fn<any>().mockImplementation((_topic: string, cb: (err: Error | null) => void) => {
    cb(null);
  }),
  publish: jest.fn<any>().mockImplementation((_topic: string, _msg: string, _opts: any, cb: (err: Error | null) => void) => {
    if (cb) cb(null);
  }),
  end: jest.fn(),
  connected: true,
};

jest.mock('mqtt', () => ({
  connect: jest.fn<any>().mockReturnValue(mockMqttClient),
}));

import mqttService from '../../../../services/advanced/mqttService';

describe('MQTTService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations (cleared by resetMocks)
    const mqtt = require('mqtt');
    mqtt.connect.mockReturnValue(mockMqttClient);

    mockMqttClient.on.mockReturnThis();
    mockMqttClient.once.mockImplementation(function (this: any, event: string, cb: (...args: any[]) => void) {
      if (event === 'connect') {
        setTimeout(() => cb(), 10);
      }
      return this;
    });
    mockMqttClient.subscribe.mockImplementation((_topic: string, cb: (err: Error | null) => void) => {
      cb(null);
    });
    mockMqttClient.unsubscribe.mockImplementation((_topic: string, cb: (err: Error | null) => void) => {
      cb(null);
    });
    mockMqttClient.publish.mockImplementation((_topic: string, _msg: string, _opts: any, cb: (err: Error | null) => void) => {
      if (cb) cb(null);
    });
    mockMqttClient.end.mockImplementation(() => {});
    mockMqttClient.connected = true;

    const physicalAIService = require('../../../../services/advanced/physicalAIService').default;
    physicalAIService.receiveSensorData.mockResolvedValue({});
    physicalAIService.getDevices.mockResolvedValue([]);

    // Reset internal state by accessing private properties
    (mqttService as any).client = null;
    (mqttService as any).isConnected = false;
    (mqttService as any).subscriptions = new Map();
  });

  describe('connect', () => {
    it('should connect to MQTT broker', async () => {
      const config = {
        brokerUrl: 'mqtt://localhost:1883',
        clientId: 'test-client',
        username: 'user',
        password: 'pass',
      };

      // The connect method sets up events and waits for 'connect' event
      await mqttService.connect(config);

      expect((mqttService as any).isConnected).toBe(true);
    });

    it('should skip connection if already connected', async () => {
      (mqttService as any).client = mockMqttClient;
      (mqttService as any).isConnected = true;

      const config = {
        brokerUrl: 'mqtt://localhost:1883',
        clientId: 'test-client',
      };

      await mqttService.connect(config);
      // Should return early without error
    });
  });

  describe('subscribe', () => {
    it('should throw error if not connected', () => {
      expect(() => {
        mqttService.subscribe('test/topic', () => {});
      }).toThrow('MQTT client not connected');
    });

    it('should subscribe to a topic when connected', () => {
      (mqttService as any).client = mockMqttClient;
      (mqttService as any).isConnected = true;

      const callback = jest.fn();
      mqttService.subscribe('devices/+/data', callback);

      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        'devices/+/data',
        expect.any(Function)
      );
    });
  });

  describe('unsubscribe', () => {
    it('should do nothing if not connected', () => {
      mqttService.unsubscribe('test/topic');
      // Should not throw
    });

    it('should unsubscribe from a topic when connected', () => {
      (mqttService as any).client = mockMqttClient;
      (mqttService as any).isConnected = true;
      (mqttService as any).subscriptions.set('test/topic', jest.fn());

      mqttService.unsubscribe('test/topic');

      expect(mockMqttClient.unsubscribe).toHaveBeenCalledWith(
        'test/topic',
        expect.any(Function)
      );
    });
  });

  describe('publish', () => {
    it('should throw error if not connected', () => {
      expect(() => {
        mqttService.publish('test/topic', { data: 'test' });
      }).toThrow('MQTT client not connected');
    });

    it('should publish a message when connected', () => {
      (mqttService as any).client = mockMqttClient;
      (mqttService as any).isConnected = true;

      mqttService.publish('devices/sensor1/data', { temperature: 25 });

      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        'devices/sensor1/data',
        JSON.stringify({ temperature: 25 }),
        {},
        expect.any(Function)
      );
    });

    it('should publish with QoS and retain options', () => {
      (mqttService as any).client = mockMqttClient;
      (mqttService as any).isConnected = true;

      mqttService.publish('test/topic', { data: 1 }, { qos: 1, retain: true });

      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        'test/topic',
        expect.any(String),
        { qos: 1, retain: true },
        expect.any(Function)
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect the client', () => {
      (mqttService as any).client = mockMqttClient;
      (mqttService as any).isConnected = true;

      mqttService.disconnect();

      expect(mockMqttClient.end).toHaveBeenCalled();
    });

    it('should handle disconnect when no client', () => {
      (mqttService as any).client = null;

      mqttService.disconnect();
      // Should not throw
    });
  });

  describe('getConnectionStatus', () => {
    it('should return false when not connected', () => {
      expect(mqttService.getConnectionStatus()).toBe(false);
    });

    it('should return true when connected', () => {
      (mqttService as any).isConnected = true;

      expect(mqttService.getConnectionStatus()).toBe(true);
    });
  });
});
