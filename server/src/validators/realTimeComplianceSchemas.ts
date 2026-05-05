import Joi from 'joi';

export const monitorStreamQuerySchema = Joi.object({
  since: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(500).optional(),
});

export const recomputeScoreBodySchema = Joi.object({
  reason: Joi.string().trim().max(120).optional(),
});

export const publishComplianceEventBodySchema = Joi.object({
  type: Joi.string().trim().min(1).max(80).required(),
  severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  payload: Joi.any().optional(),
});
