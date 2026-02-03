/**
 * Tier limits for the frontend. Mirrors server/src/config/tiers.ts
 * so UI can gate actions (e.g. Add Framework) by plan.
 */

import type { TierName } from '../types';
import { normalizePlan } from './tierFeatures';

export type TierLimitKey = keyof typeof FOUNDATION;

/** Limits per tier (Foundation, Essentials, Growth, Visionary). -1 = unlimited. */
const FOUNDATION = {
  maxUsers: 10,
  maxFrameworks: 3,
  maxWorkspaces: 1,
  maxQuestionnairesPerMonth: 5,
  maxVendors: 10,
  maxPolicies: 25,
  maxIntegrations: 3,
  maxCustomReports: 5,
  maxMonitors: 5,
  maxIssues: 50,
  maxRiskAssessments: 10,
  maxAiRequestsPerMonth: 100,
  maxStorageGB: 5,
  maxApiRequestsPerDay: 1000,
  dataRetentionDays: 365,
} as const;

const ESSENTIALS = {
  maxUsers: 100,
  maxFrameworks: 10,
  maxWorkspaces: 5,
  maxQuestionnairesPerMonth: 50,
  maxVendors: 100,
  maxPolicies: 250,
  maxIntegrations: 15,
  maxCustomReports: 50,
  maxMonitors: 50,
  maxIssues: 500,
  maxRiskAssessments: 100,
  maxAiRequestsPerMonth: 1000,
  maxStorageGB: 50,
  maxApiRequestsPerDay: 10000,
  dataRetentionDays: 730,
} as const;

const GROWTH = {
  maxUsers: 1000,
  maxFrameworks: 50,
  maxWorkspaces: 25,
  maxQuestionnairesPerMonth: 500,
  maxVendors: 1000,
  maxPolicies: 2500,
  maxIntegrations: 50,
  maxCustomReports: 250,
  maxMonitors: 250,
  maxIssues: 5000,
  maxRiskAssessments: 1000,
  maxAiRequestsPerMonth: 10000,
  maxStorageGB: 500,
  maxApiRequestsPerDay: 100000,
  dataRetentionDays: 365 * 5,
} as const;

const VISIONARY = {
  maxUsers: -1,
  maxFrameworks: -1,
  maxWorkspaces: -1,
  maxQuestionnairesPerMonth: -1,
  maxVendors: -1,
  maxPolicies: -1,
  maxIntegrations: -1,
  maxCustomReports: -1,
  maxMonitors: -1,
  maxIssues: -1,
  maxRiskAssessments: -1,
  maxAiRequestsPerMonth: -1,
  maxStorageGB: -1,
  maxApiRequestsPerDay: -1,
  dataRetentionDays: 365 * 10,
} as const;

const TIER_LIMITS_MAP: Record<TierName, Record<TierLimitKey, number>> = {
  Foundation: FOUNDATION,
  Essentials: ESSENTIALS,
  Growth: GROWTH,
  Visionary: VISIONARY,
};

/**
 * Get the numeric limit for a tier and limit key. -1 means unlimited.
 */
export function getLimit(plan: string | undefined, limitKey: TierLimitKey): number {
  const tier = normalizePlan(plan);
  const limits = TIER_LIMITS_MAP[tier];
  return limits ? (limits[limitKey] as number) : FOUNDATION[limitKey];
}

/**
 * Check if the user is at or over the limit for the given resource.
 */
export function isAtLimit(plan: string | undefined, limitKey: TierLimitKey, currentCount: number): boolean {
  const max = getLimit(plan, limitKey);
  if (max === -1) return false;
  return currentCount >= max;
}

/** Human-readable resource names for upgrade messages */
export const LIMIT_LABELS: Record<TierLimitKey, string> = {
  maxUsers: 'users',
  maxFrameworks: 'frameworks',
  maxWorkspaces: 'workspaces',
  maxQuestionnairesPerMonth: 'questionnaires per month',
  maxVendors: 'vendors',
  maxPolicies: 'policies',
  maxIntegrations: 'integrations',
  maxCustomReports: 'custom reports',
  maxMonitors: 'monitors',
  maxIssues: 'issues',
  maxRiskAssessments: 'risk assessments',
  maxAiRequestsPerMonth: 'AI requests per month',
  maxStorageGB: 'GB storage',
  maxApiRequestsPerDay: 'API requests per day',
  dataRetentionDays: 'days data retention',
};

/** Upgrade CTA link (Settings → Billing) */
export const UPGRADE_LINK = '/settings?tab=billing';

/**
 * Message when user hits a tier limit. Use for alerts and disabled states.
 */
export function getUpgradeMessage(
  plan: string | undefined,
  limitKey: TierLimitKey,
  currentCount: number
): string {
  const max = getLimit(plan, limitKey);
  const label = LIMIT_LABELS[limitKey];
  if (max === -1) return '';
  if (currentCount < max) return '';
  const singular = label.replace(/s$/, '').replace(/ per month$/, '').replace(/ per day$/, '');
  return `Your plan allows up to ${max} ${max === 1 ? singular : label}. Upgrade in Settings → Billing to add more.`;
}
