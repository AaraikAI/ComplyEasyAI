/**
 * Joi validation schemas for report builder routes.
 * Covers: report template CRUD, report generation.
 */
import Joi from 'joi';

const validFormats = ['PDF', 'CSV', 'JSON', 'XLSX'] as const;

const sectionSchema = Joi.object({
  id: Joi.string().max(100).allow('', null).optional(),
  title: Joi.string().max(300).required(),
  type: Joi.string().max(100).required(),
  dataSources: Joi.array().items(Joi.string()).allow(null).optional(),
  filters: Joi.object().allow(null).optional(),
}).unknown(true);

export const createReportTemplateSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  sections: Joi.array().items(sectionSchema).allow(null).optional(),
  filters: Joi.object().allow(null).optional(),
  schedule: Joi.object().allow(null).optional(),
  recipients: Joi.array().items(Joi.string().email()).allow(null).optional(),
  format: Joi.string().valid(...validFormats).optional(),
}).unknown(false);

export const updateReportTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  sections: Joi.array().items(sectionSchema).allow(null).optional(),
  filters: Joi.object().allow(null).optional(),
  schedule: Joi.object().allow(null).optional(),
  recipients: Joi.array().items(Joi.string().email()).allow(null).optional(),
  format: Joi.string().valid(...validFormats).optional(),
}).min(1).unknown(false);

export const generateReportSchema = Joi.object({
  overrideFilters: Joi.object().allow(null).optional(),
}).unknown(false);
