/**
 * E2E Tests - Billing & Subscription Flow
 * Tests the tier-based subscription system: subscription details, available
 * tiers, tier comparison, usage metrics, history, cancel/reactivate, and the
 * a-la-carte feature subscription endpoints.
 *
 * Exercises the real routes in src/routes/billing.ts. Handlers delegate to
 * stripeService / tierService / featureService / webhookService, which are
 * mocked here so assertions verify route wiring (path + method + status +
 * response envelope) deterministically without a live Stripe account.
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

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../services/stripeService', () => ({
  __esModule: true,
  default: {
    getSubscriptionDetails: jest.fn(),
    cancelSubscription: jest.fn(),
    reactivateSubscription: jest.fn(),
    previewTierChange: jest.fn(),
    changeTier: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    createQuote: jest.fn(),
  },
}));

jest.mock('../../services/tierService', () => ({
  __esModule: true,
  default: {
    getOrganizationTier: jest.fn(),
    getAvailableTiers: jest.fn(),
    getAllUsageMetrics: jest.fn(),
    getUsageVsLimits: jest.fn(),
    compareTiers: jest.fn(),
    canDowngrade: jest.fn(),
  },
}));

jest.mock('../../services/featureService', () => ({
  __esModule: true,
  default: {
    getAvailableFeaturesForOrganization: jest.fn(),
    hasFeatureAccess: jest.fn(),
  },
}));

jest.mock('../../services/webhookService', () => ({
  __esModule: true,
  default: {
    dispatchEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

import billingRoutes from '../../routes/billing';
import { errorHandler } from '../../middleware/errorHandler';
import stripeService from '../../services/stripeService';
import tierService from '../../services/tierService';
import featureService from '../../services/featureService';

const stripe = stripeService as unknown as Record<string, jest.Mock>;
const tier = tierService as unknown as Record<string, jest.Mock>;
const feature = featureService as unknown as Record<string, jest.Mock>;

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/billing', billingRoutes);
app.use(errorHandler);

describe('E2E: Billing & Subscription Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default org tier used by tier-comparison routes.
    tier.getOrganizationTier.mockResolvedValue('Foundation');
  });

  // ===========================================================================
  // Subscription details
  // ===========================================================================
  describe('Subscription Details', () => {
    it('should get current subscription', async () => {
      stripe.getSubscriptionDetails.mockResolvedValue({
        tier: 'Foundation',
        status: 'active',
        currentPeriodEnd: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/billing/subscription')
        .expect(200);

      expect(response.body).toHaveProperty('tier', 'Foundation');
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should 404 when no subscription exists', async () => {
      stripe.getSubscriptionDetails.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/billing/subscription')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should get subscription history', async () => {
      prismaMock.subscriptionHistory.findMany.mockResolvedValue([
        { id: 'sh-1', organizationId: 'org-123', action: 'tier.changed' },
      ] as any);
      prismaMock.subscriptionHistory.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/billing/history')
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('total', 1);
    });
  });

  // ===========================================================================
  // Tiers & comparison
  // ===========================================================================
  describe('Tiers & Comparison', () => {
    it('should list available tiers', async () => {
      tier.getAvailableTiers.mockResolvedValue([
        { name: 'Foundation', current: true },
        { name: 'Growth', current: false },
      ]);

      const response = await request(app)
        .get('/api/billing/tiers')
        .expect(200);

      expect(response.body).toHaveProperty('tiers');
      expect(response.body).toHaveProperty('addOns');
      expect(Array.isArray(response.body.tiers)).toBe(true);
    });

    it('should compare current tier to a target tier', async () => {
      tier.compareTiers.mockReturnValue({ priceDelta: 100 });

      const response = await request(app)
        .get('/api/billing/compare/Growth')
        .expect(200);

      expect(response.body).toHaveProperty('currentTier');
      expect(response.body).toHaveProperty('targetTier');
      expect(response.body).toHaveProperty('direction', 'upgrade');
      expect(response.body).toHaveProperty('featureChanges');
    });

    it('should reject comparison to an invalid tier with 400', async () => {
      const response = await request(app)
        .get('/api/billing/compare/NotARealTier')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should preview a tier change', async () => {
      tier.compareTiers.mockReturnValue({ priceDelta: 100 });
      stripe.previewTierChange.mockResolvedValue({ proratedAmount: 4500 });

      const response = await request(app)
        .post('/api/billing/preview-change')
        .send({ tier: 'Growth', billingCycle: 'annual' })
        .expect(200);

      expect(response.body).toHaveProperty('comparison');
      expect(response.body).toHaveProperty('stripePreview');
    });
  });

  // ===========================================================================
  // Usage metrics
  // ===========================================================================
  describe('Usage Metrics', () => {
    it('should get usage metrics and limits', async () => {
      tier.getAllUsageMetrics.mockResolvedValue({ apiCalls: 5000, users: 15 });
      tier.getUsageVsLimits.mockResolvedValue({ apiCalls: { used: 5000, limit: 10000 } });

      const response = await request(app)
        .get('/api/billing/usage')
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('limits');
    });
  });

  // ===========================================================================
  // Cancel & reactivate
  // ===========================================================================
  describe('Cancellation & Reactivation', () => {
    it('should cancel subscription at period end', async () => {
      stripe.cancelSubscription.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/billing/cancel')
        .send({ atPeriodEnd: true, reason: 'Budget constraints' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('end of the current billing period');
      expect(stripe.cancelSubscription).toHaveBeenCalledWith('org-123', true, 'Budget constraints');
    });

    it('should reactivate a canceled subscription', async () => {
      stripe.reactivateSubscription.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/billing/reactivate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  // ===========================================================================
  // A-la-carte feature subscriptions
  // ===========================================================================
  describe('Feature Subscriptions', () => {
    it('should list available features', async () => {
      feature.getAvailableFeaturesForOrganization.mockResolvedValue([
        { id: 'sso', name: 'Single Sign-On' },
      ]);

      const response = await request(app)
        .get('/api/billing/features')
        .expect(200);

      expect(response.body).toHaveProperty('features');
      expect(Array.isArray(response.body.features)).toBe(true);
    });

    it('should check feature access', async () => {
      feature.hasFeatureAccess.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/billing/features/sso/access')
        .expect(200);

      expect(response.body).toHaveProperty('hasAccess', true);
      expect(feature.hasFeatureAccess).toHaveBeenCalledWith('org-123', 'sso');
    });
  });
});
