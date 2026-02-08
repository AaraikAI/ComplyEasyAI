/**
 * Joi request-body validation schemas for enterprise routes.
 * Used by validateBody middleware to reject invalid input before hitting services.
 */
import Joi from 'joi';

// ---- Risk ----
export const createRiskAssessmentSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(2000).allow('', null).optional(),
  assessmentType: Joi.string().max(100).allow('', null).optional(),
  scope: Joi.string().max(500).allow('', null).optional(),
  methodology: Joi.string().max(500).allow('', null).optional(),
})
  .min(1)
  .unknown(false);

// ---- Questionnaire ----
export const createQuestionnaireSchema = Joi.object({
  title: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(2000).allow('', null).optional(),
  questionnaireType: Joi.string().max(100).default('General').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  requestedBy: Joi.string().max(200).allow('', null).optional(),
})
  .min(1)
  .unknown(false);

export const questionnaireFromTemplateSchema = Joi.object({
  templateId: Joi.string().required().min(1).max(100),
  title: Joi.string().max(300).allow('', null).optional(),
  requestedBy: Joi.string().max(200).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
})
  .unknown(false);

export const updateQuestionnaireSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  questionnaireType: Joi.string().max(100).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  requestedBy: Joi.string().max(200).allow('', null).optional(),
})
  .min(1)
  .unknown(false);

export const questionnaireQuestionsSchema = Joi.object({
  questions: Joi.array().items(Joi.object({
    questionText: Joi.string().required(),
    questionType: Joi.string().required(),
    category: Joi.string().optional(),
    required: Joi.boolean().optional(),
    options: Joi.alternatives().try(Joi.array(), Joi.object()).optional(),
    order: Joi.number().optional(),
  }).unknown(true)).required().min(1).max(500),
})
  .unknown(false);

export const questionnaireResponseSchema = Joi.object({
  questionId: Joi.string().required().min(1).max(100),
  responseText: Joi.string().max(5000).allow('', null).optional(),
  responseData: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).optional(),
  attachments: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).optional(),
})
  .unknown(false);

// ---- Policy ----
export const createPolicySchema = Joi.object({
  title: Joi.string().required().min(1).max(300).trim(),
  policyNumber: Joi.string().max(100).allow('', null).optional(),
  version: Joi.string().max(50).allow('', null).optional(),
  category: Joi.string().required().min(1).max(100).trim(),
  framework: Joi.string().max(100).allow('', null).optional(),
  content: Joi.string().required().min(1).max(500000),
  summary: Joi.string().max(2000).allow('', null).optional(),
  tags: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
})
  .min(1)
  .unknown(false);

export const updatePolicySchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  policyNumber: Joi.string().max(100).allow('', null).optional(),
  version: Joi.string().max(50).allow('', null).optional(),
  category: Joi.string().min(1).max(100).trim().optional(),
  framework: Joi.string().max(100).allow('', null).optional(),
  content: Joi.string().min(1).max(500000).optional(),
  summary: Joi.string().max(2000).allow('', null).optional(),
  tags: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
})
  .min(1)
  .unknown(false);

export const bulkImportPoliciesSchema = Joi.object({
  policies: Joi.array().items(Joi.object().min(1).unknown(true)).required().min(1).max(200),
})
  .unknown(false);

// ---- Trust Center ----
export const createCertificateSchema = Joi.object({
  certificateType: Joi.string().required().min(1).max(100),
  certificateNumber: Joi.string().max(100).allow('', null).optional(),
  issuer: Joi.string().required().min(1).max(200),
  issueDate: Joi.date().iso().required(),
  expiryDate: Joi.date().iso().required(),
  documentUrl: Joi.string().uri().allow('', null).optional(),
  publiclyVisible: Joi.boolean().optional(),
  metadata: Joi.object().allow(null).optional(),
})
  .unknown(false);

export const generateCertificateSchema = Joi.object({
  frameworkId: Joi.string().required().min(1).max(100),
})
  .unknown(false);

// ---- Workspace ----
export const createChildOrganizationSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  industry: Joi.string().max(100).allow('', null).optional(),
  companySize: Joi.string().max(50).allow('', null).optional(),
})
  .min(1)
  .unknown(false);

export const moveUserSchema = Joi.object({
  userId: Joi.string().required().min(1).max(100),
  targetOrganizationId: Joi.string().required().min(1).max(100),
})
  .unknown(false);

export const cloneFrameworkSchema = Joi.object({
  frameworkId: Joi.string().required().min(1).max(100),
  targetOrganizationIds: Joi.array().items(Joi.string().min(1).max(100)).required().min(1).max(50),
})
  .unknown(false);

// ---- Reports ----
export const createReportSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(2000).allow('', null).optional(),
  reportType: Joi.string().required().min(1).max(100),
  template: Joi.alternatives().try(Joi.object(), Joi.array()).required(),
  filters: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).optional(),
  schedule: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).optional(),
  recipients: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
})
  .min(1)
  .unknown(false);

// ---- Monitoring ----
export const createMonitorSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  monitorType: Joi.string().required().min(1).max(100),
  integrationId: Joi.string().max(100).allow('', null).optional(),
  configuration: Joi.object().required(),
  testScript: Joi.string().max(10000).allow('', null).optional(),
  frequency: Joi.string().max(50).allow('', null).optional(),
})
  .min(1)
  .unknown(false);

export const updateMonitorSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  monitorType: Joi.string().min(1).max(100).optional(),
  configuration: Joi.object().optional(),
  testScript: Joi.string().max(10000).allow('', null).optional(),
  frequency: Joi.string().max(50).allow('', null).optional(),
})
  .min(1)
  .unknown(false);

export const toggleMonitorSchema = Joi.object({
  active: Joi.boolean().required(),
})
  .unknown(false);

// ---- Issues ----
export const createIssueSchema = Joi.object({
  title: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().required().min(1).max(10000),
  issueType: Joi.string().required().min(1).max(100),
  category: Joi.string().max(100).allow('', null).optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  slaTarget: Joi.date().iso().allow(null).optional(),
  remediationPlan: Joi.string().max(2000).allow('', null).optional(),
  remediationSteps: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
  tags: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
})
  .unknown(false);

export const assignIssueSchema = Joi.object({
  assignedToId: Joi.string().required().min(1).max(100).allow(null),
})
  .unknown(false);

export const issueCommentSchema = Joi.object({
  comment: Joi.string().required().min(1).max(5000).trim(),
})
  .unknown(false);

export const updateIssueSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().min(1).max(10000).optional(),
  issueType: Joi.string().min(1).max(100).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  slaTarget: Joi.date().iso().allow(null).optional(),
  remediationPlan: Joi.string().max(2000).allow('', null).optional(),
  remediationSteps: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
  tags: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
})
  .min(1)
  .unknown(false);

export const issueStatusSchema = Joi.object({
  status: Joi.string().required().min(1).max(50),
})
  .unknown(false);

// ---- Visionary AI ----
export const predictRisksSchema = Joi.object({
  timeHorizonDays: Joi.number().min(1).max(365).optional(),
})
  .unknown(false);

export const autopilotOptionsSchema = Joi.object({
  options: Joi.object().optional(),
})
  .unknown(true);
