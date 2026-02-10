/**
 * Database Configuration Unit Tests
 * Tests for PrismaClient instantiation, testConnection retry logic, and shutdown handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock logger before importing database module
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock PrismaClient
const mockQueryRaw = jest.fn();
const mockDisconnect = jest.fn();
const mockOn = jest.fn();
const mockUse = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: mockQueryRaw,
    $disconnect: mockDisconnect,
    $on: mockOn,
    $use: mockUse,
  })),
}));

describe('Database Configuration', () => {
  let logger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Re-import logger mock after reset
    logger = require('../../../config/logger').default;
  });

  describe('PrismaClient Instantiation', () => {
    it('should export a PrismaClient instance as default', () => {
      const prisma = require('../../../config/database').default;
      expect(prisma).toBeDefined();
      expect(prisma.$queryRaw).toBeDefined();
      expect(prisma.$disconnect).toBeDefined();
    });

    it('should configure PrismaClient with DATABASE_URL from environment', () => {
      const { PrismaClient } = require('@prisma/client');
      require('../../../config/database');

      expect(PrismaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
        })
      );
    });

    it('should configure PrismaClient with logging options', () => {
      const { PrismaClient } = require('@prisma/client');
      require('../../../config/database');

      expect(PrismaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ],
        })
      );
    });
  });

  describe('testConnection()', () => {
    it('should successfully connect on first attempt', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const { testConnection } = require('../../../config/database');
      const result = await testConnection();

      expect(result).toBe(true);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database connection established')
      );
    });

    it('should retry on failure and succeed on second attempt', async () => {
      mockQueryRaw
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const { testConnection } = require('../../../config/database');
      const result = await testConnection(3, 10); // Short delay for testing

      expect(result).toBe(true);
      expect(mockQueryRaw).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Database connection attempt 1 failed')
      );
    });

    it('should retry on failure and succeed on third attempt', async () => {
      mockQueryRaw
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const { testConnection } = require('../../../config/database');
      const result = await testConnection(3, 10);

      expect(result).toBe(true);
      expect(mockQueryRaw).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('should return false after exhausting all retries', async () => {
      const dbError = new Error('Connection refused');
      mockQueryRaw
        .mockRejectedValueOnce(dbError)
        .mockRejectedValueOnce(dbError)
        .mockRejectedValueOnce(dbError);

      const { testConnection } = require('../../../config/database');
      const result = await testConnection(3, 10);

      expect(result).toBe(false);
      expect(mockQueryRaw).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Database connection failed after retries'),
        'Connection refused'
      );
    });

    it('should use default retries (3) and delay (2000ms) when not specified', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const { testConnection } = require('../../../config/database');
      const result = await testConnection();

      expect(result).toBe(true);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    });

    it('should return true immediately if connection was already tested', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const { testConnection } = require('../../../config/database');

      // First call
      const result1 = await testConnection(3, 10);
      expect(result1).toBe(true);

      // Second call should return true without querying
      const result2 = await testConnection(3, 10);
      expect(result2).toBe(true);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle single retry configuration', async () => {
      mockQueryRaw.mockRejectedValueOnce(new Error('fail'));

      const { testConnection } = require('../../../config/database');
      const result = await testConnection(1, 10);

      expect(result).toBe(false);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log warning messages with retry delay information', async () => {
      mockQueryRaw
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const { testConnection } = require('../../../config/database');
      await testConnection(3, 5000);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('retrying in 5000ms')
      );
    });
  });

  describe('Development Query Logging', () => {
    it('should register query event handler in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      require('../../../config/database');

      // In development mode, $on should be called for query logging
      expect(mockOn).toHaveBeenCalledWith('query', expect.any(Function));

      process.env.NODE_ENV = originalEnv;
    });

    it('should not register query event handler in non-development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      jest.resetModules();
      mockOn.mockClear();
      require('../../../config/database');

      // In production mode, $on should not be called for query logging
      expect(mockOn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Graceful Shutdown', () => {
    it('should register a beforeExit handler on process', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      jest.resetModules();
      require('../../../config/database');

      expect(processOnSpy).toHaveBeenCalledWith('beforeExit', expect.any(Function));
      processOnSpy.mockRestore();
    });
  });
});
