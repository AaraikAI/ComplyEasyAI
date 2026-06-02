/**
 * Request-body validation middleware using Joi.
 * Validates req.body and replaces it with the sanitized result; returns 400 on validation error.
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../config/logger';
import { AppError } from './errorHandler';

type SchemaLike = Joi.ObjectSchema | Joi.ArraySchema;

// Strip context.value (carries rejected input — passwords, tokens, etc.) before logging.
function sanitizeDetails(details: Joi.ValidationErrorItem[]) {
  return details.map((d) => ({ message: d.message, path: d.path, type: d.type }));
}

export function validateBody(schema: SchemaLike) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      logger.warn('Validation failed', { path: req.path, method: req.method, errors: sanitizeDetails(error.details) });
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
      logger.warn('Query validation failed', { path: req.path, method: req.method, errors: sanitizeDetails(error.details) });
      next(new AppError(message, 400));
      return;
    }

    // Express 5 exposes req.query via a getter with no setter, so a direct
    // assignment throws. Shadow it with the validated/coerced value as an own
    // data property instead.
    Object.defineProperty(req, 'query', { value, writable: true, configurable: true, enumerable: true });
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
      logger.warn('Params validation failed', { path: req.path, method: req.method, errors: sanitizeDetails(error.details) });
      next(new AppError(message, 400));
      return;
    }

    // Same Express 5 getter caveat as req.query — define an own data property.
    Object.defineProperty(req, 'params', { value: value as Record<string, string>, writable: true, configurable: true, enumerable: true });
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
      logger.warn('Multipart body validation failed', { path: req.path, method: req.method, errors: sanitizeDetails(error.details) });
      next(new AppError(message, 400));
      return;
    }

    req.body = value;
    next();
  };
}
