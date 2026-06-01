/**
 * Joi request-body validation schemas for feature modules routes.
 * Used by validateBody middleware to reject invalid input before hitting services.
 */
import Joi from 'joi';

// ============================================================================
// GOVERNANCE MANAGER
// ============================================================================

const governanceBodyTypes = ['Board', 'Committee', 'Council', 'Steering Committee', 'Working Group', 'Task Force'] as const;
const meetingFrequencies = ['Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc'] as const;
const meetingStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
const decisionTypes = ['Policy', 'Process', 'Budget', 'Strategic', 'Operational', 'Technical', 'Compliance'] as const;
const decisionStatuses = ['proposed', 'under_review', 'approved', 'rejected', 'implemented', 'superseded'] as const;

export const createGovernanceBodySchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  type: Joi.string().valid(...governanceBodyTypes).required(),
  charter: Joi.string().max(5000).allow('', null).optional(),
  meetingFrequency: Joi.string().valid(...meetingFrequencies).optional(),
  members: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const updateGovernanceBodySchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  type: Joi.string().valid(...governanceBodyTypes).optional(),
  charter: Joi.string().max(5000).allow('', null).optional(),
  meetingFrequency: Joi.string().valid(...meetingFrequencies).optional(),
  members: Joi.array().items(Joi.object()).allow(null).optional(),
  status: Joi.string().valid('active', 'inactive', 'dissolved').optional(),
}).min(1).unknown(false);

export const createMeetingSchema = Joi.object({
  governanceBodyId: Joi.string().uuid().required(),
  title: Joi.string().required().min(1).max(300).trim(),
  date: Joi.date().iso().required(),
  duration: Joi.number().min(1).max(480).optional(),
  agenda: Joi.array().items(Joi.string()).allow(null).optional(),
  attendees: Joi.array().items(Joi.object()).allow(null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  meetingUrl: Joi.string().uri().allow('', null).optional(),
}).unknown(false);

export const updateMeetingSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  date: Joi.date().iso().optional(),
  duration: Joi.number().min(1).max(480).optional(),
  agenda: Joi.array().items(Joi.string()).allow(null).optional(),
  attendees: Joi.array().items(Joi.object()).allow(null).optional(),
  minutes: Joi.string().max(10000).allow('', null).optional(),
  status: Joi.string().valid(...meetingStatuses).optional(),
}).min(1).unknown(false);

export const createDecisionSchema = Joi.object({
  governanceBodyId: Joi.string().uuid().required(),
  title: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  decisionType: Joi.string().valid(...decisionTypes).required(),
  impact: Joi.string().max(2000).allow('', null).optional(),
  stakeholders: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const updateDecisionSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  status: Joi.string().valid(...decisionStatuses).optional(),
  effectiveDate: Joi.date().iso().allow(null).optional(),
  reviewDate: Joi.date().iso().allow(null).optional(),
  implementation: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

export const createEscalationPathSchema = Joi.object({
  governanceBodyId: Joi.string().uuid().required(),
  name: Joi.string().required().min(1).max(200).trim(),
  triggerCriteria: Joi.array().items(Joi.object()).allow(null).optional(),
  levels: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const upsertDPOProfileSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(50).allow('', null).optional(),
  certifications: Joi.array().items(Joi.string()).allow(null).optional(),
  appointmentDate: Joi.date().iso().allow(null).optional(),
  registeredWithDPA: Joi.boolean().optional(),
  dpaRegistrationRef: Joi.string().max(100).allow('', null).optional(),
  tasks: Joi.array().items(Joi.object()).allow(null).optional(),
  activityLog: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

// ============================================================================
// BREACH NOTIFICATION
// ============================================================================

const breachTypes = ['Confidentiality', 'Integrity', 'Availability', 'Unauthorized Access', 'Data Loss', 'Ransomware', 'Phishing', 'Other'] as const;
const breachSeverities = ['Critical', 'High', 'Medium', 'Low'] as const;
const breachStatuses = ['detected', 'investigating', 'contained', 'remediated', 'closed'] as const;
const recipientTypes = ['DPA', 'Data Subjects', 'Supervisory Authority', 'Other'] as const;
const notificationStatuses = ['draft', 'pending', 'sent', 'acknowledged'] as const;

export const createBreachIncidentSchema = Joi.object({
  title: Joi.string().required().min(1).max(300).trim(),
  breachType: Joi.string().valid(...breachTypes).required(),
  severity: Joi.string().valid(...breachSeverities).required(),
  discoveryDate: Joi.date().iso().required(),
  description: Joi.string().max(5000).allow('', null).optional(),
  discoveryMethod: Joi.string().max(200).allow('', null).optional(),
  affectedRecords: Joi.number().min(0).allow(null).optional(),
  affectedDataTypes: Joi.array().items(Joi.string()).allow(null).optional(),
  affectedJurisdictions: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const updateBreachIncidentSchema = Joi.object({
  title: Joi.string().min(1).max(300).trim().optional(),
  breachType: Joi.string().valid(...breachTypes).optional(),
  severity: Joi.string().valid(...breachSeverities).optional(),
  status: Joi.string().valid(...breachStatuses).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  affectedRecords: Joi.number().min(0).allow(null).optional(),
  rootCause: Joi.string().max(2000).allow('', null).optional(),
  remediation: Joi.string().max(2000).allow('', null).optional(),
}).min(1).unknown(false);

export const createBreachNotificationSchema = Joi.object({
  breachId: Joi.string().uuid().required(),
  recipientType: Joi.string().valid(...recipientTypes).required(),
  jurisdiction: Joi.string().max(100).allow('', null).optional(),
  authority: Joi.string().max(200).allow('', null).optional(),
  content: Joi.string().max(10000).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const createBreachTemplateSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  jurisdiction: Joi.string().required().min(1).max(100).trim(),
  recipientType: Joi.string().valid(...recipientTypes).required(),
  subject: Joi.string().max(300).allow('', null).optional(),
  body: Joi.string().required().min(1).max(20000),
  variables: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const createRegulatoryContactSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  authority: Joi.string().required().min(1).max(200).trim(),
  jurisdiction: Joi.string().required().min(1).max(100).trim(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().max(50).allow('', null).optional(),
  address: Joi.string().max(500).allow('', null).optional(),
  website: Joi.string().uri().allow('', null).optional(),
  notificationDeadline: Joi.number().min(0).allow(null).optional(),
}).unknown(false);

// ============================================================================
// CE MARKING WORKFLOW
// ============================================================================

const ceProductCategories = ['Machinery', 'Electrical', 'Medical Devices', 'Toys', 'PPE', 'Construction', 'Radio', 'Other'] as const;
const ceStatuses = ['draft', 'assessment', 'testing', 'documentation', 'marked', 'expired'] as const;

export const createCEProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  category: Joi.string().valid(...ceProductCategories).required(),
  productCode: Joi.string().max(100).allow('', null).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  applicableDirectives: Joi.array().items(Joi.string()).allow(null).optional(),
  harmonizedStandards: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const updateCEProductSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  category: Joi.string().valid(...ceProductCategories).optional(),
  status: Joi.string().valid(...ceStatuses).optional(),
  ceMarkedDate: Joi.date().iso().allow(null).optional(),
  expiryDate: Joi.date().iso().allow(null).optional(),
  notifiedBody: Joi.string().max(200).allow('', null).optional(),
  technicalFile: Joi.object().allow(null).optional(),
  declaration: Joi.object().allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// DIGITAL PRODUCT PASSPORT
// ============================================================================

export const createDPPSchema = Joi.object({
  productName: Joi.string().required().min(1).max(300).trim(),
  productId: Joi.string().max(100).allow('', null).optional(),
  manufacturer: Joi.string().max(200).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  materials: Joi.array().items(Joi.object()).allow(null).optional(),
  manufacturingDate: Joi.date().iso().allow(null).optional(),
  countryOfOrigin: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const updateDPPSchema = Joi.object({
  productName: Joi.string().min(1).max(300).trim().optional(),
  productId: Joi.string().max(100).allow('', null).optional(),
  manufacturer: Joi.string().max(200).allow('', null).optional(),
  materials: Joi.array().items(Joi.object()).allow(null).optional(),
  carbonFootprint: Joi.number().min(0).allow(null).optional(),
  recyclability: Joi.number().min(0).max(100).allow(null).optional(),
  repairabilityScore: Joi.number().min(0).max(100).allow(null).optional(),
  supplyChain: Joi.array().items(Joi.object()).allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// ESG REPORTING
// ============================================================================

const esgCategories = ['Environmental', 'Social', 'Governance'] as const;

export const createESGMetricSchema = Joi.object({
  category: Joi.string().valid(...esgCategories).required(),
  subcategory: Joi.string().required().min(1).max(100).trim(),
  name: Joi.string().required().min(1).max(200).trim(),
  value: Joi.number().required(),
  unit: Joi.string().required().min(1).max(50).trim(),
  reportingPeriod: Joi.string().max(50).allow('', null).optional(),
  targetValue: Joi.number().allow(null).optional(),
  methodology: Joi.string().max(1000).allow('', null).optional(),
  dataSource: Joi.string().max(200).allow('', null).optional(),
  verified: Joi.boolean().optional(),
}).unknown(false);

export const updateESGMetricSchema = Joi.object({
  value: Joi.number().optional(),
  unit: Joi.string().min(1).max(50).trim().optional(),
  targetValue: Joi.number().allow(null).optional(),
  verified: Joi.boolean().optional(),
  methodology: Joi.string().max(1000).allow('', null).optional(),
}).min(1).unknown(false);

export const createMaterialityAssessmentSchema = Joi.object({
  topic: Joi.string().required().min(1).max(200).trim(),
  category: Joi.string().valid(...esgCategories).optional(),
  stakeholderImpact: Joi.number().min(0).max(100).allow(null).optional(),
  businessImpact: Joi.number().min(0).max(100).allow(null).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  sdgAlignment: Joi.array().items(Joi.number().min(1).max(17)).allow(null).optional(),
}).unknown(false);

// ============================================================================
// SBOM MANAGER
// ============================================================================

const licenseRisks = ['critical', 'high', 'medium', 'low', 'none'] as const;

export const createSBOMEntrySchema = Joi.object({
  componentName: Joi.string().required().min(1).max(200).trim(),
  componentVersion: Joi.string().required().min(1).max(50).trim(),
  repositoryName: Joi.string().max(200).allow('', null).optional(),
  license: Joi.string().max(100).allow('', null).optional(),
  licenseRisk: Joi.string().valid(...licenseRisks).optional(),
  supplier: Joi.string().max(200).allow('', null).optional(),
  purl: Joi.string().max(500).allow('', null).optional(),
  vulnerabilities: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const bulkCreateSBOMEntriesSchema = Joi.object({
  entries: Joi.array().items(Joi.object({
    componentName: Joi.string().required().min(1).max(200).trim(),
    componentVersion: Joi.string().required().min(1).max(50).trim(),
    repositoryName: Joi.string().max(200).allow('', null).optional(),
    license: Joi.string().max(100).allow('', null).optional(),
    licenseRisk: Joi.string().valid(...licenseRisks).optional(),
  })).required().min(1),
}).unknown(false);

export const createSBOMRepositorySchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  url: Joi.string().uri().allow('', null).optional(),
  branch: Joi.string().max(100).allow('', null).optional(),
  lastScan: Joi.date().iso().allow(null).optional(),
}).unknown(false);

// ============================================================================
// POST-MARKET SURVEILLANCE
// ============================================================================

const planTypes = ['Proactive', 'Reactive', 'Continuous', 'Periodic'] as const;
const frequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Continuous'] as const;
const incidentTypes = ['safety_incident', 'complaint', 'adverse_event', 'field_safety', 'trend_report'] as const;

export const createSurveillancePlanSchema = Joi.object({
  productName: Joi.string().required().min(1).max(300).trim(),
  planType: Joi.string().valid(...planTypes).required(),
  frequency: Joi.string().valid(...frequencies).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  monitoringSources: Joi.array().items(Joi.string()).allow(null).optional(),
  thresholds: Joi.object().allow(null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const createSurveillanceIncidentSchema = Joi.object({
  planId: Joi.string().uuid().required(),
  type: Joi.string().valid(...incidentTypes).required(),
  severity: Joi.string().valid(...breachSeverities).required(),
  title: Joi.string().required().min(1).max(300).trim(),
  reportedDate: Joi.date().iso().required(),
  description: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

const recallTypes = ['Voluntary', 'Mandatory', 'Field Safety Corrective Action'] as const;

export const createProductRecallSchema = Joi.object({
  productName: Joi.string().required().min(1).max(300).trim(),
  recallType: Joi.string().valid(...recallTypes).required(),
  reason: Joi.string().required().min(1).max(2000).trim(),
  affectedUnits: Joi.number().min(0).allow(null).optional(),
  notificationDate: Joi.date().iso().allow(null).optional(),
  correctiveAction: Joi.string().max(2000).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// PRODUCT DECOMMISSIONING
// ============================================================================

const lifecycleStages = ['active', 'end_of_sale', 'end_of_support', 'end_of_life', 'decommissioned'] as const;

export const createProductDecommissionSchema = Joi.object({
  productName: Joi.string().required().min(1).max(300).trim(),
  productVersion: Joi.string().max(50).allow('', null).optional(),
  lifecycleStage: Joi.string().valid(...lifecycleStages).optional(),
  endOfSaleDate: Joi.date().iso().allow(null).optional(),
  endOfSupportDate: Joi.date().iso().allow(null).optional(),
  endOfLifeDate: Joi.date().iso().allow(null).optional(),
  migrationPath: Joi.string().max(2000).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// ENVIRONMENTAL LIFECYCLE
// ============================================================================

const lifecyclePhases = ['Raw Materials', 'Manufacturing', 'Distribution', 'Use', 'End of Life'] as const;

export const createLifecycleAssessmentSchema = Joi.object({
  productName: Joi.string().required().min(1).max(300).trim(),
  methodology: Joi.string().max(200).allow('', null).optional(),
  scope: Joi.string().max(1000).allow('', null).optional(),
  phases: Joi.array().items(Joi.string().valid(...lifecyclePhases)).allow(null).optional(),
  functionalUnit: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const updateLifecycleAssessmentSchema = Joi.object({
  impactCategories: Joi.object().allow(null).optional(),
  totalCarbonFootprint: Joi.number().min(0).allow(null).optional(),
  waterUsage: Joi.number().min(0).allow(null).optional(),
  energyConsumption: Joi.number().min(0).allow(null).optional(),
  recommendations: Joi.array().items(Joi.string()).allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// PRODUCT LIFECYCLE TRACKER
// ============================================================================

const productStages = ['Concept', 'Development', 'Testing', 'Production', 'Active', 'Declining', 'End of Life'] as const;

export const createProductLifecycleSchema = Joi.object({
  productName: Joi.string().required().min(1).max(300).trim(),
  productCode: Joi.string().max(100).allow('', null).optional(),
  currentStage: Joi.string().valid(...productStages).optional(),
  marketEntry: Joi.date().iso().allow(null).optional(),
  targetMarkets: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const updateProductLifecycleSchema = Joi.object({
  currentStage: Joi.string().valid(...productStages).optional(),
  marketEntry: Joi.date().iso().allow(null).optional(),
  marketExit: Joi.date().iso().allow(null).optional(),
  regulatoryRequirements: Joi.array().items(Joi.object()).allow(null).optional(),
  certifications: Joi.array().items(Joi.object()).allow(null).optional(),
  // Document metadata array persisted to the ProductLifecycle.documents JSON field.
  // Raw file bytes are not stored here; each entry captures descriptive metadata only.
  documents: Joi.array().items(Joi.object()).allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// PRODUCT DECOMMISSION — CUSTOMER NOTIFICATIONS
// ============================================================================
//
// Notifications are persisted inside the ProductDecommission.customerNotifications
// JSON array (no dedicated table). The productId identifies the owning decommission
// record so the handler can scope the write to the caller's organization.

const decommissionNotificationChannels = ['email', 'in_app', 'portal', 'all'] as const;
const decommissionNotificationTypes = ['end_of_sale', 'end_of_support', 'end_of_life', 'migration_guide', 'final_notice'] as const;
const decommissionNotificationStatuses = ['draft', 'scheduled', 'sent', 'delivered'] as const;

export const createDecommissionNotificationSchema = Joi.object({
  productId: Joi.string().required().min(1).max(100),
  channel: Joi.string().valid(...decommissionNotificationChannels).required(),
  audience: Joi.string().max(500).allow('', null).optional(),
  type: Joi.string().valid(...decommissionNotificationTypes).allow(null).optional(),
  subject: Joi.string().max(500).allow('', null).optional(),
  scheduledDate: Joi.date().iso().allow('', null).optional(),
  template: Joi.string().max(20000).allow('', null).optional(),
  status: Joi.string().valid(...decommissionNotificationStatuses).optional(),
}).unknown(false);

export const updateDecommissionNotificationSchema = Joi.object({
  productId: Joi.string().required().min(1).max(100),
  channel: Joi.string().valid(...decommissionNotificationChannels).optional(),
  audience: Joi.string().max(500).allow('', null).optional(),
  type: Joi.string().valid(...decommissionNotificationTypes).allow(null).optional(),
  subject: Joi.string().max(500).allow('', null).optional(),
  scheduledDate: Joi.date().iso().allow('', null).optional(),
  sentDate: Joi.date().iso().allow('', null).optional(),
  recipientCount: Joi.number().integer().min(0).allow(null).optional(),
  template: Joi.string().max(20000).allow('', null).optional(),
  status: Joi.string().valid(...decommissionNotificationStatuses).optional(),
}).unknown(false);

// ============================================================================
// PROCESS MAPPER
// ============================================================================

export const createProcessMapSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  nodes: Joi.array().items(Joi.object()).required().min(1),
  edges: Joi.array().items(Joi.object()).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  version: Joi.string().max(20).allow('', null).optional(),
}).unknown(false);

export const updateProcessMapSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  nodes: Joi.array().items(Joi.object()).min(1).optional(),
  edges: Joi.array().items(Joi.object()).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  status: Joi.string().valid('draft', 'active', 'archived').optional(),
}).min(1).unknown(false);

// ============================================================================
// UPDATE SCHEMAS (for PATCH endpoints missing dedicated update schemas)
// ============================================================================

export const updateEscalationPathSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  triggerCriteria: Joi.array().items(Joi.object()).allow(null).optional(),
  levels: Joi.array().items(Joi.object()).allow(null).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
}).min(1).unknown(false);

export const updateBreachNotificationSchema = Joi.object({
  content: Joi.string().max(10000).allow('', null).optional(),
  status: Joi.string().valid(...notificationStatuses).optional(),
  sentDate: Joi.date().iso().allow(null).optional(),
  recipientAcknowledged: Joi.boolean().optional(),
}).min(1).unknown(false);

export const updateBreachTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  subject: Joi.string().max(300).allow('', null).optional(),
  body: Joi.string().min(1).max(20000).optional(),
  variables: Joi.array().items(Joi.string()).allow(null).optional(),
}).min(1).unknown(false);

export const updateRegulatoryContactSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  authority: Joi.string().min(1).max(200).trim().optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().max(50).allow('', null).optional(),
  address: Joi.string().max(500).allow('', null).optional(),
  website: Joi.string().uri().allow('', null).optional(),
  notificationDeadline: Joi.number().min(0).allow(null).optional(),
}).min(1).unknown(false);

export const updateSBOMEntrySchema = Joi.object({
  componentVersion: Joi.string().min(1).max(50).trim().optional(),
  license: Joi.string().max(100).allow('', null).optional(),
  licenseRisk: Joi.string().valid(...licenseRisks).optional(),
  supplier: Joi.string().max(200).allow('', null).optional(),
  vulnerabilities: Joi.array().items(Joi.object()).allow(null).optional(),
}).min(1).unknown(false);

export const updateSBOMRepositorySchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().optional(),
  url: Joi.string().uri().allow('', null).optional(),
  branch: Joi.string().max(100).allow('', null).optional(),
  lastScan: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

export const updateSurveillancePlanSchema = Joi.object({
  planType: Joi.string().valid(...planTypes).optional(),
  frequency: Joi.string().valid(...frequencies).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  monitoringSources: Joi.array().items(Joi.string()).allow(null).optional(),
  thresholds: Joi.object().allow(null).optional(),
  nextReviewDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

export const updateSurveillanceIncidentSchema = Joi.object({
  severity: Joi.string().valid(...breachSeverities).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  rootCause: Joi.string().max(2000).allow('', null).optional(),
  correctiveAction: Joi.string().max(2000).allow('', null).optional(),
}).min(1).unknown(false);

export const updateProductRecallSchema = Joi.object({
  status: Joi.string().max(50).allow('', null).optional(),
  correctiveAction: Joi.string().max(2000).allow('', null).optional(),
  completionDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

export const updateProductDecommissionSchema = Joi.object({
  lifecycleStage: Joi.string().valid(...lifecycleStages).optional(),
  endOfSaleDate: Joi.date().iso().allow(null).optional(),
  endOfSupportDate: Joi.date().iso().allow(null).optional(),
  endOfLifeDate: Joi.date().iso().allow(null).optional(),
  migrationPath: Joi.string().max(2000).allow('', null).optional(),
}).min(1).unknown(false);

export const updateMaterialityAssessmentSchema = Joi.object({
  stakeholderImpact: Joi.number().min(0).max(100).allow(null).optional(),
  businessImpact: Joi.number().min(0).max(100).allow(null).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  sdgAlignment: Joi.array().items(Joi.number().min(1).max(17)).allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// SYNC & CROSS-MODULE OPERATIONS
// ============================================================================

export const syncSBOMSchema = Joi.object({
  repositoryId: Joi.string().max(200).allow('', null).optional(),
  force: Joi.boolean().optional(),
}).unknown(false);

export const syncBreachSchema = Joi.object({
  incidentId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const upsertRegulationModuleDataSchema = Joi.object({
  data: Joi.object().required(),
}).unknown(true);

export const recordMetricSchema = Joi.object({
  module: Joi.string().required().min(1).max(200),
  metricName: Joi.string().required().min(1).max(200),
  value: Joi.number().required(),
  timestamp: Joi.date().iso().allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);
