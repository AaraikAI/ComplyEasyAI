/**
 * Joi validation schemas for ACOS (Autonomous Compliance Operating System) routes.
 * General-purpose schemas per resource type to cover ~100 POST/PATCH endpoints.
 */
import Joi from 'joi';

// ============================================================================
// GOALS
// ============================================================================

export const createGoalSchema = Joi.object({
  name: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  targetDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  metrics: Joi.object().allow(null).optional(),
}).unknown(false);

export const updateGoalSchema = Joi.object({
  name: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  targetDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  metrics: Joi.object().allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// CONTROL LOOPS
// ============================================================================

export const createControlLoopSchema = Joi.object({
  name: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  schedule: Joi.object().allow(null).optional(),
  actions: Joi.array().items(Joi.object()).allow(null).optional(),
  conditions: Joi.object().allow(null).optional(),
}).unknown(false);

export const updateControlLoopSchema = Joi.object({
  name: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  schedule: Joi.object().allow(null).optional(),
  actions: Joi.array().items(Joi.object()).allow(null).optional(),
  conditions: Joi.object().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// AGENTIC ACTIONS
// ============================================================================

export const estimateBlastRadiusSchema = Joi.object({
  action: Joi.string().required().min(1).max(500),
  targetId: Joi.string().max(200).allow('', null).optional(),
  parameters: Joi.object().allow(null).optional(),
}).unknown(false);

export const executeActionSchema = Joi.object({
  action: Joi.string().required().min(1).max(500),
  targetId: Joi.string().max(200).allow('', null).optional(),
  parameters: Joi.object().allow(null).optional(),
  dryRun: Joi.boolean().optional(),
}).unknown(false);

export const rollbackMultipleSchema = Joi.object({
  actionIds: Joi.array().items(Joi.string().max(200)).min(1).required(),
}).unknown(false);

// ============================================================================
// EVIDENCE TRUTH
// ============================================================================

export const chainOfCustodySchema = Joi.object({
  evidenceId: Joi.string().required().min(1).max(200),
  action: Joi.string().required().min(1).max(300),
  details: Joi.object().allow(null).optional(),
}).unknown(false);

export const bulkAnalyzeEvidenceSchema = Joi.object({
  evidenceIds: Joi.array().items(Joi.string().max(200)).min(1).required(),
}).unknown(false);

export const evidenceIdParamSchema = Joi.object({
  evidenceId: Joi.string().required().min(1).max(200),
}).unknown(false);

export const analyzeAndAnchorSchema = Joi.object({
  network: Joi.string().valid('ethereum', 'polygon', 'hyperledger').default('polygon'),
  skipBlockchain: Joi.boolean().default(false),
  controlId: Joi.string().max(200).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const verifyFileHashSchema = Joi.object({
  storedHash: Joi.string().hex().length(64).required(),
}).unknown(false);

export const verifyEvidenceSignatureSchema = Joi.object({
  signature: Joi.string().required().max(2000),
  publicKey: Joi.string().required().max(8000),
}).unknown(false);

export const multiPartyAttestationSchema = Joi.object({
  evidenceId: Joi.string().min(1).max(200).optional(),
  parties: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().required().min(1).max(200),
        role: Joi.string().required().min(1).max(100),
      }).unknown(false)
    )
    .min(2)
    .max(20)
    .required(),
}).unknown(false);

// ============================================================================
// REGULATORY INTELLIGENCE (RIF)
// ============================================================================

export const detectRegulatoryChangesSchema = Joi.object({
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  source: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

export const autoUpdateControlsSchema = Joi.object({
  dryRun: Joi.boolean().optional(),
  scope: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const addFeedSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  url: Joi.string().uri().required().max(2000),
  type: Joi.string().max(100).allow('', null).optional(),
  schedule: Joi.object().allow(null).optional(),
}).unknown(false);

export const resolveConflictSchema = Joi.object({
  resolution: Joi.string().required().min(1).max(5000),
  strategy: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const batchAutoUpdateSchema = Joi.object({
  regulatoryChangeIds: Joi.array().items(Joi.string().max(200)).min(1).required(),
  dryRun: Joi.boolean().optional(),
}).unknown(false);

export const bulkConflictAnalysisSchema = Joi.object({
  conflictIds: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  scope: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const rollbackAutoUpdateSchema = Joi.object({
  updateId: Joi.string().max(200).allow('', null).optional(),
  scope: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// DIGITAL TWIN
// ============================================================================

export const runSimulationSchema = Joi.object({
  scenario: Joi.string().max(500).allow('', null).optional(),
  parameters: Joi.object().allow(null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const runSimulationWithConstraintsSchema = Joi.object({
  scenario: Joi.string().max(500).allow('', null).optional(),
  parameters: Joi.object().allow(null).optional(),
  constraints: Joi.object().allow(null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const compareScenariosSchema = Joi.object({
  scenarioIds: Joi.array().items(Joi.string().max(200)).min(2).required(),
}).unknown(false);

export const runMonteCarloSchema = Joi.object({
  iterations: Joi.number().integer().min(1).max(100000).optional(),
  parameters: Joi.object().allow(null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// RED TEAM
// ============================================================================

export const runRedTeamSimulationSchema = Joi.object({
  targetFramework: Joi.string().max(200).allow('', null).optional(),
  attackVectors: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  parameters: Joi.object().allow(null).optional(),
}).unknown(false);

export const runAutomatedScanSchema = Joi.object({
  scope: Joi.string().max(500).allow('', null).optional(),
  scanType: Joi.string().max(100).allow('', null).optional(),
  parameters: Joi.object().allow(null).optional(),
}).unknown(false);

export const scheduleScanSchema = Joi.object({
  schedule: Joi.object().required(),
  scope: Joi.string().max(500).allow('', null).optional(),
  scanType: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const exportScanResultsSchema = Joi.object({
  scanId: Joi.string().max(200).allow('', null).optional(),
  format: Joi.string().valid('PDF', 'CSV', 'JSON').optional(),
}).unknown(false);

export const compareScanResultsSchema = Joi.object({
  scanIds: Joi.array().items(Joi.string().max(200)).min(2).required(),
}).unknown(false);

export const markFalsePositiveSchema = Joi.object({
  findingId: Joi.string().required().min(1).max(200),
  reason: Joi.string().max(2000).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// FEDERATED SWARM
// ============================================================================

export const joinFederationSchema = Joi.object({
  federationId: Joi.string().max(200).allow('', null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const contributeToFederationSchema = Joi.object({
  data: Joi.object().allow(null).optional(),
  modelUpdate: Joi.object().allow(null).optional(),
}).unknown(false);

export const participateInSwarmSchema = Joi.object({
  swarmId: Joi.string().max(200).allow('', null).optional(),
  contribution: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// VR TRAINING
// ============================================================================

export const createVRSessionSchema = Joi.object({
  name: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  settings: Joi.object().allow(null).optional(),
  maxParticipants: Joi.number().integer().min(1).max(100).optional(),
}).unknown(false);

export const vrAnnotationSchema = Joi.object({
  content: Joi.string().required().min(1).max(5000),
  position: Joi.object().allow(null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const vrChatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(2000),
  type: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const vrEnvironmentUpdateSchema = Joi.object({
  settings: Joi.object().allow(null).optional(),
}).unknown(false);

export const vrEnvironmentThemeSchema = Joi.object({
  theme: Joi.string().required().min(1).max(100),
}).unknown(false);

export const createVRTrainingScenarioSchema = Joi.object({
  name: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  steps: Joi.array().items(Joi.object()).allow(null).optional(),
  settings: Joi.object().allow(null).optional(),
}).unknown(false);

export const vrTrainingProgressSchema = Joi.object({
  stepId: Joi.string().max(200).allow('', null).optional(),
  progress: Joi.number().min(0).max(100).optional(),
  answers: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// JIT COMPLIANCE
// ============================================================================

export const requestJITAccessSchema = Joi.object({
  resource: Joi.string().required().min(1).max(500),
  reason: Joi.string().required().min(1).max(2000),
  duration: Joi.number().integer().min(1).max(86400).optional(),
  scope: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// SWARM TASKS
// ============================================================================

export const registerSwarmAgentSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  capabilities: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const updateSwarmAgentStatusSchema = Joi.object({
  status: Joi.string().required().min(1).max(50),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const submitSwarmTaskSchema = Joi.object({
  type: Joi.string().required().min(1).max(200),
  description: Joi.string().max(5000).allow('', null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
  parameters: Joi.object().allow(null).optional(),
}).unknown(false);

export const bulkSubmitSwarmTasksSchema = Joi.object({
  tasks: Joi.array().items(Joi.object({
    type: Joi.string().required().min(1).max(200),
    description: Joi.string().max(5000).allow('', null).optional(),
    priority: Joi.string().max(50).allow('', null).optional(),
    parameters: Joi.object().allow(null).optional(),
  })).min(1).required(),
}).unknown(false);

export const swarmTaskProgressSchema = Joi.object({
  progress: Joi.number().min(0).max(100).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  result: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// COMPLIANCE DEBT
// ============================================================================

export const trackComplianceDebtSchema = Joi.object({
  controlId: Joi.string().max(200).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
  description: Joi.string().required().min(1).max(5000),
  severity: Joi.string().max(50).allow('', null).optional(),
  estimatedEffort: Joi.number().min(0).allow(null).optional(),
}).unknown(false);

export const calculateDebtFromGapSchema = Joi.object({
  frameworkId: Joi.string().required().min(1).max(200),
}).unknown(false);

export const resolveComplianceDebtSchema = Joi.object({
  resolution: Joi.string().max(5000).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// CHANGE IMPACTS
// ============================================================================

export const forecastChangeImpactSchema = Joi.object({
  changeDescription: Joi.string().required().min(1).max(5000),
  scope: Joi.string().max(500).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const resolveChangeImpactSchema = Joi.object({
  resolution: Joi.string().max(5000).allow('', null).optional(),
  notes: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// NEURO-SYMBOLIC
// ============================================================================

export const hybridReasoningSchema = Joi.object({
  query: Joi.string().required().min(1).max(5000),
  context: Joi.object().allow(null).optional(),
  parameters: Joi.object().allow(null).optional(),
}).unknown(false);

export const inferRulesSchema = Joi.object({
  patterns: Joi.array().items(Joi.object()).allow(null).optional(),
  domain: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const causalReasoningSchema = Joi.object({
  hypothesis: Joi.string().required().min(1).max(5000),
  evidence: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

export const explainableDecisionSchema = Joi.object({
  decision: Joi.string().required().min(1).max(5000),
  context: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// HOMOMORPHIC ENCRYPTION
// ============================================================================

export const generateHomomorphicKeysSchema = Joi.object({
  keySize: Joi.number().integer().min(1024).max(8192).optional(),
  parameters: Joi.object().allow(null).optional(),
}).unknown(false);

export const encryptDataSchema = Joi.object({
  data: Joi.alternatives().try(Joi.array(), Joi.object(), Joi.number()).required(),
  keyId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const decryptDataSchema = Joi.object({
  encryptedData: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  keyId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const encryptedComputationSchema = Joi.object({
  encryptedData: Joi.alternatives().try(Joi.array(), Joi.object()).allow(null).optional(),
  parameters: Joi.object().allow(null).optional(),
  keyId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// PHYSICAL AI / IoT
// ============================================================================

export const registerDeviceSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  type: Joi.string().required().min(1).max(100),
  location: Joi.string().max(500).allow('', null).optional(),
  metadata: Joi.object().allow(null).optional(),
}).unknown(false);

export const bulkRegisterDevicesSchema = Joi.object({
  devices: Joi.array().items(Joi.object({
    name: Joi.string().required().min(1).max(300).trim(),
    type: Joi.string().required().min(1).max(100),
    location: Joi.string().max(500).allow('', null).optional(),
    metadata: Joi.object().allow(null).optional(),
  })).min(1).required(),
}).unknown(false);

// ============================================================================
// REGULATORY FEED MONITORING
// ============================================================================

export const monitorRegulatoryFeedsSchema = Joi.object({
  feedIds: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  force: Joi.boolean().optional(),
}).unknown(false);

// ============================================================================
// GENERIC BODY SCHEMA (for endpoints that accept no specific body or minimal params)
// ============================================================================

export const emptyBodySchema = Joi.object({}).unknown(false);

export const idOnlyBodySchema = Joi.object({
  id: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);
