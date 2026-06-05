/**
 * Joi validation schemas for search routes.
 * Covers: save recent search.
 */
import Joi from 'joi';

export const saveRecentSearchSchema = Joi.object({
  query: Joi.string().required().min(1).max(500).trim(),
  // Constrain to the known, bounded filter keys used by search routes so we
  // never persist arbitrary nested payloads under recent-search filters.
  filters: Joi.object({
    type: Joi.string().max(100).trim(),
    framework: Joi.string().max(100).trim(),
    status: Joi.string().max(100).trim(),
  })
    .unknown(false)
    .allow(null)
    .optional(),
}).unknown(false);
