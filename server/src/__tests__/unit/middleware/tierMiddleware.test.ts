import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCheckFeatureAccess = jest.fn();
const mockGetOrganizationTier = jest.fn();
const mockCheckLimit = jest.fn();
const mockGetOrganizationTierInfo = jest.fn();
const mockIncrementUsage = jest.fn();
const mockValidateAction = jest.fn();

jest.mock('../../../services/tierService', () => ({
  __esModule: true,
  default: {
    checkFeatureAccess: (...args: unknown[]) => mockCheckFeatureAccess(...args),
    getOrganizationTier: (...args: unknown[]) => mockGetOrganizationTier(...args),
    checkLimit: (...args: unknown[]) => mockCheckLimit(...args),
    getOrganizationTierInfo: (...args: unknown[]) => mockGetOrganizationTierInfo(...args),
    incrementUsage: (...args: unknown[]) => mockIncrementUsage(...args),
    validateAction: (...args: unknown[]) => mockValidateAction(...args),
  },
}));

const mockIsTierAtLeast = jest.fn();
const mockGetNextTier = jest.fn();

jest.mock('../../../config/tiers', () => ({
  __esModule: true,
  isTierAtLeast: (...args: unknown[]) => mockIsTierAtLeast(...args),
  getNextTier: (...args: unknown[]) => mockGetNextTier(...args),
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockOrgFindUnique = jest.fn();

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    organization: {
      findUnique: (...args: unknown[]) => mockOrgFindUnique(...args),
    },
  },
}));

// Mock the errorHandler module so AppError is available
jest.mock('../../../middleware/errorHandler', () => {
  class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  }
  return {
    __esModule: true,
    AppError,
  };
});

// Mock the auth module to provide AuthRequest type compatibility
jest.mock('../../../middleware/auth', () => ({
  __esModule: true,
}));

// ---------------------------------------------------------------------------
// Import module under test
// ---------------------------------------------------------------------------

import {
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
} from '../../../middleware/tierMiddleware';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(overrides: Record<string, any> = {}): any {
  return {
    headers: {},
    ...overrides,
  };
}

function buildRes(): { res: any; statusFn: jest.Mock; jsonFn: jest.Mock } {
  const jsonFn = jest.fn().mockReturnThis() as jest.Mock;
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn }) as jest.Mock;
  return {
    res: { status: statusFn, json: jsonFn, statusCode: 200 },
    statusFn,
    jsonFn,
  };
}

function buildNext(): jest.Mock {
  return jest.fn() as jest.Mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Tier Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // requireFeature
  // =========================================================================

  describe('requireFeature', () => {
    it('should pass AppError(401) to next when no user is on request', async () => {
      const middleware = requireFeature('aiPolicyGeneration' as any);
      const req = buildReq(); // no user
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        })
      );
    });

    it('should pass AppError(401) to next when user has no organizationId', async () => {
      const middleware = requireFeature('aiPolicyGeneration' as any);
      const req = buildReq({ user: { id: 'u1', email: 'a@b.com' } }); // no organizationId
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should call next() when feature is allowed', async () => {
      mockCheckFeatureAccess.mockResolvedValue({ allowed: true, currentTier: 'Essentials' });

      const middleware = requireFeature('aiPolicyGeneration' as any);
      const req = buildReq({
        user: { id: 'u1', email: 'a@b.com', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockCheckFeatureAccess).toHaveBeenCalledWith('org-1', 'aiPolicyGeneration');
      expect(next).toHaveBeenCalledWith(); // called without arguments
    });

    it('should return 403 with upgrade info when feature is denied', async () => {
      mockCheckFeatureAccess.mockResolvedValue({
        allowed: false,
        currentTier: 'Foundation',
        requiredTier: 'Essentials',
        upgradeMessage: 'Upgrade to Essentials',
        displayName: 'AI Policy Generation',
      });

      const middleware = requireFeature('aiPolicyGeneration' as any);
      const req = buildReq({
        user: { id: 'u1', email: 'a@b.com', organizationId: 'org-1' },
      });
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Feature not available',
          code: 'TIER_FEATURE_UNAVAILABLE',
          currentTier: 'Foundation',
          requiredTier: 'Essentials',
          feature: 'AI Policy Generation',
          upgradeUrl: '/settings?tab=billing',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle service errors by passing AppError(500) to next', async () => {
      mockCheckFeatureAccess.mockRejectedValue(new Error('Service down'));

      const middleware = requireFeature('aiPolicyGeneration' as any);
      const req = buildReq({
        user: { id: 'u1', email: 'a@b.com', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Failed to verify feature access',
        })
      );
    });
  });

  // =========================================================================
  // requireTier
  // =========================================================================

  describe('requireTier', () => {
    it('should pass AppError(401) to next when no user is on request', async () => {
      const middleware = requireTier('Essentials' as any);
      const req = buildReq();
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next() and attach tier to request when tier requirement is met', async () => {
      mockGetOrganizationTier.mockResolvedValue('Growth');
      mockIsTierAtLeast.mockReturnValue(true);

      const middleware = requireTier('Essentials' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockGetOrganizationTier).toHaveBeenCalledWith('org-1');
      expect(mockIsTierAtLeast).toHaveBeenCalledWith('Growth', 'Essentials');
      expect(req.tier).toBe('Growth');
      expect(next).toHaveBeenCalledWith(); // called without arguments
    });

    it('should return 403 when tier requirement is not met', async () => {
      mockGetOrganizationTier.mockResolvedValue('Foundation');
      mockIsTierAtLeast.mockReturnValue(false);

      const middleware = requireTier('Growth' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tier requirement not met',
          code: 'TIER_REQUIREMENT_NOT_MET',
          currentTier: 'Foundation',
          requiredTier: 'Growth',
          upgradeUrl: '/settings?tab=billing',
        })
      );
    });

    it('should handle service errors by passing AppError(500) to next', async () => {
      mockGetOrganizationTier.mockRejectedValue(new Error('DB error'));

      const middleware = requireTier('Essentials' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Failed to verify tier requirement',
        })
      );
    });
  });

  // =========================================================================
  // enforceLimit
  // =========================================================================

  describe('enforceLimit', () => {
    it('should pass AppError(401) to next when no user is on request', async () => {
      const middleware = enforceLimit('maxUsers' as any);
      const req = buildReq();
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next() when within limit', async () => {
      mockCheckLimit.mockResolvedValue({
        allowed: true,
        current: 5,
        limit: 10,
        remaining: 5,
        limitType: 'maxUsers',
        displayName: 'Users',
      });

      const middleware = enforceLimit('maxUsers' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockCheckLimit).toHaveBeenCalledWith('org-1', 'maxUsers');
      expect(next).toHaveBeenCalledWith(); // no args
    });

    it('should return 429 when limit is exceeded', async () => {
      mockCheckLimit.mockResolvedValue({
        allowed: false,
        current: 10,
        limit: 10,
        remaining: 0,
        limitType: 'maxUsers',
        displayName: 'Users',
        upgradeMessage: 'Upgrade to add more users',
      });

      const middleware = enforceLimit('maxUsers' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(429);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Limit exceeded',
          code: 'TIER_LIMIT_EXCEEDED',
          limitType: 'maxUsers',
          current: 10,
          limit: 10,
          remaining: 0,
          upgradeUrl: '/settings?tab=billing',
        })
      );
    });

    it('should handle service errors', async () => {
      mockCheckLimit.mockRejectedValue(new Error('Service failure'));

      const middleware = enforceLimit('maxUsers' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Failed to check usage limits',
        })
      );
    });
  });

  // =========================================================================
  // attachTierInfo
  // =========================================================================

  describe('attachTierInfo', () => {
    it('should call next without attaching tier when no user is on request', async () => {
      const middleware = attachTierInfo();
      const req = buildReq();
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(req.tier).toBeUndefined();
      expect(req.tierInfo).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should call next without attaching tier when user has no organizationId', async () => {
      const middleware = attachTierInfo();
      const req = buildReq({ user: { id: 'u1' } }); // no organizationId
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(req.tier).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should attach tier info to request when user exists', async () => {
      const tierInfo = {
        name: 'Growth',
        features: { aiPolicyGeneration: true, acosGoals: true },
        limits: { maxUsers: 1000, maxFrameworks: 50 },
      };
      mockGetOrganizationTierInfo.mockResolvedValue(tierInfo);

      const middleware = attachTierInfo();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(req.tier).toBe('Growth');
      expect(req.tierInfo).toEqual({
        name: 'Growth',
        features: tierInfo.features,
        limits: tierInfo.limits,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should log error and call next on failure (does not block request)', async () => {
      mockGetOrganizationTierInfo.mockRejectedValue(new Error('Tier service down'));

      const middleware = attachTierInfo();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      // Should still call next even on error
      expect(next).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // trackUsage
  // =========================================================================

  describe('trackUsage', () => {
    it('should increment usage on successful request (2xx status)', async () => {
      mockIncrementUsage.mockResolvedValue(undefined);

      const middleware = trackUsage('aiRequests');
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      res.statusCode = 200;
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockIncrementUsage).toHaveBeenCalledWith('org-1', 'aiRequests');
      expect(next).toHaveBeenCalled();
    });

    it('should increment usage for 201 status', async () => {
      mockIncrementUsage.mockResolvedValue(undefined);

      const middleware = trackUsage('aiRequests');
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      res.statusCode = 201;
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockIncrementUsage).toHaveBeenCalledWith('org-1', 'aiRequests');
    });

    it('should NOT increment usage on failed request (4xx status)', async () => {
      const middleware = trackUsage('aiRequests');
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      res.statusCode = 400;
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockIncrementUsage).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should NOT increment usage on 5xx status', async () => {
      const middleware = trackUsage('aiRequests');
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      res.statusCode = 500;
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it('should NOT increment when no user is on request', async () => {
      const middleware = trackUsage('aiRequests');
      const req = buildReq();
      const { res } = buildRes();
      res.statusCode = 200;
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockIncrementUsage).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should log error and call next on tracking failure', async () => {
      mockIncrementUsage.mockRejectedValue(new Error('Tracking DB down'));

      const middleware = trackUsage('aiRequests');
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      res.statusCode = 200;
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      // Should still call next
      expect(next).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // requireFeatureAndLimit
  // =========================================================================

  describe('requireFeatureAndLimit', () => {
    it('should pass AppError(401) to next when no user is on request', async () => {
      const middleware = requireFeatureAndLimit('aiPolicyGeneration' as any, 'maxAiRequestsPerMonth' as any);
      const req = buildReq();
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next() when action is allowed', async () => {
      mockValidateAction.mockResolvedValue({ allowed: true });

      const middleware = requireFeatureAndLimit('aiPolicyGeneration' as any, 'maxAiRequestsPerMonth' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(mockValidateAction).toHaveBeenCalledWith(
        'org-1',
        'aiPolicyGeneration',
        'maxAiRequestsPerMonth'
      );
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 403 when action is denied', async () => {
      mockValidateAction.mockResolvedValue({
        allowed: false,
        reason: 'Feature not available in your tier',
      });

      const middleware = requireFeatureAndLimit('aiPolicyGeneration' as any, 'maxAiRequestsPerMonth' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Action not allowed',
          code: 'TIER_ACTION_DENIED',
          message: 'Feature not available in your tier',
          upgradeUrl: '/settings?tab=billing',
        })
      );
    });

    it('should handle service errors', async () => {
      mockValidateAction.mockRejectedValue(new Error('Validate failed'));

      const middleware = requireFeatureAndLimit('aiPolicyGeneration' as any, 'maxAiRequestsPerMonth' as any);
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Failed to verify action permissions',
        })
      );
    });
  });

  // =========================================================================
  // requireActiveSubscription
  // =========================================================================

  describe('requireActiveSubscription', () => {
    it('should pass AppError(401) to next when no user is on request', async () => {
      const middleware = requireActiveSubscription();
      const req = buildReq();
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next() when subscription is active', async () => {
      mockOrgFindUnique.mockResolvedValue({
        subscriptionStatus: 'active',
        plan: 'Growth',
      });

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 402 when subscription is canceled', async () => {
      mockOrgFindUnique.mockResolvedValue({
        subscriptionStatus: 'canceled',
        plan: 'Growth',
      });

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(402);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Subscription inactive',
          code: 'SUBSCRIPTION_INACTIVE',
          status: 'canceled',
          upgradeUrl: '/settings?tab=billing',
        })
      );
    });

    it('should return 402 when subscription is past_due', async () => {
      mockOrgFindUnique.mockResolvedValue({
        subscriptionStatus: 'past_due',
        plan: 'Essentials',
      });

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(402);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SUBSCRIPTION_INACTIVE',
          status: 'past_due',
        })
      );
    });

    it('should return 402 when subscription is unpaid', async () => {
      mockOrgFindUnique.mockResolvedValue({
        subscriptionStatus: 'unpaid',
        plan: 'Foundation',
      });

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(402);
    });

    it('should return 402 when subscription is incomplete_expired', async () => {
      mockOrgFindUnique.mockResolvedValue({
        subscriptionStatus: 'incomplete_expired',
        plan: 'Foundation',
      });

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res, statusFn } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(402);
    });

    it('should pass AppError(404) to next when organization is not found', async () => {
      mockOrgFindUnique.mockResolvedValue(null);

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-999' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Organization not found',
        })
      );
    });

    it('should allow trialing subscription status', async () => {
      mockOrgFindUnique.mockResolvedValue({
        subscriptionStatus: 'trialing',
        plan: 'Growth',
      });

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle service errors', async () => {
      mockOrgFindUnique.mockRejectedValue(new Error('DB connection failed'));

      const middleware = requireActiveSubscription();
      const req = buildReq({
        user: { id: 'u1', organizationId: 'org-1' },
      });
      const { res } = buildRes();
      const next = buildNext();

      await (middleware as Function)(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Failed to verify subscription status',
        })
      );
    });
  });

  // =========================================================================
  // Convenience middleware combinations
  // =========================================================================

  describe('requireAiFeature', () => {
    it('should return an array of exactly 2 middleware functions', () => {
      const middlewares = requireAiFeature('aiPolicyGeneration' as any);

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares).toHaveLength(2);
      expect(typeof middlewares[0]).toBe('function');
      expect(typeof middlewares[1]).toBe('function');
    });
  });

  describe('requireResourceCreation', () => {
    it('should return an array of exactly 2 middleware functions', () => {
      const middlewares = requireResourceCreation('maxUsers' as any);

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares).toHaveLength(2);
      expect(typeof middlewares[0]).toBe('function');
      expect(typeof middlewares[1]).toBe('function');
    });
  });

  describe('requireEnterpriseFeature', () => {
    it('should return an array of exactly 3 middleware functions', () => {
      const middlewares = requireEnterpriseFeature('personnelManagement' as any);

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares).toHaveLength(3);
      middlewares.forEach((mw) => {
        expect(typeof mw).toBe('function');
      });
    });
  });

  describe('requireAcosFeature', () => {
    it('should return an array of exactly 3 middleware functions', () => {
      const middlewares = requireAcosFeature('acosGoals' as any);

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares).toHaveLength(3);
      middlewares.forEach((mw) => {
        expect(typeof mw).toBe('function');
      });
    });
  });

  describe('requireVisionaryFeature', () => {
    it('should return an array of exactly 3 middleware functions', () => {
      const middlewares = requireVisionaryFeature('zeroTrustSecurity' as any);

      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares).toHaveLength(3);
      middlewares.forEach((mw) => {
        expect(typeof mw).toBe('function');
      });
    });
  });

  // =========================================================================
  // Route mappings
  // =========================================================================

  describe('ROUTE_FEATURE_REQUIREMENTS', () => {
    it('should be a non-empty object', () => {
      expect(typeof ROUTE_FEATURE_REQUIREMENTS).toBe('object');
      expect(Object.keys(ROUTE_FEATURE_REQUIREMENTS).length).toBeGreaterThan(0);
    });

    it('should contain AI route mappings', () => {
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/ai/policy-generate', 'aiPolicyGeneration');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/ai/gap-analysis', 'aiGapAnalysis');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/ai/contract-analyze', 'aiContractAnalyzer');
    });

    it('should contain enterprise route mappings', () => {
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/personnel', 'personnelManagement');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/vendors', 'vendorRiskManagement');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/trust-center', 'trustCenter');
    });

    it('should contain aCOS route mappings', () => {
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/acos/goals', 'acosGoals');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/acos/control-loops', 'acosControlLoops');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/acos/debt', 'acosDebtTracking');
    });

    it('should contain visionary route mappings', () => {
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/security/zero-trust', 'zeroTrustSecurity');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/security/zk-proofs', 'zkProofs');
      expect(ROUTE_FEATURE_REQUIREMENTS).toHaveProperty('/api/security/byok', 'byokEncryption');
    });

    it('should map all values to valid feature key strings', () => {
      Object.values(ROUTE_FEATURE_REQUIREMENTS).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ROUTE_LIMIT_REQUIREMENTS', () => {
    it('should be a non-empty object', () => {
      expect(typeof ROUTE_LIMIT_REQUIREMENTS).toBe('object');
      expect(Object.keys(ROUTE_LIMIT_REQUIREMENTS).length).toBeGreaterThan(0);
    });

    it('should contain expected route-to-limit mappings', () => {
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/users', 'maxUsers');
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/frameworks', 'maxFrameworks');
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/workspaces', 'maxWorkspaces');
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/vendors', 'maxVendors');
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/policies', 'maxPolicies');
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/integrations', 'maxIntegrations');
    });

    it('should map all values to valid limit key strings', () => {
      Object.values(ROUTE_LIMIT_REQUIREMENTS).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should contain issue and risk assessment limits', () => {
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/issues', 'maxIssues');
      expect(ROUTE_LIMIT_REQUIREMENTS).toHaveProperty('/api/risk-assessments', 'maxRiskAssessments');
    });
  });
});
