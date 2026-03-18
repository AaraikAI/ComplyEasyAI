/**
 * Stripe Service Contract Tests
 *
 * Verifies the contract between the service layer, Stripe API, and Prisma ORM
 * for customer creation, checkout sessions, and subscription management.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockOrganization } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Mock Stripe
const mockStripeCustomersCreate = jest.fn();
const mockStripeCheckoutSessionsCreate = jest.fn();
const mockStripeSubscriptionsRetrieve = jest.fn();
const mockStripeSubscriptionsUpdate = jest.fn();
const mockStripeBillingPortalSessionsCreate = jest.fn();
const mockStripeProductsSearch = jest.fn();
const mockStripePricesCreate = jest.fn();
const mockStripeProductsCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockStripeCustomersCreate,
    },
    checkout: {
      sessions: {
        create: mockStripeCheckoutSessionsCreate,
      },
    },
    subscriptions: {
      retrieve: mockStripeSubscriptionsRetrieve,
      update: mockStripeSubscriptionsUpdate,
    },
    billingPortal: {
      sessions: {
        create: mockStripeBillingPortalSessionsCreate,
      },
    },
    products: {
      search: mockStripeProductsSearch,
      create: mockStripeProductsCreate,
    },
    prices: {
      create: mockStripePricesCreate,
    },
  }));
});

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    stripe: { secretKey: 'sk_test_123' },
    server: { clientUrl: 'http://localhost:3000' },
  },
}));

jest.mock('../../../config/tiers', () => ({
  TIERS: {
    Foundation: { name: 'Foundation' },
    Essentials: { name: 'Essentials' },
    Growth: { name: 'Growth' },
    Visionary: { name: 'Visionary' },
  },
  getTier: jest.fn(),
  getTierIndex: jest.fn(),
}));

jest.mock('../../../services/notificationService', () => ({
  __esModule: true,
  default: { sendNotification: jest.fn() },
}));

import stripeService from '../../../services/stripeService';

describe('StripeService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createCustomer
  // ---------------------------------------------------------------------------
  describe('createCustomer', () => {
    it('should call stripe.customers.create with correct shape', async () => {
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_123' });
      prismaMock.organization.update.mockResolvedValue(
        createMockOrganization({ stripeCustomerId: 'cus_123' })
      );

      const customerId = await stripeService.createCustomer(
        'test@example.com',
        'Test Org',
        'org-123'
      );

      expect(mockStripeCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Org',
        metadata: expect.objectContaining({
          organizationId: 'org-123',
        }),
      });
      expect(customerId).toBe('cus_123');
    });

    it('should update organization with stripe customer ID', async () => {
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_456' });
      prismaMock.organization.update.mockResolvedValue(
        createMockOrganization({ stripeCustomerId: 'cus_456' })
      );

      await stripeService.createCustomer('test@example.com', 'Test Org', 'org-123');

      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: { stripeCustomerId: 'cus_456' },
      });
    });

    it('should propagate Stripe API errors', async () => {
      mockStripeCustomersCreate.mockRejectedValue(new Error('Invalid API key'));

      await expect(
        stripeService.createCustomer('test@example.com', 'Test Org', 'org-123')
      ).rejects.toThrow('Failed to create customer');
    });

    it('should include extra metadata when provided', async () => {
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_789' });
      prismaMock.organization.update.mockResolvedValue(createMockOrganization());

      await stripeService.createCustomer(
        'test@example.com',
        'Test Org',
        'org-123',
        { tier: 'Growth' }
      );

      expect(mockStripeCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Org',
        metadata: expect.objectContaining({
          organizationId: 'org-123',
          tier: 'Growth',
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createCheckoutSession
  // ---------------------------------------------------------------------------
  describe('createCheckoutSession', () => {
    it('should propagate Stripe errors for invalid price IDs', async () => {
      mockStripeProductsSearch.mockResolvedValue({ data: [] });
      mockStripeProductsCreate.mockResolvedValue({ id: 'prod_1' });
      mockStripePricesCreate.mockResolvedValue({ id: 'price_test' });
      mockStripeCheckoutSessionsCreate.mockRejectedValue(
        new Error('Invalid price')
      );

      await expect(
        stripeService.createCheckoutSession({
          tierName: 'Foundation' as any,
          billingCycle: 'annual',
          customerEmail: 'test@example.com',
          organizationId: 'org-123',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow();
    });
  });
});
