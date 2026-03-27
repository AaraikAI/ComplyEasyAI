/**
 * Joi validation schemas for integration routes.
 * Covers: cloud credentials, API keys, OAuth tokens, provider connections.
 */
import Joi from 'joi';

// ============================================================================
// CLOUD PROVIDER CONNECTIONS
// ============================================================================

export const connectAWSSchema = Joi.object({
  accessKeyId: Joi.string().required().min(16).max(128).trim(),
  secretAccessKey: Joi.string().required().min(16).max(256).trim(),
  region: Joi.string().max(50).allow('', null).optional(),
  accountId: Joi.string().max(50).allow('', null).optional(),
  roleArn: Joi.string().max(500).allow('', null).optional(),
}).unknown(false);

export const connectAzureSchema = Joi.object({
  tenantId: Joi.string().required().min(1).max(200).trim(),
  clientId: Joi.string().required().min(1).max(200).trim(),
  clientSecret: Joi.string().required().min(1).max(500).trim(),
  subscriptionId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);

// ============================================================================
// GENERIC PROVIDER CONNECTION
// ============================================================================

export const connectProviderSchema = Joi.object({
  apiKey: Joi.string().max(2000).allow('', null).optional(),
  apiToken: Joi.string().max(2000).allow('', null).optional(),
  accessToken: Joi.string().max(2000).allow('', null).optional(),
  username: Joi.string().max(200).allow('', null).optional(),
  password: Joi.string().max(500).allow('', null).optional(),
  baseUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  instanceUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  projectKey: Joi.string().max(200).allow('', null).optional(),
  organization: Joi.string().max(200).allow('', null).optional(),
  config: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

export const syncProviderSchema = Joi.object({
  fullSync: Joi.boolean().optional(),
  resources: Joi.array().items(Joi.string().max(100)).allow(null).optional(),
  since: Joi.date().iso().allow(null).optional(),
}).unknown(false);

// ============================================================================
// SLACK MESSAGE
// ============================================================================

export const postSlackMessageSchema = Joi.object({
  channel: Joi.string().required().min(1).max(200).trim(),
  message: Joi.string().required().min(1).max(5000),
  blocks: Joi.array().items(Joi.object()).allow(null).optional(),
}).unknown(false);

// ============================================================================
// JIRA ISSUE
// ============================================================================

export const createJiraIssueSchema = Joi.object({
  summary: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(10000).allow('', null).optional(),
  issueType: Joi.string().max(100).allow('', null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
  projectKey: Joi.string().max(50).allow('', null).optional(),
  assignee: Joi.string().max(200).allow('', null).optional(),
  labels: Joi.array().items(Joi.string().max(100)).allow(null).optional(),
  customFields: Joi.object().allow(null).optional(),
}).unknown(false);

// ============================================================================
// EVIDENCE COLLECTION
// ============================================================================

export const collectEvidenceSchema = Joi.object({
  resources: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  frameworkId: Joi.string().max(200).allow('', null).optional(),
}).unknown(false);
