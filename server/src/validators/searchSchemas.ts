/**
 * Joi validation schemas for search routes.
 * Covers: save recent search.
 */
import Joi from 'joi';

export const saveRecentSearchSchema = Joi.object({
  query: Joi.string().required().min(1).max(500).trim(),
  filters: Joi.object().allow(null).optional(),
}).unknown(false);
