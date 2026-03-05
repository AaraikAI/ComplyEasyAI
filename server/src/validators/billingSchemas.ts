import Joi from 'joi';

export const checkoutSchema = Joi.object({
  tier: Joi.string().valid('Foundation', 'Essentials', 'Growth', 'Visionary').required(),
  billingCycle: Joi.string().valid('monthly', 'annual').required(),
  addOns: Joi.array().items(Joi.string()).optional(),
  successUrl: Joi.string().uri().optional(),
  cancelUrl: Joi.string().uri().optional(),
}).unknown(false);

export const changeTierSchema = Joi.object({
  targetTier: Joi.string().valid('Foundation', 'Essentials', 'Growth', 'Visionary').required(),
  billingCycle: Joi.string().valid('monthly', 'annual').optional(),
  immediate: Joi.boolean().optional(),
}).unknown(false);

export const cancelSubscriptionSchema = Joi.object({
  atPeriodEnd: Joi.boolean().optional(),
  reason: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

export const addAddonSchema = Joi.object({
  addOnId: Joi.string().required(),
}).unknown(false);

export const requestQuoteSchema = Joi.object({
  tier: Joi.string().required(),
  requirements: Joi.object().optional(),
}).unknown(false);
