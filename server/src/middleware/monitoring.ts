/**
 * Monitoring Middleware
 * Tracks performance and errors for APM
 */

import { Request, Response, NextFunction } from 'express';
import monitoring from '../config/monitoring';
import logger from '../config/logger';

/**
 * Request monitoring middleware
 * Tracks request performance and errors
 */
export function monitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const transaction = monitoring.startTransaction(
    `${req.method} ${req.path}`,
    'http.server'
  );

  // Add request context
  if (transaction) {
    transaction.setData('method', req.method);
    transaction.setData('path', req.path);
    transaction.setData('query', req.query);
    transaction.setData('ip', req.ip);
  }

  // Add breadcrumb
  monitoring.addBreadcrumb(
    `${req.method} ${req.path}`,
    'http',
    {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    }
  );

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }

    // Set transaction status
    if (transaction) {
      // Set HTTP status if method exists
      if (typeof transaction.setHttpStatus === 'function') {
        transaction.setHttpStatus(res.statusCode);
      }
      
      // Set data if method exists
      if (typeof transaction.setData === 'function') {
        transaction.setData('duration', duration);
      }
      
      // Mark as error if 5xx
      if (res.statusCode >= 500) {
        if (typeof transaction.setStatus === 'function') {
          transaction.setStatus('internal_error');
        }
      } else if (res.statusCode >= 400) {
        if (typeof transaction.setStatus === 'function') {
          transaction.setStatus('invalid_argument');
        }
      } else {
        if (typeof transaction.setStatus === 'function') {
          transaction.setStatus('ok');
        }
      }

      // Finish transaction if method exists
      if (typeof transaction.finish === 'function') {
        transaction.finish();
      }
    }

    // Log metrics
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

/**
 * Error tracking middleware
 * Captures errors and sends to Sentry
 */
export function errorTrackingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Capture exception to Sentry
  monitoring.captureException(error, {
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        // Don't log sensitive headers
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
      },
    },
    user: (req as any).user ? {
      id: (req as any).user.id,
      email: (req as any).user.email,
    } : undefined,
  });

  // Log error
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  next(error);
}

/**
 * Performance monitoring middleware
 * Tracks database query performance
 */
export function queryMonitoringMiddleware(
  query: string,
  duration: number,
  params?: any[]
): void {
  // Log slow queries
  if (duration > 100) {
    logger.warn(`Slow query: ${duration}ms - ${query.substring(0, 100)}`);
    
    // Send to Sentry if very slow
    if (duration > 1000) {
      monitoring.captureMessage(`Very slow query: ${duration}ms`, 'warning');
    }
  }

  // Add breadcrumb
  monitoring.addBreadcrumb(
    'Database query',
    'db',
    {
      query: query.substring(0, 200),
      duration,
    }
  );
}

export default {
  monitoringMiddleware,
  errorTrackingMiddleware,
  queryMonitoringMiddleware,
};
