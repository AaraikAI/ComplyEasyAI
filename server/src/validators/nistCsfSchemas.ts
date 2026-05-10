import Joi from 'joi';

const PROFILE_TYPES = ['Current', 'Target'];
const PROFILE_STATUSES = ['Draft', 'Active', 'Archived'];
const RISK_TOLERANCES = ['Low', 'Moderate', 'High'];
const PRIORITIES = ['Low', 'Moderate', 'High', 'Critical'];
const IMPLEMENTATION_STATUSES = ['NotImplemented', 'PartiallyImplemented', 'Implemented', 'Optimized'];
const ACTION_STATUSES = ['Open', 'InProgress', 'Blocked', 'Completed', 'Cancelled'];
const FUNCTIONS = ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
const TIERS = [1, 2, 3, 4];

// ── Profile ──────────────────────────────────────────────────────────────

export const createProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  profileType: Joi.string().valid(...PROFILE_TYPES).required(),
  profileYear: Joi.number().integer().min(2020).max(2100).required(),
  businessContext: Joi.object().unknown(true).optional(),
  missionObjectives: Joi.string().trim().max(4000).optional(),
  riskTolerance: Joi.string().valid(...RISK_TOLERANCES).optional(),
  regulatoryDrivers: Joi.array().items(Joi.string().trim().max(60)).optional(),
  targetCompletionDate: Joi.date().iso().optional(),
  status: Joi.string().valid(...PROFILE_STATUSES).optional(),
  ownerId: Joi.string().trim().optional(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  profileYear: Joi.number().integer().min(2020).max(2100).optional(),
  businessContext: Joi.object().unknown(true).optional(),
  missionObjectives: Joi.string().trim().max(4000).optional(),
  riskTolerance: Joi.string().valid(...RISK_TOLERANCES).optional(),
  regulatoryDrivers: Joi.array().items(Joi.string().trim().max(60)).optional(),
  targetCompletionDate: Joi.date().iso().optional(),
  status: Joi.string().valid(...PROFILE_STATUSES).optional(),
  ownerId: Joi.string().trim().optional(),
}).min(1);

export const profilesQuerySchema = Joi.object({
  profileType: Joi.string().valid(...PROFILE_TYPES).optional(),
  status: Joi.string().valid(...PROFILE_STATUSES).optional(),
  profileYear: Joi.number().integer().min(2020).max(2100).optional(),
});

export const scoreFunctionSchema = Joi.object({
  function: Joi.string().valid(...FUNCTIONS).required(),
});

// ── Subcategory assessment ───────────────────────────────────────────────

export const upsertAssessmentSchema = Joi.object({
  profileId: Joi.string().trim().required(),
  function: Joi.string().valid(...FUNCTIONS).required(),
  category: Joi.string().trim().min(1).max(20).required(),
  subcategoryRef: Joi.string().trim().min(1).max(30).required(),
  subcategoryTitle: Joi.string().trim().min(1).max(500).required(),
  currentTier: Joi.number().integer().valid(...TIERS).optional(),
  targetTier: Joi.number().integer().valid(...TIERS).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  implementationStatus: Joi.string().valid(...IMPLEMENTATION_STATUSES).optional(),
  informativeReferences: Joi.object().unknown(true).optional(),
  evidenceRefs: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().trim().max(4000).optional(),
});

export const assessmentsQuerySchema = Joi.object({
  profileId: Joi.string().trim().required(),
  function: Joi.string().valid(...FUNCTIONS).optional(),
  category: Joi.string().trim().max(20).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  implementationStatus: Joi.string().valid(...IMPLEMENTATION_STATUSES).optional(),
});

// ── Gap analysis ─────────────────────────────────────────────────────────

export const generateGapAnalysisSchema = Joi.object({
  currentProfileId: Joi.string().trim().required(),
  targetProfileId: Joi.string().trim().required(),
});

export const gapAnalysesQuerySchema = Joi.object({
  profileId: Joi.string().trim().optional(),
  currentProfileId: Joi.string().trim().optional(),
  targetProfileId: Joi.string().trim().optional(),
  function: Joi.alternatives().try(
    Joi.string().valid(...FUNCTIONS),
    Joi.string().valid('Total')
  ).optional(),
});

// ── Action items ─────────────────────────────────────────────────────────

export const createActionItemSchema = Joi.object({
  profileId: Joi.string().trim().required(),
  subcategoryAssessmentId: Joi.string().trim().optional(),
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().trim().max(4000).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  assignedTo: Joi.string().trim().max(120).optional(),
  status: Joi.string().valid(...ACTION_STATUSES).optional(),
  dueDate: Joi.date().iso().optional(),
  dependencies: Joi.array().items(Joi.string().trim()).optional(),
  estimatedEffort: Joi.string().trim().max(60).optional(),
  estimatedCost: Joi.number().min(0).optional(),
});

export const updateActionItemSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).optional(),
  description: Joi.string().trim().max(4000).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  assignedTo: Joi.string().trim().max(120).optional(),
  status: Joi.string().valid(...ACTION_STATUSES).optional(),
  dueDate: Joi.date().iso().optional(),
  dependencies: Joi.array().items(Joi.string().trim()).optional(),
  estimatedEffort: Joi.string().trim().max(60).optional(),
  estimatedCost: Joi.number().min(0).optional(),
}).min(1);

export const actionItemsQuerySchema = Joi.object({
  profileId: Joi.string().trim().optional(),
  status: Joi.string().valid(...ACTION_STATUSES).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  assignedTo: Joi.string().trim().max(120).optional(),
});
