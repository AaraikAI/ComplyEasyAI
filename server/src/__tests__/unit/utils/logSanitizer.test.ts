/**
 * logSanitizer Unit Tests
 * Tests for the log sanitization utility that prevents sensitive data leakage
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sanitizeForLogging, createSafeLogger, sanitizeRequest } from '../../../utils/logSanitizer';

describe('logSanitizer', () => {
  describe('sanitizeForLogging()', () => {
    describe('primitive values', () => {
      it('should pass through string values unchanged', () => {
        expect(sanitizeForLogging('hello world')).toBe('hello world');
      });

      it('should pass through empty string unchanged', () => {
        expect(sanitizeForLogging('')).toBe('');
      });

      it('should pass through number values unchanged', () => {
        expect(sanitizeForLogging(42)).toBe(42);
        expect(sanitizeForLogging(0)).toBe(0);
        expect(sanitizeForLogging(-1)).toBe(-1);
        expect(sanitizeForLogging(3.14)).toBe(3.14);
      });

      it('should pass through boolean values unchanged', () => {
        expect(sanitizeForLogging(true)).toBe(true);
        expect(sanitizeForLogging(false)).toBe(false);
      });

      it('should return null for null input', () => {
        expect(sanitizeForLogging(null)).toBeNull();
      });

      it('should return undefined for undefined input', () => {
        expect(sanitizeForLogging(undefined)).toBeUndefined();
      });
    });

    describe('sensitive key redaction', () => {
      it('should redact "password" key', () => {
        const result = sanitizeForLogging({ password: 'secret123' });
        expect(result.password).toBe('[REDACTED]');
      });

      it('should redact "token" key', () => {
        const result = sanitizeForLogging({ token: 'abc-def-ghi' });
        expect(result.token).toBe('[REDACTED]');
      });

      it('should redact "secret" key', () => {
        const result = sanitizeForLogging({ secret: 'mysecret' });
        expect(result.secret).toBe('[REDACTED]');
      });

      it('should redact "authorization" key', () => {
        const result = sanitizeForLogging({ authorization: 'Bearer xyz' });
        expect(result.authorization).toBe('[REDACTED]');
      });

      it('should redact "apiKey" key', () => {
        const result = sanitizeForLogging({ apiKey: 'key-12345' });
        expect(result.apiKey).toBe('[REDACTED]');
      });

      it('should redact "api_key" key', () => {
        const result = sanitizeForLogging({ api_key: 'key-12345' });
        expect(result.api_key).toBe('[REDACTED]');
      });

      it('should redact "apikey" key', () => {
        const result = sanitizeForLogging({ apikey: 'key-12345' });
        expect(result.apikey).toBe('[REDACTED]');
      });

      it('should redact "credit_card" key', () => {
        const result = sanitizeForLogging({ credit_card: '4111111111111111' });
        expect(result.credit_card).toBe('[REDACTED]');
      });

      it('should redact "creditCard" key', () => {
        const result = sanitizeForLogging({ creditCard: '4111111111111111' });
        expect(result.creditCard).toBe('[REDACTED]');
      });

      it('should redact "ssn" key', () => {
        const result = sanitizeForLogging({ ssn: '123-45-6789' });
        expect(result.ssn).toBe('[REDACTED]');
      });

      it('should redact "jwt" key', () => {
        const result = sanitizeForLogging({ jwt: 'eyJhbGciOiJIUz...' });
        expect(result.jwt).toBe('[REDACTED]');
      });

      it('should redact "cookie" key', () => {
        const result = sanitizeForLogging({ cookie: 'session=abc123' });
        expect(result.cookie).toBe('[REDACTED]');
      });

      it('should redact "session" key', () => {
        const result = sanitizeForLogging({ session: 'sess-data' });
        expect(result.session).toBe('[REDACTED]');
      });

      it('should redact "cvv" key', () => {
        const result = sanitizeForLogging({ cvv: '123' });
        expect(result.cvv).toBe('[REDACTED]');
      });

      it('should redact "pin" key', () => {
        const result = sanitizeForLogging({ pin: '9876' });
        expect(result.pin).toBe('[REDACTED]');
      });

      it('should redact "otp" key', () => {
        const result = sanitizeForLogging({ otp: '482910' });
        expect(result.otp).toBe('[REDACTED]');
      });

      it('should redact "auth" key', () => {
        const result = sanitizeForLogging({ auth: 'credentials' });
        expect(result.auth).toBe('[REDACTED]');
      });

      it('should redact "privatekey" key', () => {
        const result = sanitizeForLogging({ privatekey: 'pk-data' });
        expect(result.privatekey).toBe('[REDACTED]');
      });

      it('should redact "private_key" key', () => {
        const result = sanitizeForLogging({ private_key: 'pk-data' });
        expect(result.private_key).toBe('[REDACTED]');
      });

      it('should redact "privateKey" key', () => {
        const result = sanitizeForLogging({ privateKey: 'pk-data' });
        expect(result.privateKey).toBe('[REDACTED]');
      });

      it('should redact "accesstoken" key', () => {
        const result = sanitizeForLogging({ accesstoken: 'at-xyz' });
        expect(result.accesstoken).toBe('[REDACTED]');
      });

      it('should redact "access_token" key', () => {
        const result = sanitizeForLogging({ access_token: 'at-xyz' });
        expect(result.access_token).toBe('[REDACTED]');
      });

      it('should redact "accessToken" key', () => {
        const result = sanitizeForLogging({ accessToken: 'at-xyz' });
        expect(result.accessToken).toBe('[REDACTED]');
      });

      it('should redact "refreshtoken" key', () => {
        const result = sanitizeForLogging({ refreshtoken: 'rt-abc' });
        expect(result.refreshtoken).toBe('[REDACTED]');
      });

      it('should redact "refresh_token" key', () => {
        const result = sanitizeForLogging({ refresh_token: 'rt-abc' });
        expect(result.refresh_token).toBe('[REDACTED]');
      });

      it('should redact "refreshToken" key', () => {
        const result = sanitizeForLogging({ refreshToken: 'rt-abc' });
        expect(result.refreshToken).toBe('[REDACTED]');
      });

      it('should redact keys case-insensitively', () => {
        const result = sanitizeForLogging({
          PASSWORD: 'secret',
          Token: 'abc',
          SECRET: 'xyz',
          Authorization: 'Bearer 123',
        });
        expect(result.PASSWORD).toBe('[REDACTED]');
        expect(result.Token).toBe('[REDACTED]');
        expect(result.SECRET).toBe('[REDACTED]');
        expect(result.Authorization).toBe('[REDACTED]');
      });

      it('should redact keys containing sensitive substrings', () => {
        const result = sanitizeForLogging({
          userPassword: 'hidden',
          myApiKey: 'key-123',
          x_access_token_value: 'tokenval',
        });
        expect(result.userPassword).toBe('[REDACTED]');
        expect(result.myApiKey).toBe('[REDACTED]');
        expect(result.x_access_token_value).toBe('[REDACTED]');
      });

      it('should preserve non-sensitive keys', () => {
        const result = sanitizeForLogging({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          active: true,
        });
        expect(result.name).toBe('John');
        expect(result.email).toBe('john@example.com');
        expect(result.age).toBe(30);
        expect(result.active).toBe(true);
      });

      it('should handle a mix of sensitive and non-sensitive keys', () => {
        const result = sanitizeForLogging({
          username: 'john',
          password: 'secret',
          role: 'admin',
          token: 'xyz',
        });
        expect(result.username).toBe('john');
        expect(result.password).toBe('[REDACTED]');
        expect(result.role).toBe('admin');
        expect(result.token).toBe('[REDACTED]');
      });
    });

    describe('nested objects', () => {
      it('should sanitize nested objects with sensitive keys', () => {
        const result = sanitizeForLogging({
          user: {
            name: 'John',
            password: 'secret',
          },
        });
        expect(result.user.name).toBe('John');
        expect(result.user.password).toBe('[REDACTED]');
      });

      it('should sanitize deeply nested objects', () => {
        const result = sanitizeForLogging({
          level1: {
            level2: {
              level3: {
                password: 'deep-secret',
                data: 'visible',
              },
            },
          },
        });
        expect(result.level1.level2.level3.password).toBe('[REDACTED]');
        expect(result.level1.level2.level3.data).toBe('visible');
      });

      it('should handle objects with null values in nested properties', () => {
        const result = sanitizeForLogging({
          config: {
            value: null,
            name: 'test',
          },
        });
        expect(result.config.value).toBeNull();
        expect(result.config.name).toBe('test');
      });
    });

    describe('arrays', () => {
      it('should sanitize arrays of objects', () => {
        const result = sanitizeForLogging([
          { name: 'Alice', password: 'pass1' },
          { name: 'Bob', password: 'pass2' },
        ]);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice');
        expect(result[0].password).toBe('[REDACTED]');
        expect(result[1].name).toBe('Bob');
        expect(result[1].password).toBe('[REDACTED]');
      });

      it('should handle empty arrays', () => {
        const result = sanitizeForLogging([]);
        expect(result).toEqual([]);
      });

      it('should pass through arrays of primitives unchanged', () => {
        const result = sanitizeForLogging([1, 'hello', true, null]);
        expect(result).toEqual([1, 'hello', true, null]);
      });

      it('should sanitize nested arrays within objects', () => {
        const result = sanitizeForLogging({
          users: [
            { name: 'Alice', token: 'abc' },
            { name: 'Bob', token: 'xyz' },
          ],
        });
        expect(result.users[0].name).toBe('Alice');
        expect(result.users[0].token).toBe('[REDACTED]');
        expect(result.users[1].name).toBe('Bob');
        expect(result.users[1].token).toBe('[REDACTED]');
      });

      it('should handle arrays of mixed types', () => {
        const result = sanitizeForLogging([
          42,
          'text',
          { secret: 'hidden' },
          [{ password: 'deep' }],
        ]);
        expect(result[0]).toBe(42);
        expect(result[1]).toBe('text');
        expect(result[2].secret).toBe('[REDACTED]');
        expect(result[3][0].password).toBe('[REDACTED]');
      });
    });

    describe('Error objects', () => {
      it('should extract name and message from Error objects', () => {
        const error = new Error('Something went wrong');
        const result = sanitizeForLogging(error);
        expect(result.name).toBe('Error');
        expect(result.message).toBe('Something went wrong');
      });

      it('should redact stack trace in non-development environment', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
          const error = new Error('Test error');
          const result = sanitizeForLogging(error);
          expect(result.stack).toBe('[Redacted in production]');
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });

      it('should include stack trace in development environment', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        try {
          const error = new Error('Test error');
          const result = sanitizeForLogging(error);
          expect(result.stack).toBeDefined();
          expect(result.stack).not.toBe('[Redacted in production]');
          expect(result.stack).toContain('Error: Test error');
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });

      it('should redact stack trace in test environment', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';
        try {
          const error = new Error('Test error');
          const result = sanitizeForLogging(error);
          expect(result.stack).toBe('[Redacted in production]');
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });

      it('should handle custom Error subclasses', () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }
        const error = new CustomError('Custom failure');
        const result = sanitizeForLogging(error);
        expect(result.name).toBe('CustomError');
        expect(result.message).toBe('Custom failure');
      });
    });

    describe('depth limiting', () => {
      it('should return "[Max Depth Reached]" when depth is 0', () => {
        const result = sanitizeForLogging({ any: 'value' }, 0);
        expect(result).toBe('[Max Depth Reached]');
      });

      it('should return "[Max Depth Reached]" when depth is negative', () => {
        const result = sanitizeForLogging({ any: 'value' }, -1);
        expect(result).toBe('[Max Depth Reached]');
      });

      it('should handle deeply nested objects reaching max depth', () => {
        const deepObject = {
          l1: {
            l2: {
              l3: {
                l4: {
                  l5: {
                    l6: { value: 'deep' },
                  },
                },
              },
            },
          },
        };
        // Default depth is 5; nested object at depth 6 should hit the limit
        const result = sanitizeForLogging(deepObject);
        expect(result.l1.l2.l3.l4.l5).toBe('[Max Depth Reached]');
      });

      it('should respect custom depth parameter', () => {
        const obj = {
          level1: {
            level2: {
              level3: { value: 'data' },
            },
          },
        };

        const result = sanitizeForLogging(obj, 2);
        expect(result.level1.level2).toBe('[Max Depth Reached]');
      });

      it('should allow full traversal when depth is sufficient', () => {
        const obj = { a: { b: { c: 'value' } } };
        const result = sanitizeForLogging(obj, 10);
        expect(result.a.b.c).toBe('value');
      });

      it('should apply depth limit within arrays', () => {
        const arr = [{ nested: { deep: { password: 'secret' } } }];
        const result = sanitizeForLogging(arr, 2);
        // Array consumes one level, object consumes another, nested object hits limit
        expect(result[0].nested).toBe('[Max Depth Reached]');
      });
    });

    describe('edge cases', () => {
      it('should handle empty objects', () => {
        const result = sanitizeForLogging({});
        expect(result).toEqual({});
      });

      it('should handle objects with numeric values', () => {
        const result = sanitizeForLogging({ count: 0, total: 100 });
        expect(result.count).toBe(0);
        expect(result.total).toBe(100);
      });

      it('should handle objects where sensitive key has null value', () => {
        const result = sanitizeForLogging({ password: null });
        // The key is sensitive, so it gets redacted regardless of value
        expect(result.password).toBe('[REDACTED]');
      });

      it('should handle objects where sensitive key has undefined value', () => {
        const result = sanitizeForLogging({ token: undefined });
        expect(result.token).toBe('[REDACTED]');
      });

      it('should handle objects where sensitive key has object value', () => {
        const result = sanitizeForLogging({
          secret: { nested: 'data' },
        });
        // Key matches sensitive pattern, so entire value is redacted
        expect(result.secret).toBe('[REDACTED]');
      });
    });
  });

  describe('createSafeLogger()', () => {
    let mockLogger: {
      info: jest.Mock;
      error: jest.Mock;
      warn: jest.Mock;
      debug: jest.Mock;
    };

    beforeEach(() => {
      mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };
    });

    it('should return an object with info, error, warn, debug methods', () => {
      const safeLogger = createSafeLogger(mockLogger);
      expect(typeof safeLogger.info).toBe('function');
      expect(typeof safeLogger.error).toBe('function');
      expect(typeof safeLogger.warn).toBe('function');
      expect(typeof safeLogger.debug).toBe('function');
    });

    it('should pass message through to underlying logger.info', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info('Test message');
      expect(mockLogger.info).toHaveBeenCalledWith('Test message');
    });

    it('should pass message through to underlying logger.error', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.error('Error occurred');
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred');
    });

    it('should pass message through to underlying logger.warn', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.warn('Warning issued');
      expect(mockLogger.warn).toHaveBeenCalledWith('Warning issued');
    });

    it('should pass message through to underlying logger.debug', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.debug('Debug info');
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug info');
    });

    it('should sanitize object arguments passed to info', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info('Login attempt', { user: 'john', password: 'secret123' });
      expect(mockLogger.info).toHaveBeenCalledWith('Login attempt', {
        user: 'john',
        password: '[REDACTED]',
      });
    });

    it('should sanitize object arguments passed to error', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.error('Auth failed', { token: 'abc', reason: 'expired' });
      expect(mockLogger.error).toHaveBeenCalledWith('Auth failed', {
        token: '[REDACTED]',
        reason: 'expired',
      });
    });

    it('should sanitize object arguments passed to warn', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.warn('Suspicious activity', { apiKey: 'key-xyz', ip: '1.2.3.4' });
      expect(mockLogger.warn).toHaveBeenCalledWith('Suspicious activity', {
        apiKey: '[REDACTED]',
        ip: '1.2.3.4',
      });
    });

    it('should sanitize object arguments passed to debug', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.debug('Request details', { cookie: 'sess=abc', path: '/api' });
      expect(mockLogger.debug).toHaveBeenCalledWith('Request details', {
        cookie: '[REDACTED]',
        path: '/api',
      });
    });

    it('should sanitize multiple arguments', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info(
        'Multi-arg log',
        { password: 'p1' },
        { token: 't1' },
        { name: 'safe' },
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Multi-arg log',
        { password: '[REDACTED]' },
        { token: '[REDACTED]' },
        { name: 'safe' },
      );
    });

    it('should pass primitive extra arguments through unchanged', () => {
      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info('Primitive args', 42, 'text', true);
      expect(mockLogger.info).toHaveBeenCalledWith('Primitive args', 42, 'text', true);
    });
  });

  describe('sanitizeRequest()', () => {
    it('should extract method, url, and ip from request', () => {
      const req = {
        method: 'GET',
        url: '/api/users',
        ip: '203.0.113.50',
        headers: {},
        body: {},
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.method).toBe('GET');
      expect(result.url).toBe('/api/users');
      expect(result.ip).toBe('203.0.113.50');
    });

    it('should redact authorization header', () => {
      const req = {
        method: 'GET',
        url: '/api/data',
        ip: '10.0.0.1',
        headers: {
          authorization: 'Bearer eyJhbGciOi...',
          'content-type': 'application/json',
        },
        body: {},
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.headers.authorization).toBe('[REDACTED]');
      expect(result.headers['content-type']).toBe('application/json');
    });

    it('should redact cookie header', () => {
      const req = {
        method: 'GET',
        url: '/api/data',
        ip: '10.0.0.1',
        headers: {
          cookie: 'session=abc123; token=xyz',
          host: 'example.com',
        },
        body: {},
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.headers.cookie).toBe('[REDACTED]');
      expect(result.headers.host).toBe('example.com');
    });

    it('should set authorization to undefined when not present in headers', () => {
      const req = {
        method: 'GET',
        url: '/api/data',
        ip: '10.0.0.1',
        headers: {
          'content-type': 'text/html',
        },
        body: {},
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      // When authorization is not present, it becomes undefined
      expect(result.headers.authorization).toBeUndefined();
    });

    it('should sanitize sensitive keys in request body', () => {
      const req = {
        method: 'POST',
        url: '/api/login',
        ip: '203.0.113.50',
        headers: {},
        body: {
          username: 'john',
          password: 'supersecret',
        },
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.body.username).toBe('john');
      expect(result.body.password).toBe('[REDACTED]');
    });

    it('should sanitize sensitive keys in query params', () => {
      const req = {
        method: 'GET',
        url: '/api/resource',
        ip: '203.0.113.50',
        headers: {},
        body: {},
        query: {
          token: 'abc123',
          page: '1',
        },
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.query.token).toBe('[REDACTED]');
      expect(result.query.page).toBe('1');
    });

    it('should sanitize sensitive keys in route params', () => {
      const req = {
        method: 'GET',
        url: '/api/resource/123',
        ip: '203.0.113.50',
        headers: {},
        body: {},
        query: {},
        params: {
          id: '123',
          sessionId: 'sess-xyz',
        },
      };
      const result = sanitizeRequest(req);
      expect(result.params.id).toBe('123');
      // 'sessionId' contains 'session', which is sensitive
      expect(result.params.sessionId).toBe('[REDACTED]');
    });

    it('should handle request with empty body, query, and params', () => {
      const req = {
        method: 'GET',
        url: '/health',
        ip: '127.0.0.1',
        headers: {},
        body: {},
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.body).toEqual({});
      expect(result.query).toEqual({});
      expect(result.params).toEqual({});
    });

    it('should handle request with undefined body', () => {
      const req = {
        method: 'GET',
        url: '/api/data',
        ip: '10.0.0.1',
        headers: {},
        body: undefined,
        query: undefined,
        params: undefined,
      };
      const result = sanitizeRequest(req);
      expect(result.body).toBeUndefined();
      expect(result.query).toBeUndefined();
      expect(result.params).toBeUndefined();
    });

    it('should handle request with nested body data', () => {
      const req = {
        method: 'POST',
        url: '/api/settings',
        ip: '203.0.113.50',
        headers: {},
        body: {
          user: {
            name: 'Alice',
            credentials: {
              password: 'hidden',
              apiKey: 'key-abc',
            },
          },
        },
        query: {},
        params: {},
      };
      const result = sanitizeRequest(req);
      expect(result.body.user.name).toBe('Alice');
      expect(result.body.user.credentials.password).toBe('[REDACTED]');
      expect(result.body.user.credentials.apiKey).toBe('[REDACTED]');
    });

    it('should handle request with null headers', () => {
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '10.0.0.1',
        headers: null,
        body: {},
        query: {},
        params: {},
      };
      // When headers is null, accessing headers?.authorization returns undefined
      const result = sanitizeRequest(req);
      expect(result.headers).toBeDefined();
    });

    it('should include all returned fields in the sanitized request', () => {
      const req = {
        method: 'POST',
        url: '/api/data',
        ip: '10.0.0.1',
        headers: { host: 'example.com' },
        body: { data: 'value' },
        query: { filter: 'active' },
        params: { id: '42' },
      };
      const result = sanitizeRequest(req);
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['method', 'url', 'ip', 'headers', 'body', 'query', 'params']),
      );
    });
  });
});
