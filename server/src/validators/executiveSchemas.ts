import Joi from 'joi';

/**
 * Executive reporting route validation schemas.
 */

// GET /executive/trends query parameters
export const executiveTrendsQuerySchema = Joi.object({
  periodDays: Joi.number().integer().min(7).max(365).optional(),
});

// POST /executive/board-pack — body is empty or may contain optional filters
export const boardPackSchema = Joi.object({
  frameworkIds: Joi.array().items(Joi.string().uuid()).optional(),
  includeFinancials: Joi.boolean().optional(),
  dateRange: Joi.object({
    start: Joi.date().iso().optional(),
    end: Joi.date().iso().optional(),
  }).optional(),
}).optional().allow({});
