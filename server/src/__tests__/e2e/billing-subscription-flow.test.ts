/**
 * E2E Tests - Billing & Subscription Flow
 * Tests complete billing workflows including subscription management,
 * payment processing, invoicing, and usage tracking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_123', email: 'test@example.com' }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      }),
      update: jest.fn().mockResolvedValue({ id: 'sub_123', status: 'active' }),
      cancel: jest.fn().mockResolvedValue({ id: 'sub_123', status: 'canceled' }),
    },
    invoices: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      retrieve: jest.fn().mockResolvedValue({ id: 'inv_123' }),
    },
    paymentMethods: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      attach: jest.fn().mockResolvedValue({ id: 'pm_123' }),
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session' }),
      },
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session' }),
      },
    },
  }));
});

import billingRoutes from '../../routes/billing';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/billing', billingRoutes);
app.use(errorHandler);

describe('E2E: Billing & Subscription Flow', () => {
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Company',
    stripeCustomerId: 'cus_123',
    subscriptionId: 'sub_123',
    subscriptionStatus: 'active',
    plan: 'Professional',
    billingEmail: 'billing@example.com',
  };

  const mockSubscription = {
    id: 'sub-123',
    organizationId: 'org-123',
    stripeSubscriptionId: 'sub_123',
    plan: 'Professional',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  const mockInvoice = {
    id: 'inv-123',
    organizationId: 'org-123',
    stripeInvoiceId: 'inv_123',
    amount: 9900,
    currency: 'usd',
    status: 'paid',
    paidAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
  });

  describe('Subscription Signup Flow', () => {
    it('should complete new subscription signup', async () => {
      // Step 1: Create checkout session
      const checkoutResponse = await request(app)
        .post('/api/billing/checkout')
        .send({
          plan: 'Professional',
          billingCycle: 'monthly',
        })
        .expect(200);

      expect(checkoutResponse.body).toHaveProperty('url');
      expect(checkoutResponse.body.url).toContain('checkout.stripe.com');

      // Step 2: Verify subscription after webhook (simulated)
      prismaMock.subscription.findFirst.mockResolvedValue(mockSubscription as any);

      const statusResponse = await request(app)
        .get('/api/billing/subscription')
        .expect(200);

      expect(statusResponse.body).toHaveProperty('plan');
      expect(statusResponse.body).toHaveProperty('status');
    });
  });

  describe('Plan Upgrade/Downgrade Flow', () => {
    it('should upgrade subscription plan', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(mockSubscription as any);
      prismaMock.subscription.update.mockResolvedValue({
        ...mockSubscription,
        plan: 'Enterprise',
      } as any);

      const response = await request(app)
        .post('/api/billing/upgrade')
        .send({
          newPlan: 'Enterprise',
          immediate: true,
        })
        .expect(200);

      expect(response.body.plan).toBe('Enterprise');
    });

    it('should downgrade subscription with proration', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        plan: 'Enterprise',
      } as any);
      prismaMock.subscription.update.mockResolvedValue({
        ...mockSubscription,
        plan: 'Professional',
        scheduledDowngrade: true,
      } as any);

      const response = await request(app)
        .post('/api/billing/downgrade')
        .send({
          newPlan: 'Professional',
          atPeriodEnd: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('scheduledDowngrade');
    });
  });

  describe('Payment Method Management', () => {
    it('should add payment method', async () => {
      const response = await request(app)
        .post('/api/billing/payment-methods')
        .send({
          paymentMethodId: 'pm_test_123',
          setAsDefault: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should list payment methods', async () => {
      const response = await request(app)
        .get('/api/billing/payment-methods')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update default payment method', async () => {
      const response = await request(app)
        .patch('/api/billing/payment-methods/pm_123/default')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Invoice Management', () => {
    it('should list invoices', async () => {
      prismaMock.invoice.findMany.mockResolvedValue([mockInvoice] as any);

      const response = await request(app)
        .get('/api/billing/invoices')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get invoice PDF', async () => {
      prismaMock.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        pdfUrl: 'https://stripe.com/invoice.pdf',
      } as any);

      const response = await request(app)
        .get('/api/billing/invoices/inv-123/pdf')
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });

    it('should get upcoming invoice preview', async () => {
      const response = await request(app)
        .get('/api/billing/invoices/upcoming')
        .expect(200);

      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('dueDate');
    });
  });

  describe('Usage Tracking', () => {
    it('should get current usage', async () => {
      prismaMock.usageRecord.findMany.mockResolvedValue([
        { type: 'api_calls', count: 5000, limit: 10000 },
        { type: 'storage_gb', count: 25, limit: 100 },
        { type: 'users', count: 15, limit: 50 },
      ] as any);

      const response = await request(app)
        .get('/api/billing/usage')
        .expect(200);

      expect(response.body).toHaveProperty('api_calls');
      expect(response.body).toHaveProperty('storage_gb');
    });

    it('should get usage history', async () => {
      prismaMock.usageRecord.findMany.mockResolvedValue([
        { period: '2024-01', api_calls: 8000, storage_gb: 20 },
        { period: '2024-02', api_calls: 9500, storage_gb: 25 },
      ] as any);

      const response = await request(app)
        .get('/api/billing/usage/history')
        .query({ months: 6 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Subscription Cancellation Flow', () => {
    it('should cancel subscription at period end', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(mockSubscription as any);
      prismaMock.subscription.update.mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      } as any);

      const response = await request(app)
        .post('/api/billing/cancel')
        .send({
          reason: 'Too expensive',
          feedback: 'Great product but budget constraints',
          immediate: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cancelAtPeriodEnd', true);
    });

    it('should reactivate canceled subscription', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      } as any);
      prismaMock.subscription.update.mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: false,
      } as any);

      const response = await request(app)
        .post('/api/billing/reactivate')
        .expect(200);

      expect(response.body).toHaveProperty('cancelAtPeriodEnd', false);
    });
  });

  describe('Billing Portal', () => {
    it('should create billing portal session', async () => {
      const response = await request(app)
        .post('/api/billing/portal')
        .send({
          returnUrl: 'https://app.example.com/settings/billing',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('billing.stripe.com');
    });
  });

  describe('Plan Features & Limits', () => {
    it('should get plan features', async () => {
      const response = await request(app)
        .get('/api/billing/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('features');
      expect(response.body[0]).toHaveProperty('limits');
    });

    it('should check feature access', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        features: ['sso', 'advanced_reporting', 'api_access'],
      } as any);

      const response = await request(app)
        .get('/api/billing/features/sso')
        .expect(200);

      expect(response.body).toHaveProperty('hasAccess');
    });
  });
});
