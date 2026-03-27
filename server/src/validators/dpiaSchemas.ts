/**
 * Joi request-body validation schemas for DPIA (Data Protection Impact Assessment) routes.
 * Used by validateBody middleware to reject invalid input before hitting handlers.
 */
import Joi from 'joi';

const dpiaStatuses = ['Draft', 'InProgress', 'UnderReview', 'Approved', 'Rejected', 'Archived'] as const;
const riskLevels = ['VeryLow', 'Low', 'Medium', 'High', 'VeryHigh'] as const;
const riskAssessmentStatuses = ['Identified', 'Assessed', 'Mitigated', 'Accepted', 'Closed'] as const;
const screeningResults = ['Required', 'NotRequired'] as const;

// POST / — Create DPIA
export const createDPIASchema = Joi.object({
  title: Joi.string().required().min(1).max(300).trim(),
  processingActivity: Joi.string().required().min(1).max(2000).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  specialCategories: Joi.boolean().optional(),
  dataSubjects: Joi.array().items(Joi.string()).allow(null).optional(),
  necessity: Joi.string().max(2000).allow('', null).optional(),
  proportionality: Joi.string().max(2000).allow('', null).optional(),
  lawfulBasis: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

// PATCH /:id — Update DPIA
export const updateDPIASchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  processingActivity: Joi.string().min(1).max(2000).trim().optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  specialCategories: Joi.boolean().optional(),
  dataSubjects: Joi.array().items(Joi.string()).allow(null).optional(),
  necessity: Joi.string().max(2000).allow('', null).optional(),
  proportionality: Joi.string().max(2000).allow('', null).optional(),
  lawfulBasis: Joi.string().max(200).allow('', null).optional(),
  screeningResult: Joi.string().valid(...screeningResults).optional(),
  status: Joi.string().valid(...dpiaStatuses).optional(),
  overallRiskLevel: Joi.string().valid(...riskLevels, 'Low', 'Medium', 'High', 'VeryHigh').optional(),
  riskMitigations: Joi.alternatives().try(Joi.object(), Joi.string().max(10000)).allow(null).optional(),
  dpoConsulted: Joi.boolean().optional(),
  dpoConsultationDate: Joi.date().iso().allow(null).optional(),
  dpoOpinion: Joi.string().max(5000).allow('', null).optional(),
  dpoName: Joi.string().max(200).allow('', null).optional(),
  supervisoryAuthority: Joi.string().max(200).allow('', null).optional(),
  approvedBy: Joi.string().max(200).allow('', null).optional(),
  approvedAt: Joi.date().iso().allow(null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

// POST /:id/screening — Screening questionnaire
export const dpiaScreeningSchema = Joi.object({
  screeningAnswers: Joi.object({
    largeScaleSpecialCategories: Joi.boolean().optional(),
    systematicMonitoringPublicAreas: Joi.boolean().optional(),
    automatedDecisionMakingLegalEffects: Joi.boolean().optional(),
    largeScaleProfiling: Joi.boolean().optional(),
    innovativeTechnology: Joi.boolean().optional(),
    crossBorderNonAdequate: Joi.boolean().optional(),
    vulnerableDataSubjects: Joi.boolean().optional(),
    matchingCombiningDatasets: Joi.boolean().optional(),
    preventingExerciseOfRights: Joi.boolean().optional(),
  }).required(),
}).unknown(false);

// POST /:id/risk-assessment — Add risk assessment
export const createDPIARiskAssessmentSchema = Joi.object({
  riskDescription: Joi.string().required().min(1).max(5000).trim(),
  likelihood: Joi.string().valid(...riskLevels).required(),
  impact: Joi.string().valid(...riskLevels).required(),
  riskCategory: Joi.string().max(200).allow('', null).optional(),
  existingControls: Joi.array().items(Joi.string()).allow(null).optional(),
  residualRisk: Joi.string().max(2000).allow('', null).optional(),
  proposedMitigations: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

// PATCH /:id/risk-assessment/:riskId — Update risk assessment
export const updateDPIARiskAssessmentSchema = Joi.object({
  riskCategory: Joi.string().max(200).allow('', null).optional(),
  riskDescription: Joi.string().min(1).max(5000).trim().optional(),
  likelihood: Joi.string().valid(...riskLevels).optional(),
  impact: Joi.string().valid(...riskLevels).optional(),
  riskLevel: Joi.string().valid('Low', 'Medium', 'High', 'VeryHigh').optional(),
  existingControls: Joi.array().items(Joi.string()).allow(null).optional(),
  proposedMitigations: Joi.array().items(Joi.string()).allow(null).optional(),
  residualRisk: Joi.string().max(2000).allow('', null).optional(),
  status: Joi.string().valid(...riskAssessmentStatuses).optional(),
}).min(1).unknown(false);

// POST /:id/dpo-consultation — Record DPO consultation
export const dpoConsultationSchema = Joi.object({
  consultationNotes: Joi.string().required().min(1).max(10000).trim(),
  dpoRecommendation: Joi.string().max(5000).allow('', null).optional(),
  consultedBy: Joi.string().max(200).allow('', null).optional(),
  consultedAt: Joi.date().iso().allow(null).optional(),
}).unknown(false);

// PATCH /:id/reject — Reject DPIA
export const rejectDPIASchema = Joi.object({
  rejectionReason: Joi.string().required().min(1).max(5000).trim(),
}).unknown(false);
