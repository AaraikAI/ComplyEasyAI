/**
 * Joi validation schemas for notification routes.
 * Covers: preferences update.
 */
import Joi from 'joi';

const channelBooleans = {
  email: Joi.boolean().optional(),
  slack: Joi.boolean().optional(),
  websocket: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
};

const categoryPrefsSchema = Joi.object({
  email: Joi.boolean().optional(),
  slack: Joi.boolean().optional(),
  websocket: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
}).unknown(false);

export const updateNotificationPreferencesSchema = Joi.object({
  ...channelBooleans,
  categories: Joi.object().pattern(
    Joi.string().max(100),
    categoryPrefsSchema,
  ).allow(null).optional(),
}).unknown(false);
