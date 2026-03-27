/**
 * Joi validation schemas for evidence versioning routes.
 * Covers: create evidence version.
 */
import Joi from 'joi';

export const createEvidenceVersionSchema = Joi.object({
  fileName: Joi.string().required().min(1).max(500).trim(),
  fileUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  fileSize: Joi.number().integer().min(0).allow(null).optional(),
  mimeType: Joi.string().max(200).allow('', null).optional(),
  changeNotes: Joi.string().max(5000).allow('', null).optional(),
  isCurrent: Joi.boolean().optional(),
}).unknown(false);
