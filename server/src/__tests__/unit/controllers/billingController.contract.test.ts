/**
 * Billing Controller Contract Tests
 *
 * Validates the contract for all billing controller endpoints including
 * checkout, subscriptions, tiers, add-ons, features, and bundles.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../services/stripeService', () => ({
  __esModule: true,
  default: {
    createCheckoutSession: jest.fn<any>().mockResolvedValue('https://stripe.com/checkout' as never),
    createPortalSession: jest.fn<any>().mockResolvedValue('https://stripe.com/portal' as never),
    getSubscriptionDetails: jest.fn<any>().mockResolvedValue({ tier: 'Essentials', status: 'active' } as never),
    handleWebhook: jest.fn<any>().mockResolvedValue({ processed: false, event: { type: 'test' } } as never),
    previewTierChange: jest.fn<any>().mockResolvedValue({ proratedAmount: 100 } as never),
    changeTier: jest.fn<any>().mockResolvedValue(true as never),
    cancelSubscription: jest.fn<any>().mockResolvedValue(true as never),
    reactivateSubscription: jest.fn<any>().mockResolvedValue(true as never),
    addAddOn: jest.fn<any>().mockResolvedValue(true as never),
    removeAddOn: jest.fn<any>().mockResolvedValue(true as never),
    createQuote: jest.fn<any>().mockResolvedValue({ quoteId: 'q-123' } as never),
    processRefund: jest.fn<any>().mockResolvedValue({ id: 'refund-123', amount: 1000, currency: 'usd', status: 'succeeded' } as never),
  },
}));

jest.mock('../../../services/tierService', () => ({
  __esModule: true,
  default: {
    getAvailableTiers: jest.fn<any>().mockResolvedValue([{ name: 'Foundation' }, { name: 'Essentials' }] as never),
    getOrganizationTier: jest.fn<any>().mockResolvedValue('Foundation' as never),
    compareTiers: jest.fn().mockReturnValue({ added: [], removed: [] }),
    canDowngrade: jest.fn<any>().mockResolvedValue({ allowed: true, blockers: [] } as never),
    getAllUsageMetrics: jest.fn<any>().mockResolvedValue({ aiQueries: 10 } as never),
    getUsageVsLimits: jest.fn<any>().mockResolvedValue({ aiQueries: { used: 10, limit: 100 } } as never),
  },
}));

jest.mock('../../../services/featureService', () => ({
  __esModule: true,
  default: {
    getAvailableFeaturesForOrganization: jest.fn<any>().mockResolvedValue([] as never),
    getActiveFeatureSubscriptions: jest.fn<any>().mockResolvedValue([] as never),
    getTotalFeatureCost: jest.fn<any>().mockResolvedValue(0 as never),
    hasFeatureAccess: jest.fn<any>().mockResolvedValue(true as never),
    subscribeToFeature: jest.fn<any>().mockResolvedValue({ id: 'sub-1' } as never),
    unsubscribeFromFeature: jest.fn<any>().mockResolvedValue(undefined as never),
    subscribeToBundle: jest.fn<any>().mockResolvedValue([{ id: 'sub-1' }] as never),
  },
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    stripe: { secretKey: 'sk_test_mock' },
    server: { clientUrl: 'http://localhost:3000' },
  },
}));

jest.mock('../../../config/tiers', () => ({
  __esModule: true,
  TierName: {},
  TIERS: {},
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
  getTier: jest.fn(),
  getTierIndex: jest.fn().mockReturnValue(0),
  tierAddOns: [{ id: 'addon-1', name: 'Premium Support', availableForTiers: ['Foundation', 'Essentials'] }],
  getAvailableAddOns: jest.fn().mockReturnValue([{ id: 'addon-1' }]),
}));

jest.mock('../../../config/features', () => ({
  __esModule: true,
  FEATURES: {},
  FEATURE_BUNDLES: {},
  getFeature: jest.fn().mockReturnValue({ id: 'feat-1', name: 'Test Feature', description: 'Test' }),
  getBundle: jest.fn(),
}));

jest.mock('../../../services/webhookService', () => ({
  __esModule: true,
  default: {
    dispatchEvent: jest.fn<any>().mockResolvedValue(undefined as never),
  },
}));

import billingController from '../../../controllers/billingController';
import { AppError } from '../../../middleware/errorHandler';

describe('BillingController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations cleared by resetMocks: true in jest config
    const stripeService = require('../../../services/stripeService').default;
    stripeService.createCheckoutSession.mockResolvedValue('https://stripe.com/checkout');
    stripeService.createPortalSession.mockResolvedValue('https://stripe.com/portal');
    stripeService.getSubscriptionDetails.mockResolvedValue({ tier: 'Essentials', status: 'active' });
    stripeService.handleWebhook.mockResolvedValue({ processed: false, event: { type: 'test' } });
    stripeService.previewTierChange.mockResolvedValue({ proratedAmount: 100 });
    stripeService.changeTier.mockResolvedValue(true);
    stripeService.cancelSubscription.mockResolvedValue(true);
    stripeService.reactivateSubscription.mockResolvedValue(true);
    stripeService.addAddOn.mockResolvedValue(true);
    stripeService.removeAddOn.mockResolvedValue(true);
    stripeService.createQuote.mockResolvedValue({ quoteId: 'q-123' });
    stripeService.processRefund.mockResolvedValue({ id: 'refund-123', amount: 1000, currency: 'usd', status: 'succeeded' });

    const tierService = require('../../../services/tierService').default;
    tierService.getAvailableTiers.mockResolvedValue([{ name: 'Foundation' }, { name: 'Essentials' }]);
    tierService.getOrganizationTier.mockResolvedValue('Foundation');
    tierService.compareTiers.mockReturnValue({ added: [], removed: [] });
    tierService.canDowngrade.mockResolvedValue({ allowed: true, blockers: [] });
    tierService.getAllUsageMetrics.mockResolvedValue({ aiQueries: 10 });
    tierService.getUsageVsLimits.mockResolvedValue({ aiQueries: { used: 10, limit: 100 } });

    const featureService = require('../../../services/featureService').default;
    featureService.getAvailableFeaturesForOrganization.mockResolvedValue([]);
    featureService.getActiveFeatureSubscriptions.mockResolvedValue([]);
    featureService.getTotalFeatureCost.mockResolvedValue(0);
    featureService.hasFeatureAccess.mockResolvedValue(true);
    featureService.subscribeToFeature.mockResolvedValue({ id: 'sub-1' });
    featureService.unsubscribeFromFeature.mockResolvedValue(undefined);
    featureService.subscribeToBundle.mockResolvedValue([{ id: 'sub-1' }]);

    const { getAvailableAddOns } = require('../../../config/tiers');
    getAvailableAddOns.mockReturnValue([{ id: 'addon-1' }]);

    const { getFeature } = require('../../../config/features');
    getFeature.mockReturnValue({ id: 'feat-1', name: 'Test Feature', description: 'Test' });

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      headers: {},
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };
  });

  // ===========================================================================
  // createCheckout
  // ===========================================================================
  describe('createCheckout()', () => {
    it('should return checkout URL for valid tier', async () => {
      mockReq.body = { tier: 'Essentials', billingCycle: 'annual' };

      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'org-123',
        name: 'Test Org',
        users: [{ id: 'user-123' }],
      } as never);

      await billingController.createCheckout(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.any(String) })
      );
    });

    it('should throw 400 for invalid tier', async () => {
      mockReq.body = { tier: 'InvalidTier' };

      await expect(
        billingController.createCheckout(
          mockReq as Request,
          mockRes as Response,
          jest.fn() as unknown as NextFunction
        )
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // createPortalSession
  // ===========================================================================
  describe('createPortalSession()', () => {
    it('should return portal URL when customer exists', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: 'cus_123',
      } as never);

      await billingController.createPortalSession(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.any(String) })
      );
    });

    it('should throw 404 when no billing account', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: null,
      } as never);

      await expect(
        billingController.createPortalSession(
          mockReq as Request,
          mockRes as Response,
          jest.fn() as unknown as NextFunction
        )
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // getSubscription
  // ===========================================================================
  describe('getSubscription()', () => {
    it('should return subscription details', async () => {
      await billingController.getSubscription(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 'Essentials', status: 'active' })
      );
    });
  });

  // ===========================================================================
  // getAvailableTiers
  // ===========================================================================
  describe('getAvailableTiers()', () => {
    it('should return tiers and addons', async () => {
      await billingController.getAvailableTiers(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tiers: expect.any(Array),
          addOns: expect.any(Array),
        })
      );
    });
  });

  // ===========================================================================
  // previewTierChange
  // ===========================================================================
  describe('previewTierChange()', () => {
    it('should return comparison and preview', async () => {
      mockReq.body = { tier: 'Essentials' };

      await billingController.previewTierChange(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          comparison: expect.any(Object),
          canDowngrade: expect.any(Boolean),
        })
      );
    });

    it('should throw 400 for invalid tier', async () => {
      mockReq.body = { tier: 'BadTier' };

      await expect(
        billingController.previewTierChange(
          mockReq as Request,
          mockRes as Response,
          jest.fn() as unknown as NextFunction
        )
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // changeTier
  // ===========================================================================
  describe('changeTier()', () => {
    it('should change tier successfully', async () => {
      mockReq.body = { tier: 'Essentials', billingCycle: 'annual' };

      await billingController.changeTier(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, newTier: 'Essentials' })
      );
    });
  });

  // ===========================================================================
  // cancelSubscription
  // ===========================================================================
  describe('cancelSubscription()', () => {
    it('should cancel subscription with message', async () => {
      mockReq.body = { atPeriodEnd: true, reason: 'Too expensive' };

      await billingController.cancelSubscription(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('canceled'),
        })
      );
    });
  });

  // ===========================================================================
  // reactivateSubscription
  // ===========================================================================
  describe('reactivateSubscription()', () => {
    it('should reactivate and return success', async () => {
      await billingController.reactivateSubscription(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('reactivated'),
        })
      );
    });
  });

  // ===========================================================================
  // getUsageMetrics
  // ===========================================================================
  describe('getUsageMetrics()', () => {
    it('should return metrics and limits', async () => {
      await billingController.getUsageMetrics(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.any(Object),
          limits: expect.any(Object),
        })
      );
    });
  });

  // ===========================================================================
  // getSubscriptionHistory
  // ===========================================================================
  describe('getSubscriptionHistory()', () => {
    it('should return paginated history', async () => {
      (prismaMock.subscriptionHistory.findMany as jest.Mock<any>).mockResolvedValue([] as never);
      (prismaMock.subscriptionHistory.count as jest.Mock<any>).mockResolvedValue(0 as never);

      await billingController.getSubscriptionHistory(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ history: [], total: 0 })
      );
      expect(prismaMock.subscriptionHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });
  });

  // ===========================================================================
  // requestQuote
  // ===========================================================================
  describe('requestQuote()', () => {
    it('should throw 400 for small user count', async () => {
      mockReq.body = { tier: 'Growth', requirements: { userCount: 50 } };

      await expect(
        billingController.requestQuote(
          mockReq as Request,
          mockRes as Response,
          jest.fn() as unknown as NextFunction
        )
      ).rejects.toThrow(AppError);
    });

    it('should return quote for large org', async () => {
      mockReq.body = { tier: 'Growth', requirements: { userCount: 2000, features: [], addOns: [] } };

      await billingController.requestQuote(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ quoteId: 'q-123' })
      );
    });
  });

  // ===========================================================================
  // processRefund
  // ===========================================================================
  describe('processRefund()', () => {
    it('should throw 400 when no charge or payment intent', async () => {
      mockReq.body = {};

      await expect(
        billingController.processRefund(
          mockReq as Request,
          mockRes as Response,
          jest.fn() as unknown as NextFunction
        )
      ).rejects.toThrow(AppError);
    });

    it('should process refund and return result', async () => {
      mockReq.body = { chargeId: 'ch_123', reason: 'requested_by_customer' };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await billingController.processRefund(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          refund: expect.objectContaining({
            id: 'refund-123',
            amount: 1000,
          }),
        })
      );
    });
  });

  // ===========================================================================
  // Feature endpoints
  // ===========================================================================
  describe('getAvailableFeatures()', () => {
    it('should return features', async () => {
      await billingController.getAvailableFeatures(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ features: expect.any(Array) })
      );
    });
  });

  describe('getFeatureSubscriptions()', () => {
    it('should return subscriptions with costs', async () => {
      await billingController.getFeatureSubscriptions(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptions: expect.any(Array),
          totalAnnualCost: expect.any(Number),
          totalMonthlyCost: expect.any(Number),
        })
      );
    });
  });

  describe('checkFeatureAccess()', () => {
    it('should return access status', async () => {
      mockReq.params = { featureId: 'feat-1' };

      await billingController.checkFeatureAccess(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: expect.any(Boolean),
          feature: expect.any(Object),
        })
      );
    });
  });

  describe('getAvailableBundles()', () => {
    it('should throw 404 for missing org', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await expect(
        billingController.getAvailableBundles(
          mockReq as Request,
          mockRes as Response,
          jest.fn() as unknown as NextFunction
        )
      ).rejects.toThrow(AppError);
    });

    it('should return bundles for valid org', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        plan: 'Essentials',
      } as never);

      await billingController.getAvailableBundles(
        mockReq as Request,
        mockRes as Response,
        jest.fn() as unknown as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ bundles: expect.any(Array) })
      );
    });
  });
});
