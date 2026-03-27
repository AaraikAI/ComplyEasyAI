/**
 * Joi validation schemas for custom dashboard builder routes.
 * Covers: dashboards, widgets, cloning.
 */
import Joi from 'joi';

const validWidgetTypes = [
  'METRIC_CARD', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART',
  'DONUT_CHART', 'STACKED_BAR', 'TABLE', 'LIST', 'HEATMAP',
  'GAUGE', 'SCATTER', 'AREA_CHART', 'TEXT', 'IFRAME',
] as const;

const positionSchema = Joi.object({
  x: Joi.number().integer().min(0).required(),
  y: Joi.number().integer().min(0).required(),
  w: Joi.number().integer().min(1).required(),
  h: Joi.number().integer().min(1).required(),
}).unknown(false);

const layoutSchema = Joi.object({
  columns: Joi.number().integer().min(1).max(12).optional(),
  rows: Joi.number().integer().min(1).max(20).optional(),
}).unknown(true);

export const createDashboardSchema = Joi.object({
  name: Joi.string().required().min(1).max(300).trim(),
  description: Joi.string().max(2000).allow('', null).optional(),
  isShared: Joi.boolean().optional(),
  layout: layoutSchema.allow(null).optional(),
}).unknown(false);

export const updateDashboardSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  isShared: Joi.boolean().optional(),
  layout: layoutSchema.allow(null).optional(),
  isDefault: Joi.boolean().optional(),
}).min(1).unknown(false);

export const createWidgetSchema = Joi.object({
  type: Joi.string().valid(...validWidgetTypes).required(),
  title: Joi.string().required().min(1).max(300).trim(),
  config: Joi.object().allow(null).optional(),
  position: positionSchema.allow(null).optional(),
}).unknown(false);

export const updateWidgetSchema = Joi.object({
  type: Joi.string().valid(...validWidgetTypes).optional(),
  title: Joi.string().min(1).max(300).trim().optional(),
  config: Joi.object().allow(null).optional(),
  position: positionSchema.allow(null).optional(),
}).min(1).unknown(false);

export const cloneDashboardSchema = Joi.object({
  name: Joi.string().min(1).max(300).trim().allow('', null).optional(),
}).unknown(false);
