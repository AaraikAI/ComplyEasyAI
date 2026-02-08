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
