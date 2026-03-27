/**
 * Joi validation schemas for CI/CD compliance gate routes.
 * Covers: gate policy CRUD, compliance check, report results.
 */
import Joi from 'joi';

export const createGatePolicySchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  rules: Joi.object().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(false);

export const updateGatePolicySchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  rules: Joi.object().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1).unknown(false);

export const checkComplianceSchema = Joi.object({
  repository: Joi.string().required().min(1).max(500),
  branch: Joi.string().required().min(1).max(300),
  commitHash: Joi.string().required().min(1).max(100),
  policyId: Joi.string().max(200).allow('', null).optional(),
  checks: Joi.object().pattern(Joi.string(), Joi.boolean()).allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const reportResultSchema = Joi.object({
  policyId: Joi.string().required().min(1).max(200),
  repository: Joi.string().required().min(1).max(500),
  branch: Joi.string().required().min(1).max(300),
  commitHash: Joi.string().required().min(1).max(100),
  status: Joi.string().valid('PASSED', 'FAILED', 'SKIPPED').required(),
  details: Joi.object().allow(null).optional(),
}).unknown(false);
