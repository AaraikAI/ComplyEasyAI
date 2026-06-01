import Joi from 'joi';

export const createAISystemSchema = Joi.object({
  name: Joi.string().min(1).max(500).trim().required(),
  description: Joi.string().max(5000).allow('', null).optional(),
  version: Joi.string().max(50).allow('', null).optional(),
  vendor: Joi.string().max(200).allow('', null).optional(),
  purpose: Joi.string().max(2000).allow('', null).optional(),
  lifecycle_stage: Joi.string().optional(),
  riskLevel: Joi.string().valid('Critical', 'High', 'Medium', 'Low').optional(),
  category: Joi.string().max(100).optional(),
  deploymentType: Joi.string().optional(),
  dataTypes: Joi.any().optional(),
  userCount: Joi.number().integer().min(0).optional(),
  automationLevel: Joi.string().optional(),
  status: Joi.string().optional(),
}).unknown(false);

// Partial updates (PATCH/PUT): relax `name` to optional so callers may update
// any subset of fields. `.min(1)` still requires at least one property be present.
export const updateAISystemSchema = createAISystemSchema
  .fork(['name'], (s) => s.optional())
  .min(1);
