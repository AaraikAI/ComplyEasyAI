import Joi from 'joi';

const ISO_STATUSES = [
  'InProgress',
  'InternalAudit',
  'ManagementReview',
  'Stage1Audit',
  'Stage2Audit',
  'Certified',
  'SurveillanceAudit',
  'RecertificationDue',
  'Completed',
];

export const createAssessmentSchema = Joi.object({
  assessmentYear: Joi.number().integer().min(2000).max(2100).required(),
  scope: Joi.string().trim().min(10).required(),
  scopeBoundaries: Joi.object().unknown(true).optional(),
  certificationBody: Joi.string().trim().max(120).optional(),
  leadAuditor: Joi.string().trim().max(120).optional(),
  isms_owner: Joi.string().trim().max(120).optional(),
  notes: Joi.string().trim().max(2000).optional(),
  frameworkId: Joi.string().trim().optional(),
});

export const updateAssessmentStatusSchema = Joi.object({
  status: Joi.string().valid(...ISO_STATUSES).required(),
  stage1AuditDate: Joi.date().iso().optional(),
  stage2AuditDate: Joi.date().iso().optional(),
  certificationDate: Joi.date().iso().optional(),
  certificateExpiresAt: Joi.date().iso().optional(),
  internalAuditDate: Joi.date().iso().optional(),
  managementReviewDate: Joi.date().iso().optional(),
});

export const upsertSoASchema = Joi.object({
  controlRef: Joi.string().trim().min(1).max(20).required(),
  controlTitle: Joi.string().trim().min(1).max(200).required(),
  applicability: Joi.string().valid('Applicable', 'NotApplicable').required(),
  justification: Joi.string().trim().min(10).max(2000).required(),
  implementationStatus: Joi.string().valid('NotImplemented', 'PartiallyImplemented', 'Implemented', 'Operating').optional(),
  implementationNotes: Joi.string().trim().max(2000).optional(),
  evidenceRefs: Joi.array().items(Joi.string()).optional(),
  controlOwner: Joi.string().trim().max(120).optional(),
});

export const createRiskScenarioSchema = Joi.object({
  threat: Joi.string().trim().min(1).max(200).required(),
  vulnerability: Joi.string().trim().min(1).max(200).required(),
  affectedAsset: Joi.string().trim().min(1).max(200).required(),
  likelihood: Joi.number().integer().min(1).max(5).required(),
  impact: Joi.number().integer().min(1).max(5).required(),
  treatmentDecision: Joi.string().valid('Mitigate', 'Transfer', 'Avoid', 'Accept').required(),
  treatmentPlan: Joi.string().trim().max(2000).optional(),
  residualRisk: Joi.number().integer().min(0).max(25).optional(),
  riskOwner: Joi.string().trim().max(120).optional(),
  controlRefs: Joi.array().items(Joi.string()).optional(),
  reviewDate: Joi.date().iso().optional(),
});

export const updateRiskScenarioSchema = Joi.object({
  treatmentDecision: Joi.string().valid('Mitigate', 'Transfer', 'Avoid', 'Accept').optional(),
  treatmentPlan: Joi.string().trim().max(2000).optional(),
  residualRisk: Joi.number().integer().min(0).max(25).optional(),
  status: Joi.string().valid('Open', 'Treated', 'Accepted', 'Closed').optional(),
  riskOwner: Joi.string().trim().max(120).optional(),
  reviewDate: Joi.date().iso().optional(),
}).min(1);

export const createCorrectiveActionSchema = Joi.object({
  source: Joi.string().valid('InternalAudit', 'Stage1Audit', 'Stage2Audit', 'ManagementReview', 'SurveillanceAudit', 'IncidentReview').required(),
  finding: Joi.string().trim().min(10).max(2000).required(),
  rootCause: Joi.string().trim().max(2000).optional(),
  containment: Joi.string().trim().max(2000).optional(),
  correctiveAction: Joi.string().trim().min(10).max(2000).required(),
  preventiveAction: Joi.string().trim().max(2000).optional(),
  owner: Joi.string().trim().min(1).max(120).required(),
  dueDate: Joi.date().iso().required(),
});

export const updateCorrectiveActionSchema = Joi.object({
  status: Joi.string().valid('Open', 'InProgress', 'AwaitingVerification', 'Verified', 'Closed').required(),
  verifiedBy: Joi.string().trim().max(120).optional(),
  evidenceRefs: Joi.array().items(Joi.string()).optional(),
});
