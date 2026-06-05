/**
 * EU Regulations Validation Schemas
 *
 * Joi schemas for all EU AI Act, DMA, and DSA POST/PUT/PATCH routes.
 * Follows the same patterns used in vendorSchemas.ts and enterpriseSchemas.ts.
 */

import Joi from 'joi';

// Bounded free-form JSON blob: caps key count to limit oversized-payload storage.
const boundedJsonObject = Joi.object().max(100).pattern(
  Joi.string().max(200),
  Joi.any(),
);

// ============================================================================
// EU AI ACT SCHEMAS
// ============================================================================

export const registerAISystemSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().required().min(1).max(5000).trim(),
  useCase: Joi.string().required().min(1).max(1000).trim(),
  targetUsers: Joi.array().items(Joi.string().trim().max(200)).min(1).required(),
  dataTypes: Joi.array().items(Joi.string().trim().max(200)).min(1).required(),
  decisionMaking: Joi.boolean().required(),
  biometricProcessing: Joi.boolean().required(),
}).unknown(false);

export const updateAISystemSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().min(1).max(5000).trim().optional(),
  complianceStatus: Joi.string().valid('compliant', 'non_compliant', 'in_review', 'at_risk').optional(),
  euDatabaseRegistrationId: Joi.string().max(200).trim().allow('', null).optional(),
}).min(1).unknown(false);

export const conductAIRiskAssessmentSchema = Joi.object({
  safetyRisks: Joi.array().items(Joi.string().trim().max(500)).default([]),
  fundamentalRightsRisks: Joi.array().items(Joi.string().trim().max(500)).default([]),
  discriminationRisks: Joi.array().items(Joi.string().trim().max(500)).default([]),
  privacyRisks: Joi.array().items(Joi.string().trim().max(500)).default([]),
  mitigationMeasures: Joi.array().items(Joi.string().trim().max(500)).default([]),
  recommendations: Joi.array().items(Joi.string().trim().max(500)).default([]),
}).unknown(false);

export const generateTransparencyReportSchema = Joi.object({
  reportingPeriod: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().greater(Joi.ref('start')).required(),
  }).required(),
}).unknown(false);

// ============================================================================
// DMA SCHEMAS
// ============================================================================

const corePlatformServiceValues = [
  'online_intermediation',
  'online_search',
  'social_networking',
  'video_sharing',
  'number_independent_communications',
  'operating_systems',
  'web_browsers',
  'virtual_assistants',
  'cloud_computing',
  'online_advertising',
];

export const registerGatekeeperSchema = Joi.object({
  platformName: Joi.string().required().min(1).max(300).trim(),
  corePlatformServices: Joi.array()
    .items(Joi.string().valid(...corePlatformServiceValues))
    .min(1)
    .required(),
  annualRevenue: Joi.number().min(0).optional(),
  marketCapitalization: Joi.number().min(0).optional(),
  monthlyActiveUsers: Joi.number().integer().min(0).optional(),
}).unknown(false);

export const updateGatekeeperSchema = Joi.object({
  platformName: Joi.string().min(1).max(300).trim().optional(),
  designationStatus: Joi.string().valid('not_designated', 'designated', 'under_review').optional(),
  complianceStatus: Joi.string().valid('compliant', 'non_compliant', 'in_review').optional(),
}).min(1).unknown(false);

export const updateObligationComplianceSchema = Joi.object({
  status: Joi.string().valid('pending', 'compliant', 'non_compliant', 'in_progress').required(),
  evidence: boundedJsonObject.optional(),
  lastVerified: Joi.date().iso().allow(null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const generateDMAComplianceReportSchema = Joi.object({
  reportingPeriod: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().greater(Joi.ref('start')).required(),
  }).required(),
}).unknown(false);

// ============================================================================
// DSA SCHEMAS
// ============================================================================

const dsaPlatformTypeValues = [
  'online_platform',
  'very_large_online_platform',
  'online_search_engine',
  'very_large_online_search_engine',
  'hosting_service',
  'intermediary_service',
];

export const registerPlatformSchema = Joi.object({
  platformName: Joi.string().required().min(1).max(300).trim(),
  platformType: Joi.string().valid(...dsaPlatformTypeValues).required(),
  monthlyActiveUsers: Joi.number().integer().min(0).optional(),
}).unknown(false);

export const updatePlatformSchema = Joi.object({
  platformName: Joi.string().min(1).max(300).trim().optional(),
  monthlyActiveUsers: Joi.number().integer().min(0).optional(),
  complianceStatus: Joi.string().valid('compliant', 'non_compliant', 'in_review').optional(),
}).min(1).unknown(false);

const contentModerationActionValues = [
  'content_removal',
  'content_demotion',
  'content_labeling',
  'account_suspension',
  'account_termination',
  'monetary_penalty',
  'feature_restriction',
  'no_action',
];

export const recordContentModerationSchema = Joi.object({
  actionType: Joi.string().valid(...contentModerationActionValues).required(),
  contentType: Joi.string().required().min(1).max(200).trim(),
  reason: Joi.string().required().min(1).max(2000).trim(),
  automatedDecision: Joi.boolean().required(),
}).unknown(false);

export const reportIllegalContentSchema = Joi.object({
  reportedBy: Joi.string().required().min(1).max(300).trim(),
  isTrustedFlagger: Joi.boolean().required(),
  contentType: Joi.string().required().min(1).max(200).trim(),
  contentUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  reason: Joi.string().required().min(1).max(2000).trim(),
}).unknown(false);

export const processIllegalContentReportSchema = Joi.object({
  status: Joi.string().valid('reviewed', 'action_taken', 'dismissed').required(),
  actionTaken: Joi.string().max(2000).trim().allow('', null).optional(),
  responseTime: Joi.number().min(0).optional(),
}).unknown(false);

export const addAdToRepositorySchema = Joi.object({
  adId: Joi.string().required().min(1).max(200).trim(),
  advertiserName: Joi.string().required().min(1).max(300).trim(),
  adContent: Joi.object({
    text: Joi.string().max(5000).allow('', null).optional(),
    images: Joi.array().items(Joi.string().uri().max(2000)).optional(),
    video: Joi.string().uri().max(2000).allow('', null).optional(),
    targetAudience: Joi.array().items(Joi.string().max(200)).optional(),
  }).required(),
  targetingCriteria: boundedJsonObject.optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  paidBy: Joi.string().max(300).trim().allow('', null).optional(),
}).unknown(false);

export const generateDSATransparencyReportSchema = Joi.object({
  reportingPeriod: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().greater(Joi.ref('start')).required(),
  }).required(),
}).unknown(false);

const dsaRiskCategoryValues = [
  'illegal_content',
  'fundamental_rights',
  'public_security',
  'protection_of_minors',
];

const riskSeverityValues = ['low', 'medium', 'high', 'critical'];

const riskBlockSchema = Joi.object({
  risks: Joi.array().items(Joi.string().max(500)).optional(),
  severity: Joi.string().valid(...riskSeverityValues).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
});

export const conductDSARiskAssessmentSchema = Joi.object({
  riskCategory: Joi.string().valid(...dsaRiskCategoryValues).required(),
  illegalContentRisks: riskBlockSchema.optional(),
  fundamentalRightsRisks: riskBlockSchema.optional(),
  publicSecurityRisks: riskBlockSchema.optional(),
  protectionOfMinorsRisks: riskBlockSchema.optional(),
  mitigationMeasures: Joi.array().items(Joi.object({
    measure: Joi.string().required().max(1000).trim(),
    status: Joi.string().valid('planned', 'in_progress', 'implemented', 'verified').required(),
    targetDate: Joi.date().iso().allow(null).optional(),
    responsibleParty: Joi.string().max(300).trim().allow('', null).optional(),
  })).optional(),
}).unknown(false);

export const updateDSARiskAssessmentSchema = Joi.object({
  status: Joi.string().valid('draft', 'in_review', 'approved', 'requires_action').optional(),
  mitigationMeasures: Joi.array().items(Joi.object({
    measure: Joi.string().required().max(1000).trim(),
    status: Joi.string().valid('planned', 'in_progress', 'implemented', 'verified').required(),
    targetDate: Joi.date().iso().allow(null).optional(),
    responsibleParty: Joi.string().max(300).trim().allow('', null).optional(),
  })).optional(),
}).min(1).unknown(false);

export const configureNonPersonalizedFeedSchema = Joi.object({
  isEnabled: Joi.boolean().required(),
  userOptInMethod: Joi.string().valid('toggle', 'settings_page', 'onboarding').required(),
  feedAlgorithmType: Joi.string().valid('chronological', 'popularity', 'random').required(),
  description: Joi.string().max(2000).trim().allow('', null).optional(),
  userDocumentationUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  technicalSpecs: boundedJsonObject.optional(),
  implementationDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateNonPersonalizedFeedStatusSchema = Joi.object({
  complianceStatus: Joi.string().valid('not_implemented', 'in_progress', 'implemented', 'compliant').optional(),
  lastAuditDate: Joi.date().iso().allow(null).optional(),
  notes: Joi.string().max(2000).trim().allow('', null).optional(),
}).min(1).unknown(false);
