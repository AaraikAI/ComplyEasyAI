import Joi from 'joi';

/**
 * Compliance history route validation schemas.
 */

// GET /compliance/history query parameters
export const complianceHistoryQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(24).optional(),
});
