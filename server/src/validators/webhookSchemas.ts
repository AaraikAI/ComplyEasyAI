/**
 * Joi validation schemas for webhook routes.
 * Covers: webhook CRUD, API key creation, Zapier subscription.
 */
import Joi from 'joi';

export const createWebhookSchema = Joi.object({
  url: Joi.string().uri().required().max(2000),
  events: Joi.array().items(Joi.string().max(200)).min(1).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  enabled: Joi.boolean().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).allow(null).optional(),
}).unknown(false);

export const updateWebhookSchema = Joi.object({
  url: Joi.string().uri().max(2000).optional(),
  events: Joi.array().items(Joi.string().max(200)).min(1).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  enabled: Joi.boolean().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).allow(null).optional(),
}).min(1).unknown(false);

export const createApiKeySchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  scopes: Joi.array().items(Joi.string().max(100)).min(1).required(),
  expiresAt: Joi.date().iso().allow(null).optional(),
  rateLimit: Joi.number().integer().min(1).max(100000).allow(null).optional(),
}).unknown(false);

export const zapierSubscribeSchema = Joi.object({
  hookUrl: Joi.string().uri().required().max(2000),
  event: Joi.string().required().min(1).max(200),
}).unknown(false);

export const incomingWebhookSchema = Joi.object({
  event: Joi.string().max(200).allow('', null).optional(),
  data: Joi.object().allow(null).optional(),
  timestamp: Joi.date().iso().allow(null).optional(),
}).unknown(true);
