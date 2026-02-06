/**
 * Logger Configuration Unit Tests
 * Tests for Winston logger instance, transports, and sanitization
 */

import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

// Mock dependencies before importing logger
jest.mock('../../../config/index', () => ({
  __esModule: true,
  default: {
    logging: { level: 'info' },
  },
}));

jest.mock('../../../config/elasticsearch', () => ({
  __esModule: true,
  default: {
    createElasticsearchTransport: jest.fn().mockReturnValue(null),
  },
}));

jest.mock('../../../utils/logSanitizer', () => ({
  sanitizeForLogging: jest.fn((data: any) => data),
}));

// Mock variables for assertions
const mockFormat = {
  combine: jest.fn(),
  timestamp: jest.fn(),
  printf: jest.fn(),
  colorize: jest.fn(),
  errors: jest.fn(),
  json: jest.fn(),
};

const mockTransportsConsole = jest.fn();
const mockTransportsFile = jest.fn();

const mockCreateLogger = jest.fn();

// The callable format function (winston.format(callback) used for custom formats)
const mockFormatFn = jest.fn();

// Mock winston - format is both a callable function and has sub-properties
jest.mock('winston', () => {
  // Attach sub-properties to the callable format function
  Object.assign(mockFormatFn, {
    combine: mockFormat.combine,
    timestamp: mockFormat.timestamp,
    printf: mockFormat.printf,
    colorize: mockFormat.colorize,
    errors: mockFormat.errors,
    json: mockFormat.json,
  });

  return {
    format: mockFormatFn,
    transports: {
      Console: mockTransportsConsole,
      File: mockTransportsFile,
    },
    createLogger: mockCreateLogger,
  };
});

/**
 * Helper to re-establish all mock implementations.
 * Required because jest.config.js has resetMocks: true, which calls
 * mockReset() on every jest.fn() before each test, clearing all
 * mockReturnValue / mockImplementation settings.
 */
function setupMockImplementations() {
  mockFormat.combine.mockReturnValue({});
  mockFormat.timestamp.mockReturnValue({});
  mockFormat.printf.mockReturnValue({});
  mockFormat.colorize.mockReturnValue({});
  mockFormat.errors.mockReturnValue({});
  mockFormat.json.mockReturnValue({});

  // winston.format(callback) must return a callable (the IIFE in sanitizationFormat)
  mockFormatFn.mockImplementation(() => jest.fn().mockReturnValue({}));

  mockTransportsConsole.mockImplementation(() => ({ name: 'console' }));
  mockTransportsFile.mockImplementation((opts: any) => ({
    name: 'file',
    filename: opts?.filename,
    level: opts?.level,
  }));

  mockCreateLogger.mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    transports: [],
    level: 'info',
  });

  // Also re-establish elasticsearch mock
  const esMock = require('../../../config/elasticsearch').default;
  esMock.createElasticsearchTransport.mockReturnValue(null);
}

describe('Logger Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    setupMockImplementations();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Logger Instance', () => {
    it('should export a logger instance as default', () => {
      jest.resetModules();
      setupMockImplementations();
      const logger = require('../../../config/logger').default;
      expect(logger).toBeDefined();
    });

    it('should create logger with winston.createLogger', () => {
      jest.resetModules();
      setupMockImplementations();
      require('../../../config/logger');
      expect(mockCreateLogger).toHaveBeenCalled();
    });

    it('should have standard logging methods', () => {
      jest.resetModules();
      setupMockImplementations();
      const logger = require('../../../config/logger').default;
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Console Transport', () => {
    it('should add console transport in non-production environment', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_CONSOLE;
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');
      expect(mockTransportsConsole).toHaveBeenCalled();
    });

    it('should add console transport when LOG_CONSOLE is not false in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_CONSOLE = 'true';
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');
      expect(mockTransportsConsole).toHaveBeenCalled();
    });

    it('should not add console transport in production when LOG_CONSOLE is false', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_CONSOLE = 'false';
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');
      expect(mockTransportsConsole).not.toHaveBeenCalled();
    });
  });

  describe('File Transports', () => {
    it('should add file transports when LOG_FILE is not false', () => {
      delete process.env.LOG_FILE;
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');

      // Should create 3 file transports for logs: error.log, combined.log, access.log
      // Plus 2 for exception/rejection handlers: exceptions.log, rejections.log
      // Filter to only the log file transports
      const logFileCalls = mockTransportsFile.mock.calls.filter(
        (call: any[]) =>
          call[0]?.filename === 'logs/error.log' ||
          call[0]?.filename === 'logs/combined.log' ||
          call[0]?.filename === 'logs/access.log'
      );
      expect(logFileCalls.length).toBe(3);
    });

    it('should configure error.log file transport with error level', () => {
      delete process.env.LOG_FILE;
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');

      const errorCall = mockTransportsFile.mock.calls.find(
        (call: any[]) => call[0]?.filename === 'logs/error.log'
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![0].level).toBe('error');
    });

    it('should configure combined.log file transport', () => {
      delete process.env.LOG_FILE;
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');

      const combinedCall = mockTransportsFile.mock.calls.find(
        (call: any[]) => call[0]?.filename === 'logs/combined.log'
      );
      expect(combinedCall).toBeDefined();
    });

    it('should configure access.log file transport with info level', () => {
      delete process.env.LOG_FILE;
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');

      const accessCall = mockTransportsFile.mock.calls.find(
        (call: any[]) => call[0]?.filename === 'logs/access.log'
      );
      expect(accessCall).toBeDefined();
      expect(accessCall![0].level).toBe('info');
    });

    it('should not add file transports when LOG_FILE is false', () => {
      process.env.LOG_FILE = 'false';
      jest.resetModules();
      setupMockImplementations();

      require('../../../config/logger');

      // File constructor calls for error, combined, access should not happen
      // but exception/rejection handlers still use File
      const logFileCalls = mockTransportsFile.mock.calls.filter(
        (call: any[]) =>
          call[0]?.filename === 'logs/error.log' ||
          call[0]?.filename === 'logs/combined.log' ||
          call[0]?.filename === 'logs/access.log'
      );
      expect(logFileCalls.length).toBe(0);
    });
  });

  describe('Elasticsearch Transport', () => {
    it('should attempt to create ES transport when ELASTICSEARCH_ENABLED is true', () => {
      process.env.ELASTICSEARCH_ENABLED = 'true';
      jest.resetModules();
      setupMockImplementations();

      const esMock = require('../../../config/elasticsearch').default;
      require('../../../config/logger');

      expect(esMock.createElasticsearchTransport).toHaveBeenCalled();
    });

    it('should not create ES transport when ELASTICSEARCH_ENABLED is not true', () => {
      delete process.env.ELASTICSEARCH_ENABLED;
      jest.resetModules();
      setupMockImplementations();

      const esMock = require('../../../config/elasticsearch').default;
      esMock.createElasticsearchTransport.mockClear();
      require('../../../config/logger');

      expect(esMock.createElasticsearchTransport).not.toHaveBeenCalled();
    });
  });

  describe('Logger Format Configuration', () => {
    it('should configure error stack trace formatting', () => {
      jest.resetModules();
      setupMockImplementations();
      require('../../../config/logger');
      expect(mockFormat.errors).toHaveBeenCalledWith({ stack: true });
    });

    it('should configure timestamp formatting', () => {
      jest.resetModules();
      setupMockImplementations();
      require('../../../config/logger');
      expect(mockFormat.timestamp).toHaveBeenCalled();
    });
  });

  describe('Exception and Rejection Handlers', () => {
    it('should configure exception handlers', () => {
      jest.resetModules();
      setupMockImplementations();
      require('../../../config/logger');

      const createLoggerCall = mockCreateLogger.mock.calls[0]?.[0];
      expect(createLoggerCall).toBeDefined();
      expect(createLoggerCall.exceptionHandlers).toBeDefined();
      expect(createLoggerCall.exceptionHandlers.length).toBeGreaterThan(0);
    });

    it('should configure rejection handlers', () => {
      jest.resetModules();
      setupMockImplementations();
      require('../../../config/logger');

      const createLoggerCall = mockCreateLogger.mock.calls[0]?.[0];
      expect(createLoggerCall).toBeDefined();
      expect(createLoggerCall.rejectionHandlers).toBeDefined();
      expect(createLoggerCall.rejectionHandlers.length).toBeGreaterThan(0);
    });
  });
});
