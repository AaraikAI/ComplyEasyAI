/**
 * Feature Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockOrganization } from '../../mocks/prisma';

// Mock the database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
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

// Mock Stripe
const mockStripeSubscriptions = {
  retrieve: jest.fn() as jest.Mock<any>,
};
const mockStripeProducts = {
  create: jest.fn() as jest.Mock<any>,
  search: jest.fn() as jest.Mock<any>,
};
const mockStripePrices = {
  create: jest.fn() as jest.Mock<any>,
  search: jest.fn() as jest.Mock<any>,
};
const mockStripeSubscriptionItems = {
  create: jest.fn() as jest.Mock<any>,
  update: jest.fn() as jest.Mock<any>,
};

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      subscriptions: mockStripeSubscriptions,
      products: mockStripeProducts,
      prices: mockStripePrices,
      subscriptionItems: mockStripeSubscriptionItems,
    })),
  };
});

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    stripe: { secretKey: 'sk_test_mock' },
  },
}));

// Mock features config
jest.mock('../../../config/features', () => ({
  FEATURES: {},
  FEATURE_BUNDLES: {},
  calculateFeaturePrice: jest.fn().mockReturnValue(100),
  getFeature: jest.fn().mockImplementation((id: string) => {
    if (id === 'valid-feature') {
      return {
        id: 'valid-feature',
        name: 'Valid Feature',
        description: 'A valid feature',
        availableAsAddOn: true,
        tierFeatureKey: 'aiContractAnalyzer',
        requiresTier: undefined,
      };
    }
    if (id === 'unavailable-feature') {
      return {
        id: 'unavailable-feature',
        name: 'Unavailable',
        availableAsAddOn: false,
      };
    }
    if (id === 'requires-growth') {
      return {
        id: 'requires-growth',
        name: 'Growth Feature',
        availableAsAddOn: true,
        requiresTier: 'Growth',
      };
    }
    return null;
  }),
  getBundle: jest.fn().mockImplementation((id: string) => {
    if (id === 'valid-bundle') {
      return {
        id: 'valid-bundle',
        name: 'Valid Bundle',
        availableAsAddOn: true,
        featureIds: ['valid-feature'],
        requiresTier: undefined,
      };
    }
    if (id === 'unavailable-bundle') {
      return { id: 'unavailable-bundle', availableAsAddOn: false };
    }
    return null;
  }),
  getAvailableFeatures: jest.fn().mockReturnValue([
    {
      id: 'valid-feature',
      name: 'Valid Feature',
      availableAsAddOn: true,
      tierFeatureKey: 'aiContractAnalyzer',
    },
  ]),
  getAvailableBundles: jest.fn().mockReturnValue([]),
}));

jest.mock('../../../config/tiers', () => ({
  getTier: jest.fn().mockReturnValue({
    name: 'Foundation',
    features: { aiContractAnalyzer: false },
    limits: {},
  }),
  getTierIndex: jest.fn().mockImplementation((tier: string) => {
    const map: Record<string, number> = { Foundation: 0, Essentials: 1, Growth: 2, Visionary: 3 };
    return map[tier] ?? 0;
  }),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
}));

// Import after mocking
import featureService from '../../../services/featureService';
import { getFeature } from '../../../config/features';

// Helpers
const mockFeatureSubscription = (overrides: Record<string, unknown> = {}) => ({
  id: 'fs-1',
  organizationId: 'org-123',
  featureId: 'valid-feature',
  status: 'active',
  billingCycle: 'annual',
  price: 100,
  startsAt: new Date(),
  endsAt: null,
  stripeSubscriptionItemId: 'si_123',
  stripePriceId: 'price_123',
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('FeatureService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-set mock implementations (cleared by jest config resetMocks: true)
    const features = require('../../../config/features');
    features.getFeature.mockImplementation((id: string) => {
      if (id === 'valid-feature') {
        return {
          id: 'valid-feature',
          name: 'Valid Feature',
          description: 'A valid feature',
          availableAsAddOn: true,
          tierFeatureKey: 'aiContractAnalyzer',
          requiresTier: undefined,
        };
      }
      if (id === 'unavailable-feature') {
        return { id: 'unavailable-feature', name: 'Unavailable', availableAsAddOn: false };
      }
      if (id === 'requires-growth') {
        return { id: 'requires-growth', name: 'Growth Feature', availableAsAddOn: true, requiresTier: 'Growth' };
      }
      return null;
    });
    features.getAvailableFeatures.mockReturnValue([
      { id: 'valid-feature', name: 'Valid Feature', availableAsAddOn: true, tierFeatureKey: 'aiContractAnalyzer' },
    ]);
    features.getAvailableBundles.mockReturnValue([]);
    features.calculateFeaturePrice.mockReturnValue(100);
    features.getBundle.mockImplementation((id: string) => {
      if (id === 'valid-bundle') {
        return { id: 'valid-bundle', name: 'Valid Bundle', availableAsAddOn: true, featureIds: ['valid-feature'], requiresTier: undefined };
      }
      if (id === 'unavailable-bundle') {
        return { id: 'unavailable-bundle', availableAsAddOn: false };
      }
      return null;
    });

    const tiers = require('../../../config/tiers');
    tiers.getTier.mockReturnValue({
      name: 'Foundation',
      features: { aiContractAnalyzer: false },
      limits: {},
    });
    tiers.getTierIndex.mockImplementation((tier: string) => {
      const map: Record<string, number> = { Foundation: 0, Essentials: 1, Growth: 2, Visionary: 3 };
      return map[tier] ?? 0;
    });

    // Re-establish Stripe constructor mock (cleared by resetMocks)
    const Stripe = require('stripe').default;
    Stripe.mockImplementation(() => ({
      subscriptions: mockStripeSubscriptions,
      products: mockStripeProducts,
      prices: mockStripePrices,
      subscriptionItems: mockStripeSubscriptionItems,
    }));

    // Re-establish $transaction mock (cleared by resetMocks)
    (prismaMock.$transaction as jest.Mock<any>).mockImplementation(
      (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)
    );
  });

  // ======================================================================
  // getAvailableFeaturesForOrganization
  // ======================================================================
  describe('getAvailableFeaturesForOrganization()', () => {
    it('should return available features for an organization', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findMany.mockResolvedValue([]);

      const result = await featureService.getAvailableFeaturesForOrganization('org-123');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('feature');
      expect(result[0]).toHaveProperty('isIncluded');
      expect(result[0]).toHaveProperty('isSubscribed');
      expect(result[0]).toHaveProperty('currentPrice');
      expect(result[0]).toHaveProperty('canSubscribe');
    });

    it('should mark subscribed features', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findMany.mockResolvedValue([
        mockFeatureSubscription() as any,
      ]);

      const result = await featureService.getAvailableFeaturesForOrganization('org-123');

      const subscribedFeature = result.find(f => f.feature.id === 'valid-feature');
      expect(subscribedFeature?.isSubscribed).toBe(true);
      expect(subscribedFeature?.canSubscribe).toBe(false);
    });

    it('should throw when organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(
        featureService.getAvailableFeaturesForOrganization('nonexistent')
      ).rejects.toThrow('Organization not found');
    });
  });

  // ======================================================================
  // getActiveFeatureSubscriptions
  // ======================================================================
  describe('getActiveFeatureSubscriptions()', () => {
    it('should return active subscriptions', async () => {
      const subs = [mockFeatureSubscription()];
      prismaMock.featureSubscription.findMany.mockResolvedValue(subs as any);

      const result = await featureService.getActiveFeatureSubscriptions('org-123');

      expect(result).toHaveLength(1);
      expect(prismaMock.featureSubscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            status: 'active',
          }),
        })
      );
    });
  });

  // ======================================================================
  // subscribeToFeature
  // ======================================================================
  describe('subscribeToFeature()', () => {
    it('should subscribe to a valid feature', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({
          plan: 'Foundation',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
        }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      mockStripeSubscriptions.retrieve.mockResolvedValue({ id: 'sub_123' });
      mockStripeProducts.search.mockResolvedValue({ data: [] });
      mockStripeProducts.create.mockResolvedValue({ id: 'prod_123' });
      mockStripePrices.search.mockResolvedValue({ data: [] });
      mockStripePrices.create.mockResolvedValue({ id: 'price_123' });
      mockStripeSubscriptionItems.create.mockResolvedValue({ id: 'si_123' });

      const sub = mockFeatureSubscription();
      prismaMock.featureSubscription.create.mockResolvedValue(sub as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await featureService.subscribeToFeature('org-123', 'valid-feature', 'annual');

      expect(result.featureId).toBe('valid-feature');
      expect(result.status).toBe('active');
      expect(prismaMock.featureSubscription.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledTimes(1);
    });

    it('should throw for invalid feature', async () => {
      await expect(
        featureService.subscribeToFeature('org-123', 'nonexistent', 'annual')
      ).rejects.toThrow('Feature not available as add-on');
    });

    it('should throw for feature not available as add-on', async () => {
      await expect(
        featureService.subscribeToFeature('org-123', 'unavailable-feature', 'annual')
      ).rejects.toThrow('Feature not available as add-on');
    });

    it('should throw when organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(
        featureService.subscribeToFeature('nonexistent', 'valid-feature', 'annual')
      ).rejects.toThrow('Organization not found');
    });

    it('should throw when no Stripe subscription', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation', stripeCustomerId: null, stripeSubscriptionId: null }) as any
      );

      await expect(
        featureService.subscribeToFeature('org-123', 'valid-feature', 'annual')
      ).rejects.toThrow('Organization does not have an active Stripe subscription');
    });

    it('should throw when tier requirement not met', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({
          plan: 'Foundation',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
        }) as any
      );

      await expect(
        featureService.subscribeToFeature('org-123', 'requires-growth', 'annual')
      ).rejects.toThrow('Feature requires Growth tier or higher');
    });

    it('should throw when feature already subscribed', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({
          plan: 'Foundation',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
        }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue(mockFeatureSubscription() as any);

      await expect(
        featureService.subscribeToFeature('org-123', 'valid-feature', 'annual')
      ).rejects.toThrow('Feature already subscribed');
    });
  });

  // ======================================================================
  // unsubscribeFromFeature
  // ======================================================================
  describe('unsubscribeFromFeature()', () => {
    it('should cancel a feature subscription', async () => {
      const sub = mockFeatureSubscription();
      prismaMock.featureSubscription.findFirst.mockResolvedValue(sub as any);
      prismaMock.featureSubscription.update.mockResolvedValue({ ...sub, cancelAtPeriodEnd: true } as any);
      prismaMock.organization.findUnique.mockResolvedValue(createMockOrganization() as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);
      mockStripeSubscriptionItems.update.mockResolvedValue({});

      await featureService.unsubscribeFromFeature('org-123', 'valid-feature');

      expect(prismaMock.featureSubscription.update).toHaveBeenCalledWith({
        where: { id: 'fs-1' },
        data: expect.objectContaining({
          cancelAtPeriodEnd: true,
        }),
      });
    });

    it('should throw when subscription not found', async () => {
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      await expect(
        featureService.unsubscribeFromFeature('org-123', 'nonexistent')
      ).rejects.toThrow('Feature subscription not found');
    });
  });

  // ======================================================================
  // hasFeatureAccess
  // ======================================================================
  describe('hasFeatureAccess()', () => {
    it('should return false when organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await featureService.hasFeatureAccess('nonexistent', 'valid-feature');

      expect(result).toBe(false);
    });

    it('should return false for unknown feature', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );

      const result = await featureService.hasFeatureAccess('org-123', 'unknown-feature');

      expect(result).toBe(false);
    });

    it('should return true when feature is subscribed as add-on', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue(mockFeatureSubscription() as any);

      const result = await featureService.hasFeatureAccess('org-123', 'valid-feature');

      expect(result).toBe(true);
    });

    it('should return false when not included in tier and not subscribed', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        createMockOrganization({ plan: 'Foundation' }) as any
      );
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      const result = await featureService.hasFeatureAccess('org-123', 'valid-feature');

      expect(result).toBe(false);
    });
  });

  // ======================================================================
  // getFeatureSubscription
  // ======================================================================
  describe('getFeatureSubscription()', () => {
    it('should return active feature subscription', async () => {
      const sub = mockFeatureSubscription();
      prismaMock.featureSubscription.findFirst.mockResolvedValue(sub as any);

      const result = await featureService.getFeatureSubscription('org-123', 'valid-feature');

      expect(result).toBeTruthy();
      expect(result!.featureId).toBe('valid-feature');
    });

    it('should return null when no active subscription', async () => {
      prismaMock.featureSubscription.findFirst.mockResolvedValue(null);

      const result = await featureService.getFeatureSubscription('org-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ======================================================================
  // subscribeToBundle
  // ======================================================================
  describe('subscribeToBundle()', () => {
    it('should throw for invalid bundle', async () => {
      await expect(
        featureService.subscribeToBundle('org-123', 'nonexistent', 'annual')
      ).rejects.toThrow('Bundle not available as add-on');
    });

    it('should throw for bundle not available as add-on', async () => {
      await expect(
        featureService.subscribeToBundle('org-123', 'unavailable-bundle', 'annual')
      ).rejects.toThrow('Bundle not available as add-on');
    });

    it('should throw when organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(
        featureService.subscribeToBundle('nonexistent', 'valid-bundle', 'annual')
      ).rejects.toThrow('Organization not found');
    });
  });

  // ======================================================================
  // getTotalFeatureCost
  // ======================================================================
  describe('getTotalFeatureCost()', () => {
    it('should calculate total cost for matching billing cycle', async () => {
      prismaMock.featureSubscription.findMany.mockResolvedValue([
        mockFeatureSubscription({ price: 100, billingCycle: 'annual' }) as any,
        mockFeatureSubscription({ id: 'fs-2', price: 50, billingCycle: 'annual' }) as any,
      ]);

      const result = await featureService.getTotalFeatureCost('org-123', 'annual');

      expect(result).toBe(150);
    });

    it('should convert annual to monthly', async () => {
      prismaMock.featureSubscription.findMany.mockResolvedValue([
        mockFeatureSubscription({ price: 120, billingCycle: 'annual' }) as any,
      ]);

      const result = await featureService.getTotalFeatureCost('org-123', 'monthly');

      expect(result).toBe(10);
    });

    it('should convert monthly to annual', async () => {
      prismaMock.featureSubscription.findMany.mockResolvedValue([
        mockFeatureSubscription({ price: 10, billingCycle: 'monthly' }) as any,
      ]);

      const result = await featureService.getTotalFeatureCost('org-123', 'annual');

      expect(result).toBe(120);
    });

    it('should return 0 when no subscriptions', async () => {
      prismaMock.featureSubscription.findMany.mockResolvedValue([]);

      const result = await featureService.getTotalFeatureCost('org-123', 'annual');

      expect(result).toBe(0);
    });
  });
});
