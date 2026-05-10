import Joi from 'joi';

const ENGAGEMENT_TYPES = ['TypeI', 'TypeII'];
const TRUST_SERVICES = ['Security', 'Availability', 'ProcessingIntegrity', 'Confidentiality', 'Privacy'];
const ENGAGEMENT_STATUSES = ['Planning', 'Fieldwork', 'Reporting', 'Issued'];
const REPORT_TYPES = ['Unqualified', 'Qualified', 'Adverse', 'DisclaimerOfOpinion'];

const CONTROL_FREQUENCIES = ['Continuous', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'AdHoc'];
const CONTROL_TYPES = ['Preventive', 'Detective', 'Corrective'];
const AUTOMATION_LEVELS = ['Manual', 'Hybrid', 'Automated'];
const RISK_RATINGS = ['Low', 'Medium', 'High'];
const IMPLEMENTATION_STATUSES = ['NotImplemented', 'Designed', 'Implemented', 'Operating'];
const DESIGN_STATUSES = ['Effective', 'Ineffective', 'NotTested'];
const OPERATING_STATUSES = ['Effective', 'Ineffective', 'NotTested', 'InsufficientEvidence'];

const SAMPLING_METHODS = ['Random', 'Haphazard', 'Statistical', 'Judgmental'];
const EVIDENCE_TYPES = [
  'LogReview',
  'AccessReview',
  'ChangeRecord',
  'IncidentTicket',
  'PolicyAck',
  'TrainingRecord',
  'BackupTest',
  'VulnScan',
  'PenTest',
];
const SAMPLE_STATUSES = ['Pending', 'Collected', 'Reviewed', 'Approved', 'Rejected'];

const EXCEPTION_TYPES = ['DesignDeficiency', 'OperatingDeficiency', 'SignificantDeficiency', 'MaterialWeakness'];
const EXCEPTION_STATUSES = ['Open', 'Remediated', 'Accepted', 'Closed'];

const ASSERTION_TYPES = ['DescriptionOfSystem', 'DesignOfControls', 'OperatingEffectiveness'];

// ── Engagements ──────────────────────────────────────────────────────────

export const createEngagementSchema = Joi.object({
  engagementYear: Joi.number().integer().min(2000).max(2100).required(),
  engagementType: Joi.string().valid(...ENGAGEMENT_TYPES).required(),
  trustServicesIncluded: Joi.array().items(Joi.string().valid(...TRUST_SERVICES)).min(1).required(),
  auditPeriodStart: Joi.date().iso().optional(),
  auditPeriodEnd: Joi.date().iso().optional(),
  asOfDate: Joi.date().iso().optional(),
  cpaFirm: Joi.string().trim().max(200).optional(),
  leadAuditor: Joi.string().trim().max(120).optional(),
  scopeBoundaries: Joi.object().unknown(true).optional(),
  subserviceOrganizations: Joi.array().items(Joi.object().unknown(true)).optional(),
  status: Joi.string().valid(...ENGAGEMENT_STATUSES).optional(),
});

export const updateEngagementSchema = Joi.object({
  engagementYear: Joi.number().integer().min(2000).max(2100).optional(),
  engagementType: Joi.string().valid(...ENGAGEMENT_TYPES).optional(),
  trustServicesIncluded: Joi.array().items(Joi.string().valid(...TRUST_SERVICES)).min(1).optional(),
  auditPeriodStart: Joi.date().iso().optional(),
  auditPeriodEnd: Joi.date().iso().optional(),
  asOfDate: Joi.date().iso().optional(),
  cpaFirm: Joi.string().trim().max(200).optional(),
  leadAuditor: Joi.string().trim().max(120).optional(),
  scopeBoundaries: Joi.object().unknown(true).optional(),
  subserviceOrganizations: Joi.array().items(Joi.object().unknown(true)).optional(),
  status: Joi.string().valid(...ENGAGEMENT_STATUSES).optional(),
  reportType: Joi.string().valid(...REPORT_TYPES).optional(),
  reportIssuedAt: Joi.date().iso().optional(),
  reportUrl: Joi.string().trim().uri().max(500).optional(),
}).min(1);

export const engagementsQuerySchema = Joi.object({
  status: Joi.string().valid(...ENGAGEMENT_STATUSES).optional(),
  engagementType: Joi.string().valid(...ENGAGEMENT_TYPES).optional(),
  engagementYear: Joi.number().integer().min(2000).max(2100).optional(),
});

// ── Controls ─────────────────────────────────────────────────────────────

export const upsertControlSchema = Joi.object({
  engagementId: Joi.string().trim().required(),
  criteriaCategory: Joi.string().valid(...TRUST_SERVICES).required(),
  criteriaRef: Joi.string().trim().min(1).max(20).required(),
  criteriaTitle: Joi.string().trim().min(1).max(200).required(),
  controlActivity: Joi.string().trim().min(10).max(4000).required(),
  controlObjective: Joi.string().trim().max(2000).optional(),
  controlOwner: Joi.string().trim().max(120).optional(),
  controlFrequency: Joi.string().valid(...CONTROL_FREQUENCIES).optional(),
  controlType: Joi.string().valid(...CONTROL_TYPES).optional(),
  automationLevel: Joi.string().valid(...AUTOMATION_LEVELS).optional(),
  riskRating: Joi.string().valid(...RISK_RATINGS).optional(),
  implementationStatus: Joi.string().valid(...IMPLEMENTATION_STATUSES).optional(),
  nextTestDate: Joi.date().iso().optional(),
  evidenceRefs: Joi.array().items(Joi.string()).optional(),
});

export const patchControlSchema = Joi.object({
  controlActivity: Joi.string().trim().min(10).max(4000).optional(),
  controlObjective: Joi.string().trim().max(2000).optional(),
  controlOwner: Joi.string().trim().max(120).optional(),
  controlFrequency: Joi.string().valid(...CONTROL_FREQUENCIES).optional(),
  controlType: Joi.string().valid(...CONTROL_TYPES).optional(),
  automationLevel: Joi.string().valid(...AUTOMATION_LEVELS).optional(),
  riskRating: Joi.string().valid(...RISK_RATINGS).optional(),
  implementationStatus: Joi.string().valid(...IMPLEMENTATION_STATUSES).optional(),
  nextTestDate: Joi.date().iso().optional(),
  evidenceRefs: Joi.array().items(Joi.string()).optional(),
}).min(1);

export const testControlSchema = Joi.object({
  designStatus: Joi.string().valid(...DESIGN_STATUSES).required(),
  operatingStatus: Joi.string().valid(...OPERATING_STATUSES).optional(),
  evidenceRefs: Joi.array().items(Joi.string()).optional(),
});

export const controlsQuerySchema = Joi.object({
  engagementId: Joi.string().trim().required(),
  criteriaCategory: Joi.string().valid(...TRUST_SERVICES).optional(),
  implementationStatus: Joi.string().valid(...IMPLEMENTATION_STATUSES).optional(),
  riskRating: Joi.string().valid(...RISK_RATINGS).optional(),
});

// ── Evidence samples ─────────────────────────────────────────────────────

export const createEvidenceSampleSchema = Joi.object({
  controlId: Joi.string().trim().required(),
  samplingPeriodStart: Joi.date().iso().required(),
  samplingPeriodEnd: Joi.date().iso().required(),
  populationSize: Joi.number().integer().min(0).required(),
  samplingMethod: Joi.string().valid(...SAMPLING_METHODS).optional(),
  evidenceType: Joi.string().valid(...EVIDENCE_TYPES).required(),
  evidenceUrl: Joi.string().trim().uri().max(500).optional(),
  evidenceSha256: Joi.string().trim().length(64).optional(),
  exceptionsFound: Joi.number().integer().min(0).optional(),
  collectedBy: Joi.string().trim().max(120).optional(),
  collectedAt: Joi.date().iso().optional(),
  status: Joi.string().valid(...SAMPLE_STATUSES).optional(),
});

export const evidenceSamplesQuerySchema = Joi.object({
  controlId: Joi.string().trim().optional(),
  status: Joi.string().valid(...SAMPLE_STATUSES).optional(),
  evidenceType: Joi.string().valid(...EVIDENCE_TYPES).optional(),
});

// ── Exceptions ───────────────────────────────────────────────────────────

export const createExceptionSchema = Joi.object({
  engagementId: Joi.string().trim().required(),
  controlId: Joi.string().trim().required(),
  sampleId: Joi.string().trim().optional(),
  exceptionType: Joi.string().valid(...EXCEPTION_TYPES).required(),
  description: Joi.string().trim().min(10).max(4000).required(),
  identifiedBy: Joi.string().trim().min(1).max(120).required(),
  populationImpact: Joi.string().trim().max(1000).optional(),
  rootCause: Joi.string().trim().max(2000).optional(),
  remediation: Joi.string().trim().max(4000).optional(),
  remediationOwner: Joi.string().trim().max(120).optional(),
  remediationDueDate: Joi.date().iso().optional(),
  managementResponse: Joi.string().trim().max(4000).optional(),
});

export const updateExceptionStatusSchema = Joi.object({
  status: Joi.string().valid(...EXCEPTION_STATUSES).required(),
  remediation: Joi.string().trim().max(4000).optional(),
  remediationOwner: Joi.string().trim().max(120).optional(),
  remediationDueDate: Joi.date().iso().optional(),
  remediationCompletedAt: Joi.date().iso().optional(),
  managementResponse: Joi.string().trim().max(4000).optional(),
});

export const exceptionsQuerySchema = Joi.object({
  engagementId: Joi.string().trim().optional(),
  controlId: Joi.string().trim().optional(),
  status: Joi.string().valid(...EXCEPTION_STATUSES).optional(),
  exceptionType: Joi.string().valid(...EXCEPTION_TYPES).optional(),
});

// ── CUECs ────────────────────────────────────────────────────────────────

export const createCUECSchema = Joi.object({
  engagementId: Joi.string().trim().required(),
  criteriaCategory: Joi.string().valid(...TRUST_SERVICES).required(),
  controlDescription: Joi.string().trim().min(10).max(4000).required(),
  userResponsibility: Joi.string().trim().min(10).max(4000).required(),
});

export const cuecsQuerySchema = Joi.object({
  engagementId: Joi.string().trim().required(),
});

// ── Management assertions ────────────────────────────────────────────────

export const createManagementAssertionSchema = Joi.object({
  engagementId: Joi.string().trim().required(),
  assertionType: Joi.string().valid(...ASSERTION_TYPES).required(),
  assertionText: Joi.string().trim().min(20).max(20000).required(),
  signedByOfficerName: Joi.string().trim().min(1).max(120).required(),
  signedByOfficerTitle: Joi.string().trim().min(1).max(120).required(),
  signedAt: Joi.date().iso().required(),
  documentUrl: Joi.string().trim().uri().max(500).optional(),
});
