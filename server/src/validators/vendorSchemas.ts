/**
 * Joi request-body validation schemas for vendor routes.
 * Used by validateBody middleware to reject invalid input before hitting services.
 */
import Joi from 'joi';

const vendorRiskLevels = ['Critical', 'High', 'Medium', 'Low'] as const;
const vendorStatuses = ['Active', 'Onboarding', 'Offboarding', 'Suspended', 'Inactive'] as const;

export const createVendorSchema = Joi.object({
  name: Joi.string().required().min(1).max(500).trim(),
  website: Joi.string().uri().allow('', null).optional(),
  contactName: Joi.string().max(200).allow('', null).optional(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  contactPhone: Joi.string().max(50).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  serviceDescription: Joi.string().max(2000).allow('', null).optional(),
  contractStart: Joi.date().iso().allow(null).optional(),
  contractEnd: Joi.date().iso().allow(null).optional(),
  annualSpend: Joi.number().min(0).allow(null).optional(),
  hasDataAccess: Joi.boolean().optional(),
  dataTypes: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
  securityContact: Joi.string().max(200).allow('', null).optional(),
  soc2Report: Joi.boolean().optional(),
  iso27001Certified: Joi.boolean().optional(),
  gdprCompliant: Joi.boolean().optional(),
  hipaaBaa: Joi.boolean().optional(),
})
  .min(1)
  .unknown(false);

export const createVendorAssessmentSchema = Joi.object({
  assessmentType: Joi.string().required().min(1).max(100).trim(),
})
  .unknown(false);

export const completeVendorAssessmentSchema = Joi.object({
  findings: Joi.alternatives().try(Joi.object(), Joi.array()).required(),
  score: Joi.number().min(0).max(100).required(),
  riskLevel: Joi.string()
    .valid(...vendorRiskLevels)
    .required(),
  recommendations: Joi.string().max(2000).allow('', null).optional(),
})
  .unknown(false);

export const updateVendorSchema = Joi.object({
  name: Joi.string().min(1).max(500).trim().optional(),
  website: Joi.string().uri().allow('', null).optional(),
  contactName: Joi.string().max(200).allow('', null).optional(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  contactPhone: Joi.string().max(50).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  serviceDescription: Joi.string().max(2000).allow('', null).optional(),
  contractStart: Joi.date().iso().allow(null).optional(),
  contractEnd: Joi.date().iso().allow(null).optional(),
  annualSpend: Joi.number().min(0).allow(null).optional(),
  hasDataAccess: Joi.boolean().optional(),
  dataTypes: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
  riskLevel: Joi.string().valid(...vendorRiskLevels).optional(),
  riskScore: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid(...vendorStatuses).optional(),
  securityContact: Joi.string().max(200).allow('', null).optional(),
  soc2Report: Joi.boolean().optional(),
  iso27001Certified: Joi.boolean().optional(),
  gdprCompliant: Joi.boolean().optional(),
  hipaaBaa: Joi.boolean().optional(),
})
  .min(1)
  .unknown(false);
