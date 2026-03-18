import Joi from 'joi';

export const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'editor', 'viewer').optional(),
  name: Joi.string().max(200).required(),
}).unknown(false);

export const bulkInviteSchema = Joi.object({
  invitations: Joi.array().items(Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'editor', 'viewer').optional(),
    name: Joi.string().max(200).required(),
  })).min(1).max(100).required(),
}).unknown(false);

export const updateMemberSchema = Joi.object({
  role: Joi.string().valid('admin', 'editor', 'viewer').optional(),
  active: Joi.boolean().optional(),
}).min(1).unknown(false);
