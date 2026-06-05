/**
 * Joi validation schemas for regulatory change tracking routes.
 * Covers: regulatory change CRUD, impact assessments.
 */
import Joi from 'joi';

const validChangeTypes = ['NEW_REGULATION', 'AMENDMENT', 'GUIDANCE', 'ENFORCEMENT', 'REPEAL'] as const;
const validStatuses = ['NEW', 'REVIEWING', 'IN_PROGRESS', 'REG_RESOLVED', 'DISMISSED'] as const;
const validImpactLevels = ['Low', 'Medium', 'High', 'Critical'] as const;

export const createRegulatoryChangeSchema = Joi.object({
  regulationName: Joi.string().required().min(1).max(500).trim(),
  changeType: Joi.string().valid(...validChangeTypes).required(),
  title: Joi.string().required().min(1).max(500).trim(),
  summary: Joi.string().required().min(1).max(10000),
  // Restrict to http/https schemes; if this URL is ever fetched server-side it must also pass isUrlSafe().
  sourceUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(2000).allow('', null).optional(),
  effectiveDate: Joi.date().iso().allow(null).optional(),
  impactAnalysis: Joi.string().max(10000).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  impactLevel: Joi.string().valid(...validImpactLevels).optional(),
  requiredAction: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateRegulatoryChangeSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  summary: Joi.string().min(1).max(10000).optional(),
  status: Joi.string().valid(...validStatuses).optional(),
  impactAnalysis: Joi.string().max(10000).allow('', null).optional(),
  // Restrict to http/https schemes; if this URL is ever fetched server-side it must also pass isUrlSafe().
  sourceUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(2000).allow('', null).optional(),
  effectiveDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

export const createImpactAssessmentSchema = Joi.object({
  controlId: Joi.string().required().min(1).max(200),
  impactLevel: Joi.string().valid(...validImpactLevels).required(),
  requiredAction: Joi.string().required().min(1).max(5000),
}).unknown(false);

export const updateImpactSchema = Joi.object({
  status: Joi.string().valid(...validStatuses).optional(),
  impactLevel: Joi.string().valid(...validImpactLevels).optional(),
  requiredAction: Joi.string().min(1).max(5000).optional(),
}).min(1).unknown(false);
