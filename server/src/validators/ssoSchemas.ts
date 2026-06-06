/**
 * Joi request-body validation schemas for SSO configuration routes.
 * Used by validateBody middleware to reject invalid input before hitting handlers.
 */
import Joi from 'joi';

const ssoProviders = ['SAML', 'OIDC', 'AZURE_AD', 'OKTA', 'GOOGLE_WORKSPACE', 'ONELOGIN', 'PING_IDENTITY'] as const;
const defaultRoles = ['admin', 'editor', 'viewer', 'auditor'] as const;

// POST /config — Create or update SSO configuration
export const upsertSSOConfigSchema = Joi.object({
  provider: Joi.string().valid(...ssoProviders).required(),
  enabled: Joi.boolean().optional(),
  entityId: Joi.string().max(500).allow('', null).optional(),
  ssoUrl: Joi.string().uri({ scheme: ['http', 'https'] }).allow('', null).optional(),
  certificate: Joi.string().max(10000).allow('', null).optional(),
  metadataUrl: Joi.string().uri({ scheme: ['http', 'https'] }).allow('', null).optional(),
  attributeMapping: Joi.object().allow(null).optional(),
  defaultRole: Joi.string().valid(...defaultRoles).optional(),
  autoProvision: Joi.boolean().optional(),
  domains: Joi.array().items(Joi.string().max(253).trim()).allow(null).optional(),
}).unknown(false);
