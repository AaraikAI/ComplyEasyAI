import Joi from 'joi';

const NPS_TRIGGERS = ['post_30d_active', 'post_onboarding', 'post_audit_complete', 'manual'];
const NPS_CATEGORIES = ['Detractor', 'Passive', 'Promoter'];

// ── Responses ────────────────────────────────────────────────────────────

export const createNpsResponseSchema = Joi.object({
  invitationId: Joi.string().uuid({ version: ['uuidv4'] }).optional(),
  score: Joi.number().integer().min(0).max(10).required(),
  comment: Joi.string().trim().max(2000).allow('', null).optional(),
  source: Joi.string().valid('in_app', 'email', 'api').optional(),
});

export const listResponsesQuerySchema = Joi.object({
  category: Joi.string().valid(...NPS_CATEGORIES).optional(),
  since: Joi.date().iso().optional(),
  until: Joi.date().iso().optional(),
  take: Joi.number().integer().min(1).max(200).optional(),
  skip: Joi.number().integer().min(0).optional(),
});

// ── Invitations ──────────────────────────────────────────────────────────

export const scheduleInvitationSchema = Joi.object({
  userId: Joi.string().uuid({ version: ['uuidv4'] }).required(),
  trigger: Joi.string().valid(...NPS_TRIGGERS).required(),
  scheduledFor: Joi.date().iso().optional(),
  ttlDays: Joi.number().integer().min(1).max(60).optional(),
  cooldownDays: Joi.number().integer().min(0).max(365).optional(),
});

export const snoozeInvitationSchema = Joi.object({
  untilDays: Joi.number().integer().min(1).max(90).required(),
});

// ── Stats ────────────────────────────────────────────────────────────────

export const statsQuerySchema = Joi.object({
  periodStart: Joi.date().iso().optional(),
  periodEnd: Joi.date().iso().optional(),
});
