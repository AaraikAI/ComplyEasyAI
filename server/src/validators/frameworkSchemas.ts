/**
 * Joi request-body validation schemas for framework routes.
 * Used by validateBody middleware to reject invalid input before hitting controllers.
 */
import Joi from 'joi';

// Valid control status values used throughout the framework system
const controlStatuses = [
  'Pending', 'In Progress', 'Implemented', 'Compliant',
  'Not Implemented', 'Not Applicable', 'At Risk', 'Non-Compliant',
] as const;

// Valid conflict resolution strategies
const resolutionStrategies = ['overwrite', 'merge'] as const;

// ============================================================================
// FRAMEWORK CRUD
// ============================================================================

export const createFrameworkSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  region: Joi.string().max(200).trim().allow('', null).optional(),
  nextAuditDate: Joi.date().iso().required(),
  notes: Joi.string().max(5000).trim().allow('', null).optional(),
}).unknown(false);

export const updateFrameworkSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  region: Joi.string().max(200).trim().allow('', null).optional(),
  nextAuditDate: Joi.date().iso().allow(null).optional(),
  notes: Joi.string().max(5000).trim().allow('', null).optional(),
  status: Joi.string().max(50).trim().optional(),
  version: Joi.number().integer().min(1).optional(),
  resolutionStrategy: Joi.string().valid(...resolutionStrategies).optional(),
}).min(1).unknown(false);

// ============================================================================
// TEMPLATE APPLICATION
// ============================================================================

export const applyTemplateSchema = Joi.object({
  frameworkType: Joi.string().required().min(1).max(200).trim(),
}).unknown(false);

// ============================================================================
// CONTROL CRUD
// ============================================================================

export const createControlSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).trim().allow('', null).optional(),
  status: Joi.string().valid(...controlStatuses).optional(),
  ownerId: Joi.string().max(200).trim().allow('', null).optional(),
  category: Joi.string().max(200).trim().allow('', null).optional(),
}).unknown(false);

export const updateControlSchema = Joi.object({
  status: Joi.string().valid(...controlStatuses).optional(),
  description: Joi.string().max(5000).trim().allow('', null).optional(),
  evidence: Joi.string().max(2000).trim().allow('', null).optional(),
  evidenceRequired: Joi.boolean().optional(),
  ownerId: Joi.string().max(200).trim().allow('', null).optional(),
  category: Joi.string().max(200).trim().allow('', null).optional(),
}).min(1).unknown(false);

export const bulkUpdateControlsSchema = Joi.object({
  controlIds: Joi.array().items(Joi.string().trim().min(1)).required().min(1),
  status: Joi.string().valid(...controlStatuses).required(),
  evidenceRequired: Joi.boolean().optional(),
}).unknown(false);

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

export const rejectSuggestionSchema = Joi.object({
  feedback: Joi.string().max(2000).trim().allow('', null).optional(),
}).unknown(false);
