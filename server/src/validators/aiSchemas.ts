import Joi from 'joi';

// ---------------------------------------------------------------------------
// Per-endpoint AI validation schemas
// ---------------------------------------------------------------------------

export const aiReportSchema = Joi.object({
  framework: Joi.string().required(),
  companyName: Joi.string().max(500).required(),
  context: Joi.string().max(10000).required(),
});

export const aiPolicySchema = Joi.object({
  type: Joi.string().required(),
  company: Joi.string().max(500).required(),
  tone: Joi.string().required(),
});

export const aiGapAnalysisSchema = Joi.object({
  current: Joi.string().max(10000).required(),
  target: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()),
  ).required(),
});

export const aiChatSchema = Joi.object({
  message: Joi.string().min(1).max(10000).required(),
  fileContext: Joi.string().max(50000).optional(),
});

export const aiContractSchema = Joi.object({
  text: Joi.string().min(1).max(100000).required(),
});

export const aiRfpSchema = Joi.object({
  question: Joi.string().min(1).max(10000).required(),
  context: Joi.string().max(10000).optional(),
});

export const aiPhishingSchema = Joi.object({
  type: Joi.string().optional(),
  theme: Joi.string().max(500).optional(),
  department: Joi.string().max(200).optional(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional(),
});

export const aiVendorScoreSchema = Joi.object({
  vendor: Joi.string().max(500).required(),
  service: Joi.string().max(500).required(),
  dataAccess: Joi.string().max(2000).required(),
});

export const aiDataMapSchema = Joi.object({
  process: Joi.string().min(1).max(10000).required(),
});

export const aiBcpSchema = Joi.object({
  scenario: Joi.string().min(1).max(10000).required(),
  rto: Joi.string().max(200).optional(),
  rpo: Joi.string().max(200).optional(),
});

export const aiCrossFrameworkSchema = Joi.object({
  sourceFramework: Joi.string().required(),
  targetFramework: Joi.string().required(),
  sourceControls: Joi.array().items(Joi.any()).optional(),
  targetControls: Joi.array().items(Joi.any()).optional(),
});

export const aiAutoRemediationSchema = Joi.object({
  framework: Joi.string().required(),
  gaps: Joi.array().items(Joi.any()).min(1).required(),
  organizationContext: Joi.string().max(10000).optional(),
});

export const aiEvidenceCompletenessSchema = Joi.object({
  framework: Joi.string().required(),
  controls: Joi.array().items(Joi.any()).min(1).required(),
});

export const aiAgenticVendorRiskSchema = Joi.object({
  vendor: Joi.object({
    name: Joi.string().required(),
  }).unknown(true).required(),
  assessmentScope: Joi.array().items(Joi.string()).optional(),
});

export const aiAuditSimulationSchema = Joi.object({
  framework: Joi.string().required(),
  controlDomain: Joi.string().required(),
  controlsToAudit: Joi.array().items(Joi.any()).optional(),
  previousAnswers: Joi.any().optional(),
});

export const aiNlQuerySchema = Joi.object({
  query: Joi.string().min(1).max(10000).required(),
  context: Joi.object().unknown(true).optional(),
});

export const aiCopilotSchema = Joi.object({
  message: Joi.string().min(1).max(10000).required(),
  conversationHistory: Joi.array().items(Joi.any()).optional(),
  context: Joi.object().unknown(true).optional(),
});

export const aiForecastSchema = Joi.object({
  currentScores: Joi.array().items(Joi.any()).min(1).required(),
  upcomingChanges: Joi.array().items(Joi.any()).optional(),
  historicalData: Joi.array().items(Joi.any()).optional(),
});

export const aiAnalyzeProcessSchema = Joi.object({
  processDescription: Joi.string().min(1).max(10000).required(),
  category: Joi.string().max(200).optional(),
  complianceFrameworks: Joi.array().items(Joi.string()).optional(),
});

// Legacy catch-all — kept for any future endpoints during development.
// Prefer creating a specific schema for each new endpoint.
export const aiPromptSchema = Joi.object({
  prompt: Joi.string().min(1).max(10000).optional(),
  context: Joi.any().optional(),
  frameworkId: Joi.string().optional(),
  message: Joi.string().max(10000).optional(),
  query: Joi.string().max(10000).optional(),
}).unknown(true);
