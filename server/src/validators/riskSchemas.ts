import Joi from 'joi';

export const createRiskSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().required(),
  description: Joi.string().max(5000).allow('', null).optional(),
  category: Joi.string().max(100).optional(),
  severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').optional(),
  likelihood: Joi.alternatives().try(
    Joi.string().valid('Very Likely', 'Likely', 'Possible', 'Unlikely', 'Rare'),
    Joi.number().min(1).max(5)
  ).optional(),
  impact: Joi.alternatives().try(
    Joi.string().valid('Catastrophic', 'Major', 'Moderate', 'Minor', 'Negligible'),
    Joi.number().min(1).max(5)
  ).optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Mitigated', 'Closed', 'Accepted').optional(),
  owner: Joi.string().max(200).allow('', null).optional(),
  assignedToId: Joi.string().allow('', null).optional(),
  targetDate: Joi.date().iso().allow(null).optional(),
  riskScore: Joi.number().min(0).max(100).allow(null).optional(),
  mitigationPlan: Joi.string().max(5000).allow('', null).optional(),
  frameworkId: Joi.string().allow(null).optional(),
}).unknown(false);

export const updateRiskSchema = createRiskSchema.fork(
  ['title'],
  (field) => field.optional()
).min(1);
