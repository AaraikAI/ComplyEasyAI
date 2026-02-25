/**
 * Standardized API Response Middleware
 *
 * Provides consistent error response format with error codes across all endpoints.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import monitoring from '../config/monitoring';
import { CorrelatedRequest } from './correlationId';

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Standardized error codes for API responses
 */
export const ErrorCodes = {
  // Authentication errors (1xxx)
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_2FA_REQUIRED: 'AUTH_2FA_REQUIRED',
  AUTH_2FA_INVALID: 'AUTH_2FA_INVALID',

  // Authorization errors (2xxx)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TIER_REQUIRED: 'TIER_REQUIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Validation errors (3xxx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resource errors (4xxx)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business logic errors (5xxx)
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',

  // External service errors (6xxx)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',

  // Server errors (7xxx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Standardized error response format
 */
export interface StandardErrorResponse {
  status: 'error';
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
    timestamp: string;
  };
}

/**
 * Standardized success response format
 */
export interface StandardSuccessResponse<T = unknown> {
  status: 'success';
  data: T;
  meta?: {
    requestId?: string;
    correlationId?: string;
    timestamp: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

/**
 * Extended AppError with error code
 */
export class ApiError extends Error {
  statusCode: number;
  code: ErrorCode;
  details?: Record<string, unknown>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(message, 401, ErrorCodes.AUTH_REQUIRED);
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(message, 403, ErrorCodes.FORBIDDEN);
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, 404, ErrorCodes.RESOURCE_NOT_FOUND);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, ErrorCodes.CONFLICT);
  }

  static tooManyRequests(message = 'Rate limit exceeded'): ApiError {
    return new ApiError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }

  static externalService(service: string, message: string): ApiError {
    return new ApiError(`${service}: ${message}`, 502, ErrorCodes.EXTERNAL_SERVICE_ERROR);
  }

  static circuitOpen(service: string): ApiError {
    return new ApiError(`Service temporarily unavailable: ${service}`, 503, ErrorCodes.CIRCUIT_OPEN);
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Standardized error handler middleware.
 * Converts all errors to a consistent response format.
 */
export function standardErrorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlatedReq = req as CorrelatedRequest;
  const requestId = correlatedReq.requestId || uuidv4();
  const correlationId = correlatedReq.correlationId || 'unknown';
  const timestamp = new Date().toISOString();

  // Determine error details
  let statusCode = 500;
  let code: ErrorCode = ErrorCodes.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: Record<string, unknown> | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Joi validation errors
    statusCode = 400;
    code = ErrorCodes.VALIDATION_ERROR;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ErrorCodes.AUTH_INVALID_TOKEN;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ErrorCodes.AUTH_TOKEN_EXPIRED;
    message = 'Token expired';
  }

  // Log error
  const logContext = {
    requestId,
    correlationId,
    statusCode,
    code,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  };

  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, { ...logContext, stack: err.stack });
    monitoring.captureException(err, {
      request: { method: req.method, path: req.originalUrl, query: req.query },
      user: (req as any).user ? { id: (req as any).user.id } : undefined,
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, logContext);
  }

  // Build response
  const response: StandardErrorResponse = {
    status: 'error',
    error: {
      code,
      message,
      requestId,
      correlationId,
      timestamp,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(response);
}

/**
 * Response helpers attached to res object
 */
export interface StandardResponseHelpers {
  success: <T>(data: T, statusCode?: number) => void;
  paginated: <T>(data: T[], total: number, page: number, pageSize: number) => void;
  created: <T>(data: T) => void;
  noContent: () => void;
}

/**
 * Middleware that adds standardized response helpers to the response object
 */
export function standardResponseMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlatedReq = req as CorrelatedRequest;
    const timestamp = new Date().toISOString();

    // Add success response helper
    (res as any).success = function <T>(data: T, statusCode = 200): void {
      const response: StandardSuccessResponse<T> = {
        status: 'success',
        data,
        meta: {
          requestId: correlatedReq.requestId,
          correlationId: correlatedReq.correlationId,
          timestamp,
        },
      };
      res.status(statusCode).json(response);
    };

    // Add paginated response helper
    (res as any).paginated = function <T>(
      data: T[],
      total: number,
      page: number,
      pageSize: number
    ): void {
      const totalPages = Math.ceil(total / pageSize);
      const response: StandardSuccessResponse<T[]> = {
        status: 'success',
        data,
        meta: {
          requestId: correlatedReq.requestId,
          correlationId: correlatedReq.correlationId,
          timestamp,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasMore: page < totalPages - 1,
          },
        },
      };
      res.status(200).json(response);
    };

    // Add created response helper
    (res as any).created = function <T>(data: T): void {
      (res as any).success(data, 201);
    };

    // Add no content response helper
    (res as any).noContent = function (): void {
      res.status(204).send();
    };

    next();
  };
}

/**
 * Not found handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const correlatedReq = req as CorrelatedRequest;
  const response: StandardErrorResponse = {
    status: 'error',
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      requestId: correlatedReq.requestId,
      correlationId: correlatedReq.correlationId,
      timestamp: new Date().toISOString(),
    },
  };
  res.status(404).json(response);
}

export default {
  standardErrorHandler,
  standardResponseMiddleware,
  notFoundHandler,
  ApiError,
  ErrorCodes,
};
