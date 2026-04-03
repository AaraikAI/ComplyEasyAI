import Joi from 'joi';

export const magicLinkSchema = Joi.object({
  email: Joi.string().email().required(),
  captchaToken: Joi.string().allow('', null).optional(),
}).unknown(false);

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  captchaToken: Joi.string().allow('', null).optional(),
}).unknown(false);

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().min(1).max(200).trim().required(),
  organizationName: Joi.string().min(1).max(100).trim().optional(),
  industry: Joi.string().max(100).allow('', null).optional(),
  companySize: Joi.string().max(50).allow('', null).optional(),
  primaryComplianceGoal: Joi.string().max(200).allow('', null).optional(),
  howDidYouHear: Joi.string().max(200).allow('', null).optional(),
  captchaToken: Joi.string().allow('', null).optional(),
}).unknown(false);

export const completeTwoFactorSchema = Joi.object({
  twoFactorToken: Joi.string().required(),
  token: Joi.string().required(),
}).unknown(false);

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  email: Joi.string().email().optional(),
}).min(1).unknown(false);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
}).unknown(false);

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
}).unknown(false);

export const resetPasswordSchema = Joi.object({
  token: Joi.string().min(1).required(),
  password: Joi.string().min(8).max(128).required(),
}).unknown(false);
