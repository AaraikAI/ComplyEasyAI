import Joi from 'joi';

export const aiPromptSchema = Joi.object({
  prompt: Joi.string().min(1).max(10000).optional(),
  context: Joi.any().optional(),
  frameworkId: Joi.string().optional(),
  message: Joi.string().max(10000).optional(),
  query: Joi.string().max(10000).optional(),
}).unknown(true);
