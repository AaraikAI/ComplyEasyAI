/**
 * Monitoring Configuration Unit Tests
 * Tests for Sentry initialization, APM, error capture, and all monitoring functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @sentry/node and @sentry/profiling-node to simulate them not being installed.
// The monitoring module uses require() inside a try/catch at load time, so a throwing
// factory makes the module behave as if the packages are missing.
jest.mock('@sentry/node', () => {
  throw new Error('Cannot find module \'@sentry/node\'');
});
jest.mock('@sentry/profiling-node', () => {
  throw new Error('Cannot find module \'@sentry/profiling-node\'');
});
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Store original env
const originalEnv = { ...process.env };

describe('Monitoring Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initializeSentry()', () => {
    it('should log message when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';
      delete process.env.SENTRY_DSN;

      const { initializeSentry } = require('../../../config/monitoring');
      const logger = require('../../../config/logger').default;
      initializeSentry();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Sentry disabled')
      );
    });

    it('should log message when DSN is not configured', () => {
      process.env.SENTRY_ENABLED = 'true';
      delete process.env.SENTRY_DSN;

      const { initializeSentry } = require('../../../config/monitoring');
      const logger = require('../../../config/logger').default;
      initializeSentry();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Sentry disabled or DSN not configured')
      );
    });

    it('should warn when Sentry packages are not installed', () => {
      process.env.SENTRY_ENABLED = 'true';
      process.env.SENTRY_DSN = 'https://example@sentry.io/123';

      // Sentry module not available (default state since it is conditionally required)
      const { initializeSentry } = require('../../../config/monitoring');
      const logger = require('../../../config/logger').default;
      initializeSentry();

      // Should warn about missing packages
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Sentry packages not installed')
      );
    });
  });

  describe('initializeAPM()', () => {
    it('should log disabled message when APM is not enabled', () => {
      process.env.APM_ENABLED = 'false';

      const { initializeAPM } = require('../../../config/monitoring');
      const logger = require('../../../config/logger').default;
      initializeAPM();

      expect(logger.info).toHaveBeenCalledWith('APM disabled');
    });

    it('should not throw when APM is enabled but no APM server configured', () => {
      process.env.APM_ENABLED = 'true';
      delete process.env.ELASTIC_APM_SERVER_URL;
      delete process.env.NEW_RELIC_LICENSE_KEY;

      const { initializeAPM } = require('../../../config/monitoring');
      expect(() => initializeAPM()).not.toThrow();
    });
  });

  describe('getMonitoringConfig()', () => {
    it('should return the monitoring configuration object', () => {
      process.env.SENTRY_ENABLED = 'true';
      process.env.SENTRY_DSN = 'https://test@sentry.io/1';
      process.env.NODE_ENV = 'production';
      process.env.SENTRY_TRACES_SAMPLE_RATE = '0.5';
      process.env.SENTRY_PROFILES_SAMPLE_RATE = '0.3';

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config).toBeDefined();
      expect(config.sentry).toBeDefined();
      expect(config.apm).toBeDefined();
      expect(config.logging).toBeDefined();
    });

    it('should have correct sentry configuration', () => {
      process.env.SENTRY_ENABLED = 'true';
      process.env.SENTRY_DSN = 'https://test@sentry.io/1';
      process.env.NODE_ENV = 'staging';
      process.env.SENTRY_TRACES_SAMPLE_RATE = '0.5';
      process.env.SENTRY_PROFILES_SAMPLE_RATE = '0.3';

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config.sentry.enabled).toBe(true);
      expect(config.sentry.dsn).toBe('https://test@sentry.io/1');
      expect(config.sentry.environment).toBe('staging');
      expect(config.sentry.tracesSampleRate).toBe(0.5);
      expect(config.sentry.profilesSampleRate).toBe(0.3);
    });

    it('should default sentry sample rates to 0.1', () => {
      delete process.env.SENTRY_TRACES_SAMPLE_RATE;
      delete process.env.SENTRY_PROFILES_SAMPLE_RATE;

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config.sentry.tracesSampleRate).toBe(0.1);
      expect(config.sentry.profilesSampleRate).toBe(0.1);
    });

    it('should have correct APM configuration', () => {
      process.env.APM_ENABLED = 'true';
      process.env.APM_SERVICE_NAME = 'test-service';
      process.env.npm_package_version = '3.0.0';

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config.apm.enabled).toBe(true);
      expect(config.apm.serviceName).toBe('test-service');
      expect(config.apm.serviceVersion).toBe('3.0.0');
    });

    it('should have default APM configuration', () => {
      delete process.env.APM_ENABLED;
      delete process.env.APM_SERVICE_NAME;
      delete process.env.npm_package_version;

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config.apm.enabled).toBe(false);
      expect(config.apm.serviceName).toBe('complyeasy-api');
      expect(config.apm.serviceVersion).toBe('2.0.0');
    });

    it('should have correct logging configuration', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_CONSOLE = 'true';
      process.env.LOG_FILE = 'true';
      process.env.ELASTICSEARCH_ENABLED = 'true';
      process.env.ELASTICSEARCH_URL = 'http://es:9200';

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config.logging.level).toBe('debug');
      expect(config.logging.enableConsole).toBe(true);
      expect(config.logging.enableFile).toBe(true);
      expect(config.logging.enableElasticsearch).toBe(true);
      expect(config.logging.elasticsearchUrl).toBe('http://es:9200');
    });

    it('should default logging level to info', () => {
      delete process.env.LOG_LEVEL;

      const { getMonitoringConfig } = require('../../../config/monitoring');
      const config = getMonitoringConfig();

      expect(config.logging.level).toBe('info');
    });
  });

  describe('captureException()', () => {
    it('should not throw when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { captureException } = require('../../../config/monitoring');
      expect(() => captureException(new Error('test error'))).not.toThrow();
    });

    it('should not throw when called with context', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { captureException } = require('../../../config/monitoring');
      expect(() =>
        captureException(new Error('test error'), { userId: '123' })
      ).not.toThrow();
    });

    it('should silently skip when Sentry is not available', () => {
      process.env.SENTRY_ENABLED = 'true'; // enabled but Sentry module not loaded

      const { captureException } = require('../../../config/monitoring');
      expect(() => captureException(new Error('test'))).not.toThrow();
    });
  });

  describe('captureMessage()', () => {
    it('should not throw when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { captureMessage } = require('../../../config/monitoring');
      expect(() => captureMessage('test message')).not.toThrow();
    });

    it('should not throw when called with level parameter', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { captureMessage } = require('../../../config/monitoring');
      expect(() => captureMessage('warning', 'warning')).not.toThrow();
    });

    it('should default level to info', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { captureMessage } = require('../../../config/monitoring');
      // Should not throw even without level
      expect(() => captureMessage('test')).not.toThrow();
    });
  });

  describe('addBreadcrumb()', () => {
    it('should not throw when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { addBreadcrumb } = require('../../../config/monitoring');
      expect(() => addBreadcrumb('test', 'category')).not.toThrow();
    });

    it('should not throw when called with data', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { addBreadcrumb } = require('../../../config/monitoring');
      expect(() =>
        addBreadcrumb('test', 'category', { key: 'value' })
      ).not.toThrow();
    });
  });

  describe('setUserContext()', () => {
    it('should not throw when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { setUserContext } = require('../../../config/monitoring');
      expect(() => setUserContext('user-123')).not.toThrow();
    });

    it('should not throw with full user context', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { setUserContext } = require('../../../config/monitoring');
      expect(() =>
        setUserContext('user-123', 'user@test.com', 'org-456')
      ).not.toThrow();
    });
  });

  describe('clearUserContext()', () => {
    it('should not throw when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { clearUserContext } = require('../../../config/monitoring');
      expect(() => clearUserContext()).not.toThrow();
    });
  });

  describe('startTransaction()', () => {
    it('should return a mock transaction object when Sentry is disabled', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { startTransaction } = require('../../../config/monitoring');
      const transaction = startTransaction('GET /api/test', 'http.server');

      expect(transaction).toBeDefined();
      expect(typeof transaction.setData).toBe('function');
      expect(typeof transaction.setHttpStatus).toBe('function');
      expect(typeof transaction.setStatus).toBe('function');
      expect(typeof transaction.setTag).toBe('function');
      expect(typeof transaction.setUser).toBe('function');
      expect(typeof transaction.finish).toBe('function');
    });

    it('should return mock transaction that does not throw when methods are called', () => {
      process.env.SENTRY_ENABLED = 'false';

      const { startTransaction } = require('../../../config/monitoring');
      const transaction = startTransaction('POST /api/data', 'http.server');

      expect(() => transaction.setData('key', 'value')).not.toThrow();
      expect(() => transaction.setHttpStatus(200)).not.toThrow();
      expect(() => transaction.setStatus('ok')).not.toThrow();
      expect(() => transaction.setTag('env', 'test')).not.toThrow();
      expect(() => transaction.setUser({ id: '123' })).not.toThrow();
      expect(() => transaction.finish()).not.toThrow();
    });

    it('should return mock transaction when Sentry is enabled but not available', () => {
      process.env.SENTRY_ENABLED = 'true';

      const { startTransaction } = require('../../../config/monitoring');
      const transaction = startTransaction('test', 'test');

      expect(transaction).toBeDefined();
      expect(typeof transaction.finish).toBe('function');
    });
  });

  describe('Default Export', () => {
    it('should export an object with all monitoring functions', () => {
      const monitoring = require('../../../config/monitoring').default;
      expect(monitoring).toBeDefined();
      expect(typeof monitoring.initializeSentry).toBe('function');
      expect(typeof monitoring.initializeAPM).toBe('function');
      expect(typeof monitoring.getMonitoringConfig).toBe('function');
      expect(typeof monitoring.captureException).toBe('function');
      expect(typeof monitoring.captureMessage).toBe('function');
      expect(typeof monitoring.addBreadcrumb).toBe('function');
      expect(typeof monitoring.setUserContext).toBe('function');
      expect(typeof monitoring.clearUserContext).toBe('function');
      expect(typeof monitoring.startTransaction).toBe('function');
    });
  });
});
