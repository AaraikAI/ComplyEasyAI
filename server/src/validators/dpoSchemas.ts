/**
 * Joi validation schemas for DPO (Data Protection Officer) routes.
 * Covers: profile CRUD, tasks CRUD, activity log.
 */
import Joi from 'joi';

const validPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;
const validTaskStatuses = ['Open', 'In Progress', 'Completed', 'Cancelled'] as const;

export const createDPOProfileSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  email: Joi.string().email().required().max(320),
  phone: Joi.string().max(50).allow('', null).optional(),
  certifications: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  appointmentDate: Joi.date().iso().allow(null).optional(),
  registeredWithDPA: Joi.boolean().optional(),
  dpaRegistrationRef: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

export const updateDPOProfileSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  email: Joi.string().email().max(320).optional(),
  phone: Joi.string().max(50).allow('', null).optional(),
  certifications: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  appointmentDate: Joi.date().iso().allow(null).optional(),
  registeredWithDPA: Joi.boolean().optional(),
  dpaRegistrationRef: Joi.string().max(500).allow('', null).optional(),
}).min(1).unknown(false);

export const createDPOTaskSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().valid(...validPriorities).optional(),
  status: Joi.string().valid(...validTaskStatuses).optional(),
}).unknown(false);

export const updateDPOTaskSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().valid(...validPriorities).optional(),
  status: Joi.string().valid(...validTaskStatuses).optional(),
}).min(1).unknown(false);

export const recordDPOActivitySchema = Joi.object({
  action: Joi.string().required().min(1).max(300),
  description: Joi.string().max(5000).allow('', null).optional(),
  relatedEntity: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);
