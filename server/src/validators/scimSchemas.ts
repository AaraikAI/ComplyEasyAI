import Joi from 'joi';

/**
 * SCIM 2.0 request body validation schemas.
 * Validates incoming payloads per RFC 7644.
 */

const scimNameSchema = Joi.object({
  formatted: Joi.string().max(500).optional(),
  givenName: Joi.string().max(200).optional(),
  familyName: Joi.string().max(200).optional(),
}).optional();

const scimEmailSchema = Joi.object({
  value: Joi.string().email().required(),
  type: Joi.string().valid('work', 'home', 'other').optional(),
  primary: Joi.boolean().optional(),
});

// POST /v2/Users — Create a new user
export const scimCreateUserSchema = Joi.object({
  schemas: Joi.array().items(Joi.string()).optional(),
  userName: Joi.string().email().optional(),
  name: scimNameSchema,
  emails: Joi.array().items(scimEmailSchema).optional(),
  displayName: Joi.string().max(500).optional(),
  active: Joi.boolean().optional(),
  externalId: Joi.string().max(255).optional(),
  title: Joi.string().max(255).optional(),
  department: Joi.string().max(255).optional(),
}).custom((value, helpers) => {
  // At least one of userName or emails[0].value is required
  const hasUserName = value.userName;
  const hasEmail = value.emails && value.emails.length > 0 && value.emails[0].value;
  if (!hasUserName && !hasEmail) {
    return helpers.error('any.custom', { message: 'userName or emails[0].value is required' });
  }
  return value;
});

// PUT /v2/Users/:id — Full user replacement
export const scimReplaceUserSchema = Joi.object({
  schemas: Joi.array().items(Joi.string()).optional(),
  userName: Joi.string().email().optional(),
  name: scimNameSchema,
  emails: Joi.array().items(scimEmailSchema).optional(),
  displayName: Joi.string().max(500).optional(),
  active: Joi.boolean().optional(),
  externalId: Joi.string().max(255).optional(),
  title: Joi.string().max(255).optional(),
  department: Joi.string().max(255).optional(),
  id: Joi.string().optional(),
  meta: Joi.object().optional(),
});

// PATCH /v2/Users/:id — Partial update via SCIM operations
const scimOperationSchema = Joi.object({
  op: Joi.string().valid('add', 'replace', 'remove', 'Add', 'Replace', 'Remove').required(),
  path: Joi.string().allow('').optional(),
  value: Joi.any().optional(),
}).rename('Op', 'op', { ignoreUndefined: true })
  .rename('Path', 'path', { ignoreUndefined: true })
  .rename('Value', 'value', { ignoreUndefined: true });

export const scimPatchUserSchema = Joi.object({
  schemas: Joi.array().items(Joi.string()).optional(),
  Operations: Joi.array().items(scimOperationSchema).min(1).required(),
});

// POST /v2/Groups — Create a group
export const scimCreateGroupSchema = Joi.object({
  schemas: Joi.array().items(Joi.string()).optional(),
  displayName: Joi.string().max(255).required(),
  members: Joi.array().items(
    Joi.object({
      value: Joi.string().required(),
      display: Joi.string().optional(),
      $ref: Joi.string().optional(),
    })
  ).optional(),
});

// SCIM list query parameters
export const scimListQuerySchema = Joi.object({
  startIndex: Joi.number().integer().min(1).optional(),
  count: Joi.number().integer().min(1).max(200).optional(),
  filter: Joi.string().max(500).optional(),
});
