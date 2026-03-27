/**
 * Joi validation schemas for custom role management routes.
 * Covers: role CRUD, permission management, role assignment.
 */
import Joi from 'joi';

const validActions = ['create', 'read', 'update', 'delete', 'approve', 'export'] as const;
const validScopes = ['OWN', 'TEAM', 'DEPARTMENT', 'ORG'] as const;

const permissionSchema = Joi.object({
  resource: Joi.string().required().min(1).max(200).trim(),
  action: Joi.string().valid(...validActions).required(),
  scope: Joi.string().valid(...validScopes).optional(),
});

export const createRoleSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  description: Joi.string().max(2000).allow('', null).optional(),
  permissions: Joi.array().items(permissionSchema).allow(null).optional(),
}).unknown(false);

export const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
}).min(1).unknown(false);

export const addPermissionSchema = Joi.object({
  resource: Joi.string().required().min(1).max(200).trim(),
  action: Joi.string().valid(...validActions).required(),
  scope: Joi.string().valid(...validScopes).optional(),
}).unknown(false);

export const assignRoleSchema = Joi.object({
  userId: Joi.string().required().min(1).max(200),
  roleId: Joi.string().required().min(1).max(200),
}).unknown(false);
