import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
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

  // Handle Multer file upload errors
  if (err instanceof MulterError) {
    const multerMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_FIELD_KEY: 'Field name is too long',
      LIMIT_FIELD_VALUE: 'Field value is too long',
      LIMIT_FIELD_COUNT: 'Too many fields in the request',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
      LIMIT_PART_COUNT: 'Too many parts in the request',
    };
    const message = multerMessages[err.code] || `File upload error: ${err.message}`;
    logger.warn(`Multer error: ${err.code} - ${err.message} - ${req.originalUrl}`);
    res.status(400).json({ error: message });
    return;
  }

  // Handle Prisma known request errors
  if (err.constructor?.name === 'PrismaClientKnownRequestError' && 'code' in err) {
    const prismaErr = err as any;
    switch (prismaErr.code) {
      case 'P2002': {
        const target = prismaErr.meta?.target || 'field';
        logger.warn(`Prisma unique constraint violation on ${target} - ${req.originalUrl}`);
        res.status(409).json({ error: `A record with that ${target} already exists` });
        return;
      }
      case 'P2025': {
        logger.warn(`Prisma record not found - ${req.originalUrl}`);
        res.status(404).json({ error: 'Record not found' });
        return;
      }
      case 'P2003': {
        const field = prismaErr.meta?.field_name || 'reference';
        logger.warn(`Prisma foreign key constraint failed on ${field} - ${req.originalUrl}`);
        res.status(400).json({ error: `Invalid reference: related record does not exist` });
        return;
      }
      default:
        // Let other Prisma errors fall through to 500 handler
        break;
    }
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
