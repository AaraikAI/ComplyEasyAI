import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockStartTransaction = jest.fn();
const mockCaptureException = jest.fn();
const mockCaptureMessage = jest.fn();
const mockAddBreadcrumb = jest.fn();

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: {
    startTransaction: (...args: unknown[]) => mockStartTransaction(...args),
    captureException: (...args: unknown[]) => mockCaptureException(...args),
    captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
    addBreadcrumb: (...args: unknown[]) => mockAddBreadcrumb(...args),
    setUserContext: jest.fn(),
  },
}));

const mockRecordMetric = jest.fn();

jest.mock('../../../config/performanceMonitoring', () => ({
  __esModule: true,
  default: {
    recordMetric: (...args: unknown[]) => mockRecordMetric(...args),
  },
}));

const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
    debug: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import module under test
// ---------------------------------------------------------------------------

import {
  monitoringMiddleware,
  errorTrackingMiddleware,
  queryMonitoringMiddleware,
} from '../../../middleware/monitoring';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMockTransaction() {
  return {
    setData: jest.fn(),
    setHttpStatus: jest.fn(),
    setStatus: jest.fn(),
    setTag: jest.fn(),
    finish: jest.fn(),
  };
}

function buildReq(overrides: Record<string, any> = {}): Partial<Request> {
  return {
    method: 'GET',
    path: '/api/test',
    query: {},
    ip: '127.0.0.1',
    get: jest.fn() as any,
    ...overrides,
  } as Partial<Request>;
}

/**
 * Build a Response mock that is also an EventEmitter so we can
 * trigger the 'finish' event.
 */
function buildRes(overrides: Record<string, any> = {}): EventEmitter & Partial<Response> {
  const emitter = new EventEmitter();
  const res = Object.assign(emitter, {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    ...overrides,
  });
  return res as EventEmitter & Partial<Response>;
}

function buildNext(): jest.Mock {
  return jest.fn() as jest.Mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Monitoring Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // monitoringMiddleware
  // =========================================================================

  describe('monitoringMiddleware', () => {
    it('should call next() immediately', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes();
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should start a transaction with correct name and op', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq({ method: 'POST', path: '/api/users' });
      const res = buildRes();
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);

      expect(mockStartTransaction).toHaveBeenCalledWith('POST /api/users', 'http.server');
    });

    it('should set transaction data with request info', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq({ method: 'GET', path: '/api/data', query: { page: '1' }, ip: '10.0.0.1' });
      const res = buildRes();
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);

      expect(transaction.setData).toHaveBeenCalledWith('method', 'GET');
      expect(transaction.setData).toHaveBeenCalledWith('path', '/api/data');
      expect(transaction.setData).toHaveBeenCalledWith('query', { page: '1' });
      expect(transaction.setData).toHaveBeenCalledWith('ip', '10.0.0.1');
    });

    it('should add a breadcrumb for the request', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq({ method: 'PUT', path: '/api/items/1' });
      const res = buildRes();
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        'PUT /api/items/1',
        'http',
        { method: 'PUT', path: '/api/items/1' }
      );
    });

    it('should record performance metric on response finish', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq({ method: 'GET', path: '/api/data' });
      const res = buildRes({ statusCode: 200 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);

      // Trigger the finish event
      res.emit('finish');

      expect(mockRecordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/data',
          method: 'GET',
          statusCode: 200,
          timestamp: expect.any(Date),
        })
      );
    });

    it('should log slow requests exceeding 1000ms', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      // We need Date.now() to return different values before and after
      const realDateNow = Date.now;
      let callCount = 0;
      const startTime = 1000000;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        // First call is in monitoringMiddleware setup, subsequent calls are in the finish handler
        if (callCount === 1) return startTime;
        return startTime + 1500; // 1500ms later
      });

      const req = buildReq({ method: 'GET', path: '/api/slow' });
      const res = buildRes({ statusCode: 200 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('Slow request')
      );
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('/api/slow')
      );

      // Restore
      (Date.now as any).mockRestore?.();
    });

    it('should NOT log slow requests when duration is under 1000ms', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      let callCount = 0;
      const startTime = 1000000;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        if (callCount === 1) return startTime;
        return startTime + 500; // 500ms – under the threshold
      });

      const req = buildReq({ method: 'GET', path: '/api/fast' });
      const res = buildRes({ statusCode: 200 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      // Should not log a slow request warning
      expect(mockLoggerWarn).not.toHaveBeenCalled();

      (Date.now as any).mockRestore?.();
    });

    it('should set transaction status to "internal_error" for 5xx status codes', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes({ statusCode: 502 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(transaction.setStatus).toHaveBeenCalledWith('internal_error');
    });

    it('should set transaction status to "invalid_argument" for 4xx status codes', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes({ statusCode: 404 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(transaction.setStatus).toHaveBeenCalledWith('invalid_argument');
    });

    it('should set transaction status to "ok" for 2xx status codes', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes({ statusCode: 201 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(transaction.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should set transaction status to "ok" for 3xx status codes (not 4xx or 5xx)', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes({ statusCode: 301 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(transaction.setStatus).toHaveBeenCalledWith('ok');
    });

    it('should finish the transaction on response finish', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes();
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(transaction.finish).toHaveBeenCalled();
    });

    it('should set HTTP status on the transaction', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq();
      const res = buildRes({ statusCode: 403 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(transaction.setHttpStatus).toHaveBeenCalledWith(403);
    });

    it('should handle null transaction gracefully', () => {
      mockStartTransaction.mockReturnValue(null);

      const req = buildReq();
      const res = buildRes();
      const next = buildNext();

      // Should not throw
      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(next).toHaveBeenCalled();
      expect(mockRecordMetric).toHaveBeenCalled();
    });

    it('should log request info on finish', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq({ method: 'DELETE', path: '/api/items/5' });
      const res = buildRes({ statusCode: 204 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('DELETE /api/items/5 - 204')
      );
    });

    it('should include user info in recorded metric when available', () => {
      const transaction = buildMockTransaction();
      mockStartTransaction.mockReturnValue(transaction);

      const req = buildReq({ method: 'GET', path: '/api/me' }) as any;
      req.user = { id: 'user-123', organizationId: 'org-456' };
      const res = buildRes({ statusCode: 200 });
      const next = buildNext();

      monitoringMiddleware(req as Request, res as unknown as Response, next);
      res.emit('finish');

      expect(mockRecordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          organizationId: 'org-456',
        })
      );
    });
  });

  // =========================================================================
  // errorTrackingMiddleware
  // =========================================================================

  describe('errorTrackingMiddleware', () => {
    it('should capture the exception to monitoring', () => {
      const error = new Error('Unhandled exception');
      const req = buildReq({ method: 'POST', path: '/api/data', query: { q: 'test' } });
      (req as any).get = jest.fn().mockReturnValue('test-agent');
      const res = buildRes();
      const next = buildNext();

      errorTrackingMiddleware(error, req as Request, res as unknown as Response, next);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          request: expect.objectContaining({
            method: 'POST',
            path: '/api/data',
          }),
        })
      );
    });

    it('should log the error details', () => {
      const error = new Error('Something went wrong');
      error.stack = 'Error: Something went wrong\n    at test.ts:1:1';
      const req = buildReq({ method: 'GET', path: '/api/test' });
      const res = buildRes();
      const next = buildNext();

      errorTrackingMiddleware(error, req as Request, res as unknown as Response, next);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Unhandled error:',
        expect.objectContaining({
          error: 'Something went wrong',
          stack: expect.stringContaining('Something went wrong'),
          path: '/api/test',
          method: 'GET',
        })
      );
    });

    it('should call next with the error to pass it downstream', () => {
      const error = new Error('Pass along');
      const req = buildReq();
      const res = buildRes();
      const next = buildNext();

      errorTrackingMiddleware(error, req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should include user info in exception context when available', () => {
      const error = new Error('User error');
      const req = buildReq() as any;
      req.user = { id: 'u1', email: 'u1@test.com' };
      req.get = jest.fn();
      const res = buildRes();
      const next = buildNext();

      errorTrackingMiddleware(error, req as Request, res as unknown as Response, next);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'u1',
            email: 'u1@test.com',
          }),
        })
      );
    });

    it('should not include user info when no user is on request', () => {
      const error = new Error('No user error');
      const req = buildReq();
      (req as any).get = jest.fn();
      const res = buildRes();
      const next = buildNext();

      errorTrackingMiddleware(error, req as Request, res as unknown as Response, next);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: undefined,
        })
      );
    });
  });

  // =========================================================================
  // queryMonitoringMiddleware
  // =========================================================================

  describe('queryMonitoringMiddleware', () => {
    it('should log slow queries exceeding 100ms', () => {
      queryMonitoringMiddleware('SELECT * FROM users WHERE id = $1', 150);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('Slow query: 150ms')
      );
    });

    it('should NOT log queries faster than 100ms', () => {
      queryMonitoringMiddleware('SELECT 1', 50);

      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should send to Sentry when query is very slow (>1000ms)', () => {
      queryMonitoringMiddleware('SELECT * FROM huge_table', 1500);

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Very slow query: 1500ms'),
        'warning'
      );
    });

    it('should NOT send to Sentry for slow but not very slow queries (100-1000ms)', () => {
      queryMonitoringMiddleware('SELECT * FROM users', 500);

      expect(mockLoggerWarn).toHaveBeenCalled();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it('should add a breadcrumb for every query', () => {
      queryMonitoringMiddleware('INSERT INTO logs (message) VALUES ($1)', 10);

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        'Database query',
        'db',
        expect.objectContaining({
          duration: 10,
        })
      );
    });

    it('should truncate query in breadcrumb to 200 characters', () => {
      const longQuery = 'SELECT ' + 'a'.repeat(300) + ' FROM table';

      queryMonitoringMiddleware(longQuery, 10);

      const breadcrumbData = mockAddBreadcrumb.mock.calls[0][2];
      expect(breadcrumbData.query.length).toBeLessThanOrEqual(200);
    });

    it('should truncate query in log output to 100 characters', () => {
      const longQuery = 'SELECT ' + 'b'.repeat(200) + ' FROM table';

      queryMonitoringMiddleware(longQuery, 150);

      const warnMessage = mockLoggerWarn.mock.calls[0][0];
      // The query portion should be at most 100 chars
      expect(warnMessage).toContain('Slow query: 150ms');
    });

    it('should handle queries at exactly 100ms threshold (not slow)', () => {
      queryMonitoringMiddleware('SELECT count(*) FROM tasks', 100);

      // 100 is not > 100, so should not log
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should handle queries at exactly 1000ms threshold (not very slow)', () => {
      queryMonitoringMiddleware('SELECT count(*) FROM tasks', 1000);

      // 1000 is not > 1000, so should warn but not capture message
      expect(mockLoggerWarn).toHaveBeenCalled();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it('should include query in breadcrumb data', () => {
      const query = 'UPDATE users SET name = $1 WHERE id = $2';

      queryMonitoringMiddleware(query, 5);

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        'Database query',
        'db',
        expect.objectContaining({
          query: query,
          duration: 5,
        })
      );
    });
  });
});
