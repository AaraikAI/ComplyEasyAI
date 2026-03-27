/**
 * Joi validation schemas for demo request routes.
 * Covers: submit demo request, update demo request, schedule demo, convert demo.
 */
import Joi from 'joi';

const validDemoStatuses = ['pending', 'contacted', 'scheduled', 'completed', 'converted', 'cancelled'] as const;

export const submitDemoRequestSchema = Joi.object({
  firstName: Joi.string().required().min(1).max(200).trim(),
  lastName: Joi.string().required().min(1).max(200).trim(),
  email: Joi.string().email().required().max(320),
  company: Joi.string().required().min(1).max(300).trim(),
  phone: Joi.string().max(50).allow('', null).optional(),
  jobTitle: Joi.string().max(200).allow('', null).optional(),
  companySize: Joi.string().max(100).allow('', null).optional(),
  message: Joi.string().max(5000).allow('', null).optional(),
  source: Joi.string().max(200).allow('', null).optional(),
  frameworks: Joi.array().items(Joi.string().max(100)).allow(null).optional(),
  preferredDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateDemoRequestSchema = Joi.object({
  status: Joi.string().valid(...validDemoStatuses).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  scheduledDate: Joi.date().iso().allow(null).optional(),
  firstName: Joi.string().min(1).max(200).trim().optional(),
  lastName: Joi.string().min(1).max(200).trim().optional(),
  email: Joi.string().email().max(320).optional(),
  company: Joi.string().min(1).max(300).trim().optional(),
  phone: Joi.string().max(50).allow('', null).optional(),
  jobTitle: Joi.string().max(200).allow('', null).optional(),
  companySize: Joi.string().max(100).allow('', null).optional(),
  message: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

export const scheduleDemoSchema = Joi.object({
  scheduledDate: Joi.date().iso().required(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const convertDemoSchema = Joi.object({
  notes: Joi.string().max(5000).allow('', null).optional(),
  convertedPlan: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);
