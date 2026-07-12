/**
 * Monitoring Middleware
 * Tracks performance and errors for APM
 */

import { Request, Response, NextFunction } from 'express';
import monitoring from '../config/monitoring';
import performanceMonitor from '../config/performanceMonitoring';
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
    if (typeof transaction.setData === 'function') {
      transaction.setData('method', req.method);
      transaction.setData('path', req.path);
      transaction.setData('query', req.query);
      transaction.setData('ip', req.ip);
    }
  }

  // Add breadcrumb
  monitoring.addBreadcrumb(
    `${req.method} ${req.path}`,
    'http',
    {
      method: req.method,
      path: req.path,
    }
  );

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Record performance metric
    performanceMonitor.recordMetric({
      endpoint: req.path,
      method: req.method,
      responseTime: duration,
      statusCode: res.statusCode,
      timestamp: new Date(),
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId,
    });

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

    // Log access metrics. Only method/path/status/duration are emitted — no
    // request body, headers, or tokens — so this is safe observability data.
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
  // Distinguish expected operational client errors (4xx AppErrors — validation,
  // not-found, auth) from unexpected server-side failures. Only the latter are
  // defects worth reporting to Sentry; capturing every 400/401/404 floods the
  // dashboard and buries genuine incidents.
  const statusCode: number =
    (error as any).statusCode ?? (error as any).status ?? 500;
  const isExpectedClientError =
    (error as any).isOperational === true && statusCode >= 400 && statusCode < 500;

  if (!isExpectedClientError) {
    // This is the single Sentry capture point for unhandled/server errors; the
    // global errorHandler no longer re-captures, so 5xx are reported exactly once.
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
  }

  // Server failures are error-level; expected client errors are warn-level so
  // they don't masquerade as incidents in the logs either.
  if (isExpectedClientError) {
    logger.warn(`Client error ${statusCode}: ${error.message} - ${req.method} ${req.path}`);
  } else {
    logger.error('Unhandled error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  }

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
