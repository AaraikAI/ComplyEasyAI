/**
 * Stripe Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock Stripe
const mockCustomersCreate = jest.fn();
const mockCheckoutSessionsCreate = jest.fn();
const mockBillingPortalSessionsCreate = jest.fn();
const mockWebhooksConstructEvent = jest.fn();
const mockSubscriptionsRetrieve = jest.fn();

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
    },
  }));
});

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    stripe: {
      secretKey: 'sk_test_key',
      webhookSecret: 'whsec_test_secret',
    },
  },
}));

import stripeService from '../../../services/stripeService';

describe('StripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    it('should handle Stripe API errors', async () => {
      mockCustomersCreate.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        stripeService.createCustomer('test@example.com', 'Test', 'org-123')
      ).rejects.toThrow('Failed to create customer');
    });
  });

  describe('createCheckoutSession()', () => {
    it('should create checkout session', async () => {
      const options = {
        priceId: 'price_test123',
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
          line_items: [{ price: options.priceId, quantity: 1 }],
        })
      );
    });

    it('should include customer ID when provided', async () => {
      const options = {
        priceId: 'price_test123',
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
  });

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
  });

  describe('handleWebhook()', () => {
    it('should handle subscription created event', async () => {
      const payload = Buffer.from('test payload');
      const signature = 'test signature';

      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
          },
        },
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);
      prismaMock.organization.findFirst.mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: 'cus_test123',
      } as any);
      prismaMock.organization.update.mockResolvedValue({} as any);

      await stripeService.handleWebhook(payload, signature);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripeSubscriptionId: 'sub_test123',
            subscriptionStatus: 'Active',
          }),
        })
      );
    });

    it('should handle subscription updated event', async () => {
      const payload = Buffer.from('test');
      const signature = 'test';

      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            status: 'canceled',
          },
        },
      };

      mockWebhooksConstructEvent.mockReturnValue(mockEvent);
      prismaMock.organization.findFirst.mockResolvedValue({
        id: 'org-123',
      } as any);
      prismaMock.organization.update.mockResolvedValue({} as any);

      await stripeService.handleWebhook(payload, signature);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionStatus: 'Canceled',
          }),
        })
      );
    });

    it('should reject invalid webhook signature', async () => {
      mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        stripeService.handleWebhook(Buffer.from('test'), 'invalid')
      ).rejects.toThrow('Invalid webhook signature');
    });
  });
});

