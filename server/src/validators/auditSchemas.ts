/**
 * Joi request-body validation schemas for audit log routes.
 * Used by validateBody middleware to reject invalid input before hitting controllers.
 */
import Joi from 'joi';

// POST / — Create audit log entry
export const createAuditLogSchema = Joi.object({
  action: Joi.string().required().min(1).max(500).trim(),
  user: Joi.string().max(200).allow('', null).optional(),
  details: Joi.alternatives()
    .try(Joi.string().max(10000), Joi.object())
    .allow(null)
    .optional(),
}).unknown(false);

// POST /archive — Archive old audit logs
export const archiveAuditLogsSchema = Joi.object({
  beforeDate: Joi.date().iso().required(),
}).unknown(false);
