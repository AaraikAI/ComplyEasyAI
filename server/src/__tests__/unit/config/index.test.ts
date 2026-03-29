/**
 * Config Index Unit Tests
 * Tests for the main configuration object and validateConfig function
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Store original env
const originalEnv = { ...process.env };

// Mock dotenv to prevent loading from actual .env file
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Config Index', () => {
  beforeEach(() => {
    jest.resetModules();
    // Restore clean env state; keep test setup variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Config Object Structure', () => {
    it('should export a config object as default', () => {
      const config = require('../../../config/index').default;
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have server configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.server).toBeDefined();
      expect(config.server).toHaveProperty('port');
      expect(config.server).toHaveProperty('env');
      expect(config.server).toHaveProperty('apiUrl');
      expect(config.server).toHaveProperty('clientUrl');
    });

    it('should have database configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.database).toBeDefined();
      expect(config.database).toHaveProperty('url');
    });

    it('should have jwt configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.jwt).toBeDefined();
      expect(config.jwt).toHaveProperty('secret');
      expect(config.jwt).toHaveProperty('expiresIn');
      expect(config.jwt).toHaveProperty('refreshSecret');
      expect(config.jwt).toHaveProperty('refreshExpiresIn');
    });

    it('should have gemini configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.gemini).toBeDefined();
      expect(config.gemini).toHaveProperty('apiKey');
    });

    it('should have sendgrid configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.sendgrid).toBeDefined();
      expect(config.sendgrid).toHaveProperty('apiKey');
      expect(config.sendgrid).toHaveProperty('fromEmail');
      expect(config.sendgrid).toHaveProperty('fromName');
    });

    it('should have stripe configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.stripe).toBeDefined();
      expect(config.stripe).toHaveProperty('secretKey');
      expect(config.stripe).toHaveProperty('publishableKey');
      expect(config.stripe).toHaveProperty('webhookSecret');
      expect(config.stripe).toHaveProperty('priceIds');
      expect(config.stripe.priceIds).toHaveProperty('basic');
      expect(config.stripe.priceIds).toHaveProperty('pro');
      expect(config.stripe.priceIds).toHaveProperty('enterprise');
    });

    it('should have aws configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.aws).toBeDefined();
      expect(config.aws).toHaveProperty('accessKeyId');
      expect(config.aws).toHaveProperty('secretAccessKey');
      expect(config.aws).toHaveProperty('region');
      expect(config.aws).toHaveProperty('s3Bucket');
    });

    it('should have oauth configuration section with all providers', () => {
      const config = require('../../../config/index').default;
      expect(config.oauth).toBeDefined();
      expect(config.oauth).toHaveProperty('google');
      expect(config.oauth).toHaveProperty('github');
      expect(config.oauth).toHaveProperty('slack');
      expect(config.oauth).toHaveProperty('jira');

      for (const provider of ['google', 'github', 'slack', 'jira'] as const) {
        expect(config.oauth[provider]).toHaveProperty('clientId');
        expect(config.oauth[provider]).toHaveProperty('clientSecret');
        expect(config.oauth[provider]).toHaveProperty('callbackUrl');
      }
    });

    it('should have security configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.security).toBeDefined();
      expect(config.security).toHaveProperty('rateLimitWindowMs');
      expect(config.security).toHaveProperty('rateLimitMaxRequests');
      expect(config.security).toHaveProperty('corsOrigin');
    });

    it('should have logging configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.logging).toBeDefined();
      expect(config.logging).toHaveProperty('level');
    });

    it('should have mqtt configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.mqtt).toBeDefined();
      expect(config.mqtt).toHaveProperty('brokerUrl');
      expect(config.mqtt).toHaveProperty('clientId');
    });

    it('should have openai configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.openai).toBeDefined();
      expect(config.openai).toHaveProperty('apiKey');
    });

    it('should have euAiDb configuration section', () => {
      const config = require('../../../config/index').default;
      expect(config.euAiDb).toBeDefined();
      expect(config.euAiDb).toHaveProperty('apiBaseUrl');
      expect(config.euAiDb).toHaveProperty('clientId');
      expect(config.euAiDb).toHaveProperty('clientSecret');
      expect(config.euAiDb).toHaveProperty('orgId');
    });
  });

  describe('Default Values', () => {
    beforeEach(() => {
      // Clear env vars that have defaults to test fallback values
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.API_URL;
      delete process.env.CLIENT_URL;
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_REFRESH_EXPIRES_IN;
      delete process.env.SENDGRID_FROM_NAME;
      delete process.env.STRIPE_BASIC_PRICE_ID;
      delete process.env.STRIPE_PRO_PRICE_ID;
      delete process.env.STRIPE_ENTERPRISE_PRICE_ID;
      delete process.env.AWS_REGION;
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      delete process.env.CORS_ORIGIN;
      delete process.env.LOG_LEVEL;
      delete process.env.MQTT_BROKER_URL;
      delete process.env.MQTT_CLIENT_ID;
      jest.resetModules();
    });

    it('should default server port to 3001', () => {
      const config = require('../../../config/index').default;
      expect(config.server.port).toBe(3001);
    });

    it('should default server env to "development"', () => {
      const config = require('../../../config/index').default;
      expect(config.server.env).toBe('development');
    });

    it('should default apiUrl to localhost:3001', () => {
      const config = require('../../../config/index').default;
      expect(config.server.apiUrl).toBe('http://localhost:3001');
    });

    it('should default clientUrl to localhost:3000', () => {
      const config = require('../../../config/index').default;
      expect(config.server.clientUrl).toBe('http://localhost:3000');
    });

    it('should default JWT expiresIn to "15m"', () => {
      const config = require('../../../config/index').default;
      expect(config.jwt.expiresIn).toBe('15m');
    });

    it('should default JWT refresh expiresIn to "30d"', () => {
      const config = require('../../../config/index').default;
      expect(config.jwt.refreshExpiresIn).toBe('30d');
    });

    it('should default SendGrid from name to "ComplyEasy AI"', () => {
      const config = require('../../../config/index').default;
      expect(config.sendgrid.fromName).toBe('ComplyEasy AI');
    });

    it('should default Stripe price IDs to "Contact Us"', () => {
      const config = require('../../../config/index').default;
      expect(config.stripe.priceIds.basic).toBe('Contact Us');
      expect(config.stripe.priceIds.pro).toBe('Contact Us');
      expect(config.stripe.priceIds.enterprise).toBe('Contact Us');
    });

    it('should default AWS region to us-east-1', () => {
      const config = require('../../../config/index').default;
      expect(config.aws.region).toBe('us-east-1');
    });

    it('should default rate limit window to 900000ms', () => {
      const config = require('../../../config/index').default;
      expect(config.security.rateLimitWindowMs).toBe(900000);
    });

    it('should default rate limit max requests to 100', () => {
      const config = require('../../../config/index').default;
      expect(config.security.rateLimitMaxRequests).toBe(100);
    });

    it('should default CORS origin to empty array when CORS_ORIGIN not set', () => {
      const config = require('../../../config/index').default;
      expect(config.security.corsOrigin).toEqual([]);
    });

    it('should default logging level to "info"', () => {
      const config = require('../../../config/index').default;
      expect(config.logging.level).toBe('info');
    });

    it('should default MQTT broker URL to localhost:1883', () => {
      const config = require('../../../config/index').default;
      expect(config.mqtt.brokerUrl).toBe('mqtt://localhost:1883');
    });

    it('should generate dynamic MQTT client ID with complyeasy prefix', () => {
      const config = require('../../../config/index').default;
      expect(config.mqtt.clientId).toMatch(/^complyeasy-\d+$/);
    });

    it('should default empty strings for optional API keys', () => {
      const config = require('../../../config/index').default;
      expect(config.openai.apiKey).toBe('');
      expect(config.euAiDb.apiBaseUrl).toBe('');
    });
  });

  describe('Environment Variable Loading', () => {
    it('should load PORT from environment', () => {
      process.env.PORT = '8080';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.server.port).toBe(8080);
    });

    it('should parse PORT as integer', () => {
      process.env.PORT = '5000';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(typeof config.server.port).toBe('number');
      expect(config.server.port).toBe(5000);
    });

    it('should load NODE_ENV from environment', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.server.env).toBe('production');
    });

    it('should load DATABASE_URL from environment', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/mydb';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.database.url).toBe('postgresql://user:pass@db:5432/mydb');
    });

    it('should load JWT secrets from environment', () => {
      process.env.JWT_SECRET = 'my-super-secret-jwt-key';
      process.env.JWT_REFRESH_SECRET = 'my-super-secret-refresh-key';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.jwt.secret).toBe('my-super-secret-jwt-key');
      expect(config.jwt.refreshSecret).toBe('my-super-secret-refresh-key');
    });

    it('should load rate limit values as integers', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '50';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.security.rateLimitWindowMs).toBe(60000);
      expect(config.security.rateLimitMaxRequests).toBe(50);
      expect(typeof config.security.rateLimitWindowMs).toBe('number');
      expect(typeof config.security.rateLimitMaxRequests).toBe('number');
    });

    it('should load MQTT username and password when provided', () => {
      process.env.MQTT_USERNAME = 'mqtt_user';
      process.env.MQTT_PASSWORD = 'mqtt_pass';
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.mqtt.username).toBe('mqtt_user');
      expect(config.mqtt.password).toBe('mqtt_pass');
    });

    it('should leave MQTT username and password undefined when not set', () => {
      delete process.env.MQTT_USERNAME;
      delete process.env.MQTT_PASSWORD;
      jest.resetModules();

      const config = require('../../../config/index').default;
      expect(config.mqtt.username).toBeUndefined();
      expect(config.mqtt.password).toBeUndefined();
    });
  });

  describe('validateConfig()', () => {
    it('should export validateConfig as a named export', () => {
      const { validateConfig } = require('../../../config/index');
      expect(validateConfig).toBeDefined();
      expect(typeof validateConfig).toBe('function');
    });

    it('should not throw when all required env vars are present and valid', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should throw when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('DATABASE_URL is required');
    });

    it('should throw when DATABASE_URL is not a PostgreSQL URL', () => {
      process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('DATABASE_URL must be a valid PostgreSQL connection string');
    });

    it('should throw when JWT_SECRET is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      delete process.env.JWT_SECRET;
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('JWT_SECRET is required');
    });

    it('should throw when JWT_SECRET is too short (< 32 chars)', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'short';
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('should throw when JWT_REFRESH_SECRET is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      delete process.env.JWT_REFRESH_SECRET;
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('JWT_REFRESH_SECRET is required');
    });

    it('should throw when JWT_REFRESH_SECRET is too short', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'short';
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('JWT_REFRESH_SECRET must be at least 32 characters');
    });

    it('should throw when ENCRYPTION_KEY is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      delete process.env.ENCRYPTION_KEY;
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('ENCRYPTION_KEY is required');
    });

    it('should throw when ENCRYPTION_KEY is too short (< 32 chars)', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'short';
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('ENCRYPTION_KEY must be at least 32 characters');
    });

    it('should throw when GEMINI_API_KEY is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      delete process.env.GEMINI_API_KEY;
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('GEMINI_API_KEY is required');
    });

    it('should throw when SENDGRID_API_KEY is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      delete process.env.SENDGRID_API_KEY;
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('SENDGRID_API_KEY is required');
    });

    it('should throw when SENDGRID_API_KEY does not start with "SG."', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'invalid-key';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('SENDGRID_API_KEY must start with "SG."');
    });

    it('should throw when SENDGRID_FROM_EMAIL is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      delete process.env.SENDGRID_FROM_EMAIL;
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('SENDGRID_FROM_EMAIL is required');
    });

    it('should throw when SENDGRID_FROM_EMAIL is not a valid email', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'not-an-email';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('SENDGRID_FROM_EMAIL must be a valid email');
    });

    it('should throw when STRIPE_SECRET_KEY has invalid format', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.STRIPE_SECRET_KEY = 'invalid_key';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('STRIPE_SECRET_KEY must start with "sk_"');
    });

    it('should throw when STRIPE_WEBHOOK_SECRET has invalid format', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid';
      process.env.STRIPE_WEBHOOK_SECRET = 'invalid_secret';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
    });

    it('should throw when CORS_ORIGIN is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      delete process.env.CORS_ORIGIN;
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('CORS_ORIGIN is required');
    });

    it('should warn about missing STRIPE_SECRET_KEY in non-production', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      delete process.env.STRIPE_SECRET_KEY;
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const { validateConfig } = require('../../../config/index');
      validateConfig();

      expect(stdoutSpy).toHaveBeenCalled();
      stdoutSpy.mockRestore();
    });

    it('should warn about missing AWS keys in non-production', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_S3_BUCKET;
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const { validateConfig } = require('../../../config/index');
      validateConfig();

      expect(stdoutSpy).toHaveBeenCalled();
      stdoutSpy.mockRestore();
    });

    it('should accumulate multiple errors in a single throw', () => {
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      delete process.env.ENCRYPTION_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_FROM_EMAIL;
      delete process.env.CORS_ORIGIN;
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      expect(() => validateConfig()).toThrow('Configuration validation failed');
    });

    it('should not show warnings in production environment', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.SENDGRID_API_KEY = 'SG.testkey';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      process.env.REDIS_URL = 'redis://localhost:6379';
      delete process.env.STRIPE_SECRET_KEY;
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const { validateConfig } = require('../../../config/index');
      validateConfig();

      // In production, warnings should be suppressed
      const warnCalls = stdoutSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Configuration Warnings')
      );
      expect(warnCalls.length).toBe(0);
      stdoutSpy.mockRestore();
    });

    it('should include help text in error message', () => {
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      jest.resetModules();

      const { validateConfig } = require('../../../config/index');
      try {
        validateConfig();
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('npm run validate:env');
        expect(err.message).toContain('ENVIRONMENT_VARIABLES.md');
      }
    });
  });
});
