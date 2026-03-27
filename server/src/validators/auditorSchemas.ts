/**
 * Joi validation schemas for auditor collaboration hub routes.
 * Covers: profiles, engagements, findings, workpapers, requests, matching.
 */
import Joi from 'joi';

// ============================================================================
// AUDITOR PROFILES
// ============================================================================

export const createAuditorProfileSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  email: Joi.string().email().max(300).allow('', null).optional(),
  firm: Joi.string().max(300).allow('', null).optional(),
  certifications: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  specializations: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  experience: Joi.number().integer().min(0).max(100).allow(null).optional(),
  bio: Joi.string().max(5000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateAuditorProfileSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  email: Joi.string().email().max(300).allow('', null).optional(),
  firm: Joi.string().max(300).allow('', null).optional(),
  certifications: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  specializations: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  experience: Joi.number().integer().min(0).max(100).allow(null).optional(),
  bio: Joi.string().max(5000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// ENGAGEMENTS
// ============================================================================

export const createEngagementSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(10000).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  framework: Joi.string().max(200).allow('', null).optional(),
  auditorProfileId: Joi.string().max(200).allow('', null).optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  endDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  scope: Joi.string().max(5000).allow('', null).optional(),
}).unknown(false);

export const updateEngagementSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(10000).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  framework: Joi.string().max(200).allow('', null).optional(),
  auditorProfileId: Joi.string().max(200).allow('', null).optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  endDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  scope: Joi.string().max(5000).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// FINDINGS
// ============================================================================

const findingSeverities = ['Critical', 'High', 'Medium', 'Low', 'Info'] as const;

export const createFindingSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(10000).allow('', null).optional(),
  severity: Joi.string().valid(...findingSeverities).optional(),
  engagementId: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  recommendation: Joi.string().max(10000).allow('', null).optional(),
  evidence: Joi.string().max(10000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).unknown(false);

export const updateFindingSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(10000).allow('', null).optional(),
  severity: Joi.string().valid(...findingSeverities).optional(),
  engagementId: Joi.string().max(200).allow('', null).optional(),
  controlId: Joi.string().max(200).allow('', null).optional(),
  recommendation: Joi.string().max(10000).allow('', null).optional(),
  evidence: Joi.string().max(10000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

// ============================================================================
// WORKPAPERS
// ============================================================================

export const createWorkpaperSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(10000).allow('', null).optional(),
  engagementId: Joi.string().max(200).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  content: Joi.string().max(50000).allow('', null).optional(),
  fileUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateWorkpaperSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(10000).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  content: Joi.string().max(50000).allow('', null).optional(),
  fileUrl: Joi.string().uri().max(2000).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// REQUESTS
// ============================================================================

export const createRequestSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().max(10000).allow('', null).optional(),
  engagementId: Joi.string().max(200).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).unknown(false);

export const updateRequestSchema = Joi.object({
  title: Joi.string().min(1).max(500).trim().optional(),
  description: Joi.string().max(10000).allow('', null).optional(),
  type: Joi.string().max(100).allow('', null).optional(),
  priority: Joi.string().max(50).allow('', null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  assignedTo: Joi.string().max(200).allow('', null).optional(),
  status: Joi.string().max(50).allow('', null).optional(),
}).min(1).unknown(false);

// ============================================================================
// MATCHING
// ============================================================================

export const matchAuditorsSchema = Joi.object({
  framework: Joi.string().max(200).allow('', null).optional(),
  specializations: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  certifications: Joi.array().items(Joi.string().max(200)).allow(null).optional(),
  minExperience: Joi.number().integer().min(0).max(100).allow(null).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
}).unknown(false);
