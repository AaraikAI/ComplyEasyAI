/**
 * Joi validation schemas for AI audit preparation routes.
 * Covers: analyze, mock-questions, evidence-package, executive-summary, export-evidence.
 */
import Joi from 'joi';

export const analyzeFrameworkSchema = Joi.object({
  framework: Joi.string().required().min(1).max(200),
}).unknown(false);

export const mockQuestionsSchema = Joi.object({
  count: Joi.number().integer().min(1).max(100).optional(),
  focusArea: Joi.string().max(300).allow('', null).optional(),
}).unknown(false);

export const executiveSummarySchema = Joi.object({
  framework: Joi.string().required().min(1).max(200),
}).unknown(false);

export const exportEvidenceSchema = Joi.object({
  framework: Joi.string().required().min(1).max(200),
  evidenceIds: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
}).unknown(false);
