/**
 * Billing Routes Integration Tests
 *
 * Tests for subscription management, checkout, and portal routes.
 */

import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
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

jest.mock('../../../services/stripeService', () => ({
  __esModule: true,
  default: {
    createCheckoutSession: jest.fn().mockResolvedValue('https://checkout.stripe.com/test'),
    createPortalSession: jest.fn().mockResolvedValue('https://billing.stripe.com/test'),
    getSubscriptionDetails: jest.fn().mockResolvedValue({
      tier: 'Essentials',
      status: 'active',
      billingCycle: 'annual',
      nextInvoiceAmount: 1700,
    }),
    handleWebhook: jest.fn().mockResolvedValue({ processed: true }),
  },
}));

jest.mock('../../../services/tierService', () => ({
  __esModule: true,
  default: {
    getOrganizationTier: jest.fn().mockResolvedValue('Essentials'),
    getOrganizationUsage: jest.fn().mockResolvedValue({ users: 5, frameworks: 3 }),
    getSubscriptionHistory: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../services/featureService', () => ({
  __esModule: true,
  default: {
    getAvailableFeatures: jest.fn().mockResolvedValue([]),
    getFeatureSubscriptions: jest.fn().mockResolvedValue([]),
    subscribeToFeature: jest.fn().mockResolvedValue({ success: true }),
    unsubscribeFromFeature: jest.fn().mockResolvedValue({ success: true }),
    checkFeatureAccess: jest.fn().mockResolvedValue({ hasAccess: true }),
    getAvailableBundles: jest.fn().mockResolvedValue([]),
    subscribeToBundle: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    stripe: { secretKey: 'sk_test_fake', webhookSecret: 'whsec_test' },
    server: { clientUrl: 'http://localhost:3000', port: 3000 },
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  requireRole: () => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  // Re-setup stripe service mocks (resetMocks: true clears implementations)
  const stripeService = require('../../../services/stripeService').default;
  stripeService.createCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test');
  stripeService.createPortalSession.mockResolvedValue('https://billing.stripe.com/test');
  stripeService.getSubscriptionDetails.mockResolvedValue({
    tier: 'Essentials',
    status: 'active',
    billingCycle: 'annual',
    nextInvoiceAmount: 1700,
  });

  app = express();
  app.use(express.json());

  // Import routes after mocks are set up
  const billingRoutes = (await import('../../../routes/billing')).default;
  app.use('/api/billing', billingRoutes);

  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use(errorHandler);
});

describe('Billing Routes Integration', () => {
  describe('GET /api/billing/subscription', () => {
    it('should return subscription details', async () => {
      const response = await request(app)
        .get('/api/billing/subscription')
        .expect(200);

      expect(response.body).toHaveProperty('tier');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('POST /api/billing/checkout', () => {
    it('should create checkout session', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: 'cus_test123',
        users: [{ id: 'user-123' }],
      } as any);

      const response = await request(app)
        .post('/api/billing/checkout')
        .send({
          tier: 'Growth',
          billingCycle: 'annual',
          successUrl: 'https://app.example.com/success',
          cancelUrl: 'https://app.example.com/cancel',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('checkout.stripe.com');
    });

    it('should require tier', async () => {
      const response = await request(app)
        .post('/api/billing/checkout')
        .send({
          billingCycle: 'annual',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/billing/portal', () => {
    it('should create billing portal session', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: 'cus_test123',
      } as any);

      const response = await request(app)
        .post('/api/billing/portal')
        .send({
          returnUrl: 'https://app.example.com/settings',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });
  });

  // ===========================================================================
  // Stripe Webhook (signature verification is security-critical)
  // ===========================================================================
  describe('POST /api/billing/webhook', () => {
    it('should reject a webhook with no stripe-signature header (400)', async () => {
      const stripeService = require('../../../services/stripeService').default;

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .send({ id: 'evt_test', type: 'checkout.session.completed' })
        .expect(400);

      expect(response.body.error).toMatch(/signature/i);
      // The controller must refuse to process before signature verification,
      // so the (mocked) handler is never invoked for an unsigned payload.
      expect(stripeService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should reject a webhook whose signature fails verification (does not process)', async () => {
      const stripeService = require('../../../services/stripeService').default;
      // Simulate Stripe SDK constructEvent() rejecting a tampered/invalid signature.
      stripeService.handleWebhook.mockRejectedValueOnce(
        new Error('No signatures found matching the expected signature for payload')
      );

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 't=123,v1=deadbeef')
        .set('Content-Type', 'application/json')
        .send({ id: 'evt_test', type: 'checkout.session.completed' });

      // A non-AppError from the verification layer surfaces as a 500 "Webhook processing failed".
      expect(response.status).toBe(500);
      // The signature header must be forwarded to the verification routine.
      expect(stripeService.handleWebhook).toHaveBeenCalledTimes(1);
      const sigArg = stripeService.handleWebhook.mock.calls[0][1];
      expect(sigArg).toBe('t=123,v1=deadbeef');
    });
  });
});
