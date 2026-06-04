/**
 * Joi request-body validation schemas for core module routes.
 * Used by validateBody middleware to reject invalid input before hitting services/Prisma.
 *
 * Covers: incidents, sox, dora, assets, workflow, personnel,
 *         branding, calendar, privacy, bulk
 */
import Joi from 'joi';

// ============================================================================
// INCIDENTS
// ============================================================================

const incidentSeverities = ['SEV1', 'SEV2', 'SEV3', 'SEV4'] as const;
const incidentCategories = [
  'DATA_BREACH', 'MALWARE', 'PHISHING', 'UNAUTHORIZED_ACCESS',
  'DDOS', 'INSIDER_THREAT', 'SYSTEM_FAILURE', 'POLICY_VIOLATION',
  'PHYSICAL_SECURITY', 'OTHER',
] as const;
const incidentStatuses = [
  'DETECTED', 'TRIAGED', 'CONTAINED', 'ERADICATED',
  'RECOVERED', 'CLOSED', 'POST_MORTEM',
] as const;
const taskStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED'] as const;

export const createIncidentSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().required().min(1).max(10000),
  severity: Joi.string().valid(...incidentSeverities).required(),
  category: Joi.string().valid(...incidentCategories).required(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  affectedSystems: Joi.array().items(Joi.string()).allow(null).optional(),
  affectedControls: Joi.array().items(Joi.string()).allow(null).optional(),
  impact: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateIncidentSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().min(1).max(10000).optional(),
  severity: Joi.string().valid(...incidentSeverities).optional(),
  status: Joi.string().valid(...incidentStatuses).optional(),
  category: Joi.string().valid(...incidentCategories).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  detectedAt: Joi.date().iso().allow(null).optional(),
  containedAt: Joi.date().iso().allow(null).optional(),
  resolvedAt: Joi.date().iso().allow(null).optional(),
  closedAt: Joi.date().iso().allow(null).optional(),
  rootCause: Joi.string().max(5000).allow('', null).optional(),
  impact: Joi.string().max(5000).allow('', null).optional(),
  lessonsLearned: Joi.string().max(10000).allow('', null).optional(),
  affectedSystems: Joi.array().items(Joi.string()).allow(null).optional(),
  affectedControls: Joi.array().items(Joi.string()).allow(null).optional(),
}).min(1).unknown(false);

export const createTimelineEntrySchema = Joi.object({
  action: Joi.string().required().min(1).max(200).trim(),
  details: Joi.string().required().min(1).max(5000),
}).unknown(false);

export const createIncidentTaskSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  assignee: Joi.string().required().min(1).max(200).trim(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateIncidentTaskSchema = Joi.object({
  status: Joi.string().valid(...taskStatuses).optional(),
  title: Joi.string().min(1).max(500).trim().optional(),
  assignee: Joi.string().min(1).max(200).trim().optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// SOX
// ============================================================================

export const createSOXControlSchema = Joi.object({
  controlId: Joi.string().max(100).allow('', null).optional(),
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  frequency: Joi.string().max(100).allow('', null).optional(),
  owner: Joi.string().max(200).allow('', null).optional(),
  process: Joi.string().max(200).allow('', null).optional(),
  assertion: Joi.string().max(200).allow('', null).optional(),
  riskLevel: Joi.string().max(50).allow('', null).optional(),
  effectiveness: Joi.string().max(50).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  evidence: Joi.array().items(Joi.object()).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateSOXControlSchema = Joi.object({
  controlId: Joi.string().max(100).allow('', null).optional(),
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  frequency: Joi.string().max(100).allow('', null).optional(),
  owner: Joi.string().max(200).allow('', null).optional(),
  process: Joi.string().max(200).allow('', null).optional(),
  assertion: Joi.string().max(200).allow('', null).optional(),
  riskLevel: Joi.string().max(50).allow('', null).optional(),
  effectiveness: Joi.string().max(50).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  evidence: Joi.array().items(Joi.object()).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

export const createSOXTestResultSchema = Joi.object({
  controlId: Joi.string().required().min(1).max(200),
  testType: Joi.string().max(100).allow('', null).optional(),
  testDate: Joi.date().iso().allow(null).optional(),
  result: Joi.string().max(100).allow('', null).optional(),
  findings: Joi.string().max(5000).allow('', null).optional(),
  evidence: Joi.array().items(Joi.object()).allow(null).optional(),
  sampleSize: Joi.number().min(0).allow(null).optional(),
  populationSize: Joi.number().min(0).allow(null).optional(),
  exceptionsFound: Joi.number().min(0).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateSOXTestResultSchema = Joi.object({
  testType: Joi.string().max(100).allow('', null).optional(),
  testDate: Joi.date().iso().allow(null).optional(),
  result: Joi.string().max(100).allow('', null).optional(),
  findings: Joi.string().max(5000).allow('', null).optional(),
  evidence: Joi.array().items(Joi.object()).allow(null).optional(),
  sampleSize: Joi.number().min(0).allow(null).optional(),
  populationSize: Joi.number().min(0).allow(null).optional(),
  exceptionsFound: Joi.number().min(0).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

export const createSOXAssessmentSchema = Joi.object({
  title: Joi.string().required().min(1).max(300).trim(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  severity: Joi.string().max(50).allow('', null).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  recommendation: Joi.string().max(5000).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateSOXAssessmentSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  severity: Joi.string().max(50).allow('', null).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  recommendation: Joi.string().max(5000).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// DORA
// ============================================================================

const ictRiskLevels = ['Critical', 'High', 'Medium', 'Low'] as const;
const ictRiskStatuses = ['Draft', 'InProgress', 'Completed', 'UnderReview', 'Approved'] as const;
const ictRiskAssessmentTypes = [
  'Initial', 'Periodic', 'AdHoc', 'PostIncident', 'ChangeTriggered',
] as const;

export const createICTRiskAssessmentSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  assessmentType: Joi.string().valid(...ictRiskAssessmentTypes).optional(),
  riskLevel: Joi.string().valid(...ictRiskLevels).optional(),
  status: Joi.string().valid(...ictRiskStatuses).optional(),
  scope: Joi.string().max(2000).allow('', null).optional(),
  methodology: Joi.string().max(2000).allow('', null).optional(),
  assets: Joi.array().items(Joi.object()).allow(null).optional(),
  threats: Joi.array().items(Joi.object()).allow(null).optional(),
  vulnerabilities: Joi.array().items(Joi.object()).allow(null).optional(),
  controls: Joi.array().items(Joi.object()).allow(null).optional(),
  residualRisk: Joi.string().max(200).allow('', null).optional(),
  mitigationPlan: Joi.string().max(5000).allow('', null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateICTRiskAssessmentSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  assessmentType: Joi.string().valid(...ictRiskAssessmentTypes).optional(),
  riskLevel: Joi.string().valid(...ictRiskLevels).optional(),
  status: Joi.string().valid(...ictRiskStatuses).optional(),
  scope: Joi.string().max(2000).allow('', null).optional(),
  methodology: Joi.string().max(2000).allow('', null).optional(),
  assets: Joi.array().items(Joi.object()).allow(null).optional(),
  threats: Joi.array().items(Joi.object()).allow(null).optional(),
  vulnerabilities: Joi.array().items(Joi.object()).allow(null).optional(),
  controls: Joi.array().items(Joi.object()).allow(null).optional(),
  residualRisk: Joi.string().max(200).allow('', null).optional(),
  mitigationPlan: Joi.string().max(5000).allow('', null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

const ictIncidentSeverities = ['Critical', 'Major', 'Significant', 'Minor'] as const;
const ictIncidentTypes = [
  'CyberAttack', 'SystemOutage', 'DataBreach', 'ThirdPartyFailure',
  'InfrastructureFailure', 'Other',
] as const;

export const createICTIncidentSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  severity: Joi.string().valid(...ictIncidentSeverities).optional(),
  incidentType: Joi.string().valid(...ictIncidentTypes).optional(),
  classification: Joi.string().max(100).allow('', null).optional(),
  detectedAt: Joi.date().iso().allow(null).optional(),
  affectedServices: Joi.array().items(Joi.string()).allow(null).optional(),
  affectedClients: Joi.number().min(0).allow(null).optional(),
  financialImpact: Joi.number().min(0).allow(null).optional(),
  rootCause: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateICTIncidentSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  severity: Joi.string().valid(...ictIncidentSeverities).optional(),
  status: Joi.string().max(100).allow('', null).optional(),
  incidentType: Joi.string().valid(...ictIncidentTypes).optional(),
  classification: Joi.string().max(100).allow('', null).optional(),
  containedAt: Joi.date().iso().allow(null).optional(),
  resolvedAt: Joi.date().iso().allow(null).optional(),
  rootCause: Joi.string().max(5000).allow('', null).optional(),
  remediationActions: Joi.array().items(Joi.object()).allow(null).optional(),
  lessonsLearned: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

export const escalateIncidentSchema = Joi.object({
  escalationLevel: Joi.string().required().min(1).max(100),
  reason: Joi.string().required().min(1).max(2000),
}).unknown(false);

const thirdPartyProviderTypes = [
  'CloudService', 'DataCenter', 'SoftwareVendor', 'NetworkProvider',
  'SecurityService', 'ConsultingFirm', 'Other',
] as const;
const thirdPartyCriticalities = ['Critical', 'Important', 'NonCritical'] as const;

export const createThirdPartyProviderSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  providerType: Joi.string().valid(...thirdPartyProviderTypes).optional(),
  criticality: Joi.string().valid(...thirdPartyCriticalities).optional(),
  country: Joi.string().max(100).allow('', null).optional(),
  services: Joi.array().items(Joi.string()).allow(null).optional(),
  contractStartDate: Joi.date().iso().allow(null).optional(),
  contractEndDate: Joi.date().iso().allow(null).optional(),
  annualCost: Joi.number().min(0).allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  riskAssessment: Joi.object().allow(null).optional(),
  exitStrategy: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateThirdPartyProviderSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  providerType: Joi.string().valid(...thirdPartyProviderTypes).optional(),
  criticality: Joi.string().valid(...thirdPartyCriticalities).optional(),
  country: Joi.string().max(100).allow('', null).optional(),
  services: Joi.array().items(Joi.string()).allow(null).optional(),
  contractStartDate: Joi.date().iso().allow(null).optional(),
  contractEndDate: Joi.date().iso().allow(null).optional(),
  annualCost: Joi.number().min(0).allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  riskAssessment: Joi.object().allow(null).optional(),
  exitStrategy: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

const resilienceTestTypes = [
  'VulnerabilityAssessment', 'PenetrationTest', 'TLPT',
  'ScenarioBased', 'RedTeam', 'TableTop',
] as const;

export const createResilienceTestSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  testType: Joi.string().valid(...resilienceTestTypes).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  scope: Joi.string().max(2000).allow('', null).optional(),
  scheduledDate: Joi.date().iso().allow(null).optional(),
  conductedBy: Joi.string().max(200).allow('', null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateResilienceTestSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  testType: Joi.string().valid(...resilienceTestTypes).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  scope: Joi.string().max(2000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  findings: Joi.array().items(Joi.object()).allow(null).optional(),
  remediationPlan: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

export const executeResilienceTestSchema = Joi.object({
  threatIntelligence: Joi.object().allow(null).optional(),
  testScenarios: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

const informationRegisterAssetTypes = [
  'Application', 'Database', 'Server', 'Network', 'CloudService',
  'ThirdPartyService', 'Other',
] as const;

export const createInformationRegisterEntrySchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  assetType: Joi.string().valid(...informationRegisterAssetTypes).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  owner: Joi.string().max(200).allow('', null).optional(),
  criticality: Joi.string().max(50).allow('', null).optional(),
  classification: Joi.string().max(100).allow('', null).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  thirdPartyProviderId: Joi.string().max(200).allow('', null).optional(),
  complianceStatus: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateInformationRegisterEntrySchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  assetType: Joi.string().valid(...informationRegisterAssetTypes).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  owner: Joi.string().max(200).allow('', null).optional(),
  criticality: Joi.string().max(50).allow('', null).optional(),
  classification: Joi.string().max(100).allow('', null).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  complianceStatus: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// ASSETS
// ============================================================================

const assetTypes = ['HARDWARE', 'SOFTWARE', 'DATA', 'NETWORK', 'CLOUD_SERVICE', 'PEOPLE', 'FACILITY'] as const;
const assetClassifications = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const;
const assetStatuses = ['ACTIVE', 'DECOMMISSIONED', 'IN_MAINTENANCE', 'PLANNED'] as const;

export const createAssetSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  type: Joi.string().valid(...assetTypes).required(),
  owner: Joi.string().required().min(1).max(200).trim(),
  category: Joi.string().max(100).allow('', null).optional(),
  department: Joi.string().max(200).allow('', null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  classification: Joi.string().valid(...assetClassifications).optional(),
  ipAddress: Joi.string().max(100).allow('', null).optional(),
  hostname: Joi.string().max(200).allow('', null).optional(),
  serialNumber: Joi.string().max(200).allow('', null).optional(),
  vendor: Joi.string().max(200).allow('', null).optional(),
  purchaseDate: Joi.date().iso().allow(null).optional(),
  endOfLife: Joi.date().iso().allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const updateAssetSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  type: Joi.string().valid(...assetTypes).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  owner: Joi.string().min(1).max(200).trim().optional(),
  department: Joi.string().max(200).allow('', null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  classification: Joi.string().valid(...assetClassifications).optional(),
  status: Joi.string().valid(...assetStatuses).optional(),
  ipAddress: Joi.string().max(100).allow('', null).optional(),
  hostname: Joi.string().max(200).allow('', null).optional(),
  serialNumber: Joi.string().max(200).allow('', null).optional(),
  vendor: Joi.string().max(200).allow('', null).optional(),
  purchaseDate: Joi.date().iso().allow(null).optional(),
  endOfLife: Joi.date().iso().allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// WORKFLOW
// ============================================================================

const workflowStatuses = ['Draft', 'Active', 'Archived', 'Disabled'] as const;

export const createWorkflowSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  workflowType: Joi.string().max(100).allow('', null).optional(),
  trigger: Joi.object().allow(null).optional(),
  nodes: Joi.array().items(Joi.object()).allow(null).optional(),
  edges: Joi.array().items(Joi.object()).allow(null).optional(),
  variables: Joi.object().allow(null).optional(),
  status: Joi.string().valid(...workflowStatuses).optional(),
}).unknown(false);

export const updateWorkflowSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  workflowType: Joi.string().max(100).allow('', null).optional(),
  trigger: Joi.object().allow(null).optional(),
  nodes: Joi.array().items(Joi.object()).allow(null).optional(),
  edges: Joi.array().items(Joi.object()).allow(null).optional(),
  variables: Joi.object().allow(null).optional(),
  status: Joi.string().valid(...workflowStatuses).optional(),
}).min(1).unknown(false);

export const createWorkflowRuleSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  trigger: Joi.object().allow(null).optional(),
  conditions: Joi.array().items(Joi.object()).allow(null).optional(),
  actions: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const updateWorkflowRuleSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  trigger: Joi.object().allow(null).optional(),
  status: Joi.string().valid(...workflowStatuses).optional(),
  conditions: Joi.array().items(Joi.object()).allow(null).optional(),
  actions: Joi.array().items(Joi.object()).allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// PERSONNEL
// ============================================================================

export const createPersonnelSchema = Joi.object({
  firstName: Joi.string().required().min(1).max(200).trim(),
  lastName: Joi.string().required().min(1).max(200).trim(),
  email: Joi.string().email().required(),
  department: Joi.string().max(200).allow('', null).optional(),
  title: Joi.string().max(200).allow('', null).optional(),
  role: Joi.string().max(100).allow('', null).optional(),
  manager: Joi.string().max(200).allow('', null).optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  clearanceLevel: Joi.string().max(100).allow('', null).optional(),
  trainingCompleted: Joi.array().items(Joi.object()).allow(null).optional(),
  accessRights: Joi.array().items(Joi.object()).allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updatePersonnelSchema = Joi.object({
  firstName: Joi.string().min(1).max(200).trim().optional(),
  lastName: Joi.string().min(1).max(200).trim().optional(),
  email: Joi.string().email().optional(),
  department: Joi.string().max(200).allow('', null).optional(),
  title: Joi.string().max(200).allow('', null).optional(),
  role: Joi.string().max(100).allow('', null).optional(),
  manager: Joi.string().max(200).allow('', null).optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  endDate: Joi.date().iso().allow(null).optional(),
  clearanceLevel: Joi.string().max(100).allow('', null).optional(),
  trainingCompleted: Joi.array().items(Joi.object()).allow(null).optional(),
  accessRights: Joi.array().items(Joi.object()).allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

export const startOffboardingSchema = Joi.object({
  reason: Joi.string().required().min(1).max(1000).trim(),
}).unknown(false);

export const createAccessReviewSchema = Joi.object({
  personnelId: Joi.string().required().min(1).max(200),
  reviewType: Joi.string().max(100).allow('', null).optional(),
  accessItems: Joi.array().items(Joi.object()).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const completeAccessReviewSchema = Joi.object({
  decision: Joi.string().required().min(1).max(100),
  recommendations: Joi.array().items(Joi.string()).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
  revokedAccess: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

// ============================================================================
// BRANDING
// ============================================================================

const hexColorPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const upsertBrandingSchema = Joi.object({
  primaryColor: Joi.string().pattern(hexColorPattern).allow('', null).optional(),
  secondaryColor: Joi.string().pattern(hexColorPattern).allow('', null).optional(),
  accentColor: Joi.string().pattern(hexColorPattern).allow('', null).optional(),
  companyName: Joi.string().max(200).allow('', null).optional(),
  customDomain: Joi.string().pattern(domainPattern).allow('', null).optional(),
  customCSS: Joi.string().max(50000).allow('', null).optional(),
  emailTemplate: Joi.string().max(50000).allow('', null).optional(),
  loginPageHtml: Joi.string().max(50000).allow('', null).optional(),
  footerText: Joi.string().max(2000).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// CALENDAR
// ============================================================================

const deadlineTypes = [
  'AUDIT_DATE', 'CERTIFICATION_RENEWAL', 'POLICY_REVIEW',
  'RISK_REASSESSMENT', 'REGULATORY_FILING', 'TRAINING_DUE',
  'EVIDENCE_REFRESH', 'VENDOR_REVIEW', 'BOARD_REPORT',
  'INCIDENT_REPORT_DEADLINE', 'DSAR_RESPONSE',
] as const;
const deadlineStatuses = ['UPCOMING', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'CANCELLED'] as const;

export const createDeadlineSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  type: Joi.string().valid(...deadlineTypes).required(),
  dueDate: Joi.date().iso().required(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  reminderDays: Joi.array().items(Joi.number().min(0).max(365)).allow(null).optional(),
  recurrence: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateDeadlineSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  type: Joi.string().valid(...deadlineTypes).optional(),
  dueDate: Joi.date().iso().optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  status: Joi.string().valid(...deadlineStatuses).optional(),
  reminderDays: Joi.array().items(Joi.number().min(0).max(365)).allow(null).optional(),
  recurrence: Joi.string().max(50).allow('', null).optional(),
  completedAt: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// PRIVACY — DSAR
// ============================================================================

const dsarRequestTypes = [
  'Access', 'Deletion', 'Rectification', 'Portability',
  'Restriction', 'Objection', 'OptOut', 'DoNotSell',
] as const;
const dsarRegulations = ['GDPR', 'CCPA', 'LGPD', 'POPIA', 'PDPA', 'Other'] as const;
const dsarPriorities = ['High', 'Normal', 'Low'] as const;

export const createDSARSchema = Joi.object({
  requestType: Joi.string().valid(...dsarRequestTypes).required(),
  dataSubjectName: Joi.string().required().min(1).max(300).trim(),
  dataSubjectEmail: Joi.string().email().required(),
  dataSubjectPhone: Joi.string().max(50).allow('', null).optional(),
  regulation: Joi.string().valid(...dsarRegulations).optional(),
  jurisdiction: Joi.string().max(100).allow('', null).optional(),
  priority: Joi.string().valid(...dsarPriorities).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateDSARSchema = Joi.object({
  requestType: Joi.string().valid(...dsarRequestTypes).optional(),
  dataSubjectName: Joi.string().min(1).max(300).trim().optional(),
  dataSubjectEmail: Joi.string().email().optional(),
  dataSubjectPhone: Joi.string().max(50).allow('', null).optional(),
  identityVerified: Joi.boolean().optional(),
  identityVerifiedAt: Joi.date().iso().allow(null).optional(),
  identityVerifiedBy: Joi.string().max(200).allow('', null).optional(),
  verificationMethod: Joi.string().max(200).allow('', null).optional(),
  regulation: Joi.string().valid(...dsarRegulations).optional(),
  jurisdiction: Joi.string().max(100).allow('', null).optional(),
  acknowledgedDate: Joi.date().iso().allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  completedDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  priority: Joi.string().valid(...dsarPriorities).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  systemsSearched: Joi.array().items(Joi.string()).allow(null).optional(),
  dataFound: Joi.boolean().optional(),
  responseMethod: Joi.string().max(200).allow('', null).optional(),
  responseDetails: Joi.string().max(5000).allow('', null).optional(),
  responseAttachments: Joi.array().items(Joi.object()).allow(null).optional(),
  extensionApplied: Joi.boolean().optional(),
  extensionReason: Joi.string().max(1000).allow('', null).optional(),
  extensionDueDate: Joi.date().iso().allow(null).optional(),
  rejectionReason: Joi.string().max(1000).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// PRIVACY — CONSENT
// ============================================================================

export const createConsentRecordSchema = Joi.object({
  dataSubjectId: Joi.string().required().min(1).max(200),
  dataSubjectEmail: Joi.string().email().allow('', null).optional(),
  consentType: Joi.string().required().min(1).max(100),
  purpose: Joi.string().required().min(1).max(500),
  legalBasis: Joi.string().max(200).allow('', null).optional(),
  channel: Joi.string().max(100).allow('', null).optional(),
  consentGiven: Joi.boolean().optional(),
  consentDate: Joi.date().iso().allow(null).optional(),
  consentExpiry: Joi.date().iso().allow(null).optional(),
  version: Joi.string().max(20).allow('', null).optional(),
  policyVersion: Joi.string().max(50).allow('', null).optional(),
  proofOfConsent: Joi.object().allow(null).optional(),
  granularity: Joi.object().allow(null).optional(),
  doubleOptIn: Joi.boolean().optional(),
  doubleOptInDate: Joi.date().iso().allow(null).optional(),
  source: Joi.string().max(200).allow('', null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const updateConsentRecordSchema = Joi.object({
  dataSubjectId: Joi.string().min(1).max(200).optional(),
  dataSubjectEmail: Joi.string().email().allow('', null).optional(),
  consentType: Joi.string().min(1).max(100).optional(),
  purpose: Joi.string().min(1).max(500).optional(),
  legalBasis: Joi.string().max(200).allow('', null).optional(),
  channel: Joi.string().max(100).allow('', null).optional(),
  consentGiven: Joi.boolean().optional(),
  consentDate: Joi.date().iso().allow(null).optional(),
  consentExpiry: Joi.date().iso().allow(null).optional(),
  withdrawnAt: Joi.date().iso().allow(null).optional(),
  withdrawalMethod: Joi.string().max(200).allow('', null).optional(),
  version: Joi.string().max(20).allow('', null).optional(),
  policyVersion: Joi.string().max(50).allow('', null).optional(),
  proofOfConsent: Joi.object().allow(null).optional(),
  granularity: Joi.object().allow(null).optional(),
  doubleOptIn: Joi.boolean().optional(),
  doubleOptInDate: Joi.date().iso().allow(null).optional(),
  source: Joi.string().max(200).allow('', null).optional(),
  metadata: Joi.object().allow(null).optional(),
  dataSubjectAge: Joi.number().min(0).max(150).allow(null).optional(),
  isMinor: Joi.boolean().optional(),
  parentalConsentGiven: Joi.boolean().optional(),
  parentalConsentDate: Joi.date().iso().allow(null).optional(),
  parentalConsentEmail: Joi.string().email().allow('', null).optional(),
  parentalConsentMethod: Joi.string().max(200).allow('', null).optional(),
  ageVerificationMethod: Joi.string().max(200).allow('', null).optional(),
}).min(1).unknown(false);

export const upsertConsentPreferenceSchema = Joi.object({
  dataSubjectEmail: Joi.string().email().allow('', null).optional(),
  preferences: Joi.object().allow(null).optional(),
  marketingOptOut: Joi.boolean().optional(),
  communicationChannels: Joi.array().items(Joi.string()).allow(null).optional(),
  doNotSell: Joi.boolean().optional(),
  doNotShare: Joi.boolean().optional(),
  limitUse: Joi.boolean().optional(),
}).unknown(false);

// ============================================================================
// PRIVACY — RETENTION
// ============================================================================

export const createRetentionPolicySchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  dataCategory: Joi.string().required().min(1).max(200),
  retentionPeriod: Joi.number().required().min(1),
  legalBasis: Joi.string().max(200).allow('', null).optional(),
  regulation: Joi.string().max(100).allow('', null).optional(),
  autoDelete: Joi.boolean().optional(),
  autoDeleteWarningDays: Joi.number().min(0).allow(null).optional(),
  reviewFrequency: Joi.string().max(50).allow('', null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateRetentionPolicySchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  dataCategory: Joi.string().min(1).max(200).optional(),
  retentionPeriod: Joi.number().min(1).optional(),
  legalBasis: Joi.string().max(200).allow('', null).optional(),
  regulation: Joi.string().max(100).allow('', null).optional(),
  autoDelete: Joi.boolean().optional(),
  autoDeleteWarningDays: Joi.number().min(0).allow(null).optional(),
  reviewFrequency: Joi.string().max(50).allow('', null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// BULK
// ============================================================================

const bulkResourceTypes = ['risks', 'policies', 'vendors', 'incidents', 'assets'] as const;

export const bulkUpdateSchema = Joi.object({
  resourceType: Joi.string().valid(...bulkResourceTypes).required(),
  resourceIds: Joi.array().items(Joi.string().min(1)).required().min(1).max(500),
  updates: Joi.object().required().min(1),
}).unknown(false);

export const bulkExportSchema = Joi.object({
  resourceType: Joi.string().valid(...bulkResourceTypes).required(),
  resourceIds: Joi.array().items(Joi.string().min(1)).required().min(1).max(500),
  fields: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const bulkDeleteSchema = Joi.object({
  resourceType: Joi.string().valid(...bulkResourceTypes).required(),
  resourceIds: Joi.array().items(Joi.string().min(1)).required().min(1).max(500),
}).unknown(false);

export const bulkAssignSchema = Joi.object({
  resourceType: Joi.string().valid(...bulkResourceTypes).required(),
  resourceIds: Joi.array().items(Joi.string().min(1)).required().min(1).max(500),
  assigneeId: Joi.string().required().min(1).max(200),
}).unknown(false);

// ============================================================================
// EXCEPTIONS
// ============================================================================

const exceptionStatuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED'] as const;

export const createExceptionSchema = Joi.object({
  controlId: Joi.string().required().min(1).max(200),
  title: Joi.string().required().min(1).max(500).trim(),
  justification: Joi.string().required().min(1).max(5000),
  riskAcceptance: Joi.string().required().min(1).max(5000),
  compensatingControls: Joi.string().max(5000).allow('', null).optional(),
  expiryDate: Joi.date().iso().required(),
  reviewDate: Joi.date().iso().required(),
}).unknown(false);

export const updateExceptionSchema = Joi.object({
  controlId: Joi.string().min(1).max(200).optional(),
  title: Joi.string().min(1).max(500).trim().optional(),
  justification: Joi.string().min(1).max(5000).optional(),
  riskAcceptance: Joi.string().min(1).max(5000).optional(),
  compensatingControls: Joi.string().max(5000).allow('', null).optional(),
  status: Joi.string().valid(...exceptionStatuses).optional(),
  expiryDate: Joi.date().iso().optional(),
  reviewDate: Joi.date().iso().optional(),
}).min(1).unknown(false);

// ============================================================================
// COSTS
// ============================================================================

const costCategories = [
  'TOOL_LICENSE', 'CONSULTANT', 'AUDIT_FEE', 'TRAINING',
  'PERSONNEL', 'REMEDIATION', 'INSURANCE', 'CERTIFICATION',
  'LEGAL', 'OTHER',
] as const;

export const createCostSchema = Joi.object({
  category: Joi.string().valid(...costCategories).required(),
  description: Joi.string().required().min(1).max(5000),
  amount: Joi.number().required().min(0),
  currency: Joi.string().max(10).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  vendorId: Joi.string().max(200).allow('', null).optional(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
}).unknown(false);

export const updateCostSchema = Joi.object({
  category: Joi.string().valid(...costCategories).optional(),
  description: Joi.string().min(1).max(5000).optional(),
  amount: Joi.number().min(0).optional(),
  currency: Joi.string().max(10).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  vendorId: Joi.string().max(200).allow('', null).optional(),
  periodStart: Joi.date().iso().optional(),
  periodEnd: Joi.date().iso().optional(),
}).min(1).unknown(false);

// ============================================================================
// CERTIFICATIONS
// ============================================================================

const certStatuses = ['CERT_ACTIVE', 'EXPIRING_SOON', 'CERT_EXPIRED', 'REVOKED', 'SUSPENDED'] as const;
const certAuditTypes = ['INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION'] as const;

export const createCertificationSchema = Joi.object({
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  name: Joi.string().required().min(1).max(300).trim(),
  certBody: Joi.string().required().min(1).max(300).trim(),
  certNumber: Joi.string().max(200).allow('', null).optional(),
  issueDate: Joi.date().iso().required(),
  expiryDate: Joi.date().iso().required(),
  scope: Joi.string().max(5000).allow('', null).optional(),
  documents: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const updateCertificationSchema = Joi.object({
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  name: Joi.string().min(1).max(300).trim().optional(),
  certBody: Joi.string().min(1).max(300).trim().optional(),
  certNumber: Joi.string().max(200).allow('', null).optional(),
  issueDate: Joi.date().iso().optional(),
  expiryDate: Joi.date().iso().optional(),
  status: Joi.string().valid(...certStatuses).optional(),
  scope: Joi.string().max(5000).allow('', null).optional(),
  documents: Joi.array().items(Joi.object()).allow(null).optional(),
}).min(1).unknown(false);

export const createCertAuditSchema = Joi.object({
  type: Joi.string().valid(...certAuditTypes).required(),
  scheduledDate: Joi.date().iso().required(),
  auditorName: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const updateCertAuditSchema = Joi.object({
  type: Joi.string().valid(...certAuditTypes).optional(),
  scheduledDate: Joi.date().iso().optional(),
  completedDate: Joi.date().iso().allow(null).optional(),
  auditorName: Joi.string().max(200).allow('', null).optional(),
  findings: Joi.string().max(10000).allow('', null).optional(),
  result: Joi.string().max(200).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// CONTROL TESTING
// ============================================================================

const controlTestTypes = [
  'ACCESS_REVIEW_TEST', 'CONFIGURATION_CHECK', 'VULNERABILITY_SCAN_TEST',
  'POLICY_REVIEW_TEST', 'LOG_REVIEW', 'ENCRYPTION_CHECK',
  'BACKUP_VERIFICATION', 'INCIDENT_RESPONSE_TEST',
  'CHANGE_MANAGEMENT_REVIEW', 'NETWORK_SEGMENTATION_CHECK',
] as const;

export const createControlTestSchema = Joi.object({
  controlId: Joi.string().required().min(1).max(200),
  testType: Joi.string().valid(...controlTestTypes).required(),
  testConfig: Joi.object().allow(null).optional(),
  schedule: Joi.object().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(false);

export const updateControlTestSchema = Joi.object({
  controlId: Joi.string().min(1).max(200).optional(),
  testType: Joi.string().valid(...controlTestTypes).optional(),
  testConfig: Joi.object().allow(null).optional(),
  schedule: Joi.object().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1).unknown(false);

// ============================================================================
// BUSINESS IMPACT ANALYSIS
// ============================================================================

const biaCriticalities = [
  'MISSION_CRITICAL', 'BUSINESS_CRITICAL', 'IMPORTANT', 'STANDARD', 'LOW_PRIORITY',
] as const;

const dependencyTypes = [
  'INTERNAL_PROCESS', 'VENDOR_SERVICE', 'TECHNOLOGY', 'PERSONNEL', 'FACILITY',
] as const;

export const createBusinessProcessSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  owner: Joi.string().required().min(1).max(200).trim(),
  department: Joi.string().required().min(1).max(200).trim(),
  criticality: Joi.string().valid(...biaCriticalities).optional(),
  rto: Joi.number().min(0).optional(),
  rpo: Joi.number().min(0).optional(),
  mtpd: Joi.number().min(0).optional(),
  impactAnalysis: Joi.object().allow(null).optional(),
  assets: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const updateBusinessProcessSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  owner: Joi.string().min(1).max(200).trim().optional(),
  department: Joi.string().min(1).max(200).trim().optional(),
  criticality: Joi.string().valid(...biaCriticalities).optional(),
  rto: Joi.number().min(0).optional(),
  rpo: Joi.number().min(0).optional(),
  mtpd: Joi.number().min(0).optional(),
  impactAnalysis: Joi.object().allow(null).optional(),
  assets: Joi.array().items(Joi.object()).allow(null).optional(),
}).min(1).unknown(false);

export const createProcessDependencySchema = Joi.object({
  dependsOn: Joi.string().required().min(1).max(200),
  type: Joi.string().valid(...dependencyTypes).required(),
  isCritical: Joi.boolean().optional(),
}).unknown(false);

// ============================================================================
// SEPARATION OF DUTIES
// ============================================================================

export const createSoDRuleSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  ruleType: Joi.string().max(100).allow('', null).optional(),
  severity: Joi.string().max(50).allow('', null).optional(),
  function1: Joi.string().max(200).allow('', null).optional(),
  function2: Joi.string().max(200).allow('', null).optional(),
  system: Joi.string().max(200).allow('', null).optional(),
  scope: Joi.string().max(200).allow('', null).optional(),
  enabled: Joi.boolean().optional(),
  conflictingRoles: Joi.array().items(Joi.string()).allow(null).optional(),
  conflictingPermissions: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const updateSoDRuleSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  ruleType: Joi.string().max(100).allow('', null).optional(),
  severity: Joi.string().max(50).allow('', null).optional(),
  function1: Joi.string().max(200).allow('', null).optional(),
  function2: Joi.string().max(200).allow('', null).optional(),
  system: Joi.string().max(200).allow('', null).optional(),
  scope: Joi.string().max(200).allow('', null).optional(),
  enabled: Joi.boolean().optional(),
  conflictingRoles: Joi.array().items(Joi.string()).allow(null).optional(),
  conflictingPermissions: Joi.array().items(Joi.string()).allow(null).optional(),
}).min(1).unknown(false);

export const importSoDRulesSchema = Joi.object({
  rules: Joi.array().items(Joi.object()).required().min(1),
}).unknown(false);

export const mitigateSoDViolationSchema = Joi.object({
  mitigationPlan: Joi.string().max(5000).allow('', null).optional(),
  compensatingControlId: Joi.string().max(200).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const acceptSoDViolationSchema = Joi.object({
  justification: Joi.string().required().min(1).max(5000),
  expiryDate: Joi.date().iso().allow(null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const remediateSoDViolationSchema = Joi.object({
  remediationPlan: Joi.string().max(5000).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const createCompensatingControlSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  controlType: Joi.string().max(100).allow('', null).optional(),
  effectiveness: Joi.string().max(50).allow('', null).optional(),
  reviewDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateCompensatingControlSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  controlType: Joi.string().max(100).allow('', null).optional(),
  effectiveness: Joi.string().max(50).allow('', null).optional(),
  reviewDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// MDM (Mobile Device Management)
// ============================================================================

export const enrollDeviceSchema = Joi.object({
  deviceName: Joi.string().required().min(1).max(300).trim(),
  platform: Joi.string().max(50).allow('', null).optional(),
  osVersion: Joi.string().max(100).allow('', null).optional(),
  serialNumber: Joi.string().max(200).allow('', null).optional(),
  model: Joi.string().max(200).allow('', null).optional(),
  userId: Joi.string().max(200).allow('', null).optional(),
  userName: Joi.string().max(200).allow('', null).optional(),
  department: Joi.string().max(200).allow('', null).optional(),
  ownershipType: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateDeviceSchema = Joi.object({
  deviceName: Joi.string().min(1).max(300).trim().optional(),
  platform: Joi.string().max(50).allow('', null).optional(),
  osVersion: Joi.string().max(100).allow('', null).optional(),
  complianceStatus: Joi.string().max(50).allow('', null).optional(),
  encryptionEnabled: Joi.boolean().optional(),
  passcodeEnabled: Joi.boolean().optional(),
  jailbroken: Joi.boolean().optional(),
  lastSeen: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

export const reassignDeviceSchema = Joi.object({
  newUserId: Joi.string().required().min(1).max(200),
  newUserName: Joi.string().max(200).allow('', null).optional(),
  reason: Joi.string().max(1000).allow('', null).optional(),
}).unknown(false);

export const createMdmPolicySchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  platform: Joi.string().max(50).allow('', null).optional(),
  settings: Joi.object().allow(null).optional(),
  enforced: Joi.boolean().optional(),
}).unknown(false);

export const updateMdmPolicySchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  platform: Joi.string().max(50).allow('', null).optional(),
  settings: Joi.object().allow(null).optional(),
  enforced: Joi.boolean().optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

export const bulkDeviceActionSchema = Joi.object({
  deviceIds: Joi.array().items(Joi.string().min(1)).required().min(1).max(100),
  action: Joi.string().required().min(1).max(50),
}).unknown(false);

// ============================================================================
// MATURITY ASSESSMENT
// ============================================================================

const maturityDomainScoreSchema = Joi.object({
  domain: Joi.string().required().min(1).max(200),
  currentLevel: Joi.number().min(1).max(5).optional(),
  targetLevel: Joi.number().min(1).max(5).optional(),
  gaps: Joi.object().allow(null).optional(),
});

export const createMaturityAssessmentSchema = Joi.object({
  assessmentDate: Joi.date().iso().optional(),
  domains: Joi.array().items(maturityDomainScoreSchema).required().min(1),
}).unknown(false);

export const generateMaturityRecommendationsSchema = Joi.object({
  additionalContext: Joi.string().max(5000).allow('', null).optional(),
  priorityAreas: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

// ============================================================================
// TICKETING
// ============================================================================

const ticketingProviders = ['jira', 'servicenow', 'azure_devops'] as const;
const ticketingAuthTypes = ['basic', 'oauth', 'pat'] as const;
const syncDirections = ['push', 'pull', 'bidirectional'] as const;

// Validates request SHAPE only. Secret fields (password, pat, clientSecret,
// accessToken, refreshToken) arrive in plaintext over TLS and are encrypted at
// rest by the consuming route/services (routes/ticketing.ts via encryptField;
// jira/servicenow/azureDevOps saveIntegration) before any DB write.
export const saveTicketingConfigSchema = Joi.object({
  provider: Joi.string().valid(...ticketingProviders).required(),
  instanceUrl: Joi.string().uri().max(500).allow('', null).optional(),
  organization: Joi.string().max(200).allow('', null).optional(),
  project: Joi.string().max(200).allow('', null).optional(),
  projectKey: Joi.string().max(100).allow('', null).optional(),
  authType: Joi.string().valid(...ticketingAuthTypes).optional(),
  username: Joi.string().max(200).allow('', null).optional(),
  password: Joi.string().max(500).allow('', null).optional(),
  pat: Joi.string().max(500).allow('', null).optional(),
  clientId: Joi.string().max(500).allow('', null).optional(),
  clientSecret: Joi.string().max(500).allow('', null).optional(),
  accessToken: Joi.string().max(2000).allow('', null).optional(),
  refreshToken: Joi.string().max(2000).allow('', null).optional(),
  cloudId: Joi.string().max(200).allow('', null).optional(),
  siteName: Joi.string().max(200).allow('', null).optional(),
  siteUrl: Joi.string().max(500).allow('', null).optional(),
  tenantId: Joi.string().max(200).allow('', null).optional(),
  defaultIssueType: Joi.string().max(100).allow('', null).optional(),
  defaultPriority: Joi.string().max(100).allow('', null).optional(),
  syncEnabled: Joi.boolean().optional(),
  syncDirection: Joi.string().valid(...syncDirections).optional(),
  syncIntervalMinutes: Joi.number().min(1).max(1440).optional(),
  mappingRules: Joi.object().allow(null).optional(),
  // Inbound-webhook HMAC secret. Optional: when omitted on a new connection the
  // route generates one server-side. Encrypted at rest before any DB write.
  webhookSecret: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

export const testTicketingConnectionSchema = Joi.object({
  provider: Joi.string().valid(...ticketingProviders).required(),
}).unknown(false);

export const syncTicketingSchema = Joi.object({
  provider: Joi.string().valid(...ticketingProviders).required(),
  direction: Joi.string().valid(...syncDirections).optional(),
  since: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const createTicketSchema = Joi.object({
  provider: Joi.string().valid(...ticketingProviders).required(),
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(10000).allow('', null).optional(),
  severity: Joi.string().max(50).allow('', null).optional(),
  framework: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  sourceType: Joi.string().max(100).allow('', null).optional(),
  sourceId: Joi.string().max(200).allow('', null).optional(),
  projectKey: Joi.string().max(100).allow('', null).optional(),
  issueType: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const bulkTicketSyncSchema = Joi.object({
  provider: Joi.string().valid(...ticketingProviders).optional(),
}).unknown(false);

export const updateFieldMappingSchema = Joi.object({
  mappingRules: Joi.object().required(),
}).unknown(false);

// ============================================================================
// EVIDENCE COLLECTION
// ============================================================================

const evidenceSourceTypes = [
  'AWS_CONFIG', 'AZURE_POLICY', 'GITHUB_ACTIONS', 'JIRA_TICKETS',
  'SLACK_MESSAGES', 'GOOGLE_DRIVE', 'CLOUDTRAIL_LOGS',
  'VULNERABILITY_SCAN', 'PENETRATION_TEST', 'ACCESS_REVIEW',
  'TRAINING_RECORDS', 'MANUAL_UPLOAD',
] as const;

export const createEvidenceCollectionRuleSchema = Joi.object({
  controlId: Joi.string().required().min(1).max(200),
  sourceType: Joi.string().valid(...evidenceSourceTypes).required(),
  integrationId: Joi.string().max(200).allow('', null).optional(),
  query: Joi.object().allow(null).optional(),
  schedule: Joi.object().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(false);

export const updateEvidenceCollectionRuleSchema = Joi.object({
  controlId: Joi.string().min(1).max(200).optional(),
  sourceType: Joi.string().valid(...evidenceSourceTypes).optional(),
  integrationId: Joi.string().max(200).allow('', null).optional(),
  query: Joi.object().allow(null).optional(),
  schedule: Joi.object().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1).unknown(false);

// ============================================================================
// CONTROL MAPPINGS
// ============================================================================

const mappingTypes = ['equivalent', 'partial', 'related', 'superset', 'subset'] as const;

export const createControlMappingSchema = Joi.object({
  sourceControlId: Joi.string().required().min(1).max(200),
  targetControlId: Joi.string().required().min(1).max(200),
  mappingType: Joi.string().valid(...mappingTypes).optional(),
  confidence: Joi.number().min(0).max(100).optional(),
}).unknown(false);

export const updateControlMappingSchema = Joi.object({
  mappingType: Joi.string().valid(...mappingTypes).optional(),
  confidence: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// CONTROL EFFECTIVENESS
// ============================================================================

const effectivenessRatings = ['EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE', 'NOT_TESTED'] as const;

export const createControlEffectivenessSchema = Joi.object({
  controlId: Joi.string().required().min(1).max(200),
  rating: Joi.string().valid(...effectivenessRatings).required(),
  testMethod: Joi.string().required().min(1).max(200),
  findings: Joi.string().max(10000).allow('', null).optional(),
  evidence: Joi.array().items(Joi.object()).allow(null).optional(),
  assessmentDate: Joi.date().iso().optional(),
}).unknown(false);

// ============================================================================
// SECURITY TRAINING
// ============================================================================

const trainingCategories = [
  'SecurityAwareness', 'DataPrivacy', 'IncidentResponse',
  'PhishingPrevention', 'ComplianceRegulatory', 'SecureCoding',
  'GDPR', 'DataHandling', 'AccessControl',
] as const;

export const createSecurityTrainingSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  category: Joi.string().valid(...trainingCategories).required(),
  content: Joi.object().allow(null).optional(),
  contentType: Joi.string().max(100).allow('', null).optional(),
  duration: Joi.number().min(0).allow(null).optional(),
  passingScore: Joi.number().min(0).max(100).optional(),
  maxAttempts: Joi.number().min(1).max(100).optional(),
  isRequired: Joi.boolean().optional(),
  recurrence: Joi.string().max(50).allow('', null).optional(),
  validityPeriod: Joi.number().min(1).optional(),
}).unknown(false);

export const updateSecurityTrainingSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  category: Joi.string().valid(...trainingCategories).optional(),
  content: Joi.object().allow(null).optional(),
  contentType: Joi.string().max(100).allow('', null).optional(),
  duration: Joi.number().min(0).allow(null).optional(),
  passingScore: Joi.number().min(0).max(100).optional(),
  maxAttempts: Joi.number().min(1).max(100).optional(),
  isRequired: Joi.boolean().optional(),
  recurrence: Joi.string().max(50).allow('', null).optional(),
  validityPeriod: Joi.number().min(1).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

export const assignTrainingSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().min(1)).required().min(1).max(500),
  dueDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const assignAllTrainingSchema = Joi.object({
  dueDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateTrainingRecordSchema = Joi.object({
  action: Joi.string().valid('start', 'complete').optional(),
  score: Joi.number().min(0).max(100).allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  assignedAt: Joi.date().iso().allow(null).optional(),
  startedAt: Joi.date().iso().allow(null).optional(),
  completedAt: Joi.date().iso().allow(null).optional(),
  expiresAt: Joi.date().iso().allow(null).optional(),
  attempts: Joi.number().min(0).allow(null).optional(),
  certificateUrl: Joi.string().max(1000).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// ONBOARDING
// ============================================================================

export const updateOnboardingProgressSchema = Joi.object({
  currentFlow: Joi.string().max(100).allow('', null).optional(),
  currentStep: Joi.number().min(0).optional(),
  completedSteps: Joi.array().items(Joi.string()).allow(null).optional(),
  milestones: Joi.object().allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const trackOnboardingEventSchema = Joi.object({
  eventType: Joi.string().required().min(1).max(100),
  flowName: Joi.string().max(200).allow('', null).optional(),
  stepIndex: Joi.number().integer().min(0).allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const completeMilestoneSchema = Joi.object({
  milestone: Joi.string().required().min(1).max(200),
}).unknown(false);

export const updateOnboardingPreferencesSchema = Joi.object({
  showHints: Joi.boolean().optional(),
  reducedMotion: Joi.boolean().optional(),
  theme: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const skipFlowSchema = Joi.object({
  flowName: Joi.string().required().min(1).max(200),
}).unknown(false);

export const updateChecklistSchema = Joi.object({
  profileCompleted: Joi.boolean().optional(),
  teamInvited: Joi.boolean().optional(),
  firstFrameworkAdded: Joi.boolean().optional(),
  firstEvidenceUploaded: Joi.boolean().optional(),
  firstControlPassed: Joi.boolean().optional(),
  integrationConnected: Joi.boolean().optional(),
  aiFeatureUsed: Joi.boolean().optional(),
  firstReportGenerated: Joi.boolean().optional(),
  acosConfigured: Joi.boolean().optional(),
  digitalTwinActivated: Joi.boolean().optional(),
  riskHeatmapViewed: Joi.boolean().optional(),
  regulatoryTrackerViewed: Joi.boolean().optional(),
  vendorMonitoringConfigured: Joi.boolean().optional(),
  privacyPlatformViewed: Joi.boolean().optional(),
  incidentManagementViewed: Joi.boolean().optional(),
  controlTestingConfigured: Joi.boolean().optional(),
  auditPrepStarted: Joi.boolean().optional(),
  workflowAutomationConfigured: Joi.boolean().optional(),
}).unknown(false).min(1);

// ============================================================================
// ROPA (Records of Processing Activities)
// ============================================================================

const lawfulBases = [
  'Consent', 'Contract', 'LegalObligation',
  'VitalInterests', 'PublicTask', 'LegitimateInterests',
] as const;

export const createProcessingActivitySchema = Joi.object({
  activityName: Joi.string().required().min(1).max(500).trim(),
  activityDescription: Joi.string().max(5000).allow('', null).optional(),
  controllerName: Joi.string().max(300).allow('', null).optional(),
  controllerContact: Joi.string().max(500).allow('', null).optional(),
  processorName: Joi.string().max(300).allow('', null).optional(),
  processorContact: Joi.string().max(500).allow('', null).optional(),
  dpoContact: Joi.string().max(500).allow('', null).optional(),
  purposes: Joi.array().items(Joi.string()).allow(null).optional(),
  lawfulBasis: Joi.string().required().min(1).max(100),
  legitimateInterestDetails: Joi.string().max(5000).allow('', null).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  specialCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  dataSubjectCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  recipients: Joi.array().items(Joi.string()).allow(null).optional(),
  internationalTransfers: Joi.boolean().optional(),
  transferCountries: Joi.array().items(Joi.string()).allow(null).optional(),
  transferSafeguards: Joi.string().max(5000).allow('', null).optional(),
  retentionPeriod: Joi.string().max(500).allow('', null).optional(),
  retentionJustification: Joi.string().max(5000).allow('', null).optional(),
  technicalMeasures: Joi.array().items(Joi.string()).allow(null).optional(),
  organizationalMeasures: Joi.array().items(Joi.string()).allow(null).optional(),
  automatedDecisionMaking: Joi.boolean().optional(),
  automatedDecisionDetails: Joi.string().max(5000).allow('', null).optional(),
  dpiaRequired: Joi.boolean().optional(),
  dpiaReference: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

export const updateProcessingActivitySchema = Joi.object({
  activityName: Joi.string().min(1).max(500).trim().optional(),
  activityDescription: Joi.string().max(5000).allow('', null).optional(),
  controllerName: Joi.string().max(300).allow('', null).optional(),
  controllerContact: Joi.string().max(500).allow('', null).optional(),
  processorName: Joi.string().max(300).allow('', null).optional(),
  processorContact: Joi.string().max(500).allow('', null).optional(),
  dpoContact: Joi.string().max(500).allow('', null).optional(),
  purposes: Joi.array().items(Joi.string()).allow(null).optional(),
  lawfulBasis: Joi.string().min(1).max(100).optional(),
  legitimateInterestDetails: Joi.string().max(5000).allow('', null).optional(),
  dataCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  specialCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  dataSubjectCategories: Joi.array().items(Joi.string()).allow(null).optional(),
  recipients: Joi.array().items(Joi.string()).allow(null).optional(),
  internationalTransfers: Joi.boolean().optional(),
  transferCountries: Joi.array().items(Joi.string()).allow(null).optional(),
  transferSafeguards: Joi.string().max(5000).allow('', null).optional(),
  retentionPeriod: Joi.string().max(500).allow('', null).optional(),
  retentionJustification: Joi.string().max(5000).allow('', null).optional(),
  technicalMeasures: Joi.array().items(Joi.string()).allow(null).optional(),
  organizationalMeasures: Joi.array().items(Joi.string()).allow(null).optional(),
  automatedDecisionMaking: Joi.boolean().optional(),
  automatedDecisionDetails: Joi.string().max(5000).allow('', null).optional(),
  dpiaRequired: Joi.boolean().optional(),
  dpiaReference: Joi.string().max(500).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);
