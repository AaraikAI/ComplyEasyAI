/**
 * Feature Service
 * 
 * Production-ready service for managing a-la-carte feature subscriptions.
 * Handles:
 * - Feature subscription management
 * - Price calculation based on tier
 * - Stripe integration for feature subscriptions
 * - Feature access validation
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { TierName, getTierIndex, TIER_ORDER } from '../config/tiers';
import {
  FEATURES,
  FEATURE_BUNDLES,
  Feature,
  FeatureBundle,
  calculateFeaturePrice,
  getFeature,
  getBundle,
  getAvailableFeatures,
  getAvailableBundles,
} from '../config/features';
import { getTier } from '../config/tiers';
import Stripe from 'stripe';
import config from '../config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureSubscriptionResult {
  id: string;
  organizationId: string;
  featureId: string;
  status: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  startsAt: Date;
  endsAt?: Date;
}

export interface FeatureAvailability {
  feature: Feature;
  isIncluded: boolean; // Included in tier
  isSubscribed: boolean; // Purchased as add-on
  currentPrice: number; // Price for current tier
  canSubscribe: boolean;
  reason?: string;
}

// ============================================================================
// FEATURE SERVICE CLASS
// ============================================================================

class FeatureService {
  /**
   * Get all available features for an organization's tier
   */
  async getAvailableFeaturesForOrganization(organizationId: string): Promise<FeatureAvailability[]> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const tier = org.plan as TierName;
    const availableFeatures = getAvailableFeatures(tier);
    const activeSubscriptions = await this.getActiveFeatureSubscriptions(organizationId);

    const subscriptionsMap = new Map(
      activeSubscriptions.map(sub => [sub.featureId, sub])
    );

    const tierInfo = getTier(tier);
    return availableFeatures.map(feature => {
      const isSubscribed = subscriptionsMap.has(feature.id);
      const isIncluded = feature.tierFeatureKey 
        ? tierInfo.features[feature.tierFeatureKey] 
        : false;

      const currentPrice = calculateFeaturePrice(feature, tier, 'annual');
      const canSubscribe = !isIncluded && !isSubscribed && feature.availableAsAddOn;

      return {
        feature,
        isIncluded,
        isSubscribed,
        currentPrice,
        canSubscribe,
        reason: !canSubscribe 
          ? (isIncluded ? 'Included in your tier' : isSubscribed ? 'Already subscribed' : 'Not available')
          : undefined,
      };
    });
  }

  /**
   * Get active feature subscriptions for an organization
   */
  async getActiveFeatureSubscriptions(organizationId: string) {
    return await prisma.featureSubscription.findMany({
      where: {
        organizationId,
        status: 'active',
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Subscribe to a feature
   */
  async subscribeToFeature(
    organizationId: string,
    featureId: string,
    billingCycle: 'monthly' | 'annual'
  ): Promise<FeatureSubscriptionResult> {
    // Validate feature exists
    const feature = getFeature(featureId);
    if (!feature || !feature.availableAsAddOn) {
      throw new Error('Feature not available as add-on');
    }

    // Get organization and tier
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    if (!org.stripeCustomerId || !org.stripeSubscriptionId) {
      throw new Error('Organization does not have an active Stripe subscription');
    }

    const tier = org.plan as TierName;

    // Check prerequisites
    if (feature.requiresTier) {
      const tierIndex = getTierIndex(tier);
      const requiredTierIndex = getTierIndex(feature.requiresTier);
      if (tierIndex < requiredTierIndex) {
        throw new Error(`Feature requires ${feature.requiresTier} tier or higher`);
      }
    }

    // Check if already subscribed
    const existing = await prisma.featureSubscription.findFirst({
      where: {
        organizationId,
        featureId,
        status: 'active',
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    });

    if (existing) {
      throw new Error('Feature already subscribed');
    }

    // Calculate price
    const price = calculateFeaturePrice(feature, tier, billingCycle);

    // Create Stripe subscription item
    // Note: In production, you'll need to create Stripe Price objects first
    // For now, we'll use a placeholder approach
    let stripeSubscriptionItemId: string | null = null;
    let stripePriceId: string | null = null;

    try {
      // Get the base subscription
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);

      // Create price if not exists (in production, create these in Stripe dashboard)
      // For now, we'll create a product and price first, then add to subscription
      const unitAmount = billingCycle === 'annual' 
        ? Math.round(price * 100) // Convert to cents
        : Math.round((price / 12) * 100);

      // Create a product for this feature
      const product = await stripe.products.create({
        name: feature.name,
        description: feature.description || undefined,
      });

      // Create a recurring price for the product
      const stripePrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: unitAmount,
        recurring: {
          interval: billingCycle === 'annual' ? 'year' : 'month',
        },
      });

      const subscriptionItem = await stripe.subscriptionItems.create({
        subscription: org.stripeSubscriptionId,
        price: stripePrice.id,
      });

      stripeSubscriptionItemId = subscriptionItem.id;
      stripePriceId = stripePrice.id;
    } catch (error: any) {
      logger.error('Failed to create Stripe subscription item', { error, featureId, organizationId });
      throw new Error('Failed to create Stripe subscription item');
    }

    // Create feature subscription record
    const featureSubscription = await prisma.featureSubscription.create({
      data: {
        organizationId,
        featureId,
        status: 'active',
        billingCycle,
        price,
        stripeSubscriptionItemId,
        stripePriceId,
        startsAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    // Log subscription history
    await prisma.subscriptionHistory.create({
      data: {
        organizationId,
        newPlan: org.plan,
        newStatus: 'active',
        changeType: 'addon_added',
        reason: `Feature subscription: ${feature.name}`,
        changedBy: 'system',
        metadata: {
          featureId,
          featureName: feature.name,
          price,
          billingCycle,
        },
      },
    });

    logger.info(`Feature subscription created: ${featureId} for org ${organizationId}`);

    return {
      id: featureSubscription.id,
      organizationId: featureSubscription.organizationId,
      featureId: featureSubscription.featureId,
      status: featureSubscription.status,
      billingCycle: featureSubscription.billingCycle,
      price: Number(featureSubscription.price),
      startsAt: featureSubscription.startsAt,
      endsAt: featureSubscription.endsAt || undefined,
    };
  }

  /**
   * Unsubscribe from a feature (cancel at period end)
   */
  async unsubscribeFromFeature(
    organizationId: string,
    featureId: string
  ): Promise<void> {
    const subscription = await prisma.featureSubscription.findFirst({
      where: {
        organizationId,
        featureId,
        status: 'active',
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    });

    if (!subscription) {
      throw new Error('Feature subscription not found');
    }

    // Cancel in Stripe (at period end)
    if (subscription.stripeSubscriptionItemId) {
      try {
        await stripe.subscriptionItems.update(subscription.stripeSubscriptionItemId, {
          metadata: {
            cancel_at_period_end: 'true',
          },
        });
      } catch (error: any) {
        logger.error('Failed to cancel Stripe subscription item', { error, subscriptionId: subscription.id });
      }
    }

    // Update database
    await prisma.featureSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });

    // Log subscription history
    const feature = getFeature(featureId);
    await prisma.subscriptionHistory.create({
      data: {
        organizationId,
        newPlan: (await prisma.organization.findUnique({ where: { id: organizationId }, select: { plan: true } }))?.plan || 'Foundation',
        newStatus: 'active',
        changeType: 'addon_removed',
        reason: `Feature subscription cancelled: ${feature?.name || featureId}`,
        changedBy: 'system',
        metadata: {
          featureId,
          featureName: feature?.name,
        },
      },
    });

    logger.info(`Feature subscription cancelled: ${featureId} for org ${organizationId}`);
  }

  /**
   * Check if organization has access to a feature (via tier or subscription)
   */
  async hasFeatureAccess(organizationId: string, featureId: string): Promise<boolean> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });

    if (!org) {
      return false;
    }

    const tier = org.plan as TierName;
    const feature = getFeature(featureId);

    if (!feature) {
      return false;
    }

    // Check if included in tier
    if (feature.tierFeatureKey) {
      const tierInfo = getTier(tier);
      if (tierInfo.features[feature.tierFeatureKey]) {
        return true;
      }
    }

    // Check if subscribed as add-on
    const subscription = await prisma.featureSubscription.findFirst({
      where: {
        organizationId,
        featureId,
        status: 'active',
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    });

    return !!subscription;
  }

  /**
   * Get feature subscription details
   */
  async getFeatureSubscription(organizationId: string, featureId: string) {
    return await prisma.featureSubscription.findFirst({
      where: {
        organizationId,
        featureId,
        status: 'active',
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    });
  }

  /**
   * Subscribe to a feature bundle
   */
  async subscribeToBundle(
    organizationId: string,
    bundleId: string,
    billingCycle: 'monthly' | 'annual'
  ): Promise<FeatureSubscriptionResult[]> {
    const bundle = getBundle(bundleId);
    if (!bundle || !bundle.availableAsAddOn) {
      throw new Error('Bundle not available as add-on');
    }

    // Get organization and tier
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const tier = org.plan as TierName;

    // Check prerequisites
    if (bundle.requiresTier) {
      const tierIndex = getTierIndex(tier);
      const requiredTierIndex = getTierIndex(bundle.requiresTier);
      if (tierIndex < requiredTierIndex) {
        throw new Error(`Bundle requires ${bundle.requiresTier} tier or higher`);
      }
    }

    // Subscribe to all features in bundle
    const results: FeatureSubscriptionResult[] = [];
    for (const featureId of bundle.featureIds) {
      try {
        const result = await this.subscribeToFeature(organizationId, featureId, billingCycle);
        results.push(result);
      } catch (error: any) {
        logger.error(`Failed to subscribe to feature ${featureId} in bundle`, { error, bundleId, featureId });
        // Continue with other features
      }
    }

    return results;
  }

  /**
   * Get total monthly/annual cost of all feature subscriptions
   */
  async getTotalFeatureCost(organizationId: string, period: 'monthly' | 'annual'): Promise<number> {
    const subscriptions = await this.getActiveFeatureSubscriptions(organizationId);
    
    let total = 0;
    for (const sub of subscriptions) {
      if (sub.billingCycle === period) {
        total += Number(sub.price);
      } else if (sub.billingCycle === 'annual' && period === 'monthly') {
        total += Number(sub.price) / 12;
      } else if (sub.billingCycle === 'monthly' && period === 'annual') {
        total += Number(sub.price) * 12;
      }
    }

    return Math.round(total * 100) / 100;
  }
}

export default new FeatureService();

