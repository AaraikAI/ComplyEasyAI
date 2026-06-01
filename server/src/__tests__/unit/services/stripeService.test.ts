/**
 * Stripe Service Unit Tests
 *
 * Comprehensive tests for subscription management, payments,
 * webhooks, tier changes, add-ons, refunds, and quotes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock Stripe
const mockCustomersCreate = jest.fn() as jest.Mock<any>;
const mockCheckoutSessionsCreate = jest.fn() as jest.Mock<any>;
const mockBillingPortalSessionsCreate = jest.fn() as jest.Mock<any>;
const mockWebhooksConstructEvent = jest.fn() as jest.Mock<any>;
const mockSubscriptionsRetrieve = jest.fn() as jest.Mock<any>;
const mockSubscriptionsUpdate = jest.fn() as jest.Mock<any>;
const mockSubscriptionsCancel = jest.fn() as jest.Mock<any>;
const mockSubscriptionItemsCreate = jest.fn() as jest.Mock<any>;
const mockSubscriptionItemsDel = jest.fn() as jest.Mock<any>;
const mockInvoicesRetrieveUpcoming = jest.fn() as jest.Mock<any>;
const mockInvoicesCreatePreview = jest.fn() as jest.Mock<any>;
const mockRefundsCreate = jest.fn() as jest.Mock<any>;
const mockProductsCreate = jest.fn() as jest.Mock<any>;
const mockProductsSearch = jest.fn() as jest.Mock<any>;
const mockPricesCreate = jest.fn() as jest.Mock<any>;
const mockQuotesCreate = jest.fn() as jest.Mock<any>;
const mockQuotesFinalizeQuote = jest.fn() as jest.Mock<any>;

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockCustomersCreate,
    },
    checkout: {
      sessions: {
        create: mockCheckoutSessionsCreate,
      },
    },
    billingPortal: {
      sessions: {
        create: mockBillingPortalSessionsCreate,
      },
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
    subscriptions: {
      retrieve: mockSubscriptionsRetrieve,
      update: mockSubscriptionsUpdate,
      cancel: mockSubscriptionsCancel,
    },
    subscriptionItems: {
      create: mockSubscriptionItemsCreate,
      del: mockSubscriptionItemsDel,
    },
    invoices: {
      retrieveUpcoming: mockInvoicesRetrieveUpcoming,
      createPreview: mockInvoicesCreatePreview,
    },
    refunds: {
      create: mockRefundsCreate,
    },
    products: {
      create: mockProductsCreate,
      search: mockProductsSearch,
    },
    prices: {
      create: mockPricesCreate,
    },
    quotes: {
      create: mockQuotesCreate,
      finalizeQuote: mockQuotesFinalizeQuote,
    },
  }));
});

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../services/notificationService', () => ({
  __esModule: true,
  default: {
    sendNotification: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../config', () => {
  // Set env vars for Stripe price IDs before stripeService module loads
  process.env.STRIPE_ESSENTIALS_MONTHLY_PRICE_ID = 'price_essentials_monthly';
  process.env.STRIPE_ESSENTIALS_ANNUAL_PRICE_ID = 'price_essentials_annual';
  process.env.STRIPE_FOUNDATION_MONTHLY_PRICE_ID = 'price_foundation_monthly';
  process.env.STRIPE_FOUNDATION_ANNUAL_PRICE_ID = 'price_foundation_annual';
  process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID = 'price_growth_monthly';
  process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID = 'price_growth_annual';
  process.env.STRIPE_VISIONARY_MONTHLY_PRICE_ID = 'price_visionary_monthly';
  process.env.STRIPE_VISIONARY_ANNUAL_PRICE_ID = 'price_visionary_annual';
  process.env.STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID = 'price_addon_frameworks';
  process.env.STRIPE_ADDON_VCISO_PRICE_ID = 'price_addon_vciso';
  return {
    __esModule: true,
    default: {
      stripe: {
        secretKey: 'sk_test_key',
        webhookSecret: 'whsec_test_secret',
      },
    },
  };
});

// Add stripeEvent and other models to prismaMock
const createStripeEventMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;
(prismaMock as any).stripeEvent = {
  create: createStripeEventMockFn(),
  update: createStripeEventMockFn(),
  upsert: createStripeEventMockFn(),
  findUnique: createStripeEventMockFn(),
};
(prismaMock as any).featureSubscription = {
  create: createStripeEventMockFn(),
  update: createStripeEventMockFn(),
  findUnique: createStripeEventMockFn(),
};

import stripeService from '../../../services/stripeService';

// Mock data factories
const createMockOrganization = (overrides: Record<string, unknown> = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  plan: 'Essentials',
  billingCycle: 'annual',
  subscriptionStatus: 'active',
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
  subscriptionStartedAt: new Date('2024-01-01'),
  subscriptionEndsAt: new Date('2025-01-01'),
  trialEndsAt: null,
  cancelAtPeriodEnd: false,
  activeAddOns: [],
  users: [{ id: 'user-001' }],
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const createMockSubscription = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
  cancel_at_period_end: false,
  trial_end: null,
  items: {
    data: [
      {
        id: 'si_test123',
        price: { id: 'price_essentials_annual' },
      },
    ],
  },
  metadata: { organizationId: 'org-123', tierName: 'Essentials', billingCycle: 'annual' },
  start_date: Math.floor(Date.now() / 1000),
  ...overrides,
});

describe('StripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish $transaction mock cleared by resetMocks: true in jest config
    (prismaMock.$transaction as jest.Mock<any>).mockImplementation(
      (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)
    );
  });

  // ===========================================================================
  // Customer Creation Tests
  // ===========================================================================
  describe('createCustomer()', () => {
    it('should create Stripe customer', async () => {
      const email = 'customer@example.com';
      const name = 'Test Customer';
      const organizationId = 'org-123';

      const mockCustomer = {
        id: 'cus_test123',
        email,
        name,
      };

      mockCustomersCreate.mockResolvedValue(mockCustomer);
      prismaMock.organization.update.mockResolvedValue({} as any);

      const result = await stripeService.createCustomer(email, name, organizationId);

      expect(result).toBe('cus_test123');
      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          name,
          metadata: { organizationId },
        })
      );
      expect(prismaMock.organization.update).toHaveBeenCalled();
    });

    it('should include additional metadata when provided', async () => {
      mockCustomersCreate.mockResolvedValue({ id: 'cus_test123' });
      prismaMock.organization.update.mockResolvedValue({} as any);

      await stripeService.createCustomer(
        'test@example.com',
        'Test',
        'org-123',
        { industry: 'Healthcare', employees: '100-500' }
      );

      expect(mockCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            organizationId: 'org-123',
            industry: 'Healthcare',
            employees: '100-500',
          }),
        })
      );
    });

    it('should handle Stripe API errors', async () => {
      mockCustomersCreate.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        stripeService.createCustomer('test@example.com', 'Test', 'org-123')
      ).rejects.toThrow('Failed to create customer');
    });
  });

  // ===========================================================================
  // Checkout Session Tests
  // ===========================================================================
  describe('createCheckoutSession()', () => {
    it('should create checkout session', async () => {
      const options = {
        tierName: 'Essentials' as const,
        billingCycle: 'monthly' as const,
        customerEmail: 'customer@example.com',
        organizationId: 'org-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      };

      mockCheckoutSessionsCreate.mockResolvedValue(mockSession);

      const result = await stripeService.createCheckoutSession(options);

      expect(result).toBe('https://checkout.stripe.com/test');
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          payment_method_types: ['card'],
        })
      );
    });

    it('should include customer ID when provided', async () => {
      const options = {
        tierName: 'Essentials' as const,
        billingCycle: 'monthly' as const,
        customerId: 'cus_test123',
        customerEmail: 'customer@example.com',
        organizationId: 'org-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      mockCheckoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com' });

      await stripeService.createCheckoutSession(options);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: options.customerId,
        })
      );
    });

    it('should include trial days when specified', async () => {
      const options = {
        tierName: 'Growth' as const,
        billingCycle: 'annual' as const,
        customerEmail: 'customer@example.com',
        organizationId: 'org-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        trialDays: 14,
      };

      mockCheckoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com' });

      await stripeService.createCheckoutSession(options);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        })
      );
    });

    it('should include coupon when provided', async () => {
      const options = {
        tierName: 'Essentials' as const,
        billingCycle: 'annual' as const,
        customerEmail: 'customer@example.com',
        organizationId: 'org-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        couponCode: 'LAUNCH20',
      };

      mockCheckoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com' });

      await stripeService.createCheckoutSession(options);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ coupon: 'LAUNCH20' }],
        })
      );
    });

    it('should handle API errors', async () => {
      mockCheckoutSessionsCreate.mockRejectedValue(new Error('API error'));

      await expect(
        stripeService.createCheckoutSession({
          tierName: 'Essentials',
          billingCycle: 'monthly',
          customerEmail: 'test@example.com',
          organizationId: 'org-123',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Failed to create checkout session');
    });
  });

  // ===========================================================================
  // Billing Portal Tests
  // ===========================================================================
  describe('createPortalSession()', () => {
    it('should create billing portal session', async () => {
      const customerId = 'cus_test123';
      const returnUrl = 'https://example.com/return';

      const mockSession = {
        url: 'https://billing.stripe.com/test',
      };

      mockBillingPortalSessionsCreate.mockResolvedValue(mockSession);

      const result = await stripeService.createPortalSession(customerId, returnUrl);

      expect(result).toBe('https://billing.stripe.com/test');
      expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
        customer: customerId,
        return_url: returnUrl,
      });
    });

    it('should handle errors', async () => {
      mockBillingPortalSessionsCreate.mockRejectedValue(new Error('Portal error'));

      await expect(
        stripeService.createPortalSession('cus_test123', 'https://example.com')
      ).rejects.toThrow('Failed to create billing portal session');
    });
  });

  // ===========================================================================
  // Subscription Details Tests
  // ===========================================================================
  describe('getSubscriptionDetails()', () => {
    it('should return subscription details for organization', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockInvoicesCreatePreview.mockResolvedValue({ amount_due: 170000 });

      const result = await stripeService.getSubscriptionDetails('org-123');

      expect(result).toBeDefined();
      expect(result?.tier).toBe('Essentials');
      expect(result?.status).toBe('active');
      expect(result?.billingCycle).toBe('annual');
      expect(result?.nextInvoiceAmount).toBe(1700);
    });

    it('should return null for non-existent organization', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await stripeService.getSubscriptionDetails('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle missing Stripe customer gracefully', async () => {
      const mockOrg = createMockOrganization({ stripeCustomerId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      const result = await stripeService.getSubscriptionDetails('org-123');

      expect(result).toBeDefined();
      expect(result?.nextInvoiceAmount).toBeNull();
    });

    it('should include user count in usage', async () => {
      const mockOrg = createMockOrganization({
        users: [{ id: 'user-001' }, { id: 'user-002' }, { id: 'user-003' }],
      });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      const result = await stripeService.getSubscriptionDetails('org-123');

      expect(result?.usage.users).toBe(3);
    });
  });

  // ===========================================================================
  // Tier Change Preview Tests
  // ===========================================================================
  describe('previewTierChange()', () => {
    it('should return upgrade preview', async () => {
      const mockOrg = createMockOrganization({ plan: 'Essentials' });
      const mockSub = createMockSubscription();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(mockSub);
      mockInvoicesCreatePreview.mockResolvedValue({
        amount_due: 25000, // $250 prorated charge
      });

      const result = await stripeService.previewTierChange('org-123', 'Growth', 'annual');

      expect(result).toBeDefined();
      expect(result?.currentTier).toBe('Essentials');
      expect(result?.targetTier).toBe('Growth');
      expect(result?.proratedAmount).toBe(250);
    });

    it('should return null when no subscription exists', async () => {
      const mockOrg = createMockOrganization({ stripeSubscriptionId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      const result = await stripeService.previewTierChange('org-123', 'Growth');

      expect(result).toBeNull();
    });

    it('should return null for invalid price ID', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(createMockSubscription());

      // Simulate invalid price by returning null for invoice preview
      mockInvoicesCreatePreview.mockRejectedValue(new Error('Invalid price'));

      const result = await stripeService.previewTierChange('org-123', 'Growth');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // Tier Change Tests
  // ===========================================================================
  describe('changeTier()', () => {
    it('should upgrade subscription tier', async () => {
      const mockOrg = createMockOrganization({ plan: 'Essentials' });
      const mockSub = createMockSubscription();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(mockSub);
      mockSubscriptionsUpdate.mockResolvedValue({ ...mockSub, metadata: { tierName: 'Growth' } });
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.changeTier('org-123', 'Growth', 'annual');

      expect(result).toBe(true);
      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          proration_behavior: 'create_prorations',
          metadata: expect.objectContaining({
            tierName: 'Growth',
            previousTier: 'Essentials',
          }),
        })
      );
      expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'upgrade',
          }),
        })
      );
    });

    it('should downgrade subscription tier', async () => {
      const mockOrg = createMockOrganization({ plan: 'Growth' });
      const mockSub = createMockSubscription();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(mockSub);
      mockSubscriptionsUpdate.mockResolvedValue(mockSub);
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.changeTier('org-123', 'Essentials', 'annual');

      expect(result).toBe(true);
      expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'downgrade',
          }),
        })
      );
    });

    it('should throw error when no subscription exists', async () => {
      const mockOrg = createMockOrganization({ stripeSubscriptionId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.changeTier('org-123', 'Growth')
      ).rejects.toThrow('Failed to change subscription tier');
    });

    it('should support deferred billing (no immediate proration)', async () => {
      const mockOrg = createMockOrganization();
      const mockSub = createMockSubscription();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(mockSub);
      mockSubscriptionsUpdate.mockResolvedValue(mockSub);
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      await stripeService.changeTier('org-123', 'Growth', 'annual', false);

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          proration_behavior: 'none',
        })
      );
    });
  });

  // ===========================================================================
  // Subscription Cancellation Tests
  // ===========================================================================
  describe('cancelSubscription()', () => {
    it('should cancel subscription at period end', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsUpdate.mockResolvedValue({});
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.cancelSubscription('org-123', true, 'Too expensive');

      expect(result).toBe(true);
      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
        metadata: { cancelReason: 'Too expensive' },
      });
      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { cancelAtPeriodEnd: true },
        })
      );
    });

    it('should cancel subscription immediately', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsCancel.mockResolvedValue({});
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.cancelSubscription('org-123', false);

      expect(result).toBe(true);
      expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_test123');
      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan: 'Foundation',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          }),
        })
      );
    });

    it('should throw error when no subscription exists', async () => {
      const mockOrg = createMockOrganization({ stripeSubscriptionId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.cancelSubscription('org-123')
      ).rejects.toThrow('Failed to cancel subscription');
    });
  });

  // ===========================================================================
  // Subscription Reactivation Tests
  // ===========================================================================
  describe('reactivateSubscription()', () => {
    it('should reactivate a canceled subscription', async () => {
      const mockOrg = createMockOrganization({ cancelAtPeriodEnd: true });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsUpdate.mockResolvedValue({});
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.reactivateSubscription('org-123');

      expect(result).toBe(true);
      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: false,
      });
      expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'reactivation',
          }),
        })
      );
    });

    it('should throw error when no subscription exists', async () => {
      const mockOrg = createMockOrganization({ stripeSubscriptionId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.reactivateSubscription('org-123')
      ).rejects.toThrow('Failed to reactivate subscription');
    });
  });

  // ===========================================================================
  // Add-on Management Tests
  // ===========================================================================
  describe('addAddOn()', () => {
    it('should add an add-on to subscription', async () => {
      const mockOrg = createMockOrganization({ activeAddOns: [] });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionItemsCreate.mockResolvedValue({ id: 'si_addon' });
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.addAddOn('org-123', 'custom-frameworks');

      expect(result).toBe(true);
      expect(mockSubscriptionItemsCreate).toHaveBeenCalledWith({
        subscription: 'sub_test123',
        price: 'price_addon_frameworks',
        quantity: 1,
      });
      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activeAddOns: ['custom-frameworks'],
          }),
        })
      );
    });

    it('should not duplicate existing add-on', async () => {
      const mockOrg = createMockOrganization({ activeAddOns: ['custom-frameworks'] });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionItemsCreate.mockResolvedValue({ id: 'si_addon' });
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      await stripeService.addAddOn('org-123', 'custom-frameworks');

      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent add-on', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.addAddOn('org-123', 'nonexistent-addon')
      ).rejects.toThrow('Failed to add add-on');
    });

    it('should throw error when no subscription exists', async () => {
      const mockOrg = createMockOrganization({ stripeSubscriptionId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.addAddOn('org-123', 'custom-frameworks')
      ).rejects.toThrow('Failed to add add-on');
    });
  });

  describe('removeAddOn()', () => {
    it('should remove an add-on from subscription', async () => {
      const mockOrg = createMockOrganization({ activeAddOns: ['custom-frameworks', 'vciso-service'] });
      const mockSub = createMockSubscription({
        items: {
          data: [
            { id: 'si_main', price: { id: 'price_essentials_annual' } },
            { id: 'si_addon', price: { id: 'price_addon_frameworks' } },
          ],
        },
      });

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(mockSub);
      mockSubscriptionItemsDel.mockResolvedValue({});
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.removeAddOn('org-123', 'custom-frameworks');

      expect(result).toBe(true);
      expect(mockSubscriptionItemsDel).toHaveBeenCalledWith('si_addon');
      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activeAddOns: ['vciso-service'],
          }),
        })
      );
    });
  });

  // ===========================================================================
  // Refund Processing Tests
  // ===========================================================================
  describe('processRefund()', () => {
    it('should process a full refund with charge ID', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockRefundsCreate.mockResolvedValue({
        id: 're_test123',
        amount: 170000,
        currency: 'usd',
        status: 'succeeded',
      });
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.processRefund({
        organizationId: 'org-123',
        chargeId: 'ch_test123',
        reason: 'requested_by_customer',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('re_test123');
      expect(mockRefundsCreate).toHaveBeenCalledWith({
        charge: 'ch_test123',
        reason: 'requested_by_customer',
      });
    });

    it('should process a partial refund', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockRefundsCreate.mockResolvedValue({
        id: 're_test123',
        amount: 50000,
        currency: 'usd',
        status: 'succeeded',
      });
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const result = await stripeService.processRefund({
        organizationId: 'org-123',
        paymentIntentId: 'pi_test123',
        amount: 50000, // Partial refund
      });

      expect(result).toBeDefined();
      expect(mockRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 50000,
        reason: 'requested_by_customer',
      });
    });

    it('should throw error when no charge or payment intent provided', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.processRefund({ organizationId: 'org-123' })
      ).rejects.toThrow('Either chargeId or paymentIntentId is required');
    });

    it('should throw error when organization has no Stripe customer', async () => {
      const mockOrg = createMockOrganization({ stripeCustomerId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      await expect(
        stripeService.processRefund({ organizationId: 'org-123', chargeId: 'ch_test' })
      ).rejects.toThrow('No Stripe customer found for organization');
    });
  });

  // ===========================================================================
  // Quote Creation Tests
  // ===========================================================================
  describe('createQuote()', () => {
    it('should create a custom quote for Visionary tier', async () => {
      const mockOrg = createMockOrganization();
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockProductsCreate.mockResolvedValue({ id: 'prod_custom' });
      mockPricesCreate.mockResolvedValue({ id: 'price_custom' });
      mockQuotesCreate.mockResolvedValue({ id: 'qt_test123' });
      mockQuotesFinalizeQuote.mockResolvedValue({
        id: 'qt_test123',
        pdf: 'https://stripe.com/quote.pdf',
      });

      const result = await stripeService.createQuote('org-123', {
        userCount: 2000,
        features: ['sso', 'api-access'],
        addOns: ['custom-frameworks'],
        billingCycle: 'annual',
      });

      expect(result).toBeDefined();
      expect(result?.quoteId).toBe('qt_test123');
      expect(result?.url).toBe('https://stripe.com/quote.pdf');
      expect(mockProductsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('Custom'),
        })
      );
    });

    it('should return null when organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await stripeService.createQuote('nonexistent', {
        userCount: 1000,
        features: [],
        addOns: [],
        billingCycle: 'annual',
      });

      expect(result).toBeNull();
    });

    it('should return null when customer not found', async () => {
      const mockOrg = createMockOrganization({ stripeCustomerId: null });
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);

      const result = await stripeService.createQuote('org-123', {
        userCount: 1000,
        features: [],
        addOns: [],
        billingCycle: 'annual',
      });

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // Webhook Handler Tests
  // ===========================================================================
  describe('handleWebhook()', () => {
    describe('checkout.session.completed', () => {
      it('should handle checkout completed event', async () => {
        const mockEvent = {
          id: 'evt_test123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test123',
              customer: 'cus_test123',
              customer_email: 'test@example.com',
              subscription: 'sub_test123',
              amount_total: 170000,
              metadata: {
                organizationId: 'org-123',
                tierName: 'Essentials',
                billingCycle: 'annual',
                addOns: '[]',
              },
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.findUnique.mockResolvedValue(
          createMockOrganization({ users: [{ email: 'admin@test.com' }] }) as any
        );
        mockSubscriptionsRetrieve.mockResolvedValue(createMockSubscription());
        prismaMock.organization.update.mockResolvedValue({} as any);
        prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

        await stripeService.handleWebhook(Buffer.from('test'), 'signature');

        expect(prismaMock.organization.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              stripeCustomerId: 'cus_test123',
              plan: 'Essentials',
              subscriptionStatus: 'active',
            }),
          })
        );
      });
    });

    describe('customer.subscription.created', () => {
      it('should handle subscription created event', async () => {
        const payload = Buffer.from('test payload');
        const signature = 'test signature';

        const mockEvent = {
          id: 'evt_test123',
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
              status: 'active',
              metadata: { organizationId: 'org-123', tierName: 'Essentials' },
              start_date: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
              trial_end: null,
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.update.mockResolvedValue({} as any);

        await stripeService.handleWebhook(payload, signature);

        expect(prismaMock.organization.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              stripeSubscriptionId: 'sub_test123',
              subscriptionStatus: 'active',
            }),
          })
        );
      });
    });

    describe('customer.subscription.updated', () => {
      it('should handle subscription updated event', async () => {
        const payload = Buffer.from('test');
        const signature = 'test';

        const mockEvent = {
          id: 'evt_test456',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
              status: 'canceled',
              metadata: {},
              items: { data: [{ price: { id: 'price_essentials_annual' } }] },
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
              cancel_at_period_end: false,
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.findUnique.mockResolvedValue({
          id: 'org-123',
          plan: 'Essentials',
          subscriptionStatus: 'active',
        } as any);
        prismaMock.organization.update.mockResolvedValue({} as any);
        prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

        await stripeService.handleWebhook(payload, signature);

        expect(prismaMock.organization.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              subscriptionStatus: 'canceled',
            }),
          })
        );
      });
    });

    describe('customer.subscription.deleted', () => {
      it('should handle subscription deleted event', async () => {
        const mockEvent = {
          id: 'evt_test789',
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.findUnique.mockResolvedValue(createMockOrganization() as any);
        prismaMock.organization.update.mockResolvedValue({} as any);
        prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

        await stripeService.handleWebhook(Buffer.from('test'), 'signature');

        expect(prismaMock.organization.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              plan: 'Foundation',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
              activeAddOns: [],
            }),
          })
        );
      });
    });

    describe('invoice.payment_succeeded', () => {
      it('should handle payment succeeded for past_due subscription', async () => {
        const mockEvent = {
          id: 'evt_payment',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.findUnique.mockResolvedValue(
          createMockOrganization({ subscriptionStatus: 'past_due' }) as any
        );
        prismaMock.organization.update.mockResolvedValue({} as any);
        prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

        await stripeService.handleWebhook(Buffer.from('test'), 'signature');

        expect(prismaMock.organization.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { subscriptionStatus: 'active' },
          })
        );
        expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              changeType: 'payment_recovered',
            }),
          })
        );
      });
    });

    describe('invoice.payment_failed', () => {
      it('should handle payment failed event', async () => {
        const mockEvent = {
          id: 'evt_payment_failed',
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.findUnique.mockResolvedValue(createMockOrganization() as any);
        prismaMock.organization.update.mockResolvedValue({} as any);
        prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);
        prismaMock.user.findMany.mockResolvedValue([{ id: 'user-001', email: 'admin@test.com' }] as any);

        await stripeService.handleWebhook(Buffer.from('test'), 'signature');

        expect(prismaMock.organization.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { subscriptionStatus: 'past_due' },
          })
        );
        expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              changeType: 'payment_failed',
            }),
          })
        );
      });
    });

    describe('customer.subscription.trial_will_end', () => {
      it('should handle trial ending event', async () => {
        const mockEvent = {
          id: 'evt_trial_ending',
          type: 'customer.subscription.trial_will_end',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
            },
          },
        };

        mockWebhooksConstructEvent.mockReturnValue(mockEvent);
        (prismaMock as any).stripeEvent.create.mockResolvedValue({});
        (prismaMock as any).stripeEvent.update.mockResolvedValue({});
        prismaMock.organization.findUnique.mockResolvedValue(
          createMockOrganization({ trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }) as any
        );
        prismaMock.user.findMany.mockResolvedValue([{ id: 'user-001', email: 'admin@test.com' }] as any);

        await stripeService.handleWebhook(Buffer.from('test'), 'signature');

        // Should send notifications to admins (via notification service mock)
        expect(prismaMock.user.findMany).toHaveBeenCalled();
      });
    });

    it('should reject invalid webhook signature', async () => {
      mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        stripeService.handleWebhook(Buffer.from('test'), 'invalid')
      ).rejects.toThrow('Invalid webhook signature');
    });

    it('should handle unrecognized event types gracefully', async () => {
      const mockEvent = {
        id: 'evt_unknown',
        type: 'unknown.event.type',
        data: { object: {} },
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);
      (prismaMock as any).stripeEvent.findUnique.mockResolvedValue(null);
      (prismaMock as any).stripeEvent.upsert.mockResolvedValue({});
      (prismaMock as any).stripeEvent.update.mockResolvedValue({});

      const result = await stripeService.handleWebhook(Buffer.from('test'), 'signature');

      expect(result.processed).toBe(true);
    });

    it('is idempotent: a redelivered already-processed event is a no-op', async () => {
      // Stripe retries deliveries. If the event id is already recorded as processed,
      // handleWebhook must short-circuit and NOT mutate the organization again.
      const mockEvent = {
        id: 'evt_dup_1',
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_1', customer: 'cus_1' } },
      };
      mockWebhooksConstructEvent.mockReturnValue(mockEvent);
      // The dedup lookup reports the event was already processed.
      (prismaMock as any).stripeEvent.findUnique.mockResolvedValue({ eventId: 'evt_dup_1', processed: true });

      const result = await stripeService.handleWebhook(Buffer.from('test'), 'signature');

      expect(result.processed).toBe(true);
      // No new event record is written and no org/billing mutation occurs on replay.
      expect((prismaMock as any).stripeEvent.upsert).not.toHaveBeenCalled();
      expect((prismaMock as any).stripeEvent.create).not.toHaveBeenCalled();
      expect(prismaMock.organization.update).not.toHaveBeenCalled();
    });

    it('processes a first-delivery event and records it via upsert', async () => {
      const mockEvent = {
        id: 'evt_first_1',
        type: 'unknown.event.type',
        data: { object: {} },
      };
      mockWebhooksConstructEvent.mockReturnValue(mockEvent);
      // No prior record -> not yet processed -> proceed.
      (prismaMock as any).stripeEvent.findUnique.mockResolvedValue(null);
      (prismaMock as any).stripeEvent.upsert.mockResolvedValue({});
      (prismaMock as any).stripeEvent.update.mockResolvedValue({});

      const result = await stripeService.handleWebhook(Buffer.from('test'), 'signature');

      expect(result.processed).toBe(true);
      // First delivery records the event and marks it processed.
      expect((prismaMock as any).stripeEvent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventId: 'evt_first_1' } })
      );
      expect((prismaMock as any).stripeEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventId: 'evt_first_1' }, data: { processed: true } })
      );
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================
  describe('Edge Cases', () => {
    it('completes each tier change through Stripe + an atomic DB transaction', async () => {
      // NOTE: changeTier has no cross-call row-level lock, so with fully independent
      // mocked Prisma/Stripe calls this cannot detect a true concurrency race. It instead
      // asserts the observable per-call contract: BOTH calls resolve true, each issues a
      // Stripe subscription update, and each records exactly one subscriptionHistory entry
      // inside changeTier's $transaction (stripeService.ts:510-531). A genuine
      // double-upgrade guard would require row-level locking, which is not implemented.
      const mockOrg = createMockOrganization({ stripeSubscriptionId: 'sub_test123', plan: 'Essentials' });
      const mockSub = createMockSubscription();

      prismaMock.organization.findUnique.mockResolvedValue(mockOrg as any);
      mockSubscriptionsRetrieve.mockResolvedValue(mockSub);
      mockSubscriptionsUpdate.mockResolvedValue(mockSub);
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.subscriptionHistory.create.mockResolvedValue({} as any);

      const results = await Promise.all([
        stripeService.changeTier('org-123', 'Growth'),
        stripeService.changeTier('org-123', 'Growth'),
      ]);

      expect(results).toEqual([true, true]);
      // Each call performs the Stripe-side update and one DB history write.
      expect(mockSubscriptionsUpdate).toHaveBeenCalledTimes(2);
      expect(prismaMock.organization.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.subscriptionHistory.create).toHaveBeenCalledTimes(2);
    });

    it('should handle Stripe API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).type = 'StripeRateLimitError';

      mockCustomersCreate.mockRejectedValue(rateLimitError);

      await expect(
        stripeService.createCustomer('test@example.com', 'Test', 'org-123')
      ).rejects.toThrow('Failed to create customer');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('network timeout');
      mockCheckoutSessionsCreate.mockRejectedValue(timeoutError);

      await expect(
        stripeService.createCheckoutSession({
          tierName: 'Essentials',
          billingCycle: 'monthly',
          customerEmail: 'test@example.com',
          organizationId: 'org-123',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Failed to create checkout session');
    });
  });
});
