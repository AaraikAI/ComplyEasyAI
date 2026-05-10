import Joi from 'joi';

const SAQ_TYPES = ['A', 'A-EP', 'B', 'B-IP', 'C-VT', 'C', 'D-Merchant', 'D-SP', 'P2PE'];
const SCOPE_STATUSES = ['Draft', 'Active', 'UnderReview', 'Archived'];
const IMPL_STATUSES = ['NotImplemented', 'PartiallyImplemented', 'Implemented', 'InPlace', 'InPlaceWithCCW', 'NotApplicable'];
const APPLICABILITY = ['Applicable', 'NotApplicable'];
const TESTING_METHODS = ['Observation', 'Documentation', 'Interview', 'SystemConfig'];
const EVIDENCE_TYPES = ['ConfigScreenshot', 'LogSample', 'PolicyDoc', 'ScanReport', 'InterviewRecord', 'PenTestReport', 'ASVScan'];
const EVIDENCE_STATUSES = ['Pending', 'Collected', 'Reviewed', 'Approved', 'Rejected'];
const QSA_APPROVAL = ['Pending', 'Approved', 'RequiresMore'];
const FINDING_TYPES = ['Gap', 'Observation', 'CompensatingControl', 'Recommendation'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const FINDING_STATUSES = ['Open', 'InRemediation', 'AwaitingValidation', 'Closed', 'Accepted'];
const ATTESTATION_TYPES = ['Compliant', 'NonCompliant', 'CompliantWithLegalException'];

// ── Scope ────────────────────────────────────────────────────────────────

export const createScopeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  scopeStatement: Joi.string().trim().min(20).max(5000).required(),
  saqType: Joi.string().valid(...SAQ_TYPES).required(),
  segmentationDescription: Joi.string().trim().max(5000).optional(),
  cdeBoundaries: Joi.object().unknown(true).optional(),
  connectedSystemsCount: Joi.number().integer().min(0).max(100000).optional(),
  networkDiagramRef: Joi.string().trim().max(500).optional(),
  dataFlowDiagramRef: Joi.string().trim().max(500).optional(),
  assessmentYear: Joi.number().integer().min(2020).max(2100).required(),
  qsaCompany: Joi.string().trim().max(200).optional(),
  qsaContactName: Joi.string().trim().max(120).optional(),
  qsaContactEmail: Joi.string().trim().email().max(200).optional(),
  leadAssessor: Joi.string().trim().max(120).optional(),
  status: Joi.string().valid(...SCOPE_STATUSES).optional(),
});

export const updateScopeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  scopeStatement: Joi.string().trim().min(20).max(5000).optional(),
  saqType: Joi.string().valid(...SAQ_TYPES).optional(),
  segmentationDescription: Joi.string().trim().max(5000).optional(),
  cdeBoundaries: Joi.object().unknown(true).optional(),
  connectedSystemsCount: Joi.number().integer().min(0).max(100000).optional(),
  networkDiagramRef: Joi.string().trim().max(500).optional(),
  dataFlowDiagramRef: Joi.string().trim().max(500).optional(),
  status: Joi.string().valid(...SCOPE_STATUSES).optional(),
  qsaCompany: Joi.string().trim().max(200).optional(),
  qsaContactName: Joi.string().trim().max(120).optional(),
  qsaContactEmail: Joi.string().trim().email().max(200).optional(),
  leadAssessor: Joi.string().trim().max(120).optional(),
}).min(1);

export const scopesQuerySchema = Joi.object({
  status: Joi.string().valid(...SCOPE_STATUSES).optional(),
  saqType: Joi.string().valid(...SAQ_TYPES).optional(),
  assessmentYear: Joi.number().integer().min(2020).max(2100).optional(),
});

// ── Requirements ─────────────────────────────────────────────────────────

export const upsertRequirementSchema = Joi.object({
  scopeId: Joi.string().trim().required(),
  requirementRef: Joi.string().trim().pattern(/^\d{1,2}(\.\d{1,3}){1,3}$/).max(20).required(),
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().trim().min(1).max(5000).required(),
  controlOwner: Joi.string().trim().max(120).optional(),
  implementationStatus: Joi.string().valid(...IMPL_STATUSES).optional(),
  applicability: Joi.string().valid(...APPLICABILITY).optional(),
  notApplicableJustification: Joi.string().trim().max(2000).optional(),
  compensatingControlRef: Joi.string().trim().max(120).optional(),
  lastTestedAt: Joi.date().iso().optional(),
  testingMethod: Joi.string().valid(...TESTING_METHODS).optional(),
  testingNotes: Joi.string().trim().max(5000).optional(),
  evidenceRefs: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.object())).optional(),
});

export const updateRequirementSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).optional(),
  description: Joi.string().trim().min(1).max(5000).optional(),
  controlOwner: Joi.string().trim().max(120).optional(),
  implementationStatus: Joi.string().valid(...IMPL_STATUSES).optional(),
  applicability: Joi.string().valid(...APPLICABILITY).optional(),
  notApplicableJustification: Joi.string().trim().max(2000).optional(),
  compensatingControlRef: Joi.string().trim().max(120).optional(),
  lastTestedAt: Joi.date().iso().optional(),
  testingMethod: Joi.string().valid(...TESTING_METHODS).optional(),
  testingNotes: Joi.string().trim().max(5000).optional(),
  evidenceRefs: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.object())).optional(),
}).min(1);

export const requirementsQuerySchema = Joi.object({
  implementationStatus: Joi.string().valid(...IMPL_STATUSES).optional(),
  applicability: Joi.string().valid(...APPLICABILITY).optional(),
  controlOwner: Joi.string().trim().max(120).optional(),
});

// ── Evidence ─────────────────────────────────────────────────────────────

export const createEvidenceSchema = Joi.object({
  scopeId: Joi.string().trim().required(),
  requirementId: Joi.string().trim().required(),
  evidenceType: Joi.string().valid(...EVIDENCE_TYPES).required(),
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().trim().max(5000).optional(),
  fileUrl: Joi.string().trim().uri().max(1000).optional(),
  fileSha256: Joi.string().trim().pattern(/^[a-f0-9]{64}$/i).optional(),
  collectedBy: Joi.string().trim().min(1).max(120).required(),
  collectedAt: Joi.date().iso().optional(),
  validUntil: Joi.date().iso().optional(),
  retentionUntil: Joi.date().iso().optional(),
  status: Joi.string().valid(...EVIDENCE_STATUSES).optional(),
});

export const evidenceQuerySchema = Joi.object({
  scopeId: Joi.string().trim().optional(),
  requirementId: Joi.string().trim().optional(),
  evidenceType: Joi.string().valid(...EVIDENCE_TYPES).optional(),
  status: Joi.string().valid(...EVIDENCE_STATUSES).optional(),
  qsaApproval: Joi.string().valid(...QSA_APPROVAL).optional(),
});

export const rejectEvidenceSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(2000).required(),
});

// ── QSA Findings ─────────────────────────────────────────────────────────

export const createQSAFindingSchema = Joi.object({
  scopeId: Joi.string().trim().required(),
  requirementId: Joi.string().trim().optional(),
  findingType: Joi.string().valid(...FINDING_TYPES).required(),
  severity: Joi.string().valid(...SEVERITIES).required(),
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().trim().min(1).max(5000).required(),
  qsaName: Joi.string().trim().min(1).max(200).required(),
  identifiedAt: Joi.date().iso().optional(),
  remediationOwner: Joi.string().trim().max(120).optional(),
  remediationDueDate: Joi.date().iso().optional(),
});

export const updateQSAFindingSchema = Joi.object({
  status: Joi.string().valid(...FINDING_STATUSES).required(),
  remediationEvidence: Joi.object().unknown(true).optional(),
});

export const qsaFindingsQuerySchema = Joi.object({
  scopeId: Joi.string().trim().optional(),
  requirementId: Joi.string().trim().optional(),
  severity: Joi.string().valid(...SEVERITIES).optional(),
  status: Joi.string().valid(...FINDING_STATUSES).optional(),
  findingType: Joi.string().valid(...FINDING_TYPES).optional(),
});

// ── Compensating Control Worksheet ───────────────────────────────────────

export const createCCWSchema = Joi.object({
  requirementId: Joi.string().trim().required(),
  originalRequirement: Joi.string().trim().min(1).max(2000).required(),
  constraint: Joi.string().trim().min(10).max(5000).required(),
  objective: Joi.string().trim().min(10).max(5000).required(),
  identifiedRisk: Joi.string().trim().min(10).max(5000).required(),
  definitionOfCompensatingControl: Joi.string().trim().min(10).max(10000).required(),
  validationOfControl: Joi.string().trim().min(10).max(5000).required(),
  maintenance: Joi.string().trim().min(10).max(5000).required(),
});

// ── ROC / AOC ────────────────────────────────────────────────────────────

export const createROCSchema = Joi.object({
  scopeId: Joi.string().trim().required(),
  version: Joi.string().trim().min(1).max(50).required(),
  coveragePeriodStart: Joi.date().iso().required(),
  coveragePeriodEnd: Joi.date().iso().greater(Joi.ref('coveragePeriodStart')).required(),
  qsaCompany: Joi.string().trim().min(1).max(200).required(),
  leadAssessor: Joi.string().trim().min(1).max(120).required(),
  executiveSummary: Joi.string().trim().max(20000).optional(),
  scopeDescription: Joi.string().trim().max(20000).optional(),
  networkSegmentation: Joi.string().trim().max(10000).optional(),
  samplingMethodology: Joi.string().trim().max(10000).optional(),
});

export const generateAOCSchema = Joi.object({
  attestationType: Joi.string().valid(...ATTESTATION_TYPES).required(),
  merchantLevel: Joi.number().integer().valid(1, 2, 3, 4).optional(),
  serviceProviderLevel: Joi.number().integer().valid(1, 2).optional(),
  assessmentEndDate: Joi.date().iso().required(),
  signedByMerchantOfficer: Joi.string().trim().min(1).max(200).required(),
  signedByQSA: Joi.string().trim().min(1).max(200).required(),
  validUntil: Joi.date().iso().optional(),
  documentUrl: Joi.string().trim().uri().max(1000).optional(),
}).or('merchantLevel', 'serviceProviderLevel');
