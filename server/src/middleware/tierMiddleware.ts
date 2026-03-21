/**
 * Tier Middleware
 *
 * Production-level middleware for enforcing tier-based access control.
 * Provides decorators/middleware for:
 * - Feature access gating
 * - Usage limit enforcement
 * - Tier requirement checks
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './auth';
import tierService from '../services/tierService';
import { TierName, TierFeatures, TierLimits, isTierAtLeast, getNextTier } from '../config/tiers';
import { AppError } from './errorHandler';
import logger from '../config/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TierRequest extends AuthRequest {
  tier?: TierName;
  tierInfo?: {
    name: TierName;
    features: TierFeatures;
    limits: TierLimits;
  };
}

// ============================================================================
// MIDDLEWARE FACTORIES
// ============================================================================

/**
 * Middleware to require a specific feature
 * Returns 403 if the feature is not available in the user's tier
 */
export function requireFeature(feature: keyof TierFeatures): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user?.organizationId) {
        throw new AppError('Authentication required', 401);
      }

      const featureCheck = await tierService.checkFeatureAccess(
        authReq.user.organizationId,
        feature
      );

      if (!featureCheck.allowed) {
        logger.info(
          `Feature access denied: ${feature} for org ${authReq.user.organizationId} (tier: ${featureCheck.currentTier})`
        );

        res.status(403).json({
          error: 'Feature not available',
          message: featureCheck.upgradeMessage || `This feature requires a higher tier plan`,
          code: 'TIER_FEATURE_UNAVAILABLE',
          currentTier: featureCheck.currentTier,
          requiredTier: featureCheck.requiredTier,
          feature: featureCheck.displayName,
          upgradeUrl: '/settings?tab=billing',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Tier feature check error', error);
        next(new AppError('Failed to verify feature access', 500));
      }
    }
  };
}

/**
 * Middleware to require minimum tier level
 * Returns 403 if the user's tier is below the required tier
 */
export function requireTier(minimumTier: TierName): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user?.organizationId) {
        throw new AppError('Authentication required', 401);
      }

      const currentTier = await tierService.getOrganizationTier(authReq.user.organizationId);

      if (!isTierAtLeast(currentTier, minimumTier)) {
        logger.info(
          `Tier access denied: requires ${minimumTier}, has ${currentTier} for org ${authReq.user.organizationId}`
        );

        res.status(403).json({
          error: 'Tier requirement not met',
          message: `This feature requires ${minimumTier} tier or higher`,
          code: 'TIER_REQUIREMENT_NOT_MET',
          currentTier,
          requiredTier: minimumTier,
          upgradeUrl: '/settings?tab=billing',
        });
        return;
      }

      // Attach tier info to request
      (req as TierRequest).tier = currentTier;

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Tier requirement check error', error);
        next(new AppError('Failed to verify tier requirement', 500));
      }
    }
  };
}

/**
 * Middleware to check and enforce usage limits
 * Returns 429 if the limit has been reached
 */
export function enforceLimit(limitType: keyof TierLimits): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user?.organizationId) {
        throw new AppError('Authentication required', 401);
      }

      const limitCheck = await tierService.checkLimit(
        authReq.user.organizationId,
        limitType
      );

      if (!limitCheck.allowed) {
        logger.info(
          `Limit exceeded: ${limitType} for org ${authReq.user.organizationId} (${limitCheck.current}/${limitCheck.limit})`
        );

        res.status(429).json({
          error: 'Limit exceeded',
          message: limitCheck.upgradeMessage || `You have reached your ${limitCheck.displayName} limit`,
          code: 'TIER_LIMIT_EXCEEDED',
          limitType: limitCheck.limitType,
          current: limitCheck.current,
          limit: limitCheck.limit,
          remaining: 0,
          upgradeUrl: '/settings?tab=billing',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Limit enforcement error', error);
        next(new AppError('Failed to check usage limits', 500));
      }
    }
  };
}

/**
 * Middleware to attach tier information to the request
 * Useful for conditional logic in route handlers
 */
export function attachTierInfo(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as TierRequest;

      if (!authReq.user?.organizationId) {
        next();
        return;
      }

      const tierInfo = await tierService.getOrganizationTierInfo(authReq.user.organizationId);

      authReq.tier = tierInfo.name;
      authReq.tierInfo = {
        name: tierInfo.name,
        features: tierInfo.features,
        limits: tierInfo.limits,
      };

      next();
    } catch (error) {
      // Don't fail the request if tier info can't be loaded — default to free tier
      logger.error('Failed to attach tier info, defaulting to free tier', error);
      (req as any).tier = 'free';
      (req as any).tierInfo = { name: 'free', features: {}, limits: {} };
      next();
    }
  };
}

/**
 * Middleware to track usage after successful request
 * Should be used after the main handler
 */
export function trackUsage(metricType: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (authReq.user?.organizationId && res.statusCode >= 200 && res.statusCode < 300) {
        await tierService.incrementUsage(authReq.user.organizationId, metricType);
      }

      next();
    } catch (error) {
      // Don't fail the request if tracking fails
      logger.error('Usage tracking error', error);
      next();
    }
  };
}

/**
 * Combined middleware for feature + limit check
 * Useful for endpoints that require both
 */
export function requireFeatureAndLimit(
  feature: keyof TierFeatures,
  limitType: keyof TierLimits
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user?.organizationId) {
        throw new AppError('Authentication required', 401);
      }

      const validation = await tierService.validateAction(
        authReq.user.organizationId,
        feature,
        limitType
      );

      if (!validation.allowed) {
        logger.info(
          `Action denied for org ${authReq.user.organizationId}: ${validation.reason}`
        );

        res.status(403).json({
          error: 'Action not allowed',
          message: validation.reason,
          code: 'TIER_ACTION_DENIED',
          upgradeUrl: '/settings?tab=billing',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Feature and limit check error', error);
        next(new AppError('Failed to verify action permissions', 500));
      }
    }
  };
}

/**
 * Middleware to check if subscription is active
 * Returns 402 if subscription is past_due or canceled
 */
export function requireActiveSubscription(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user?.organizationId) {
        throw new AppError('Authentication required', 401);
      }

      const org = await import('../config/database').then(m => m.default.organization.findUnique({
        where: { id: authReq.user!.organizationId },
        select: { subscriptionStatus: true, plan: true },
      }));

      if (!org) {
        throw new AppError('Organization not found', 404);
      }

      const blockedStatuses = ['canceled', 'past_due', 'unpaid', 'incomplete_expired'];

      if (blockedStatuses.includes(org.subscriptionStatus)) {
        logger.info(
          `Subscription inactive for org ${authReq.user.organizationId}: ${org.subscriptionStatus}`
        );

        res.status(402).json({
          error: 'Subscription inactive',
          message: 'Your subscription requires attention. Please update your payment method.',
          code: 'SUBSCRIPTION_INACTIVE',
          status: org.subscriptionStatus,
          upgradeUrl: '/settings?tab=billing',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Subscription check error', error);
        next(new AppError('Failed to verify subscription status', 500));
      }
    }
  };
}

// ============================================================================
// CONVENIENCE MIDDLEWARE COMBINATIONS
// ============================================================================

/**
 * Middleware for AI features - requires feature + tracks usage
 */
export function requireAiFeature(feature: keyof TierFeatures): RequestHandler[] {
  return [
    requireFeature(feature),
    enforceLimit('maxAiRequestsPerMonth'),
  ];
}

/**
 * Middleware for creating resources - checks limit before creation
 */
export function requireResourceCreation(limitType: keyof TierLimits): RequestHandler[] {
  return [
    requireActiveSubscription(),
    enforceLimit(limitType),
  ];
}

/**
 * Middleware for enterprise features
 */
export function requireEnterpriseFeature(feature: keyof TierFeatures): RequestHandler[] {
  return [
    requireActiveSubscription(),
    requireTier('Essentials'),
    requireFeature(feature),
  ];
}

/**
 * Middleware for aCOS features
 */
export function requireAcosFeature(feature: keyof TierFeatures): RequestHandler[] {
  return [
    requireActiveSubscription(),
    requireTier('Growth'),
    requireFeature(feature),
  ];
}

/**
 * Middleware for Visionary-only features
 */
export function requireVisionaryFeature(feature: keyof TierFeatures): RequestHandler[] {
  return [
    requireActiveSubscription(),
    requireTier('Visionary'),
    requireFeature(feature),
  ];
}

// ============================================================================
// ROUTE PROTECTION HELPERS
// ============================================================================

/**
 * Feature requirement mappings for common routes
 */
export const ROUTE_FEATURE_REQUIREMENTS: Record<string, keyof TierFeatures> = {
  // AI Features
  '/api/ai/policy-generate': 'aiPolicyGeneration',
  '/api/ai/gap-analysis': 'aiGapAnalysis',
  '/api/ai/contract-analyze': 'aiContractAnalyzer',
  '/api/ai/rfp-generate': 'aiRfpGenerator',
  '/api/ai/phishing-simulate': 'aiPhishingSimulator',
  '/api/ai/vendor-score': 'aiVendorScorer',
  '/api/ai/data-map': 'aiDataMapper',
  '/api/ai/bcp-generate': 'aiBcpGenerator',

  // Enterprise Features
  '/api/personnel': 'personnelManagement',
  '/api/vendors': 'vendorRiskManagement',
  '/api/policies/library': 'policyLibrary',
  '/api/trust-center': 'trustCenter',
  '/api/workspaces': 'multiWorkspace',
  '/api/reports/advanced': 'advancedReporting',
  '/api/issues': 'issueManagement',

  // aCOS Features
  '/api/acos/goals': 'acosGoals',
  '/api/acos/control-loops': 'acosControlLoops',
  '/api/acos/debt': 'acosDebtTracking',
  '/api/acos/change-impact': 'acosChangeImpact',
  '/api/acos/actions': 'acosAgenticActions',
  '/api/acos/evidence': 'acosEvidenceTruth',
  '/api/acos/regulatory': 'acosRegulatoryIntelligence',
  '/api/acos/temporal': 'acosTemporalGraphs',
  '/api/acos/digital-twin': 'acosDigitalTwin',
  '/api/acos/red-team': 'acosRedTeam',
  '/api/acos/federated': 'acosFederatedLearning',

  // Visionary Features
  '/api/security/zero-trust': 'zeroTrustSecurity',
  '/api/security/zk-proofs': 'zkProofs',
  '/api/security/byok': 'byokEncryption',
  '/api/security/compliance-as-code': 'complianceAsCode',
  '/api/training/vr': 'acosVrTraining',
  '/api/iot': 'iotEdgeCompliance',
};

/**
 * Limit requirement mappings for common routes
 */
export const ROUTE_LIMIT_REQUIREMENTS: Record<string, keyof TierLimits> = {
  '/api/users': 'maxUsers',
  '/api/frameworks': 'maxFrameworks',
  '/api/workspaces': 'maxWorkspaces',
  '/api/questionnaires': 'maxQuestionnairesPerMonth',
  '/api/vendors': 'maxVendors',
  '/api/policies': 'maxPolicies',
  '/api/integrations': 'maxIntegrations',
  '/api/reports': 'maxCustomReports',
  '/api/monitors': 'maxMonitors',
  '/api/issues': 'maxIssues',
  '/api/risk-assessments': 'maxRiskAssessments',
};

export default {
  requireFeature,
  requireTier,
  enforceLimit,
  attachTierInfo,
  trackUsage,
  requireFeatureAndLimit,
  requireActiveSubscription,
  requireAiFeature,
  requireResourceCreation,
  requireEnterpriseFeature,
  requireAcosFeature,
  requireVisionaryFeature,
  ROUTE_FEATURE_REQUIREMENTS,
  ROUTE_LIMIT_REQUIREMENTS,
};
