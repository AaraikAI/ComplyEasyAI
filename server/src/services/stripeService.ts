/**
 * Stripe Service
 *
 * Production-level Stripe integration for the 4-tier subscription system:
 * - Foundation: $8,500/year
 * - Essentials: $17,000/year
 * - Growth: $42,500–$65,000/year
 * - Visionary: $68,000–$170,000/year
 *
 * Handles:
 * - Customer creation
 * - Checkout sessions
 * - Billing portal
 * - Subscription management
 * - Webhooks
 * - Upgrades/Downgrades
 */

import Stripe from 'stripe';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { TierName, TIERS, getTier, getTierIndex, BillingCycle } from '../config/tiers';
import { FEATURE_BUNDLES } from '../config/features';
import type { Plan, SubscriptionStatus, SubscriptionChangeType } from '../generated/prisma/client';
import notificationService from './notificationService';

// Stripe SDK requires a non-empty key at construction. When STRIPE_SECRET_KEY
// is unset (CI / preview / dev without billing), supply an obviously-invalid
// non-Stripe-shaped placeholder so the module loads — any actual API call
// will fail-fast with a clear Stripe auth error rather than crashing server
// startup. Avoid sk_*-prefixed placeholders, since secret scanners flag them.
const stripeSecretKey = config.stripe.secretKey || 'unconfigured-no-billing-key-set';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-03-25.dahlia',
});
if (!config.stripe.secretKey) {
  logger.warn('[Stripe] STRIPE_SECRET_KEY is not set — billing endpoints will reject all requests');
}

// ============================================================================
// TYPES
// ============================================================================

interface CreateCheckoutSessionOptions {
  tierName: TierName;
  billingCycle: 'monthly' | 'annual';
  customerId?: string;
  customerEmail: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
  userCount?: number; // For scaled pricing
  addOns?: string[]; // Add-on IDs to include
  bundles?: string[]; // Feature-bundle IDs to include (single discounted price each)
  trialDays?: number;
  couponCode?: string;
}

interface SubscriptionDetails {
  tier: TierName;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  addOns: string[];
  nextInvoiceAmount: number | null;
  usage: {
    users: number;
  };
}

interface UpgradePreview {
  currentTier: TierName;
  targetTier: TierName;
  proratedAmount: number;
  newMonthlyAmount: number;
  immediateCharge: number;
  nextBillingDate: Date;
}

// ============================================================================
// PRICE ID CONFIGURATION
// ============================================================================

// These should be configured in environment variables
// Format: STRIPE_TIER_BILLINGCYCLE_PRICE_ID
const PRICE_IDS: Record<TierName, { monthly: string; annual: string }> = {
  Foundation: {
    monthly: process.env.STRIPE_FOUNDATION_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_FOUNDATION_ANNUAL_PRICE_ID || '',
  },
  Essentials: {
    monthly: process.env.STRIPE_ESSENTIALS_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_ESSENTIALS_ANNUAL_PRICE_ID || '',
  },
  Growth: {
    monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID || '',
  },
  Visionary: {
    monthly: process.env.STRIPE_VISIONARY_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_VISIONARY_ANNUAL_PRICE_ID || '',
  },
};

// Add-on price IDs (optional; Audit Bundling is variable/contact-sales)
const ADDON_PRICE_IDS: Record<string, string> = {
  'custom-frameworks': process.env.STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID || '',
  'on-prem-deployment': process.env.STRIPE_ADDON_ON_PREM_PRICE_ID || '',
  'custom-ai-models': process.env.STRIPE_ADDON_CUSTOM_AI_PRICE_ID || '',
  'vciso-service': process.env.STRIPE_ADDON_VCISO_PRICE_ID || '',
  'audit-bundling': process.env.STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID || '',
};

// Feature-bundle price IDs (single discounted price per bundle; monthly + annual).
// Keyed by the FEATURE_BUNDLES id from config/features.ts. Each bundle already
// bakes in its 15% discount via FEATURE_BUNDLES[id].basePrice{Annual,Monthly}.
const BUNDLE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  'ai-suite-bundle': {
    monthly: process.env.STRIPE_BUNDLE_AI_SUITE_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_BUNDLE_AI_SUITE_ANNUAL_PRICE_ID || '',
  },
  'enterprise-bundle': {
    monthly: process.env.STRIPE_BUNDLE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_BUNDLE_ENTERPRISE_ANNUAL_PRICE_ID || '',
  },
  'acos-bundle': {
    monthly: process.env.STRIPE_BUNDLE_ACOS_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_BUNDLE_ACOS_ANNUAL_PRICE_ID || '',
  },
  'visionary-bundle': {
    monthly: process.env.STRIPE_BUNDLE_VISIONARY_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_BUNDLE_VISIONARY_ANNUAL_PRICE_ID || '',
  },
};

// Canonical annual pricing in cents for each tier (used for auto-provisioning)
const TIER_ANNUAL_PRICES_CENTS: Record<TierName, number> = {
  Foundation: 850000,   // $8,500/year
  Essentials: 1700000,  // $17,000/year
  Growth: 4250000,      // $42,500/year
  Visionary: 6800000,   // $68,000/year
};

/**
 * Ensure Stripe products & prices exist for every tier.
 * Called once at service init when the Stripe key is present but price IDs
 * have not been pre-configured via environment variables.
 * Created prices are cached in the PRICE_IDS map for the lifetime of the process.
 */
let pricesProvisioned = false;
async function ensureStripePricesExist(): Promise<void> {
  if (pricesProvisioned) return;
  if (!config.stripe.secretKey) return;

  pricesProvisioned = true; // prevent re-entrance

  for (const tier of Object.keys(PRICE_IDS) as TierName[]) {
    const ids = PRICE_IDS[tier];
    // Skip if already configured
    if (ids.annual && ids.annual.startsWith('price_') && ids.monthly && ids.monthly.startsWith('price_')) {
      continue;
    }

    try {
      // Search for an existing product with matching metadata
      const existingProducts = await stripe.products.search({
        query: `metadata["tier"]:"${tier}"`,
        limit: 1,
      });

      let productId: string;
      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;
      } else {
        const product = await stripe.products.create({
          name: `ComplyEasy – ${tier}`,
          metadata: { tier },
        });
        productId = product.id;
      }

      // Create annual price if missing
      if (!ids.annual || !ids.annual.startsWith('price_')) {
        const annualPrice = await stripe.prices.create({
          product: productId,
          currency: 'usd',
          unit_amount: TIER_ANNUAL_PRICES_CENTS[tier],
          recurring: { interval: 'year' },
          metadata: { tier, billingCycle: 'annual' },
        });
        ids.annual = annualPrice.id;
      }

      // Create monthly price if missing (annual / 12, rounded)
      if (!ids.monthly || !ids.monthly.startsWith('price_')) {
        const monthlyAmount = Math.round(TIER_ANNUAL_PRICES_CENTS[tier] / 12);
        const monthlyPrice = await stripe.prices.create({
          product: productId,
          currency: 'usd',
          unit_amount: monthlyAmount,
          recurring: { interval: 'month' },
          metadata: { tier, billingCycle: 'monthly' },
        });
        ids.monthly = monthlyPrice.id;
      }

      logger.info(`[Stripe] Prices provisioned for ${tier}: annual=${ids.annual}, monthly=${ids.monthly}`);
    } catch (error) {
      logger.error(`[Stripe] Failed to provision prices for ${tier}`, error);
    }
  }
}

/**
 * Ensure Stripe products & prices exist for every feature bundle.
 * Mirrors ensureStripePricesExist for the discounted bundles. When the
 * STRIPE_BUNDLE_*_{MONTHLY,ANNUAL}_PRICE_ID env vars are empty, this provisions
 * a product + monthly/annual prices from the canonical FEATURE_BUNDLES base
 * prices and caches the resulting ids in BUNDLE_PRICE_IDS for the process lifetime.
 */
let bundlePricesProvisioned = false;
async function ensureStripeBundlePricesExist(): Promise<void> {
  if (bundlePricesProvisioned) return;
  if (!config.stripe.secretKey) return;

  bundlePricesProvisioned = true; // prevent re-entrance

  for (const bundleId of Object.keys(BUNDLE_PRICE_IDS)) {
    const ids = BUNDLE_PRICE_IDS[bundleId];
    const bundle = FEATURE_BUNDLES[bundleId];
    if (!bundle) continue;

    // Skip if both prices are already configured
    if (ids.annual && ids.annual.startsWith('price_') && ids.monthly && ids.monthly.startsWith('price_')) {
      continue;
    }

    try {
      // Search for an existing product with matching metadata
      const existingProducts = await stripe.products.search({
        query: `metadata["bundleId"]:"${bundleId}"`,
        limit: 1,
      });

      let productId: string;
      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;
      } else {
        const product = await stripe.products.create({
          name: `ComplyEasy – ${bundle.name}`,
          description: bundle.description || undefined,
          metadata: { bundleId, type: 'bundle' },
        });
        productId = product.id;
      }

      // Create annual price if missing
      if (!ids.annual || !ids.annual.startsWith('price_')) {
        const annualPrice = await stripe.prices.create({
          product: productId,
          currency: 'usd',
          unit_amount: Math.round(bundle.basePriceAnnual * 100),
          recurring: { interval: 'year' },
          metadata: { bundleId, billingCycle: 'annual', type: 'bundle' },
        });
        ids.annual = annualPrice.id;
      }

      // Create monthly price if missing
      if (!ids.monthly || !ids.monthly.startsWith('price_')) {
        const monthlyPrice = await stripe.prices.create({
          product: productId,
          currency: 'usd',
          unit_amount: Math.round(bundle.basePriceMonthly * 100),
          recurring: { interval: 'month' },
          metadata: { bundleId, billingCycle: 'monthly', type: 'bundle' },
        });
        ids.monthly = monthlyPrice.id;
      }

      logger.info(`[Stripe] Bundle prices provisioned for ${bundleId}: annual=${ids.annual}, monthly=${ids.monthly}`);
    } catch (error) {
      logger.error(`[Stripe] Failed to provision bundle prices for ${bundleId}`, error);
    }
  }
}

// ============================================================================
// STRIPE SERVICE CLASS
// ============================================================================

class StripeService {
  /**
   * Create a Stripe customer for an organization
   */
  async createCustomer(
    email: string,
    name: string,
    organizationId: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          organizationId,
          ...metadata,
        },
      });

      // Update organization with Stripe customer ID
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customer.id },
      });

      logger.info(`Stripe customer created: ${customer.id} for org: ${organizationId}`);
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', error);
      throw new AppError('Failed to create customer', 502);
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<string> {
    try {
      const {
        tierName,
        billingCycle,
        customerId,
        customerEmail,
        organizationId,
        successUrl,
        cancelUrl,
        userCount = 10,
        addOns = [],
        bundles = [],
        trialDays,
        couponCode,
      } = options;

      // Ensure Stripe prices exist (auto-provisions if env vars are empty)
      await ensureStripePricesExist();
      if (bundles.length > 0) {
        await ensureStripeBundlePricesExist();
      }

      // Get price ID for the tier and billing cycle
      const priceId = PRICE_IDS[tierName][billingCycle];

      // Validate price ID
      if (!priceId || !priceId.startsWith('price_')) {
        if (!config.stripe.secretKey) {
          throw new AppError('Stripe is not configured. Please contact support to upgrade your plan.', 400);
        }
        throw new AppError(`Price ID for ${tierName} ${billingCycle} plan is not configured. Ensure STRIPE_${tierName.toUpperCase()}_${billingCycle.toUpperCase()}_PRICE_ID is set.`, 400);
      }

      // Build line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price: priceId,
          quantity: 1,
        },
      ];

      // Add add-ons if selected
      for (const addOnId of addOns) {
        const addOnPriceId = ADDON_PRICE_IDS[addOnId];
        if (addOnPriceId && addOnPriceId.startsWith('price_')) {
          lineItems.push({
            price: addOnPriceId,
            quantity: 1,
          });
        }
      }

      // Add feature bundles if selected (single discounted price per bundle,
      // matching the chosen billing cycle).
      for (const bundleId of bundles) {
        const bundlePriceId = BUNDLE_PRICE_IDS[bundleId]?.[billingCycle];
        if (bundlePriceId && bundlePriceId.startsWith('price_')) {
          lineItems.push({
            price: bundlePriceId,
            quantity: 1,
          });
        } else {
          logger.warn(`[Stripe] Skipping bundle "${bundleId}" — no ${billingCycle} price configured`);
        }
      }

      // Build session params
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        customer_email: customerId ? undefined : customerEmail,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
          tierName,
          billingCycle,
          userCount: userCount.toString(),
          addOns: JSON.stringify(addOns),
          bundles: JSON.stringify(bundles),
        },
        subscription_data: {
          metadata: {
            organizationId,
            tierName,
            billingCycle,
          },
        },
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true,
        },
        allow_promotion_codes: true,
      };

      // Add trial period if specified
      if (trialDays && trialDays > 0) {
        sessionParams.subscription_data!.trial_period_days = trialDays;
      }

      // Add coupon if provided
      if (couponCode) {
        sessionParams.discounts = [{ coupon: couponCode }];
        delete sessionParams.allow_promotion_codes; // Can't use both
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      logger.info(`Checkout session created: ${session.id} for tier: ${tierName}`);
      return session.url!;
    } catch (error) {
      logger.error('Failed to create checkout session', error);
      throw new AppError('Failed to create checkout session', 502);
    }
  }

  /**
   * Create billing portal session for subscription management
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      logger.error('Failed to create portal session', error);
      throw new AppError('Failed to create billing portal session', 502);
    }
  }

  /**
   * Get subscription details for an organization
   */
  async getSubscriptionDetails(organizationId: string): Promise<SubscriptionDetails | null> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: { select: { id: true } },
        },
      });

      if (!org) return null;

      const tier = org.plan as TierName;

      const details: SubscriptionDetails = {
        tier,
        status: org.subscriptionStatus as SubscriptionStatus,
        billingCycle: (org.billingCycle as 'monthly' | 'annual') || 'annual',
        currentPeriodStart: org.subscriptionStartedAt || org.createdAt,
        currentPeriodEnd: org.subscriptionEndsAt || new Date(),
        cancelAtPeriodEnd: org.cancelAtPeriodEnd,
        trialEnd: org.trialEndsAt,
        stripeSubscriptionId: org.stripeSubscriptionId,
        stripeCustomerId: org.stripeCustomerId,
        addOns: org.activeAddOns || [],
        nextInvoiceAmount: null,
        usage: {
          users: org.users.length,
        },
      };

      // Get upcoming invoice if customer exists
      if (org.stripeCustomerId) {
        try {
          const upcomingInvoice = await stripe.invoices.createPreview({
            customer: org.stripeCustomerId,
          });
          details.nextInvoiceAmount = upcomingInvoice.amount_due / 100;
        } catch (invoiceError) {
          logger.warn('[Stripe] Failed to preview upcoming invoice', { customerId: org.stripeCustomerId, error: invoiceError });
        }
      }

      return details;
    } catch (error) {
      logger.error('Failed to get subscription details', error);
      throw new AppError('Failed to fetch subscription details', 500);
    }
  }

  /**
   * Preview upgrade/downgrade pricing
   */
  async previewTierChange(
    organizationId: string,
    targetTier: TierName,
    billingCycle: 'monthly' | 'annual' = 'annual'
  ): Promise<UpgradePreview | null> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId || !org?.stripeCustomerId) {
        return null;
      }

      const currentTier = org.plan as TierName;
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);

      // Get new price
      const newPriceId = PRICE_IDS[targetTier][billingCycle];
      if (!newPriceId) return null;

      // Preview proration
      const preview = await stripe.invoices.createPreview({
        customer: org.stripeCustomerId,
        subscription: org.stripeSubscriptionId,
        subscription_details: {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        },
      });

      const tier = getTier(targetTier);
      const monthlyAmount = billingCycle === 'annual'
        ? tier.pricing.annualMin / 12
        : tier.pricing.annualMin * tier.pricing.monthlyMultiplier / 12;

      return {
        currentTier,
        targetTier,
        proratedAmount: preview.amount_due / 100,
        newMonthlyAmount: monthlyAmount,
        immediateCharge: preview.amount_due / 100,
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
      };
    } catch (error) {
      logger.error('Failed to preview tier change', error);
      return null;
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async changeTier(
    organizationId: string,
    targetTier: TierName,
    billingCycle: 'monthly' | 'annual' = 'annual',
    immediate: boolean = true
  ): Promise<boolean> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      const currentTier = org.plan as TierName;
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      const newPriceId = PRICE_IDS[targetTier][billingCycle];

      if (!newPriceId) {
        throw new AppError(`Price not configured for ${targetTier} ${billingCycle}`, 400);
      }

      const isUpgrade = getTierIndex(targetTier) > getTierIndex(currentTier);

      // Update subscription
      await stripe.subscriptions.update(org.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: immediate ? 'create_prorations' : 'none',
        metadata: {
          tierName: targetTier,
          billingCycle,
          previousTier: currentTier,
        },
      });

      // Wrap local DB operations in a transaction to keep them atomic
      await prisma.$transaction(async (tx) => {
        await tx.organization.update({
          where: { id: organizationId },
          data: {
            plan: targetTier as Plan,
            billingCycle: billingCycle as BillingCycle,
          },
        });

        await tx.subscriptionHistory.create({
          data: {
            organizationId,
            previousPlan: currentTier as Plan,
            newPlan: targetTier as Plan,
            previousStatus: org.subscriptionStatus,
            newStatus: org.subscriptionStatus,
            changeType: isUpgrade ? 'upgrade' : 'downgrade',
            changedBy: 'system',
            metadata: { billingCycle, immediate },
          },
        });
      });

      logger.info(`Tier changed for org ${organizationId}: ${currentTier} -> ${targetTier}`);
      return true;
    } catch (error) {
      logger.error('Failed to change tier', error);
      throw new AppError('Failed to change subscription tier', 502);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    organizationId: string,
    atPeriodEnd: boolean = true,
    reason?: string
  ): Promise<boolean> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      if (atPeriodEnd) {
        // Cancel at end of billing period
        await stripe.subscriptions.update(org.stripeSubscriptionId, {
          cancel_at_period_end: true,
          metadata: { cancelReason: reason || 'User requested' },
        });

        await prisma.$transaction(async (tx) => {
          await tx.organization.update({
            where: { id: organizationId },
            data: { cancelAtPeriodEnd: true },
          });

          await tx.subscriptionHistory.create({
            data: {
              organizationId,
              previousPlan: org.plan,
              newPlan: org.plan,
              previousStatus: org.subscriptionStatus,
              newStatus: org.subscriptionStatus,
              changeType: 'cancellation',
              reason,
              changedBy: 'system',
            },
          });
        });
      } else {
        // Immediate cancellation
        await stripe.subscriptions.cancel(org.stripeSubscriptionId);

        await prisma.$transaction(async (tx) => {
          await tx.organization.update({
            where: { id: organizationId },
            data: {
              plan: 'Foundation' as Plan,
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
              cancelAtPeriodEnd: false,
            },
          });

          await tx.subscriptionHistory.create({
            data: {
              organizationId,
              previousPlan: org.plan,
              newPlan: 'Foundation' as Plan,
              previousStatus: org.subscriptionStatus,
              newStatus: 'canceled',
              changeType: 'cancellation',
              reason,
              changedBy: 'system',
            },
          });
        });
      }

      logger.info(`Subscription canceled for org ${organizationId}, atPeriodEnd: ${atPeriodEnd}`);
      return true;
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      throw new AppError('Failed to cancel subscription', 502);
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(organizationId: string): Promise<boolean> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No subscription to reactivate', 404);
      }

      await stripe.subscriptions.update(org.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      await prisma.organization.update({
        where: { id: organizationId },
        data: { cancelAtPeriodEnd: false },
      });

      // Record subscription history
      await prisma.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: org.plan,
          newPlan: org.plan,
          previousStatus: org.subscriptionStatus,
          newStatus: 'active',
          changeType: 'reactivation',
          changedBy: 'system',
        },
      });

      logger.info(`Subscription reactivated for org ${organizationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to reactivate subscription', error);
      throw new AppError('Failed to reactivate subscription', 502);
    }
  }

  /**
   * Add an add-on to subscription
   */
  async addAddOn(organizationId: string, addOnId: string): Promise<boolean> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      const addOnPriceId = ADDON_PRICE_IDS[addOnId];
      if (!addOnPriceId) {
        throw new AppError('Add-on not found', 404);
      }

      // Add to Stripe subscription
      await stripe.subscriptionItems.create({
        subscription: org.stripeSubscriptionId,
        price: addOnPriceId,
        quantity: 1,
      });

      // Update organization
      const currentAddOns = org.activeAddOns || [];
      if (!currentAddOns.includes(addOnId)) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            activeAddOns: [...currentAddOns, addOnId],
          },
        });
      }

      // Record history
      await prisma.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: org.plan,
          newPlan: org.plan,
          previousStatus: org.subscriptionStatus,
          newStatus: org.subscriptionStatus,
          changeType: 'addon_added',
          metadata: { addOnId },
          changedBy: 'system',
        },
      });

      logger.info(`Add-on ${addOnId} added for org ${organizationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to add add-on', error);
      throw new AppError('Failed to add add-on', 502);
    }
  }

  /**
   * Remove an add-on from subscription
   */
  async removeAddOn(organizationId: string, addOnId: string): Promise<boolean> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      // Find and remove from Stripe subscription
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      const addOnPriceId = ADDON_PRICE_IDS[addOnId];
      const addOnItem = subscription.items.data.find(item => item.price.id === addOnPriceId);

      if (addOnItem) {
        await stripe.subscriptionItems.del(addOnItem.id);
      }

      // Update organization
      const currentAddOns = org.activeAddOns || [];
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          activeAddOns: currentAddOns.filter(id => id !== addOnId),
        },
      });

      // Record history
      await prisma.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: org.plan,
          newPlan: org.plan,
          previousStatus: org.subscriptionStatus,
          newStatus: org.subscriptionStatus,
          changeType: 'addon_removed',
          metadata: { addOnId },
          changedBy: 'system',
        },
      });

      logger.info(`Add-on ${addOnId} removed for org ${organizationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove add-on', error);
      throw new AppError('Failed to remove add-on', 502);
    }
  }

  /**
   * Add a feature bundle to an existing subscription as a single discounted
   * line item (the bundle's monthly/annual price). The bundle id is recorded
   * in organization.activeAddOns alongside add-ons.
   */
  async addBundle(
    organizationId: string,
    bundleId: string,
    billingCycle: 'monthly' | 'annual' = 'annual'
  ): Promise<boolean> {
    try {
      const bundle = FEATURE_BUNDLES[bundleId];
      if (!bundle) {
        throw new AppError('Bundle not found', 404);
      }

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      // Enforce the bundle's minimum-tier requirement
      if (bundle.requiresTier) {
        const currentTier = org.plan as TierName;
        if (getTierIndex(currentTier) < getTierIndex(bundle.requiresTier)) {
          throw new AppError(`Bundle requires ${bundle.requiresTier} tier or higher`, 403);
        }
      }

      // Auto-provision bundle prices if env vars are empty, then resolve the id
      await ensureStripeBundlePricesExist();
      const ids = BUNDLE_PRICE_IDS[bundleId];
      const bundlePriceId = ids?.[billingCycle];
      if (!bundlePriceId || !bundlePriceId.startsWith('price_')) {
        throw new AppError(`Price for bundle ${bundleId} (${billingCycle}) is not configured`, 400);
      }

      // Don't add the bundle twice — check the live subscription items
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      const alreadyOnSub = subscription.items.data.some(
        item => item.price.id === ids.monthly || item.price.id === ids.annual
      );
      if (!alreadyOnSub) {
        await stripe.subscriptionItems.create({
          subscription: org.stripeSubscriptionId,
          price: bundlePriceId,
          quantity: 1,
        });
      }

      // Record the bundle on the organization
      const currentAddOns = org.activeAddOns || [];
      if (!currentAddOns.includes(bundleId)) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { activeAddOns: [...currentAddOns, bundleId] },
        });
      }

      await prisma.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: org.plan,
          newPlan: org.plan,
          previousStatus: org.subscriptionStatus,
          newStatus: org.subscriptionStatus,
          changeType: 'addon_added',
          metadata: { bundleId, billingCycle, type: 'bundle' },
          changedBy: 'system',
        },
      });

      logger.info(`Bundle ${bundleId} (${billingCycle}) added for org ${organizationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to add bundle', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add bundle', 502);
    }
  }

  /**
   * Remove a feature bundle from a subscription. Matches the bundle's monthly
   * OR annual price on the live subscription, deletes that item, and clears the
   * id from organization.activeAddOns.
   */
  async removeBundle(organizationId: string, bundleId: string): Promise<boolean> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      // Find and remove the bundle's line item from the Stripe subscription
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      const ids = BUNDLE_PRICE_IDS[bundleId];
      const bundleItem = ids
        ? subscription.items.data.find(
            item => item.price.id === ids.monthly || item.price.id === ids.annual
          )
        : undefined;

      if (bundleItem) {
        await stripe.subscriptionItems.del(bundleItem.id);
      }

      // Update organization
      const currentAddOns = org.activeAddOns || [];
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          activeAddOns: currentAddOns.filter(id => id !== bundleId),
        },
      });

      await prisma.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: org.plan,
          newPlan: org.plan,
          previousStatus: org.subscriptionStatus,
          newStatus: org.subscriptionStatus,
          changeType: 'addon_removed',
          metadata: { bundleId, type: 'bundle' },
          changedBy: 'system',
        },
      });

      logger.info(`Bundle ${bundleId} removed for org ${organizationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove bundle', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove bundle', 502);
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<{
    event: Stripe.Event;
    processed: boolean;
  }> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      throw new AppError('Invalid webhook signature', 401);
    }

    // Idempotency: Stripe retries deliveries, so an event id already recorded as
    // processed must be a no-op. Returning early prevents double-applying a tier change
    // or billing mutation on a redelivered event.
    const existing = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing?.processed) {
      logger.info(`Skipping already-processed Stripe webhook: ${event.id}`);
      return { event, processed: true };
    }

    // Log the event (upsert so a redelivery that was recorded-but-not-yet-processed
    // does not collide on the unique eventId).
    await prisma.stripeEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        type: event.type,
        data: event.data as any,
      },
      update: {},
    });

    logger.info(`Processing Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialEnding(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await prisma.stripeEvent.update({
        where: { eventId: event.id },
        data: { processed: true },
      });

      return { event, processed: true };
    } catch (error) {
      logger.error(`Error processing webhook ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;

    const tierName = (session.metadata?.tierName as TierName) || 'Foundation';
    const billingCycle = (session.metadata?.billingCycle as 'monthly' | 'annual') || 'annual';
    const addOns = session.metadata?.addOns ? JSON.parse(session.metadata.addOns) : [];
    const bundles = session.metadata?.bundles ? JSON.parse(session.metadata.bundles) : [];
    // Bundles and add-ons share the organization.activeAddOns array (ids are
    // namespaced and non-colliding); de-dupe in case of replays.
    const activeEntitlements = Array.from(new Set([...addOns, ...bundles]));

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          where: { role: 'admin' },
          take: 1,
        },
      },
    });

    if (!organization) return;

    // Get subscription details
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    let subscriptionEnd: Date | undefined;
    let trialEnd: Date | undefined;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      subscriptionEnd = new Date((subscription as any).current_period_end * 1000);
      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000);
      }
    }

    // Wrap local DB operations in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
          stripeSubscriptionId: subscriptionId,
          plan: tierName as Plan,
          billingCycle: billingCycle as BillingCycle,
          subscriptionStatus: 'active',
          subscriptionStartedAt: new Date(),
          subscriptionEndsAt: subscriptionEnd,
          trialEndsAt: trialEnd,
          activeAddOns: activeEntitlements,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: organization.plan,
          newPlan: tierName as Plan,
          previousStatus: organization.subscriptionStatus,
          newStatus: 'active',
          changeType: organization.subscriptionStatus === 'trialing' ? 'trial_ended' : 'upgrade',
          stripeEventId: session.id,
          metadata: { billingCycle, addOns, bundles },
          changedBy: 'system',
        },
      });
    });

    // Send confirmation email
    const userEmail = session.customer_email || organization.users[0]?.email;
    if (userEmail) {
      try {
        const tier = getTier(tierName);
        const amount = session.amount_total
          ? `$${(session.amount_total / 100).toFixed(2)}`
          : `$${tier.pricing.annualMin}`;

        const emailService = (await import('./emailService')).default;
        await emailService.sendPaymentConfirmation(userEmail, tierName, amount);
        logger.info('Payment confirmation email sent', { organizationId, tier: tierName });
      } catch (error) {
        logger.error('Failed to send payment confirmation email', error);
      }
    }

    logger.info(`Checkout completed for org ${organizationId}, tier: ${tierName}`);
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const tierName = subscription.metadata?.tierName as TierName || 'Foundation';

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status as SubscriptionStatus,
        subscriptionStartedAt: new Date(subscription.start_date * 1000),
        subscriptionEndsAt: new Date((subscription as any).current_period_end * 1000),
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });

    logger.info(`Subscription created for org ${organizationId}`);
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      logger.warn(`Organization not found for customer: ${customerId}`);
      return;
    }

    // Determine tier from metadata or price
    let tierName: TierName = subscription.metadata?.tierName as TierName || organization.plan as TierName;

    // Check price ID to determine tier
    const priceId = subscription.items.data[0]?.price.id;
    for (const [tier, prices] of Object.entries(PRICE_IDS)) {
      if (prices.monthly === priceId || prices.annual === priceId) {
        tierName = tier as TierName;
        break;
      }
    }

    const previousStatus = organization.subscriptionStatus;

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: tierName as Plan,
        subscriptionStatus: subscription.status as SubscriptionStatus,
        subscriptionEndsAt: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Record if status changed
    if (previousStatus !== subscription.status) {
      await prisma.subscriptionHistory.create({
        data: {
          organizationId: organization.id,
          previousPlan: organization.plan,
          newPlan: tierName as Plan,
          previousStatus: previousStatus,
          newStatus: subscription.status as SubscriptionStatus,
          changeType: subscription.cancel_at_period_end ? 'cancellation' : 'renewal',
          changedBy: 'system',
        },
      });
    }

    logger.info(`Subscription updated for org ${organization.id}, tier: ${tierName}`);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: 'Foundation' as Plan,
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        activeAddOns: [],
      },
    });

    // Record subscription history
    await prisma.subscriptionHistory.create({
      data: {
        organizationId: organization.id,
        previousPlan: organization.plan,
        newPlan: 'Foundation' as Plan,
        previousStatus: organization.subscriptionStatus,
        newStatus: 'canceled',
        changeType: 'cancellation',
        changedBy: 'system',
      },
    });

    logger.info(`Subscription deleted for org ${organization.id}`);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

    if (!customerId) return;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    // Update subscription status if it was past_due
    if (organization.subscriptionStatus === 'past_due') {
      await prisma.organization.update({
        where: { id: organization.id },
        data: { subscriptionStatus: 'active' },
      });

      await prisma.subscriptionHistory.create({
        data: {
          organizationId: organization.id,
          previousPlan: organization.plan,
          newPlan: organization.plan,
          previousStatus: 'past_due',
          newStatus: 'active',
          changeType: 'payment_recovered',
          changedBy: 'system',
        },
      });
    }

    logger.info(`Payment succeeded for org ${organization.id}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

    if (!customerId) return;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    await prisma.organization.update({
      where: { id: organization.id },
      data: { subscriptionStatus: 'past_due' },
    });

    await prisma.subscriptionHistory.create({
      data: {
        organizationId: organization.id,
        previousPlan: organization.plan,
        newPlan: organization.plan,
        previousStatus: organization.subscriptionStatus,
        newStatus: 'past_due',
        changeType: 'payment_failed',
        changedBy: 'system',
      },
    });

    logger.warn(`Payment failed for org ${organization.id}`);

    // Send payment failed notification email to organization admins
    try {
      const orgAdmins = await prisma.user.findMany({
        where: {
          organizationId: organization.id,
          role: 'admin',
        },
        select: {
          id: true,
          email: true,
        },
      });

      for (const admin of orgAdmins) {
        await notificationService.sendNotification(admin.id, organization.id, {
          type: 'error',
          category: 'billing',
          title: 'Payment Failed',
          message: `Your payment for ${organization.name} has failed. Please update your payment method to avoid service interruption.`,
          link: `/settings/billing`,
        });
      }

      logger.info(`[Stripe] Payment failed notifications sent to ${orgAdmins.length} admins for org ${organization.id}`);
    } catch (error) {
      logger.error('[Stripe] Error sending payment failed notifications', error);
      // Don't throw - billing issue shouldn't break the webhook handler
    }
  }

  /**
   * Handle trial ending notification
   */
  private async handleTrialEnding(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    logger.info(`Trial ending soon for org ${organization.id}`);

    // Send trial ending notification email to organization admins
    try {
      const orgAdmins = await prisma.user.findMany({
        where: {
          organizationId: organization.id,
          role: 'admin',
        },
        select: {
          id: true,
          email: true,
        },
      });

      // Calculate days remaining in trial
      const trialEndsAt = organization.trialEndsAt;
      const daysRemaining = trialEndsAt
        ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      for (const admin of orgAdmins) {
        await notificationService.sendNotification(admin.id, organization.id, {
          type: 'warning',
          category: 'billing',
          title: 'Trial Ending Soon',
          message: `Your trial for ${organization.name} ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Subscribe now to continue using the service.`,
          link: `/settings/billing`,
        });
      }

      logger.info(`[Stripe] Trial ending notifications sent to ${orgAdmins.length} admins for org ${organization.id}`);
    } catch (error) {
      logger.error('[Stripe] Error sending trial ending notifications', error);
      // Don't throw - notification failure shouldn't break the webhook handler
    }
  }

  /**
   * Handle subscription item created (for feature subscriptions)
   */
  private async handleSubscriptionItemCreated(subscriptionItem: Stripe.SubscriptionItem): Promise<void> {
    try {
      // Find the feature subscription by stripeSubscriptionItemId
      const featureSubscription = await prisma.featureSubscription.findUnique({
        where: { stripeSubscriptionItemId: subscriptionItem.id },
        include: { organization: true },
      });

      if (!featureSubscription) {
        // This might be a regular subscription item, not a feature subscription
        // Check if it's a feature subscription by looking at metadata or price
        const subscription = await stripe.subscriptions.retrieve(subscriptionItem.subscription as string);
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const organization = await prisma.organization.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (!organization) {
          logger.warn(`[Stripe] Organization not found for subscription item: ${subscriptionItem.id}`);
          return;
        }

        // Check if this is a feature subscription by checking price metadata
        const price = subscriptionItem.price;
        if (price.metadata?.featureId) {
          // This is a feature subscription created directly in Stripe
          // Create the feature subscription record
          await prisma.featureSubscription.create({
            data: {
              organizationId: organization.id,
              featureId: price.metadata.featureId,
              status: 'active',
              billingCycle: price.recurring?.interval === 'year' ? 'annual' : 'monthly',
              price: (price.unit_amount || 0) / 100,
              stripeSubscriptionItemId: subscriptionItem.id,
              stripePriceId: price.id,
              startsAt: new Date(),
            },
          });

          logger.info(`[Stripe] Feature subscription created via webhook: ${price.metadata.featureId} for org ${organization.id}`);
        }
        return;
      }

      // Update status if needed
      if (featureSubscription.status !== 'active') {
        await prisma.featureSubscription.update({
          where: { id: featureSubscription.id },
          data: { status: 'active' },
        });

        logger.info(`[Stripe] Feature subscription activated: ${featureSubscription.featureId} for org ${featureSubscription.organizationId}`);
      }
    } catch (error) {
      logger.error('[Stripe] Error handling subscription item created', error);
      // Don't throw - webhook processing should continue
    }
  }

  /**
   * Handle subscription item updated (for feature subscriptions)
   */
  private async handleSubscriptionItemUpdated(subscriptionItem: Stripe.SubscriptionItem): Promise<void> {
    try {
      const featureSubscription = await prisma.featureSubscription.findUnique({
        where: { stripeSubscriptionItemId: subscriptionItem.id },
      });

      if (!featureSubscription) {
        // Not a feature subscription, ignore
        return;
      }

      // Update price if it changed
      const newPrice = (subscriptionItem.price.unit_amount || 0) / 100;
      const newBillingCycle = subscriptionItem.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

      await prisma.featureSubscription.update({
        where: { id: featureSubscription.id },
        data: {
          price: newPrice,
          billingCycle: newBillingCycle,
          stripePriceId: subscriptionItem.price.id,
        },
      });

      logger.info(`[Stripe] Feature subscription updated: ${featureSubscription.featureId} for org ${featureSubscription.organizationId}`);
    } catch (error) {
      logger.error('[Stripe] Error handling subscription item updated', error);
      // Don't throw - webhook processing should continue
    }
  }

  /**
   * Handle subscription item deleted (for feature subscriptions)
   */
  private async handleSubscriptionItemDeleted(subscriptionItem: Stripe.SubscriptionItem): Promise<void> {
    try {
      const featureSubscription = await prisma.featureSubscription.findUnique({
        where: { stripeSubscriptionItemId: subscriptionItem.id },
      });

      if (!featureSubscription) {
        // Not a feature subscription, ignore
        return;
      }

      // Check if subscription was canceled at period end or immediately
      const subscription = await stripe.subscriptions.retrieve(subscriptionItem.subscription as string);
      const wasCanceledAtPeriodEnd = subscription.cancel_at_period_end;

      if (wasCanceledAtPeriodEnd) {
        // Mark as canceling at period end
        await prisma.featureSubscription.update({
          where: { id: featureSubscription.id },
          data: {
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
          },
        });
      } else {
        // Immediate cancellation - mark as canceled
        await prisma.featureSubscription.update({
          where: { id: featureSubscription.id },
          data: {
            status: 'canceled',
            endsAt: new Date(),
            cancelledAt: new Date(),
            cancelAtPeriodEnd: false,
          },
        });

        // Record subscription history — fetch the org's actual plan
        const org = await prisma.organization.findUnique({
          where: { id: featureSubscription.organizationId },
          select: { plan: true },
        });
        const actualPlan = (org?.plan || 'Foundation') as Plan;

        await prisma.subscriptionHistory.create({
          data: {
            organizationId: featureSubscription.organizationId,
            previousPlan: actualPlan,
            newPlan: actualPlan,
            previousStatus: featureSubscription.status as SubscriptionStatus,
            newStatus: 'canceled',
            changeType: 'addon_removed',
            reason: `Feature subscription canceled: ${featureSubscription.featureId}`,
            changedBy: 'system',
            metadata: {
              featureId: featureSubscription.featureId,
            },
          },
        });
      }

      logger.info(`[Stripe] Feature subscription ${wasCanceledAtPeriodEnd ? 'scheduled for cancellation' : 'canceled'}: ${featureSubscription.featureId} for org ${featureSubscription.organizationId}`);
    } catch (error) {
      logger.error('[Stripe] Error handling subscription item deleted', error);
      // Don't throw - webhook processing should continue
    }
  }

  /**
   * Process a refund for a payment
   */
  async processRefund(data: {
    organizationId: string;
    chargeId?: string;
    paymentIntentId?: string;
    amount?: number; // Optional: partial refund amount in cents
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }): Promise<Stripe.Refund | null> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: data.organizationId },
      });

      if (!org?.stripeCustomerId) {
        throw new AppError('No Stripe customer found for organization', 404);
      }

      const refundParams: Stripe.RefundCreateParams = {
        reason: data.reason || 'requested_by_customer',
      };

      // Add charge or payment intent
      if (data.chargeId) {
        refundParams.charge = data.chargeId;
      } else if (data.paymentIntentId) {
        refundParams.payment_intent = data.paymentIntentId;
      } else {
        throw new AppError('Either chargeId or paymentIntentId is required', 400);
      }

      // Add partial refund amount if specified
      if (data.amount && data.amount > 0) {
        refundParams.amount = data.amount;
      }

      const refund = await stripe.refunds.create(refundParams);

      // Record subscription history for the refund
      await prisma.subscriptionHistory.create({
        data: {
          organizationId: data.organizationId,
          previousPlan: org.plan,
          newPlan: org.plan,
          previousStatus: org.subscriptionStatus,
          newStatus: org.subscriptionStatus,
          changeType: 'refund',
          metadata: {
            refundId: refund.id,
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
            reason: data.reason,
          },
          changedBy: 'system',
        },
      });

      logger.info(`Refund processed for org ${data.organizationId}: ${refund.id}, amount: ${refund.amount}`);
      return refund;
    } catch (error) {
      logger.error('Failed to process refund', error);
      throw error;
    }
  }

  /**
   * Create a quote for custom pricing (Visionary tier)
   */
  async createQuote(
    organizationId: string,
    options: {
      tier?: string;
      userCount: number;
      features: string[];
      addOns: string[];
      billingCycle: 'monthly' | 'annual';
    }
  ): Promise<{ quoteId: string; amount: number; url: string } | null> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org?.stripeCustomerId) {
        throw new AppError('Customer not found', 404);
      }

      // Calculate custom price in integer cents to avoid floating-point issues
      const basePriceCents = TIERS.Visionary.pricing.annualMin * 100;
      const userMultiplier = Math.ceil(options.userCount / 1000);
      // Use integer arithmetic: multiply by 10 per feature then divide by 10
      const featureMultiplierX10 = 10 + options.features.length;
      const addOnTotalCents = options.addOns.reduce((sum, addOn) => {
        // All values in cents
        const addOnInfoCents: Record<string, number> = {
          'custom-frameworks': 299700,
          'on-prem-deployment': 999700,
          'custom-ai-models': 499700,
          'vciso-service': 999700,
          'audit-bundling': 0, // Variable; contact sales
        };
        return sum + (addOnInfoCents[addOn] ?? 0);
      }, 0);

      const totalAnnualCents = Math.round(
        (basePriceCents * userMultiplier * featureMultiplierX10) / 10 + addOnTotalCents
      );

      // Create a product for this custom quote first
      const tierLabel = options.tier || 'Visionary';
      const product = await stripe.products.create({
        name: `ComplyEasyAI ${tierLabel} Plan - Custom`,
        description: `Custom enterprise plan for ${options.userCount} users`,
        metadata: {
          organizationId,
          tier: tierLabel,
          userCount: options.userCount.toString(),
        },
      });

      // Create a price for this product
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: totalAnnualCents,
        recurring: {
          interval: options.billingCycle === 'annual' ? 'year' : 'month',
        },
      });

      // Create Stripe quote with the price
      const quote = await stripe.quotes.create({
        customer: org.stripeCustomerId,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        metadata: {
          organizationId,
          userCount: options.userCount.toString(),
          features: JSON.stringify(options.features),
          addOns: JSON.stringify(options.addOns),
        },
      });

      // Finalize quote to get PDF
      const finalizedQuote = await stripe.quotes.finalizeQuote(quote.id);

      return {
        quoteId: finalizedQuote.id,
        amount: totalAnnualCents / 100,
        url: (finalizedQuote as any).pdf || `https://dashboard.stripe.com/quotes/${finalizedQuote.id}`,
      };
    } catch (error) {
      logger.error('Failed to create quote', error);
      return null;
    }
  }
}

export default new StripeService();
