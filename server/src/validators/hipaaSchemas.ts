import Joi from 'joi';

const PHI_CLASSIFICATIONS = ['PHI', 'ePHI', 'DesignatedRecordSet', 'LimitedDataSet', 'DeIdentified'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const ACCESS_LEVELS = ['Read', 'Write', 'Admin', 'Delete'];
const LEGAL_BASIS = ['Treatment', 'Payment', 'Operations', 'Authorization'];
const BAA_STATUSES = ['Draft', 'PendingSignature', 'Active', 'Expired', 'Terminated'];
const BAA_RISK_TIERS = ['Low', 'Standard', 'High', 'Critical'];

// ── PHI inventory ────────────────────────────────────────────────────────

export const createPHIRecordSchema = Joi.object({
  systemName: Joi.string().trim().min(1).max(120).required(),
  dataLocation: Joi.string().trim().min(1).max(200).required(),
  custodian: Joi.string().trim().min(1).max(120).required(),
  recordCount: Joi.number().integer().min(0).optional(),
  classification: Joi.string().valid(...PHI_CLASSIFICATIONS).optional(),
  dataElements: Joi.array().items(Joi.string()).min(1).required(),
  encryptionAtRest: Joi.boolean().optional(),
  encryptionInTransit: Joi.boolean().optional(),
  retentionDays: Joi.number().integer().min(0).max(36500).optional(),
  legalBasis: Joi.string().valid(...LEGAL_BASIS).optional(),
  riskLevel: Joi.string().valid(...RISK_LEVELS).optional(),
  segmentationId: Joi.string().trim().optional(),
});

export const phiRecordsQuerySchema = Joi.object({
  classification: Joi.string().valid(...PHI_CLASSIFICATIONS).optional(),
  riskLevel: Joi.string().valid(...RISK_LEVELS).optional(),
});

// ── PHI access grants ────────────────────────────────────────────────────

export const grantPHIAccessSchema = Joi.object({
  phiRecordId: Joi.string().trim().required(),
  grantedToUserId: Joi.string().trim().optional(),
  grantedToParty: Joi.string().trim().max(200).optional(),
  accessLevel: Joi.string().valid(...ACCESS_LEVELS).required(),
  justification: Joi.string().trim().min(10).max(2000).required(),
  scopeFilters: Joi.object().unknown(true).optional(),
  approvedBy: Joi.string().trim().min(1).max(120).required(),
  expiresAt: Joi.date().iso().optional(),
}).or('grantedToUserId', 'grantedToParty');

export const revokePHIAccessSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
});

// ── BAA ──────────────────────────────────────────────────────────────────

export const createBAASchema = Joi.object({
  businessAssociate: Joi.string().trim().min(1).max(200).required(),
  contactName: Joi.string().trim().max(120).optional(),
  contactEmail: Joi.string().trim().email().max(200).optional(),
  servicesProvided: Joi.string().trim().min(1).max(2000).required(),
  phiCategoriesShared: Joi.array().items(Joi.string()).min(1).required(),
  signedAt: Joi.date().iso().required(),
  effectiveAt: Joi.date().iso().required(),
  expiresAt: Joi.date().iso().optional(),
  documentUrl: Joi.string().trim().uri().max(500).optional(),
  subContractorsAllowed: Joi.boolean().optional(),
  breachNotificationDays: Joi.number().integer().min(1).max(365).optional(),
  riskTier: Joi.string().valid(...BAA_RISK_TIERS).optional(),
  status: Joi.string().valid(...BAA_STATUSES).optional(),
});

export const updateBAAStatusSchema = Joi.object({
  status: Joi.string().valid(...BAA_STATUSES).required(),
});

export const baasQuerySchema = Joi.object({
  status: Joi.string().valid(...BAA_STATUSES).optional(),
  riskTier: Joi.string().valid(...BAA_RISK_TIERS).optional(),
});

// ── Breach risk assessment ───────────────────────────────────────────────

export const breachRiskAssessmentSchema = Joi.object({
  breachIncidentId: Joi.string().trim().optional(),
  natureExtentScore: Joi.number().integer().min(1).max(5).required(),
  recipientScore: Joi.number().integer().min(1).max(5).required(),
  acquisitionScore: Joi.number().integer().min(1).max(5).required(),
  mitigationScore: Joi.number().integer().min(1).max(5).required(),
  natureExtentNotes: Joi.string().trim().max(2000).optional(),
  recipientNotes: Joi.string().trim().max(2000).optional(),
  acquisitionNotes: Joi.string().trim().max(2000).optional(),
  mitigationNotes: Joi.string().trim().max(2000).optional(),
  presumptionRebutted: Joi.boolean().required(),
  affectedIndividuals: Joi.number().integer().min(0).required(),
  affectedStates: Joi.array().items(Joi.string().trim().length(2)).optional(),
  discoveryDate: Joi.date().iso().required(),
  preparedBy: Joi.string().trim().min(1).max(120).required(),
});

export const breachNotificationSentSchema = Joi.object({
  channel: Joi.string().valid('individual', 'hhs', 'media').required(),
  sentAt: Joi.date().iso().optional(),
});
