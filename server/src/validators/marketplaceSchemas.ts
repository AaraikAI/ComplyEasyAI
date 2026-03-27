/**
 * Joi validation schemas for marketplace routes.
 * Covers: install integration, configure integration.
 */
import Joi from 'joi';

export const installIntegrationSchema = Joi.object({
  config: Joi.object().allow(null).optional(),
}).unknown(false);

export const configureIntegrationSchema = Joi.object({
  config: Joi.object().allow(null).optional(),
}).unknown(false);
