/**
 * Request-body validation middleware using Joi.
 * Validates req.body and replaces it with the sanitized result; returns 400 on validation error.
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../config/logger';
import { AppError } from './errorHandler';

type SchemaLike = Joi.ObjectSchema | Joi.ArraySchema;

export function validateBody(schema: SchemaLike) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      logger.warn('Validation failed', { path: req.path, method: req.method, errors: error.details });
      next(new AppError(message, 400));
      return;
    }

    req.body = value;
    next();
  };
}

export function validateQuery(schema: SchemaLike) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      logger.warn('Query validation failed', { path: req.path, method: req.method, errors: error.details });
      next(new AppError(message, 400));
      return;
    }

    req.query = value;
    next();
  };
}

export function validateParams(schema: SchemaLike) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      logger.warn('Params validation failed', { path: req.path, method: req.method, errors: error.details });
      next(new AppError(message, 400));
      return;
    }

    req.params = value as Record<string, string>;
    next();
  };
}

interface MultipartValidateOptions {
  jsonFields?: string[];
}

export function validateMultipartBody(schema: SchemaLike, options: MultipartValidateOptions = {}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (options.jsonFields?.length) {
      for (const field of options.jsonFields) {
        const raw = req.body?.[field];
        if (typeof raw === 'string' && raw.length > 0) {
          try {
            req.body[field] = JSON.parse(raw);
          } catch {
            next(new AppError(`Field "${field}" must be valid JSON`, 400));
            return;
          }
        }
      }
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      logger.warn('Multipart body validation failed', { path: req.path, method: req.method, errors: error.details });
      next(new AppError(message, 400));
      return;
    }

    req.body = value;
    next();
  };
}
