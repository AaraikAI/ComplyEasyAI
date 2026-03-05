import Joi from 'joi';

export const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(1).max(100).trim().optional(),
  plan: Joi.string().valid('Foundation', 'Essentials', 'Growth', 'Visionary').optional(),
}).min(1).unknown(false);
