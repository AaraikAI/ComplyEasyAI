/**
 * Joi request-body validation schemas for cookie consent routes.
 * Used by validateBody middleware to reject invalid input before hitting handlers.
 */
import Joi from 'joi';

const cookieCategorySchema = Joi.object({
  essential: Joi.boolean().optional(),
  functional: Joi.boolean().optional(),
  analytics: Joi.boolean().optional(),
  targeting: Joi.boolean().optional(),
  marketing: Joi.boolean().optional(),
}).unknown(false);

// POST /preferences — Save cookie consent preferences
export const saveCookiePreferencesSchema = Joi.object({
  subjectIdentifier: Joi.string().required().min(1).max(500).trim(),
  categories: cookieCategorySchema.required(),
  consentMethod: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

// PATCH /preferences/:subjectId — Update cookie preferences
export const updateCookiePreferencesSchema = Joi.object({
  categories: cookieCategorySchema.required(),
}).unknown(false);

// POST /record — Record consent event
export const recordConsentEventSchema = Joi.object({
  subjectIdentifier: Joi.string().required().min(1).max(500).trim(),
  action: Joi.string().required().min(1).max(100).trim(),
  categories: Joi.object().allow(null).optional(),
}).unknown(false);
