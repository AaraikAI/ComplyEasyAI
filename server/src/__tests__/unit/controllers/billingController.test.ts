/**
 * Billing Controller Unit Tests
 * Comprehensive tests for subscription, tiers, add-ons, and feature management
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = jest.Mock<(...args: any[]) => any>;
const createMock = (): MockFn => jest.fn() as MockFn;

// Mock services
const mockCreateCheckoutSession = createMock();
const mockCreatePortalSession = createMock();
const mockHandleWebhook = createMock();
const mockGetSubscriptionDetails = createMock();
const mockPreviewTierChange = createMock();
const mockChangeTier = createMock();
const mockCancelSubscription = createMock();
const mockReactivateSubscription = createMock();
const mockAddAddOn = createMock();
const mockRemoveAddOn = createMock();
const mockCreateQuote = createMock();
const mockAddBundle = createMock();
const mockRemoveBundle = createMock();

jest.mock('../../../services/stripeService', () => ({
  __esModule: true,
  default: {
    createCheckoutSession: mockCreateCheckoutSession,
    createPortalSession: mockCreatePortalSession,
    handleWebhook: mockHandleWebhook,
    getSubscriptionDetails: mockGetSubscriptionDetails,
    previewTierChange: mockPreviewTierChange,
    changeTier: mockChangeTier,
    cancelSubscription: mockCancelSubscription,
    reactivateSubscription: mockReactivateSubscription,
    addAddOn: mockAddAddOn,
    removeAddOn: mockRemoveAddOn,
    createQuote: mockCreateQuote,
    addBundle: mockAddBundle,
    removeBundle: mockRemoveBundle,
  },
}));

const mockGetOrganizationTier = createMock();
const mockGetAvailableTiers = createMock();
const mockCompareTiers = createMock();
const mockCanDowngrade = createMock();
const mockGetAllUsageMetrics = createMock();
const mockGetUsageVsLimits = createMock();

jest.mock('../../../services/tierService', () => ({
  __esModule: true,
  default: {
    getOrganizationTier: mockGetOrganizationTier,
    getAvailableTiers: mockGetAvailableTiers,
    compareTiers: mockCompareTiers,
    canDowngrade: mockCanDowngrade,
    getAllUsageMetrics: mockGetAllUsageMetrics,
    getUsageVsLimits: mockGetUsageVsLimits,
  },
}));

const mockGetAvailableFeaturesForOrg = createMock();
const mockGetActiveFeatureSubscriptions = createMock();
const mockGetTotalFeatureCost = createMock();
const mockSubscribeToFeature = createMock();
const mockUnsubscribeFromFeature = createMock();
const mockSubscribeToBundle = createMock();
const mockHasFeatureAccess = createMock();

jest.mock('../../../services/featureService', () => ({
  __esModule: true,
  default: {
    getAvailableFeaturesForOrganization: mockGetAvailableFeaturesForOrg,
    getActiveFeatureSubscriptions: mockGetActiveFeatureSubscriptions,
    getTotalFeatureCost: mockGetTotalFeatureCost,
    subscribeToFeature: mockSubscribeToFeature,
    unsubscribeFromFeature: mockUnsubscribeFromFeature,
    subscribeToBundle: mockSubscribeToBundle,
    hasFeatureAccess: mockHasFeatureAccess,
  },
}));

jest.mock('../../../services/webhookService', () => ({
  __esModule: true,
  default: {
    dispatchEvent: createMock().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    stripe: {
      secretKey: 'sk_test_xxx',
      priceIds: {
        foundation: 'price_foundation',
        essentials: 'price_essentials',
        growth: 'price_growth',
        visionary: 'price_visionary',
      },
    },
    server: {
      clientUrl: 'http://localhost:3000',
    },
  },
}));

jest.mock('../../../config/tiers', () => ({
  __esModule: true,
  TierName: {},
  TIERS: {
    Foundation: { name: 'Foundation' },
    Essentials: { name: 'Essentials' },
    Growth: { name: 'Growth' },
    Visionary: { name: 'Visionary' },
  },
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
  getTier: jest.fn().mockReturnValue({ name: 'Foundation' }),
  getTierIndex: jest.fn().mockImplementation((tier: string) => {
    const order = ['Foundation', 'Essentials', 'Growth', 'Visionary'];
    return order.indexOf(tier);
  }),
  tierAddOns: [
    { id: 'addon-1', name: 'Add-on 1', price: 100, availableForTiers: ['Foundation', 'Essentials'] },
    { id: 'addon-2', name: 'Add-on 2', price: 200, availableForTiers: ['Growth', 'Visionary'] },
  ],
  getAvailableAddOns: jest.fn().mockReturnValue([
    { id: 'addon-1', name: 'Add-on 1', price: 100 },
  ]),
}));

jest.mock('../../../config/features', () => ({
  __esModule: true,
  FEATURES: {},
  FEATURE_BUNDLES: {
    'security-bundle': {
      id: 'security-bundle',
      name: 'Security Bundle',
      availableAsAddOn: true,
      requiresTier: 'Essentials',
    },
  },
  getFeature: jest.fn().mockReturnValue({
    id: 'feature-1',
    name: 'Test Feature',
    description: 'Test description',
  }),
  getBundle: jest.fn().mockReturnValue({
    id: 'security-bundle',
    name: 'Security Bundle',
  }),
}));

import billingController from '../../../controllers/billingController';
import { AppError } from '../../../middleware/errorHandler';

describe('BillingController', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  const mockNext = jest.fn() as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      headers: {},
      params: {},
      query: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };
  });

  describe('createCheckout()', () => {
    it('should throw error for invalid tier', async () => {
      mockRequest.body = { tier: 'InvalidTier' };

      await expect(
        billingController.createCheckout(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error for invalid billing cycle', async () => {
      mockRequest.body = { tier: 'Essentials', billingCycle: 'weekly' };

      await expect(
        billingController.createCheckout(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if organization not found', async () => {
      mockRequest.body = { tier: 'Essentials', billingCycle: 'annual' };
      (prismaMock.organization.findUnique as any).mockResolvedValue(null);

      await expect(
        billingController.createCheckout(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should validate add-ons for tier', async () => {
      mockRequest.body = { tier: 'Foundation', addOns: ['invalid-addon'], billingCycle: 'annual' };

      (prismaMock.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: null,
        users: [{ id: 'user-123' }],
      });

      await expect(
        billingController.createCheckout(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('createPortalSession()', () => {
    it('should create portal session', async () => {
      (prismaMock.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: 'cus_test123',
      });

      mockCreatePortalSession.mockResolvedValue('https://billing.stripe.com/test');

      await billingController.createPortalSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        url: 'https://billing.stripe.com/test',
      });
    });

    it('should throw error if no customer ID', async () => {
      (prismaMock.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: null,
      });

      await expect(
        billingController.createPortalSession(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('webhook()', () => {
    it('should handle Stripe webhook', async () => {
      mockRequest.headers = { 'stripe-signature': 'test-signature' };
      (mockRequest as any).rawBody = Buffer.from('test payload');

      mockHandleWebhook.mockResolvedValue({ processed: false, event: {} });

      await billingController.webhook(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should throw error if signature missing', async () => {
      mockRequest.headers = {};

      await expect(
        billingController.webhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should dispatch webhook events for subscription changes', async () => {
      mockRequest.headers = { 'stripe-signature': 'test-signature' };
      (mockRequest as any).rawBody = Buffer.from('test payload');

      (prismaMock.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
      });

      mockHandleWebhook.mockResolvedValue({
        processed: true,
        event: {
          id: 'evt_123',
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: { organizationId: 'org-123' },
            },
          },
        },
      });

      await billingController.webhook(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('getSubscription()', () => {
    it('should return subscription details', async () => {
      mockGetSubscriptionDetails.mockResolvedValue({
        tier: 'Essentials',
        status: 'active',
        currentPeriodEnd: new Date(),
      });

      await billingController.getSubscription(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: 'Essentials',
          status: 'active',
        })
      );
    });

    it('should throw error if subscription not found', async () => {
      mockGetSubscriptionDetails.mockResolvedValue(null);

      await expect(
        billingController.getSubscription(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getAvailableTiers()', () => {
    it('should return available tiers', async () => {
      mockGetAvailableTiers.mockResolvedValue([
        { name: 'Foundation', price: 8500 },
        { name: 'Essentials', price: 17000 },
      ]);

      await billingController.getAvailableTiers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tiers: expect.any(Array),
          addOns: expect.any(Array),
        })
      );
    });
  });

  describe('previewTierChange()', () => {
    it('should preview tier upgrade', async () => {
      mockRequest.body = { tier: 'Growth', billingCycle: 'annual' };

      mockGetOrganizationTier.mockResolvedValue('Essentials');
      mockCompareTiers.mockReturnValue({ isUpgrade: true, changes: [] });
      mockPreviewTierChange.mockResolvedValue({
        proratedAmount: 500,
        immediateCharge: 500,
      });

      await billingController.previewTierChange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          comparison: expect.any(Object),
          stripePreview: expect.any(Object),
          canDowngrade: true,
        })
      );
    });

    it('should return comparison and preview data', async () => {
      mockRequest.body = { tier: 'Essentials', billingCycle: 'annual' };

      mockGetOrganizationTier.mockResolvedValue('Foundation');
      mockCompareTiers.mockReturnValue({ isUpgrade: true, changes: ['more users'] });
      mockPreviewTierChange.mockResolvedValue({ proratedAmount: 500 });

      await billingController.previewTierChange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          comparison: expect.any(Object),
          stripePreview: expect.any(Object),
        })
      );
    });

    it('should throw error for invalid tier', async () => {
      mockRequest.body = { tier: 'InvalidTier' };

      await expect(
        billingController.previewTierChange(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('changeTier()', () => {
    it('should upgrade tier successfully', async () => {
      mockRequest.body = { tier: 'Growth', billingCycle: 'annual' };

      mockGetOrganizationTier.mockResolvedValue('Essentials');
      mockChangeTier.mockResolvedValue(true);

      await billingController.changeTier(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        newTier: 'Growth',
      });
    });

    it('should handle tier change with valid tier', async () => {
      mockRequest.body = { tier: 'Essentials', billingCycle: 'annual' };

      mockGetOrganizationTier.mockResolvedValue('Foundation');
      mockChangeTier.mockResolvedValue(true);

      await billingController.changeTier(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockChangeTier).toHaveBeenCalled();
    });
  });

  describe('cancelSubscription()', () => {
    it('should cancel subscription at period end', async () => {
      mockRequest.body = { atPeriodEnd: true, reason: 'Too expensive' };

      mockCancelSubscription.mockResolvedValue(true);

      await billingController.cancelSubscription(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('end of the current billing period'),
        })
      );
    });

    it('should cancel subscription immediately', async () => {
      mockRequest.body = { atPeriodEnd: false };

      mockCancelSubscription.mockResolvedValue(true);

      await billingController.cancelSubscription(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('immediately'),
        })
      );
    });
  });

  describe('reactivateSubscription()', () => {
    it('should reactivate canceled subscription', async () => {
      mockReactivateSubscription.mockResolvedValue(true);

      await billingController.reactivateSubscription(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription has been reactivated',
      });
    });
  });

  describe('addAddOn()', () => {
    it('should add add-on to subscription', async () => {
      mockRequest.body = { addOnId: 'addon-1' };

      mockGetOrganizationTier.mockResolvedValue('Foundation');
      mockAddAddOn.mockResolvedValue(true);

      await billingController.addAddOn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          addOn: expect.any(Object),
        })
      );
    });

    it('should throw error for invalid add-on', async () => {
      mockRequest.body = { addOnId: 'invalid-addon' };

      await expect(
        billingController.addAddOn(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if add-on not available for tier', async () => {
      mockRequest.body = { addOnId: 'addon-2' };

      mockGetOrganizationTier.mockResolvedValue('Foundation');

      await expect(
        billingController.addAddOn(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('removeAddOn()', () => {
    it('should remove add-on from subscription', async () => {
      mockRequest.params = { addOnId: 'addon-1' };

      mockRemoveAddOn.mockResolvedValue(true);

      await billingController.removeAddOn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('getUsageMetrics()', () => {
    it('should return usage metrics', async () => {
      mockGetAllUsageMetrics.mockResolvedValue({
        users: 5,
        frameworks: 3,
        risks: 10,
      });
      mockGetUsageVsLimits.mockResolvedValue({
        users: { current: 5, limit: 10, percentage: 50 },
      });

      await billingController.getUsageMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.any(Object),
          limits: expect.any(Object),
        })
      );
    });
  });

  describe('getSubscriptionHistory()', () => {
    it('should return subscription history', async () => {
      mockRequest.query = { limit: '20', offset: '0' };

      (prismaMock.subscriptionHistory.findMany as any).mockResolvedValue([
        { id: 'hist-1', event: 'upgraded', createdAt: new Date() },
      ]);
      (prismaMock.subscriptionHistory.count as any).mockResolvedValue(1);

      await billingController.getSubscriptionHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.any(Array),
          total: 1,
        })
      );
    });
  });

  describe('requestQuote()', () => {
    it('should create custom quote for large organization', async () => {
      mockRequest.body = {
        tier: 'Growth',
        requirements: {
          userCount: 2000,
          features: ['feature-1', 'feature-2'],
          addOns: ['addon-1'],
          billingCycle: 'annual',
        },
      };

      mockCreateQuote.mockResolvedValue({
        id: 'quote-123',
        amount: 100000,
        validUntil: new Date(),
      });

      await billingController.requestQuote(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quote-123',
        })
      );
    });

    it('should throw error if user count too low', async () => {
      mockRequest.body = { tier: 'Growth', requirements: { userCount: 500 } };

      await expect(
        billingController.requestQuote(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if quote creation fails', async () => {
      mockRequest.body = { userCount: 2000 };
      mockCreateQuote.mockResolvedValue(null);

      await expect(
        billingController.requestQuote(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getAvailableFeatures()', () => {
    it('should return available features', async () => {
      mockGetAvailableFeaturesForOrg.mockResolvedValue([
        { id: 'feature-1', name: 'Feature 1' },
        { id: 'feature-2', name: 'Feature 2' },
      ]);

      await billingController.getAvailableFeatures(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        features: expect.any(Array),
      });
    });
  });

  describe('getFeatureSubscriptions()', () => {
    it('should return active feature subscriptions', async () => {
      mockGetActiveFeatureSubscriptions.mockResolvedValue([
        {
          id: 'sub-1',
          featureId: 'feature-1',
          billingCycle: 'annual',
          price: 1000,
          status: 'active',
          startsAt: new Date(),
          endsAt: new Date(),
        },
      ]);
      mockGetTotalFeatureCost.mockResolvedValue(1000);

      await billingController.getFeatureSubscriptions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptions: expect.any(Array),
          totalAnnualCost: 1000,
          totalMonthlyCost: expect.any(Number),
        })
      );
    });
  });

  describe('subscribeToFeature()', () => {
    it('should subscribe to feature', async () => {
      mockRequest.params = { featureId: 'feature-1' };
      mockRequest.body = { billingCycle: 'annual' };

      mockSubscribeToFeature.mockResolvedValue({
        id: 'sub-123',
        featureId: 'feature-1',
        status: 'active',
      });

      await billingController.subscribeToFeature(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        subscription: expect.objectContaining({
          featureId: 'feature-1',
        }),
      });
    });

    it('should throw error for invalid billing cycle', async () => {
      mockRequest.params = { featureId: 'feature-1' };
      mockRequest.body = { billingCycle: 'weekly' };

      await expect(
        billingController.subscribeToFeature(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('unsubscribeFromFeature()', () => {
    it('should unsubscribe from feature', async () => {
      mockRequest.params = { featureId: 'feature-1' };

      mockUnsubscribeFromFeature.mockResolvedValue(undefined);

      await billingController.unsubscribeFromFeature(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Feature subscription cancelled',
      });
    });
  });

  describe('subscribeToBundle()', () => {
    it('should subscribe to feature bundle', async () => {
      mockRequest.params = { bundleId: 'security-bundle' };
      mockRequest.body = { billingCycle: 'annual' };

      mockSubscribeToBundle.mockResolvedValue([
        { id: 'sub-1', featureId: 'feature-1' },
        { id: 'sub-2', featureId: 'feature-2' },
      ]);

      await billingController.subscribeToBundle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        subscriptions: expect.any(Array),
        count: 2,
      });
    });

    it('should throw error for invalid billing cycle', async () => {
      mockRequest.params = { bundleId: 'security-bundle' };
      mockRequest.body = { billingCycle: 'weekly' };

      await expect(
        billingController.subscribeToBundle(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getAvailableBundles()', () => {
    it('should return available bundles for organization tier', async () => {
      (prismaMock.organization.findUnique as any).mockResolvedValue({
        id: 'org-123',
        plan: 'Essentials',
      });

      await billingController.getAvailableBundles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        bundles: expect.any(Array),
      });
    });

    it('should throw error if organization not found', async () => {
      (prismaMock.organization.findUnique as any).mockResolvedValue(null);

      await expect(
        billingController.getAvailableBundles(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('checkFeatureAccess()', () => {
    it('should check feature access', async () => {
      mockRequest.params = { featureId: 'feature-1' };

      mockHasFeatureAccess.mockResolvedValue(true);

      await billingController.checkFeatureAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: true,
          feature: expect.any(Object),
        })
      );
    });

    it('should return false for no access', async () => {
      mockRequest.params = { featureId: 'feature-1' };

      mockHasFeatureAccess.mockResolvedValue(false);

      await billingController.checkFeatureAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: false,
        })
      );
    });
  });
});
