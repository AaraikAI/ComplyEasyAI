/**
 * Joi validation schemas for vendor continuous monitoring routes.
 * Covers: create monitoring check, trigger vendor check.
 */
import Joi from 'joi';

const validCheckStatuses = ['PASS', 'WARN', 'FAIL'] as const;

const validCheckTypes = [
  'domain_reputation',
  'ssl_check',
  'breach_check',
  'soc2_expiry',
  'iso27001_expiry',
  'privacy_policy_review',
  'data_processing_review',
  'incident_history',
] as const;

export const createMonitoringCheckSchema = Joi.object({
  vendorId: Joi.string().required().min(1).max(200),
  checkType: Joi.string().valid(...validCheckTypes).required(),
  status: Joi.string().valid(...validCheckStatuses).optional(),
  details: Joi.object().allow(null).optional(),
}).unknown(false);

export const triggerVendorCheckSchema = Joi.object({
  checkTypes: Joi.array().items(Joi.string().max(100)).allow(null).optional(),
}).unknown(false);
