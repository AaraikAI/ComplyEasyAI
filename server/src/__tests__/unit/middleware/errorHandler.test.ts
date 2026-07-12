import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    debug: jest.fn(),
  },
}));

const mockCaptureException = jest.fn();

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: {
    captureException: (...args: unknown[]) => mockCaptureException(...args),
    captureMessage: jest.fn(),
    setUserContext: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import module under test
// ---------------------------------------------------------------------------

import { AppError, errorHandler, notFound } from '../../../middleware/errorHandler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(overrides: Record<string, any> = {}): Partial<Request> {
  return {
    originalUrl: '/api/test',
    method: 'GET',
    ip: '127.0.0.1',
    query: {},
    ...overrides,
  } as Partial<Request>;
}

function buildRes(): {
  res: Partial<Response>;
  statusFn: jest.Mock;
  jsonFn: jest.Mock;
} {
  const jsonFn = jest.fn().mockReturnThis() as jest.Mock;
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn }) as jest.Mock;
  return {
    res: { status: statusFn, json: jsonFn } as unknown as Partial<Response>,
    statusFn,
    jsonFn,
  };
}

function buildNext(): jest.Mock {
  return jest.fn() as jest.Mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Error Handler Middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // =========================================================================
  // AppError class
  // =========================================================================

  describe('AppError', () => {
    it('should create an error with the given message and statusCode', () => {
      const error = new AppError('Not Found', 404);

      expect(error.message).toBe('Not Found');
      expect(error.statusCode).toBe(404);
    });

    it('should set isOperational to true', () => {
      const error = new AppError('Bad Request', 400);

      expect(error.isOperational).toBe(true);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Server Error', 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should capture a stack trace', () => {
      const error = new AppError('Test Error', 500);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack!.length).toBeGreaterThan(0);
    });

    it('should preserve various HTTP status codes', () => {
      const codes = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503];

      codes.forEach((code) => {
        const error = new AppError(`Error ${code}`, code);
        expect(error.statusCode).toBe(code);
      });
    });
  });

  // =========================================================================
  // errorHandler
  // =========================================================================

  describe('errorHandler', () => {
    it('should respond with the AppError statusCode and message', () => {
      const err = new AppError('Resource not found', 404);
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Resource not found' })
      );
    });

    it('should respond with 500 and generic message for non-AppError', () => {
      const err = new Error('Something broke');
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Internal server error' })
      );
    });

    it('should include stack trace in development environment for AppError', () => {
      process.env.NODE_ENV = 'development';
      const err = new AppError('Dev error', 400);
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(400);
      const responseBody = jsonFn.mock.calls[0][0];
      expect(responseBody).toHaveProperty('stack');
      expect(responseBody.error).toBe('Dev error');
    });

    it('should NOT include stack trace in production environment for AppError', () => {
      process.env.NODE_ENV = 'production';
      const err = new AppError('Prod error', 400);
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(400);
      const responseBody = jsonFn.mock.calls[0][0];
      expect(responseBody).not.toHaveProperty('stack');
      expect(responseBody.error).toBe('Prod error');
    });

    it('should include stack and message in development for non-AppError', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('Dev internal error');
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(500);
      const responseBody = jsonFn.mock.calls[0][0];
      expect(responseBody.error).toBe('Internal server error');
      expect(responseBody).toHaveProperty('message', 'Dev internal error');
      expect(responseBody).toHaveProperty('stack');
    });

    it('should NOT include stack or message in production for non-AppError', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('Prod internal error');
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(500);
      const responseBody = jsonFn.mock.calls[0][0];
      expect(responseBody.error).toBe('Internal server error');
      expect(responseBody).not.toHaveProperty('message');
      expect(responseBody).not.toHaveProperty('stack');
    });

    it('should NOT re-capture non-AppError errors (capture happens once, upstream in errorTrackingMiddleware)', () => {
      // Sentry capture was moved to errorTrackingMiddleware, which runs before
      // this handler. errorHandler re-capturing here double-reported every 5xx,
      // so it no longer calls captureException at all.
      const err = new Error('Unexpected crash');
      const req = buildReq({ method: 'POST', originalUrl: '/api/data' });
      const { res } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should NOT call monitoring.captureException for AppError', () => {
      const err = new AppError('Expected error', 400);
      const req = buildReq();
      const { res } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('should log the error for AppError', () => {
      const err = new AppError('Logged error', 422);
      const req = buildReq({ originalUrl: '/api/items', method: 'PUT', ip: '10.0.0.1' });
      const { res } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('422')
      );
    });

    it('should log the error for non-AppError', () => {
      const err = new Error('Unhandled error');
      const req = buildReq({ originalUrl: '/api/data', method: 'DELETE', ip: '192.168.0.1' });
      const { res } = buildRes();
      const next = buildNext();

      errorHandler(err, req as Request, res as Response, next);

      expect(mockLoggerError).toHaveBeenCalled();
    });

    // Note: Sentry capture (incl. user context) moved to errorTrackingMiddleware,
    // which runs before errorHandler. That capture behavior is covered by
    // monitoring.test.ts ("errorTrackingMiddleware ... should include user info").
    // errorHandler itself no longer calls captureException (see the "should NOT
    // re-capture" test above), so the old capture-context tests were removed.
  });

  // =========================================================================
  // notFound
  // =========================================================================

  describe('notFound', () => {
    it('should return 404 with the requested route path', () => {
      const req = buildReq({ originalUrl: '/api/nonexistent' });
      const { res, statusFn, jsonFn } = buildRes();

      notFound(req as Request, res as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith({
        error: 'Route /api/nonexistent not found',
      });
    });

    it('should include the full original URL in the message', () => {
      const req = buildReq({ originalUrl: '/api/v2/users/123/profile' });
      const { res, statusFn, jsonFn } = buildRes();

      notFound(req as Request, res as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith({
        error: 'Route /api/v2/users/123/profile not found',
      });
    });

    it('should handle root path', () => {
      const req = buildReq({ originalUrl: '/' });
      const { res, statusFn, jsonFn } = buildRes();

      notFound(req as Request, res as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
      expect(jsonFn).toHaveBeenCalledWith({
        error: 'Route / not found',
      });
    });
  });
});
