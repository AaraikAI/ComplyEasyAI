/**
 * Joi validation schemas for data anonymization routes.
 * Covers: preview anonymization, DSAR export anonymization.
 */
import Joi from 'joi';

const validMethods = ['pseudonymization', 'masking', 'generalization', 'suppression', 'kAnonymity'] as const;

const fieldConfigSchema = Joi.object().pattern(
  Joi.string().max(200),
  Joi.object({
    method: Joi.string().valid(...validMethods).required(),
  }).unknown(true),
);

export const previewAnonymizationSchema = Joi.object({
  records: Joi.array().items(Joi.object()).min(1).required(),
  fieldConfig: fieldConfigSchema.required(),
}).unknown(false);

export const dsarExportAnonymizationSchema = Joi.object({
  dsarId: Joi.string().required().min(1).max(200),
  fieldConfig: fieldConfigSchema.allow(null).optional(),
}).unknown(false);
