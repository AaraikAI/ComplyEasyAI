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
import { TierName, TIERS, getTier, getTierIndex, BillingCycle } from '../config/tiers';
import type { Plan, SubscriptionStatus, SubscriptionChangeType } from '@prisma/client';
import notificationService from './notificationService';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

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
  'audit-bundling': process.env.STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID || '', // Variable; often quote-based
};

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
      throw new Error('Failed to create customer');
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
        trialDays,
        couponCode,
      } = options;

      // Get price ID for the tier and billing cycle
      const priceId = PRICE_IDS[tierName][billingCycle];

      // Validate price ID
      if (!priceId || !priceId.startsWith('price_')) {
        // For development/demo, create a session placeholder
        if (!config.stripe.secretKey) {
          throw new Error('Stripe is not configured. Please contact support to upgrade your plan.');
        }
        throw new Error(`Price ID for ${tierName} ${billingCycle} plan is not configured.`);
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
      throw new Error('Failed to create checkout session');
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
      throw new Error('Failed to create billing portal session');
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
          const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
            customer: org.stripeCustomerId,
          });
          details.nextInvoiceAmount = upcomingInvoice.amount_due / 100;
        } catch {
          // No upcoming invoice
        }
      }

      return details;
    } catch (error) {
      logger.error('Failed to get subscription details', error);
      throw new Error('Failed to fetch subscription details');
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
      const preview = await stripe.invoices.retrieveUpcoming({
        customer: org.stripeCustomerId,
        subscription: org.stripeSubscriptionId,
        subscription_items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        subscription_proration_behavior: 'create_prorations',
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
        nextBillingDate: new Date(subscription.current_period_end * 1000),
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
        throw new Error('No active subscription found');
      }

      const currentTier = org.plan as TierName;
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      const newPriceId = PRICE_IDS[targetTier][billingCycle];

      if (!newPriceId) {
        throw new Error(`Price not configured for ${targetTier} ${billingCycle}`);
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

      // Update organization
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan: targetTier as Plan,
          billingCycle: billingCycle as BillingCycle,
        },
      });

      // Record subscription history
      await prisma.subscriptionHistory.create({
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

      logger.info(`Tier changed for org ${organizationId}: ${currentTier} -> ${targetTier}`);
      return true;
    } catch (error) {
      logger.error('Failed to change tier', error);
      throw new Error('Failed to change subscription tier');
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
        throw new Error('No active subscription found');
      }

      if (atPeriodEnd) {
        // Cancel at end of billing period
        await stripe.subscriptions.update(org.stripeSubscriptionId, {
          cancel_at_period_end: true,
          metadata: { cancelReason: reason || 'User requested' },
        });

        await prisma.organization.update({
          where: { id: organizationId },
          data: { cancelAtPeriodEnd: true },
        });
      } else {
        // Immediate cancellation
        await stripe.subscriptions.cancel(org.stripeSubscriptionId);

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: 'Foundation' as Plan,
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false,
          },
        });
      }

      // Record subscription history
      await prisma.subscriptionHistory.create({
        data: {
          organizationId,
          previousPlan: org.plan,
          newPlan: atPeriodEnd ? org.plan : ('Foundation' as Plan),
          previousStatus: org.subscriptionStatus,
          newStatus: atPeriodEnd ? org.subscriptionStatus : 'canceled',
          changeType: 'cancellation',
          reason,
          changedBy: 'system',
        },
      });

      logger.info(`Subscription canceled for org ${organizationId}, atPeriodEnd: ${atPeriodEnd}`);
      return true;
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      throw new Error('Failed to cancel subscription');
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
        throw new Error('No subscription to reactivate');
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
      throw new Error('Failed to reactivate subscription');
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
        throw new Error('No active subscription found');
      }

      const addOnPriceId = ADDON_PRICE_IDS[addOnId];
      if (!addOnPriceId) {
        throw new Error('Add-on not found');
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
      throw new Error('Failed to add add-on');
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
        throw new Error('No active subscription found');
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
      throw new Error('Failed to remove add-on');
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
      throw new Error('Invalid webhook signature');
    }

    // Log the event
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        data: event.data as any,
      },
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
      subscriptionEnd = new Date(subscription.current_period_end * 1000);
      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000);
      }
    }

    // Update organization
    await prisma.organization.update({
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
        activeAddOns: addOns,
      },
    });

    // Record subscription history
    await prisma.subscriptionHistory.create({
      data: {
        organizationId,
        previousPlan: organization.plan,
        newPlan: tierName as Plan,
        previousStatus: organization.subscriptionStatus,
        newStatus: 'active',
        changeType: organization.subscriptionStatus === 'trialing' ? 'trial_ended' : 'upgrade',
        stripeEventId: session.id,
        metadata: { billingCycle, addOns },
        changedBy: 'system',
      },
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
        logger.info(`Payment confirmation email sent to ${userEmail}`);
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
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
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
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
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

        // Record subscription history
        await prisma.subscriptionHistory.create({
          data: {
            organizationId: featureSubscription.organizationId,
            previousPlan: 'Foundation' as Plan, // Placeholder
            newPlan: 'Foundation' as Plan,
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
   * Create a quote for custom pricing (Visionary tier)
   */
  async createQuote(
    organizationId: string,
    options: {
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
        throw new Error('Customer not found');
      }

      // Calculate custom price based on requirements
      const basePrice = TIERS.Visionary.pricing.annualMin;
      const userMultiplier = Math.ceil(options.userCount / 1000);
      const featureMultiplier = 1 + (options.features.length * 0.1);
      const addOnTotal = options.addOns.reduce((sum, addOn) => {
        const addOnInfo: Record<string, number> = {
          'custom-frameworks': 2997,
          'on-prem-deployment': 9997,
          'custom-ai-models': 4997,
          'vciso-service': 9997,
          'audit-bundling': 0, // Variable; contact sales
        };
        return sum + (addOnInfo[addOn] ?? 0);
      }, 0);

      const totalAnnual = Math.round(basePrice * userMultiplier * featureMultiplier + addOnTotal);

      // Create a product for this custom quote first
      const product = await stripe.products.create({
        name: `ComplyEasyAI Visionary Plan - Custom`,
        description: `Custom enterprise plan for ${options.userCount} users`,
        metadata: {
          organizationId,
          userCount: options.userCount.toString(),
        },
      });

      // Create a price for this product
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: totalAnnual * 100,
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
        amount: totalAnnual,
        url: (finalizedQuote as any).pdf || `https://dashboard.stripe.com/quotes/${finalizedQuote.id}`,
      };
    } catch (error) {
      logger.error('Failed to create quote', error);
      return null;
    }
  }
}

export default new StripeService();
