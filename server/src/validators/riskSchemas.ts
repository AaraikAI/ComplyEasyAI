import Joi from 'joi';

export const createRiskSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().required(),
  description: Joi.string().max(5000).allow('', null).optional(),
  category: Joi.string().max(100).optional(),
  severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').optional(),
  likelihood: Joi.string().valid('Very Likely', 'Likely', 'Possible', 'Unlikely', 'Rare').optional(),
  impact: Joi.string().valid('Catastrophic', 'Major', 'Moderate', 'Minor', 'Negligible').optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Mitigated', 'Closed', 'Accepted').optional(),
  owner: Joi.string().max(200).allow('', null).optional(),
  mitigationPlan: Joi.string().max(5000).allow('', null).optional(),
  frameworkId: Joi.string().allow(null).optional(),
}).unknown(false);

export const updateRiskSchema = createRiskSchema.min(1);
