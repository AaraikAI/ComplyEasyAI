import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import monitoring from '../config/monitoring';
import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle JSON parse errors from express.json() middleware
  if ('type' in err && (err as any).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  // Handle payload too large from express.json() middleware
  if ('type' in err && (err as any).type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large', message: 'Maximum payload size is 10MB' });
    return;
  }

  if (err instanceof AppError) {
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Log security-relevant HTTP errors as security events
    if (err.statusCode === 401) {
      logSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_FAILURE,
        severity: 'medium',
        message: err.message,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId: (req as any).user?.id,
      });
    } else if (err.statusCode === 403) {
      logSecurityEvent({
        type: SecurityEventType.AUTHORIZATION_FAILURE,
        severity: 'high',
        message: err.message,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId: (req as any).user?.id,
      });
    }

    res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Unhandled errors
  logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, err);
  
  // Capture to Sentry (if not already captured by errorTrackingMiddleware)
  monitoring.captureException(err, {
    request: {
      method: req.method,
      path: req.originalUrl,
      query: req.query,
    },
    user: (req as any).user ? {
      id: (req as any).user.id,
      email: (req as any).user.email,
    } : undefined,
  });

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};
