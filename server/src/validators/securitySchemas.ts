/**
 * Joi validation schemas for security routes.
 * Covers: Zero Trust, ZKP, BYOK, Compliance-as-Code.
 */
import Joi from 'joi';

// ============================================================================
// ZERO TRUST
// ============================================================================

export const verifyDeviceTrustSchema = Joi.object({
  deviceId: Joi.string().required().min(1).max(200).trim(),
  deviceType: Joi.string().max(100).allow('', null).optional(),
  osVersion: Joi.string().max(100).allow('', null).optional(),
  agentVersion: Joi.string().max(100).allow('', null).optional(),
  securityPosture: Joi.object().allow(null).optional(),
  ipAddress: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const evaluateAccessRequestSchema = Joi.object({
  userId: Joi.string().max(200).allow('', null).optional(),
  resource: Joi.string().required().min(1).max(500).trim(),
  action: Joi.string().required().min(1).max(100).trim(),
  context: Joi.object().allow(null).optional(),
  deviceId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

export const createZeroTrustPolicySchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  rules: Joi.array().items(Joi.object()).allow(null).optional(),
  conditions: Joi.object().allow(null).optional(),
  enforcement: Joi.string().valid('ENFORCE', 'AUDIT', 'DISABLED').optional(),
  priority: Joi.number().integer().min(0).max(10000).optional(),
}).unknown(false);

export const updateZeroTrustPolicySchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  rules: Joi.array().items(Joi.object()).allow(null).optional(),
  conditions: Joi.object().allow(null).optional(),
  enforcement: Joi.string().valid('ENFORCE', 'AUDIT', 'DISABLED').optional(),
  priority: Joi.number().integer().min(0).max(10000).optional(),
}).min(1).unknown(false);

export const createNetworkSegmentSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  cidr: Joi.string().max(100).allow('', null).optional(),
  accessLevel: Joi.string().max(100).allow('', null).optional(),
  policies: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const continuousVerificationSchema = Joi.object({
  sessionId: Joi.string().max(200).allow('', null).optional(),
  deviceId: Joi.string().max(200).allow('', null).optional(),
  context: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// ZERO-KNOWLEDGE PROOFS
// ============================================================================

export const generateComplianceProofSchema = Joi.object({
  frameworkId: Joi.string().required().min(1).max(200),
  claims: Joi.array().items(Joi.object()).allow(null).optional(),
  controlIds: Joi.array().items(Joi.string()).allow(null).optional(),
}).unknown(false);

export const verifyComplianceProofSchema = Joi.object({
  proof: Joi.string().required().min(1).max(50000),
  publicInputs: Joi.object().allow(null).optional(),
}).unknown(false);

export const generateCredentialProofSchema = Joi.object({
  credentialType: Joi.string().required().min(1).max(200),
  attributes: Joi.object().allow(null).optional(),
}).unknown(false);

export const verifyCredentialProofSchema = Joi.object({
  proof: Joi.string().required().min(1).max(50000),
  publicInputs: Joi.object().allow(null).optional(),
}).unknown(false);

export const generateOwnershipProofSchema = Joi.object({
  resourceType: Joi.string().required().min(1).max(200),
  resourceId: Joi.string().required().min(1).max(200),
}).unknown(false);

export const verifyOwnershipProofSchema = Joi.object({
  proof: Joi.string().required().min(1).max(50000),
  publicInputs: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// BYOK (Bring Your Own Key)
// ============================================================================

export const generateBYOKKeySchema = Joi.object({
  keyType: Joi.string().valid('AES-256', 'RSA-2048', 'RSA-4096', 'EC-P256', 'EC-P384').required(),
  label: Joi.string().required().min(1).max(300).trim(),
  expiresAt: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const importBYOKKeySchema = Joi.object({
  keyMaterial: Joi.string().required().min(1).max(50000),
  keyType: Joi.string().valid('AES-256', 'RSA-2048', 'RSA-4096', 'EC-P256', 'EC-P384').required(),
  label: Joi.string().required().min(1).max(300).trim(),
  format: Joi.string().valid('raw', 'pkcs8', 'jwk').optional(),
  expiresAt: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const encryptWithBYOKSchema = Joi.object({
  keyId: Joi.string().required().min(1).max(200),
  plaintext: Joi.string().required().min(1).max(100000),
  algorithm: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const decryptWithBYOKSchema = Joi.object({
  keyId: Joi.string().required().min(1).max(200),
  ciphertext: Joi.string().required().min(1).max(200000),
  algorithm: Joi.string().max(100).allow('', null).optional(),
}).unknown(false);

export const updateBYOKConfigSchema = Joi.object({
  defaultKeyId: Joi.string().max(200).allow('', null).optional(),
  autoRotation: Joi.boolean().optional(),
  rotationInterval: Joi.number().integer().min(1).max(365).optional(),
}).unknown(false);

// ============================================================================
// COMPLIANCE-AS-CODE
// ============================================================================

export const createCompliancePolicySchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(5000).allow('', null).optional(),
  language: Joi.string().valid('rego', 'cue', 'json', 'yaml').optional(),
  code: Joi.string().required().min(1).max(100000),
  frameworks: Joi.array().items(Joi.string()).allow(null).optional(),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info').optional(),
}).unknown(false);

export const updateCompliancePolicySchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  language: Joi.string().valid('rego', 'cue', 'json', 'yaml').optional(),
  code: Joi.string().min(1).max(100000).optional(),
  frameworks: Joi.array().items(Joi.string()).allow(null).optional(),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info').optional(),
  isActive: Joi.boolean().optional(),
}).min(1).unknown(false);

export const evaluateCompliancePolicyBatchSchema = Joi.object({
  policyIds: Joi.array().items(Joi.string()).allow(null).optional(),
  target: Joi.object().allow(null).optional(),
}).unknown(false);

export const generateComplianceReportSchema = Joi.object({
  policyIds: Joi.array().items(Joi.string()).allow(null).optional(),
  format: Joi.string().valid('json', 'pdf', 'csv').optional(),
  includeDetails: Joi.boolean().optional(),
}).unknown(false);

export const handleCICDWebhookSchema = Joi.object({
  event: Joi.string().required().min(1).max(200),
  repository: Joi.string().max(500).allow('', null).optional(),
  branch: Joi.string().max(200).allow('', null).optional(),
  commitHash: Joi.string().max(200).allow('', null).optional(),
  payload: Joi.object().allow(null).optional(),
}).unknown(false);

export const createCICDIntegrationSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  provider: Joi.string().required().min(1).max(100).trim(),
  config: Joi.object().allow(null).optional(),
  // Constrain webhook URL to https scheme only; controller must still pass the
  // final (post-redirect) URL through isWebhookUrlSafe()/safeFetch() before any outbound call.
  webhookUrl: Joi.string().uri({ scheme: ['https'] }).max(2000).allow('', null).optional(),
}).unknown(false);

export const detectDriftSchema = Joi.object({
  policyIds: Joi.array().items(Joi.string()).allow(null).optional(),
  scope: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);
